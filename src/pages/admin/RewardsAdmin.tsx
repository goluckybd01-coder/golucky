import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
  Plus, Pencil, Trash2, Search, Download, Gift, Coins, Sparkles,
  Trophy, Users, Wallet, Ticket, Percent, Calendar, Crown,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────
type GiftCode = {
  id: string;
  code: string;
  amount: number;
  description: string | null;
  max_redemptions: number;
  per_user_limit: number;
  redemption_count: number;
  target_audience: string;
  target_vip_min: number;
  target_agent_level: number;
  starts_at: string | null;
  ends_at: string | null;
  is_enabled: boolean;
  created_at: string;
};

type Promotion = {
  id: string;
  promo_type: string;
  title: string;
  reward_amount: number | null;
  is_enabled: boolean;
  target_audience: string;
  target_vip_min: number;
  target_agent_only: boolean;
  start_date: string | null;
  end_date: string | null;
};

type Achievement = {
  id: string;
  code: string;
  name: string;
  category: string;
  tier: string;
  requirement_type: string;
  requirement_value: number;
  reward_amount: number | null;
};

type ManualCredit = {
  id: string;
  user_id: string;
  direction: string;
  amount: number;
  reward_source: string;
  reason: string | null;
  balance_before: number;
  balance_after: number;
  staff_id: string | null;
  created_at: string;
};

type Redemption = {
  id: string;
  user_id: string;
  code: string;
  reward_amount: number;
  created_at: string;
};

type CashbackRec = {
  id: string;
  user_id: string;
  period_type: string;
  final_cashback: number;
  status: string;
  vip_level: number;
  period_start: string;
  period_end: string;
};

const money = (n: number | null | undefined) =>
  `৳${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

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

// ─────────────────────────────────────────────────────────────────────
// Gift Codes Tab
// ─────────────────────────────────────────────────────────────────────
function GiftCodesTab() {
  const [rows, setRows] = useState<GiftCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<GiftCode | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const emptyForm: Partial<GiftCode> = {
    code: "", amount: 100, description: "", max_redemptions: 100, per_user_limit: 1,
    target_audience: "all", target_vip_min: 0, target_agent_level: 0,
    starts_at: null, ends_at: null, is_enabled: true,
  };
  const [form, setForm] = useState<Partial<GiftCode>>(emptyForm);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gift_codes" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter === "enabled" && !r.is_enabled) return false;
      if (statusFilter === "disabled" && r.is_enabled) return false;
      if (search && !r.code.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rows, search, statusFilter]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowDialog(true); };
  const openEdit = (r: GiftCode) => { setEditing(r); setForm(r); setShowDialog(true); };

  const save = async () => {
    if (!form.code || !form.amount) return toast.error("Code and amount required");
    const payload: any = {
      code: form.code!.toUpperCase().trim(),
      amount: form.amount,
      description: form.description,
      max_redemptions: form.max_redemptions ?? 1,
      per_user_limit: form.per_user_limit ?? 1,
      target_audience: form.target_audience ?? "all",
      target_vip_min: form.target_vip_min ?? 0,
      target_agent_level: form.target_agent_level ?? 0,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      is_enabled: form.is_enabled ?? true,
    };
    let err;
    if (editing) {
      ({ error: err } = await supabase.from("gift_codes" as any).update(payload).eq("id", editing.id));
    } else {
      payload.created_by = (await supabase.auth.getUser()).data.user?.id;
      ({ error: err } = await supabase.from("gift_codes" as any).insert(payload));
    }
    if (err) return toast.error(err.message);
    toast.success(editing ? "Gift code updated" : "Gift code created");
    setShowDialog(false); load();
  };

  const toggle = async (r: GiftCode) => {
    const { error } = await supabase.rpc("admin_toggle_gift_code" as any, {
      p_id: r.id, p_enabled: !r.is_enabled,
    });
    if (error) return toast.error(error.message);
    toast.success("Updated");
    load();
  };
  const del = async () => {
    if (!deleteId) return;
    const { error } = await supabase.rpc("admin_delete_gift_code" as any, { p_id: deleteId });
    if (error) return toast.error(error.message);
    toast.success("Deleted"); setDeleteId(null); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search code…" value={search}
              onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="enabled">Enabled</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => download("gift_codes.csv", toCSV(filtered))}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Code</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr className="text-left">
                <th className="p-3">Code</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Used / Max</th>
                <th className="p-3">Target</th>
                <th className="p-3">Window</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No codes</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono font-semibold text-primary">{r.code}</td>
                  <td className="p-3">{money(r.amount)}</td>
                  <td className="p-3">{r.redemption_count} / {r.max_redemptions}</td>
                  <td className="p-3">
                    <Badge variant="outline">{r.target_audience}</Badge>
                    {r.target_vip_min > 0 && <span className="ml-1 text-xs text-muted-foreground">VIP≥{r.target_vip_min}</span>}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {r.starts_at ? new Date(r.starts_at).toLocaleDateString() : "—"} →{" "}
                    {r.ends_at ? new Date(r.ends_at).toLocaleDateString() : "∞"}
                  </td>
                  <td className="p-3">
                    <Switch checked={r.is_enabled} onCheckedChange={() => toggle(r)} />
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Create"} Gift Code</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Code</Label>
              <Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="WELCOME100" />
            </div>
            <div>
              <Label>Amount (৳)</Label>
              <Input type="number" value={form.amount ?? 0}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Target Audience</Label>
              <Select value={form.target_audience} onValueChange={(v) => setForm({ ...form, target_audience: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="agent">Agents</SelectItem>
                  <SelectItem value="new_users">New Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Max Redemptions</Label>
              <Input type="number" value={form.max_redemptions ?? 1}
                onChange={(e) => setForm({ ...form, max_redemptions: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Per-User Limit</Label>
              <Input type="number" value={form.per_user_limit ?? 1}
                onChange={(e) => setForm({ ...form, per_user_limit: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Min VIP Level</Label>
              <Input type="number" value={form.target_vip_min ?? 0}
                onChange={(e) => setForm({ ...form, target_vip_min: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Min Agent Level</Label>
              <Input type="number" value={form.target_agent_level ?? 0}
                onChange={(e) => setForm({ ...form, target_agent_level: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Starts</Label>
              <Input type="datetime-local" value={form.starts_at?.slice(0, 16) ?? ""}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
            <div>
              <Label>Ends</Label>
              <Input type="datetime-local" value={form.ends_at?.slice(0, 16) ?? ""}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Switch checked={form.is_enabled ?? true}
                onCheckedChange={(v) => setForm({ ...form, is_enabled: v })} />
              <Label>Enabled</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete gift code?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={del}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Campaigns Tab (promotions: first-deposit, deposit-bonus, daily/weekly/monthly)
// ─────────────────────────────────────────────────────────────────────
function CampaignsTab() {
  const [rows, setRows] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("promotions")
      .select("id,promo_type,title,reward_amount,is_enabled,target_audience,target_vip_min,target_agent_only,start_date,end_date")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) =>
    (typeFilter === "all" || r.promo_type === typeFilter) &&
    (!search || r.title.toLowerCase().includes(search.toLowerCase()))
  ), [rows, search, typeFilter]);

  const toggle = async (r: Promotion) => {
    const { error } = await supabase.from("promotions").update({ is_enabled: !r.is_enabled }).eq("id", r.id);
    if (error) return toast.error(error.message);
    await supabase.rpc("log_staff_action" as any, {
      p_action: "toggle_promotion", p_module: "rewards", p_target_type: "promotion",
      p_target_id: r.id, p_old: { is_enabled: r.is_enabled } as any,
      p_new: { is_enabled: !r.is_enabled } as any,
    });
    load();
  };

  const types = ["all", "first_deposit", "deposit_bonus", "daily", "weekly", "monthly", "vip", "referral", "agent"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search title…" value={search}
              onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => download("campaigns.csv", toCSV(filtered))}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr className="text-left">
                <th className="p-3">Title</th>
                <th className="p-3">Type</th>
                <th className="p-3">Reward</th>
                <th className="p-3">Target</th>
                <th className="p-3">Schedule</th>
                <th className="p-3">Enabled</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No campaigns. Create them from the Promotion Center.
                </td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{r.title}</td>
                  <td className="p-3"><Badge variant="secondary">{r.promo_type}</Badge></td>
                  <td className="p-3">{money(r.reward_amount ?? 0)}</td>
                  <td className="p-3">
                    <Badge variant="outline">{r.target_audience}</Badge>
                    {r.target_vip_min > 0 && <span className="ml-1 text-xs">VIP≥{r.target_vip_min}</span>}
                    {r.target_agent_only && <Badge className="ml-1" variant="outline">Agents</Badge>}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {r.start_date ? new Date(r.start_date).toLocaleDateString() : "—"} →{" "}
                    {r.end_date ? new Date(r.end_date).toLocaleDateString() : "∞"}
                  </td>
                  <td className="p-3">
                    <Switch checked={r.is_enabled} onCheckedChange={() => toggle(r)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Achievements Tab
// ─────────────────────────────────────────────────────────────────────
function AchievementsTab() {
  const [rows, setRows] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("achievements")
      .select("id,code,name,category,tier,requirement_type,requirement_value,reward_amount")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) =>
    (tierFilter === "all" || r.tier === tierFilter) &&
    (!search || r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase()))
  ), [rows, search, tierFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search name / code…" value={search}
              onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["all","bronze","silver","gold","platinum","diamond"].map((t) =>
                <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => download("achievements.csv", toCSV(filtered))}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr className="text-left">
                <th className="p-3">Code</th>
                <th className="p-3">Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Tier</th>
                <th className="p-3">Requirement</th>
                <th className="p-3">Reward</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No achievements</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{r.code}</td>
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3"><Badge variant="outline">{r.category}</Badge></td>
                  <td className="p-3"><Badge variant="secondary">{r.tier}</Badge></td>
                  <td className="p-3 text-xs">{r.requirement_type}: {r.requirement_value}</td>
                  <td className="p-3">{money(r.reward_amount ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Cashback Tab
// ─────────────────────────────────────────────────────────────────────
function CashbackTab() {
  const [rows, setRows] = useState<CashbackRec[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cashback_records")
      .select("id,user_id,period_type,final_cashback,status,vip_level,period_start,period_end")
      .order("period_end", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    rows.filter((r) => statusFilter === "all" || r.status === statusFilter), [rows, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["all","pending","eligible","claimed","expired"].map((s) =>
              <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => download("cashback.csv", toCSV(filtered))}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr className="text-left">
                <th className="p-3">User</th>
                <th className="p-3">Period</th>
                <th className="p-3">Range</th>
                <th className="p-3">VIP</th>
                <th className="p-3">Cashback</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No records</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{r.user_id.slice(0, 8)}…</td>
                  <td className="p-3"><Badge variant="secondary">{r.period_type}</Badge></td>
                  <td className="p-3 text-xs">{r.period_start} → {r.period_end}</td>
                  <td className="p-3">L{r.vip_level}</td>
                  <td className="p-3 font-semibold">{money(r.final_cashback)}</td>
                  <td className="p-3"><Badge variant="outline">{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Manual Credit Tab
// ─────────────────────────────────────────────────────────────────────
function ManualCreditTab() {
  const [rows, setRows] = useState<ManualCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirFilter, setDirFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    user_id: "", amount: 0, direction: "credit",
    reward_source: "manual", reason: "",
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("manual_reward_credits" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    rows.filter((r) => dirFilter === "all" || r.direction === dirFilter), [rows, dirFilter]);

  const submit = async () => {
    if (!form.user_id || !form.amount) return toast.error("User ID and amount required");
    const { data, error } = await supabase.rpc("admin_manual_reward_adjust" as any, {
      p_user_id: form.user_id,
      p_amount: form.amount,
      p_direction: form.direction,
      p_reward_source: form.reward_source,
      p_reason: form.reason,
    });
    if (error) return toast.error(error.message);
    toast.success(`${form.direction} applied. New balance: ${money((data as any)?.balance_after)}`);
    setShowDialog(false);
    setForm({ user_id: "", amount: 0, direction: "credit", reward_source: "manual", reason: "" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <Select value={dirFilter} onValueChange={setDirFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="credit">Credits</SelectItem>
            <SelectItem value="debit">Debits</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => download("manual_rewards.csv", toCSV(filtered))}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button size="sm" onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Adjustment
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr className="text-left">
                <th className="p-3">When</th>
                <th className="p-3">User</th>
                <th className="p-3">Direction</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Source</th>
                <th className="p-3">Balance After</th>
                <th className="p-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No adjustments</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3 font-mono text-xs">{r.user_id.slice(0, 8)}…</td>
                  <td className="p-3">
                    <Badge variant={r.direction === "credit" ? "default" : "destructive"}>
                      {r.direction}
                    </Badge>
                  </td>
                  <td className="p-3 font-semibold">{money(r.amount)}</td>
                  <td className="p-3"><Badge variant="outline">{r.reward_source}</Badge></td>
                  <td className="p-3">{money(r.balance_after)}</td>
                  <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">{r.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manual Reward Adjustment</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>User ID (UUID)</Label>
              <Input value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                placeholder="00000000-0000-0000-0000-000000000000" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Direction</Label>
                <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Credit (add)</SelectItem>
                    <SelectItem value="debit">Debit (deduct)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (৳)</Label>
                <Input type="number" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Source</Label>
              <Select value={form.reward_source} onValueChange={(v) => setForm({ ...form, reward_source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["manual","daily","weekly","monthly","vip","referral","agent","achievement","first_deposit","deposit_bonus","lucky_draw","cashback","correction"].map((s) =>
                    <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea value={form.reason} rows={3}
                onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={submit}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Redemption History Tab
// ─────────────────────────────────────────────────────────────────────
function RedemptionsTab() {
  const [rows, setRows] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("redeemed_bonus_codes")
      .select("id,user_id,code,reward_amount,created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) =>
    !search || r.code.toLowerCase().includes(search.toLowerCase()) ||
    r.user_id.toLowerCase().includes(search.toLowerCase())
  ), [rows, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search code / user…" value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Button variant="outline" size="sm" onClick={() => download("redemptions.csv", toCSV(filtered))}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr className="text-left">
                <th className="p-3">When</th>
                <th className="p-3">User</th>
                <th className="p-3">Code</th>
                <th className="p-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No redemptions</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3 font-mono text-xs">{r.user_id.slice(0, 8)}…</td>
                  <td className="p-3 font-mono font-semibold text-primary">{r.code}</td>
                  <td className="p-3">{money(r.reward_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────
export default function RewardsAdmin() {
  const [stats, setStats] = useState({
    activeCodes: 0, totalRedeemed: 0, cashbackPending: 0, manualToday: 0,
  });

  useEffect(() => {
    (async () => {
      const [gc, rd, cb, mc] = await Promise.all([
        supabase.from("gift_codes" as any).select("id", { count: "exact", head: true }).eq("is_enabled", true),
        supabase.from("redeemed_bonus_codes").select("reward_amount"),
        supabase.from("cashback_records").select("final_cashback").eq("status", "pending"),
        supabase.from("manual_reward_credits" as any).select("amount,direction,created_at")
          .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      ]);
      const redeemedSum = (rd.data ?? []).reduce((s: number, r: any) => s + Number(r.reward_amount ?? 0), 0);
      const cbSum = (cb.data ?? []).reduce((s: number, r: any) => s + Number(r.final_cashback ?? 0), 0);
      const mcSum = (mc.data ?? []).reduce((s: number, r: any) =>
        s + (r.direction === "credit" ? Number(r.amount) : -Number(r.amount)), 0);
      setStats({
        activeCodes: gc.count ?? 0,
        totalRedeemed: redeemedSum,
        cashbackPending: cbSum,
        manualToday: mcSum,
      });
    })();
  }, []);

  const cards = [
    { label: "Active Gift Codes", value: stats.activeCodes, icon: Gift, tint: "from-amber-500/20 to-yellow-500/5" },
    { label: "Total Redeemed", value: money(stats.totalRedeemed), icon: Ticket, tint: "from-emerald-500/20 to-teal-500/5" },
    { label: "Cashback Pending", value: money(stats.cashbackPending), icon: Percent, tint: "from-blue-500/20 to-indigo-500/5" },
    { label: "Manual Net (today)", value: money(stats.manualToday), icon: Wallet, tint: "from-fuchsia-500/20 to-purple-500/5" },
  ];

  return (
    <AdminShell title="Rewards Centre" description="Gift codes, cashback, campaigns, achievements & manual credits">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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

      <Tabs defaultValue="gift">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="gift"><Gift className="h-4 w-4 mr-1" /> Gift Codes</TabsTrigger>
          <TabsTrigger value="campaigns"><Sparkles className="h-4 w-4 mr-1" /> Campaigns</TabsTrigger>
          <TabsTrigger value="cashback"><Percent className="h-4 w-4 mr-1" /> Cashback</TabsTrigger>
          <TabsTrigger value="achievements"><Trophy className="h-4 w-4 mr-1" /> Achievements</TabsTrigger>
          <TabsTrigger value="manual"><Coins className="h-4 w-4 mr-1" /> Manual Credit</TabsTrigger>
          <TabsTrigger value="redemptions"><Ticket className="h-4 w-4 mr-1" /> Redemptions</TabsTrigger>
        </TabsList>
        <TabsContent value="gift" className="mt-4"><GiftCodesTab /></TabsContent>
        <TabsContent value="campaigns" className="mt-4"><CampaignsTab /></TabsContent>
        <TabsContent value="cashback" className="mt-4"><CashbackTab /></TabsContent>
        <TabsContent value="achievements" className="mt-4"><AchievementsTab /></TabsContent>
        <TabsContent value="manual" className="mt-4"><ManualCreditTab /></TabsContent>
        <TabsContent value="redemptions" className="mt-4"><RedemptionsTab /></TabsContent>
      </Tabs>
    </AdminShell>
  );
}
