/**
 * Integration test: verifies anon (unauthenticated) users cannot INSERT
 * into privileged reward/transfer tables. Writes must be rejected by RLS
 * or revoked table grants.
 *
 * Requires repo secrets SUPABASE_URL and SUPABASE_ANON_KEY (see
 * .github/workflows/rls-integration.yml). Skips locally when missing.
 */
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const LOCKED_TABLES = [
  "agent_milestone_rewards",
  "redeemed_bonus_codes",
  "user_achievements",
  "user_challenges",
  "vip_reward_claims",
  "wallet_transfers",
] as const;

// Minimal payload per table. Values are arbitrary — the write MUST fail
// before any column validation because anon has no INSERT privilege.
const SAMPLE_ROW: Record<(typeof LOCKED_TABLES)[number], Record<string, unknown>> = {
  agent_milestone_rewards: { agent_user_id: "00000000-0000-0000-0000-000000000000", milestone_code: "anon_probe", reward_amount: 1 },
  redeemed_bonus_codes: { user_id: "00000000-0000-0000-0000-000000000000", code: "ANON_PROBE" },
  user_achievements: { user_id: "00000000-0000-0000-0000-000000000000", achievement_id: "00000000-0000-0000-0000-000000000000" },
  user_challenges: { user_id: "00000000-0000-0000-0000-000000000000", challenge_id: "00000000-0000-0000-0000-000000000000" },
  vip_reward_claims: { user_id: "00000000-0000-0000-0000-000000000000", vip_level: 1, reward_amount: 1 },
  wallet_transfers: { from_user_id: "00000000-0000-0000-0000-000000000000", to_user_id: "00000000-0000-0000-0000-000000000000", amount: 1 },
};

const run = SUPABASE_URL && SUPABASE_ANON_KEY ? describe : describe.skip;

run("anon write lockdown", () => {
  const anon = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const table of LOCKED_TABLES) {
    it(`rejects anon INSERT into ${table}`, async () => {
      const { data, error } = await anon.from(table as any).insert(SAMPLE_ROW[table] as any).select();
      expect(data ?? null).toBeNull();
      expect(error).toBeTruthy();
      // 42501 = insufficient_privilege (grant revoked), PGRST = RLS reject.
      const code = (error as any)?.code ?? "";
      const msg = (error?.message ?? "").toLowerCase();
      expect(
        code === "42501" ||
          code.startsWith("PGRST") ||
          msg.includes("permission denied") ||
          msg.includes("row-level security") ||
          msg.includes("violates row-level"),
      ).toBe(true);
    });
  }
});
