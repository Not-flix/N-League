import { loadLeagueSnapshot, formatDate, partitionSchedule } from "@/lib/data";
import { SectionTitle } from "@/components/section-title";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const { schedule } = await loadLeagueSnapshot();
  const { upcoming, past } = partitionSchedule(schedule);

  return (
    <div className="page-shell space-y-10">
      <section>
        <SectionTitle title="UPCOMING" subtitle="今後の予定" />
        {upcoming.length === 0 ? (
          <div className="surface-card p-8 text-center text-foreground-muted">
            予定はありません。
          </div>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((entry) => (
              <li key={entry.id} className="surface-card p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-accent tracking-wider">
                      {formatDate(entry.scheduledAt, {
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="font-semibold text-lg mt-1">
                      {entry.label}
                    </div>
                  </div>
                </div>
                {entry.notes && (
                  <div className="mt-2 text-sm text-foreground-muted">
                    {entry.notes}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <SectionTitle title="PAST" subtitle="過去の予定" />
          <ul className="space-y-2">
            {past.map((entry) => (
              <li
                key={entry.id}
                className="surface-card p-4 opacity-70 hover:opacity-100"
              >
                <div className="text-xs text-foreground-dim">
                  {formatDate(entry.scheduledAt, {
                    weekday: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="font-semibold mt-1">{entry.label}</div>
                {entry.notes && (
                  <div className="mt-1 text-sm text-foreground-dim">
                    {entry.notes}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
