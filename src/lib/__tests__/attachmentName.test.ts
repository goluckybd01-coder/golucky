import { describe, it, expect } from "vitest";
import { buildAttachmentBaseName, slugifyTitle } from "../attachmentName";

describe("buildAttachmentBaseName", () => {
  const base = { invocation: 1, attempt: 2, retries: 3 };

  it("composes the deterministic <test>__<label>__step-NN__attempt-MM-of-RR format", () => {
    expect(
      buildAttachmentBaseName({
        ...base,
        testTitle: "VIP claim flow",
        label: "expectVisible",
      }),
    ).toBe("vip-claim-flow__expectVisible__step-01__attempt-02-of-03");
  });

  it("zero-pads invocation/attempt/retries to width 2", () => {
    const name = buildAttachmentBaseName({
      testTitle: "t",
      label: "l",
      invocation: 4,
      attempt: 5,
      retries: 12,
    });
    expect(name).toBe("t__l__step-04__attempt-05-of-12");
  });

  describe("Windows reserved device names in test title", () => {
    const cases = ["CON", "PRN", "AUX", "NUL", "COM1", "COM5", "COM9", "LPT1"];
    it.each(cases)("suffixes %s test title so filename is valid on Windows", (name) => {
      // slugifyTitle lowercases, sanitizeSegment then suffixes "-segment"
      const expectedTest = `${name.toLowerCase()}-segment`;
      expect(
        buildAttachmentBaseName({ ...base, testTitle: name, label: "l" }),
      ).toBe(`${expectedTest}__l__step-01__attempt-02-of-03`);
    });
  });

  describe("Windows reserved device names in label", () => {
    const cases = ["CON", "COM1", "COM9", "NUL", "AUX"];
    it.each(cases)("suffixes %s label so filename is valid on Windows", (label) => {
      expect(
        buildAttachmentBaseName({ ...base, testTitle: "t", label }),
      ).toBe(`t__${label}-segment__step-01__attempt-02-of-03`);
    });
  });

  it("handles reserved names in BOTH title and label", () => {
    expect(
      buildAttachmentBaseName({
        ...base,
        testTitle: "CON",
        label: "COM1",
      }),
    ).toBe("con-segment__COM1-segment__step-01__attempt-02-of-03");
  });

  it("does not suffix near-misses like CONSOLE or COM10", () => {
    expect(
      buildAttachmentBaseName({ ...base, testTitle: "CONSOLE", label: "COM10" }),
    ).toBe("console__COM10__step-01__attempt-02-of-03");
  });

  it("is fully deterministic across repeated calls", () => {
    const parts = { ...base, testTitle: "CON", label: "COM1" };
    expect(buildAttachmentBaseName(parts)).toBe(buildAttachmentBaseName(parts));
  });
});

describe("slugifyTitle", () => {
  it("lowercases and dash-collapses", () => {
    expect(slugifyTitle("Hello World  Foo")).toBe("hello-world-foo");
  });
  it("falls back to 'untitled' for empty input", () => {
    expect(slugifyTitle("")).toBe("untitled");
    expect(slugifyTitle("!!!")).toBe("untitled");
  });
  it("caps length at 60", () => {
    expect(slugifyTitle("a".repeat(120)).length).toBe(60);
  });
});
