/**
 * Feature flags.
 *
 * Staging-only flag `VITE_ENABLE_DEMO_MODE` gates the Section 01 "Demo Mode"
 * hero override. In production this env var is unset, so demo mode is
 * hard-forced off regardless of localStorage or `?demo=1` URL params.
 *
 * To enable on staging, set in the staging build env:
 *   VITE_ENABLE_DEMO_MODE=true
 */

const isProdBuild =
  typeof import.meta !== "undefined" && import.meta.env?.PROD === true;

const rawDemoFlag = import.meta.env?.VITE_ENABLE_DEMO_MODE;

// Startup validation — warn once if the flag is missing or malformed.
function validateDemoFlag(): boolean {
  if (rawDemoFlag === undefined || rawDemoFlag === null || rawDemoFlag === "") {
    if (!isProdBuild) {
      console.warn(
        "[featureFlags] VITE_ENABLE_DEMO_MODE is not set. Demo mode will be disabled. " +
          'Set VITE_ENABLE_DEMO_MODE="true" in the staging build env to enable.',
      );
    }
    return false;
  }
  const normalized = String(rawDemoFlag).toLowerCase();
  if (normalized !== "true" && normalized !== "false") {
    console.warn(
      `[featureFlags] VITE_ENABLE_DEMO_MODE has an invalid value: "${rawDemoFlag}". ` +
        'Expected "true" or "false". Demo mode will be disabled.',
    );
    return false;
  }
  return normalized === "true";
}

const demoFlagEnabled = validateDemoFlag();

if (isProdBuild && demoFlagEnabled) {
  console.warn(
    "[featureFlags] VITE_ENABLE_DEMO_MODE=true detected in a production build. " +
      "Demo mode is force-disabled in production.",
  );
}

export const DEMO_MODE_ALLOWED: boolean = !isProdBuild && demoFlagEnabled;
