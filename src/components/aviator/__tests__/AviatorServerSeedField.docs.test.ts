import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const componentPath = resolve(here, "../AviatorServerSeedField.tsx");
const docsPath = resolve(here, "../AviatorServerSeedField.md");
const storyPath = resolve(here, "../../../stories/AviatorServerSeedField.mdx");

describe("AviatorServerSeedField docs link", () => {
  const component = readFileSync(componentPath, "utf8");
  const docs = readFileSync(docsPath, "utf8");

  it("ships the props markdown file next to the component", () => {
    expect(existsSync(docsPath)).toBe(true);
  });

  it("links the markdown from the component JSDoc", () => {
    expect(component).toMatch(/\{@link \.\/AviatorServerSeedField\.md\}/);
    expect(component).toMatch(/src\/components\/aviator\/AviatorServerSeedField\.md/);
  });

  it("documents onRetrySchedule(attempt, delayMs, retryTime)", () => {
    expect(docs).toMatch(/onRetrySchedule\(attempt, delayMs, retryTime\)/);
    expect(docs).toMatch(/Countdown UI snippet/i);
    expect(docs).toMatch(/AviatorServerSeedField/);
  });

  it("props table covers every public prop on the component", () => {
    const props = [
      "roundId",
      "label",
      "retryBaseMs",
      "retryMaxMs",
      "retryMaxAttempts",
      "retryJitterPct",
      "onRetryAttempt",
      "onRetrySchedule",
      "onRetrySuccess",
      "onRetryLimitReached",
    ];
    for (const p of props) {
      expect(docs, `docs missing prop \`${p}\``).toMatch(new RegExp(`\\b${p}\\b`));
    }
  });

  it("ships a Storybook MDX docs page covering every prop", () => {
    expect(existsSync(storyPath)).toBe(true);
    const mdx = readFileSync(storyPath, "utf8");
    expect(mdx).toMatch(/@storybook\/addon-docs\/blocks/);
    expect(mdx).toMatch(/title="Components\/Aviator\/AviatorServerSeedField"/);
    const props = [
      "roundId",
      "label",
      "retryBaseMs",
      "retryMaxMs",
      "retryMaxAttempts",
      "retryJitterPct",
      "onRetryAttempt",
      "onRetrySchedule",
      "onRetrySuccess",
      "onRetryLimitReached",
    ];
    for (const p of props) {
      expect(mdx, `MDX story missing prop \`${p}\``).toMatch(new RegExp(`\\b${p}\\b`));
    }
    expect(mdx).toMatch(/onRetrySchedule\(attempt, delayMs, retryTime\)/);
    expect(mdx).toMatch(/Countdown UI snippet/i);
  });
});
