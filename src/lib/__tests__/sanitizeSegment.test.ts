import { describe, it, expect } from "vitest";
import { sanitizeSegment, SANITIZE_SEGMENT_MAX_LENGTH } from "../sanitizeSegment";

describe("sanitizeSegment", () => {
  it("replaces spaces with single dashes", () => {
    expect(sanitizeSegment("hello   world  foo")).toBe("hello-world-foo");
  });

  it("replaces Windows reserved characters <>:\"/\\|?*", () => {
    expect(sanitizeSegment('a<b>c:d"e/f\\g|h?i*j')).toBe("a-b-c-d-e-f-g-h-i-j");
  });

  it("strips ASCII control characters (0x00-0x1f, 0x7f)", () => {
    expect(sanitizeSegment("a\x00b\x01c\x1fd\x7fe")).toBe("abcde");
    // tab/newline are control chars and are stripped first, before whitespace
    // collapsing runs — so they vanish rather than becoming dashes.
    expect(sanitizeSegment("tab\there\nnow")).toBe("tabherenow");
  });

  it("trims leading and trailing dots and dashes", () => {
    expect(sanitizeSegment("...foo...")).toBe("foo");
    expect(sanitizeSegment("---bar---")).toBe("bar");
    expect(sanitizeSegment(".-.baz.-.")).toBe("baz");
  });

  it("collapses consecutive dashes produced by replacements", () => {
    expect(sanitizeSegment("a   <>  b")).toBe("a-b");
  });

  it("caps length at SANITIZE_SEGMENT_MAX_LENGTH", () => {
    const long = "x".repeat(SANITIZE_SEGMENT_MAX_LENGTH + 50);
    const out = sanitizeSegment(long);
    expect(out.length).toBe(SANITIZE_SEGMENT_MAX_LENGTH);
    expect(out).toBe("x".repeat(SANITIZE_SEGMENT_MAX_LENGTH));
  });

  it("returns fallback when input is empty, whitespace, or only unsafe chars", () => {
    expect(sanitizeSegment("")).toBe("segment");
    expect(sanitizeSegment("   ")).toBe("segment");
    expect(sanitizeSegment("....")).toBe("segment");
    expect(sanitizeSegment("<>:\"/\\|?*")).toBe("segment");
    expect(sanitizeSegment("", "label")).toBe("label");
    expect(sanitizeSegment(null as unknown as string, "fb")).toBe("fb");
    expect(sanitizeSegment(undefined as unknown as string, "fb")).toBe("fb");
  });

  it("is deterministic — same input yields same output across calls", () => {
    const input = 'Step 01: "Already Claimed" / retry?*';
    expect(sanitizeSegment(input)).toBe(sanitizeSegment(input));
    expect(sanitizeSegment(input)).toBe("Step-01-Already-Claimed-retry");
  });

  describe("Windows reserved device names", () => {
    const reserved = [
      "CON", "PRN", "AUX", "NUL",
      "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
      "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
    ];

    it.each(reserved)("suffixes %s so the filename is valid on Windows", (name) => {
      expect(sanitizeSegment(name)).toBe(`${name}-segment`);
    });

    it("matches reserved names case-insensitively", () => {
      expect(sanitizeSegment("con")).toBe("con-segment");
      expect(sanitizeSegment("Com1")).toBe("Com1-segment");
      expect(sanitizeSegment("nul")).toBe("nul-segment");
    });

    it("suffixes reserved names that have an extension", () => {
      expect(sanitizeSegment("CON.txt")).toBe("CON.txt-segment");
      expect(sanitizeSegment("com1.log")).toBe("com1.log-segment");
    });

    it("leaves names that merely contain a reserved word alone", () => {
      expect(sanitizeSegment("CONSOLE")).toBe("CONSOLE");
      expect(sanitizeSegment("COM10")).toBe("COM10");
      expect(sanitizeSegment("my-con")).toBe("my-con");
      expect(sanitizeSegment("LPT0")).toBe("LPT0");
    });
  });
});
