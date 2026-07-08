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
    from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ eq: () => ({ data: [], error: null }) }) }) }) }),
    rpc: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  },
}));
vi.mock("@/hooks/useWalletDB", () => ({ useWalletDB: () => ({ formattedBalance: "৳1,000", balance: 1000, refreshBalance: vi.fn().mockResolvedValue(undefined), isAuthenticated: true }) }));
vi.mock("@/lib/adminResultService", () => ({ getAdminSetResult: vi.fn().mockResolvedValue(null), parseWinGoResult: vi.fn() }));
vi.mock("@/lib/gameHistoryService", () => ({ settleBetsDB: vi.fn().mockResolvedValue({ success: true, settledCount: 0 }) }));
vi.mock("@/lib/gameErrorLogger", () => ({ attachGameErrorListeners: () => () => {}, logGameError: (...args: unknown[]) => logGameError(...args) }));
vi.mock("sonner", () => ({ toast: { success: (...a: unknown[]) => toastSuccess(...a), error: (...a: unknown[]) => toastError(...a) } }));
import MotoRace from "../MotoRace";
const renderPage = () => render(<MemoryRouter><MotoRace /></MemoryRouter>);
describe("MotoRace → place-bet failure UI", () => {
  beforeEach(() => { invokeMock.mockReset(); toastError.mockReset(); toastSuccess.mockReset(); logGameError.mockReset(); localStorage.clear(); });
  it("shows server-provided error message when edge function returns data.error", async () => {
    invokeMock.mockResolvedValue({ data: { success: false, error: "Insufficient funds on server" }, error: null });
    renderPage(); fireEvent.click(screen.getByRole("button", { name: /Confirm —/i }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Insufficient funds on server"));
    expect(toastSuccess).not.toHaveBeenCalled(); expect(logGameError).toHaveBeenCalled();
  });
  it("shows generic 'Bet failed' when invoke throws", async () => {
    invokeMock.mockRejectedValue(new Error("network down"));
    renderPage(); fireEvent.click(screen.getByRole("button", { name: /Confirm —/i }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Bet failed"));
    expect(toastSuccess).not.toHaveBeenCalled(); expect(logGameError).toHaveBeenCalled();
  });
});
