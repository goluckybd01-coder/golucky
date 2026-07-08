/**
 * Safe client-side query layer for `aviator_rounds`.
 *
 * RULE: never request `server_seed` from the client unless the caller is a
 * verified `super_admin`. Use these helpers instead of building selects inline.
 */
import { supabase } from "@/integrations/supabase/client";

// Columns that are always safe for any authenticated/anon caller.
export const AVIATOR_PUBLIC_COLUMNS = [
  "id",
  "round_number",
  "phase",
  "crash_multiplier",
  "seed_hash",
  "bet_close_time",
  "running_start_time",
  "crashed_at",
  "started_at",
  "ended_at",
  "total_bets",
  "player_count",
  "created_at",
] as const;

export type AviatorPublicColumn = (typeof AVIATOR_PUBLIC_COLUMNS)[number];

export function selectAviatorRounds(extra: AviatorPublicColumn[] = []) {
  const cols = Array.from(new Set<string>([...AVIATOR_PUBLIC_COLUMNS, ...extra]));
  return supabase.from("aviator_rounds").select(cols.join(","));
}

/**
 * Admin-only fetch that includes `server_seed`. Verifies the caller has
 * `super_admin` via `staff_accounts` before issuing the query. Returns null
 * data if the check fails — never sends the column for non-super_admins.
 */
export async function selectAviatorRoundsWithServerSeed(roundIds: string[]) {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return { data: null, error: new Error("Not authenticated") };

  const { data: staff, error: staffErr } = await supabase
    .from("staff_accounts")
    .select("staff_role,is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (staffErr || staff?.staff_role !== "super_admin") {
    return { data: null, error: new Error("Forbidden: super_admin required") };
  }

  return supabase
    .from("aviator_rounds")
    .select([...AVIATOR_PUBLIC_COLUMNS, "server_seed"].join(","))
    .in("id", roundIds);
}
