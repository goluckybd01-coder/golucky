import { useMemo, useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Target, Percent, DollarSign, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface CrashBet {
  id: string;
  bet_amount: number;
  cashout_multiplier: number | null;
  outcome: string | null;
  win_amount: number;
  fee_amount: number;
  placed_at: string;
}

interface CrashBetStatsProps {
  bets: CrashBet[];
  isLoading?: boolean;
}

interface ChartDataPoint {
  index: number;
  profit: number;
  cumulative: number;
  label: string;
}

const CrashBetStats = ({ bets, isLoading }: CrashBetStatsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const stats = useMemo(() => {
    if (!bets || bets.length === 0) {
      return {
        totalBets: 0,
        wins: 0,
        losses: 0,
        pending: 0,
        winRate: 0,
        totalWagered: 0,
        totalWon: 0,
        totalLost: 0,
        netProfit: 0,
        avgBetSize: 0,
        avgCashoutMultiplier: 0,
        highestCashout: 0,
        biggestWin: 0,
        longestWinStreak: 0,
        longestLoseStreak: 0,
        currentStreak: { type: 'none', count: 0 },
        chartData: [] as ChartDataPoint[],
        profitByHour: [] as { hour: string; profit: number }[],
      };
    }

    const completedBets = bets.filter(b => b.outcome);
    const wins = bets.filter(b => b.outcome?.toUpperCase() === "WIN");
    const losses = bets.filter(b => b.outcome?.toUpperCase() === "LOSE");
    const pending = bets.filter(b => !b.outcome);

    const totalWagered = bets.reduce((sum, b) => sum + b.bet_amount, 0);
    const totalWon = wins.reduce((sum, b) => sum + (b.win_amount || 0), 0);
    const totalLost = losses.reduce((sum, b) => sum + b.bet_amount, 0);
    const netProfit = totalWon - totalWagered;

    // Average cashout multiplier for wins
    const avgCashoutMultiplier = wins.length > 0
      ? wins.reduce((sum, b) => sum + (b.cashout_multiplier || 0), 0) / wins.length
      : 0;

    const highestCashout = Math.max(...wins.map(b => b.cashout_multiplier || 0), 0);
    const biggestWin = Math.max(...wins.map(b => b.win_amount || 0), 0);

    // Calculate streaks
    let longestWinStreak = 0;
    let longestLoseStreak = 0;
    let currentWinStreak = 0;
    let currentLoseStreak = 0;

    // Reverse to process chronologically
    const chronologicalBets = [...completedBets].reverse();
    
    for (const bet of chronologicalBets) {
      if (bet.outcome?.toUpperCase() === "WIN") {
        currentWinStreak++;
        currentLoseStreak = 0;
        if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak;
      } else if (bet.outcome?.toUpperCase() === "LOSE") {
        currentLoseStreak++;
        currentWinStreak = 0;
        if (currentLoseStreak > longestLoseStreak) longestLoseStreak = currentLoseStreak;
      }
    }

    // Current streak (from most recent)
    const currentStreak = currentWinStreak > 0 
      ? { type: 'win', count: currentWinStreak }
      : currentLoseStreak > 0 
        ? { type: 'lose', count: currentLoseStreak }
        : { type: 'none', count: 0 };

    // Chart data - cumulative profit over bets
    let cumulativeProfit = 0;
    const chartData: ChartDataPoint[] = chronologicalBets.map((bet, idx) => {
      const profit = bet.outcome?.toUpperCase() === "WIN" 
        ? (bet.win_amount || 0) - bet.bet_amount 
        : -bet.bet_amount;
      cumulativeProfit += profit;
      return {
        index: idx + 1,
        profit,
        cumulative: cumulativeProfit,
        label: `Bet ${idx + 1}`,
      };
    }).slice(-20); // Last 20 bets for chart

    return {
      totalBets: bets.length,
      wins: wins.length,
      losses: losses.length,
      pending: pending.length,
      winRate: completedBets.length > 0 ? (wins.length / completedBets.length) * 100 : 0,
      totalWagered,
      totalWon,
      totalLost,
      netProfit,
      avgBetSize: bets.length > 0 ? totalWagered / bets.length : 0,
      avgCashoutMultiplier,
      highestCashout,
      biggestWin,
      longestWinStreak,
      longestLoseStreak,
      currentStreak,
      chartData,
    };
  }, [bets]);

  if (isLoading) {
    return (
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
        <div className="flex items-center gap-2 text-slate-400">
          <BarChart3 className="animate-pulse" size={18} />
          <span>Loading statistics...</span>
        </div>
      </div>
    );
  }

  if (stats.totalBets === 0) {
    return (
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
        <div className="flex items-center gap-2 text-slate-400">
          <BarChart3 size={18} />
          <span>No betting history yet. Place bets to see statistics!</span>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm">
          <p className="text-slate-300">{data.label}</p>
          <p className={data.profit >= 0 ? "text-green-400" : "text-red-400"}>
            Profit: ৳{data.profit.toFixed(2)}
          </p>
          <p className={data.cumulative >= 0 ? "text-cyan-400" : "text-orange-400"}>
            Cumulative: ৳{data.cumulative.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-slate-700 hover:from-cyan-500/30 hover:to-blue-500/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="text-cyan-400" size={18} />
          <span className="text-white font-bold">Bet Statistics</span>
          <Badge className="bg-slate-700 text-slate-300 text-xs">
            {stats.totalBets} bets
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp size={18} className="text-slate-400" />
        ) : (
          <ChevronDown size={18} className="text-slate-400" />
        )}
      </button>

      {/* Quick Stats - Always visible */}
      <div className="grid grid-cols-4 gap-2 p-3 border-b border-slate-700/50">
        <div className="text-center">
          <p className="text-slate-500 text-xs font-medium">Win Rate</p>
          <p className={`text-lg font-bold ${stats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.winRate.toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-slate-500 text-xs font-medium">Avg Multiplier</p>
          <p className="text-cyan-400 text-lg font-bold">
            {stats.avgCashoutMultiplier.toFixed(2)}x
          </p>
        </div>
        <div className="text-center">
          <p className="text-slate-500 text-xs font-medium">Net Profit</p>
          <p className={`text-lg font-bold ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.netProfit >= 0 ? '+' : ''}৳{stats.netProfit.toFixed(0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-slate-500 text-xs font-medium">W/L</p>
          <p className="text-white text-lg font-bold">
            <span className="text-green-400">{stats.wins}</span>
            <span className="text-slate-500">/</span>
            <span className="text-red-400">{stats.losses}</span>
          </p>
        </div>
      </div>

      {/* Expanded Stats */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Win/Loss Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-400 font-medium flex items-center gap-1">
                <ArrowUpRight size={14} />
                {stats.wins} Wins
              </span>
              <span className="text-red-400 font-medium flex items-center gap-1">
                {stats.losses} Losses
                <ArrowDownRight size={14} />
              </span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden flex">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-500"
                style={{ width: `${stats.winRate}%` }}
              />
              <div 
                className="bg-gradient-to-r from-red-500 to-orange-500 h-full transition-all duration-500"
                style={{ width: `${100 - stats.winRate}%` }}
              />
            </div>
          </div>

          {/* Profit Chart */}
          {stats.chartData.length > 2 && (
            <div className="space-y-2">
              <h4 className="text-slate-400 text-sm font-medium flex items-center gap-2">
                <TrendingUp size={14} />
                Profit Over Time (Last 20 Bets)
              </h4>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="index" 
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={{ stroke: '#475569' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={{ stroke: '#475569' }}
                      tickFormatter={(value) => `৳${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke={stats.netProfit >= 0 ? "#22c55e" : "#ef4444"}
                      strokeWidth={2}
                      dot={{ fill: stats.netProfit >= 0 ? "#22c55e" : "#ef4444", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Detailed Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <DollarSign size={12} />
                Total Wagered
              </div>
              <p className="text-white font-bold">৳{stats.totalWagered.toLocaleString()}</p>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <DollarSign size={12} />
                Total Won
              </div>
              <p className="text-green-400 font-bold">৳{stats.totalWon.toLocaleString()}</p>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Target size={12} />
                Highest Cashout
              </div>
              <p className="text-cyan-400 font-bold">{stats.highestCashout.toFixed(2)}x</p>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <TrendingUp size={12} />
                Biggest Win
              </div>
              <p className="text-amber-400 font-bold">৳{stats.biggestWin.toLocaleString()}</p>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Percent size={12} />
                Avg Bet Size
              </div>
              <p className="text-white font-bold">৳{stats.avgBetSize.toFixed(0)}</p>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <BarChart3 size={12} />
                Avg Cashout
              </div>
              <p className="text-purple-400 font-bold">{stats.avgCashoutMultiplier.toFixed(2)}x</p>
            </div>
          </div>

          {/* Streaks */}
          <div className="flex gap-3">
            <div className="flex-1 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-green-400 text-xs font-medium">Best Win Streak</p>
              <p className="text-white text-2xl font-bold">{stats.longestWinStreak}</p>
            </div>
            <div className="flex-1 bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-xs font-medium">Worst Lose Streak</p>
              <p className="text-white text-2xl font-bold">{stats.longestLoseStreak}</p>
            </div>
            <div className={`flex-1 rounded-lg p-3 ${
              stats.currentStreak.type === 'win' 
                ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30' 
                : stats.currentStreak.type === 'lose'
                  ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30'
                  : 'bg-slate-700/50 border border-slate-600'
            }`}>
              <p className={`text-xs font-medium ${
                stats.currentStreak.type === 'win' ? 'text-green-400' : 
                stats.currentStreak.type === 'lose' ? 'text-red-400' : 'text-slate-400'
              }`}>
                Current Streak
              </p>
              <p className="text-white text-2xl font-bold flex items-center gap-1">
                {stats.currentStreak.count}
                {stats.currentStreak.type === 'win' && <span className="text-lg">🔥</span>}
                {stats.currentStreak.type === 'lose' && <span className="text-lg">❄️</span>}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrashBetStats;
