import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RewardFeedEntry = {
  id: string;
  user: string;       // masked handle
  kind: string;       // Cashback, VIP Bonus, Mystery Box, ...
  amount: number;     // BDT
  tone: string;       // hex accent color
  ts: number;         // epoch ms
  live?: boolean;     // true if from DB, false if mock
};

const EMERALD = "#12C665";
const GOLD_HI = "#FDE68A";
const BLUE = "#02B4FA";
const PURPLE = "#DA29FB";
const ROSE = "#F43F5E";

// Rotating mock pool — always shown alongside real data so the ticker
// never looks empty. Bengali-first names to match the spec.
const MOCK: Omit<RewardFeedEntry, "id" | "ts">[] = [
  { user: "Farhan",  kind: "claimed Cashback",    amount: 2500,  tone: EMERALD, live: false },
  { user: "Sakib",   kind: "redeemed Mystery Box", amount: 15000, tone: ROSE,    live: false },
  { user: "Nayeem",  kind: "claimed VIP Bonus",   amount: 12000, tone: PURPLE,  live: false },
  { user: "Tanvir",  kind: "claimed FD Milestone", amount: 25000, tone: GOLD_HI, live: false },
  { user: "Reza",    kind: "unlocked Achievement", amount: 1000,  tone: EMERALD, live: false },
  { user: "Nafis",   kind: "earned Referral",     amount: 2100,  tone: BLUE,    live: false },
  { user: "Rakib★H", kind: "claimed Cashback",    amount: 4800,  tone: EMERALD, live: false },
  { user: "Anonymous", kind: "opened Golden Envelope", amount: 8200, tone: GOLD_HI, live: false },
];

const TONE_BY_TYPE: Record<string, string> = {
  win: GOLD_HI,
  referral: BLUE,
  bonus: PURPLE,
};

const KIND_BY_TYPE: Record<string, string> = {
  win: "won",
  referral: "earned Referral",
  bonus: "claimed Bonus",
};

function maskUserId(uid: string | null): string {
  if (!uid) return "Anonymous";
  const tail = uid.replace(/-/g, "").slice(-4).toUpperCase();
  return `GLU★${tail}`;
}

function seedMock(): RewardFeedEntry[] {
  const now = Date.now();
  return MOCK.map((m, i) => ({
    ...m,
    id: `mock-${i}`,
    ts: now - i * 30_000,
  }));
}

/**
 * Live reward-winners feed. Polls `wallet_transactions` every 5s for the
 * newest reward-type rows, merges them with a rotating mock pool so the
 * ticker is never empty, and returns entries sorted newest-first.
 */
export function useRewardsFeed(limit = 20): RewardFeedEntry[] {
  const [entries, setEntries] = useState<RewardFeedEntry[]>(() => seedMock());

  useEffect(() => {
    let cancelled = false;

    const fetchLive = async () => {
      try {
        const { data, error } = await supabase
          .from("wallet_transactions")
          .select("id, user_id, type, amount, created_at")
          .in("type", ["win", "referral", "bonus"])
          .gt("amount", 0)
          .order("created_at", { ascending: false })
          .limit(limit);
        if (error || !data || cancelled) return;
        const live: RewardFeedEntry[] = data.map((r: any) => ({
          id: `db-${r.id}`,
          user: maskUserId(r.user_id),
          kind: KIND_BY_TYPE[r.type] ?? String(r.type),
          amount: Number(r.amount) || 0,
          tone: TONE_BY_TYPE[r.type] ?? GOLD_HI,
          ts: new Date(r.created_at).getTime(),
          live: true,
        }));
        // Merge live + mock, dedupe by id, sort newest-first.
        setEntries((prev) => {
          const map = new Map<string, RewardFeedEntry>();
          for (const e of [...live, ...seedMock(), ...prev]) map.set(e.id, e);
          return Array.from(map.values())
            .sort((a, b) => b.ts - a.ts)
            .slice(0, limit);
        });
      } catch {
        /* keep mock */
      }
    };

    fetchLive();
    const t = setInterval(fetchLive, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [limit]);

  return entries;
}
