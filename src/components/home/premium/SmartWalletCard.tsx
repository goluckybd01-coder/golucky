import { motion } from "framer-motion";
import { Eye, EyeOff, TrendingUp, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sparkline from "./Sparkline";

interface Props {
  balance: number;
  bonus?: number;
  luckyCoin?: number;
  vipLevel?: number;
}

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SmartWalletCard({ balance, bonus = 0, luckyCoin = 0, vipLevel = 1 }: Props) {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const total = balance + bonus;
  return (
    <div
      className="relative rounded-[28px] p-5 sm:p-7 overflow-hidden border border-amber-300/15 backdrop-blur-2xl"
      style={{
        background:
          "linear-gradient(135deg, rgba(5,24,18,0.92) 0%, rgba(3,14,24,0.86) 55%, rgba(22,15,5,0.88) 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(212,175,55,0.10), 0 30px 80px -24px rgba(0,0,0,0.8), 0 0 60px -30px rgba(16,185,129,0.5)",
      }}
    >
      <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
      <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full gl-aurora decorative pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(212,175,55,0.45), transparent 70%)", filter: "blur(34px)" }} />
      <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full gl-aurora decorative pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(16,185,129,0.40), transparent 70%)", filter: "blur(34px)", animationDelay: "1.4s" }} />
      <div className="absolute inset-y-0 right-0 w-[62%] opacity-95 pointer-events-none decorative">
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(80% 60% at 80% 50%, rgba(16,185,129,0.25), transparent 70%)" }} />
        <div className="absolute inset-0 flex items-center justify-end pr-2">
          <Sparkline width={340} height={140} data={[10,16,12,22,18,28,24,34,30,42,38,52,48,62,58,72,80]} />
        </div>
      </div>
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] gl-text-dim font-semibold">Total Balance</span>
          <button type="button" onClick={() => setHidden(v => !v)} className="clickable text-amber-300/80 hover:text-amber-200 transition">
            {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-400/30 bg-emerald-500/10">
          <TrendingUp size={11} className="text-emerald-300" />
          <span className="text-[10px] font-bold text-emerald-300">+12.4%</span>
        </div>
      </div>
      <div className="relative z-10 mt-3 flex items-baseline gap-2">
        <span className="text-3xl sm:text-4xl font-black gl-num gl-gold-text drop-shadow">৳</span>
        <span
          className="text-[40px] sm:text-[52px] leading-none font-black gl-num tracking-tight"
          style={{
            background: "linear-gradient(180deg,#FFF1B5 0%,#FDD25A 40%,#E0A227 70%,#7C4A0E 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 4px 14px rgba(212,175,55,0.5))",
          }}
        >
          {hidden ? "•••••••" : fmt(total)}
        </span>
      </div>
      <div className="relative z-10 mt-5 flex items-end justify-between gap-3">
        <div className="grid grid-cols-2 gap-5 flex-1">
          <div>
            <div className="text-[10px] uppercase tracking-wider gl-text-dim font-semibold">Wallet Balance</div>
            <div className="mt-0.5 text-[15px] font-black gl-text gl-num">৳ {hidden ? "•••" : fmt(balance)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-amber-200/80 font-semibold">Bonus Balance</div>
            <div className="mt-0.5 text-[15px] font-black gl-gold-text gl-num">৳ {hidden ? "•••" : fmt(bonus)}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/deposit")}
          aria-label="Add funds"
          className="clickable shrink-0 w-10 h-10 rounded-full grid place-items-center transition hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg,#10B981 0%,#047857 100%)",
            boxShadow: "0 8px 24px -8px rgba(16,185,129,0.7), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          <Plus size={18} className="text-white" strokeWidth={3} />
        </button>
      </div>
      <div className="relative z-10 mt-4 flex items-center justify-between text-[10px]">
        <span className="gl-text-dim">VIP {vipLevel} → VIP {vipLevel + 1}</span>
        <span className="text-amber-200/80 font-semibold">68% to next tier</span>
      </div>
      <div className="relative z-10 mt-1.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: "68%" }} transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full" style={{ background: "var(--gl-grad-gold)", boxShadow: "0 0 12px rgba(212,175,55,0.6)" }} />
      </div>
    </div>
  );
}
