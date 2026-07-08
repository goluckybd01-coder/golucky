import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- consumers rely on structural error/data shapes
export type InvokeResult = { data: any; error: any };

const TRANSIENT_RE = /abort|timeout|timed out|etimedout|network|failed to fetch/i;

export function isTransientError(err: unknown): boolean {
  if (!err) return false;
  const anyErr = err as { name?: string; message?: string };
  if (anyErr.name === "AbortError") return true;
  if (anyErr.message && TRANSIENT_RE.test(anyErr.message)) return true;
  return false;
}

export interface RetryOptions {
  retries?: number;       // additional attempts after the first (default 2 → up to 3 calls)
  baseDelayMs?: number;   // base delay; doubles each attempt (default 250)
  maxDelayMs?: number;    // cap per-attempt delay (default 4000)
  jitterMs?: number;      // max random jitter added to each delay (default 100)
  onRetry?: (attempt: number, err: unknown) => void;
  // Injectables for tests:
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;  // [0, 1)
}

/** Exponential backoff with full jitter: base * 2^(attempt-1) + random * jitter, capped at max. */
export function computeBackoffDelay(
  attempt: number,
  baseDelayMs = 250,
  maxDelayMs = 4000,
  jitterMs = 100,
  random: () => number = Math.random,
): number {
  const exp = baseDelayMs * Math.pow(2, Math.max(0, attempt - 1));
  const jitter = Math.floor(random() * jitterMs);
  return Math.min(maxDelayMs, exp + jitter);
}

/**
 * Invoke `place-bet` with automatic retry on transient errors
 * (AbortError, network/timeout). Server-side rejections (data.success === false)
 * are NOT retried — they are returned to the caller as-is.
 */
export async function invokePlaceBetWithRetry(
  body: Record<string, unknown>,
  opts: RetryOptions = {},
): Promise<InvokeResult> {
  const retries = opts.retries ?? 2;
  const baseDelayMs = opts.baseDelayMs ?? 250;
  const maxDelayMs = opts.maxDelayMs ?? 4000;
  const jitterMs = opts.jitterMs ?? 100;
  const sleep = opts.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const random = opts.random ?? Math.random;

  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = (await supabase.functions.invoke("place-bet", { body })) as InvokeResult;
      if (res?.error && isTransientError(res.error) && attempt < retries) {
        lastErr = res.error;
        opts.onRetry?.(attempt + 1, res.error);
        await sleep(computeBackoffDelay(attempt + 1, baseDelayMs, maxDelayMs, jitterMs, random));
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (isTransientError(e) && attempt < retries) {
        opts.onRetry?.(attempt + 1, e);
        await sleep(computeBackoffDelay(attempt + 1, baseDelayMs, maxDelayMs, jitterMs, random));
        continue;
      }
      throw e;
    }
  }
  // Exhausted retries on transient error → surface as a normal error result
  return { data: null, error: lastErr ?? { message: "Bet failed" } };
}
