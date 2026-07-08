import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type WalletFeedEntry = {
  id: string;
  user: string;
  kind: string;
  what: string;
  amount: number;
  tone: string;
  ts: number;
  live?: boolean;
};

const EMERALD = "#12C665";
const GOLD_HI = "#FDE68A";
const BLUE = "#02B4FA";
const PURPLE = "#DA29FB";
const ROSE = "#F43F5E";

const TYPE_META: Record<string, { tone: string; kind: string; what: string }> = {
  deposit:  { tone: EMERALD, kind: "deposited",  what: "Deposit" },
  withdraw: { tone: BLUE,    kind: "withdrew",   what: "Withdraw" },
  transfer: { tone: PURPLE,  kind: "transferred",what: "Transfer" },
  bonus:    { tone: GOLD_HI, kind: "received",   what: "Bonus" },
  win:      { tone: GOLD_HI, kind: "won",        what: "Game Win" },
  referral: { tone: ROSE,    kind: "earned",     what: "Referral" },
};

function maskUserId(uid: string | null): string {
  if (!uid) return "Anonymous";
  const tail = uid.replace(/-/g, "").slice(-4).toUpperCase();
  return `GLU★${tail}`;
}

/**
 * Live wallet activity feed — pure DB, no mock/demo entries.
 * Returns [] when there is no live activity.
 */
export function useWalletFeed(limit = 24): WalletFeedEntry[] {
  const [entries, setEntries] = useState<WalletFeedEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchLive = async () => {
      try {
        const { data, error } = await supabase
          .from("wallet_transactions")
          .select("id, user_id, type, amount, created_at")
          .in("type", ["deposit", "withdraw", "bonus", "win", "referral"])
          .gt("amount", 0)
          .order("created_at", { ascending: false })
          .limit(limit);
        if (error || !data || cancelled) return;
        const live: WalletFeedEntry[] = data.map((r: any) => {
          const meta = TYPE_META[r.type] ?? { tone: GOLD_HI, kind: "moved", what: String(r.type) };
          return {
            id: `db-${r.id}`,
            user: maskUserId(r.user_id),
            kind: meta.kind,
            what: meta.what,
            amount: Number(r.amount) || 0,
            tone: meta.tone,
            ts: new Date(r.created_at).getTime(),
            live: true,
          };
        });
        if (!cancelled) setEntries(live);
      } catch {
        /* leave empty */
      }
    };
    fetchLive();
    const t = setInterval(fetchLive, 5000);
    return () => { cancelled = true; clearInterval(t); };
  }, [limit]);

  return entries;
}
