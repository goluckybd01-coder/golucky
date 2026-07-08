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
describe("MotoRace → place-bet retry behaviour", () => {
  beforeEach(() => { invokeMock.mockReset(); toastError.mockReset(); toastSuccess.mockReset(); logGameError.mockReset(); localStorage.clear(); });
  it("retries after an AbortError and shows success on second attempt — no error toast appears", async () => {
    const abortErr = new DOMException("aborted", "AbortError");
    invokeMock.mockRejectedValueOnce(abortErr).mockResolvedValueOnce({ data: { success: true, newBalance: 990 }, error: null });
    renderPage(); fireEvent.click(screen.getByRole("button", { name: /Confirm —/i }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledTimes(1));
    expect(invokeMock).toHaveBeenCalledTimes(2); expect(toastError).not.toHaveBeenCalled(); expect(logGameError).toHaveBeenCalled();
  });
  it("retries up to the limit on persistent timeouts then shows a single error toast", async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: "Request timed out" } });
    renderPage(); fireEvent.click(screen.getByRole("button", { name: /Confirm —/i }));
    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1), { timeout: 3000 });
    expect(invokeMock).toHaveBeenCalledTimes(3); expect(toastSuccess).not.toHaveBeenCalled();
  });
  it("re-enables the Confirm button after retries finish (UI stays consistent)", async () => {
    invokeMock.mockRejectedValueOnce(new DOMException("aborted", "AbortError")).mockResolvedValueOnce({ data: { success: true, newBalance: 990 }, error: null });
    renderPage(); const btn = screen.getByRole("button", { name: /Confirm —/i }); fireEvent.click(btn);
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledTimes(1)); expect((btn as HTMLButtonElement).disabled).toBe(false);
  });
});
