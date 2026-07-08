import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const VALID_TXID = "a".repeat(64);

type Row = {
  id: string;
  status: "pending" | "approved" | "rejected" | "more_info";
  amount_usdt: number;
  network: string;
  txid: string;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

const rowRef: { value: Row | null } = {
  value: {
    id: "pay-success-1",
    status: "approved",
    amount_usdt: 25,
    network: "TRC20",
    txid: VALID_TXID,
    admin_note: null,
    created_at: "2026-01-15T10:00:00Z",
    reviewed_at: "2026-01-15T10:05:00Z",
  },
};

vi.mock("@/integrations/supabase/client", () => {
  const builder = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: async () => ({ data: rowRef.value, error: null }),
  };
  return {
    supabase: {
      from: () => builder,
      channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
      removeChannel: () => {},
    },
  };
});

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    { get: () => (props: React.HTMLAttributes<HTMLElement>) => <div {...props} /> }
  ),
}));

import AgentPaymentStatus from "../AgentPaymentStatus";

const renderAt = (id: string) =>
  render(
    <MemoryRouter initialEntries={[`/agent/payment/status/${id}`]}>
      <Routes>
        <Route path="/agent/payment/status/:paymentId" element={<AgentPaymentStatus />} />
      </Routes>
    </MemoryRouter>
  );

describe("AgentPaymentStatus", () => {
  it("shows approved banner with amount, network, and TXID", async () => {
    rowRef.value = {
      ...(rowRef.value as Row),
      status: "approved",
      admin_note: null,
    };
    renderAt("pay-success-1");

    expect(await screen.findByText(/Payment Approved!/i)).toBeInTheDocument();
    expect(screen.getByText("25.00 USDT")).toBeInTheDocument();
    expect(screen.getByText("TRC20")).toBeInTheDocument();
    expect(screen.getByText(VALID_TXID)).toBeInTheDocument();
  });

  it("shows rejection banner, rejected timeline, and admin remark", async () => {
    rowRef.value = {
      ...(rowRef.value as Row),
      id: "pay-rejected-1",
      status: "rejected",
      admin_note: "TXID not found on TRON network",
    };
    renderAt("pay-rejected-1");

    // Rejection banner from StatusTimeline
    expect(await screen.findByText(/Payment Rejected/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Please contact support or resubmit\./i)
    ).toBeInTheDocument();

    // Approved banner must NOT appear
    expect(screen.queryByText(/Payment Approved!/i)).not.toBeInTheDocument();

    // Admin remark surfaced
    expect(screen.getByText(/Admin note/i)).toBeInTheDocument();
    expect(
      screen.getByText("TXID not found on TRON network")
    ).toBeInTheDocument();

    // Payment details still visible
    expect(screen.getByText("25.00 USDT")).toBeInTheDocument();
    expect(screen.getByText("TRC20")).toBeInTheDocument();
    expect(screen.getByText(VALID_TXID)).toBeInTheDocument();
  });

  it("shows 'Payment not found' fallback for an unknown id", async () => {
    rowRef.value = null;
    renderAt("does-not-exist");

    expect(await screen.findByText(/Payment not found/i)).toBeInTheDocument();
    expect(screen.queryByText(/Payment Approved!/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Payment Rejected/i)).not.toBeInTheDocument();
  });
});
