import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchBetHistory,
  fetchBetsForTrade,
  placeBetDB,
  settleBetsDB,
  fetchGameStats,
  type GameBet,
  type PlaceBetParams,
} from "@/lib/gameHistoryService";

/**
 * Custom hook for managing game bets with database persistence and realtime updates
 */
export const useGameBets = (gameType: string) => {
  const [bets, setBets] = useState<GameBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBets: 0,
    totalWon: 0,
    totalLost: 0,
    totalBetAmount: 0,
    totalWinAmount: 0,
    winRate: 0,
  });
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load bet history
  const loadBetHistory = useCallback(async () => {
    setIsLoading(true);
    const history = await fetchBetHistory(gameType, 100);
    setBets(history);
    
    const gameStats = await fetchGameStats(gameType);
    setStats(gameStats);
    
    setIsLoading(false);
  }, [gameType]);

  // Initial load
  useEffect(() => {
    loadBetHistory();
  }, [loadBetHistory]);

  // Realtime subscription for bet updates
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Clean up existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      // Create new channel for this game type
      const channel = supabase
        .channel(`game_bets_${gameType}_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'game_bets',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const updatedBet = payload.new as GameBet;
            
            // Only process updates for this game type
            if (updatedBet.game_type !== gameType) return;
            
            // Update the bet in state
            setBets(prev => prev.map(bet => 
              bet.id === updatedBet.id ? updatedBet : bet
            ));
            
            // Refresh stats when bet is settled
            if (updatedBet.status === 'won' || updatedBet.status === 'lost') {
              fetchGameStats(gameType).then(setStats);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'game_bets',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newBet = payload.new as GameBet;
            
            // Only process inserts for this game type
            if (newBet.game_type !== gameType) return;
            
            // Add new bet to state if not already present
            setBets(prev => {
              if (prev.some(b => b.id === newBet.id)) return prev;
              return [newBet, ...prev];
            });
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    setupRealtimeSubscription();

    // Cleanup on unmount or gameType change
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [gameType]);

  // Place a bet
  const placeBet = useCallback(async (params: Omit<PlaceBetParams, "gameType">) => {
    const result = await placeBetDB({
      ...params,
      gameType,
    });

    if (result.success && result.bet) {
      setBets(prev => [result.bet!, ...prev]);
    }

    return result;
  }, [gameType]);

  // Settle bets for a round using edge function
  const settleBets = useCallback(async (
    tradeId: string,
    gameMode: string,
    result: string
  ) => {
    const settleResult = await settleBetsDB(tradeId, gameType, gameMode, result);
    
    if (settleResult.success) {
      // Refresh bet history to show updated statuses
      await loadBetHistory();
    }

    return settleResult;
  }, [gameType, loadBetHistory]);

  // Get bets for specific trade
  const getBetsForTrade = useCallback(async (tradeId: string) => {
    return await fetchBetsForTrade(tradeId);
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    await loadBetHistory();
  }, [loadBetHistory]);

  return {
    bets,
    stats,
    isLoading,
    placeBet,
    settleBets,
    getBetsForTrade,
    refresh,
  };
};
