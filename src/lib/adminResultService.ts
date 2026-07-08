/**
 * Admin Result Service
 * 
 * Checks for admin-set results in the game_rounds table.
 * If an admin has set a result via Live Result Control, 
 * the game should use that result instead of generating one locally.
 */

import { supabase } from "@/integrations/supabase/client";

interface AdminResult {
  result: string;
  result_color?: string;
}

// Cache for admin results (cleared on each round change)
const adminResultCache = new Map<string, AdminResult | null>();
const cacheTimestamps = new Map<string, number>();
const CACHE_TTL = 5000; // 5 seconds cache

/**
 * Check if an admin has set a result for a specific trade/round
 * Returns the admin-set result if found, null otherwise
 */
export const getAdminSetResult = async (
  gameType: string,
  gameMode: string,
  tradeId: string
): Promise<AdminResult | null> => {
  const cacheKey = `${gameType}:${gameMode}:${tradeId}`;
  
  // Check cache first
  const cached = adminResultCache.get(cacheKey);
  const cachedAt = cacheTimestamps.get(cacheKey);
  if (cached !== undefined && cachedAt && Date.now() - cachedAt < CACHE_TTL) {
    return cached;
  }
  
  try {
    const { data, error } = await supabase
      .from('game_rounds')
      .select('result, result_color')
      .eq('game_type', gameType)
      .eq('game_mode', gameMode)
      .eq('trade_id', tradeId)
      .maybeSingle();
    
    if (error) {
      console.error('[AdminResultService] Error fetching admin result:', error);
      return null;
    }
    
    const result = data ? { result: data.result, result_color: data.result_color } : null;
    
    // Cache the result
    adminResultCache.set(cacheKey, result);
    cacheTimestamps.set(cacheKey, Date.now());
    
    if (result) {
      console.log(`[AdminResultService] Found admin-set result for ${gameType}/${gameMode}/${tradeId}: ${result.result}`);
    }
    
    return result;
  } catch (err) {
    console.error('[AdminResultService] Exception fetching admin result:', err);
    return null;
  }
};

/**
 * Parse a WinGo/TrxWin result string to a number (0-9)
 */
export const parseWinGoResult = (result: string): number | null => {
  const num = parseInt(result);
  if (isNaN(num) || num < 0 || num > 9) return null;
  return num;
};

/**
 * Parse a K3 result string to dice array
 * Format: "1,2,3" or "[1,2,3]"
 */
export const parseK3Result = (result: string): [number, number, number] | null => {
  try {
    let dice: number[];
    if (result.startsWith('[')) {
      dice = JSON.parse(result);
    } else {
      dice = result.split(',').map(s => parseInt(s.trim()));
    }
    
    if (dice.length !== 3) return null;
    if (!dice.every(d => d >= 1 && d <= 6)) return null;
    
    return dice as [number, number, number];
  } catch {
    return null;
  }
};

/**
 * Parse a 5D result string to digits array
 * Format: "1,2,3,4,5"
 */
export const parse5DResult = (result: string): [number, number, number, number, number] | null => {
  try {
    const digits = result.split(',').map(s => parseInt(s.trim()));
    if (digits.length !== 5) return null;
    if (!digits.every(d => d >= 0 && d <= 9)) return null;
    return digits as [number, number, number, number, number];
  } catch {
    return null;
  }
};

/**
 * Clear the cache (call on round change)
 */
export const clearAdminResultCache = (): void => {
  adminResultCache.clear();
  cacheTimestamps.clear();
};
