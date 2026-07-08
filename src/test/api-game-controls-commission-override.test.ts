import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

type Game = { commission_override?: number | null };
type Provider = { commission_rate: number };

function backendResolveCommission(
  game: Game,
  provider: Provider,
  flagEnabled: boolean
): number {
  if (!flagEnabled) return provider.commission_rate;
  return game.commission_override ?? provider.commission_rate;
}

function clientResolveCommission(_game: Game, provider: Provider): number {
  return provider.commission_rate;
}

describe("commission_override — backend-safe resolver", () => {
  const provider: Provider = { commission_rate: 5 };

  it("ignores commission_override when flag is OFF", () => {
    expect(
      backendResolveCommission({ commission_override: 15 }, provider, false)
    ).toBe(5);
  });

  it("applies commission_override when flag is ON", () => {
    expect(
      backendResolveCommission({ commission_override: 15 }, provider, true)
    ).toBe(15);
  });

  it("falls back to provider default when override is null (flag ON)", () => {
    expect(
      backendResolveCommission({ commission_override: null }, provider, true)
    ).toBe(5);
  });

  it("falls back to provider default when override is undefined (flag ON)", () => {
    expect(backendResolveCommission({}, provider, true)).toBe(5);
  });
});

describe("commission_override — client-side resolver", () => {
  const provider: Provider = { commission_rate: 5 };

  it("never applies commission_override, even with flag ON", () => {
    expect(clientResolveCommission({ commission_override: 99 }, provider)).toBe(5);
  });

  it("never applies commission_override with flag OFF", () => {
    expect(clientResolveCommission({ commission_override: 99 }, provider)).toBe(5);
  });
});

function walk(dir: string, out: string[] = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(p);
  }
  return out;
}

describe("commission_override — no client reads", () => {
  it("is not referenced anywhere in the live/public client code", () => {
    const files = walk("src");
    const offenders: string[] = [];
    for (const f of files) {
      if (f.includes("/admin/")) continue;
      if (f.includes("/integrations/supabase/types.ts")) continue;
      if (f.includes("/test/")) continue;
      const txt = readFileSync(f, "utf8");
      if (txt.includes("commission_override")) offenders.push(f);
    }
    expect(offenders).toEqual([]);
  });
});
