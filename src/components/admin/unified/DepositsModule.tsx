import { useState, useEffect, useCallback } from 'react';
import {
  ArrowDownCircle, RefreshCw, Check, X, Search, Eye, Clock,
  TrendingUp, Filter, Calendar, Download, Zap, AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatTaka } from '@/lib/currency';
import { format, formatDistanceToNow } from 'date-fns';
import { LiveIndicator } from '@/components/admin/LiveIndicator';

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
    display_user_id: string;
    phone: string;
  };
}

export const DepositsModule = () => {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [stats, setStats] = useState({
    pending: 0,
    pendingAmount: 0,
    approvedToday: 0,
    approvedAmountToday: 0,
  });
  
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('transaction_requests')
        .select('*')
        .eq('type', 'deposit')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_user_id, phone')
          .in('user_id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        const enriched = data.map(r => ({
          ...r,
          profile: profileMap.get(r.user_id),
        }));
        
        setDeposits(enriched);
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [pendingResult, approvedResult] = await Promise.all([
        supabase.from('transaction_requests').select('amount').eq('type', 'deposit').eq('status', 'pending'),
        supabase.from('transaction_requests').select('amount').eq('type', 'deposit').eq('status', 'approved').gte('processed_at', today.toISOString()),
      ]);
      
      setStats({
        pending: pendingResult.data?.length || 0,
        pendingAmount: pendingResult.data?.reduce((sum, r) => sum + r.amount, 0) || 0,
        approvedToday: approvedResult.data?.length || 0,
        approvedAmountToday: approvedResult.data?.reduce((sum, r) => sum + r.amount, 0) || 0,
      });
    } catch (error) {
      console.error('Error loading deposits:', error);
      toast.error('Failed to load deposits');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);
  
  useEffect(() => {
    loadData();
    
    const channel = supabase
      .channel('deposits-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transaction_requests', filter: 'type=eq.deposit' },
        () => loadData()
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);
  
  const handleAction = async () => {
    if (!selectedDeposit) return;
    
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-deposit', {
        body: {
          depositId: selectedDeposit.id,
          action: actionType,
          adminNotes: adminNotes,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to process deposit');

      if (actionType === 'approve') {
        toast.success(`Deposit approved! New balance: ${formatTaka(data.newBalance)}`);
      } else {
        toast.success('Deposit rejected');
      }
      
      setActionDialogOpen(false);
      setSelectedDeposit(null);
      setAdminNotes('');
      loadData();
    } catch (error: any) {
      console.error('Error processing deposit:', error);
      toast.error(error.message || 'Failed to process deposit');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const filteredDeposits = deposits.filter(d => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      d.profile?.username?.toLowerCase().includes(query) ||
      d.profile?.display_user_id?.toLowerCase().includes(query) ||
      d.profile?.phone?.includes(query)
    );
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowDownCircle className="h-6 w-6 text-emerald-400" />
            Deposit Requests
          </h1>
          <p className="text-slate-400">Live deposit feed with real-time updates</p>
        </div>
        <div className="flex items-center gap-3">
          <LiveIndicator />
          <Button variant="outline" onClick={loadData} className="border-slate-700 hover:bg-slate-800">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
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
            <p className="text-sm text-green-400/70">{formatTaka(stats.approvedAmountToday)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <p className="text-xs text-gray-500 uppercase">Avg Amount</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatTaka(stats.pendingAmount / (stats.pending || 1))}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-purple-400" />
              <p className="text-xs text-gray-500 uppercase">Today's Volume</p>
            </div>
            <p className="text-2xl font-bold text-white">{formatTaka(stats.approvedAmountToday)}</p>
          </CardContent>
        </Card>
      </div>
      
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
      
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Deposit Requests</CardTitle>
          <CardDescription className="text-gray-400">
            {filteredDeposits.length} requests found
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
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Time</TableHead>
                  <TableHead className="text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeposits.map((deposit) => (
                  <TableRow key={deposit.id} className="border-gray-800">
                    <TableCell>
                      <div>
                        <p className="text-white font-medium">
                          {deposit.profile?.username || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {deposit.profile?.display_user_id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-bold">
                      {formatTaka(deposit.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-gray-300">
                        {deposit.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        deposit.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        deposit.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }>
                        {deposit.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {format(new Date(deposit.created_at), 'MMM dd, HH:mm')}
                    </TableCell>
                    <TableCell>
                      {deposit.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 h-7 px-2"
                            onClick={() => {
                              setSelectedDeposit(deposit);
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
                              setSelectedDeposit(deposit);
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
                          onClick={() => setSelectedDeposit(deposit)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDeposits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No deposit requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {actionType === 'approve' ? 'Approve Deposit' : 'Reject Deposit'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {actionType === 'approve' 
                ? 'This will add the amount to user wallet.'
                : 'This will reject the deposit request.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDeposit && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">User</p>
                  <p className="text-white font-medium">{selectedDeposit.profile?.username}</p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-2xl font-bold text-green-400">{formatTaka(selectedDeposit.amount)}</p>
                </div>
              </div>
              
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Payment Details</p>
                <p className="text-white">{selectedDeposit.payment_method}</p>
                {selectedDeposit.payment_details && (
                  <pre className="text-xs text-gray-400 mt-1">
                    {JSON.stringify(selectedDeposit.payment_details, null, 2)}
                  </pre>
                )}
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-2">Admin Notes (Optional)</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes..."
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
