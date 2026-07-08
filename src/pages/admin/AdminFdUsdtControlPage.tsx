import { useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { ShieldCheck, Pause, Play, Plus, Trash2 } from 'lucide-react';

type Plan = { id: string; name: string; days: number; profitPct: number; minUsdt: number; maxUsdt: number; penaltyPct: number; active: boolean };
type Req = { id: string; user: string; plan: string; usdt: number; status: 'pending' | 'approved' | 'rejected'; ts: string };

const SEED_PLANS: Plan[] = [
  { id: 'FD-30', name: '30-Day USDT Plan', days: 30, profitPct: 8, minUsdt: 100, maxUsdt: 10000, penaltyPct: 5, active: true },
  { id: 'FD-90', name: '90-Day USDT Plan', days: 90, profitPct: 15, minUsdt: 500, maxUsdt: 50000, penaltyPct: 8, active: true },
  { id: 'FD-180', name: '180-Day USDT Plan', days: 180, profitPct: 28, minUsdt: 1000, maxUsdt: 100000, penaltyPct: 12, active: true },
  { id: 'FD-365', name: '365-Day USDT Plan', days: 365, profitPct: 60, minUsdt: 5000, maxUsdt: 500000, penaltyPct: 20, active: false },
];
const SEED_REQ: Req[] = [
  { id: 'FDR-0001', user: 'GLU-2026-000123', plan: 'FD-30', usdt: 500, status: 'pending', ts: '2026-07-06 08:12' },
  { id: 'FDR-0002', user: 'GLU-2026-000451', plan: 'FD-90', usdt: 2000, status: 'pending', ts: '2026-07-06 07:44' },
];

const AdminFdUsdtControlPage = () => {
  const [flag, setFlag] = useState(false);
  const [paused, setPaused] = useState(false);
  const [plans, setPlans] = useState<Plan[]>(SEED_PLANS);
  const [reqs, setReqs] = useState<Req[]>(SEED_REQ);
  const [audit, setAudit] = useState<string[]>([]);

  const log = (m: string) => setAudit((a) => [`${new Date().toISOString().slice(11, 19)} · ${m}`, ...a].slice(0, 150));

  const updatePlan = (id: string, patch: Partial<Plan>) => {
    setPlans((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    log(`plan_update ${id}`);
  };
  const addPlan = () => {
    const id = `FD-${Math.floor(Math.random() * 999)}`;
    setPlans((ps) => [...ps, { id, name: `${id} Plan`, days: 30, profitPct: 5, minUsdt: 100, maxUsdt: 10000, penaltyPct: 5, active: false }]);
    log(`plan_add ${id}`);
  };
  const delPlan = (id: string) => { setPlans((ps) => ps.filter((p) => p.id !== id)); log(`plan_delete ${id}`); };

  const decide = (id: string, status: 'approved' | 'rejected') => {
    if (!flag) return toast.warning('Feature flag OFF — simulated');
    if (paused) return toast.warning('FD deposits paused');
    setReqs((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    log(`${status} ${id}`);
    toast.success(`${id} ${status}`);
  };

  return (
    <AdminShell title="Fixed Deposit USDT Control" description="FDs open in USDT only. Admin controls plans, profit rate, and approvals.">
      <Card className="mb-4 border-amber-500/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Master Feature Flag</span>
            <div className="flex items-center gap-3">
              <Badge variant={flag ? 'default' : 'secondary'}>{flag ? 'LIVE' : 'SAFE MODE'}</Badge>
              <Switch checked={flag} onCheckedChange={(v) => { setFlag(v); log(`feature_flag ${v ? 'ON' : 'OFF'}`); }} />
              <Button size="sm" variant={paused ? 'default' : 'outline'} onClick={() => { setPaused((p) => !p); log(paused ? 'resume_fd' : 'pause_fd'); }}>
                {paused ? <><Play className="mr-1 h-3 w-3" /> Resume</> : <><Pause className="mr-1 h-3 w-3" /> Pause FD</>}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm">FD Plans ({plans.length})</CardTitle>
          <Button size="sm" onClick={addPlan}><Plus className="mr-1 h-3 w-3" /> Add Plan</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {plans.map((p) => (
            <div key={p.id} className="grid grid-cols-2 items-end gap-2 rounded-md border border-border p-3 md:grid-cols-8">
              <div><Label className="text-xs">Name</Label><Input value={p.name} onChange={(e) => updatePlan(p.id, { name: e.target.value })} /></div>
              <div><Label className="text-xs">Days</Label><Input type="number" value={p.days} onChange={(e) => updatePlan(p.id, { days: +e.target.value })} /></div>
              <div><Label className="text-xs">Profit %</Label><Input type="number" step="0.1" value={p.profitPct} onChange={(e) => updatePlan(p.id, { profitPct: +e.target.value })} /></div>
              <div><Label className="text-xs">Min USDT</Label><Input type="number" value={p.minUsdt} onChange={(e) => updatePlan(p.id, { minUsdt: +e.target.value })} /></div>
              <div><Label className="text-xs">Max USDT</Label><Input type="number" value={p.maxUsdt} onChange={(e) => updatePlan(p.id, { maxUsdt: +e.target.value })} /></div>
              <div><Label className="text-xs">Penalty %</Label><Input type="number" step="0.1" value={p.penaltyPct} onChange={(e) => updatePlan(p.id, { penaltyPct: +e.target.value })} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">Active</Label><Switch checked={p.active} onCheckedChange={(v) => updatePlan(p.id, { active: v })} /></div>
              <div className="flex justify-end"><Button size="sm" variant="ghost" onClick={() => delPlan(p.id)}><Trash2 className="h-3 w-3" /></Button></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Pending FD Requests</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>User</TableHead><TableHead>Plan</TableHead><TableHead>USDT</TableHead><TableHead>Status</TableHead><TableHead>Time</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {reqs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell className="font-mono text-xs">{r.user}</TableCell>
                  <TableCell>{r.plan}</TableCell>
                  <TableCell>{r.usdt}</TableCell>
                  <TableCell><Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'}>{r.status}</Badge></TableCell>
                  <TableCell className="text-xs">{r.ts}</TableCell>
                  <TableCell>
                    {r.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => decide(r.id, 'approved')}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => decide(r.id, 'rejected')}>Reject</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Audit ({audit.length})</CardTitle></CardHeader>
        <CardContent className="max-h-56 overflow-auto text-xs font-mono">
          {audit.length === 0 ? <p className="text-muted-foreground">No actions yet.</p> : <ul className="space-y-1">{audit.map((a, i) => <li key={i}>{a}</li>)}</ul>}
        </CardContent>
      </Card>
    </AdminShell>
  );
};

export default AdminFdUsdtControlPage;
