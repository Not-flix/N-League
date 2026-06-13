import Link from "next/link";
import { getStore } from "@/lib/store";
import { SectionTitle } from "@/components/section-title";
import { MatchForm } from "./match-form";

export const dynamic = "force-dynamic";

export default async function NewMatchPage() {
  const store = getStore();
  const [players, config] = await Promise.all([
    store.getPlayers(),
    store.getConfig(),
  ]);
  const active = players.filter((p) => p.active);

  if (active.length < 4) {
    return (
      <div className="page-shell max-w-xl">
        <SectionTitle title="NEW MATCH" subtitle="半荘結果を入力" />
        <div className="surface-card p-6 space-y-3">
          <p>選手が4人以上いません。先に選手を登録してください。</p>
          <Link href="/admin" className="btn-primary inline-flex">
            管理画面へ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-3xl">
      <SectionTitle title="NEW MATCH" subtitle="半荘結果を入力" />
      <div className="mb-4 text-xs text-foreground-dim">
        ルール: {config.startingPoints.toLocaleString()}点持ち /{" "}
        {config.returnPoints.toLocaleString()}点返し / 順位点{" "}
        {config.uma.map((v) => (v > 0 ? `+${v}` : v.toString())).join(" / ")}
      </div>
      <MatchForm players={active} config={config} />
    </div>
  );
}
