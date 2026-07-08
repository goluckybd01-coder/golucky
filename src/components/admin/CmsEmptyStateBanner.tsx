import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ShieldAlert, Copy } from "lucide-react";
import { toast } from "sonner";

/**
 * Admin-only diagnostic banner shown when a CMS page returns zero sections.
 * Probes auth + role + RLS state and exposes copy-paste diagnostics.
 */
type Status = "loading" | "no_session" | "no_role" | "totp_expired" | "unknown_rls" | "ok";

type Diag = {
  status: Status;
  userId?: string;
  email?: string;
  roles: string[];
  staff?: { staff_role?: string | null; totp_enabled?: boolean; is_active?: boolean; totp_age_h?: number | null };
  rlsRowCount?: number | null;
  rlsError?: string | null;
  fetchedAt: string;
};

export default function CmsEmptyStateBanner({
  page,
  onRetry,
}: {
  page: string;
  onRetry: () => void;
}) {
  const [diag, setDiag] = useState<Diag>({ status: "loading", roles: [], fetchedAt: new Date().toISOString() });

  const probe = async () => {
    const fetchedAt = new Date().toISOString();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setDiag({ status: "no_session", roles: [], fetchedAt });

    const { data: roleRows } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id);
    const roles = (roleRows ?? []).map((r) => String(r.role));
    const isAdmin = roles.some((r) => r.includes("admin"));

    let staff: Diag["staff"] | undefined;
    const { data: staffRow } = await supabase
      .from("staff_accounts")
      .select("staff_role, totp_enabled, is_active, totp_last_used_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (staffRow) {
      const last = staffRow.totp_last_used_at ? new Date(staffRow.totp_last_used_at).getTime() : 0;
      staff = {
        staff_role: staffRow.staff_role,
        totp_enabled: !!staffRow.totp_enabled,
        is_active: !!staffRow.is_active,
        totp_age_h: last ? +((Date.now() - last) / 36e5).toFixed(2) : null,
      };
    }

    const { count, error } = await supabase
      .from("admin_page_sections")
      .select("id", { count: "exact", head: true })
      .eq("page_key", page);

    let status: Status = "unknown_rls";
    if (!isAdmin) status = "no_role";
    else if (staff && (staff.totp_age_h == null || staff.totp_age_h > 12 || !staff.totp_enabled || !staff.is_active)) status = "totp_expired";
    else if ((count ?? 0) > 0) status = "ok";

    setDiag({
      status,
      userId: user.id, email: user.email ?? undefined,
      roles, staff,
      rlsRowCount: count ?? 0,
      rlsError: error?.message ?? null,
      fetchedAt,
    });
  };

  useEffect(() => { probe(); /* eslint-disable-next-line */ }, [page]);

  const copyText: Record<Status, { title: string; body: string; action: string }> = {
    loading:      { title: "Checking session…", body: "", action: "Retry" },
    no_session:   { title: "Not signed in", body: "Sign in with an admin account to manage CMS sections.", action: "Reload" },
    no_role:      { title: "Admin role missing", body: "Your account has no admin/super_admin role.", action: "Retry" },
    totp_expired: { title: "TOTP challenge expired", body: "RLS requires a TOTP challenge within the last 12 hours. Re-authenticate, then retry.", action: "Retry after TOTP" },
    unknown_rls:  { title: "Sections blocked by RLS", body: "You appear to have admin access but PostgREST returned zero rows. Likely a policy or GRANT mismatch.", action: "Retry" },
    ok:           { title: "No sections yet", body: "This page has no CMS sections. Click 'Add Section' to create one.", action: "Retry" },
  };
  const c = copyText[diag.status];

  const dump = () => {
    const text = JSON.stringify(diag, null, 2);
    navigator.clipboard.writeText(text);
    toast.success("Diagnostics copied");
  };

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-start gap-3">
        {["totp_expired","no_role","no_session"].includes(diag.status)
          ? <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5" />
          : <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />}
        <div className="flex-1">
          <div className="text-sm font-bold text-amber-200">{c.title}</div>
          {c.body && <p className="text-xs text-amber-100/80 mt-1">{c.body}</p>}
        </div>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono text-amber-100/80 bg-black/30 rounded-lg p-3 border border-amber-500/20">
        <div><dt className="text-amber-300/70 inline">page:</dt> <dd className="inline">{page}</dd></div>
        <div><dt className="text-amber-300/70 inline">fetched:</dt> <dd className="inline">{new Date(diag.fetchedAt).toLocaleTimeString()}</dd></div>
        <div><dt className="text-amber-300/70 inline">user:</dt> <dd className="inline">{diag.email ?? "—"}</dd></div>
        <div className="truncate"><dt className="text-amber-300/70 inline">user_id:</dt> <dd className="inline">{diag.userId ?? "—"}</dd></div>
        <div><dt className="text-amber-300/70 inline">roles:</dt> <dd className="inline">{diag.roles.length ? diag.roles.join(", ") : "none"}</dd></div>
        <div><dt className="text-amber-300/70 inline">staff_role:</dt> <dd className="inline">{diag.staff?.staff_role ?? "—"}</dd></div>
        <div><dt className="text-amber-300/70 inline">totp:</dt> <dd className="inline">{diag.staff ? `${diag.staff.totp_enabled ? "on" : "off"} · ${diag.staff.totp_age_h ?? "n/a"}h ago` : "—"}</dd></div>
        <div><dt className="text-amber-300/70 inline">staff active:</dt> <dd className="inline">{diag.staff ? String(diag.staff.is_active) : "—"}</dd></div>
        <div><dt className="text-amber-300/70 inline">RLS rows:</dt> <dd className="inline">{diag.rlsRowCount ?? "—"}</dd></div>
        <div className="col-span-full"><dt className="text-amber-300/70 inline">RLS error:</dt> <dd className="inline">{diag.rlsError ?? "none"}</dd></div>
      </dl>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-200"
          onClick={async () => { await probe(); onRetry(); }}>
          <RefreshCw className="w-3 h-3 mr-1.5" /> {c.action}
        </Button>
        <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-200" onClick={dump}>
          <Copy className="w-3 h-3 mr-1.5" /> Copy diagnostics
        </Button>
        {diag.status === "no_session" && (
          <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-200"
            onClick={() => (window.location.href = "/admin-login")}>
            Go to admin login
          </Button>
        )}
      </div>
    </div>
  );
}
