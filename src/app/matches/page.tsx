import Link from "next/link";
import { loadLeagueSnapshot } from "@/lib/data";
import { SectionTitle } from "@/components/section-title";
import { MatchCard } from "@/components/match-card";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const { matches, players } = await loadLeagueSnapshot();
  return (
    <div className="page-shell space-y-6">
      <SectionTitle
        title="MATCHES"
        subtitle="試合結果一覧"
        action={
          <Link href="/matches/new" className="btn-primary text-sm py-1.5 px-3">
            ＋ 入力
          </Link>
        }
      />
      {matches.length === 0 ? (
        <div className="surface-card p-8 text-center text-foreground-muted">
          試合がまだありません。
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} players={players} />
          ))}
        </div>
      )}
    </div>
  );
}
