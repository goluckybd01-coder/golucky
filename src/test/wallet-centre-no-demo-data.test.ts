import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const FILES = [
  "src/pages/WalletCentre.tsx",
  "src/hooks/useWalletCentreData.ts",
  "src/hooks/useWalletFeed.ts",
  "src/hooks/useWalletDB.ts",
];

const read = (p: string) => readFileSync(resolve(__dirname, "../..", p), "utf8");

describe("Wallet Centre — no hardcoded demo data", () => {
  for (const rel of FILES) {
    const src = read(rel);
    const code = src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");

    it(`${rel} contains no demo/mock/sample vocabulary in code`, () => {
      const banned = /\b(MOCK|mockData|demoData|sampleData|fakeData|seedMock|placeholderData|dummyData)\b/;
      expect(banned.test(code), `${rel} contains demo/mock vocabulary`).toBe(false);
    });

    it(`${rel} contains no ৳-prefixed hardcoded amounts`, () => {
      const currency = /৳\s*[0-9][0-9,]{2,}(?:\.[0-9]+)?/;
      const hits = code.match(new RegExp(currency, "g")) ?? [];
      expect(hits, `${rel} has hardcoded taka literals: ${hits.join(", ")}`).toEqual([]);
    });

    it(`${rel} contains no underscore-separated numeric demo literals (e.g. 24_750)`, () => {
      const sep = /\b\d{1,3}(?:_\d{3})+\b/g;
      const hits = code.match(sep) ?? [];
      const allowed = new Set(["86400_000", "15_000", "5_000", "10_000"]);
      const bad = hits.filter((h) => !allowed.has(h));
      expect(bad, `${rel} has demo-shaped numeric literals: ${bad.join(", ")}`).toEqual([]);
    });
  }

  it("WalletCentre.tsx has no inline arrays of fake transaction/wallet rows", () => {
    const src = read("src/pages/WalletCentre.tsx");
    const badRow = /\{[^{}]*\b(amount|balance|v)\s*:\s*\d{3,}/;
    expect(badRow.test(src), "WalletCentre.tsx has inline fake row(s)").toBe(false);
  });

  it("useWalletFeed.ts exports empty state (no seeded mock entries)", () => {
    const src = read("src/hooks/useWalletFeed.ts");
    expect(src).toMatch(/useState<WalletFeedEntry\[\]>\(\[\]\)/);
    expect(src).not.toMatch(/seedMock/);
  });
});
