import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  color?: string;
  width?: number;
  height?: number;
  maxPoints?: number;
}

// Lightweight client-side sparkline that buffers the latest live values.
// No deps — pure SVG, 60fps friendly.
export default function Sparkline({ value, color = "#fbbf24", width = 72, height = 24, maxPoints = 32 }: Props) {
  const [pts, setPts] = useState<number[]>([]);
  const last = useRef(value);
  useEffect(() => {
    if (!Number.isFinite(value) || value === last.current) return;
    last.current = value;
    setPts((p) => {
      const next = [...p, value];
      return next.length > maxPoints ? next.slice(next.length - maxPoints) : next;
    });
  }, [value, maxPoints]);

  if (pts.length < 2) {
    return <svg width={width} height={height} aria-hidden="true" />;
  }

  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const stepX = width / (pts.length - 1);
  const d = pts
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(2)},${(height - ((v - min) / range) * height).toFixed(2)}`)
    .join(" ");
  const trendUp = pts[pts.length - 1] >= pts[0];
  const stroke = color || (trendUp ? "#34d399" : "#f87171");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
