import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Homepage layout validator.
 * Enforces:
 *   1. Exact section order (S1..S11) on both mobile and desktop.
 *   2. "WinGo", "Lottery", and "Crypto Trading" appear ONLY inside S1 (home-hero).
 *   3. Deposit/Withdraw/Transfer/History CTAs render exactly once, inside S1.
 */

const EXPECTED_ORDER = [
  "home-hero",
  "home-agent-empire",
  "home-fixed-deposit",
  "home-exclusive-games",
  "home-ai-prediction",
  "home-finance-hub",
  "home-vip-club",
  "home-rewards",
  "home-promotions",
  "home-trust-center",
  "home-future-expansion",
];

const RESTRICTED_TOKENS = ["WinGo", "Lottery", "Crypto Trading"];

const FILES = [
  "src/pages/HomeMobile.tsx",
  "src/pages/HomeDesktop.tsx",
];

function extractSectionOrder(src: string): string[] {
  // Matches: data-testid="home-..."  OR  id="home-..." (as prop on Section/Row wrapper)
  const re = /(?:data-testid|id)=["'](home-[a-z-]+)["']/g;
  const found: string[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (EXPECTED_ORDER.includes(m[1]) && !seen.has(m[1])) {
      seen.add(m[1]);
      found.push(m[1]);
    }
  }
  return found;
}

function sliceBySection(src: string): Record<string, string> {
  // Splits the source into text blocks per section id, using the order marker as delimiter.
  const positions: { id: string; idx: number }[] = [];
  for (const id of EXPECTED_ORDER) {
    const idx = src.indexOf(`"${id}"`);
    if (idx >= 0) positions.push({ id, idx });
  }
  positions.sort((a, b) => a.idx - b.idx);
  const map: Record<string, string> = {};
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].idx;
    const end = i + 1 < positions.length ? positions[i + 1].idx : src.length;
    map[positions[i].id] = src.slice(start, end);
  }
  return map;
}

describe.each(FILES)("homepage layout: %s", (file) => {
  const src = readFileSync(resolve(process.cwd(), file), "utf8");

  it("renders all 11 sections in the locked order", () => {
    expect(extractSectionOrder(src)).toEqual(EXPECTED_ORDER);
  });

  it.each(RESTRICTED_TOKENS)(
    "keeps '%s' inside SECTION 1 (home-hero) only",
    (token) => {
      const bySection = sliceBySection(src);
      for (const [id, block] of Object.entries(bySection)) {
        if (id === "home-hero") continue;
        expect(
          block.includes(token),
          `"${token}" leaked into ${id} — must stay in SECTION 1`,
        ).toBe(false);
      }
    },
  );

  it.each(["home-cta-deposit", "home-cta-withdraw", "home-cta-transfer", "home-cta-history"])(
    "renders %s exactly once, inside home-hero",
    (tid) => {
      const occurrences = src.split(`"${tid}"`).length - 1;
      expect(occurrences, `${tid} occurrences`).toBe(1);
      const bySection = sliceBySection(src);
      expect(bySection["home-hero"]?.includes(`"${tid}"`)).toBe(true);
    },
  );
});
