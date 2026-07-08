import { toast } from "sonner";
import { Sentry, isSentryEnabled } from "./sentry";

const RECENT_WINDOW_MS = 3000;
const recent = new Map<string, number>();

function friendly(raw: unknown): string {
  const msg =
    typeof raw === "string" ? raw : (raw as Error)?.message ?? String(raw ?? "");
  if (!msg) return "An unexpected error occurred.";
  if (/NetworkError|Failed to fetch|Load failed/i.test(msg))
    return "Network problem — check your connection.";
  if (/ChunkLoadError|Loading chunk/i.test(msg))
    return "A new version is loading — refresh the page.";
  if (/ResizeObserver/i.test(msg)) return "";
  return msg.length > 160 ? `${msg.slice(0, 157)}...` : msg;
}

interface ErrorContext {
  type: "error" | "unhandledrejection";
  source?: { filename?: string; lineno?: number; colno?: number };
}

function report(raw: unknown, ctx: ErrorContext) {
  const message = friendly(raw);
  if (!message) return;

  const err = raw instanceof Error ? raw : undefined;
  const entry = {
    type: ctx.type,
    message: err?.message ?? (typeof raw === "string" ? raw : String(raw ?? "")),
    name: err?.name,
    stack: err?.stack,
    route:
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "",
    href: typeof window !== "undefined" ? window.location.href : "",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    timestamp: new Date().toISOString(),
    ...ctx.source,
  };

  if (import.meta.env.DEV) {
    console.groupCollapsed(
      `%c[GlobalError] ${entry.type}: ${entry.message}`,
      "color:#f87171;font-weight:bold",
    );
    console.table(entry);
    if (entry.stack) console.error(entry.stack);
    console.groupEnd();
  } else {
    console.error("[GlobalError]", entry);
  }

  if (isSentryEnabled()) {
    Sentry.withScope((scope) => {
      scope.setTag("handler", entry.type);
      scope.setContext("app", {
        route: entry.route,
        href: entry.href,
        userAgent: entry.userAgent,
        timestamp: entry.timestamp,
        filename: entry.filename,
        lineno: entry.lineno,
        colno: entry.colno,
      });
      Sentry.captureException(err ?? new Error(entry.message));
    });
  }

  const now = Date.now();
  const last = recent.get(message) ?? 0;
  if (now - last < RECENT_WINDOW_MS) return;
  recent.set(message, now);
  toast.error(message);
}

export function installGlobalErrorHandlers() {
  const w = window as Window & { __glGlobalErrHandlers?: boolean };
  if (w.__glGlobalErrHandlers) return;
  w.__glGlobalErrHandlers = true;

  window.addEventListener("error", (event) => {
    if (event.target && event.target !== window) return;
    report(event.error ?? event.message, {
      type: "error",
      source: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    report(event.reason, { type: "unhandledrejection" });
  });
}
