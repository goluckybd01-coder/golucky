/**
 * DEPRECATED: LocalStorage-based wallet hook
 * 
 * This hook is kept for backward compatibility ONLY.
 * All components should use useWalletDB instead.
 * 
 * This wrapper now redirects to useWalletDB.
 */

import { useWalletDB } from "@/hooks/useWalletDB";
import { useEffect } from "react";

/**
 * @deprecated Use useWalletDB directly instead
 * This is a compatibility wrapper that logs deprecation warnings
 */
export const useWallet = () => {
  // Log deprecation warning once on mount
  useEffect(() => {
    console.warn(
      "[DEPRECATED] useWallet hook is deprecated. Use useWalletDB instead for database-backed wallet operations."
    );
  }, []);

  // Redirect to the database-backed wallet hook
  const walletDB = useWalletDB();

  // Return same interface for compatibility
  return {
    balance: walletDB.balance,
    formattedBalance: walletDB.formattedBalance,
    transactions: walletDB.transactions,
    placeBet: walletDB.placeBet,
    claimWinnings: walletDB.claimWinnings,
    canAfford: walletDB.canAfford,
    refreshBalance: walletDB.refreshBalance,
  };
};
