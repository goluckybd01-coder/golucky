/**
 * SafeNavigate Utility
 * Provides a unified navigation method that works with React Router, Next.js, or fallback to window.location
 */

import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

// Type for navigation options
interface NavigateOptions {
  replace?: boolean;
  state?: Record<string, unknown>;
}

/**
 * Hook that returns a safe navigation function
 * Works with React Router, and falls back to window.location if needed
 */
export const useSafeNavigate = () => {
  let reactRouterNavigate: ReturnType<typeof useNavigate> | null = null;
  
  try {
    // Try to use React Router's navigate
    reactRouterNavigate = useNavigate();
  } catch (e) {
    // React Router not available, will use fallback
    console.debug("[SafeNavigate] React Router not available, using fallback");
  }

  const navigate = useCallback((to: string, options?: NavigateOptions) => {
    if (reactRouterNavigate) {
      // Use React Router navigation
      reactRouterNavigate(to, options);
    } else {
      // Fallback to window.location
      if (options?.replace) {
        window.location.replace(to);
      } else {
        window.location.href = to;
      }
    }
  }, [reactRouterNavigate]);

  return navigate;
};

/**
 * Direct navigation function (non-hook version)
 * Use this when you can't use hooks (outside React components)
 */
export const navigateTo = (to: string, replace = false) => {
  if (replace) {
    window.location.replace(to);
  } else {
    window.location.href = to;
  }
};

export default useSafeNavigate;
