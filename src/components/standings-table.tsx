import Link from "next/link";
import type { StandingRow } from "@/lib/types";
import { formatPoints } from "@/lib/data";
import { Avatar } from "./avatar";

export function StandingsTable({
  rows,
  compact = false,
}: {
  rows: StandingRow[];
  compact?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="surface-card p-8 text-center text-foreground-muted">
        まだ集計対象の選手がいません。管理画面から選手を登録してください。
      </div>
    );
  }
  return (
    <div className="surface-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-background-elevated text-foreground-muted text-xs uppercase tracking-wider">
          <tr>
            <th className="px-3 py-3 text-left w-12">順位</th>
            <th className="px-3 py-3 text-left">選手</th>
            <th className="px-3 py-3 text-right numeric">合計pt</th>
            <th className="px-3 py-3 text-right numeric hidden sm:table-cell">半荘</th>
            {!compact && (
              <>
                <th className="px-3 py-3 text-right numeric hidden md:table-cell">平均順位</th>
                <th className="px-3 py-3 text-right numeric hidden md:table-cell">トップ率</th>
                <th className="px-3 py-3 text-right numeric hidden md:table-cell">ラス率</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const place = i + 1;
            const isLeader = place === 1 && row.matches > 0;
            return (
              <tr
                key={row.player.id}
                className={`border-t border-border transition-colors ${
                  isLeader
                    ? "leader-row"
                    : "hover:bg-background-elevated/60"
                }`}
              >
                <td className={`px-3 ${isLeader ? "py-4" : "py-3"} relative`}>
                  {isLeader && <span className="leader-strip" />}
                  <span
                    className={`rank-pill ${place <= 4 ? `rank-${place}` : "rank-4"} ${
                      isLeader ? "rank-pill-leader" : ""
                    }`}
                  >
                    {place}
                  </span>
                </td>
                <td className={`px-3 ${isLeader ? "py-4" : "py-3"}`}>
                  <Link
                    href={`/players/${row.player.id}`}
                    className="flex items-center gap-3 hover:text-accent"
                  >
                    <Avatar
                      player={row.player}
                      size={isLeader ? "md" : "sm"}
                    />
                    <span
                      className={`truncate ${
                        isLeader
                          ? "text-lg sm:text-xl font-extrabold headline tracking-wide"
                          : "font-semibold"
                      }`}
                    >
                      {row.player.name}
                    </span>
                    {isLeader && (
                      <span className="leader-badge">
                        <span aria-hidden="true">👑</span>
                        <span className="tracking-widest">首位</span>
                      </span>
                    )}
                  </Link>
                </td>
                <td
                  className={`px-3 ${isLeader ? "py-4" : "py-3"} text-right numeric font-bold headline ${
                    isLeader ? "text-xl sm:text-2xl" : "text-base"
                  }`}
                >
                  <span
                    className={
                      row.totalPoints > 0
                        ? "text-positive"
                        : row.totalPoints < 0
                          ? "text-negative"
                          : ""
                    }
                  >
                    {formatPoints(row.totalPoints)}
                  </span>
                </td>
                <td
                  className={`px-3 ${isLeader ? "py-4" : "py-3"} text-right numeric text-foreground-muted hidden sm:table-cell`}
                >
                  {row.matches}
                </td>
                {!compact && (
                  <>
                    <td
                      className={`px-3 ${isLeader ? "py-4" : "py-3"} text-right numeric text-foreground-muted hidden md:table-cell`}
                    >
                      {row.matches > 0 ? row.averageRank.toFixed(2) : "—"}
                    </td>
                    <td
                      className={`px-3 ${isLeader ? "py-4" : "py-3"} text-right numeric text-foreground-muted hidden md:table-cell`}
                    >
                      {row.matches > 0 ? `${row.topRate.toFixed(1)}%` : "—"}
                    </td>
                    <td
                      className={`px-3 ${isLeader ? "py-4" : "py-3"} text-right numeric text-foreground-muted hidden md:table-cell`}
                    >
                      {row.matches > 0 ? `${row.lastRate.toFixed(1)}%` : "—"}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
