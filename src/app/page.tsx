import Link from "next/link";
import {
  loadLeagueSnapshot,
  formatDate,
  partitionSchedule,
} from "@/lib/data";
import { SectionTitle } from "@/components/section-title";
import { StandingsTable } from "@/components/standings-table";
import { MatchCard } from "@/components/match-card";
import { Avatar } from "@/components/avatar";
import type { TitleAward } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { activePlayers, matches, schedule, standings, titles } =
    await loadLeagueSnapshot();
  const recentMatches = matches.slice(0, 3);
  const upcoming = partitionSchedule(schedule).upcoming.slice(0, 3);
  const totalHanchan = matches.length;

  return (
    <div className="page-shell space-y-12">
      <section className="hero-felt p-8 sm:p-12">
        <div className="relative z-[1]">
          <div className="eyebrow text-white/80 mb-3">N League</div>
          <h1 className="text-4xl sm:text-6xl font-black headline mb-4 leading-tight">
            <span className="text-[var(--mahjong-red)] bg-white/95 px-3 py-1 rounded mr-2">
              N
            </span>
            リーグ
          </h1>
          <p className="text-white/85 max-w-xl">
            半荘ごとの結果をその場で入力し、累計ポイント・順位・スケジュールを即時集計する仲間内リーグ管理サイト。基本ルールはMリーグ準拠。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/matches/new" className="btn-hero">
              半荘結果を入力
            </Link>
            <Link href="/standings" className="btn-hero-ghost">
              順位表を見る
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            <Stat label="参加選手" value={activePlayers.length.toString()} />
            <Stat label="累計半荘" value={totalHanchan.toString()} />
            <Stat
              label="次の対戦"
              value={
                upcoming[0]
                  ? formatDate(upcoming[0].scheduledAt, {
                      month: "2-digit",
                      day: "2-digit",
                    })
                  : "—"
              }
            />
          </div>
        </div>
      </section>

      <section>
        <SectionTitle
          title="STANDINGS"
          subtitle="現在の順位"
          action={
            <Link
              href="/standings"
              className="text-xs text-accent hover:underline"
            >
              詳細を見る →
            </Link>
          }
        />
        <StandingsTable rows={standings.slice(0, 5)} compact />
      </section>

      <section>
        <SectionTitle
          title="TITLES"
          subtitle="現時点のタイトル"
          action={
            <Link
              href="/titles"
              className="text-xs text-accent hover:underline"
            >
              詳細を見る →
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <TitleChip
            label="26・27 season 王者"
            award={titles.champion[0]}
            icon="👑"
          />
          <TitleChip
            label="半荘最大スコア"
            award={titles.highScore[0]}
            icon="💥"
          />
          <TitleChip label="最多トップ" award={titles.mostTop[0]} icon="🏆" />
          <TitleChip label="ラス回避" award={titles.lastAvoidance[0]} icon="🛡️" />
        </div>
      </section>

      <section>
        <SectionTitle
          title="RECENT MATCHES"
          subtitle="直近の試合"
          action={
            <Link
              href="/matches"
              className="text-xs text-accent hover:underline"
            >
              すべて見る →
            </Link>
          }
        />
        {recentMatches.length === 0 ? (
          <div className="surface-card p-8 text-center text-foreground-muted">
            まだ試合がありません。「半荘結果を入力」から最初の試合を記録しましょう。
          </div>
        ) : (
          <div className="space-y-3">
            {recentMatches.map((m) => (
              <MatchCard key={m.id} match={m} players={activePlayers} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle
          title="SCHEDULE"
          subtitle="次回対戦"
          action={
            <Link
              href="/schedule"
              className="text-xs text-accent hover:underline"
            >
              すべて見る →
            </Link>
          }
        />
        {upcoming.length === 0 ? (
          <div className="surface-card p-8 text-center text-foreground-muted">
            予定が登録されていません。
          </div>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((entry) => (
              <li
                key={entry.id}
                className="surface-card p-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs text-foreground-muted">
                    {formatDate(entry.scheduledAt, {
                      weekday: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="font-semibold mt-1">{entry.label}</div>
                </div>
                {entry.notes && (
                  <div className="text-xs text-foreground-dim max-w-[40%] truncate">
                    {entry.notes}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TitleChip({
  label,
  award,
  icon,
}: {
  label: string;
  award?: TitleAward;
  icon: string;
}) {
  return (
    <Link
      href="/titles"
      className="surface-card p-3 flex items-center gap-2 hover:border-[var(--gold)] transition-colors"
    >
      <span className="text-xl shrink-0" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="eyebrow text-foreground-dim text-[10px]">{label}</div>
        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
          {award?.player ? (
            <Avatar player={award.player} size="sm" />
          ) : (
            <span className="w-7 h-7 rounded-full bg-background-elevated border border-border shrink-0" />
          )}
          <span className="font-bold truncate">
            {award?.player.name ?? "—"}
          </span>
        </div>
        <div className="text-[11px] numeric text-foreground-muted mt-0.5">
          {award?.display ?? "—"}
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-white/30 pl-3">
      <div className="text-[10px] text-white/70 tracking-[0.2em] uppercase">
        {label}
      </div>
      <div className="text-2xl font-bold mt-1 numeric text-white headline">
        {value}
      </div>
    </div>
  );
}
