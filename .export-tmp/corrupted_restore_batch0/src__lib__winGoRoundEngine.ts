/**
 * WINGO ROUND ENGINE - BUILT ON GAME ENGINE BASE
 * 
 * This extends the shared GameEngineBase for WinGo-specific logic.
 * 
 * - ONE interval drives 30sec/1min/3min/5min simultaneously
 * - Round transitions detected per duration independently
 * - Settlement triggered on round change, not UI state
 * - Uses deterministic roundKey = WinGo:{duration}:{roundStartTimestamp}
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
  type GameDuration,
  markSeen as baseMarkSeen,
  isSeen as baseIsSeen,
  clearSeen as baseClearSeen,
} from "@/lib/gameEngineBase";
import { 
  loadMyHistory, 
  saveMyHistory,
  type RoundResult,
} from "@/lib/gameStorage";
import { calculatePayout, GAME_ODDS } from "@/lib/payout";
import { generateBiasedWinGoNumber, getPendingBetsForRound } from "@/lib/houseEdgeResult";

// ============= CONSTANTS =============

const GAME_ID = "WinGo";
const DEBUG_WINGO = true;
// WinGo durations: 0.5 = 30sec, 1 = 1min, 3 = 3min, 5 = 5min
const DURATIONS: WinGoDuration[] = [0.5, 1, 3, 5];

// ============= WINGO-SPECIFIC TYPES =============

export type WinGoDuration = 0.5 | 1 | 3 | 5;

export interface WinGoRoundResult extends BaseRoundResult {
  number: number;
  colors: string[];
  bigSmall: "Big" | "Small";
  oddEven: "Odd" | "Even";
}

export interface WinGoResultEvent extends BaseBetResult {
  duration: WinGoDuration;
  number: number;
  colors: string[];
}

// DurationState is already imported from gameEngineBase

export interface WinGoEngineCallbacks {
  onTick?: (states: Record<WinGoDuration, DurationState>) => void;
  onRoundEnd?: (duration: WinGoDuration, prevRoundKey: string, result: RoundResult) => void;
}

export type WinGoResultListener = ResultListener<WinGoResultEvent>;
export type WinGoSettlementListener = SettlementListener<WinGoRoundResult>;

// ============= WINGO-SPECIFIC HELPERS =============

// Get colors for a WinGo number (0-9)
export const getWinGoColors = (num: number): string[] => {
  if (num === 0) return ["violet", "red"];
  if (num === 5) return ["violet", "green"];
  if ([1, 3, 7, 9].includes(num)) return ["green"];
  return ["red"];
};

// Generate random WinGo number (0-9) - DEPRECATED, use biased version
export const generateWinGoNumber = (): number => {
  return Math.floor(Math.random() * 10);
};

// Generate biased WinGo number that favors house edge
export const generateBiasedNumber = (gameType: string, roundKey: string): number => {
  const pendingBets = getPendingBetsForRound("winGo", gameType, roundKey);
  return generateBiasedWinGoNumber(pendingBets, gameType);
};

// Get game type string from duration
export const getGameTypeFromDuration = (duration: WinGoDuration): string => {
  if (duration === 0.5) return "30sec";
  return `${duration}min`;
};

// Get duration from game type string
export const getDurationFromGameType = (gameType: string): WinGoDuration => {
  if (gameType === "30sec") return 0.5;
  if (gameType === "1min") return 1;
  if (gameType === "3min") return 3;
  if (gameType === "5min") return 5;
  return 1; // default
};

// Seen result helpers (delegating to base with game ID)
export const markSeen = (id: string): void => baseMarkSeen(GAME_ID, id);
export const isSeen = (id: string): boolean => baseIsSeen(GAME_ID, id);
export const clearSeenResults = (): void => baseClearSeen(GAME_ID);
export const getResultId = (roundKey: string, betType: string, betAmount: number): string => {
  return `${roundKey}:${betType}:${betAmount}`;
};

// Evaluate WinGo bet - uses netAmount (after fee) for payout calculations
const evaluateWinGoBet = (bet: any, result: WinGoRoundResult): { isWin: boolean; payout: number } => {
  const { number, colors, bigSmall } = result;
  const betType = bet.betType;
  // Use netAmount if available (fee already deducted), otherwise use betAmount
  const betAmount = bet.netAmount ?? bet.betAmount;
  
  let isWin = false;
  let multiplier = 1;
  
  // Number bet (0-9) - check for "Number X" format
  const numberMatch = betType.match(/^Number\s*(\d)$/i);
  if (numberMatch) {
    const betNum = parseInt(numberMatch[1]);
    isWin = betNum === number;
    if (isWin) {
      multiplier = GAME_ODDS.winGo.number; // 9x for number bets
    }
  }
  // Color bet
  else if (["green", "red", "violet"].includes(betType.toLowerCase())) {
    const betColor = betType.toLowerCase();
    isWin = colors.includes(betColor);
    if (isWin) {
      multiplier = betColor === "violet" ? GAME_ODDS.winGo.violet : GAME_ODDS.winGo.color;
    }
  }
  // Big/Small bet
  else if (["big", "small"].includes(betType.toLowerCase())) {
    isWin = bigSmall.toLowerCase() === betType.toLowerCase();
    if (isWin) {
      multiplier = GAME_ODDS.winGo.bigSmall;
    }
  }
  
  const payout = isWin ? Math.round(betAmount * multiplier * 100) / 100 : 0;
  
  return { isWin, payout };
};

// ============= WINGO ENGINE INSTANCE =============

// Create the WinGo engine with game-specific config
const winGoEngine = new GameEngineBase<WinGoRoundResult, WinGoResultEvent>({
  gameId: GAME_ID,
  durations: DURATIONS,
  tickIntervalMs: 250,
  debug: DEBUG_WINGO,
  
  // CRITICAL: Map duration to gameType string (0.5 -> "30sec", not "0.5min")
  getGameType: (duration) => getGameTypeFromDuration(duration as WinGoDuration),
  
  // Generate WinGo-specific result with HOUSE EDGE
  generateResult: (duration, roundKey): WinGoRoundResult => {
    const gameType = getGameTypeFromDuration(duration as WinGoDuration);
    // Use biased number generation for house edge
    const number = generateBiasedNumber(gameType, roundKey);
    const colors = getWinGoColors(number);
    const bigSmall = number >= 5 ? "Big" : "Small";
    const oddEven = number % 2 === 0 ? "Even" : "Odd";
    
    return {
      tradeId: roundKey.split(":")[2] || roundKey,
      gameType,
      number,
      colors,
      bigSmall,
      oddEven,
      endedAt: new Date().toISOString(),
      duration,
      roundKey,
    };
  },
  
  // Evaluate WinGo bet
  evaluateBet: (bet, result) => {
    return evaluateWinGoBet(bet, result);
  },
  
  // Load WinGo bet history
  loadBetHistory: (gameType) => {
    return loadMyHistory("winGo", gameType);
  },
  
  // Save WinGo bet history
  saveBetHistory: (gameType, history) => {
    saveMyHistory("winGo", gameType, history);
  },
  
  // Create WinGo-specific bet result event
  createBetResult: (duration, roundKey, bet, result, isWin, payout): WinGoResultEvent => {
    return {
      duration: duration as WinGoDuration,
      roundKey,
      tradeId: result.tradeId || roundKey.split(":")[2] || roundKey,
      outcome: isWin ? "WIN" : "LOSE",
      betType: bet.betType,
      number: result.number,
      colors: result.colors,
      betAmount: bet.betAmount,
      payout: isWin ? payout : 0,
      ts: Date.now(),
    };
  },
});

// ============= PUBLIC API (BACKWARD COMPATIBLE) =============

// Start the engine
export const startWinGoEngine = (cbs: WinGoEngineCallbacks = {}): (() => void) => {
  // Adapt callbacks to engine format
  const engineCallbacks: EngineCallbacks<WinGoRoundResult> = {
    onTick: cbs.onTick ? (states) => cbs.onTick!(states as Record<WinGoDuration, DurationState>) : undefined,
    onRoundEnd: cbs.onRoundEnd ? (duration, roundKey, result) => {
      // Convert WinGoRoundResult to RoundResult for backward compatibility
      cbs.onRoundEnd!(duration as WinGoDuration, roundKey, result as unknown as RoundResult);
    } : undefined,
  };
  
  return winGoEngine.start(engineCallbacks);
};

// Stop the engine
export const stopWinGoEngine = (): void => {
  winGoEngine.stop();
};

// Check if engine is running
export const isWinGoEngineRunning = (): boolean => {
  return winGoEngine.isRunning();
};

// Get round state for a duration
export const getWinGoRoundState = (duration: WinGoDuration): DurationState | null => {
  return winGoEngine.getRoundState(duration);
};

// Get current round key for placing bets
export const getCurrentRoundKey = (duration: WinGoDuration): string => {
  return winGoEngine.getCurrentRoundKey(duration);
};

// Get remaining time in seconds
export const getRemainingSeconds = (duration: WinGoDuration): number => {
  return winGoEngine.getRemainingSeconds(duration);
};

// Sweep pending bets
export const sweepPendingBets = (): number => {
  return winGoEngine.sweepPendingBets();
};

// Add settlement listener
export const addSettlementListener = (listener: WinGoSettlementListener): (() => void) => {
  return winGoEngine.addSettlementListener(listener as SettlementListener<WinGoRoundResult>);
};

// Add result listener
export const addResultListener = (listener: WinGoResultListener): (() => void) => {
  return winGoEngine.addResultListener(listener);
};

// Get round result from cache
export const getRoundResult = (roundKey: string): WinGoRoundResult | null => {
  return winGoEngine.getRoundResult(roundKey);
};
