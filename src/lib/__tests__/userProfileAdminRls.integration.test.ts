/**
 * Integration test: verifies a normal user CANNOT escalate to admin by writing
 * `is_admin = true` on their own profile. The DB trigger must revert the value
 * to `false` (or the RLS policy must reject the write).
 *
 * Skipped unless the required env vars are set.
 *
 * Required env:
 *   SUPABASE_URL                — https://<ref>.supabase.co
 *   SUPABASE_ANON_KEY           — anon/publishable key
 *   USER_TEST_ACCESS_TOKEN      — access_token of a signed-in normal user
 *   USER_TEST_USER_ID           — that user's auth user id (uuid)
 */
import { describe, it, expect } from "vitest";

const URL_BASE = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const TOKEN = process.env.USER_TEST_ACCESS_TOKEN;
const UID = process.env.USER_TEST_USER_ID;

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

d("Normal user cannot escalate is_admin (integration)", () => {
  it("PATCH is_admin=true is either rejected or silently reverted to false", async () => {
    const r = await fetch(
      `${URL_BASE}/rest/v1/profiles?user_id=eq.${UID}`,
      {
        method: "PATCH",
        headers: authHeaders({ Prefer: "return=representation" }),
        body: JSON.stringify({ is_admin: true }),
      },
    );

    // Accept either: RLS rejection (4xx) OR successful write that the trigger
    // reverted server-side. Both outcomes satisfy the security requirement.
    if (r.status === 200) {
      const rows = await r.json();
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.length).toBe(1);
      expect(rows[0].is_admin).toBe(false);
    } else {
      expect(r.status).toBeGreaterThanOrEqual(400);
    }
  });

  it("subsequent SELECT confirms is_admin is still false", async () => {
    const r = await fetch(
      `${URL_BASE}/rest/v1/profiles?user_id=eq.${UID}&select=is_admin`,
      { headers: authHeaders() },
    );
    expect(r.status).toBe(200);
    const rows = await r.json();
    expect(rows.length).toBe(1);
    expect(rows[0].is_admin).toBe(false);
  });
});

if (!shouldRun) {
  describe("Normal user cannot escalate is_admin (integration)", () => {
    it.skip("skipped — set SUPABASE_URL / SUPABASE_ANON_KEY / USER_TEST_ACCESS_TOKEN / USER_TEST_USER_ID to run", () => {});
  });
}
