/**
 * 5D ROUND ENGINE - BUILT ON GAME ENGINE BASE
 * 
 * This extends the shared GameEngineBase for 5D-specific logic.
 * 
 * - ONE interval drives 1min/3min/5min/10min simultaneously
 * - Round transitions detected per duration independently
 * - Settlement triggered on round change, not UI state
 * - Uses deterministic roundKey = 5D:{duration}:{roundStartTimestamp}
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
import { generateBiased5DDigits, getPendingBetsForRound } from "@/lib/houseEdgeResult";
import { 
  loadMyHistory,
  saveMyHistory,
  type RoundResult,
} from "@/lib/gameStorage";

// ============= CONSTANTS =============

const GAME_ID = "5D";
const DEBUG_5D = false;
export type FiveDDuration = 1 | 3 | 5 | 10;
const DURATIONS: FiveDDuration[] = [1, 3, 5, 10];

// ============= 5D-SPECIFIC TYPES =============

export interface FiveDRoundResult extends BaseRoundResult {
  digits: [number, number, number, number, number];
  sum: number;
  bigSmall: "Big" | "Small";
  oddEven: "Odd" | "Even";
}

export interface FiveDResultEvent extends BaseBetResult {
  duration: FiveDDuration;
  sum: number;
  digits: [number, number, number, number, number];
}

export interface FiveDEngineCallbacks {
  onTick?: (states: Record<FiveDDuration, DurationState>) => void;
  onRoundEnd?: (duration: FiveDDuration, prevRoundKey: string, result: FiveDRoundResult) => void;
}

export type FiveDResultListener = ResultListener<FiveDResultEvent>;
export type FiveDSettlementListener = SettlementListener<FiveDRoundResult>;

// DurationState is already imported from gameEngineBase

// ============= 5D-SPECIFIC HELPERS =============

// Generate 5D digits - DEPRECATED, use biased version
export const generate5DDigits = (): [number, number, number, number, number] => {
  return [
    Math.floor(Math.random() * 10),
    Math.floor(Math.random() * 10),
    Math.floor(Math.random() * 10),
    Math.floor(Math.random() * 10),
    Math.floor(Math.random() * 10),
  ];
};

// Generate biased 5D digits that favors house edge
export const generateBiasedDigits = (gameType: string, roundKey: string): [number, number, number, number, number] => {
  const pendingBets = getPendingBetsForRound("fiveD", gameType, roundKey);
  return generateBiased5DDigits(pendingBets, gameType);
};

// Seen result helpers (delegating to base with game ID)
export const markSeen = (id: string): void => baseMarkSeen(GAME_ID, id);
export const isSeen = (id: string): boolean => baseIsSeen(GAME_ID, id);
export const clearSeenResults = (): void => baseClearSeen(GAME_ID);
export const getResultId = (roundKey: string, betType: string, betAmount: number): string => {
  return `${roundKey}:${betType}:${betAmount}`;
};

// Duration to gameType string
export const getDurationFromGameType = (gameType: string): FiveDDuration => {
  if (gameType === "1min") return 1;
  if (gameType === "3min") return 3;
  if (gameType === "5min") return 5;
  if (gameType === "10min") return 10;
  return 1;
};

// 5D bet evaluation
const evaluate5DBet = (bet: any, result: FiveDRoundResult): { isWin: boolean; payout: number } => {
  const betType = (bet.betType || "").toLowerCase();
  const betAmount = bet.netAmount ?? bet.betAmount;
  let isWin = false;
  let odds = 1.98; // Default for big/small/odd/even
  
  const parts = betType.split(/[_\s-]+/);
  const digitPart = parts[0]?.toUpperCase() || "A";
  const typePart = parts[1] || "big";
  
  if (digitPart === "SUM" && typePart === "range") {
    const rangeStr = parts.slice(2).join("-");
    const [minStr, maxStr] = rangeStr.split("-");
    const min = parseInt(minStr) || 0;
    const max = parseInt(maxStr) || 9;
    
    isWin = result.sum >= min && result.sum <= max;
    
    if (rangeStr === "0-9" || rangeStr === "30-45") {
      odds = 4.5;
    } else {
      odds = 2.5;
    }
    
    const payout = isWin ? Math.floor(betAmount * odds * 100) / 100 : 0;
    return { isWin, payout };
  }
  
  const numberPart = parts[2] !== undefined ? parseInt(parts[2]) : undefined;
  
  const digitIndex = ["A", "B", "C", "D", "E", "SUM"].indexOf(digitPart);
  const resultValue = digitPart === "SUM" ? result.sum : (result.digits[digitIndex] ?? 0);
  
  if (typePart === "big") {
    isWin = digitPart === "SUM" ? result.sum >= 23 : resultValue >= 5;
    odds = 1.98;
  } else if (typePart === "small") {
    isWin = digitPart === "SUM" ? result.sum < 23 : resultValue < 5;
    odds = 1.98;
  } else if (typePart === "odd") {
    isWin = resultValue % 2 === 1;
    odds = 1.98;
  } else if (typePart === "even") {
    isWin = resultValue % 2 === 0;
    odds = 1.98;
  } else if (typePart === "number" && numberPart !== undefined) {
    isWin = resultValue === numberPart;
    odds = 9;
  }
  
  const payout = isWin ? Math.floor(betAmount * odds * 100) / 100 : 0;
  return { isWin, payout };
};

// ============= 5D ENGINE INSTANCE =============

const fiveDEngine = new GameEngineBase<FiveDRoundResult, FiveDResultEvent>({
  gameId: GAME_ID,
  durations: DURATIONS,
  tickIntervalMs: 250,
  debug: DEBUG_5D,
  
  getGameType: (duration) => `${duration}min`,
  
  generateResult: (duration, roundKey): FiveDRoundResult => {
    const gameType = `${duration}min`;
    const digits = generateBiasedDigits(gameType, roundKey);
    const sum = digits.reduce((a, b) => a + b, 0);
    const bigSmall = sum >= 23 ? "Big" : "Small";
    const oddEven = sum % 2 === 0 ? "Even" : "Odd";
    
    const parts = roundKey.split(":");
    const timestamp = parts.length >= 3 ? parseInt(parts[2]) : Date.now();
    
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const modeCode = { 1: "A", 3: "B", 5: "C", 10: "D" }[duration as FiveDDuration] || "A";
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const durationMs = (duration as number) * 60 * 1000;
    const dailySerial = Math.floor((timestamp - dayStart) / durationMs) + 1;
    const tradeId = `5D-${year}${month}${day}-${modeCode}-${String(dailySerial).padStart(4, "0")}`;
    
    return {
      tradeId,
      gameType: `${duration}min`,
      digits,
      sum,
      bigSmall,
      oddEven,
      endedAt: new Date().toISOString(),
      duration,
      roundKey,
    };
  },
  
  evaluateBet: evaluate5DBet,
  
  loadBetHistory: (gameType) => {
    return loadMyHistory("fiveD", gameType);
  },
  
  saveBetHistory: (gameType, history) => {
    saveMyHistory("fiveD", gameType, history);
  },
  
  createBetResult: (duration, roundKey, bet, result, isWin, payout): FiveDResultEvent => {
    return {
      duration: duration as FiveDDuration,
      roundKey,
      tradeId: result.tradeId || roundKey.split(":")[2] || roundKey,
      outcome: isWin ? "WIN" : "LOSE",
      betType: bet.betType,
      sum: result.sum,
      digits: result.digits,
      betAmount: bet.betAmount,
      payout: isWin ? payout : 0,
      ts: Date.now(),
    };
  },
});

// ============= PUBLIC API =============

export const start5DEngine = (cbs: FiveDEngineCallbacks = {}): (() => void) => {
  const engineCallbacks: EngineCallbacks<FiveDRoundResult> = {
    onTick: cbs.onTick ? (states) => cbs.onTick!(states as Record<FiveDDuration, DurationState>) : undefined,
    onRoundEnd: cbs.onRoundEnd ? (duration, roundKey, result) => {
      cbs.onRoundEnd!(duration as FiveDDuration, roundKey, result);
    } : undefined,
  };
  
  return fiveDEngine.start(engineCallbacks);
};

export const stop5DEngine = (): void => {
  fiveDEngine.stop();
};

export const is5DEngineRunning = (): boolean => {
  return fiveDEngine.isRunning();
};

export const get5DRoundState = (duration: FiveDDuration): DurationState | null => {
  return fiveDEngine.getRoundState(duration);
};

export const getCurrentRoundKey = (duration: FiveDDuration): string => {
  return fiveDEngine.getCurrentRoundKey(duration);
};

export const getRemainingSeconds = (duration: FiveDDuration): number => {
  return fiveDEngine.getRemainingSeconds(duration);
};

export const sweepPendingBets = (): number => {
  return fiveDEngine.sweepPendingBets();
};

export const addSettlementListener = (listener: FiveDSettlementListener): (() => void) => {
  return fiveDEngine.addSettlementListener(listener as SettlementListener<FiveDRoundResult>);
};

export const addResultListener = (listener: FiveDResultListener): (() => void) => {
  return fiveDEngine.addResultListener(listener);
};

export const getRoundResult = (roundKey: string): FiveDRoundResult | null => {
  return fiveDEngine.getRoundResult(roundKey);
};

export const extractTradeIdFromRoundKey = (roundKey: string): string => {
  const parts = roundKey.split(":");
  return parts[2] || roundKey;
};

export const getPeriodFromRoundKey = (roundKey: string, duration?: FiveDDuration): string => {
  const parts = roundKey.split(":");
  const roundDuration = duration || (parts.length >= 2 ? parseInt(parts[1]) as FiveDDuration : 1);
  const timestamp = parts.length >= 3 ? parseInt(parts[2]) : Date.now();
  
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;
  
  const modeCode = { 1: "A", 3: "B", 5: "C", 10: "D" }[roundDuration] || "A";
  
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const durationMs = roundDuration * 60 * 1000;
  const dailySerial = Math.floor((timestamp - dayStart) / durationMs) + 1;
  
  return `5D-${dateStr}-${modeCode}-${String(dailySerial).padStart(4, "0")}`;
};
