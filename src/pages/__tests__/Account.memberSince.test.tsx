import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SUPER_ADMIN_MEMBER_SINCE, formatDDMMYYYY } from "@/lib/memberSince";

// ---- Mocks --------------------------------------------------------------
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), loading: vi.fn(), success: vi.fn(), dismiss: vi.fn() }),
}));

vi.mock("@/hooks/useWalletDB", () => ({
  useWalletDB: () => ({ balance: 0, refresh: vi.fn() }),
}));

vi.mock("@/assets/golucky-text-logo-1.png", () => ({ default: "logo.png" }));
vi.mock("@/assets/account/vip-shield-8.png", () => ({ default: "vip.png" }));
vi.mock("@/assets/account/agent-shield-g.png", () => ({ default: "agent.png" }));

const authUser = { id: "user-uuid-1", email: "u@test.com" };
let profileRow: any = null;
const walletRow = {
  balance: 0, total_deposit: 0, total_withdraw: 0,
  total_bet: 0, total_win: 0, total_commission_earned: 0,
};

const makeBuilder = (row: any) => {
  const b: any = {
    select: () => b,
    eq: () => b,
    maybeSingle: async () => ({ data: row, error: null }),
    order: () => b,
    limit: async () => ({ data: [], error: null }),
  };
  return b;
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: authUser }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: (table: string) => {
      if (table === "profiles") return makeBuilder(profileRow);
      if (table === "wallets") return makeBuilder(walletRow);
      return makeBuilder(null);
    },
    storage: { from: () => ({ upload: async () => ({ data: null, error: null }), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) },
    channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }),
    removeChannel: () => {},
  },
}));

import Account from "@/pages/Account";

const renderPage = () =>
  render(
    <MemoryRouter>
      <Account />
    </MemoryRouter>
  );

describe("Account page — Member Since", () => {
  beforeEach(() => {
    profileRow = null;
  });

  it("renders 02-04-2021 for the Super Admin", async () => {
    profileRow = {
      username: "superadmin",
      avatar_url: null,
      agent_status: null,
      created_at: "2024-11-15T00:00:00Z",
      vip_level: 10,
      vip_exp: 0,
      display_user_id: "GLU-0000001000",
      display_referral_id: "GLR-ADMIN01",
      agent_display_id: "AGL-000100",
      is_suspended: false,
      is_frozen: false,
    };
    renderPage();
    await waitFor(() =>
      expect(screen.getAllByText(SUPER_ADMIN_MEMBER_SINCE).length).toBeGreaterThan(0)
    );
  });

  it("renders created_at in DD-MM-YYYY for a Normal User", async () => {
    const createdAt = "2025-03-07T09:30:00Z";
    profileRow = {
      username: "normal_user",
      avatar_url: null,
      agent_status: null,
      created_at: createdAt,
      vip_level: 0,
      vip_exp: 0,
      display_user_id: "GLU-0000001234",
      display_referral_id: "GLR-USR1234",
      agent_display_id: null,
      is_suspended: false,
      is_frozen: false,
    };
    renderPage();
    const expected = formatDDMMYYYY(new Date(createdAt));
    await waitFor(() =>
      expect(screen.getAllByText(expected).length).toBeGreaterThan(0)
    );
    expect(expected).not.toBe(SUPER_ADMIN_MEMBER_SINCE);
    expect(expected).not.toBe("—");
  });

  it("renders created_at in DD-MM-YYYY for an Agent", async () => {
    const createdAt = "2025-08-21T12:00:00Z";
    profileRow = {
      username: "agent_one",
      avatar_url: null,
      agent_status: "approved",
      created_at: createdAt,
      vip_level: 2,
      vip_exp: 5000,
      display_user_id: "GLU-0000005678",
      display_referral_id: "GLR-AGT5678",
      agent_display_id: "AGL-000205",
      is_suspended: false,
      is_frozen: false,
    };
    renderPage();
    const expected = formatDDMMYYYY(new Date(createdAt));
    await waitFor(() =>
      expect(screen.getAllByText(expected).length).toBeGreaterThan(0)
    );
    expect(expected).not.toBe(SUPER_ADMIN_MEMBER_SINCE);
  });
});
