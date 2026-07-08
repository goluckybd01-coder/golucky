import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("SentryTest anchors", () => {
  const src = readFileSync(
    resolve(__dirname, "../SentryTest.tsx"),
    "utf8",
  );

  const anchorRe = /<a\b([\s\S]*?)>/g;
  const anchors = Array.from(src.matchAll(anchorRe)).map((m) => m[1]);

  it("has at least one target=\"_blank\" anchor", () => {
    const blanks = anchors.filter((a) => /target=["']_blank["']/.test(a));
    expect(blanks.length).toBeGreaterThan(0);
  });

  it("every target=\"_blank\" anchor uses rel=\"noopener noreferrer\"", () => {
    const offenders = anchors.filter(
      (a) =>
        /target=["']_blank["']/.test(a) &&
        !/rel=["'][^"']*\bnoopener\b[^"']*\bnoreferrer\b[^"']*["']/.test(a) &&
        !/rel=["'][^"']*\bnoreferrer\b[^"']*\bnoopener\b[^"']*["']/.test(a),
    );
    expect(offenders, `Unsafe anchors:\n${offenders.join("\n---\n")}`).toEqual([]);
  });
});
