import { useState, useEffect, useCallback } from 'react';
import {
  Users, RefreshCw, Search, UserX, UserCheck, Eye, Shield,
  TrendingUp, Wallet, Calendar, Filter, Download, CheckSquare,
  MoreHorizontal, AlertCircle, Star, ArrowUpDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatTaka } from '@/lib/currency';
import { format } from 'date-fns';
import { LiveIndicator } from '@/components/admin/LiveIndicator';

interface User {
  id: string;
  user_id: string;
  username: string;
  display_user_id: string;
  phone: string;
  vip_level: number;
  is_frozen: boolean;
  is_suspended: boolean;
  agent_status: string | null;
  created_at: string;
  wallet?: {
    balance: number;
    total_deposit: number;
    total_withdraw: number;
    total_bet: number;
    total_win: number;
  };
}

type SortField = 'username' | 'balance' | 'total_bet' | 'created_at' | 'vip_level';
type SortOrder = 'asc' | 'desc';

export const UsersModule = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vipFilter, setVipFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false);
  const [freezeReason, setFreezeReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const PAGE_SIZE = 50;
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    frozen: 0,
    newToday: 0,
    totalBalance: 0,
  });
  
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('profiles').select('*', { count: 'exact' });

      const q = searchQuery.trim();
      if (q) {
        const esc = q.replace(/[%,]/g, '');
        query = query.or(
          `display_user_id.ilike.%${esc}%,username.ilike.%${esc}%,phone.ilike.%${esc}%,user_id.ilike.%${esc}%`
        );
      }
      query = query
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (statusFilter === 'frozen') {
        query = query.eq('is_frozen', true);
      } else if (statusFilter === 'active') {
        query = query.eq('is_frozen', false);
      } else if (statusFilter === 'agents') {
        query = query.not('agent_status', 'is', null);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      setTotalCount(count || 0);
      
      if (data) {
        const userIds = data.map(u => u.user_id);
        
        const { data: wallets } = await supabase
          .from('wallets')
          .select('user_id, balance, total_deposit, total_withdraw, total_bet, total_win')
          .in('user_id', userIds);
        
        const walletMap = new Map(wallets?.map(w => [w.user_id, w]) || []);
        
        const enriched = data.map(u => ({
          ...u,
          wallet: walletMap.get(u.user_id),
        }));
        
        setUsers(enriched);
      }
      
      // Stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [totalResult, frozenResult, newResult, balanceResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_frozen', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('wallets').select('balance'),
      ]);
      
      setStats({
        total: totalResult.count || 0,
        active: (totalResult.count || 0) - (frozenResult.count || 0),
        frozen: frozenResult.count || 0,
        newToday: newResult.count || 0,
        totalBalance: balanceResult.data?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0,
      });
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery, page]);

  useEffect(() => {
    const t = setTimeout(() => loadData(), searchQuery ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadData, searchQuery]);

  // Reset to page 0 when filter or query changes
  useEffect(() => { setPage(0); }, [searchQuery, statusFilter]);
  
  const handleFreeze = async () => {
    if (!selectedUser) return;
    
    setIsProcessing(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const newFrozenState = !selectedUser.is_frozen;
      
      await supabase
        .from('profiles')
        .update({
          is_frozen: newFrozenState,
          suspended_at: newFrozenState ? new Date().toISOString() : null,
          suspended_by: newFrozenState ? user?.id : null,
          suspension_reason: newFrozenState ? freezeReason : null,
        })
        .eq('id', selectedUser.id);
      
      await supabase.from('staff_audit_logs').insert([{
        staff_id: user?.id,
        action: newFrozenState ? 'user_freeze' : 'user_unfreeze',
        module: 'users',
        target_type: 'profile',
        target_id: selectedUser.id,
        new_value: { frozen: newFrozenState, reason: freezeReason },
      }]);
      
      toast.success(`User ${newFrozenState ? 'frozen' : 'unfrozen'} successfully`);
      setFreezeDialogOpen(false);
      setFreezeReason('');
      setSelectedUser(null);
      loadData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.username?.toLowerCase().includes(query) ||
      u.display_user_id?.toLowerCase().includes(query) ||
      u.phone?.includes(query) ||
      u.user_id.toLowerCase().includes(query)
    );
  });
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-400" />
            User Management
          </h1>
          <p className="text-gray-400">View and manage all registered users</p>
        </div>
        
        <Button variant="outline" onClick={loadData} className="border-gray-700 text-gray-400">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-400" />
              <p className="text-xs text-gray-500 uppercase">Total Users</p>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-900/20 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="h-4 w-4 text-green-400" />
              <p className="text-xs text-green-400 uppercase">Active</p>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-900/20 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserX className="h-4 w-4 text-red-400" />
              <p className="text-xs text-red-400 uppercase">Frozen</p>
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.frozen}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-purple-400" />
              <p className="text-xs text-gray-500 uppercase">New Today</p>
            </div>
            <p className="text-2xl font-bold text-purple-400">{stats.newToday}</p>
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
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="frozen">Frozen</SelectItem>
            <SelectItem value="agents">Agents</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/40 border border-gray-800 rounded-lg">
        <p className="text-sm text-gray-300">
          <span className="text-white font-semibold">{totalCount.toLocaleString()}</span>{' '}
          users matched
          {searchQuery && <span className="text-gray-500"> for "{searchQuery}"</span>}
        </p>
        <p className="text-sm text-gray-400">
          Page <span className="text-white font-semibold">{page + 1}</span> of{' '}
          <span className="text-white font-semibold">
            {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
          </span>
        </p>
      </div>

      {/* Users Table */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Users</CardTitle>
          <CardDescription className="text-gray-400">
            Showing {filteredUsers.length === 0 ? 0 : page * PAGE_SIZE + 1}
            –{page * PAGE_SIZE + filteredUsers.length} of {totalCount}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-400">User</TableHead>
                  <TableHead className="text-gray-400">VIP</TableHead>
                  <TableHead className="text-gray-400 text-right">Balance</TableHead>
                  <TableHead className="text-gray-400 text-right">Total Bet</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Joined</TableHead>
                  <TableHead className="text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-gray-800">
                    <TableCell>
                      <div>
                        <p className="text-white font-medium">{user.username || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{user.display_user_id}</p>
                        <p className="text-xs text-gray-600">{user.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                        VIP {user.vip_level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-white font-medium">
                      {formatTaka(user.wallet?.balance || 0)}
                    </TableCell>
                    <TableCell className="text-right text-gray-400">
                      {formatTaka(user.wallet?.total_bet || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {user.is_frozen ? (
                          <Badge className="bg-red-500/20 text-red-400 w-fit">Frozen</Badge>
                        ) : (
                          <Badge className="bg-green-500/20 text-green-400 w-fit">Active</Badge>
                        )}
                        {user.agent_status && (
                          <Badge variant="outline" className="text-blue-400 w-fit text-xs">
                            Agent
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {format(new Date(user.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-gray-400"
                          onClick={() => {
                            setSelectedUser(user);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={user.is_frozen ? 'default' : 'destructive'}
                          className="h-7 px-2"
                          onClick={() => {
                            setSelectedUser(user);
                            setFreezeDialogOpen(true);
                          }}
                        >
                          {user.is_frozen ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-800 mt-2">
            <p className="text-xs text-gray-500">Page {page + 1} of {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}</p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 0 || isLoading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isLoading || (page + 1) * PAGE_SIZE >= totalCount}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* User Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">User Details</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Username</p>
                  <p className="text-white font-medium">{selectedUser.username}</p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">User ID</p>
                  <p className="text-white font-mono">{selectedUser.display_user_id}</p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-white">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">VIP Level</p>
                  <p className="text-yellow-400 font-bold">VIP {selectedUser.vip_level}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Balance</p>
                  <p className="text-xl font-bold text-white">{formatTaka(selectedUser.wallet?.balance || 0)}</p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Total Deposited</p>
                  <p className="text-xl font-bold text-green-400">{formatTaka(selectedUser.wallet?.total_deposit || 0)}</p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Total Withdrawn</p>
                  <p className="text-xl font-bold text-red-400">{formatTaka(selectedUser.wallet?.total_withdraw || 0)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Total Bet</p>
                  <p className="text-xl font-bold text-blue-400">{formatTaka(selectedUser.wallet?.total_bet || 0)}</p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Total Won</p>
                  <p className="text-xl font-bold text-purple-400">{formatTaka(selectedUser.wallet?.total_win || 0)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Freeze Dialog */}
      <Dialog open={freezeDialogOpen} onOpenChange={setFreezeDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedUser?.is_frozen ? 'Unfreeze User' : 'Freeze User'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedUser?.is_frozen 
                ? 'This will restore the user\'s account access.'
                : 'This will prevent the user from logging in and placing bets.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && !selectedUser.is_frozen && (
            <div className="py-4">
              <p className="text-sm text-gray-400 mb-2">Reason for freezing</p>
              <Textarea
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                placeholder="Enter reason..."
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          )}
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFreezeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFreeze}
              disabled={isProcessing}
              className={selectedUser?.is_frozen ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : selectedUser?.is_frozen ? (
                <UserCheck className="h-4 w-4 mr-2" />
              ) : (
                <UserX className="h-4 w-4 mr-2" />
              )}
              {selectedUser?.is_frozen ? 'Unfreeze' : 'Freeze'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
