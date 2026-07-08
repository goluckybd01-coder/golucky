import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Game timing constants (in seconds) - must match server
export const CRASH_TIMING = {
  BET_WINDOW_SEC: 10,
  LOCKING_SEC: 2,
  POST_CRASH_SEC: 3,
  GAP_SEC: 1,
  ANIMATION_SPEED_FACTOR: 0.6, // Max 0.6
  MULTIPLIER_UPDATE_MS: 100,
};

export interface CrashRoundState {
  id: string | null;
  roundNumber: number;
  phase: "syncing" | "betting" | "locking" | "running" | "crashed" | "waiting";
  countdown: number;
  currentMultiplier: number;
  crashMultiplier: number | null;
  seedHash: string;
  serverSeed: string | null;
  betCloseTime: Date | null;
  lockingEndTime: Date | null;
  runningStartTime: Date | null;
  serverTime: Date | null;
  isConnected: boolean;
  lastSync: Date | null;
}

const initialState: CrashRoundState = {
  id: null,
  roundNumber: 0,
  phase: "syncing",
  countdown: 0,
  currentMultiplier: 1.0,
  crashMultiplier: null,
  seedHash: "",
  serverSeed: null,
  betCloseTime: null,
  lockingEndTime: null,
  runningStartTime: null,
  serverTime: null,
  isConnected: false,
  lastSync: null,
};

export function useCrashRoundSync() {
  const [state, setState] = useState<CrashRoundState>(initialState);
  const [error, setError] = useState<string | null>(null);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastPollRef = useRef<number>(0);
  const serverTimeOffsetRef = useRef<number>(0); // Offset between server and client time

  // Fetch active round from server
  const fetchActiveRound = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke("crash-active-round");
      
      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch round");
      }

      const round = data.round;
      const serverTime = new Date(data.server_time);
      
      // Calculate server time offset
      serverTimeOffsetRef.current = serverTime.getTime() - Date.now();

      setState(prev => ({
        ...prev,
        id: round.id,
        roundNumber: round.round_number,
        phase: round.phase as CrashRoundState["phase"],
        countdown: data.countdown_sec,
        currentMultiplier: data.current_multiplier,
        crashMultiplier: round.crash_multiplier,
        seedHash: round.seed_hash,
        serverSeed: round.server_seed,
        betCloseTime: round.bet_close_time ? new Date(round.bet_close_time) : null,
        lockingEndTime: round.locking_end_time ? new Date(round.locking_end_time) : null,
        runningStartTime: round.running_start_time ? new Date(round.running_start_time) : null,
        serverTime,
        isConnected: true,
        lastSync: new Date(),
      }));

      setError(null);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Connection error";
      setError(errorMsg);
      setState(prev => ({ ...prev, isConnected: false }));
      return false;
    }
  }, []);

  // Update countdown/multiplier based on local time + server offset
  const updateLocalState = useCallback(() => {
    setState(prev => {
      if (!prev.isConnected || !prev.betCloseTime) {
        return prev;
      }

      // Adjusted current time using server offset
      const now = Date.now() + serverTimeOffsetRef.current;
      let newCountdown = prev.countdown;
      let newMultiplier = prev.currentMultiplier;
      let newPhase = prev.phase;

      if (prev.phase === "betting" && prev.betCloseTime) {
        newCountdown = Math.max(0, Math.ceil((prev.betCloseTime.getTime() - now) / 1000));
        
        // Auto-transition to locking when countdown reaches 0
        if (newCountdown <= 0 && prev.lockingEndTime) {
          newPhase = "locking";
          newCountdown = Math.max(0, Math.ceil((prev.lockingEndTime.getTime() - now) / 1000));
        }
      } else if (prev.phase === "locking" && prev.lockingEndTime) {
        newCountdown = Math.max(0, Math.ceil((prev.lockingEndTime.getTime() - now) / 1000));
        
        // Auto-transition to running when locking countdown reaches 0
        if (newCountdown <= 0) {
          newPhase = "running";
        }
      } else if (prev.phase === "running" && prev.runningStartTime) {
        // Calculate multiplier
        const elapsed = now - prev.runningStartTime.getTime();
        const speedFactor = CRASH_TIMING.ANIMATION_SPEED_FACTOR;
        const baseRate = 0.0008 * speedFactor;
        const easeInDuration = 3000;
        const easeInFactor = Math.min(1, elapsed / easeInDuration);
        const minRateFactor = 0.35;
        const easedRate = baseRate * (minRateFactor + (1 - minRateFactor) * easeInFactor);
        newMultiplier = Math.max(1.01, Math.pow(1 + easedRate, elapsed));
        
        // Check if crashed
        if (prev.crashMultiplier && newMultiplier >= prev.crashMultiplier) {
          newMultiplier = prev.crashMultiplier;
          newPhase = "crashed";
        }
      }

      return {
        ...prev,
        phase: newPhase,
        countdown: newCountdown,
        currentMultiplier: Number(newMultiplier.toFixed(2)),
      };
    });
  }, []);

  // High-frequency local update loop (every ~100ms for smooth UI)
  useEffect(() => {
    let lastUpdate = 0;
    
    const tick = () => {
      const now = Date.now();
      if (now - lastUpdate >= CRASH_TIMING.MULTIPLIER_UPDATE_MS) {
        lastUpdate = now;
        updateLocalState();
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    };
    
    animationFrameRef.current = requestAnimationFrame(tick);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateLocalState]);

  // Poll server every 2 seconds for sync
  useEffect(() => {
    // Initial fetch
    fetchActiveRound();

    // Set up polling
    pollIntervalRef.current = setInterval(() => {
      fetchActiveRound();
    }, 2000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchActiveRound]);

  // Force resync function
  const forceResync = useCallback(async () => {
    setState(prev => ({ ...prev, phase: "syncing" }));
    await fetchActiveRound();
  }, [fetchActiveRound]);

  // Update crash phase on server
  const updatePhase = useCallback(async (newPhase: string, crashMultiplier?: number) => {
    if (!state.id) return false;
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke("crash-update-phase", {
        body: {
          round_id: state.id,
          new_phase: newPhase,
          crash_multiplier: crashMultiplier,
        },
      });

      if (fnError || !data.success) {
        console.error("Failed to update phase:", fnError || data.error);
        return false;
      }

      // Immediately refetch to get updated state
      await fetchActiveRound();
      return true;
    } catch (err) {
      console.error("Error updating phase:", err);
      return false;
    }
  }, [state.id, fetchActiveRound]);

  return {
    ...state,
    error,
    forceResync,
    updatePhase,
  };
}

export default useCrashRoundSync;
