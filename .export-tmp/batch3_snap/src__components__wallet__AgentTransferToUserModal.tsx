import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatTaka } from "@/lib/currency";
import { toast } from "sonner";
import { Search, X, Users, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

type DownlineUser = {
  user_id: string;
  uid: string | null;
  username: string | null;
  registered_at: string;
  total_deposit: number;
  total_withdraw: number;
  team_volume: number;
  commission_from_user: number;
  last_activity_at: string | null;
  status: string;
};

const QUICK = [100, 500, 1000, 5000, 10000];

export default function AgentTransferToUserModal({
  open,
  onClose,
  agentCommissionBalance,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  agentCommissionBalance: number;
  onSuccess?: () => void;
}) {
  const [users, setUsers] = useState<DownlineUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<DownlineUser | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("list_agent_users");
      if (cancelled) return;
      if (error) {
        toast.error("Failed to load downline");
        setUsers([]);
      } else {
        setUsers((data ?? []) as DownlineUser[]);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setPicked(null); setAmount(""); setNote(""); setQuery("");
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.uid ?? "").toLowerCase().includes(q) ||
      (u.username ?? "").toLowerCase().includes(q)
    );
  }, [users, query]);

  if (!open) return null;

  const amtNum = Number(amount);
  const canSubmit = picked && amtNum > 0 && amtNum <= agentCommissionBalance && amtNum <= 500000 && !submitting;

  const submit = async () => {
    if (!picked) return;
    if (!(amtNum > 0)) { toast.error("Enter a valid amount"); return; }
    if (amtNum > agentCommissionBalance) { toast.error("Insufficient commission balance"); return; }
    if (amtNum > 500000) { toast.error("Amount exceeds ৳500K cap"); return; }
    setSubmitting(true);
    const { data, error } = await supabase.rpc("agent_transfer_to_user", {
      p_referred_user_id: picked.user_id,
      p_amount: amtNum,
      p_note: note || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message || "Transfer failed"); return; }
    const res = data as any;
    if (!res?.ok) {
      const map: Record<string, string> = {
        unauthenticated: "Please sign in",
        invalid_amount: "Invalid amount",
        amount_exceeds_cap: "Exceeds ৳500K cap",
        not_in_downline: "User is not in your downline",
        agent_wallet_missing: "Agent wallet missing",
        insufficient_commission: "Insufficient commission balance",
      };
      toast.error(map[res?.error] ?? "Transfer failed");
      return;
    }
    toast.success(`Sent ${formatTaka(amtNum, 0)} · ${res.reference_id}`);
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center" onClick={onClose}>
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-t-3xl border border-purple-400/30 bg-[#0b1220] shadow-[0_35px_100px_-20px_rgba(218,41,251,0.5)] md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative border-b border-white/10 bg-gradient-to-br from-purple-600/25 via-rose-500/10 to-transparent p-4">
          <button onClick={onClose} className="absolute right-3 top-3 rounded-full border border-white/10 bg-white/5 p-1.5 text-white/60 hover:text-white">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-400/40 bg-purple-500/15 text-purple-200">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-200">Agent → User</div>
              <div className="text-lg font-black text-white">Transfer To User</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-purple-400/25 bg-white/[0.03] px-3 py-2 text-[11px]">
            <span className="text-white/60">Commission balance</span>
            <span className="font-black tabular-nums text-amber-200">{formatTaka(agentCommissionBalance, 0)}</span>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4">
          {!picked ? (
            <>
              <label className="mb-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <Search className="h-4 w-4 text-white/40" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by UID or username"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                />
              </label>
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-white/50">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading downline…
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-8 text-center text-xs text-white/50">
                  {users.length === 0 ? "No downline users yet." : "No match."}
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {filtered.slice(0, 40).map((u) => (
                    <li key={u.user_id}>
                      <button
                        onClick={() => setPicked(u)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 text-left transition hover:border-purple-400/40 hover:bg-white/[0.06]"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-white">{u.username || "—"}</div>
                          <div className="truncate text-[10px] text-white/50">
                            {u.uid ?? "no-uid"} · {u.status}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-white/45">Deposit</div>
                          <div className="text-xs font-black tabular-nums text-emerald-300">{formatTaka(u.total_deposit, 0)}</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-white/40" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between rounded-2xl border border-purple-400/25 bg-purple-500/5 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-white">{picked.username || "—"}</div>
                  <div className="truncate text-[10px] text-white/55">{picked.uid ?? ""}</div>
                </div>
                <button onClick={() => setPicked(null)} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black text-white/70 hover:text-white">
                  Change
                </button>
              </div>

              <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/45">Amount (BDT)</div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <span className="text-lg font-black text-amber-200">৳</span>
                <input
                  autoFocus
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="0"
                  className="w-full bg-transparent text-2xl font-black tabular-nums text-white placeholder:text-white/20 focus:outline-none"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK.map((q) => (
                  <button key={q} onClick={() => setAmount(String(q))}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black text-white/70 hover:border-purple-400/40 hover:text-white">
                    +{formatTaka(q, 0)}
                  </button>
                ))}
                <button onClick={() => setAmount(String(Math.min(500000, Math.floor(agentCommissionBalance))))}
                  className="rounded-full border border-amber-300/40 bg-amber-500/10 px-3 py-1 text-[10px] font-black text-amber-200 hover:bg-amber-500/20">
                  Max
                </button>
              </div>

              <div className="mt-3">
                <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-white/45">Note (optional)</div>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 120))}
                  placeholder="Reason / reference"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-400/40 focus:outline-none"
                />
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-500/5 p-2.5 text-[10px] text-emerald-200/90">
                <ShieldCheck className="h-3.5 w-3.5" />
                One-way transfer. Atomic ledger entry. Cap ৳500,000 per transfer.
              </div>
            </>
          )}
        </div>

        {picked && (
          <div className="border-t border-white/10 bg-black/40 p-3">
            <button
              disabled={!canSubmit}
              onClick={submit}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-amber-400 text-sm font-black text-black shadow-[0_18px_45px_-15px_rgba(218,41,251,0.6)] disabled:opacity-40"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {submitting ? "Sending…" : `Send ${amtNum > 0 ? formatTaka(amtNum, 0) : ""}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
