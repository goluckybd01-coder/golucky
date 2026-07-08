import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  DollarSign,
  ArrowDownCircle,
  Gamepad2,
  TrendingUp,
  Users,
  Wallet,
  Shield,
  Settings,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Target,
  Dices,
  Trophy,
  Zap,
  Rocket,
  Bomb,
  Plane,
  UserCog,
  Bell,
  Activity,
  Headphones,
  Globe,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  StaffRole,
  Permission,
  GameType,
  canAccessModule,
  canAccessGame,
  GAME_CONFIG,
  ROLE_LABELS,
  ROLE_COLORS,
} from '@/lib/adminPermissions';

interface GameScope {
  game_scope: string;
  can_view: boolean;
  can_edit: boolean;
  can_override: boolean;
}

interface AdminUnifiedSidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  staffRole: StaffRole;
  displayName: string;
  permissions: Permission[];
  gameScopes: GameScope[];
  pendingDeposits: number;
  pendingWithdrawals: number;
  unreadAlerts: number;
  pendingChats?: number;
  onLogout: () => void;
}

const GAME_ICONS: Record<GameType, any> = {
  wingo: Target,
  k3: Dices,
  '5d': Trophy,
  trxwin: Zap,
  crash: Rocket,
  mines: Bomb,
  aviator: Plane,
};

export const AdminUnifiedSidebar = ({
  activeModule,
  onModuleChange,
  staffRole,
  displayName,
  permissions,
  gameScopes,
  pendingDeposits,
  pendingWithdrawals,
  unreadAlerts,
  pendingChats = 0,
  onLogout,
}: AdminUnifiedSidebarProps) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [gamesExpanded, setGamesExpanded] = useState(activeModule.startsWith('game-'));

  const handleModuleClick = useCallback((moduleId: string) => {
    if (moduleId.startsWith('game-')) {
      const game = moduleId.replace('game-', '') as GameType;
      navigate(`/admin/game/${game}`);
    } else {
      onModuleChange(moduleId);
    }
  }, [navigate, onModuleChange]);

  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview', access: true },
    { id: 'finance', icon: DollarSign, label: 'Finance Dashboard', access: canAccessModule(staffRole, permissions, 'finance'), submenu: [
        { id: 'deposits', label: 'Deposits', badge: pendingDeposits },
        { id: 'bets', label: 'Bets & Rounds' },
        { id: 'profit', label: 'Profit/Loss Reports' },
      ]},
    { id: 'agents', icon: Users, label: 'Agent Dashboard', access: canAccessModule(staffRole, permissions, 'agents') },
    { id: 'users', icon: UserCog, label: 'Users', access: canAccessModule(staffRole, permissions, 'users') },
    { id: 'withdrawals', icon: Wallet, label: 'Withdraw Requests', badge: pendingWithdrawals, access: canAccessModule(staffRole, permissions, 'withdrawals'), superOnly: true },
    { id: 'game-control', icon: Target, label: 'Game Control', access: canAccessModule(staffRole, permissions, 'games') || staffRole === 'super_admin' },
    { id: 'games', icon: Gamepad2, label: 'Game Admin', access: canAccessModule(staffRole, permissions, 'games'), hasGameSubmenu: true },
    { id: 'games-catalog', icon: Gamepad2, label: 'Games Catalog', access: canAccessModule(staffRole, permissions, 'games') || staffRole === 'super_admin' },
    { id: 'api-games', icon: Globe, label: 'API Games', access: staffRole === 'super_admin' || canAccessModule(staffRole, permissions, 'games') },
    { id: 'providers', icon: Shield, label: 'Providers', access: staffRole === 'super_admin', superOnly: true },
    { id: 'mobile-payments', icon: Smartphone, label: 'Mobile Payments', access: staffRole === 'super_admin' || canAccessModule(staffRole, permissions, 'finance') },
    { id: 'staff', icon: Shield, label: 'Staff & Permissions', access: canAccessModule(staffRole, permissions, 'staff'), superOnly: true },
    { id: 'settings', icon: Settings, label: 'Settings', access: canAccessModule(staffRole, permissions, 'settings'), superOnly: true },
    { id: 'audit', icon: FileText, label: 'Audit Logs', access: canAccessModule(staffRole, permissions, 'audit') },
    { id: 'support', icon: Headphones, label: 'Support Inbox', badge: pendingChats, access: canAccessModule(staffRole, permissions, 'support') || staffRole === 'super_admin' || staffRole === 'support' },
  ];

  const accessibleGames = Object.keys(GAME_CONFIG).filter(game => 
    canAccessGame(staffRole, gameScopes, game as GameType, 'view')
  ) as GameType[];

  const roleColorConfig = ROLE_COLORS[staffRole];

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-screen bg-gray-900 border-r border-gray-800 flex flex-col sticky top-0 z-50"
    >
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex-1 min-w-0">
                <h1 className="font-bold text-white text-lg">GoLucky Admin</h1>
                <Badge className={cn('text-xs', roleColorConfig.bg, roleColorConfig.text, roleColorConfig.border)}>{ROLE_LABELS[staffRole]}</Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {!collapsed && <p className="text-xs text-gray-500 mt-2 truncate">{displayName}</p>}
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="px-2 space-y-1">
          {menuItems.filter(item => item.access).map((item) => (
            <div key={item.id}>
              <button
                onClick={() => item.hasGameSubmenu ? setGamesExpanded(!gamesExpanded) : handleModuleClick(item.id)}
                className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  activeModule === item.id ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800')}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="flex-1 text-sm font-medium text-left">{item.label}</span>}
                {!collapsed && item.badge && item.badge > 0 && <Badge className="bg-red-500 text-white text-xs">{item.badge}</Badge>}
                {!collapsed && item.hasGameSubmenu && <ChevronDown className={cn('h-4 w-4 transition-transform', gamesExpanded && 'rotate-180')} />}
              </button>
              {item.hasGameSubmenu && gamesExpanded && !collapsed && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-gray-800 pl-3">
                  {accessibleGames.map((game) => {
                    const config = GAME_CONFIG[game];
                    const GameIcon = GAME_ICONS[game];
                    return (
                      <button key={game} onClick={() => navigate(`/admin/${game}-game`)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800">
                        <GameIcon className={cn('h-4 w-4', config.color)} />{config.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-3 border-t border-gray-800 space-y-2">
        {unreadAlerts > 0 && !collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <Bell className="h-4 w-4 text-yellow-400" /><span className="text-sm text-yellow-400">{unreadAlerts} Unread Alerts</span>
          </div>
        )}
        <Separator className="bg-gray-800" />
        <Button variant="ghost" onClick={onLogout} className={cn('w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10', collapsed && 'justify-center px-0')}>
          <LogOut className="h-5 w-5" />{!collapsed && <span className="ml-3">Logout</span>}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="w-full text-gray-400 hover:text-white">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </motion.aside>
  );
};
