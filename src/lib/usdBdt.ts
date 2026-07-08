// Internal-only conversion helpers. Display BDT to user; convert to USD
// silently for trade-open/settle calls. Single source of truth: BDT_PER_USD.
export const BDT_PER_USD = 127;
export const PAYOUT_RATIO = 0.85;
export const MIN_STAKE_BDT = 100;
export const MAX_STAKE_BDT = 50_000;
export const ALLOWED_DURATIONS = [60, 120, 180, 300] as const;
export type TradeDuration = (typeof ALLOWED_DURATIONS)[number];

export const fmtBDT = (n: number, digits = 0) =>
  `৳${(Number(n) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;

export const fmtPrice = (n: number, decimals = 2) => {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return n.toFixed(decimals);
};

export const durationLabel = (s: number) =>
  s >= 60 ? `${s / 60}m` : `${s}s`;

// Window math mirrors server logic so UI countdown stays in sync.
export function currentWindow(durationSec: number, nowMs = Date.now()) {
  const bucket = durationSec * 1000;
  const end = Math.ceil(nowMs / bucket) * bucket;
  const start = end - bucket;
  return { start, end, remaining: Math.max(0, end - nowMs) };
}

export const CLOSE_LOCK_SEC = 10;
