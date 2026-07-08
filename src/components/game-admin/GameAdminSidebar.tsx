import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  LayoutDashboard,
  Settings,
  History,
  BarChart3,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Dices,
  Target,
  Rocket,
  Bomb,
  Plane,
  Trophy,
  FileText,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const gameMenuItems = [
  { icon: Target, label: 'WinGo', path: '/game-admin/wingo' },
  { icon: Dices, label: 'K3', path: '/game-admin/k3' },
  { icon: Trophy, label: '5D', path: '/game-admin/5d' },
  { icon: Rocket, label: 'Crash', path: '/game-admin/crash' },
  { icon: Bomb, label: 'Mines', path: '/game-admin/mines' },
  { icon: Plane, label: 'Aviator', path: '/game-admin/aviator' },
  { icon: Coins, label: 'Crypto Trading (14)', path: '/game-admin/crypto-trading' },
];

const mainMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/game-admin' },
  { icon: Settings, label: 'Global Settings', path: '/game-admin/settings' },
  { icon: History, label: 'Round History', path: '/game-admin/history' },
  { icon: BarChart3, label: 'Statistics', path: '/game-admin/stats' },
  { icon: FileText, label: 'Audit Logs', path: '/game-admin/audit' },
];

interface GameAdminSidebarProps {
  adminName?: string;
}

const GameAdminSidebar = ({ adminName = 'Game Admin' }: GameAdminSidebarProps) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    navigate('/game-admin/login');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3 }}
      className="h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900 border-r border-white/10 flex flex-col sticky top-0"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Gamepad2 className="h-5 w-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <h1 className="font-bold text-white text-lg">Game Admin</h1>
                <p className="text-xs text-gray-400 truncate">{adminName}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="mb-4">
          <AnimatePresence>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2"
              >
                Main
              </motion.p>
            )}
          </AnimatePresence>
          {mainMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/game-admin'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </div>

        {/* Games Section */}
        <div>
          <AnimatePresence>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2"
              >
                Games
              </motion.p>
            )}
          </AnimatePresence>
          {gameMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 space-y-2">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            'w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-5 w-5" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="ml-3"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full text-gray-400 hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="ml-2 text-xs"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </motion.aside>
  );
};

export default GameAdminSidebar;
