import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock supabase client BEFORE importing apiFetch
const getSessionMock = vi.fn();
const refreshSessionMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => getSessionMock(...args),
      refreshSession: (...args: unknown[]) => refreshSessionMock(...args),
    },
  },
}));

// Stub env var used by apiFetch
(import.meta as any).env = {
  ...(import.meta as any).env,
  VITE_SUPABASE_URL: "https://test.supabase.co",
};

import { apiFetch } from "@/lib/apiFetch";

describe("apiFetch — token refresh + retry on 401", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    refreshSessionMock.mockReset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("refreshes token and retries balance request when initial call returns 401", async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { access_token: "stale-token" } },
    });
    refreshSessionMock.mockResolvedValue({
      data: { session: { access_token: "fresh-token" } },
      error: null,
    });

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: false, error: "Invalid or expired token" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: true, data: { balance: 1234 } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch<{ balance: number }>("/api-wallet/balance");

    expect(refreshSessionMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // apiFetch mutates the shared headers object — after the retry both
    // recorded calls reference the refreshed token. We assert the final
    // outgoing Authorization header carries the refreshed token.
    const finalAuth = (fetchMock.mock.calls[1][1] as RequestInit).headers as Record<string, string>;
    expect(finalAuth.Authorization).toBe("Bearer fresh-token");

    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect((result.data as { balance: number }).balance).toBe(1234);
  });

  it("returns the 401 error to caller (no infinite loop) when refresh also fails", async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { access_token: "stale-token" } },
    });
    refreshSessionMock.mockResolvedValue({
      data: { session: null },
      error: { message: "refresh_token_not_found" },
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch("/api-wallet/balance");

    expect(refreshSessionMock).toHaveBeenCalledTimes(1);
    // No retry when refresh produced no token
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.status).toBe(401);
  });

  it("does not refresh or retry when the first response is 200", async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { access_token: "good-token" } },
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, data: { balance: 50 } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch("/api-wallet/balance");

    expect(refreshSessionMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });
});
