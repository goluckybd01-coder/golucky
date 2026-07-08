import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { transferToProvider, transferFromProvider, formatBDT } from "@/lib/dualWalletService";

interface Props {
  balanceBDT: number;
  providerBalance: number;
  onDone: () => void;
}

type Dir = "main_to_provider" | "provider_to_main";

export default function QuickTransferCard({ balanceBDT, providerBalance, onDone }: Props) {
  const [dir, setDir] = useState<Dir>("main_to_provider");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const max = dir === "main_to_provider" ? balanceBDT : providerBalance;
  const num = Number(amount) || 0;

  const submit = async () => {
    if (num <= 0) return toast.error("Enter a valid amount");
    if (num > max) return toast.error("Insufficient balance");
    setBusy(true);
    const res =
      dir === "main_to_provider"
        ? await transferToProvider(num, "generic")
        : await transferFromProvider(num, "generic");
    setBusy(false);
    if (!res.success) return toast.error(res.error ?? "Transfer failed");
    toast.success("Transfer complete");
    setAmount("");
    onDone();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="gl-glass rounded-3xl p-5 md:p-6"
    >
      <div className="text-[10px] uppercase tracking-[0.24em] gl-text-dim">Quick Transfer</div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1 rounded-2xl p-3" style={{ background: "rgba(23,199,132,0.10)" }}>
          <div className="text-[10px] gl-text-dim uppercase tracking-widest">
            {dir === "main_to_provider" ? "From · Main" : "From · Provider"}
          </div>
          <div className="text-sm gl-text tabular-nums">
            {formatBDT(dir === "main_to_provider" ? balanceBDT : providerBalance)}
          </div>
        </div>
        <button
          onClick={() =>
            setDir((d) => (d === "main_to_provider" ? "provider_to_main" : "main_to_provider"))
          }
          data-clickable="true"
          className="gl-glass rounded-xl p-3 hover:scale-105 transition"
          aria-label="Flip direction"
        >
          <motion.div
            animate={{ rotate: dir === "main_to_provider" ? 0 : 180 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <ArrowRight className="w-4 h-4" style={{ color: "var(--gl-gold-soft)" }} />
          </motion.div>
        </button>
        <div className="flex-1 rounded-2xl p-3" style={{ background: "rgba(123,97,255,0.10)" }}>
          <div className="text-[10px] gl-text-dim uppercase tracking-widest">
            {dir === "main_to_provider" ? "To · Provider" : "To · Main"}
          </div>
          <div className="text-sm gl-text tabular-nums">
            {formatBDT(dir === "main_to_provider" ? providerBalance : balanceBDT)}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="flex items-center justify-between text-[10px] gl-text-dim uppercase tracking-widest">
          <span>Amount (BDT)</span>
          <button className="underline" data-clickable="true" onClick={() => setAmount(String(max))}>
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
      </div>

      <button
        onClick={submit}
        disabled={busy}
        data-clickable="true"
        className="mt-4 w-full rounded-xl py-3 text-sm font-semibold hover:scale-[1.01] transition disabled:opacity-50"
        style={{ background: "var(--gl-grad-emerald)", color: "#031B10" }}
      >
        {busy ? "Transferring…" : dir === "main_to_provider" ? "Transfer to Provider" : "Pull Back to Main"}
      </button>
    </motion.div>
  );
}
