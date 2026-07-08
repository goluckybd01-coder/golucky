import { supabase } from "@/integrations/supabase/client";

let checked = false;

export async function verifySuperAdminIntegrity() {
  if (checked) return;
  checked = true;
  try {
    const { data, error } = await supabase.rpc("verify_super_admin_integrity" as any);
    if (error) {
      console.warn("[SuperAdmin Check] skipped:", error.message);
      return;
    }
    const r = data as any;
    if (r?.ok) {
      console.info("[SuperAdmin Check] ✅ GLU-0000001000 present, triggers active");
    } else {
      console.error("[SuperAdmin Check] ❌ integrity issue", r);
    }
  } catch (e) {
    console.warn("[SuperAdmin Check] error", e);
  }
}
