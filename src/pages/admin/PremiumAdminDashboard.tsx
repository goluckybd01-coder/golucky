import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, 
  XCircle, RefreshCw, TrendingUp, Database, Wifi, AlertCircle,
  Users as UsersIcon, Gamepad2, Wallet as WalletIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
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
import { approveDeposit, rejectDeposit, approveWithdrawal, rejectWithdrawal } from '@/lib/adminApi';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DashboardStats {
  pendingDeposits: number;
  pendingWithdrawals: number;
  todayDepositAmount: number;
  todayWithdrawAmount: number;
  totalUsers: number;
  activeGames: number;
  todayDepositCount: number;
  todayBetsCount: number;
  activeUsersNow: number;
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

const PremiumAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    todayDepositAmount: 0,
    todayWithdrawAmount: 0,
    totalUsers: 0,
    activeGames: 0,
    todayDepositCount: 0,
    todayBetsCount: 0,
    activeUsersNow: 0,
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
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

    const [
      pendingDepositsRes,
      pendingWithdrawalsRes,
      todayDepositsRes,
      todayWithdrawalsRes,
      totalUsersRes,
      activeGamesRes,
      todayBetsRes,
      activeUsersRes,
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
        .gte('processed_at', today.toISOString()),
      supabase.from('profiles')
        .select('id', { count: 'exact', head: true }),
      supabase.from('api_games')
        .select('id', { count: 'exact', head: true })
        .eq('is_enabled', true),
      supabase.from('game_bets')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()),
      supabase.from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('updated_at', fifteenMinAgo.toISOString()),
    ]);

    const todayDepositTotal = todayDepositsRes.data?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
    const todayWithdrawTotal = todayWithdrawalsRes.data?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

    setStats({
      pendingDeposits: pendingDepositsRes.count || 0,
      pendingWithdrawals: pendingWithdrawalsRes.count || 0,
      todayDepositAmount: todayDepositTotal,
      todayWithdrawAmount: todayWithdrawTotal,
      totalUsers: totalUsersRes.count || 0,
      activeGames: activeGamesRes.count || 0,
      todayDepositCount: todayDepositsRes.data?.length || 0,
      todayBetsCount: todayBetsRes.count || 0,
      activeUsersNow: activeUsersRes.count || 0,
    });

    // Load latest 10 pending deposits
    const { data: deposits } = await supabase
      .from('transaction_requests')
      .select('*')
      .eq('type', 'deposit')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    // Load latest 10 pending withdrawals
    const { data: withdrawals } = await supabase
      .from('transaction_requests')
      .select('*')
      .eq('type', 'withdraw')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get user profiles
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
      let result;
      if (requestType === 'deposit') {
        result = type === 'approve' 
          ? await approveDeposit(request.id, 'Approved from dashboard')
          : await rejectDeposit(request.id, 'Rejected from dashboard');
      } else {
        result = type === 'approve'
          ? await approveWithdrawal(request.id, 'Approved from dashboard')
          : await rejectWithdrawal(request.id, 'Rejected from dashboard');
      }

      if (result.success) {
        toast.success(result.message || `${requestType === 'deposit' ? 'Deposit' : 'Withdrawal'} ${type}d successfully`);
        loadData();
      } else {
        toast.error(result.error || `Failed to ${type} ${requestType}`);
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${type} ${requestType}`);
    }

    setProcessing(false);
    setConfirmDialog({ open: false, type: 'approve', request: null, requestType: 'deposit' });
  };

  const formatAmount = (amount: number) => `৳${amount.toLocaleString()}`;

  // Loading Skeleton
  const StatCardSkeleton = () => (
    <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-slate-700" />
            <Skeleton className="h-8 w-16 bg-slate-700" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl bg-slate-700" />
        </div>
      </CardContent>
    </Card>
  );

  const TableSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <Skeleton className="h-10 w-10 rounded-full bg-slate-700" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 bg-slate-700" />
            <Skeleton className="h-3 w-24 bg-slate-700" />
          </div>
          <Skeleton className="h-6 w-20 bg-slate-700" />
        </div>
      ))}
    </div>
  );

  const StatCard = ({ title, value, icon: Icon, accent, iconBg, iconText, onClick, pulse }: any) => (
    <Card
      onClick={onClick}
      className={`relative overflow-hidden bg-[#1A2332] border border-[#1F2937] rounded-xl shadow-lg transition-all duration-200 ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(245,158,11,0.25)] hover:border-[#1F2937]' : ''}`}
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wider">{title}</p>
            <p className={`text-2xl xl:text-3xl font-bold mt-2 text-[#F9FAFB] truncate ${pulse ? 'animate-pulse' : ''}`}>{value}</p>
          </div>
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconText}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const RequestTable = ({ 
    title, 
    requests, 
    type,
    icon: Icon,
    iconColor,
    emptyMessage
  }: { 
    title: string; 
    requests: TransactionRequest[]; 
    type: 'deposit' | 'withdraw';
    icon: any;
    iconColor: string;
    emptyMessage: string;
  }) => (
    <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 shadow-xl">
      <CardHeader className="pb-3 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            {title}
            {requests.length > 0 && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 ml-2">
                {requests.length}
              </Badge>
            )}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
            onClick={() => navigate(type === 'deposit' ? '/admin/deposits/pending' : '/admin/withdraws/pending')}
          >
            View All →
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[340px]">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <AlertCircle className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">{emptyMessage}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-slate-400 text-xs uppercase tracking-wider">User</TableHead>
                  <TableHead className="text-slate-400 text-xs uppercase tracking-wider">Amount</TableHead>
                  <TableHead className="text-slate-400 text-xs uppercase tracking-wider">Method</TableHead>
                  <TableHead className="text-slate-400 text-xs uppercase tracking-wider">Time</TableHead>
                  <TableHead className="text-slate-400 text-xs uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id} className="border-slate-700/30 hover:bg-slate-700/20">
                    <TableCell>
                      <div>
                        <p className="text-white text-sm font-medium">{request.profile?.username || request.profile?.phone || 'Unknown'}</p>
                        <p className="text-slate-500 text-xs font-mono">{request.profile?.display_user_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-amber-400 font-bold text-lg">
                        {formatAmount(request.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-600 text-slate-300 capitalize bg-slate-800/50">
                        {request.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {format(new Date(request.created_at), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-8 px-3 shadow-lg shadow-green-500/20"
                          onClick={() => setConfirmDialog({
                            open: true,
                            type: 'approve',
                            request,
                            requestType: type
                          })}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white h-8 px-3 shadow-lg shadow-red-500/20"
                          onClick={() => setConfirmDialog({
                            open: true,
                            type: 'reject',
                            request,
                            requestType: type
                          })}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <NewAdminShell title="Dashboard" description="Overview of pending requests and today's activity">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><Skeleton className="h-6 w-48 bg-slate-700" /></CardHeader>
            <CardContent><TableSkeleton /></CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><Skeleton className="h-6 w-48 bg-slate-700" /></CardHeader>
            <CardContent><TableSkeleton /></CardContent>
          </Card>
        </div>
      </NewAdminShell>
    );
  }

  return (
    <NewAdminShell title="Dashboard" description="Overview of pending requests and today's activity">
      {/* Quick Stats - Dark Golden Theme */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: UsersIcon },
          { label: "Today's Deposits", value: stats.todayDepositCount.toLocaleString(), icon: ArrowDownCircle },
          { label: "Today's Bets", value: stats.todayBetsCount.toLocaleString(), icon: Gamepad2 },
          { label: 'Active Users Now', value: stats.activeUsersNow.toLocaleString(), icon: TrendingUp },
        ].map((s) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-xl p-5 border border-amber-500/30 shadow-lg shadow-amber-500/10"
            style={{ background: 'linear-gradient(135deg, #0A0E1A 0%, #14182a 100%)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-amber-400/80 font-semibold">{s.label}</p>
                <p className="text-3xl font-bold mt-2 text-[#F59E0B] drop-shadow-[0_0_10px_rgba(245,158,11,0.35)]">
                  {s.value}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-amber-500/10 border border-amber-500/30">
                <s.icon className="h-6 w-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={UsersIcon}
          accent="#3B82F6"
          iconBg="bg-[rgba(59,130,246,0.12)]"
          iconText="text-[#3B82F6]"
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          title="Today Revenue"
          value={formatAmount(stats.todayDepositAmount - stats.todayWithdrawAmount)}
          icon={TrendingUp}
          accent="#10B981"
          iconBg="bg-[rgba(16,185,129,0.12)]"
          iconText="text-[#10B981]"
        />
        <StatCard
          title="Active Games"
          value={stats.activeGames.toLocaleString()}
          icon={Gamepad2}
          accent="#F59E0B"
          iconBg="bg-[rgba(245,158,11,0.12)]"
          iconText="text-[#F59E0B]"
          onClick={() => navigate('/admin/games/wingo')}
        />
        <StatCard
          title="Pending Withdrawals"
          value={formatAmount(stats.todayWithdrawAmount)}
          icon={WalletIcon}
          accent="#EF4444"
          iconBg="bg-[rgba(239,68,68,0.12)]"
          iconText="text-[#EF4444]"
          onClick={() => navigate('/admin/withdraws/pending')}
          pulse={stats.pendingWithdrawals > 0}
        />
      </div>

      {/* System Status */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 shadow-lg">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-500/50" />
            <span className="text-sm text-slate-400">API: <span className="text-green-400 font-medium">OK</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-green-400" />
            <span className="text-sm text-slate-400">DB: <span className="text-green-400 font-medium">OK</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-green-400" />
            <span className="text-sm text-slate-400">Real-time: <span className="text-green-400 font-medium">Connected</span></span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="border-slate-600 bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-amber-500/50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RequestTable
          title="Pending Deposits"
          requests={pendingDeposits}
          type="deposit"
          icon={ArrowDownCircle}
          iconColor="text-green-400"
          emptyMessage="No pending deposits"
        />
        <RequestTable
          title="Pending Withdrawals"
          requests={pendingWithdrawals}
          type="withdraw"
          icon={ArrowUpCircle}
          iconColor="text-orange-400"
          emptyMessage="No pending withdrawals"
        />
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !processing && setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-xl">
              {confirmDialog.type === 'approve' ? '✅ Approve' : '❌ Reject'} {confirmDialog.requestType}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {confirmDialog.type === 'approve' ? (
                <>
                  Approve and {confirmDialog.requestType === 'deposit' ? 'credit' : 'process'} <span className="text-amber-400 font-bold text-lg">{formatAmount(confirmDialog.request?.amount || 0)}</span> {confirmDialog.requestType === 'deposit' ? "to user's wallet" : 'withdrawal'}?
                </>
              ) : (
                <>
                  Reject this {confirmDialog.requestType} request for <span className="text-amber-400 font-bold">{formatAmount(confirmDialog.request?.amount || 0)}</span>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={processing}
              className={confirmDialog.type === 'approve' 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20' 
                : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg shadow-red-500/20'
              }
            >
              {processing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                confirmDialog.type === 'approve' ? 'Approve' : 'Reject'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </NewAdminShell>
  );
};

export default PremiumAdminDashboard;
