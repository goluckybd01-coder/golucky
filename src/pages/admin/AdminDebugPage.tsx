import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { STAFF_ROLES, isStaffRole } from "@/lib/staffRoles";

interface DebugInfo {
  config: {
    supabaseUrlLast10: string;
    anonKeyLast10: string;
  };
  session: {
    exists: boolean;
    userId: string | null;
    email: string | null;
    role: string | null;
    statusMessage: string;
  };
  staffAccount: {
    foundByUserId: boolean;
    foundByEmail: boolean;
    isActive: boolean | null;
    role: string | null;
    userId: string | null;
    rowData: any;
    matchMethod: "user_id" | "email" | null;
  };
  otpSession: {
    exists: boolean;
    isVerified: boolean;
    expiresAt: string | null;
    adminRouteAllowed: boolean;
  };
  errors: string[];
}

const AdminDebugPage = () => {
  const navigate = useNavigate();
  const [debug, setDebug] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDebugInfo = async () => {
    setLoading(true);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

    const info: DebugInfo = {
      config: {
        supabaseUrlLast10: supabaseUrl.slice(-10) || "NOT SET",
        anonKeyLast10: anonKey.slice(-10) || "NOT SET",
      },
      session: {
        exists: false,
        userId: null,
        email: null,
        role: null,
        statusMessage: "Checking...",
      },
      staffAccount: {
        foundByUserId: false,
        foundByEmail: false,
        isActive: null,
        role: null,
        userId: null,
        rowData: null,
        matchMethod: null,
      },
      otpSession: {
        exists: false,
        isVerified: false,
        expiresAt: null,
        adminRouteAllowed: false,
      },
      errors: [],
    };

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        info.errors.push(`Session Error: ${sessionError.message}`);
        info.session.statusMessage = `Error: ${sessionError.message}`;
      } else if (!session) {
        info.session.statusMessage = "No active session - Please login first";
      } else {
        info.session.exists = true;
        info.session.userId = session.user.id;
        info.session.email = session.user.email || null;
        info.session.role = session.user.role || null;
        info.session.statusMessage = "Authenticated";

        const { data: staffByUserId, error: staffError1 } = await supabase
          .from("staff_accounts")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (staffError1) {
          info.errors.push(`Staff lookup (user_id) Error: ${staffError1.message}`);
        } else if (staffByUserId) {
          info.staffAccount.foundByUserId = true;
          info.staffAccount.isActive = staffByUserId.is_active;
          info.staffAccount.role = staffByUserId.staff_role;
          info.staffAccount.userId = staffByUserId.user_id;
          info.staffAccount.rowData = staffByUserId;
          info.staffAccount.matchMethod = "user_id";
        }

        if (!info.staffAccount.foundByUserId && session.user.email) {
          const { data: staffByEmail, error: staffError2 } = await supabase
            .from("staff_accounts")
            .select("*")
            .eq("email", session.user.email.toLowerCase())
            .maybeSingle();

          if (staffError2) {
            info.errors.push(`Staff lookup (email) Error: ${staffError2.message}`);
          } else if (staffByEmail) {
            info.staffAccount.foundByEmail = true;
            info.staffAccount.isActive = staffByEmail.is_active;
            info.staffAccount.role = staffByEmail.staff_role;
            info.staffAccount.userId = staffByEmail.user_id;
            info.staffAccount.rowData = staffByEmail;
            info.staffAccount.matchMethod = "email";
          }
        }

        const { data: otpCheck, error: otpError } = await supabase.functions.invoke(
          "admin-check-otp",
        );

        if (otpError) {
          info.errors.push(`OTP check Error: ${otpError.message}`);
        } else if (otpCheck) {
          info.otpSession.exists = otpCheck.valid;
          info.otpSession.isVerified = otpCheck.valid;
          info.otpSession.expiresAt = otpCheck.expires_at || null;
          info.otpSession.adminRouteAllowed = otpCheck.valid;
        }
      }
    } catch (err: any) {
      info.errors.push(`Exception: ${err.message}`);
    }

    setDebug(info);
    setLoading(false);
  };

  // NOTE: staff_accounts mutation actions (upsert / toggle is_active) were
  // removed from this diagnostics page — they were a client-side privilege
  // escalation vector.

  const handleSignOut = async () => {
    setActionLoading("signout");
    try {
      await supabase.auth.signOut();
    } catch (err: any) {
      console.error("Sign out error:", err);
    }

    localStorage.removeItem("admin_staff_role");
    localStorage.removeItem("admin_staff_name");
    localStorage.removeItem("admin_super_verified");
    localStorage.removeItem("admin_auth");
    localStorage.removeItem("admin_otp_session_id");
    localStorage.removeItem("pending_admin_otp");
    localStorage.removeItem("pending_admin_email");
    sessionStorage.clear();

    toast.success("Signed out successfully");
    await fetchDebugInfo();
    setActionLoading(null);
  };

  const handleForceLogout = () => {
    try {
      supabase.auth.signOut();
    } catch (err) {
      console.error("Force logout supabase error:", err);
    }
    localStorage.clear();
    sessionStorage.clear();
    toast.success("Force logout - redirecting...");
    window.location.href = "/admin/login";
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const StatusIcon = ({ success }: { success: boolean | null }) => {
    if (success === null) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-300">DEV-only diagnostics</p>
            <p className="text-amber-200/80">
              This page is available only in development builds. It is read-only:
              it cannot create, modify, or elevate staff accounts.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Debug Panel</h1>
          <Button onClick={fetchDebugInfo} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {debug && (
          <>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">A) Supabase Config (masked)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">VITE_SUPABASE_URL (last 10):</span>
                  <code className="bg-gray-700 px-3 py-1 rounded">{debug.config.supabaseUrlLast10}</code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">
                    VITE_SUPABASE_ANON_KEY (last 10):
                  </span>
                  <code className="bg-gray-700 px-3 py-1 rounded">{debug.config.anonKeyLast10}</code>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <StatusIcon success={debug.session.exists} />
                  B) Auth Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Session exists:</span>
                  <Badge variant={debug.session.exists ? "default" : "destructive"}>
                    {debug.session.exists ? "true" : "false"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">user.id:</span>
                  <code className="bg-gray-700 px-2 py-1 rounded text-xs max-w-[300px] truncate">
                    {debug.session.userId || "N/A"}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">user.email:</span>
                  <code className="bg-gray-700 px-2 py-1 rounded">{debug.session.email || "N/A"}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={debug.session.exists ? "text-green-400" : "text-yellow-400"}>
                    {debug.session.statusMessage}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <StatusIcon success={debug.staffAccount.foundByUserId || debug.staffAccount.foundByEmail} />
                  C) staff_accounts Check
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Found by user_id:</span>
                  <Badge variant={debug.staffAccount.foundByUserId ? "default" : "secondary"}>
                    {debug.staffAccount.foundByUserId ? "true" : "false"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Found by email:</span>
                  <Badge variant={debug.staffAccount.foundByEmail ? "default" : "secondary"}>
                    {debug.staffAccount.foundByEmail ? "true" : "false"}
                  </Badge>
                </div>

                {(debug.staffAccount.foundByUserId || debug.staffAccount.foundByEmail) && (
                  <div className="border-t border-gray-600 pt-3 mt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">is_active:</span>
                      <Badge variant={debug.staffAccount.isActive ? "default" : "destructive"}>
                        {debug.staffAccount.isActive ? "true" : "false"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">role:</span>
                      <Badge variant="secondary">{debug.staffAccount.role || "N/A"}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <StatusIcon success={debug.session.exists && debug.staffAccount.isActive} />
                  D) Admin Access Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Session Valid:</span>
                  <Badge variant={debug.session.exists ? "default" : "destructive"}>
                    {debug.session.exists ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Staff Account Found:</span>
                  <Badge
                    variant={
                      debug.staffAccount.foundByUserId || debug.staffAccount.foundByEmail
                        ? "default"
                        : "destructive"
                    }
                  >
                    {debug.staffAccount.foundByUserId || debug.staffAccount.foundByEmail ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Account Active:</span>
                  <Badge variant={debug.staffAccount.isActive ? "default" : "destructive"}>
                    {debug.staffAccount.isActive ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Admin Access Allowed:</span>
                  <Badge
                    variant={
                      debug.session.exists &&
                      !!debug.staffAccount.isActive &&
                      isStaffRole(debug.staffAccount.role)
                        ? "default"
                        : "destructive"
                    }
                  >
                    {debug.session.exists &&
                    !!debug.staffAccount.isActive &&
                    isStaffRole(debug.staffAccount.role)
                      ? "Yes"
                      : "No"}
                  </Badge>
                </div>

                {!debug.session.exists && (
                  <div className="bg-yellow-900/30 border border-yellow-600 rounded p-3 mt-2">
                    <p className="text-yellow-300 text-sm">
                      ⚠️ No active session. Please login at /admin/login.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">E) Session Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-gray-400">
                  Staff role mutations are disabled here. Valid staff roles: {STAFF_ROLES.join(", ")}.
                </p>

                <Button
                  onClick={handleSignOut}
                  disabled={!debug.session.exists || actionLoading === "signout"}
                  variant="destructive"
                  className="w-full"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {actionLoading === "signout" ? "Signing out..." : "Sign Out"}
                </Button>

                <Button
                  onClick={handleForceLogout}
                  variant="destructive"
                  className="w-full bg-red-700 hover:bg-red-800"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Force Logout (Clear All & Hard Redirect)
                </Button>
              </CardContent>
            </Card>

            {debug.errors.length > 0 && (
              <Card className="bg-red-900/30 border-red-700">
                <CardHeader>
                  <CardTitle className="text-lg text-red-400">
                    Errors ({debug.errors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {debug.errors.map((err, idx) => (
                    <pre key={idx} className="bg-gray-800 p-2 rounded text-red-300 text-xs overflow-auto">
                      {err}
                    </pre>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/admin/login")} className="flex-1">
            Back to Login
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/dashboard")}
            className="flex-1"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDebugPage;
