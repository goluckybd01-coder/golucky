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
import { ShieldCheck } from 'lucide-react';

type Dep = { id: string; agent: string; usdt: number; bdt: number; status: 'pending' | 'approved' | 'rejected'; ts: string };

const SEED: Dep[] = [
  { id: 'AG-DEP-0001', agent: 'AG-000123', usdt: 500, bdt: 65000, status: 'pending', ts: '2026-07-06 08:10' },
  { id: 'AG-DEP-0002', agent: 'AG-000087', usdt: 250, bdt: 32500, status: 'pending', ts: '2026-07-06 07:52' },
  { id: 'AG-DEP-0003', agent: 'AG-000041', usdt: 1000, bdt: 130000, status: 'approved', ts: '2026-07-06 06:20' },
];

const AdminAgentUsdtDepositPage = () => {
  const [flag, setFlag] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [minUsdt, setMinUsdt] = useState(100);
  const [maxUsdt, setMaxUsdt] = useState(100000);
  const [rate, setRate] = useState(130);
  const [deps, setDeps] = useState<Dep[]>(SEED);
  const [audit, setAudit] = useState<string[]>([]);

  const log = (msg: string) => setAudit((a) => [`${new Date().toISOString().slice(11, 19)} · ${msg}`, ...a].slice(0, 100));

  const decide = (id: string, status: 'approved' | 'rejected') => {
    if (!flag) return toast.warning('Feature flag OFF — decision simulated only');
    setDeps((ds) => ds.map((d) => (d.id === id ? { ...d, status } : d)));
    log(`${status} ${id}`);
    toast.success(`${id} ${status}`);
  };

  return (
    <AdminShell title="Agent USDT Deposit Control" description="Agents can deposit via USDT only. Admin controls limits, rate, and approvals.">
      <Card className="mb-4 border-amber-500/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Master Feature Flag</span>
            <div className="flex items-center gap-3">
              <Badge variant={flag ? 'default' : 'secondary'}>{flag ? 'LIVE' : 'SAFE MODE'}</Badge>
              <Switch checked={flag} onCheckedChange={(v) => { setFlag(v); log(`feature_flag ${v ? 'ON' : 'OFF'}`); }} />
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Channel Controls</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Enable Agent USDT Deposit</Label>
              <Switch checked={enabled} onCheckedChange={(v) => { setEnabled(v); log(`agent_usdt ${v ? 'enabled' : 'disabled'}`); }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Min USDT</Label><Input type="number" value={minUsdt} onChange={(e) => setMinUsdt(+e.target.value)} /></div>
              <div><Label className="text-xs">Max USDT</Label><Input type="number" value={maxUsdt} onChange={(e) => setMaxUsdt(+e.target.value)} /></div>
            </div>
            <div><Label className="text-xs">Conversion Rate (1 USDT = ৳)</Label><Input type="number" value={rate} onChange={(e) => setRate(+e.target.value)} /></div>
            <Button size="sm" onClick={() => { log(`save min=${minUsdt} max=${maxUsdt} rate=${rate}`); toast.success('Saved'); }}>Save Controls</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Audit ({audit.length})</CardTitle></CardHeader>
          <CardContent className="max-h-56 overflow-auto text-xs font-mono">
            {audit.length === 0 ? <p className="text-muted-foreground">No actions yet.</p> : <ul className="space-y-1">{audit.map((a, i) => <li key={i}>{a}</li>)}</ul>}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Agent Deposit History</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Agent</TableHead><TableHead>USDT</TableHead><TableHead>BDT</TableHead><TableHead>Status</TableHead><TableHead>Time</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {deps.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs">{d.id}</TableCell>
                  <TableCell className="font-mono text-xs">{d.agent}</TableCell>
                  <TableCell>{d.usdt}</TableCell>
                  <TableCell>৳{d.bdt.toLocaleString()}</TableCell>
                  <TableCell><Badge variant={d.status === 'approved' ? 'default' : d.status === 'rejected' ? 'destructive' : 'secondary'}>{d.status}</Badge></TableCell>
                  <TableCell className="text-xs">{d.ts}</TableCell>
                  <TableCell>
                    {d.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => decide(d.id, 'approved')}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => decide(d.id, 'rejected')}>Reject</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
};

export default AdminAgentUsdtDepositPage;
