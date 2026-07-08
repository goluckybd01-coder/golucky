import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  trackWalletQuickAction,
  WALLET_QUICK_ACTION_EVENT,
  WALLET_QUICK_ACTION_SECTION,
  type WalletQuickActionName,
} from "./walletQuickAction";

const ALL_ACTIONS: Array<{ action: WalletQuickActionName; target: string; enabled: boolean }> = [
  { action: "Deposit",         target: "/wallet/workflow?tab=deposit",  enabled: true },
  { action: "Withdraw",        target: "/wallet/workflow?tab=withdraw", enabled: false },
  { action: "Transfer",        target: "/wallet/transfer",              enabled: true },
  { action: "History",         target: "/wallet/history",               enabled: true },
  { action: "Rewards",         target: "/rewards",                      enabled: true },
  { action: "Analytics",       target: "/wallet/analytics",             enabled: true },
  { action: "Fixed Deposit",   target: "/fixed-deposit",                enabled: true },
  { action: "Agent Wallet",    target: "/agent",                        enabled: true },
  { action: "Security Center", target: "/wallet/security",              enabled: true },
];

describe("trackWalletQuickAction", () => {
  const originalDL = (window as any).dataLayer;

  beforeEach(() => {
    (window as any).dataLayer = [];
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    (window as any).dataLayer = originalDL;
    vi.restoreAllMocks();
  });

  it.each(ALL_ACTIONS)(
    "emits standardized payload for %s",
    ({ action, target, enabled }) => {
      const payload = trackWalletQuickAction({ action, target, enabled });

      expect(payload).toEqual({
        event: WALLET_QUICK_ACTION_EVENT,
        section: WALLET_QUICK_ACTION_SECTION,
        action,
        target,
        enabled,
        timestamp: expect.any(String),
      });
      expect(new Date(payload.timestamp).toString()).not.toBe("Invalid Date");
      expect((window as any).dataLayer.at(-1)).toEqual(payload);
    },
  );

  it("keeps identical key shape for enabled and disabled actions", () => {
    const on = trackWalletQuickAction({ action: "Deposit", target: "/x", enabled: true });
    const off = trackWalletQuickAction({ action: "Deposit", target: "/x", enabled: false });
    expect(Object.keys(on).sort()).toEqual(Object.keys(off).sort());
  });

  it("uses the constant event + section names", () => {
    expect(WALLET_QUICK_ACTION_EVENT).toBe("wallet_quick_action_click");
    expect(WALLET_QUICK_ACTION_SECTION).toBe("wallet_centre_section_02_quick_actions");
  });
});
