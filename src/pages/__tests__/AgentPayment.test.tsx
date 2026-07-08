import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (m: string) => toastError(m), success: (m: string) => toastSuccess(m) },
}));

const mockSettings = {
  application_fee_usdt: 25,
  usdt_network: "TRC20",
  usdt_wallet_address: "TXYZabc123",
  is_agent_application_enabled: true,
  is_usdt_payment_enabled: true,
  maintenance_mode: false,
  payment_instructions: "",
};
const settingsRef: { value: typeof mockSettings } = { value: { ...mockSettings } };
vi.mock("@/hooks/useAgentPaymentSettings", () => ({
  useAgentPaymentSettings: () => ({
    settings: settingsRef.value,
    qrSignedUrl: null,
    loading: false,
  }),
}));

const invoke = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
    functions: { invoke: (...args: unknown[]) => invoke(...args) },
    storage: { from: () => ({ upload: async () => ({ error: null }) }) },
  },
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, { get: () => (props: React.HTMLAttributes<HTMLElement>) => <div {...props} /> }),
}));

import AgentPayment from "../AgentPayment";

const statusSpy = vi.fn();
const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/agent/payment/app-1"]}>
      <Routes>
        <Route path="/agent/payment/:applicationId" element={<AgentPayment />} />
        <Route
          path="/agent/payment/status/:id"
          element={<div data-testid="status-page">Payment Submitted</div>}
        />
      </Routes>
    </MemoryRouter>
  );

const VALID_TXID = "a".repeat(64);
const MALFORMED_TXIDS = [
  { label: "too short", value: "abc123" },
  { label: "non-hex", value: "z".repeat(64) },
  { label: "with 0x prefix", value: "0x" + "a".repeat(62) },
];

describe("AgentPayment form – TRC20/USDT enforcement", () => {
  beforeEach(() => {
    settingsRef.value = { ...mockSettings };
    toastError.mockReset();
    toastSuccess.mockReset();
    invoke.mockReset();
  });

  it.each(MALFORMED_TXIDS)("shows inline error for malformed TXID ($label)", async ({ value }) => {
    renderPage();
    fireEvent.change(screen.getByPlaceholderText(/TRC20 transaction hash/i), {
      target: { value },
    });
    fireEvent.click(screen.getByRole("button", { name: /Submit Payment/i }));
    expect(
      await screen.findByText(/TRC20 TXID must be a 64-character hex hash|TXID must be at least 20 characters/i)
    ).toBeInTheDocument();
    expect(invoke).not.toHaveBeenCalled();
  });

  it("blocks submission when admin network is not TRC20 (e.g. ERC20)", () => {
    settingsRef.value = { ...mockSettings, usdt_network: "ERC20" };
    renderPage();
    const input = screen.getByPlaceholderText(/TRC20 transaction hash/i) as HTMLInputElement;
    const submit = screen.getByRole("button", { name: /Submit Payment/i });
    expect(input).toBeDisabled();
    expect(submit).toBeDisabled();
  });

  it("surfaces the same clear error when the server rejects a non-TRC20 network", async () => {
    invoke.mockResolvedValue({
      data: { error: "Only USDT on TRC20 is supported. Other networks are not accepted." },
      error: { message: "Bad Request" },
    });
    renderPage();
    fireEvent.change(screen.getByPlaceholderText(/TRC20 transaction hash/i), {
      target: { value: VALID_TXID },
    });
    fireEvent.click(screen.getByRole("button", { name: /Submit Payment/i }));
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "Only USDT on TRC20 is supported. Other networks are not accepted."
      )
    );
  });

  it("surfaces the same clear error when the server rejects a non-USDT token", async () => {
    invoke.mockResolvedValue({
      data: { error: "Only USDT is accepted. Other tokens are not supported." },
      error: { message: "Bad Request" },
    });
    renderPage();
    fireEvent.change(screen.getByPlaceholderText(/TRC20 transaction hash/i), {
      target: { value: VALID_TXID },
    });
    fireEvent.click(screen.getByRole("button", { name: /Submit Payment/i }));
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "Only USDT is accepted. Other tokens are not supported."
      )
    );
  });

  it("always sends network=TRC20 and token=USDT in the payload", async () => {
    invoke.mockResolvedValue({ data: { id: "pay-1" }, error: null });
    renderPage();
    fireEvent.change(screen.getByPlaceholderText(/TRC20 transaction hash/i), {
      target: { value: VALID_TXID },
    });
    fireEvent.click(screen.getByRole("button", { name: /Submit Payment/i }));
    await waitFor(() => expect(invoke).toHaveBeenCalled());
    const [, opts] = invoke.mock.calls[0];
    expect(opts.body.network).toBe("TRC20");
    expect(opts.body.token).toBe("USDT");
    expect(opts.body.txid).toBe(VALID_TXID);
  });

  it("shows success UI (toast + status page) on a valid TRC20/USDT submission", async () => {
    invoke.mockResolvedValue({ data: { id: "pay-success-1" }, error: null });
    renderPage();
    fireEvent.change(screen.getByPlaceholderText(/TRC20 transaction hash/i), {
      target: { value: VALID_TXID },
    });
    fireEvent.click(screen.getByRole("button", { name: /Submit Payment/i }));

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Payment submitted for verification")
    );
    expect(await screen.findByTestId("status-page")).toBeInTheDocument();
    expect(toastError).not.toHaveBeenCalled();

    const [fnName, opts] = invoke.mock.calls[0];
    expect(fnName).toBe("agent-payment-submit");
    expect(opts.body).toMatchObject({
      network: "TRC20",
      token: "USDT",
      txid: VALID_TXID,
      application_id: "app-1",
    });
  });
});
