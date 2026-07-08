/**
 * Standardized analytics helper for Section 02 · Quick Actions Hub.
 * All Quick Action buttons MUST emit through `trackWalletQuickAction` so the
 * payload shape stays identical across the app.
 */

export const WALLET_QUICK_ACTION_EVENT = "wallet_quick_action_click" as const;
export const WALLET_QUICK_ACTION_SECTION =
  "wallet_centre_section_02_quick_actions" as const;

/** Canonical set of Quick Action labels — extend here only. */
export type WalletQuickActionName =
  | "Deposit"
  | "Withdraw"
  | "Transfer"
  | "History"
  | "Rewards"
  | "Analytics"
  | "Fixed Deposit"
  | "Agent Wallet"
  | "Security Center";

export interface WalletQuickActionPayload {
  event: typeof WALLET_QUICK_ACTION_EVENT;
  section: typeof WALLET_QUICK_ACTION_SECTION;
  action: WalletQuickActionName;
  target: string;   // route
  enabled: boolean;
  timestamp: string; // ISO
}

export interface TrackWalletQuickActionInput {
  action: WalletQuickActionName;
  target: string;
  enabled: boolean;
}

export function trackWalletQuickAction(
  input: TrackWalletQuickActionInput,
): WalletQuickActionPayload {
  const payload: WalletQuickActionPayload = {
    event: WALLET_QUICK_ACTION_EVENT,
    section: WALLET_QUICK_ACTION_SECTION,
    action: input.action,
    target: input.target,
    enabled: input.enabled,
    timestamp: new Date().toISOString(),
  };
  console.info(`[${WALLET_QUICK_ACTION_EVENT}]`, payload);
  try {
    (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push(payload);
  } catch {
    /* analytics is best-effort */
  }
  return payload;
}
