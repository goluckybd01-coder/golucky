/**
 * useDualWallet — realtime dual-wallet reader.
 * Reads BDT + USDT sub-balances from `wallets`, 3rd-party balance from
 * `provider_wallets`, and the admin-configurable USDT/BDT rate from
 * `wallet_settings`. Never mutates — mutations go through dualWalletService.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DualWalletState {
  balanceBDT: number;
  balanceUSDT: number;
  providerBalance: number;
  rate: number;
  isLoading: boolean;
  userId: string | null;
  error: string | null;
}

const initial: DualWalletState = {
  balanceBDT: 0,
  balanceUSDT: 0,
  providerBalance: 0,
  rate: 130,
  isLoading: true,
  userId: null,
  error: null,
};

export function useDualWallet() {
  const [state, setState] = useState<DualWalletState>(initial);
  const uidRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id ?? null;
    uidRef.current = uid;
    if (!uid) {
      setState((s) => ({ ...s, isLoading: false, userId: null }));
      return;
    }
    try {
      const [wallet, provider, settings] = await Promise.all([
        supabase.from("wallets").select("balance,balance_usdt").eq("user_id", uid).maybeSingle(),
        supabase.from("provider_wallets" as any).select("balance").eq("user_id", uid).maybeSingle(),
        supabase.from("wallet_settings" as any).select("usdt_bdt_rate").eq("id", 1).maybeSingle(),
      ]);
      setState({
        balanceBDT: Number(wallet.data?.balance ?? 0),
        balanceUSDT: Number((wallet.data as any)?.balance_usdt ?? 0),
        providerBalance: Number((provider.data as any)?.balance ?? 0),
        rate: Number((settings.data as any)?.usdt_bdt_rate ?? 130),
        isLoading: false,
        userId: uid,
        error: null,
      });
    } catch (e: any) {
      setState((s) => ({ ...s, isLoading: false, error: e?.message ?? "load failed" }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime subscriptions
  useEffect(() => {
    const uid = uidRef.current;
    if (!uid) return;
    const ch = supabase
      .channel(`dual-wallet-${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${uid}` },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "provider_wallets", filter: `user_id=eq.${uid}` },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallet_settings" },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [state.userId, refresh]);

  return { ...state, refresh };
}
