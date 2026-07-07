import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Gamepad2, ShieldAlert } from "lucide-react";
import { GAME_ADMIN_ALLOWED_ROLES } from "@/lib/staffRoles";

interface GameAdminGuardProps {
  children: React.ReactNode;
}

const GameAdminGuard = ({ children }: GameAdminGuardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      const [{ data: roles }, { data: staff }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase
          .from("staff_accounts")
          .select("staff_role,is_active")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle(),
      ]);

      const hasRole = roles?.some((r) =>
        (GAME_ADMIN_ALLOWED_ROLES as readonly string[]).includes(r.role as string),
      );
      const isStaff = !!staff;

      setHasAccess(hasRole || isStaff);
    } catch (error) {
      console.error("Error in GameAdminGuard:", error);
      setHasAccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Gamepad2 className="h-8 w-8 text-white" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-purple-400 mx-auto" />
          <p className="text-gray-400 mt-2">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">
            You don't have permission to access the Game Admin Panel. Please
            contact a Super Admin to request access.
          </p>
          <a
            href="/game-admin/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            <Gamepad2 className="h-5 w-5 mr-2" />
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default GameAdminGuard;
