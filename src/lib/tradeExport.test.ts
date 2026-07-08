import { describe, it, expect } from "vitest";
import {
  buildTradesCSV,
  buildTradesPDFHtml,
  calculateTradePnl,
  safeFilenameSegment,
  summarizeTrades,
  PAYOUT,
  type ExportTrade,
} from "./tradeExport";

const legacyWin = {
  id: 1, asset: "glc", symbol: "GLC/USD", dir: "UP",
  stake: 10, result: "win", at: "2026-01-01T00:00:00Z",
} as ExportTrade;

const legacyLoss = {
  id: 2, asset: "btc", symbol: "BTC/USD", dir: "DOWN",
  result: "loss", at: "2026-01-01T00:01:00Z",
} as ExportTrade;

const modernWin: ExportTrade = {
  id: 3, asset: "eth", symbol: "ETH/USD", dir: "UP",
  stake: 20, potentialWin: 37, payout: 37, result: "win",
  startPrice: 1000, endPrice: 1010, at: "2026-01-01T00:02:00Z",
  payoutRatio: 0.85, duration: 30,
};

describe("calculateTradePnl", () => {
  it("derives win payout from stake when payout missing", () => {
    expect(calculateTradePnl(legacyWin)).toBeCloseTo(10 * (1 + PAYOUT), 5);
  });
  it("returns 0 for loss with no stake", () => {
    expect(calculateTradePnl(legacyLoss)).toBe(-0);
  });
  it("uses payout for modern win", () => {
    expect(calculateTradePnl(modernWin)).toBe(37);
  });
});

describe("buildTradesCSV", () => {
  const csv = buildTradesCSV([legacyWin, legacyLoss, modernWin]);
  const lines = csv.split("\n");

  it("has stable header row", () => {
    expect(lines[0]).toBe(
      "id,time,asset,symbol,direction,stake,payout_ratio,payout,result,pnl,start_price,end_price,duration_s,forced"
    );
  });
  it("emits one row per trade and no 'undefined'", () => {
    expect(lines).toHaveLength(4);
    expect(csv).not.toMatch(/undefined/);
  });
  it("coerces missing fields to numeric strings", () => {
    expect(lines[1]).toContain(",10.00,");
    expect(lines[1]).toContain(",0.00,win,18.50,");
    expect(lines[2]).toContain(",0.00,0.85,0.00,loss,0.00,");
  });
  it("quotes fields containing commas/quotes", () => {
    const tricky = { ...modernWin, symbol: 'A,B"C' };
    const out = buildTradesCSV([tricky]).split("\n")[1];
    expect(out).toContain('"A,B""C"');
  });
});

describe("buildTradesPDFHtml", () => {
  it("renders rows for legacy trades without 'undefined'", () => {
    const html = buildTradesPDFHtml([legacyWin, legacyLoss], "GLC/USD");
    expect(html).not.toMatch(/undefined/);
    expect(html).toContain("$10.00");
    expect(html).toContain("$0.00");
    expect(html).toContain(">-<");
  });
  it("footer totals reflect coerced values", () => {
    const html = buildTradesPDFHtml([legacyWin, legacyLoss, modernWin], "MIX");
    expect(html).toContain("3 trades · 2W / 1L · 66.7% win rate");
    expect(html).toContain("$30.00");
  });
});

describe("summarizeTrades", () => {
  it("handles empty list", () => {
    expect(summarizeTrades([])).toEqual({ stake: 0, payout: 0, pnl: 0, wins: 0, losses: 0, winRate: 0 });
  });
});

describe("safeFilenameSegment", () => {
  it("sanitizes slashes and non-safe chars", () => {
    expect(safeFilenameSegment("BTC/USD")).toBe("BTC_USD");
    expect(safeFilenameSegment("!!!")).toBe("asset");
  });
});
