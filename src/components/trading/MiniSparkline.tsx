import { useEffect, useRef } from "react";

export default function MiniSparkline({
  data, up, height = 36, width = 100,
}: { data: number[]; up: boolean; height?: number; width?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = width * dpr; c.height = height * dpr;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    if (data.length < 2) return;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    const stroke = up ? "#34d399" : "#f87171";
    const fill = up ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)";
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke();
  }, [data, up, height, width]);
  return <canvas ref={ref} style={{ width, height }} />;
}
