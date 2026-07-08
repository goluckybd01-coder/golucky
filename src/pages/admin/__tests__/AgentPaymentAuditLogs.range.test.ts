import { describe, it, expect } from "vitest";
import { getPageBounds, getRangeBounds, PAGE_SIZE } from "../AgentPaymentAuditLogs";
describe("audit log date range filter", () => {
  it("returns empty bounds when no range is set", () => {
    expect(getRangeBounds(undefined)).toEqual({});
    expect(getRangeBounds({})).toEqual({});
  });
  it("normalizes `from` to local start-of-day (inclusive gte)", () => {
    const from = new Date(2026, 5, 15, 14, 22, 33, 444);
    const { gte, lte } = getRangeBounds({ from });
    expect(lte).toBeUndefined();
    const parsed = new Date(gte!);
    expect(parsed.getHours()).toBe(0);
    expect(parsed.getMinutes()).toBe(0);
    expect(parsed.getSeconds()).toBe(0);
    expect(parsed.getMilliseconds()).toBe(0);
    expect(parsed.getDate()).toBe(15);
  });
  it("normalizes `to` to local end-of-day (inclusive lte)", () => {
    const to = new Date(2026, 5, 20, 3, 0, 0, 0);
    const { lte } = getRangeBounds({ to });
    const parsed = new Date(lte!);
    expect(parsed.getHours()).toBe(23);
    expect(parsed.getMinutes()).toBe(59);
    expect(parsed.getSeconds()).toBe(59);
    expect(parsed.getMilliseconds()).toBe(999);
    expect(parsed.getDate()).toBe(20);
  });
  it("includes timestamps exactly at both bounds", () => {
    const from = new Date(2026, 5, 15, 9);
    const to = new Date(2026, 5, 20, 9);
    const { gte, lte } = getRangeBounds({ from, to });
    const startBoundary = new Date(2026, 5, 15, 0, 0, 0, 0).toISOString();
    const endBoundary = new Date(2026, 5, 20, 23, 59, 59, 999).toISOString();
    const midday = new Date(2026, 5, 17, 12).toISOString();
    const beforeRange = new Date(2026, 5, 14, 23, 59, 59, 999).toISOString();
    const afterRange = new Date(2026, 5, 21, 0, 0, 0, 0).toISOString();
    expect(startBoundary >= gte! && startBoundary <= lte!).toBe(true);
    expect(endBoundary >= gte! && endBoundary <= lte!).toBe(true);
    expect(midday >= gte! && midday <= lte!).toBe(true);
    expect(beforeRange >= gte!).toBe(false);
    expect(afterRange <= lte!).toBe(false);
  });
  it("keeps the same gte/lte across every page (pagination is independent)", () => {
    const range = { from: new Date(2026, 5, 15, 8), to: new Date(2026, 5, 20, 8) };
    const bounds = getRangeBounds(range);
    for (const page of [0, 1, 2, 5, 10]) {
      expect(getRangeBounds(range)).toEqual(bounds);
      const { from, to } = getPageBounds(page);
      expect(from).toBe(page * PAGE_SIZE);
      expect(to - from + 1).toBe(PAGE_SIZE);
    }
  });
});
