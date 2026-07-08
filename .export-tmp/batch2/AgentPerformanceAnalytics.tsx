import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Users, Wallet, Calendar,
  Loader2, ArrowUpRight, ArrowDownRight, BarChart3, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { formatBDT, formatBDTFull } from '@/lib/agentConfig';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subDays, subWeeks, subMonths, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval } from 'date-fns';

interface AgentPerformanceAnalyticsProps {
  agentUserId: string;
  className?: string;
}

interface DailyStats {
  date: string;
  referrals: number;
  depositCommission: number;
  bettingCommission: number;
  totalCommission: number;
}

interface PeriodComparison {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

const COLORS = ['#14b8a6', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];

export default function AgentPerformanceAnalytics({ agentUserId, className }: AgentPerformanceAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [comparison, setComparison] = useState<{
    referrals: PeriodComparison;
    depositCommission: PeriodComparison;
    bettingCommission: PeriodComparison;
    totalCommission: PeriodComparison;
  } | null>(null);
  const [commissionBreakdown, setCommissionBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [topReferrals, setTopReferrals] = useState<{ username: string; deposit: number; commission: number }[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [agentUserId, period]);

  const getPeriodDays = () => {
    switch (period) {
      case 'week': return 7;
      case 'month': return 30;
      case 'quarter': return 90;
      default: return 30;
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const days = getPeriodDays();
      const now = new Date();
      const startDate = subDays(now, days);
      const previousStartDate = subDays(startDate, days);

      // Fetch commissions for current period
      const { data: currentCommissions } = await supabase
        .from('agent_commissions')
        .select('*')
        .eq('agent_user_id', agentUserId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Fetch commissions for previous period
      const { data: previousCommissions } = await supabase
        .from('agent_commissions')
        .select('*')
        .eq('agent_user_id', agentUserId)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Fetch referrals for current period
      const { data: currentReferrals } = await supabase
        .from('agent_referrals')
        .select('*')
        .eq('agent_user_id', agentUserId)
        .gte('created_at', startDate.toISOString());

      // Fetch referrals for previous period
      const { data: previousReferrals } = await supabase
        .from('agent_referrals')
        .select('*')
        .eq('agent_user_id', agentUserId)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Calculate daily stats
      const dateRange = eachDayOfInterval({ start: startDate, end: now });
      const stats: DailyStats[] = dateRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayCommissions = (currentCommissions || []).filter(
          c => format(new Date(c.created_at), 'yyyy-MM-dd') === dateStr
        );
        const dayReferrals = (currentReferrals || []).filter(
          r => format(new Date(r.created_at), 'yyyy-MM-dd') === dateStr
        );

        const depositComm = dayCommissions
          .filter(c => c.commission_type === 'deposit')
          .reduce((sum, c) => sum + c.commission_amount, 0);
        const bettingComm = dayCommissions
          .filter(c => c.commission_type === 'betting')
          .reduce((sum, c) => sum + c.commission_amount, 0);

        return {
          date: format(date, period === 'week' ? 'EEE' : 'MMM d'),
          referrals: dayReferrals.length,
          depositCommission: depositComm,
          bettingCommission: bettingComm,
          totalCommission: depositComm + bettingComm,
        };
      });

      setDailyStats(stats);

      // Calculate period comparisons
      const currentDepositComm = (currentCommissions || [])
        .filter(c => c.commission_type === 'deposit')
        .reduce((sum, c) => sum + c.commission_amount, 0);
      const currentBettingComm = (currentCommissions || [])
        .filter(c => c.commission_type === 'betting')
        .reduce((sum, c) => sum + c.commission_amount, 0);
      const previousDepositComm = (previousCommissions || [])
        .filter(c => c.commission_type === 'deposit')
        .reduce((sum, c) => sum + c.commission_amount, 0);
      const previousBettingComm = (previousCommissions || [])
        .filter(c => c.commission_type === 'betting')
        .reduce((sum, c) => sum + c.commission_amount, 0);

      const calcChange = (current: number, previous: number): PeriodComparison => ({
        current,
        previous,
        change: current - previous,
        changePercent: previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0,
      });

      setComparison({
        referrals: calcChange((currentReferrals || []).length, (previousReferrals || []).length),
        depositCommission: calcChange(currentDepositComm, previousDepositComm),
        bettingCommission: calcChange(currentBettingComm, previousBettingComm),
        totalCommission: calcChange(
          currentDepositComm + currentBettingComm,
          previousDepositComm + previousBettingComm
        ),
      });

      // Commission breakdown
      setCommissionBreakdown([
        { name: 'Deposit', value: currentDepositComm },
        { name: 'Betting', value: currentBettingComm },
      ]);

      // Fetch top performing referrals
      const { data: referralDetails } = await supabase
        .from('agent_referrals')
        .select('referred_user_id')
        .eq('agent_user_id', agentUserId);

      if (referralDetails && referralDetails.length > 0) {
        const userIds = referralDetails.map(r => r.referred_user_id);
        
        // Get wallet data for referrals
        const { data: walletData } = await supabase
          .from('wallets')
          .select('user_id, total_deposit')
          .in('user_id', userIds)
          .order('total_deposit', { ascending: false })
          .limit(5);

        // Get profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, username')
          .in('user_id', userIds);

        // Get commission data per referral
        const { data: commissionData } = await supabase
          .from('agent_commissions')
          .select('referred_user_id, commission_amount')
          .eq('agent_user_id', agentUserId)
          .in('referred_user_id', userIds);

        const topRefs = (walletData || []).map(w => {
          const profile = profileData?.find(p => p.user_id === w.user_id);
          const totalComm = (commissionData || [])
            .filter(c => c.referred_user_id === w.user_id)
            .reduce((sum, c) => sum + c.commission_amount, 0);

          return {
            username: profile?.username || w.user_id.slice(0, 8) + '...',
            deposit: w.total_deposit,
            commission: totalComm,
          };
        });

        setTopReferrals(topRefs);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChangeIndicator = (comparison: PeriodComparison) => {
    const isPositive = comparison.change >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-green-400' : 'text-red-400';

    return (
      <div className={`flex items-center gap-1 text-xs ${color}`}>
        <Icon className="h-3 w-3" />
        <span>{Math.abs(comparison.changePercent).toFixed(1)}%</span>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Period Selector */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Performance Analytics
        </h3>
        <Select value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month' | 'quarter')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="quarter">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Comparison Cards */}
      {comparison && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/30">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <Users className="h-5 w-5 text-amber-400" />
                  {renderChangeIndicator(comparison.referrals)}
                </div>
                <p className="text-xs text-muted-foreground">New Referrals</p>
                <p className="text-2xl font-bold text-amber-400">{comparison.referrals.current}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  vs {comparison.referrals.previous} prev
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <Wallet className="h-5 w-5 text-green-400" />
                  {renderChangeIndicator(comparison.depositCommission)}
                </div>
                <p className="text-xs text-muted-foreground">Deposit Comm.</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatBDT(comparison.depositCommission.current)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  vs {formatBDT(comparison.depositCommission.previous)} prev
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <Target className="h-5 w-5 text-blue-400" />
                  {renderChangeIndicator(comparison.bettingCommission)}
                </div>
                <p className="text-xs text-muted-foreground">Betting Comm.</p>
                <p className="text-2xl font-bold text-blue-400">
                  {formatBDT(comparison.bettingCommission.current)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  vs {formatBDT(comparison.bettingCommission.previous)} prev
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {renderChangeIndicator(comparison.totalCommission)}
                </div>
                <p className="text-xs text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold text-primary">
                  {formatBDT(comparison.totalCommission.current)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  vs {formatBDT(comparison.totalCommission.previous)} prev
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Commission Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Commission Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats}>
                  <defs>
                    <linearGradient id="colorDeposit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBetting" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => formatBDT(v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatBDTFull(value), '']}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="depositCommission"
                    name="Deposit"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorDeposit)"
                  />
                  <Area
                    type="monotone"
                    dataKey="bettingCommission"
                    name="Betting"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorBetting)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Referral Growth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" />
              Referral Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="referrals"
                    name="New Referrals"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Breakdown Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Commission Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center">
              {commissionBreakdown.some(c => c.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={commissionBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {commissionBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatBDTFull(value), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm">No commission data for this period</p>
              )}
            </div>
            <div className="flex justify-center gap-6 mt-2">
              {commissionBreakdown.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name}: {formatBDT(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Referrals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-400" />
              Top Performing Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topReferrals.length > 0 ? (
              <div className="space-y-3">
                {topReferrals.map((ref, index) => (
                  <motion.div
                    key={ref.username}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        index === 1 ? 'bg-slate-400/20 text-slate-300' :
                        index === 2 ? 'bg-amber-600/20 text-amber-500' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{ref.username}</p>
                        <p className="text-xs text-muted-foreground">
                          Deposits: {formatBDT(ref.deposit)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">{formatBDT(ref.commission)}</p>
                      <p className="text-xs text-muted-foreground">commission</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No referral data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
