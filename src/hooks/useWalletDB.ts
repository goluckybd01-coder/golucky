/**
 * useWalletDB - Database-backed Wallet Hook
 * 
 * This is the primary hook for wallet operations across the app.
 * It now delegates to the global WalletContext for consistency.
 * 
 * For new code, prefer using useWalletContext directly.
 */

import { useWalletContext, type WalletContextValue } from "@/context/WalletContext";
import { formatTaka } from "@/lib/currency";
import type { WalletTransactionDB } from "@/lib/walletService";

export const useWalletDB = () => {
  // Use global wallet context
  let wallet: WalletContextValue | null = null;
  
  try {
    wallet = useWalletContext();
  } catch {
    // Context not available - use fallback
    wallet = null;
  }
  
  if (wallet) {
    // Return context-compatible interface
    return {
      balance: wallet.balance,
      formattedBalance: wallet.formattedBalance,
      transactions: [] as WalletTransactionDB[], // Transactions are fetched separately if needed
      isLoading: wallet.isLoading,
      isAuthenticated: wallet.isAuthenticated,
      placeBet: wallet.placeBet,
      claimWinnings: wallet.claimWinnings,
      canAfford: wallet.canAfford,
      refreshBalance: wallet.refresh,
      loadBalance: wallet.loadBalance,
    };
  }

  // Fallback for components outside provider (shouldn't happen normally)
  console.warn('[useWalletDB] No WalletProvider found - using fallback');
  return {
    balance: 0,
    formattedBalance: formatTaka(0),
    transactions: [] as WalletTransactionDB[],
    isLoading: false,
    isAuthenticated: false,
    placeBet: async () => false,
    claimWinnings: async () => false,
    canAfford: () => false,
    refreshBalance: async () => {},
    loadBalance: async () => {},
  };
};
