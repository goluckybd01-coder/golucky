import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import AdminUniversalNav from "../AdminUniversalNav";

// Sample of every admin/* route registered in App.tsx.
const ADMIN_ROUTES = [
  "/admin",
  "/admin/dashboard",
  "/admin/overview",
  "/admin/users",
  "/admin/agents",
  "/admin/deposits",
  "/admin/deposits/pending",
  "/admin/withdraws",
  "/admin/withdraws/approved",
  "/admin/withdrawal-accounts",
  "/admin/transactions",
  "/admin/wallet-ledger",
  "/admin/dual-wallet",
  "/admin/usdt-deposits",
  "/admin/usdt-rate",
  "/admin/fd-dashboard",
  "/admin/lucky-hub-central",
  "/admin/payment-management",
  "/admin/system-logs",
  "/admin/reports",
  "/admin/settings",
  "/admin/admin-users",
  "/admin/roles",
  "/admin/audit-logs",
  "/admin/cms",
  "/admin/crypto-trading-control",
  "/admin/api-game-controls",
  "/admin/ai-builder",
  "/admin/cms-manager",
  "/admin/automation-center",
  "/admin/deposit-centre",
  "/admin/super-admin-control",
  "/admin/deposit-control",
  "/admin/agent-usdt-deposit",
  "/admin/fd-usdt-control",
  "/admin/payment-gateways",
  "/admin/security",
  "/admin/kyc",
  "/admin/promotions",
  "/admin/debug",
];

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname}</div>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AdminUniversalNav />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AdminUniversalNav — universal admin navigation", () => {
  beforeEach(() => cleanup());

  it.each(ADMIN_ROUTES)("renders Back + Dashboard + breadcrumb on %s", (path) => {
    renderAt(path);
    expect(screen.getByRole("button", { name: /go back/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /go to admin dashboard/i })).toBeInTheDocument();
    // "Admin" root crumb always present
    expect(screen.getByRole("button", { name: "Admin" })).toBeInTheDocument();
    // Each path segment after /admin appears as a titled crumb
    const segments = path.replace(/^\/admin\/?/, "").split("/").filter(Boolean);
    for (const seg of segments) {
      const label = seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      expect(screen.getAllByRole("button", { name: label }).length).toBeGreaterThan(0);
    }
  });

  it("Dashboard button navigates to /admin/dashboard", () => {
    renderAt("/admin/users");
    fireEvent.click(screen.getByRole("button", { name: /go to admin dashboard/i }));
    expect(screen.getByTestId("loc").textContent).toBe("/admin/dashboard");
  });

  it("Back with empty history falls back to /admin/dashboard", () => {
    renderAt("/admin/deposits");
    fireEvent.click(screen.getByRole("button", { name: /go back/i }));
    // MemoryRouter starts with a single entry, so history.length === 1 → fallback
    expect(screen.getByTestId("loc").textContent).toBe("/admin/dashboard");
  });

  it("Breadcrumb segment click navigates to that subpath", () => {
    renderAt("/admin/deposits/pending");
    fireEvent.click(screen.getByRole("button", { name: "Deposits" }));
    expect(screen.getByTestId("loc").textContent).toBe("/admin/deposits");
  });

  it("does NOT render on /admin/login", () => {
    renderAt("/admin/login");
    expect(screen.queryByRole("button", { name: /go back/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /go to admin dashboard/i })).not.toBeInTheDocument();
  });

  it("does NOT render on non-admin routes", () => {
    renderAt("/home");
    expect(screen.queryByRole("button", { name: /go back/i })).not.toBeInTheDocument();
  });
});
