/**
 * Derives Big/Small, Odd/Even and hot-number distribution from history.
 */
import type { GameResult, Stats } from "./types";

export const computeStats = (results: GameResult[], bigThreshold = 5): Stats => {
  const distribution: Record<string, number> = {};
  let big = 0, small = 0, odd = 0, even = 0;
  for (const r of results) {
    const k = String(r.headline);
    distribution[k] = (distribution[k] || 0) + 1;
    if (r.headline >= bigThreshold) big++; else small++;
    if (r.headline % 2 === 0) even++; else odd++;
  }
  return {
    total: results.length,
    big, small, odd, even,
    distribution,
    recent: results.slice(0, 30).map((r) => r.headline),
  };
};
