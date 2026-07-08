import { useEffect, useState } from "react";

export type WingoResultBanner = {
  number: number;
  color: string;
  bigSmall: string;
};

export const WINGO_BANNER_DURATION_MS = 3000;
export const WINGO_RESULT_EVENT = "WINGO_RESULT_ANNOUNCE";

/**
 * Listens for WINGO_RESULT_ANNOUNCE custom events and exposes the current
 * banner state. The banner auto-hides after WINGO_BANNER_DURATION_MS.
 * If a new event arrives before the timer elapses, the previous timer is
 * cleared so the new banner gets its own full duration.
 */
export function useWingoResultBanner() {
  const [banner, setBanner] = useState<WingoResultBanner | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      setBanner({
        number: detail.number,
        color: detail.color,
        bigSmall: detail.bigSmall,
      });
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(
        () => setBanner(null),
        WINGO_BANNER_DURATION_MS
      );
    };
    window.addEventListener(WINGO_RESULT_EVENT, handler);
    return () => {
      window.removeEventListener(WINGO_RESULT_EVENT, handler);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return banner;
}
