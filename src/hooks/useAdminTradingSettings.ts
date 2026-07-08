import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminTradingSettings {
  id: number;
  win_rate: number;
  payout_multiplier: number;
  min_bet: number;
  max_bet: number;
  global_volatility: number;
  update_speed_ms: number;
  forced_trade_result: "auto" | "force_buy_win" | "force_sell_win" | "force_user_lose";
  trading_paused: boolean;
  updated_at: string;
}

/**
 * Subscribes to admin_trading_settings (row id=1) and re-emits on every change.
 * Used by the admin control panel AND any trade-engine consumer so a single
 * super_admin update is reflected everywhere within ~1s without a refresh.
 */
export function useAdminTradingSettings() {
  const [settings, setSettings] = useState<AdminTradingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data } = await supabase
        .from("admin_trading_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (mounted && data) setSettings(data as AdminTradingSettings);
      if (mounted) setLoading(false);
    };

    load();

    const channel = supabase
      .channel("admin_trading_settings:realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_trading_settings", filter: "id=eq.1" },
        (payload) => {
          const row = (payload.new ?? payload.old) as AdminTradingSettings | undefined;
          if (row && mounted) setSettings(row);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { settings, loading };
}
