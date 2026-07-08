import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Enforces the `api_game_controls_enabled` feature flag on live game listings.
 *
 * When the flag is OFF, filters are no-ops (live behavior unchanged).
 * When ON:
 *  - hides providers/games in maintenance_mode
 *  - hides vip_only games unless user vip_level >= 1
 *  - hides agent_only games unless user has the 'agent' role
 *
 * Provider/game enable, featured/order/category filters are already
 * enforced at the query level. Commission overrides are read on the
 * backend and are intentionally not applied client-side.
 */

export type ProviderLike = {
  is_enabled?: boolean | null;
  maintenance_mode?: boolean | null;
};

export type GameLike = {
  is_enabled?: boolean | null;
  maintenance_mode?: boolean | null;
  vip_only?: boolean | null;
  agent_only?: boolean | null;
};

/** Pure filter (exported for tests). */
export function providerVisible(p: ProviderLike, flagEnabled: boolean): boolean {
  if (!flagEnabled) return true;
  return !p.maintenance_mode;
}

/** Pure filter (exported for tests). */
export function gameVisible(
  g: GameLike,
  flagEnabled: boolean,
  ctx: { isVip: boolean; isAgent: boolean }
): boolean {
  if (!flagEnabled) return true;
  if (g.maintenance_mode) return false;
  if (g.vip_only && !ctx.isVip) return false;
  if (g.agent_only && !ctx.isAgent) return false;
  return true;
}

export function useApiGameControls() {
  const [flagEnabled, setFlagEnabled] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const flagRes = await supabase
          .from("admin_feature_flags")
          .select("flag_value")
          .eq("flag_name", "api_game_controls_enabled")
          .maybeSingle();
        const enabled = !!flagRes.data?.flag_value;
        if (cancelled) return;
        setFlagEnabled(enabled);

        if (enabled) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const [profile, roles] = await Promise.all([
              supabase.from("profiles").select("vip_level").eq("user_id", user.id).maybeSingle(),
              supabase.from("user_roles").select("role").eq("user_id", user.id),
            ]);
            if (cancelled) return;
            setIsVip(Number((profile.data as any)?.vip_level ?? 0) >= 1);
            setIsAgent(!!(roles.data as any[])?.some((r: any) => r.role === "agent"));
          }
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filterProvider = useCallback(
    (p: ProviderLike) => providerVisible(p, flagEnabled),
    [flagEnabled]
  );
  const filterGame = useCallback(
    (g: GameLike) => gameVisible(g, flagEnabled, { isVip, isAgent }),
    [flagEnabled, isVip, isAgent]
  );

  return { flagEnabled, isVip, isAgent, ready, filterProvider, filterGame };
}
