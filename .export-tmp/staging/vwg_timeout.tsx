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

describe("VideoWinGo → place-bet timeout / abort UI", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    toastError.mockReset();
    toastSuccess.mockReset();
    logGameError.mockReset();
    localStorage.clear();
  });

  it("shows 'Bet failed' when request is aborted (AbortError)", async () => {
    const abortErr = new DOMException("The user aborted a request.", "AbortError");
    invokeMock.mockRejectedValue(abortErr);
    renderPage();
    confirm();
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Bet failed"));
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(logGameError).toHaveBeenCalled();
  });

  it("shows the gateway timeout message returned via error.message", async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: "Request timed out" } });
    renderPage();
    confirm();
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Request timed out"));
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(logGameError).toHaveBeenCalled();
  });

  it("shows 'Bet failed' when invoke rejects with ETIMEDOUT after a delay", async () => {
    invokeMock.mockImplementation(
      () =>
        new Promise((_, reject) => setTimeout(() => reject(new Error("ETIMEDOUT")), 20)),
    );
    renderPage();
    confirm();
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Bet failed"), { timeout: 2000 });
    expect(logGameError).toHaveBeenCalled();
  });
});
