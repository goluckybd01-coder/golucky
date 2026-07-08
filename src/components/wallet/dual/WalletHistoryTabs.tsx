import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT, formatUSDT } from "@/lib/dualWalletService";
import { Loader2 } from "lucide-react";

type TabKey = "all" | "swap" | "transfer" | "provider";

const TABS: { key: TabKey; label: string; filter: (d: any) => boolean }[] = [
  { key: "all", label: "All", filter: () => true },
  { key: "swap", label: "Swaps", filter: (d) => d.direction?.includes("_to_") && d.direction?.startsWith("bdt") || d.direction?.startsWith("usdt") },
  { key: "transfer", label: "Transfers", filter: (d) => d.direction?.includes("provider") },
  { key: "provider", label: "Provider Only", filter: (d) => d.provider_code },
];

export default function WalletHistoryTabs({ userId }: { userId: string | null }) {
  const [rows, setRows] = useState<any[]>([]);
  const [tab, setTab] = useState<TabKey>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("wallet_transfers_v2" as any)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!cancelled) {
        setRows((data as any[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const active = TABS.find((t) => t.key === tab)!;
  const filtered = rows.filter(active.filter);

  return (
    <div className="gl-glass rounded-3xl p-5 md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-[0.24em] gl-text-dim">Transaction History</h2>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            data-clickable="true"
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition ${
              tab === t.key ? "gl-glass-gold gl-text" : "gl-glass gl-text-dim hover:gl-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-4 h-4 animate-spin gl-text-dim" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-xs gl-text-dim">No transactions yet</div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl px-4 py-3 flex items-center justify-between"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <div>
                <div className="text-xs gl-text">{labelFor(r.direction)}</div>
                <div className="text-[10px] gl-text-dim mt-0.5">
                  {new Date(r.created_at).toLocaleString()} · ref {r.reference_id?.slice(-8)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm gl-text tabular-nums">
                  {r.currency === "USDT"
                    ? formatUSDT(Number(r.amount_usdt))
                    : formatBDT(Number(r.amount_bdt))}
                </div>
                <div className="text-[10px] uppercase tracking-widest" style={statusColor(r.status)}>
                  {r.status}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function labelFor(dir: string) {
  switch (dir) {
    case "bdt_to_usdt": return "Swap · BDT → USDT";
    case "usdt_to_bdt": return "Swap · USDT → BDT";
    case "main_to_provider": return "Transfer · Main → Provider";
    case "provider_to_main": return "Transfer · Provider → Main";
    default: return dir;
  }
}
function statusColor(s: string): React.CSSProperties {
  if (s === "success") return { color: "var(--gl-emerald-glow)" };
  if (s === "failed") return { color: "var(--gl-danger)" };
  return { color: "var(--gl-gold-soft)" };
}
