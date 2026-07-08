import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, Brain, Target, Dices, Plane, TrendingUp, ArrowRight } from "lucide-react";

type AIGame = {
  id: string;
  label: string;
  tag: string;
  to: string;
  Icon: typeof Brain;
  grad: string;
  glow: string;
  accuracy: string;
};

const games: AIGame[] = [
  {
    id: "wingo", label: "WinGo AI", tag: "Color Predictor", to: "/ai-predictions?game=wingo",
    Icon: Target,
    grad: "linear-gradient(155deg,#1bf0a3 0%,#0f9b69 55%,#053b2a 100%)",
    glow: "rgba(34,211,153,0.55)", accuracy: "92%",
  },
  {
    id: "k3", label: "K3 AI", tag: "Dice Forecast", to: "/ai-predictions?game=k3",
    Icon: Dices,
    grad: "linear-gradient(155deg,#c084fc 0%,#7c3aed 55%,#2e1065 100%)",
    glow: "rgba(167,139,250,0.55)", accuracy: "88%",
  },
  {
    id: "aviator", label: "Aviator AI", tag: "Cashout Signal", to: "/ai-predictions?game=aviator",
    Icon: Plane,
    grad: "linear-gradient(155deg,#fda4af 0%,#dc2626 55%,#450a0a 100%)",
    glow: "rgba(239,68,68,0.55)", accuracy: "85%",
  },
  {
    id: "fiveD", label: "5D AI", tag: "Trend Analyzer", to: "/ai-predictions?game=fiveD",
    Icon: TrendingUp,
    grad: "linear-gradient(155deg,#fcd34d 0%,#ea580c 55%,#451a03 100%)",
    glow: "rgba(249,115,22,0.55)", accuracy: "90%",
  },
];

export default function AIGameOptionsSection() {
  const navigate = useNavigate();
  return (
    <div
      className="relative rounded-3xl p-4 md:p-5 border border-amber-300/15 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(8,18,32,0.9) 0%, rgba(3,10,20,0.95) 100%)",
        boxShadow:
          "0 24px 50px -22px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04) inset",
      }}
    >
      {/* ambient glow */}
      <span aria-hidden className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full decorative"
        style={{ background: "radial-gradient(closest-side, rgba(212,175,55,0.25), transparent 70%)", filter: "blur(40px)" }} />

      {/* header */}
      <div className="relative flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 rounded-2xl grid place-items-center"
            style={{
              background: "linear-gradient(155deg,#fde68a 0%,#d4a017 55%,#5c3d05 100%)",
              boxShadow: "0 8px 18px -6px rgba(212,160,23,0.6), 0 0 0 1px rgba(255,255,255,0.18) inset",
            }}>
            <Brain size={20} strokeWidth={2.4} className="text-white drop-shadow" />
            <Sparkles size={10} className="absolute -top-1 -right-1 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base md:text-lg font-black gl-text tracking-tight">AI Game Predictor</h2>
              <span className="px-1.5 py-[1px] rounded-md text-[8px] font-black tracking-wider text-black"
                style={{ background: "linear-gradient(135deg,#fde68a,#d4a017)" }}>BETA</span>
            </div>
            <div className="text-[10px] md:text-[11px] gl-text-dim">Smart predictions powered by GoLucky AI</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/ai-predictions")}
          className="clickable flex items-center gap-1 text-[11px] font-bold gl-gold-text hover:opacity-80 transition"
        >
          View All <ArrowRight size={12} />
        </button>
      </div>

      {/* grid */}
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
        {games.map((g, i) => (
          <motion.button
            type="button"
            key={g.id}
            onClick={() => navigate(g.to)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.32, ease: "easeOut" }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.96 }}
            className="clickable group relative flex flex-col items-start gap-2 rounded-2xl p-2.5 md:p-3 text-left border border-white/8"
            style={{
              background:
                "linear-gradient(165deg, rgba(15,28,46,0.85) 0%, rgba(4,12,22,0.9) 100%)",
              boxShadow: "0 10px 22px -10px rgba(0,0,0,0.6)",
            }}
          >
            <div className="flex w-full items-start justify-between">
              <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl grid place-items-center overflow-hidden"
                style={{
                  background: g.grad,
                  boxShadow: `0 8px 18px -6px ${g.glow}, 0 0 0 1px rgba(212,175,55,0.3) inset, 0 1px 0 rgba(255,255,255,0.4) inset`,
                }}>
                <span aria-hidden className="pointer-events-none absolute inset-x-1 top-0 h-1/2 rounded-t-[10px] opacity-80 decorative"
                  style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)" }} />
                <g.Icon size={18} strokeWidth={2.4} className="relative z-[1] text-white drop-shadow" />
              </div>
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wide bg-emerald-500/15 text-emerald-300 border border-emerald-400/25">
                {g.accuracy}
              </span>
            </div>
            <div className="w-full">
              <div className="text-[12px] md:text-[13px] font-black gl-text leading-tight">{g.label}</div>
              <div className="text-[10px] gl-text-dim mt-0.5">{g.tag}</div>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold gl-gold-text opacity-90 group-hover:opacity-100">
              Predict Now <ArrowRight size={10} />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
