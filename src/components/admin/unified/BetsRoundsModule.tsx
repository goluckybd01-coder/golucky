import { useState, useEffect, useCallback } from 'react';
import {
  Gamepad2, RefreshCw, Search, Filter, TrendingUp, TrendingDown,
  Target, Dices, Trophy, Zap, Rocket, Bomb, Plane,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatTaka } from '@/lib/currency';
import { format } from 'date-fns';
import { GameType, GAME_CONFIG } from '@/lib/adminPermissions';

const GAME_ICONS: Record<string, any> = {
  wingo: Target,
  k3: Dices,
  '5d': Trophy,
  trxwin: Zap,
  crash: Rocket,
  mines: Bomb,
  aviator: Plane,
};

interface Bet {
  id: string;
  user_id: string;
  game_type: string;
  game_mode: string;
  bet_amount: number;
  bet_type: string;
  bet_value: string;
  status: string;
  payout: number | null;
  created_at: string;
  username?: string;
}

interface GameStats {
  game_type: string;
  totalBets: number;
  totalPayouts: number;
  profit: number;
  betCount: number;
  winRate: number;
}

export const BetsRoundsModule = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [gameStats, setGameStats] = useState<GameStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [gameFilter, setGameFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: betsData } = await supabase
        .from('game_bets')
        .select('game_type, bet_amount, payout, status')
        .gte('created_at', today.toISOString());
      
      if (betsData) {
        const statsMap = new Map<string, GameStats>();
        
        betsData.forEach(bet => {
          const existing = statsMap.get(bet.game_type) || {
            game_type: bet.game_type,
            totalBets: 0,
            totalPayouts: 0,
            profit: 0,
            betCount: 0,
            winRate: 0,
          };
          
          existing.totalBets += bet.bet_amount;
          existing.totalPayouts += bet.payout || 0;
          existing.betCount++;
          if (bet.status === 'won') existing.winRate++;
          
          statsMap.set(bet.game_type, existing);
        });
        
        const stats = Array.from(statsMap.values()).map(s => ({
          ...s,
          profit: s.totalBets - s.totalPayouts,
          winRate: s.betCount > 0 ? (s.winRate / s.betCount) * 100 : 0,
        }));
        
        setGameStats(stats);
      }
      
      let query = supabase
        .from('game_bets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (gameFilter !== 'all') {
        query = query.eq('game_type', gameFilter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data: recentBets } = await query;
      
      if (recentBets) {
        const userIds = [...new Set(recentBets.map(b => b.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_user_id')
          .in('user_id', userIds);
        
        const usernameMap = new Map(profiles?.map(p => [p.user_id, p.username || p.display_user_id]) || []);
        
        setBets(recentBets.map(b => ({
          ...b,
          username: usernameMap.get(b.user_id) || b.user_id.slice(0, 8),
        })));
      }
    } catch (error) {
      console.error('Error loading bets:', error);
      toast.error('Failed to load bets');
    } finally {
      setIsLoading(false);
    }
  }, [gameFilter, statusFilter]);
  
  useEffect(() => {
    loadData();
    
    const channel = supabase
      .channel('bets-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_bets' },
        () => loadData()
      )
      .subscribe();
    
    const interval = setInterval(loadData, 10000);
    
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [loadData]);
  
  const filteredBets = bets.filter(b => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      b.username?.toLowerCase().includes(query) ||
      b.id.toLowerCase().includes(query)
    );
  });
  
  const totalProfit = gameStats.reduce((sum, s) => sum + s.profit, 0);
  const totalBets = gameStats.reduce((sum, s) => sum + s.totalBets, 0);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-purple-400" />
            Bets & Rounds
          </h1>
          <p className="text-gray-400">Monitor all game activity in real-time</p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-gray-400">Live</span>
          <Button variant="outline" onClick={loadData} className="border-gray-700 text-gray-400 ml-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Object.keys(GAME_CONFIG).map((game) => {
          const config = GAME_CONFIG[game as GameType];
          const GameIcon = GAME_ICONS[game];
          const stats = gameStats.find(s => s.game_type === game);
          
          return (
            <Card 
              key={game}
              className={`bg-gray-900/50 border-gray-800 cursor-pointer transition-all hover:border-gray-600 ${gameFilter === game ? 'border-teal-500' : ''}`}
              onClick={() => setGameFilter(gameFilter === game ? 'all' : game)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <GameIcon className={`h-4 w-4 ${config.color}`} />
                  <span className="text-xs text-gray-400">{config.label}</span>
                </div>
                <p className="text-lg font-bold text-white">{formatTaka(stats?.profit || 0)}</p>
                <p className="text-xs text-gray-500">{stats?.betCount || 0} bets</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase">Total Bets Today</p>
            <p className="text-2xl font-bold text-white">{formatTaka(totalBets)}</p>
          </CardContent>
        </Card>
        <Card className={`border ${totalProfit >= 0 ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase">Net Profit</p>
            <div className="flex items-center gap-2">
              {totalProfit >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-400" />
              )}
              <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatTaka(totalProfit)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase">Total Bet Count</p>
            <p className="text-2xl font-bold text-blue-400">
              {gameStats.reduce((sum, s) => sum + s.betCount, 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase">Avg Win Rate</p>
            <p className="text-2xl font-bold text-purple-400">
              {(gameStats.reduce((sum, s) => sum + s.winRate, 0) / (gameStats.length || 1)).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by username or trade ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900/50 border-gray-800 text-white"
          />
        </div>
        <Select value={gameFilter} onValueChange={setGameFilter}>
          <SelectTrigger className="w-32 bg-gray-900/50 border-gray-800 text-white">
            <SelectValue placeholder="Game" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Games</SelectItem>
            {Object.keys(GAME_CONFIG).map(game => (
              <SelectItem key={game} value={game}>
                {GAME_CONFIG[game as GameType].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 bg-gray-900/50 border-gray-800 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Bets</CardTitle>
          <CardDescription className="text-gray-400">
            {filteredBets.length} bets found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-400">User</TableHead>
                  <TableHead className="text-gray-400">Game</TableHead>
                  <TableHead className="text-gray-400">Bet</TableHead>
                  <TableHead className="text-gray-400 text-right">Amount</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400 text-right">Payout</TableHead>
                  <TableHead className="text-gray-400">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBets.map((bet) => {
                  const config = GAME_CONFIG[bet.game_type as GameType];
                  const GameIcon = GAME_ICONS[bet.game_type] || Gamepad2;
                  
                  return (
                    <TableRow key={bet.id} className="border-gray-800">
                      <TableCell className="text-white font-medium">{bet.username}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <GameIcon className={`h-4 w-4 ${config?.color || 'text-gray-400'}`} />
                          <span className="text-gray-300">{config?.label || bet.game_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-gray-300">
                          {bet.bet_type}: {bet.bet_value}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-white font-medium">
                        {formatTaka(bet.bet_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          bet.status === 'won' ? 'bg-green-500/20 text-green-400' :
                          bet.status === 'lost' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }>
                          {bet.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {bet.payout ? (
                          <span className="text-green-400">{formatTaka(bet.payout)}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {format(new Date(bet.created_at), 'HH:mm:ss')}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredBets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No bets found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
