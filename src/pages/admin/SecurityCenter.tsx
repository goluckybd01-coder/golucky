import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldCheck, ShieldAlert, AlertTriangle, Search, RefreshCw, Ban, Lock,
  Unlock, CheckCircle2, XCircle, Download, Monitor, Fingerprint,
} from "lucide-react";

type KYC = {
  id: string; user_id: string; full_name: string; document_type: string;
  document_number: string; document_front_url: string | null; document_back_url: string | null;
  selfie_url: string | null; status: string; risk_score: number;
  rejection_reason: string | null; submitted_at: string; reviewed_at: string | null;
};
type Alert = {
  id: string; user_id: string | null; alert_type: string; severity: string;
  details: any; ip_address: string | null; is_resolved: boolean; created_at: string;
};
type Login = {
  id: string; user_id: string | null; email: string | null; ip_address: string | null;
  user_agent: string | null; success: boolean; failure_reason: string | null; created_at: string;
};
type Device = {
  id: string; user_id: string; device_fingerprint: string; device_name: string | null;
  os: string | null; browser: string | null; ip_address: string | null;
  is_trusted: boolean; first_seen_at: string; last_seen_at: string;
};
type Block = {
  id: string; ip_address: string; reason: string | null;
  blocked_until: string | null; created_at: string;
};
type Audit = {
  id: string; action: string; module: string; target_type: string | null;
  target_id: string | null; created_at: string; new_value: any;
};

const fmt = (s: string | null) => (s ? new Date(s).toLocaleString() : "—");

const StatusBadge = ({ s }: { s: string }) => {
  const map: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    rejected: "bg-rose-500/15 text-rose-300 border-rose-500/40",
    resubmit: "bg-blue-500/15 text-blue-300 border-blue-500/40",
  };
  return <Badge variant="outline" className={map[s] ?? ""}>{s}</Badge>;
};

const SeverityBadge = ({ s }: { s: string }) => {
  const map: Record<string, string> = {
    low: "bg-slate-500/15 text-slate-300 border-slate-500/40",
    medium: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    high: "bg-orange-500/15 text-orange-300 border-orange-500/40",
    critical: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  };
  return <Badge variant="outline" className={map[s] ?? ""}>{s}</Badge>;
};

const csv = (rows: Record<string, any>[], name: string) => {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const body = [keys.join(","), ...rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? "")).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
  const a = document.createElement("a"); a.href = url; a.download = `${name}.csv`; a.click();
  URL.revokeObjectURL(url);
};

export default function SecurityCenter() {
  const [tab, setTab] = useState("dashboard");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [kyc, setKyc] = useState<KYC[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [logins, setLogins] = useState<Login[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);

  const [reviewFor, setReviewFor] = useState<KYC | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"approved" | "rejected" | "resubmit">("approved");
  const [reviewReason, setReviewReason] = useState("");
  const [reviewRisk, setReviewRisk] = useState(0);

  const [lockOpen, setLockOpen] = useState(false);
  const [lockEmail, setLockEmail] = useState("");
  const [lockHours, setLockHours] = useState(24);
  const [lockReason, setLockReason] = useState("");

  const [blockOpen, setBlockOpen] = useState(false);
  const [blockIp, setBlockIp] = useState("");
  const [blockHours, setBlockHours] = useState(24);
  const [blockReason, setBlockReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [k, a, l, d, b, au] = await Promise.all([
        supabase.from("kyc_submissions").select("*").order("submitted_at", { ascending: false }).limit(500),
        supabase.from("security_alerts").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("login_history").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("user_devices").select("*").order("last_seen_at", { ascending: false }).limit(500),
        supabase.from("blocked_ips").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("staff_audit_logs").select("id,action,module,target_type,target_id,created_at,new_value")
          .eq("module", "kyc_security").order("created_at", { ascending: false }).limit(300),
      ]);
      if (k.error) throw k.error;
      setKyc((k.data ?? []) as KYC[]);
      setAlerts((a.data ?? []) as Alert[]);
      setLogins((l.data ?? []) as Login[]);
      setDevices((d.data ?? []) as Device[]);
      setBlocks((b.data ?? []) as Block[]);
      setAudit((au.data ?? []) as Audit[]);
    } catch (e: any) {
      toast({ title: "Load failed", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filter = <T,>(rows: T[], keys: (keyof T)[]) => {
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter((r) => keys.some((k) => String((r as any)[k] ?? "").toLowerCase().includes(s)));
  };

  const stats = useMemo(() => {
    const pendingKyc = kyc.filter((r) => r.status === "pending").length;
    const openAlerts = alerts.filter((r) => !r.is_resolved).length;
    const failed24h = logins.filter((r) => !r.success && Date.now() - +new Date(r.created_at) < 86_400_000).length;
    const activeBlocks = blocks.filter((r) => !r.blocked_until || +new Date(r.blocked_until) > Date.now()).length;
    const highRisk = kyc.filter((r) => r.risk_score >= 60).length;
    return { pendingKyc, openAlerts, failed24h, activeBlocks, highRisk };
  }, [kyc, alerts, logins, blocks]);

  const submitReview = async () => {
    if (!reviewFor) return;
    const { error } = await supabase.rpc("admin_review_kyc", {
      p_id: reviewFor.id,
      p_status: reviewDecision,
      p_rejection_reason: reviewReason || null,
      p_risk_score: reviewRisk,
    });
    if (error) return toast({ title: "Review failed", description: error.message, variant: "destructive" });
    toast({ title: `KYC ${reviewDecision}` });
    setReviewFor(null); setReviewReason(""); setReviewRisk(0); load();
  };

  const submitLock = async () => {
    const { error } = await supabase.rpc("admin_lock_account", {
      p_email: lockEmail, p_hours: lockHours, p_reason: lockReason,
    });
    if (error) return toast({ title: "Lock failed", description: error.message, variant: "destructive" });
    toast({ title: "Account locked" });
    setLockOpen(false); setLockEmail(""); setLockReason(""); load();
  };

  const submitBlock = async () => {
    const { error } = await supabase.rpc("admin_block_ip", {
      p_ip: blockIp, p_hours: blockHours, p_reason: blockReason,
    });
    if (error) return toast({ title: "Block failed", description: error.message, variant: "destructive" });
    toast({ title: "IP blocked" });
    setBlockOpen(false); setBlockIp(""); setBlockReason(""); load();
  };

  const resolveAlert = async (id: string) => {
    const { error } = await supabase.rpc("admin_resolve_security_alert", { p_alert_id: id, p_note: null });
    if (error) return toast({ title: "Resolve failed", description: error.message, variant: "destructive" });
    load();
  };

  const unblockEmail = async (email: string) => {
    const { error } = await supabase.rpc("admin_unlock_account", { p_email: email });
    if (error) return toast({ title: "Unlock failed", description: error.message, variant: "destructive" });
    load();
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-100">
      <div className="max-w-[1400px] mx-auto">
        <header className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl grid place-items-center bg-gradient-to-br from-emerald-400/20 to-amber-400/20 border border-emerald-400/30">
              <ShieldCheck className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">KYC &amp; Security</h1>
              <p className="text-sm text-slate-400">Module 15 · Live from database · Audit-logged</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-8 w-64 bg-slate-900 border-slate-800" />
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={loading} className="border-slate-700">
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLockOpen(true)} className="border-amber-700/50 text-amber-300">
              <Lock className="h-4 w-4 mr-1" /> Lock account
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBlockOpen(true)} className="border-rose-700/50 text-rose-300">
              <Ban className="h-4 w-4 mr-1" /> Block IP
            </Button>
          </div>
        </header>

        {/* Dashboard cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { l: "Pending KYC", v: stats.pendingKyc, c: "text-amber-300", i: ShieldAlert },
            { l: "Open alerts", v: stats.openAlerts, c: "text-rose-300", i: AlertTriangle },
            { l: "Failed logins 24h", v: stats.failed24h, c: "text-orange-300", i: XCircle },
            { l: "Active IP blocks", v: stats.activeBlocks, c: "text-blue-300", i: Ban },
            { l: "High-risk KYC", v: stats.highRisk, c: "text-fuchsia-300", i: Fingerprint },
          ].map((s) => (
            <Card key={s.l} className="bg-slate-900/60 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">{s.l}</span>
                  <s.i className={`h-4 w-4 ${s.c}`} />
                </div>
                <div className={`text-3xl font-black tabular-nums mt-1 ${s.c}`}>{s.v}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="dashboard">Overview</TabsTrigger>
            <TabsTrigger value="kyc">KYC Queue</TabsTrigger>
            <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
            <TabsTrigger value="logins">Login History</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="blocks">Blocked IPs</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          {/* KYC */}
          <TabsContent value="kyc">
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">KYC Submissions</CardTitle>
                <Button variant="outline" size="sm" onClick={() => csv(kyc, "kyc_submissions")}>
                  <Download className="h-3 w-3 mr-1" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Submitted</TableHead><TableHead>Full name</TableHead>
                    <TableHead>Doc</TableHead><TableHead>Number</TableHead>
                    <TableHead>Risk</TableHead><TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filter(kyc, ["full_name", "document_number", "status"]).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs text-slate-400">{fmt(r.submitted_at)}</TableCell>
                        <TableCell className="font-medium">{r.full_name}</TableCell>
                        <TableCell className="uppercase text-xs">{r.document_type}</TableCell>
                        <TableCell className="font-mono text-xs">{r.document_number}</TableCell>
                        <TableCell className="tabular-nums">{r.risk_score}</TableCell>
                        <TableCell><StatusBadge s={r.status} /></TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" disabled={r.status !== "pending"}
                            onClick={() => { setReviewFor(r); setReviewRisk(r.risk_score); }}>
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!kyc.length && <TableRow><TableCell colSpan={7} className="text-center text-slate-500 py-6">No submissions yet.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts */}
          <TabsContent value="alerts">
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Security Alerts</CardTitle>
                <Button variant="outline" size="sm" onClick={() => csv(alerts, "security_alerts")}>
                  <Download className="h-3 w-3 mr-1" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>When</TableHead><TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead><TableHead>IP</TableHead>
                    <TableHead>User</TableHead><TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filter(alerts, ["alert_type", "ip_address", "severity"]).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs text-slate-400">{fmt(r.created_at)}</TableCell>
                        <TableCell>{r.alert_type}</TableCell>
                        <TableCell><SeverityBadge s={r.severity} /></TableCell>
                        <TableCell className="font-mono text-xs">{r.ip_address ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{r.user_id?.slice(0, 8) ?? "—"}</TableCell>
                        <TableCell>{r.is_resolved
                          ? <Badge variant="outline" className="text-emerald-300 border-emerald-500/40">resolved</Badge>
                          : <Badge variant="outline" className="text-rose-300 border-rose-500/40">open</Badge>}</TableCell>
                        <TableCell className="text-right">
                          {!r.is_resolved && <Button size="sm" variant="outline" onClick={() => resolveAlert(r.id)}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Resolve
                          </Button>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!alerts.length && <TableRow><TableCell colSpan={7} className="text-center text-slate-500 py-6">No alerts.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logins */}
          <TabsContent value="logins">
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Login History</CardTitle>
                <Button variant="outline" size="sm" onClick={() => csv(logins, "login_history")}>
                  <Download className="h-3 w-3 mr-1" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>When</TableHead><TableHead>Email</TableHead>
                    <TableHead>IP</TableHead><TableHead>Result</TableHead>
                    <TableHead>Reason</TableHead><TableHead>Device</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filter(logins, ["email", "ip_address", "failure_reason"]).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs text-slate-400">{fmt(r.created_at)}</TableCell>
                        <TableCell className="font-mono text-xs">{r.email ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{r.ip_address ?? "—"}</TableCell>
                        <TableCell>{r.success
                          ? <Badge variant="outline" className="text-emerald-300 border-emerald-500/40">ok</Badge>
                          : <Badge variant="outline" className="text-rose-300 border-rose-500/40">fail</Badge>}</TableCell>
                        <TableCell className="text-xs">{r.failure_reason ?? "—"}</TableCell>
                        <TableCell className="text-xs text-slate-400 truncate max-w-[240px]">{r.user_agent ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {!logins.length && <TableRow><TableCell colSpan={6} className="text-center text-slate-500 py-6">No logins recorded yet.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Devices */}
          <TabsContent value="devices">
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base flex items-center gap-2"><Monitor className="h-4 w-4" /> User Devices</CardTitle>
                <Button variant="outline" size="sm" onClick={() => csv(devices, "user_devices")}>
                  <Download className="h-3 w-3 mr-1" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>User</TableHead><TableHead>Device</TableHead>
                    <TableHead>OS / Browser</TableHead><TableHead>IP</TableHead>
                    <TableHead>First seen</TableHead><TableHead>Last seen</TableHead>
                    <TableHead>Trusted</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filter(devices, ["device_fingerprint", "device_name", "ip_address"]).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.user_id.slice(0, 8)}</TableCell>
                        <TableCell className="text-xs">{r.device_name ?? r.device_fingerprint.slice(0, 12)}</TableCell>
                        <TableCell className="text-xs">{[r.os, r.browser].filter(Boolean).join(" · ") || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{r.ip_address ?? "—"}</TableCell>
                        <TableCell className="text-xs text-slate-400">{fmt(r.first_seen_at)}</TableCell>
                        <TableCell className="text-xs text-slate-400">{fmt(r.last_seen_at)}</TableCell>
                        <TableCell>{r.is_trusted
                          ? <Badge variant="outline" className="text-emerald-300 border-emerald-500/40">trusted</Badge>
                          : <Badge variant="outline" className="text-slate-400 border-slate-600">new</Badge>}</TableCell>
                      </TableRow>
                    ))}
                    {!devices.length && <TableRow><TableCell colSpan={7} className="text-center text-slate-500 py-6">No devices tracked yet.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blocks */}
          <TabsContent value="blocks">
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Blocked IPs / Locked accounts</CardTitle>
                <Button variant="outline" size="sm" onClick={() => csv(blocks, "blocked_ips")}>
                  <Download className="h-3 w-3 mr-1" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>IP</TableHead><TableHead>Reason</TableHead>
                    <TableHead>Until</TableHead><TableHead>Since</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filter(blocks, ["ip_address", "reason"]).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.ip_address}</TableCell>
                        <TableCell className="text-xs">{r.reason ?? "—"}</TableCell>
                        <TableCell className="text-xs text-slate-400">{fmt(r.blocked_until)}</TableCell>
                        <TableCell className="text-xs text-slate-400">{fmt(r.created_at)}</TableCell>
                      </TableRow>
                    ))}
                    {!blocks.length && <TableRow><TableCell colSpan={4} className="text-center text-slate-500 py-6">No blocks.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit */}
          <TabsContent value="audit">
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Security Audit Trail</CardTitle>
                <Button variant="outline" size="sm" onClick={() => csv(audit, "security_audit")}>
                  <Download className="h-3 w-3 mr-1" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>When</TableHead><TableHead>Action</TableHead>
                    <TableHead>Target</TableHead><TableHead>Detail</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filter(audit, ["action", "target_type"]).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs text-slate-400">{fmt(r.created_at)}</TableCell>
                        <TableCell className="text-xs font-medium">{r.action}</TableCell>
                        <TableCell className="text-xs">{r.target_type ?? "—"}</TableCell>
                        <TableCell className="text-xs font-mono text-slate-400 truncate max-w-[420px]">
                          {r.new_value ? JSON.stringify(r.new_value) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!audit.length && <TableRow><TableCell colSpan={4} className="text-center text-slate-500 py-6">No security actions logged yet.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard">
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader><CardTitle className="text-base">Recent activity</CardTitle></CardHeader>
              <CardContent className="text-sm text-slate-400 space-y-2">
                <div>• {stats.pendingKyc} KYC submissions waiting for review.</div>
                <div>• {stats.openAlerts} unresolved security alerts.</div>
                <div>• {stats.failed24h} failed logins in the last 24 hours.</div>
                <div>• {stats.activeBlocks} IP addresses currently blocked.</div>
                <div className="pt-3 text-xs">All data is fetched live from the database. Use the tabs above for full tables and admin actions.</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* KYC Review dialog */}
      <Dialog open={!!reviewFor} onOpenChange={(o) => !o && setReviewFor(null)}>
        <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle>Review KYC · {reviewFor?.full_name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {reviewFor?.document_type?.toUpperCase()} · {reviewFor?.document_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {(["approved", "rejected", "resubmit"] as const).map((d) => (
                <Button key={d} variant={reviewDecision === d ? "default" : "outline"}
                  onClick={() => setReviewDecision(d)} className="capitalize">{d}</Button>
              ))}
            </div>
            <div>
              <label className="text-xs text-slate-400">Risk score (0-100)</label>
              <Input type="number" min={0} max={100} value={reviewRisk}
                onChange={(e) => setReviewRisk(Math.max(0, Math.min(100, +e.target.value)))}
                className="bg-slate-900 border-slate-800" />
            </div>
            {reviewDecision !== "approved" && (
              <div>
                <label className="text-xs text-slate-400">Reason</label>
                <Textarea value={reviewReason} onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Explain the decision…" className="bg-slate-900 border-slate-800" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewFor(null)}>Cancel</Button>
            <Button onClick={submitReview}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock account dialog */}
      <Dialog open={lockOpen} onOpenChange={setLockOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle>Lock account</DialogTitle>
            <DialogDescription className="text-slate-400">Prevents sign-in for the specified email.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="user@example.com" value={lockEmail} onChange={(e) => setLockEmail(e.target.value)} className="bg-slate-900 border-slate-800" />
            <Input type="number" min={1} max={8760} value={lockHours} onChange={(e) => setLockHours(+e.target.value)} className="bg-slate-900 border-slate-800" />
            <Textarea placeholder="Reason (required)" value={lockReason} onChange={(e) => setLockReason(e.target.value)} className="bg-slate-900 border-slate-800" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockOpen(false)}>Cancel</Button>
            <Button onClick={submitLock} disabled={!lockEmail || !lockReason}>
              <Lock className="h-4 w-4 mr-1" /> Lock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block IP dialog */}
      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle>Block IP address</DialogTitle>
            <DialogDescription className="text-slate-400">Blocks the given IP for the specified window.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="203.0.113.42" value={blockIp} onChange={(e) => setBlockIp(e.target.value)} className="bg-slate-900 border-slate-800" />
            <Input type="number" min={1} max={8760} value={blockHours} onChange={(e) => setBlockHours(+e.target.value)} className="bg-slate-900 border-slate-800" />
            <Textarea placeholder="Reason (required)" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} className="bg-slate-900 border-slate-800" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockOpen(false)}>Cancel</Button>
            <Button onClick={submitBlock} disabled={!blockIp || !blockReason}>
              <Ban className="h-4 w-4 mr-1" /> Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
