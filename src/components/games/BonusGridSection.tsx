import { useNavigate } from "react-router-dom";
import {
  Gift, Coins, CalendarDays, CalendarRange, Crown, Handshake,
} from "lucide-react";

const BONUSES = [
  { name: "First Deposit Bonus", sub: "Up to +200%",  icon: Gift,         color: "#FEC013", route: "/promotion" },
  { name: "Daily Cashback",      sub: "Every 24h",    icon: Coins,        color: "#12C665", route: "/promotion" },
  { name: "Weekly Cashback",     sub: "Every Monday", icon: CalendarDays, color: "#02B4FA", route: "/promotion" },
  { name: "Monthly Cashback",    sub: "1st of month", icon: CalendarRange,color: "#DA29FB", route: "/promotion" },
  { name: "VIP Bonus",           sub: "L1 – L10",     icon: Crown,        color: "#F97316", route: "/vip" },
  { name: "Agent Bonus",         sub: "Team rewards", icon: Handshake,    color: "#EC4899", route: "/agent" },
] as const;

export default function BonusGridSection() {
  const navigate = useNavigate();
  return (
    <section
      aria-label="Available bonuses"
      className="rounded-3xl border border-white/10 bg-white/[0.035] backdrop-blur-xl p-3 lg:p-4"
      style={{ boxShadow: "0 10px 40px -20px rgba(0,0,0,0.8)" }}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-white/50">
            Rewards
          </div>
          <h2 className="text-[15px] font-black text-white">Bonuses & Cashback</h2>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 lg:gap-3">
        {BONUSES.map(({ name, sub, icon: Icon, color, route }) => (
          <button
            key={name}
            onClick={() => navigate(route)}
            aria-label={`${name} — ${sub}`}
            className="group relative aspect-square rounded-2xl border overflow-hidden text-left p-2 flex flex-col justify-between transition-transform hover:scale-[1.04] active:scale-[0.97] focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#FEC013]"
            style={{
              borderColor: `${color}55`,
              background: `linear-gradient(160deg, ${color}18, rgba(0,0,0,0.6) 70%)`,
              boxShadow: `0 14px 30px -18px ${color}aa, inset 0 1px 0 rgba(255,255,255,0.06)`,
            }}
          >
            <span
              aria-hidden="true"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border"
              style={{
                borderColor: `${color}66`,
                background: `${color}22`,
                color,
                boxShadow: `0 6px 14px -8px ${color}aa`,
              }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[11px] font-black text-white leading-tight truncate">
                {name}
              </div>
              <div className="text-[9px] text-white/60 truncate">{sub}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
