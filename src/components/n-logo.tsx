export function NLogo({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const width = size;
  const height = Math.round(size * 1.25);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 32 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Nリーグ"
    >
      <defs>
        <linearGradient id="tile-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffcf2" />
          <stop offset="100%" stopColor="#f3ead0" />
        </linearGradient>
      </defs>
      <rect
        x="1"
        y="1"
        width="30"
        height="38"
        rx="4"
        ry="4"
        fill="url(#tile-face)"
        stroke="#c8102e"
        strokeWidth="1.5"
      />
      <rect
        x="1"
        y="33"
        width="30"
        height="6"
        rx="2"
        ry="2"
        fill="rgba(0,0,0,0.08)"
      />
      <rect
        x="4"
        y="4"
        width="24"
        height="32"
        rx="2"
        ry="2"
        fill="none"
        stroke="rgba(200,16,46,0.18)"
        strokeWidth="0.8"
      />
      <text
        x="16"
        y="27"
        textAnchor="middle"
        fontFamily="'Noto Serif JP', 'Hiragino Mincho ProN', serif"
        fontSize="22"
        fontWeight="900"
        fill="#c8102e"
      >
        N
      </text>
    </svg>
  );
}
