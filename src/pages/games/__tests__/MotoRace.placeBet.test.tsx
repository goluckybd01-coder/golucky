import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const invokeMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
    from: () => ({
      select: () => ({
        eq: () => ({ eq: () => ({ eq: () => ({ data: [], error: null }) }) }),
      }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  },
}));

vi.mock("@/hooks/useWalletDB", () => ({
  useWalletDB: () => ({
    formattedBalance: "৳1,000",
    balance: 1000,
    refreshBalance: vi.fn().mockResolvedValue(undefined),
    isAuthenticated: true,
  }),
}));

vi.mock("@/lib/adminResultService", () => ({
  getAdminSetResult: vi.fn().mockResolvedValue(null),
  parseWinGoResult: vi.fn(),
}));

vi.mock("@/lib/gameHistoryService", () => ({
  settleBetsDB: vi.fn().mockResolvedValue({ success: true, settledCount: 0 }),
}));

vi.mock("@/lib/gameErrorLogger", () => ({
  attachGameErrorListeners: () => () => {},
  logGameError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import MotoRace from "../MotoRace";

const renderPage = () =>
  render(
    <MemoryRouter>
      <MotoRace />
    </MemoryRouter>,
  );

describe("MotoRace → place-bet payload", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    invokeMock.mockResolvedValue({ data: { success: true, newBalance: 990 }, error: null });
    localStorage.clear();
  });

  it("sends betType '1st' with chosen bike for the winner position", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Confirm —/i }));

    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(1));
    const [fn, opts] = invokeMock.mock.calls[0];
    expect(fn).toBe("place-bet");
    expect(opts.body).toMatchObject({
      gameType: "motorace",
      gameMode: "1min",
      betType: "1st",
      betValue: "1",
      betAmount: 10,
      multiplier: 5,
      potentialWin: 50,
    });
    expect(typeof opts.body.tradeId).toBe("string");
  });

  it("sends '2nd' and '3rd' with correct odds when those positions are picked", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^2nd · 3x$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Confirm —/i }));
    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(1));
    expect(invokeMock.mock.calls[0][1].body).toMatchObject({
      betType: "2nd",
      multiplier: 3,
      potentialWin: 30,
    });

    fireEvent.click(screen.getByRole("button", { name: /^3rd · 2x$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Confirm —/i }));
    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(2));
    expect(invokeMock.mock.calls[1][1].body).toMatchObject({
      betType: "3rd",
      multiplier: 2,
      potentialWin: 20,
    });
  });
});
