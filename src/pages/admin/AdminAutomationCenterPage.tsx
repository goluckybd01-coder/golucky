import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Play, Eye, History, RotateCcw, Plus, Trash2 } from "lucide-react";

type AutomationType =
  | "welcome_bonus" | "first_deposit_bonus" | "daily_bonus" | "weekly_bonus" | "monthly_bonus"
  | "cashback" | "vip_upgrade" | "agent_commission" | "referral_commission"
  | "lucky_draw" | "event_rewards" | "fixed_deposit_profit"
  | "notification" | "banner_schedule" | "promotion_schedule";

const AUTOMATION_TYPES: { value: AutomationType; label: string }[] = [
  { value: "welcome_bonus", label: "Auto Welcome Bonus" },
  { value: "first_deposit_bonus", label: "Auto First Deposit Bonus" },
  { value: "daily_bonus", label: "Auto Daily Bonus" },
  { value: "weekly_bonus", label: "Auto Weekly Bonus" },
  { value: "monthly_bonus", label: "Auto Monthly Bonus" },
  { value: "cashback", label: "Auto Cashback" },
  { value: "vip_upgrade", label: "Auto VIP Upgrade" },
  { value: "agent_commission", label: "Auto Agent Commission" },
  { value: "referral_commission", label: "Auto Referral Commission" },
  { value: "lucky_draw", label: "Auto Lucky Draw" },
  { value: "event_rewards", label: "Auto Event Rewards" },
  { value: "fixed_deposit_profit", label: "Auto Fixed Deposit Profit" },
  { value: "notification", label: "Auto Notification" },
  { value: "banner_schedule", label: "Auto Banner Schedule" },
  { value: "promotion_schedule", label: "Auto Promotion Schedule" },
];

interface Automation {
  id: string;
  name: string;
  type: AutomationType;
  enabled: boolean;
  startDate: string;
  endDate: string;
  targetUsers: string;
  vipTarget: string;
  agentTarget: string;
  countryTarget: string;
  schedule: string;
  amount: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface AuditEntry {
  id: string;
  automationId: string;
  action: string;
  snapshot: Automation;
  at: string;
}

const STORAGE_KEY = "golucky_automation_center_v1";
const AUDIT_KEY = "golucky_automation_audit_v1";
const FLAG_KEY = "golucky_automation_master_enabled";

const emptyForm = (): Automation => ({
  id: "",
  name: "",
  type: "welcome_bonus",
  enabled: false,
  startDate: "",
  endDate: "",
  targetUsers: "all",
  vipTarget: "any",
  agentTarget: "any",
  countryTarget: "BD",
  schedule: "daily",
  amount: 0,
  notes: "",
  createdAt: "",
  updatedAt: "",
});

function load<T>(k: string, fallback: T): T {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : fallback; }
  catch { return fallback; }
}
function save<T>(k: string, v: T) { localStorage.setItem(k, JSON.stringify(v)); }

const AdminAutomationCenterPage = () => {
  const [masterEnabled, setMasterEnabled] = useState<boolean>(() => load(FLAG_KEY, false));
  const [items, setItems] = useState<Automation[]>(() => load(STORAGE_KEY, [] as Automation[]));
  const [audit, setAudit] = useState<AuditEntry[]>(() => load(AUDIT_KEY, [] as AuditEntry[]));
  const [form, setForm] = useState<Automation>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyFor, setHistoryFor] = useState<string | null>(null);

  useEffect(() => save(STORAGE_KEY, items), [items]);
  useEffect(() => save(AUDIT_KEY, audit), [audit]);
  useEffect(() => save(FLAG_KEY, masterEnabled), [masterEnabled]);

  const historyItems = useMemo(
    () => audit.filter((a) => a.automationId === historyFor).sort((a, b) => b.at.localeCompare(a.at)),
    [audit, historyFor]
  );

  const pushAudit = (automation: Automation, action: string) => {
    setAudit((prev) => [
      { id: crypto.randomUUID(), automationId: automation.id, action, snapshot: automation, at: new Date().toISOString() },
      ...prev,
    ]);
  };

  const resetForm = () => { setForm(emptyForm()); setEditingId(null); };

  const handleSave = () => {
    if (!form.name.trim()) return toast.error("Name is required");
    const now = new Date().toISOString();
    if (editingId) {
      const updated = { ...form, id: editingId, updatedAt: now };
      setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
      pushAudit(updated, "update");
      toast.success("Automation updated");
    } else {
      const created = { ...form, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
      setItems((prev) => [created, ...prev]);
      pushAudit(created, "create");
      toast.success("Automation created");
    }
    resetForm();
  };

  const handleEdit = (a: Automation) => { setForm(a); setEditingId(a.id); };
  const handleDelete = (a: Automation) => { setItems((prev) => prev.filter((i) => i.id !== a.id)); pushAudit(a, "delete"); toast.success("Deleted"); };
  const handleToggle = (a: Automation) => {
    const updated = { ...a, enabled: !a.enabled, updatedAt: new Date().toISOString() };
    setItems((prev) => prev.map((i) => (i.id === a.id ? updated : i)));
    pushAudit(updated, updated.enabled ? "enable" : "disable");
  };
  const handleTestRun = (a: Automation) => {
    if (!masterEnabled) return toast.warning("Master switch OFF — test run simulated only");
    pushAudit(a, "test_run");
    toast.success(`Test run: ${AUTOMATION_TYPES.find((t) => t.value === a.type)?.label} → ${a.targetUsers} (৳${a.amount})`);
  };
  const handleRollback = (entry: AuditEntry) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === entry.snapshot.id);
      return exists ? prev.map((i) => (i.id === entry.snapshot.id ? entry.snapshot : i)) : [entry.snapshot, ...prev];
    });
    pushAudit(entry.snapshot, "rollback");
    toast.success("Rolled back");
    setHistoryFor(null);
  };

  return (
    <AdminShell title="Automation Center" description="Master automation engine — create, schedule and audit every bonus & reward flow">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Master Automation Engine</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Feature flag gates live execution. When OFF, actions are simulated only.</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={masterEnabled ? "default" : "secondary"}>{masterEnabled ? "LIVE" : "SAFE MODE"}</Badge>
              <Switch checked={masterEnabled} onCheckedChange={setMasterEnabled} />
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader><CardTitle>{editingId ? "Edit Automation" : "New Automation"}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Signup ৳100 bonus" /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as AutomationType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{AUTOMATION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Amount (৳)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
            <div><Label>Start Date</Label><Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div><Label>End Date</Label><Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            <div>
              <Label>Schedule</Label>
              <Select value={form.schedule} onValueChange={(v) => setForm({ ...form, schedule: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Instant / Event Trigger</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target Users</Label>
              <Select value={form.targetUsers} onValueChange={(v) => setForm({ ...form, targetUsers: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="new">New Users</SelectItem>
                  <SelectItem value="active">Active Users</SelectItem>
                  <SelectItem value="dormant">Dormant Users</SelectItem>
                  <SelectItem value="custom">Custom Segment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>VIP Target</Label>
              <Select value={form.vipTarget} onValueChange={(v) => setForm({ ...form, vipTarget: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any VIP</SelectItem>
                  {Array.from({ length: 11 }).map((_, i) => <SelectItem key={i} value={`L${i}`}>L{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Agent Target</Label>
              <Select value={form.agentTarget} onValueChange={(v) => setForm({ ...form, agentTarget: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Agent</SelectItem>
                  {Array.from({ length: 7 }).map((_, i) => <SelectItem key={i} value={`T${i + 1}`}>T{i + 1}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Country Target</Label><Input value={form.countryTarget} onChange={(e) => setForm({ ...form, countryTarget: e.target.value })} placeholder="BD, IN, PK..." /></div>
            <div className="md:col-span-2 lg:col-span-3"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <div className="md:col-span-2 lg:col-span-3 flex flex-wrap gap-2">
              <Button onClick={handleSave}><Plus className="h-4 w-4 mr-1" />{editingId ? "Update" : "Create"}</Button>
              <Button variant="outline" onClick={() => setPreviewOpen(true)}><Eye className="h-4 w-4 mr-1" />Preview</Button>
              {editingId && <Button variant="ghost" onClick={resetForm}>Cancel</Button>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Automations ({items.length})</CardTitle></CardHeader>
          <CardContent>
            {items.length === 0 ? <p className="text-sm text-muted-foreground">No automations yet. Create one above.</p> : (
              <div className="space-y-2">
                {items.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-3 border rounded-lg">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{a.name}</span>
                        <Badge variant="outline">{AUTOMATION_TYPES.find((t) => t.value === a.type)?.label}</Badge>
                        <Badge variant={a.enabled ? "default" : "secondary"}>{a.enabled ? "ON" : "OFF"}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{a.schedule} • {a.targetUsers} • VIP {a.vipTarget} • Agent {a.agentTarget} • {a.countryTarget} • ৳{a.amount}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch checked={a.enabled} onCheckedChange={() => handleToggle(a)} />
                      <Button size="sm" variant="ghost" onClick={() => handleTestRun(a)}><Play className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(a)}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => setHistoryFor(a.id)}><History className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(a)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Audit Log</CardTitle></CardHeader>
          <CardContent>
            {audit.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> : (
              <div className="space-y-1 max-h-96 overflow-auto">
                {audit.slice(0, 100).map((e) => (
                  <div key={e.id} className="text-xs flex items-center gap-2 py-1 border-b">
                    <Badge variant="outline">{e.action}</Badge>
                    <span className="font-medium">{e.snapshot.name}</span>
                    <span className="text-muted-foreground ml-auto">{new Date(e.at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Automation Preview</DialogTitle></DialogHeader>
          <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">{JSON.stringify(form, null, 2)}</pre>
          <DialogFooter><Button onClick={() => setPreviewOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!historyFor} onOpenChange={(o) => !o && setHistoryFor(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Version History</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {historyItems.length === 0 && <p className="text-sm text-muted-foreground">No history.</p>}
            {historyItems.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-2 border rounded">
                <div className="text-xs"><Badge variant="outline" className="mr-2">{h.action}</Badge>{new Date(h.at).toLocaleString()}</div>
                <Button size="sm" variant="outline" onClick={() => handleRollback(h)}><RotateCcw className="h-3 w-3 mr-1" />Rollback</Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
};

export default AdminAutomationCenterPage;
