import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config scoped to visual-regression tests.
 * Kept separate from the Vitest unit suite (which stays in src/**).
 */
export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080",
    trace: "off",
  },
  // Snapshot files live next to the spec: tests/visual/__screenshots__/<spec>/<name>.png
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  expect: {
    toHaveScreenshot: {
      // Tolerate sub-pixel text/anti-alias drift; catch real layout regressions.
      maxDiffPixelRatio: 0.02,
      threshold: 0.15,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
