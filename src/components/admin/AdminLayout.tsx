import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Loader2, ShieldAlert, RefreshCw } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";

/**
 * Admin Layout - Root layout for all /admin/* routes
 * Provides auth guard that redirects to /admin/login if not authenticated
 * SECURITY: All authentication is validated server-side via Supabase sessions
 */
const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirectedRef = useRef(false);
  const hasTriedInitRef = useRef(false);

  const { isLoading, isAuthenticated, staffAccount, error, refreshAuth } = useAdminAuth();

  const isPublicAuthPage = 
    location.pathname === "/admin/login" || 
    location.pathname === "/admin/debug";

  useEffect(() => {
    if (isPublicAuthPage) {
      hasRedirectedRef.current = false;
      hasTriedInitRef.current = false;
      return;
    }

    if (isAuthenticated) {
      hasRedirectedRef.current = false;
      hasTriedInitRef.current = false;
      return;
    }

    if (!isLoading && !hasTriedInitRef.current) {
      hasTriedInitRef.current = true;
      refreshAuth();
      return;
    }

    if (!isLoading && !isAuthenticated && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      navigate("/admin/login", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate, isPublicAuthPage, refreshAuth]);

  if (isPublicAuthPage) {
    return <Outlet />;
  }

  if (isLoading) {
    return <AdminVerifyingScreen onRetry={refreshAuth} onCancel={() => navigate("/admin/login", { replace: true })} />;
  }

  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center p-8 max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Authentication Error</h2>
          <p className="text-slate-400 text-sm">{error}</p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={refreshAuth} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
            <Button onClick={() => navigate("/admin/login", { replace: true })}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-slate-400 text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <Outlet context={{ staffAccount }} />;
};

interface AdminVerifyingScreenProps {
  onRetry: () => void;
  onCancel: () => void;
}

const AdminVerifyingScreen = ({ onRetry, onCancel }: AdminVerifyingScreenProps) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 500);
    return () => clearInterval(id);
  }, []);

  const slow = elapsed >= 5;
  const stuck = elapsed >= 12;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6"
    >
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 animate-pulse" />
          <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-white animate-spin" />
        </div>
        <p className="text-slate-200 text-sm font-medium">Verifying admin access…</p>
        <p className="text-slate-400 text-xs">
          {stuck
            ? "This is taking longer than expected. Your connection may be slow or the session may have expired."
            : slow
              ? `Still checking your session (${elapsed}s)…`
              : "Securing your admin session. This usually takes a second."}
        </p>
        {slow && (
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry verification
            </Button>
            {stuck && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Back to login
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLayout;
