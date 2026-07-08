import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users, Search, RefreshCw, Eye, Lock, Unlock, Wallet,
  History, ArrowDownCircle, ArrowUpCircle, UserPlus, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NewAdminShell } from '@/components/admin/NewAdminShell';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface User {
  id: string;
  username: string | null;
  phone: string | null;
  display_user_id: string;
  is_frozen: boolean;
  is_admin?: boolean;
  agent_status: string;
  created_at: string;
  updated_at: string | null;
  wallet?: { balance: number };
}

interface UserTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

interface UserDeposit {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
}

const NewUsersPage = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [userTransactions, setUserTransactions] = useState<UserTransaction[]>([]);
  const [userDeposits, setUserDeposits] = useState<UserDeposit[]>([]);
  const [userWithdrawals, setUserWithdrawals] = useState<UserDeposit[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    blocked: 0,
    agents: 0
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);

    // Load all users with wallets
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (statusFilter === 'active') {
      query = query.eq('is_frozen', false);
    } else if (statusFilter === 'blocked') {
      query = query.eq('is_frozen', true);
    } else if (statusFilter === 'agent') {
      query = query.eq('agent_status', 'approved');
    }

    const { data: usersData } = await query;

    if (usersData && usersData.length > 0) {
      const userIds = usersData.map(u => u.id);
      const { data: wallets } = await supabase
        .from('wallets')
        .select('user_id, balance')
        .in('user_id', userIds);

      const walletMap = new Map(wallets?.map(w => [w.user_id, w]) || []);

      const enrichedUsers = usersData.map(u => ({
        ...u,
        wallet: walletMap.get(u.id)
      }));

      setUsers(enrichedUsers as User[]);

      // Calculate stats
      setStats({
        total: enrichedUsers.length,
        active: enrichedUsers.filter(u => !u.is_frozen).length,
        blocked: enrichedUsers.filter(u => u.is_frozen).length,
        agents: enrichedUsers.filter(u => u.agent_status === 'approved').length
      });
    } else {
      setUsers([]);
    }

    setIsLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadUserDetails = async (user: User) => {
    setLoadingDetails(true);
    setSelectedUser(user);
    setDetailsOpen(true);

    const [transactionsRes, depositsRes, withdrawalsRes] = await Promise.all([
      supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('transaction_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'deposit')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('transaction_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'withdraw')
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    setUserTransactions(transactionsRes.data || []);
    setUserDeposits(depositsRes.data || []);
    setUserWithdrawals(withdrawalsRes.data || []);
    setLoadingDetails(false);
  };

  const handleToggleFreeze = async (user: User) => {
    const newStatus = !user.is_frozen;
    
    const { error } = await supabase
      .from('profiles')
      .update({ is_frozen: newStatus })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update user status');
      return;
    }

    toast.success(newStatus ? 'User blocked' : 'User unblocked');
    loadData();
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.username?.toLowerCase().includes(query) ||
      u.phone?.toLowerCase().includes(query) ||
      u.display_user_id?.toLowerCase().includes(query) ||
      u.id.toLowerCase().includes(query)
    );
  });

  const formatAmount = (amount: number) => `৳${amount.toLocaleString()}`;

  const getStatusBadge = (user: User) => {
    if (user.is_frozen) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Blocked</Badge>;
    }
    if (user.agent_status === 'approved') {
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Agent</Badge>;
    }
    if (user.is_admin) {
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Admin</Badge>;
    }
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
  };

  const getRoleBadge = (user: User) => {
    if (user.is_admin) return 'Admin';
    if (user.agent_status === 'approved') return 'Agent';
    return 'User';
  };

  return (
    <NewAdminShell title="Users" description="Manage all registered users">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-slate-400">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Unlock className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
                <p className="text-xs text-slate-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Lock className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.blocked}</p>
                <p className="text-xs text-slate-400">Blocked</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserPlus className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.agents}</p>
                <p className="text-xs text-slate-400">Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by user ID, phone, email..."
            className="pl-9 bg-slate-800/50 border-slate-700 text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="agent">Agents</SelectItem>
          </SelectContent>
        </Select>
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
                <TableHead className="text-slate-400">User ID</TableHead>
                <TableHead className="text-slate-400">Phone/Email</TableHead>
                <TableHead className="text-slate-400">Role</TableHead>
                <TableHead className="text-slate-400">Wallet Balance</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Created</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-slate-700">
                  <TableCell colSpan={7} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-400" />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow className="border-slate-700">
                  <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell>
                      <p className="text-white font-medium">{user.display_user_id}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-white">{user.username || user.phone || '-'}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-400">{getRoleBadge(user)}</span>
                    </TableCell>
                    <TableCell className="text-amber-400 font-bold">
                      {formatAmount(user.wallet?.balance || 0)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user)}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => loadUserDetails(user)}
                          className="h-8 px-2 text-slate-400 hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleFreeze(user)}
                          className={`h-8 px-2 ${user.is_frozen ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'}`}
                        >
                          {user.is_frozen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* User Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-400" />
              User Profile
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedUser?.display_user_id}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-slate-700/50 border-slate-600">
                <TabsTrigger value="overview" className="data-[state=active]:bg-amber-500/20">Overview</TabsTrigger>
                <TabsTrigger value="transactions" className="data-[state=active]:bg-amber-500/20">Transactions</TabsTrigger>
                <TabsTrigger value="deposits" className="data-[state=active]:bg-amber-500/20">Deposits</TabsTrigger>
                <TabsTrigger value="withdrawals" className="data-[state=active]:bg-amber-500/20">Withdrawals</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="space-y-4">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Username</p>
                        <p className="text-white">{selectedUser.username || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="text-white">{selectedUser.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Wallet Balance</p>
                        <p className="text-amber-400 font-bold text-xl">{formatAmount(selectedUser.wallet?.balance || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Status</p>
                        {getStatusBadge(selectedUser)}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Created</p>
                        <p className="text-white">{format(new Date(selectedUser.created_at), 'PPP')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Last Updated</p>
                        <p className="text-white">{selectedUser.updated_at ? format(new Date(selectedUser.updated_at), 'PPP') : 'Never'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="transactions" className="mt-4">
                <ScrollArea className="h-[300px]">
                  {loadingDetails ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
                    </div>
                  ) : userTransactions.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No transactions</p>
                  ) : (
                    <div className="space-y-2">
                      {userTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                          <div>
                            <p className="text-white text-sm">{tx.description}</p>
                            <p className="text-slate-500 text-xs">{format(new Date(tx.created_at), 'PPP p')}</p>
                          </div>
                          <span className={`font-bold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.amount >= 0 ? '+' : ''}{formatAmount(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="deposits" className="mt-4">
                <ScrollArea className="h-[300px]">
                  {loadingDetails ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
                    </div>
                  ) : userDeposits.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No deposits</p>
                  ) : (
                    <div className="space-y-2">
                      {userDeposits.map((d) => (
                        <div key={d.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <ArrowDownCircle className="h-5 w-5 text-green-400" />
                            <div>
                              <p className="text-white text-sm">{d.payment_method}</p>
                              <p className="text-slate-500 text-xs">{format(new Date(d.created_at), 'PPP')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-bold">{formatAmount(d.amount)}</p>
                            <Badge variant="outline" className="text-xs capitalize">{d.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="withdrawals" className="mt-4">
                <ScrollArea className="h-[300px]">
                  {loadingDetails ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
                    </div>
                  ) : userWithdrawals.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No withdrawals</p>
                  ) : (
                    <div className="space-y-2">
                      {userWithdrawals.map((w) => (
                        <div key={w.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <ArrowUpCircle className="h-5 w-5 text-orange-400" />
                            <div>
                              <p className="text-white text-sm">{w.payment_method}</p>
                              <p className="text-slate-500 text-xs">{format(new Date(w.created_at), 'PPP')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-orange-400 font-bold">{formatAmount(w.amount)}</p>
                            <Badge variant="outline" className="text-xs capitalize">{w.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </NewAdminShell>
  );
};

export default NewUsersPage;
