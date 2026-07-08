import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { LockedAccount } from "@/hooks/useWithdrawalAccounts";

interface Props {
  account: LockedAccount;
  onClose: () => void;
  onSubmitted: () => void;
}

export const ChangeRequestModal = ({ account, onClose, onSubmitted }: Props) => {
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!newValue.trim()) return toast.error("Enter the new account value");
    if (reason.trim().length < 10) return toast.error("Reason must be at least 10 characters");
    setSubmitting(true);
    try {
      const payload: Record<string, string> = {};
      if (account.method === "ewallet") { payload.provider = account.provider || ""; payload.account_number = newValue.trim(); }
      if (account.method === "usdt") { payload.wallet_address = newValue.trim(); payload.network = "TRC20"; }
      if (account.method === "novafi") { payload.wallet_address = newValue.trim(); }
      if (account.method === "binance") { payload.binance_pay_id = newValue.trim(); }

      const { data, error } = await supabase.rpc("request_withdrawal_account_change", {
        p_account_id: account.id,
        p_new_value: payload,
        p_reason: reason.trim(),
        p_user_agent: navigator.userAgent,
      } as any);
      if (error) throw error;
      const res = data as any;
      if (!res?.success) { toast.error(res?.error || "Failed"); return; }
      toast.success("Change request submitted for review");
      onSubmitted();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-amber-400/30 bg-[#0e0b06] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-amber-300">Request Change</div>
            <div className="text-white font-bold">{account.method.toUpperCase()}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="text-xs text-white/60">
            Current: <span className="font-mono text-white/80">{account.account_number || account.wallet_address || account.binance_pay_id || account.binance_email}</span>
          </div>
          <label className="text-[11px] uppercase tracking-wider text-white/50">New Value</label>
          <input value={newValue} onChange={(e) => setNewValue(e.target.value)}
            placeholder="Enter new account details"
            className="w-full h-11 rounded-xl bg-white/[0.04] border border-white/10 px-3 text-white font-mono text-sm outline-none" />
          <label className="text-[11px] uppercase tracking-wider text-white/50">Reason (min. 10 chars)</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)}
            rows={3} placeholder="Why do you need to change this account?"
            className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-white text-sm outline-none resize-none" />
          <p className="text-[11px] text-white/50">Your current account remains active until an admin approves this request.</p>
        </div>
        <div className="px-5 py-4 border-t border-white/10 flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-11 px-4 rounded-xl border border-white/10 text-white/70 hover:bg-white/5">Cancel</button>
          <button onClick={submit} disabled={submitting}
            className="h-11 px-5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold flex items-center gap-2 disabled:opacity-50">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
};
