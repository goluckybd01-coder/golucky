import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTradePositions, type TradePosition } from "@/hooks/useTradePositions";
import { fmtBDT, fmtPrice } from "@/lib/usdBdt";
import { supabase } from "@/integrations/supabase/client";

function Row({ p }: { p: TradePosition }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(id); }, []);
  const remaining = Math.max(0, new Date(p.closes_at).getTime() - now);
  const secs = Math.ceil(remaining / 1000);
  const total = p.duration_sec * 1000;
  const pct = Math.min(100, ((total - remaining) / total) * 100);
  const isUp = p.direction === "UP";
  const locking = secs > 0 && secs <= 10;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30 }}
      className={`relative rounded-lg bg-white/5 border p-2.5 overflow-hidden ${locking ? "border-amber-400/60 ring-1 ring-amber-400/40" : "border-white/10"}`}
    >
      <div className={`absolute inset-x-0 top-0 h-0.5 ${isUp ? "bg-emerald-400" : "bg-rose-400"}`} style={{ width: `${pct}%`, transition: "width 500ms linear" }} />
      <div className="flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isUp ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
            {isUp ? "↑ BUY" : "↓ SELL"}
          </span>
          <span className="font-bold truncate text-white">{p.symbol}</span>
          {locking && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-400/20 text-amber-200 animate-pulse">🔒 LOCK</span>
          )}
        </div>
        <span className={`font-mono tabular-nums ${locking ? "text-amber-300 font-bold" : "text-amber-300"}`}>{secs}s</span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-white/60 mt-1">
        <span>{fmtBDT(p.stake_bdt)}</span>
        <span className="font-mono">@ ${fmtPrice(p.open_price, 4)}</span>
      </div>
    </motion.div>
  );
}

// Floating "Active Trades" panel — collapsible, sits at bottom-right.
export default function ActiveTradesPanel() {
  const { open, isLoading } = useTradePositions();
  const [collapsed, setCollapsed] = useState(false);
  const [bump, setBump] = useState(0);
  const [floater, setFloater] = useState<{ id: number } | null>(null);

  useEffect(() => {
    const onPlaced = () => {
      setBump((n) => n + 1);
      const id = Date.now();
      setFloater({ id });
      setTimeout(() => setFloater((f) => (f?.id === id ? null : f)), 1300);
    };
    window.addEventListener("trade:placed", onPlaced);
    // also trigger settlement worker shortly after a position is due
    const tick = setInterval(() => { supabase.functions.invoke("trade-settle").catch(() => {}); }, 8000);
    return () => { window.removeEventListener("trade:placed", onPlaced); clearInterval(tick); };
  }, []);

  if (isLoading) {
    return (
      <div className="fixed bottom-20 right-3 z-50 w-[260px] max-w-[88vw] rounded-xl border border-white/10 bg-zinc-950/85 backdrop-blur-xl p-3">
        <div className="flex items-center gap-2 text-[12px] text-white/50">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
          Syncing active trades…
        </div>
        <div className="mt-2 space-y-1.5">
          <div className="h-10 rounded-lg bg-white/5 animate-pulse" />
          <div className="h-10 rounded-lg bg-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!open.length && !floater) return null;

  return (
    <>
      <AnimatePresence>
        {floater && (
          <motion.div
            key={floater.id}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -90, scale: 1 }}
            exit={{ opacity: 0, y: -130 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] pointer-events-none px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-black text-xs font-extrabold shadow-xl shadow-amber-500/40"
          >+1 Active Trade</motion.div>
        )}
      </AnimatePresence>

      <motion.div
        key={bump}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 0.25 }}
        className="fixed bottom-20 right-3 z-50 w-[260px] max-w-[88vw] rounded-xl border border-amber-500/25 bg-zinc-950/85 backdrop-blur-xl shadow-2xl shadow-amber-900/30"
      >
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center justify-between px-3 py-2 text-[12px] font-bold text-amber-200"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active Trades · {open.length}
          </span>
          <span className="text-white/40">{collapsed ? "▴" : "▾"}</span>
        </button>
        {!collapsed && (
          <div className="max-h-[40vh] overflow-y-auto px-2 pb-2 space-y-1.5">
            <AnimatePresence initial={false}>
              {open.map((p) => (<Row key={p.id} p={p} />))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </>
  );
}
