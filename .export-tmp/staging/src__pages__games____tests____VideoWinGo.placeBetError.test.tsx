import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const invokeMock = vi.fn();
const toastError = vi.fn();
const toastSuccess = vi.fn();
const logGameError = vi.fn();

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
  logGameError: (...args: unknown[]) => logGameError(...args),
}));

vi.mock("sonner", () => ({
  toast: { success: (...a: unknown[]) => toastSuccess(...a), error: (...a: unknown[]) => toastError(...a) },
}));

import VideoWinGo from "../VideoWinGo";

const renderPage = () =>
  render(
    <MemoryRouter>
      <VideoWinGo />
    </MemoryRouter>,
  );

const confirm = () => fireEvent.click(screen.getByRole("button", { name: /Confirm —/i }));

describe("VideoWinGo → place-bet failure UI", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    toastError.mockReset();
    toastSuccess.mockReset();
    logGameError.mockReset();
    localStorage.clear();
  });

  it("shows server error message returned from edge function", async () => {
    invokeMock.mockResolvedValue({ data: { success: false, error: "Round closed" }, error: null });
    renderPage();
    confirm();
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Round closed"));
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(logGameError).toHaveBeenCalled();
  });

  it("falls back to error.message when data.error is missing", async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: "503 Service Unavailable" } });
    renderPage();
    confirm();
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("503 Service Unavailable"));
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(logGameError).toHaveBeenCalled();
  });

  it("shows generic 'Bet failed' when invoke throws", async () => {
    invokeMock.mockRejectedValue(new Error("network down"));
    renderPage();
    confirm();
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Bet failed"));
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(logGameError).toHaveBeenCalled();
  });
});
