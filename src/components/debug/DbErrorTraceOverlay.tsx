import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AlertOctagon, Copy, X, ChevronDown, ChevronUp, Bug, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * DbErrorTraceOverlay
 * ---------------------------------------------------------------
 * Development-only overlay that surfaces any Supabase / Postgres /
 * PostgREST error with:
 *   • full stack trace
 *   • current route (screen)
 *   • last user action (button/link text, aria-label, or tag)
 *
 * Listens to:
 *   • window "error" (uncaught exceptions)
 *   • window "unhandledrejection" (rejected supabase calls)
 *   • console.error (patched) — catches errors that were logged
 *     but not thrown (typical for supabase.from(...).select() flows).
 *
 * Only shows when the error looks like a DB / Supabase failure.
 * Safe in production too, but ideal for debugging.
 */

type CapturedError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  stack?: string;
  screen: string;
  action: string;
  at: string;
};

const DB_SIGNALS = [
  "does not exist",
  "violates row-level security",
  "permission denied",
  "PGRST",
  "PGRST116",
  "duplicate key value",
  "column",
  "relation",
  "function",
  "schema",
  "supabase",
  "postgrest",
];

function looksLikeDbError(input: unknown): { message: string; code?: string; details?: string; hint?: string; stack?: string } | null {
  if (!input) return null;
  // Error instance
  if (input instanceof Error) {
    const m = input.message || "";
    if (DB_SIGNALS.some((s) => m.toLowerCase().includes(s.toLowerCase()))) {
      return { message: m, stack: input.stack };
    }
  }
  // Supabase-style error object: { message, code, details, hint }
  if (typeof input === "object" && input !== null) {
    const o = input as Record<string, unknown>;
    const msg = typeof o.message === "string" ? o.message : "";
    const code = typeof o.code === "string" ? o.code : undefined;
    const hint = typeof o.hint === "string" ? o.hint : undefined;
    const details = typeof o.details === "string" ? o.details : undefined;
    const hasDbShape = !!(code || hint || details);
    if ((msg && DB_SIGNALS.some((s) => msg.toLowerCase().includes(s.toLowerCase()))) || hasDbShape) {
      return { message: msg || "Database error", code, details, hint };
    }
  }
  return null;
}

export default function DbErrorTraceOverlay() {
  const location = useLocation();
  const [err, setErr] = useState<CapturedError | null>(null);
  const [open, setOpen] = useState(true);
  const lastActionRef = useRef<string>("(no interaction)");

  // Track last user action
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const el = t.closest<HTMLElement>("button, a, [role='button'], [data-pa-action]");
      if (!el) return;
      const label =
        el.getAttribute("data-pa-action") ||
        el.getAttribute("aria-label") ||
        el.textContent?.trim().slice(0, 80) ||
        el.tagName.toLowerCase();
      lastActionRef.current = label || el.tagName.toLowerCase();
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  useEffect(() => {
    const capture = (raw: unknown) => {
      const parsed = looksLikeDbError(raw);
      if (!parsed) return;
      const stack = parsed.stack || new Error().stack || "";
      setErr({
        message: parsed.message,
        code: parsed.code,
        details: parsed.details,
        hint: parsed.hint,
        stack,
        screen: location.pathname + location.search,
        action: lastActionRef.current,
        at: new Date().toISOString(),
      });
      setOpen(true);
    };

    const onError = (e: ErrorEvent) => capture(e.error ?? e.message);
    const onRejection = (e: PromiseRejectionEvent) => capture(e.reason);

    // Patch console.error so supabase errors that are only logged still get captured.
    const originalErr = console.error;
    console.error = (...args: unknown[]) => {
      try {
        for (const a of args) {
          const p = looksLikeDbError(a);
          if (p) { capture(a); break; }
        }
      } catch { /* ignore */ }
      originalErr.apply(console, args as never);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      console.error = originalErr;
    };
  }, [location.pathname, location.search]);

  const triggerTestError = async () => {
    // Real Supabase call against a non-existent column → yields a Postgres
    // error identical in shape to the reported `agent_referral_status` failure.
    try {
      const { error } = await supabase
        .from("profiles")
        .select("agent_referral_status")
        .limit(1);
      if (error) {
        // Log so the overlay's console.error listener captures the shape.
        console.error("[test-db-error]", error);
      }
    } catch (e) {
      console.error("[test-db-error]", e);
    }
  };

  if (!err) {
    return (
      <button
        onClick={triggerTestError}
        title="Trigger test DB error"
        aria-label="Trigger test DB error"
        className="fixed bottom-3 right-3 z-[9998] flex items-center gap-1.5 rounded-full border border-rose-400/40 bg-black/70 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-rose-200 shadow-[0_10px_30px_-10px_rgba(244,63,94,0.5)] backdrop-blur-xl hover:bg-rose-500/20"
      >
        <Bug className="h-3.5 w-3.5" /> Test DB Error
      </button>
    );
  }


  const dump =
    `[DB ERROR] ${err.at}\n` +
    `Screen : ${err.screen}\n` +
    `Action : ${err.action}\n` +
    `Message: ${err.message}\n` +
    (err.code ? `Code   : ${err.code}\n` : "") +
    (err.details ? `Details: ${err.details}\n` : "") +
    (err.hint ? `Hint   : ${err.hint}\n` : "") +
    `\nStack:\n${err.stack || "(no stack)"}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(dump); } catch { /* ignore */ }
  };

  const download = () => {
    try {
      const payload = {
        at: err.at,
        screen: err.screen,
        action: err.action,
        message: err.message,
        code: err.code ?? null,
        details: err.details ?? null,
        hint: err.hint ?? null,
        stack: err.stack ?? null,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `db-error-${err.at.replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { /* ignore */ }
  };

  return (
    <div className="fixed bottom-3 left-1/2 z-[9999] w-[min(92vw,720px)] -translate-x-1/2 rounded-2xl border border-rose-400/40 bg-[#150307]/95 text-white shadow-[0_20px_60px_-10px_rgba(244,63,94,0.6)] backdrop-blur-xl">
      <div className="flex items-center gap-2 rounded-t-2xl border-b border-rose-400/20 bg-rose-500/15 px-3 py-2">
        <AlertOctagon className="h-4 w-4 text-rose-300" />
        <div className="flex-1 truncate text-[12px] font-black uppercase tracking-widest text-rose-200">
          Database Error Trace
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-1 text-white/70 hover:bg-white/10"
          aria-label={open ? "Collapse" : "Expand"}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        <button onClick={copy} className="rounded-md p-1 text-white/70 hover:bg-white/10" aria-label="Copy trace">
          <Copy className="h-4 w-4" />
        </button>
        <button onClick={download} className="rounded-md p-1 text-white/70 hover:bg-white/10" aria-label="Download trace as JSON">
          <Download className="h-4 w-4" />
        </button>
        <button onClick={() => setErr(null)} className="rounded-md p-1 text-white/70 hover:bg-white/10" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="max-h-[52vh] overflow-auto p-3 text-[11px] leading-relaxed">
          <div className="grid grid-cols-[80px,1fr] gap-x-2 gap-y-1">
            <span className="font-black text-white/50">Screen</span><span className="break-all text-cyan-200">{err.screen}</span>
            <span className="font-black text-white/50">Action</span><span className="text-amber-200">{err.action}</span>
            <span className="font-black text-white/50">Message</span><span className="text-rose-200">{err.message}</span>
            {err.code && (<><span className="font-black text-white/50">Code</span><span className="text-white/80">{err.code}</span></>)}
            {err.details && (<><span className="font-black text-white/50">Details</span><span className="text-white/70">{err.details}</span></>)}
            {err.hint && (<><span className="font-black text-white/50">Hint</span><span className="text-emerald-200">{err.hint}</span></>)}
          </div>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-white/10 bg-black/60 p-2 text-[10.5px] text-white/70">
{err.stack || "(no stack captured)"}
          </pre>
        </div>
      )}
    </div>
  );
}
