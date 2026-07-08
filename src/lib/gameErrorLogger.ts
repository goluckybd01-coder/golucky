// Lightweight runtime error logger for game pages.
// Captures console errors, unhandled rejections, and explicit API failures
// while a game page is mounted. Logs to console (tagged) and surfaces a toast.
import { toast } from "sonner";

type LogScope = { game: string; period?: string; mode?: string };

const TAG = (game: string) => `[GameError:${game}]`;

export function logGameError(scope: LogScope, where: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
   
  console.error(TAG(scope.game), where, { ...scope, error: msg, raw: err });
  if (typeof window !== "undefined") {
    try {
      toast.error(`${scope.game} • ${where}`, { description: msg.slice(0, 160) });
    } catch {}
  }
}

/** Attach window-level listeners; returns a cleanup fn. */
export function attachGameErrorListeners(game: string) {
  if (typeof window === "undefined") return () => {};
  const onError = (e: ErrorEvent) => {
     
    console.error(TAG(game), "window.error", e.message, e.error);
  };
  const onRejection = (e: PromiseRejectionEvent) => {
     
    console.error(TAG(game), "unhandledrejection", e.reason);
  };
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
