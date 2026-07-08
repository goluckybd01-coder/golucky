import { motion } from "framer-motion";
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { formatBDT, formatUSDT } from "@/lib/dualWalletService";

interface Props {
  balanceBDT: number;
  balanceUSDT: number;
  onOpenSwap: () => void;
}

export default function MainWalletCard({ balanceBDT, balanceUSDT, onOpenSwap }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="gl-glass gl-glass-emerald rounded-3xl p-5 md:p-6 relative"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-9 h-9 rounded-xl grid place-items-center"
            style={{ background: "var(--gl-grad-emerald)" }}
          >
            <Wallet className="w-4 h-4" style={{ color: "#052015" }} />
          </span>
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] gl-text-dim">Main Wallet</div>
            <div className="text-sm gl-text">GoLucky Originals</div>
          </div>
        </div>
        <span
          className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full"
          style={{ background: "rgba(23,199,132,0.14)", color: "var(--gl-emerald-glow)" }}
        >
          Live
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="text-[10px] gl-text-dim uppercase tracking-widest">BDT</div>
          <div className="mt-1 text-xl md:text-2xl font-semibold gl-text tabular-nums">
            {formatBDT(balanceBDT)}
          </div>
        </div>
        <div className="rounded-2xl p-3" style={{ background: "rgba(36,214,255,0.06)" }}>
          <div className="text-[10px] gl-text-dim uppercase tracking-widest">USDT</div>
          <div className="mt-1 text-xl md:text-2xl font-semibold gl-text tabular-nums">
            {formatUSDT(balanceUSDT)}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Link
          to="/deposit"
          className="gl-glass rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-xs gl-text hover:scale-[1.02] transition"
        >
          <ArrowDownToLine className="w-3.5 h-3.5" style={{ color: "var(--gl-emerald)" }} />
          Deposit
        </Link>
        <Link
          to="/withdraw"
          className="gl-glass rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-xs gl-text hover:scale-[1.02] transition"
        >
          <ArrowUpFromLine className="w-3.5 h-3.5" style={{ color: "var(--gl-gold-soft)" }} />
          Withdraw
        </Link>
        <button
          onClick={onOpenSwap}
          data-clickable="true"
          className="gl-glass rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-xs gl-text hover:scale-[1.02] transition"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" style={{ color: "var(--gl-cyan)" }} />
          Swap
        </button>
      </div>
    </motion.div>
  );
}
