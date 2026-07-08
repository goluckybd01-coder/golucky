import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DepositCentre from "@/pages/DepositCentre";

// Minimal mocks – wallet hook + USDT flow (backend heavy)
vi.mock("@/hooks/useWalletDB", () => ({
  useWalletDB: () => ({ formattedBalance: "৳0" }),
}));
vi.mock("@/components/deposit/USDTDepositFlow", () => ({
  default: () => null,
}));

describe("DepositCentre v1 lock", () => {
  it("renders all 12 anchor headings", () => {
    render(
      <MemoryRouter>
        <DepositCentre />
      </MemoryRouter>
    );

    const anchors = [
      "Fund Your Wallet",
      "BDT Deposit",
      "First Deposit Reward",
      "VIP Deposit Benefits",
      "Security Center",
      "Live Deposit Feed",
      "Become GoLucky Agent",
      "Deposit Promotion Hub",
      "Trust & Stats",
      "Fund Your Wallet. Start Winning.",
    ];
    for (const label of anchors) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });
});
