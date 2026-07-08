/**
 * useAviatorLiveSync - Live synchronization hook for Aviator game
 * Provides real-time game state, live bets feed, and multiplier updates
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Game timing constants
export const AVIATOR_TIMING = {
  BET_WINDOW_SEC: 8,
  POLL_INTERVAL_MS: 1500,
  MULTIPLIER_UPDATE_MS: 50,
  ANIMATION_SPEED_FACTOR: 0.6,
};

export type AviatorPhase = "betting" | "running" | "crashed" | "syncing";

export interface AviatorRound {
  id: string;
  round_number: number;
  phase: AviatorPhase;
  crash_multiplier: number;
  seed_hash: string;
  bet_close_time: string;
  running_start_time: string | null;
  crashed_at: string | null;
  total_bets: number;
  player_count: number;
}

export interface LiveBet {
  id: string;
  bet_amount: number;
  auto_cashout_multiplier: number | null;
  outcome: "pending" | "cashed_out" | "crashed" | "cancelled";
  cashout_multiplier: number | null;
  placed_at: string;
  // Anonymized display
  display_name?: string;
  avatar_color?: string;
}

export interface HistoryEntry {
  id: string;
  round_number: number;
  crash_multiplier: number;
  created_at: string;
}

export interface AviatorLiveState {
  round: AviatorRound | null;
  phase: AviatorPhase;
  countdown: number;
  currentMultiplier: number;
  liveBets: LiveBet[];
  history: HistoryEntry[];
  serverTime: Date | null;
  isConnected: boolean;
  error: string | null;
}

const initialState: AviatorLiveState = {
  round: null,
  phase: "syncing",
  countdown: 0,
  currentMultiplier: 1.0,
  liveBets: [],
  history: [],
  serverTime: null,
  isConnected: false,
  error: null,
};

// Random display names for anonymized bets
const displayNames = [
  "Player***", "Lucky***", "Winner***", "Bettor***", "Gamer***",
  "Pro***", "Ace***", "Star***", "Top***", "High***",
];

const avatarColors = [
  "from-red-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-emerald-500",
  "from-purple-500 to-violet-500",
  "from-orange-500 to-amber-500",
];

const anonymizeBet = (bet: LiveBet): LiveBet => ({
  ...bet,
  display_name: displayNames[Math.floor(Math.random() * displayNames.length)],
  avatar_color: avatarColors[Math.floor(Math.random() * avatarColors.length)],
});

export function useAviatorLiveSync() {
  const [state, setState] = useState<AviatorLiveState>(initialState);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const serverTimeOffsetRef = useRef<number>(0);
  const lastPollRef = useRef<number>(0);

  // Fetch active round from server
  const fetchActiveRound = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("aviator-active-round");
      
      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch round");
      }

      const round = data.round as AviatorRound;
      const serverTime = new Date(data.server_time);
      
      // Calculate server time offset
      serverTimeOffsetRef.current = serverTime.getTime() - Date.now();

      // Anonymize live bets
      const anonymizedBets = (data.live_bets || []).map(anonymizeBet);

      setState(prev => ({
        ...prev,
        round,
        phase: round.phase as AviatorPhase,
        countdown: data.countdown_sec,
        currentMultiplier: data.current_multiplier,
        liveBets: anonymizedBets,
        history: data.history || [],
        serverTime,
        isConnected: true,
        error: null,
      }));

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Connection error";
      setState(prev => ({ ...prev, error: errorMsg, isConnected: false }));
      return false;
    }
  }, []);

  // Update multiplier locally between polls
  const updateLocalMultiplier = useCallback(() => {
    setState(prev => {
      if (!prev.isConnected || !prev.round || prev.phase !== "running") {
        return prev;
      }

      if (!prev.round.running_start_time) return prev;

      const now = Date.now() + serverTimeOffsetRef.current;
      const runningStart = new Date(prev.round.running_start_time).getTime();
      const elapsed = (now - runningStart) / 1000;
      
      // Calculate multiplier
      let newMultiplier = Math.pow(Math.E, elapsed * 0.14 * AVIATOR_TIMING.ANIMATION_SPEED_FACTOR);
      
      // Check if crashed
      if (newMultiplier >= prev.round.crash_multiplier) {
        newMultiplier = prev.round.crash_multiplier;
        return {
          ...prev,
          phase: "crashed" as AviatorPhase,
          currentMultiplier: newMultiplier,
        };
      }

      return {
        ...prev,
        currentMultiplier: parseFloat(newMultiplier.toFixed(2)),
      };
    });
  }, []);

  // Countdown update for betting phase
  const updateCountdown = useCallback(() => {
    setState(prev => {
      if (!prev.isConnected || !prev.round || prev.phase !== "betting") {
        return prev;
      }

      const now = Date.now() + serverTimeOffsetRef.current;
      const betCloseTime = new Date(prev.round.bet_close_time).getTime();
      const newCountdown = Math.max(0, Math.ceil((betCloseTime - now) / 1000));

      // Auto-transition to running when countdown hits 0
      if (newCountdown <= 0) {
        return {
          ...prev,
          countdown: 0,
          phase: "running" as AviatorPhase,
        };
      }

      return {
        ...prev,
        countdown: newCountdown,
      };
    });
  }, []);

  // High-frequency animation loop
  useEffect(() => {
    let lastUpdate = 0;
    
    const tick = () => {
      const now = Date.now();
      if (now - lastUpdate >= AVIATOR_TIMING.MULTIPLIER_UPDATE_MS) {
        lastUpdate = now;
        
        if (state.phase === "running") {
          updateLocalMultiplier();
        } else if (state.phase === "betting") {
          updateCountdown();
        }
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    };
    
    animationFrameRef.current = requestAnimationFrame(tick);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.phase, updateLocalMultiplier, updateCountdown]);

  // Server polling
  useEffect(() => {
    // Initial fetch
    fetchActiveRound();

    // Set up polling
    pollIntervalRef.current = setInterval(() => {
      fetchActiveRound();
    }, AVIATOR_TIMING.POLL_INTERVAL_MS);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchActiveRound]);

  // Realtime subscription for live bets
  useEffect(() => {
    if (!state.round?.id) return;

    const channel = supabase
      .channel(`aviator_bets_${state.round.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "aviator_bets",
          filter: `round_id=eq.${state.round.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newBet = anonymizeBet(payload.new as LiveBet);
            setState(prev => ({
              ...prev,
              liveBets: [newBet, ...prev.liveBets].slice(0, 50),
            }));
          } else if (payload.eventType === "UPDATE") {
            const updatedBet = payload.new as LiveBet;
            setState(prev => ({
              ...prev,
              liveBets: prev.liveBets.map(b => 
                b.id === updatedBet.id ? { ...b, ...updatedBet } : b
              ),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.round?.id]);

  // Force resync
  const forceResync = useCallback(async () => {
    setState(prev => ({ ...prev, phase: "syncing" }));
    await fetchActiveRound();
  }, [fetchActiveRound]);

  return {
    ...state,
    forceResync,
  };
}

export default useAviatorLiveSync;
