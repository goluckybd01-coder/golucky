/**
 * IndiaLotteryAPI hybrid-mode result service for WinGo.
 *
 * - When game_admin_settings.result_source = 'api', the engine uses results
 *   fetched from IndiaLotteryAPI (proxied via the wingo-indialottery edge
 *   function to avoid CORS).
 * - Each WinGo duration (0.5/1/3/5) maps to the matching API market.
 * - Any failure (network, parse, missing) returns null so the caller falls
 *   back to the local Own-RNG generator.
 */

import { supabase } from "@/integrations/supabase/client";
import type { WinGoDuration } from "@/lib/winGoRoundEngine";

type ResultSource = "rng" | "api";

interface WinGoConfig {
  result_source: ResultSource;
  api_market: "0.5" | "1" | "3" | "5";
}

const CONFIG_TTL_MS = 15_000;
const RESULT_TTL_MS = 90_000;

let configCache: { value: WinGoConfig; at: number } | null = null;
const resultCache = new Map<string, { value: number | null; at: number }>();

const durationToMarket = (d: WinGoDuration): string =>
  d === 0.5 ? "0.5" : String(d);

const gameTypeToDuration = (gameType: string): WinGoDuration => {
  if (gameType === "30sec") return 0.5;
  if (gameType === "1min") return 1;
  if (gameType === "3min") return 3;
  if (gameType === "5min") return 5;
  return 1;
};

export const getWinGoConfig = async (): Promise<WinGoConfig> => {
  const now = Date.now();
  if (configCache && now - configCache.at < CONFIG_TTL_MS) {
    return configCache.value;
  }
  try {
    const { data } = await supabase
      .from("game_admin_settings")
      .select("result_source, api_market")
      .eq("game_type", "wingo")
      .maybeSingle();
    const value: WinGoConfig = {
      result_source: (data?.result_source as ResultSource) ?? "rng",
      api_market: (data?.api_market as WinGoConfig["api_market"]) ?? "1",
    };
    configCache = { value, at: now };
    return value;
  } catch {
    const fallback: WinGoConfig = { result_source: "rng", api_market: "1" };
    configCache = { value: fallback, at: now };
    return fallback;
  }
};

export const invalidateWinGoConfigCache = () => {
  configCache = null;
};

const callApi = async (
  endpoint: "next" | "predict",
  market: string,
): Promise<unknown | null> => {
  try {
    const { data, error } = await supabase.functions.invoke(
      `wingo-indialottery/${endpoint}?market=${market}&n=1`,
      { method: "GET" },
    );
    if (error) return null;
    if (!data || (data as { success?: boolean }).success === false) return null;
    return (data as { data?: unknown }).data ?? data;
  } catch {
    return null;
  }
};

const extractDigit = (payload: unknown): number | null => {
  if (payload == null) return null;
  const tryNum = (v: unknown): number | null => {
    if (typeof v === "number" && v >= 0 && v <= 9 && Number.isInteger(v)) return v;
    if (typeof v === "string") {
      const n = parseInt(v, 10);
      if (!isNaN(n) && n >= 0 && n <= 9) return n;
    }
    return null;
  };
  const pickFromObj = (o: Record<string, unknown> | null | undefined): number | null => {
    if (!o) return null;
    return tryNum(o.digit) ?? tryNum(o.number) ?? tryNum(o.result) ?? null;
  };
  if (Array.isArray(payload)) {
    return pickFromObj(payload[0] as Record<string, unknown>);
  }
  const obj = payload as Record<string, unknown>;
  const direct = pickFromObj(obj);
  if (direct !== null) return direct;
  const list =
    (obj?.predictions as unknown[] | undefined) ||
    (obj?.items as unknown[] | undefined) ||
    (Array.isArray(obj?.data) ? (obj.data as unknown[]) : undefined);
  if (list && list.length) return pickFromObj(list[0] as Record<string, unknown>);
  return null;
};

export const fetchApiResultForRound = async (
  gameType: string,
  tradeId: string,
): Promise<number | null> => {
  const cfg = await getWinGoConfig();
  if (cfg.result_source !== "api") return null;

  const cacheKey = `${gameType}:${tradeId}`;
  const now = Date.now();
  const cached = resultCache.get(cacheKey);
  if (cached && now - cached.at < RESULT_TTL_MS) return cached.value;

  const market = durationToMarket(gameTypeToDuration(gameType));
  const payload = await callApi("predict", market);
  const digit = extractDigit(payload);

  resultCache.set(cacheKey, { value: digit, at: now });
  if (digit === null) {
    console.warn(`[WinGoAPI] No usable result for ${gameType}/${tradeId} — falling back to RNG`);
  } else {
    console.log(`[WinGoAPI] Using IndiaLotteryAPI result ${digit} for ${gameType}/${tradeId}`);
  }
  return digit;
};

export const logWinGoRoundSource = async (
  gameType: string,
  tradeId: string,
  resultNumber: number,
  source: "api" | "rng",
): Promise<void> => {
  try {
    const colors: string[] = [];
    if ([1, 3, 7, 9].includes(resultNumber)) colors.push("green");
    if ([2, 4, 6, 8].includes(resultNumber)) colors.push("red");
    if ([0, 5].includes(resultNumber)) colors.push("violet");
    await supabase.from("game_rounds").upsert(
      {
        game_type: "wingo",
        game_mode: gameType,
        trade_id: tradeId,
        result: String(resultNumber),
        result_color: colors.join(","),
        result_source: source,
      },
      { onConflict: "trade_id", ignoreDuplicates: true },
    );
  } catch (err) {
    console.warn("[WinGoAPI] logWinGoRoundSource failed (non-fatal):", err);
  }
};
