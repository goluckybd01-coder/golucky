import { describe, it, expect } from "vitest";
import {
  TOOL_FILTER,
  buildPrRef,
  codeScanningUrl,
  ruleResultsUrl,
} from "../../../scripts/lib/security-comment-urls.mjs";

const REPO = "https://github.com/acme/golucky";

describe("buildPrRef", () => {
  it("returns empty string when prNumber is missing", () => {
    expect(buildPrRef("")).toBe("");
    expect(buildPrRef(undefined)).toBe("");
  });
  it("formats numeric PR ref", () => {
    expect(buildPrRef(42)).toBe("pr:42");
    expect(buildPrRef("7")).toBe("pr:7");
  });
});

describe("codeScanningUrl", () => {
  it("builds tool-filtered URL without pr scope", () => {
    const url = codeScanningUrl(REPO, "");
    expect(url).toBe(
      `${REPO}/security/code-scanning?query=${encodeURIComponent(`is:open ${TOOL_FILTER}`)}`,
    );
  });
  it("includes pr scope when prNumber is provided", () => {
    const url = codeScanningUrl(REPO, 99);
    expect(url).toBe(
      `${REPO}/security/code-scanning?query=${encodeURIComponent(`is:open ${TOOL_FILTER} pr:99`)}`,
    );
  });
});

describe("ruleResultsUrl", () => {
  it("deep-links to a specific rule filtered by tool", () => {
    const url = ruleResultsUrl(REPO, "mines_race_condition", "");
    expect(url).toBe(
      `${REPO}/security/code-scanning?query=${encodeURIComponent(
        `is:open ${TOOL_FILTER} rule:mines_race_condition`,
      )}`,
    );
  });
  it("scopes rule deep-link to the current PR", () => {
    const url = ruleResultsUrl(REPO, "rule-with-dash", 123);
    expect(url).toBe(
      `${REPO}/security/code-scanning?query=${encodeURIComponent(
        `is:open ${TOOL_FILTER} rule:rule-with-dash pr:123`,
      )}`,
    );
  });
  it("encodes spaces and special chars in the rule id", () => {
    const url = ruleResultsUrl(REPO, "rule with space", 1);
    expect(url).toContain("rule%3Arule%20with%20space");
    expect(url).toContain("pr%3A1");
  });
  it("produces distinct URLs for different rule ids on the same PR", () => {
    expect(ruleResultsUrl(REPO, "a", 5)).not.toBe(ruleResultsUrl(REPO, "b", 5));
  });

  describe("edge cases", () => {
    it("handles empty rule id (still emits rule: prefix)", () => {
      const url = ruleResultsUrl(REPO, "", 1);
      expect(url).toBe(
        `${REPO}/security/code-scanning?query=${encodeURIComponent(
          `is:open ${TOOL_FILTER} rule: pr:1`,
        )}`,
      );
      expect(url).toContain("rule%3A%20pr%3A1");
    });

    it("encodes special characters in PR numbers (e.g. '12&foo')", () => {
      const url = ruleResultsUrl(REPO, "r1", "12&foo");
      expect(url).toContain("pr%3A12%26foo");
      expect(url).not.toContain("&foo");
    });

    it("encodes whitespace-only PR numbers as a non-empty ref", () => {
      const url = ruleResultsUrl(REPO, "r1", " ");
      // truthy string → buildPrRef returns "pr: "
      expect(url).toContain("pr%3A%20");
    });

    it("encodes unicode rule ids", () => {
      const ruleId = "règle-✨-检测";
      const url = ruleResultsUrl(REPO, ruleId, 7);
      expect(url).toBe(
        `${REPO}/security/code-scanning?query=${encodeURIComponent(
          `is:open ${TOOL_FILTER} rule:${ruleId} pr:7`,
        )}`,
      );
      expect(url).toContain(encodeURIComponent(ruleId));
    });

    it("encodes URL-reserved characters in rule ids", () => {
      const url = ruleResultsUrl(REPO, "a/b?c#d&e=f", 2);
      expect(url).toContain("a%2Fb%3Fc%23d%26e%3Df");
      // ensure no raw reserved chars leak into the query
      const query = url.split("?query=")[1];
      expect(query).not.toMatch(/[#&=?/]/);
    });

    it("treats numeric 0 as no PR ref (falsy)", () => {
      const url = ruleResultsUrl(REPO, "r1", 0);
      expect(url).not.toContain("pr%3A");
    });
  });
});
