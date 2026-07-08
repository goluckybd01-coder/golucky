import { motion } from "framer-motion";
import { Trophy, Users, Zap, Crown, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const fmtBig = (n: number) => {
  if (n >= 1e7) return (n / 1e7).toFixed(2) + "Cr";
  if (n >= 1e5) return (n / 1e5).toFixed(2) + "L";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(2);
};

export default function JackpotStrip() {
  const navigate = useNavigate();
  const [jackpot, setJackpot] = useState(129429.50);
  const [online, setOnline] = useState(12856);
  useEffect(() => {
    const t = setInterval(() => {
      setJackpot(p => p + Math.random() * 12);
      setOnline(p => p + Math.round((Math.random() - 0.4) * 12));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const stats = [
    { id: "jp", icon: Crown,  label: "Jackpot",     value: `৳${fmtBig(jackpot)}`, tone: "from-amber-400 to-amber-700" },
    { id: "on", icon: Users,  label: "Online Users", value: online.toLocaleString(), tone: "from-emerald-300 to-emerald-700" },
    { id: "tp", icon: Trophy, label: "Total Payout", value: "৳32.45Cr", tone: "from-fuchsia-400 to-purple-700" },
    { id: "tw", icon: Zap,    label: "Today's Wins", value: "৳11.28Cr", tone: "from-cyan-300 to-blue-700" },
  ];

  return (
    <div className="rounded-3xl gl-glass border border-amber-400/15 p-3 md:p-4 grid grid-cols-2 md:grid-cols-5 gap-2.5 md:gap-3">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-[#04111F]/60 border border-white/6 px-3 py-2.5 flex items-center gap-2.5"
          >
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.tone} flex items-center justify-center shadow-lg`}>
              <Icon size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-wider gl-text-dim font-semibold truncate">{s.label}</div>
              <div className="text-sm md:text-base font-black gl-text gl-num truncate">{s.value}</div>
            </div>
          </motion.div>
        );
      })}
      <button
        type="button" onClick={() => navigate("/ai-chat")}
        className="clickable col-span-2 md:col-span-1 rounded-2xl px-3 py-2.5 flex items-center gap-2.5 border border-emerald-400/30 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(14,124,90,0.08))" }}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-300 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/40">
          <Bot size={16} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="text-left">
          <div className="text-[9px] uppercase tracking-wider text-emerald-200/80 font-semibold">Lucky AI</div>
          <div className="text-sm font-black gl-emerald-text">Ask me anything…</div>
        </div>
        <motion.div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-300"
          animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />
      </button>
    </div>
  );
}
