import { useMemo, useState } from 'react';
import { useDepositCenterFlag } from '@/lib/depositCenterFlag';
import { AdminShell } from '@/components/admin/AdminShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  ShieldCheck, Wallet, Users, PiggyBank, Landmark, BarChart3, FileText, Flag,
  CheckCircle2, XCircle, Clock, TrendingUp,
} from 'lucide-react';

type Channel = 'bdt' | 'usdt';
type ApprovalMode = 'auto' | 'manual';
type DepositRow = {
  id: string;
  user: string;
  channel: Channel | 'usdt-agent' | 'usdt-fd';
  amount: number;
  status: 'pending' | 'successful' | 'failed';
  ts: string;
};

const GATEWAYS = ['PayFastFlow', 'GOLUCKY-USDT', 'bKash', 'Nagad', 'Rocket', 'Binance Pay', 'Manual'];

const SEED_HISTORY: DepositRow[] = [
  { id: 'DEP-10001', user: 'GLU-2026-000123', channel: 'bdt', amount: 5000, status: 'successful', ts: '2026-07-06 09:12' },
  { id: 'DEP-10002', user: 'GLU-2026-000144', channel: 'usdt', amount: 250, status: 'pending', ts: '2026-07-06 09:18' },
  { id: 'DEP-10003', user: 'GLU-2026-000098', channel: 'bdt', amount: 12000, status: 'failed', ts: '2026-07-06 09:22' },
  { id: 'AG-DEP-2201', user: 'AG-000041', channel: 'usdt-agent', amount: 1000, status: 'pending', ts: '2026-07-06 09:30' },
  { id: 'FD-DEP-9001', user: 'GLU-2026-000200', channel: 'usdt-fd', amount: 500, status: 'successful', ts: '2026-07-06 09:41' },
];

const AdminDepositCentrePage = () => {
  const [flag, setFlag] = useDepositCenterFlag();
  const [audit, setAudit] = useState<string[]>([]);
  const log = (msg: string) =>
    setAudit((a) => [`${new Date().toISOString().slice(11, 19)} · ${msg}`, ...a].slice(0, 200));

  const [userBdtOn, setUserBdtOn] = useState(true);
  const [userUsdtOn, setUserUsdtOn] = useState(true);
  const [userMin, setUserMin] = useState(100);
  const [userMax, setUserMax] = useState(500000);
  const [userBonus, setUserBonus] = useState(3);
  const [userApproval, setUserApproval] = useState<ApprovalMode>('auto');

  const [agentOn, setAgentOn] = useState(true);
  const [agentRate, setAgentRate] = useState(130);
  const [agentMin, setAgentMin] = useState(100);
  const [agentMax, setAgentMax] = useState(100000);

  const [fdOn, setFdOn] = useState(true);
  const [fdPaused, setFdPaused] = useState(false);
  const [fdPlans, setFdPlans] = useState([
    { id: 'FD-30', name: '30-Day Starter', profit: 6, duration: 30, penalty: 20 },
    { id: 'FD-60', name: '60-Day Growth', profit: 14, duration: 60, penalty: 25 },
    { id: 'FD-90', name: '90-Day Prime', profit: 22, duration: 90, penalty: 30 },
    { id: 'FD-180', name: '180-Day Elite', profit: 48, duration: 180, penalty: 35 },
  ]);

  const [gwUser, setGwUser] = useState('PayFastFlow');
  const [gwAgent, setGwAgent] = useState('GOLUCKY-USDT');
  const [gwFd, setGwFd] = useState('GOLUCKY-USDT');

  const [rows, setRows] = useState<DepositRow[]>(SEED_HISTORY);
  const analytics = useMemo(() => {
    const total = rows.reduce((s, r) => s + r.amount, 0);
    const pending = rows.filter((r) => r.status === 'pending').length;
    const success = rows.filter((r) => r.status === 'successful').length;
    const failed = rows.filter((r) => r.status === 'failed').length;
    return { total, pending, success, failed };
  }, [rows]);

  const decide = (id: string, status: 'successful' | 'failed') => {
    if (!flag) return toast.warning('Feature flag OFF — simulated');
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    log(`${status.toUpperCase()} ${id}`);
    toast.success(`${id} ${status}`);
  };

  const saveUser = () => { log(`user: bdt=${userBdtOn} usdt=${userUsdtOn} min=${userMin} max=${userMax} bonus=${userBonus}% approval=${userApproval}`); toast.success('User Deposit saved'); };
  const saveAgent = () => { log(`agent: on=${agentOn} rate=${agentRate} min=${agentMin} max=${agentMax}`); toast.success('Agent Deposit saved'); };
  const saveFd = () => { log(`fd: on=${fdOn} paused=${fdPaused} plans=${fdPlans.length}`); toast.success('Fixed Deposit saved'); };
  const saveGateways = () => { log(`gateways: user=${gwUser} agent=${gwAgent} fd=${gwFd}`); toast.success('Gateway assignment saved'); };

  return (
    <AdminShell
      title="Deposit Centre"
      description="Master control for User, Agent, and Fixed Deposits — channels, limits, bonuses, approvals, gateways, analytics."
    >
      <Card className="mb-4 border-amber-500/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Flag className="h-4 w-4" /> Feature Flag · <code className="text-xs">deposit_center_enabled</code>
            </span>
            <div className="flex items-center gap-3">
              <Badge variant={flag ? 'default' : 'secondary'}>{flag ? 'LIVE' : 'DISABLED'}</Badge>
              <Switch checked={flag} onCheckedChange={(v) => { setFlag(v); log(`deposit_center_enabled=${v}`); }} />
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {!flag ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Deposit Centre is <b>disabled</b>. All tabs and the sidebar menu are hidden until
            <code className="mx-1">deposit_center_enabled</code> is turned on.
          </CardContent>
        </Card>
      ) : (
      <Tabs defaultValue="user" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="user"><Wallet className="h-4 w-4 mr-1" />User</TabsTrigger>
          <TabsTrigger value="agent"><Users className="h-4 w-4 mr-1" />Agent</TabsTrigger>
          <TabsTrigger value="fd"><PiggyBank className="h-4 w-4 mr-1" />Fixed Deposit</TabsTrigger>
          <TabsTrigger value="gateway"><Landmark className="h-4 w-4 mr-1" />Gateways</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-1" />Analytics</TabsTrigger>
          <TabsTrigger value="audit"><FileText className="h-4 w-4 mr-1" />Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="user">
          <div className="grid gap-3 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Channels</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between"><Label>BDT Deposit</Label><Switch checked={userBdtOn} onCheckedChange={setUserBdtOn} /></div>
                <div className="flex items-center justify-between"><Label>USDT Deposit</Label><Switch checked={userUsdtOn} onCheckedChange={setUserUsdtOn} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Min Amount (৳)</Label><Input type="number" value={userMin} onChange={(e) => setUserMin(+e.target.value)} /></div>
                  <div><Label className="text-xs">Max Amount (৳)</Label><Input type="number" value={userMax} onChange={(e) => setUserMax(+e.target.value)} /></div>
                </div>
                <div><Label className="text-xs">Bonus %</Label><Input type="number" value={userBonus} onChange={(e) => setUserBonus(+e.target.value)} /></div>
                <div>
                  <Label className="text-xs">Approval Mode</Label>
                  <Select value={userApproval} onValueChange={(v: ApprovalMode) => setUserApproval(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto Approve</SelectItem>
                      <SelectItem value="manual">Manual Approve</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" onClick={saveUser}><ShieldCheck className="h-4 w-4 mr-1" />Save</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">User Deposit History</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>User</TableHead><TableHead>Ch.</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {rows.filter((r) => r.channel === 'bdt' || r.channel === 'usdt').map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.id}</TableCell>
                        <TableCell className="font-mono text-xs">{r.user}</TableCell>
                        <TableCell className="uppercase text-xs">{r.channel}</TableCell>
                        <TableCell>৳{r.amount.toLocaleString()}</TableCell>
                        <TableCell><Badge variant={r.status === 'successful' ? 'default' : r.status === 'failed' ? 'destructive' : 'secondary'}>{r.status}</Badge></TableCell>
                        <TableCell>
                          {r.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => decide(r.id, 'successful')}>Approve</Button>
                              <Button size="sm" variant="destructive" onClick={() => decide(r.id, 'failed')}>Reject</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agent">
          <div className="grid gap-3 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">USDT-Only Controls</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between"><Label>Enable Agent Deposit</Label><Switch checked={agentOn} onCheckedChange={setAgentOn} /></div>
                <div><Label className="text-xs">Rate (1 USDT = ৳)</Label><Input type="number" value={agentRate} onChange={(e) => setAgentRate(+e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Min USDT</Label><Input type="number" value={agentMin} onChange={(e) => setAgentMin(+e.target.value)} /></div>
                  <div><Label className="text-xs">Max USDT</Label><Input type="number" value={agentMax} onChange={(e) => setAgentMax(+e.target.value)} /></div>
                </div>
                <Button size="sm" onClick={saveAgent}><ShieldCheck className="h-4 w-4 mr-1" />Save</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Agent Deposit History</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Agent</TableHead><TableHead>USDT</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {rows.filter((r) => r.channel === 'usdt-agent').map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.id}</TableCell>
                        <TableCell className="font-mono text-xs">{r.user}</TableCell>
                        <TableCell>{r.amount}</TableCell>
                        <TableCell><Badge variant={r.status === 'successful' ? 'default' : r.status === 'failed' ? 'destructive' : 'secondary'}>{r.status}</Badge></TableCell>
                        <TableCell>
                          {r.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => decide(r.id, 'successful')}>Approve</Button>
                              <Button size="sm" variant="destructive" onClick={() => decide(r.id, 'failed')}>Reject</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fd">
          <div className="grid gap-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Fixed Deposit Controls (USDT Only)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2"><Label>Enabled</Label><Switch checked={fdOn} onCheckedChange={setFdOn} /></div>
                  <div className="flex items-center gap-2"><Label>Paused</Label><Switch checked={fdPaused} onCheckedChange={(v) => { setFdPaused(v); log(`fd_paused=${v}`); }} /></div>
                  <Button size="sm" onClick={saveFd}><ShieldCheck className="h-4 w-4 mr-1" />Save</Button>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Plan</TableHead><TableHead>Name</TableHead><TableHead>Profit %</TableHead><TableHead>Duration (days)</TableHead><TableHead>Early Withdrawal Penalty %</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {fdPlans.map((p, i) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.id}</TableCell>
                        <TableCell><Input value={p.name} onChange={(e) => setFdPlans((ps) => ps.map((x, xi) => xi === i ? { ...x, name: e.target.value } : x))} /></TableCell>
                        <TableCell><Input type="number" value={p.profit} onChange={(e) => setFdPlans((ps) => ps.map((x, xi) => xi === i ? { ...x, profit: +e.target.value } : x))} /></TableCell>
                        <TableCell><Input type="number" value={p.duration} onChange={(e) => setFdPlans((ps) => ps.map((x, xi) => xi === i ? { ...x, duration: +e.target.value } : x))} /></TableCell>
                        <TableCell><Input type="number" value={p.penalty} onChange={(e) => setFdPlans((ps) => ps.map((x, xi) => xi === i ? { ...x, penalty: +e.target.value } : x))} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gateway">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Payment Gateway Assignment</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {[
                { label: 'User Deposit', value: gwUser, set: setGwUser },
                { label: 'Agent Deposit', value: gwAgent, set: setGwAgent },
                { label: 'Fixed Deposit', value: gwFd, set: setGwFd },
              ].map((f) => (
                <div key={f.label}>
                  <Label className="text-xs">{f.label}</Label>
                  <Select value={f.value} onValueChange={f.set}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GATEWAYS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <div className="md:col-span-3"><Button size="sm" onClick={saveGateways}><ShieldCheck className="h-4 w-4 mr-1" />Save Assignment</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-3 md:grid-cols-4">
            <StatCard icon={TrendingUp} label="Total Deposits" value={`৳${analytics.total.toLocaleString()}`} tone="text-emerald-500" />
            <StatCard icon={Clock} label="Pending" value={analytics.pending} tone="text-amber-500" />
            <StatCard icon={CheckCircle2} label="Successful" value={analytics.success} tone="text-emerald-500" />
            <StatCard icon={XCircle} label="Failed" value={analytics.failed} tone="text-rose-500" />
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Audit Log ({audit.length})</CardTitle></CardHeader>
            <CardContent className="max-h-96 overflow-auto text-xs font-mono">
              {audit.length === 0 ? <p className="text-muted-foreground">No actions yet.</p> : <ul className="space-y-1">{audit.map((a, i) => <li key={i}>{a}</li>)}</ul>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}
    </AdminShell>
  );
};

const StatCard = ({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string | number; tone: string }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-2xl font-bold ${tone}`}>{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${tone} opacity-50`} />
      </div>
    </CardContent>
  </Card>
);

export default AdminDepositCentrePage;
