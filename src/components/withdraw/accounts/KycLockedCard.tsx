import { Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { WithdrawMethod } from "@/hooks/useWithdrawalAccounts";

const LABEL: Record<WithdrawMethod, string> = {
  ewallet: "E-Wallet",
  novafi: "NovaFi Wallet",
  usdt: "USDT (TRC20)",
  binance: "Binance Pay",
};

export const KycLockedCard = ({ method }: { method: WithdrawMethod }) => {
  const nav = useNavigate();
  return (
    <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-black/40 p-5 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(246,196,69,0.10),transparent_60%)]" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 border border-amber-400/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
            <Lock size={10} /> KYC REQUIRED
          </span>
          <span className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">
            {LABEL[method]}
          </span>
        </div>
        <h3 className="mt-3 text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck size={18} className="text-amber-300" /> Verify to Unlock
        </h3>
        <p className="mt-1 text-xs text-white/60 leading-relaxed">
          Complete KYC verification to unlock crypto & premium withdrawal methods with instant processing.
        </p>
        <button
          onClick={() => nav("/kyc")}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-bold text-black hover:brightness-110"
        >
          Go to KYC <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
