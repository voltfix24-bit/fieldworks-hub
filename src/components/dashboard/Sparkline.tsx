interface SparklineProps {
  values: number[];
  color: string;
  className?: string;
}

/** Simple SVG bar-chart sparkline */
export function Sparkline({ values, color, className }: SparklineProps) {
  const max = Math.max(...values, 1);
  const w = 80;
  const h = 28;
  const gap = 2;
  const barW = (w - gap * (values.length - 1)) / values.length;

  return (
    <svg width={w} height={h} className={className} viewBox={`0 0 ${w} ${h}`}>
      {values.map((v, i) => {
        const bh = Math.max(2, (v / max) * h);
        const x = i * (barW + gap);
        const y = h - bh;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={bh}
            rx={1}
            fill={color}
            opacity={0.35 + (i / values.length) * 0.65}
          />
        );
      })}
    </svg>
  );
}
