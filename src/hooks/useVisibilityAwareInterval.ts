import { useEffect, useRef } from "react";

/**
 * setInterval that auto-pauses when the tab is hidden and resumes on visible.
 * Prevents needless polling (e.g. 60s stats strips) while the app is
 * backgrounded, saving battery on mobile.
 */
export function useVisibilityAwareInterval(
  callback: () => void,
  delayMs: number | null,
) {
  const savedRef = useRef(callback);
  useEffect(() => {
    savedRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;
    let id: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (id !== null) return;
      id = setInterval(() => savedRef.current(), delayMs);
    };
    const stop = () => {
      if (id !== null) {
        clearInterval(id);
        id = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [delayMs]);
}

export default useVisibilityAwareInterval;
