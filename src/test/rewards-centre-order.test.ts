import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Guard: Rewards Centre must render the 11 primary screens in exact order
 * (Hero Arena → Live Feed) plus the trailing Ecosystem Footer, each
 * exactly once. Prevents regressions and duplicate reward systems.
 */
describe("RewardsCentre section order", () => {
  const src = readFileSync(
    resolve(__dirname, "../pages/RewardsCentre.tsx"),
    "utf8",
  );

  const expected = [
    "Screen1Hero",
    "Screen2Daily",
    "Screen3Cashback",
    "Screen4Achievements",
    "Screen5Referral",
    "Screen6VIP",
    "Screen7FD",
    "Screen8Coupons",
    "Screen9Marketplace",
    "Screen10Agent",
    "Screen11Feed",
    "Screen12Footer",
  ];

  it("renders the 11 primary screens + footer in exact order", () => {
    const found = expected
      .map((name) => ({ name, idx: src.indexOf(`<${name} />`) }))
      .filter((e) => e.idx !== -1);
    expect(found.map((e) => e.name)).toEqual(expected);
    for (let i = 1; i < found.length; i++) {
      expect(found[i].idx).toBeGreaterThan(found[i - 1].idx);
    }
  });

  it("mounts each section exactly once (no duplicates)", () => {
    for (const name of expected) {
      const matches = src.match(new RegExp(`<${name} />`, "g")) ?? [];
      expect(matches.length, `${name} rendered ${matches.length}× (expected 1)`).toBe(1);
    }
  });
});
