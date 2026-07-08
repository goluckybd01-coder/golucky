/**
 * Integration test: verifies the five hardened RLS policies block
 * client-side writes that attempt to bypass server-enforced defaults.
 *
 * Covered findings:
 *   1. deposit_requests_insert_status           — INSERT status must be 'pending'
 *   2. game_provider_wallets_balance_update     — UPDATE cannot change balance
 *   3. player_activity_arbitrary_stats          — INSERT/UPDATE cannot set stats
 *   4. tournament_participants_arbitrary_score  — INSERT cannot seed score/prize
 *   5. usdt_deposits_insert_arbitrary_status    — INSERT status must be 'pending'
 *
 * Requires an authenticated user context (same env as other RLS specs):
 *   SUPABASE_URL, SUPABASE_ANON_KEY, USER_TEST_ACCESS_TOKEN, USER_TEST_USER_ID
 */
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const TOKEN = process.env.USER_TEST_ACCESS_TOKEN;
const UID = process.env.USER_TEST_USER_ID;

const shouldRun = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && TOKEN && UID);
const d = shouldRun ? describe : describe.skip;

function isRlsOrPermissionError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code ?? "";
  const msg = ((error as { message?: string } | null)?.message ?? "").toLowerCase();
  return (
    code === "42501" ||
    code.startsWith("PGRST") ||
    msg.includes("permission denied") ||
    msg.includes("row-level security") ||
    msg.includes("violates row-level") ||
    msg.includes("check constraint")
  );
}

d("Hardened RLS write restrictions (integration)", () => {
  const client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${TOKEN}` } },
  });

  it("deposit_requests: INSERT with status != 'pending' is rejected", async () => {
    const { data, error } = await client
      .from("deposit_requests")
      .insert({
        user_id: UID,
        amount: 100,
        status: "approved",
      } as never)
      .select();
    expect(data ?? null).toBeNull();
    expect(error).toBeTruthy();
    expect(isRlsOrPermissionError(error)).toBe(true);
  });

  it("deposit_requests: INSERT presetting matched_tx_hash is rejected", async () => {
    const { data, error } = await client
      .from("deposit_requests")
      .insert({
        user_id: UID,
        amount: 100,
        status: "pending",
        matched_tx_hash: "0xdeadbeef",
      } as never)
      .select();
    expect(data ?? null).toBeNull();
    expect(error).toBeTruthy();
    expect(isRlsOrPermissionError(error)).toBe(true);
  });

  it("usdt_deposits: INSERT with status != 'pending' is rejected", async () => {
    const { data, error } = await client
      .from("usdt_deposits")
      .insert({
        user_id: UID,
        amount_expected: 10,
        status: "credited",
      } as never)
      .select();
    expect(data ?? null).toBeNull();
    expect(error).toBeTruthy();
    expect(isRlsOrPermissionError(error)).toBe(true);
  });

  it("usdt_deposits: INSERT presetting amount_received/credited_at is rejected", async () => {
    const { data, error } = await client
      .from("usdt_deposits")
      .insert({
        user_id: UID,
        amount_expected: 10,
        status: "pending",
        amount_received: 10,
        credited_at: new Date().toISOString(),
      } as never)
      .select();
    expect(data ?? null).toBeNull();
    expect(error).toBeTruthy();
    expect(isRlsOrPermissionError(error)).toBe(true);
  });

  it("game_provider_wallets: UPDATE attempting to change balance is rejected", async () => {
    const { data, error } = await client
      .from("game_provider_wallets")
      .update({ balance: 999_999_999 } as never)
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select();
    // Either the grant is revoked (permission denied) or the WITH CHECK
    // subquery fails because balance != current balance.
    expect(error).toBeTruthy();
    expect(data ?? null).toBeNull();
    expect(isRlsOrPermissionError(error)).toBe(true);
  });

  it("player_activity: INSERT with non-zero stats is rejected", async () => {
    const { data, error } = await client
      .from("player_activity")
      .insert({
        user_id: UID,
        activity_date: new Date().toISOString().slice(0, 10),
        games_played: 5,
        total_wagered: 500,
        total_won: 250,
      } as never)
      .select();
    expect(data ?? null).toBeNull();
    expect(error).toBeTruthy();
    expect(isRlsOrPermissionError(error)).toBe(true);
  });

  it("player_activity: UPDATE attempting to inflate stats is rejected", async () => {
    const { data, error } = await client
      .from("player_activity")
      .update({
        games_played: 9999,
        total_wagered: 9999,
        total_won: 9999,
      } as never)
      .eq("user_id", UID!)
      .select();
    expect(data ?? null).toBeNull();
    expect(error).toBeTruthy();
    expect(isRlsOrPermissionError(error)).toBe(true);
  });

  it("tournament_participants: INSERT with pre-seeded score/prize is rejected", async () => {
    const { data, error } = await client
      .from("tournament_participants")
      .insert({
        user_id: UID,
        tournament_id: "00000000-0000-0000-0000-000000000000",
        score: 1000,
        total_wagered: 500,
        total_won: 500,
        best_win: 500,
        net_profit: 100,
        prize_won: 500,
        current_rank: 1,
      } as never)
      .select();
    expect(data ?? null).toBeNull();
    expect(error).toBeTruthy();
    expect(isRlsOrPermissionError(error)).toBe(true);
  });
});

if (!shouldRun) {
  describe("Hardened RLS write restrictions (integration)", () => {
    it.skip("skipped — set SUPABASE_URL / SUPABASE_ANON_KEY / USER_TEST_ACCESS_TOKEN / USER_TEST_USER_ID to run", () => {});
  });
}
