import { notFound } from "next/navigation";
import Link from "next/link";
import { loadLeagueSnapshot, formatPoints, formatDate } from "@/lib/data";
import { SectionTitle } from "@/components/section-title";
import { Avatar } from "@/components/avatar";
import { RankTrendChart } from "@/components/rank-trend-chart";

export const dynamic = "force-dynamic";

export default async function PlayerDetailPage(
  props: PageProps<"/players/[id]">,
) {
  const { id } = await props.params;
  const { players, matches, standings } = await loadLeagueSnapshot();
  const player = players.find((p) => p.id === id);
  if (!player) notFound();

  const playerMatches = matches.filter((m) =>
    m.results.some((r) => r.playerId === id),
  );
  const standing = standings.find((s) => s.player.id === id);

  type HistoryEntry = {
    match: (typeof playerMatches)[number];
    result: (typeof playerMatches)[number]["results"][number];
    cumulative: number;
  };
  const history = [...playerMatches].reverse().reduce<HistoryEntry[]>(
    (acc, m) => {
      const result = m.results.find((r) => r.playerId === id);
      if (!result) return acc;
      const prev = acc.length === 0 ? 0 : acc[acc.length - 1].cumulative;
      const cumulative = Math.round((prev + result.finalPoints) * 10) / 10;
      acc.push({ match: m, result, cumulative });
      return acc;
    },
    [],
  );
  const reverseHistory = [...history].reverse();

  return (
    <div className="page-shell space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar player={player} size="lg" />
          <div>
            <Link
              href="/standings"
              className="text-xs text-foreground-dim hover:text-accent"
            >
              ← 順位表に戻る
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black headline mt-2">
              {player.name}
            </h1>
            {!player.active && (
              <span className="text-xs text-foreground-dim">（休止中）</span>
            )}
          </div>
        </div>
        {standing && (
          <div className="text-right">
            <div className="text-xs text-foreground-dim">累計ポイント</div>
            <div
              className={`text-3xl font-bold numeric headline ${standing.totalPoints > 0 ? "text-positive" : standing.totalPoints < 0 ? "text-negative" : ""}`}
            >
              {formatPoints(standing.totalPoints)}
            </div>
          </div>
        )}
      </div>

      {standing && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="半荘数" value={standing.matches.toString()} />
          <Stat
            label="平均順位"
            value={
              standing.matches > 0 ? standing.averageRank.toFixed(2) : "—"
            }
          />
          <Stat
            label="トップ率"
            value={
              standing.matches > 0 ? `${standing.topRate.toFixed(1)}%` : "—"
            }
          />
          <Stat
            label="ラス率"
            value={
              standing.matches > 0 ? `${standing.lastRate.toFixed(1)}%` : "—"
            }
          />
        </div>
      )}

      <section>
        <SectionTitle title="RANK TIMELINE" subtitle="着順の遷移" />
        <RankTrendChart
          points={history.map((h) => ({
            matchId: h.match.id,
            playedAt: h.match.playedAt,
            rank: h.result.rank,
          }))}
        />
      </section>

      <section>
        <SectionTitle title="RANK BREAKDOWN" subtitle="着順分布" />
        {standing && standing.matches > 0 ? (
          <div className="surface-card p-5">
            <div className="grid grid-cols-4 gap-4">
              {standing.rankCounts.map((count, idx) => (
                <div key={idx} className="text-center">
                  <div
                    className={`rank-pill mx-auto rank-${idx + 1} mb-2`}
                    style={{ width: "2.5rem", height: "2.5rem" }}
                  >
                    {idx + 1}
                  </div>
                  <div className="text-2xl font-bold numeric">{count}</div>
                  <div className="text-xs text-foreground-dim">
                    {((count / standing.matches) * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="surface-card p-6 text-center text-foreground-muted">
            データなし
          </div>
        )}
      </section>

      <section>
        <SectionTitle title="HISTORY" subtitle="試合履歴" />
        {reverseHistory.length === 0 ? (
          <div className="surface-card p-8 text-center text-foreground-muted">
            試合履歴がありません。
          </div>
        ) : (
          <div className="surface-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background-elevated text-xs uppercase tracking-wider text-foreground-muted">
                <tr>
                  <th className="px-3 py-3 text-left">日時</th>
                  <th className="px-3 py-3 text-center">順位</th>
                  <th className="px-3 py-3 text-right">素点</th>
                  <th className="px-3 py-3 text-right">pt</th>
                  <th className="px-3 py-3 text-right hidden sm:table-cell">
                    累計
                  </th>
                </tr>
              </thead>
              <tbody>
                {reverseHistory.map(({ match, result, cumulative }) => (
                  <tr
                    key={match.id}
                    className="border-t border-border hover:bg-background-elevated/60"
                  >
                    <td className="px-3 py-3 text-foreground-muted">
                      {formatDate(match.playedAt, {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`rank-pill rank-${result.rank}`}>
                        {result.rank}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right numeric">
                      {result.rawScore.toLocaleString()}
                    </td>
                    <td
                      className={`px-3 py-3 text-right numeric font-bold ${result.finalPoints > 0 ? "text-positive" : result.finalPoints < 0 ? "text-negative" : ""}`}
                    >
                      {formatPoints(result.finalPoints)}
                    </td>
                    <td className="px-3 py-3 text-right numeric text-foreground-muted hidden sm:table-cell">
                      {formatPoints(cumulative)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-4">
      <div className="text-xs text-foreground-dim tracking-wider">{label}</div>
      <div className="text-2xl font-bold mt-1 numeric">{value}</div>
    </div>
  );
}
