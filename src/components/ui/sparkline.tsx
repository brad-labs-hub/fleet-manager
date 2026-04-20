type SparklineProps = {
  data: number[];
  stroke?: string;
  fill?: string;
  height?: number;
  className?: string;
};

export function Sparkline({
  data,
  stroke = "var(--indigo-soft)",
  fill = "rgba(99,102,241,0.18)",
  height = 40,
  className = "",
}: SparklineProps) {
  const max = Math.max(...data, 1);
  const w = 180;
  const pts = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * w},${height - (v / max) * (height - 4) - 2}`
    )
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className={className} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.8" />
      <polyline
        points={`0,${height} ${pts} ${w},${height}`}
        fill={fill}
        stroke="none"
      />
    </svg>
  );
}
