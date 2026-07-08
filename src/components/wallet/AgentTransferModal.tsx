import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Send, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  agentBalance: number;
  onSuccess?: (newBalance: number) => void;
}

const QUICK = [100, 500, 1000, 5000, 10000];

export default function AgentTransferModal({ open, onClose, agentBalance, onSuccess }: Props) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setRecipient("");
    setAmount("");
    setNote("");
  };

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!recipient.trim()) return toast.error("Recipient ID/Username required");
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (amt > agentBalance) return toast.error("Insufficient balance");

    setLoading(true);
    try {
      const clientRef = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const { data, error } = await supabase.rpc("agent_transfer_to_user", {
        p_recipient_identifier: recipient.trim(),
        p_amount: amt,
        p_note: note.trim() || null,
        p_client_ref: clientRef,
      });
      if (error) throw error;
      const res = data as { success: boolean; error?: string; new_balance?: number };
      if (!res?.success) throw new Error(res?.error || "Transfer failed");

      toast.success(`৳${amt.toLocaleString()} sent successfully`);
      onSuccess?.(res.new_balance ?? agentBalance - amt);
      reset();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-t-3xl sm:rounded-2xl p-5 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Send className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold">Transfer to User</h3>
                  <p className="text-xs text-slate-400">Agent → User top-up</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-3 mb-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">Your balance</span>
              <span className="font-semibold text-amber-300">৳{agentBalance.toLocaleString()}</span>
            </div>

            <label className="text-xs text-slate-400">Recipient (User ID / Username / Email)</label>
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="GLU-2024-000123"
              className="w-full mt-1 mb-3 px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 focus:border-amber-500 outline-none text-sm"
            />

            <label className="text-xs text-slate-400">Amount (৳)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full mt-1 mb-2 px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 focus:border-amber-500 outline-none text-lg font-bold"
            />

            <div className="flex flex-wrap gap-2 mb-3">
              {QUICK.map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/50"
                >
                  ৳{v.toLocaleString()}
                </button>
              ))}
            </div>

            <label className="text-xs text-slate-400">Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={120}
              className="w-full mt-1 mb-4 px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 focus:border-amber-500 outline-none text-sm"
            />

            <button
              disabled={loading}
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send <ArrowRight className="w-4 h-4" /></>}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
