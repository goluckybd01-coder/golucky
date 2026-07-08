import { describe, it, expect } from "vitest";
import { POPULAR, POPULAR_ART_PLACEHOLDER, resolveGameArt } from "@/pages/GamesPremium";

describe("Popular games artwork integrity", () => {
  it("every POPULAR entry declares a truthy artwork asset", () => {
    for (const g of POPULAR) {
      expect(g.art, `Missing art for ${g.name}`).toBeTruthy();
      expect(typeof g.art).toBe("string");
      expect(g.art.length).toBeGreaterThan(0);
    }
  });

  it("resolveGameArt returns placeholder for empty/undefined art", () => {
    expect(resolveGameArt(undefined)).toBe(POPULAR_ART_PLACEHOLDER);
    expect(resolveGameArt(null)).toBe(POPULAR_ART_PLACEHOLDER);
    expect(resolveGameArt("")).toBe(POPULAR_ART_PLACEHOLDER);
    expect(resolveGameArt("   ")).toBe(POPULAR_ART_PLACEHOLDER);
  });

  it("resolveGameArt returns original src when provided", () => {
    expect(resolveGameArt("/img/foo.jpg")).toBe("/img/foo.jpg");
  });

  it("placeholder is a valid inline SVG data URI", () => {
    expect(POPULAR_ART_PLACEHOLDER.startsWith("data:image/svg+xml")).toBe(true);
  });
});
