import { describe, it, expect } from "vitest";
import { TRADING_ASSETS } from "./tradingAssets";

// Reference order locked to the design spec (14 assets, grouped).
const EXPECTED_ORDER = [
  "GLC-USD",
  "NOVA-USD",
  "XAU-USD",
  "XAG-USD",
  "XTI-USD",
  "XCU-USD",
  "XNG-USD",
  "BTC-USD",
  "ETH-USD",
  "LTC-USD",
  "SOL-USD",
  "XRP-USD",
  "GBP-USD",
  "EUR-USD",
];

describe("TRADING_ASSETS", () => {
  it("contains exactly 14 assets", () => {
    expect(TRADING_ASSETS).toHaveLength(14);
  });

  it("matches the exact reference order", () => {
    expect(TRADING_ASSETS.map((a) => a.id)).toEqual(EXPECTED_ORDER);
  });

  it("preserves per-group ordering used by the Trading UI", () => {
    // Mirrors BinaryTrading.tsx: Set(map(group)) + filter(group)
    const groups = Array.from(new Set(TRADING_ASSETS.map((a) => a.group)));
    const rendered = groups.flatMap((g) =>
      TRADING_ASSETS.filter((a) => a.group === g).map((a) => a.id),
    );
    expect(rendered).toEqual(EXPECTED_ORDER);
  });
});
