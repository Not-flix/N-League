import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { SectionTitle } from "@/components/section-title";
import { MatchForm, type MatchFormInitial } from "@/app/matches/new/match-form";

export const dynamic = "force-dynamic";

export default async function EditMatchPage(
  props: PageProps<"/matches/[id]/edit">,
) {
  const { id } = await props.params;
  const store = getStore();
  const [match, players, config] = await Promise.all([
    store.getMatch(id),
    store.getPlayers(),
    store.getConfig(),
  ]);
  if (!match) notFound();

  const playerOptions = players.filter(
    (p) => p.active || match.results.some((r) => r.playerId === p.id),
  );

  const orderedSeats = [...match.results].sort((a, b) => a.rank - b.rank);
  const initial: MatchFormInitial = {
    matchId: match.id,
    playedAt: toLocalDateTimeInputValue(match.playedAt),
    note: match.note ?? "",
    seats: orderedSeats.map((r) => ({
      playerId: r.playerId,
      rawScore: r.rawScore.toString(),
    })),
  };

  return (
    <div className="page-shell max-w-3xl">
      <SectionTitle
        title="EDIT MATCH"
        subtitle="半荘結果を編集"
        action={
          <Link
            href="/matches"
            className="text-xs text-foreground-dim hover:text-accent"
          >
            ← 試合一覧
          </Link>
        }
      />
      <div className="mb-4 text-xs text-foreground-dim">
        ルール: {config.startingPoints.toLocaleString()}点持ち /{" "}
        {config.returnPoints.toLocaleString()}点返し / 順位点{" "}
        {config.uma.map((v) => (v > 0 ? `+${v}` : v.toString())).join(" / ")}
      </div>
      <MatchForm players={playerOptions} config={config} initial={initial} />
    </div>
  );
}

function toLocalDateTimeInputValue(iso: string): string {
  const d = new Date(iso);
  const tz = d.getTimezoneOffset();
  return new Date(d.getTime() - tz * 60 * 1000).toISOString().slice(0, 16);
}
