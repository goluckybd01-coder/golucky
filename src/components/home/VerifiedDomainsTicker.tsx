import { ShieldCheck, BadgeCheck } from "lucide-react";

const DOMAINS = [
  "goinglucky.com",
  "golucky01.com",
  "goluckyapp.net",
  "go-lucky-bd.com",
  "goluckybd.com",
  "goluckyofficial.com",
  "goluckyonline.com",
  "goluckyprime.com",
  "golucky.vip",
  "golucky.win",
  "goluckyzone.com",
];

const GOLD = "#f7b500";
const GOLD_HI = "#ffd166";
const EMERALD = "#00d38a";
const EMERALD_HI = "#37e39b";

export default function VerifiedDomainsTicker({ compact = false }: { compact?: boolean }) {
  const items = [...DOMAINS, ...DOMAINS];
  const titleSize = compact ? "text-[9px]" : "text-[10px]";
  const badgeSize = compact ? "text-[8px] px-1.5 py-0.5" : "text-[9px] px-2 py-0.5";
  const iconSize = compact ? "h-3.5 w-3.5" : "h-4 w-4";
  const domainSize = compact ? "text-[11px]" : "text-[13px]";
  const pad = compact ? "p-2.5" : "p-3";
  const rowPad = compact ? "py-2" : "py-2.5";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${pad}`}
      style={{
        background: "linear-gradient(180deg, rgba(20,14,4,0.85), rgba(10,10,18,0.9))",
        border: `1px solid ${GOLD}66`,
        boxShadow: `0 10px 30px -12px ${GOLD}55, inset 0 1px 0 rgba(255,255,255,0.05)`,
        backdropFilter: "blur(14px)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className={iconSize} style={{ color: GOLD_HI, filter: `drop-shadow(0 0 6px ${GOLD})` }} />
        <div className={`${titleSize} font-black uppercase tracking-[0.22em] flex-1 truncate`} style={{ color: GOLD_HI }}>
          Official Verified Domains
        </div>
        <span
          className={`${badgeSize} font-black rounded-md flex items-center gap-1 animate-pulse`}
          style={{ background: `${EMERALD}22`, color: EMERALD_HI, border: `1px solid ${EMERALD}66` }}
        >
          <BadgeCheck className="h-3 w-3" /> VERIFIED ✓
        </span>
      </div>

      <div
        className={`group relative overflow-hidden ${rowPad} rounded-lg`}
        style={{
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${GOLD}22`,
        }}
        aria-label="Official verified domains ticker"
        role="marquee"
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-8 z-10"
          style={{ background: "linear-gradient(90deg, rgba(10,10,18,0.95), transparent)" }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-8 z-10"
          style={{ background: "linear-gradient(-90deg, rgba(10,10,18,0.95), transparent)" }}
        />

        <div
          className="flex items-center gap-6 whitespace-nowrap animate-marquee will-change-transform group-hover:[animation-play-state:paused] motion-reduce:animate-none"
          style={{ animationDuration: "42s" }}
          aria-hidden="true"
        >
          {items.map((d, i) => (
            <span key={`${d}-${i}`} className="flex items-center gap-6 shrink-0">
              <span
                className={`${domainSize} font-mono font-bold tracking-wide`}
                style={{ color: GOLD_HI, textShadow: `0 0 10px ${GOLD}44` }}
              >
                {d}
              </span>
              <span style={{ color: `${GOLD}66` }}>•</span>
            </span>
          ))}
        </div>

        <span className="sr-only">{DOMAINS.join(", ")}</span>
      </div>
    </div>
  );
}
