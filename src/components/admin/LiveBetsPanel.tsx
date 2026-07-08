import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { 
  Users, DollarSign, TrendingUp, Eye, RefreshCw, 
  Activity, ArrowUp, ArrowDown, AlertTriangle, Target,
  PieChart, BarChart3, Zap, Clock, TrendingDown, Coins
} from 'lucide-react';

interface LiveBet {
  id: string;
  user_id: string;
  bet_type: string;
  bet_value: string;
  bet_amount: number;
  created_at: string;
  potential_win: number;
  multiplier: number;
  username?: string;
  phone?: string;
  display_user_id?: string;
}

interface BetSummary {
  bet_value: string;
  total_bets: number;
  total_amount: number;
  user_count: number;
  potential_payout: number;
}

interface LiveBetsPanelProps {
  gameType: 'wingo' | 'k3' | '5d' | 'trxwin';
  gameMode: string;
  tradeId?: string;
}

const getColorForValue = (value: string, gameType: string): string => {
  if (gameType === 'wingo' || gameType === 'trxwin') {
    const num = parseInt(value);
    if (!isNaN(num)) {
      if (num === 0 || num === 5) return 'bg-gradient-to-r from-violet-500 to-rose-500';
      return num % 2 === 0 ? 'bg-rose-500' : 'bg-emerald-500';
    }
    if (value.toLowerCase() === 'red') return 'bg-rose-500';
    if (value.toLowerCase() === 'green') return 'bg-emerald-500';
    if (value.toLowerCase() === 'violet') return 'bg-violet-500';
    if (value.toLowerCase() === 'big') return 'bg-blue-500';
    if (value.toLowerCase() === 'small') return 'bg-amber-500';
  }
  if (gameType === 'k3') {
    if (value.toLowerCase() === 'big') return 'bg-blue-500';
    if (value.toLowerCase() === 'small') return 'bg-amber-500';
    if (value.toLowerCase() === 'odd') return 'bg-cyan-500';
    if (value.toLowerCase() === 'even') return 'bg-pink-500';
  }
  return 'bg-gray-500';
};

const LiveBetsPanel = ({ gameType, gameMode, tradeId }: LiveBetsPanelProps) => {
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [betSummary, setBetSummary] = useState<BetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [stats, setStats] = useState({
    totalBets: 0,
    totalAmount: 0,
    uniqueUsers: 0,
    avgBetSize: 0,
    totalPotentialPayout: 0,
    maxSingleBet: 0,
  });

  const [riskAnalysis, setRiskAnalysis] = useState({
    highestExposure: '',
    highestExposureAmount: 0,
    profitIfWin: new Map<string, number>(),
  });

  const fetchLiveBets = useCallback(async () => {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const { data: bets, error } = await supabase
        .from('game_bets')
        .select(`
          id,
          user_id,
          bet_type,
          bet_value,
          bet_amount,
          trade_id,
          created_at,
          status,
          potential_win,
          multiplier
        `)
        .eq('game_type', gameType)
        .eq('game_mode', gameMode)
        .eq('status', 'pending')
        .gte('created_at', fiveMinutesAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const filteredBets = tradeId 
        ? (bets || []).filter(b => b.trade_id === tradeId)
        : bets || [];

      const userIds = [...new Set(filteredBets.map(b => b.user_id))];
      let profileMap = new Map<string, { username?: string; phone?: string; display_user_id?: string }>();
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, phone, display_user_id')
          .in('user_id', userIds);

        profileMap = new Map(
          (profiles || []).map(p => [p.user_id, { 
            username: p.username, 
            phone: p.phone,
            display_user_id: p.display_user_id 
          }])
        );
      }

      const enrichedBets = filteredBets.map(bet => ({
        ...bet,
        username: profileMap.get(bet.user_id)?.username || 'Unknown',
        phone: profileMap.get(bet.user_id)?.phone,
        display_user_id: profileMap.get(bet.user_id)?.display_user_id,
      }));

      setLiveBets(enrichedBets);

      const summaryMap = new Map<string, BetSummary>();
      const usersByValue = new Map<string, Set<string>>();

      filteredBets.forEach(bet => {
        const key = bet.bet_value;
        const existing = summaryMap.get(key) || {
          bet_value: key,
          total_bets: 0,
          total_amount: 0,
          user_count: 0,
          potential_payout: 0,
        };
        existing.total_bets += 1;
        existing.total_amount += bet.bet_amount;
        existing.potential_payout += bet.potential_win || (bet.bet_amount * (bet.multiplier || 2));

        if (!usersByValue.has(key)) {
          usersByValue.set(key, new Set());
        }
        usersByValue.get(key)!.add(bet.user_id);
        existing.user_count = usersByValue.get(key)!.size;

        summaryMap.set(key, existing);
      });

      const summaryArray = Array.from(summaryMap.values()).sort((a, b) => b.total_amount - a.total_amount);
      setBetSummary(summaryArray);

      const uniqueUserIds = new Set(filteredBets.map(b => b.user_id));
      const totalAmount = filteredBets.reduce((sum, b) => sum + b.bet_amount, 0);
      const totalPotentialPayout = filteredBets.reduce((sum, b) => sum + (b.potential_win || b.bet_amount * 2), 0);
      const maxBet = filteredBets.length > 0 ? Math.max(...filteredBets.map(b => b.bet_amount)) : 0;

      setStats({
        totalBets: filteredBets.length,
        totalAmount,
        uniqueUsers: uniqueUserIds.size,
        avgBetSize: filteredBets.length > 0 ? totalAmount / filteredBets.length : 0,
        totalPotentialPayout,
        maxSingleBet: maxBet,
      });

      let highestExposure = '';
      let highestExposureAmount = 0;
      const profitMap = new Map<string, number>();

      summaryArray.forEach(summary => {
        const netExposure = summary.potential_payout - totalAmount;
        profitMap.set(summary.bet_value, -netExposure);

        if (summary.potential_payout > highestExposureAmount) {
          highestExposureAmount = summary.potential_payout;
          highestExposure = summary.bet_value;
        }
      });

      setRiskAnalysis({
        highestExposure,
        highestExposureAmount,
        profitIfWin: profitMap,
      });

      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching live bets:', error);
      setIsLoading(false);
    }
  }, [gameType, gameMode, tradeId]);

  useEffect(() => {
    fetchLiveBets();
    const pollInterval = setInterval(fetchLiveBets, 1500);
    const channel = supabase
      .channel(`live-bets-${gameType}-${gameMode}-${tradeId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_bets',
          filter: `game_type=eq.${gameType}`,
        },
        () => {
          fetchLiveBets();
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [gameType, gameMode, tradeId, fetchLiveBets]);

  const formatTime = (dateStr: string) => format(new Date(dateStr), 'HH:mm:ss');

  const getMaskedPhone = (phone?: string) => {
    if (!phone) return null;
    if (phone.length < 4) return phone;
    return `***${phone.slice(-4)}`;
  };

  const getHouseProfit = (resultValue: string): number => {
    const totalCollected = stats.totalAmount;
    const winningBets = betSummary.find(s => s.bet_value === resultValue);
    const payout = winningBets?.potential_payout || 0;
    return totalCollected - payout;
  };

  const getRecommendedResult = useMemo(() => {
    if (betSummary.length === 0) return null;
    let bestResult = '';
    let bestProfit = -Infinity;
    if (gameType === 'wingo' || gameType === 'trxwin') {
      for (let i = 0; i <= 9; i++) {
        const profit = getHouseProfit(String(i));
        if (profit > bestProfit) {
          bestProfit = profit;
          bestResult = String(i);
        }
      }
    } else {
      betSummary.forEach(s => {
        const profit = getHouseProfit(s.bet_value);
        if (profit > bestProfit) {
          bestProfit = profit;
          bestResult = s.bet_value;
        }
      });
    }
    return { result: bestResult, profit: bestProfit };
  }, [betSummary, stats.totalAmount, gameType]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Activity size={12} />
              Total Bets
            </div>
            <p className="text-white font-bold text-lg">{stats.totalBets}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Coins size={12} />
              Total Wagered
            </div>
            <p className="text-teal-400 font-bold text-lg">
              ৳{stats.totalAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Users size={12} />
              Players
            </div>
            <p className="text-white font-bold text-lg">{stats.uniqueUsers}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <TrendingUp size={12} />
              Avg Bet
            </div>
            <p className="text-emerald-400 font-bold text-lg">
              ৳{Math.round(stats.avgBetSize).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Target size={12} />
              Max Bet
            </div>
            <p className="text-amber-400 font-bold text-lg">
              ৳{stats.maxSingleBet.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-900/50 to-red-900/50 border-rose-500/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-rose-400 text-xs mb-1">
              <AlertTriangle size={12} />
              Max Exposure
            </div>
            <p className="text-rose-400 font-bold text-lg">
              ৳{stats.totalPotentialPayout.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {stats.totalBets > 0 && (
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <BarChart3 size={16} className="text-amber-400" />
              Risk Analysis & Profit Control
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/30">
                <p className="text-rose-400 text-xs mb-1 flex items-center gap-1">
                  <TrendingDown size={12} />
                  Highest Risk Option
                </p>
                <div className="flex items-center gap-2">
                  <Badge className={`${getColorForValue(riskAnalysis.highestExposure, gameType)} text-white px-3 py-1`}>
                    {riskAnalysis.highestExposure || '-'}
                  </Badge>
                  <span className="text-rose-400 font-bold">
                    -৳{riskAnalysis.highestExposureAmount.toLocaleString()}
                  </span>
                </div>
              </div>
              {getRecommendedResult && (
                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                  <p className="text-emerald-400 text-xs mb-1 flex items-center gap-1">
                    <Zap size={12} />
                    Best Result (Max Profit)
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getColorForValue(getRecommendedResult.result, gameType)} text-white px-3 py-1`}>
                      {getRecommendedResult.result}
                    </Badge>
                    <span className="text-emerald-400 font-bold">
                      +৳{getRecommendedResult.profit.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <p className="text-blue-400 text-xs mb-1 flex items-center gap-1">
                  <PieChart size={12} />
                  Expected House Edge
                </p>
                <div className="text-blue-400 font-bold">
                  {stats.totalAmount > 0 
                    ? `${(((stats.totalAmount - stats.totalPotentialPayout / betSummary.length) / stats.totalAmount) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <TrendingUp size={16} className="text-teal-400" />
              Bet Distribution (Live)
              <Badge className="bg-green-500/20 text-green-400 animate-pulse text-[10px]">
                LIVE
              </Badge>
            </CardTitle>
            <Badge variant="outline" className="text-gray-400 border-gray-600 text-xs">
              <Clock size={10} className="mr-1" />
              {format(lastUpdate, 'HH:mm:ss')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {betSummary.slice(0, 10).map((summary) => {
              const profit = getHouseProfit(summary.bet_value);
              const isProfitable = profit > 0;
              return (
                <div 
                  key={summary.bet_value}
                  className={`p-3 rounded-lg border transition-all ${
                    isProfitable 
                      ? 'bg-emerald-900/20 border-emerald-500/30' 
                      : 'bg-rose-900/20 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-10 h-10 rounded-lg ${getColorForValue(summary.bet_value, gameType)} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                      {summary.bet_value.slice(0, 3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">{summary.total_bets} bets</p>
                      <p className="text-sm text-white font-bold truncate">
                        ৳{summary.total_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Users size={10} />
                      {summary.user_count}
                    </span>
                    <span className={`font-medium ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfitable ? '+' : ''}৳{profit.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={(summary.total_amount / stats.totalAmount) * 100} 
                    className="h-1 mt-2 bg-gray-700"
                  />
                </div>
              );
            })}
          </div>
          {betSummary.length === 0 && !isLoading && (
            <div className="text-center py-6 text-gray-500">
              <Activity className="mx-auto mb-2" size={24} />
              No bets in current period
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Eye size={16} className="text-teal-400" />
              Live Bets Feed
              <Badge className="bg-green-500/20 text-green-400 animate-pulse text-xs">
                LIVE
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchLiveBets}
              className="text-gray-400 hover:text-white h-7"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[350px]">
            {liveBets.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Activity className="mx-auto mb-2" size={24} />
                <p>Waiting for bets...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {liveBets.map((bet, index) => (
                  <div 
                    key={bet.id}
                    className={`
                      flex items-center justify-between p-3 rounded-lg
                      ${index === 0 ? 'bg-teal-500/10 border border-teal-500/30 animate-pulse' : 'bg-gray-900/50'}
                      transition-all
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-medium">
                        {bet.username?.slice(0, 2)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium">
                            {bet.display_user_id || bet.username || getMaskedPhone(bet.phone) || 'Anonymous'}
                          </span>
                          {index === 0 && (
                            <Badge className="bg-teal-500/20 text-teal-400 text-[10px] h-4">
                              NEW
                            </Badge>
                          )}
                        </div>
                        <span className="text-gray-500 text-xs">
                          {formatTime(bet.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${getColorForValue(bet.bet_value, gameType)} text-white px-2 py-0.5 text-xs`}>
                        {bet.bet_value}
                      </Badge>
                      <div className="text-right">
                        <p className="text-teal-400 font-bold text-sm">
                          ৳{bet.bet_amount.toLocaleString()}
                        </p>
                        <p className="text-gray-500 text-xs">
                          x{bet.multiplier || 2}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveBetsPanel;
