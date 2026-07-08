import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminOverview {
  financial: {
    total_user_balance: number;
    total_agent_balance: number;
    total_bonus_balance: number;
    total_deposit: number;
    total_withdraw: number;
    pending_deposit_amount: number;
    pending_deposit_count: number;
    pending_withdraw_amount: number;
    pending_withdraw_count: number;
    total_company_profit: number;
    total_company_loss: number;
  };
  trading: {
    active_traders: number;
    buy_volume: number;
    sell_volume: number;
    open_positions: number;
    closed_positions: number;
    trading_pl: number;
  };
  games: Record<
    string,
    {
      total_bets: number;
      total_win: number;
      total_lose: number;
      total_stake: number;
      house_profit: number;
      rtp: number;
      active_players: number;
    }
  >;
  wallets: {
    novafi_wallet: number;
    admin_wallet: number;
    agent_wallet: number;
    user_wallet: number;
    bonus_wallet: number;
    commission_wallet: number;
    trading_wallet: number;
  };
  bonus: Record<string, { count: number; amount: number }>;
  generated_at: string;
}

export function useAdminOverview(refetchMs = 10_000) {
  return useQuery<AdminOverview>({
    queryKey: ["admin-dashboard-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_dashboard_overview" as never);
      if (error) throw error;
      return data as unknown as AdminOverview;
    },
    refetchInterval: refetchMs,
    staleTime: 5_000,
  });
}
