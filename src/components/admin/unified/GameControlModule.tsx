import { useState, useEffect, useCallback } from 'react';
import {
  Gamepad2, RefreshCw, Target, Dices, Trophy, Zap, 
  Clock, Users, TrendingUp, Eye, Activity,
  Rocket, Bomb, Plane
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatTaka } from '@/lib/currency';
import { format } from 'date-fns';
import LiveResultControl from '@/components/admin/LiveResultControl';
import { LiveIndicator } from '@/components/admin/LiveIndicator';

const GAMES = [
  { id: 'wingo', label: 'WinGo', icon: Target, color: 'text-orange-400', bgColor: 'from-orange-500/20 to-red-500/20' },
  { id: 'k3', label: 'K3', icon: Dices, color: 'text-blue-400', bgColor: 'from-blue-500/20 to-cyan-500/20' },
  { id: '5d', label: '5D', icon: Trophy, color: 'text-purple-400', bgColor: 'from-purple-500/20 to-pink-500/20' },
  { id: 'trxwin', label: 'TrxWin', icon: Zap, color: 'text-yellow-400', bgColor: 'from-yellow-500/20 to-amber-500/20' },
  { id: 'crash', label: 'Crash', icon: Rocket, color: 'text-red-400', bgColor: 'from-red-500/20 to-pink-500/20' },
  { id: 'mines', label: 'Mines', icon: Bomb, color: 'text-green-400', bgColor: 'from-green-500/20 to-emerald-500/20' },
  { id: 'aviator', label: 'Aviator', icon: Plane, color: 'text-cyan-400', bgColor: 'from-cyan-500/20 to-blue-500/20' },
] as const;

type GameId = typeof GAMES[number]['id'];

const GAME_MODES: Record<GameId, string[]> = {
  wingo: ['30sec', '3min', '5min', '10min'],
  k3: ['30sec', '3min', '5min', '10min'],
  '5d': ['30sec', '3min', '5min', '10min'],
  trxwin: ['30sec', '3min', '5min'],
  crash: ['live'],
  mines: ['live'],
  aviator: ['live'],
};

interface LiveBet {
  id: string;
  user_id: string;
  username?: string;
  game_type: string;
  game_mode: string;
  trade_id: string;
  bet_amount: number;
  bet_type: string;
  bet_value: string;
  status: string;
  payout: number | null;
  created_at: string;
}

interface RoundInfo {
  trade_id: string;
  game_mode: string;
  bet_count: number;
  total_amount: number;
  result?: string;
}

export const GameControlModule = () => {
  const [selectedGame, setSelectedGame] = useState<GameId>('wingo');
  const [selectedMode, setSelectedMode] = useState('30sec');
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [currentRounds, setCurrentRounds] = useState<Record<string, RoundInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentTradeId, setCurrentTradeId] = useState<string>('');
  
  const getModeDurationSeconds = (mode: string): number => {
    if (mode === '30sec') return 30;
    if (mode === '1min') return 60;
    if (mode === '3min') return 180;
    if (mode === '5min') return 300;
    if (mode === '10min') return 600;
    return 60;
  };

  const generateTradeId = useCallback((gameType: string, mode: string) => {
    const now = new Date();
    const dateStr = format(now, 'yyyyMMdd');
    const durationSeconds = getModeDurationSeconds(mode);
    const secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const periodNumber = Math.floor(secondsSinceMidnight / durationSeconds);
    return `${dateStr}${gameType.toUpperCase()}${mode}-${String(periodNumber).padStart(4, '0')}`;
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: betsData } = await supabase
        .from('game_bets')
        .select('*')
        .eq('game_type', selectedGame)
        .eq('game_mode', selectedMode)
        .order('created_at', { ascending: false })
        .limit(50);

      if (betsData) {
        const userIds = [...new Set(betsData.map(b => b.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_user_id')
          .in('user_id', userIds);
        
        const usernameMap = new Map(profiles?.map(p => [p.user_id, p.username || p.display_user_id]) || []);
        
        setLiveBets(betsData.map(b => ({
          ...b,
          username: usernameMap.get(b.user_id) || b.user_id.slice(0, 8),
        })));
      }

      const tradeId = generateTradeId(selectedGame, selectedMode);
      setCurrentTradeId(tradeId);

      const { data: pendingBets } = await supabase
        .from('game_bets')
        .select('trade_id, bet_amount, game_mode')
        .eq('game_type', selectedGame)
        .eq('status', 'pending');

      const roundsMap: Record<string, RoundInfo> = {};
      pendingBets?.forEach(bet => {
        if (!roundsMap[bet.trade_id]) {
          roundsMap[bet.trade_id] = {
            trade_id: bet.trade_id,
            game_mode: bet.game_mode,
            bet_count: 0,
            total_amount: 0,
          };
        }
        roundsMap[bet.trade_id].bet_count++;
        roundsMap[bet.trade_id].total_amount += bet.bet_amount;
      });
      setCurrentRounds(roundsMap);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedGame, selectedMode, generateTradeId]);

  useEffect(() => {
    loadData();
    
    const channel = supabase
      .channel('game-control-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_bets', filter: `game_type=eq.${selectedGame}` },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_rounds', filter: `game_type=eq.${selectedGame}` },
        () => loadData()
      )
      .subscribe();
    
    const interval = setInterval(loadData, 5000);
    
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [loadData, selectedGame]);

  const selectedGameConfig = GAMES.find(g => g.id === selectedGame)!;
  const GameIcon = selectedGameConfig.icon;

  const pendingBetsCount = liveBets.filter(b => b.status === 'pending').length;
  const totalPendingAmount = liveBets.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.bet_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-teal-400" />
            Game Control Panel
          </h1>
          <p className="text-slate-400">Live result control & bet monitoring for all games</p>
        </div>
        
        <div className="flex items-center gap-3">
          <LiveIndicator />
          <Button variant="outline" onClick={loadData} className="border-slate-700 hover:bg-slate-800">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {GAMES.map((game) => {
          const Icon = game.icon;
          return (
            <Card
              key={game.id}
              className={`cursor-pointer transition-all border-2 ${
                selectedGame === game.id 
                  ? `border-${game.color.replace('text-', '')} bg-gradient-to-br ${game.bgColor}` 
                  : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
              }`}
              onClick={() => {
                setSelectedGame(game.id);
                setSelectedMode(GAME_MODES[game.id][0]);
              }}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${game.bgColor}`}>
                  <Icon className={`h-6 w-6 ${game.color}`} />
                </div>
                <div>
                  <p className="font-bold text-white">{game.label}</p>
                  <p className="text-xs text-gray-400">
                    {Object.keys(currentRounds).filter(k => k.includes(game.id.toUpperCase())).length} active rounds
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-400" />
        <span className="text-gray-400 text-sm mr-2">Game Mode:</span>
        {GAME_MODES[selectedGame].map((mode) => (
          <Button
            key={mode}
            variant={selectedMode === mode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedMode(mode)}
            className={selectedMode === mode 
              ? 'bg-teal-500 hover:bg-teal-600' 
              : 'border-gray-700 text-gray-400 hover:bg-gray-800'
            }
          >
            {mode}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <LiveResultControl
            gameType={selectedGame}
            gameMode={selectedMode}
            currentTradeId={currentTradeId}
            onResultSet={loadData}
          />

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-400" />
                <CardTitle className="text-white">Current Round</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Period ID</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {currentTradeId}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Pending Bets</span>
                  <span className="text-white font-bold">{pendingBetsCount}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Total Amount</span>
                  <span className="text-green-400 font-bold">{formatTaka(totalPendingAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-white">Live Bets</CardTitle>
              </div>
              <Badge className="bg-blue-500/20 text-blue-400">
                <Users className="h-3 w-3 mr-1" />
                {liveBets.length}
              </Badge>
            </div>
            <CardDescription className="text-gray-400">
              Real-time bets for {selectedGameConfig.label} ({selectedMode})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[450px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800">
                    <TableHead className="text-gray-400">User</TableHead>
                    <TableHead className="text-gray-400">Bet</TableHead>
                    <TableHead className="text-gray-400 text-right">Amount</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liveBets.map((bet) => (
                    <TableRow key={bet.id} className="border-gray-800">
                      <TableCell className="text-white font-medium text-sm">
                        {bet.username}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
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
                    </TableRow>
                  ))}
                  {liveBets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        No bets yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-white">Active Rounds</CardTitle>
          </div>
          <CardDescription className="text-gray-400">
            All pending rounds across modes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(currentRounds).length > 0 ? (
              Object.entries(currentRounds).map(([tradeId, round]) => (
                <div
                  key={tradeId}
                  className="p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                >
                  <p className="text-xs text-gray-400 font-mono truncate">{tradeId}</p>
                  <div className="flex justify-between mt-2">
                    <span className="text-white font-bold">{round.bet_count} bets</span>
                    <span className="text-green-400">{formatTaka(round.total_amount)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-4 text-center text-gray-500 py-4">
                No active rounds
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
