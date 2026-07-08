/**
 * Startup Super Admin integrity + protection-trigger tests.
 *
 * Env vars (skip gracefully when missing):
 *   - VITE_SUPABASE_URL              (or SUPABASE_URL)
 *   - VITE_SUPABASE_PUBLISHABLE_KEY  (or SUPABASE_ANON_KEY)
 *   - SUPER_ADMIN_TEST_EMAIL         (goluckybd01@gmail.com)
 *   - SUPER_ADMIN_TEST_PASSWORD
 *   - NON_ADMIN_TEST_EMAIL           (regular user, used for negative tests)
 *   - NON_ADMIN_TEST_PASSWORD
 *   - SUPER_ADMIN_USER_ID            (auth.users.id of GLU-0000001000)
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anon =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const saEmail = process.env.SUPER_ADMIN_TEST_EMAIL;
const saPass = process.env.SUPER_ADMIN_TEST_PASSWORD;
const naEmail = process.env.NON_ADMIN_TEST_EMAIL;
const naPass = process.env.NON_ADMIN_TEST_PASSWORD;
const saUserId = process.env.SUPER_ADMIN_USER_ID;

const canRunIntegrity = Boolean(url && anon && saEmail && saPass);
const canRunProtection = Boolean(url && anon && naEmail && naPass && saUserId);

const dInteg = canRunIntegrity ? describe : describe.skip;
const dProt = canRunProtection ? describe : describe.skip;

const newClient = (): SupabaseClient =>
  createClient(url!, anon!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

dInteg("Super Admin startup integrity", () => {
  const client = newClient();

  it("signs in as super admin", async () => {
    const { error } = await client.auth.signInWithPassword({
      email: saEmail!,
      password: saPass!,
    });
    expect(error).toBeNull();
  });

  it("verify_super_admin_integrity reports ok=true with 3 active triggers", async () => {
    const { data, error } = await client.rpc(
      "verify_super_admin_integrity" as any,
    );
    expect(error).toBeNull();
    const r = data as any;
    expect(r.ok).toBe(true);
    expect(r.super_admin_exists).toBe(true);
    expect(r.role_assigned).toBe(true);
    expect(r.staff_active).toBe(true);
    expect(r.triggers_active).toBe(3);
    expect(r.triggers).toMatchObject({
      trg_protect_super_admin_profiles: true,
      trg_protect_super_admin_roles: true,
      trg_protect_super_admin_staff: true,
    });
  });

  it("Super Admin can perform allowed self-updates (profile display_name)", async () => {
    const { data: me } = await client.auth.getUser();
    const uid = me.user!.id;
    const marker = `SA-OK-${Date.now()}`;
    const { error } = await client
      .from("profiles")
      .update({ display_name: marker })
      .eq("user_id", uid);
    expect(error).toBeNull();
  });

  it("Super Admin no-op update on is_suspended=false is allowed", async () => {
    const { data: me } = await client.auth.getUser();
    const uid = me.user!.id;
    const { error } = await client
      .from("profiles")
      .update({ is_suspended: false })
      .eq("user_id", uid);
    expect(error).toBeNull();
  });

  it("Super Admin can re-affirm own super_admin role in user_roles (no-op update)", async () => {
    const { data: me } = await client.auth.getUser();
    const uid = me.user!.id;
    const { error } = await client
      .from("user_roles")
      .update({ role: "super_admin" as any })
      .eq("user_id", uid)
      .eq("role", "super_admin");
    expect(error).toBeNull();
  });

  it("Super Admin can update own staff_accounts display_name while remaining active", async () => {
    const { data: me } = await client.auth.getUser();
    const uid = me.user!.id;
    const marker = `SA-STAFF-${Date.now()}`;
    const { error } = await client
      .from("staff_accounts")
      .update({ display_name: marker, is_active: true })
      .eq("user_id", uid);
    expect(error).toBeNull();
  });
});


dProt("Super Admin protection triggers (non-super-admin caller)", () => {
  const client = newClient();

  beforeAll(async () => {
    const { error } = await client.auth.signInWithPassword({
      email: naEmail!,
      password: naPass!,
    });
    expect(error).toBeNull();
  });

  it("trg_protect_super_admin_profiles blocks DELETE on the Super Admin profile", async () => {
    const { error } = await client
      .from("profiles")
      .delete()
      .eq("user_id", saUserId!);
    expect(error).not.toBeNull();
    expect((error?.message || "").toLowerCase()).toMatch(
      /super admin|cannot be deleted|protected/,
    );
  });

  it("trg_protect_super_admin_profiles blocks suspending the Super Admin", async () => {
    const { error } = await client
      .from("profiles")
      .update({ is_suspended: true })
      .eq("user_id", saUserId!);
    expect(error).not.toBeNull();
    expect((error?.message || "").toLowerCase()).toMatch(
      /super admin|cannot be suspended|protected/,
    );
  });

  it("trg_protect_super_admin_roles blocks downgrading the Super Admin role", async () => {
    // Attempt to delete the super_admin role row
    const { error: delErr } = await client
      .from("user_roles")
      .delete()
      .eq("user_id", saUserId!)
      .eq("role", "super_admin");
    expect(delErr).not.toBeNull();
    expect((delErr?.message || "").toLowerCase()).toMatch(
      /super admin|cannot be (downgraded|removed)|protected/,
    );

    // Attempt to update it to a lower role
    const { error: updErr } = await client
      .from("user_roles")
      .update({ role: "user" as any })
      .eq("user_id", saUserId!)
      .eq("role", "super_admin");
    expect(updErr).not.toBeNull();
    expect((updErr?.message || "").toLowerCase()).toMatch(
      /super admin|cannot be (downgraded|changed)|protected/,
    );
  });

  it("trg_protect_super_admin_staff blocks deactivating the Super Admin staff record", async () => {
    const { error } = await client
      .from("staff_accounts")
      .update({ is_active: false })
      .eq("user_id", saUserId!);
    expect(error).not.toBeNull();
    expect((error?.message || "").toLowerCase()).toMatch(
      /super admin|cannot be (deactivated|suspended)|protected/,
    );
  });
});
