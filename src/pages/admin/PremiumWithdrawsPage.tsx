import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowUpCircle, Search, RefreshCw, Eye, CheckCircle, XCircle,
  Clock, Copy, AlertTriangle, AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { approveWithdrawal, rejectWithdrawal } from '@/lib/adminApi';
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
  profile?: {
    username: string;
    phone: string;
    display_user_id: string;
  };
  wallet?: {
    balance: number;
  };
}

const PremiumWithdrawsPage = () => {
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

    setStats({
      pending: pendingRes.count || 0,
      approved: approvedRes.count || 0,
      rejected: rejectedRes.count || 0
    });

    const { data: withdrawData } = await supabase
      .from('transaction_requests')
      .select('*')
      .eq('type', 'withdraw')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(100);

    if (withdrawData && withdrawData.length > 0) {
      const userIds = withdrawData.map(w => w.user_id);
      
      const [profilesRes, walletsRes] = await Promise.all([
        supabase.from('profiles').select('id, username, phone, display_user_id').in('id', userIds),
        supabase.from('wallets').select('user_id, balance').in('user_id', userIds),
      ]);

      const profileMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);
      const walletMap = new Map(walletsRes.data?.map(w => [w.user_id, w]) || []);

      setWithdrawals(withdrawData.map(w => ({
        ...w,
        profile: profileMap.get(w.user_id),
        wallet: walletMap.get(w.user_id)
      })));
    } else {
      setWithdrawals([]);
    }

    setIsLoading(false);
  }, [status]);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('withdraws-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaction_requests' }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const handleAction = async (type: 'approve' | 'reject') => {
    if (!selectedWithdraw) return;
    setProcessing(true);

    try {
      const result = type === 'approve'
        ? await approveWithdrawal(selectedWithdraw.id, adminNotes)
        : await rejectWithdrawal(selectedWithdraw.id, adminNotes);

      if (result.success) {
        toast.success(result.message || `Withdrawal ${type}d successfully`);
        setDetailsOpen(false);
        setConfirmDialog({ open: false, type: 'approve' });
        setAdminNotes('');
        loadData();
      } else {
        toast.error(result.error || `Failed to ${type} withdrawal`);
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${type} withdrawal`);
    }

    setProcessing(false);
  };

  const openDetails = (withdraw: WithdrawRequest) => {
    setSelectedWithdraw(withdraw);
    setAdminNotes(withdraw.admin_notes || '');
    setDetailsOpen(true);
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      w.profile?.username?.toLowerCase().includes(query) ||
      w.profile?.phone?.toLowerCase().includes(query) ||
      w.profile?.display_user_id?.toLowerCase().includes(query) ||
      w.id.toLowerCase().includes(query) ||
      w.payment_details?.account_number?.toLowerCase().includes(query)
    );
  });

  const formatAmount = (amount: number) => `৳${amount.toLocaleString()}`;

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{s}</Badge>;
    }
  };

  const StatusTab = ({ tabStatus, count, label }: { tabStatus: string; count: number; label: string }) => (
    <button
      onClick={() => navigate(`/admin/withdraws/${tabStatus}`)}
      className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
        status === tabStatus 
          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/40 shadow-lg shadow-amber-500/10' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
      }`}
    >
      {label}
      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
        status === tabStatus ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-700 text-slate-400'
      }`}>
        {count}
      </span>
    </button>
  );

  const TableSkeleton = () => (
    <div className="space-y-3 p-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-24 bg-slate-700" />
          <Skeleton className="h-10 flex-1 bg-slate-700" />
          <Skeleton className="h-10 w-20 bg-slate-700" />
          <Skeleton className="h-10 w-32 bg-slate-700" />
        </div>
      ))}
    </div>
  );

  return (
    <NewAdminShell 
      title="Withdrawals" 
      description={`${status.charAt(0).toUpperCase() + status.slice(1)} withdrawal requests`}
    >
      {/* Status Tabs */}
      <div className="flex items-center gap-3 mb-6">
        <StatusTab tabStatus="pending" count={stats.pending} label="Pending" />
        <StatusTab tabStatus="approved" count={stats.approved} label="Approved" />
        <StatusTab tabStatus="rejected" count={stats.rejected} label="Rejected" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by user, phone, account..."
            className="pl-10 bg-slate-800/50 border-slate-700 text-white focus:border-amber-500/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={loadData}
          className="border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white hover:border-amber-500/50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 shadow-xl">
        {isLoading ? (
          <TableSkeleton />
        ) : filteredWithdrawals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <AlertCircle className="h-16 w-16 mb-4 opacity-40" />
            <p className="text-lg font-medium">No {status} withdrawals found</p>
            <p className="text-sm mt-1">Withdrawals will appear here when available</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-slate-400 text-xs uppercase tracking-wider">Request ID</TableHead>
                  <TableHead className="text-slate-400 text-xs uppercase tracking-wider">User</TableHead>
                  <TableHead className="text-slate-400 text-xs uppercase tracking-wider">Amount</TableHead>
                  <TableHead className="text-slate-400 text-xs uppercase tracking-wider">Method</TableHead>
                  <TableHead className="text-slate-400 text-xs uppercase tracking-wider">Receiver Info</TableHead>
                  <TableHead className="text-slate-400 text-xs uppercase tracking-wider">Time</TableHead>
                  <TableHead className="text-slate-400 text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-slate-400 text-xs uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWithdrawals.map((withdraw) => (
                  <TableRow key={withdraw.id} className="border-slate-700/30 hover:bg-slate-700/20">
                    <TableCell className="font-mono text-xs text-slate-400">
                      {withdraw.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-white text-sm font-medium">{withdraw.profile?.username || withdraw.profile?.phone || 'Unknown'}</p>
                        <p className="text-slate-500 text-xs font-mono">{withdraw.profile?.display_user_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-orange-400 font-bold text-lg">{formatAmount(withdraw.amount)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-600 text-slate-300 capitalize bg-slate-800/50">
                        {withdraw.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm font-mono">
                      {withdraw.payment_details?.account_number || withdraw.payment_details?.wallet_address?.slice(0, 12) + '...' || '-'}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {format(new Date(withdraw.created_at), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(withdraw.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDetails(withdraw)}
                          className="h-8 px-3 text-slate-400 hover:text-white hover:bg-slate-700"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-8 px-3 shadow-lg shadow-green-500/20"
                              onClick={() => {
                                setSelectedWithdraw(withdraw);
                                setConfirmDialog({ open: true, type: 'approve' });
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 h-8 px-3 shadow-lg shadow-red-500/20"
                              onClick={() => {
                                setSelectedWithdraw(withdraw);
                                setConfirmDialog({ open: true, type: 'reject' });
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </Card>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <ArrowUpCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg">Withdrawal Details</span>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedWithdraw?.id.slice(0, 12)}...</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedWithdraw && (
            <div className="space-y-4">
              {selectedWithdraw.status === 'pending' && (selectedWithdraw.wallet?.balance || 0) < selectedWithdraw.amount && (
                <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-red-400 font-medium">Insufficient Balance!</p>
                    <p className="text-red-300/70 text-sm">
                      User has {formatAmount(selectedWithdraw.wallet?.balance || 0)} but requesting {formatAmount(selectedWithdraw.amount)}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">User Balance</h4>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Balance</span>
                  <span className="text-amber-400 font-bold text-2xl">{formatAmount(selectedWithdraw.wallet?.balance || 0)}</span>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Withdrawal Info</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Requested Amount</span>
                    <span className="text-orange-400 font-bold text-2xl">{formatAmount(selectedWithdraw.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Method</span>
                    <Badge variant="outline" className="border-slate-600 capitalize bg-slate-800/50">{selectedWithdraw.payment_method}</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Receiver Info</h4>
                <div className="space-y-3">
                  {selectedWithdraw.payment_details?.account_number && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Account Number</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono">{selectedWithdraw.payment_details.account_number}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-slate-700" onClick={() => {
                          navigator.clipboard.writeText(selectedWithdraw.payment_details.account_number);
                          toast.success('Copied!');
                        }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {selectedWithdraw.payment_details?.wallet_address && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Wallet Address</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono text-xs">{selectedWithdraw.payment_details.wallet_address.slice(0, 20)}...</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-slate-700" onClick={() => {
                          navigator.clipboard.writeText(selectedWithdraw.payment_details.wallet_address);
                          toast.success('Copied!');
                        }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {selectedWithdraw.payment_details?.account_name && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account Name</span>
                      <span className="text-white">{selectedWithdraw.payment_details.account_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedWithdraw.status === 'pending' && (
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Admin Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes (optional)..."
                    className="bg-slate-700/50 border-slate-600 text-white focus:border-amber-500/50"
                    rows={3}
                  />
                </div>
              )}

              {selectedWithdraw.admin_notes && selectedWithdraw.status !== 'pending' && (
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Admin Notes</h4>
                  <p className="text-white">{selectedWithdraw.admin_notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDetailsOpen(false)} className="border-slate-600 hover:bg-slate-700">
              Close
            </Button>
            {selectedWithdraw?.status === 'pending' && (
              <>
                <Button
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                  onClick={() => setConfirmDialog({ open: true, type: 'reject' })}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  onClick={() => setConfirmDialog({ open: true, type: 'approve' })}
                  disabled={(selectedWithdraw.wallet?.balance || 0) < selectedWithdraw.amount}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !processing && setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-xl">
              {confirmDialog.type === 'approve' ? '✅ Approve' : '❌ Reject'} Withdrawal?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {confirmDialog.type === 'approve' ? (
                <>Approve and deduct <span className="text-orange-400 font-bold text-lg">{formatAmount(selectedWithdraw?.amount || 0)}</span> from user's wallet?</>
              ) : (
                <>Reject this withdrawal request?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction(confirmDialog.type)}
              disabled={processing}
              className={confirmDialog.type === 'approve' 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
              }
            >
              {processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : confirmDialog.type === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </NewAdminShell>
  );
};

export default PremiumWithdrawsPage;
