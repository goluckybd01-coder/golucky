import { useState, useEffect, useCallback } from 'react';
import {
  Wallet, RefreshCw, Check, X, AlertTriangle, Search, Filter,
  Calendar, Download, Eye, Clock, User, DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatTaka } from '@/lib/currency';
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
  processed_by: string | null;
  profile?: {
    username: string;
    display_user_id: string;
    phone: string;
  };
  wallet?: {
    balance: number;
    total_deposit: number;
    total_withdraw: number;
  };
}

export const WithdrawRequestsModule = () => {
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<WithdrawRequest | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    pendingAmount: 0,
    approvedToday: 0,
    rejectedToday: 0,
  });
  
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build query
      let query = supabase
        .from('transaction_requests')
        .select('*')
        .eq('type', 'withdraw')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Enrich with profile and wallet data
      if (data) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        
        const [profilesResult, walletsResult] = await Promise.all([
          supabase.from('profiles').select('user_id, username, display_user_id, phone').in('user_id', userIds),
          supabase.from('wallets').select('user_id, balance, total_deposit, total_withdraw').in('user_id', userIds),
        ]);
        
        const profileMap = new Map(profilesResult.data?.map(p => [p.user_id, p]) || []);
        const walletMap = new Map(walletsResult.data?.map(w => [w.user_id, w]) || []);
        
        const enriched = data.map(r => ({
          ...r,
          profile: profileMap.get(r.user_id),
          wallet: walletMap.get(r.user_id),
        }));
        
        setRequests(enriched);
      }
      
      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [pendingResult, approvedResult, rejectedResult] = await Promise.all([
        supabase.from('transaction_requests').select('amount').eq('type', 'withdraw').eq('status', 'pending'),
        supabase.from('transaction_requests').select('*', { count: 'exact', head: true }).eq('type', 'withdraw').eq('status', 'approved').gte('processed_at', today.toISOString()),
        supabase.from('transaction_requests').select('*', { count: 'exact', head: true }).eq('type', 'withdraw').eq('status', 'rejected').gte('processed_at', today.toISOString()),
      ]);
      
      setStats({
        pending: pendingResult.data?.length || 0,
        pendingAmount: pendingResult.data?.reduce((sum, r) => sum + r.amount, 0) || 0,
        approvedToday: approvedResult.count || 0,
        rejectedToday: rejectedResult.count || 0,
      });
    } catch (error) {
      console.error('Error loading withdraw requests:', error);
      toast.error('Failed to load withdraw requests');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);
  
  useEffect(() => {
    loadData();
    
    // Real-time subscription
    const channel = supabase
      .channel('withdraw-requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transaction_requests', filter: 'type=eq.withdraw' },
        () => loadData()
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);
  
  const handleAction = async () => {
    if (!selectedRequest) return;
    
    setIsProcessing(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      if (actionType === 'approve') {
        // Deduct from wallet
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', selectedRequest.user_id)
          .single();
        
        if (!wallet || wallet.balance < selectedRequest.amount) {
          toast.error('Insufficient balance');
          return;
        }
        
        // Update wallet
        await supabase
          .from('wallets')
          .update({
            balance: wallet.balance - selectedRequest.amount,
            total_withdraw: (selectedRequest.wallet?.total_withdraw || 0) + selectedRequest.amount,
          })
          .eq('user_id', selectedRequest.user_id);
        
        // Record in ledger
        await supabase.from('wallet_ledger').insert([{
          user_id: selectedRequest.user_id,
          ledger_type: 'WITHDRAW_ADMIN',
          amount: -selectedRequest.amount,
          net_amount: -selectedRequest.amount,
          balance_after: wallet.balance - selectedRequest.amount,
          balance_before: wallet.balance,
          reference_id: selectedRequest.id,
        }]);
      }
      
      // Update request status
      await supabase
        .from('transaction_requests')
        .update({
          status: actionType === 'approve' ? 'approved' : 'rejected',
          admin_notes: adminNotes,
          processed_at: new Date().toISOString(),
          processed_by: user?.id,
        })
        .eq('id', selectedRequest.id);
      
      // Log to audit
      await supabase.from('staff_audit_logs').insert([{
        staff_id: user?.id,
        action: `withdraw_${actionType}`,
        module: 'withdrawals',
        target_type: 'transaction_request',
        target_id: selectedRequest.id,
        new_value: { amount: selectedRequest.amount, notes: adminNotes },
      }]);
      
      toast.success(`Withdrawal ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
      setActionDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
      loadData();
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast.error('Failed to process withdrawal');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const filteredRequests = requests.filter(r => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.profile?.username?.toLowerCase().includes(query) ||
      r.profile?.display_user_id?.toLowerCase().includes(query) ||
      r.profile?.phone?.includes(query) ||
      r.id.toLowerCase().includes(query)
    );
  });
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="h-6 w-6 text-red-400" />
            Withdraw Requests
          </h1>
          <p className="text-gray-400">Super Admin Only - Process user withdrawal requests</p>
        </div>
        
        <Button variant="outline" onClick={loadData} className="border-gray-700 text-gray-400">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-yellow-900/20 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <p className="text-xs text-yellow-400 uppercase">Pending</p>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            <p className="text-sm text-yellow-400/70">{formatTaka(stats.pendingAmount)}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-900/20 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-4 w-4 text-green-400" />
              <p className="text-xs text-green-400 uppercase">Approved Today</p>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.approvedToday}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-900/20 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <X className="h-4 w-4 text-red-400" />
              <p className="text-xs text-red-400 uppercase">Rejected Today</p>
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.rejectedToday}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <p className="text-xs text-orange-400 uppercase">Requires Attention</p>
            </div>
            <p className="text-2xl font-bold text-white">{stats.pending > 10 ? 'High' : stats.pending > 5 ? 'Medium' : 'Low'}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by username, ID, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900/50 border-gray-800 text-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-gray-900/50 border-gray-800 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Requests Table */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Withdrawal Requests</CardTitle>
          <CardDescription className="text-gray-400">
            {filteredRequests.length} requests found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-400">User</TableHead>
                  <TableHead className="text-gray-400">Amount</TableHead>
                  <TableHead className="text-gray-400">Method</TableHead>
                  <TableHead className="text-gray-400">Balance</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Time</TableHead>
                  <TableHead className="text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id} className="border-gray-800">
                    <TableCell>
                      <div>
                        <p className="text-white font-medium">
                          {request.profile?.username || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {request.profile?.display_user_id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-bold">
                      {formatTaka(request.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-gray-300">
                        {request.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {formatTaka(request.wallet?.balance || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        request.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        request.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {format(new Date(request.created_at), 'MMM dd, HH:mm')}
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 h-7 px-2"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionType('approve');
                              setActionDialogOpen(true);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionType('reject');
                              setActionDialogOpen(true);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-gray-400"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No withdrawal requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {actionType === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {actionType === 'approve' 
                ? 'This will deduct the amount from user wallet and mark as approved.'
                : 'This will reject the withdrawal request.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">User</p>
                  <p className="text-white font-medium">{selectedRequest.profile?.username}</p>
                  <p className="text-xs text-gray-400">{selectedRequest.profile?.display_user_id}</p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-2xl font-bold text-white">{formatTaka(selectedRequest.amount)}</p>
                </div>
              </div>
              
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Payment Details</p>
                <p className="text-white">{selectedRequest.payment_method}</p>
                {selectedRequest.payment_details && (
                  <pre className="text-xs text-gray-400 mt-1">
                    {JSON.stringify(selectedRequest.payment_details, null, 2)}
                  </pre>
                )}
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-2">Admin Notes (Optional)</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes for this action..."
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={isProcessing}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : actionType === 'approve' ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
