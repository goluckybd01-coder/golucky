import { useState, useEffect, useCallback } from 'react';
import {
  Activity, Search, RefreshCw, Filter, Calendar, ArrowDownCircle,
  ArrowUpCircle, Gamepad2, Gift, Coins, Download
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { NewAdminShell } from '@/components/admin/NewAdminShell';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
  trade_id: string | null;
  created_at: string;
  profile?: { username: string; phone: string; display_user_id: string };
  balance_after?: number;
}

const NewTransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const validTypes = ['deposit', 'withdraw', 'bet', 'win', 'bonus', 'referral'] as const;
    let query = supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false }).limit(200);
    if (typeFilter !== 'all' && validTypes.includes(typeFilter as any)) {
      query = query.eq('type', typeFilter as typeof validTypes[number]);
    }
    if (dateFilter !== 'all') {
      const now = new Date();
      if (dateFilter === 'today') { now.setHours(0, 0, 0, 0); query = query.gte('created_at', now.toISOString()); }
      else if (dateFilter === 'week') { now.setDate(now.getDate() - 7); query = query.gte('created_at', now.toISOString()); }
      else if (dateFilter === 'month') { now.setMonth(now.getMonth() - 1); query = query.gte('created_at', now.toISOString()); }
    }
    const { data: txData } = await query;
    if (txData && txData.length > 0) {
      const userIds = [...new Set(txData.map(t => t.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, username, phone, display_user_id').in('id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      setTransactions(txData.map(t => ({ ...t, type: t.type as string, profile: profileMap.get(t.user_id) })) as Transaction[]);
    } else setTransactions([]);
    setIsLoading(false);
  }, [typeFilter, dateFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredTransactions = transactions.filter(t => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return t.profile?.username?.toLowerCase().includes(query) || t.profile?.phone?.toLowerCase().includes(query) ||
      t.profile?.display_user_id?.toLowerCase().includes(query) || t.id.toLowerCase().includes(query) || t.trade_id?.toLowerCase().includes(query);
  });

  const formatAmount = (amount: number) => `৳${Math.abs(amount).toLocaleString()}`;
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownCircle className="h-4 w-4 text-green-400" />;
      case 'withdraw': return <ArrowUpCircle className="h-4 w-4 text-orange-400" />;
      case 'bet': return <Gamepad2 className="h-4 w-4 text-purple-400" />;
      case 'win': return <Coins className="h-4 w-4 text-amber-400" />;
      case 'bonus': return <Gift className="h-4 w-4 text-pink-400" />;
      default: return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };
  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      deposit: 'bg-green-500/20 text-green-400 border-green-500/30', withdraw: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      bet: 'bg-purple-500/20 text-purple-400 border-purple-500/30', win: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      bonus: 'bg-pink-500/20 text-pink-400 border-pink-500/30', adjust: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };
    return <Badge className={colors[type] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}>{type}</Badge>;
  };

  return (
    <NewAdminShell title="Transactions" description="View all wallet transactions">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input placeholder="Search by user, txn ID..." className="pl-9 bg-slate-800/50 border-slate-700 text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700 text-white"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="withdraw">Withdraw</SelectItem>
            <SelectItem value="bet">Bet</SelectItem>
            <SelectItem value="win">Win</SelectItem>
            <SelectItem value="bonus">Bonus</SelectItem>
            <SelectItem value="adjust">Adjust</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700 text-white"><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadData} className="border-slate-700 text-slate-400">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>
      <Card className="bg-slate-800/50 border-slate-700">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-400">Txn ID</TableHead>
                <TableHead className="text-slate-400">User</TableHead>
                <TableHead className="text-slate-400">Type</TableHead>
                <TableHead className="text-slate-400">Amount</TableHead>
                <TableHead className="text-slate-400">Description</TableHead>
                <TableHead className="text-slate-400">Time</TableHead>
                <TableHead className="text-slate-400">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-slate-700"><TableCell colSpan={7} className="text-center py-8"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-400" /></TableCell></TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow className="border-slate-700"><TableCell colSpan={7} className="text-center text-slate-500 py-8">No transactions found</TableCell></TableRow>
              ) : filteredTransactions.map((tx) => (
                <TableRow key={tx.id} className="border-slate-700 hover:bg-slate-700/30">
                  <TableCell className="font-mono text-xs text-slate-400">{tx.id.slice(0, 8)}...</TableCell>
                  <TableCell><div><p className="text-white text-sm">{tx.profile?.username || tx.profile?.phone || 'Unknown'}</p><p className="text-slate-500 text-xs">{tx.profile?.display_user_id}</p></div></TableCell>
                  <TableCell><div className="flex items-center gap-2">{getTypeIcon(tx.type)}{getTypeBadge(tx.type)}</div></TableCell>
                  <TableCell className={`font-bold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>{tx.amount >= 0 ? '+' : '-'}{formatAmount(tx.amount)}</TableCell>
                  <TableCell className="text-slate-400 text-sm max-w-[200px] truncate">{tx.description}</TableCell>
                  <TableCell className="text-slate-400 text-sm">{format(new Date(tx.created_at), 'MMM d, HH:mm')}</TableCell>
                  <TableCell><Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">{tx.trade_id ? 'System' : 'Admin'}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </NewAdminShell>
  );
};

export default NewTransactionsPage;
