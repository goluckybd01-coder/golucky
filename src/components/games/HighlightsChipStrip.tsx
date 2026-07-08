import { Trophy, Percent, Crown, Coins } from "lucide-react";

const CHIPS = [
  { label: "Top 50 Games",   icon: Trophy,  color: "#FEC013" },
  { label: "RTP 98%",        icon: Percent, color: "#12C665" },
  { label: "VIP Only",       icon: Crown,   color: "#DA29FB" },
  { label: "Jackpot ৳5Cr+",  icon: Coins,   color: "#F97316" },
] as const;

export default function HighlightsChipStrip() {
  return (
    <div
      role="list"
      aria-label="Games highlights"
      className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden"
      style={{ boxShadow: "0 10px 30px -18px rgba(0,0,0,0.9)" }}
    >
      <div className="flex-1 overflow-x-auto no-scrollbar">
        <ul className="flex items-center gap-2 min-w-max px-3 py-2">
          {CHIPS.map(({ label, icon: Icon, color }) => (
            <li
              key={label}
              role="listitem"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-black/40"
              style={{
                borderColor: `${color}55`,
                boxShadow: `0 6px 16px -12px ${color}aa, inset 0 1px 0 rgba(255,255,255,0.06)`,
              }}
            >
              <Icon
                aria-hidden="true"
                className="h-3 w-3"
                style={{ color }}
              />
              <span
                className="text-[10px] font-black uppercase tracking-wider tabular-nums"
                style={{ color }}
              >
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
