import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowDownCircle, Search, RefreshCw, Eye, CheckCircle, XCircle,
  Clock, Filter, Download, Image, Copy, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface DepositRequest {
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
  totalDeposits?: number;
}

const DepositsListPage = () => {
  const { status: urlStatus } = useParams<{ status: string }>();
  const navigate = useNavigate();
  const status = urlStatus || 'pending';

  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; type: 'approve' | 'reject' }>({ open: false, type: 'approve' });
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  const loadData = useCallback(async () => {
    setIsLoading(true);

    // Load counts for all statuses
    const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
      supabase.from('transaction_requests').select('id', { count: 'exact', head: true }).eq('type', 'deposit').eq('status', 'pending'),
      supabase.from('transaction_requests').select('id', { count: 'exact', head: true }).eq('type', 'deposit').eq('status', 'approved'),
      supabase.from('transaction_requests').select('id', { count: 'exact', head: true }).eq('type', 'deposit').eq('status', 'rejected'),
    ]);

    setStats({
      pending: pendingRes.count || 0,
      approved: approvedRes.count || 0,
      rejected: rejectedRes.count || 0
    });

    // Load deposits for current status
    const { data: depositsData } = await supabase
      .from('transaction_requests')
      .select('*')
      .eq('type', 'deposit')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(100);

    if (depositsData && depositsData.length > 0) {
      const userIds = depositsData.map(d => d.user_id);
      
      const [profilesRes, walletsRes, totalDepositsRes] = await Promise.all([
        supabase.from('profiles').select('id, username, phone, display_user_id').in('id', userIds),
        supabase.from('wallets').select('user_id, balance').in('user_id', userIds),
        supabase.from('transaction_requests')
          .select('user_id, amount')
          .eq('type', 'deposit')
          .eq('status', 'approved')
          .in('user_id', userIds)
      ]);

      const profileMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);
      const walletMap = new Map(walletsRes.data?.map(w => [w.user_id, w]) || []);
      
      // Calculate total deposits per user
      const totalDepositsMap = new Map<string, number>();
      totalDepositsRes.data?.forEach(d => {
        const current = totalDepositsMap.get(d.user_id) || 0;
        totalDepositsMap.set(d.user_id, current + d.amount);
      });

      setDeposits(depositsData.map(d => ({
        ...d,
        profile: profileMap.get(d.user_id),
        wallet: walletMap.get(d.user_id),
        totalDeposits: totalDepositsMap.get(d.user_id) || 0
      })));
    } else {
      setDeposits([]);
    }

    setIsLoading(false);
  }, [status]);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('deposits-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaction_requests' }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const handleAction = async (type: 'approve' | 'reject') => {
    if (!selectedDeposit) return;
    setProcessing(true);

    try {
      const { error } = await supabase.functions.invoke('process-deposit', {
        body: {
          requestId: selectedDeposit.id,
          action: type,
          adminNotes: adminNotes || `Deposit ${type}d by admin`
        }
      });

      if (error) throw error;

      toast.success(`Deposit ${type}d successfully`);
      setDetailsOpen(false);
      setConfirmDialog({ open: false, type: 'approve' });
      setAdminNotes('');
      loadData();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${type} deposit`);
    }

    setProcessing(false);
  };

  const openDetails = (deposit: DepositRequest) => {
    setSelectedDeposit(deposit);
    setAdminNotes(deposit.admin_notes || '');
    setDetailsOpen(true);
  };

  const filteredDeposits = deposits.filter(d => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      d.profile?.username?.toLowerCase().includes(query) ||
      d.profile?.phone?.toLowerCase().includes(query) ||
      d.profile?.display_user_id?.toLowerCase().includes(query) ||
      d.id.toLowerCase().includes(query) ||
      d.payment_details?.txid?.toLowerCase().includes(query) ||
      d.payment_details?.sender_number?.toLowerCase().includes(query)
    );
  });

  const formatAmount = (amount: number) => `৳${amount.toLocaleString()}`;

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
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
      onClick={() => navigate(`/admin/deposits/${tabStatus}`)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
        status === tabStatus 
          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      {label}
      <span className={`px-1.5 py-0.5 rounded text-xs ${
        status === tabStatus ? 'bg-amber-500/30' : 'bg-slate-700'
      }`}>
        {count}
      </span>
    </button>
  );

  return (
    <NewAdminShell 
      title="Deposits" 
      description={`${status.charAt(0).toUpperCase() + status.slice(1)} deposit requests`}
    >
      {/* Status Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <StatusTab tabStatus="pending" count={stats.pending} label="Pending" />
        <StatusTab tabStatus="approved" count={stats.approved} label="Approved" />
        <StatusTab tabStatus="rejected" count={stats.rejected} label="Rejected" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by user, phone, txid..."
            className="pl-9 bg-slate-800/50 border-slate-700 text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={loadData}
          className="border-slate-700 text-slate-400"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-400">Request ID</TableHead>
                <TableHead className="text-slate-400">User</TableHead>
                <TableHead className="text-slate-400">Amount</TableHead>
                <TableHead className="text-slate-400">Method</TableHead>
                <TableHead className="text-slate-400">Sender Info</TableHead>
                <TableHead className="text-slate-400">Time</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-slate-700">
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-400" />
                  </TableCell>
                </TableRow>
              ) : filteredDeposits.length === 0 ? (
                <TableRow className="border-slate-700">
                  <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                    No {status} deposits found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeposits.map((deposit) => (
                  <TableRow key={deposit.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="font-mono text-xs text-slate-400">
                      {deposit.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-white text-sm">{deposit.profile?.username || deposit.profile?.phone || 'Unknown'}</p>
                        <p className="text-slate-500 text-xs">{deposit.profile?.display_user_id}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-amber-400 font-bold">
                      {formatAmount(deposit.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-600 text-slate-300 capitalize">
                        {deposit.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {deposit.payment_details?.txid || deposit.payment_details?.sender_number || '-'}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {format(new Date(deposit.created_at), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(deposit.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDetails(deposit)}
                          className="h-8 px-2 text-slate-400 hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 h-8 px-2"
                              onClick={() => {
                                setSelectedDeposit(deposit);
                                setConfirmDialog({ open: true, type: 'approve' });
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 px-2"
                              onClick={() => {
                                setSelectedDeposit(deposit);
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
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-green-400" />
              Deposit Details
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Request ID: {selectedDeposit?.id.slice(0, 8)}...
            </DialogDescription>
          </DialogHeader>

          {selectedDeposit && (
            <div className="space-y-4">
              {/* User Summary */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2">User Profile</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Username</p>
                    <p className="text-white">{selectedDeposit.profile?.username || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="text-white">{selectedDeposit.profile?.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Current Balance</p>
                    <p className="text-amber-400 font-bold">{formatAmount(selectedDeposit.wallet?.balance || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total Deposits</p>
                    <p className="text-green-400">{formatAmount(selectedDeposit.totalDeposits || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Deposit Info */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2">Deposit Info</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount</span>
                    <span className="text-amber-400 font-bold text-lg">{formatAmount(selectedDeposit.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Method</span>
                    <Badge variant="outline" className="border-slate-600 capitalize">{selectedDeposit.payment_method}</Badge>
                  </div>
                  {selectedDeposit.payment_details?.txid && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Transaction ID</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono text-sm">{selectedDeposit.payment_details.txid}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                          navigator.clipboard.writeText(selectedDeposit.payment_details.txid);
                          toast.success('Copied!');
                        }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {selectedDeposit.payment_details?.sender_number && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sender Number</span>
                      <span className="text-white">{selectedDeposit.payment_details.sender_number}</span>
                    </div>
                  )}
                  {selectedDeposit.payment_details?.screenshot_url && (
                    <div>
                      <span className="text-slate-400 block mb-2">Payment Screenshot</span>
                      <a 
                        href={selectedDeposit.payment_details.screenshot_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-amber-400 hover:text-amber-300"
                      >
                        <Image className="h-4 w-4" />
                        View Screenshot
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              {selectedDeposit.status === 'pending' && (
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Admin Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes (optional)..."
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={3}
                  />
                </div>
              )}

              {selectedDeposit.admin_notes && selectedDeposit.status !== 'pending' && (
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Admin Notes</h4>
                  <p className="text-white">{selectedDeposit.admin_notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDetailsOpen(false)} className="border-slate-600">
              Close
            </Button>
            {selectedDeposit?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setConfirmDialog({ open: true, type: 'reject' })}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setConfirmDialog({ open: true, type: 'approve' })}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !processing && setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {confirmDialog.type === 'approve' ? 'Approve' : 'Reject'} Deposit?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {confirmDialog.type === 'approve' ? (
                <>Approve & credit <span className="text-amber-400 font-bold">{formatAmount(selectedDeposit?.amount || 0)}</span> to user's wallet?</>
              ) : (
                <>Reject this deposit request?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing} className="bg-slate-700 border-slate-600 text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction(confirmDialog.type)}
              disabled={processing}
              className={confirmDialog.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : confirmDialog.type === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </NewAdminShell>
  );
};

export default DepositsListPage;
