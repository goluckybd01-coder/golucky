import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/reducedMotion";

/**
 * React hook that tracks the user's `prefers-reduced-motion` preference.
 * Returns a boolean that updates if the OS-level preference changes.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => prefersReducedMotion());

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduced(mq.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  return reduced;
}

export default useReducedMotion;
