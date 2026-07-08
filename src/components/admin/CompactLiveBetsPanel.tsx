import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Coins, TrendingUp, AlertTriangle, Target, Zap
} from 'lucide-react';

interface BetSummary {
  bet_value: string;
  total_bets: number;
  total_amount: number;
  potential_payout: number;
}

interface CompactLiveBetsPanelProps {
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
  }
  return 'bg-gray-500';
};

const CompactLiveBetsPanel = ({ gameType, gameMode, tradeId }: CompactLiveBetsPanelProps) => {
  const [betSummary, setBetSummary] = useState<BetSummary[]>([]);
  const [stats, setStats] = useState({
    totalBets: 0,
    totalAmount: 0,
    uniqueUsers: 0,
    totalPotentialPayout: 0,
  });

  const fetchLiveBets = useCallback(async () => {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const { data: bets, error } = await supabase
        .from('game_bets')
        .select('user_id, bet_value, bet_amount, trade_id, potential_win, multiplier')
        .eq('game_type', gameType)
        .eq('game_mode', gameMode)
        .eq('status', 'pending')
        .gte('created_at', fiveMinutesAgo.toISOString())
        .limit(500);

      if (error) throw error;

      const filteredBets = tradeId 
        ? (bets || []).filter(b => b.trade_id === tradeId)
        : bets || [];

      const summaryMap = new Map<string, BetSummary>();
      filteredBets.forEach(bet => {
        const key = bet.bet_value;
        const existing = summaryMap.get(key) || {
          bet_value: key,
          total_bets: 0,
          total_amount: 0,
          potential_payout: 0,
        };
        existing.total_bets += 1;
        existing.total_amount += bet.bet_amount;
        existing.potential_payout += bet.potential_win || (bet.bet_amount * (bet.multiplier || 2));
        summaryMap.set(key, existing);
      });

      const summaryArray = Array.from(summaryMap.values()).sort((a, b) => b.total_amount - a.total_amount);
      setBetSummary(summaryArray);

      const uniqueUsers = new Set(filteredBets.map(b => b.user_id)).size;
      const totalAmount = filteredBets.reduce((sum, b) => sum + b.bet_amount, 0);
      const totalPotentialPayout = filteredBets.reduce((sum, b) => sum + (b.potential_win || b.bet_amount * 2), 0);

      setStats({
        totalBets: filteredBets.length,
        totalAmount,
        uniqueUsers,
        totalPotentialPayout,
      });
    } catch (error) {
      console.error('Error fetching live bets:', error);
    }
  }, [gameType, gameMode, tradeId]);

  useEffect(() => {
    fetchLiveBets();
    const interval = setInterval(fetchLiveBets, 1500);
    
    const channel = supabase
      .channel(`compact-bets-${gameType}-${gameMode}-${tradeId || 'all'}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'game_bets',
        filter: `game_type=eq.${gameType}`,
      }, fetchLiveBets)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [gameType, gameMode, tradeId, fetchLiveBets]);

  const getHouseProfit = (resultValue: string): number => {
    const winningBets = betSummary.find(s => s.bet_value === resultValue);
    return stats.totalAmount - (winningBets?.potential_payout || 0);
  };

  const bestResult = useMemo(() => {
    if (betSummary.length === 0) return null;
    
    let best = '';
    let bestProfit = -Infinity;

    if (gameType === 'wingo' || gameType === 'trxwin') {
      for (let i = 0; i <= 9; i++) {
        const profit = getHouseProfit(String(i));
        if (profit > bestProfit) {
          bestProfit = profit;
          best = String(i);
        }
      }
    } else {
      betSummary.forEach(s => {
        const profit = getHouseProfit(s.bet_value);
        if (profit > bestProfit) {
          bestProfit = profit;
          best = s.bet_value;
        }
      });
    }

    return { result: best, profit: bestProfit };
  }, [betSummary, stats.totalAmount, gameType]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 text-[10px] mb-0.5">
            <Coins className="h-3 w-3" />
            Wagered
          </div>
          <p className="text-teal-400 font-bold text-sm">৳{stats.totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 text-[10px] mb-0.5">
            <Users className="h-3 w-3" />
            Players
          </div>
          <p className="text-white font-bold text-sm">{stats.uniqueUsers}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 text-[10px] mb-0.5">
            <TrendingUp className="h-3 w-3" />
            Bets
          </div>
          <p className="text-white font-bold text-sm">{stats.totalBets}</p>
        </div>
        <div className="bg-rose-900/30 rounded-lg p-2 text-center border border-rose-500/20">
          <div className="flex items-center justify-center gap-1 text-rose-400 text-[10px] mb-0.5">
            <AlertTriangle className="h-3 w-3" />
            Exposure
          </div>
          <p className="text-rose-400 font-bold text-sm">৳{stats.totalPotentialPayout.toLocaleString()}</p>
        </div>
      </div>

      {bestResult && stats.totalBets > 0 && (
        <div className="flex items-center justify-between bg-emerald-900/20 rounded-lg p-2 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-400" />
            <span className="text-gray-300 text-xs">Best Result:</span>
            <Badge className={`${getColorForValue(bestResult.result, gameType)} text-white text-xs px-2`}>
              {bestResult.result}
            </Badge>
          </div>
          <span className="text-emerald-400 font-bold text-sm">
            +৳{bestResult.profit.toLocaleString()}
          </span>
        </div>
      )}

      {betSummary.length > 0 ? (
        <div className="grid grid-cols-5 gap-1">
          {betSummary.slice(0, 10).map((s) => {
            const profit = getHouseProfit(s.bet_value);
            const isProfitable = profit > 0;
            return (
              <div 
                key={s.bet_value}
                className={`p-1.5 rounded-lg border text-center ${
                  isProfitable 
                    ? 'bg-emerald-900/20 border-emerald-500/20' 
                    : 'bg-rose-900/20 border-rose-500/20'
                }`}
              >
                <div className={`w-6 h-6 rounded mx-auto mb-1 ${getColorForValue(s.bet_value, gameType)} flex items-center justify-center text-white text-xs font-bold`}>
                  {s.bet_value.slice(0, 2)}
                </div>
                <p className="text-white text-[10px] font-medium">৳{s.total_amount.toLocaleString()}</p>
                <p className={`text-[9px] ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isProfitable ? '+' : ''}{profit.toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">
          No bets in current period
        </div>
      )}
    </div>
  );
};

export default CompactLiveBetsPanel;
