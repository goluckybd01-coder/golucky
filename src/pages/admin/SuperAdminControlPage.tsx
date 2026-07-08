import { useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { PageErrorBoundary } from '@/components/PageErrorBoundary';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ShieldAlert, Wallet, Users, UserCog, FileText, AlertTriangle, ShieldCheck, Search,
} from 'lucide-react';

type WalletKind = 'user' | 'agent' | 'bonus';
type Direction = 'add' | 'remove';
type AgentAction = 'convert' | 'suspend' | 'approve' | 'reject';

interface UserRow {
  user_id: string;
  glu_user_id: string;
  username: string | null;
  phone: string | null;
  agent_status: string | null;
  agent_tier: string | null;
  balance: number;
  commission_balance: number;
  bonus_balance: number;
}

interface LedgerRow {
  id: string;
  created_at: string;
  user_id: string;
  ledger_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_id: string | null;
  meta: any;
}

interface AuditRow {
  id: string;
  created_at: string;
  action: string;
  target_id: string | null;
  new_value: any;
}

const SuperAdminControlInner = () => {
  const { isSuperAdmin, isLoading } = useIsSuperAdmin();

  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => users.find((u) => u.user_id === selectedId) ?? null, [users, selectedId]);

  const [wallet, setWallet] = useState<WalletKind>('user');
  const [direction, setDirection] = useState<Direction>('add');
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [totp, setTotp] = useState('');
  const [pending, setPending] = useState<null | ((code: string) => Promise<void>)>(null);
  const [busy, setBusy] = useState(false);

  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);

  const runSearch = async () => {
    try {
      const q = query.trim().replace(/[,()]/g, '');
      let pq = supabase
        .from('profiles')
        .select('user_id, glu_user_id, username, phone, agent_status, agent_tier')
        .limit(20);
      if (q) {
        pq = pq.or(`glu_user_id.ilike.%${q}%,username.ilike.%${q}%,phone.ilike.%${q}%`);
      }
      const { data: profs, error } = await pq;
      if (error) { toast.error(error.message); return; }
      if (!profs?.length) { setUsers([]); return; }
      const ids = profs.map((p: any) => p?.user_id).filter(Boolean);
      const { data: ws } = ids.length
        ? await supabase
            .from('wallets')
            .select('user_id, balance, commission_balance, bonus_balance')
            .in('user_id', ids)
        : { data: [] as any[] };
      const map = new Map((ws ?? []).map((w: any) => [w.user_id, w]));
      const rows: UserRow[] = profs.map((p: any) => ({
        user_id: p?.user_id ?? '',
        glu_user_id: p?.glu_user_id ?? '—',
        username: p?.username ?? null,
        phone: p?.phone ?? null,
        agent_status: p?.agent_status ?? null,
        agent_tier: p?.agent_tier ?? null,
        balance: Number(map.get(p?.user_id)?.balance ?? 0),
        commission_balance: Number(map.get(p?.user_id)?.commission_balance ?? 0),
        bonus_balance: Number(map.get(p?.user_id)?.bonus_balance ?? 0),
      })).filter((r) => r.user_id);
      setUsers(rows);
      if (!selectedId && rows[0]) setSelectedId(rows[0].user_id);
    } catch (e: any) {
      console.error('[SuperAdmin] runSearch failed', e);
      toast.error('Failed to load users');
      setUsers([]);
    }
  };

  const loadLedger = async () => {
    try {
      const { data } = await supabase
        .from('wallet_ledger')
        .select('id,created_at,user_id,ledger_type,amount,balance_before,balance_after,reference_id,meta')
        .like('reference_id', 'SUPERADMIN-%')
        .order('created_at', { ascending: false })
        .limit(100);
      setLedger((data as any) ?? []);
    } catch (e) {
      console.error('[SuperAdmin] loadLedger failed', e);
      setLedger([]);
    }
  };

  const loadAudit = async () => {
    try {
      const { data } = await supabase
        .from('staff_audit_logs')
        .select('id,created_at,action,target_id,new_value')
        .like('action', 'super_admin.%')
        .order('created_at', { ascending: false })
        .limit(200);
      setAudit((data as any) ?? []);
    } catch (e) {
      console.error('[SuperAdmin] loadAudit failed', e);
      setAudit([]);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      runSearch();
      loadLedger();
      loadAudit();
    }
  }, [isSuperAdmin]);

  if (isLoading) {
    return <AdminShell title="Super Admin Control"><p className="p-6 text-sm text-muted-foreground">Verifying role…</p></AdminShell>;
  }
  if (!isSuperAdmin) {
    return (
      <AdminShell title="Super Admin Control">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            This module is restricted to <b>super_admin</b> accounts. Normal admins, staff, agents, and users cannot access it.
          </AlertDescription>
        </Alert>
      </AdminShell>
    );
  }

  const requestConfirm = (action: (code: string) => Promise<void>) => {
    if (!reason.trim() || reason.trim().length < 8) {
      toast.error('Reason is mandatory (min 8 chars)');
      return;
    }
    setTotp('');
    setPending(() => action);
    setConfirmOpen(true);
  };

  const runConfirmed = async () => {
    if (!totp || totp.length < 6) { toast.error('Enter 6-digit TOTP code'); return; }
    if (!pending) return;
    setBusy(true);
    try {
      await pending(totp);
      setConfirmOpen(false);
      setPending(null);
      setReason('');
      await Promise.all([runSearch(), loadLedger(), loadAudit()]);
    } finally {
      setBusy(false);
    }
  };

  const invokeBackend = async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('super-admin-execute', { body: payload });
    if (error) { toast.error(error.message); throw error; }
    if ((data as any)?.error) { toast.error((data as any).message ?? (data as any).error); throw new Error((data as any).error); }
    toast.success('Action executed · ledger + audit written');
    return data;
  };

  const submitBalance = () => {
    if (!selected) return toast.error('Select a user');
    if (!amount || amount <= 0) return toast.error('Amount > 0 required');
    requestConfirm(async (code) => {
      await invokeBackend({
        action: 'balance_adjust',
        targetUserId: selected.user_id,
        wallet, direction, amount, reason, totp: code,
      });
    });
  };

  const submitAgent = (agentAction: AgentAction) => {
    if (!selected) return toast.error('Select a user');
    requestConfirm(async (code) => {
      await invokeBackend({
        action: 'agent_action',
        targetUserId: selected.user_id,
        agentAction, reason, totp: code,
      });
    });
  };

  return (
    <AdminShell
      title="Super Admin Control"
      description="Emergency / manual override. All actions require role=super_admin + TOTP, and write wallet_ledger + staff_audit_logs. Does not affect normal deposit/withdraw flow."
    >
      <Alert className="mb-4 border-amber-500/50">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Danger Zone · Backend-Wired</AlertTitle>
        <AlertDescription>
          Every action calls the <code>super-admin-execute</code> edge function which verifies your super_admin role, a valid TOTP code, a reason (≥8 chars), and enforces a 3-ops/30s rate limit. Confirmed writes hit real wallets + ledger.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="balance" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="balance"><Wallet className="h-4 w-4 mr-1" />Balance Override</TabsTrigger>
          <TabsTrigger value="agent"><UserCog className="h-4 w-4 mr-1" />Agent Override</TabsTrigger>
          <TabsTrigger value="ledger"><ShieldCheck className="h-4 w-4 mr-1" />Ledger Safety</TabsTrigger>
          <TabsTrigger value="audit"><FileText className="h-4 w-4 mr-1" />Audit</TabsTrigger>
        </TabsList>

        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Input
              placeholder="Search by GLU ID / username / phone…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            />
            <Button variant="outline" onClick={runSearch}><Search className="h-4 w-4 mr-1" /> Search</Button>
            <Select value={selectedId ?? ''} onValueChange={setSelectedId}>
              <SelectTrigger className="w-72"><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.user_id} value={u.user_id}>
                    {u.glu_user_id} · {u.username ?? '—'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <TabsContent value="balance">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Balance Override — {selected?.glu_user_id ?? '—'}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <div>
                <Label className="text-xs">Wallet</Label>
                <Select value={wallet} onValueChange={(v: WalletKind) => setWallet(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User Wallet (BDT)</SelectItem>
                    <SelectItem value="agent">Agent Wallet (commission)</SelectItem>
                    <SelectItem value="bonus">Bonus Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Direction</Label>
                <Select value={direction} onValueChange={(v: Direction) => setDirection(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add (+)</SelectItem>
                    <SelectItem value="remove">Remove (−)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Amount (৳)</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(+e.target.value)} />
              </div>
              <div className="md:col-span-4">
                <Label className="text-xs">Reason (required, min 8 chars)</Label>
                <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Refund for stuck deposit #DEP-10099 approved by Finance" />
              </div>
              <div className="md:col-span-4 flex items-center gap-3">
                <Button variant="destructive" onClick={submitBalance} disabled={busy}>
                  <ShieldAlert className="h-4 w-4 mr-1" /> Submit Override
                </Button>
                {selected && (
                  <p className="text-xs text-muted-foreground">
                    Current — Balance: ৳{selected.balance.toLocaleString()} · Agent: ৳{selected.commission_balance.toLocaleString()} · Bonus: ৳{selected.bonus_balance.toLocaleString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agent">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Agent Override — {selected?.glu_user_id ?? '—'}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {!selected ? <p className="text-sm text-muted-foreground">Select a user.</p> : (
                <>
                  <div>
                    <Label className="text-xs">Current</Label>
                    <p className="text-sm">
                      Status: <Badge>{selected.agent_status ?? 'none'}</Badge> · Tier: {selected.agent_tier ?? '—'}
                    </p>
                  </div>
                  <div className="md:col-span-3">
                    <Label className="text-xs">Reason (required, min 8 chars)</Label>
                    <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Promote verified user to agent, ref ticket #4521" />
                  </div>
                  <div className="md:col-span-3 flex flex-wrap gap-2">
                    <Button onClick={() => submitAgent('convert')} disabled={busy}>Convert → Agent</Button>
                    <Button onClick={() => submitAgent('approve')} disabled={busy}>Approve</Button>
                    <Button variant="destructive" onClick={() => submitAgent('suspend')} disabled={busy}>Suspend</Button>
                    <Button variant="destructive" onClick={() => submitAgent('reject')} disabled={busy}>Reject</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm">Wallet Ledger — Super Admin Overrides ({ledger.length})</CardTitle>
              <Button size="sm" variant="outline" onClick={loadLedger}>Refresh</Button>
            </CardHeader>
            <CardContent>
              {ledger.length === 0 ? <p className="text-xs text-muted-foreground">No override entries.</p> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Time</TableHead><TableHead>User</TableHead><TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead><TableHead>Before</TableHead><TableHead>After</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {ledger.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs">{new Date(e.created_at).toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-xs">{e.user_id.slice(0, 8)}…</TableCell>
                        <TableCell>{e.ledger_type}</TableCell>
                        <TableCell>৳{Number(e.amount).toLocaleString()}</TableCell>
                        <TableCell>৳{Number(e.balance_before).toLocaleString()}</TableCell>
                        <TableCell className="font-semibold">৳{Number(e.balance_after).toLocaleString()}</TableCell>
                        <TableCell className="text-xs max-w-xs truncate" title={e.meta?.reason}>{e.meta?.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm">Audit Log ({audit.length})</CardTitle>
              <Button size="sm" variant="outline" onClick={loadAudit}>Refresh</Button>
            </CardHeader>
            <CardContent className="max-h-96 overflow-auto text-xs font-mono">
              {audit.length === 0 ? <p className="text-muted-foreground">No actions yet.</p> : (
                <ul className="space-y-1">
                  {audit.map((a) => (
                    <li key={a.id}>
                      [{new Date(a.created_at).toLocaleTimeString()}] <b>{a.action}</b> → {a.target_id?.slice(0, 8)}… · {JSON.stringify(a.new_value)}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={confirmOpen} onOpenChange={(o) => !busy && setConfirmOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" /> Confirm with 2FA
            </DialogTitle>
            <DialogDescription>
              This action writes to production wallets + ledger. Enter the 6-digit TOTP code from your authenticator to proceed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
              <p><b>Reason:</b> {reason}</p>
            </div>
            <div>
              <Label className="text-xs">TOTP Code</Label>
              <Input type="text" inputMode="numeric" maxLength={6} value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456" autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={busy}>Cancel</Button>
            <Button variant="destructive" onClick={runConfirmed} disabled={busy}>
              {busy ? 'Executing…' : 'Confirm & Execute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
};

const SuperAdminControlPage = () => (
  <PageErrorBoundary title="Super Admin Control failed to load">
    <SuperAdminControlInner />
  </PageErrorBoundary>
);

export default SuperAdminControlPage;
