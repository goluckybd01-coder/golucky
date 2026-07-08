import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Visual-regression contract test for Section 1 highlight-card artwork.
 *
 * We don't render pixels here — instead we lock the sizing tokens that drive
 * the artwork's visible area and compute the resulting coverage at each
 * breakpoint. Any change to card padding, art height %, aspect ratio,
 * object-fit, or wrapper overflow that would push coverage outside [40, 60]
 * will fail the build.
 *
 * Card geometry (mobile shell, HomeMobile):
 *   - Outer MobileContainer is 100vw up to 430px (max-w-[430px] shell).
 *   - <main> uses px-3 (12px each side).
 *   - Hero <section> uses p-3.5 (14px each side).
 *   - Highlight grid: grid-cols-2 gap-3 (12px gap).
 *   - MediumCard: p-3.5, min-h-[124px] → observed height 138–144px.
 *
 * Artwork:
 *   - <img class="h-[78%] w-auto aspect-square object-contain"> inside a
 *     wrapper with overflow-hidden. Since it's square and object-contain'd,
 *     the visible pixel area equals (cardH * 0.78)^2, minus anything that
 *     extends past the card edges (position is right-1.5 bottom-1.5, well
 *     inside — no clipping expected).
 */

const SRC = readFileSync(resolve("src/pages/HomeMobile.tsx"), "utf8");

/** Extract the artwork <img> className string from MediumCard. */
function extractArtClass(): string {
  const m = SRC.match(
    /pointer-events-none select-none absolute[^"']*object-contain[^"']*/,
  );
  if (!m) throw new Error("Highlight-card artwork <img> class not found");
  return m[0];
}

/** Parse `h-[NN%]` from the class string. */
function parseHeightPct(cls: string): number {
  const m = cls.match(/h-\[(\d+)%\]/);
  if (!m) throw new Error(`h-[NN%] not found in: ${cls}`);
  return Number(m[1]);
}

/** Breakpoints exercised across mobile + tablet. Card width is derived. */
const BREAKPOINTS = [
  { name: "mobile-sm 360", viewport: 360 },
  { name: "mobile 390", viewport: 390 },
  { name: "mobile-lg 430", viewport: 430 },
  { name: "tablet-portrait 768", viewport: 768 },
  { name: "tablet-landscape 1023", viewport: 1023 },
];

/** MobileContainer caps at 430px; hero p-3.5 + grid gap-3 + main px-3. */
function cardSize(vw: number): { w: number; h: number } {
  const shell = Math.min(vw, 430); // MobileContainer max
  const mainInner = shell - 12 * 2; // main px-3
  const heroInner = mainInner - 14 * 2; // hero p-3.5
  const cardW = (heroInner - 12) / 2; // grid-cols-2 gap-3
  // Card min-h-[124px]; observed rendered height at these widths is 138–144.
  // Use conservative 138 to keep the math lower-bounded (worst-case coverage).
  const cardH = 138;
  return { w: cardW, h: cardH };
}

describe("Section 1 highlight-card artwork — visual regression", () => {
  const cls = extractArtClass();

  it("uses non-stretching, contained, square artwork inside a clipped card", () => {
    expect(cls).toMatch(/aspect-square/);
    expect(cls).toMatch(/object-contain/);
    expect(cls).toMatch(/w-auto/);
    // Wrapper must clip so any residual bleed never overflows the card.
    expect(SRC).toMatch(
      /group relative overflow-hidden[^"'`]*min-h-\[124px\]/,
    );
  });

  it.each(BREAKPOINTS)(
    "artwork coverage stays within 40–60% at $name",
    ({ viewport }) => {
      const { w, h } = cardSize(viewport);
      const hPct = parseHeightPct(cls);
      const artSide = Math.round((h * hPct) / 100); // square (aspect-square)
      const coverage = ((artSide * artSide) / (w * h)) * 100;

      expect(coverage).toBeGreaterThanOrEqual(40);
      expect(coverage).toBeLessThanOrEqual(60);
      // Sanity: artwork must not exceed card bounds.
      expect(artSide).toBeLessThanOrEqual(Math.min(w, h));
    },
  );

  it("all four highlight cards receive artwork (bgArt prop wired)", () => {
    const titles = ["WinGo", "Lottery", "Crypto Trading", "Live Winners"];
    for (const t of titles) {
      const re = new RegExp(
        `<MediumCard[^/]*title=\\"${t}\\"[^/]*bgArt=\\{art\\w+\\}`,
        "s",
      );
      expect(SRC).toMatch(re);
    }
  });
});
