import { Lock, ShieldCheck, Copy, Check, Clock } from "lucide-react";
import { useState } from "react";
import type { LockedAccount, WithdrawMethod } from "@/hooks/useWithdrawalAccounts";
import { toast } from "sonner";

const METHOD_LABEL: Record<WithdrawMethod, string> = {
  ewallet: "E-Wallet",
  novafi: "NovaFi Wallet",
  usdt: "USDT (TRC20)",
  binance: "Binance Pay",
};

interface Props {
  account: LockedAccount;
  hasPendingChange: boolean;
  onRequestChange: () => void;
}

export const AccountCard = ({ account, hasPendingChange, onRequestChange }: Props) => {
  const [copied, setCopied] = useState(false);

  const primaryValue =
    account.method === "ewallet" ? account.account_number :
    account.method === "usdt" ? account.wallet_address :
    account.method === "novafi" ? account.wallet_address :
    account.binance_pay_id || account.binance_email;

  const subLabel =
    account.method === "ewallet" ? (account.provider || "").toUpperCase() :
    account.method === "usdt" ? `Network: ${account.network || "TRC20"}` :
    account.method === "novafi" ? "NovaFi Address" :
    account.binance_pay_id ? "Binance Pay ID" : "Binance Email";

  const copy = async () => {
    if (!primaryValue) return;
    await navigator.clipboard.writeText(primaryValue);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="relative rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.06] via-white/[0.02] to-amber-400/[0.04] p-5 shadow-[0_0_40px_-15px_rgba(0,230,118,0.35)] backdrop-blur-xl">
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-amber-400/10 pointer-events-none" />

      <div className="flex items-start justify-between gap-3 relative">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">
              {METHOD_LABEL[account.method]}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              <ShieldCheck size={10} /> VERIFIED
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 border border-amber-400/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              <Lock size={10} /> LOCKED
            </span>
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-wider text-white/40">{subLabel}</div>
          <div className="mt-1 font-mono text-base font-bold text-white tabular-nums break-all">
            {primaryValue || "—"}
          </div>
          {account.account_name && account.method === "ewallet" && (
            <div className="mt-1 text-xs text-white/60">Name: {account.account_name}</div>
          )}
        </div>

        <button
          onClick={copy}
          className="shrink-0 w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center hover:bg-white/[0.12] transition"
          aria-label="Copy"
        >
          {copied ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 relative">
        <p className="text-[11px] text-white/50 leading-snug">
          Your withdrawal account is protected for security reasons. To change it, submit a request for support review.
        </p>
        {hasPendingChange ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/10 border border-amber-400/30 px-3 py-1.5 text-[11px] font-bold text-amber-300 whitespace-nowrap">
            <Clock size={12} /> Pending Review
          </span>
        ) : (
          <button
            onClick={onRequestChange}
            className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-white/80 hover:bg-white/[0.06] whitespace-nowrap"
          >
            Request Change
          </button>
        )}
      </div>
    </div>
  );
};
