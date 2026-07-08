import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ShieldCheck, Search, Download, RefreshCw, Eye, Trash2, CheckCircle2,
  XCircle, RotateCw, AlertTriangle, Clock,
} from "lucide-react";

type Kyc = {
  id: string;
  user_id: string;
  full_name: string;
  document_type: string;
  document_number: string;
  document_front_url: string | null;
  document_back_url: string | null;
  selfie_url: string | null;
  status: string;
  risk_score: number;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
};

const toCSV = (rows: any[]) => {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
};
const download = (name: string, csv: string) => {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};

const statusColor = (s: string) => s === "approved" ? "default"
  : s === "rejected" ? "destructive" : s === "resubmit" ? "outline" : "secondary";

export default function KycAdmin() {
  const [rows, setRows] = useState<Kyc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [docFilter, setDocFilter] = useState("all");
  const [viewing, setViewing] = useState<Kyc | null>(null);
  const [reviewing, setReviewing] = useState<Kyc | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected" | "resubmit">("approved");
  const [reason, setReason] = useState("");
  const [risk, setRisk] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("kyc_submissions")
      .select("*")
      .order("submitted_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (docFilter !== "all" && r.document_type !== docFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!r.full_name.toLowerCase().includes(s) &&
          !r.document_number.toLowerCase().includes(s) &&
          !r.user_id.toLowerCase().includes(s)) return false;
    }
    return true;
  }), [rows, search, statusFilter, docFilter]);

  const stats = useMemo(() => ({
    total: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
    approved: rows.filter((r) => r.status === "approved").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
    highRisk: rows.filter((r) => r.risk_score >= 60).length,
  }), [rows]);

  const openReview = (r: Kyc, d: "approved" | "rejected" | "resubmit") => {
    setReviewing(r); setDecision(d);
    setReason(r.rejection_reason ?? "");
    setRisk(r.risk_score ?? 0);
  };
  const submitReview = async () => {
    if (!reviewing) return;
    const { error } = await supabase.rpc("admin_review_kyc" as any, {
      p_id: reviewing.id,
      p_status: decision,
      p_rejection_reason: decision === "rejected" ? (reason || null) : null,
      p_risk_score: risk,
    });
    if (error) return toast.error(error.message);
    toast.success(`KYC ${decision}`);
    setReviewing(null); setReason(""); load();
  };
  const del = async () => {
    if (!deleteId) return;
    const { error } = await supabase.rpc("admin_delete_kyc" as any, { p_id: deleteId });
    if (error) return toast.error(error.message);
    toast.success("Deleted"); setDeleteId(null); load();
  };

  const cards = [
    { label: "Total", value: stats.total, icon: ShieldCheck, tint: "from-blue-500/20 to-indigo-500/5" },
    { label: "Pending", value: stats.pending, icon: Clock, tint: "from-amber-500/20 to-yellow-500/5" },
    { label: "Approved", value: stats.approved, icon: CheckCircle2, tint: "from-emerald-500/20 to-teal-500/5" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, tint: "from-rose-500/20 to-red-500/5" },
    { label: "High Risk", value: stats.highRisk, icon: AlertTriangle, tint: "from-fuchsia-500/20 to-purple-500/5" },
  ];

  return (
    <AdminShell title="KYC Review" description="Review, approve, reject and manage identity verifications">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {cards.map((c) => (
          <Card key={c.label} className={`bg-gradient-to-br ${c.tint} border-border/50`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{c.label}</span>
                <c.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold tabular-nums">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search name / doc / user…" value={search}
              onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["all","pending","approved","rejected","resubmit"].map((s) =>
                <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={docFilter} onValueChange={setDocFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["all","nid","passport","driver_license"].map((s) =>
                <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => download("kyc.csv", toCSV(filtered))}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr className="text-left">
                <th className="p-3">Submitted</th>
                <th className="p-3">User</th>
                <th className="p-3">Name</th>
                <th className="p-3">Document</th>
                <th className="p-3">Risk</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No submissions</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 text-xs">{new Date(r.submitted_at).toLocaleString()}</td>
                  <td className="p-3 font-mono text-xs">{r.user_id.slice(0, 8)}…</td>
                  <td className="p-3 font-medium">{r.full_name}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="mr-1">{r.document_type}</Badge>
                    <span className="font-mono text-xs">{r.document_number}</span>
                  </td>
                  <td className="p-3">
                    <span className={r.risk_score >= 60 ? "text-destructive font-semibold" : ""}>
                      {r.risk_score}
                    </span>
                  </td>
                  <td className="p-3"><Badge variant={statusColor(r.status) as any}>{r.status}</Badge></td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon" onClick={() => setViewing(r)} title="View">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openReview(r, "approved")} title="Approve">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openReview(r, "rejected")} title="Reject">
                      <XCircle className="h-4 w-4 text-destructive" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openReview(r, "resubmit")} title="Ask resubmit">
                      <RotateCw className="h-4 w-4 text-amber-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)} title="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{viewing?.full_name}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">User:</span> <span className="font-mono">{viewing.user_id}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={statusColor(viewing.status) as any}>{viewing.status}</Badge></div>
                <div><span className="text-muted-foreground">Doc:</span> {viewing.document_type} — {viewing.document_number}</div>
                <div><span className="text-muted-foreground">Risk:</span> {viewing.risk_score}</div>
                <div><span className="text-muted-foreground">Submitted:</span> {new Date(viewing.submitted_at).toLocaleString()}</div>
                <div><span className="text-muted-foreground">Reviewed:</span> {viewing.reviewed_at ? new Date(viewing.reviewed_at).toLocaleString() : "—"}</div>
                {viewing.rejection_reason && (
                  <div className="col-span-2"><span className="text-muted-foreground">Reason:</span> {viewing.rejection_reason}</div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Front", url: viewing.document_front_url },
                  { label: "Back", url: viewing.document_back_url },
                  { label: "Selfie", url: viewing.selfie_url },
                ].map((d) => (
                  <div key={d.label}>
                    <div className="text-xs text-muted-foreground mb-1">{d.label}</div>
                    {d.url ? (
                      <a href={d.url} target="_blank" rel="noreferrer">
                        <img src={d.url} alt={d.label} className="w-full h-40 object-cover rounded border" />
                      </a>
                    ) : (
                      <div className="w-full h-40 rounded border bg-muted/30 grid place-items-center text-xs text-muted-foreground">
                        Not provided
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => openReview(viewing, "resubmit")}>
                  <RotateCw className="h-4 w-4 mr-1" /> Resubmit
                </Button>
                <Button variant="destructive" onClick={() => openReview(viewing, "rejected")}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button onClick={() => openReview(viewing, "approved")}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decision === "approved" ? "Approve" : decision === "rejected" ? "Reject" : "Request Resubmission"} — {reviewing?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Risk Score (0-100)</Label>
              <Input type="number" min={0} max={100} value={risk}
                onChange={(e) => setRisk(Math.max(0, Math.min(100, Number(e.target.value))))} />
            </div>
            {decision !== "approved" && (
              <div>
                <Label>{decision === "rejected" ? "Rejection Reason" : "Instructions"}</Label>
                <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder={decision === "rejected" ? "e.g. Document blurry, mismatch…" : "What should the user resubmit?"} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewing(null)}>Cancel</Button>
            <Button onClick={submitReview}
              variant={decision === "rejected" ? "destructive" : "default"}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete KYC submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the record. The user can submit a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={del}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
