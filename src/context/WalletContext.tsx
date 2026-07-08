/**
 * Global Wallet Context - SINGLE SOURCE OF TRUTH
 * 
 * Backend is the sole authority for balance.
 * NO optimistic updates - all mutations call backend first, then refresh.
 * Every balance read comes from the edge function or Supabase.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formatTaka } from '@/lib/currency';
import { getWalletBalanceApi, placeBetApi, settleBetApi } from '@/lib/apiFetch';

// Currency constants - single source of truth
export const CURRENCY = 'BDT';
export const CURRENCY_SYMBOL = '৳';

// Wallet state interface
export interface WalletState {
  balance: number;
  available_balance: number;
  locked_balance: number;
  total_deposit: number;
  total_withdraw: number;
  total_bet: number;
  total_win: number;
  currency: typeof CURRENCY;
  currencySymbol: typeof CURRENCY_SYMBOL;
  updatedAt: string | null;
}

// Transaction types for ledger
export type LedgerType = 
  | 'DEPOSIT' 
  | 'WITHDRAW' 
  | 'BET_DEBIT' 
  | 'BET_PAYOUT' 
  | 'BONUS' 
  | 'REFERRAL' 
  | 'REFUND' 
  | 'COMMISSION';

// Context value interface
export interface WalletContextValue extends WalletState {
  isLoading: boolean;
  isAuthenticated: boolean;
  formattedBalance: string;
  
  // Actions - no local math, always call backend
  refresh: () => Promise<void>;
  loadBalance: () => Promise<void>;
  placeBet: (amount: number, gameName: string, tradeId: string) => Promise<boolean>;
  claimWinnings: (amount: number, gameName: string, tradeId: string) => Promise<boolean>;
  canAfford: (amount: number) => boolean;
}

// Initial state
const initialState: WalletState = {
  balance: 0,
  available_balance: 0,
  locked_balance: 0,
  total_deposit: 0,
  total_withdraw: 0,
  total_bet: 0,
  total_win: 0,
  currency: CURRENCY,
  currencySymbol: CURRENCY_SYMBOL,
  updatedAt: null,
};

// Create context
export const WalletContext = createContext<WalletContextValue | null>(null);

// Preview-mode mock: shows realistic values when ?preview=1 is in the URL
// (no auth, no network). Server-side RPCs still enforce real auth for writes.
const PREVIEW_MOCK: WalletState = {
  balance: 27500,
  available_balance: 25000,
  locked_balance: 2500,
  total_deposit: 45000,
  total_withdraw: 12000,
  total_bet: 18500,
  total_win: 22000,
  currency: CURRENCY,
  currencySymbol: CURRENCY_SYMBOL,
  updatedAt: new Date().toISOString(),
};

const isPreviewMode = () =>
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("preview") === "1";

// Provider component
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const previewMode = isPreviewMode();
  const [state, setState] = useState<WalletState>(previewMode ? PREVIEW_MOCK : initialState);
  const [isLoading, setIsLoading] = useState(!previewMode);
  const [isAuthenticated, setIsAuthenticated] = useState(previewMode);

  const location = useLocation();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const userIdRef = useRef<string | null>(previewMode ? "preview-user" : null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initRef = useRef(false);


  /**
   * Load balance from backend API - SINGLE SOURCE OF TRUTH
   * No local calculations, always fetch from server
   */
  const loadBalance = useCallback(async (): Promise<void> => {
    // Preview mode: keep mock state, skip network entirely
    if (previewMode) {
      setIsLoading(false);
      return;
    }
    // Guard: skip if no valid user ID
    if (!userIdRef.current || userIdRef.current === 'null' || userIdRef.current === 'undefined') {
      console.log('[WalletContext] No user - skipping balance load');
      return;
    }


    try {
      const response = await getWalletBalanceApi();
      
      if (response.success && response.data) {
        setState({
          balance: response.data.balance,
          available_balance: response.data.balance,
          locked_balance: 0,
          total_deposit: response.data.total_deposit,
          total_withdraw: response.data.total_withdraw,
          total_bet: response.data.total_bet,
          total_win: response.data.total_win,
          currency: CURRENCY,
          currencySymbol: CURRENCY_SYMBOL,
          updatedAt: new Date().toISOString(),
        });
        console.log('[WalletContext] Balance loaded from API:', response.data.balance);
      } else {
        console.warn('[WalletContext] API balance fetch failed:', response.error);
        if (response.status === 401) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            userIdRef.current = null;
            setIsAuthenticated(false);
            setState(initialState);
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current);
              channelRef.current = null;
            }
            return;
          }
          userIdRef.current = user.id;
        }
        // Fallback to direct DB query
        await fetchWalletFromDB(userIdRef.current);
      }
    } catch (error) {
      console.error('[WalletContext] loadBalance error:', error);
      // Fallback to direct DB query
      if (userIdRef.current) {
        await fetchWalletFromDB(userIdRef.current);
      }
    }
  }, []);

  /**
   * Fallback: Fetch wallet directly from DB (when API fails)
   */
  const fetchWalletFromDB = useCallback(async (userId: string): Promise<void> => {
    // Guard: skip if no valid user ID
    if (!userId || userId === 'null' || userId === 'undefined') {
      console.log('[WalletContext] No valid userId for DB fetch, skipping');
      return;
    }

    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[WalletContext] DB fetch error:', error);
      return;
    }

    if (!data) {
      // Create wallet if not exists
      const { data: newWallet, error: insertError } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          balance: 0,
          total_deposit: 0,
          total_withdraw: 0,
          total_bet: 0,
          total_win: 0,
        })
        .select()
        .single();

      if (insertError && insertError.code !== '23505') {
        console.error('[WalletContext] Failed to create wallet:', insertError);
        return;
      }

      const wallet = newWallet || { balance: 0, total_deposit: 0, total_withdraw: 0, total_bet: 0, total_win: 0 };
      setState({
        balance: wallet.balance || 0,
        available_balance: wallet.balance || 0,
        locked_balance: 0,
        total_deposit: wallet.total_deposit || 0,
        total_withdraw: wallet.total_withdraw || 0,
        total_bet: wallet.total_bet || 0,
        total_win: wallet.total_win || 0,
        currency: CURRENCY,
        currencySymbol: CURRENCY_SYMBOL,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    setState({
      balance: data.balance || 0,
      available_balance: data.balance || 0,
      locked_balance: 0,
      total_deposit: data.total_deposit || 0,
      total_withdraw: data.total_withdraw || 0,
      total_bet: data.total_bet || 0,
      total_win: data.total_win || 0,
      currency: CURRENCY,
      currencySymbol: CURRENCY_SYMBOL,
      updatedAt: data.updated_at || new Date().toISOString(),
    });
  }, []);

  // Alias for backward compatibility
  const refresh = loadBalance;

  /**
   * Setup realtime subscription for wallet updates
   */
  const setupRealtimeSubscription = useCallback((userId: string) => {
    if (channelRef.current && userIdRef.current === userId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`wallet_global_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          setState(prev => ({
            ...prev,
            balance: (updated.balance as number) ?? prev.balance,
            available_balance: (updated.balance as number) ?? prev.balance,
            total_deposit: (updated.total_deposit as number) ?? prev.total_deposit,
            total_withdraw: (updated.total_withdraw as number) ?? prev.total_withdraw,
            total_bet: (updated.total_bet as number) ?? prev.total_bet,
            total_win: (updated.total_win as number) ?? prev.total_win,
            updatedAt: (updated.updated_at as string) || new Date().toISOString(),
          }));
          console.log('[WalletContext] Realtime update received:', updated.balance);
        }
      )
      .subscribe();

    channelRef.current = channel;
    userIdRef.current = userId;
  }, []);

  /**
   * Start polling as reliability fallback
   */
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(() => {
      loadBalance();
    }, 10000); // 10 seconds
  }, [loadBalance]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  /**
   * Refresh balance on route change
   */
  useEffect(() => {
    if (isAuthenticated && userIdRef.current) {
      console.log('[WalletContext] Route changed, refreshing balance');
      loadBalance();
    }
  }, [location.pathname, isAuthenticated, loadBalance]);

  /**
   * Initialize wallet context
   */
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Preview mode: skip all auth/network init, mock state is already loaded
    if (previewMode) {
      setIsLoading(false);
      return;
    }


    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('[WalletContext] Safety timeout - forcing loading complete');
        setIsLoading(false);
      }
    }, 3000);

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        if (userId) {
          setIsAuthenticated(true);
          userIdRef.current = userId;

          // Load balance from backend
          await loadBalance();
          setIsLoading(false);

          // Setup realtime and polling
          setupRealtimeSubscription(userId);
          startPolling();
        } else {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[WalletContext] Init error:', err);
        setIsLoading(false);
      }

      clearTimeout(safetyTimeout);
    };

    init();

    // Auth state listener
    // IMPORTANT: keep this callback synchronous. Do NOT await or call Supabase/network
    // operations inline here because it can deadlock auth flows (including admin login).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;

      setIsAuthenticated(!!session?.user);

      if (session?.user) {
        const nextUserId = session.user.id;
        userIdRef.current = nextUserId;

        // Defer Supabase/API calls so auth internal state can settle.
        setTimeout(() => {
          // Guard: user could have signed out again before this runs
          if (userIdRef.current !== nextUserId) return;
          loadBalance();
          setupRealtimeSubscription(nextUserId);
          startPolling();
        }, 0);
      } else {
        userIdRef.current = null;
        setState(initialState);
        stopPolling();
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      stopPolling();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [loadBalance, setupRealtimeSubscription, startPolling, stopPolling]);

  /**
   * Place bet - calls backend, then refreshes balance
   * NO OPTIMISTIC UPDATE - waits for backend confirmation
   */
  const placeBet = useCallback(async (
    amount: number,
    gameName: string,
    tradeId: string
  ): Promise<boolean> => {
    try {
      const response = await placeBetApi({
        game: gameName,
        amount,
        roundId: tradeId,
      });

      if (response.success && response.data) {
        // Update balance with server-confirmed value
        setState(prev => ({
          ...prev,
          balance: response.data!.newBalance,
          available_balance: response.data!.newBalance,
        }));
        console.log('[WalletContext] Bet placed successfully, new balance:', response.data.newBalance);
        return true;
      } else {
        console.error('[WalletContext] Bet failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('[WalletContext] Bet error:', error);
      return false;
    }
  }, []);

  /**
   * Claim winnings - calls backend, then refreshes balance
   * NO OPTIMISTIC UPDATE - waits for backend confirmation
   */
  const claimWinnings = useCallback(async (
    amount: number,
    gameName: string,
    tradeId: string
  ): Promise<boolean> => {
    try {
      const response = await settleBetApi({
        roundId: tradeId,
        result: '',
        winAmount: amount,
        gameType: gameName,
      });

      if (response.success && response.data) {
        // Update balance with server-confirmed value
        setState(prev => ({
          ...prev,
          balance: response.data!.newBalance,
          available_balance: response.data!.newBalance,
        }));
        console.log('[WalletContext] Winnings claimed, new balance:', response.data.newBalance);
        return true;
      } else {
        console.error('[WalletContext] Claim failed:', response.error);
        // Still refresh to get actual balance
        await loadBalance();
        return false;
      }
    } catch (error) {
      console.error('[WalletContext] Claim error:', error);
      await loadBalance();
      return false;
    }
  }, [loadBalance]);

  /**
   * Check if user can afford an amount
   */
  const canAfford = useCallback((amount: number): boolean => {
    return state.available_balance >= amount;
  }, [state.available_balance]);

  // Context value
  const value: WalletContextValue = {
    ...state,
    isLoading,
    isAuthenticated,
    formattedBalance: formatTaka(state.balance),
    refresh,
    loadBalance,
    placeBet,
    claimWinnings,
    canAfford,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// Hook to use wallet context
export function useWalletContext(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}

// Export a standalone hook that can work without provider (fallback)
export function useGlobalWallet(): WalletContextValue {
  const context = useContext(WalletContext);

  if (context) {
    return context;
  }

  console.warn('[useGlobalWallet] No WalletProvider found, using fallback');
  return {
    ...initialState,
    isLoading: false,
    isAuthenticated: false,
    formattedBalance: formatTaka(0),
    refresh: async () => {},
    loadBalance: async () => {},
    placeBet: async () => false,
    claimWinnings: async () => false,
    canAfford: () => false,
  };
}
