import * as Sentry from "@sentry/react";

let initialized = false;

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || initialized) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
    integrations: (defaults) =>
      defaults.filter(
        (i) => i.name !== "GlobalHandlers" && i.name !== "TryCatch",
      ),
  });
  initialized = true;
}

export function isSentryEnabled() {
  return initialized;
}

export { Sentry };
