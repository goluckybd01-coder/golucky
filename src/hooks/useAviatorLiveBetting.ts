/**
 * useAviatorLiveBetting - Live betting hook for Aviator game
 * Handles bet placement and cashout with backend integration
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PlaceBetResult {
  success: boolean;
  bet_id?: string;
  new_balance?: number;
  error?: string;
}

export interface CashoutResult {
  success: boolean;
  win_amount?: number;
  new_balance?: number;
  multiplier?: number;
  error?: string;
}

export interface ActiveBet {
  id: string;
  roundId: string;
  amount: number;
  autoCashout: number | null;
  status: "pending" | "cashed_out" | "crashed";
  cashoutMultiplier?: number;
  winAmount?: number;
}

export function useAviatorLiveBetting() {
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isCashingOut, setIsCashingOut] = useState(false);
  const [activeBets, setActiveBets] = useState<ActiveBet[]>([]);

  // Place a bet for the current round
  const placeBet = useCallback(async (
    roundId: string,
    betAmount: number,
    autoCashout?: number
  ): Promise<PlaceBetResult> => {
    if (isPlacingBet) {
      return { success: false, error: "Bet already in progress" };
    }

    setIsPlacingBet(true);

    try {
      const { data, error } = await supabase.functions.invoke("aviator-place-bet", {
        body: {
          round_id: roundId,
          bet_amount: betAmount,
          auto_cashout: autoCashout,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to place bet");
      }

      // Track active bet
      if (data.bet_id) {
        setActiveBets(prev => [...prev, {
          id: data.bet_id,
          roundId,
          amount: betAmount,
          autoCashout: autoCashout || null,
          status: "pending",
        }]);
      }

      if (data.duplicate) {
        toast.info("Bet already placed for this round");
      }

      return {
        success: true,
        bet_id: data.bet_id,
        new_balance: data.new_balance,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to place bet";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsPlacingBet(false);
    }
  }, [isPlacingBet]);

  // Cashout an active bet
  const cashout = useCallback(async (
    betId: string,
    multiplier: number
  ): Promise<CashoutResult> => {
    if (isCashingOut) {
      return { success: false, error: "Cashout already in progress" };
    }

    setIsCashingOut(true);

    try {
      const { data, error } = await supabase.functions.invoke("aviator-cashout", {
        body: {
          bet_id: betId,
          multiplier,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to cashout");
      }

      // Update active bet status
      setActiveBets(prev => prev.map(bet => 
        bet.id === betId 
          ? { 
              ...bet, 
              status: "cashed_out" as const,
              cashoutMultiplier: data.multiplier,
              winAmount: data.win_amount,
            } 
          : bet
      ));

      return {
        success: true,
        win_amount: data.win_amount,
        new_balance: data.new_balance,
        multiplier: data.multiplier,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to cashout";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsCashingOut(false);
    }
  }, [isCashingOut]);

  // Mark bet as crashed (called when round crashes)
  const markBetCrashed = useCallback((betId: string) => {
    setActiveBets(prev => prev.map(bet => 
      bet.id === betId && bet.status === "pending"
        ? { ...bet, status: "crashed" as const }
        : bet
    ));
  }, []);

  // Clear bets for a specific round
  const clearRoundBets = useCallback((roundId: string) => {
    setActiveBets(prev => prev.filter(bet => bet.roundId !== roundId));
  }, []);

  // Get active bet for a round
  const getActiveBet = useCallback((roundId: string): ActiveBet | undefined => {
    return activeBets.find(bet => bet.roundId === roundId && bet.status === "pending");
  }, [activeBets]);

  return {
    placeBet,
    cashout,
    markBetCrashed,
    clearRoundBets,
    getActiveBet,
    activeBets,
    isPlacingBet,
    isCashingOut,
  };
}

export default useAviatorLiveBetting;
