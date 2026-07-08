// Unified game storage utilities for all games
// Same storage structure logic for WinGo, K3, 5D, TrxWin
// 
// DO NOT CHANGE KEY FORMAT — used across settlement/history/cache

// DEBUG FLAG - set to true to enable K3 settlement traces
const DEBUG_K3 = true;

import { getNumberColors } from "@/lib/numberColors";
import { makeRoundKey, getDurationFromGameType, type K3Duration } from "@/lib/k3RoundKey";
import { generatePeriodHistory, type GameMode, type GameName as PeriodGameName } from "@/lib/periodNumber";

export type GameName = "winGo" | "k3" | "fiveD" | "trxWin";

// localStorage keys for each game type
export const getStorageKeys = (gameName: GameName, gameType: string) => {
  const typeKey = gameType === "30sec" ? "30s" : gameType === "1min" ? "1m" : gameType === "3min" ? "3m" : gameType === "5min" ? "5m" : "10m";
  return {
    history: `${gameName}_${typeKey}_history`,
    myHistory: `${gameName}_${typeKey}_myHistory`,
  };
};

// Validation helpers for 5D history items
const isValidFiveDDigits = (digits: any): digits is number[] =>
  Array.isArray(digits) &&
  digits.length === 5 &&
  digits.every((d) => typeof d === "number" && Number.isFinite(d) && d >= 0 && d <= 9);

const isValidFiveDHistoryItem = (item: any): boolean => {
  if (!item || typeof item !== "object") return false;
  if (typeof item.period !== "string" || item.period.length < 8) return false;
  if (!isValidFiveDDigits(item.digits)) return false;
  const expectedSum = (item.digits as number[]).reduce((a, b) => a + b, 0);
  if (typeof item.sum !== "number" || item.sum !== expectedSum) return false;
  return true;
};

const isValidNumberHistoryItem = (item: any): boolean => {
  if (!item || typeof item !== "object") return false;
  return typeof item.number === "number" && Number.isFinite(item.number) && item.number >= 0 && item.number <= 9;
};

// Generate game history with different seeds per game type - uses period numbers
export const generateGameHistory = (gameName: GameName, gameType: string) => {
  const storageKey = getStorageKeys(gameName, gameType).history;
  const stored = localStorage.getItem(storageKey);

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate ALL items (not just first) for 5D to catch partial corruption
        if (gameName === "fiveD") {
          const allValid = parsed.every(isValidFiveDHistoryItem);
          if (allValid) return parsed;
          // Invalid - clear and regenerate
          console.warn(`[5D] Invalid history detected for ${gameType}, regenerating...`);
          localStorage.removeItem(storageKey);
        } else {
          if (isValidNumberHistoryItem(parsed[0])) return parsed;
        }
      }
    } catch {
      // Corrupted JSON - remove and regenerate
      localStorage.removeItem(storageKey);
    }
  }

  // Generate fresh history
  const history = [];
  const periodHistory = generatePeriodHistory(gameName as PeriodGameName, gameType as GameMode, 11);
  const gameSeed = gameName.charCodeAt(0) + gameName.length;
  const typeSeed = gameType.split("").reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
  const seed = typeSeed + gameSeed;

  for (let i = 0; i < 11; i++) {
    const rowSeed = seed + i * 17 + Math.floor(seed / 3) + i;

    if (gameName === "fiveD") {
      const digits = Array.from({ length: 5 }, (_, j) =>
        Math.abs((rowSeed * (j + 1) + i * 7 + j * 13) % 10)
      );
      const sum = digits.reduce((a, b) => a + b, 0);
      history.push({
        period: periodHistory[i],
        digits,
        sum,
        bigSmall: sum >= 23 ? "Big" : "Small",
        oddEven: sum % 2 === 0 ? "Even" : "Odd",
      });
    } else {
      const num = Math.abs(rowSeed) % 10;
      history.push({
        period: periodHistory[i],
        number: num,
        bigSmall: num >= 5 ? "Big" : "Small",
        colors: getNumberColors(num),
      });
    }
  }

  localStorage.setItem(storageKey, JSON.stringify(history));
  return history;
};

// Generate statistics for each game type (derived from history)
export const generateStatisticsData = (gameType: string, gameName: GameName = "winGo") => {
  const gameSeed = gameName.charCodeAt(0) + gameName.length;
  const seed = gameType.charCodeAt(0) + gameType.length + gameSeed;
  return {
    winning: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    missing: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, i) => (seed + i * 3) % 30),
    avgMissing: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, i) => (seed + i * 4 + 5) % 30),
    frequency: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, i) => (seed + i * 2 + 3) % 20),
    maxConsecutive: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, i) => (seed + i) % 5 + 1),
  };
};

// Generate recent results from history
export const generateRecentResults = (gameName: GameName, gameType: string): number[] => {
  const history = generateGameHistory(gameName, gameType);

  // 5D doesn't have `number` field; use A digit as the compact recent result.
  if (gameName === "fiveD") {
    return history.slice(0, 5).map((h: any) => {
      if (Array.isArray(h?.digits) && typeof h.digits[0] === "number") return h.digits[0];
      if (typeof h?.sum === "number") return h.sum % 10;
      return 0;
    });
  }

  return history.slice(0, 5).map((h: any) => {
    if (typeof h?.number === "number") return h.number;
    if (typeof h?.sum === "number") return h.sum;
    return 0;
  });
};

// Load my bet history from localStorage
// NOTE: Pending entries (result === null) are PRESERVED so they show in My History
// They will be updated to Win/Lose when settlement runs
export const loadMyHistory = (gameName: GameName, gameType: string) => {
  const storageKey = getStorageKeys(gameName, gameType).myHistory;
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Return ALL entries including pending ones (result === null)
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
    } catch (e) {
      return [];
    }
  }
  return [];
};

// Save my bet history to localStorage
export const saveMyHistory = (gameName: GameName, gameType: string, history: any[]) => {
  const storageKey = getStorageKeys(gameName, gameType).myHistory;
  localStorage.setItem(storageKey, JSON.stringify(history));
};

// Save game history to localStorage
export const saveGameHistory = (gameName: GameName, gameType: string, history: any[]) => {
  const storageKey = getStorageKeys(gameName, gameType).history;
  localStorage.setItem(storageKey, JSON.stringify(history));
};

// Bet history item type
// Duration can be K3Duration (1,3,5,10) or WinGoDuration (0.5,1,3,5)
export interface BetHistoryItem {
  period: string;
  betType: string;
  betAmount: number;        // Original bet amount
  fee?: number;             // Commission fee deducted
  netAmount?: number;       // Net amount after fee (used for payout calc)
  result: number | null;
  isWin: boolean | null;
  payout: number;
  timestamp: Date;
  // Duration dimension for strict filtering (supports both K3 and WinGo)
  duration?: number; // Changed from K3Duration to number to support 0.5 (30sec)
  roundKey?: string;
  betId?: string; // Unique bet identifier
  betKey?: string; // Idempotency key
}

// Pending bet type
// Extended betKind to support K3 advanced bet types (3same, 2same, different, consecutive)
export interface PendingBet {
  gameType: string;
  tradeId: string;
  betKind: string; // Extended to string to support K3 advanced types
  betValue: number | string; // Extended to support K3 advanced values
  stake: number;
  multiplier: number;
  totalStake: number;
  createdAt: string;
  // Duration dimension for strict matching (supports both K3 and WinGo)
  duration?: number; // Changed from K3Duration to number to support 0.5 (30sec)
  roundKey?: string;
  betId?: string; // Unique bet identifier
}

// Result data type
export interface ResultData {
  gameType: string;
  tradeId: string;
  number: number;
  colors: string[];
  bigSmall: "Big" | "Small";
  hasBet: boolean;
  isWin?: boolean;
  finalPayout?: number;
  betAmount?: number;
  dice?: [number, number, number]; // K3 dice values
}

// ============= ROUND RESULTS CACHE =============
// Stores completed round results keyed by roundKey for resolving pending bets
// For K3, roundKey = K3:{duration}:{tradeId} to ensure duration isolation
// For WinGo, roundKey = WinGo:{duration}:{roundStartMs}
export interface RoundResult {
  tradeId: string;
  gameType: string;
  dice?: [number, number, number]; // K3 only
  sum: number; // K3: 3-18, WinGo: 0-9
  bigSmall: "Big" | "Small";
  oddEven?: "Odd" | "Even"; // K3 only
  colors?: string[]; // WinGo only
  endedAt: string;
  // Duration dimension (supports both K3 and WinGo)
  duration?: number; // Changed from K3Duration to number to support 0.5 (30sec)
  roundKey?: string;
}

const ROUND_RESULTS_KEY = (gameName: GameName) => `${gameName}_roundResults`;

// Load round results cache from localStorage
export const loadRoundResults = (gameName: GameName): Record<string, RoundResult> => {
  try {
    const stored = localStorage.getItem(ROUND_RESULTS_KEY(gameName));
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Save a round result to the cache
// For K3, uses roundKey (K3:{duration}:{tradeId}) as the cache key
export const saveRoundResult = (gameName: GameName, result: RoundResult) => {
  const cache = loadRoundResults(gameName);
  
  // Use roundKey as cache key if available (K3), otherwise use tradeId (WinGo)
  const cacheKey = result.roundKey || result.tradeId;
  cache[cacheKey] = result;
  
  // Keep only last 100 results to prevent localStorage bloat
  const entries = Object.entries(cache);
  if (entries.length > 100) {
    const sorted = entries.sort((a, b) => 
      new Date(b[1].endedAt).getTime() - new Date(a[1].endedAt).getTime()
    );
    const trimmed = Object.fromEntries(sorted.slice(0, 100));
    localStorage.setItem(ROUND_RESULTS_KEY(gameName), JSON.stringify(trimmed));
  } else {
    localStorage.setItem(ROUND_RESULTS_KEY(gameName), JSON.stringify(cache));
  }
};

// Get a specific round result by roundKey (K3) or tradeId (WinGo)
export const getRoundResult = (gameName: GameName, key: string): RoundResult | null => {
  const cache = loadRoundResults(gameName);
  return cache[key] || null;
};

// Get K3 round result by duration and tradeId (constructs roundKey internally)
export const getK3RoundResult = (duration: K3Duration, tradeId: string): RoundResult | null => {
  const roundKey = makeRoundKey(duration, tradeId);
  return getRoundResult("k3", roundKey);
};

// ============= PENDING BET RESOLVER =============
// K3 specific odds for sum bets
const K3_NUMBER_ODDS: Record<number, number> = {
  3: 207.36, 4: 69.12, 5: 34.56, 6: 20.74,
  7: 13.83, 8: 9.88, 9: 8.3, 10: 7.68,
  11: 7.68, 12: 8.3, 13: 9.88, 14: 13.83,
  15: 20.74, 16: 34.56, 17: 69.12, 18: 207.36,
};

// WinGo odds
const WINGO_ODDS = {
  number: 9,
  color: 2,
  violet: 4.5,
  bigSmall: 2,
};

// Evaluate a single bet against a round result
// Uses netAmount (after fee) for payout calculations if available
export const evaluateBet = (
  bet: BetHistoryItem,
  result: RoundResult,
  gameName: GameName
): { isWin: boolean; payout: number } => {
  const betType = bet.betType.toLowerCase();
  // Use netAmount if available (fee already deducted), otherwise use betAmount
  const betAmount = bet.netAmount ?? bet.betAmount;
  let isWin = false;
  let odds = 1;

  if (gameName === "k3") {
    // K3 bet evaluation
    const dice = result.dice || [1, 1, 1];
    const sorted = [...dice].sort();
    const unique = new Set(dice).size;
    
    if (betType.startsWith("sum ")) {
      const sumValue = parseInt(betType.replace("sum ", ""));
      isWin = sumValue === result.sum;
      odds = K3_NUMBER_ODDS[sumValue] || 2;
    } else if (betType === "big") {
      isWin = result.bigSmall === "Big";
      odds = 1.92;
    } else if (betType === "odd") {
      isWin = result.oddEven === "Odd";
      odds = 1.92;
    } else if (betType === "even") {
      isWin = result.oddEven === "Even";
      odds = 1.92;
    } else if (betType === "small") {
      isWin = result.bigSmall === "Small";
      odds = 1.92;
    } else if (betType.startsWith("3same-all")) {
      // Any triple (all 3 dice same)
      isWin = unique === 1;
      odds = 30;
    } else if (betType.startsWith("3same-single")) {
      // Specific triple e.g. "3same-single 111" - parse value from betType
      const parts = betType.split(" ");
      const betValue = parts[1] || "";
      const targetNum = parseInt(betValue[0]);
      isWin = unique === 1 && dice[0] === targetNum;
      odds = 180;
    } else if (betType.startsWith("2same-multiple")) {
      // Any pair with any third number e.g. "2same-multiple 11X"
      const parts = betType.split(" ");
      const betValue = parts[1] || "";
      const pairNum = parseInt(betValue[0]);
      const pairCount = dice.filter(d => d === pairNum).length;
      isWin = pairCount >= 2 && unique === 2;
      odds = 11;
    } else if (betType.startsWith("2same-single")) {
      // Specific pair + specific third e.g. "2same-single 112"
      const parts = betType.split(" ");
      const betValue = parts[1] || "";
      const pairNum = parseInt(betValue[0]);
      const thirdNum = parseInt(betValue[2]);
      isWin = sorted[0] === Math.min(pairNum, thirdNum) && 
              sorted[1] === pairNum && 
              sorted[2] === Math.max(pairNum, thirdNum) &&
              dice.filter(d => d === pairNum).length === 2 &&
              dice.includes(thirdNum);
      odds = 55;
    } else if (betType.startsWith("3different")) {
      // 3 different selected numbers e.g. "3different 1-2-3"
      const parts = betType.split(" ");
      const betValue = parts[1] || "";
      const nums = betValue.split("-").map(Number);
      isWin = unique === 3 && nums.every(n => dice.includes(n));
      odds = 30;
    } else if (betType.startsWith("2different")) {
      // 2 different selected numbers e.g. "2different 1-2"
      const parts = betType.split(" ");
      const betValue = parts[1] || "";
      const nums = betValue.split("-").map(Number);
      isWin = nums.every(n => dice.includes(n));
      odds = 5;
    } else if (betType === "consecutive") {
      // 3 consecutive numbers: 123, 234, 345, 456
      const consecutives = [[1,2,3], [2,3,4], [3,4,5], [4,5,6]];
      isWin = unique === 3 && consecutives.some(seq => seq.every(n => dice.includes(n)));
      odds = 8;
    }
  } else {
    // WinGo bet evaluation
    if (betType.startsWith("number ")) {
      const numValue = parseInt(betType.replace("number ", ""));
      isWin = numValue === result.sum;
      odds = WINGO_ODDS.number;
    } else if (betType === "green" || betType === "red") {
      isWin = result.colors?.includes(betType) || false;
      odds = WINGO_ODDS.color;
    } else if (betType === "violet") {
      isWin = result.colors?.includes("violet") || false;
      odds = WINGO_ODDS.violet;
    } else if (betType === "big") {
      isWin = result.bigSmall === "Big";
      odds = WINGO_ODDS.bigSmall;
    } else if (betType === "small") {
      isWin = result.bigSmall === "Small";
      odds = WINGO_ODDS.bigSmall;
    }
  }

  const payout = isWin ? Math.round(betAmount * odds * 100) / 100 : 0;
  return { isWin, payout };
};

// Resolve ALL pending bets for a given game type using cached round results
// For K3: Uses roundKey to match bets to results (duration-isolated)
// Returns: { updatedHistory, resolvedCount, totalPayout, hasAnyWin, winCount, loseCount, totalBetAmount, resolvedTradeIds, resolvedResults }
export const resolveAllPendingBets = (
  gameName: GameName,
  gameType: string,
  claimWinnings?: (amount: number, game: string, tradeId: string) => void
): {
  updatedHistory: BetHistoryItem[];
  resolvedCount: number;
  totalPayout: number;
  hasAnyWin: boolean;
  winCount: number;
  loseCount: number;
  totalBetAmount: number;
  resolvedTradeIds: string[];
  resolvedResults: Record<string, RoundResult>;
} => {
  const myHistory = loadMyHistory(gameName, gameType);
  const roundResults = loadRoundResults(gameName);
  const duration = getDurationFromGameType(gameType);
  
  // DEBUG: Log sweep resolver invocation
  if (DEBUG_K3 && gameName === "k3") {
    const pendingCount = myHistory.filter((e: BetHistoryItem) => e.result === null).length;
    const cachedKeys = Object.keys(roundResults);
    console.log(`[K3 DEBUG] resolveAllPendingBets | gameType=${gameType} | duration=${duration}min | pendingBets=${pendingCount} | cachedResults=${cachedKeys.length}`);
  }
  
  let resolvedCount = 0;
  let totalPayout = 0;
  let hasAnyWin = false;
  let winCount = 0;
  let loseCount = 0;
  let totalBetAmount = 0;
  const resolvedTradeIds: string[] = [];
  const resolvedResults: Record<string, RoundResult> = {};

  // Update ALL pending entries that have a matching round result
  // Uses map() to update ALL matches, NOT find()
  const updatedHistory = myHistory.map((entry: BetHistoryItem) => {
    // Skip if already resolved (idempotent)
    if (entry.result !== null) return entry;

    // For K3, construct roundKey from entry's duration/period or gameType
    // Priority: use stored roundKey > construct from duration+period > fallback to period
    let cacheKey: string;
    if (gameName === "k3") {
      if (entry.roundKey) {
        cacheKey = entry.roundKey;
      } else {
        const entryDuration = (entry.duration || duration) as K3Duration;
        cacheKey = makeRoundKey(entryDuration, entry.period);
      }
    } else {
      cacheKey = entry.roundKey || entry.period;
    }

    // Check if we have a result for this round
    const result = roundResults[cacheKey];
    if (!result) return entry; // No result yet, keep pending

    // Evaluate the bet
    const { isWin, payout } = evaluateBet(entry, result, gameName);
    
    resolvedCount++;
    totalPayout += payout;
    totalBetAmount += entry.betAmount;
    
    if (isWin) {
      hasAnyWin = true;
      winCount++;
    } else {
      loseCount++;
    }
    
    if (!resolvedTradeIds.includes(entry.period)) {
      resolvedTradeIds.push(entry.period);
      resolvedResults[entry.period] = result;
    }

    // Claim winnings if callback provided
    if (isWin && payout > 0 && claimWinnings) {
      claimWinnings(payout, gameName === "k3" ? "K3" : "Win Go", entry.period);
    }

    // Return resolved entry (idempotent update)
    return {
      ...entry,
      result: result.sum,
      isWin,
      payout,
    };
  });

  // Save updated history if any were resolved
  if (resolvedCount > 0) {
    saveMyHistory(gameName, gameType, updatedHistory);
  }

  return { 
    updatedHistory, 
    resolvedCount, 
    totalPayout, 
    hasAnyWin, 
    winCount, 
    loseCount, 
    totalBetAmount, 
    resolvedTradeIds,
    resolvedResults 
  };
};

// Count pending bets for a specific game type
export const countPendingBets = (gameName: GameName, gameType: string): number => {
  const myHistory = loadMyHistory(gameName, gameType);
  return myHistory.filter((entry: BetHistoryItem) => entry.result === null).length;
};
