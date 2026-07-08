import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Loader2, ShieldCheck, Clock } from "lucide-react";

interface Req {
  id: string;
  user_id: string;
  account_id: string;
  method: string;
  reason: string;
  status: string;
  old_value: any;
  new_value: any;
  created_at: string;
  admin_note: string | null;
  decided_at: string | null;
}

const WithdrawalAccountsAdmin = () => {
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [rows, setRows] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const q = supabase
      .from("withdrawal_account_change_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    const { data, error } = tab === "pending"
      ? await q.eq("status", "pending")
      : await q.in("status", ["approved", "rejected"]);
    if (error) toast.error(error.message);
    setRows((data as any) || []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const decide = async (id: string, decision: "approved" | "rejected") => {
    const note = decision === "rejected"
      ? window.prompt("Reason for rejection (optional):") || null
      : window.prompt("Admin note (optional):") || null;
    setBusy(id);
    try {
      const { data, error } = await supabase.rpc("decide_withdrawal_account_change", {
        p_request_id: id, p_decision: decision, p_admin_note: note,
      } as any);
      if (error) throw error;
      const res = data as any;
      if (!res?.success) { toast.error(res?.error || "Failed"); return; }
      toast.success(`Request ${decision}`);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally { setBusy(null); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="text-emerald-400" /> Withdrawal Account Requests
        </h1>
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          {(["pending", "history"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${tab === t ? "bg-emerald-500 text-black" : "text-white/70"}`}>
              {t === "pending" ? "Pending" : "History"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-white/50 text-sm">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/50">
          No {tab === "pending" ? "pending requests" : "history"}.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">{r.method}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      r.status === "pending" ? "bg-amber-400/10 border-amber-400/40 text-amber-300"
                      : r.status === "approved" ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                      : "bg-red-500/10 border-red-500/40 text-red-300"
                    }`}>{r.status.toUpperCase()}</span>
                    <span className="text-[10px] text-white/40">
                      <Clock size={10} className="inline mr-1" />
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-white/60">User: <span className="font-mono">{r.user_id.slice(0, 8)}…</span></div>
                  <div className="mt-2 grid gap-1 text-sm">
                    <div><span className="text-white/50">Old:</span> <span className="font-mono text-white/90">{JSON.stringify(r.old_value)}</span></div>
                    <div><span className="text-white/50">New:</span> <span className="font-mono text-amber-200">{JSON.stringify(r.new_value)}</span></div>
                    <div className="mt-1"><span className="text-white/50">Reason:</span> <span className="text-white/80">{r.reason}</span></div>
                    {r.admin_note && <div><span className="text-white/50">Admin note:</span> <span className="text-white/80">{r.admin_note}</span></div>}
                  </div>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => decide(r.id, "approved")} disabled={busy === r.id}
                      className="h-10 px-4 rounded-xl bg-emerald-500 text-black font-bold flex items-center gap-1.5 disabled:opacity-50">
                      {busy === r.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
                    </button>
                    <button onClick={() => decide(r.id, "rejected")} disabled={busy === r.id}
                      className="h-10 px-4 rounded-xl bg-red-500/90 text-white font-bold flex items-center gap-1.5 disabled:opacity-50">
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WithdrawalAccountsAdmin;
