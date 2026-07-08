import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowUpCircle, Search, RefreshCw, Eye, CheckCircle, XCircle, Clock, Copy, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { NewAdminShell } from '@/components/admin/NewAdminShell';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface WithdrawRequest {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string;
  payment_details: any;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  profile?: { username: string; phone: string; display_user_id: string };
  wallet?: { balance: number };
}

const WithdrawsListPage = () => {
  const { status: urlStatus } = useParams<{ status: string }>();
  const navigate = useNavigate();
  const status = urlStatus || 'pending';
  const [withdrawals, setWithdrawals] = useState<WithdrawRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWithdraw, setSelectedWithdraw] = useState<WithdrawRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; type: 'approve' | 'reject' }>({ open: false, type: 'approve' });
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
      supabase.from('transaction_requests').select('id', { count: 'exact', head: true }).eq('type', 'withdraw').eq('status', 'pending'),
      supabase.from('transaction_requests').select('id', { count: 'exact', head: true }).eq('type', 'withdraw').eq('status', 'approved'),
      supabase.from('transaction_requests').select('id', { count: 'exact', head: true }).eq('type', 'withdraw').eq('status', 'rejected'),
    ]);
    setStats({ pending: pendingRes.count || 0, approved: approvedRes.count || 0, rejected: rejectedRes.count || 0 });
    const { data: withdrawData } = await supabase.from('transaction_requests').select('*').eq('type', 'withdraw').eq('status', status).order('created_at', { ascending: false }).limit(100);
    if (withdrawData && withdrawData.length > 0) {
      const userIds = withdrawData.map(w => w.user_id);
      const [profilesRes, walletsRes] = await Promise.all([
        supabase.from('profiles').select('id, username, phone, display_user_id').in('id', userIds),
        supabase.from('wallets').select('user_id, balance').in('user_id', userIds),
      ]);
      const profileMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);
      const walletMap = new Map(walletsRes.data?.map(w => [w.user_id, w]) || []);
      setWithdrawals(withdrawData.map(w => ({ ...w, profile: profileMap.get(w.user_id), wallet: walletMap.get(w.user_id) })));
    } else setWithdrawals([]);
    setIsLoading(false);
  }, [status]);

  useEffect(() => {
    loadData();
    const channel = supabase.channel('withdraws-list').on('postgres_changes', { event: '*', schema: 'public', table: 'transaction_requests' }, () => loadData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const handleAction = async (type: 'approve' | 'reject') => {
    if (!selectedWithdraw) return;
    setProcessing(true);
    try {
      if (type === 'approve') {
        const currentBalance = selectedWithdraw.wallet?.balance || 0;
        if (currentBalance < selectedWithdraw.amount) throw new Error('Insufficient balance');
        const { error: walletError } = await supabase.from('wallets').update({ balance: currentBalance - selectedWithdraw.amount }).eq('user_id', selectedWithdraw.user_id);
        if (walletError) throw walletError;
        await supabase.from('wallet_transactions').insert({ user_id: selectedWithdraw.user_id, type: 'withdraw' as const, amount: -selectedWithdraw.amount, balance_after: (currentBalance - selectedWithdraw.amount), description: 'Withdrawal approved' });
      }
      const { error: updateError } = await supabase.from('transaction_requests').update({ status: type === 'approve' ? 'approved' : 'rejected', processed_at: new Date().toISOString(), admin_notes: adminNotes || `Withdrawal ${type}d by admin` }).eq('id', selectedWithdraw.id);
      if (updateError) throw updateError;
      await supabase.from('admin_notification_history').insert({ notification_type: `withdraw_${type}d`, title: `Withdrawal ${type}d`, message: `Withdrawal of ৳${selectedWithdraw.amount} ${type}d`, priority: 'medium', metadata: { request_id: selectedWithdraw.id, amount: selectedWithdraw.amount } });
      toast.success(`Withdrawal ${type}d successfully`);
      setDetailsOpen(false);
      setConfirmDialog({ open: false, type: 'approve' });
      setAdminNotes('');
      loadData();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${type} withdrawal`);
    }
    setProcessing(false);
  };

  const openDetails = (withdraw: WithdrawRequest) => { setSelectedWithdraw(withdraw); setAdminNotes(withdraw.admin_notes || ''); setDetailsOpen(true); };
  const filteredWithdrawals = withdrawals.filter(w => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return w.profile?.username?.toLowerCase().includes(query) || w.profile?.phone?.toLowerCase().includes(query) || w.profile?.display_user_id?.toLowerCase().includes(query) || w.id.toLowerCase().includes(query) || w.payment_details?.account_number?.toLowerCase().includes(query);
  });
  const formatAmount = (amount: number) => `৳${amount.toLocaleString()}`;
  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'pending': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };
  const StatusTab = ({ tabStatus, count, label }: { tabStatus: string; count: number; label: string }) => (
    <button onClick={() => navigate(`/admin/withdraws/${tabStatus}`)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${status === tabStatus ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
      {label}<span className={`px-1.5 py-0.5 rounded text-xs ${status === tabStatus ? 'bg-amber-500/30' : 'bg-slate-700'}`}>{count}</span>
    </button>
  );

  return (
    <NewAdminShell title="Withdrawals" description={`${status.charAt(0).toUpperCase() + status.slice(1)} withdrawal requests`}>
      <div className="flex items-center gap-2 mb-6">
        <StatusTab tabStatus="pending" count={stats.pending} label="Pending" />
        <StatusTab tabStatus="approved" count={stats.approved} label="Approved" />
        <StatusTab tabStatus="rejected" count={stats.rejected} label="Rejected" />
      </div>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input placeholder="Search by user, phone, account..." className="pl-9 bg-slate-800/50 border-slate-700 text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Button variant="outline" onClick={loadData} className="border-slate-700 text-slate-400"><RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />Refresh</Button>
      </div>
      <Card className="bg-slate-800/50 border-slate-700">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-400">Request ID</TableHead>
                <TableHead className="text-slate-400">User</TableHead>
                <TableHead className="text-slate-400">Amount</TableHead>
                <TableHead className="text-slate-400">Method</TableHead>
                <TableHead className="text-slate-400">Receiver Info</TableHead>
                <TableHead className="text-slate-400">Time</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-slate-700"><TableCell colSpan={8} className="text-center py-8"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-400" /></TableCell></TableRow>
              ) : filteredWithdrawals.length === 0 ? (
                <TableRow className="border-slate-700"><TableCell colSpan={8} className="text-center text-slate-500 py-8">No {status} withdrawals found</TableCell></TableRow>
              ) : (
                filteredWithdrawals.map((withdraw) => (
                  <TableRow key={withdraw.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="font-mono text-xs text-slate-400">{withdraw.id.slice(0, 8)}...</TableCell>
                    <TableCell><div><p className="text-white text-sm">{withdraw.profile?.username || withdraw.profile?.phone || 'Unknown'}</p><p className="text-slate-500 text-xs">{withdraw.profile?.display_user_id}</p></div></TableCell>
                    <TableCell className="text-orange-400 font-bold">{formatAmount(withdraw.amount)}</TableCell>
                    <TableCell><Badge variant="outline" className="border-slate-600 text-slate-300 capitalize">{withdraw.payment_method}</Badge></TableCell>
                    <TableCell className="text-slate-400 text-sm">{withdraw.payment_details?.account_number || withdraw.payment_details?.wallet_address?.slice(0, 10) + '...' || '-'}</TableCell>
                    <TableCell className="text-slate-400 text-sm">{format(new Date(withdraw.created_at), 'MMM d, HH:mm')}</TableCell>
                    <TableCell>{getStatusBadge(withdraw.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openDetails(withdraw)} className="h-8 px-2 text-slate-400 hover:text-white"><Eye className="h-4 w-4" /></Button>
                        {status === 'pending' && (<>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 px-2" onClick={() => { setSelectedWithdraw(withdraw); setConfirmDialog({ open: true, type: 'approve' }); }}><CheckCircle className="h-4 w-4" /></Button>
                          <Button size="sm" variant="destructive" className="h-8 px-2" onClick={() => { setSelectedWithdraw(withdraw); setConfirmDialog({ open: true, type: 'reject' }); }}><XCircle className="h-4 w-4" /></Button>
                        </>)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2"><ArrowUpCircle className="h-5 w-5 text-orange-400" />Withdrawal Details</DialogTitle>
            <DialogDescription className="text-slate-400">Request ID: {selectedWithdraw?.id.slice(0, 8)}...</DialogDescription>
          </DialogHeader>
          {selectedWithdraw && (
            <div className="space-y-4">
              {selectedWithdraw.status === 'pending' && (selectedWithdraw.wallet?.balance || 0) < selectedWithdraw.amount && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">Insufficient balance! User has {formatAmount(selectedWithdraw.wallet?.balance || 0)} but requesting {formatAmount(selectedWithdraw.amount)}</p>
                </div>
              )}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2">User Balance</h4>
                <div className="flex items-center justify-between"><span className="text-slate-400">Current Balance</span><span className="text-amber-400 font-bold text-xl">{formatAmount(selectedWithdraw.wallet?.balance || 0)}</span></div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2">Withdrawal Info</h4>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-slate-400">Requested Amount</span><span className="text-orange-400 font-bold text-lg">{formatAmount(selectedWithdraw.amount)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Method</span><Badge variant="outline" className="border-slate-600 capitalize">{selectedWithdraw.payment_method}</Badge></div>
                </div>
              </div>
              {selectedWithdraw.status === 'pending' && (
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Admin Notes</label>
                  <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Add notes (optional)..." className="bg-slate-700 border-slate-600 text-white" rows={3} />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDetailsOpen(false)} className="border-slate-600">Close</Button>
            {selectedWithdraw?.status === 'pending' && (<>
              <Button variant="destructive" onClick={() => setConfirmDialog({ open: true, type: 'reject' })}><XCircle className="h-4 w-4 mr-2" />Reject</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => setConfirmDialog({ open: true, type: 'approve' })} disabled={(selectedWithdraw.wallet?.balance || 0) < selectedWithdraw.amount}><CheckCircle className="h-4 w-4 mr-2" />Approve</Button>
            </>)}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !processing && setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{confirmDialog.type === 'approve' ? 'Approve' : 'Reject'} Withdrawal?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {confirmDialog.type === 'approve' ? <>Approve and deduct <span className="text-orange-400 font-bold">{formatAmount(selectedWithdraw?.amount || 0)}</span> from user's wallet?</> : <>Reject this withdrawal request?</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing} className="bg-slate-700 border-slate-600 text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleAction(confirmDialog.type)} disabled={processing} className={confirmDialog.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
              {processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : confirmDialog.type === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </NewAdminShell>
  );
};

export default WithdrawsListPage;
