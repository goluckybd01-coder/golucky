/** Returns true if the user prefers reduced motion. SSR-safe. */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/** Alias kept for call-sites that prefer the imperative name. */
export const shouldReduceMotion = (): boolean => prefersReducedMotion();

/** Scroll behavior that respects prefers-reduced-motion. */
export const motionScrollBehavior = (): ScrollBehavior =>
  prefersReducedMotion() ? "auto" : "smooth";
