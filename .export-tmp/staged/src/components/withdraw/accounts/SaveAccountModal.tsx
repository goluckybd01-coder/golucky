import { useState } from "react";
import { X, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { WithdrawMethod } from "@/hooks/useWithdrawalAccounts";

interface Props {
  method: WithdrawMethod;
  onClose: () => void;
  onSaved: () => void;
}

const ERROR_MSG: Record<string, string> = {
  kyc_required: "KYC verification required for this method.",
  already_locked: "You already have a locked account for this method.",
  missing_ewallet_fields: "Please enter provider and mobile number.",
  usdt_trc20_required: "TRC20 address is required.",
  missing_novafi_address: "NovaFi wallet address is required.",
  missing_binance: "Enter Binance Pay ID or registered email.",
  invalid_method: "Invalid withdrawal method.",
  unauthenticated: "Please log in first.",
};

export const SaveAccountModal = ({ method, onClose, onSaved }: Props) => {
  const [provider, setProvider] = useState("bkash");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [binanceId, setBinanceId] = useState("");
  const [binanceEmail, setBinanceEmail] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const label =
    method === "ewallet" ? "E-Wallet" :
    method === "usdt" ? "USDT (TRC20)" :
    method === "novafi" ? "NovaFi Wallet" : "Binance Pay";

  const save = async () => {
    if (!confirm) return toast.error("Please confirm the account will be locked");
    setSaving(true);
    try {
      const device = navigator.userAgent.length > 60 ? navigator.userAgent.slice(0, 60) : navigator.userAgent;
      const { data, error } = await supabase.rpc("save_withdrawal_account", {
        p_method: method,
        p_provider: method === "ewallet" ? provider : null,
        p_account_name: accountName || null,
        p_account_number: method === "ewallet" ? accountNumber : null,
        p_wallet_address: method === "usdt" || method === "novafi" ? walletAddress.trim() : null,
        p_network: method === "usdt" ? "TRC20" : null,
        p_binance_pay_id: method === "binance" ? binanceId || null : null,
        p_binance_email: method === "binance" ? binanceEmail || null : null,
        p_user_agent: navigator.userAgent,
        p_device: device,
      } as any);
      if (error) throw error;
      const res = data as any;
      if (!res?.success) {
        toast.error(ERROR_MSG[res?.error] || "Failed to save account");
        return;
      }
      toast.success("Account saved & locked ✅");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-emerald-500/25 bg-[#0b0e0c] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-emerald-300">Add {label}</div>
            <div className="text-white font-bold">Withdrawal Account</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {method === "ewallet" && (
            <>
              <label className="text-[11px] uppercase tracking-wider text-white/50">Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full h-11 rounded-xl bg-white/[0.04] border border-white/10 px-3 text-white outline-none"
              >
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option>
              </select>
              <label className="text-[11px] uppercase tracking-wider text-white/50">Account Name</label>
              <input value={accountName} onChange={(e) => setAccountName(e.target.value)}
                placeholder="Full name as per KYC"
                className="w-full h-11 rounded-xl bg-white/[0.04] border border-white/10 px-3 text-white outline-none" />
              <label className="text-[11px] uppercase tracking-wider text-white/50">Mobile Number</label>
              <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 15))}
                placeholder="017XXXXXXXX" inputMode="numeric"
                className="w-full h-11 rounded-xl bg-white/[0.04] border border-white/10 px-3 text-white font-mono outline-none" />
            </>
          )}

          {method === "usdt" && (
            <>
              <div className="rounded-xl bg-amber-400/[0.06] border border-amber-400/25 p-3 text-[11px] text-amber-200/90">
                ⚠️ Only <b>TRC20</b> network is supported. Sending from any other network will result in permanent loss.
              </div>
              <label className="text-[11px] uppercase tracking-wider text-white/50">TRC20 Wallet Address</label>
              <input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="w-full h-11 rounded-xl bg-white/[0.04] border border-white/10 px-3 text-white font-mono text-sm outline-none" />
            </>
          )}

          {method === "novafi" && (
            <>
              <label className="text-[11px] uppercase tracking-wider text-white/50">NovaFi Wallet Address</label>
              <input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0xNovaFi..."
                className="w-full h-11 rounded-xl bg-white/[0.04] border border-white/10 px-3 text-white font-mono text-sm outline-none" />
            </>
          )}

          {method === "binance" && (
            <>
              <label className="text-[11px] uppercase tracking-wider text-white/50">Binance Pay ID</label>
              <input value={binanceId} onChange={(e) => setBinanceId(e.target.value.replace(/\D/g, "").slice(0, 20))}
                placeholder="123456789" inputMode="numeric"
                className="w-full h-11 rounded-xl bg-white/[0.04] border border-white/10 px-3 text-white font-mono outline-none" />
              <label className="text-[11px] uppercase tracking-wider text-white/50">OR Registered Email</label>
              <input value={binanceEmail} onChange={(e) => setBinanceEmail(e.target.value)}
                placeholder="name@example.com" type="email"
                className="w-full h-11 rounded-xl bg-white/[0.04] border border-white/10 px-3 text-white outline-none" />
            </>
          )}

          <label className="mt-3 flex items-start gap-2 text-xs text-white/70 cursor-pointer">
            <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)}
              className="mt-0.5 accent-emerald-500" />
            <span>I understand this account will be <b className="text-amber-300">permanently locked</b> and cannot be edited without support approval.</span>
          </label>
        </div>

        <div className="px-5 py-4 border-t border-white/10 flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-11 px-4 rounded-xl border border-white/10 text-white/70 hover:bg-white/5">Cancel</button>
          <button
            onClick={save}
            disabled={saving || !confirm}
            className="h-11 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={14} />}
            Save & Lock
          </button>
        </div>
      </div>
    </div>
  );
};
