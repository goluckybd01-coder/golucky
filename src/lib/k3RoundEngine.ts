/**
 * K3 ROUND ENGINE - BUILT ON GAME ENGINE BASE
 * 
 * This extends the shared GameEngineBase for K3-specific logic.
 * 
 * - ONE interval drives 1min/3min/5min/10min simultaneously
 * - Round transitions detected per duration independently
 * - Settlement triggered on round change, not UI state
 * - Uses deterministic roundKey = K3:{duration}:{roundStartTimestamp}
 * 
 * DO NOT CHANGE KEY FORMAT — used across settlement/history/cache
 */

import { 
  GameEngineBase, 
  type BaseRoundResult, 
  type BaseBetResult,
  type DurationState,
  type EngineCallbacks,
  type SettlementListener,
  type ResultListener,
  markSeen as baseMarkSeen,
  isSeen as baseIsSeen,
  clearSeen as baseClearSeen,
} from "@/lib/gameEngineBase";
import { 
  loadMyHistory, 
  saveMyHistory,
  getRoundResult as getStoredRoundResult,
  evaluateBet as evaluateStoredBet,
  type RoundResult,
} from "@/lib/gameStorage";
import { type K3Duration } from "@/lib/k3RoundKey";
import { generateBiasedK3Dice, getPendingBetsForRound } from "@/lib/houseEdgeResult";

// ============= CONSTANTS =============

const GAME_ID = "K3";
const DEBUG_K3 = true;
const DURATIONS: K3Duration[] = [1, 3, 5, 10];

// ============= K3-SPECIFIC TYPES =============

export interface K3RoundResult extends BaseRoundResult {
  dice: [number, number, number];
  sum: number;
  bigSmall: "Big" | "Small";
  oddEven: "Odd" | "Even";
}

export interface K3ResultEvent extends BaseBetResult {
  duration: K3Duration;
  sum: number;
}

// Types are already imported above - no re-export to avoid circular deps

export interface K3EngineCallbacks {
  onTick?: (states: Record<K3Duration, DurationState>) => void;
  onRoundEnd?: (duration: K3Duration, prevRoundKey: string, result: RoundResult) => void;
}

export type K3ResultListener = ResultListener<K3ResultEvent>;
export type K3SettlementListener = SettlementListener<K3RoundResult>;

// ============= K3-SPECIFIC HELPERS =============

// Generate K3 dice - DEPRECATED, use biased version
export const generateK3Dice = (): [number, number, number] => {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
};

// Generate biased K3 dice that favors house edge
export const generateBiasedDice = (gameType: string, roundKey: string): [number, number, number] => {
  const pendingBets = getPendingBetsForRound("k3", gameType, roundKey);
  return generateBiasedK3Dice(pendingBets, gameType);
};

// Get pattern type from dice
export const getK3PatternType = (dice: [number, number, number]): string => {
  const sorted = [...dice].sort();
  const unique = new Set(dice).size;
  
  if (unique === 1) return "3 same numbers";
  if (unique === 2) return "2 same numbers";
  if (sorted[2] - sorted[0] === 2 && sorted[1] - sorted[0] === 1) return "3 consecutive numbers";
  return "3 different numbers";
};

// Seen result helpers (delegating to base with game ID)
export const markSeen = (id: string): void => baseMarkSeen(GAME_ID, id);
export const isSeen = (id: string): boolean => baseIsSeen(GAME_ID, id);
export const clearSeenResults = (): void => baseClearSeen(GAME_ID);
export const getResultId = (roundKey: string, betType: string, betAmount: number): string => {
  return `${roundKey}:${betType}:${betAmount}`;
};

// ============= K3 ENGINE INSTANCE =============

// Create the K3 engine with game-specific config
const k3Engine = new GameEngineBase<K3RoundResult, K3ResultEvent>({
  gameId: GAME_ID,
  durations: DURATIONS,
  tickIntervalMs: 250,
  debug: DEBUG_K3,
  
  // Map K3 duration to gameType string (1 -> "1min", 3 -> "3min", etc.)
  getGameType: (duration) => `${duration}min`,
  
  // Generate K3-specific result with HOUSE EDGE
  generateResult: (duration, roundKey): K3RoundResult => {
    const gameType = `${duration}min`;
    // Use biased dice generation for house edge
    const dice = generateBiasedDice(gameType, roundKey);
    const sum = dice[0] + dice[1] + dice[2];
    const bigSmall = sum >= 11 ? "Big" : "Small";
    const oddEven = sum % 2 === 0 ? "Even" : "Odd";
    
    return {
      tradeId: roundKey.split(":")[2] || roundKey,
      gameType,
      dice,
      sum,
      bigSmall,
      oddEven,
      endedAt: new Date().toISOString(),
      duration,
      roundKey,
    };
  },
  
  // Evaluate K3 bet
  evaluateBet: (bet, result) => {
    // Use the existing evaluateBet from gameStorage
    return evaluateStoredBet(bet, result as unknown as RoundResult, "k3");
  },
  
  // Load K3 bet history
  loadBetHistory: (gameType) => {
    return loadMyHistory("k3", gameType);
  },
  
  // Save K3 bet history
  saveBetHistory: (gameType, history) => {
    saveMyHistory("k3", gameType, history);
  },
  
  // Create K3-specific bet result event
  createBetResult: (duration, roundKey, bet, result, isWin, payout): K3ResultEvent => {
    return {
      duration: duration as K3Duration,
      roundKey,
      tradeId: result.tradeId || roundKey.split(":")[2] || roundKey,
      outcome: isWin ? "WIN" : "LOSE",
      betType: bet.betType,
      sum: result.sum,
      betAmount: bet.betAmount,
      payout: isWin ? payout : 0,
      ts: Date.now(),
    };
  },
});

// ============= PUBLIC API (BACKWARD COMPATIBLE) =============

// Start the engine
export const startK3Engine = (cbs: K3EngineCallbacks = {}): (() => void) => {
  // Adapt callbacks to engine format
  const engineCallbacks: EngineCallbacks<K3RoundResult> = {
    onTick: cbs.onTick ? (states) => cbs.onTick!(states as Record<K3Duration, DurationState>) : undefined,
    onRoundEnd: cbs.onRoundEnd ? (duration, roundKey, result) => {
      // Convert K3RoundResult to RoundResult for backward compatibility
      cbs.onRoundEnd!(duration as K3Duration, roundKey, result as unknown as RoundResult);
    } : undefined,
  };
  
  return k3Engine.start(engineCallbacks);
};

// Stop the engine
export const stopK3Engine = (): void => {
  k3Engine.stop();
};

// Check if engine is running
export const isK3EngineRunning = (): boolean => {
  return k3Engine.isRunning();
};

// Get round state for a duration
export const getK3RoundState = (duration: K3Duration): DurationState | null => {
  return k3Engine.getRoundState(duration);
};

// Get current round key for placing bets
export const getCurrentRoundKey = (duration: K3Duration): string => {
  return k3Engine.getCurrentRoundKey(duration);
};

// Get remaining time in seconds
export const getRemainingSeconds = (duration: K3Duration): number => {
  return k3Engine.getRemainingSeconds(duration);
};

// Sweep pending bets
export const sweepPendingBets = (): number => {
  return k3Engine.sweepPendingBets();
};

// Add settlement listener
export const addSettlementListener = (listener: K3SettlementListener): (() => void) => {
  return k3Engine.addSettlementListener(listener as SettlementListener<K3RoundResult>);
};

// Add result listener
export const addResultListener = (listener: K3ResultListener): (() => void) => {
  return k3Engine.addResultListener(listener);
};

// Get round result from cache
export const getRoundResult = (roundKey: string): K3RoundResult | null => {
  return k3Engine.getRoundResult(roundKey);
};
