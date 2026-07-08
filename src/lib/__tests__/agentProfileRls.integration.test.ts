/**
 * Integration test: verifies an authenticated AGENT user can, under Supabase RLS:
 *   1. Read their own profile row
 *   2. Update their own profile (avatar_url)
 *   3. Upload an avatar image to the `avatars` storage bucket
 *   4. Be blocked from reading other users' profiles
 *
 * The profiles RLS policies key off `auth.uid() = user_id` only (not `agent_status`),
 * so an approved agent uses the exact same code path as a normal user. This test
 * runs against a real Supabase project when the following env vars are provided;
 * otherwise it is skipped so it never blocks local dev or PRs without secrets.
 *
 * Required env:
 *   SUPABASE_URL                 — https://<ref>.supabase.co
 *   SUPABASE_ANON_KEY            — anon/publishable key
 *   AGENT_TEST_ACCESS_TOKEN      — access_token of a signed-in agent
 *   AGENT_TEST_USER_ID           — that agent's auth user id (uuid)
 */
import { describe, it, expect } from "vitest";

const URL_BASE = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const TOKEN = process.env.AGENT_TEST_ACCESS_TOKEN;
const UID = process.env.AGENT_TEST_USER_ID;

const shouldRun = Boolean(URL_BASE && ANON && TOKEN && UID);
const d = shouldRun ? describe : describe.skip;

function authHeaders(extra: Record<string, string> = {}) {
  return {
    apikey: ANON as string,
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

d("Agent profile RLS (integration)", () => {
  it("reads own profile row (SELECT policy: profiles_select_own)", async () => {
    const r = await fetch(
      `${URL_BASE}/rest/v1/profiles?user_id=eq.${UID}&select=user_id,agent_status,agent_tier,avatar_url`,
      { headers: authHeaders() },
    );
    expect(r.status).toBe(200);
    const rows = await r.json();
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(1);
    expect(rows[0].user_id).toBe(UID);
  });

  it("updates own avatar_url without policy error (UPDATE policy: profiles_update_own)", async () => {
    const marker = `https://example.com/agent-${Date.now()}.png`;
    const r = await fetch(`${URL_BASE}/rest/v1/profiles?user_id=eq.${UID}`, {
      method: "PATCH",
      headers: authHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify({ avatar_url: marker }),
    });
    expect(r.status).toBe(200);
    const rows = await r.json();
    expect(rows[0].avatar_url).toBe(marker);
  });

  it("cannot read other users' profiles (RLS filter)", async () => {
    const r = await fetch(
      `${URL_BASE}/rest/v1/profiles?user_id=neq.${UID}&select=user_id&limit=5`,
      { headers: authHeaders() },
    );
    expect(r.status).toBe(200);
    const rows = await r.json();
    expect(rows).toEqual([]);
  });

  it("uploads an avatar to the `avatars` storage bucket", async () => {
    // 1x1 transparent PNG
    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0xf8, 0xcf, 0xc0, 0xf0,
      0x1f, 0x00, 0x05, 0x00, 0x01, 0x00, 0xff, 0x5c, 0x2d, 0x3e, 0x5b, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
    const path = `${UID}/rls-test-${Date.now()}.png`;
    const r = await fetch(
      `${URL_BASE}/storage/v1/object/avatars/${path}`,
      {
        method: "POST",
        headers: {
          apikey: ANON as string,
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "image/png",
          "x-upsert": "true",
        },
        body: png,
      },
    );
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.Key).toBe(`avatars/${path}`);
  });
});

if (!shouldRun) {
  describe("Agent profile RLS (integration)", () => {
    it.skip("skipped — set SUPABASE_URL / SUPABASE_ANON_KEY / AGENT_TEST_ACCESS_TOKEN / AGENT_TEST_USER_ID to run", () => {});
  });
}
