import React, { useState } from "react";
import { toast } from "sonner";
import { formatTaka } from "@/lib/currency";
import type { BetInput, BetReceipt, CountdownState, GameModule, Market, RoundInfo } from "@/engine";
import { useGlobalWallet as useWallet } from "@/context/WalletContext";

const QUICK = [10, 50, 100, 500, 1000];

interface Choice { type: string; value: string; label: string; odds: number; color: string }

interface Props {
  mod: GameModule;
  market: Market;
  round: RoundInfo;
  countdown: CountdownState;
  choices: Choice[];
  placeBet: (b: Omit<BetInput, "gameId" | "market" | "tradeId">) => Promise<BetReceipt>;
}

const BetPanelHost: React.FC<Props> = ({ mod, choices, countdown, placeBet }) => {
  const { refresh } = useWallet();
  const [picked, setPicked] = useState<Choice | null>(null);
  const [amount, setAmount] = useState(10);
  const [mult, setMult] = useState(1);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!picked) return toast.error("Select a bet option first");
    if (countdown.locked) return toast.error("Betting is locked for this round");
    setBusy(true);
    const res = await placeBet({
      betType: picked.type,
      betValue: picked.value,
      betAmount: amount,
      multiplier: mult,
      odds: picked.odds,
    });
    setBusy(false);
    if (res.success) {
      toast.success(`Bet placed: ${picked.label} × ${formatTaka(amount * mult, 0)}`);
      refresh?.();
    } else {
      toast.error(res.error || "Failed to place bet");
    }
  };

  return (
    <section className="mx-3 mt-3 rounded-3xl bg-card p-4 shadow-sm border border-border/50">
      <h2 className="mb-3 text-sm font-bold">🎯 Place Your Bet</h2>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {choices.map((c) => (
          <button
            key={c.value}
            onClick={() => setPicked(c)}
            className="rounded-2xl px-2 py-2.5 text-xs font-bold text-white shadow-sm transition-transform active:scale-95"
            style={{
              background: c.color,
              outline: picked?.value === c.value ? "3px solid hsl(var(--primary))" : "none",
              outlineOffset: 2,
            }}
          >
            {c.label}
            <span className="block text-[9px] font-normal opacity-90">{c.odds}x</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Amount</span>
        <div className="flex gap-1">
          {QUICK.map((q) => (
            <button key={q} onClick={() => setAmount(q)}
              className={`min-w-[40px] h-7 rounded-lg text-[11px] font-semibold ${amount === q ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Multiplier</span>
        <div className="flex gap-1">
          {[1, 5, 10, 20, 50].map((x) => (
            <button key={x} onClick={() => setMult(x)}
              className={`min-w-[38px] h-7 rounded-lg text-[11px] font-semibold ${mult === x ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"}`}>
              ×{x}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-muted px-3 py-2 mb-3 text-xs">
        <span className="text-muted-foreground">Total Stake</span>
        <span className="font-bold">{formatTaka(amount * mult, 0)}</span>
      </div>

      <button
        onClick={submit}
        disabled={busy || countdown.locked || !picked}
        className="w-full rounded-2xl bg-gradient-to-r from-primary to-accent py-3 text-sm font-bold text-primary-foreground shadow-md disabled:opacity-50 active:scale-[0.99] transition"
      >
        {busy ? "Placing…" : countdown.locked ? "Locked" : `Confirm ${mod.name} Bet`}
      </button>
    </section>
  );
};
export default BetPanelHost;
