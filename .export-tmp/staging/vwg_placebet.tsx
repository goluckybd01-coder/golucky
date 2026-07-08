import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const invokeMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
    from: () => ({ select: () => ({ eq: () => ({ data: [], error: null }) }) }),
    rpc: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  },
}));

vi.mock("@/hooks/useWalletDB", () => ({
  useWalletDB: () => ({
    formattedBalance: "৳1,000",
    balance: 10000,
    refreshBalance: vi.fn().mockResolvedValue(undefined),
    isAuthenticated: true,
  }),
}));

vi.mock("@/lib/adminResultService", () => ({
  getAdminSetResult: vi.fn().mockResolvedValue(null),
  parseWinGoResult: vi.fn(),
}));

vi.mock("@/lib/houseEdgeResult", () => ({
  generateBiasedWinGoNumber: () => 5,
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

import VideoWinGo from "../VideoWinGo";

const renderPage = () =>
  render(
    <MemoryRouter>
      <VideoWinGo />
    </MemoryRouter>,
  );

const confirm = () => fireEvent.click(screen.getByRole("button", { name: /Confirm —/i }));

describe("VideoWinGo → place-bet payload", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    invokeMock.mockResolvedValue({ data: { success: true, newBalance: 9990 }, error: null });
    localStorage.clear();
  });

  it("sends color bet (default green) with multiplier 2 odds", async () => {
    renderPage();
    confirm();
    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(1));
    expect(invokeMock.mock.calls[0][0]).toBe("place-bet");
    expect(invokeMock.mock.calls[0][1].body).toMatchObject({
      gameType: "videoWingo",
      gameMode: "1min",
      betType: "color",
      betValue: "green",
      betAmount: 10,
      multiplier: 2,
      potentialWin: 20,
    });
  });

  it("sends color=red when Red is selected", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^Red$/ }));
    confirm();
    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(1));
    expect(invokeMock.mock.calls[0][1].body).toMatchObject({
      betType: "color",
      betValue: "red",
      multiplier: 2,
    });
  });

  it("sends bigSmall=Big with 2x odds", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^Big$/ }));
    confirm();
    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(1));
    expect(invokeMock.mock.calls[0][1].body).toMatchObject({
      betType: "bigSmall",
      betValue: "Big",
      multiplier: 2,
      potentialWin: 20,
    });
  });

  it("sends number bet with 9x odds when a digit is selected", async () => {
    renderPage();
    const numberButtons = screen
      .getAllByRole("button")
      .filter((b) => b.textContent?.trim() === "7");
    expect(numberButtons.length).toBeGreaterThan(0);
    fireEvent.click(numberButtons[0]);
    confirm();
    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(1));
    expect(invokeMock.mock.calls[0][1].body).toMatchObject({
      betType: "number",
      betValue: "7",
      multiplier: 9,
      potentialWin: 90,
    });
  });
});
