/**
 * Runtime badge/link configuration.
 * VITE_* env vars are baked at build time; this layer lets users
 * override or supply values at runtime via a settings screen.
 */
const STORAGE_KEY = "gl.badgeConfig.v1";

export type BadgeConfig = {
  githubRepo: string; // "owner/repo"
  workflowFile: string; // e.g. "footer-links-e2e.yml"
  runsUrlOverride?: string; // optional full URL override
};

const DEFAULTS: BadgeConfig = {
  githubRepo: "",
  workflowFile: "footer-links-e2e.yml",
  runsUrlOverride: "",
};

function readEnv(): Partial<BadgeConfig> {
  return {
    githubRepo: (import.meta.env.VITE_GITHUB_REPO as string | undefined)?.trim() || "",
    workflowFile:
      (import.meta.env.VITE_GITHUB_WORKFLOW_FILE as string | undefined)?.trim() || "",
    runsUrlOverride:
      (import.meta.env.VITE_CI_RUNS_URL as string | undefined)?.trim() || "",
  };
}

function readStorage(): Partial<BadgeConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<BadgeConfig>) : {};
  } catch {
    return {};
  }
}

export function getBadgeConfig(): BadgeConfig {
  const env = readEnv();
  const stored = readStorage();
  // Precedence: user override (localStorage) > env > defaults.
  return {
    githubRepo: stored.githubRepo || env.githubRepo || DEFAULTS.githubRepo,
    workflowFile: stored.workflowFile || env.workflowFile || DEFAULTS.workflowFile,
    runsUrlOverride: stored.runsUrlOverride || env.runsUrlOverride || "",
  };
}

export function saveBadgeConfig(cfg: Partial<BadgeConfig>): BadgeConfig {
  const next = { ...getBadgeConfig(), ...cfg };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("badge-config-changed"));
  return next;
}

export function resetBadgeConfig() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("badge-config-changed"));
}
