import { useState, useMemo, useEffect, useRef } from "react";
import Confetti from "@/components/Confetti";
import { toast } from "@/hooks/use-toast";
import { useAdminSounds, AdminSoundPreferences, DEFAULT_SOUND_PREFERENCES } from "@/hooks/useAdminSounds";
import {
  LayoutDashboard,
  Users,
  Wallet,
  TrendingUp,
  Gamepad2,
  History,
  Settings,
  LogOut,
  Sun,
  Moon,
  Search,
  X,
  Clock,
  Volume2,
  VolumeX,
  ArrowUpCircle,
  ArrowDownCircle,
  Bell,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  XCircle,
  Zap,
  Target,
  Flame,
  Trophy,
  Star,
  Award,
  Play,
  UserPlus,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/useTheme";
import { formatDistanceToNow } from "date-fns";

interface UserSearchResult {
  user_id: string;
  username: string | null;
  phone: string | null;
  display_user_id: string | null;
  vip_level: number;
}

interface RecentTransaction {
  id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  username?: string | null;
  display_user_id?: string | null;
}

interface UnreadAlert {
  id: string;
  title: string;
  message: string | null;
  priority: "low" | "medium" | "high" | "critical";
  notification_type: string;
  created_at: string;
  metadata?: {
    user_id?: string;
    display_user_id?: string;
    username?: string;
    [key: string]: unknown;
  } | null;
}

interface OldestPendingRequest {
  id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  username: string | null;
  display_user_id: string | null;
  created_at: string;
}

interface WeeklyVolume {
  day: string;
  deposits: number;
  withdrawals: number;
}

interface GoalStreak {
  current_streak: number;
  best_streak: number;
  total_goals_met: number;
  last_goal_met_date: string | null;
}

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingRequests: number;
  unreadNotifications: number;
  onLogout: () => void;
  onNavigateToSettings: () => void;
  users?: UserSearchResult[];
  onUserSelect?: (userId: string) => void;
  recentTransactions?: RecentTransaction[];
  unreadAlerts?: UnreadAlert[];
  onMarkAllAlertsRead?: () => void;
  soundEnabled?: boolean;
  soundVolume?: number;
  soundPreferences?: AdminSoundPreferences;
  onSoundToggle?: () => void;
  onVolumeChange?: (volume: number) => void;
  onSoundPreferencesChange?: (preferences: AdminSoundPreferences) => void;
  todayDeposits?: number;
  todayWithdrawals?: number;
  oldestPendingRequest?: OldestPendingRequest | null;
  onQuickProcess?: (requestId: string, action: "approve" | "reject") => Promise<void>;
  isProcessing?: boolean;
  weeklyVolume?: WeeklyVolume[];
  previousWeekVolume?: number;
  todayNewRequests?: number;
  todayProcessed?: number;
  dailyGoal?: number;
  onUpdateDailyGoal?: (goal: number) => Promise<void>;
  isUpdatingGoal?: boolean;
  goalStreak?: GoalStreak | null;
}

const navItems = [
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard },
  { id: "users", title: "Users", icon: Users },
  { id: "requests", title: "Requests", icon: Wallet, showBadge: "pending" },
  { id: "agents", title: "Agents", icon: UserPlus },
  { id: "referrals", title: "Referrals", icon: TrendingUp },
  { id: "games", title: "Games", icon: Gamepad2, hasSubmenu: true, submenu: [
    { id: "wingo-game", title: "WinGo Manager", route: "/admin/wingo-game" },
    { id: "k3-game", title: "K3 Manager", route: "/admin/k3-game" },
    { id: "5d-game", title: "5D Manager", route: "/admin/5d-game" },
    { id: "trxwin-game", title: "TRX Hash Manager", route: "/admin/trxwin-game" },
    { id: "crash-game", title: "Crash Manager", route: "/admin/crash-game" },
    { id: "mines-game", title: "Mines Manager", route: "/admin/mines-game" },
  ]},
  { id: "notifications", title: "Alerts", icon: History, showBadge: "unread" },
];

export function AdminSidebar({
  activeTab,
  onTabChange,
  pendingRequests,
  unreadNotifications,
  onLogout,
  onNavigateToSettings,
  users = [],
  onUserSelect,
  recentTransactions = [],
  unreadAlerts = [],
  onMarkAllAlertsRead,
  soundEnabled = true,
  soundVolume = 0.7,
  soundPreferences = DEFAULT_SOUND_PREFERENCES,
  onSoundToggle,
  onVolumeChange,
  onSoundPreferencesChange,
  todayDeposits = 0,
  todayWithdrawals = 0,
  oldestPendingRequest,
  onQuickProcess,
  isProcessing = false,
  weeklyVolume = [],
  previousWeekVolume = 0,
  todayNewRequests = 0,
  todayProcessed = 0,
  dailyGoal = 20,
  onUpdateDailyGoal,
  isUpdatingGoal = false,
  goalStreak,
}: AdminSidebarProps) {
  const { state } = useSidebar();
  const { isDark, toggleTheme } = useTheme();
  const { playQueueClearedSound, playNewRequestSound, testApprovalSound, testRejectionSound, testQueueClearedSound, testNewRequestSound } = useAdminSounds(soundEnabled, soundVolume, soundPreferences);
  const isCollapsed = state === "collapsed";
  const [isSoundPrefsExpanded, setIsSoundPrefsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(true);
  const [, setTimeRefresh] = useState(0);
  const [prevPendingCount, setPrevPendingCount] = useState(pendingRequests);
  const [isPendingPulsing, setIsPendingPulsing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editGoalValue, setEditGoalValue] = useState(dailyGoal.toString());

  // Detect when pending requests increase and trigger pulse animation
  // Also detect when queue is cleared to show confetti
  // Track session stats for celebration message
  const sessionProcessedRef = useRef(0);
  const sessionStartTimeRef = useRef(Date.now());

  useEffect(() => {
    if (pendingRequests > prevPendingCount) {
      setIsPendingPulsing(true);
      // Play new request notification sound
      playNewRequestSound();
      // Reset pulse after animation completes
      const timeout = setTimeout(() => setIsPendingPulsing(false), 3000);
      return () => clearTimeout(timeout);
    } else if (prevPendingCount > 0 && pendingRequests === 0) {
      // Queue cleared! Celebrate!
      setShowConfetti(true);
      // Play queue cleared celebration sound
      playQueueClearedSound();
      const timeout = setTimeout(() => setShowConfetti(false), 100);
      
      // Calculate session stats
      const sessionDuration = Math.round((Date.now() - sessionStartTimeRef.current) / 60000);
      const processed = todayProcessed || sessionProcessedRef.current;
      
      // Show celebratory toast with stats
      toast({
        title: "🎉 Queue Cleared!",
        description: `Amazing work! You processed ${processed} request${processed !== 1 ? 's' : ''} today${sessionDuration > 0 ? ` in ${sessionDuration} min${sessionDuration !== 1 ? 's' : ''}` : ''}. ${processed >= dailyGoal ? '🏆 Daily goal achieved!' : `${dailyGoal - processed} more to hit your goal!`}`,
      });
      
      return () => clearTimeout(timeout);
    } else if (prevPendingCount > pendingRequests && pendingRequests > 0) {
      // Track processed requests in session
      sessionProcessedRef.current += prevPendingCount - pendingRequests;
    }
    setPrevPendingCount(pendingRequests);
  }, [pendingRequests, prevPendingCount, todayProcessed, dailyGoal, playQueueClearedSound, playNewRequestSound]);

  // Auto-refresh time-ago values every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRefresh(prev => prev + 1);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts for quick approve/reject
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        !oldestPendingRequest ||
        !onQuickProcess ||
        isProcessing
      ) {
        return;
      }

      if (e.key.toLowerCase() === 'a' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onQuickProcess(oldestPendingRequest.id, "approve");
      } else if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onQuickProcess(oldestPendingRequest.id, "reject");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [oldestPendingRequest, onQuickProcess, isProcessing]);
  const getBadgeCount = (badgeType: string | undefined) => {
    if (badgeType === "pending") return pendingRequests;
    if (badgeType === "unread") return unreadNotifications;
    return 0;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return <AlertTriangle className="h-3 w-3" />;
      case "high":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      case "high":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "medium":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return users
      .filter(
        (user) =>
          user.username?.toLowerCase().includes(query) ||
          user.phone?.toLowerCase().includes(query) ||
          user.user_id.toLowerCase().includes(query) ||
          user.display_user_id?.toLowerCase().includes(query)
      )
      .slice(0, 5);
  }, [users, searchQuery]);

  // Reset selected index when results change
  useMemo(() => {
    setSelectedIndex(-1);
  }, [filteredUsers.length]);

  const handleUserClick = (userId: string) => {
    if (onUserSelect) {
      onUserSelect(userId);
    }
    setSearchQuery("");
    setIsSearchFocused(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filteredUsers.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredUsers.length) {
          handleUserClick(filteredUsers[selectedIndex].user_id);
        }
        break;
      case "Escape":
        e.preventDefault();
        setSearchQuery("");
        setIsSearchFocused(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const showResults = isSearchFocused && searchQuery.trim() && filteredUsers.length > 0;
  const showNoResults = isSearchFocused && searchQuery.trim() && filteredUsers.length === 0;

  return (
    <>
      <Confetti isActive={showConfetti} duration={4000} intensity="medium" />
      <Sidebar collapsible="icon" className="border-r border-gray-800 bg-gray-900">
      <SidebarHeader className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-white font-bold">
              A
            </div>
            {!isCollapsed && (
              <span className="font-semibold text-white">Admin Panel</span>
            )}
          </div>
          {!isCollapsed && todayNewRequests > 0 && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 bg-teal-500/10 rounded-md border border-teal-500/30">
                    <Bell className="h-3 w-3 text-teal-400" />
                    <span className="text-xs font-bold text-teal-400">+{todayNewRequests}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-gray-900 border-gray-700">
                  <p className="text-xs text-white">{todayNewRequests} new request{todayNewRequests !== 1 ? 's' : ''} today</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-gray-900">
        {/* User Search */}
        {!isCollapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-500">Quick Search</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="relative px-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    onKeyDown={handleKeyDown}
                    className="pl-8 pr-8 h-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500/20"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Autocomplete Results */}
                {showResults && (
                  <div className="absolute left-2 right-2 top-full mt-1 z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                    <ScrollArea className="max-h-64">
                      {filteredUsers.map((user, index) => (
                        <button
                          key={user.user_id}
                          onClick={() => handleUserClick(user.user_id)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`w-full px-3 py-2.5 flex items-center gap-3 transition-colors text-left border-b border-gray-700 last:border-0 ${
                            index === selectedIndex 
                              ? "bg-teal-500/20 border-l-2 border-l-teal-500" 
                              : "hover:bg-gray-700"
                          }`}
                        >
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold ${
                            index === selectedIndex 
                              ? "bg-teal-500" 
                              : "bg-gradient-to-br from-teal-500 to-emerald-600"
                          }`}>
                            {user.username?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              index === selectedIndex ? "text-teal-300" : "text-white"
                            }`}>
                              {user.username || "Anonymous"}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {user.display_user_id || user.phone || user.user_id.slice(0, 8)}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
                            VIP {user.vip_level}
                          </Badge>
                        </button>
                      ))}
                    </ScrollArea>
                  </div>
                )}
                
                {showNoResults && (
                  <div className="absolute left-2 right-2 top-full mt-1 z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 text-center">
                    <p className="text-sm text-gray-400">No users found</p>
                    <p className="text-xs text-gray-500 mt-1">Try a different search term</p>
                  </div>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Collapsed Search Icon */}
        {isCollapsed && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Search Users"
                    onClick={() => {
                      onTabChange("users");
                    }}
                    className="text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <Search className="h-4 w-4" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const badgeCount = getBadgeCount(item.showBadge);
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={activeTab === item.id}
                      tooltip={item.title}
                      className={`
                        text-gray-300 hover:text-white hover:bg-gray-800
                        ${activeTab === item.id ? "bg-teal-500/20 text-teal-400 border-l-2 border-teal-500" : ""}
                      `}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                      {badgeCount > 0 && (
                        <Badge
                          className={`ml-auto transition-all ${
                            item.showBadge === "pending"
                              ? `bg-rose-500 text-white ${isPendingPulsing ? "animate-[ping_0.75s_ease-in-out_3] ring-2 ring-rose-400 ring-offset-1 ring-offset-gray-900" : "animate-pulse"}`
                              : "bg-blue-500 text-white animate-pulse"
                          }`}
                        >
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Activity Feed */}
        {!isCollapsed && recentTransactions.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-500">Recent Activity</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-2 space-y-1">
                {recentTransactions.slice(0, 5).map((tx) => (
                  <button
                    key={tx.id}
                    onClick={() => onTabChange("requests")}
                    className="w-full flex items-center gap-2 p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/60 transition-colors text-left"
                  >
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      tx.type === "deposit" 
                        ? "bg-emerald-500/20 text-emerald-400" 
                        : "bg-rose-500/20 text-rose-400"
                    }`}>
                      {tx.type === "deposit" ? (
                        <ArrowDownCircle className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUpCircle className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-medium text-white truncate">
                          {tx.username || "Anonymous"}
                        </span>
                        {tx.display_user_id && (
                          <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded border border-cyan-500/20">
                            {tx.display_user_id}
                          </span>
                        )}
                        <span className={`text-xs font-bold ${
                          tx.type === "deposit" ? "text-emerald-400" : "text-rose-400"
                        }`}>
                          {tx.type === "deposit" ? "+" : "-"}৳{tx.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-gray-500">
                          {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-[9px] px-1 py-0 h-4 ${
                            tx.status === "pending" 
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
                              : tx.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Collapsible Unread Alerts Panel */}
        {!isCollapsed && unreadAlerts.length > 0 && (
          <SidebarGroup>
            <div className="flex items-center justify-between px-3 py-1.5">
              <button
                onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}
                className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-400 transition-colors"
              >
                <Bell className="h-3 w-3" />
                <span>Unread Alerts</span>
                <Badge className="bg-rose-500 text-white text-[10px] px-1.5 py-0 h-4 animate-pulse">
                  {unreadAlerts.length}
                </Badge>
                {isAlertsExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              {onMarkAllAlertsRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAllAlertsRead();
                  }}
                  className="text-[10px] text-teal-400 hover:text-teal-300 transition-colors font-medium"
                  title="Mark all as read"
                >
                  Mark all read
                </button>
              )}
            </div>
            
            {isAlertsExpanded && (
              <SidebarGroupContent>
                <ScrollArea className="max-h-48">
                  <div className="px-2 space-y-1">
                    {unreadAlerts.slice(0, 5).map((alert) => (
                      <button
                        key={alert.id}
                        onClick={() => onTabChange("notifications")}
                        className={`w-full flex items-start gap-2 p-2 rounded-lg border transition-colors text-left ${getPriorityStyles(alert.priority)} hover:opacity-80`}
                      >
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full mt-0.5 ${
                          alert.priority === "critical" ? "bg-rose-500/30" :
                          alert.priority === "high" ? "bg-amber-500/30" :
                          "bg-blue-500/30"
                        }`}>
                          {getPriorityIcon(alert.priority)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {alert.title}
                          </p>
                          {alert.metadata?.display_user_id && (
                            <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded border border-cyan-500/20">
                              {alert.metadata.display_user_id}
                            </span>
                          )}
                          {alert.message && (
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">
                              {alert.message}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={`text-[9px] px-1 py-0 h-3.5 capitalize ${getPriorityStyles(alert.priority)}`}
                            >
                              {alert.priority}
                            </Badge>
                            <span className="text-[9px] text-gray-500">
                              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                    {unreadAlerts.length > 5 && (
                      <button
                        onClick={() => onTabChange("notifications")}
                        className="w-full text-center py-1.5 text-[10px] text-teal-400 hover:text-teal-300 transition-colors"
                      >
                        View all {unreadAlerts.length} alerts →
                      </button>
                    )}
                  </div>
                </ScrollArea>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-800 bg-gray-900">
        {/* Quick Stats Widget */}
        {!isCollapsed && (
          <div className="px-3 py-3 mb-2 space-y-2">
            {/* Users & Pending Row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800/50 rounded-lg p-2.5 border border-gray-700/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="h-3 w-3 text-teal-400" />
                  <span className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">Users</span>
                </div>
                <p className="text-lg font-bold text-white">{users.length}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2.5 border border-gray-700/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3 w-3 text-amber-400" />
                  <span className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">Pending</span>
                </div>
                <p className={`text-lg font-bold ${pendingRequests > 0 ? "text-amber-400" : "text-white"}`}>
                  {pendingRequests}
                </p>
              </div>
            </div>

            {/* Daily Goal Progress Ring */}
            <div className="bg-gray-800/50 rounded-lg p-2.5 border border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-gray-700"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.min((todayProcessed / dailyGoal) * 94.2, 94.2)} 94.2`}
                      className={`transition-all duration-500 ${
                        todayProcessed >= dailyGoal 
                          ? "text-emerald-400" 
                          : todayProcessed >= dailyGoal * 0.7 
                          ? "text-teal-400" 
                          : todayProcessed >= dailyGoal * 0.4 
                          ? "text-amber-400" 
                          : "text-rose-400"
                      }`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Target className={`h-4 w-4 ${
                      todayProcessed >= dailyGoal ? "text-emerald-400" : "text-gray-400"
                    }`} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">Daily Goal</span>
                      {todayProcessed >= dailyGoal && (
                        <span className="text-[8px] px-1 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-medium">
                          ✓ Complete
                        </span>
                      )}
                    </div>
                    {onUpdateDailyGoal && (
                      <button
                        onClick={() => {
                          setIsEditingGoal(true);
                          setEditGoalValue(dailyGoal.toString());
                        }}
                        className="text-[9px] text-teal-400 hover:text-teal-300 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {isEditingGoal && onUpdateDailyGoal ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={editGoalValue}
                        onChange={(e) => setEditGoalValue(e.target.value)}
                        className="w-12 h-6 text-xs bg-gray-700 border border-gray-600 rounded px-1 text-white text-center"
                        autoFocus
                      />
                      <button
                        onClick={async () => {
                          const newGoal = parseInt(editGoalValue);
                          if (!isNaN(newGoal) && newGoal >= 1 && newGoal <= 200) {
                            await onUpdateDailyGoal(newGoal);
                            setIsEditingGoal(false);
                          }
                        }}
                        disabled={isUpdatingGoal}
                        className="text-[9px] px-1.5 py-0.5 bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 rounded disabled:opacity-50"
                      >
                        {isUpdatingGoal ? "..." : "Save"}
                      </button>
                      <button
                        onClick={() => setIsEditingGoal(false)}
                        className="text-[9px] px-1.5 py-0.5 bg-gray-700 text-gray-400 hover:bg-gray-600 rounded"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-white">
                        {todayProcessed} <span className="text-gray-500 font-normal">/ {dailyGoal}</span>
                      </p>
                      <p className="text-[9px] text-gray-500">
                        {Math.round((todayProcessed / dailyGoal) * 100)}% processed today
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Goal Streak Badge */}
            {goalStreak && (
              <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 rounded-lg p-2.5 border border-amber-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Flame className={`h-3.5 w-3.5 ${goalStreak.current_streak > 0 ? 'text-orange-400 animate-pulse' : 'text-gray-500'}`} />
                    <span className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Goal Streak</span>
                  </div>
                  {goalStreak.current_streak >= 7 && (
                    <span className="text-[8px] px-1.5 py-0.5 bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 rounded-full font-bold flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5" /> On Fire!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {/* Current Streak */}
                  <div className="flex-1 text-center">
                    <div className={`text-2xl font-black ${
                      goalStreak.current_streak >= 7 ? 'text-orange-400' :
                      goalStreak.current_streak >= 3 ? 'text-amber-400' :
                      goalStreak.current_streak > 0 ? 'text-yellow-400' : 'text-gray-500'
                    }`}>
                      {goalStreak.current_streak}
                    </div>
                    <div className="text-[9px] text-gray-500">Current</div>
                  </div>
                  {/* Divider */}
                  <div className="w-px h-8 bg-gray-700" />
                  {/* Best Streak */}
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-black text-teal-400 flex items-center justify-center gap-1">
                      <Trophy className="h-4 w-4" />
                      {goalStreak.best_streak}
                    </div>
                    <div className="text-[9px] text-gray-500">Best</div>
                  </div>
                  {/* Divider */}
                  <div className="w-px h-8 bg-gray-700" />
                  {/* Total Goals */}
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-black text-emerald-400 flex items-center justify-center gap-1">
                      <Award className="h-4 w-4" />
                      {goalStreak.total_goals_met}
                    </div>
                    <div className="text-[9px] text-gray-500">Total</div>
                  </div>
                </div>
                {/* Streak Milestones */}
                {goalStreak.current_streak > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-700/50">
                    <div className="flex items-center justify-between">
                      {[3, 7, 14, 30].map((milestone) => (
                        <div 
                          key={milestone}
                          className={`flex flex-col items-center ${
                            goalStreak.current_streak >= milestone 
                              ? 'text-amber-400' 
                              : 'text-gray-600'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border ${
                            goalStreak.current_streak >= milestone
                              ? 'border-amber-400 bg-amber-500/20'
                              : 'border-gray-600 bg-gray-800'
                          }`}>
                            {milestone}
                          </div>
                          <span className="text-[7px] mt-0.5">
                            {milestone === 3 ? '🔥' : milestone === 7 ? '⭐' : milestone === 14 ? '💎' : '👑'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Today's Deposits vs Withdrawals */}
            <div className="bg-gray-800/50 rounded-lg p-2.5 border border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">Today</span>
                <span className={`text-xs font-bold ${(todayDeposits - todayWithdrawals) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {(todayDeposits - todayWithdrawals) >= 0 ? "+" : ""}৳{(todayDeposits - todayWithdrawals).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <ArrowDownCircle className="h-3 w-3 text-emerald-400" />
                      <span className="text-[9px] text-gray-400">In</span>
                    </div>
                    <span className="text-xs font-medium text-emerald-400">৳{todayDeposits.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${todayDeposits + todayWithdrawals > 0 ? (todayDeposits / (todayDeposits + todayWithdrawals)) * 100 : 50}%` }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <ArrowUpCircle className="h-3 w-3 text-rose-400" />
                      <span className="text-[9px] text-gray-400">Out</span>
                    </div>
                    <span className="text-xs font-medium text-rose-400">৳{todayWithdrawals.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 rounded-full transition-all"
                      style={{ width: `${todayDeposits + todayWithdrawals > 0 ? (todayWithdrawals / (todayDeposits + todayWithdrawals)) * 100 : 50}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Weekly Volume Sparkline */}
            {weeklyVolume.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-2.5 border border-gray-700/50">
                {(() => {
                  const currentWeekTotal = weeklyVolume.reduce((sum, d) => sum + d.deposits + d.withdrawals, 0);
                  const trendPercent = previousWeekVolume > 0 
                    ? ((currentWeekTotal - previousWeekVolume) / previousWeekVolume) * 100 
                    : 0;
                  const isUp = trendPercent > 0;
                  const isDown = trendPercent < 0;
                  
                  return (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">7-Day Volume</span>
                          {previousWeekVolume > 0 && (
                            <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium ${
                              isUp ? 'bg-emerald-500/20 text-emerald-400' : 
                              isDown ? 'bg-rose-500/20 text-rose-400' : 
                              'bg-gray-600/20 text-gray-400'
                            }`}>
                              {isUp ? (
                                <TrendingUp className="h-2.5 w-2.5" />
                              ) : isDown ? (
                                <TrendingUp className="h-2.5 w-2.5 rotate-180" />
                              ) : null}
                              <span>{Math.abs(trendPercent).toFixed(0)}%</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          ৳{currentWeekTotal.toLocaleString()}
                        </span>
                      </div>
                <TooltipProvider delayDuration={0}>
                  <div className="flex items-end gap-0.5 h-10">
                    {weeklyVolume.map((day, i) => {
                      const total = day.deposits + day.withdrawals;
                      const maxTotal = Math.max(...weeklyVolume.map(d => d.deposits + d.withdrawals), 1);
                      const heightPercent = (total / maxTotal) * 100;
                      const depositPercent = total > 0 ? (day.deposits / total) * 100 : 50;
                      
                      return (
                        <Tooltip key={i}>
                          <TooltipTrigger asChild>
                            <div className="flex-1 flex flex-col justify-end group relative cursor-pointer">
                              <div 
                                className="w-full rounded-sm overflow-hidden transition-all group-hover:opacity-80 group-hover:ring-1 group-hover:ring-white/30"
                                style={{ height: `${Math.max(heightPercent, 8)}%` }}
                              >
                                <div 
                                  className="w-full bg-emerald-500"
                                  style={{ height: `${depositPercent}%` }}
                                />
                                <div 
                                  className="w-full bg-rose-500"
                                  style={{ height: `${100 - depositPercent}%` }}
                                />
                              </div>
                              <span className="text-[8px] text-gray-500 text-center mt-0.5 leading-none">
                                {day.day.slice(0, 1)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="top" 
                            className="bg-gray-900 border-gray-700 p-2 shadow-xl"
                          >
                            <div className="text-center">
                              <p className="text-[10px] font-medium text-white mb-1">{day.day}</p>
                              <div className="space-y-0.5">
                                <div className="flex items-center justify-between gap-3 text-[9px]">
                                  <span className="text-emerald-400 flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-sm bg-emerald-500" />
                                    In:
                                  </span>
                                  <span className="text-emerald-300 font-medium">৳{day.deposits.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 text-[9px]">
                                  <span className="text-rose-400 flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-sm bg-rose-500" />
                                    Out:
                                  </span>
                                  <span className="text-rose-300 font-medium">৳{day.withdrawals.toLocaleString()}</span>
                                </div>
                                <div className="border-t border-gray-700 mt-1 pt-1">
                                  <div className="flex items-center justify-between gap-3 text-[9px]">
                                    <span className="text-gray-400">Total:</span>
                                    <span className="text-white font-bold">৳{total.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>
                <div className="flex items-center justify-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm bg-emerald-500" />
                    <span className="text-[8px] text-gray-500">Deposits</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm bg-rose-500" />
                    <span className="text-[8px] text-gray-500">Withdrawals</span>
                  </div>
                </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
        
        {/* Quick Action - Oldest Pending Request */}
        {!isCollapsed && oldestPendingRequest && onQuickProcess && (
          <div className="px-3 pb-2">
            <div className={`bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg p-2.5 border border-amber-500/30 transition-all ${isPendingPulsing ? "animate-attention-shake ring-2 ring-amber-400/50" : ""}`}>
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] uppercase tracking-wide text-amber-400 font-medium">Quick Action</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  oldestPendingRequest.type === "deposit" 
                    ? "bg-emerald-500/20 text-emerald-400" 
                    : "bg-rose-500/20 text-rose-400"
                }`}>
                  {oldestPendingRequest.type === "deposit" ? (
                    <ArrowDownCircle className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowUpCircle className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">
                    {oldestPendingRequest.username || "Anonymous"}
                  </p>
                  {oldestPendingRequest.display_user_id && (
                    <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded border border-cyan-500/20">
                      {oldestPendingRequest.display_user_id}
                    </span>
                  )}
                  <p className={`text-xs font-bold ${
                    oldestPendingRequest.type === "deposit" ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {oldestPendingRequest.type === "deposit" ? "+" : "-"}৳{oldestPendingRequest.amount.toLocaleString()}
                  </p>
                </div>
                <span className="text-[9px] text-gray-500">
                  {formatDistanceToNow(new Date(oldestPendingRequest.created_at), { addSuffix: true })}
                </span>
              </div>
              <div className="flex gap-2">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onQuickProcess(oldestPendingRequest.id, "approve")}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="h-3 w-3" />
                        Approve
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-emerald-900 border-emerald-700 text-emerald-100">
                      <p className="text-xs font-medium">Click to approve this {oldestPendingRequest.type}</p>
                      <p className="text-[10px] text-emerald-300">৳{oldestPendingRequest.amount.toLocaleString()} will be credited</p>
                      <p className="text-[9px] text-emerald-400/70 mt-1 flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-emerald-800 rounded text-[8px]">A</kbd>
                        <span>keyboard shortcut</span>
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onQuickProcess(oldestPendingRequest.id, "reject")}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle className="h-3 w-3" />
                        Reject
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-rose-900 border-rose-700 text-rose-100">
                      <p className="text-xs font-medium">Click to reject this {oldestPendingRequest.type}</p>
                      <p className="text-[10px] text-rose-300">Request will be declined</p>
                      <p className="text-[9px] text-rose-400/70 mt-1 flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-rose-800 rounded text-[8px]">R</kbd>
                        <span>keyboard shortcut</span>
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        )}
        
        {/* Collapsed Stats */}
        {isCollapsed && (
          <div className="px-2 py-2 mb-2 space-y-1">
            <div 
              className="flex items-center justify-center h-8 w-8 mx-auto bg-gray-800/50 rounded-lg border border-gray-700/50"
              title={`${users.length} Users`}
            >
              <span className="text-xs font-bold text-teal-400">{users.length > 99 ? "99+" : users.length}</span>
            </div>
            <div 
              className="flex items-center justify-center h-8 w-8 mx-auto bg-gray-800/50 rounded-lg border border-gray-700/50"
              title={`${pendingRequests} Pending`}
            >
              <span className={`text-xs font-bold ${pendingRequests > 0 ? "text-amber-400" : "text-gray-400"}`}>
                {pendingRequests > 99 ? "99+" : pendingRequests}
              </span>
            </div>
          </div>
        )}

        <SidebarMenu>
          {onSoundToggle && (
            <SidebarMenuItem>
              <div className="flex flex-col gap-2 px-2 py-1.5">
                <SidebarMenuButton
                  onClick={onSoundToggle}
                  tooltip={soundEnabled ? "Mute sounds" : "Unmute sounds"}
                  className={`${soundEnabled ? "text-teal-400 hover:text-teal-300" : "text-gray-500 hover:text-gray-400"} hover:bg-gray-800`}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  {!isCollapsed && <span>{soundEnabled ? "Sound On" : "Sound Off"}</span>}
                </SidebarMenuButton>
                
                {/* Volume Slider - only show when expanded and sound enabled */}
                {!isCollapsed && soundEnabled && onVolumeChange && (
                  <div className="flex items-center gap-2 px-2">
                    <VolumeX className="h-3 w-3 text-gray-500 flex-shrink-0" />
                    <Slider
                      value={[soundVolume * 100]}
                      onValueChange={(value) => onVolumeChange(value[0] / 100)}
                      max={100}
                      min={0}
                      step={5}
                      className="flex-1"
                    />
                    <Volume2 className="h-3 w-3 text-gray-500 flex-shrink-0" />
                    <span className="text-xs text-gray-400 w-8 text-right">{Math.round(soundVolume * 100)}%</span>
                  </div>
                )}

                {/* Sound Preferences Toggle */}
                {!isCollapsed && soundEnabled && onSoundPreferencesChange && (
                  <div className="mt-1">
                    <button
                      onClick={() => setIsSoundPrefsExpanded(!isSoundPrefsExpanded)}
                      className="flex items-center justify-between w-full text-xs text-gray-400 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-800/50 transition-colors"
                    >
                      <span>Sound Preferences</span>
                      {isSoundPrefsExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                    
                    {isSoundPrefsExpanded && (
                      <div className="mt-2 space-y-1.5 px-2">
                        {[
                          { key: 'approval' as const, label: 'Approval', icon: Check, color: 'text-emerald-400', testFn: testApprovalSound },
                          { key: 'rejection' as const, label: 'Rejection', icon: XCircle, color: 'text-rose-400', testFn: testRejectionSound },
                          { key: 'queueCleared' as const, label: 'Queue Cleared', icon: Zap, color: 'text-amber-400', testFn: testQueueClearedSound },
                          { key: 'newRequest' as const, label: 'New Request', icon: Bell, color: 'text-blue-400', testFn: testNewRequestSound },
                        ].map(({ key, label, icon: Icon, color, testFn }) => (
                          <div
                            key={key}
                            className="flex items-center gap-2 group"
                          >
                            <button
                              onClick={() => {
                                onSoundPreferencesChange({
                                  ...soundPreferences,
                                  [key]: !soundPreferences[key],
                                });
                              }}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                                soundPreferences[key]
                                  ? 'bg-teal-500 border-teal-500'
                                  : 'border-gray-600 hover:border-gray-500'
                              }`}
                            >
                              {soundPreferences[key] && <Check className="h-3 w-3 text-white" />}
                            </button>
                            <Icon className={`h-3 w-3 flex-shrink-0 ${soundPreferences[key] ? color : 'text-gray-600'}`} />
                            <span className={`text-xs flex-1 ${soundPreferences[key] ? 'text-gray-300' : 'text-gray-500'} group-hover:text-gray-200`}>
                              {label}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                testFn();
                              }}
                              className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100"
                              title={`Test ${label} sound`}
                            >
                              <Play className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleTheme}
              tooltip={isDark ? "Light mode" : "Dark mode"}
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {!isCollapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onNavigateToSettings}
              tooltip="Settings"
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <Settings className="h-4 w-4" />
              {!isCollapsed && <span>Settings</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <Separator className="my-2 bg-gray-800" />
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onLogout}
              tooltip="Logout"
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
    </>
  );
}
