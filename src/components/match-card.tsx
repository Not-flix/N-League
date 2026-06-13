import Link from "next/link";
import type { Match, Player } from "@/lib/types";
import { formatDate, formatPoints } from "@/lib/data";
import { Avatar } from "./avatar";

export function MatchCard({
  match,
  players,
}: {
  match: Match;
  players: Player[];
}) {
  const byId = new Map(players.map((p) => [p.id, p]));
  const sorted = [...match.results].sort((a, b) => a.rank - b.rank);
  return (
    <div className="surface-card p-4">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="text-xs text-foreground-muted">
          {formatDate(match.playedAt, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <div className="flex items-center gap-3 min-w-0 flex-1 justify-end">
          {match.note && (
            <div className="text-xs text-foreground-dim truncate min-w-0">
              {match.note}
            </div>
          )}
          <Link
            href={`/matches/${match.id}/edit`}
            className="text-xs text-foreground-dim hover:text-accent whitespace-nowrap shrink-0"
          >
            編集 →
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sorted.map((r) => {
          const player = byId.get(r.playerId);
          return (
            <div
              key={r.playerId}
              className="flex items-center gap-3 px-3 py-2 rounded-md bg-background-elevated border border-border"
            >
              <span className={`rank-pill rank-${r.rank}`}>{r.rank}</span>
              {player && <Avatar player={player} size="sm" />}
              <Link
                href={`/players/${r.playerId}`}
                className="font-semibold hover:text-accent truncate flex-1"
              >
                {player?.name ?? "—"}
              </Link>
              <div className="text-right">
                <div className="numeric text-sm">{r.rawScore.toLocaleString()}</div>
                <div
                  className={`numeric text-xs font-bold ${
                    r.finalPoints > 0
                      ? "text-positive"
                      : r.finalPoints < 0
                        ? "text-negative"
                        : "text-foreground-muted"
                  }`}
                >
                  {formatPoints(r.finalPoints)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
