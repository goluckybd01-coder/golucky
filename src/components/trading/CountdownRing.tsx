import { useEffect, useState } from "react";
import { currentWindow, CLOSE_LOCK_SEC } from "@/lib/usdBdt";

interface Props {
  durationSec: number;
  size?: number;
}

// Circular SVG countdown synced to global bucket window.
// Green while open, orange in last 10s lock, red after close (waiting result).
export default function CountdownRing({ durationSec, size = 44 }: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  const { remaining } = currentWindow(durationSec, now);
  const secs = Math.ceil(remaining / 1000);
  const pct = remaining / (durationSec * 1000);
  const color = secs <= 0 ? "#f43f5e" : secs <= CLOSE_LOCK_SEC ? "#fb923c" : "#34d399";
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="3" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 250ms linear, stroke 200ms" }}
        />
      </svg>
      <span className="absolute text-[11px] font-bold tabular-nums" style={{ color }}>{secs}s</span>
    </div>
  );
}
