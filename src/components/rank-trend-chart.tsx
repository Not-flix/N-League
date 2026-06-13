import { formatDate } from "@/lib/format";

export type RankTrendPoint = {
  matchId: string;
  playedAt: string;
  rank: number;
};

const SHORT_DATE = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  month: "2-digit",
  day: "2-digit",
});

function fmtShort(iso: string): string {
  return SHORT_DATE.format(new Date(iso));
}

const COLORS = ["", "#c8102e", "#0f6b3b", "#b8892b", "#6b675c"];

export function RankTrendChart({ points }: { points: RankTrendPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="surface-card p-8 text-center text-foreground-muted">
        グラフを表示する試合がありません。
      </div>
    );
  }

  const width = 720;
  const height = 240;
  const padding = { top: 18, right: 40, bottom: 48, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const n = points.length;

  const xAt = (i: number) =>
    padding.left + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  const yAt = (rank: number) => padding.top + ((rank - 1) / 3) * chartH;

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(p.rank).toFixed(1)}`)
    .join(" ");

  const ticks = chooseXTicks(n);

  return (
    <div className="surface-card p-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label="着順遷移グラフ"
      >
        {[1, 2, 3, 4].map((r) => (
          <g key={r}>
            <line
              x1={padding.left}
              y1={yAt(r)}
              x2={width - padding.right}
              y2={yAt(r)}
              stroke="var(--border)"
              strokeDasharray="3 4"
            />
            <text
              x={padding.left - 8}
              y={yAt(r)}
              dominantBaseline="middle"
              textAnchor="end"
              fontSize="11"
              fill="var(--foreground-muted)"
              fontWeight="600"
            >
              {r}位
            </text>
          </g>
        ))}

        {ticks.map((i, listIdx) => {
          const isFirst = listIdx === 0;
          const isLast = listIdx === ticks.length - 1;
          const anchor: "start" | "middle" | "end" = isFirst
            ? "start"
            : isLast
              ? "end"
              : "middle";
          return (
            <g key={`tick-${i}`}>
              <line
                x1={xAt(i)}
                y1={height - padding.bottom}
                x2={xAt(i)}
                y2={height - padding.bottom + 4}
                stroke="var(--border-strong)"
              />
              <text
                x={xAt(i)}
                y={height - padding.bottom + 22}
                textAnchor={anchor}
                dominantBaseline="hanging"
                fontSize="11"
                fill="var(--foreground-dim)"
              >
                {fmtShort(points[i].playedAt)}
              </text>
            </g>
          );
        })}

        <path
          d={pathD}
          fill="none"
          stroke="var(--mahjong-green)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p, i) => (
          <g key={p.matchId}>
            <circle
              cx={xAt(i)}
              cy={yAt(p.rank)}
              r="5"
              fill={COLORS[p.rank] ?? "#000"}
              stroke="#fff"
              strokeWidth="1.6"
            >
              <title>
                {formatDate(p.playedAt, {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" / "}
                {p.rank}位
              </title>
            </circle>
          </g>
        ))}
      </svg>
      <div className="text-[10px] text-foreground-dim mt-1 tracking-wider">
        ← 古い試合 / 新しい試合 →
      </div>
    </div>
  );
}

function chooseXTicks(n: number): number[] {
  if (n === 0) return [];
  if (n <= 8) return [...Array(n).keys()];
  const target = 6;
  const step = Math.max(1, Math.floor((n - 1) / (target - 1)));
  const out: number[] = [];
  for (let i = 0; i < n; i += step) out.push(i);
  if (out[out.length - 1] !== n - 1) out.push(n - 1);
  return out;
}
