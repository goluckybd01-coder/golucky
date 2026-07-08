import { useEffect, useState } from "react";

/**
 * Compact countdown that ticks every second toward `targetMs`.
 * When elapsed, restarts +7 days automatically so the home preview never freezes.
 */
export default function PromoCountdown({
  targetMs,
  color,
  size = "sm",
}: {
  targetMs: number;
  color: string;
  size?: "sm" | "md";
}) {
  const [now, setNow] = useState(() => Date.now());
  const [target, setTarget] = useState(targetMs);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (now >= target) setTarget((t) => t + 7 * 24 * 60 * 60 * 1000);
  }, [now, target]);

  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");

  const chipCls =
    size === "md"
      ? "px-1.5 h-[22px] min-w-[22px] rounded-[6px] text-[11px]"
      : "px-1 h-[18px] min-w-[18px] rounded-[5px] text-[9.5px]";

  const parts: Array<{ v: string; l: string }> = [
    { v: pad(d), l: "d" },
    { v: pad(h), l: "h" },
    { v: pad(m), l: "m" },
    { v: pad(s), l: "s" },
  ];

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={`Ends in ${d} days ${h} hours ${m} minutes`}
      className="flex items-center gap-1 tabular-nums"
    >
      {parts.map((p, i) => (
        <span key={p.l} className="flex items-center gap-1">
          <span
            className={`${chipCls} font-black grid place-items-center`}
            style={{
              background: "rgba(0,0,0,0.35)",
              border: `1px solid ${color}66`,
              color,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06)`,
            }}
          >
            {p.v}
          </span>
          {i < parts.length - 1 && (
            <span className="text-[9px] font-bold opacity-70" style={{ color }}>
              {p.l}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
