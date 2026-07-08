import { describe, it, expect, vi, beforeEach } from "vitest";

// Capture every `.select(...)` call made through the supabase client.
const selectCalls: string[] = [];

type StaffRole = "super_admin" | "admin" | "agent" | "user" | null;
let currentUserId: string | null = "user-1";
let currentStaffRole: StaffRole = null;

vi.mock("@/integrations/supabase/client", () => {
  const from = (table: string) => ({
    select: (cols: string) => {
      selectCalls.push(`${table}:${cols}`);
      const builder: any = {
        eq: () => builder,
        in: () => Promise.resolve({ data: [], error: null }),
        maybeSingle: () =>
          Promise.resolve({
            data: currentStaffRole
              ? { staff_role: currentStaffRole, is_active: true }
              : null,
            error: null,
          }),
      };
      return builder;
    },
  });
  return {
    supabase: {
      from,
      auth: {
        getUser: () =>
          Promise.resolve({ data: { user: currentUserId ? { id: currentUserId } : null } }),
      },
    },
  };
});

import {
  selectAviatorRounds,
  selectAviatorRoundsWithServerSeed,
} from "@/lib/aviatorQuery";

const containsServerSeed = (call: string) =>
  call.startsWith("aviator_rounds:") && call.includes("server_seed");

beforeEach(() => {
  selectCalls.length = 0;
  currentUserId = "user-1";
  currentStaffRole = null;
});

describe("Aviator query layer: server_seed exposure", () => {
  it("public select never requests server_seed", () => {
    selectAviatorRounds();
    selectAviatorRounds(["seed_hash"]);
    expect(selectCalls.some(containsServerSeed)).toBe(false);
  });

  it("non-super_admin (regular user) is blocked before any server_seed query", async () => {
    currentStaffRole = null;
    const res = await selectAviatorRoundsWithServerSeed(["r1"]);
    expect(res.data).toBeNull();
    expect(res.error?.message).toMatch(/super_admin/i);
    expect(selectCalls.some(containsServerSeed)).toBe(false);
  });

  it("admin (non-super) is blocked before any server_seed query", async () => {
    currentStaffRole = "admin";
    const res = await selectAviatorRoundsWithServerSeed(["r1"]);
    expect(res.data).toBeNull();
    expect(selectCalls.some(containsServerSeed)).toBe(false);
  });

  it("unauthenticated caller is blocked before any server_seed query", async () => {
    currentUserId = null;
    const res = await selectAviatorRoundsWithServerSeed(["r1"]);
    expect(res.data).toBeNull();
    expect(selectCalls.some(containsServerSeed)).toBe(false);
  });

  it("super_admin is the ONLY role allowed to request server_seed", async () => {
    currentStaffRole = "super_admin";
    await selectAviatorRoundsWithServerSeed(["r1"]);
    const seedCalls = selectCalls.filter(containsServerSeed);
    expect(seedCalls).toHaveLength(1);
    expect(seedCalls[0]).toMatch(/^aviator_rounds:.*server_seed/);
  });
});
