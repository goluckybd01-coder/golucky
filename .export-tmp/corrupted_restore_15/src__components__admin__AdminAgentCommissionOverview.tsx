import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, DollarSign, TrendingUp, Loader2, Search,
  ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, Eye, Calendar, X, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay, parseISO, isWithinInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  AGENT_TIERS,
  AgentTier,
  formatBDTFull,
  formatBDT,
  getTierConfig,
} from '@/lib/agentConfig';
import { exportAgentCommissions, AgentCommissionExportItem } from '@/lib/csvExport';

interface AgentCommissionSummary {
  user_id: string;
  username: string | null;
  display_user_id: string | null;
  agent_tier: AgentTier;
  agent_code: string;
  referral_count: number;
  total_deposit_commission: number;
  total_betting_commission: number;
  total_commission: number;
  commission_balance: number;
  commission_count: number;
}

interface CommissionDetail {
  id: string;
  commission_type: string;
  source_amount: number;
  commission_rate: number;
  commission_amount: number;
  created_at: string;
  referred_user_id: string;
  referred_user?: {
    username: string | null;
    display_user_id: string | null;
  };
}

interface AdminAgentCommissionOverviewProps {
  className?: string;
}

const COLORS = {
  deposit: '#22c55e',
  betting: '#3b82f6',
};

const TIER_COLORS: Record<string, string> = {
  starter: '#6b7280',
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2',
  diamond: '#b9f2ff',
  master: '#ff6b6b',
};

export function AdminAgentCommissionOverview({ className }: AdminAgentCommissionOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentCommissionSummary[]>([]);
  const [allCommissions, setAllCommissions] = useState<{
    agent_user_id: string;
    commission_type: string;
    commission_amount: number;
    created_at: string;
  }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<'total_commission' | 'referral_count' | 'commission_count'>('total_commission');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Date range filter
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [datePreset, setDatePreset] = useState<string>('all');
  
  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentCommissionSummary | null>(null);
  const [commissionDetails, setCommissionDetails] = useState<CommissionDetail[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load approved agents
      const { data: agentProfiles, error: agentError } = await supabase
        .from('profiles')
        .select('user_id, username, display_user_id, agent_tier, agent_code, agent_status')
        .eq('agent_status', 'approved');

      if (agentError) throw agentError;

      // Load all commissions for filtering
      const { data: allComms } = await supabase
        .from('agent_commissions')
        .select('agent_user_id, commission_type, commission_amount, created_at')
        .order('created_at', { ascending: false });

      setAllCommissions(allComms || []);

      const agentSummaries: AgentCommissionSummary[] = [];

      for (const agent of agentProfiles || []) {
        // Get wallet data
        const { data: wallet } = await supabase
          .from('wallets')
          .select('commission_balance, total_commission_earned')
          .eq('user_id', agent.user_id)
          .maybeSingle();

        // Get referral count
        const { count: referralCount } = await supabase
          .from('agent_referrals')
          .select('id', { count: 'exact', head: true })
          .eq('agent_user_id', agent.user_id);

        agentSummaries.push({
          user_id: agent.user_id,
          username: agent.username,
          display_user_id: agent.display_user_id,
          agent_tier: agent.agent_tier as AgentTier,
          agent_code: agent.agent_code,
          referral_count: referralCount || 0,
          total_deposit_commission: 0, // Will be calculated based on date filter
          total_betting_commission: 0,
          total_commission: 0,
          commission_balance: wallet?.commission_balance || 0,
          commission_count: 0,
        });
      }

      setAgents(agentSummaries);
    } catch (error) {
      console.error('Error loading agent commission data:', error);
      toast.error('Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  // Apply date preset
  const handleDatePreset = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    
    switch (preset) {
      case '7d':
        setDateRange({ from: subDays(now, 7), to: now });
        break;
      case '30d':
        setDateRange({ from: subDays(now, 30), to: now });
        break;
      case '90d':
        setDateRange({ from: subDays(now, 90), to: now });
        break;
      case 'all':
        setDateRange({ from: undefined, to: undefined });
        break;
    }
  };

  // Calculate agent stats based on date filter
  const filteredAgentStats = useMemo(() => {
    return agents.map(agent => {
      const agentCommissions = allCommissions.filter(c => {
        if (c.agent_user_id !== agent.user_id) return false;
        
        if (dateRange.from || dateRange.to) {
          const commDate = parseISO(c.created_at);
          if (dateRange.from && commDate < startOfDay(dateRange.from)) return false;
          if (dateRange.to && commDate > endOfDay(dateRange.to)) return false;
        }
        
        return true;
      });

      let depositComm = 0;
      let bettingComm = 0;
      agentCommissions.forEach(c => {
        if (c.commission_type === 'deposit') {
          depositComm += c.commission_amount;
        } else {
          bettingComm += c.commission_amount;
        }
      });

      return {
        ...agent,
        total_deposit_commission: depositComm,
        total_betting_commission: bettingComm,
        total_commission: depositComm + bettingComm,
        commission_count: agentCommissions.length,
      };
    });
  }, [agents, allCommissions, dateRange]);

  const loadAgentDetails = async (agent: AgentCommissionSummary) => {
    setSelectedAgent(agent);
    setShowDetailModal(true);
    setDetailLoading(true);

    try {
      let query = supabase
        .from('agent_commissions')
        .select('*')
        .eq('agent_user_id', agent.user_id)
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply date filter
      if (dateRange.from) {
        query = query.gte('created_at', startOfDay(dateRange.from).toISOString());
      }
      if (dateRange.to) {
        query = query.lte('created_at', endOfDay(dateRange.to).toISOString());
      }

      const { data: commissions, error } = await query;

      if (error) throw error;

      // Get referred user profiles
      if (commissions && commissions.length > 0) {
        const userIds = [...new Set(commissions.map(c => c.referred_user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_user_id')
          .in('user_id', userIds);

        const commissionsWithUsers = commissions.map(c => ({
          ...c,
          referred_user: profiles?.find(p => p.user_id === c.referred_user_id) || undefined
        }));

        setCommissionDetails(commissionsWithUsers);
      } else {
        setCommissionDetails([]);
      }
    } catch (error) {
      console.error('Error loading commission details:', error);
      toast.error('Failed to load details');
    } finally {
      setDetailLoading(false);
    }
  };

  // Filtered and sorted agents
  const filteredAgents = useMemo(() => {
    let result = [...filteredAgentStats];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.username?.toLowerCase().includes(query) ||
        a.agent_code.toLowerCase().includes(query) ||
        a.display_user_id?.toLowerCase().includes(query)
      );
    }

    // Tier filter
    if (tierFilter !== 'all') {
      result = result.filter(a => a.agent_tier === tierFilter);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return result;
  }, [filteredAgentStats, searchQuery, tierFilter, sortColumn, sortDirection]);

  // Summary stats
  const stats = useMemo(() => {
    const totalDeposit = filteredAgentStats.reduce((sum, a) => sum + a.total_deposit_commission, 0);
    const totalBetting = filteredAgentStats.reduce((sum, a) => sum + a.total_betting_commission, 0);
    const totalReferrals = filteredAgentStats.reduce((sum, a) => sum + a.referral_count, 0);
    const totalCommissions = filteredAgentStats.reduce((sum, a) => sum + a.commission_count, 0);

    return {
      totalDeposit,
      totalBetting,
      totalAll: totalDeposit + totalBetting,
      totalReferrals,
      totalCommissions,
      activeAgents: filteredAgentStats.length,
    };
  }, [filteredAgentStats]);

  // Chart data - Top 10 agents by commission
  const topAgentsChartData = useMemo(() => {
    return [...filteredAgentStats]
      .sort((a, b) => b.total_commission - a.total_commission)
      .slice(0, 10)
      .map(a => ({
        name: a.agent_code,
        deposit: a.total_deposit_commission,
        betting: a.total_betting_commission,
      }));
  }, [filteredAgentStats]);

  // Pie chart - Commission by tier
  const tierDistributionData = useMemo(() => {
    const tierTotals: Record<string, number> = {};
    filteredAgentStats.forEach(a => {
      tierTotals[a.agent_tier] = (tierTotals[a.agent_tier] || 0) + a.total_commission;
    });

    return Object.entries(tierTotals)
      .filter(([, value]) => value > 0)
      .map(([tier, value]) => ({
        name: getTierConfig(tier as AgentTier)?.name || tier,
        value,
        color: TIER_COLORS[tier] || '#888',
      }));
  }, [filteredAgentStats]);

  // Monthly comparison data - Current month vs Previous month
  const monthlyComparisonData = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));

    const currentMonthName = format(now, 'MMM yyyy');
    const prevMonthName = format(subMonths(now, 1), 'MMM yyyy');

    return agents.map(agent => {
      const agentComms = allCommissions.filter(c => c.agent_user_id === agent.user_id);

      let currentMonthTotal = 0;
      let prevMonthTotal = 0;

      agentComms.forEach(c => {
        const commDate = parseISO(c.created_at);
        if (isWithinInterval(commDate, { start: currentMonthStart, end: currentMonthEnd })) {
          currentMonthTotal += c.commission_amount;
        } else if (isWithinInterval(commDate, { start: prevMonthStart, end: prevMonthEnd })) {
          prevMonthTotal += c.commission_amount;
        }
      });

      const growth = prevMonthTotal > 0 
        ? ((currentMonthTotal - prevMonthTotal) / prevMonthTotal * 100)
        : currentMonthTotal > 0 ? 100 : 0;

      return {
        name: agent.agent_code,
        username: agent.username,
        currentMonth: currentMonthTotal,
        prevMonth: prevMonthTotal,
        growth,
        currentMonthName,
        prevMonthName,
      };
    })
    .filter(a => a.currentMonth > 0 || a.prevMonth > 0)
    .sort((a, b) => b.currentMonth - a.currentMonth)
    .slice(0, 10);
  }, [agents, allCommissions]);

  const handleExportCSV = () => {
    const exportData: AgentCommissionExportItem[] = filteredAgents.map(agent => ({
      agent_code: agent.agent_code,
      username: agent.username,
      display_user_id: agent.display_user_id,
      agent_tier: agent.agent_tier,
      referral_count: agent.referral_count,
      total_deposit_commission: agent.total_deposit_commission,
      total_betting_commission: agent.total_betting_commission,
      total_commission: agent.total_commission,
      commission_count: agent.commission_count,
    }));

    exportAgentCommissions(exportData, { from: dateRange.from, to: dateRange.to });
    toast.success(`Exported ${exportData.length} agents to CSV`);
  };

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ column }: { column: typeof sortColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return sortDirection === 'desc' 
      ? <ArrowDown className="h-3 w-3" /> 
      : <ArrowUp className="h-3 w-3" />;
  };

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
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-2 text-orange-400" />
            <p className="text-xl font-bold text-orange-400">{formatBDT(stats.totalAll)}</p>
            <p className="text-xs text-muted-foreground">Total Commission</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-2 text-green-400" />
            <p className="text-xl font-bold text-green-400">{formatBDT(stats.totalDeposit)}</p>
            <p className="text-xs text-muted-foreground">Deposit Comm.</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-2 text-blue-400" />
            <p className="text-xl font-bold text-blue-400">{formatBDT(stats.totalBetting)}</p>
            <p className="text-xs text-muted-foreground">Betting Comm.</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-2 text-purple-400" />
            <p className="text-xl font-bold text-purple-400">{stats.activeAgents}</p>
            <p className="text-xs text-muted-foreground">Active Agents</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-500/30">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-2 text-cyan-400" />
            <p className="text-xl font-bold text-cyan-400">{stats.totalReferrals}</p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/10 border-pink-500/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-2 text-pink-400" />
            <p className="text-xl font-bold text-pink-400">{stats.totalCommissions}</p>
            <p className="text-xs text-muted-foreground">Total Txns</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Top Agents Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top 10 Agents by Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {topAgentsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topAgentsChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      type="number"
                      tick={{ fill: '#888', fontSize: 10 }} 
                      tickFormatter={(v) => `৳${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name"
                      tick={{ fill: '#888', fontSize: 9 }} 
                      width={70}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="deposit" name="Deposit" stackId="a" fill={COLORS.deposit} />
                    <Bar dataKey="betting" name="Betting" stackId="a" fill={COLORS.betting} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No commission data
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tier Distribution Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Commission by Agent Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {tierDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tierDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {tierDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatBDT(value)} />
                    <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Comparison Chart */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Monthly Comparison - {monthlyComparisonData[0]?.prevMonthName || 'Previous'} vs {monthlyComparisonData[0]?.currentMonthName || 'Current'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {monthlyComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyComparisonData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    type="number"
                    tick={{ fill: '#888', fontSize: 10 }} 
                    tickFormatter={(v) => `৳${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#888', fontSize: 9 }} 
                    width={70}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                            <p className="text-sm font-medium mb-2">{label}</p>
                            <p className="text-xs text-muted-foreground mb-1">{data.username || 'Anonymous'}</p>
                            <p className="text-xs" style={{ color: '#a855f7' }}>
                              {data.prevMonthName}: {formatBDT(data.prevMonth)}
                            </p>
                            <p className="text-xs" style={{ color: '#22c55e' }}>
                              {data.currentMonthName}: {formatBDT(data.currentMonth)}
                            </p>
                            <p className={`text-xs mt-1 font-medium ${data.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {data.growth >= 0 ? '↑' : '↓'} {Math.abs(data.growth).toFixed(1)}% Growth
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="prevMonth" 
                    name="Previous Month" 
                    fill="#a855f7" 
                    radius={[0, 0, 0, 0]} 
                  />
                  <Bar 
                    dataKey="currentMonth" 
                    name="Current Month" 
                    fill="#22c55e" 
                    radius={[0, 4, 4, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No monthly comparison data available
              </div>
            )}
          </div>

          {/* Growth Indicators */}
          {monthlyComparisonData.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {monthlyComparisonData.slice(0, 5).map((agent, idx) => (
                <div 
                  key={idx}
                  className="p-2 rounded-lg bg-muted/50 text-center"
                >
                  <p className="text-xs font-mono text-muted-foreground">{agent.name}</p>
                  <p className={`text-sm font-bold ${agent.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {agent.growth >= 0 ? '+' : ''}{agent.growth.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search agent code, username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Date Range Presets */}
        <Select value={datePreset} onValueChange={handleDatePreset}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        {/* Custom Date Range Picker */}
        {datePreset === 'custom' && (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[130px] justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, "MMM d, yy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">-</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[130px] justify-start text-left font-normal",
                    !dateRange.to && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, "MMM d, yy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {(dateRange.from || dateRange.to) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setDateRange({ from: undefined, to: undefined });
                  setDatePreset('all');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Date Range Badge */}
        {(dateRange.from || dateRange.to) && datePreset !== 'custom' && (
          <Badge variant="secondary" className="flex items-center gap-1">
            {dateRange.from && format(dateRange.from, "MMM d")} - {dateRange.to && format(dateRange.to, "MMM d, yy")}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
              onClick={() => {
                setDateRange({ from: undefined, to: undefined });
                setDatePreset('all');
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            {AGENT_TIERS.map((tier, idx) => (
              <SelectItem key={idx} value={tier.tier}>
                {tier.icon} {tier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={loadData} title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          onClick={handleExportCSV}
          disabled={filteredAgents.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export CSV</span>
        </Button>
      </div>

      {/* Agents Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Tier</th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('referral_count')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Referrals
                      <SortIcon column="referral_count" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Deposit Comm.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Betting Comm.</th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('total_commission')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Total Comm.
                      <SortIcon column="total_commission" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('commission_count')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Txns
                      <SortIcon column="commission_count" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No agents found
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent) => {
                    const tierConfig = getTierConfig(agent.agent_tier);
                    return (
                      <motion.tr
                        key={agent.user_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <p className="font-medium">{agent.username || 'Anonymous'}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs font-mono">
                                {agent.agent_code}
                              </Badge>
                              {agent.display_user_id && (
                                <span className="text-xs font-mono text-orange-400">
                                  {agent.display_user_id}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`bg-gradient-to-r ${tierConfig?.gradient} text-white`}>
                            {tierConfig?.icon} {tierConfig?.name}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {agent.referral_count}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-green-400">{formatBDT(agent.total_deposit_commission)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-blue-400">{formatBDT(agent.total_betting_commission)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-orange-400">{formatBDT(agent.total_commission)}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {agent.commission_count}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadAgentDetails(agent)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Agent Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Commission Details - {selectedAgent?.agent_code}
            </DialogTitle>
          </DialogHeader>

          {selectedAgent && (
            <div className="space-y-4">
              {/* Agent Summary */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardContent className="p-3 text-center">
                    <p className="text-lg font-bold text-green-400">
                      {formatBDT(selectedAgent.total_deposit_commission)}
                    </p>
                    <p className="text-xs text-muted-foreground">Deposit Comm.</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/10 border-blue-500/30">
                  <CardContent className="p-3 text-center">
                    <p className="text-lg font-bold text-blue-400">
                      {formatBDT(selectedAgent.total_betting_commission)}
                    </p>
                    <p className="text-xs text-muted-foreground">Betting Comm.</p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-500/10 border-orange-500/30">
                  <CardContent className="p-3 text-center">
                    <p className="text-lg font-bold text-orange-400">
                      {formatBDT(selectedAgent.total_commission)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </CardContent>
                </Card>
              </div>

              {/* Commission History */}
              <div>
                <h4 className="text-sm font-medium mb-2">Recent Commissions</h4>
                {detailLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {commissionDetails.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No commission history
                        </p>
                      ) : (
                        commissionDetails.map((comm) => (
                          <div
                            key={comm.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  className={comm.commission_type === 'deposit' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-blue-500/20 text-blue-400'
                                  }
                                >
                                  {comm.commission_type}
                                </Badge>
                                <span className="text-sm">
                                  Source: {formatBDT(comm.source_amount)}
                                </span>
                              </div>
                              {comm.referred_user?.display_user_id && (
                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                  {comm.referred_user.display_user_id}
                                </span>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(comm.created_at), 'PPp')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${comm.commission_type === 'deposit' ? 'text-green-400' : 'text-blue-400'}`}>
                                +{formatBDT(comm.commission_amount)}
                              </p>
                              <p className="text-xs text-muted-foreground">{comm.commission_rate}%</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}