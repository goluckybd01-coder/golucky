import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  Clock,
  Zap,
   Wallet,
   Receipt,
   Users,
   Calendar,
   BarChart3,
   PieChart,
   Trophy,
   Target,
   Percent,
   CreditCard,
   ArrowUp,
   ArrowDown,
   Coins,
   BadgeCheck,
   Flame,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  ComposedChart,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { formatTaka } from '@/lib/currency';
import { formatTakaCompact } from '@/lib/currency';
import { format, subMinutes, subHours, startOfDay, subDays, startOfMonth, startOfWeek, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { GAME_CONFIG, GameType } from '@/lib/adminPermissions';

interface MinuteStats {
  minute_ts: string;
  game_type: string | null;
  total_deposits: number;
  total_bets: number;
  total_fees: number;
  total_payouts: number;
  net_profit: number;
  bet_count: number;
  unique_players: number;
}

interface LiveMetrics {
  deposits: number;
  bets: number;
  fees: number;
  payouts: number;
  netProfit: number;
  activeUsers: number;
}

interface AllTimeStats {
  totalDeposits: number;
  totalWithdrawals: number;
  totalBets: number;
  totalPayouts: number;
  totalFees: number;
  totalNetProfit: number;
  totalUsers: number;
  totalTransactions: number;
  avgBetAmount: number;
  winRate: number;
  rtp: number;
}

interface PeriodComparison {
  current: number;
  previous: number;
  percentChange: number;
}

interface Alert {
  id: string;
  type: 'spike' | 'suspicious' | 'threshold';
  message: string;
  severity: 'warning' | 'critical';
  timestamp: Date;
}

const COLORS = ['#F97316', '#3B82F6', '#EAB308', '#06B6D4', '#EF4444', '#10B981', '#A855F7', '#EC4899', '#8B5CF6'];

export const FinanceDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('today');

  // Live metrics (per minute)
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({
    deposits: 0,
    bets: 0,
    fees: 0,
    payouts: 0,
    netProfit: 0,
    activeUsers: 0,
  });

  // Period stats
  const [todayStats, setTodayStats] = useState<LiveMetrics>({ deposits: 0, bets: 0, fees: 0, payouts: 0, netProfit: 0, activeUsers: 0 });
  const [weekStats, setWeekStats] = useState<LiveMetrics>({ deposits: 0, bets: 0, fees: 0, payouts: 0, netProfit: 0, activeUsers: 0 });
  const [monthStats, setMonthStats] = useState<LiveMetrics>({ deposits: 0, bets: 0, fees: 0, payouts: 0, netProfit: 0, activeUsers: 0 });
  const [allTimeStats, setAllTimeStats] = useState<AllTimeStats>({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalBets: 0,
    totalPayouts: 0,
    totalFees: 0,
    totalNetProfit: 0,
    totalUsers: 0,
    totalTransactions: 0,
    avgBetAmount: 0,
    winRate: 0,
    rtp: 0,
  });

  // Withdrawals
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [todayWithdrawals, setTodayWithdrawals] = useState(0);

  // Chart data
  const [minuteData, setMinuteData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [gameBreakdown, setGameBreakdown] = useState<any[]>([]);
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [topWinners, setTopWinners] = useState<any[]>([]);

  // Alerts
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Polling interval reference
  const [pollingActive, setPollingActive] = useState(true);

  // Smart format: use compact for large numbers, full for smaller
  const smartFormatTaka = (amount: number): string => {
    if (Math.abs(amount) >= 10000000) {
      // 1 Crore+ (10M+)
      return `৳${(amount / 10000000).toFixed(2)}Cr`;
    }
    if (Math.abs(amount) >= 100000) {
      // 1 Lakh+ (100K+)
      return `৳${(amount / 100000).toFixed(2)}L`;
    }
    if (Math.abs(amount) >= 10000) {
      // 10K+
      return `৳${(amount / 1000).toFixed(1)}K`;
    }
    return formatTaka(amount);
  };

  const loadLiveMetrics = useCallback(async () => {
    const now = new Date();
    const lastMinute = subMinutes(now, 1).toISOString();

    // Get deposits from last minute
    const { data: recentDeposits } = await supabase
      .from('transaction_requests')
      .select('amount')
      .eq('type', 'deposit')
      .eq('status', 'approved')
      .gte('processed_at', lastMinute);

    // Get bets from last minute
    const { data: recentBets } = await supabase
      .from('game_bets')
      .select('bet_amount, payout, user_id')
      .gte('created_at', lastMinute);

    // Get wallet ledger fees from last minute
    const { data: recentFees } = await supabase
      .from('wallet_ledger')
      .select('fee')
      .eq('ledger_type', 'BET_DEBIT')
      .gte('created_at', lastMinute);

    const deposits = recentDeposits?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
    const bets = recentBets?.reduce((sum, b) => sum + (b.bet_amount || 0), 0) || 0;
    const payouts = recentBets?.reduce((sum, b) => sum + (b.payout || 0), 0) || 0;
    const fees = recentFees?.reduce((sum, f) => sum + (f.fee || 0), 0) || 0;
    const activeUsers = new Set(recentBets?.map(b => b.user_id) || []).size;

    setLiveMetrics({
      deposits,
      bets,
      fees,
      payouts,
      netProfit: bets - payouts + fees,
      activeUsers,
    });

    // Check for alerts
    const newAlerts: Alert[] = [];

    // Check for unusual deposit spikes
    if (deposits > 100000) {
      newAlerts.push({
        id: `deposit-spike-${Date.now()}`,
        type: 'spike',
        message: `Large deposit volume: ${formatTaka(deposits)} in last minute`,
        severity: deposits > 500000 ? 'critical' : 'warning',
        timestamp: new Date(),
      });
    }

    // Check for high payout ratio
    if (bets > 0 && payouts / bets > 1.5) {
      newAlerts.push({
        id: `payout-ratio-${Date.now()}`,
        type: 'threshold',
        message: `High payout ratio: ${((payouts / bets) * 100).toFixed(1)}%`,
        severity: 'warning',
        timestamp: new Date(),
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
    }

    setLastUpdated(new Date());
  }, []);

  const loadAllTimeStats = useCallback(async () => {
    // Total deposits
    const { data: deposits } = await supabase
      .from('transaction_requests')
      .select('amount')
      .eq('type', 'deposit')
      .eq('status', 'approved');

    // Total withdrawals
    const { data: withdrawals } = await supabase
      .from('transaction_requests')
      .select('amount')
      .eq('type', 'withdraw')
      .eq('status', 'approved');

    // All bets
    const { data: bets, count: betCount } = await supabase
      .from('game_bets')
      .select('bet_amount, payout, status', { count: 'exact' });

    // Total users
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Total transactions
    const { count: txCount } = await supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact', head: true });

    // Pending withdrawals
    const { data: pendingW, count: pendingCount } = await supabase
      .from('transaction_requests')
      .select('amount', { count: 'exact' })
      .eq('type', 'withdraw')
      .eq('status', 'pending');

    const totalDeposits = deposits?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
    const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;
    const totalBets = bets?.reduce((sum, b) => sum + (b.bet_amount || 0), 0) || 0;
    const totalPayouts = bets?.reduce((sum, b) => sum + (b.payout || 0), 0) || 0;
    const wonBets = bets?.filter(b => b.status === 'won').length || 0;
    const settledBets = bets?.filter(b => b.status !== 'pending').length || 1;

    setAllTimeStats({
      totalDeposits,
      totalWithdrawals,
      totalBets,
      totalPayouts,
      totalFees: 0,
      totalNetProfit: totalBets - totalPayouts,
      totalUsers: userCount || 0,
      totalTransactions: txCount || 0,
      avgBetAmount: totalBets / (betCount || 1),
      winRate: (wonBets / settledBets) * 100,
      rtp: totalBets > 0 ? (totalPayouts / totalBets) * 100 : 0,
    });

    setPendingWithdrawals(pendingW?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0);

    // Today's withdrawals
    const startOfToday = startOfDay(new Date()).toISOString();
    const { data: todayW } = await supabase
      .from('transaction_requests')
      .select('amount')
      .eq('type', 'withdraw')
      .eq('status', 'approved')
      .gte('processed_at', startOfToday);

    setTodayWithdrawals(todayW?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0);
  }, []);

  const loadTodayStats = useCallback(async () => {
    const startOfToday = startOfDay(new Date()).toISOString();
    const startOfThisWeek = startOfWeek(new Date()).toISOString();
    const startOfThisMonth = startOfMonth(new Date()).toISOString();

    const { data: todayDeposits } = await supabase
      .from('transaction_requests')
      .select('amount')
      .eq('type', 'deposit')
      .eq('status', 'approved')
      .gte('processed_at', startOfToday);

    const { data: todayBets } = await supabase
      .from('game_bets')
      .select('bet_amount, payout, game_type, user_id')
      .gte('created_at', startOfToday);

    // Week data
    const { data: weekDeposits } = await supabase
      .from('transaction_requests')
      .select('amount')
      .eq('type', 'deposit')
      .eq('status', 'approved')
      .gte('processed_at', startOfThisWeek);

    const { data: weekBets } = await supabase
      .from('game_bets')
      .select('bet_amount, payout, user_id')
      .gte('created_at', startOfThisWeek);

    // Month data
    const { data: monthDeposits } = await supabase
      .from('transaction_requests')
      .select('amount')
      .eq('type', 'deposit')
      .eq('status', 'approved')
      .gte('processed_at', startOfThisMonth);

    const { data: monthBets } = await supabase
      .from('game_bets')
      .select('bet_amount, payout, user_id')
      .gte('created_at', startOfThisMonth);

    const tDeposits = todayDeposits?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
    const tBets = todayBets?.reduce((sum, b) => sum + (b.bet_amount || 0), 0) || 0;
    const tPayouts = todayBets?.reduce((sum, b) => sum + (b.payout || 0), 0) || 0;
    const tActiveUsers = new Set(todayBets?.map(b => b.user_id) || []).size;

    setTodayStats({
      deposits: tDeposits,
      bets: tBets,
      fees: 0,
      payouts: tPayouts,
      netProfit: tBets - tPayouts,
      activeUsers: tActiveUsers,
    });

    const wDeposits = weekDeposits?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
    const wBets = weekBets?.reduce((sum, b) => sum + (b.bet_amount || 0), 0) || 0;
    const wPayouts = weekBets?.reduce((sum, b) => sum + (b.payout || 0), 0) || 0;
    const wActiveUsers = new Set(weekBets?.map(b => b.user_id) || []).size;

    setWeekStats({
      deposits: wDeposits,
      bets: wBets,
      fees: 0,
      payouts: wPayouts,
      netProfit: wBets - wPayouts,
      activeUsers: wActiveUsers,
    });

    const mDeposits = monthDeposits?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
    const mBets = monthBets?.reduce((sum, b) => sum + (b.bet_amount || 0), 0) || 0;
    const mPayouts = monthBets?.reduce((sum, b) => sum + (b.payout || 0), 0) || 0;
    const mActiveUsers = new Set(monthBets?.map(b => b.user_id) || []).size;

    setMonthStats({
      deposits: mDeposits,
      bets: mBets,
      fees: 0,
      payouts: mPayouts,
      netProfit: mBets - mPayouts,
      activeUsers: mActiveUsers,
    });

    // Calculate game breakdown
    const gameStats: Record<string, { bets: number; payouts: number; count: number }> = {};
    todayBets?.forEach(bet => {
      const gt = bet.game_type?.toLowerCase() || 'unknown';
      if (!gameStats[gt]) {
        gameStats[gt] = { bets: 0, payouts: 0, count: 0 };
      }
      gameStats[gt].bets += bet.bet_amount || 0;
      gameStats[gt].payouts += bet.payout || 0;
      gameStats[gt].count++;
    });

    setGameBreakdown(
      Object.entries(gameStats).map(([game, stats]) => ({
        game,
        bets: stats.bets,
        payouts: stats.payouts,
        profit: stats.bets - stats.payouts,
        count: stats.count,
      }))
    );
  }, []);

  const loadChartData = useCallback(async () => {    
    // Get real bets data for last 60 minutes  
    const now = new Date();
    const last60Min = subMinutes(now, 60).toISOString();

    const { data: recentBets } = await supabase
      .from('game_bets')
      .select('bet_amount, payout, created_at')
      .gte('created_at', last60Min)
      .order('created_at', { ascending: true });

    // Group by minute
    const minuteGroups: Record<string, { bets: number; payouts: number }> = {};
    recentBets?.forEach(bet => {
      const minuteKey = format(new Date(bet.created_at), 'HH:mm');
      if (!minuteGroups[minuteKey]) {
        minuteGroups[minuteKey] = { bets: 0, payouts: 0 };
      }
      minuteGroups[minuteKey].bets += bet.bet_amount || 0;
      minuteGroups[minuteKey].payouts += bet.payout || 0;
    });

    const minuteChartData = Object.entries(minuteGroups).map(([time, data]) => ({
      time,
      bets: data.bets,
      payouts: data.payouts,
      profit: data.bets - data.payouts,
    }));

    setMinuteData(minuteChartData);

    // Daily trend for last 7 days
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(now, i);
      const dayStart = startOfDay(day).toISOString();
      const dayEnd = endOfDay(day).toISOString();

      const { data: dayBets } = await supabase
        .from('game_bets')
        .select('bet_amount, payout')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd);

      const { data: dayDeposits } = await supabase
        .from('transaction_requests')
        .select('amount')
        .eq('type', 'deposit')
        .eq('status', 'approved')
        .gte('processed_at', dayStart)
        .lte('processed_at', dayEnd);

      const bets = dayBets?.reduce((sum, b) => sum + (b.bet_amount || 0), 0) || 0;
      const payouts = dayBets?.reduce((sum, b) => sum + (b.payout || 0), 0) || 0;
      const deposits = dayDeposits?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

      dailyData.push({
        day: format(day, 'EEE'),
        date: format(day, 'MMM dd'),
        bets,
        payouts,
        deposits,
        profit: bets - payouts,
      });
    }
    setDailyTrend(dailyData);

    // Generate hourly data for today
    const hourlyChartData = [];
    for (let i = 23; i >= 0; i--) {
      const hour = subHours(now, i);
      hourlyChartData.push({
        hour: format(hour, 'HH:00'),
        deposits: 0,
        bets: 0,
        payouts: 0,
        profit: 0,
      });
    }
    setHourlyData(hourlyChartData);

    // Top winners today
    const { data: winners } = await supabase
      .from('game_bets')
      .select('user_id, payout, bet_amount')
      .gte('created_at', startOfDay(new Date()).toISOString())
      .eq('status', 'won')
      .order('payout', { ascending: false })
      .limit(10);

    const winnerMap: Record<string, number> = {};
    winners?.forEach(w => {
      winnerMap[w.user_id] = (winnerMap[w.user_id] || 0) + (w.payout - w.bet_amount);
    });

    const topWinnersList = Object.entries(winnerMap)
      .map(([userId, profit]) => ({ userId: userId.slice(0, 8), profit }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    setTopWinners(topWinnersList);
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadLiveMetrics(),
      loadTodayStats(),
      loadChartData(),
      loadAllTimeStats(),
    ]);
    setIsRefreshing(false);
  }, [loadLiveMetrics, loadTodayStats, loadChartData, loadAllTimeStats]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await refreshAll();
      setIsLoading(false);
    };
    init();
  }, [refreshAll]);

  // Polling every 3 seconds for live metrics
  useEffect(() => {
    if (!pollingActive) return;

    const interval = setInterval(() => {
      loadLiveMetrics();
    }, 1500);

    return () => clearInterval(interval);
  }, [pollingActive, loadLiveMetrics]);

  // Auto-refresh today stats every 15 seconds
  useEffect(() => {
    if (!pollingActive) return;

    const interval = setInterval(() => {
      loadTodayStats();
      loadAllTimeStats();
    }, 5000);

    return () => clearInterval(interval);
  }, [pollingActive, loadTodayStats, loadAllTimeStats]);

  // Auto-refresh charts every 30 seconds
  useEffect(() => {
    if (!pollingActive) return;

    const interval = setInterval(() => {
      loadChartData();
    }, 10000);

    return () => clearInterval(interval);
  }, [pollingActive, loadChartData]);

  // Real-time subscription for instant updates
  useEffect(() => {
    const channel = supabase
      .channel('finance-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_bets' },
        () => {
          loadLiveMetrics();
          loadTodayStats();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_bets' },
        () => {
          loadLiveMetrics();
          loadTodayStats();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transaction_requests' },
        () => {
          loadLiveMetrics();
          loadTodayStats();
          loadAllTimeStats();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wallet_ledger' },
        () => loadLiveMetrics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLiveMetrics, loadTodayStats, loadAllTimeStats]);

  const getSelectedPeriodStats = () => {
    switch (dateRange) {
      case 'today': return todayStats;
      case 'week': return weekStats;
      case 'month': return monthStats;
      default: return todayStats;
    }
  };

  const selectedStats = getSelectedPeriodStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-400" />
            Finance Dashboard
          </h1>
          <p className="text-gray-400 flex items-center gap-2 mt-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span>Real-time updates active</span>
            <span className="text-gray-600">•</span>
            <span>Last: {format(lastUpdated, 'HH:mm:ss')}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-32 bg-gray-900 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPollingActive(!pollingActive)}
            className={cn(pollingActive ? 'border-green-500/30 text-green-400' : 'border-gray-700 text-gray-400')}
          >
            {pollingActive ? <Activity className="h-4 w-4 mr-2 animate-pulse" /> : <Clock className="h-4 w-4 mr-2" />}
            {pollingActive ? 'Live' : 'Paused'}
          </Button>
          <Button onClick={refreshAll} variant="outline" size="sm" disabled={isRefreshing}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Total Net Profit Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        <Card className={cn(
          "relative border-2 overflow-hidden",
          allTimeStats.totalNetProfit >= 0
            ? "bg-gradient-to-br from-emerald-950 via-green-950/80 to-teal-950 border-emerald-400/50"
            : "bg-gradient-to-br from-red-950 via-rose-950/80 to-pink-950 border-red-400/50"
        )}>
          {/* Glowing background effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={cn(
              "absolute -top-20 -left-20 w-60 h-60 rounded-full blur-[80px] opacity-40",
              allTimeStats.totalNetProfit >= 0 ? "bg-emerald-500" : "bg-red-500"
            )} />
            <div className={cn(
              "absolute -bottom-20 -right-20 w-60 h-60 rounded-full blur-[80px] opacity-30",
              allTimeStats.totalNetProfit >= 0 ? "bg-teal-400" : "bg-orange-500"
            )} />
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/5 to-transparent" />
          </div>
          
          <CardContent className="relative z-10 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Main Profit Display */}
              <div className="md:col-span-2 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    allTimeStats.totalNetProfit >= 0 
                      ? "bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/30" 
                      : "bg-gradient-to-br from-red-400 to-rose-500 shadow-lg shadow-red-500/30"
                  )}>
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-semibold text-white drop-shadow-lg">Total Net Profit (All Time)</span>
                </div>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className={cn(
                    "text-5xl font-black tracking-tight drop-shadow-2xl",
                    allTimeStats.totalNetProfit >= 0 
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-green-200 to-teal-300" 
                      : "text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-rose-200 to-orange-300"
                  )}>
                    {allTimeStats.totalNetProfit >= 0 ? '+' : ''}{formatTaka(allTimeStats.totalNetProfit)}
                  </span>
                  <Badge className={cn(
                    "text-sm font-bold px-3 py-1 shadow-lg",
                    allTimeStats.totalNetProfit >= 0
                      ? "bg-emerald-500/30 text-emerald-200 border-emerald-400/50 shadow-emerald-500/20"
                      : "bg-red-500/30 text-red-200 border-red-400/50 shadow-red-500/20"
                  )}>
                    {allTimeStats.totalNetProfit >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                    Profit
                  </Badge>
                </div>
                <div className="flex gap-6 mt-5 text-sm">
                  <div className="bg-black/30 rounded-lg px-4 py-2 backdrop-blur-sm border border-white/10">
                    <span className="text-gray-300 font-medium">RTP:</span>
                    <span className={cn(
                      "ml-2 font-bold text-lg", 
                      allTimeStats.rtp <= 95 ? "text-emerald-300" : "text-amber-300"
                    )}>
                      {allTimeStats.rtp.toFixed(2)}%
                    </span>
                  </div>
                  <div className="bg-black/30 rounded-lg px-4 py-2 backdrop-blur-sm border border-white/10">
                    <span className="text-gray-300 font-medium">Win Rate:</span>
                    <span className="ml-2 font-bold text-lg text-cyan-300">{allTimeStats.winRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 md:col-span-1">
                <div className="bg-gradient-to-br from-emerald-900/60 to-green-900/40 rounded-xl p-4 border-2 border-emerald-400/40 backdrop-blur-sm shadow-xl shadow-emerald-500/10 min-h-[100px] flex flex-col justify-between relative overflow-hidden group hover:border-emerald-400/60 transition-all duration-300">
                  {/* Animated glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex items-center gap-1.5 text-emerald-100 text-xs font-semibold uppercase tracking-wider relative z-10">
                    <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                    Deposits
                  </div>
                  <p className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-green-100 drop-shadow-2xl relative z-10 leading-tight">
                    {smartFormatTaka(allTimeStats.totalDeposits)}
                  </p>
                  <p className="text-[9px] text-emerald-300/70 font-mono relative z-10 mt-1">
                    {allTimeStats.totalDeposits >= 10000 && formatTaka(allTimeStats.totalDeposits)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-900/60 to-amber-900/40 rounded-xl p-4 border-2 border-orange-400/40 backdrop-blur-sm shadow-xl shadow-orange-500/10 min-h-[100px] flex flex-col justify-between relative overflow-hidden group hover:border-orange-400/60 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex items-center gap-1.5 text-orange-100 text-xs font-semibold uppercase tracking-wider relative z-10">
                    <ArrowDownRight className="h-4 w-4 text-orange-400" />
                    Withdrawals
                  </div>
                  <p className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-200 to-amber-100 drop-shadow-2xl relative z-10 leading-tight">
                    {smartFormatTaka(allTimeStats.totalWithdrawals)}
                  </p>
                  <p className="text-[9px] text-orange-300/70 font-mono relative z-10 mt-1">
                    {allTimeStats.totalWithdrawals >= 10000 && formatTaka(allTimeStats.totalWithdrawals)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-900/60 to-indigo-900/40 rounded-xl p-4 border-2 border-blue-400/40 backdrop-blur-sm shadow-xl shadow-blue-500/10 min-h-[100px] flex flex-col justify-between relative overflow-hidden group hover:border-blue-400/60 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex items-center gap-1.5 text-blue-100 text-xs font-semibold uppercase tracking-wider relative z-10">
                    <Coins className="h-4 w-4 text-blue-400" />
                    Total Bets
                  </div>
                  <p className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-100 drop-shadow-2xl relative z-10 leading-tight">
                    {smartFormatTaka(allTimeStats.totalBets)}
                  </p>
                  <p className="text-[9px] text-blue-300/70 font-mono relative z-10 mt-1">
                    {allTimeStats.totalBets >= 10000 && formatTaka(allTimeStats.totalBets)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-900/60 to-violet-900/40 rounded-xl p-4 border-2 border-purple-400/40 backdrop-blur-sm shadow-xl shadow-purple-500/10 min-h-[100px] flex flex-col justify-between relative overflow-hidden group hover:border-purple-400/60 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex items-center gap-1.5 text-purple-100 text-xs font-semibold uppercase tracking-wider relative z-10">
                    <Receipt className="h-4 w-4 text-purple-400" />
                    Payouts
                  </div>
                  <p className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-100 drop-shadow-2xl relative z-10 leading-tight">
                    {smartFormatTaka(allTimeStats.totalPayouts)}
                  </p>
                  <p className="text-[9px] text-purple-300/70 font-mono relative z-10 mt-1">
                    {allTimeStats.totalPayouts >= 10000 && formatTaka(allTimeStats.totalPayouts)}
                  </p>
                </div>
              </div>

              {/* Platform Stats */}
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-cyan-900/40 to-teal-900/30 rounded-xl p-4 flex items-center justify-between border border-cyan-500/30 backdrop-blur-sm shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/30 flex items-center justify-center">
                      <Users className="h-4 w-4 text-cyan-300" />
                    </div>
                    <span className="text-cyan-100 text-sm font-medium">Total Users</span>
                  </div>
                  <span className="text-2xl font-black text-cyan-300 drop-shadow-lg">{allTimeStats.totalUsers.toLocaleString()}</span>
                </div>
                <div className="bg-gradient-to-r from-amber-900/40 to-yellow-900/30 rounded-xl p-4 flex items-center justify-between border border-amber-500/30 backdrop-blur-sm shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/30 flex items-center justify-center">
                      <Receipt className="h-4 w-4 text-amber-300" />
                    </div>
                    <span className="text-amber-100 text-sm font-medium">Transactions</span>
                  </div>
                  <span className="text-2xl font-black text-amber-300 drop-shadow-lg">{allTimeStats.totalTransactions.toLocaleString()}</span>
                </div>
                <div className="bg-gradient-to-r from-pink-900/40 to-rose-900/30 rounded-xl p-4 flex items-center justify-between border border-pink-500/30 backdrop-blur-sm shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/30 flex items-center justify-center">
                      <Target className="h-4 w-4 text-pink-300" />
                    </div>
                    <span className="text-pink-100 text-sm font-medium">Avg Bet</span>
                  </div>
                  <span className="text-2xl font-black text-pink-300 drop-shadow-lg">{formatTaka(allTimeStats.avgBetAmount)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pending Withdrawals Alert */}
      {pendingWithdrawals > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="bg-orange-500/10 border-orange-500/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-orange-400">Pending Withdrawals</p>
                  <p className="text-sm text-gray-400">Requires approval</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-400">{formatTaka(pendingWithdrawals)}</p>
                <p className="text-xs text-gray-400">Today: {formatTaka(todayWithdrawals)}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Live Per-Minute Cards */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-medium text-yellow-400">LIVE (Per Minute)</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400 uppercase flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" /> Deposits/min
                </p>
                <p className="text-2xl font-bold text-green-400">{formatTaka(liveMetrics.deposits)}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.05 }}>
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400 uppercase">Bets/min</p>
                <p className="text-2xl font-bold text-blue-400">{formatTaka(liveMetrics.bets)}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400 uppercase">Fees/min</p>
                <p className="text-2xl font-bold text-purple-400">{formatTaka(liveMetrics.fees)}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15 }}>
            <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400 uppercase">Payouts/min</p>
                <p className="text-2xl font-bold text-orange-400">{formatTaka(liveMetrics.payouts)}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className={cn(
              'bg-gradient-to-br border',
              liveMetrics.netProfit >= 0
                ? 'from-green-500/10 to-emerald-500/10 border-green-500/30'
                : 'from-red-500/10 to-pink-500/10 border-red-500/30'
            )}>
              <CardContent className="p-4">
                <p className="text-xs text-gray-400 uppercase">Net P/L/min</p>
                <p className={cn('text-2xl font-bold', liveMetrics.netProfit >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {liveMetrics.netProfit >= 0 ? '+' : ''}{formatTaka(liveMetrics.netProfit)}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.25 }}>
            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400 uppercase">Active Users</p>
                <p className="text-2xl font-bold text-cyan-400">{liveMetrics.activeUsers}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-gray-900 border border-gray-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="games">Game Breakdown</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({alerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Period Summary */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white capitalize">{dateRange === 'all' ? 'All Time' : dateRange}'s Summary</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight className="h-4 w-4 text-green-400" />
                  <p className="text-sm text-gray-400">Deposits</p>
                </div>
                <p className="text-2xl font-bold text-green-400">{formatTaka(selectedStats.deposits)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-4 w-4 text-blue-400" />
                  <p className="text-sm text-gray-400">Bets</p>
                </div>
                <p className="text-2xl font-bold text-blue-400">{formatTaka(selectedStats.bets)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="h-4 w-4 text-orange-400" />
                  <p className="text-sm text-gray-400">Payouts</p>
                </div>
                <p className="text-2xl font-bold text-orange-400">{formatTaka(selectedStats.payouts)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-cyan-400" />
                  <p className="text-sm text-gray-400">Active Users</p>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{selectedStats.activeUsers}</p>
              </CardContent>
            </Card>
            <Card className={cn(
              'border-2',
              selectedStats.netProfit >= 0 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            )}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className={cn("h-4 w-4", selectedStats.netProfit >= 0 ? "text-green-400" : "text-red-400")} />
                  <p className="text-sm text-gray-400">Net Profit</p>
                </div>
                <p className={cn('text-2xl font-bold', selectedStats.netProfit >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {selectedStats.netProfit >= 0 ? '+' : ''}{formatTaka(selectedStats.netProfit)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-400" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {minuteData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={minuteData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="time" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#9CA3AF" tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} 
                        formatter={(value: number) => formatTaka(value)}
                      />
                      <Bar dataKey="bets" fill="#3B82F6" name="Bets" opacity={0.8} />
                      <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} dot={false} name="Profit" />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-400" />
                  Game Revenue (Today)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {gameBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPie>
                      <Pie
                        data={gameBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="profit"
                        nameKey="game"
                        label={({ game, percent }) => `${game} ${(percent * 100).toFixed(0)}%`}
                      >
                        {gameBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                        formatter={(value: number) => formatTaka(value)}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-500">
                    No games played today
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Winners */}
          {topWinners.length > 0 && (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-400" />
                  Top Winners Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {topWinners.map((winner, i) => (
                    <div key={i} className="bg-black/30 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Badge className={cn(
                          "text-xs",
                          i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                          i === 1 ? "bg-gray-400/20 text-gray-300" :
                          i === 2 ? "bg-orange-600/20 text-orange-400" :
                          "bg-gray-700/20 text-gray-400"
                        )}>
                          #{i + 1}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mb-1">...{winner.userId}</p>
                      <p className="text-lg font-bold text-green-400">+{formatTaka(winner.profit)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                7-Day Profit Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    formatter={(value: number) => formatTaka(value)}
                  />
                  <Legend />
                  <Bar dataKey="bets" fill="#3B82F6" name="Bets" opacity={0.8} />
                  <Bar dataKey="payouts" fill="#EF4444" name="Payouts" opacity={0.8} />
                  <Bar dataKey="deposits" fill="#10B981" name="Deposits" />
                  <Line type="monotone" dataKey="profit" stroke="#F59E0B" strokeWidth={3} name="Profit" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Period Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  Today
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Profit</span>
                  <span className={cn("font-bold", todayStats.netProfit >= 0 ? "text-green-400" : "text-red-400")}>
                    {formatTaka(todayStats.netProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bets</span>
                  <span className="text-white">{formatTaka(todayStats.bets)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active</span>
                  <span className="text-cyan-400">{todayStats.activeUsers}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Profit</span>
                  <span className={cn("font-bold", weekStats.netProfit >= 0 ? "text-green-400" : "text-red-400")}>
                    {formatTaka(weekStats.netProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bets</span>
                  <span className="text-white">{formatTaka(weekStats.bets)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active</span>
                  <span className="text-cyan-400">{weekStats.activeUsers}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-400" />
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Profit</span>
                  <span className={cn("font-bold", monthStats.netProfit >= 0 ? "text-green-400" : "text-red-400")}>
                    {formatTaka(monthStats.netProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bets</span>
                  <span className="text-white">{formatTaka(monthStats.bets)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active</span>
                  <span className="text-cyan-400">{monthStats.activeUsers}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Hourly Activity (Today)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hour" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151' }} />
                  <Bar dataKey="bets" fill="#3B82F6" name="Bets" />
                  <Bar dataKey="payouts" fill="#EF4444" name="Payouts" />
                  <Bar dataKey="deposits" fill="#10B981" name="Deposits" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {gameBreakdown.map((game) => {
              const config = GAME_CONFIG[game.game as GameType];
              return (
                <Card key={game.game} className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn('w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center', config?.gradient || 'from-gray-500 to-gray-600')}>
                        <span className="text-white text-lg">🎮</span>
                      </div>
                      <span className="text-white font-medium uppercase">{game.game}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Volume</span>
                        <span className="text-white">{formatTaka(game.bets)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Payouts</span>
                        <span className="text-white">{formatTaka(game.payouts)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rounds</span>
                        <span className="text-white">{game.count}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-800 pt-2">
                        <span className="text-gray-400">Profit</span>
                        <span className={cn(game.profit >= 0 ? 'text-green-400' : 'text-red-400')}>
                          {game.profit >= 0 ? '+' : ''}{formatTaka(game.profit)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400">No alerts at this time. System is running smoothly.</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <Card
                    key={alert.id}
                    className={cn(
                      'border',
                      alert.severity === 'critical'
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-yellow-500/10 border-yellow-500/30'
                    )}
                  >
                    <CardContent className="p-4 flex items-start gap-3">
                      <AlertTriangle className={cn(
                        'h-5 w-5 flex-shrink-0 mt-0.5',
                        alert.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'
                      )} />
                      <div className="flex-1">
                        <p className="text-white font-medium">{alert.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(alert.timestamp, 'HH:mm:ss')}
                        </p>
                      </div>
                      <Badge className={cn(
                        alert.severity === 'critical'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      )}>
                        {alert.severity}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
