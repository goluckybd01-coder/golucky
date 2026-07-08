import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns whether the current authenticated user is a `super_admin`
 * staff account. `isLoading` is true until the role check resolves.
 */
export function useIsSuperAdmin() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes.user?.id;
        if (!userId) {
          if (!cancelled) {
            setIsSuperAdmin(false);
            setIsLoading(false);
          }
          return;
        }
        const { data } = await supabase
          .from("staff_accounts")
          .select("staff_role,is_active")
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle();
        if (!cancelled) {
          setIsSuperAdmin(data?.staff_role === "super_admin");
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsSuperAdmin(false);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isSuperAdmin, isLoading };
}
