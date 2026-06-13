"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { getStore } from "@/lib/store";
import type { ScoringConfig } from "@/lib/types";

async function ensureAuth() {
  if (!(await isAuthenticated())) {
    throw new Error("Unauthorized");
  }
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/standings");
  revalidatePath("/matches");
  revalidatePath("/schedule");
  revalidatePath("/admin");
  revalidatePath("/rules");
  revalidatePath("/players/[id]", "page");
  revalidatePath("/matches/[id]/edit", "page");
}

export async function addPlayerAction(formData: FormData) {
  await ensureAuth();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("選手名を入力してください");
  await getStore().addPlayer(name);
  revalidateAll();
}

export async function updatePlayerAction(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const active = formData.get("active") === "on";
  const avatarRaw = String(formData.get("avatarDataUrl") ?? "");
  const avatarDataUrl = avatarRaw.startsWith("data:image/")
    ? avatarRaw
    : undefined;
  if (!id || !name) throw new Error("入力が不正です");
  await getStore().updatePlayer(id, { name, active, avatarDataUrl });
  revalidateAll();
}

export async function saveConfigAction(formData: FormData) {
  await ensureAuth();
  const startingPoints = Number(formData.get("startingPoints"));
  const returnPoints = Number(formData.get("returnPoints"));
  const uma: [number, number, number, number] = [
    Number(formData.get("uma1")),
    Number(formData.get("uma2")),
    Number(formData.get("uma3")),
    Number(formData.get("uma4")),
  ];
  if ([startingPoints, returnPoints, ...uma].some((v) => !Number.isFinite(v))) {
    throw new Error("数値を入力してください");
  }
  const config: ScoringConfig = { startingPoints, returnPoints, uma };
  const store = getStore();
  await store.saveConfig(config);
  await store.recalculateAllFinalPoints(config);
  revalidateAll();
}

export async function addScheduleAction(formData: FormData) {
  await ensureAuth();
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || undefined;
  if (!scheduledAtRaw || !label) throw new Error("日時とラベルを入力してください");
  await getStore().addScheduleEntry({
    scheduledAt: new Date(scheduledAtRaw).toISOString(),
    label,
    notes,
  });
  revalidateAll();
}

export async function deleteScheduleAction(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getStore().deleteScheduleEntry(id);
  revalidateAll();
}

export async function deleteMatchAction(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getStore().deleteMatch(id);
  revalidateAll();
}

export async function deletePlayerAction(formData: FormData) {
  await ensureAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getStore().deletePlayer(id);
  revalidateAll();
}
