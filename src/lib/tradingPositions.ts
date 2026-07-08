import { supabase } from "@/integrations/supabase/client";

export type TradePosition = {
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
};

export async function openTradePosition(params: {
  assetId: string;
  direction: "UP" | "DOWN";
  durationSec: 30 | 60 | 180 | 300;
  stakeBdt: number;
}) {
  const { data, error } = await supabase.rpc("open_trade_position", {
    p_asset_id: params.assetId,
    p_direction: params.direction,
    p_duration_sec: params.durationSec,
    p_stake_bdt: params.stakeBdt,
  });
  if (error) return { success: false, error: error.message } as const;
  return data as { success: boolean; error?: string; position_id?: string; open_price?: number; closes_at?: string; new_balance?: number };
}

export async function settleTradePosition(positionId: string) {
  const { data, error } = await supabase.rpc("settle_trade_position", {
    p_position_id: positionId,
  });
  if (error) return { success: false, error: error.message } as const;
  return data as { success: boolean; error?: string; result?: "win" | "loss" | "void"; payout_bdt?: number; pnl_bdt?: number; close_price?: number };
}

export async function fetchOwnOpenPositions(): Promise<TradePosition[]> {
  const { data } = await supabase
    .from("trade_positions")
    .select("*")
    .eq("status", "open")
    .order("closes_at", { ascending: true })
    .limit(20);
  return (data ?? []) as TradePosition[];
}

export async function fetchOwnHistory(limit = 20): Promise<TradePosition[]> {
  const { data } = await supabase
    .from("trade_positions")
    .select("*")
    .eq("status", "settled")
    .order("settled_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as TradePosition[];
}

export async function fetchFavorites(): Promise<string[]> {
  const { data } = await supabase.from("trading_favorites").select("asset_id");
  return (data ?? []).map(r => r.asset_id as string);
}

export async function toggleFavorite(assetId: string, on: boolean) {
  if (on) {
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) return;
    await supabase.from("trading_favorites").insert({ user_id: u.user.id, asset_id: assetId });
  } else {
    await supabase.from("trading_favorites").delete().eq("asset_id", assetId);
  }
}

export async function fetchAssetsFromDb() {
  const { data } = await supabase
    .from("trading_assets")
    .select("id,symbol,display_name,category,internal_price,base_price,decimals,sort_order,is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return data ?? [];
}
