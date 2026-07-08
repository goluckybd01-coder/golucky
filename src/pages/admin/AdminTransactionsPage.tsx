import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, RefreshCw, Search, Download, Filter,
  ArrowUpCircle, ArrowDownCircle, Gamepad2, Gift
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { AdminShell } from '@/components/admin/AdminShell';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  balance_after: number | null;
  game_type: string | null;
  trade_id: string | null;
  description: string | null;
  created_at: string;
  profile?: {
    username: string | null;
    display_user_id: string | null;
  };
}

const AdminTransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const validTypes = ['deposit', 'withdraw', 'bet', 'win', 'bonus', 'referral'];
      
      let query = supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (typeFilter !== 'all' && validTypes.includes(typeFilter)) {
        query = query.eq('type', typeFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        const userIds = [...new Set(data.map(t => t.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_user_id')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const enriched: Transaction[] = data.map(t => ({
          id: t.id,
          user_id: t.user_id,
          type: t.type,
          amount: t.amount,
          balance_after: t.balance_after,
          game_type: t.game_type,
          trade_id: t.trade_id,
          description: t.description,
          created_at: t.created_at,
          profile: profileMap.get(t.user_id),
        }));
        setTransactions(enriched);
      }
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownCircle className="h-4 w-4 text-green-400" />;
      case 'withdraw': return <ArrowUpCircle className="h-4 w-4 text-orange-400" />;
      case 'bet': return <Gamepad2 className="h-4 w-4 text-red-400" />;
      case 'win': return <Gamepad2 className="h-4 w-4 text-green-400" />;
      case 'bonus': return <Gift className="h-4 w-4 text-purple-400" />;
      default: return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      deposit: 'bg-green-500/20 text-green-400',
      withdraw: 'bg-orange-500/20 text-orange-400',
      bet: 'bg-red-500/20 text-red-400',
      win: 'bg-emerald-500/20 text-emerald-400',
      bonus: 'bg-purple-500/20 text-purple-400',
    };
    return <Badge className={colors[type] || 'bg-slate-500/20 text-slate-400'}>{type}</Badge>;
  };

  const filtered = transactions.filter(t => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      t.profile?.username?.toLowerCase().includes(search) ||
      t.profile?.display_user_id?.toLowerCase().includes(search) ||
      t.trade_id?.toLowerCase().includes(search) ||
      t.game_type?.toLowerCase().includes(search)
    );
  });

  return (
    <AdminShell title="Transactions" description="View all wallet transactions">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Transaction History</CardTitle>
          <Button variant="outline" size="sm" onClick={loadTransactions} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by user, trade ID, game..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px] bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdraw">Withdraw</SelectItem>
                <SelectItem value="bet">Bet</SelectItem>
                <SelectItem value="win">Win</SelectItem>
                <SelectItem value="bonus">Bonus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-400">User</TableHead>
                  <TableHead className="text-slate-400">Amount</TableHead>
                  <TableHead className="text-slate-400">Balance</TableHead>
                  <TableHead className="text-slate-400">Details</TableHead>
                  <TableHead className="text-slate-400">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tx) => (
                  <TableRow key={tx.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(tx.type)}
                        {getTypeBadge(tx.type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-white">{tx.profile?.username || 'Unknown'}</p>
                        <p className="text-xs text-slate-400">{tx.profile?.display_user_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={tx.type === 'bet' || tx.type === 'withdraw' ? 'text-red-400' : 'text-green-400'}>
                        {tx.type === 'bet' || tx.type === 'withdraw' ? '-' : '+'}৳{tx.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p className="text-white">After: ৳{tx.balance_after?.toLocaleString() || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-300">
                        {tx.game_type && <p>{tx.game_type}</p>}
                        {tx.trade_id && <p className="text-xs text-slate-500">{tx.trade_id.slice(0, 12)}...</p>}
                        {tx.description && <p className="text-xs text-slate-400">{tx.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {format(new Date(tx.created_at), 'MMM dd, HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </AdminShell>
  );
};

export default AdminTransactionsPage;
