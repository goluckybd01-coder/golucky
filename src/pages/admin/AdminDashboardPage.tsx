import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserPlus, Wallet, ArrowDownCircle, 
  ArrowUpCircle, Activity, TrendingUp, DollarSign, Clock,
  RefreshCw, AlertTriangle, Gamepad2, Shield, BarChart3,
  Zap, Target, Award
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminShell } from '@/components/admin/AdminShell';
import { EnhancedStatsCard } from '@/components/admin/EnhancedStatsCard';
import { QuickActionButton } from '@/components/admin/QuickActionButton';
import { LiveIndicator } from '@/components/admin/LiveIndicator';
import { formatTaka } from '@/lib/currency';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  totalAgents: number;
  activeAgents: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  todayDepositsAmount: number;
  todayWithdrawalsAmount: number;
  totalBalance: number;
  todayBets: number;
  todayPayouts: number;
  netProfit: number;
}

const AdminDashboardPage = () => {
  const { staffAccount } = useAdminAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    newUsersToday: 0,
    totalAgents: 0,
    activeAgents: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    todayDepositsAmount: 0,
    todayWithdrawalsAmount: 0,
    totalBalance: 0,
    todayBets: 0,
    todayPayouts: 0,
    netProfit: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [
        usersResult,
        newUsersResult,
        agentsResult,
        activeAgentsResult, // Using not null check for active
        pendingDepositsResult,
        pendingWithdrawalsResult,
        todayDepositsResult,
        todayWithdrawalsResult,
        walletsResult,
        todayBetsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).not('agent_status', 'is', null),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('agent_status', 'approved'),
        supabase.from('transaction_requests').select('id', { count: 'exact', head: true }).eq('type', 'deposit').eq('status', 'pending'),
        supabase.from('transaction_requests').select('id', { count: 'exact', head: true }).eq('type', 'withdraw').eq('status', 'pending'),
        supabase.from('transaction_requests').select('amount').eq('type', 'deposit').eq('status', 'approved').gte('created_at', today.toISOString()),
        supabase.from('transaction_requests').select('amount').eq('type', 'withdraw').eq('status', 'approved').gte('created_at', today.toISOString()),
        supabase.from('wallets').select('balance'),
        supabase.from('game_bets').select('bet_amount, payout').gte('created_at', today.toISOString()),
      ]);

      const todayBetsTotal = todayBetsResult.data?.reduce((sum, b) => sum + (b.bet_amount || 0), 0) || 0;
      const todayPayoutsTotal = todayBetsResult.data?.reduce((sum, b) => sum + (b.payout || 0), 0) || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        newUsersToday: newUsersResult.count || 0,
        totalAgents: agentsResult.count || 0,
        activeAgents: activeAgentsResult.count || 0,
        pendingDeposits: pendingDepositsResult.count || 0,
        pendingWithdrawals: pendingWithdrawalsResult.count || 0,
        todayDepositsAmount: todayDepositsResult.data?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0,
        todayWithdrawalsAmount: todayWithdrawalsResult.data?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0,
        totalBalance: walletsResult.data?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0,
        todayBets: todayBetsTotal,
        todayPayouts: todayPayoutsTotal,
        netProfit: todayBetsTotal - todayPayoutsTotal,
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 15000); // Every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const quickLinks = [
    { label: 'Users', icon: <Users className="h-5 w-5" />, href: '/admin/users', color: 'bg-blue-600' },
    { label: 'Agents', icon: <UserPlus className="h-5 w-5" />, href: '/admin/agents', color: 'bg-purple-600' },
    { label: 'Deposits', icon: <ArrowDownCircle className="h-5 w-5" />, href: '/admin/deposits', badge: stats.pendingDeposits, color: 'bg-emerald-600' },
    { label: 'Withdrawals', icon: <ArrowUpCircle className="h-5 w-5" />, href: '/admin/withdraws', badge: stats.pendingWithdrawals, color: 'bg-orange-600' },
    { label: 'Transactions', icon: <Activity className="h-5 w-5" />, href: '/admin/transactions', color: 'bg-cyan-600' },
    { label: 'Games', icon: <Gamepad2 className="h-5 w-5" />, href: '/game-admin', color: 'bg-pink-600' },
  ];

  const totalPending = stats.pendingDeposits + stats.pendingWithdrawals;
  const goalProgress = Math.min(100, (20 - totalPending) / 20 * 100);

  return (
    <AdminShell title="Dashboard" description="Platform overview and quick actions">
      <div className="space-y-6">
        {/* Welcome Banner with Live Status */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600/20 via-amber-500/20 to-orange-600/20 border border-orange-500/30 p-6"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIyIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9nPjwvc3ZnPg==')] opacity-50" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Welcome back, {staffAccount?.display_name || 'Admin'}!
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-slate-400">
                    {format(new Date(), 'EEEE, MMMM do, yyyy')}
                  </p>
                  <LiveIndicator size="sm" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-400">Last update</p>
                <p className="text-sm text-white">{format(lastUpdate, 'HH:mm:ss')}</p>
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={loadStats} 
                disabled={isLoading}
                className="border-orange-500/50 hover:bg-orange-500/20"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          {/* Daily Progress */}
          {totalPending > 0 && (
            <div className="mt-4 pt-4 border-t border-orange-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">
                  {totalPending} pending requests to process
                </span>
                <span className="text-sm font-medium text-orange-400">
                  {Math.round(goalProgress)}% cleared
                </span>
              </div>
              <Progress value={goalProgress} className="h-2 bg-slate-700" />
            </div>
          )}
        </motion.div>

        {/* Primary Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <EnhancedStatsCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            subtitle={`+${stats.newUsersToday} today`}
            icon={<Users className="h-5 w-5" />}
            color="blue"
            trend={{ value: stats.newUsersToday > 0 ? 12 : 0 }}
            onClick={() => navigate('/admin/users')}
          />
          
          <EnhancedStatsCard
            title="Active Agents"
            value={stats.activeAgents.toLocaleString()}
            subtitle={`${stats.totalAgents} total`}
            icon={<UserPlus className="h-5 w-5" />}
            color="purple"
            onClick={() => navigate('/admin/agents')}
          />
          
          <EnhancedStatsCard
            title="Today's Deposits"
            value={formatTaka(stats.todayDepositsAmount)}
            subtitle={`${stats.pendingDeposits} pending`}
            icon={<ArrowDownCircle className="h-5 w-5" />}
            color="green"
            pulse={stats.pendingDeposits > 0}
            onClick={() => navigate('/admin/deposits')}
          />
          
          <EnhancedStatsCard
            title="Today's Withdrawals"
            value={formatTaka(stats.todayWithdrawalsAmount)}
            subtitle={`${stats.pendingWithdrawals} pending`}
            icon={<ArrowUpCircle className="h-5 w-5" />}
            color="orange"
            pulse={stats.pendingWithdrawals > 0}
            onClick={() => navigate('/admin/withdraws')}
          />
        </div>

        {/* Financial Overview */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <EnhancedStatsCard
            title="Today's Bets"
            value={formatTaka(stats.todayBets)}
            icon={<Target className="h-5 w-5" />}
            color="cyan"
          />
          
          <EnhancedStatsCard
            title="Today's Payouts"
            value={formatTaka(stats.todayPayouts)}
            icon={<Award className="h-5 w-5" />}
            color="pink"
          />
          
          <EnhancedStatsCard
            title="Net Profit"
            value={formatTaka(stats.netProfit)}
            icon={<TrendingUp className="h-5 w-5" />}
            color={stats.netProfit >= 0 ? 'green' : 'red'}
            trend={{ value: stats.netProfit >= 0 ? 8 : -5 }}
          />
          
          <EnhancedStatsCard
            title="Platform Balance"
            value={formatTaka(stats.totalBalance)}
            icon={<Wallet className="h-5 w-5" />}
            color="yellow"
          />
        </div>

        {/* Quick Actions */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Navigate to common sections</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-3 md:grid-cols-6">
              {quickLinks.map((link) => (
                <QuickActionButton
                  key={link.href}
                  icon={link.icon}
                  label={link.label}
                  badge={link.badge}
                  color={link.color}
                  onClick={() => navigate(link.href)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts Section */}
        {(stats.pendingDeposits > 5 || stats.pendingWithdrawals > 3) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-red-500/10 border-red-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Attention Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.pendingDeposits > 5 && (
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-red-500/20">
                    <div className="flex items-center gap-3">
                      <ArrowDownCircle className="h-5 w-5 text-green-400" />
                      <span className="text-slate-300">{stats.pendingDeposits} pending deposits need review</span>
                    </div>
                    <Button size="sm" onClick={() => navigate('/admin/deposits')}>
                      Review Now
                    </Button>
                  </div>
                )}
                {stats.pendingWithdrawals > 3 && (
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-red-500/20">
                    <div className="flex items-center gap-3">
                      <ArrowUpCircle className="h-5 w-5 text-orange-400" />
                      <span className="text-slate-300">{stats.pendingWithdrawals} pending withdrawals need approval</span>
                    </div>
                    <Button size="sm" onClick={() => navigate('/admin/withdraws')}>
                      Review Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AdminShell>
  );
};

export default AdminDashboardPage;
