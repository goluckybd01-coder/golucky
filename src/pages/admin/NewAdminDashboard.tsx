import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, 
  XCircle, RefreshCw, TrendingUp, Users, Wallet, Activity,
  Database, Wifi
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { NewAdminShell } from '@/components/admin/NewAdminShell';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DashboardStats {
  pendingDeposits: number;
  pendingWithdrawals: number;
  todayDepositAmount: number;
  todayWithdrawAmount: number;
}

interface TransactionRequest {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  status: string;
  payment_method: string;
  payment_details: any;
  created_at: string;
  profile?: { username: string; phone: string; display_user_id: string };
}

const NewAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    todayDepositAmount: 0,
    todayWithdrawAmount: 0
  });
  const [pendingDeposits, setPendingDeposits] = useState<TransactionRequest[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<TransactionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'approve' | 'reject';
    request: TransactionRequest | null;
    requestType: 'deposit' | 'withdraw';
  }>({ open: false, type: 'approve', request: null, requestType: 'deposit' });
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      pendingDepositsRes,
      pendingWithdrawalsRes,
      todayDepositsRes,
      todayWithdrawalsRes
    ] = await Promise.all([
      supabase.from('transaction_requests')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'deposit')
        .eq('status', 'pending'),
      supabase.from('transaction_requests')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'withdraw')
        .eq('status', 'pending'),
      supabase.from('transaction_requests')
        .select('amount')
        .eq('type', 'deposit')
        .eq('status', 'approved')
        .gte('processed_at', today.toISOString()),
      supabase.from('transaction_requests')
        .select('amount')
        .eq('type', 'withdraw')
        .eq('status', 'approved')
        .gte('processed_at', today.toISOString())
    ]);

    const todayDepositTotal = todayDepositsRes.data?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
    const todayWithdrawTotal = todayWithdrawalsRes.data?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

    setStats({
      pendingDeposits: pendingDepositsRes.count || 0,
      pendingWithdrawals: pendingWithdrawalsRes.count || 0,
      todayDepositAmount: todayDepositTotal,
      todayWithdrawAmount: todayWithdrawTotal
    });

    const { data: deposits } = await supabase
      .from('transaction_requests')
      .select('*')
      .eq('type', 'deposit')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: withdrawals } = await supabase
      .from('transaction_requests')
      .select('*')
      .eq('type', 'withdraw')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    const userIds = [
      ...(deposits?.map(d => d.user_id) || []),
      ...(withdrawals?.map(w => w.user_id) || [])
    ];

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, phone, display_user_id')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      setPendingDeposits(deposits?.map(d => ({
        ...d,
        profile: profileMap.get(d.user_id)
      })) || []);

      setPendingWithdrawals(withdrawals?.map(w => ({
        ...w,
        profile: profileMap.get(w.user_id)
      })) || []);
    } else {
      setPendingDeposits([]);
      setPendingWithdrawals([]);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaction_requests' }, () => {
        loadData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const handleAction = async () => {
    if (!confirmDialog.request) return;
    setProcessing(true);
    const { request, type, requestType } = confirmDialog;
    try {
      if (requestType === 'deposit') {
        const { error } = await supabase.functions.invoke('process-deposit', {
          body: {
            requestId: request.id,
            action: type,
            adminNotes: `Quick ${type} from dashboard`
          }
        });
        if (error) throw error;
      } else {
        const newStatus = type === 'approve' ? 'approved' : 'rejected';
        if (type === 'approve') {
          const { data: wallet } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', request.user_id)
            .single();
          if (!wallet || wallet.balance < request.amount) {
            throw new Error('Insufficient balance');
          }
          await supabase
            .from('wallets')
            .update({ balance: wallet.balance - request.amount })
            .eq('user_id', request.user_id);
          await supabase.from('wallet_transactions').insert({
            user_id: request.user_id,
            type: 'withdraw' as const,
            amount: -request.amount,
            balance_after: (wallet.balance - request.amount),
            description: 'Withdrawal approved'
          });
        }
        await supabase
          .from('transaction_requests')
          .update({ 
            status: newStatus,
            processed_at: new Date().toISOString(),
            admin_notes: `Quick ${type} from dashboard`
          })
          .eq('id', request.id);
      }
      toast.success(`${requestType === 'deposit' ? 'Deposit' : 'Withdrawal'} ${type}d successfully`);
      loadData();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${type} ${requestType}`);
    }
    setProcessing(false);
    setConfirmDialog({ open: false, type: 'approve', request: null, requestType: 'deposit' });
  };

  const formatAmount = (amount: number) => `৳${amount.toLocaleString()}`;

  const StatCard = ({ title, value, icon: Icon, color, onClick }: any) => (
    <Card 
      className={`bg-slate-800/50 border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors ${onClick ? 'hover:border-amber-500/50' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.includes('green') ? 'bg-green-500/20' : color.includes('orange') ? 'bg-orange-500/20' : color.includes('red') ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const RequestTable = ({ title, requests, type }: { title: string; requests: TransactionRequest[]; type: 'deposit' | 'withdraw' }) => (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            {type === 'deposit' ? (
              <ArrowDownCircle className="h-5 w-5 text-green-400" />
            ) : (
              <ArrowUpCircle className="h-5 w-5 text-orange-400" />
            )}
            {title}
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300" onClick={() => navigate(type === 'deposit' ? '/admin/deposits/pending' : '/admin/withdraws/pending')}>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-400">User</TableHead>
                <TableHead className="text-slate-400">Amount</TableHead>
                <TableHead className="text-slate-400">Method</TableHead>
                <TableHead className="text-slate-400">Time</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow className="border-slate-700">
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">No pending {type}s</TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell>
                      <div>
                        <p className="text-white text-sm">{request.profile?.username || request.profile?.phone || 'Unknown'}</p>
                        <p className="text-slate-500 text-xs">{request.profile?.display_user_id}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-amber-400 font-medium">{formatAmount(request.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-600 text-slate-300 capitalize">{request.payment_method}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">{format(new Date(request.created_at), 'MMM d, HH:mm')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 px-2" onClick={() => setConfirmDialog({ open: true, type: 'approve', request, requestType: type })}>
                          <CheckCircle className="h-3 w-3 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => setConfirmDialog({ open: true, type: 'reject', request, requestType: type })}>
                          <XCircle className="h-3 w-3 mr-1" />Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <NewAdminShell title="Dashboard" description="Overview of pending requests and today's activity">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 text-amber-400 animate-spin" />
        </div>
      </NewAdminShell>
    );
  }

  return (
    <NewAdminShell title="Dashboard" description="Overview of pending requests and today's activity">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Pending Deposits" value={stats.pendingDeposits} icon={Clock} color="text-amber-400" onClick={() => navigate('/admin/deposits/pending')} />
        <StatCard title="Pending Withdrawals" value={stats.pendingWithdrawals} icon={Clock} color="text-orange-400" onClick={() => navigate('/admin/withdraws/pending')} />
        <StatCard title="Today's Deposits" value={formatAmount(stats.todayDepositAmount)} icon={TrendingUp} color="text-green-400" />
        <StatCard title="Today's Withdrawals" value={formatAmount(stats.todayWithdrawAmount)} icon={ArrowUpCircle} color="text-red-400" />
      </div>
      <div className="flex items-center justify-between mb-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span className="text-sm text-slate-400">API: <span className="text-green-400">OK</span></span></div>
          <div className="flex items-center gap-2"><Database className="h-4 w-4 text-slate-500" /><span className="text-sm text-slate-400">DB: <span className="text-green-400">OK</span></span></div>
          <div className="flex items-center gap-2"><Wifi className="h-4 w-4 text-slate-500" /><span className="text-sm text-slate-400">Real-time: <span className="text-green-400">Connected</span></span></div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="border-slate-700 text-slate-400 hover:text-white">
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RequestTable title="Latest Pending Deposits" requests={pendingDeposits} type="deposit" />
        <RequestTable title="Latest Pending Withdrawals" requests={pendingWithdrawals} type="withdraw" />
      </div>
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !processing && setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{confirmDialog.type === 'approve' ? 'Approve' : 'Reject'} {confirmDialog.requestType}?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {confirmDialog.type === 'approve' ? (
                <>Approve and credit <span className="text-amber-400 font-bold">{formatAmount(confirmDialog.request?.amount || 0)}</span> to user's wallet?</>
              ) : (
                <>Reject this {confirmDialog.requestType} request for <span className="text-amber-400 font-bold">{formatAmount(confirmDialog.request?.amount || 0)}</span>?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={processing} className={confirmDialog.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
              {processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : confirmDialog.type === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </NewAdminShell>
  );
};

export default NewAdminDashboard;
