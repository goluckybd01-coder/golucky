import { describe, it, expect } from "vitest";

// Smoke test to validate that mikepenz/action-junit-report annotates the
// exact failing file + line in PR checks. Gated behind an env flag so it
// only runs in the dedicated CI verification workflow.
const ENABLED = process.env.ANNOTATION_SMOKE_TEST === "1";

describe.runIf(ENABLED)("JUnit annotation smoke", () => {
  it("fails intentionally to verify PR annotation file/line", () => {
    // The annotation must point to THIS line number in this file.
    expect(1 + 1).toBe(3);
  });
});
