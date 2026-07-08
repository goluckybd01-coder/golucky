import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

const rows = [
  {
    id: "log-1",
    staff_id: "staff-1",
    action: "create",
    module: "agent_payment_settings",
    target_type: "agent_payment_settings",
    target_id: "aaaaaaaa-1111",
    old_value: null,
    new_value: { fee_amount: 50, wallet_address: "TWALLET" },
    created_at: "2026-06-30T10:00:00Z",
  },
  {
    id: "log-2",
    staff_id: "staff-1",
    action: "update",
    module: "agent_payment_settings",
    target_type: "agent_payment_settings",
    target_id: "aaaaaaaa-1111",
    old_value: { fee_amount: 50 },
    new_value: { fee_amount: 75, _changed_fields: ["fee_amount"] },
    created_at: "2026-06-30T11:00:00Z",
  },
  {
    id: "log-3",
    staff_id: "staff-1",
    action: "toggle",
    module: "agent_payment_settings",
    target_type: "agent_payment_settings",
    target_id: "aaaaaaaa-1111",
    old_value: { maintenance_mode: false },
    new_value: { maintenance_mode: true, _changed_fields: ["maintenance_mode"] },
    created_at: "2026-06-30T12:00:00Z",
  },
];

vi.mock("@/integrations/supabase/client", () => {
  const staffData = [{ id: "staff-1", email: "admin@go.com", display_name: "Admin One" }];
  const build = (table: string) => {
    const state: any = { table, filters: [] as any[] };
    const chain: any = {
      select: (_c: string, opts?: any) => {
        state.count = opts?.count ? rows.length : undefined;
        return chain;
      },
      eq: () => chain,
      ilike: () => chain,
      in: () => chain,
      order: () => chain,
      range: async () =>
        table === "staff_audit_logs"
          ? { data: rows, count: rows.length, error: null }
          : { data: staffData, error: null },
      then: (resolve: any) =>
        resolve(
          table === "staff_audit_logs"
            ? { data: rows, count: rows.length, error: null }
            : { data: staffData, error: null }
        ),
    };
    return chain;
  };
  return { supabase: { from: (t: string) => build(t) } };
});

import AgentPaymentAuditLogs from "../AgentPaymentAuditLogs";

describe("AgentPaymentAuditLogs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders create/update/toggle rows with admin info", async () => {
    render(<AgentPaymentAuditLogs />);
    await waitFor(() => {
      expect(screen.getByText("create")).toBeInTheDocument();
      expect(screen.getByText("update")).toBeInTheDocument();
      expect(screen.getByText("toggle")).toBeInTheDocument();
    });
    await waitFor(() =>
      expect(screen.getAllByText("Admin One").length).toBeGreaterThan(0)
    );
    expect(screen.getAllByText("fee_amount").length).toBeGreaterThan(0);
    expect(screen.getByText("maintenance_mode")).toBeInTheDocument();
  });

  it("expands a row to show before/after JSON diff", async () => {
    render(<AgentPaymentAuditLogs />);
    await waitFor(() => expect(screen.getByText("update")).toBeInTheDocument());

    fireEvent.click(screen.getByText("update").closest("tr")!);

    expect(screen.getByText("Before")).toBeInTheDocument();
    expect(screen.getByText("After")).toBeInTheDocument();
    const pres = document.querySelectorAll("pre");
    const joined = Array.from(pres).map((p) => p.textContent).join(" ");
    expect(joined).toContain('"fee_amount": 50');
    expect(joined).toContain('"fee_amount": 75');
  });
});
