import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve(__dirname, "../pages/WalletCentre.tsx"),
  "utf8",
);

type Check = { must: string[]; premium?: string[] };
type Section = { id: string; title: string } & Check;

const PREMIUM_TOKENS = ["GOLD", "EMERALD", "BLUE", "PURPLE", "CYAN", "ROSE"];

const SECTIONS: Section[] = [
  {
    id: "01",
    title: "Wallet Command Center Hero",
    must: [
      "Screen1CommandCenter",
      "Wallet",
      "Command Center",
      "d.balance",
      "d.bonus",
      "d.totalDeposit",
      "d.vipLevel",
      "lastLogin",
      "uid",
      "Deposit",
      "Withdraw",
      "Transfer",
    ],
  },
  {
    id: "02",
    title: "Quick Actions Hub",
    must: [
      "Screen2QuickActions",
      "trackWalletQuickAction",
      "Deposit", "Withdraw", "Transfer", "History", "Rewards",
      "Analytics", "Fixed Deposit", "Agent Wallet", "Security Center",
    ],
  },
  {
    id: "03",
    title: "Multi Wallet Ecosystem",
    must: [
      "Screen3MultiWallet",
      "Main Wallet", "User Wallet", "Agent Wallet",
      "Bonus Wallet", "FD Wallet", "3rd Party Wallet",
    ],
  },
  {
    id: "04",
    title: "Agent Wallet Center",
    must: [
      "Screen6AgentWallet",
      "AgentTransferToUserModal",
    ],
  },
  {
    id: "05",
    title: "Wallet Analytics",
    must: [
      "Screen5Analytics",
      "totalDeposit",
      "weekWithdraw",
      "weekNetProfit",
      "cashbackLast30",
      "commission",
    ],
  },
  {
    id: "06",
    title: "Security Center",
    must: [
      "kycVerified",
      "securityAlertsOpen",
      "ShieldCheck",
    ],
  },
  {
    id: "07",
    title: "VIP Wallet Club",
    must: ["vipLevel", "vipExp", "Crown"],
  },
  {
    id: "08",
    title: "Wallet Live Feed",
    must: ["useWalletFeed"],
  },
  {
    id: "09",
    title: "GoLucky Ultra Wallet",
    must: ["Military", "Instant", "Fraud"],
  },
];

describe("Wallet Command Center 2026 Lock — section checklist", () => {
  it.each(SECTIONS)(
    "Section $id · $title contains all required fields/actions",
    ({ id, title, must }) => {
      const missing = must.filter((token) => !source.includes(token));
      expect(
        missing,
        `Section ${id} (${title}) is missing required tokens: ${missing.join(", ")}`,
      ).toEqual([]);
    },
  );

  it("uses the required premium palette tokens", () => {
    const missing = PREMIUM_TOKENS.filter((t) => !source.includes(t));
    expect(missing, `Missing premium tokens: ${missing.join(", ")}`).toEqual([]);
  });

  it("declares all locked Screen* section components", () => {
    const required = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14];
    for (const i of required) {
      expect(source, `Screen${i}* not found`).toMatch(new RegExp(`function Screen${i}[A-Z]`));
    }
  });
});
