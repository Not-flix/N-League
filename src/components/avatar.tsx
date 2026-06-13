import type { Player } from "@/lib/types";

const PALETTE = [
  "#c8102e",
  "#0f6b3b",
  "#b8892b",
  "#1e3a8a",
  "#6b21a8",
  "#9f1239",
  "#0e7490",
  "#7c2d12",
];

function pickColor(name: string): string {
  if (name.length === 0) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

function initialOf(name: string): string {
  return name.trim().slice(0, 1) || "?";
}

export function Avatar({
  player,
  size = "sm",
}: {
  player: Pick<Player, "name" | "avatarDataUrl">;
  size?: "sm" | "md" | "lg";
}) {
  if (player.avatarDataUrl) {
    return (
      <span className={`avatar avatar-${size}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={player.avatarDataUrl} alt={player.name} />
      </span>
    );
  }
  return (
    <span
      className={`avatar avatar-${size}`}
      style={{ background: pickColor(player.name) }}
    >
      {initialOf(player.name)}
    </span>
  );
}
