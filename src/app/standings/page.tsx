import { loadLeagueSnapshot } from "@/lib/data";
import { SectionTitle } from "@/components/section-title";
import { StandingsTable } from "@/components/standings-table";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  const { standings, matches } = await loadLeagueSnapshot();
  return (
    <div className="page-shell space-y-6">
      <SectionTitle
        title="STANDINGS"
        subtitle="総合順位表"
        action={
          <span className="text-xs text-foreground-dim">
            累計半荘 {matches.length}
          </span>
        }
      />
      <StandingsTable rows={standings} />
      <div className="text-xs text-foreground-dim">
        ※ 平均順位・トップ率・ラス率は半荘プレイのある選手のみ算出。
      </div>
    </div>
  );
}
