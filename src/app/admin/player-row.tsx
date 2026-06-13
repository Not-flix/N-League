"use client";

import { useRef, useState, useTransition } from "react";
import { Avatar } from "@/components/avatar";
import type { Player } from "@/lib/types";
import { deletePlayerAction, updatePlayerAction } from "./actions";

const MAX_SIZE = 256;

async function resizeImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(
    MAX_SIZE / bitmap.width,
    MAX_SIZE / bitmap.height,
    1,
  );
  const w = Math.max(1, Math.round(bitmap.width * ratio));
  const h = Math.max(1, Math.round(bitmap.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function PlayerRow({
  player,
  matchCount,
}: {
  player: Player;
  matchCount: number;
}) {
  const [name, setName] = useState(player.name);
  const [active, setActive] = useState(player.active);
  const [avatarDataUrl, setAvatarDataUrl] = useState(
    player.avatarDataUrl ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const canDelete = matchCount === 0;

  async function onPickFile(file: File) {
    setError(null);
    try {
      if (file.size > 6 * 1024 * 1024) {
        throw new Error("画像が大きすぎます（6MB以下にしてください）");
      }
      const dataUrl = await resizeImage(file);
      setAvatarDataUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function handleSubmit(formData: FormData) {
    formData.set("name", name);
    formData.set("avatarDataUrl", avatarDataUrl);
    if (active) formData.set("active", "on");
    else formData.delete("active");
    setError(null);
    startTransition(async () => {
      try {
        await updatePlayerAction(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  function handleDelete() {
    if (!canDelete) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(`${player.name} を削除しますか？この操作は取り消せません。`)
    ) {
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.set("id", player.id);
    startDeleteTransition(async () => {
      try {
        await deletePlayerAction(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <form action={handleSubmit} className="p-4 space-y-3">
      <input type="hidden" name="id" value={player.id} />
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative">
          <Avatar
            player={{ name, avatarDataUrl: avatarDataUrl || undefined }}
            size="md"
          />
          {avatarDataUrl && (
            <button
              type="button"
              onClick={() => setAvatarDataUrl("")}
              className="absolute -top-1 -right-1 bg-background border border-border-strong rounded-full w-5 h-5 text-xs leading-none flex items-center justify-center text-foreground-muted hover:text-danger"
              title="アイコンをクリア"
            >
              ×
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onPickFile(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          {avatarDataUrl ? "アイコンを変更" : "アイコンを選択"}
        </button>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="flex-1 min-w-[10rem]"
        />
        <label className="flex items-center gap-2 text-sm text-foreground-muted">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-auto"
          />
          参加中
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50"
        >
          {isPending ? "保存中…" : "保存"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={!canDelete || isDeleting}
          title={
            canDelete
              ? "選手を削除"
              : `試合履歴が ${matchCount} 件あるため削除できません`
          }
          className="btn-secondary text-xs py-1.5 px-3 text-danger border-danger/40 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isDeleting ? "削除中…" : "削除"}
        </button>
      </div>
      {!canDelete && (
        <p className="text-xs text-foreground-dim">
          試合履歴が {matchCount}{" "}
          件あるため削除はできません。休止のみ可能です（参加中のチェックを外す）。
        </p>
      )}
      {error && <div className="text-sm text-danger">{error}</div>}
    </form>
  );
}
