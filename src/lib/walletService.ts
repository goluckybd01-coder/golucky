/**
 * Supabase-backed Wallet Service
 * Handles wallet operations with database persistence
 * SECURITY: Uses atomic database functions to prevent race conditions
 */

import { supabase } from "@/integrations/supabase/client";
import { formatTaka } from "@/lib/currency";

// Cache user to avoid repeated auth calls
let cachedUser: { id: string } | null = null;
let userCacheTime = 0;
const USER_CACHE_TTL = 30000; // 30 seconds

const getCachedUser = async () => {
  const now = Date.now();
  if (cachedUser && now - userCacheTime < USER_CACHE_TTL) {
    return cachedUser;
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    cachedUser = { id: user.id };
    userCacheTime = now;
  } else {
    cachedUser = null;
  }
  return cachedUser;
};

// Clear cache on auth state change
supabase.auth.onAuthStateChange(() => {
  cachedUser = null;
  userCacheTime = 0;
});

export interface WalletData {
  id: string;
  user_id: string;
  balance: number;
  total_deposit: number;
  total_withdraw: number;
  total_bet: number;
  total_win: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransactionDB {
  id: string;
  user_id: string;
  type: "deposit" | "withdraw" | "bet" | "win" | "bonus" | "referral";
  amount: number;
  balance_after: number;
  description: string | null;
  game_type: string | null;
  trade_id: string | null;
  created_at: string;
}

/**
 * Get user's wallet data (cached user)
 */
export const fetchWallet = async (): Promise<WalletData | null> => {
  const user = await getCachedUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching wallet:", error);
    return null;
  }

  return data;
};

/**
 * Get wallet balance
 */
export const fetchWalletBalance = async (): Promise<number> => {
  const wallet = await fetchWallet();
  return wallet?.balance ?? 0;
};

/**
 * Deduct bet amount from wallet - ATOMIC OPERATION
 * Uses database function with row locking to prevent race conditions
 */
export const deductBetDB = async (
  amount: number,
  gameType: string,
  tradeId: string
): Promise<{ success: boolean; newBalance: number; error?: string }> => {
  const user = await getCachedUser();
  if (!user) {
    return { success: false, newBalance: 0, error: "Not authenticated" };
  }

  if (amount <= 0) {
    return { success: false, newBalance: 0, error: "Invalid bet amount" };
  }

  if (!gameType || !tradeId) {
    return { success: false, newBalance: 0, error: "Missing game type or trade ID" };
  }

  // Use secure atomic database function
  const { data, error } = await supabase.rpc("secure_deduct_bet", {
    p_user_id: user.id,
    p_amount: amount,
    p_game_type: gameType,
    p_trade_id: tradeId,
  });

  if (error) {
    console.error("Error in secure bet deduction:", error);
    return { success: false, newBalance: 0, error: error.message };
  }

  const result = data as { success: boolean; new_balance?: number; error?: string };
  return {
    success: result.success,
    newBalance: result.new_balance ?? 0,
    error: result.error ?? undefined,
  };
};

/**
 * Add winnings to wallet - ATOMIC OPERATION
 * Uses database function with row locking to prevent race conditions
 */
export const addWinningsDB = async (
  amount: number,
  gameType: string,
  tradeId: string
): Promise<{ success: boolean; newBalance: number; error?: string }> => {
  const user = await getCachedUser();
  if (!user) {
    return { success: false, newBalance: 0, error: "Not authenticated" };
  }

  if (amount <= 0) {
    return { success: false, newBalance: 0, error: "Invalid winnings amount" };
  }

  if (!gameType || !tradeId) {
    return { success: false, newBalance: 0, error: "Missing game type or trade ID" };
  }

  // Use secure atomic database function
  const { data, error } = await supabase.rpc("secure_add_winnings", {
    p_user_id: user.id,
    p_amount: amount,
    p_game_type: gameType,
    p_trade_id: tradeId,
  });

  if (error) {
    console.error("Error in secure winnings addition:", error);
    return { success: false, newBalance: 0, error: error.message };
  }

  const result = data as { success: boolean; new_balance?: number; error?: string };
  return {
    success: result.success,
    newBalance: result.new_balance ?? 0,
    error: result.error ?? undefined,
  };
};

/**
 * Get transaction history
 */
export const fetchTransactionHistory = async (
  limit: number = 50
): Promise<WalletTransactionDB[]> => {
  const user = await getCachedUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }

  return data || [];
};

/**
 * Format balance for display - uses centralized currency utility
 */
export const formatBalance = (amount: number): string => {
  return formatTaka(amount);
};
