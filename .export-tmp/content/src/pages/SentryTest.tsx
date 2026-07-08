// Dev/QA route to verify Sentry wiring. Visit /__sentry-test to trigger errors.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sentry, isSentryEnabled } from "@/lib/sentry";


type LastEvent = {
  source: "sync" | "async" | "direct";
  eventId: string | null;
  at: string;
};

export default function SentryTest() {
  const enabled = isSentryEnabled();
  const [last, setLast] = useState<LastEvent | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copy = async (key: string, value: string) => {
    const label = key === "url" ? "Sentry event URL" : key === "id" ? "event_id" : key === "at" ? "timestamp" : "note";
    let ok = false;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      document.body.removeChild(ta);
    }
    if (ok) {
      if (key === "url") {
        toast.success("Sentry event URL copied", {
          description: (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="underline break-all text-primary"
            >
              {value}
            </a>
          ),
        });
      } else {
        toast.success(`${label} copied`, { description: value });
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
    } else {
      toast.error(`Could not copy ${label} — copy manually`);
    }
  };

  useEffect(() => {
    if (!enabled) return;
    const client = Sentry.getClient();
    if (!client) return;
    client.addEventProcessor((event) => {
      const source: LastEvent["source"] =
        event.exception?.values?.[0]?.mechanism?.type === "onunhandledrejection"
          ? "async"
          : "sync";
      setLast({
        source,
        eventId: event.event_id ?? null,
        at: new Date().toISOString(),
      });
      return event;
    });
  }, [enabled]);

  const throwSync = () => {
    throw new Error(`Sentry test (sync) @ ${new Date().toISOString()}`);
  };
  const throwAsync = () => {
    void Promise.reject(new Error(`Sentry test (async) @ ${new Date().toISOString()}`));
  };
  const captureDirect = () => {
    const id = Sentry.captureException(
      new Error(`Sentry test (direct capture) @ ${new Date().toISOString()}`),
    );
    setLast({ source: "direct", eventId: id || null, at: new Date().toISOString() });
  };

  const copyBtn = (key: string, value: string) => (
    <button
      type="button"
      onClick={() => copy(key, value)}
      className="font-sans px-2 py-0.5 rounded border border-border text-[11px] hover:bg-muted"
    >
      {copiedKey === key ? "Copied ✓" : "Copy"}
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-border p-6">
        <h1 className="text-xl font-semibold">Sentry Test</h1>
        <p className="text-sm text-muted-foreground">
          Status:{" "}
          <span className={enabled ? "text-green-500" : "text-red-500"}>
            {enabled ? "Sentry initialized ✓" : "Sentry NOT initialized — set VITE_SENTRY_DSN and rebuild"}
          </span>
        </p>
        <div className="grid gap-2">
          <button onClick={throwSync} className="px-4 py-2 rounded bg-destructive text-destructive-foreground">
            Throw sync error
          </button>
          <button onClick={throwAsync} className="px-4 py-2 rounded bg-destructive text-destructive-foreground">
            Trigger unhandled rejection
          </button>
          <button onClick={captureDirect} className="px-4 py-2 rounded bg-primary text-primary-foreground">
            captureException (direct)
          </button>
        </div>
        <div className="rounded border border-border bg-muted/30 p-3 text-xs font-mono space-y-1">
          <div className="mb-1 font-sans text-muted-foreground">Last captured event</div>
          {last ? (
            <>
              <div>source: {last.source}</div>
              <div className="break-all flex items-center gap-2 flex-wrap">
                <span>event_id: {last.eventId ?? "(none)"}</span>
                {last.eventId && copyBtn("id", last.eventId)}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span>at: {last.at}</span>
                {copyBtn("at", last.at)}
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">No events yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
