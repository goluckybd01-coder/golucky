import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Calendar, DollarSign, Users } from 'lucide-react';
import { format, subDays, startOfDay, startOfWeek, startOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { formatBDT } from '@/lib/agentConfig';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CommissionData {
  id: string;
  commission_type: string;
  source_amount: number;
  commission_rate: number;
  commission_amount: number;
  created_at: string;
  referred_user_id: string;
  profile?: {
    username: string | null;
    display_user_id: string | null;
  };
}

interface AgentCommissionAnalyticsProps {
  commissions: CommissionData[];
}

const COLORS = {
  deposit: '#22c55e',
  betting: '#3b82f6',
  total: '#f97316',
};

export default function AgentCommissionAnalytics({ commissions }: AgentCommissionAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  const getRangeDays = () => {
    switch (timeRange) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 7;
    }
  };

  // Process commission data for charts
  const chartData = useMemo(() => {
    const days = getRangeDays();
    const now = new Date();
    const startDate = subDays(startOfDay(now), days - 1);

    // Generate date range
    const dateRange: { date: string; deposit: number; betting: number; total: number }[] = [];
    for (let i = 0; i < days; i++) {
      const date = subDays(now, days - 1 - i);
      dateRange.push({
        date: format(date, days <= 7 ? 'EEE' : 'MMM d'),
        deposit: 0,
        betting: 0,
        total: 0,
      });
    }

    // Aggregate commissions by date
    commissions.forEach((comm) => {
      const commDate = startOfDay(parseISO(comm.created_at));
      if (commDate >= startDate) {
        const dayIndex = Math.floor((commDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < days) {
          if (comm.commission_type === 'deposit') {
            dateRange[dayIndex].deposit += comm.commission_amount;
          } else {
            dateRange[dayIndex].betting += comm.commission_amount;
          }
          dateRange[dayIndex].total += comm.commission_amount;
        }
      }
    });

    return dateRange;
  }, [commissions, timeRange]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const days = getRangeDays();
    const now = new Date();
    const startDate = subDays(startOfDay(now), days - 1);

    let totalDeposit = 0;
    let totalBetting = 0;
    let transactionCount = 0;

    commissions.forEach((comm) => {
      const commDate = parseISO(comm.created_at);
      if (commDate >= startDate) {
        transactionCount++;
        if (comm.commission_type === 'deposit') {
          totalDeposit += comm.commission_amount;
        } else {
          totalBetting += comm.commission_amount;
        }
      }
    });

    const total = totalDeposit + totalBetting;
    const avgDaily = total / days;

    return {
      totalDeposit,
      totalBetting,
      total,
      avgDaily,
      transactionCount,
    };
  }, [commissions, timeRange]);

  // Pie chart data
  const pieData = useMemo(() => [
    { name: 'Deposit', value: stats.totalDeposit, color: COLORS.deposit },
    { name: 'Betting', value: stats.totalBetting, color: COLORS.betting },
  ].filter(d => d.value > 0), [stats]);

  // Weekly breakdown
  const weeklyData = useMemo(() => {
    const weeks: { week: string; deposit: number; betting: number; total: number }[] = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(now, i * 7));
      const weekEnd = subDays(startOfWeek(subDays(now, (i - 1) * 7)), 1);
      
      let deposit = 0;
      let betting = 0;

      commissions.forEach((comm) => {
        const commDate = parseISO(comm.created_at);
        if (isWithinInterval(commDate, { start: weekStart, end: i === 0 ? now : weekEnd })) {
          if (comm.commission_type === 'deposit') {
            deposit += comm.commission_amount;
          } else {
            betting += comm.commission_amount;
          }
        }
      });

      weeks.push({
        week: `Week ${4 - i}`,
        deposit,
        betting,
        total: deposit + betting,
      });
    }

    return weeks;
  }, [commissions]);

  // User-wise breakdown
  const userBreakdown = useMemo(() => {
    const days = getRangeDays();
    const now = new Date();
    const startDate = subDays(startOfDay(now), days - 1);

    const userMap = new Map<string, {
      userId: string;
      displayUserId: string | null;
      username: string | null;
      depositComm: number;
      bettingComm: number;
      totalComm: number;
      transactionCount: number;
    }>();

    commissions.forEach((comm) => {
      const commDate = parseISO(comm.created_at);
      if (commDate >= startDate) {
        const existing = userMap.get(comm.referred_user_id);
        if (existing) {
          if (comm.commission_type === 'deposit') {
            existing.depositComm += comm.commission_amount;
          } else {
            existing.bettingComm += comm.commission_amount;
          }
          existing.totalComm += comm.commission_amount;
          existing.transactionCount++;
        } else {
          userMap.set(comm.referred_user_id, {
            userId: comm.referred_user_id,
            displayUserId: comm.profile?.display_user_id || null,
            username: comm.profile?.username || null,
            depositComm: comm.commission_type === 'deposit' ? comm.commission_amount : 0,
            bettingComm: comm.commission_type === 'betting' ? comm.commission_amount : 0,
            totalComm: comm.commission_amount,
            transactionCount: 1,
          });
        }
      }
    });

    // Sort by total commission descending
    return Array.from(userMap.values()).sort((a, b) => b.totalComm - a.totalComm);
  }, [commissions, timeRange]);

  // Generate colors for user breakdown bar chart
  const USER_COLORS = [
    '#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ec4899',
    '#14b8a6', '#f59e0b', '#6366f1', '#ef4444', '#84cc16'
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {formatBDT(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Earnings Analytics
        </h3>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as '7d' | '30d' | '90d')}>
          <TabsList className="h-8">
            <TabsTrigger value="7d" className="text-xs px-3">7 Days</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs px-3">30 Days</TabsTrigger>
            <TabsTrigger value="90d" className="text-xs px-3">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/30">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">Total Earned</p>
            <p className="text-lg font-bold text-orange-400">{formatBDT(stats.total)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">Deposit Comm.</p>
            <p className="text-lg font-bold text-green-400">{formatBDT(stats.totalDeposit)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">Betting Comm.</p>
            <p className="text-lg font-bold text-blue-400">{formatBDT(stats.totalBetting)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">Avg Daily</p>
            <p className="text-lg font-bold text-purple-400">{formatBDT(stats.avgDaily)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart - Area Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Daily Earnings Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="depositGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.deposit} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.deposit} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="bettingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.betting} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.betting} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#888', fontSize: 10 }} 
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis 
                  tick={{ fill: '#888', fontSize: 10 }} 
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickFormatter={(v) => `৳${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="deposit" 
                  name="Deposit" 
                  stroke={COLORS.deposit} 
                  fill="url(#depositGradient)"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="betting" 
                  name="Betting" 
                  stroke={COLORS.betting} 
                  fill="url(#bettingGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Weekly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fill: '#888', fontSize: 10 }} 
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis 
                    tick={{ fill: '#888', fontSize: 10 }} 
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickFormatter={(v) => `৳${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="deposit" name="Deposit" fill={COLORS.deposit} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="betting" name="Betting" fill={COLORS.betting} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Commission Split */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Commission Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatBDT(value)}
                      contentStyle={{ 
                        background: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend 
                      formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No commission data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User-wise Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            User-wise Commission Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userBreakdown.length > 0 ? (
            <>
              {/* Horizontal Bar Chart for Top Users */}
              <div className="h-[200px] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={userBreakdown.slice(0, 8)} 
                    layout="vertical"
                    margin={{ left: 10, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      type="number"
                      tick={{ fill: '#888', fontSize: 10 }} 
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickFormatter={(v) => `৳${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`}
                    />
                    <YAxis 
                      type="category"
                      dataKey="displayUserId"
                      tick={{ fill: '#888', fontSize: 9 }} 
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      width={85}
                      tickFormatter={(v) => v || 'Unknown'}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="depositComm" 
                      name="Deposit" 
                      stackId="a"
                      fill={COLORS.deposit} 
                      radius={[0, 0, 0, 0]} 
                    />
                    <Bar 
                      dataKey="bettingComm" 
                      name="Betting" 
                      stackId="a"
                      fill={COLORS.betting} 
                      radius={[0, 4, 4, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed User List */}
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {userBreakdown.map((user, index) => (
                    <div 
                      key={user.userId} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: USER_COLORS[index % USER_COLORS.length] }}
                        >
                          {index + 1}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {user.username || 'Anonymous'}
                          </p>
                          {user.displayUserId && (
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                              {user.displayUserId}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-bold text-orange-400">{formatBDT(user.totalComm)}</p>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-green-400">D: {formatBDT(user.depositComm)}</span>
                          <span className="text-blue-400">B: {formatBDT(user.bettingComm)}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{user.transactionCount} txns</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              No user commission data yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Count */}
      <Card className="bg-muted/30">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Total Transactions</span>
          </div>
          <span className="text-lg font-bold">{stats.transactionCount}</span>
        </CardContent>
      </Card>
    </div>
  );
}
