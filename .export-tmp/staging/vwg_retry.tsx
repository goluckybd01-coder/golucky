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

describe("VideoWinGo → place-bet retry behaviour", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    toastError.mockReset();
    toastSuccess.mockReset();
    logGameError.mockReset();
    localStorage.clear();
  });

  it("retries after an AbortError and shows success on second attempt", async () => {
    invokeMock
      .mockRejectedValueOnce(new DOMException("aborted", "AbortError"))
      .mockResolvedValueOnce({ data: { success: true, newBalance: 9980 }, error: null });

    renderPage();
    confirm();

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledTimes(1));
    expect(invokeMock).toHaveBeenCalledTimes(2);
    expect(toastError).not.toHaveBeenCalled();
  });

  it("does NOT retry on server validation rejections (data.success === false)", async () => {
    invokeMock.mockResolvedValue({ data: { success: false, error: "Round closed" }, error: null });

    renderPage();
    confirm();

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Round closed"));
    expect(invokeMock).toHaveBeenCalledTimes(1);
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("retries up to the limit on persistent timeouts then shows a single error toast", async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: "ETIMEDOUT" } });

    renderPage();
    confirm();

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1), { timeout: 3000 });
    expect(invokeMock).toHaveBeenCalledTimes(3);
    expect(toastSuccess).not.toHaveBeenCalled();
  });
});
