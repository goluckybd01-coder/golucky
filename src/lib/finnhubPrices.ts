import { supabase } from "@/integrations/supabase/client";

export type LivePrice = { price: number; change: number };

export async function fetchFinnhubPrices(ids: string[]): Promise<Record<string, LivePrice>> {
  if (ids.length === 0) return {};
  return directFetch(ids);
}
// keep supabase import for potential future invoke usage
void supabase;

async function directFetch(ids: string[]): Promise<Record<string, LivePrice>> {
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finnhub-prices?ids=${encodeURIComponent(ids.join(","))}`;
    const r = await fetch(url, {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string}`,
      },
    });
    if (!r.ok) return {};
    const j = await r.json();
    return j.prices || {};
  } catch {
    return {};
  }
}
