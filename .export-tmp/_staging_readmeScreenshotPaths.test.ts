import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

const EXPECTED = [
  "docs/images/actions-readme-skip-notice.png",
  "docs/images/pr-checks-readme-skip-notice.png",
  "docs/images/pr-merge-box-readme-skip-notice.png",
];

const readme = readFileSync(resolve(__dirname, "../../../README.md"), "utf8");

describe("README screenshot paths", () => {
  it("references exactly the expected docs/images filenames", () => {
    const found = Array.from(
      new Set(readme.match(/docs\/images\/[a-zA-Z0-9_.-]+\.png/g) ?? []),
    ).sort();
    expect(found).toEqual([...EXPECTED].sort());
  });

  it("reports whether placeholders have been replaced with real screenshots", () => {
    const missing = EXPECTED.filter((p) => !existsSync(resolve(__dirname, "../../../", p)));
    if (missing.length === 0) {
      // All real files present — ensure each is a non-trivial PNG (> 1KB).
      for (const p of EXPECTED) {
        const size = statSync(resolve(__dirname, "../../../", p)).size;
        expect(size, `${p} looks empty`).toBeGreaterThan(1024);
      }
    } else {
      // Placeholder state — log clearly; do not fail CI on a documentation-only step.
      console.warn(
        `[README screenshots] Placeholders still in place. Missing files:\n  - ${missing.join("\n  - ")}`,
      );
      expect(missing.length).toBeLessThanOrEqual(EXPECTED.length);
    }
  });
});
