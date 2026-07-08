import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

const winners = [
  { name: "Sakib***",   game: "5D",      amount: 18500, ago: "Just Now" },
  { name: "Jannat***",  game: "Lottery", amount: 15000, ago: "2m ago" },
  { name: "Mr.Tanvir***", game: "Sports", amount: 32000, ago: "3m ago" },
  { name: "Prince***",  game: "WinGo",   amount:  9800, ago: "5m ago" },
  { name: "Rasel***",   game: "K3",      amount: 18200, ago: "7m ago" },
];

const fmt = (n: number) => "৳" + n.toLocaleString();

export default function LiveWinnersCompact() {
  return (
    <div className="rounded-3xl gl-glass border border-white/8 p-3 md:p-4 h-full">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Trophy size={14} className="text-amber-300" />
          <span className="text-[12px] font-black gl-text">Live Winners</span>
        </div>
        <button type="button" className="clickable text-[10px] font-bold gl-gold-text">View All →</button>
      </div>
      <div className="space-y-1.5">
        {winners.map((w, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-[#04111F]/50 border border-white/5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 grid place-items-center text-[10px] font-black text-[#04111F] shrink-0">
              {w.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold gl-text truncate">{w.name}</div>
              <div className="text-[9px] gl-text-dim truncate">{w.game}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] font-black gl-emerald-text gl-num">{fmt(w.amount)}</div>
              <div className="text-[8px] gl-text-dim">{w.ago}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
