import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * ScrollRestoration
 *
 * Route-scoped scroll reset. Forces window scroll-to-top ONLY when the app
 * navigates to `/agent` (the Agent programme details page reached from the
 * Section 02 "View All" preview button). Every other route keeps whatever
 * scroll behavior it already had.
 *
 * Skips:
 *  - hash-anchor navigations (`#section-id`) so in-page anchors keep working.
 *  - browser POP navigations (back/forward), so the browser's own scroll
 *    restoration keeps the user where they were.
 *
 * Mount once inside <BrowserRouter>, above <Routes>. Renders nothing.
 */
export function ScrollRestoration() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (pathname !== "/agent") return;
    if (hash) return;
    if (navType === "POP") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash, navType]);

  return null;
}

export default ScrollRestoration;
