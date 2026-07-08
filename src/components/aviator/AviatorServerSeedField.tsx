import { Loader2, Lock } from "lucide-react";
import { useIsSuperAdmin } from "@/hooks/useIsSuperAdmin";
import { selectAviatorRoundsWithServerSeed } from "@/lib/aviatorQuery";
import { useEffect, useRef, useState } from "react";

interface Props {
  roundId?: string | null;
  label?: string;
  retryBaseMs?: number;
  retryMaxMs?: number;
  retryMaxAttempts?: number;
  retryJitterPct?: number;
  onRetryAttempt?: (attempt: number, delayMs: number) => void;
  onRetrySchedule?: (attempt: number, delayMs: number, retryTime: number) => void;
  onRetrySuccess?: () => void;
  onRetryLimitReached?: () => void;
}

export function AviatorServerSeedField({
  roundId,
  label = "Server Seed",
  retryBaseMs = 500,
  retryMaxMs = 30_000,
  retryMaxAttempts = Infinity,
  retryJitterPct = 0,
  onRetryAttempt,
  onRetrySchedule,
  onRetrySuccess,
  onRetryLimitReached,
}: Props) {
  const { isSuperAdmin, isLoading: roleLoading } = useIsSuperAdmin();
  const [seed, setSeed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [waitingRetry, setWaitingRetry] = useState(false);
  const attemptsRef = useRef(0);
  const limitFiredRef = useRef(false);

  useEffect(() => {
    if (roleLoading || !isSuperAdmin) return;
    if (!roundId) {
      setSeed(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const { data, error: qErr } = await selectAviatorRoundsWithServerSeed([roundId]);
        if (cancelled) return;
        if (qErr) {
          setSeed(null);
          setError("Unable to load server seed.");
        } else {
          const row = (data as Array<{ server_seed: string | null }> | null)?.[0];
          setSeed(row?.server_seed ?? null);
          if (attemptsRef.current > 0) onRetrySuccess?.();
          attemptsRef.current = 0;
          limitFiredRef.current = false;
          setAttempts(0);
        }
      } catch {
        if (cancelled) return;
        setSeed(null);
        setError("Unable to load server seed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [roundId, isSuperAdmin, roleLoading, reloadKey]);

  useEffect(() => {
    if (error && attempts >= retryMaxAttempts && Number.isFinite(retryMaxAttempts) && !limitFiredRef.current) {
      limitFiredRef.current = true;
      onRetryLimitReached?.();
    }
  }, [error, attempts, retryMaxAttempts, onRetryLimitReached]);

  if (roleLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />Checking permissions…
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span><span className="font-medium">{label}:</span> Hidden — visible to super admins only.</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">
        {loading ? "Loading…" : error ? error : seed ?? "Not yet revealed"}
      </div>
      {error && !loading && (
        attempts >= retryMaxAttempts ? (
          <span className="text-xs text-muted-foreground">Retry limit reached.</span>
        ) : (
        <button type="button" disabled={waitingRetry} onClick={() => {
            const base = Math.min(retryBaseMs * 2 ** attempts, retryMaxMs);
            const jitter = retryJitterPct > 0 ? base * retryJitterPct * (Math.random() * 2 - 1) : 0;
            const delay = Math.max(0, Math.min(base + jitter, retryMaxMs));
            const retryTime = Date.now() + delay;
            const nextAttempt = attemptsRef.current + 1;
            onRetrySchedule?.(nextAttempt, delay, retryTime);
            setWaitingRetry(true);
            setTimeout(() => {
              setWaitingRetry(false);
              setAttempts((a) => { const next = a + 1; attemptsRef.current = next; onRetryAttempt?.(next, delay); return next; });
              setReloadKey((k) => k + 1);
            }, delay);
          }} className="text-xs font-medium text-primary underline-offset-2 hover:underline disabled:opacity-60">
          {waitingRetry ? "Retrying…" : "Retry"}
        </button>
        )
      )}
    </div>
  );
}

export default AviatorServerSeedField;
