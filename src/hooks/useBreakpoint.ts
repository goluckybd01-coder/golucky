import { useEffect, useState } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop";

function compute(): Breakpoint {
  if (typeof window === "undefined") return "mobile";
  const w = window.innerWidth;
  if (w >= 1024) return "desktop";
  if (w >= 768) return "tablet";
  return "mobile";
}

/**
 * Returns the current breakpoint, reacting to window resize.
 * UI-only — does not touch any data hooks.
 */
export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => compute());
  useEffect(() => {
    const onResize = () => setBp(compute());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return bp;
}

export const useIsDesktop = () => useBreakpoint() === "desktop";
