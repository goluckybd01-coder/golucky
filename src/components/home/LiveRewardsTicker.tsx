import { useState, type CSSProperties } from "react";
import { Pause, Play } from "lucide-react";

export type TickerItem = { u: string; a: string; c: string };

type Props = {
  items: TickerItem[];
  accent: string;
  /** compact = mobile 32px, default = desktop 38px */
  compact?: boolean;
  /** marquee duration in seconds */
  durationSec?: number;
  ariaLabel?: string;
};

/**
 * Accessible auto-scrolling ticker.
 * - Pauses on hover, focus-within, and via explicit Play/Pause button.
 * - Button state exposed with `aria-pressed` and `aria-label`.
 * - Respects prefers-reduced-motion.
 */
export default function LiveRewardsTicker({
  items,
  accent,
  compact = false,
  durationSec = compact ? 28 : 32,
  ariaLabel = "Live rewards ticker — recent player wins",
}: Props) {
  const [paused, setPaused] = useState(false);

  const h = compact ? "h-[32px]" : "h-[38px]";
  const rounded = compact ? "rounded-[12px]" : "rounded-[14px]";
  const labelText = compact ? "text-[9px]" : "text-[10px]";
  const itemText = compact ? "text-[10px]" : "text-[11px]";
  const gap = compact ? "gap-6" : "gap-8";
  const padStart = compact ? "pl-2.5 pr-2" : "pl-3 pr-2.5";

  const trackStyle: CSSProperties = {
    animationDuration: `${durationSec}s`,
    animationPlayState: paused ? "paused" : "running",
  };

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
      className={`relative overflow-hidden ${rounded} ${h} flex items-center backdrop-blur-xl focus:outline-none focus-visible:ring-2`}
      style={{
        background: `linear-gradient(90deg, rgba(6,10,8,0.85), rgba(10,14,20,0.75))`,
        border: `1px solid ${accent}55`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 ${compact ? 18 : 20}px -10px ${accent}77`,
      }}
    >
      <div className={`shrink-0 flex items-center gap-1.5 ${padStart} h-full`} aria-hidden="true">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inset-0 rounded-full animate-ping" style={{ background: accent, opacity: 0.7 }} />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
        </span>
        <span className={`${labelText} font-black tracking-wider`} style={{ color: accent }}>LIVE</span>
      </div>

      <div className="flex-1 overflow-hidden relative h-full flex items-center group">
        <div
          className={`flex ${gap} whitespace-nowrap animate-marquee pr-6 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none`}
          style={trackStyle}
        >
          {[...items, ...items].map((t, i) => (
            <span
              key={i}
              aria-hidden={i >= items.length}
              className={`${itemText} font-semibold text-white/80 flex items-center gap-1.5`}
            >
              <span className="h-1 w-1 rounded-full" style={{ background: t.c, boxShadow: `0 0 6px ${t.c}` }} />
              <span style={{ color: t.c }}>{t.u}</span>
              <span className="text-white/60">{t.a}</span>
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? "Play live rewards ticker" : "Pause live rewards ticker"}
        aria-pressed={paused}
        aria-controls="live-rewards-track"
        className={`shrink-0 mr-1.5 grid place-items-center ${compact ? "h-6 w-6" : "h-7 w-7"} rounded-full focus:outline-none focus-visible:ring-2 hover:scale-105 active:scale-95 transition`}
        style={{
          background: `${accent}22`,
          border: `1px solid ${accent}66`,
          color: accent,
          boxShadow: `0 0 8px ${accent}55`,
        }}
      >
        {paused ? <Play className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} /> : <Pause className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />}
      </button>
    </div>
  );
}
