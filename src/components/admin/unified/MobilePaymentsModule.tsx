import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Smartphone, Check, X, Clock, RefreshCw, Search, ArrowUpCircle, ArrowDownCircle, Settings, Zap } from "lucide-react";
import { formatTaka } from "@/lib/currency";
import { format } from "date-fns";

interface Transaction {
  id: string;
  user_id: string;
  transaction_type: 'deposit' | 'withdraw';
  gateway_type: 'bkash' | 'nagad';
  amount: number;
  fee_amount: number;
  net_amount: number;
  sender_number?: string;
  receiver_number?: string;
  transaction_id?: string;
  reference_id: string;
  status: string;
  failure_reason?: string;
  auto_verified: boolean;
  created_at: string;
}

interface PayoutRule {
  id: string;
  rule_name: string;
  is_enabled: boolean;
  min_amount?: number;
  max_amount?: number;
  min_user_deposits?: number;
  min_user_age_days?: number;
  auto_approve: boolean;
  priority: number;
}

export function MobilePaymentsModule() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payoutRules, setPayoutRules] = useState<PayoutRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
    const channel = supabase.channel('admin_mobile_payments').on('postgres_changes', { event: '*', schema: 'public', table: 'mobile_money_transactions' }, () => loadTransactions()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [statusFilter, typeFilter]);

  const loadData = async () => { setLoading(true); await Promise.all([loadTransactions(), loadPayoutRules()]); setLoading(false); };
  const loadTransactions = async () => {
    let query = supabase.from('mobile_money_transactions').select('*').order('created_at', { ascending: false }).limit(100);
    if (statusFilter !== "all") query = query.eq('status', statusFilter);
    if (typeFilter !== "all") query = query.eq('transaction_type', typeFilter);
    const { data, error } = await query;
    if (error) { console.error('Error loading transactions:', error); return; }
    setTransactions((data || []) as Transaction[]);
  };
  const loadPayoutRules = async () => {
    const { data, error } = await supabase.from('payout_rules').select('*').order('priority', { ascending: true });
    if (error) { console.error('Error loading payout rules:', error); return; }
    setPayoutRules((data || []) as PayoutRule[]);
  };
  const handleApprove = async (transaction: Transaction) => {
    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('process-mobile-payment', { body: { action: 'approve', transaction_id: transaction.id } });
      if (error) throw error;
      toast.success('Transaction approved successfully');
      loadTransactions();
    } catch (error: any) { toast.error(error.message || 'Failed to approve transaction'); }
    finally { setProcessing(false); }
  };
  const handleReject = async () => {
    if (!selectedTransaction) return;
    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('process-mobile-payment', { body: { action: 'reject', transaction_id: selectedTransaction.id, reason: rejectReason } });
      if (error) throw error;
      toast.success('Transaction rejected');
      setShowRejectDialog(false); setSelectedTransaction(null); setRejectReason("");
      loadTransactions();
    } catch (error: any) { toast.error(error.message || 'Failed to reject transaction'); }
    finally { setProcessing(false); }
  };
  const triggerAutoProcess = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-process-payouts');
      if (error) throw error;
      toast.success(`Auto-processing complete: ${data.results.processed} processed, ${data.results.failed} failed`);
      loadTransactions();
    } catch (error: any) { toast.error(error.message || 'Failed to run auto-processing'); }
    finally { setProcessing(false); }
  };
  const togglePayoutRule = async (rule: PayoutRule) => {
    const { error } = await supabase.from('payout_rules').update({ is_enabled: !rule.is_enabled }).eq('id', rule.id);
    if (error) { toast.error('Failed to update rule'); return; }
    toast.success(`Rule ${rule.is_enabled ? 'disabled' : 'enabled'}`);
    loadPayoutRules();
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'processing': return <Badge variant="outline" className="bg-blue-500/20 text-blue-500"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>;
      case 'completed': return <Badge variant="outline" className="bg-green-500/20 text-green-500"><Check className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'failed': return <Badge variant="outline" className="bg-red-500/20 text-red-500"><X className="w-3 h-3 mr-1" /> Failed</Badge>;
      case 'cancelled': return <Badge variant="outline" className="bg-gray-500/20 text-gray-500">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };
  const filteredTransactions = transactions.filter(tx => tx.reference_id.toLowerCase().includes(searchTerm.toLowerCase()) || tx.sender_number?.includes(searchTerm) || tx.receiver_number?.includes(searchTerm));
  const stats = {
    pending: transactions.filter(t => t.status === 'pending').length,
    processing: transactions.filter(t => t.status === 'processing').length,
    completed: transactions.filter(t => t.status === 'completed').length,
    totalDeposits: transactions.filter(t => t.transaction_type === 'deposit' && t.status === 'completed').reduce((sum, t) => sum + t.net_amount, 0),
    totalWithdrawals: transactions.filter(t => t.transaction_type === 'withdraw' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0)
  };
  const formatBalance = formatTaka;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Smartphone className="w-6 h-6" />Mobile Payments (bKash/Nagad)</h2>
          <p className="text-muted-foreground">Manage deposits and withdrawals</p>
        </div>
        <Button onClick={triggerAutoProcess} disabled={processing} className="bg-gradient-to-r from-green-500 to-emerald-600">
          <Zap className="w-4 h-4 mr-2" />Auto-Process Payouts
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-yellow-500">{stats.pending}</div><div className="text-sm text-muted-foreground">Pending</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-500">{stats.processing}</div><div className="text-sm text-muted-foreground">Processing</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-500">{stats.completed}</div><div className="text-sm text-muted-foreground">Completed</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-primary">{formatBalance(stats.totalDeposits)}</div><div className="text-sm text-muted-foreground">Total Deposits</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-orange-500">{formatBalance(stats.totalWithdrawals)}</div><div className="text-sm text-muted-foreground">Total Withdrawals</div></CardContent></Card>
      </div>
      <Tabs defaultValue="transactions">
        <TabsList><TabsTrigger value="transactions">Transactions</TabsTrigger><TabsTrigger value="rules">Payout Rules</TabsTrigger></TabsList>
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by reference, phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-md border bg-background">
              <option value="all">All Status</option><option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="failed">Failed</option>
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-md border bg-background">
              <option value="all">All Types</option><option value="deposit">Deposits</option><option value="withdraw">Withdrawals</option>
            </select>
            <Button variant="outline" onClick={loadTransactions}><RefreshCw className="w-4 h-4" /></Button>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Type</TableHead><TableHead>Gateway</TableHead><TableHead>Reference</TableHead><TableHead>Phone</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? (<TableRow><TableCell colSpan={8} className="text-center py-8"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : filteredTransactions.length === 0 ? (<TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No transactions found</TableCell></TableRow>
                ) : filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.transaction_type === 'deposit' ? (<div className="flex items-center gap-1 text-green-500"><ArrowDownCircle className="w-4 h-4" />Deposit</div>) : (<div className="flex items-center gap-1 text-orange-500"><ArrowUpCircle className="w-4 h-4" />Withdraw</div>)}</TableCell>
                    <TableCell><Badge className={tx.gateway_type === 'bkash' ? 'bg-pink-500' : 'bg-orange-500'}>{tx.gateway_type.toUpperCase()}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{tx.reference_id}</TableCell>
                    <TableCell>{tx.transaction_type === 'deposit' ? tx.sender_number : tx.receiver_number}</TableCell>
                    <TableCell><div><div className="font-semibold">{formatBalance(tx.amount)}</div><div className="text-xs text-muted-foreground">Net: {formatBalance(tx.net_amount)}</div></div></TableCell>
                    <TableCell>{getStatusBadge(tx.status)}{tx.auto_verified && <Badge variant="outline" className="ml-1 text-xs">Auto</Badge>}</TableCell>
                    <TableCell className="text-xs">{format(new Date(tx.created_at), 'MMM d, HH:mm')}</TableCell>
                    <TableCell>{tx.status === 'pending' && (<div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-green-500 border-green-500" onClick={() => handleApprove(tx)} disabled={processing}><Check className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" className="text-red-500 border-red-500" onClick={() => { setSelectedTransaction(tx); setShowRejectDialog(true); }} disabled={processing}><X className="w-4 h-4" /></Button>
                    </div>)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="rules" className="space-y-4">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />Auto-Approval Rules</CardTitle></CardHeader>
            <CardContent><Table><TableHeader><TableRow>
              <TableHead>Rule Name</TableHead><TableHead>Amount Range</TableHead><TableHead>Min Deposits</TableHead><TableHead>Min Account Age</TableHead><TableHead>Auto Approve</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader><TableBody>
              {payoutRules.map((rule) => (<TableRow key={rule.id}>
                <TableCell className="font-medium">{rule.rule_name}</TableCell>
                <TableCell>{rule.min_amount !== null && rule.max_amount !== null ? `${formatBalance(rule.min_amount)} - ${formatBalance(rule.max_amount)}` : 'Any'}</TableCell>
                <TableCell>{rule.min_user_deposits || 'N/A'}</TableCell>
                <TableCell>{rule.min_user_age_days ? `${rule.min_user_age_days} days` : 'N/A'}</TableCell>
                <TableCell>{rule.auto_approve ? <Badge className="bg-green-500">Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                <TableCell>{rule.priority}</TableCell>
                <TableCell><Button size="sm" variant={rule.is_enabled ? "default" : "outline"} onClick={() => togglePayoutRule(rule)}>{rule.is_enabled ? 'Enabled' : 'Disabled'}</Button></TableCell>
              </TableRow>))}
            </TableBody></Table></CardContent></Card>
        </TabsContent>
      </Tabs>
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Transaction</DialogTitle><DialogDescription>Please provide a reason for rejecting this transaction.</DialogDescription></DialogHeader>
          <Input placeholder="Rejection reason..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing || !rejectReason}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
