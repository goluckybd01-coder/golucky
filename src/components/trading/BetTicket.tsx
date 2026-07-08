import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ALLOWED_DURATIONS,
  CLOSE_LOCK_SEC,
  MAX_STAKE_BDT,
  MIN_STAKE_BDT,
  PAYOUT_RATIO,
  currentWindow,
  durationLabel,
  fmtBDT,
  fmtPrice,
} from "@/lib/usdBdt";
import type { MarketPrice } from "@/hooks/useMarketPrices";

interface Props {
  asset: MarketPrice | null;
  open: boolean;
  onClose: () => void;
  onPlaced?: () => void;
}

const PRESETS = [100, 500, 1000, 5000, 10000];

export default function BetTicket({ asset, open, onClose, onPlaced }: Props) {
  const [duration, setDuration] = useState<number>(60);
  const [stake, setStake] = useState<number>(500);
  const [direction, setDirection] = useState<"UP" | "DOWN" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => { if (open) setDirection(null); }, [open, asset?.symbol]);

  if (!asset) return null;
  const { remaining } = currentWindow(duration, now);
  const secs = Math.ceil(remaining / 1000);
  const locked = secs <= CLOSE_LOCK_SEC;
  const potential = stake + stake * PAYOUT_RATIO;

  async function place(dir: "UP" | "DOWN") {
    if (!asset) return;
    if (locked) { toast.error("Betting closed — wait for the next round"); return; }
    if (stake < MIN_STAKE_BDT || stake > MAX_STAKE_BDT) {
      toast.error(`Stake must be ${fmtBDT(MIN_STAKE_BDT)}–${fmtBDT(MAX_STAKE_BDT)}`);
      return;
    }
    setDirection(dir);
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("trade-open", {
        body: { symbol: asset.symbol, direction: dir, duration_sec: duration, stake_bdt: stake },
      });
      if (error || !data?.success) throw new Error(data?.error || error?.message || "Trade failed");
      toast.success(`${dir} ${asset.symbol} • ${fmtBDT(stake)} placed`);
      window.dispatchEvent(new CustomEvent("trade:placed"));
      onPlaced?.();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Could not place trade");
    } finally {
      setSubmitting(false);
      setDirection(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="bg-gradient-to-b from-zinc-950 to-black border-amber-500/20 text-white rounded-t-2xl max-h-[92vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight">{asset.symbol}</span>
              <span className="text-xs text-white/50">{asset.display_name}</span>
            </span>
            <span className="text-amber-300 font-mono tabular-nums">${fmtPrice(asset.price, asset.decimals)}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Duration</div>
            <div className="grid grid-cols-4 gap-2">
              {ALLOWED_DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`py-2 rounded-lg text-sm font-semibold transition ${
                    duration === d
                      ? "bg-gradient-to-b from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-500/30"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >{durationLabel(d)}</button>
              ))}
            </div>
          </div>

          <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
            locked ? "bg-rose-500/15 text-rose-300" : secs <= CLOSE_LOCK_SEC + 5 ? "bg-orange-500/15 text-orange-300" : "bg-emerald-500/10 text-emerald-300"
          }`}>
            <span>{locked ? "Betting closed — waiting result" : "Round closes in"}</span>
            <span className="font-mono tabular-nums">{secs}s</span>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Stake (BDT)</div>
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
              <span className="text-white/50">৳</span>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(Number(e.target.value) || 0)}
                className="flex-1 bg-transparent outline-none text-lg font-bold tabular-nums"
                min={MIN_STAKE_BDT}
                max={MAX_STAKE_BDT}
              />
            </div>
            <div className="grid grid-cols-5 gap-1.5 mt-2">
              {PRESETS.map((p) => (
                <button key={p} onClick={() => setStake(p)} className="py-1.5 rounded-md text-[11px] font-semibold bg-white/5 hover:bg-amber-500/20 text-white/70 hover:text-amber-200 transition">
                  {p >= 1000 ? `${p / 1000}K` : p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2">
            <span className="text-white/60">Potential return ({Math.round(PAYOUT_RATIO * 100)}%)</span>
            <span className="text-amber-300 font-bold tabular-nums">{fmtBDT(potential)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              disabled={submitting || locked}
              onClick={() => place("DOWN")}
              className="h-14 text-base font-extrabold bg-gradient-to-b from-rose-500 to-rose-700 hover:from-rose-400 hover:to-rose-600 text-white shadow-lg shadow-rose-500/30 disabled:opacity-50"
            >
              <AnimatePresence>
                {submitting && direction === "DOWN" ? (
                  <motion.span initial={{ scale: 0.9 }} animate={{ scale: [1, 1.1, 1] }} className="inline-block">Placing…</motion.span>
                ) : (
                  <span>↓ SELL</span>
                )}
              </AnimatePresence>
            </Button>
            <Button
              disabled={submitting || locked}
              onClick={() => place("UP")}
              className="h-14 text-base font-extrabold bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/30 disabled:opacity-50"
            >
              <AnimatePresence>
                {submitting && direction === "UP" ? (
                  <motion.span initial={{ scale: 0.9 }} animate={{ scale: [1, 1.1, 1] }} className="inline-block">Placing…</motion.span>
                ) : (
                  <span>↑ BUY</span>
                )}
              </AnimatePresence>
            </Button>
          </div>
          <p className="text-[10px] text-white/30 text-center pt-1">
            Wallet auto-converts BDT ↔ USD silently. Settlement at round close.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
