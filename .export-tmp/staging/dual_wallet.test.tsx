import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";

const queryLogs: Array<{
  table: string;
  orders: Array<{ field: string; ascending?: boolean }>;
  range?: { from: number; to: number };
}> = [];

function createQuery(table: string) {
  const log = { table, orders: [] as Array<{ field: string; ascending?: boolean }>, range: undefined as { from: number; to: number } | undefined };
  queryLogs.push(log);

  const query: any = {
    select: vi.fn(() => query),
    order: vi.fn((field: string, options?: { ascending?: boolean }) => {
      log.orders.push({ field, ascending: options?.ascending });
      return query;
    }),
    eq: vi.fn(() => query),
    gte: vi.fn(() => query),
    lte: vi.fn(() => query),
    or: vi.fn(() => query),
    limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
    range: vi.fn((from: number, to: number) => {
      log.range = { from, to };
      return Promise.resolve({
        data: [
          {
            id: `transfer-${from}`,
            created_at: "2026-01-01T00:00:00Z",
            user_id: "user-1234567890",
            from_wallet: "main",
            to_wallet: "provider",
            currency: "BDT",
            amount_bdt: 100,
            amount_usdt: 0,
            provider_code: "pg",
            status: "success",
            reference_id: `ref-${from}`,
            error_message: null,
          },
        ],
        error: null,
        count: 51,
      });
    }),
  };

  return query;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn(() =>
      Promise.resolve({
        data: {
          main_bdt_total: 0,
          main_usdt_total: 0,
          provider_bdt_total: 0,
          transfers_today: 0,
          failed_today: 0,
          usdt_rate: 130,
          generated_at: "2026-01-01T00:00:00Z",
        },
        error: null,
      }),
    ),
    from: vi.fn((table: string) => createQuery(table)),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
}));

import DualWalletOverview from "../DualWalletOverview";

function LocationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  (globalThis as any).__navigate = navigate;
  return <div data-testid="location-search">{location.search}</div>;
}

function renderPage(initialEntry: string | string[] = "/admin/dual-wallet") {
  const entries = Array.isArray(initialEntry) ? initialEntry : [initialEntry];
  return render(
    <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
      <LocationProbe />
      <DualWalletOverview />
    </MemoryRouter>,
  );
}

const transferQueries = () => queryLogs.filter((q) => q.table === "wallet_transfers_v2");
const lastTransferQuery = () => transferQueries().at(-1)!;
const sortableHeader = (name: RegExp) =>
  screen.getAllByRole("columnheader", { name }).find((el) => el.hasAttribute("aria-sort"))!;

beforeEach(() => {
  cleanup();
  queryLogs.length = 0;
  vi.clearAllMocks();
});

describe("DualWalletOverview URL-backed sorting", () => {
  it("updates query params when a sortable header is clicked and reloads using that server-side order", async () => {
    renderPage();

    await waitFor(() => expect(screen.getByText("1–25 of 51")).toBeInTheDocument());
    expect(lastTransferQuery().orders[0]).toEqual({ field: "created_at", ascending: false });
    expect(screen.getByTestId("location-search")).toHaveTextContent("");

    fireEvent.click(sortableHeader(/user/i));

    await waitFor(() => expect(screen.getByTestId("location-search")).toHaveTextContent("?sort=user_id&dir=asc"));
    await waitFor(() => expect(lastTransferQuery().orders[0]).toEqual({ field: "user_id", ascending: true }));
    expect(sortableHeader(/user/i)).toHaveAttribute("aria-sort", "ascending");

    fireEvent.click(sortableHeader(/user/i));

    await waitFor(() => expect(screen.getByTestId("location-search")).toHaveTextContent("?sort=user_id&dir=desc"));
    await waitFor(() => expect(lastTransferQuery().orders[0]).toEqual({ field: "user_id", ascending: false }));
    expect(sortableHeader(/user/i)).toHaveAttribute("aria-sort", "descending");
  });

  it("restores sort from the URL after refresh and keeps it through pagination changes", async () => {
    const first = renderPage("/admin/dual-wallet?sort=provider_code&dir=asc");

    await waitFor(() => expect(lastTransferQuery().orders[0]).toEqual({ field: "provider_code", ascending: true }));
    expect(lastTransferQuery().range).toEqual({ from: 0, to: 24 });
    expect(sortableHeader(/^provider/i)).toHaveAttribute("aria-sort", "ascending");

    first.unmount();
    renderPage("/admin/dual-wallet?sort=provider_code&dir=asc");

    await waitFor(() => expect(lastTransferQuery().orders[0]).toEqual({ field: "provider_code", ascending: true }));
    expect(lastTransferQuery().range).toEqual({ from: 0, to: 24 });

    fireEvent.click(screen.getByRole("button", { name: /next transfers page/i }));

    await waitFor(() => expect(lastTransferQuery().range).toEqual({ from: 25, to: 49 }));
    expect(lastTransferQuery().orders[0]).toEqual({ field: "provider_code", ascending: true });
    expect(screen.getByTestId("location-search")).toHaveTextContent("?sort=provider_code&dir=asc");
  });


  it("restores sort ordering from URL on browser back and forward navigation", async () => {
    renderPage([
      "/admin/dual-wallet",
      "/admin/dual-wallet?sort=user_id&dir=asc",
      "/admin/dual-wallet?sort=status&dir=desc",
    ]);

    await waitFor(() =>
      expect(lastTransferQuery().orders[0]).toEqual({ field: "status", ascending: false }),
    );
    expect(sortableHeader(/status/i)).toHaveAttribute("aria-sort", "descending");

    (globalThis as any).__navigate(-1);
    await waitFor(() =>
      expect(screen.getByTestId("location-search")).toHaveTextContent("?sort=user_id&dir=asc"),
    );
    await waitFor(() =>
      expect(lastTransferQuery().orders[0]).toEqual({ field: "user_id", ascending: true }),
    );
    expect(sortableHeader(/user/i)).toHaveAttribute("aria-sort", "ascending");

    (globalThis as any).__navigate(-1);
    await waitFor(() => expect(screen.getByTestId("location-search")).toHaveTextContent(""));
    await waitFor(() =>
      expect(lastTransferQuery().orders[0]).toEqual({ field: "created_at", ascending: false }),
    );

    (globalThis as any).__navigate(1);
    await waitFor(() =>
      expect(screen.getByTestId("location-search")).toHaveTextContent("?sort=user_id&dir=asc"),
    );
    await waitFor(() =>
      expect(lastTransferQuery().orders[0]).toEqual({ field: "user_id", ascending: true }),
    );

    (globalThis as any).__navigate(1);
    await waitFor(() =>
      expect(screen.getByTestId("location-search")).toHaveTextContent("?sort=status&dir=desc"),
    );
    await waitFor(() =>
      expect(lastTransferQuery().orders[0]).toEqual({ field: "status", ascending: false }),
    );
    expect(sortableHeader(/status/i)).toHaveAttribute("aria-sort", "descending");
  });
});
