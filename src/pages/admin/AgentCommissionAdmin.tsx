import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Search, Download, RefreshCw, Trash2, Plus, DollarSign, Users, TrendingUp,
  CheckCircle2, PauseCircle, PlayCircle, CalendarClock, Sparkles, Crown,
} from "lucide-react";

type CommissionStatus = "pending" | "approved" | "on_hold" | "released" | "withdrawn";

type HistoryRow = {
  id: string;
  agent_user_id: string;
  referred_user_id: string;
  commission_type: "deposit" | "betting" | "registration";
  source_amount: number;
  commission_rate: number;
  commission_amount: number;
  reference_id: string | null;
  status: CommissionStatus;
  is_credited: boolean;
  credited_at: string | null;
  created_at: string;
};

type SummaryRow = {
  agent_user_id: string;
  agent_display_id: string;
  agent_name: string;
  agent_tier: string;
  team_users: number;
  team_deposit: number;
  team_wager: number;
  today_commission: number;
  pending_commission: number;
  total_commission: number;
  withdrawn_commission: number;
};

type SettlementRow = {
  settlement_date: string;
  window_start: string;
  window_end: string;
  entries: number;
  agents: number;
  total_amount: number;
  released_amount: number;
  pending_amount: number;
};

const TIERS = ["starter", "bronze", "silver", "gold", "diamond", "elite", "master"];
const STATUSES: CommissionStatus[] = ["pending", "approved", "on_hold", "released", "withdrawn"];

const statusStyle: Record<CommissionStatus, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  approved: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  on_hold: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  released: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  withdrawn: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

const typeStyle: Record<string, string> = {
  deposit: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  betting: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  registration: "bg-purple-500/15 text-purple-300 border-purple-500/30",
};

const fmt = (n: number | string | null | undefined) =>
  `৳${Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const downloadCsv = (name: string, rows: any[]) => {
  if (!rows.length) return toast.error("Nothing to export");
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(",")]
    .concat(rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(",")))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function AgentCommissionAdmin() {
  const [tab, setTab] = useState("summary");

  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [uidQuery, setUidQuery] = useState("");

  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [settlement, setSettlement] = useState<SettlementRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<HistoryRow | null>(null);
  const [adjust, setAdjust] = useState<null | {
    agent_user_id: string;
    amount: string;
    adjustment_type: "credit" | "debit" | "correction";
    reason: string;
    reference_id: string;
  }>(null);

  const load = async () => {
    setLoading(true);
    try {
      const from = dateFrom ? new Date(dateFrom).toISOString() : null;
      const to = dateTo ? new Date(dateTo).toISOString() : null;
      const tier = tierFilter === "all" ? null : tierFilter;
      const status = statusFilter === "all" ? null : statusFilter;

      const [sumRes, histRes, setRes] = await Promise.all([
        (supabase as any).rpc("admin_get_agent_commission_summary", {
          p_from: from, p_to: to, p_tier: tier,
          p_agent_uid: uidQuery.trim() || null, p_status: status,
        }),
        supabase
          .from("agent_commissions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1000),
        (supabase as any).rpc("admin_get_daily_settlement", { p_days: 14 }),
      ]);

      if (sumRes.error) throw sumRes.error;
      if (histRes.error) throw histRes.error;
      if (setRes.error) throw setRes.error;

      setSummary((sumRes.data as SummaryRow[]) || []);
      setHistory((histRes.data as any as HistoryRow[]) || []);
      setSettlement((setRes.data as SettlementRow[]) || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load commissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const historyFiltered = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom).getTime() : 0;
    const to = dateTo ? new Date(dateTo).getTime() : Infinity;
    return history.filter(r => {
      const t = new Date(r.created_at).getTime();
      if (t < from || t >= to) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (uidQuery && !r.agent_user_id.toLowerCase().includes(uidQuery.toLowerCase())
        && !r.referred_user_id.toLowerCase().includes(uidQuery.toLowerCase())
        && !(r.reference_id || "").toLowerCase().includes(uidQuery.toLowerCase())) return false;
      return true;
    });
  }, [history, dateFrom, dateTo, statusFilter, uidQuery]);

  const totals = useMemo(() => ({
    agents: summary.length,
    team_users: summary.reduce((s, r) => s + Number(r.team_users || 0), 0),
    total: summary.reduce((s, r) => s + Number(r.total_commission || 0), 0),
    pending: summary.reduce((s, r) => s + Number(r.pending_commission || 0), 0),
    today: summary.reduce((s, r) => s + Number(r.today_commission || 0), 0),
    withdrawn: summary.reduce((s, r) => s + Number(r.withdrawn_commission || 0), 0),
  }), [summary]);

  const setStatus = async (row: HistoryRow, next: CommissionStatus) => {
    try {
      const { error } = await (supabase as any).rpc("admin_set_commission_status", {
        p_id: row.id, p_status: next,
      });
      if (error) throw error;
      toast.success(`Marked ${next}`);
      load();
    } catch (e: any) {
      toast.error(e.message || "Status change failed");
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      const { error } = await (supabase as any).rpc("admin_delete_commission", { p_id: confirmDelete.id });
      if (error) throw error;
      toast.success("Deleted");
      setConfirmDelete(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  const submitAdjust = async () => {
    if (!adjust) return;
    const amt = Number(adjust.amount);
    if (!adjust.agent_user_id.trim()) return toast.error("Agent user ID is required");
    if (!adjust.reason.trim()) return toast.error("Reason is required");
    if (!amt || amt <= 0) return toast.error("Amount must be positive");
    try {
      const { error } = await (supabase as any).rpc("admin_adjust_commission", {
        p_agent_user_id: adjust.agent_user_id.trim(),
        p_amount: amt,
        p_adjustment_type: adjust.adjustment_type,
        p_reason: adjust.reason.trim(),
        p_reference_id: adjust.reference_id.trim() || null,
      });
      if (error) throw error;
      toast.success("Adjustment recorded");
      setAdjust(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Adjustment failed");
    }
  };

  return (
    <AdminShell title="Agent Commission" description="Team performance · settlements · payouts">
      <div className="space-y-6">
        <Card className="border-amber-500/20 bg-gradient-to-br from-[#0a0a1a] via-[#0f0a1f] to-[#0a0a1a] shadow-[0_0_40px_-15px_rgba(251,191,36,0.35)]">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="grow min-w-[180px]">
                <Label className="text-xs text-white/50">Search agent / user / ref</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-white/40" />
                  <Input value={uidQuery} onChange={e => setUidQuery(e.target.value)} placeholder="Agent UID, name, referral…" className="pl-8 bg-white/5 border-white/10" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-white/50">From</Label>
                <Input type="datetime-local" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-white/5 border-white/10 w-48" />
              </div>
              <div>
                <Label className="text-xs text-white/50">To</Label>
                <Input type="datetime-local" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-white/5 border-white/10 w-48" />
              </div>
              <div>
                <Label className="text-xs text-white/50">Level</Label>
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-36 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    {TIERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-white/50">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 ml-auto">
                <Button onClick={load} variant="outline" className="border-white/10 bg-white/5">
                  <RefreshCw className="w-4 h-4 mr-2" />Apply
                </Button>
                <Button
                  onClick={() => setAdjust({ agent_user_id: "", amount: "", adjustment_type: "credit", reason: "", reference_id: "" })}
                  className="bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 text-black font-bold shadow-[0_0_25px_-8px_rgba(251,191,36,0.6)]"
                >
                  <Plus className="w-4 h-4 mr-2" />Adjustment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Agents", value: totals.agents.toLocaleString(), icon: Crown, tone: "amber" },
            { label: "Team users", value: totals.team_users.toLocaleString(), icon: Users, tone: "sky" },
            { label: "Today", value: fmt(totals.today), icon: Sparkles, tone: "emerald" },
            { label: "Pending", value: fmt(totals.pending), icon: PauseCircle, tone: "orange" },
            { label: "Total", value: fmt(totals.total), icon: TrendingUp, tone: "amber" },
            { label: "Withdrawn", value: fmt(totals.withdrawn), icon: DollarSign, tone: "slate" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border-white/10 relative overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-white/50 uppercase tracking-wide">{s.label}</div>
                    <Icon className="w-4 h-4 text-amber-300/70" />
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-amber-300 mt-2 truncate">{s.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="summary" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">Agent Summary</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">Commission History</TabsTrigger>
            <TabsTrigger value="settlement" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">Daily Settlement (01:00 BDT)</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-4">
            <Card className="bg-white/[0.03] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-white/90 text-lg flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-300" /> Agent Performance
                </CardTitle>
                <Button variant="outline" size="sm" className="border-white/10 bg-white/5" onClick={() => downloadCsv("agent-summary", summary)}>
                  <Download className="w-4 h-4 mr-2" />Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-white/50 text-center py-10">Loading…</div>
                ) : summary.length === 0 ? (
                  <div className="text-white/50 text-center py-10 border border-dashed border-white/10 rounded-lg">No approved agents match your filters.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-white/50 text-xs uppercase border-b border-white/10">
                        <tr>
                          <th className="text-left py-2 px-2">Agent UID</th>
                          <th className="text-left py-2 px-2">Name</th>
                          <th className="text-left py-2 px-2">Level</th>
                          <th className="text-right py-2 px-2">Team</th>
                          <th className="text-right py-2 px-2 hidden lg:table-cell">Team deposit</th>
                          <th className="text-right py-2 px-2 hidden lg:table-cell">Team wager</th>
                          <th className="text-right py-2 px-2">Today</th>
                          <th className="text-right py-2 px-2">Pending</th>
                          <th className="text-right py-2 px-2">Total</th>
                          <th className="text-right py-2 px-2 hidden md:table-cell">Withdrawn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.map(r => (
                          <tr key={r.agent_user_id} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="py-2 px-2 font-mono text-xs text-amber-200">{r.agent_display_id || r.agent_user_id.slice(0, 8) + "…"}</td>
                            <td className="py-2 px-2 text-white/90">{r.agent_name || "—"}</td>
                            <td className="py-2 px-2"><Badge variant="outline" className="border-amber-500/30 text-amber-300">{r.agent_tier}</Badge></td>
                            <td className="py-2 px-2 text-right text-white/80">{Number(r.team_users).toLocaleString()}</td>
                            <td className="py-2 px-2 text-right text-white/70 hidden lg:table-cell">{fmt(r.team_deposit)}</td>
                            <td className="py-2 px-2 text-right text-white/70 hidden lg:table-cell">{fmt(r.team_wager)}</td>
                            <td className="py-2 px-2 text-right text-emerald-300">{fmt(r.today_commission)}</td>
                            <td className="py-2 px-2 text-right text-orange-300">{fmt(r.pending_commission)}</td>
                            <td className="py-2 px-2 text-right text-amber-300 font-semibold">{fmt(r.total_commission)}</td>
                            <td className="py-2 px-2 text-right text-white/60 hidden md:table-cell">{fmt(r.withdrawn_commission)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card className="bg-white/[0.03] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-white/90 text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-300" /> Commission History
                </CardTitle>
                <Button variant="outline" size="sm" className="border-white/10 bg-white/5" onClick={() => downloadCsv("commission-history", historyFiltered)}>
                  <Download className="w-4 h-4 mr-2" />Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-white/50 text-center py-10">Loading…</div>
                ) : historyFiltered.length === 0 ? (
                  <div className="text-white/50 text-center py-10 border border-dashed border-white/10 rounded-lg">No commission records match filters.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-white/50 text-xs uppercase border-b border-white/10">
                        <tr>
                          <th className="text-left py-2 px-2">Agent</th>
                          <th className="text-left py-2 px-2 hidden md:table-cell">From user</th>
                          <th className="text-left py-2 px-2">Type</th>
                          <th className="text-right py-2 px-2 hidden lg:table-cell">Source</th>
                          <th className="text-right py-2 px-2 hidden lg:table-cell">Rate</th>
                          <th className="text-right py-2 px-2">Commission</th>
                          <th className="text-left py-2 px-2">Status</th>
                          <th className="text-left py-2 px-2 hidden md:table-cell">Created</th>
                          <th className="text-right py-2 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyFiltered.map(r => (
                          <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="py-2 px-2 font-mono text-xs text-white/80">{r.agent_user_id.slice(0, 8)}…</td>
                            <td className="py-2 px-2 font-mono text-xs text-white/60 hidden md:table-cell">{r.referred_user_id.slice(0, 8)}…</td>
                            <td className="py-2 px-2"><Badge variant="outline" className={typeStyle[r.commission_type] || ""}>{r.commission_type}</Badge></td>
                            <td className="py-2 px-2 text-right text-white/70 hidden lg:table-cell">{fmt(r.source_amount)}</td>
                            <td className="py-2 px-2 text-right text-white/70 hidden lg:table-cell">{Number(r.commission_rate).toFixed(2)}%</td>
                            <td className="py-2 px-2 text-right text-amber-300 font-semibold">{fmt(r.commission_amount)}</td>
                            <td className="py-2 px-2">
                              <Badge variant="outline" className={statusStyle[r.status] || ""}>{r.status.replace("_", " ")}</Badge>
                            </td>
                            <td className="py-2 px-2 hidden md:table-cell text-white/50 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                            <td className="py-2 px-2">
                              <div className="flex justify-end gap-1">
                                <Button size="icon" variant="ghost" className="h-8 w-8" title="Approve" onClick={() => setStatus(r, "approved")}>
                                  <CheckCircle2 className="w-4 h-4 text-sky-300" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8" title="Hold" onClick={() => setStatus(r, "on_hold")}>
                                  <PauseCircle className="w-4 h-4 text-orange-300" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8" title="Release" onClick={() => setStatus(r, "released")}>
                                  <PlayCircle className="w-4 h-4 text-emerald-300" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300" title="Delete" onClick={() => setConfirmDelete(r)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settlement" className="mt-4">
            <Card className="bg-white/[0.03] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-white/90 text-lg flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-emerald-300" /> Daily Settlement · 01:00 Asia/Dhaka
                </CardTitle>
                <Button variant="outline" size="sm" className="border-white/10 bg-white/5" onClick={() => downloadCsv("settlement", settlement)}>
                  <Download className="w-4 h-4 mr-2" />Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-white/50 text-center py-10">Loading…</div>
                ) : settlement.length === 0 ? (
                  <div className="text-white/50 text-center py-10 border border-dashed border-white/10 rounded-lg">No settlement data in the last 14 days.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-white/50 text-xs uppercase border-b border-white/10">
                        <tr>
                          <th className="text-left py-2 px-2">Settlement date (BDT)</th>
                          <th className="text-left py-2 px-2 hidden md:table-cell">Window</th>
                          <th className="text-right py-2 px-2">Entries</th>
                          <th className="text-right py-2 px-2">Agents</th>
                          <th className="text-right py-2 px-2">Total</th>
                          <th className="text-right py-2 px-2">Released</th>
                          <th className="text-right py-2 px-2">Pending</th>
                        </tr>
                      </thead>
                      <tbody>
                        {settlement.map(r => (
                          <tr key={r.settlement_date} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="py-2 px-2 text-white/90">{r.settlement_date}</td>
                            <td className="py-2 px-2 text-white/50 text-xs hidden md:table-cell">
                              {new Date(r.window_start).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              {" → "}
                              {new Date(r.window_end).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="py-2 px-2 text-right text-white/80">{Number(r.entries).toLocaleString()}</td>
                            <td className="py-2 px-2 text-right text-white/80">{Number(r.agents).toLocaleString()}</td>
                            <td className="py-2 px-2 text-right text-amber-300 font-semibold">{fmt(r.total_amount)}</td>
                            <td className="py-2 px-2 text-right text-emerald-300">{fmt(r.released_amount)}</td>
                            <td className="py-2 px-2 text-right text-orange-300">{fmt(r.pending_amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!adjust} onOpenChange={(o) => !o && setAdjust(null)}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>New Commission Adjustment</DialogTitle>
          </DialogHeader>
          {adjust && (
            <div className="space-y-4">
              <div>
                <Label>Agent user ID (UUID)</Label>
                <Input value={adjust.agent_user_id} onChange={e => setAdjust({ ...adjust, agent_user_id: e.target.value })} className="bg-white/5 border-white/10 font-mono text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={adjust.adjustment_type} onValueChange={(v: any) => setAdjust({ ...adjust, adjustment_type: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">Credit (+)</SelectItem>
                      <SelectItem value="debit">Debit (−)</SelectItem>
                      <SelectItem value="correction">Correction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount (৳)</Label>
                  <Input type="number" min={0} step="0.01" value={adjust.amount} onChange={e => setAdjust({ ...adjust, amount: e.target.value })} className="bg-white/5 border-white/10" />
                </div>
              </div>
              <div>
                <Label>Reason</Label>
                <Textarea value={adjust.reason} onChange={e => setAdjust({ ...adjust, reason: e.target.value })} className="bg-white/5 border-white/10 min-h-[80px]" />
              </div>
              <div>
                <Label>Reference ID (optional)</Label>
                <Input value={adjust.reference_id} onChange={e => setAdjust({ ...adjust, reference_id: e.target.value })} className="bg-white/5 border-white/10" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjust(null)} className="border-white/10 bg-white/5">Cancel</Button>
            <Button onClick={submitAdjust} className="bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 text-black font-bold">Record adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete commission?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This permanently removes commission <span className="font-mono text-white">{confirmDelete?.id.slice(0, 8)}…</span> ({fmt(confirmDelete?.commission_amount || 0)}). This action is logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-red-600 hover:bg-red-500">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
