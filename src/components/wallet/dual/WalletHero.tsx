import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";
import { formatBDT, formatUSDT } from "@/lib/dualWalletService";

interface Props {
  balanceBDT: number;
  balanceUSDT: number;
  providerBalance: number;
  rate: number;
  onRefresh: () => void;
  isLoading?: boolean;
}

export default function WalletHero({
  balanceBDT,
  balanceUSDT,
  providerBalance,
  rate,
  onRefresh,
  isLoading,
}: Props) {
  const totalBDT = balanceBDT + balanceUSDT * rate + providerBalance;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="gl-glass gl-glass-gold rounded-3xl p-6 md:p-8 relative overflow-hidden"
    >
      <div className="decorative absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-40"
           style={{ background: "var(--gl-grad-gold)" }} />
      <div className="flex items-start justify-between relative">
        <div>
          <div className="flex items-center gap-2 gl-text-dim text-xs uppercase tracking-[0.24em]">
            <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--gl-gold-soft)" }} />
            Total Portfolio Value
          </div>
          <h1 className="gradient-title mt-3 text-3xl md:text-5xl">
            {formatBDT(totalBDT)}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="gl-glass rounded-full px-3 py-1 gl-text-dim">
              1 USDT = ৳{rate.toLocaleString()}
            </span>
            <span className="gl-glass-emerald rounded-full px-3 py-1">
              BDT {formatBDT(balanceBDT)}
            </span>
            <span className="gl-glass-cyan rounded-full px-3 py-1">
              USDT {formatUSDT(balanceUSDT)}
            </span>
            <span className="gl-glass-purple rounded-full px-3 py-1">
              Provider {formatBDT(providerBalance)}
            </span>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="gl-glass rounded-2xl p-3 hover:scale-105 transition"
          aria-label="Refresh balances"
          data-clickable="true"
        >
          <RefreshCw className={`w-4 h-4 gl-text ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </motion.section>
  );
}
