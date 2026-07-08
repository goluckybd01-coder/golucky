import { useState, useMemo } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertTriangle, ShieldCheck, Activity, RotateCcw } from 'lucide-react';

type Channel = {
  id: string;
  name: string;
  scope: 'user' | 'agent' | 'fd' | 'usdt' | 'bdt' | 'mobile';
  enabled: boolean;
  min: number;
  max: number;
  feePct: number;
  bonusPct: number;
  autoApprove: boolean;
  webhookOk: boolean;
  health: 'ok' | 'degraded' | 'down';
};

const SEED: Channel[] = [
  { id: 'user-bdt', name: 'User Deposit (BDT)', scope: 'user', enabled: true, min: 100, max: 500000, feePct: 0, bonusPct: 0, autoApprove: true, webhookOk: true, health: 'ok' },
  { id: 'user-usdt', name: 'User Deposit (USDT)', scope: 'user', enabled: true, min: 10, max: 50000, feePct: 0, bonusPct: 3, autoApprove: true, webhookOk: true, health: 'ok' },
  { id: 'agent-usdt', name: 'Agent Deposit (USDT only)', scope: 'agent', enabled: true, min: 100, max: 100000, feePct: 0, bonusPct: 0, autoApprove: false, webhookOk: true, health: 'ok' },
  { id: 'fd-usdt', name: 'Fixed Deposit (USDT only)', scope: 'fd', enabled: true, min: 500, max: 1000000, feePct: 0, bonusPct: 0, autoApprove: false, webhookOk: true, health: 'ok' },
  { id: 'bkash', name: 'Mobile Banking - bKash', scope: 'mobile', enabled: true, min: 100, max: 25000, feePct: 1.85, bonusPct: 0, autoApprove: true, webhookOk: true, health: 'ok' },
  { id: 'nagad', name: 'Mobile Banking - Nagad', scope: 'mobile', enabled: true, min: 100, max: 25000, feePct: 1.5, bonusPct: 0, autoApprove: true, webhookOk: true, health: 'ok' },
  { id: 'rocket', name: 'Mobile Banking - Rocket', scope: 'mobile', enabled: true, min: 100, max: 25000, feePct: 1.5, bonusPct: 0, autoApprove: true, webhookOk: false, health: 'degraded' },
  { id: 'upay', name: 'Mobile Banking - Upay', scope: 'mobile', enabled: false, min: 100, max: 25000, feePct: 1.5, bonusPct: 0, autoApprove: true, webhookOk: true, health: 'ok' },
];

const AdminDepositControlPage = () => {
  const [flag, setFlag] = useState(false);
  const [channels, setChannels] = useState<Channel[]>(SEED);
  const [audit, setAudit] = useState<Array<{ ts: string; action: string; target: string }>>([]);
  const [tab, setTab] = useState<'all' | Channel['scope']>('all');

  const log = (action: string, target: string) =>
    setAudit((a) => [{ ts: new Date().toISOString(), action, target }, ...a].slice(0, 200));

  const update = (id: string, patch: Partial<Channel>) => {
    setChannels((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    log('update', id);
  };

  const visible = useMemo(
    () => channels.filter((c) => tab === 'all' || c.scope === tab),
    [channels, tab],
  );

  const runHealth = () => {
    setChannels((cs) => cs.map((c) => ({ ...c, health: c.webhookOk ? 'ok' : 'degraded' })));
    log('health_check', 'all');
    toast.success('Gateway health check complete');
  };

  const testTx = (c: Channel) => {
    if (!flag) return toast.warning(`Test transaction simulated (feature flag OFF) — ${c.name}`);
    log('test_transaction', c.id);
    toast.success(`Test transaction OK — ${c.name} ৳${c.min}`);
  };

  return (
    <AdminShell
      title="Deposit Centre Control"
      description="1-click gateway controls for every deposit channel"
    >
      <Card className="mb-4 border-amber-500/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Master Feature Flag
            </span>
            <div className="flex items-center gap-3">
              <Badge variant={flag ? 'default' : 'secondary'}>{flag ? 'LIVE' : 'SAFE MODE'}</Badge>
              <Switch
                checked={flag}
                onCheckedChange={(v) => {
                  setFlag(v);
                  log('feature_flag', v ? 'enabled' : 'disabled');
                }}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          When OFF, all channel edits are staged only and no live deposits are affected. Enable to
          apply changes to production gateways.
        </CardContent>
      </Card>

      <div className="mb-3 flex items-center justify-between gap-2">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="user">User</TabsTrigger>
            <TabsTrigger value="agent">Agent</TabsTrigger>
            <TabsTrigger value="fd">Fixed Deposit</TabsTrigger>
            <TabsTrigger value="mobile">Mobile Banking</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" variant="outline" onClick={runHealth}>
          <Activity className="mr-2 h-4 w-4" /> Health Check
        </Button>
      </div>

      <div className="grid gap-3">
        {visible.map((c) => (
          <Card key={c.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm">{c.name}</CardTitle>
                <div className="mt-1 flex gap-1.5">
                  <Badge variant="outline" className="uppercase">{c.scope}</Badge>
                  <Badge variant={c.health === 'ok' ? 'default' : c.health === 'degraded' ? 'secondary' : 'destructive'}>
                    {c.health}
                  </Badge>
                  <Badge variant={c.webhookOk ? 'default' : 'destructive'}>
                    webhook {c.webhookOk ? 'OK' : 'FAIL'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Enabled</span>
                <Switch checked={c.enabled} onCheckedChange={(v) => update(c.id, { enabled: v })} />
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-6">
              <div>
                <Label className="text-xs">Min ৳</Label>
                <Input type="number" value={c.min} onChange={(e) => update(c.id, { min: +e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Max ৳</Label>
                <Input type="number" value={c.max} onChange={(e) => update(c.id, { max: +e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Fee %</Label>
                <Input type="number" step="0.1" value={c.feePct} onChange={(e) => update(c.id, { feePct: +e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Bonus %</Label>
                <Input type="number" step="0.1" value={c.bonusPct} onChange={(e) => update(c.id, { bonusPct: +e.target.value })} />
              </div>
              <div className="flex items-end gap-2">
                <div>
                  <Label className="text-xs">Auto-approve</Label>
                  <Switch checked={c.autoApprove} onCheckedChange={(v) => update(c.id, { autoApprove: v })} />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <Button size="sm" variant="outline" onClick={() => testTx(c)}>Test TX</Button>
                <Button size="sm" variant="ghost" onClick={() => { update(c.id, SEED.find(s => s.id === c.id)!); toast.info('Reset'); }}>
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" /> Audit Log ({audit.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-64 overflow-auto text-xs">
          {audit.length === 0 ? (
            <p className="text-muted-foreground">No actions yet.</p>
          ) : (
            <ul className="space-y-1 font-mono">
              {audit.map((a, i) => (
                <li key={i}>
                  <span className="text-muted-foreground">{a.ts.slice(11, 19)}</span> · {a.action} → {a.target}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
};

export default AdminDepositControlPage;
