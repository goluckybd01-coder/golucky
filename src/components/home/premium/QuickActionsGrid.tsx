import { motion } from "framer-motion";
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Crown, Gift, UserPlus, Headphones } from "lucide-react";
import { useNavigate } from "react-router-dom";

const primary = [
  { id: "deposit",  label: "Deposit",  hint: "Instant & Secure", icon: ArrowDownToLine, to: "/deposit",  variant: "emerald" as const },
  { id: "withdraw", label: "Withdraw", hint: "Fast Payout",      icon: ArrowUpFromLine, to: "/withdraw", variant: "violet"  as const },
  { id: "transfer", label: "Transfer", hint: "To Wallet",         icon: ArrowLeftRight,  to: "/transfer", variant: "navy"    as const },
];
const secondary = [
  { id: "vip",     label: "VIP Club",  icon: Crown,     to: "/vip",        tone: "gold" },
  { id: "rewards", label: "Rewards",   icon: Gift,      to: "/promotion",  tone: "rose" },
  { id: "refer",   label: "Refer & Earn", icon: UserPlus, to: "/agent",    tone: "emerald" },
  { id: "support", label: "Support",   icon: Headphones,to: "/support",    tone: "cyan" },
];

const primaryStyle = {
  emerald: {
    bg: "linear-gradient(135deg, rgba(6,40,28,0.85) 0%, rgba(4,22,16,0.85) 100%)",
    iconBg: "linear-gradient(135deg,#34D399,#059669)",
    border: "rgba(16,185,129,0.45)",
    glow: "0 22px 50px -22px rgba(16,185,129,0.7), inset 0 1px 0 rgba(255,255,255,0.10)",
    ringColor: "rgba(16,185,129,0.55)",
  },
  violet: {
    bg: "linear-gradient(135deg, rgba(40,18,70,0.85) 0%, rgba(22,10,42,0.85) 100%)",
    iconBg: "linear-gradient(135deg,#A78BFA,#6D28D9)",
    border: "rgba(167,139,250,0.45)",
    glow: "0 22px 50px -22px rgba(139,92,246,0.7), inset 0 1px 0 rgba(255,255,255,0.10)",
    ringColor: "rgba(139,92,246,0.55)",
  },
  navy: {
    bg: "linear-gradient(135deg, rgba(10,28,60,0.88) 0%, rgba(4,14,32,0.88) 100%)",
    iconBg: "linear-gradient(135deg,#60A5FA,#1D4ED8)",
    border: "rgba(96,165,250,0.45)",
    glow: "0 22px 50px -22px rgba(59,130,246,0.65), inset 0 1px 0 rgba(255,255,255,0.10)",
    ringColor: "rgba(59,130,246,0.55)",
  },
} as const;

const toneRing: Record<string,string> = {
  gold: "from-amber-300 to-amber-600",
  rose: "from-rose-400 to-pink-600",
  emerald: "from-emerald-300 to-emerald-700",
  cyan: "from-cyan-300 to-teal-600",
};

export default function QuickActionsGrid() {
  const navigate = useNavigate();
  return (
    <div className="space-y-3">
      {/* Primary trio */}
      <div className="grid grid-cols-3 gap-3">
        {primary.map((a, i) => {
          const Icon = a.icon;
          const s = primaryStyle[a.variant];
          return (
            <motion.button
              type="button" key={a.id}
              onClick={() => navigate(a.to)}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
              className="clickable relative rounded-[22px] p-4 text-left overflow-hidden backdrop-blur-2xl border"
              style={{ background: s.bg, borderColor: s.border, boxShadow: s.glow }}
            >
              {/* Sheen */}
              <span className="pointer-events-none absolute inset-x-6 top-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${s.ringColor}, transparent)` }} />
              {/* Aurora glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full decorative pointer-events-none opacity-50"
                style={{ background: `radial-gradient(closest-side, ${s.ringColor}, transparent 70%)`, filter: "blur(20px)" }} />
              <div className="relative z-10 flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl grid place-items-center border border-white/25"
                  style={{ background: s.iconBg, boxShadow: `0 10px 22px -10px ${s.ringColor}, inset 0 1px 0 rgba(255,255,255,0.35)` }}
                >
                  <Icon size={20} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" strokeWidth={2.6} />
                </div>
                <div className="leading-tight">
                  <div className="text-[15px] font-black text-white tracking-tight">{a.label}</div>
                  <div className="text-[10px] text-white/70 font-semibold mt-0.5">{a.hint}</div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-4 gap-2">
        {secondary.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.button
              type="button" key={a.id}
              onClick={() => navigate(a.to)}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.04 }}
              whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
              className="clickable rounded-2xl gl-glass p-2.5 flex flex-col items-center justify-center gap-1.5 gl-lift"
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${toneRing[a.tone]} flex items-center justify-center shadow-lg`}>
                <Icon size={16} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold gl-text/90 text-center leading-tight">{a.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
