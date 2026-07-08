/**
 * Game History Service
 * Handles game bets and rounds with database persistence
 */

import { supabase } from "@/integrations/supabase/client";

export interface GameBet {
  id: string;
  user_id: string;
  game_type: string;
  game_mode: string;
  trade_id: string;
  bet_type: string;
  bet_value: string;
  bet_amount: number;
  multiplier: number;
  potential_win: number;
  result: string | null;
  status: "pending" | "won" | "lost";
  payout: number;
  created_at: string;
  settled_at: string | null;
}

export interface GameRound {
  id: string;
  game_type: string;
  game_mode: string;
  trade_id: string;
  result: string;
  result_color: string | null;
  created_at: string;
}

export interface PlaceBetParams {
  gameType: string;
  gameMode: string;
  tradeId: string;
  betType: string;
  betValue: string;
  betAmount: number;
  multiplier: number;
  potentialWin: number;
}

/**
 * Place a new bet
 */
// Cache user to avoid repeated auth calls
let cachedUser: { id: string } | null = null;
let userCacheTime = 0;
const USER_CACHE_TTL = 30000; // 30 seconds

const getCachedUser = async () => {
  const now = Date.now();
  if (cachedUser && now - userCacheTime < USER_CACHE_TTL) {
    return cachedUser;
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    cachedUser = { id: user.id };
    userCacheTime = now;
  } else {
    cachedUser = null;
  }
  return cachedUser;
};

// Clear cache on auth state change
supabase.auth.onAuthStateChange(() => {
  cachedUser = null;
  userCacheTime = 0;
});

export const placeBetDB = async (params: PlaceBetParams): Promise<{ success: boolean; bet?: GameBet; error?: string }> => {
  const user = await getCachedUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("game_bets")
    .insert({
      user_id: user.id,
      game_type: params.gameType,
      game_mode: params.gameMode,
      trade_id: params.tradeId,
      bet_type: params.betType,
      bet_value: params.betValue,
      bet_amount: params.betAmount,
      multiplier: params.multiplier,
      potential_win: params.potentialWin,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error placing bet:", error);
    return { success: false, error: error.message };
  }

  return { success: true, bet: data as GameBet };
};

/**
 * Settle bets for a round using atomic RPC (user-side settlement)
 * This uses settle_bet_atomic which is safe for users to call on their own bets
 */
export const settleBetsDB = async (
  tradeId: string,
  gameType: string,
  gameMode: string,
  result: string
): Promise<{ success: boolean; settledCount: number; totalPayouts: number }> => {
  try {
    const user = await getCachedUser();
    if (!user) {
      console.warn("[Settlement] No authenticated user");
      return { success: false, settledCount: 0, totalPayouts: 0 };
    }

    // Search for pending bets using MULTIPLE trade_id formats to handle format mismatches
    // The tradeId might be stored as: full roundKey, just the timestamp, or formatted timestamp
    const possibleTradeIds = [tradeId];
    
    // If tradeId looks like a formatted timestamp (20240101120000000), also try raw ms
    if (/^\d{17,18}$/.test(tradeId)) {
      possibleTradeIds.push(tradeId);
    }
    
    // Also try the tradeId as-is and trimmed
    const cleanTradeId = tradeId.trim();
    if (!possibleTradeIds.includes(cleanTradeId)) possibleTradeIds.push(cleanTradeId);

    // Fetch ALL pending bets for this user across all possible trade ID formats
    const { data: pendingBets, error: fetchError } = await supabase
      .from("game_bets")
      .select("id, bet_type, bet_value, bet_amount, multiplier, potential_win, trade_id, game_type, game_mode")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .in("trade_id", possibleTradeIds);

    if (fetchError) {
      console.error("[Settlement] Error fetching pending bets:", fetchError);
      return { success: false, settledCount: 0, totalPayouts: 0 };
    }

    // Also try fetching by game_mode if no bets found by trade_id
    let betsToSettle = pendingBets || [];
    
    if (betsToSettle.length === 0) {
      console.log(`[Settlement] No bets found for tradeId=${tradeId}, trying game_mode=${gameMode}`);
      // Try fetching recent pending bets for this game mode (within last 10 minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: recentBets } = await supabase
        .from("game_bets")
        .select("id, bet_type, bet_value, bet_amount, multiplier, potential_win, trade_id, game_type, game_mode")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .eq("game_mode", gameMode)
        .gte("created_at", tenMinutesAgo)
        .order("created_at", { ascending: false });
      
      if (recentBets && recentBets.length > 0) {
        // Filter to bets whose trade_id ends with or contains the last 10 chars of our tradeId
        const tradeIdSuffix = tradeId.slice(-10);
        const matchedBets = recentBets.filter(b => 
          b.trade_id === tradeId || 
          b.trade_id.endsWith(tradeIdSuffix) ||
          tradeId.endsWith(b.trade_id.slice(-10))
        );
        if (matchedBets.length > 0) {
          betsToSettle = matchedBets;
          console.log(`[Settlement] Found ${matchedBets.length} bets via suffix match`);
        } else {
          // Last resort: settle ALL pending bets for this game mode that are old enough
          // (older than half the round duration, meaning they belong to a completed round)
          const halfDuration = gameMode === "30sec" ? 15 : gameMode === "1min" ? 30 : gameMode === "3min" ? 90 : gameMode === "5min" ? 150 : gameMode === "10min" ? 300 : 30;
          const cutoffTime = new Date(Date.now() - halfDuration * 1000).toISOString();
          const { data: oldBets } = await supabase
            .from("game_bets")
            .select("id, bet_type, bet_value, bet_amount, multiplier, potential_win, trade_id, game_type, game_mode")
            .eq("user_id", user.id)
            .eq("status", "pending")
            .eq("game_mode", gameMode)
            .lte("created_at", cutoffTime);
          
          if (oldBets && oldBets.length > 0) {
            betsToSettle = oldBets;
            console.log(`[Settlement] Fallback: settling ${oldBets.length} old pending bets for ${gameMode}`);
          }
        }
      }
    }

    if (betsToSettle.length === 0) {
      return { success: true, settledCount: 0, totalPayouts: 0 };
    }

    console.log(`[Settlement] Settling ${betsToSettle.length} bets for ${gameType}/${gameMode}, result=${result}`);

    let settledCount = 0;
    let totalPayouts = 0;

    for (const bet of betsToSettle) {
      const isWin = evaluateBetWin(bet.game_type || gameType, bet.bet_type, bet.bet_value, result);
      const winAmount = isWin ? bet.potential_win : 0;

      // Direct update instead of RPC to avoid parameter mismatch issues
      const { error: updateError } = await supabase
        .from("game_bets")
        .update({
          result: result,
          status: isWin ? "won" : "lost",
          payout: winAmount,
          settled_at: new Date().toISOString(),
        })
        .eq("id", bet.id)
        .eq("status", "pending"); // Safety check

      if (updateError) {
        console.error(`[Settlement] Error updating bet ${bet.id}:`, updateError);
        continue;
      }

      // If won, add winnings to wallet
      if (isWin && winAmount > 0) {
        const { error: walletError } = await supabase.rpc("secure_add_winnings", {
          p_user_id: user.id,
          p_amount: winAmount,
          p_game_type: bet.game_type || gameType,
          p_trade_id: bet.trade_id,
        });
        
        if (walletError) {
          console.error(`[Settlement] Error adding winnings for bet ${bet.id}:`, walletError);
          // Don't fail the whole settlement, just log
        }
      }

      settledCount++;
      if (isWin) totalPayouts += winAmount;
    }

    console.log(`[Settlement] Done: ${settledCount} settled, ৳${totalPayouts} payouts`);
    return { success: true, settledCount, totalPayouts };
  } catch (error) {
    console.error("[Settlement] Unexpected error:", error);
    return { success: false, settledCount: 0, totalPayouts: 0 };
  }
};

/**
 * Evaluate if a bet is a winner based on game result
 */
function evaluateBetWin(gameType: string, betType: string, betValue: string, result: string): boolean {
  const raw = (gameType || "").toLowerCase().trim();
  const game =
    raw === "videowingo" ? "wingo" :
    raw === "trx-win" ? "trxwin" :
    raw === "trxwin" ? "trxwin" :
    raw === "5d" ? "fived" :
    raw === "fived" ? "fived" :
    raw === "k3" ? "k3" :
    raw === "wingo" ? "wingo" :
    raw;
  
  try {
    // ===== WINGO / TRX-WIN =====
    if (game === "wingo" || game === "trxwin") {
      const num = parseInt(result.trim());
      if (isNaN(num) || num < 0 || num > 9) return false;
      
      const bt = betType.toLowerCase().trim();
      const bv = betValue.toLowerCase().trim();
      
      if (bt === "number") return parseInt(bv) === num;
      if (bt === "color") {
        if (bv === "red") return num === 0 || [2,4,6,8].includes(num);
        if (bv === "green") return num === 5 || [1,3,7,9].includes(num);
        if (bv === "violet") return num === 0 || num === 5;
        return false;
      }
      if (bt === "bigsmall" || bt === "big_small") {
        const isBig = num >= 5;
        return (bv === "big" && isBig) || (bv === "small" && !isBig);
      }
      // Handle capitalized values
      if (bv === "big") return num >= 5;
      if (bv === "small") return num < 5;
      return false;
    }
    
    // ===== K3 =====
    if (game === "k3") {
      let dice: number[];
      try {
        // Handle both "[1,2,3]" and "1,2,3" formats
        if (result.trim().startsWith("[")) {
          dice = JSON.parse(result);
        } else {
          dice = result.split(",").map(s => parseInt(s.trim()));
        }
      } catch {
        return false;
      }
      
      if (!Array.isArray(dice) || dice.length !== 3) return false;
      if (!dice.every(d => d >= 1 && d <= 6)) return false;
      
      const sum = dice[0] + dice[1] + dice[2];
      const bt = betType.toLowerCase().trim();
      const bv = betValue.toLowerCase().trim();
      
      if (bt === "number") return parseInt(bv) === sum;
      if (bt === "bigsmall" || bt === "big_small") {
        const isBig = sum >= 11;
        if (bv === "big") return isBig;
        if (bv === "small") return !isBig;
        if (bv === "odd") return sum % 2 === 1;
        if (bv === "even") return sum % 2 === 0;
      }
      // 3same-all: any triple
      if (bt === "3same-all") return dice[0] === dice[1] && dice[1] === dice[2];
      // 3same-single: specific triple e.g. "3"
      if (bt === "3same-single") return dice[0] === dice[1] && dice[1] === dice[2] && dice[0] === parseInt(bv);
      // 2same-multiple: any pair
      if (bt === "2same-multiple") return dice[0] === dice[1] || dice[1] === dice[2] || dice[0] === dice[2];
      // 2same-single: specific pair+value e.g. "2,5" = pair of 2s with a 5
      if (bt === "2same-single") {
        const [pairVal, otherVal] = bv.split(",").map(Number);
        const sorted = [...dice].sort();
        return (sorted[0] === sorted[1] && sorted[0] === pairVal && sorted[2] === otherVal) ||
               (sorted[1] === sorted[2] && sorted[1] === pairVal && sorted[0] === otherVal);
      }
      // consecutive: three consecutive numbers
      if (bt === "consecutive") {
        const sorted = [...dice].sort((a, b) => a - b);
        return sorted[1] === sorted[0] + 1 && sorted[2] === sorted[1] + 1;
      }
      return false;
    }
    
    // ===== 5D =====
    if (game === "fived" || game === "5d") {
      let digits: number[];
      try {
        digits = result.split(",").map(d => parseInt(d.trim()));
      } catch {
        return false;
      }
      if (digits.length !== 5 || digits.some(isNaN)) return false;
      
      const sum = digits.reduce((a, b) => a + b, 0);
      const bt = betType.toLowerCase().trim();
      const bv = betValue.toLowerCase().trim();
      
      // Parse "a_big", "b_small", "sum_odd", etc.
      const parts = bt.split(/[_\s]+/);
      const digitPart = (parts[0] || "a").toUpperCase();
      const typePart = (parts[1] || "big").toLowerCase();
      
      const digitIndex = ["A", "B", "C", "D", "E"].indexOf(digitPart);
      const resultValue = digitPart === "SUM" ? sum : (digitIndex >= 0 ? digits[digitIndex] : -1);
      
      if (resultValue === -1) return false;
      
      if (typePart === "big") return digitPart === "SUM" ? sum >= 23 : resultValue >= 5;
      if (typePart === "small") return digitPart === "SUM" ? sum < 23 : resultValue < 5;
      if (typePart === "odd") return resultValue % 2 === 1;
      if (typePart === "even") return resultValue % 2 === 0;
      if (typePart === "number" || typePart === "num") {
        const numValue = parseInt(parts[2] || bv);
        return resultValue === numValue;
      }
      // Direct big/small/odd/even from betValue
      if (bv === "big") return digitPart === "SUM" ? sum >= 23 : resultValue >= 5;
      if (bv === "small") return digitPart === "SUM" ? sum < 23 : resultValue < 5;
      if (bv === "odd") return resultValue % 2 === 1;
      if (bv === "even") return resultValue % 2 === 0;
    }
  } catch (e) {
    console.error("[evaluateBetWin] Error:", e, { gameType, betType, betValue, result });
  }
  
  return false;
}

/**
 * Get colors for a number (0-9)
 */
function getNumberColors(num: number): string[] {
  if (num === 0) return ["red", "violet"];
  if (num === 5) return ["green", "violet"];
  if ([1, 3, 7, 9].includes(num)) return ["green"];
  return ["red"]; // 2,4,6,8
}

/**
 * Settle bets locally (fallback for client-side settlement)
 */
export const settleBetsLocal = async (
  tradeId: string,
  result: string,
  winningBetTypes: string[],
  winningBetValues: string[]
): Promise<{ success: boolean; settledCount: number }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, settledCount: 0 };
  }

  // Get all pending bets for this trade
  const { data: pendingBets, error: fetchError } = await supabase
    .from("game_bets")
    .select("*")
    .eq("user_id", user.id)
    .eq("trade_id", tradeId)
    .eq("status", "pending");

  if (fetchError || !pendingBets) {
    console.error("Error fetching pending bets:", fetchError);
    return { success: false, settledCount: 0 };
  }

  let settledCount = 0;

  for (const bet of pendingBets) {
    const isWinner = winningBetTypes.includes(bet.bet_type) && 
                     winningBetValues.includes(bet.bet_value);
    
    const payout = isWinner ? bet.potential_win : 0;
    const status = isWinner ? "won" : "lost";

    const { error: updateError } = await supabase
      .from("game_bets")
      .update({
        result,
        status,
        payout,
        settled_at: new Date().toISOString(),
      })
      .eq("id", bet.id);

    if (!updateError) {
      settledCount++;

      // If won, add winnings to wallet using secure RPC
      if (isWinner && payout > 0) {
        const { data: result, error: payoutError } = await supabase.rpc("secure_add_winnings", {
          p_user_id: user.id,
          p_amount: payout,
          p_game_type: bet.game_type,
          p_trade_id: tradeId,
        });
        
        if (payoutError) {
          console.error("Error adding winnings:", payoutError);
        }
      }
    }
  }

  return { success: true, settledCount };
};

/**
 * Get user's bet history
 */
export const fetchBetHistory = async (
  gameType?: string,
  limit: number = 50
): Promise<GameBet[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("game_bets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (gameType) {
    query = query.eq("game_type", gameType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching bet history:", error);
    return [];
  }

  return (data || []) as GameBet[];
};

/**
 * Get user's bets for a specific trade
 */
export const fetchBetsForTrade = async (tradeId: string): Promise<GameBet[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("game_bets")
    .select("*")
    .eq("user_id", user.id)
    .eq("trade_id", tradeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bets for trade:", error);
    return [];
  }

  return (data || []) as GameBet[];
};

/**
 * Save game round result
 */
export const saveGameRound = async (
  gameType: string,
  gameMode: string,
  tradeId: string,
  result: string,
  resultColor?: string
): Promise<{ success: boolean; round?: GameRound }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false };
  }

  // Check if round already exists
  const { data: existing } = await supabase
    .from("game_rounds")
    .select("id")
    .eq("trade_id", tradeId)
    .maybeSingle();

  if (existing) {
    return { success: true }; // Already saved
  }

  const { data, error } = await supabase
    .from("game_rounds")
    .insert({
      game_type: gameType,
      game_mode: gameMode,
      trade_id: tradeId,
      result,
      result_color: resultColor,
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving game round:", error);
    return { success: false };
  }

  return { success: true, round: data as GameRound };
};

/**
 * Get recent game rounds
 */
export const fetchGameRounds = async (
  gameType: string,
  gameMode?: string,
  limit: number = 50
): Promise<GameRound[]> => {
  let query = supabase
    .from("game_rounds")
    .select("*")
    .eq("game_type", gameType)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (gameMode) {
    query = query.eq("game_mode", gameMode);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching game rounds:", error);
    return [];
  }

  return (data || []) as GameRound[];
};

/**
 * Get pending bets count for a trade
 */
export const getPendingBetsCount = async (tradeId: string): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("game_bets")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("trade_id", tradeId)
    .eq("status", "pending");

  if (error) {
    console.error("Error counting pending bets:", error);
    return 0;
  }

  return count || 0;
};

/**
 * Get user's game statistics
 */
export const fetchGameStats = async (
  gameType?: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<{
  totalBets: number;
  totalWon: number;
  totalLost: number;
  totalBetAmount: number;
  totalWinAmount: number;
  winRate: number;
}> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { totalBets: 0, totalWon: 0, totalLost: 0, totalBetAmount: 0, totalWinAmount: 0, winRate: 0 };
  }

  let query = supabase
    .from("game_bets")
    .select("status, bet_amount, payout, created_at")
    .eq("user_id", user.id)
    .neq("status", "pending");

  if (gameType) {
    query = query.eq("game_type", gameType);
  }

  if (dateFrom) {
    query = query.gte("created_at", dateFrom.toISOString());
  }

  if (dateTo) {
    query = query.lte("created_at", dateTo.toISOString());
  }

  const { data, error } = await query;

  if (error || !data) {
    return { totalBets: 0, totalWon: 0, totalLost: 0, totalBetAmount: 0, totalWinAmount: 0, winRate: 0 };
  }

  const totalBets = data.length;
  const totalWon = data.filter(b => b.status === "won").length;
  const totalLost = data.filter(b => b.status === "lost").length;
  const totalBetAmount = data.reduce((sum, b) => sum + Number(b.bet_amount), 0);
  const totalWinAmount = data.reduce((sum, b) => sum + Number(b.payout), 0);
  const winRate = totalBets > 0 ? (totalWon / totalBets) * 100 : 0;

  return { totalBets, totalWon, totalLost, totalBetAmount, totalWinAmount, winRate };
};
