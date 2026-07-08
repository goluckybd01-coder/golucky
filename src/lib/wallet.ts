/**
 * DEPRECATED: LocalStorage Wallet - DO NOT USE
 * 
 * This file is kept for backward compatibility ONLY.
 * All wallet operations should use useWalletDB hook instead.
 * 
 * The database-backed wallet (walletService.ts) is the source of truth.
 */

import { formatTaka } from "@/lib/currency";

// DEPRECATED: These constants are no longer used
const WALLET_BALANCE_KEY = "golucky_wallet_balance";
const WALLET_HISTORY_KEY = "golucky_wallet_history";

export interface WalletTransaction {
  id: string;
  type: "bet" | "win" | "deposit" | "withdraw";
  amount: number;
  balance: number;
  gameName?: string;
  tradeId?: string;
  timestamp: string;
  description: string;
}

/**
 * @deprecated Use useWalletDB hook instead
 * Returns 0 - does NOT initialize with fake balance
 */
export const getWalletBalance = (): number => {
  console.warn("[DEPRECATED] getWalletBalance called - use useWalletDB instead");
  return 0; // Return 0, NOT a fake balance
};

/**
 * @deprecated Use useWalletDB hook instead
 * No-op function - does nothing
 */
export const setWalletBalance = (_amount: number): void => {
  console.warn("[DEPRECATED] setWalletBalance called - use useWalletDB instead");
  // No-op - don't write to localStorage
};

/**
 * @deprecated Use useWalletDB hook instead
 * Returns false - always fails
 */
export const deductBet = (
  _amount: number,
  _gameName: string,
  _tradeId: string
): boolean => {
  console.warn("[DEPRECATED] deductBet called - use useWalletDB.placeBet instead");
  return false; // Always fail - force use of DB wallet
};

/**
 * @deprecated Use useWalletDB hook instead
 * No-op function - does nothing
 */
export const addWinnings = (
  _amount: number,
  _gameName: string,
  _tradeId: string
): void => {
  console.warn("[DEPRECATED] addWinnings called - use useWalletDB.claimWinnings instead");
  // No-op - don't write to localStorage
};

/**
 * @deprecated Use useWalletDB hook instead
 */
export const getTransactionHistory = (): WalletTransaction[] => {
  console.warn("[DEPRECATED] getTransactionHistory called - use useWalletDB instead");
  return [];
};

/**
 * Format balance for display - still valid
 */
export const formatBalance = (amount: number): string => {
  return formatTaka(amount);
};

/**
 * @deprecated Use useWalletDB hook instead
 * Returns false - always fails
 */
export const hasSufficientBalance = (_amount: number): boolean => {
  console.warn("[DEPRECATED] hasSufficientBalance called - use useWalletDB.canAfford instead");
  return false;
};

/**
 * Clear legacy localStorage wallet data
 * Call this on app init to clean up old data
 */
export const clearLegacyWalletData = (): void => {
  localStorage.removeItem(WALLET_BALANCE_KEY);
  localStorage.removeItem(WALLET_HISTORY_KEY);
  console.log("[Wallet] Legacy localStorage wallet data cleared");
};
