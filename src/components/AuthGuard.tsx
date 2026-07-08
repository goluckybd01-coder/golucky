import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import HomeSkeleton from "./HomeSkeleton";

interface AuthGuardProps {
  children: React.ReactNode;
}

// Demo mode has been removed for security. Kept as a no-op so legacy callers
// that import `useDemoMode` keep compiling; it always returns false.
export const useDemoMode = () => false;


const AuthGuard = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const didFinishInitialCheckRef = useRef(false);

  useEffect(() => {
    let timeoutId: number | undefined;
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        setUser(session?.user ?? null);

        // Safety: if we receive ANY auth event, we should not stay stuck in a loading state
        if (!didFinishInitialCheckRef.current) {
          didFinishInitialCheckRef.current = true;
          setIsChecking(false);
        }
        
        // Handle auth state changes
        if (event === "SIGNED_OUT") {
          navigate("/login", { replace: true });
        }
      }
    );

    // Then validate initial session with the auth server.
    // getSession can return a locally cached/expired token, so use getUser for trusted auth state.
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (!session) {
          setUser(null);
          return;
        }

        const { data: { user: verifiedUser }, error } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (error || !verifiedUser) {
          console.warn("[AuthGuard] Cached session is invalid; signing out locally.", error?.message);
          setUser(null);
          await supabase.auth.signOut({ scope: "local" });
          return;
        }

        setUser(verifiedUser);
      } catch (err) {
        console.error("[AuthGuard] getSession failed:", err);
        if (!isMounted) return;
        setUser(null);
      } finally {
        if (!isMounted) return;
        didFinishInitialCheckRef.current = true;
        setIsChecking(false);
      }
    };

    // Absolute safety fallback: never let the whole app stay on "Loading..." forever.
    timeoutId = window.setTimeout(() => {
      if (!isMounted) return;
      if (!didFinishInitialCheckRef.current) {
        console.warn("[AuthGuard] Session check timeout — continuing without blocking UI.");
        didFinishInitialCheckRef.current = true;
        setIsChecking(false);
      }
    }, 4000);

    getInitialSession();

    return () => {
      isMounted = false;
      if (timeoutId) window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [navigate]);

  const e2eBypass =
    import.meta.env.DEV &&
    import.meta.env.VITE_E2E_AUTH_BYPASS === "1" &&
    new URLSearchParams(location.search).get("e2e") === "1";

  const previewBypass =
    new URLSearchParams(location.search).get("preview") === "1" &&
    (location.pathname === "/home" || location.pathname === "/");

  useEffect(() => {
    if (isChecking) return;
    const currentPath = location.pathname;
    const isLoggedIn = !!user || e2eBypass;
    const publicRoutes = ["/login", "/register", "/forgot-password", "/install"];
    const isPublicRoute = publicRoutes.includes(currentPath) || currentPath.startsWith("/__preview/");
    const isAdminRoute = currentPath.startsWith("/admin");
    const isWelcomeRoute = currentPath === "/welcome";
    const protectedRoutes = ["/home", "/activity", "/promotion", "/wallet", "/account"];
    const isProtectedRoute = protectedRoutes.includes(currentPath) || 
      currentPath.startsWith("/game/") || 
      currentPath.startsWith("/engine/") ||
      currentPath === "/wingo" ||
      currentPath === "/k3" ||
      currentPath === "/deposit" ||
      currentPath === "/withdraw" ||
      currentPath.startsWith("/withdraw/") ||
      currentPath === "/lottery" ||
      currentPath === "/popular" ||
      currentPath === "/games" ||
      currentPath === "/sports" ||
      currentPath === "/sports-betting" ||
      currentPath === "/leaderboard" ||
      currentPath === "/vip" ||
      currentPath === "/gifts" ||
      currentPath === "/achievements" ||
      currentPath === "/challenges" ||
      currentPath === "/cashback" ||
      currentPath === "/notifications" ||
      currentPath === "/settings" ||
      currentPath === "/personal-information" ||
      currentPath === "/game-history" ||
      currentPath === "/game-stats" ||
      currentPath === "/ai-predictions" ||
      currentPath === "/ai-chat" ||
      currentPath === "/agent" ||
      currentPath.startsWith("/agent/") ||
      currentPath === "/invitation-bonus" ||
      currentPath === "/activity-award" ||
      currentPath === "/betting-rebate" ||
      currentPath === "/about" ||
      currentPath === "/announcement" ||
      currentPath === "/support" ||
      currentPath.startsWith("/support/") ||
      currentPath === "/feedback" ||
      currentPath.startsWith("/games/") ||
      currentPath.startsWith("/game-admin");

    if (currentPath === "/") {
      if (previewBypass) {
        navigate("/home?preview=1", { replace: true });
        return;
      }
      if (!isLoggedIn) {
        navigate("/login", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
      return;
    }

    if (isAdminRoute) return;

    const isLoggedInOrPreview = isLoggedIn || previewBypass;

    if (!isLoggedInOrPreview && (isProtectedRoute || isWelcomeRoute)) {
      navigate("/login", { replace: true });
      return;
    }

    if (isLoggedIn && isPublicRoute) {
      const t = window.setTimeout(() => navigate("/home", { replace: true }), 100);
      return () => window.clearTimeout(t);
    }

  }, [location.pathname, location.search, navigate, user, isChecking, e2eBypass, previewBypass]);

  if (isChecking) {
    return <HomeSkeleton />;
  }

  return <>{children}</>;
};

export default AuthGuard;
