import { useEffect, useState } from "react";
import { Loader2, Check, X, MessageSquare, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Row {
  id: string;
  user_id: string;
  application_id: string | null;
  amount_usdt: number;
  network: string;
  wallet_address_used: string;
  txid: string;
  screenshot_url: string | null;
  status: "pending" | "approved" | "rejected" | "more_info";
  admin_note: string | null;
  ip_address: string | null;
  device_info: string | null;
  created_at: string;
  reviewed_at: string | null;
  applicant_name?: string | null;
  applicant_phone?: string | null;
  display_user_id?: string | null;
}

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "more_info";

export default function AgentPaymentSubmissions() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | "more_info" | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("agent_application_payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (status !== "all") q = q.eq("status", status);
    const { data, error } = await q;
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const payments = (data as Row[]) || [];

    // Fetch related profile info
    const userIds = Array.from(new Set(payments.map((r) => r.user_id)));
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, username, phone, display_user_id")
        .in("user_id", userIds);
      const map = new Map(
        (profs || []).map((p) => [p.user_id, p])
      );
      payments.forEach((r) => {
        const p = map.get(r.user_id);
        r.applicant_name = p?.username ?? null;
        r.applicant_phone = p?.phone ?? null;
        r.display_user_id = p?.display_user_id ?? null;
      });
    }
    setRows(payments);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.txid.toLowerCase().includes(s) ||
      (r.applicant_name || "").toLowerCase().includes(s) ||
      (r.applicant_phone || "").toLowerCase().includes(s) ||
      (r.display_user_id || "").toLowerCase().includes(s)
    );
  });

  const openReview = async (row: Row, act: "approve" | "reject" | "more_info") => {
    setSelected(row);
    setAction(act);
    setNote(row.admin_note || "");
    if (row.screenshot_url) {
      const { data } = await supabase.storage
        .from("agent-payment-proofs")
        .createSignedUrl(row.screenshot_url, 600);
      setScreenshotUrl(data?.signedUrl ?? null);
    } else {
      setScreenshotUrl(null);
    }
  };

  const submitReview = async () => {
    if (!selected || !action) return;
    if ((action === "reject" || action === "more_info") && !note.trim()) {
      toast.error("Please add a note for the applicant");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("agent-payment-review", {
      body: { payment_id: selected.id, action, note: note.trim() || null },
    });
    setBusy(false);
    if (error) {
      const msg = (data as { error?: string })?.error || error.message;
      toast.error(msg);
      return;
    }
    toast.success(`Payment ${action.replace("_", " ")}d`);
    setSelected(null);
    setAction(null);
    setNote("");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name, phone, User ID, TXID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-1 rounded-lg border p-1">
          {(["pending", "more_info", "approved", "rejected", "all"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded px-3 py-1 text-xs font-medium capitalize ${
                status === s ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border py-12 text-center text-sm text-muted-foreground">
          No submissions found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Applicant</th>
                <th className="p-3 text-left">User ID</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">TXID</th>
                <th className="p-3 text-left">Time</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.applicant_name || "—"}</td>
                  <td className="p-3 font-mono text-xs">{r.display_user_id || r.user_id.slice(0, 8)}</td>
                  <td className="p-3">{r.applicant_phone || "—"}</td>
                  <td className="p-3">{Number(r.amount_usdt).toFixed(2)} USDT</td>
                  <td className="p-3 max-w-[180px] truncate font-mono text-xs">{r.txid}</td>
                  <td className="p-3 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <IconBtn onClick={() => openReview(r, "approve")} title="Approve" tone="ok">
                        <Check className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn onClick={() => openReview(r, "reject")} title="Reject" tone="danger">
                        <X className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn onClick={() => openReview(r, "more_info")} title="Request info">
                        <MessageSquare className="h-4 w-4" />
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {action === "approve" && "Approve Payment"}
              {action === "reject" && "Reject Payment"}
              {action === "more_info" && "Request More Information"}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <Info label="Applicant" value={selected.applicant_name || "—"} />
              <Info label="Phone" value={selected.applicant_phone || "—"} />
              <Info label="Amount" value={`${Number(selected.amount_usdt).toFixed(2)} USDT`} />
              <Info label="TXID" value={selected.txid} mono />
              <Info label="Wallet Used" value={selected.wallet_address_used} mono />
              <Info label="IP" value={selected.ip_address || "—"} />
              {screenshotUrl && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Screenshot
                  </p>
                  <a href={screenshotUrl} target="_blank" rel="noreferrer" className="inline-block">
                    <img
                      src={screenshotUrl}
                      alt="Payment proof"
                      className="max-h-56 rounded border"
                    />
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
                      <Eye className="h-3 w-3" /> Open full size
                    </span>
                  </a>
                </div>
              )}
              <Textarea
                rows={3}
                placeholder={
                  action === "approve"
                    ? "Optional note"
                    : "Reason / instructions for the applicant"
                }
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button onClick={submitReview} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: Row["status"] }) {
  const map: Record<Row["status"], string> = {
    pending: "bg-amber-500/10 text-amber-500",
    approved: "bg-emerald-500/10 text-emerald-500",
    rejected: "bg-red-500/10 text-red-500",
    more_info: "bg-blue-500/10 text-blue-500",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${map[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  tone?: "ok" | "danger";
}) {
  const t =
    tone === "ok"
      ? "text-emerald-500 hover:bg-emerald-500/10"
      : tone === "danger"
      ? "text-red-500 hover:bg-red-500/10"
      : "hover:bg-accent";
  return (
    <button
      title={title}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded ${t}`}
    >
      {children}
    </button>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={`text-right ${mono ? "break-all font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
