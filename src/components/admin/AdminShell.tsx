import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, UserPlus, ArrowDownCircle, ArrowUpCircle,
  Activity, Settings, Shield, FileText, LogOut, ChevronRight,
  Menu, X, KeyRound, Gamepad2, BarChart3, TrendingUp, Wallet, Megaphone,
  Image as ImageIcon, Bell, MessageCircle, Lock, Database, LayoutTemplate,
  ArrowLeft, Home as HomeIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface AdminShellProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/agents', label: 'Agents', icon: UserPlus },
  { path: '/admin/deposits', label: 'Deposits', icon: ArrowDownCircle, badge: 'deposits' },
  { path: '/admin/withdraws', label: 'Withdrawals', icon: ArrowUpCircle, badge: 'withdrawals' },
  { path: '/admin/wallet-ledger', label: 'Wallet / Ledger', icon: Wallet },
  { path: '/admin/transactions', label: 'Transactions', icon: Activity },
  { path: '/admin/financial', label: 'Finance', icon: TrendingUp },
  { path: '/game-admin', label: 'Game Control', icon: Gamepad2, external: true },
  { path: '/admin/cms', label: 'Page CMS', icon: LayoutTemplate },
  { path: '/admin/promotions', label: 'Promotions', icon: Megaphone },
  { path: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { path: '/admin/announcements', label: 'Announcements', icon: Bell },
  { path: '/admin/support', label: 'Support Chat', icon: MessageCircle },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
  { path: '/admin/security', label: 'Security & KYC', icon: Lock },
  { path: '/admin/admin-users', label: 'Admin Users', icon: Shield },
  { path: '/admin/roles', label: 'Roles & Permissions', icon: KeyRound },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
  { path: '/admin/database', label: 'Database', icon: Database },
];

export const AdminShell = ({ children, title, description }: AdminShellProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { staffAccount, signOut } = useAdminAuth(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <h1 className="text-lg font-bold text-white">{title}</h1>
        <div className="w-10" />
      </div>

      <div className="flex">
        <aside className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900 border-r border-slate-700 transform transition-transform duration-200 ease-in-out lg:transform-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Admin Panel</h2>
                  <p className="text-xs text-slate-400">{staffAccount?.staff_role || 'Admin'}</p>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 py-4">
              <nav className="px-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                      {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                    </button>
                  );
                })}
              </nav>
            </ScrollArea>

            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {staffAccount?.display_name?.[0]?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {staffAccount?.display_name || 'Admin'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {staffAccount?.email}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-slate-600 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 min-h-screen">
          <div className="p-4 lg:px-6 lg:py-4 border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-white">{title}</h1>
                {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-slate-300"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4 mr-1" /> Menu
              </Button>
            </div>
          </div>
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
