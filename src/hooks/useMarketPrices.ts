import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketPrice {
  id: string;
  symbol: string;
  base_code: string;
  quote_code: string;
  display_name: string;
  category: "internal" | "crypto" | "forex" | "commodity";
  is_admin_controlled: boolean;
  decimals: number;
  price: number;
  change_24h: number;
  volume_24h: number;
  high_24h: number | null;
  low_24h: number | null;
  source: string;
  updated_at: string;
}

interface MarketPricesResponse {
  success: boolean;
  prices: MarketPrice[];
  generated_at: string;
  error?: string;
}

/**
 * Live market prices for all GoLucky tradable assets.
 * Refetched every 10s; server caches upstream APIs for 30s.
 * Ready for WebSocket upgrade — swap the queryFn with a subscription.
 */
export function useMarketPrices(refetchMs = 10_000) {
  return useQuery<MarketPricesResponse>({
    queryKey: ["market-prices"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<MarketPricesResponse>(
        "market-prices",
      );
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to load prices");
      return data;
    },
    refetchInterval: refetchMs,
    staleTime: 5_000,
  });
}

export function formatPriceUSD(price: number, decimals = 2): string {
  if (!Number.isFinite(price)) return "—";
  if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${price.toFixed(decimals)}`;
}
