import { describe, it, expect, beforeEach } from "vitest";
import {
  getBadgeConfig,
  saveBadgeConfig,
  resetBadgeConfig,
} from "@/lib/badgeConfig";

describe("badgeConfig", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns defaults when nothing is configured", () => {
    const cfg = getBadgeConfig();
    expect(cfg.githubRepo).toBe("");
    expect(cfg.workflowFile).toBe("footer-links-e2e.yml");
    expect(cfg.runsUrlOverride).toBe("");
  });

  it("persists overrides to localStorage and returns them", () => {
    saveBadgeConfig({ githubRepo: "acme/app", workflowFile: "ci.yml" });
    const cfg = getBadgeConfig();
    expect(cfg.githubRepo).toBe("acme/app");
    expect(cfg.workflowFile).toBe("ci.yml");
  });

  it("resetBadgeConfig clears stored overrides", () => {
    saveBadgeConfig({ githubRepo: "acme/app" });
    resetBadgeConfig();
    expect(getBadgeConfig().githubRepo).toBe("");
  });

  it("dispatches badge-config-changed on save", () => {
    let fired = 0;
    const handler = () => fired++;
    window.addEventListener("badge-config-changed", handler);
    saveBadgeConfig({ githubRepo: "a/b" });
    window.removeEventListener("badge-config-changed", handler);
    expect(fired).toBe(1);
  });
});
