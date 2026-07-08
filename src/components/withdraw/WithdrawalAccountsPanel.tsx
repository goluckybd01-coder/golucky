import { useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { useWithdrawalAccounts, type WithdrawMethod, type LockedAccount } from "@/hooks/useWithdrawalAccounts";
import { AccountCard } from "./accounts/AccountCard";
import { KycLockedCard } from "./accounts/KycLockedCard";
import { SaveAccountModal } from "./accounts/SaveAccountModal";
import { ChangeRequestModal } from "./accounts/ChangeRequestModal";

const METHODS: WithdrawMethod[] = ["ewallet", "novafi", "usdt", "binance"];
const LABELS: Record<WithdrawMethod, string> = {
  ewallet: "E-Wallet",
  novafi: "NovaFi Wallet",
  usdt: "USDT (TRC20)",
  binance: "Binance Pay",
};

export const WithdrawalAccountsPanel = () => {
  const { getFor, kycVerified, loading, reload, hasPending } = useWithdrawalAccounts();
  const [saveMethod, setSaveMethod] = useState<WithdrawMethod | null>(null);
  const [changeAcc, setChangeAcc] = useState<LockedAccount | null>(null);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 animate-pulse text-white/40 text-sm">
        Loading your withdrawal accounts…
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            Your Withdrawal Accounts
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Each method locks to one permanent account for maximum security.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {METHODS.map((m) => {
          const acc = getFor(m);
          const needsKyc = m !== "ewallet" && !kycVerified;

          if (acc) {
            return (
              <AccountCard
                key={m}
                account={acc}
                hasPendingChange={hasPending(acc.id)}
                onRequestChange={() => setChangeAcc(acc)}
              />
            );
          }
          if (needsKyc) {
            return <KycLockedCard key={m} method={m} />;
          }
          return (
            <button
              key={m}
              onClick={() => setSaveMethod(m)}
              className="group rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-left hover:border-emerald-500/40 hover:bg-emerald-500/[0.03] transition min-h-[128px] flex flex-col items-start justify-between"
            >
              <span className="text-[11px] uppercase tracking-widest text-white/40 font-semibold">
                {LABELS[m]}
              </span>
              <span className="inline-flex items-center gap-2 text-emerald-300 font-bold">
                <Plus size={16} /> Add & Lock
              </span>
            </button>
          );
        })}
      </div>

      {saveMethod && (
        <SaveAccountModal
          method={saveMethod}
          onClose={() => setSaveMethod(null)}
          onSaved={reload}
        />
      )}
      {changeAcc && (
        <ChangeRequestModal
          account={changeAcc}
          onClose={() => setChangeAcc(null)}
          onSubmitted={reload}
        />
      )}
    </div>
  );
};
