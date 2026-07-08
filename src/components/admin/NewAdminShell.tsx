import { ReactNode, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, ArrowDownCircle, ArrowUpCircle,
  Activity, Settings, Shield, FileText, LogOut, ChevronRight,
  ChevronDown, Menu, X, Bell, UserPlus, Wallet,
  CheckCircle, XCircle, Clock, Gamepad2, Gift, Megaphone,
  CreditCard, TrendingUp, PieChart, Banknote, MessageSquare,
  Crown, Percent, Target, Zap, Database, Lock, Globe, Image,
  Send, AlertTriangle, BarChart3, Coins
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { adminLogout } from '@/lib/adminApi';
import { useDepositCenterFlag } from '@/lib/depositCenterFlag';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';

interface AdminShellProps {
  children: ReactNode;
  title: string;
  description?: string;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  children?: { path: string; label: string; status?: string; icon?: React.ElementType }[];
  superAdminOnly?: boolean;
}

const navItems: NavItem[] = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/super-admin-control', label: 'Super Admin Control', icon: Shield, superAdminOnly: true },
  {
    path: '/admin/deposit-centre',
    label: 'Deposit Centre',
    icon: ArrowDownCircle,
    children: [
      { path: '/admin/deposit-centre', label: 'Master Control', icon: ArrowDownCircle },
      { path: '/admin/deposits/pending', label: 'Pending', status: 'pending', icon: Clock },
      { path: '/admin/deposits/approved', label: 'Approved', status: 'approved', icon: CheckCircle },
      { path: '/admin/deposits/rejected', label: 'Rejected', status: 'rejected', icon: XCircle },
    ]
  },
  { 
    path: '/admin/withdraws', 
    label: 'Withdrawals', 
    icon: ArrowUpCircle,
    children: [
      { path: '/admin/withdraws/pending', label: 'Pending', status: 'pending', icon: Clock },
      { path: '/admin/withdraws/approved', label: 'Approved', status: 'approved', icon: CheckCircle },
      { path: '/admin/withdraws/rejected', label: 'Rejected', status: 'rejected', icon: XCircle },
    ]
  },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/wallet-ledger', label: 'Wallet / Ledger', icon: Wallet },
  { path: '/admin/transactions', label: 'Transactions', icon: Activity },
  { path: '/admin/agents', label: 'Agents', icon: UserPlus },
  {
    path: '/admin/games',
    label: 'Game Control',
    icon: Gamepad2,
    children: [
      { path: '/admin/games/wingo', label: 'WinGo', icon: Target },
      { path: '/admin/games/k3', label: 'K3', icon: Zap },
      { path: '/admin/games/5d', label: '5D', icon: Coins },
      { path: '/admin/games/trxwin', label: 'TrxWin', icon: TrendingUp },
      { path: '/admin/games/crash', label: 'Crash', icon: BarChart3 },
      { path: '/admin/games/aviator', label: 'Aviator', icon: Send },
      { path: '/admin/games/mines', label: 'Mines', icon: AlertTriangle },
    ]
  },
  {
    path: '/admin/finance',
    label: 'Finance',
    icon: Banknote,
    children: [
      { path: '/admin/finance/overview', label: 'Overview', icon: PieChart },
      { path: '/admin/finance/revenue', label: 'Revenue', icon: TrendingUp },
      { path: '/admin/finance/payouts', label: 'Payouts', icon: CreditCard },
    ]
  },
  {
    path: '/admin/promotions',
    label: 'Promotions',
    icon: Gift,
    children: [
      { path: '/admin/promotions/bonuses', label: 'Bonuses', icon: Percent },
      { path: '/admin/promotions/vip', label: 'VIP Levels', icon: Crown },
      { path: '/admin/promotions/cashback', label: 'Cashback', icon: Coins },
    ]
  },
  { path: '/admin/banners', label: 'Banners', icon: Image },
  { path: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { path: '/admin/support', label: 'Support Chat', icon: MessageSquare },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
  {
    path: '/admin/security',
    label: 'Security',
    icon: Lock,
    superAdminOnly: true,
    children: [
      { path: '/admin/security-fix-center', label: 'Security Fix Center', icon: Shield },
      { path: '/admin/admin-users', label: 'Admin Users', icon: Shield },
      { path: '/admin/roles', label: 'Roles & Permissions', icon: Lock },
      { path: '/admin/blocked-ips', label: 'Blocked IPs', icon: Globe },
    ]
  },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
  { path: '/admin/database', label: 'Database', icon: Database, superAdminOnly: true },
];

export const NewAdminShell = ({ children, title, description }: AdminShellProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { staffAccount } = useAdminAuth(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [now, setNow] = useState(new Date());
  const [depositCenterEnabled] = useDepositCenterFlag();
  const { isSuperAdmin } = useIsSuperAdmin();
  const visibleNavItems = navItems.filter(
    (i) =>
      (i.path !== '/admin/deposit-centre' || depositCenterEnabled) &&
      (!i.superAdminOnly || isSuperAdmin),
  );

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const loadPendingCounts = useCallback(async () => {
    const [depositsRes, withdrawalsRes] = await Promise.all([
      supabase.from('transaction_requests').select('id', { count: 'exact', head: true }).eq('type', 'deposit').eq('status', 'pending'),
      supabase.from('transaction_requests').select('id', { count: 'exact', head: true }).eq('type', 'withdraw').eq('status', 'pending')
    ]);
    setPendingDeposits(depositsRes.count || 0);
    setPendingWithdrawals(withdrawalsRes.count || 0);
  }, []);

  useEffect(() => {
    loadPendingCounts();
    const channel = supabase.channel('admin-pending-counts').on('postgres_changes', { event: '*', schema: 'public', table: 'transaction_requests' }, () => loadPendingCounts()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadPendingCounts]);

  const handleLogout = () => { adminLogout(); };
  const toggleExpand = (path: string) => setExpandedItems(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const totalPending = pendingDeposits + pendingWithdrawals;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-[#F9FAFB]">
      <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-[#1F2937] bg-[#111827] sticky top-0 z-40">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</Button>
        <h1 className="text-base font-bold text-[#F9FAFB]">{title}</h1>
        <div className="relative"><Bell className="h-5 w-5 text-[#9CA3AF]" />{totalPending > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] rounded-full text-[10px] flex items-center justify-center text-white">{totalPending}</span>}</div>
      </div>
      <div className="flex">
        <aside className={cn("fixed lg:sticky top-0 left-0 z-50 h-screen w-60 bg-[#0D1117] border-r border-[#1F2937] transform transition-transform duration-200 ease-in-out lg:transform-none overflow-hidden", sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
          <div className="flex flex-col h-full">
            <div className="h-16 px-5 flex items-center border-b border-[#1F2937]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center shadow-[0_0_18px_-2px_rgba(245,158,11,0.55)]"><Shield className="h-4.5 w-4.5 text-white" /></div>
                <div><h2 className="font-bold text-[#F9FAFB] text-base leading-none">GoLucky</h2><p className="text-[11px] text-[#F59E0B] font-medium mt-0.5">Admin Panel</p></div>
              </div>
            </div>
            <ScrollArea className="flex-1 py-4">
              <nav className="px-3 space-y-1">
                {visibleNavItems.map((item) => {
                  const hasChildren = item.children && item.children.length > 0;
                  const isExpanded = expandedItems.includes(item.path);
                  const active = isActive(item.path);
                  return (
                    <div key={item.path}>
                      <button onClick={() => { if (hasChildren) toggleExpand(item.path); else { navigate(item.path); setSidebarOpen(false); } }} className={cn("w-full flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 border-l-[3px]", active && !hasChildren ? "bg-[rgba(245,158,11,0.10)] text-[#F59E0B] border-l-[#F59E0B]" : "text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#111827] border-l-transparent")}>
                        <item.icon className={cn("h-4 w-4", active && "text-[#F59E0B]")} />
                        <span className="flex-1 text-left">{item.label}</span>
                        {hasChildren && <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown className="h-4 w-4" /></motion.div>}
                        {!hasChildren && active && <ChevronRight className="h-4 w-4 text-[#F59E0B]" />}
                      </button>
                      <AnimatePresence>
                        {hasChildren && isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="ml-6 mt-1 space-y-1 border-l border-[#1F2937] pl-3">
                              {item.children!.map((child) => (
                                <button key={child.path} onClick={() => { navigate(child.path); setSidebarOpen(false); }} className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors", location.pathname === child.path ? "bg-[rgba(245,158,11,0.10)] text-[#F59E0B]" : "text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#111827]")}>{child.label}</button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </nav>
            </ScrollArea>
            <div className="p-4 border-t border-[#1F2937]">
              <Button variant="outline" size="sm" className="w-full border-[#1F2937] bg-[#111827] text-[#9CA3AF] hover:bg-[rgba(239,68,68,0.12)] hover:text-[#EF4444] hover:border-[#EF4444]/50 transition-colors" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" />Logout</Button>
            </div>
          </div>
        </aside>
        {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}
        <main className="flex-1 min-h-screen">
          <div className="hidden lg:flex items-center justify-between h-16 px-6 border-b border-[#1F2937] bg-[#111827] sticky top-0 z-30">
            <div className="flex items-center gap-3"><h1 className="text-xl font-bold text-[#F9FAFB] tracking-tight">{title}</h1>{description && <span className="text-sm text-[#9CA3AF] hidden xl:inline">— {description}</span>}</div>
            <div className="flex items-center gap-4">
              <Badge className="bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border border-[#F59E0B]/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider"><Shield className="h-3 w-3 mr-1" />{staffAccount?.staff_role?.replace('_', ' ') || 'Admin'}</Badge>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0D1117] border border-[#1F2937]"><Clock className="h-3.5 w-3.5 text-[#F59E0B]" /><span className="font-mono text-sm text-[#F9FAFB] tabular-nums">{now.toLocaleTimeString('en-GB')}</span></div>
            </div>
          </div>
          <div className="p-6 bg-[#0A0E1A] min-h-[calc(100vh-4rem)]"><motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>{children}</motion.div></div>
        </main>
      </div>
    </div>
  );
};

export default NewAdminShell;
