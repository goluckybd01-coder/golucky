import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("WalletCentre section order", () => {
  const src = readFileSync(resolve(__dirname, "../pages/WalletCentre.tsx"), "utf8");
  const expected = [
    "Screen1CommandCenter","Screen2QuickActions","Screen3MultiWallet","Screen5Analytics",
    "Screen4AIIntelligence","Screen6AgentWallet","Screen7FDWallet","Screen12UltraBanner",
    "Screen9Transactions","Screen10IncomeDist","Screen11Security","Screen13VIPClub","Screen14LiveFeed",
  ];
  it("renders the 13 wallet screens in exact order", () => {
    const found = expected.map((name) => ({ name, idx: src.indexOf(`<${name} />`) })).filter((e) => e.idx !== -1);
    expect(found.map((e) => e.name)).toEqual(expected);
    for (let i = 1; i < found.length; i++) expect(found[i].idx).toBeGreaterThan(found[i - 1].idx);
  });
  it("mounts each wallet screen exactly once (no duplicates)", () => {
    for (const name of expected) {
      const matches = src.match(new RegExp(`<${name} />`, "g")) ?? [];
      expect(matches.length, `${name} rendered ${matches.length}× (expected 1)`).toBe(1);
    }
  });
  it("Crypto Vault is no longer mounted in Wallet Centre", () => {
    expect(src).not.toContain("<Screen8CryptoVault />");
  });
});
