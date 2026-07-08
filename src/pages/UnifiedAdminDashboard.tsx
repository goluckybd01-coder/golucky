import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminUnifiedSidebar } from '@/components/admin/unified/AdminUnifiedSidebar';
import { FinanceDashboard } from '@/components/admin/unified/FinanceDashboard';
import { AgentDashboard } from '@/components/admin/unified/AgentDashboard';
import { StaffManagement } from '@/components/admin/unified/StaffManagement';
import { GameAdminModule } from '@/components/admin/unified/GameAdminModule';
import { WithdrawRequestsModule } from '@/components/admin/unified/WithdrawRequestsModule';
import { AuditLogsModule } from '@/components/admin/unified/AuditLogsModule';
import { DepositsModule } from '@/components/admin/unified/DepositsModule';
import { BetsRoundsModule } from '@/components/admin/unified/BetsRoundsModule';
import { UsersModule } from '@/components/admin/unified/UsersModule';
import { SupportInboxModule } from '@/components/admin/unified/SupportInboxModule';
import { ApiGamesModule } from '@/components/admin/unified/ApiGamesModule';
import { MobilePaymentsModule } from '@/components/admin/unified/MobilePaymentsModule';
import { EnhancedGameControlModule } from '@/components/admin/unified/EnhancedGameControlModule';
import { GamesCatalogModule } from '@/components/admin/unified/GamesCatalogModule';
import { ProvidersModule } from '@/components/admin/unified/ProvidersModule';
import { StaffRole, Permission, GameType, canAccessModule, canAccessGame } from '@/lib/adminPermissions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface GameScope {
  game_scope: string;
  can_view: boolean;
  can_edit: boolean;
  can_override: boolean;
}

const UnifiedAdminDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('overview');
  const [staffRole, setStaffRole] = useState<StaffRole>('support');
  const [displayName, setDisplayName] = useState('Admin');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [gameScopes, setGameScopes] = useState<GameScope[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadPendingCounts = useCallback(async () => {
    const [depositsResult, withdrawalsResult, alertsResult] = await Promise.all([
      supabase.from('transaction_requests').select('*', { count: 'exact', head: true }).eq('type', 'deposit').eq('status', 'pending'),
      supabase.from('transaction_requests').select('*', { count: 'exact', head: true }).eq('type', 'withdraw').eq('status', 'pending'),
      supabase.from('admin_notification_history').select('*', { count: 'exact', head: true }).eq('is_read', false),
    ]);
    setPendingDeposits(depositsResult.count || 0);
    setPendingWithdrawals(withdrawalsResult.count || 0);
    setUnreadAlerts(alertsResult.count || 0);
    setLastUpdate(new Date());
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/admin/login'); return; }
      const { data: staff } = await supabase.from('staff_accounts').select('*').eq('user_id', user.id).eq('is_active', true).single();
      if (staff) {
        setStaffRole(staff.staff_role as StaffRole);
        setDisplayName(staff.display_name || staff.email || 'Admin');
        const [permsResult, scopesResult] = await Promise.all([
          supabase.from('staff_permissions').select('permission').eq('staff_id', staff.id),
          supabase.from('staff_game_scopes').select('*').eq('staff_id', staff.id),
        ]);
        setPermissions((permsResult.data?.map(p => p.permission) || []) as Permission[]);
        setGameScopes(scopesResult.data || []);
      } else {
        const { data: oldRole } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
        if (oldRole?.role === 'super_admin') {
          setStaffRole('super_admin');
          setDisplayName('Super Admin');
        } else {
          toast.error('Access denied');
          navigate('/admin/login');
          return;
        }
      }
      await loadPendingCounts();
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Authentication failed');
      navigate('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, loadPendingCounts]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    channelRef.current = supabase.channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaction_requests' }, () => loadPendingCounts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notification_history' }, () => loadPendingCounts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_applications' }, () => loadPendingCounts())
      .subscribe((status) => setIsConnected(status === 'SUBSCRIBED'));
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [loadPendingCounts]);

  useEffect(() => {
    const interval = setInterval(() => loadPendingCounts(), 10000);
    return () => clearInterval(interval);
  }, [loadPendingCounts]);

  const handleLogout = async () => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  const renderModule = () => {
    if (activeModule.startsWith('game-')) {
      const gameType = activeModule.replace('game-', '') as GameType;
      if (canAccessGame(staffRole, gameScopes, gameType, 'view')) {
        return <GameAdminModule gameType={gameType} staffRole={staffRole} gameScopes={gameScopes} onBack={() => setActiveModule('overview')} />;
      }
      return <AccessDenied />;
    }
    switch (activeModule) {
      case 'finance': return canAccessModule(staffRole, permissions, 'finance') ? <FinanceDashboard /> : <AccessDenied />;
      case 'deposits': return canAccessModule(staffRole, permissions, 'finance') ? <DepositsModule /> : <AccessDenied />;
      case 'bets': return canAccessModule(staffRole, permissions, 'finance') ? <BetsRoundsModule /> : <AccessDenied />;
      case 'game-control': return canAccessModule(staffRole, permissions, 'games') || staffRole === 'super_admin' ? <EnhancedGameControlModule /> : <AccessDenied />;
      case 'agents': return canAccessModule(staffRole, permissions, 'agents') ? <AgentDashboard /> : <AccessDenied />;
      case 'users': return canAccessModule(staffRole, permissions, 'users') ? <UsersModule /> : <AccessDenied />;
      case 'withdrawals': return staffRole === 'super_admin' ? <WithdrawRequestsModule /> : <AccessDenied />;
      case 'staff': return staffRole === 'super_admin' ? <StaffManagement /> : <AccessDenied />;
      case 'audit': return canAccessModule(staffRole, permissions, 'audit') ? <AuditLogsModule /> : <AccessDenied />;
      case 'support': return canAccessModule(staffRole, permissions, 'support') || staffRole === 'super_admin' || staffRole === 'support' ? <SupportInboxModule /> : <AccessDenied />;
      case 'api-games': return staffRole === 'super_admin' || canAccessModule(staffRole, permissions, 'games') ? <ApiGamesModule /> : <AccessDenied />;
      case 'games-catalog': return canAccessModule(staffRole, permissions, 'games') || staffRole === 'super_admin' ? <GamesCatalogModule /> : <AccessDenied />;
      case 'providers': return staffRole === 'super_admin' ? <ProvidersModule /> : <AccessDenied />;
      case 'mobile-payments': return staffRole === 'super_admin' || canAccessModule(staffRole, permissions, 'finance') ? <MobilePaymentsModule /> : <AccessDenied />;
      default: return <OverviewModule lastUpdate={lastUpdate} isConnected={isConnected} onModuleChange={setActiveModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <div className="fixed top-4 right-4 z-50">
        <Badge className={`flex items-center gap-1.5 px-3 py-1.5 ${isConnected ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
          {isConnected ? (<><Wifi className="h-3 w-3" /><span className="text-xs">Live</span><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /></>) : (<><WifiOff className="h-3 w-3" /><span className="text-xs">Offline</span></>)}
        </Badge>
      </div>
      <AdminUnifiedSidebar activeModule={activeModule} onModuleChange={setActiveModule} staffRole={staffRole} displayName={displayName} permissions={permissions} gameScopes={gameScopes} pendingDeposits={pendingDeposits} pendingWithdrawals={pendingWithdrawals} unreadAlerts={unreadAlerts} onLogout={handleLogout} />
      <main className="flex-1 p-6 overflow-auto">{renderModule()}</main>
    </div>
  );
};

const AccessDenied = () => (
  <Card className="bg-red-500/10 border-red-500/30">
    <CardContent className="p-8 text-center">
      <p className="text-red-400 text-lg">Access Denied</p>
      <p className="text-gray-400 mt-2">You don't have permission to view this module.</p>
    </CardContent>
  </Card>
);

const OverviewModule = ({ lastUpdate, isConnected, onModuleChange }: { lastUpdate: Date; isConnected: boolean; onModuleChange: (module: string) => void }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-gray-400">Welcome to the GoLucky Admin Panel. Select a module from the sidebar.</p>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <RefreshCw className={`h-4 w-4 ${isConnected ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
        <span>Last update: {format(lastUpdate, 'HH:mm:ss')}</span>
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { key: 'finance', label: 'Finance', sub: 'Live monitoring', color: 'green' },
        { key: 'agents', label: 'Agents', sub: 'Management', color: 'blue' },
        { key: 'bets', label: 'Games', sub: 'Per-game admin', color: 'purple' },
        { key: 'staff', label: 'Staff', sub: 'Permissions', color: 'yellow' },
      ].map((c) => (
        <Card key={c.key} className={`bg-gray-900/50 border-gray-800 hover:border-${c.color}-500/30 transition-colors cursor-pointer`} onClick={() => onModuleChange(c.key)}>
          <CardContent className="p-4 text-center">
            <p className="text-gray-400">{c.label}</p>
            <p className="text-white">{c.sub}</p>
            <div className="mt-2 flex justify-center"><span className={`w-2 h-2 bg-${c.color}-400 rounded-full animate-pulse`} /></div>
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { key: 'deposits', label: 'Deposits', sub: 'Live feed', cls: 'bg-green-900/20 border-green-500/30 text-green-400' },
        { key: 'withdrawals', label: 'Withdrawals', sub: 'Super Admin only', cls: 'bg-red-900/20 border-red-500/30 text-red-400' },
        { key: 'users', label: 'Users', sub: 'Management', cls: 'bg-blue-900/20 border-blue-500/30 text-blue-400' },
        { key: 'audit', label: 'Audit Logs', sub: 'Activity tracking', cls: 'bg-purple-900/20 border-purple-500/30 text-purple-400' },
      ].map((c) => (
        <Card key={c.key} className={`${c.cls} hover:opacity-90 transition-colors cursor-pointer`} onClick={() => onModuleChange(c.key)}>
          <CardContent className="p-4 text-center">
            <p className={`font-medium ${c.cls.split(' ').pop()}`}>{c.label}</p>
            <p className="text-xs text-gray-400">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
    <Card className="bg-gray-900/50 border-gray-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-400">{isConnected ? 'Real-time connection active' : 'Reconnecting...'}</span>
          </div>
          <div className="text-sm text-gray-500">Auto-refresh: Every 10 seconds</div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default UnifiedAdminDashboard;
