import { describe, it, expect } from "vitest";
import {
  parseStressAttachArtifacts,
  formatStressAttachSkipNotice,
} from "../stressAttachArtifacts";

describe("parseStressAttachArtifacts", () => {
  describe("unset/empty falls back to CI", () => {
    it("unset + CI=true → effective true (CI default)", () => {
      const d = parseStressAttachArtifacts({ CI: "1" });
      expect(d).toMatchObject({
        effective: true,
        ci: true,
        source: "CI default",
        rawDisplay: "<unset>",
      });
    });
    it("unset + no CI → effective false", () => {
      const d = parseStressAttachArtifacts({});
      expect(d).toMatchObject({
        effective: false,
        ci: false,
        source: "CI default",
        rawDisplay: "<unset>",
      });
    });
    it("empty string + CI=true → effective true, rawDisplay=<empty>", () => {
      const d = parseStressAttachArtifacts({ STRESS_ATTACH_ARTIFACTS: "", CI: "true" });
      expect(d).toMatchObject({ effective: true, source: "CI default", rawDisplay: "<empty>" });
    });
    it("whitespace-only is treated as empty", () => {
      const d = parseStressAttachArtifacts({ STRESS_ATTACH_ARTIFACTS: "   " });
      expect(d.source).toBe("CI default");
      expect(d.effective).toBe(false);
    });
  });

  describe("truthy values override CI", () => {
    for (const v of ["1", "true", "TRUE", "yes", "Yes", "on", " ON "]) {
      it(`"${v}" → effective true (env override), regardless of CI`, () => {
        const noCi = parseStressAttachArtifacts({ STRESS_ATTACH_ARTIFACTS: v });
        const withCi = parseStressAttachArtifacts({ STRESS_ATTACH_ARTIFACTS: v, CI: "1" });
        expect(noCi.effective).toBe(true);
        expect(noCi.source).toBe("env override");
        expect(withCi.effective).toBe(true);
      });
    }
  });

  describe("falsy values override CI", () => {
    for (const v of ["0", "false", "FALSE", "no", "No", "off", " OFF "]) {
      it(`"${v}" → effective false (env override), even when CI=true`, () => {
        const withCi = parseStressAttachArtifacts({ STRESS_ATTACH_ARTIFACTS: v, CI: "1" });
        expect(withCi).toMatchObject({ effective: false, source: "env override", ci: true });
      });
    }
  });

  describe("unknown values are treated as false override", () => {
    for (const v of ["maybe", "2", "tru", "enable"]) {
      it(`"${v}" → effective false (env override)`, () => {
        const d = parseStressAttachArtifacts({ STRESS_ATTACH_ARTIFACTS: v, CI: "1" });
        expect(d.effective).toBe(false);
        expect(d.source).toBe("env override");
      });
    }
  });

  it("preserves the original raw value", () => {
    const d = parseStressAttachArtifacts({ STRESS_ATTACH_ARTIFACTS: " YeS " });
    expect(d.raw).toBe(" YeS ");
    expect(d.rawDisplay).toBe("yes");
  });
});

describe("formatStressAttachSkipNotice", () => {
  const baseArgs = { totalDiffs: 3, stressSeed: 42, seedHex: "0000002a" };

  it("CI default — unset on CI", () => {
    const decision = parseStressAttachArtifacts({ CI: "1" });
    expect(
      formatStressAttachSkipNotice({ ...baseArgs, decision }),
    ).toMatchInlineSnapshot(
      `"[stress] STRESS_ATTACH_ARTIFACTS disabled — skipping 3 diff artifacts for STRESS_SEED=42 (0000002a). effective=true (raw=<unset>, source=CI default, CI=true). Set STRESS_ATTACH_ARTIFACTS=1 to upload."`,
    );
  });

  it("CI default — unset locally", () => {
    const decision = parseStressAttachArtifacts({});
    expect(
      formatStressAttachSkipNotice({ ...baseArgs, decision }),
    ).toMatchInlineSnapshot(
      `"[stress] STRESS_ATTACH_ARTIFACTS disabled — skipping 3 diff artifacts for STRESS_SEED=42 (0000002a). effective=false (raw=<unset>, source=CI default, CI=false). Set STRESS_ATTACH_ARTIFACTS=1 to upload."`,
    );
  });

  it("CI default — empty string on CI", () => {
    const decision = parseStressAttachArtifacts({ STRESS_ATTACH_ARTIFACTS: "", CI: "1" });
    expect(
      formatStressAttachSkipNotice({ ...baseArgs, decision }),
    ).toMatchInlineSnapshot(
      `"[stress] STRESS_ATTACH_ARTIFACTS disabled — skipping 3 diff artifacts for STRESS_SEED=42 (0000002a). effective=true (raw=<empty>, source=CI default, CI=true). Set STRESS_ATTACH_ARTIFACTS=1 to upload."`,
    );
  });

  it("env override — explicit 0 on CI", () => {
    const decision = parseStressAttachArtifacts({ STRESS_ATTACH_ARTIFACTS: "0", CI: "1" });
    expect(
      formatStressAttachSkipNotice({ ...baseArgs, decision }),
    ).toMatchInlineSnapshot(
      `"[stress] STRESS_ATTACH_ARTIFACTS disabled — skipping 3 diff artifacts for STRESS_SEED=42 (0000002a). effective=false (raw=0, source=env override, CI=true). Set STRESS_ATTACH_ARTIFACTS=1 to upload."`,
    );
  });

  it("env override — explicit 1 locally", () => {
    const decision = parseStressAttachArtifacts({ STRESS_ATTACH_ARTIFACTS: "1" });
    expect(
      formatStressAttachSkipNotice({ ...baseArgs, decision }),
    ).toMatchInlineSnapshot(
      `"[stress] STRESS_ATTACH_ARTIFACTS disabled — skipping 3 diff artifacts for STRESS_SEED=42 (0000002a). effective=true (raw=1, source=env override, CI=false). Set STRESS_ATTACH_ARTIFACTS=1 to upload."`,
    );
  });

  it("env override — unknown value falls to false", () => {
    const decision = parseStressAttachArtifacts({ STRESS_ATTACH_ARTIFACTS: "maybe", CI: "1" });
    expect(
      formatStressAttachSkipNotice({ ...baseArgs, decision }),
    ).toMatchInlineSnapshot(
      `"[stress] STRESS_ATTACH_ARTIFACTS disabled — skipping 3 diff artifacts for STRESS_SEED=42 (0000002a). effective=false (raw=maybe, source=env override, CI=true). Set STRESS_ATTACH_ARTIFACTS=1 to upload."`,
    );
  });

  it("normalizes case/whitespace in the displayed raw value", () => {
    const decision = parseStressAttachArtifacts({ STRESS_ATTACH_ARTIFACTS: " YeS " });
    expect(
      formatStressAttachSkipNotice({ ...baseArgs, decision }),
    ).toMatchInlineSnapshot(
      `"[stress] STRESS_ATTACH_ARTIFACTS disabled — skipping 3 diff artifacts for STRESS_SEED=42 (0000002a). effective=true (raw=yes, source=env override, CI=false). Set STRESS_ATTACH_ARTIFACTS=1 to upload."`,
    );
  });
});
