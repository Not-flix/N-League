"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getStore } from "@/lib/store";
import {
  calculateResults,
  validateSeats,
  type RawSeat,
} from "@/lib/scoring";

export type SubmitMatchInput = {
  playedAt: string;
  note?: string;
  seats: RawSeat[];
  matchId?: string;
};

export async function submitMatch(input: SubmitMatchInput) {
  if (!(await isAuthenticated())) {
    throw new Error("Unauthorized");
  }
  const store = getStore();
  const config = await store.getConfig();
  const validation = validateSeats(input.seats, config);
  if (validation) {
    throw new Error(`入力エラー: ${JSON.stringify(validation)}`);
  }
  const results = calculateResults(input.seats, config);
  if (input.matchId) {
    await store.updateMatch(input.matchId, {
      playedAt: input.playedAt,
      note: input.note,
      results,
    });
  } else {
    await store.addMatch({
      playedAt: input.playedAt,
      note: input.note,
      results,
    });
  }
  revalidatePath("/");
  revalidatePath("/standings");
  revalidatePath("/matches");
  revalidatePath("/players", "layout");
  redirect("/matches");
}
