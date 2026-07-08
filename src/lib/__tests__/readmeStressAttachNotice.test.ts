import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  parseStressAttachArtifacts,
  formatStressAttachSkipNotice,
} from "../stressAttachArtifacts";

/**
 * Verifies that every "[stress] STRESS_ATTACH_ARTIFACTS disabled" example in
 * README.md exactly matches formatStressAttachSkipNotice for the env scenario
 * it documents. Keeps the README in sync with the formatter.
 */

const README = readFileSync(resolve(__dirname, "../../../README.md"), "utf8");
const BASE = { totalDiffs: 3, stressSeed: 42, seedHex: "0000002a" };

const cases: Array<{ name: string; env: Record<string, string | undefined> }> = [
  { name: "CI default — CI=1, unset", env: { CI: "1" } },
  { name: "CI default — local, unset", env: {} },
  { name: "CI default — CI=1, empty", env: { CI: "1", STRESS_ATTACH_ARTIFACTS: "" } },
  { name: "env override — 0 on CI", env: { CI: "1", STRESS_ATTACH_ARTIFACTS: "0" } },
  { name: "env override — 1 locally", env: { STRESS_ATTACH_ARTIFACTS: "1" } },
  { name: "env override — unknown on CI", env: { CI: "1", STRESS_ATTACH_ARTIFACTS: "maybe" } },
  { name: "env override — ' YeS '", env: { STRESS_ATTACH_ARTIFACTS: " YeS " } },
];

describe("README skip-notice examples", () => {
  for (const { name, env } of cases) {
    it(name, () => {
      const decision = parseStressAttachArtifacts(env);
      const expected = formatStressAttachSkipNotice({ ...BASE, decision });
      expect(README).toContain(expected);
    });
  }
});
