import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { convertCurrency, type ConvertDirection, formatBDT, formatUSDT } from "@/lib/dualWalletService";

interface Props {
  balanceBDT: number;
  balanceUSDT: number;
  rate: number;
  onDone: () => void;
}

export default function CurrencySwapCard({ balanceBDT, balanceUSDT, rate, onDone }: Props) {
  const [dir, setDir] = useState<ConvertDirection>("bdt_to_usdt");
  const [amount, setAmount] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const num = Number(amount) || 0;
  const preview = useMemo(() => {
    if (dir === "bdt_to_usdt") return { from: formatBDT(num), to: formatUSDT(num / rate) };
    return { from: formatUSDT(num), to: formatBDT(num * rate) };
  }, [dir, num, rate]);

  const maxAmount = dir === "bdt_to_usdt" ? balanceBDT : balanceUSDT;

  const submit = async () => {
    if (num <= 0) return toast.error("Enter a valid amount");
    if (num > maxAmount) return toast.error("Insufficient balance");
    setBusy(true);
    const res = await convertCurrency(dir, num);
    setBusy(false);
    if (!res.success) return toast.error(res.error ?? "Convert failed");
    toast.success(`Converted ${preview.from} → ${preview.to}`);
    setAmount("");
    onDone();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="gl-glass gl-glass-cyan rounded-3xl p-5 md:p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] gl-text-dim">Currency Swap</div>
          <div className="text-sm gl-text">BDT ⇄ USDT · rate ৳{rate.toLocaleString()}</div>
        </div>
        <button
          onClick={() => setDir((d) => (d === "bdt_to_usdt" ? "usdt_to_bdt" : "bdt_to_usdt"))}
          data-clickable="true"
          className="gl-glass rounded-xl p-2.5 hover:scale-105 transition"
          aria-label="Flip direction"
        >
          <ArrowUpDown className="w-4 h-4 gl-text" />
        </button>
      </div>

      <div className="mt-4 rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="flex items-center justify-between text-[10px] gl-text-dim uppercase tracking-widest">
          <span>From ({dir === "bdt_to_usdt" ? "BDT" : "USDT"})</span>
          <button
            className="underline"
            data-clickable="true"
            onClick={() => setAmount(String(maxAmount))}
          >
            Max
          </button>
        </div>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          inputMode="decimal"
          placeholder="0.00"
          className="mt-1 w-full bg-transparent outline-none text-2xl gl-text tabular-nums"
        />
        <div className="text-xs gl-text-dim mt-1">
          You get <span className="gl-text">{preview.to}</span>
        </div>
      </div>

      <button
        onClick={submit}
        disabled={busy}
        data-clickable="true"
        className="mt-4 w-full rounded-xl py-3 text-sm font-semibold hover:scale-[1.01] transition disabled:opacity-50"
        style={{ background: "var(--gl-grad-gold)", color: "#1B1200" }}
      >
        {busy ? "Converting…" : "Swap Now"}
      </button>
    </motion.div>
  );
}
