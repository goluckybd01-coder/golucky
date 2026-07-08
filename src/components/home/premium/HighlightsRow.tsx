import { motion } from "framer-motion";
import { Crown, ClipboardCheck, Bot, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const fmtBDT = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const winners = [
  { name: "Sakib***", amount: "৳18,500", color: "from-emerald-300 to-emerald-600" },
  { name: "Jannat***", amount: "৳15,000", color: "from-rose-300 to-rose-600" },
  { name: "Mr.Tanvir**", amount: "৳32,000", color: "from-amber-300 to-amber-600" },
];

export default function HighlightsRow() {
  const navigate = useNavigate();
  const [jackpot, setJackpot] = useState(129429.5);
  useEffect(() => {
    const t = setInterval(() => setJackpot((p) => p + Math.random() * 18), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <motion.button
        type="button"
        onClick={() => navigate("/popular")}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        className="clickable relative col-span-2 lg:col-span-1 rounded-3xl p-4 text-left overflow-hidden border border-amber-400/25 backdrop-blur-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(28,18,4,0.92) 0%, rgba(14,8,2,0.92) 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.08), 0 22px 50px -22px rgba(212,175,55,0.5)",
        }}
      >
        <div
          className="absolute -bottom-10 -right-6 w-44 h-44 rounded-full decorative pointer-events-none"
          style={{
            background:
              "radial-gradient(closest-side, rgba(212,175,55,0.45), transparent 70%)",
            filter: "blur(28px)",
          }}
        />
        <div className="relative z-10 flex items-center gap-1.5">
          <Crown size={14} className="text-amber-300" />
          <span className="text-[10px] uppercase tracking-[0.18em] font-black text-amber-200/90">
            Live Jackpot
          </span>
        </div>
        <div
          className="relative z-10 mt-2 text-2xl font-black gl-num tracking-tight"
          style={{
            background:
              "linear-gradient(180deg,#FFF1B5 0%,#FDD25A 50%,#E0A227 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ৳{fmtBDT(jackpot)}
        </div>
        <div className="relative z-10 mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-amber-200/80">
          Must Win <ChevronRight size={12} />
        </div>
        <div className="absolute right-2 bottom-2 text-4xl opacity-60 select-none">💰</div>
      </motion.button>

      <motion.button
        type="button"
        onClick={() => navigate("/activity")}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        className="clickable relative rounded-3xl p-4 text-left overflow-hidden border border-emerald-400/25 backdrop-blur-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(6,30,22,0.92) 0%, rgba(3,16,12,0.92) 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.06), 0 22px 50px -22px rgba(16,185,129,0.55)",
        }}
      >
        <div className="relative z-10 flex items-center gap-1.5">
          <ClipboardCheck size={14} className="text-emerald-300" />
          <span className="text-[10px] uppercase tracking-[0.18em] font-black text-emerald-200/90">
            Daily Mission
          </span>
        </div>
        <div className="relative z-10 mt-1.5 text-sm font-black gl-text leading-snug">
          Complete tasks &<br />Earn rewards
        </div>
        <div className="relative z-10 mt-3">
          <div className="flex items-center justify-between text-[10px] gl-text-dim mb-1">
            <span>Progress</span>
            <span className="font-bold text-emerald-300">4 / 6</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "66%" }}
              transition={{ duration: 1.2 }}
              className="h-full rounded-full"
              style={{
                background: "var(--gl-grad-emerald)",
                boxShadow: "0 0 12px rgba(16,185,129,0.6)",
              }}
            />
          </div>
        </div>
        <div className="relative z-10 mt-3">
          <span
            className="inline-flex items-center justify-center w-full py-1.5 rounded-xl text-[11px] font-black text-[#03110a]"
            style={{
              background: "linear-gradient(135deg,#34D399,#059669)",
              boxShadow: "0 8px 22px -10px rgba(16,185,129,0.7)",
            }}
          >
            Go Now ›
          </span>
        </div>
      </motion.button>

      <motion.div
        whileHover={{ y: -3 }}
        className="relative rounded-3xl p-4 overflow-hidden border border-white/10 backdrop-blur-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(8,18,32,0.92) 0%, rgba(4,10,22,0.92) 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.18em] font-black text-rose-200/90">
            Live Winners
          </span>
        </div>
        <div className="mt-2.5 space-y-2">
          {winners.map((w) => (
            <div key={w.name} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full bg-gradient-to-br ${w.color} grid place-items-center text-[9px] font-black text-white shrink-0`}
              >
                {w.name[0]}
              </div>
              <span className="text-[11px] font-bold gl-text truncate flex-1">
                {w.name}
              </span>
              <span className="text-[11px] font-black gl-emerald-text gl-num">
                {w.amount}
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => navigate("/popular")}
          className="clickable mt-2 text-[10px] font-bold text-emerald-300/90 hover:text-emerald-200"
        >
          View All →
        </button>
      </motion.div>

      <motion.button
        type="button"
        onClick={() => navigate("/ai-chat")}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        className="clickable relative col-span-2 lg:col-span-1 rounded-3xl p-4 text-left overflow-hidden border border-emerald-400/30 backdrop-blur-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(6,30,22,0.92) 0%, rgba(3,16,12,0.92) 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.06), 0 22px 50px -22px rgba(16,185,129,0.55)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <Bot size={14} className="text-emerald-300" />
          <span className="text-[10px] uppercase tracking-[0.18em] font-black text-emerald-200/90">
            AI Assistant
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div
            className="relative w-14 h-14 rounded-2xl grid place-items-center shrink-0"
            style={{
              background: "linear-gradient(135deg,#0ea271,#064e3b)",
              boxShadow: "0 12px 26px -10px rgba(16,185,129,0.7)",
            }}
          >
            <Bot size={26} className="text-white" strokeWidth={2.4} />
            <span className="absolute -bottom-1 -right-1 px-1.5 py-[1px] rounded-full text-[8px] font-black text-[#04120c] bg-gradient-to-r from-emerald-300 to-emerald-500">
              AI
            </span>
          </div>
          <div
            className="flex-1 text-[11px] font-bold gl-text rounded-xl px-2.5 py-2"
            style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.25)" }}
          >
            Hi! How can I help you today?
          </div>
        </div>
        <div className="mt-3">
          <span
            className="inline-flex items-center justify-center w-full py-1.5 rounded-xl text-[11px] font-black text-[#03110a]"
            style={{
              background: "linear-gradient(135deg,#34D399,#059669)",
              boxShadow: "0 8px 22px -10px rgba(16,185,129,0.7)",
            }}
          >
            Ask Lucky AI
          </span>
        </div>
      </motion.button>
    </div>
  );
}
