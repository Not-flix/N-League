import { getStore } from "@/lib/store";
import { SectionTitle } from "@/components/section-title";
import { formatDate } from "@/lib/data";
import { PlayerRow } from "./player-row";
import {
  addPlayerAction,
  saveConfigAction,
  addScheduleAction,
  deleteScheduleAction,
  deleteMatchAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const store = getStore();
  const [players, config, schedule, matches] = await Promise.all([
    store.getPlayers(),
    store.getConfig(),
    store.getSchedule(),
    store.getMatches(),
  ]);
  const matchCountByPlayer = new Map<string, number>();
  for (const m of matches) {
    for (const r of m.results) {
      matchCountByPlayer.set(
        r.playerId,
        (matchCountByPlayer.get(r.playerId) ?? 0) + 1,
      );
    }
  }

  return (
    <div className="page-shell space-y-12 max-w-4xl">
      <div className="flex items-center justify-between">
        <SectionTitle title="ADMIN" subtitle="管理画面" />
        <form method="POST" action="/api/auth/logout">
          <button type="submit" className="btn-secondary text-xs py-1.5">
            ログアウト
          </button>
        </form>
      </div>

      <section>
        <SectionTitle title="PLAYERS" subtitle="選手管理" />
        <div className="surface-card divide-y divide-border">
          {players.map((p) => (
            <PlayerRow
              key={p.id}
              player={p}
              matchCount={matchCountByPlayer.get(p.id) ?? 0}
            />
          ))}
          <form action={addPlayerAction} className="p-4 flex gap-3">
            <input
              type="text"
              name="name"
              placeholder="新しい選手の名前"
              required
            />
            <button type="submit" className="btn-primary whitespace-nowrap">
              ＋ 追加
            </button>
          </form>
        </div>
        <p className="mt-2 text-xs text-foreground-dim">
          アイコンは正方形にリサイズして保存されます（最大256px、JPEG圧縮）。
        </p>
      </section>

      <section>
        <SectionTitle title="SCORING" subtitle="スコアリング設定" />
        <form
          action={saveConfigAction}
          className="surface-card p-5 grid sm:grid-cols-2 gap-4"
        >
          <div>
            <label className="text-xs text-foreground-muted block mb-2">
              持ち点（開始点）
            </label>
            <input
              type="number"
              name="startingPoints"
              defaultValue={config.startingPoints}
              required
            />
          </div>
          <div>
            <label className="text-xs text-foreground-muted block mb-2">
              返し点
            </label>
            <input
              type="number"
              name="returnPoints"
              defaultValue={config.returnPoints}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-foreground-muted block mb-2">
              順位点（1着 / 2着 / 3着 / 4着）
            </label>
            <div className="grid grid-cols-4 gap-3">
              {(["uma1", "uma2", "uma3", "uma4"] as const).map((name, idx) => (
                <input
                  key={name}
                  type="number"
                  step="any"
                  name={name}
                  defaultValue={config.uma[idx]}
                  required
                />
              ))}
            </div>
            <p className="text-xs text-foreground-dim mt-2">
              順位点を直接入力してください。Nリーグ初期値:
              <code className="text-accent"> +15 / +5 / -5 / -15</code>（25000点持ち25000点返し）。
              持ち点と返し点が異なる場合は (返し点 − 持ち点) × 4 ぶんのオカが1位に加算されます。
              ここに入力する順位点は、オカを別計算する場合はオカ抜き、含める場合はオカ込みで合計が0になるように設定してください。
            </p>
            <p className="text-xs text-foreground-dim mt-2">
              変更すると{" "}
              <a href="/rules" className="text-accent hover:underline">
                /rules
              </a>{" "}
              の表記に即時反映され、<strong>過去の全試合の点数も新しい設定で自動再計算</strong>されます。
            </p>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">
              設定を保存
            </button>
          </div>
        </form>
      </section>

      <section>
        <SectionTitle title="SCHEDULE" subtitle="対戦スケジュール" />
        <div className="surface-card divide-y divide-border">
          {schedule.length === 0 && (
            <div className="p-6 text-center text-foreground-muted">
              予定がありません。
            </div>
          )}
          {schedule.map((entry) => (
            <div key={entry.id} className="p-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-xs text-foreground-muted">
                  {formatDate(entry.scheduledAt, {
                    weekday: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="font-semibold">{entry.label}</div>
                {entry.notes && (
                  <div className="text-xs text-foreground-dim mt-1">
                    {entry.notes}
                  </div>
                )}
              </div>
              <form action={deleteScheduleAction}>
                <input type="hidden" name="id" value={entry.id} />
                <button
                  type="submit"
                  className="btn-secondary text-xs py-1.5 text-danger border-danger/40"
                >
                  削除
                </button>
              </form>
            </div>
          ))}
          <form
            action={addScheduleAction}
            className="p-4 grid sm:grid-cols-3 gap-3"
          >
            <input
              type="datetime-local"
              name="scheduledAt"
              required
              className="sm:col-span-1"
            />
            <input
              type="text"
              name="label"
              placeholder="ラベル（例：第3節）"
              required
              className="sm:col-span-1"
            />
            <input
              type="text"
              name="notes"
              placeholder="メモ（任意）"
              className="sm:col-span-1"
            />
            <div className="sm:col-span-3">
              <button type="submit" className="btn-primary">
                ＋ 予定を追加
              </button>
            </div>
          </form>
        </div>
      </section>

      <section>
        <SectionTitle title="MATCHES" subtitle="試合の削除" />
        <div className="surface-card divide-y divide-border">
          {matches.length === 0 && (
            <div className="p-6 text-center text-foreground-muted">
              試合データがありません。
            </div>
          )}
          {matches.slice(0, 30).map((m) => (
            <div key={m.id} className="p-4 flex items-center gap-3">
              <div className="flex-1 text-sm">
                <div className="text-xs text-foreground-muted">
                  {formatDate(m.playedAt, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="mt-1">
                  {m.results
                    .slice()
                    .sort((a, b) => a.rank - b.rank)
                    .map((r) => {
                      const player = players.find((p) => p.id === r.playerId);
                      return `${r.rank}位 ${player?.name ?? "?"} (${r.rawScore})`;
                    })
                    .join(" / ")}
                </div>
              </div>
              <form action={deleteMatchAction}>
                <input type="hidden" name="id" value={m.id} />
                <button
                  type="submit"
                  className="btn-secondary text-xs py-1.5 text-danger border-danger/40"
                >
                  削除
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
