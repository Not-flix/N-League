import Link from "next/link";
import { loadLeagueSnapshot, formatDate } from "@/lib/data";
import { SectionTitle } from "@/components/section-title";
import { Avatar } from "@/components/avatar";
import type { TitleAward } from "@/lib/types";

export const dynamic = "force-dynamic";

type TitleSpec = {
  key: keyof Awaited<ReturnType<typeof loadLeagueSnapshot>>["titles"];
  label: string;
  caption: string;
  description: string;
  icon: string;
  valueLabel: string;
};

const TITLES: TitleSpec[] = [
  {
    key: "champion",
    label: "優勝",
    caption: "CHAMPION",
    description: "累計ポイント1位の称号",
    icon: "👑",
    valueLabel: "合計pt",
  },
  {
    key: "mostTop",
    label: "最多トップ賞",
    caption: "MOST TOPS",
    description: "1位獲得回数が最も多い選手",
    icon: "🏆",
    valueLabel: "トップ回数",
  },
  {
    key: "lastAvoidance",
    label: "ラス回避賞",
    caption: "LAST AVOIDANCE",
    description: "ラス率が最も低い選手",
    icon: "🛡️",
    valueLabel: "ラス率",
  },
  {
    key: "highScore",
    label: "半荘最大スコア賞",
    caption: "HIGH SCORE",
    description: "半荘で記録した素点が最大の選手",
    icon: "💥",
    valueLabel: "最大素点",
  },
];

export default async function TitlesPage() {
  const { titles, matches } = await loadLeagueSnapshot();
  const hasAnyMatch = matches.length > 0;

  return (
    <div className="page-shell space-y-8">
      <SectionTitle
        title="TITLES"
        subtitle="現時点の受賞者"
        action={
          <Link
            href="/standings"
            className="text-xs text-accent hover:underline"
          >
            順位表へ →
          </Link>
        }
      />

      {!hasAnyMatch && (
        <div className="surface-card p-8 text-center text-foreground-muted">
          まだ試合がありません。試合を入力すると各タイトルの暫定受賞者が表示されます。
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TITLES.map((spec) => (
          <TitleCard key={spec.key} spec={spec} awards={titles[spec.key]} />
        ))}
      </div>

      <p className="text-xs text-foreground-dim">
        ※ 現時点の暫定値です。同値の場合は複数名が並列で表示されます。
      </p>
    </div>
  );
}

function TitleCard({
  spec,
  awards,
}: {
  spec: TitleSpec;
  awards: TitleAward[];
}) {
  return (
    <div className="title-card">
      <div className="title-card__header">
        <span className="title-card__icon" aria-hidden="true">
          {spec.icon}
        </span>
        <div className="min-w-0">
          <div className="eyebrow text-foreground-muted">{spec.caption}</div>
          <div className="headline text-2xl font-extrabold mt-0.5">
            {spec.label}
          </div>
          <div className="text-xs text-foreground-dim mt-1">
            {spec.description}
          </div>
        </div>
      </div>
      {awards.length === 0 ? (
        <div className="title-card__empty">— 該当なし —</div>
      ) : (
        <ul className="title-card__winners">
          {awards.map((award) => (
            <li key={award.player.id} className="title-card__winner">
              <Avatar player={award.player} size="md" />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/players/${award.player.id}`}
                  className="font-extrabold headline text-lg hover:text-accent truncate block"
                >
                  {award.player.name}
                </Link>
                {award.meta && (
                  <div className="text-[11px] text-foreground-dim mt-0.5">
                    {formatDate(award.meta.playedAt, {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                    の半荘
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="eyebrow text-foreground-dim text-[10px]">
                  {spec.valueLabel}
                </div>
                <div className="numeric headline text-xl font-extrabold text-accent-strong mt-0.5">
                  {award.display}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
