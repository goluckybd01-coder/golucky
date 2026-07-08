/**
 * Parse the STRESS_ATTACH_ARTIFACTS env var into an effective boolean and
 * metadata describing how the decision was made. Extracted from the stress
 * test so the notice/decision logic is unit-testable.
 *
 * Rules:
 *  - Accepts (case-insensitive, trimmed): 1/0, true/false, yes/no, on/off.
 *  - When unset or empty, falls back to CI detection (process.env.CI truthy).
 *  - Unknown non-empty values are treated as false (explicit env override).
 */
export type StressAttachDecision = {
  effective: boolean;
  raw: string | undefined;
  rawDisplay: string;
  ci: boolean;
  source: "CI default" | "env override";
};

const TRUTHY = new Set(["1", "true", "yes", "on"]);
const FALSY = new Set(["0", "false", "no", "off"]);

export function parseStressAttachArtifacts(env: {
  STRESS_ATTACH_ARTIFACTS?: string;
  CI?: string;
}): StressAttachDecision {
  const raw = env.STRESS_ATTACH_ARTIFACTS;
  const ci = !!env.CI;
  const normalized = raw?.toLowerCase().trim();
  if (normalized === undefined || normalized === "") {
    return {
      effective: ci,
      raw,
      rawDisplay: raw === undefined ? "<unset>" : "<empty>",
      ci,
      source: "CI default",
    };
  }
  const effective = TRUTHY.has(normalized)
    ? true
    : FALSY.has(normalized)
      ? false
      : false;
  return { effective, raw, rawDisplay: normalized, ci, source: "env override" };
}

/**
 * Format the console notice emitted when artifact uploads are skipped.
 * Centralized so the message can be snapshot-tested.
 */
export function formatStressAttachSkipNotice(args: {
  decision: StressAttachDecision;
  totalDiffs: number;
  stressSeed: string | number;
  seedHex: string;
}): string {
  const { decision, totalDiffs, stressSeed, seedHex } = args;
  return (
    `[stress] STRESS_ATTACH_ARTIFACTS disabled — skipping ${totalDiffs} diff artifacts ` +
    `for STRESS_SEED=${stressSeed} (${seedHex}). ` +
    `effective=${decision.effective} (raw=${decision.rawDisplay}, ` +
    `source=${decision.source}, CI=${decision.ci}). ` +
    `Set STRESS_ATTACH_ARTIFACTS=1 to upload.`
  );
}
