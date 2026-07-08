import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { markRealtimeActivity } from "@/lib/realtimeActivity";

function useAuthUserId() {
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => { if (alive) setUid(data.user?.id ?? null); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUid(s?.user?.id ?? null));
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);
  return uid;
}

export interface TradePosition {
  id: string;
  user_id: string;
  asset_id: string;
  symbol: string;
  direction: "UP" | "DOWN";
  duration_sec: number;
  stake_bdt: number;
  stake_usd: number;
  open_price: number;
  close_price: number | null;
  payout_ratio: number;
  payout_bdt: number | null;
  pnl_bdt: number | null;
  status: "open" | "settled" | "void";
  result: "win" | "loss" | "void" | null;
  opens_at: string;
  closes_at: string;
  settled_at: string | null;
  forced: boolean;
  created_at: string;
}

export function useTradePositions() {
  const userId = useAuthUserId();
  const qc = useQueryClient();

  const query = useQuery<TradePosition[]>({
    queryKey: ["trade-positions", userId],
    enabled: !!userId,
    refetchInterval: 3000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trade_positions")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      markRealtimeActivity();
      return (data as unknown as TradePosition[]) || [];
    },
  });

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`trade-positions-${userId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trade_positions", filter: `user_id=eq.${userId}` },
        () => {
          markRealtimeActivity();
          qc.invalidateQueries({ queryKey: ["trade-positions", userId] });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, qc]);

  const open = (query.data || []).filter((p) => p.status === "open");
  const history = (query.data || []).filter((p) => p.status !== "open");

  return { ...query, open, history };
}
