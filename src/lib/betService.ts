/**
 * Optimized Bet Service
 * Uses edge function for atomic bet placement - single network call
 */

import { supabase } from "@/integrations/supabase/client";

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

export interface PlaceBetResult {
  success: boolean;
  newBalance?: number;
  betId?: string;
  error?: string;
}

/**
 * Place a bet using the optimized edge function
 * Single network call for all operations (balance check, deduct, create bet, create transaction)
 */
export const placeBetOptimized = async (params: PlaceBetParams): Promise<PlaceBetResult> => {
  try {
    const { data, error } = await supabase.functions.invoke("place-bet", {
      body: params,
    });

    if (error) {
      console.error("Place bet error:", error);
      return { success: false, error: error.message };
    }

    return data as PlaceBetResult;
  } catch (error) {
    console.error("Network error placing bet:", error);
    return { success: false, error: "Network error - please try again" };
  }
};

/**
 * Place multiple bets in parallel (for quick multi-bet scenarios)
 */
export const placeMultipleBets = async (bets: PlaceBetParams[]): Promise<PlaceBetResult[]> => {
  const results = await Promise.all(bets.map(bet => placeBetOptimized(bet)));
  return results;
};

/**
 * Calculate bet breakdown with fees
 */
export const calculateBetBreakdown = (amount: number) => {
  const feeRate = 0.02; // 2% fee
  const fee = Math.round(amount * feeRate * 100) / 100;
  const netAmount = amount - fee;
  return { fee, netAmount, total: amount };
};
