import { useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { ShieldCheck, Plus, Trash2, RotateCcw, ArrowUp, ArrowDown, History } from 'lucide-react';

type GwType = 'USDT' | 'bKash' | 'Nagad' | 'Rocket' | 'Upay' | 'Binance Pay' | 'Manual';
type Gw = {
  id: string;
  name: string;
  type: GwType;
  logo: string;
  apiKey: string;
  secret: string;
  webhook: string;
  callback: string;
  mode: 'test' | 'live';
  maintenance: boolean;
  enabled: boolean;
  priority: number;
};
type Version = { ts: string; snapshot: Gw[] };

const SEED: Gw[] = [
  { id: 'gw-payfast', name: 'PayFastFlow', type: 'bKash', logo: '/logos/bkash.png', apiKey: 'pk_***', secret: 'sk_***', webhook: '/api/webhook/payfast', callback: '/api/callback/payfast', mode: 'live', maintenance: false, enabled: true, priority: 1 },
  { id: 'gw-usdt', name: 'USDT TRC20', type: 'USDT', logo: '/logos/usdt.png', apiKey: '', secret: '', webhook: '/api/webhook/usdt', callback: '/api/callback/usdt', mode: 'live', maintenance: false, enabled: true, priority: 2 },
  { id: 'gw-binance', name: 'Binance Pay', type: 'Binance Pay', logo: '/logos/binance.png', apiKey: 'bn_***', secret: 'bns_***', webhook: '/api/webhook/binance', callback: '/api/callback/binance', mode: 'test', maintenance: false, enabled: false, priority: 3 },
];

const AdminPaymentGatewayManagerPage = () => {
  const [flag, setFlag] = useState(false);
  const [gws, setGws] = useState<Gw[]>(SEED);
  const [versions, setVersions] = useState<Version[]>([]);
  const [audit, setAudit] = useState<string[]>([]);

  const log = (m: string) => setAudit((a) => [`${new Date().toISOString().slice(11, 19)} · ${m}`, ...a].slice(0, 200));
  const snapshot = (label: string) => { setVersions((v) => [{ ts: new Date().toISOString(), snapshot: JSON.parse(JSON.stringify(gws)) }, ...v].slice(0, 20)); log(`snapshot ${label}`); };

  const update = (id: string, patch: Partial<Gw>) => { setGws((g) => g.sort((a,b)=>a.priority-b.priority).map((x) => (x.id === id ? { ...x, ...patch } : x))); log(`update ${id}`); };
  const add = () => { snapshot('pre-add'); const id = `gw-${Math.floor(Math.random()*9999)}`; setGws((g) => [...g, { id, name: 'New Gateway', type: 'Manual', logo: '', apiKey: '', secret: '', webhook: '', callback: '', mode: 'test', maintenance: false, enabled: false, priority: g.length + 1 }]); log(`add ${id}`); };
  const del = (id: string) => { snapshot('pre-delete'); setGws((g) => g.filter((x) => x.id !== id)); log(`delete ${id}`); };
  const move = (id: string, dir: -1 | 1) => { setGws((g) => { const arr = [...g].sort((a, b) => a.priority - b.priority); const i = arr.findIndex((x) => x.id === id); const j = i + dir; if (j < 0 || j >= arr.length) return g; [arr[i].priority, arr[j].priority] = [arr[j].priority, arr[i].priority]; return arr; }); log(`reorder ${id}`); };
  const rollback = (v: Version) => { setGws(v.snapshot); log(`rollback ${v.ts.slice(11,19)}`); toast.success('Rolled back'); };

  const testTx = (g: Gw) => {
    if (!flag) return toast.warning(`Test transaction simulated (flag OFF) — ${g.name}`);
    if (g.maintenance) return toast.warning(`${g.name} in maintenance`);
    log(`test_tx ${g.id}`);
    toast.success(`Test TX OK — ${g.name} [${g.mode}]`);
  };

  return (
    <AdminShell title="Payment Gateway Manager" description="Add, edit, and 1-click enable/disable all payment gateways.">
      <Card className="mb-4 border-amber-500/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Master Feature Flag</span>
            <div className="flex items-center gap-3">
              <Badge variant={flag ? 'default' : 'secondary'}>{flag ? 'LIVE' : 'SAFE MODE'}</Badge>
              <Switch checked={flag} onCheckedChange={(v) => { setFlag(v); log(`feature_flag ${v ? 'ON' : 'OFF'}`); }} />
              <Button size="sm" onClick={add}><Plus className="mr-1 h-3 w-3" /> Add Gateway</Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-3">
        {[...gws].sort((a, b) => a.priority - b.priority).map((g) => (
          <Card key={g.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted text-xs">
                  {g.logo ? <img src={g.logo} alt="" className="h-full w-full rounded object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} /> : g.type[0]}
                </div>
                <div>
                  <CardTitle className="text-sm">{g.name}</CardTitle>
                  <div className="mt-1 flex gap-1.5">
                    <Badge variant="outline">{g.type}</Badge>
                    <Badge variant={g.mode === 'live' ? 'default' : 'secondary'}>{g.mode.toUpperCase()}</Badge>
                    {g.maintenance && <Badge variant="destructive">MAINTENANCE</Badge>}
                    <Badge variant="outline">Priority {g.priority}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={() => move(g.id, -1)}><ArrowUp className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" onClick={() => move(g.id, 1)}><ArrowDown className="h-3 w-3" /></Button>
                <Switch checked={g.enabled} onCheckedChange={(v) => update(g.id, { enabled: v })} />
                <Button size="sm" variant="ghost" onClick={() => del(g.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div><Label className="text-xs">Name</Label><Input value={g.name} onChange={(e) => update(g.id, { name: e.target.value })} /></div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={g.type} onValueChange={(v) => update(g.id, { type: v as GwType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(['USDT','bKash','Nagad','Rocket','Upay','Binance Pay','Manual'] as GwType[]).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Logo URL</Label><Input value={g.logo} onChange={(e) => update(g.id, { logo: e.target.value })} /></div>
              <div><Label className="text-xs">API Key</Label><Input value={g.apiKey} onChange={(e) => update(g.id, { apiKey: e.target.value })} /></div>
              <div><Label className="text-xs">Secret Key</Label><Input type="password" value={g.secret} onChange={(e) => update(g.id, { secret: e.target.value })} /></div>
              <div><Label className="text-xs">Webhook URL</Label><Input value={g.webhook} onChange={(e) => update(g.id, { webhook: e.target.value })} /></div>
              <div><Label className="text-xs">Callback URL</Label><Input value={g.callback} onChange={(e) => update(g.id, { callback: e.target.value })} /></div>
              <div className="flex items-end gap-3">
                <div className="flex items-center gap-2"><Label className="text-xs">Live</Label><Switch checked={g.mode === 'live'} onCheckedChange={(v) => update(g.id, { mode: v ? 'live' : 'test' })} /></div>
                <div className="flex items-center gap-2"><Label className="text-xs">Maint.</Label><Switch checked={g.maintenance} onCheckedChange={(v) => update(g.id, { maintenance: v })} /></div>
                <Button size="sm" variant="outline" onClick={() => testTx(g)}>Test TX</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><History className="h-4 w-4" /> Version History ({versions.length})</CardTitle></CardHeader>
          <CardContent className="max-h-56 overflow-auto text-xs">
            {versions.length === 0 ? <p className="text-muted-foreground">No snapshots yet.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Gateways</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>{versions.map((v, i) => (
                  <TableRow key={i}><TableCell className="font-mono">{v.ts.slice(0, 19)}</TableCell><TableCell>{v.snapshot.length}</TableCell><TableCell><Button size="sm" variant="ghost" onClick={() => rollback(v)}><RotateCcw className="mr-1 h-3 w-3" />Rollback</Button></TableCell></TableRow>
                ))}</TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Audit ({audit.length})</CardTitle></CardHeader>
          <CardContent className="max-h-56 overflow-auto text-xs font-mono">
            {audit.length === 0 ? <p className="text-muted-foreground">No actions yet.</p> : <ul className="space-y-1">{audit.map((a, i) => <li key={i}>{a}</li>)}</ul>}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
};

export default AdminPaymentGatewayManagerPage;
