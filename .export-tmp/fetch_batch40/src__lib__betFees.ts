/**
 * BET FEES MODULE - Centralized fee configuration for all games
 * 
 * Each game has its own fee rate applied to bet amounts.
 * Fee is deducted from the bet amount BEFORE settlement.
 * 
 * Settlement payout = (betAmount - fee) * odds
 */

import type { GameName } from "@/lib/gameStorage";

// Fee rates per game (percentage as decimal)
const FEE_RATES: Record<GameName | "WinGo" | "K3" | "5D" | "TrxWin", number> = {
  winGo: 0.02,    // 2% fee
  WinGo: 0.02,    // alias
  k3: 0.03,       // 3% fee
  K3: 0.03,       // alias
  fiveD: 0.02,    // 2% fee
  "5D": 0.02,     // alias
  trxWin: 0.02,   // 2% fee
  TrxWin: 0.02,   // alias
};

/**
 * Get fee rate for a specific game
 */
export const getFeeRate = (game: string): number => {
  return FEE_RATES[game as keyof typeof FEE_RATES] ?? 0.02;
};

/**
 * Calculate fee amount from bet
 * @param amount - Total bet amount
 * @param rate - Fee rate (decimal, e.g., 0.02 for 2%)
 * @returns Fee amount (rounded to 2 decimals)
 */
export const calcFee = (amount: number, rate: number): number => {
  return Math.round(amount * rate * 100) / 100;
};

/**
 * Calculate fee for a specific game
 */
export const calcGameFee = (amount: number, game: string): number => {
  return calcFee(amount, getFeeRate(game));
};

/**
 * Get net bet amount after fee deduction
 */
export const getNetBetAmount = (amount: number, game: string): number => {
  const fee = calcGameFee(amount, game);
  return Math.round((amount - fee) * 100) / 100;
};

/**
 * Get full bet breakdown
 */
export interface BetBreakdown {
  amount: number;      // Original bet amount
  feeRate: number;     // Fee rate as decimal
  feePercent: string;  // Fee rate as display string (e.g., "2%")
  fee: number;         // Fee amount
  netAmount: number;   // Amount after fee (used for payout calc)
}

export const getBetBreakdown = (amount: number, game: string): BetBreakdown => {
  const feeRate = getFeeRate(game);
  const fee = calcFee(amount, feeRate);
  const netAmount = Math.round((amount - fee) * 100) / 100;
  
  return {
    amount,
    feeRate,
    feePercent: `${Math.round(feeRate * 100)}%`,
    fee,
    netAmount,
  };
};

// ============= IDEMPOTENT BET KEYS =============

const PENDING_BETS_KEY = "PENDING_BET_KEYS";

/**
 * Generate unique bet key for idempotency
 */
export const makeBetKey = (
  game: string,
  duration: number | string,
  roundKey: string,
  betType: string,
  amount: number
): string => {
  return `${game}:${duration}:${roundKey}:${betType}:${amount}`;
};

/**
 * Load pending bet keys from localStorage
 */
const loadPendingBetKeys = (): Set<string> => {
  try {
    const stored = localStorage.getItem(PENDING_BETS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

/**
 * Save pending bet keys to localStorage
 */
const savePendingBetKeys = (keys: Set<string>): void => {
  try {
    // Keep only last 500 entries to prevent bloat
    const arr = Array.from(keys).slice(-500);
    localStorage.setItem(PENDING_BETS_KEY, JSON.stringify(arr));
  } catch {
    // Ignore storage errors
  }
};

/**
 * Check if a bet key already exists (prevent duplicate bets)
 */
export const isBetKeyExists = (betKey: string): boolean => {
  return loadPendingBetKeys().has(betKey);
};

/**
 * Mark a bet key as placed (idempotent)
 * @returns true if newly added, false if already exists
 */
export const markBetKeyPlaced = (betKey: string): boolean => {
  const keys = loadPendingBetKeys();
  if (keys.has(betKey)) {
    return false; // Already exists
  }
  keys.add(betKey);
  savePendingBetKeys(keys);
  return true;
};

/**
 * Clear old bet keys (cleanup after round ends)
 * @param roundKeyPrefix - Prefix to match (e.g., "WinGo:0.5:1234567890")
 */
export const clearBetKeysForRound = (roundKeyPrefix: string): void => {
  const keys = loadPendingBetKeys();
  const newKeys = new Set(
    Array.from(keys).filter(key => !key.includes(roundKeyPrefix))
  );
  savePendingBetKeys(newKeys);
};

/**
 * Clear all pending bet keys
 */
export const clearAllBetKeys = (): void => {
  localStorage.removeItem(PENDING_BETS_KEY);
};
