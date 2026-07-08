import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LogOut, Users, Wallet, TrendingUp, Gamepad2, 
  LayoutDashboard, CheckCircle, XCircle, Clock,
  Search, ChevronDown, RefreshCw, Eye, Ban,
  DollarSign, UserPlus, Activity, Award, Shield,
  Volume2, VolumeX, Bell, BellOff, Play, History, Download, Calendar,
  CheckCheck, Circle, Mail, Send, Settings, Zap, Copy, Pencil,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, X, Check, Keyboard, Command,
  Sun, Moon
} from "lucide-react";
import { useAdminSounds, AdminSoundPreferences, DEFAULT_SOUND_PREFERENCES } from "@/hooks/useAdminSounds";
import { format, subDays, startOfDay, endOfDay, isWithinInterval, startOfWeek, startOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isAdminAuthenticated, adminLogout } from "@/lib/bannerConfig";
import { exportNotificationHistory, NotificationExportItem, exportUserList, UserListExportItem, exportTransactionRequests, TransactionRequestExportItem } from "@/lib/csvExport";
import HistoryPagination from "@/components/game/HistoryPagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { UserActivityChart } from "@/components/admin/UserActivityChart";
import { TransactionStatsChart } from "@/components/admin/TransactionStatsChart";
import { UserRegistrationChart } from "@/components/admin/UserRegistrationChart";
import { GameRevenueChart } from "@/components/admin/GameRevenueChart";
import { VIPDistributionChart } from "@/components/admin/VIPDistributionChart";
import { UserRetentionChart } from "@/components/admin/UserRetentionChart";
import { AdminAgentManagement } from "@/components/admin/AdminAgentManagement";
import { useTheme } from "@/hooks/useTheme";
import { SidebarProvider, SidebarTrigger, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

// Payment logos
import bkashLogo from "@/assets/payment/bkash-logo.png";
import nagadLogo from "@/assets/payment/nagad-logo.png";
import usdtLogo from "@/assets/payment/usdt-logo.png";

// Payment method logo helper
const getPaymentLogo = (method: string | null): string | null => {
  if (!method) return null;
  const lowerMethod = method.toLowerCase();
  if (lowerMethod.includes("bkash")) return bkashLogo;
  if (lowerMethod.includes("nagad")) return nagadLogo;
  if (lowerMethod.includes("usdt")) return usdtLogo;
  return null;
};

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  phone: string | null;
  referral_code: string | null;
  referred_by: string | null;
  display_user_id: string | null;
  display_referral_id: string | null;
  vip_level: number;
  vip_exp: number;
  is_admin?: boolean;
  created_at: string;
  wallet?: {
    balance: number;
    total_deposit: number;
    total_withdraw: number;
    total_bet: number;
    total_win: number;
    updated_at?: string;
  } | null;
  referral_count?: number;
  last_active?: string | null;
}

interface TransactionRequest {
  id: string;
  user_id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  status: "pending" | "approved" | "rejected";
  payment_method: string | null;
  payment_details: unknown;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  profile?: {
    username: string | null;
    phone: string | null;
    display_user_id: string | null;
  };
}

interface FilterPreset {
  id: string;
  name: string;
  filters: {
    searchQuery: string;
    vipRange: { min: string; max: string };
    joinDateRange: { from: string | null; to: string | null };
    balanceRange: { min: string; max: string };
    adminFilter: "all" | "admin" | "regular";
    profitFilter: "all" | "profit" | "loss" | "breakeven";
    wageredRange: { min: string; max: string };
    referralRange: { min: string; max: string };
    winRateRange?: { min: string; max: string };
    totalWinsRange?: { min: string; max: string };
  };
}

interface NotificationHistory {
  id: string;
  notification_type: string;
  title: string;
  message: string | null;
  metadata: unknown;
  recipients: string[];
  created_at: string;
  is_read: boolean;
  read_at: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  escalation_count: number;
  last_escalated_at: string | null;
  acknowledged_at: string | null;
}

interface DashboardStats {
  totalUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingRequests: number;
  todayNewUsers: number;
  todayBets: number;
  totalReferrals: number;
  activeUsers7d: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<TransactionRequest[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [requestFilter, setRequestFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [requestTypeFilter, setRequestTypeFilter] = useState<"all" | "deposit" | "withdrawal">("all");
  const [requestPaymentFilter, setRequestPaymentFilter] = useState<"all" | "nagad" | "bkash" | "rocket" | "upay" | "usdt">("all");
  const [requestDateRange, setRequestDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [requestAmountRange, setRequestAmountRange] = useState<{ min: string; max: string }>({ min: "", max: "" });
  const [requestUserSearch, setRequestUserSearch] = useState("");
  const [requestsPage, setRequestsPage] = useState(1);
  const requestsPerPage = 10;
  const [requestSortColumn, setRequestSortColumn] = useState<"amount" | "date" | "status">("date");
  const [requestSortDirection, setRequestSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedRequest, setSelectedRequest] = useState<TransactionRequest | null>(null);
  const [selectedRequestIds, setSelectedRequestIds] = useState<Set<string>>(new Set());
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('admin_soundEnabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [soundVolume, setSoundVolume] = useState(() => {
    const saved = localStorage.getItem('admin_soundVolume');
    return saved !== null ? parseFloat(saved) : 0.7;
  });
  const [soundPreferences, setSoundPreferences] = useState<AdminSoundPreferences>(() => {
    const saved = localStorage.getItem('admin_soundPreferences');
    return saved !== null ? JSON.parse(saved) : DEFAULT_SOUND_PREFERENCES;
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Admin sounds hook
  const { playApprovalSound, playRejectionSound, playQueueClearedSound, playNewRequestSound } = useAdminSounds(soundEnabled, soundVolume, soundPreferences);
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([]);
  const [dailyGoal, setDailyGoal] = useState(20);
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false);
  const [goalStreak, setGoalStreak] = useState<{
    current_streak: number;
    best_streak: number;
    total_goals_met: number;
    last_goal_met_date: string | null;
  } | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserProfile | null>(null);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [usersSortColumn, setUsersSortColumn] = useState<"username" | "balance" | "deposit" | "wagered" | "totalWins" | "netProfit" | "winRate" | "vip" | "referrals" | "joined" | "lastActive">("joined");
  const [usersSortDirection, setUsersSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkActionConfirm, setBulkActionConfirm] = useState<{ open: boolean; action: "grant" | "revoke" | null }>({ open: false, action: null });
  const [batchRequestConfirm, setBatchRequestConfirm] = useState<{ open: boolean; action: "approve" | "reject" | null }>({ open: false, action: null });
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; isProcessing: boolean }>({ current: 0, total: 0, isProcessing: false });
  const [lastBatchAction, setLastBatchAction] = useState<{
    action: "approve" | "reject";
    requests: TransactionRequest[];
    originalStatuses: { id: string; status: string; admin_notes: string | null }[];
    walletChanges: { user_id: string; balanceDelta: number; depositDelta: number; withdrawDelta: number }[];
    timestamp: number;
  } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(0);
  const [vipRange, setVipRange] = useState<{ min: string; max: string }>(() => {
    const saved = localStorage.getItem('admin_vipRange');
    return saved ? JSON.parse(saved) : { min: "", max: "" };
  });
  const [joinDateRange, setJoinDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>(() => {
    const saved = localStorage.getItem('admin_joinDateRange');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { from: parsed.from ? new Date(parsed.from) : undefined, to: parsed.to ? new Date(parsed.to) : undefined };
    }
    return { from: undefined, to: undefined };
  });
  const [balanceRange, setBalanceRange] = useState<{ min: string; max: string }>(() => {
    const saved = localStorage.getItem('admin_balanceRange');
    return saved ? JSON.parse(saved) : { min: "", max: "" };
  });
  const [adminFilter, setAdminFilter] = useState<"all" | "admin" | "regular">(() => {
    const saved = localStorage.getItem('admin_adminFilter');
    return (saved as "all" | "admin" | "regular") || "all";
  });
  const [profitFilter, setProfitFilter] = useState<"all" | "profit" | "loss" | "breakeven">(() => {
    const saved = localStorage.getItem('admin_profitFilter');
    return (saved as "all" | "profit" | "loss" | "breakeven") || "all";
  });
  const [wageredRange, setWageredRange] = useState<{ min: string; max: string }>(() => {
    const saved = localStorage.getItem('admin_wageredRange');
    return saved ? JSON.parse(saved) : { min: "", max: "" };
  });
  const [referralRange, setReferralRange] = useState<{ min: string; max: string }>(() => {
    const saved = localStorage.getItem('admin_referralRange');
    return saved ? JSON.parse(saved) : { min: "", max: "" };
  });
  const [winRateRange, setWinRateRange] = useState<{ min: string; max: string }>(() => {
    const saved = localStorage.getItem('admin_winRateRange');
    return saved ? JSON.parse(saved) : { min: "", max: "" };
  });
  const [totalWinsRange, setTotalWinsRange] = useState<{ min: string; max: string }>(() => {
    const saved = localStorage.getItem('admin_totalWinsRange');
    return saved ? JSON.parse(saved) : { min: "", max: "" };
  });
  const [lastActiveRange, setLastActiveRange] = useState<{ from: Date | undefined; to: Date | undefined }>(() => {
    const saved = localStorage.getItem('admin_lastActiveRange');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { from: parsed.from ? new Date(parsed.from) : undefined, to: parsed.to ? new Date(parsed.to) : undefined };
    }
    return { from: undefined, to: undefined };
  });
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>(() => {
    const saved = localStorage.getItem('admin_filterPresets');
    return saved ? JSON.parse(saved) : [];
  });
  const [newPresetName, setNewPresetName] = useState("");
  const [showPresetSave, setShowPresetSave] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastRequestCountRef = useRef<number>(0);

  // Persist filters to localStorage
  useEffect(() => {
    localStorage.setItem('admin_vipRange', JSON.stringify(vipRange));
  }, [vipRange]);
  
  useEffect(() => {
    localStorage.setItem('admin_joinDateRange', JSON.stringify({
      from: joinDateRange.from?.toISOString() || null,
      to: joinDateRange.to?.toISOString() || null
    }));
  }, [joinDateRange]);
  
  useEffect(() => {
    localStorage.setItem('admin_balanceRange', JSON.stringify(balanceRange));
  }, [balanceRange]);
  
  useEffect(() => {
    localStorage.setItem('admin_adminFilter', adminFilter);
  }, [adminFilter]);
  
  useEffect(() => {
    localStorage.setItem('admin_profitFilter', profitFilter);
  }, [profitFilter]);
  
  useEffect(() => {
    localStorage.setItem('admin_wageredRange', JSON.stringify(wageredRange));
  }, [wageredRange]);
  
  useEffect(() => {
    localStorage.setItem('admin_referralRange', JSON.stringify(referralRange));
  }, [referralRange]);
  
  useEffect(() => {
    localStorage.setItem('admin_filterPresets', JSON.stringify(filterPresets));
  }, [filterPresets]);

  useEffect(() => {
    localStorage.setItem('admin_lastActiveRange', JSON.stringify({
      from: lastActiveRange.from?.toISOString() || null,
      to: lastActiveRange.to?.toISOString() || null
    }));
  }, [lastActiveRange]);

  // Reset requests page when filters change
  useEffect(() => {
    setRequestsPage(1);
  }, [requestFilter, requestTypeFilter, requestPaymentFilter, requestDateRange, requestAmountRange, requestUserSearch]);

  // Filter preset functions
  const saveCurrentAsPreset = () => {
    if (!newPresetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }
    const newPreset: FilterPreset = {
      id: crypto.randomUUID(),
      name: newPresetName.trim(),
      filters: {
        searchQuery,
        vipRange,
        joinDateRange: {
          from: joinDateRange.from?.toISOString() || null,
          to: joinDateRange.to?.toISOString() || null,
        },
        balanceRange,
        adminFilter,
        profitFilter,
        wageredRange,
        referralRange,
        winRateRange,
        totalWinsRange,
      },
    };
    setFilterPresets(prev => [...prev, newPreset]);
    setNewPresetName("");
    setShowPresetSave(false);
    toast.success(`Preset "${newPreset.name}" saved`);
  };

  const applyPreset = (preset: FilterPreset) => {
    setSearchQuery(preset.filters.searchQuery);
    setVipRange(preset.filters.vipRange);
    setJoinDateRange({
      from: preset.filters.joinDateRange.from ? new Date(preset.filters.joinDateRange.from) : undefined,
      to: preset.filters.joinDateRange.to ? new Date(preset.filters.joinDateRange.to) : undefined,
    });
    setBalanceRange(preset.filters.balanceRange);
    setAdminFilter(preset.filters.adminFilter);
    setProfitFilter(preset.filters.profitFilter);
    setWageredRange(preset.filters.wageredRange);
    setReferralRange(preset.filters.referralRange);
    setWinRateRange(preset.filters.winRateRange || { min: "", max: "" });
    setTotalWinsRange(preset.filters.totalWinsRange || { min: "", max: "" });
    toast.success(`Applied preset "${preset.name}"`);
  };

  const deletePreset = (presetId: string) => {
    setFilterPresets(prev => prev.filter(p => p.id !== presetId));
    toast.success("Preset deleted");
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setVipRange({ min: "", max: "" });
    setJoinDateRange({ from: undefined, to: undefined });
    setBalanceRange({ min: "", max: "" });
    setAdminFilter("all");
    setProfitFilter("all");
    setWageredRange({ min: "", max: "" });
    setReferralRange({ min: "", max: "" });
    setWinRateRange({ min: "", max: "" });
    setTotalWinsRange({ min: "", max: "" });
    setLastActiveRange({ from: undefined, to: undefined });
    toast.success("All filters cleared");
  };

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (vipRange.min || vipRange.max) count++;
    if (joinDateRange.from || joinDateRange.to) count++;
    if (lastActiveRange.from || lastActiveRange.to) count++;
    if (balanceRange.min || balanceRange.max) count++;
    if (adminFilter !== "all") count++;
    if (profitFilter !== "all") count++;
    if (wageredRange.min || wageredRange.max) count++;
    if (referralRange.min || referralRange.max) count++;
    if (winRateRange.min || winRateRange.max) count++;
    if (totalWinsRange.min || totalWinsRange.max) count++;
    return count;
  }, [searchQuery, vipRange, joinDateRange, lastActiveRange, balanceRange, adminFilter, profitFilter, wageredRange, referralRange, winRateRange, totalWinsRange]);

  const exportPresets = () => {
    if (filterPresets.length === 0) {
      toast.error("No presets to export");
      return;
    }
    const dataStr = JSON.stringify(filterPresets, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-filter-presets-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filterPresets.length} presets`);
  };

  const importPresets = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as FilterPreset[];
        if (!Array.isArray(imported)) {
          throw new Error("Invalid format");
        }
        // Validate structure and assign new IDs to avoid conflicts
        const validPresets = imported.filter(p => 
          p.name && typeof p.name === 'string' && p.filters
        ).map(p => ({
          ...p,
          id: crypto.randomUUID(), // Generate new IDs
        }));
        
        if (validPresets.length === 0) {
          throw new Error("No valid presets found");
        }
        
        setFilterPresets(prev => [...prev, ...validPresets]);
        toast.success(`Imported ${validPresets.length} presets`);
      } catch (err) {
        toast.error("Failed to import presets. Invalid file format.");
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const duplicatePreset = (preset: FilterPreset) => {
    const newPreset: FilterPreset = {
      id: crypto.randomUUID(),
      name: `${preset.name} (Copy)`,
      filters: { ...preset.filters },
    };
    setFilterPresets(prev => [...prev, newPreset]);
    toast.success(`Duplicated as "${newPreset.name}"`);
  };

  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingPresetName, setEditingPresetName] = useState("");

  const startRenamePreset = (preset: FilterPreset) => {
    setEditingPresetId(preset.id);
    setEditingPresetName(preset.name);
  };

  const saveRenamePreset = () => {
    if (!editingPresetId || !editingPresetName.trim()) {
      setEditingPresetId(null);
      return;
    }
    setFilterPresets(prev => prev.map(p => 
      p.id === editingPresetId ? { ...p, name: editingPresetName.trim() } : p
    ));
    toast.success("Preset renamed");
    setEditingPresetId(null);
    setEditingPresetName("");
  };

  const cancelRenamePreset = () => {
    setEditingPresetId(null);
    setEditingPresetName("");
  };

  // Keyboard shortcuts: Ctrl+S to save preset, Ctrl+E to export, Ctrl+I to import, Ctrl+X to clear, Ctrl+/ for help
  // A to approve, R to reject (when request selected), N to select next pending, P to select previous pending
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setShowPresetSave(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportPresets();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        importInputRef.current?.click();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        clearAllFilters();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcutsHelp(true);
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !isInputField) {
        e.preventDefault();
        setShowShortcutsHelp(true);
      }
      
      // Request processing shortcuts (only when not in input field)
      if (!isInputField && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Ctrl+Z to undo last batch action
        if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
          e.preventDefault();
          if (lastBatchAction && Date.now() - lastBatchAction.timestamp < 10000) {
            undoLastBatchAction();
          }
          return;
        }
        // Shift+A to batch approve selected requests
        if (e.shiftKey && (e.key === 'a' || e.key === 'A')) {
          e.preventDefault();
          if (selectedRequestIds.size > 0) {
            openBatchRequestConfirm('approve');
          }
          return;
        }
        // Shift+R to batch reject selected requests
        if (e.shiftKey && (e.key === 'r' || e.key === 'R')) {
          e.preventDefault();
          if (selectedRequestIds.size > 0) {
            openBatchRequestConfirm('reject');
          }
          return;
        }
        // A to approve selected request (single)
        if (!e.shiftKey && (e.key === 'a' || e.key === 'A')) {
          if (selectedRequest && selectedRequest.status === 'pending') {
            e.preventDefault();
            processRequest('approve');
          }
        }
        // R to reject selected request (single)
        if (!e.shiftKey && (e.key === 'r' || e.key === 'R')) {
          if (selectedRequest && selectedRequest.status === 'pending') {
            e.preventDefault();
            processRequest('reject');
          }
        }
        // Escape to deselect
        if (e.key === 'Escape') {
          if (selectedRequest) {
            e.preventDefault();
            setSelectedRequest(null);
            setAdminNotes('');
          } else if (selectedRequestIds.size > 0) {
            e.preventDefault();
            clearRequestSelection();
          }
        }
        // N to select next pending request
        if (!e.shiftKey && (e.key === 'n' || e.key === 'N')) {
          e.preventDefault();
          const pendingRequests = requests.filter(r => r.status === 'pending');
          if (pendingRequests.length > 0) {
            const currentIndex = selectedRequest 
              ? pendingRequests.findIndex(r => r.id === selectedRequest.id)
              : -1;
            const nextIndex = (currentIndex + 1) % pendingRequests.length;
            setSelectedRequest(pendingRequests[nextIndex]);
          }
        }
        // P to select previous pending request
        if (!e.shiftKey && (e.key === 'p' || e.key === 'P')) {
          e.preventDefault();
          const pendingRequests = requests.filter(r => r.status === 'pending');
          if (pendingRequests.length > 0) {
            const currentIndex = selectedRequest 
              ? pendingRequests.findIndex(r => r.id === selectedRequest.id)
              : 0;
            const prevIndex = currentIndex <= 0 ? pendingRequests.length - 1 : currentIndex - 1;
            setSelectedRequest(pendingRequests[prevIndex]);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filterPresets, selectedRequest, requests, selectedRequestIds, lastBatchAction]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      }
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Browser notifications not supported');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        toast.success('Browser notifications enabled!');
      } else {
        toast.error('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }, []);

  // Show browser notification - always for critical, otherwise only when tab is in background
  const showBrowserNotification = useCallback((title: string, body: string, isCritical: boolean = false) => {
    if (!notificationsEnabled || Notification.permission !== 'granted') return;
    
    // For critical alerts, always show. For others, only show if page is hidden
    if (!isCritical && !document.hidden) return;
    
    const notification = new Notification(title, {
      body,
      icon: isCritical ? '/pwa-512x512.png' : '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: isCritical ? 'admin-critical-alert' : 'admin-transaction-request',
      requireInteraction: isCritical, // Critical alerts stay until dismissed
      silent: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      // Navigate to notifications tab for critical alerts
      if (isCritical) {
        setActiveTab('notifications');
      }
    };
    
    // Don't auto-close critical alerts
    if (!isCritical) {
      setTimeout(() => notification.close(), 8000);
    }
  }, [notificationsEnabled]);

  // Play notification sound using Web Audio API - different tones for deposit vs withdrawal
  const playNotificationSound = useCallback((type: 'deposit' | 'withdrawal' | 'alert', priority?: 'low' | 'medium' | 'high' | 'critical') => {
    if (!soundEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (type === 'deposit') {
        // Uplifting ascending tone for deposits (money coming in) - C major arpeggio
        oscillator.frequency.setValueAtTime(523, ctx.currentTime);      // C5
        oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2); // G5
        oscillator.frequency.setValueAtTime(1047, ctx.currentTime + 0.3); // C6
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
      } else if (type === 'withdrawal') {
        // Neutral descending tone for withdrawals (money going out) - A minor
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);       // A5
        oscillator.frequency.setValueAtTime(698, ctx.currentTime + 0.15); // F5
        oscillator.frequency.setValueAtTime(587, ctx.currentTime + 0.3);  // D5
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.45);
      } else if (type === 'alert') {
        // Different sounds based on priority
        oscillator.type = 'sine';
        
        if (priority === 'critical') {
          // Urgent alarm - rapid high-pitched beeps
          oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
          oscillator.frequency.setValueAtTime(0, ctx.currentTime + 0.08);
          oscillator.frequency.setValueAtTime(1200, ctx.currentTime + 0.12);
          oscillator.frequency.setValueAtTime(0, ctx.currentTime + 0.2);
          oscillator.frequency.setValueAtTime(1200, ctx.currentTime + 0.24);
          gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
          gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.08);
          gainNode.gain.setValueAtTime(0.4, ctx.currentTime + 0.12);
          gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.4, ctx.currentTime + 0.24);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.35);
        } else if (priority === 'high') {
          // Two quick higher beeps
          oscillator.frequency.setValueAtTime(900, ctx.currentTime);
          oscillator.frequency.setValueAtTime(0, ctx.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
          gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.35, ctx.currentTime + 0.15);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
        } else if (priority === 'low') {
          // Soft single tone
          oscillator.frequency.setValueAtTime(440, ctx.currentTime);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.2);
        } else {
          // Medium - standard two beeps
          oscillator.frequency.setValueAtTime(800, ctx.currentTime);
          oscillator.frequency.setValueAtTime(0, ctx.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
          gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
        }
      }
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login");
      return;
    }
    loadData();

    // Set up real-time subscription for new transaction requests
    const transactionChannel = supabase
      .channel('admin-transaction-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transaction_requests',
        },
        (payload) => {
          const newRequest = payload.new as TransactionRequest;
          console.log("New transaction request received:", payload);
          
          // Play sound notification based on type
          playNotificationSound(newRequest.type);
          
          // Show in-app toast
          toast.info(
            `New ${newRequest.type} request!`,
            {
              description: `Amount: ৳${newRequest.amount.toLocaleString()}`,
              duration: 8000,
            }
          );
          
          // Show browser notification if tab is in background
          showBrowserNotification(
            `New ${newRequest.type.charAt(0).toUpperCase() + newRequest.type.slice(1)} Request`,
            `Amount: ৳${newRequest.amount.toLocaleString()} - Click to review`,
            false // Not critical
          );
          
          // Reload requests to get the new one with profile data
          loadRequests();
          loadStats();
        }
      )
      .subscribe();

    // Set up real-time subscription for new notification alerts
    const alertChannel = supabase
      .channel('admin-notification-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notification_history',
        },
        (payload) => {
          const newAlert = payload.new as NotificationHistory;
          console.log("New alert received:", payload);
          
          const isCritical = newAlert.priority === 'critical';
          
          // Play alert sound based on priority
          playNotificationSound('alert', newAlert.priority);
          
          // Show in-app toast with priority styling
          const toastFn = isCritical ? toast.error : 
                          newAlert.priority === 'high' ? toast.warning : toast.info;
          toastFn(
            `${isCritical ? '🚨 ' : newAlert.priority === 'high' ? '⚠️ ' : ''}${newAlert.title}`,
            {
              description: newAlert.message || 'New alert received',
              duration: isCritical ? 15000 : newAlert.priority === 'high' ? 10000 : 8000,
            }
          );
          
          // Show browser notification - always for critical alerts
          showBrowserNotification(
            `${isCritical ? '🚨 CRITICAL: ' : newAlert.priority.toUpperCase() + ': '}${newAlert.title}`,
            newAlert.message || 'New alert received',
            isCritical
          );
          
          // Add to local state
          setNotificationHistory(prev => [newAlert, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionChannel);
      supabase.removeChannel(alertChannel);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [navigate, playNotificationSound, showBrowserNotification]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadUsers(),
        loadRequests(),
        loadNotificationHistory(),
        loadAdminSettings(),
        loadGoalStreak(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    }
    setIsLoading(false);
  };

  const loadAdminSettings = async () => {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("*")
      .single();

    if (error) {
      console.error("Error loading admin settings:", error);
      return;
    }

    if (data) {
      setDailyGoal(data.daily_processing_goal);
    }
  };

  const updateDailyGoal = async (newGoal: number) => {
    if (newGoal < 1 || newGoal > 200) {
      toast.error("Daily goal must be between 1 and 200");
      return;
    }

    setIsUpdatingGoal(true);
    try {
      const { error } = await supabase
        .from("admin_settings")
        .update({ daily_processing_goal: newGoal })
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Update all rows

      if (error) throw error;

      setDailyGoal(newGoal);
      toast.success(`Daily goal updated to ${newGoal}`);
    } catch (error) {
      console.error("Error updating daily goal:", error);
      toast.error("Failed to update daily goal");
    } finally {
      setIsUpdatingGoal(false);
    }
  };

  const loadGoalStreak = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("admin_goal_streaks")
      .select("*")
      .eq("admin_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error loading goal streak:", error);
      return;
    }

    if (data) {
      setGoalStreak({
        current_streak: data.current_streak,
        best_streak: data.best_streak,
        total_goals_met: data.total_goals_met,
        last_goal_met_date: data.last_goal_met_date,
      });
    } else {
      // Initialize streak for new admin
      setGoalStreak({
        current_streak: 0,
        best_streak: 0,
        total_goals_met: 0,
        last_goal_met_date: null,
      });
    }
  };

  const updateGoalStreak = async (goalMet: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Check if already recorded today
    if (goalStreak?.last_goal_met_date === today) return;

    if (goalMet) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const isConsecutive = goalStreak?.last_goal_met_date === yesterdayStr;
      const newStreak = isConsecutive ? (goalStreak?.current_streak || 0) + 1 : 1;
      const newBest = Math.max(newStreak, goalStreak?.best_streak || 0);
      const newTotal = (goalStreak?.total_goals_met || 0) + 1;

      // Upsert streak data
      const { error } = await supabase
        .from("admin_goal_streaks")
        .upsert({
          admin_id: user.id,
          current_streak: newStreak,
          best_streak: newBest,
          total_goals_met: newTotal,
          last_goal_met_date: today,
        }, { onConflict: 'admin_id' });

      if (error) {
        console.error("Error updating goal streak:", error);
        return;
      }

      setGoalStreak({
        current_streak: newStreak,
        best_streak: newBest,
        total_goals_met: newTotal,
        last_goal_met_date: today,
      });

      // Show milestone toasts
      if (newStreak === 3) {
        toast.success("🔥 3-Day Streak! You're on fire!");
      } else if (newStreak === 7) {
        toast.success("⭐ 7-Day Streak! Incredible dedication!");
      } else if (newStreak === 14) {
        toast.success("💎 14-Day Streak! You're a processing legend!");
      } else if (newStreak === 30) {
        toast.success("👑 30-Day Streak! Absolute champion!");
      } else if (newStreak > 1) {
        toast.success(`🔥 ${newStreak}-Day Streak!`);
      }
    }
  };

  // Check and update streak when goal is met
  useEffect(() => {
    const today = new Date().toDateString();
    const todayProcessed = requests.filter(r => 
      (r.status === "approved" || r.status === "rejected") &&
      r.processed_at &&
      new Date(r.processed_at).toDateString() === today
    ).length;

    if (todayProcessed >= dailyGoal && goalStreak?.last_goal_met_date !== new Date().toISOString().split('T')[0]) {
      updateGoalStreak(true);
    }
  }, [requests, dailyGoal, goalStreak?.last_goal_met_date]);

  const loadNotificationHistory = async () => {
    const { data, error } = await supabase
      .from("admin_notification_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error loading notification history:", error);
      return;
    }

    setNotificationHistory((data || []) as NotificationHistory[]);
  };

  const handleMarkNotificationsRead = async (ids: string[], isRead: boolean) => {
    const { error } = await supabase
      .from("admin_notification_history")
      .update({ 
        is_read: isRead, 
        read_at: isRead ? new Date().toISOString() : null 
      })
      .in("id", ids);

    if (error) {
      console.error("Error updating notification status:", error);
      toast.error("Failed to update notification status");
      return;
    }

    // Update local state
    setNotificationHistory(prev => 
      prev.map(n => 
        ids.includes(n.id) 
          ? { ...n, is_read: isRead, read_at: isRead ? new Date().toISOString() : null }
          : n
      )
    );
    
    toast.success(isRead ? "Marked as read" : "Marked as unread");
  };

  const handleAcknowledgeAlert = async (id: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("admin_notification_history")
      .update({ 
        acknowledged_at: now,
        is_read: true,
        read_at: now,
      })
      .eq("id", id);

    if (error) {
      console.error("Error acknowledging alert:", error);
      toast.error("Failed to acknowledge alert");
      return;
    }

    // Update local state
    setNotificationHistory(prev => 
      prev.map(n => 
        n.id === id 
          ? { ...n, acknowledged_at: now, is_read: true, read_at: now }
          : n
      )
    );
    
    toast.success("Alert acknowledged - escalation stopped");
  };

  const loadStats = async () => {
    const today = startOfDay(new Date());
    const sevenDaysAgo = subDays(today, 7);

    // Get total users
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Get today's new users
    const { count: todayNewUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());

    // Get total deposits from wallets
    const { data: walletData } = await supabase
      .from("wallets")
      .select("total_deposit, total_withdraw");

    const totalDeposits = walletData?.reduce((sum, w) => sum + (w.total_deposit || 0), 0) || 0;
    const totalWithdrawals = walletData?.reduce((sum, w) => sum + (w.total_withdraw || 0), 0) || 0;

    // Get pending requests
    const { count: pendingRequests } = await supabase
      .from("transaction_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Get today's bets
    const { data: todayBetsData } = await supabase
      .from("game_bets")
      .select("bet_amount")
      .gte("created_at", today.toISOString());

    const todayBets = todayBetsData?.reduce((sum, b) => sum + (b.bet_amount || 0), 0) || 0;

    // Get total referrals
    const { count: totalReferrals } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .not("referred_by", "is", null);

    // Get active users in last 7 days
    const { count: activeUsers7d } = await supabase
      .from("player_activity")
      .select("*", { count: "exact", head: true })
      .gte("activity_date", sevenDaysAgo.toISOString().split("T")[0]);

    setStats({
      totalUsers: totalUsers || 0,
      totalDeposits,
      totalWithdrawals,
      pendingRequests: pendingRequests || 0,
      todayNewUsers: todayNewUsers || 0,
      todayBets,
      totalReferrals: totalReferrals || 0,
      activeUsers7d: activeUsers7d || 0,
    });
  };

  const loadUsers = async () => {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error loading users:", error);
      return;
    }

    // Get wallets for users
    const userIds = profiles?.map(p => p.user_id) || [];
    const profileIds = profiles?.map(p => p.id) || [];
    
    const { data: wallets } = await supabase
      .from("wallets")
      .select("*")
      .in("user_id", userIds);

    // Get referral counts (count profiles where referred_by matches each profile's id)
    const { data: referralCounts } = await supabase
      .from("profiles")
      .select("referred_by")
      .in("referred_by", profileIds);

    // Count referrals for each profile
    const referralCountMap = new Map<string, number>();
    referralCounts?.forEach(r => {
      if (r.referred_by) {
        referralCountMap.set(r.referred_by, (referralCountMap.get(r.referred_by) || 0) + 1);
      }
    });

    const usersWithWallets = profiles?.map(p => {
      const wallet = wallets?.find(w => w.user_id === p.user_id);
      return {
        ...p,
        wallet: wallet || null,
        referral_count: referralCountMap.get(p.id) || 0,
        last_active: wallet?.updated_at || p.created_at,
      };
    }) || [];

    setUsers(usersWithWallets);
  };

  const loadRequests = async () => {
    let query = supabase
      .from("transaction_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (requestFilter !== "all") {
      query = query.eq("status", requestFilter);
    }
    if (requestTypeFilter !== "all") {
      query = query.eq("type", requestTypeFilter);
    }
    if (requestPaymentFilter !== "all") {
      query = query.eq("payment_method", requestPaymentFilter);
    }
    if (requestDateRange.from) {
      query = query.gte("created_at", startOfDay(requestDateRange.from).toISOString());
    }
    if (requestDateRange.to) {
      query = query.lte("created_at", endOfDay(requestDateRange.to).toISOString());
    }
    if (requestAmountRange.min) {
      query = query.gte("amount", parseFloat(requestAmountRange.min));
    }
    if (requestAmountRange.max) {
      query = query.lte("amount", parseFloat(requestAmountRange.max));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading requests:", error);
      return;
    }

    // Get profile info for each request
    const userIds = [...new Set(data?.map(r => r.user_id) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, phone, display_user_id")
      .in("user_id", userIds);

    const requestsWithProfiles = data?.map(r => ({
      ...r,
      type: r.type as "deposit" | "withdrawal",
      status: r.status as "pending" | "approved" | "rejected",
      profile: profiles?.find(p => p.user_id === r.user_id),
    })) || [];

    setRequests(requestsWithProfiles);
  };

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login");
  };

  const processRequest = async (action: "approve" | "reject") => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      const endpoint =
        selectedRequest.type === "deposit" ? "deposits" : "withdraws";
      const verb = action === "approve" ? "approve" : "reject";
      const { data, error } = await supabase.functions.invoke(
        `api-admin/${endpoint}/${selectedRequest.id}/${verb}`,
        {
          method: "POST",
          body:
            action === "approve"
              ? { notes: adminNotes }
              : { reason: adminNotes || "Rejected by admin" },
        },
      );
      if (error || (data && data.success === false)) {
        throw new Error(error?.message || data?.error || "Request failed");
      }

      // Play appropriate sound effect
      if (action === "approve") {
        playApprovalSound();
      } else {
        playRejectionSound();
      }

      toast.success(`Request ${action === "approve" ? "approved" : "rejected"}`);
      setSelectedRequest(null);
      setAdminNotes("");
      loadRequests();
      loadStats();
    } catch (error: any) {
      console.error("Error processing request:", error);
      toast.error(error?.message || "Failed to process request");
    }
    setIsProcessing(false);
  };

  // Quick process without modal
  const quickProcessRequest = async (request: TransactionRequest, action: "approve" | "reject") => {
    setIsProcessing(true);
    try {
      const endpoint = request.type === "deposit" ? "deposits" : "withdraws";
      const verb = action === "approve" ? "approve" : "reject";
      const { data, error } = await supabase.functions.invoke(
        `api-admin/${endpoint}/${request.id}/${verb}`,
        {
          method: "POST",
          body:
            action === "approve"
              ? { notes: "Quick approved" }
              : { reason: "Quick rejected" },
        },
      );
      if (error || (data && data.success === false)) {
        throw new Error(error?.message || data?.error || "Request failed");
      }

      // Play appropriate sound effect
      if (action === "approve") {
        playApprovalSound();
      } else {
        playRejectionSound();
      }

      toast.success(`Request ${action === "approve" ? "approved" : "rejected"}`);
      loadRequests();
      loadStats();
    } catch (error: any) {
      console.error("Error processing request:", error);
      toast.error(error?.message || "Failed to process request");
    }
    setIsProcessing(false);
  };

  // Batch request processing
  const toggleRequestSelection = (requestId: string) => {
    setSelectedRequestIds(prev => {
      const next = new Set(prev);
      if (next.has(requestId)) {
        next.delete(requestId);
      } else {
        next.add(requestId);
      }
      return next;
    });
  };

  const toggleSelectAllPendingRequests = () => {
    const pendingRequestIds = requests.filter(r => r.status === 'pending').map(r => r.id);
    const allSelected = pendingRequestIds.every(id => selectedRequestIds.has(id));
    
    setSelectedRequestIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        pendingRequestIds.forEach(id => next.delete(id));
      } else {
        pendingRequestIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const clearRequestSelection = () => {
    setSelectedRequestIds(new Set());
  };

  const openBatchRequestConfirm = (action: "approve" | "reject") => {
    const selectedPending = requests.filter(r => selectedRequestIds.has(r.id) && r.status === 'pending');
    if (selectedPending.length === 0) {
      toast.error("No pending requests selected");
      return;
    }
    setBatchRequestConfirm({ open: true, action });
  };

  const closeBatchRequestConfirm = () => {
    setBatchRequestConfirm({ open: false, action: null });
  };

  const executeBatchProcess = async () => {
    const action = batchRequestConfirm.action;
    if (!action) return;

    const selectedPending = requests.filter(r => selectedRequestIds.has(r.id) && r.status === 'pending');
    if (selectedPending.length === 0) {
      toast.error("No pending requests selected");
      closeBatchRequestConfirm();
      return;
    }

    setIsProcessing(true);
    setBatchProgress({ current: 0, total: selectedPending.length, isProcessing: true });
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedPending.length; i++) {
      const request = selectedPending[i];
      setBatchProgress(prev => ({ ...prev, current: i + 1 }));
      try {
        const { error } = await supabase
          .from("transaction_requests")
          .update({
            status: action === "approve" ? "approved" : "rejected",
            admin_notes: action === "approve" ? "Batch approved" : "Batch rejected",
            processed_at: new Date().toISOString(),
          })
          .eq("id", request.id);

        if (error) throw error;

        if (action === "approve") {
          if (request.type === "deposit") {
            const { data: wallet } = await supabase
              .from("wallets")
              .select("*")
              .eq("user_id", request.user_id)
              .maybeSingle();

            if (wallet) {
              await supabase
                .from("wallets")
                .update({
                  balance: wallet.balance + request.amount,
                  total_deposit: wallet.total_deposit + request.amount,
                })
                .eq("user_id", request.user_id);

              await supabase.from("wallet_transactions").insert({
                user_id: request.user_id,
                type: "deposit",
                amount: request.amount,
                balance_after: wallet.balance + request.amount,
                description: `Deposit approved - ${request.payment_method || "Manual"}`,
              });

              // Calculate agent commission for deposit (if user was referred by agent)
              try {
                await fetch(
                  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-commission`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                    },
                    body: JSON.stringify({
                      userId: request.user_id,
                      amount: request.amount,
                      type: "deposit",
                      referenceId: request.id,
                    }),
                  }
                );
              } catch (commissionError) {
                console.error("Error calculating agent commission:", commissionError);
              }
            }
          } else {
            const { data: wallet } = await supabase
              .from("wallets")
              .select("*")
              .eq("user_id", request.user_id)
              .maybeSingle();

            if (wallet && wallet.balance >= request.amount) {
              await supabase
                .from("wallets")
                .update({
                  balance: wallet.balance - request.amount,
                  total_withdraw: wallet.total_withdraw + request.amount,
                })
                .eq("user_id", request.user_id);

              await supabase.from("wallet_transactions").insert({
                user_id: request.user_id,
                type: "withdraw",
                amount: -request.amount,
                balance_after: wallet.balance - request.amount,
                description: `Withdrawal approved - ${request.payment_method || "Manual"}`,
              });
            }
          }
        }
        successCount++;
      } catch (error) {
        console.error("Error processing request:", error);
        failCount++;
      }
    }

    // Play appropriate sound effect
    if (successCount > 0) {
      if (action === "approve") {
        playApprovalSound();
      } else {
        playRejectionSound();
      }
    }

    // Save for undo functionality (only if all succeeded)
    if (failCount === 0 && successCount > 0) {
      const walletChanges: { user_id: string; balanceDelta: number; depositDelta: number; withdrawDelta: number }[] = [];
      
      for (const request of selectedPending) {
        if (action === "approve") {
          if (request.type === "deposit") {
            walletChanges.push({
              user_id: request.user_id,
              balanceDelta: request.amount,
              depositDelta: request.amount,
              withdrawDelta: 0,
            });
          } else {
            walletChanges.push({
              user_id: request.user_id,
              balanceDelta: -request.amount,
              depositDelta: 0,
              withdrawDelta: request.amount,
            });
          }
        }
      }

      setLastBatchAction({
        action,
        requests: selectedPending,
        originalStatuses: selectedPending.map(r => ({ id: r.id, status: r.status, admin_notes: r.admin_notes })),
        walletChanges,
        timestamp: Date.now(),
      });

      // Start countdown for undo
      setUndoCountdown(10);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = setTimeout(() => {
        setLastBatchAction(null);
        setUndoCountdown(0);
      }, 10000);

      // Countdown interval
      const countdownInterval = setInterval(() => {
        setUndoCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      toast.success(
        `${successCount} request${successCount > 1 ? 's' : ''} ${action === "approve" ? "approved" : "rejected"}. Press Ctrl+Z to undo (${10}s)`,
        { duration: 5000 }
      );
    } else if (failCount === 0) {
      toast.success(`${successCount} request${successCount > 1 ? 's' : ''} ${action === "approve" ? "approved" : "rejected"}`);
    } else {
      toast.warning(`${successCount} succeeded, ${failCount} failed`);
    }

    clearRequestSelection();
    loadRequests();
    loadStats();
    setIsProcessing(false);
    setBatchProgress({ current: 0, total: 0, isProcessing: false });
    closeBatchRequestConfirm();
  };

  const undoLastBatchAction = async () => {
    if (!lastBatchAction) return;

    // Clear the timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    // Revert each request status back to pending
    for (const original of lastBatchAction.originalStatuses) {
      try {
        const { error } = await supabase
          .from("transaction_requests")
          .update({
            status: "pending",
            admin_notes: original.admin_notes,
            processed_at: null,
          })
          .eq("id", original.id);

        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error("Error undoing request:", error);
        failCount++;
      }
    }

    // Revert wallet changes if it was an approval
    if (lastBatchAction.action === "approve") {
      for (const change of lastBatchAction.walletChanges) {
        try {
          const { data: wallet } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", change.user_id)
            .maybeSingle();

          if (wallet) {
            await supabase
              .from("wallets")
              .update({
                balance: wallet.balance - change.balanceDelta,
                total_deposit: wallet.total_deposit - change.depositDelta,
                total_withdraw: wallet.total_withdraw - change.withdrawDelta,
              })
              .eq("user_id", change.user_id);

            // Also delete the wallet transaction record
            const description = change.depositDelta > 0 
              ? `Deposit approved - ` 
              : `Withdrawal approved - `;
            
            await supabase
              .from("wallet_transactions")
              .delete()
              .eq("user_id", change.user_id)
              .ilike("description", `${description}%`)
              .order("created_at", { ascending: false })
              .limit(1);
          }
        } catch (error) {
          console.error("Error reverting wallet change:", error);
        }
      }
    }

    if (failCount === 0) {
      toast.success(`Undo successful: ${successCount} request${successCount > 1 ? 's' : ''} reverted to pending`);
    } else {
      toast.warning(`Undo: ${successCount} succeeded, ${failCount} failed`);
    }

    setLastBatchAction(null);
    setUndoCountdown(0);
    loadRequests();
    loadStats();
    setIsProcessing(false);
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: !currentStatus })
        .eq("user_id", userId);

      if (error) throw error;
      toast.success(`Admin status ${!currentStatus ? "granted" : "revoked"}`);
      loadUsers();
    } catch (error) {
      console.error("Error toggling admin:", error);
      toast.error("Failed to update admin status");
    }
  };

  // Bulk selection handlers
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    const pageUserIds = paginatedUsers.map(u => u.user_id);
    const allSelected = pageUserIds.every(id => selectedUserIds.has(id));
    
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        pageUserIds.forEach(id => next.delete(id));
      } else {
        pageUserIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedUserIds(new Set());
  };

  const openBulkConfirmDialog = (action: "grant" | "revoke") => {
    setBulkActionConfirm({ open: true, action });
  };

  const closeBulkConfirmDialog = () => {
    setBulkActionConfirm({ open: false, action: null });
  };

  const executeBulkAction = async () => {
    if (selectedUserIds.size === 0 || !bulkActionConfirm.action) return;
    setIsBulkProcessing(true);
    
    const isGrant = bulkActionConfirm.action === "grant";
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: isGrant })
        .in("user_id", Array.from(selectedUserIds));

      if (error) throw error;
      toast.success(isGrant 
        ? `Granted admin to ${selectedUserIds.size} users` 
        : `Revoked admin from ${selectedUserIds.size} users`
      );
      clearSelection();
      loadUsers();
    } catch (error) {
      console.error("Error bulk action:", error);
      toast.error(isGrant ? "Failed to grant admin status" : "Failed to revoke admin status");
    }
    
    setIsBulkProcessing(false);
    closeBulkConfirmDialog();
  };

  const filteredUsers = useMemo(() => {
    let filtered = users.filter(u => 
      (u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.includes(searchQuery) ||
      u.referral_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.display_user_id?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    // Apply VIP range filter
    const minVip = vipRange.min ? parseInt(vipRange.min) : null;
    const maxVip = vipRange.max ? parseInt(vipRange.max) : null;
    if (minVip !== null || maxVip !== null) {
      filtered = filtered.filter(u => {
        if (minVip !== null && maxVip !== null) {
          return u.vip_level >= minVip && u.vip_level <= maxVip;
        } else if (minVip !== null) {
          return u.vip_level >= minVip;
        } else if (maxVip !== null) {
          return u.vip_level <= maxVip;
        }
        return true;
      });
    }
    
    // Apply join date range filter
    if (joinDateRange.from || joinDateRange.to) {
      filtered = filtered.filter(u => {
        const joinDate = new Date(u.created_at);
        if (joinDateRange.from && joinDateRange.to) {
          return isWithinInterval(joinDate, { 
            start: startOfDay(joinDateRange.from), 
            end: endOfDay(joinDateRange.to) 
          });
        } else if (joinDateRange.from) {
          return joinDate >= startOfDay(joinDateRange.from);
        } else if (joinDateRange.to) {
          return joinDate <= endOfDay(joinDateRange.to);
        }
        return true;
      });
    }
    
    // Apply balance range filter
    const minBalance = balanceRange.min ? parseFloat(balanceRange.min) : null;
    const maxBalance = balanceRange.max ? parseFloat(balanceRange.max) : null;
    if (minBalance !== null || maxBalance !== null) {
      filtered = filtered.filter(u => {
        const balance = u.wallet?.balance || 0;
        if (minBalance !== null && maxBalance !== null) {
          return balance >= minBalance && balance <= maxBalance;
        } else if (minBalance !== null) {
          return balance >= minBalance;
        } else if (maxBalance !== null) {
          return balance <= maxBalance;
        }
        return true;
      });
    }
    
    // Apply admin status filter
    if (adminFilter === "admin") {
      filtered = filtered.filter(u => u.is_admin === true);
    } else if (adminFilter === "regular") {
      filtered = filtered.filter(u => !u.is_admin);
    }
    
    // Apply net profit/loss filter
    if (profitFilter !== "all") {
      filtered = filtered.filter(u => {
        const netProfit = (u.wallet?.total_win || 0) - (u.wallet?.total_bet || 0);
        if (profitFilter === "profit") return netProfit > 0;
        if (profitFilter === "loss") return netProfit < 0;
        if (profitFilter === "breakeven") return netProfit === 0;
        return true;
      });
    }
    
    // Apply wagered range filter
    const minWagered = wageredRange.min ? parseFloat(wageredRange.min) : null;
    const maxWagered = wageredRange.max ? parseFloat(wageredRange.max) : null;
    if (minWagered !== null || maxWagered !== null) {
      filtered = filtered.filter(u => {
        const wagered = u.wallet?.total_bet || 0;
        if (minWagered !== null && maxWagered !== null) {
          return wagered >= minWagered && wagered <= maxWagered;
        } else if (minWagered !== null) {
          return wagered >= minWagered;
        } else if (maxWagered !== null) {
          return wagered <= maxWagered;
        }
        return true;
      });
    }
    
    // Apply referral count range filter
    const minReferrals = referralRange.min ? parseInt(referralRange.min) : null;
    const maxReferrals = referralRange.max ? parseInt(referralRange.max) : null;
    if (minReferrals !== null || maxReferrals !== null) {
      filtered = filtered.filter(u => {
        const referrals = u.referral_count || 0;
        if (minReferrals !== null && maxReferrals !== null) {
          return referrals >= minReferrals && referrals <= maxReferrals;
        } else if (minReferrals !== null) {
          return referrals >= minReferrals;
        } else if (maxReferrals !== null) {
          return referrals <= maxReferrals;
        }
        return true;
      });
    }
    
    // Apply win rate range filter
    const minWinRate = winRateRange.min ? parseFloat(winRateRange.min) : null;
    const maxWinRate = winRateRange.max ? parseFloat(winRateRange.max) : null;
    if (minWinRate !== null || maxWinRate !== null) {
      filtered = filtered.filter(u => {
        const totalBet = u.wallet?.total_bet || 0;
        const totalWin = u.wallet?.total_win || 0;
        if (totalBet === 0) return false; // Exclude users with no bets when filtering by win rate
        const winRate = (totalWin / totalBet) * 100;
        if (minWinRate !== null && maxWinRate !== null) {
          return winRate >= minWinRate && winRate <= maxWinRate;
        } else if (minWinRate !== null) {
          return winRate >= minWinRate;
        } else if (maxWinRate !== null) {
          return winRate <= maxWinRate;
        }
        return true;
      });
    }
    
    // Apply total wins range filter
    const minTotalWins = totalWinsRange.min ? parseFloat(totalWinsRange.min) : null;
    const maxTotalWins = totalWinsRange.max ? parseFloat(totalWinsRange.max) : null;
    if (minTotalWins !== null || maxTotalWins !== null) {
      filtered = filtered.filter(u => {
        const totalWin = u.wallet?.total_win || 0;
        if (minTotalWins !== null && maxTotalWins !== null) {
          return totalWin >= minTotalWins && totalWin <= maxTotalWins;
        } else if (minTotalWins !== null) {
          return totalWin >= minTotalWins;
        } else if (maxTotalWins !== null) {
          return totalWin <= maxTotalWins;
        }
        return true;
      });
    }
    
    // Apply last active date range filter
    if (lastActiveRange.from || lastActiveRange.to) {
      filtered = filtered.filter(u => {
        if (!u.last_active) return false;
        const lastActiveDate = new Date(u.last_active);
        if (lastActiveRange.from && lastActiveRange.to) {
          return isWithinInterval(lastActiveDate, {
            start: startOfDay(lastActiveRange.from),
            end: endOfDay(lastActiveRange.to)
          });
        } else if (lastActiveRange.from) {
          return lastActiveDate >= startOfDay(lastActiveRange.from);
        } else if (lastActiveRange.to) {
          return lastActiveDate <= endOfDay(lastActiveRange.to);
        }
        return true;
      });
    }
    
    // Sort the filtered users
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (usersSortColumn) {
        case "username":
          comparison = (a.username || "").localeCompare(b.username || "");
          break;
        case "balance":
          comparison = (a.wallet?.balance || 0) - (b.wallet?.balance || 0);
          break;
        case "deposit":
          comparison = (a.wallet?.total_deposit || 0) - (b.wallet?.total_deposit || 0);
          break;
        case "wagered":
          comparison = (a.wallet?.total_bet || 0) - (b.wallet?.total_bet || 0);
          break;
        case "totalWins":
          comparison = (a.wallet?.total_win || 0) - (b.wallet?.total_win || 0);
          break;
        case "netProfit":
          const aProfit = (a.wallet?.total_win || 0) - (a.wallet?.total_bet || 0);
          const bProfit = (b.wallet?.total_win || 0) - (b.wallet?.total_bet || 0);
          comparison = aProfit - bProfit;
          break;
        case "winRate":
          const aRate = (a.wallet?.total_bet || 0) > 0 ? ((a.wallet?.total_win || 0) / (a.wallet?.total_bet || 1)) * 100 : 0;
          const bRate = (b.wallet?.total_bet || 0) > 0 ? ((b.wallet?.total_win || 0) / (b.wallet?.total_bet || 1)) * 100 : 0;
          comparison = aRate - bRate;
          break;
        case "vip":
          comparison = a.vip_level - b.vip_level;
          break;
        case "referrals":
          comparison = (a.referral_count || 0) - (b.referral_count || 0);
          break;
        case "joined":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "lastActive":
          const aActive = a.last_active ? new Date(a.last_active).getTime() : 0;
          const bActive = b.last_active ? new Date(b.last_active).getTime() : 0;
          comparison = aActive - bActive;
          break;
      }
      return usersSortDirection === "asc" ? comparison : -comparison;
    });
  }, [users, searchQuery, vipRange, joinDateRange, balanceRange, adminFilter, profitFilter, wageredRange, referralRange, winRateRange, totalWinsRange, lastActiveRange, usersSortColumn, usersSortDirection]);

  // Reset to page 1 when search, filter, or sort changes
  useEffect(() => {
    setUsersPage(1);
  }, [searchQuery, vipRange, joinDateRange, balanceRange, adminFilter, profitFilter, wageredRange, referralRange, winRateRange, totalWinsRange, lastActiveRange, usersSortColumn, usersSortDirection]);

  // Handle column sort toggle
  const handleUserSort = (column: typeof usersSortColumn) => {
    if (usersSortColumn === column) {
      setUsersSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setUsersSortColumn(column);
      setUsersSortDirection("desc");
    }
  };

  // Sortable header component
  const SortableHeader = ({ column, label }: { column: typeof usersSortColumn; label: string }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase cursor-pointer hover:text-white transition-colors"
      onClick={() => handleUserSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {usersSortColumn === column ? (
          usersSortDirection === "asc" ? (
            <ArrowUp size={12} className="text-primary" />
          ) : (
            <ArrowDown size={12} className="text-primary" />
          )
        ) : (
          <ArrowUpDown size={12} className="opacity-40" />
        )}
      </div>
    </th>
  );

  // Pagination calculations
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (usersPage - 1) * usersPerPage;
    return filteredUsers.slice(startIndex, startIndex + usersPerPage);
  }, [filteredUsers, usersPage, usersPerPage]);

  // Bulk selection derived state
  const allOnPageSelected = paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUserIds.has(u.user_id));
  const someOnPageSelected = paginatedUsers.some(u => selectedUserIds.has(u.user_id));

  const StatCard = ({ icon: Icon, label, value, subValue, color }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    subValue?: string;
    color: string;
  }) => (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="text-white" size={24} />
        </div>
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-white text-xl font-bold">{value}</p>
          {subValue && <p className="text-gray-500 text-xs">{subValue}</p>}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  function SidebarToggleButton() {
    const { state, toggleSidebar, isMobile } = useSidebar();
    const collapsed = state === "collapsed";
    const Icon = collapsed || isMobile ? PanelLeftOpen : PanelLeftClose;
    return (
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar (Ctrl/Cmd+B)" : "Collapse sidebar (Ctrl/Cmd+B)"}
        className="inline-flex items-center gap-2 rounded-md border border-gray-700 bg-gray-900/60 px-2.5 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
      >
        <Icon className="h-4 w-4" />
        <span className="hidden sm:inline">{collapsed ? "Expand" : "Collapse"}</span>
      </button>
    );
  }


  return (
    <SidebarProvider defaultOpen={typeof document !== "undefined" ? !document.cookie.split("; ").find((c) => c.startsWith("sidebar:state="))?.endsWith("false") : true}>
      <div className="min-h-screen flex w-full bg-gray-900">
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingRequests={stats?.pendingRequests || 0}
          unreadNotifications={notificationHistory.filter(n => !n.is_read).length}
          onLogout={handleLogout}
          onNavigateToSettings={() => navigate("/admin/notifications")}
          users={users.map(u => ({
            user_id: u.user_id,
            username: u.username,
            phone: u.phone,
            display_user_id: u.display_user_id,
            vip_level: u.vip_level,
          }))}
          onUserSelect={(userId) => {
            const user = users.find(u => u.user_id === userId);
            if (user) {
              setSelectedUserDetails(user);
              setActiveTab("users");
            }
          }}
          recentTransactions={requests.slice(0, 5).map(r => ({
            id: r.id,
            type: r.type,
            amount: r.amount,
            status: r.status,
            created_at: r.created_at,
            username: r.profile?.username,
            display_user_id: r.profile?.display_user_id,
          }))}
          unreadAlerts={notificationHistory
            .filter(n => !n.is_read)
            .slice(0, 10)
            .map(n => ({
              id: n.id,
              title: n.title,
              message: n.message,
              priority: n.priority,
              notification_type: n.notification_type,
              created_at: n.created_at,
              metadata: n.metadata as { user_id?: string; display_user_id?: string; username?: string } | null,
            }))}
          onMarkAllAlertsRead={async () => {
            const unreadIds = notificationHistory.filter(n => !n.is_read).map(n => n.id);
            if (unreadIds.length > 0) {
              await handleMarkNotificationsRead(unreadIds, true);
            }
          }}
          soundEnabled={soundEnabled}
          soundVolume={soundVolume}
          onSoundToggle={() => {
            const newValue = !soundEnabled;
            setSoundEnabled(newValue);
            localStorage.setItem('admin_soundEnabled', String(newValue));
          }}
          onVolumeChange={(volume) => {
            setSoundVolume(volume);
            localStorage.setItem('admin_soundVolume', String(volume));
          }}
          soundPreferences={soundPreferences}
          onSoundPreferencesChange={(prefs) => {
            setSoundPreferences(prefs);
            localStorage.setItem('admin_soundPreferences', JSON.stringify(prefs));
          }}
          todayDeposits={requests
            .filter(r => r.type === "deposit" && r.status === "approved" && new Date(r.created_at).toDateString() === new Date().toDateString())
            .reduce((sum, r) => sum + r.amount, 0)}
          todayWithdrawals={requests
            .filter(r => r.type === "withdrawal" && r.status === "approved" && new Date(r.created_at).toDateString() === new Date().toDateString())
            .reduce((sum, r) => sum + r.amount, 0)}
          oldestPendingRequest={(() => {
            const pending = requests.filter(r => r.status === "pending").sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
            return pending ? {
              id: pending.id,
              type: pending.type,
              amount: pending.amount,
              username: pending.profile?.username || null,
              display_user_id: pending.profile?.display_user_id || null,
              created_at: pending.created_at,
            } : null;
          })()}
          onQuickProcess={async (requestId, action) => {
            const request = requests.find(r => r.id === requestId);
            if (request) {
              await quickProcessRequest(request, action);
            }
          }}
          isProcessing={isProcessing}
          weeklyVolume={(() => {
            const days = [];
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 6; i >= 0; i--) {
              const date = subDays(new Date(), i);
              const dateStr = date.toDateString();
              const dayRequests = requests.filter(r => 
                r.status === "approved" && 
                new Date(r.created_at).toDateString() === dateStr
              );
              days.push({
                day: dayNames[date.getDay()],
                deposits: dayRequests.filter(r => r.type === "deposit").reduce((sum, r) => sum + r.amount, 0),
                withdrawals: dayRequests.filter(r => r.type === "withdrawal").reduce((sum, r) => sum + r.amount, 0),
              });
            }
            return days;
          })()}
          previousWeekVolume={(() => {
            let total = 0;
            for (let i = 13; i >= 7; i--) {
              const date = subDays(new Date(), i);
              const dateStr = date.toDateString();
              const dayRequests = requests.filter(r => 
                r.status === "approved" && 
                new Date(r.created_at).toDateString() === dateStr
              );
              total += dayRequests.reduce((sum, r) => sum + r.amount, 0);
            }
            return total;
          })()}
          todayNewRequests={(() => {
            const today = new Date().toDateString();
            return requests.filter(r => 
              new Date(r.created_at).toDateString() === today
            ).length;
          })()}
          todayProcessed={(() => {
            const today = new Date().toDateString();
            return requests.filter(r => 
              (r.status === "approved" || r.status === "rejected") &&
              r.processed_at &&
              new Date(r.processed_at).toDateString() === today
            ).length;
          })()}
          dailyGoal={dailyGoal}
          onUpdateDailyGoal={updateDailyGoal}
          isUpdatingGoal={isUpdatingGoal}
          goalStreak={goalStreak}
        />
        
        {/* Undo Bar - appears when batch action can be undone */}
        {undoCountdown > 0 && lastBatchAction && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-gray-800 border border-amber-600/50 rounded-lg shadow-2xl shadow-amber-900/30 px-4 py-3 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center">
                  <span className="text-amber-400 font-bold text-sm">{undoCountdown}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-sm font-medium">
                    {lastBatchAction.requests.length} request{lastBatchAction.requests.length > 1 ? 's' : ''} {lastBatchAction.action === 'approve' ? 'approved' : 'rejected'}
                  </span>
                  <span className="text-gray-400 text-xs">
                    Press <kbd className="px-1 py-0.5 text-xs font-semibold text-amber-200 bg-amber-900/50 border border-amber-700 rounded mx-0.5">Ctrl+Z</kbd> to undo
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-600/50 text-amber-400 hover:bg-amber-900/30 hover:text-amber-300"
                  onClick={undoLastBatchAction}
                  disabled={isProcessing}
                >
                  <History className="w-4 h-4 mr-1" />
                  Undo
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white hover:bg-gray-700"
                  onClick={() => {
                    if (undoTimeoutRef.current) {
                      clearTimeout(undoTimeoutRef.current);
                      undoTimeoutRef.current = null;
                    }
                    setLastBatchAction(null);
                    setUndoCountdown(0);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 rounded-b-lg overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(undoCountdown / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
        
        <SidebarInset className="bg-gray-900">
          {/* Header */}
          <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarToggleButton />
              <div className="flex flex-col gap-1">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink 
                        className="text-gray-400 hover:text-white cursor-pointer flex items-center gap-1"
                        onClick={() => setActiveTab("dashboard")}
                      >
                        <Home size={14} />
                        Admin
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="text-gray-600" />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-white font-medium">
                        {activeTab === "dashboard" && "Dashboard"}
                        {activeTab === "users" && "User Management"}
                        {activeTab === "requests" && "Transaction Requests"}
                        {activeTab === "referrals" && "Referral Stats"}
                        {activeTab === "games" && "Game Activity"}
                        {activeTab === "notifications" && "Alert History"}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <p className="text-gray-500 text-xs">GoLucky Management Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={notificationsEnabled ? undefined : requestNotificationPermission}
                className={`${notificationsEnabled ? 'text-teal-400' : 'text-gray-500'} hover:text-white`}
                title={notificationsEnabled ? 'Browser notifications enabled' : 'Click to enable browser notifications'}
              >
                {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
              </Button>
              <div className="flex items-center border-r border-gray-600 pr-2 mr-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => playNotificationSound('deposit')}
                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 text-xs px-2"
                  title="Test deposit sound"
                >
                  <Play size={12} className="mr-1" />
                  Deposit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => playNotificationSound('withdrawal')}
                  className="text-amber-400 hover:text-amber-300 hover:bg-amber-900/30 text-xs px-2"
                  title="Test withdrawal sound"
                >
                  <Play size={12} className="mr-1" />
                  Withdraw
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => playNotificationSound('alert')}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 text-xs px-2"
                  title="Test alert sound"
                >
                  <Play size={12} className="mr-1" />
                  Alert
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`${soundEnabled ? 'text-teal-400' : 'text-gray-500'} hover:text-white`}
                title={soundEnabled ? 'Sound notifications enabled' : 'Sound notifications disabled'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadData}
                className="text-gray-400 hover:text-white"
              >
                <RefreshCw size={16} />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-4 max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-6 mt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    icon={Users}
                    label="Total Users"
                    value={stats?.totalUsers || 0}
                subValue={`+${stats?.todayNewUsers || 0} today`}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <StatCard
                icon={DollarSign}
                label="Total Deposits"
                value={`৳${(stats?.totalDeposits || 0).toLocaleString()}`}
                color="bg-gradient-to-br from-green-500 to-emerald-600"
              />
              <StatCard
                icon={Wallet}
                label="Total Withdrawals"
                value={`৳${(stats?.totalWithdrawals || 0).toLocaleString()}`}
                color="bg-gradient-to-br from-orange-500 to-red-600"
              />
              <StatCard
                icon={Clock}
                label="Pending Requests"
                value={stats?.pendingRequests || 0}
                color="bg-gradient-to-br from-yellow-500 to-amber-600"
              />
              <StatCard
                icon={Activity}
                label="Today's Bets"
                value={`৳${(stats?.todayBets || 0).toLocaleString()}`}
                color="bg-gradient-to-br from-purple-500 to-violet-600"
              />
              <StatCard
                icon={UserPlus}
                label="Total Referrals"
                value={stats?.totalReferrals || 0}
                color="bg-gradient-to-br from-pink-500 to-rose-600"
              />
              <StatCard
                icon={Award}
                label="Active Users (7d)"
                value={stats?.activeUsers7d || 0}
                color="bg-gradient-to-br from-teal-500 to-cyan-600"
              />
              <StatCard
                icon={TrendingUp}
                label="Net Revenue"
                value={`৳${((stats?.totalDeposits || 0) - (stats?.totalWithdrawals || 0)).toLocaleString()}`}
                color="bg-gradient-to-br from-indigo-500 to-blue-600"
              />
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => navigate("/admin/game-launch-notifications")}
                className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-4 text-left hover:scale-[1.02] transition-all shadow-lg"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-bold">Game Launch</span>
                </div>
                <p className="text-white/70 text-xs">Manage subscriber notifications</p>
              </button>
              <button
                onClick={() => navigate("/admin/crash-game")}
                className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl p-4 text-left hover:scale-[1.02] transition-all shadow-lg"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-bold">Crash Game</span>
                </div>
                <p className="text-white/70 text-xs">Manage crash game settings</p>
              </button>
              <button
                onClick={() => navigate("/admin")}
                className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-4 text-left hover:scale-[1.02] transition-all shadow-lg"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    🖼️
                  </div>
                  <span className="text-white font-bold">Banners</span>
                </div>
                <p className="text-white/70 text-xs">Manage home & activity banners</p>
              </button>
              <button
                onClick={() => navigate("/admin/notifications")}
                className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-4 text-left hover:scale-[1.02] transition-all shadow-lg"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-bold">Email Alerts</span>
                </div>
                <p className="text-white/70 text-xs">Configure email digest settings</p>
              </button>
              <button
                onClick={() => navigate("/admin/payout-audit")}
                className="bg-gradient-to-br from-rose-500 to-red-600 rounded-xl p-4 text-left hover:scale-[1.02] transition-all shadow-lg"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-bold">Payout Audit</span>
                </div>
                <p className="text-white/70 text-xs">Monitor large payouts ৳10,000+</p>
              </button>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Transaction Stats Chart */}
              <TransactionStatsChart />
              
              {/* User Registration Chart */}
              <UserRegistrationChart />
            </div>

            {/* User Retention Chart - Full Width */}
            <UserRetentionChart />

            {/* Charts Row - Game Revenue & VIP Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GameRevenueChart />
              <VIPDistributionChart />
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Clock size={18} />
                Recent Pending Requests
              </h3>
              <div className="space-y-2">
                {requests.filter(r => r.status === "pending").slice(0, 5).map(req => (
                  <div key={req.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={req.type === "deposit" ? "default" : "destructive"}>
                        {req.type}
                      </Badge>
                      <span className="text-white">৳{req.amount.toLocaleString()}</span>
                      <span className="text-gray-400 text-sm">
                        {req.profile?.username || req.profile?.phone || "Unknown"}
                      </span>
                    </div>
                    <span className="text-gray-500 text-xs">
                      {format(new Date(req.created_at), "MMM d, HH:mm")}
                    </span>
                  </div>
                ))}
                {requests.filter(r => r.status === "pending").length === 0 && (
                  <p className="text-gray-500 text-center py-4">No pending requests</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search by username, phone, or referral code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 ${
                      (vipRange.min || vipRange.max) ? 'border-primary text-primary' : ''
                    }`}
                  >
                    <Award size={16} className="mr-1" />
                    {vipRange.min && vipRange.max ? (
                      `VIP ${vipRange.min}-${vipRange.max}`
                    ) : vipRange.min ? (
                      `VIP ≥${vipRange.min}`
                    ) : vipRange.max ? (
                      `VIP ≤${vipRange.max}`
                    ) : (
                      "VIP Level"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-gray-800 border-gray-700" align="start">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white">VIP Level Range</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setVipRange({ min: "1", max: "3" })}
                      >
                        Low (1-3)
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setVipRange({ min: "4", max: "6" })}
                      >
                        Mid (4-6)
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setVipRange({ min: "7", max: "10" })}
                      >
                        High (7-10)
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-1 block">Min</label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          placeholder="1"
                          value={vipRange.min}
                          onChange={(e) => setVipRange(prev => ({ ...prev, min: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white h-8 text-sm"
                        />
                      </div>
                      <span className="text-gray-500 mt-5">-</span>
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-1 block">Max</label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          placeholder="10"
                          value={vipRange.max}
                          onChange={(e) => setVipRange(prev => ({ ...prev, max: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white h-8 text-sm"
                        />
                      </div>
                    </div>
                    {(vipRange.min || vipRange.max) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-red-400 hover:text-red-300"
                        onClick={() => setVipRange({ min: "", max: "" })}
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 ${
                      (joinDateRange.from || joinDateRange.to) ? 'border-primary text-primary' : ''
                    }`}
                  >
                    <Calendar size={16} className="mr-1" />
                    {joinDateRange.from && joinDateRange.to ? (
                      `${format(joinDateRange.from, "MMM d")} - ${format(joinDateRange.to, "MMM d")}`
                    ) : joinDateRange.from ? (
                      `From ${format(joinDateRange.from, "MMM d")}`
                    ) : joinDateRange.to ? (
                      `Until ${format(joinDateRange.to, "MMM d")}`
                    ) : (
                      "Join Date"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                  <div className="p-2 border-b border-gray-700">
                    <div className="flex gap-1 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setJoinDateRange({ from: subDays(new Date(), 7), to: new Date() })}
                      >
                        Last 7 days
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setJoinDateRange({ from: subDays(new Date(), 30), to: new Date() })}
                      >
                        Last 30 days
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setJoinDateRange({ from: subDays(new Date(), 90), to: new Date() })}
                      >
                        Last 90 days
                      </Button>
                      {(joinDateRange.from || joinDateRange.to) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-400 hover:text-red-300"
                          onClick={() => setJoinDateRange({ from: undefined, to: undefined })}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  <CalendarComponent
                    mode="range"
                    selected={{ from: joinDateRange.from, to: joinDateRange.to }}
                    onSelect={(range) => setJoinDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={1}
                    className="bg-gray-800 text-white"
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 ${
                      (lastActiveRange.from || lastActiveRange.to) ? 'border-primary text-primary' : ''
                    }`}
                  >
                    <Activity size={16} className="mr-1" />
                    {lastActiveRange.from && lastActiveRange.to ? (
                      `${format(lastActiveRange.from, "MMM d")} - ${format(lastActiveRange.to, "MMM d")}`
                    ) : lastActiveRange.from ? (
                      `From ${format(lastActiveRange.from, "MMM d")}`
                    ) : lastActiveRange.to ? (
                      `Until ${format(lastActiveRange.to, "MMM d")}`
                    ) : (
                      "Last Active"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                  <div className="p-2 border-b border-gray-700">
                    <div className="flex gap-1 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setLastActiveRange({ from: subDays(new Date(), 7), to: new Date() })}
                      >
                        Active (7d)
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setLastActiveRange({ from: undefined, to: subDays(new Date(), 7) })}
                      >
                        Inactive (7d+)
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setLastActiveRange({ from: undefined, to: subDays(new Date(), 30) })}
                      >
                        Inactive (30d+)
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setLastActiveRange({ from: undefined, to: subDays(new Date(), 90) })}
                      >
                        Inactive (90d+)
                      </Button>
                      {(lastActiveRange.from || lastActiveRange.to) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-400 hover:text-red-300"
                          onClick={() => setLastActiveRange({ from: undefined, to: undefined })}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  <CalendarComponent
                    mode="range"
                    selected={{ from: lastActiveRange.from, to: lastActiveRange.to }}
                    onSelect={(range) => setLastActiveRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={1}
                    className="bg-gray-800 text-white pointer-events-auto"
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 ${
                      (balanceRange.min || balanceRange.max) ? 'border-primary text-primary' : ''
                    }`}
                  >
                    <Wallet size={16} className="mr-1" />
                    {balanceRange.min && balanceRange.max ? (
                      `৳${balanceRange.min} - ৳${balanceRange.max}`
                    ) : balanceRange.min ? (
                      `≥ ৳${balanceRange.min}`
                    ) : balanceRange.max ? (
                      `≤ ৳${balanceRange.max}`
                    ) : (
                      "Balance"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-gray-800 border-gray-700" align="start">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white">Balance Range</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setBalanceRange({ min: "0", max: "100" })}
                      >
                        Low (0-100)
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setBalanceRange({ min: "1000", max: "" })}
                      >
                        High (1K+)
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setBalanceRange({ min: "10000", max: "" })}
                      >
                        Whale (10K+)
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-1 block">Min</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={balanceRange.min}
                          onChange={(e) => setBalanceRange(prev => ({ ...prev, min: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white h-8 text-sm"
                        />
                      </div>
                      <span className="text-gray-500 mt-5">-</span>
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-1 block">Max</label>
                        <Input
                          type="number"
                          placeholder="∞"
                          value={balanceRange.max}
                          onChange={(e) => setBalanceRange(prev => ({ ...prev, max: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white h-8 text-sm"
                        />
                      </div>
                    </div>
                    {(balanceRange.min || balanceRange.max) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-red-400 hover:text-red-300"
                        onClick={() => setBalanceRange({ min: "", max: "" })}
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <Select value={adminFilter} onValueChange={(v: "all" | "admin" | "regular") => setAdminFilter(v)}>
                <SelectTrigger className={`w-36 bg-gray-800 border-gray-700 text-white ${adminFilter !== "all" ? "border-primary text-primary" : ""}`}>
                  <Shield size={14} className="mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin">Admins Only</SelectItem>
                  <SelectItem value="regular">Regular Users</SelectItem>
                </SelectContent>
              </Select>
              <Select value={profitFilter} onValueChange={(v: "all" | "profit" | "loss" | "breakeven") => setProfitFilter(v)}>
                <SelectTrigger className={`w-40 bg-gray-800 border-gray-700 text-white ${profitFilter !== "all" ? "border-primary text-primary" : ""}`}>
                  <TrendingUp size={14} className="mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All P/L</SelectItem>
                  <SelectItem value="profit">
                    <span className="text-green-400">Profitable</span>
                  </SelectItem>
                  <SelectItem value="loss">
                    <span className="text-red-400">At Loss</span>
                  </SelectItem>
                  <SelectItem value="breakeven">Break-even</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 ${
                      (wageredRange.min || wageredRange.max) ? 'border-primary text-primary' : ''
                    }`}
                  >
                    <Gamepad2 size={16} className="mr-1" />
                    {wageredRange.min && wageredRange.max ? (
                      `৳${wageredRange.min} - ৳${wageredRange.max}`
                    ) : wageredRange.min ? (
                      `≥ ৳${wageredRange.min}`
                    ) : wageredRange.max ? (
                      `≤ ৳${wageredRange.max}`
                    ) : (
                      "Wagered"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-gray-800 border-gray-700" align="start">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white">Total Wagered Range</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setWageredRange({ min: "1000", max: "" })}
                      >
                        Active (1K+)
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setWageredRange({ min: "10000", max: "" })}
                      >
                        High (10K+)
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setWageredRange({ min: "100000", max: "" })}
                      >
                        Whale (100K+)
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-1 block">Min</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={wageredRange.min}
                          onChange={(e) => setWageredRange(prev => ({ ...prev, min: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white h-8 text-sm"
                        />
                      </div>
                      <span className="text-gray-500 mt-5">-</span>
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-1 block">Max</label>
                        <Input
                          type="number"
                          placeholder="∞"
                          value={wageredRange.max}
                          onChange={(e) => setWageredRange(prev => ({ ...prev, max: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white h-8 text-sm"
                        />
                      </div>
                    </div>
                    {(wageredRange.min || wageredRange.max) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-red-400 hover:text-red-300"
                        onClick={() => setWageredRange({ min: "", max: "" })}
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 ${
                      (referralRange.min || referralRange.max) ? 'border-primary text-primary' : ''
                    }`}
                  >
                    <UserPlus size={16} className="mr-1" />
                    {referralRange.min && referralRange.max ? (
                      `${referralRange.min}-${referralRange.max} refs`
                    ) : referralRange.min ? (
                      `≥${referralRange.min} refs`
                    ) : referralRange.max ? (
                      `≤${referralRange.max} refs`
                    ) : (
                      "Referrals"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-gray-800 border-gray-700" align="start">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white">Referral Count Range</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setReferralRange({ min: "1", max: "" })}
                      >
                        Has Refs (1+)
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setReferralRange({ min: "5", max: "" })}
                      >
                        Active (5+)
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setReferralRange({ min: "10", max: "" })}
                      >
                        Top (10+)
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-1 block">Min</label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={referralRange.min}
                          onChange={(e) => setReferralRange(prev => ({ ...prev, min: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white h-8 text-sm"
                        />
                      </div>
                      <span className="text-gray-500 mt-5">-</span>
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-1 block">Max</label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="∞"
                          value={referralRange.max}
                          onChange={(e) => setReferralRange(prev => ({ ...prev, max: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white h-8 text-sm"
                        />
                      </div>
                    </div>
                    {(referralRange.min || referralRange.max) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-red-400 hover:text-red-300"
                        onClick={() => setReferralRange({ min: "", max: "" })}
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {/* Win Rate Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-gray-600 ${winRateRange.min || winRateRange.max ? 'border-cyan-500 text-cyan-400' : 'text-gray-300'} hover:text-white hover:bg-gray-700`}
                  >
                    <TrendingUp size={16} className="mr-1" />
                    {winRateRange.min || winRateRange.max ? (
                      `${winRateRange.min || '0'}% - ${winRateRange.max || '∞'}%`
                    ) : (
                      "Win Rate"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-gray-800 border-gray-700" align="start">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white">Win Rate % Range</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setWinRateRange({ min: "100", max: "" })}
                      >
                        Profitable (100%+)
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setWinRateRange({ min: "", max: "80" })}
                      >
                        Losing (&lt;80%)
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setWinRateRange({ min: "150", max: "" })}
                      >
                        High Win (150%+)
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-1 block">Min %</label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={winRateRange.min}
                          onChange={(e) => setWinRateRange(prev => ({ ...prev, min: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white h-8 text-sm"
                        />
                      </div>
                      <span className="text-gray-500 mt-5">-</span>
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-1 block">Max %</label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="∞"
                          value={winRateRange.max}
                          onChange={(e) => setWinRateRange(prev => ({ ...prev, max: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white h-8 text-sm"
                        />
                      </div>
                    </div>
                    {(winRateRange.min || winRateRange.max) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-red-400 hover:text-red-300"
                        onClick={() => setWinRateRange({ min: "", max: "" })}
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {/* Total Wins Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-gray-600 ${totalWinsRange.min || totalWinsRange.max ? 'border-emerald-500 text-emerald-400' : 'text-gray-300'} hover:text-white hover:bg-gray-700`}
                  >
                    <Award size={16} className="mr-1" />
                    {totalWinsRange.min || totalWinsRange.max ? (
                      `৳${totalWinsRange.min || '0'} - ৳${totalWinsRange.max || '∞'}`
                    ) : (
                      "Total Wins"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-gray-800 border-gray-700" align="start">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white">Total Wins Amount Range</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setTotalWinsRange({ min: "10000", max: "" })}
                      >
                        High (10K+)
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setTotalWinsRange({ min: "50000", max: "" })}
                      >
                        Very High (50K+)
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => setTotalWinsRange({ min: "", max: "1000" })}
                      >
                        Low (&lt;1K)
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-1 block">Min ৳</label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={totalWinsRange.min}
                          onChange={(e) => setTotalWinsRange(prev => ({ ...prev, min: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white h-8 text-sm"
                        />
                      </div>
                      <span className="text-gray-500 mt-5">-</span>
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-1 block">Max ৳</label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="∞"
                          value={totalWinsRange.max}
                          onChange={(e) => setTotalWinsRange(prev => ({ ...prev, max: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white h-8 text-sm"
                        />
                      </div>
                    </div>
                    {(totalWinsRange.min || totalWinsRange.max) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-red-400 hover:text-red-300"
                        onClick={() => setTotalWinsRange({ min: "", max: "" })}
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {/* Filter Presets */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    <Settings size={16} className="mr-1" />
                    Presets
                    {filterPresets.length > 0 && (
                      <Badge className="ml-1 bg-primary/20 text-primary text-xs px-1.5">{filterPresets.length}</Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 bg-gray-800 border-gray-700" align="end">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white">Filter Presets</p>
                    
                    {/* Saved Presets List */}
                    {filterPresets.length > 0 ? (
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {filterPresets.map(preset => (
                          <div key={preset.id} className="flex items-center gap-2 p-2 rounded-md bg-gray-700/50 hover:bg-gray-700 group">
                            {editingPresetId === preset.id ? (
                              <>
                                <Input
                                  value={editingPresetName}
                                  onChange={(e) => setEditingPresetName(e.target.value)}
                                  className="h-6 text-sm bg-gray-600 border-gray-500 text-white flex-1"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveRenamePreset();
                                    if (e.key === 'Escape') cancelRenamePreset();
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                  onClick={saveRenamePreset}
                                >
                                  <Check size={12} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-300 hover:bg-gray-500/10"
                                  onClick={cancelRenamePreset}
                                >
                                  <X size={12} />
                                </Button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => applyPreset(preset)}
                                  className="flex-1 text-left text-sm text-gray-200 hover:text-white truncate"
                                >
                                  {preset.name}
                                </button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startRenamePreset(preset);
                                  }}
                                >
                                  <Pencil size={12} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    duplicatePreset(preset);
                                  }}
                                >
                                  <Copy size={12} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deletePreset(preset.id);
                                  }}
                                >
                                  <X size={12} />
                                </Button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 py-2">No saved presets yet</p>
                    )}
                    
                    {/* Save New Preset */}
                    <div className="border-t border-gray-700 pt-3">
                      {showPresetSave ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="Preset name..."
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            className="bg-gray-700 border-gray-600 text-white h-8 text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && saveCurrentAsPreset()}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-1 text-xs text-gray-400"
                              onClick={() => { setShowPresetSave(false); setNewPresetName(""); }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 text-xs bg-primary hover:bg-primary/90"
                              onClick={saveCurrentAsPreset}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs border-gray-600 text-gray-300 hover:text-white"
                              onClick={() => setShowPresetSave(true)}
                              disabled={!(searchQuery || vipRange.min || vipRange.max || joinDateRange.from || joinDateRange.to || lastActiveRange.from || lastActiveRange.to || balanceRange.min || balanceRange.max || adminFilter !== "all" || profitFilter !== "all" || wageredRange.min || wageredRange.max || referralRange.min || referralRange.max)}
                            >
                              <Zap size={12} className="mr-1" />
                              Save Current Filters
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="bg-gray-900 border-gray-700 text-xs">
                            <p>Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300 font-mono">Ctrl+S</kbd> to save</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    
                    {/* Import/Export */}
                    <div className="border-t border-gray-700 pt-3 flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs border-gray-600 text-gray-300 hover:text-white"
                            onClick={exportPresets}
                            disabled={filterPresets.length === 0}
                          >
                            <Download size={12} className="mr-1" />
                            Export
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-gray-900 border-gray-700 text-xs">
                          <p>Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300 font-mono">Ctrl+E</kbd> to export</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label className="flex-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs border-gray-600 text-gray-300 hover:text-white"
                              asChild
                            >
                              <span>
                                <Send size={12} className="mr-1" />
                                Import
                              </span>
                            </Button>
                            <input
                              ref={importInputRef}
                              type="file"
                              accept=".json"
                              onChange={importPresets}
                              className="hidden"
                            />
                          </label>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-gray-900 border-gray-700 text-xs">
                          <p>Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300 font-mono">Ctrl+I</kbd> to import</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {(searchQuery || vipRange.min || vipRange.max || joinDateRange.from || joinDateRange.to || lastActiveRange.from || lastActiveRange.to || balanceRange.min || balanceRange.max || adminFilter !== "all" || profitFilter !== "all" || wageredRange.min || wageredRange.max || referralRange.min || referralRange.max || winRateRange.min || winRateRange.max || totalWinsRange.min || totalWinsRange.max) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X size={14} className="mr-1" />
                      Clear All
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-gray-900 border-gray-700 text-xs">
                    <p>Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300 font-mono">Ctrl+X</kbd> to clear</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {activeFilterCount > 0 && (
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                </Badge>
              )}
              <Badge variant="outline" className="text-gray-400">
                {filteredUsers.length} users
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const exportData: UserListExportItem[] = filteredUsers.map(u => ({
                    display_user_id: u.display_user_id,
                    username: u.username,
                    phone: u.phone,
                    balance: u.wallet?.balance || 0,
                    total_deposit: u.wallet?.total_deposit || 0,
                    total_withdraw: u.wallet?.total_withdraw || 0,
                    total_bet: u.wallet?.total_bet || 0,
                    total_win: u.wallet?.total_win || 0,
                    vip_level: u.vip_level,
                    vip_exp: u.vip_exp,
                    referral_code: u.referral_code,
                    is_admin: u.is_admin,
                    created_at: u.created_at,
                    last_active: u.last_active || null,
                  }));
                  exportUserList(exportData, searchQuery ? `filtered_${filteredUsers.length}` : `all_${filteredUsers.length}`);
                  toast.success(`Exported ${filteredUsers.length} users to CSV`);
                }}
                className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <Download size={16} className="mr-1" />
                Export CSV
              </Button>
            </div>

            {/* Bulk Action Bar */}
            {selectedUserIds.size > 0 && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary">{selectedUserIds.size} selected</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-gray-400 hover:text-white text-xs"
                  >
                    <X size={14} className="mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openBulkConfirmDialog("grant")}
                    disabled={isBulkProcessing}
                    className="text-xs border-green-600 text-green-400 hover:bg-green-600/20"
                  >
                    <Shield size={14} className="mr-1" />
                    Grant Admin
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openBulkConfirmDialog("revoke")}
                    disabled={isBulkProcessing}
                    className="text-xs border-red-600 text-red-400 hover:bg-red-600/20"
                  >
                    <Ban size={14} className="mr-1" />
                    Revoke Admin
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <Checkbox
                          checked={allOnPageSelected}
                          onCheckedChange={toggleSelectAllOnPage}
                          className="border-gray-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User ID</th>
                      <SortableHeader column="username" label="User" />
                      <SortableHeader column="balance" label="Balance" />
                      <SortableHeader column="deposit" label="Deposit/Withdraw" />
                      <SortableHeader column="wagered" label="Total Wagered" />
                      <SortableHeader column="totalWins" label="Total Wins" />
                      <SortableHeader column="netProfit" label="Net Profit" />
                      <SortableHeader column="winRate" label="Win Rate" />
                      <SortableHeader column="vip" label="VIP" />
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Referral Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Referral ID</th>
                      <SortableHeader column="referrals" label="Referrals" />
                      <SortableHeader column="joined" label="Joined" />
                      <SortableHeader column="lastActive" label="Last Active" />
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {paginatedUsers.map(user => (
                      <tr 
                        key={user.id} 
                        className={`hover:bg-gray-700/30 ${selectedUserIds.has(user.user_id) ? 'bg-primary/5' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedUserIds.has(user.user_id)}
                            onCheckedChange={() => toggleUserSelection(user.user_id)}
                            className="border-gray-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
                              {user.display_user_id || "—"}
                            </span>
                            {user.display_user_id && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(user.display_user_id || "");
                                  toast.success("User ID copied!");
                                }}
                                className="p-1 hover:bg-gray-700 rounded transition-colors"
                                title="Copy User ID"
                              >
                                <Copy size={12} className="text-gray-400 hover:text-white" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <button
                              onClick={() => setSelectedUserDetails(user)}
                              className="text-white font-medium hover:text-primary hover:underline cursor-pointer text-left"
                            >
                              {user.username || "Anonymous"}
                            </button>
                            <p className="text-gray-500 text-xs">{user.phone || "No phone"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-green-400 font-medium">
                            ৳{(user.wallet?.balance || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs">
                            <span className="text-green-400">↑ ৳{(user.wallet?.total_deposit || 0).toLocaleString()}</span>
                            <span className="text-gray-500 mx-1">/</span>
                            <span className="text-red-400">↓ ৳{(user.wallet?.total_withdraw || 0).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-orange-400 font-medium">
                            ৳{(user.wallet?.total_bet || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-emerald-400 font-medium">
                            ৳{(user.wallet?.total_win || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const netProfit = (user.wallet?.total_win || 0) - (user.wallet?.total_bet || 0);
                            return (
                              <span className={`font-medium ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {netProfit >= 0 ? '+' : ''}৳{netProfit.toLocaleString()}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const totalBet = user.wallet?.total_bet || 0;
                            const totalWin = user.wallet?.total_win || 0;
                            if (totalBet === 0) {
                              return <span className="text-gray-500 text-sm">-</span>;
                            }
                            const winRate = (totalWin / totalBet) * 100;
                            return (
                              <span className={`font-medium ${winRate >= 100 ? 'text-green-400' : winRate >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {winRate.toFixed(1)}%
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                            VIP {user.vip_level}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-teal-400 font-mono text-sm">{user.referral_code || "-"}</span>
                        </td>
                        <td className="px-4 py-3">
                          {user.display_referral_id ? (
                            <span className="text-cyan-400 font-mono text-xs bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
                              {user.display_referral_id}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {(user.referral_count || 0) > 0 ? (
                            <Badge variant="outline" className="border-purple-500 text-purple-400">
                              <UserPlus size={12} className="mr-1" />
                              {user.referral_count}
                            </Badge>
                          ) : (
                            <span className="text-gray-500 text-sm">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {format(new Date(user.created_at), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3">
                          {user.last_active ? (
                            <span className={`text-sm ${
                              new Date(user.last_active).getTime() > Date.now() - 24 * 60 * 60 * 1000
                                ? 'text-green-400'
                                : new Date(user.last_active).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
                                ? 'text-yellow-400'
                                : 'text-gray-500'
                            }`}>
                              {format(new Date(user.last_active), "MMM d, yyyy")}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(`/admin/user-history?userId=${user.user_id}`)}
                                    className="text-xs"
                                  >
                                    <History size={12} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View complete transaction & bet history</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant={user.is_admin ? "destructive" : "outline"}
                                    onClick={() => toggleAdmin(user.user_id, user.is_admin)}
                                    className="text-xs"
                                  >
                                    {user.is_admin ? <Ban size={12} /> : <Shield size={12} />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{user.is_admin ? "Remove admin privileges" : "Grant admin privileges"}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {filteredUsers.length > 0 && (
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    Showing {((usersPage - 1) * usersPerPage) + 1} - {Math.min(usersPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length}
                  </span>
                  <Select 
                    value={usersPerPage.toString()} 
                    onValueChange={(v) => { setUsersPerPage(Number(v)); setUsersPage(1); }}
                  >
                    <SelectTrigger className="w-[80px] h-8 bg-gray-800 border-gray-700 text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-gray-500">per page</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUsersPage(1)}
                    disabled={usersPage === 1}
                    className="h-8 w-8 p-0 border-gray-700"
                  >
                    <ChevronsLeft size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                    disabled={usersPage === 1}
                    className="h-8 w-8 p-0 border-gray-700"
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <span className="px-3 text-sm text-gray-300">
                    Page {usersPage} of {totalUserPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUsersPage(p => Math.min(totalUserPages, p + 1))}
                    disabled={usersPage === totalUserPages}
                    className="h-8 w-8 p-0 border-gray-700"
                  >
                    <ChevronRight size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUsersPage(totalUserPages)}
                    disabled={usersPage === totalUserPages}
                    className="h-8 w-8 p-0 border-gray-700"
                  >
                    <ChevronsRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 flex-wrap">
                {/* User Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search user/UID..."
                    value={requestUserSearch}
                    onChange={(e) => setRequestUserSearch(e.target.value)}
                    className="pl-9 w-48 bg-gray-800 border-gray-700 text-white h-9"
                  />
                  {requestUserSearch && (
                    <button
                      onClick={() => setRequestUserSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <Select value={requestFilter} onValueChange={(v: typeof requestFilter) => { setRequestFilter(v); loadRequests(); }}>
                  <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={requestTypeFilter} onValueChange={(v: typeof requestTypeFilter) => { setRequestTypeFilter(v); loadRequests(); }}>
                  <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposits</SelectItem>
                    <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={requestPaymentFilter} onValueChange={(v: typeof requestPaymentFilter) => { setRequestPaymentFilter(v); loadRequests(); }}>
                  <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">
                      <span className="flex items-center gap-2">All Methods</span>
                    </SelectItem>
                    <SelectItem value="nagad">
                      <span className="flex items-center gap-2">
                        <img src={nagadLogo} alt="Nagad payment method" className="w-4 h-4 rounded object-contain bg-white" />
                        Nagad
                      </span>
                    </SelectItem>
                    <SelectItem value="bkash">
                      <span className="flex items-center gap-2">
                        <img src={bkashLogo} alt="bKash payment method" className="w-4 h-4 rounded object-contain bg-white" />
                        bKash
                      </span>
                    </SelectItem>
                    <SelectItem value="rocket">
                      <span className="flex items-center gap-2">
                        <span className="text-sm">🟣</span>
                        Rocket
                      </span>
                    </SelectItem>
                    <SelectItem value="upay">
                      <span className="flex items-center gap-2">
                        <span className="text-sm">🟢</span>
                        Upay
                      </span>
                    </SelectItem>
                    <SelectItem value="usdt">
                      <span className="flex items-center gap-2">
                        <img src={usdtLogo} alt="USDT payment method" className="w-4 h-4 rounded object-contain bg-white" />
                        USDT
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Date Range Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`border-gray-600 ${requestDateRange.from || requestDateRange.to ? 'border-primary text-primary' : 'text-gray-300'} hover:text-white hover:bg-gray-700`}
                    >
                      <Calendar size={16} className="mr-2" />
                      {requestDateRange.from && requestDateRange.to ? (
                        `${format(requestDateRange.from, "MMM d")} - ${format(requestDateRange.to, "MMM d")}`
                      ) : requestDateRange.from ? (
                        `From ${format(requestDateRange.from, "MMM d")}`
                      ) : requestDateRange.to ? (
                        `Until ${format(requestDateRange.to, "MMM d")}`
                      ) : (
                        "Date Range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                    <div className="p-3 border-b border-gray-700">
                      <p className="text-sm font-medium text-white mb-2">Quick Filters</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-gray-400 hover:text-white"
                          onClick={() => {
                            const today = new Date();
                            setRequestDateRange({ from: today, to: today });
                            loadRequests();
                          }}
                        >
                          Today
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-gray-400 hover:text-white"
                          onClick={() => {
                            const today = new Date();
                            const weekAgo = subDays(today, 7);
                            setRequestDateRange({ from: weekAgo, to: today });
                            loadRequests();
                          }}
                        >
                          Last 7 Days
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-gray-400 hover:text-white"
                          onClick={() => {
                            const today = new Date();
                            const monthAgo = subDays(today, 30);
                            setRequestDateRange({ from: monthAgo, to: today });
                            loadRequests();
                          }}
                        >
                          Last 30 Days
                        </Button>
                      </div>
                    </div>
                    <CalendarComponent
                      mode="range"
                      selected={{ from: requestDateRange.from, to: requestDateRange.to }}
                      onSelect={(range) => {
                        setRequestDateRange({ from: range?.from, to: range?.to });
                        if (range?.from || range?.to) {
                          loadRequests();
                        }
                      }}
                      numberOfMonths={1}
                      className="bg-gray-800 text-white"
                    />
                    {(requestDateRange.from || requestDateRange.to) && (
                      <div className="p-2 border-t border-gray-700">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-red-400 hover:text-red-300"
                          onClick={() => {
                            setRequestDateRange({ from: undefined, to: undefined });
                            loadRequests();
                          }}
                        >
                          Clear Date Filter
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
                
                {/* Quick Date Filters */}
                <div className="flex items-center gap-1 bg-gray-700/50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      setRequestDateRange({ from: startOfDay(today), to: endOfDay(today) });
                      loadRequests();
                    }}
                    className={`h-7 px-2 text-xs ${
                      requestDateRange.from && requestDateRange.to && 
                      format(requestDateRange.from, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') &&
                      format(requestDateRange.to, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'text-gray-400 hover:text-white hover:bg-gray-600'
                    }`}
                  >
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const weekStart = startOfWeek(today, { weekStartsOn: 0 });
                      setRequestDateRange({ from: weekStart, to: endOfDay(today) });
                      loadRequests();
                    }}
                    className={`h-7 px-2 text-xs ${
                      requestDateRange.from && 
                      format(requestDateRange.from, 'yyyy-MM-dd') === format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd')
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'text-gray-400 hover:text-white hover:bg-gray-600'
                    }`}
                  >
                    This Week
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const monthStart = startOfMonth(today);
                      setRequestDateRange({ from: monthStart, to: endOfDay(today) });
                      loadRequests();
                    }}
                    className={`h-7 px-2 text-xs ${
                      requestDateRange.from && 
                      format(requestDateRange.from, 'yyyy-MM-dd') === format(startOfMonth(new Date()), 'yyyy-MM-dd')
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'text-gray-400 hover:text-white hover:bg-gray-600'
                    }`}
                  >
                    This Month
                  </Button>
                </div>
                
                {/* Amount Range Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`border-gray-600 ${requestAmountRange.min || requestAmountRange.max ? 'border-emerald-500 text-emerald-400' : 'text-gray-300'} hover:text-white hover:bg-gray-700`}
                    >
                      <DollarSign size={16} className="mr-1" />
                      {requestAmountRange.min && requestAmountRange.max ? (
                        `৳${requestAmountRange.min} - ৳${requestAmountRange.max}`
                      ) : requestAmountRange.min ? (
                        `≥ ৳${requestAmountRange.min}`
                      ) : requestAmountRange.max ? (
                        `≤ ৳${requestAmountRange.max}`
                      ) : (
                        "Amount"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 bg-gray-800 border-gray-700" align="start">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-white">Amount Range (৳)</p>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-gray-400 hover:text-white"
                          onClick={() => { setRequestAmountRange({ min: "100", max: "500" }); loadRequests(); }}
                        >
                          Small (100-500)
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-gray-400 hover:text-white"
                          onClick={() => { setRequestAmountRange({ min: "500", max: "2000" }); loadRequests(); }}
                        >
                          Medium (500-2K)
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-gray-400 hover:text-white"
                          onClick={() => { setRequestAmountRange({ min: "2000", max: "" }); loadRequests(); }}
                        >
                          Large (2K+)
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-gray-400 hover:text-white"
                          onClick={() => { setRequestAmountRange({ min: "10000", max: "" }); loadRequests(); }}
                        >
                          VIP (10K+)
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-gray-400 mb-1 block">Min</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={requestAmountRange.min}
                            onChange={(e) => setRequestAmountRange(prev => ({ ...prev, min: e.target.value }))}
                            onBlur={() => loadRequests()}
                            className="bg-gray-700 border-gray-600 text-white h-8 text-sm"
                          />
                        </div>
                        <span className="text-gray-500 mt-5">-</span>
                        <div className="flex-1">
                          <label className="text-xs text-gray-400 mb-1 block">Max</label>
                          <Input
                            type="number"
                            placeholder="∞"
                            value={requestAmountRange.max}
                            onChange={(e) => setRequestAmountRange(prev => ({ ...prev, max: e.target.value }))}
                            onBlur={() => loadRequests()}
                            className="bg-gray-700 border-gray-600 text-white h-8 text-sm"
                          />
                        </div>
                      </div>
                      {(requestAmountRange.min || requestAmountRange.max) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-red-400 hover:text-red-300"
                          onClick={() => { setRequestAmountRange({ min: "", max: "" }); loadRequests(); }}
                        >
                          Clear Amount Filter
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                
                {/* Transaction Filter Reset Button */}
                {(requestFilter !== "pending" || requestTypeFilter !== "all" || requestPaymentFilter !== "all" || requestDateRange.from || requestDateRange.to || requestAmountRange.min || requestAmountRange.max || requestUserSearch) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRequestFilter("pending");
                            setRequestTypeFilter("all");
                            setRequestPaymentFilter("all");
                            setRequestDateRange({ from: undefined, to: undefined });
                            setRequestAmountRange({ min: "", max: "" });
                            setRequestUserSearch("");
                            loadRequests();
                            toast.success("Filters reset");
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/30 border border-red-500/30"
                        >
                          <X size={14} className="mr-1" />
                          Reset
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Reset all transaction filters</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {/* Export CSV Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const filteredRequests = requests.filter(req => {
                            if (!requestUserSearch.trim()) return true;
                            const searchLower = requestUserSearch.toLowerCase().trim();
                            const username = (req.profile?.username || '').toLowerCase();
                            const phone = (req.profile?.phone || '').toLowerCase();
                            const displayUserId = (req.profile?.display_user_id || '').toLowerCase();
                            return username.includes(searchLower) || phone.includes(searchLower) || displayUserId.includes(searchLower);
                          });
                          
                          const exportData: TransactionRequestExportItem[] = filteredRequests.map(r => ({
                            id: r.id,
                            user_id: r.user_id,
                            username: r.profile?.username,
                            phone: r.profile?.phone,
                            type: r.type,
                            amount: r.amount,
                            status: r.status,
                            payment_method: r.payment_method,
                            payment_details: r.payment_details,
                            admin_notes: r.admin_notes,
                            created_at: r.created_at,
                            processed_at: r.processed_at,
                          }));
                          
                          let filterLabel = requestFilter !== 'pending' ? requestFilter : '';
                          if (requestTypeFilter !== 'all') filterLabel += `_${requestTypeFilter}`;
                          if (requestPaymentFilter !== 'all') filterLabel += `_${requestPaymentFilter}`;
                          if (requestUserSearch) filterLabel += `_${requestUserSearch.replace(/[^a-zA-Z0-9]/g, '_')}`;
                          
                          exportTransactionRequests(exportData, filterLabel || undefined);
                          toast.success(`Exported ${filteredRequests.length} requests to CSV`);
                        }}
                        className="border-gray-600 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20"
                        disabled={requests.length === 0}
                      >
                        <Download size={14} className="mr-1" />
                        Export
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Export filtered requests to CSV</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Sort Options */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                      <ArrowUpDown size={14} className="mr-1" />
                      Sort: {requestSortColumn === "date" ? "Date" : requestSortColumn === "amount" ? "Amount" : "Status"}
                      {requestSortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 bg-gray-800 border-gray-700 p-2" align="end">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 px-2 py-1">Sort By</p>
                      {[
                        { key: "date", label: "Date" },
                        { key: "amount", label: "Amount" },
                        { key: "status", label: "Status" },
                      ].map((option) => (
                        <Button
                          key={option.key}
                          variant="ghost"
                          size="sm"
                          className={`w-full justify-between text-sm ${
                            requestSortColumn === option.key ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white"
                          }`}
                          onClick={() => {
                            if (requestSortColumn === option.key) {
                              setRequestSortDirection(prev => prev === "asc" ? "desc" : "asc");
                            } else {
                              setRequestSortColumn(option.key as "date" | "amount" | "status");
                              setRequestSortDirection("desc");
                            }
                          }}
                        >
                          <span>{option.label}</span>
                          {requestSortColumn === option.key && (
                            requestSortDirection === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          )}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Badge variant="outline" className="text-gray-400">
                  {requestUserSearch 
                    ? `${requests.filter(req => {
                        const searchLower = requestUserSearch.toLowerCase().trim();
                        const username = (req.profile?.username || '').toLowerCase();
                        const phone = (req.profile?.phone || '').toLowerCase();
                        const displayUserId = (req.profile?.display_user_id || '').toLowerCase();
                        return username.includes(searchLower) || phone.includes(searchLower) || displayUserId.includes(searchLower);
                      }).length} / ${requests.length}`
                    : `${requests.length} requests`
                  }
                </Badge>
              </div>
              
              {/* Batch Selection Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAllPendingRequests}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {requests.filter(r => r.status === 'pending').every(r => selectedRequestIds.has(r.id)) && requests.filter(r => r.status === 'pending').length > 0
                    ? "Deselect All"
                    : "Select All Pending"
                  }
                </Button>
                {selectedRequestIds.size > 0 && (
                  <>
                    <Badge className="bg-primary text-primary-foreground">
                      {selectedRequestIds.size} selected
                    </Badge>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => openBatchRequestConfirm('approve')}
                      disabled={isProcessing}
                    >
                      <CheckCircle size={14} className="mr-1" />
                      Approve All
                      <kbd className="ml-1.5 px-1 py-0.5 text-[9px] font-semibold bg-green-900/50 border border-green-700/50 rounded">⇧A</kbd>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openBatchRequestConfirm('reject')}
                      disabled={isProcessing}
                    >
                      <XCircle size={14} className="mr-1" />
                      Reject All
                      <kbd className="ml-1.5 px-1 py-0.5 text-[9px] font-semibold bg-red-900/50 border border-red-700/50 rounded">⇧R</kbd>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearRequestSelection}
                      className="text-gray-400 hover:text-white"
                    >
                      <X size={14} />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {(() => {
              const filteredReqs = requests
                .filter(req => {
                  if (!requestUserSearch.trim()) return true;
                  const searchLower = requestUserSearch.toLowerCase().trim();
                  const username = (req.profile?.username || '').toLowerCase();
                  const phone = (req.profile?.phone || '').toLowerCase();
                  const displayUserId = (req.profile?.display_user_id || '').toLowerCase();
                  return username.includes(searchLower) || phone.includes(searchLower) || displayUserId.includes(searchLower);
                })
                .sort((a, b) => {
                  let comparison = 0;
                  switch (requestSortColumn) {
                    case "amount":
                      comparison = a.amount - b.amount;
                      break;
                    case "status":
                      const statusOrder = { pending: 0, approved: 1, rejected: 2 };
                      comparison = statusOrder[a.status] - statusOrder[b.status];
                      break;
                    case "date":
                    default:
                      comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                      break;
                  }
                  return requestSortDirection === "asc" ? comparison : -comparison;
                });
              const totalRequestPages = Math.ceil(filteredReqs.length / requestsPerPage);
              const startIdx = (requestsPage - 1) * requestsPerPage;
              const paginatedReqs = filteredReqs.slice(startIdx, startIdx + requestsPerPage);
              
              return (
                <>
                  <div className="space-y-3">
                    {paginatedReqs.map(req => (
                      <div 
                        key={req.id} 
                        className={`bg-gray-800 rounded-xl p-4 border transition-colors ${
                          selectedRequestIds.has(req.id) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {req.status === 'pending' && (
                              <Checkbox
                                checked={selectedRequestIds.has(req.id)}
                                onCheckedChange={() => toggleRequestSelection(req.id)}
                                className="border-gray-500 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                            )}
                            <Badge variant={req.type === "deposit" ? "default" : "destructive"} className="uppercase">
                              {req.type}
                            </Badge>
                            <span className="text-white text-xl font-bold">৳{req.amount.toLocaleString()}</span>
                            <div>
                              <p className="text-gray-300">{req.profile?.username || "Anonymous"}</p>
                              <div className="flex items-center gap-2">
                                {req.profile?.display_user_id && (
                                  <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                                    {req.profile.display_user_id}
                                  </span>
                                )}
                                <span className="text-gray-500 text-xs">{req.profile?.phone || "No phone"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className={
                                req.status === "pending" ? "border-yellow-500 text-yellow-500" :
                                req.status === "approved" ? "border-green-500 text-green-500" :
                                "border-red-500 text-red-500"
                              }
                            >
                              {req.status}
                            </Badge>
                            {req.status === "pending" && (
                              <div className="flex gap-2">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      disabled={isProcessing}
                                    >
                                      <CheckCircle size={14} />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-64 bg-gray-800 border-gray-700 p-4" side="top">
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 text-green-400">
                                        <CheckCircle size={18} />
                                        <span className="font-medium">Confirm Approval</span>
                                      </div>
                                      <p className="text-sm text-gray-300">
                                        Approve <span className="font-bold text-white">{req.type}</span> of <span className="font-bold text-green-400">৳{req.amount.toLocaleString()}</span> for {req.profile?.username || "Anonymous"}?
                                      </p>
                                      <div className="flex gap-2 justify-end">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            document.body.click();
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="bg-green-600 hover:bg-green-700"
                                          onClick={() => quickProcessRequest(req, "approve")}
                                          disabled={isProcessing}
                                        >
                                          {isProcessing ? "Processing..." : "Approve"}
                                        </Button>
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      disabled={isProcessing}
                                    >
                                      <XCircle size={14} />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-64 bg-gray-800 border-gray-700 p-4" side="top">
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 text-red-400">
                                        <XCircle size={18} />
                                        <span className="font-medium">Confirm Rejection</span>
                                      </div>
                                      <p className="text-sm text-gray-300">
                                        Reject <span className="font-bold text-white">{req.type}</span> of <span className="font-bold text-red-400">৳{req.amount.toLocaleString()}</span> for {req.profile?.username || "Anonymous"}?
                                      </p>
                                      <div className="flex gap-2 justify-end">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            document.body.click();
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => quickProcessRequest(req, "reject")}
                                          disabled={isProcessing}
                                        >
                                          {isProcessing ? "Processing..." : "Reject"}
                                        </Button>
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-gray-600 hover:bg-gray-700"
                                        onClick={() => setSelectedRequest(req)}
                                      >
                                        <Eye size={14} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View details & add notes</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1.5">
                            {getPaymentLogo(req.payment_method) ? (
                              <span className="flex items-center gap-1.5 bg-white rounded px-2 py-1">
                                <img 
                                  src={getPaymentLogo(req.payment_method)!} 
                                  alt={req.payment_method || ''} 
                                  className="w-4 h-4 object-contain"
                                />
                                <span className="capitalize">{req.payment_method}</span>
                              </span>
                            ) : (
                              <span>{req.payment_method || "Manual"}</span>
                            )}
                          </span>
                          <span>Created: {format(new Date(req.created_at), "MMM d, yyyy HH:mm")}</span>
                          {req.processed_at && (
                            <span>Processed: {format(new Date(req.processed_at), "MMM d, yyyy HH:mm")}</span>
                          )}
                          {req.admin_notes && (
                            <span>Notes: {req.admin_notes}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredReqs.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No requests found</p>
                    )}
                  </div>
                  
                  {/* Pagination */}
                  {totalRequestPages > 1 && (
                    <div className="mt-4 bg-gray-800 rounded-xl border border-gray-700">
                      <HistoryPagination
                        currentPage={requestsPage}
                        totalPages={totalRequestPages}
                        onPageChange={(page) => setRequestsPage(page)}
                        itemsPerPage={requestsPerPage}
                        totalItems={filteredReqs.length}
                      />
                    </div>
                  )}
                </>
              );
            })()}
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="space-y-4">
            <ReferralStats />
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-4">
            <AdminAgentManagement />
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games" className="space-y-4">
            <GameStats />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <NotificationHistoryTab 
              notifications={notificationHistory} 
              onMarkRead={handleMarkNotificationsRead}
              onAcknowledge={handleAcknowledgeAlert}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={bulkActionConfirm.open} onOpenChange={(open) => !open && closeBulkConfirmDialog()}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {bulkActionConfirm.action === "grant" ? (
                <Shield size={20} className="text-green-400" />
              ) : (
                <Ban size={20} className="text-red-400" />
              )}
              Confirm Bulk Action
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-gray-300">
              Are you sure you want to{" "}
              <span className={bulkActionConfirm.action === "grant" ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                {bulkActionConfirm.action === "grant" ? "grant admin privileges to" : "revoke admin privileges from"}
              </span>{" "}
              <span className="text-white font-bold">{selectedUserIds.size} user{selectedUserIds.size !== 1 ? "s" : ""}</span>?
            </p>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-2">Selected users:</p>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {Array.from(selectedUserIds).slice(0, 10).map(userId => {
                  const user = users.find(u => u.user_id === userId);
                  return (
                    <Badge key={userId} variant="secondary" className="text-xs">
                      {user?.username || userId.slice(0, 8)}
                    </Badge>
                  );
                })}
                {selectedUserIds.size > 10 && (
                  <Badge variant="outline" className="text-xs text-gray-400">
                    +{selectedUserIds.size - 10} more
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-xs text-yellow-500">
              ⚠️ This action will take effect immediately and cannot be undone easily.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={closeBulkConfirmDialog}
              className="border-gray-600"
              disabled={isBulkProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={executeBulkAction}
              disabled={isBulkProcessing}
              className={bulkActionConfirm.action === "grant" 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-red-600 hover:bg-red-700"
              }
            >
              {isBulkProcessing ? (
                <RefreshCw size={14} className="mr-1 animate-spin" />
              ) : bulkActionConfirm.action === "grant" ? (
                <Shield size={14} className="mr-1" />
              ) : (
                <Ban size={14} className="mr-1" />
              )}
              {bulkActionConfirm.action === "grant" ? "Grant Admin" : "Revoke Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Request Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Process {selectedRequest?.type} Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Payment Method with Large Logo */}
            {selectedRequest?.payment_method && (
              <div className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg">
                <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center overflow-hidden p-2 border border-gray-200 shadow-lg">
                  {getPaymentLogo(selectedRequest.payment_method) ? (
                    <img 
                      src={getPaymentLogo(selectedRequest.payment_method)!} 
                      alt={selectedRequest.payment_method} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Wallet className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-gray-400 text-sm">Payment Method</p>
                  <p className="text-xl font-bold text-white capitalize">{selectedRequest.payment_method}</p>
                </div>
              </div>
            )}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Amount</p>
              <p className="text-2xl font-bold text-white">৳{selectedRequest?.amount.toLocaleString()}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Admin Notes (optional)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes..."
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedRequest(null)}
              className="border-gray-600"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => processRequest("reject")}
              disabled={isProcessing}
              className="relative"
            >
              <XCircle size={16} className="mr-1" />
              Reject
              <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-red-900/50 border border-red-700/50 rounded opacity-70">R</kbd>
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 relative"
              onClick={() => processRequest("approve")}
              disabled={isProcessing}
            >
              <CheckCircle size={16} className="mr-1" />
              Approve
              <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-green-900/50 border border-green-700/50 rounded opacity-70">A</kbd>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Request Confirmation Dialog */}
      <Dialog open={batchRequestConfirm.open} onOpenChange={closeBatchRequestConfirm}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {batchRequestConfirm.action === 'approve' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              Confirm Batch {batchRequestConfirm.action === 'approve' ? 'Approval' : 'Rejection'}
            </DialogTitle>
          </DialogHeader>
          {(() => {
            const selectedPending = requests.filter(r => selectedRequestIds.has(r.id) && r.status === 'pending');
            const depositRequests = selectedPending.filter(r => r.type === 'deposit');
            const withdrawalRequests = selectedPending.filter(r => r.type === 'withdrawal');
            const totalDeposits = depositRequests.reduce((sum, r) => sum + r.amount, 0);
            const totalWithdrawals = withdrawalRequests.reduce((sum, r) => sum + r.amount, 0);
            const totalAmount = totalDeposits + totalWithdrawals;

            return (
              <div className="space-y-4 py-2">
                {/* Progress Indicator */}
                {batchProgress.isProcessing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300 flex items-center gap-2">
                        <RefreshCw size={14} className="animate-spin text-primary" />
                        Processing...
                      </span>
                      <span className="text-white font-bold">
                        {batchProgress.current} / {batchProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          batchRequestConfirm.action === 'approve' 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
                            : 'bg-gradient-to-r from-red-500 to-rose-400'
                        }`}
                        style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      {Math.round((batchProgress.current / batchProgress.total) * 100)}% complete
                    </p>
                  </div>
                )}

                {!batchProgress.isProcessing && (
                  <>
                    <div className={`p-4 rounded-lg border ${batchRequestConfirm.action === 'approve' ? 'bg-green-900/20 border-green-700/50' : 'bg-red-900/20 border-red-700/50'}`}>
                      <p className="text-gray-300 text-sm mb-2">You are about to {batchRequestConfirm.action} the following requests:</p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Total Requests</span>
                          <span className="text-xl font-bold text-white">{selectedPending.length}</span>
                        </div>
                        
                        {depositRequests.length > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Deposits ({depositRequests.length})</span>
                            <span className="font-semibold text-green-400">+৳{totalDeposits.toLocaleString()}</span>
                          </div>
                        )}
                        
                        {withdrawalRequests.length > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Withdrawals ({withdrawalRequests.length})</span>
                            <span className="font-semibold text-red-400">-৳{totalWithdrawals.toLocaleString()}</span>
                          </div>
                        )}
                        
                        <div className="border-t border-gray-600 pt-2 flex items-center justify-between">
                          <span className="text-gray-300 font-medium">Total Amount</span>
                          <span className="text-2xl font-bold text-white">৳{totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-400">
                      {batchRequestConfirm.action === 'approve' 
                        ? 'This will update user wallets and create transaction records for all approved requests.'
                        : 'This will mark all selected requests as rejected. No wallet changes will be made.'
                      }
                    </p>
                  </>
                )}
              </div>
            );
          })()}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={closeBatchRequestConfirm}
              className="border-gray-600"
              disabled={batchProgress.isProcessing}
            >
              Cancel
            </Button>
            {batchRequestConfirm.action === 'reject' ? (
              <Button
                variant="destructive"
                onClick={executeBatchProcess}
                disabled={isProcessing || batchProgress.isProcessing}
              >
                {batchProgress.isProcessing ? (
                  <>
                    <RefreshCw size={14} className="mr-1 animate-spin" />
                    {batchProgress.current}/{batchProgress.total}
                  </>
                ) : (
                  <>
                    <XCircle size={16} className="mr-1" />
                    Reject {requests.filter(r => selectedRequestIds.has(r.id) && r.status === 'pending').length} Requests
                  </>
                )}
              </Button>
            ) : (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={executeBatchProcess}
                disabled={isProcessing || batchProgress.isProcessing}
              >
                {batchProgress.isProcessing ? (
                  <>
                    <RefreshCw size={14} className="mr-1 animate-spin" />
                    {batchProgress.current}/{batchProgress.total}
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} className="mr-1" />
                    Approve {requests.filter(r => selectedRequestIds.has(r.id) && r.status === 'pending').length} Requests
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Modal */}
      <Dialog open={!!selectedUserDetails} onOpenChange={() => setSelectedUserDetails(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users size={20} className="text-primary" />
              User Details
            </DialogTitle>
          </DialogHeader>
          {selectedUserDetails && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                  <Users className="h-7 w-7 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold text-white">{selectedUserDetails.username || "Anonymous"}</p>
                  <p className="text-gray-400 text-sm">{selectedUserDetails.phone || "No phone"}</p>
                  {selectedUserDetails.display_user_id && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        {selectedUserDetails.display_user_id}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedUserDetails.display_user_id || "");
                          toast.success("User ID copied!");
                        }}
                        className="p-1 hover:bg-gray-600 rounded transition-colors"
                        title="Copy User ID"
                      >
                        <Copy size={12} className="text-gray-400 hover:text-white" />
                      </button>
                    </div>
                  )}
                </div>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                  VIP {selectedUserDetails.vip_level}
                </Badge>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-400">Balance</p>
                  <p className="text-lg font-bold text-green-400">
                    ৳{(selectedUserDetails.wallet?.balance || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-400">VIP EXP</p>
                  <p className="text-lg font-bold text-amber-400">
                    {selectedUserDetails.vip_exp.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-400">Total Deposits</p>
                  <p className="text-lg font-bold text-emerald-400">
                    ৳{(selectedUserDetails.wallet?.total_deposit || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-400">Total Withdrawals</p>
                  <p className="text-lg font-bold text-orange-400">
                    ৳{(selectedUserDetails.wallet?.total_withdraw || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-400">Total Bet</p>
                  <p className="text-lg font-bold text-blue-400">
                    ৳{(selectedUserDetails.wallet?.total_bet || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-400">Total Win</p>
                  <p className="text-lg font-bold text-green-400">
                    ৳{(selectedUserDetails.wallet?.total_win || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Activity Chart */}
              <UserActivityChart userId={selectedUserDetails.user_id} />

              {/* Additional Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Referral Code</span>
                  <span className="text-teal-400 font-mono">{selectedUserDetails.referral_code || "N/A"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Admin Status</span>
                  <Badge variant={selectedUserDetails.is_admin ? "default" : "secondary"}>
                    {selectedUserDetails.is_admin ? "Admin" : "User"}
                  </Badge>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Joined</span>
                  <span className="text-white">{format(new Date(selectedUserDetails.created_at), "PPP")}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Win Rate</span>
                  <span className={`font-bold ${
                    selectedUserDetails.wallet?.total_bet && selectedUserDetails.wallet.total_bet > 0
                      ? ((selectedUserDetails.wallet.total_win / selectedUserDetails.wallet.total_bet) * 100) > 100
                        ? 'text-red-400'
                        : 'text-green-400'
                      : 'text-gray-400'
                  }`}>
                    {selectedUserDetails.wallet?.total_bet && selectedUserDetails.wallet.total_bet > 0
                      ? `${((selectedUserDetails.wallet.total_win / selectedUserDetails.wallet.total_bet) * 100).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <DialogFooter className="gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedUserDetails(null)}
                  className="border-gray-600"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    navigate(`/admin/user-history?userId=${selectedUserDetails.user_id}`);
                    setSelectedUserDetails(null);
                  }}
                  className="bg-primary"
                >
                  <History size={16} className="mr-1" />
                  View Full History
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Help Modal */}
      <Dialog open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Keyboard className="w-5 h-5 text-primary" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Filter Presets</h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-300 text-sm">Save current filters as preset</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-200 bg-gray-700 border border-gray-600 rounded">Ctrl</kbd>
                    <span className="text-gray-500 mx-0.5">+</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-200 bg-gray-700 border border-gray-600 rounded">S</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-300 text-sm">Export filter presets</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-200 bg-gray-700 border border-gray-600 rounded">Ctrl</kbd>
                    <span className="text-gray-500 mx-0.5">+</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-200 bg-gray-700 border border-gray-600 rounded">E</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-300 text-sm">Import filter presets</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-200 bg-gray-700 border border-gray-600 rounded">Ctrl</kbd>
                    <span className="text-gray-500 mx-0.5">+</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-200 bg-gray-700 border border-gray-600 rounded">I</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-300 text-sm">Clear all filters</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-200 bg-gray-700 border border-gray-600 rounded">Ctrl</kbd>
                    <span className="text-gray-500 mx-0.5">+</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-200 bg-gray-700 border border-gray-600 rounded">X</kbd>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Request Processing</h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-300 text-sm">Approve selected request</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs font-semibold text-emerald-200 bg-emerald-900/50 border border-emerald-700 rounded">A</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-300 text-sm">Reject selected request</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs font-semibold text-rose-200 bg-rose-900/50 border border-rose-700 rounded">R</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-300 text-sm font-medium text-primary">Batch approve all selected</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs font-semibold text-emerald-200 bg-emerald-900/50 border border-emerald-700 rounded">⇧ Shift</kbd>
                    <span className="text-gray-500 mx-0.5">+</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-emerald-200 bg-emerald-900/50 border border-emerald-700 rounded">A</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-300 text-sm font-medium text-primary">Batch reject all selected</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs font-semibold text-rose-200 bg-rose-900/50 border border-rose-700 rounded">⇧ Shift</kbd>
                    <span className="text-gray-500 mx-0.5">+</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-rose-200 bg-rose-900/50 border border-rose-700 rounded">R</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-300 text-sm">Select next pending request</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-200 bg-gray-700 border border-gray-600 rounded">N</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-300 text-sm">Select previous pending request</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-200 bg-gray-700 border border-gray-600 rounded">P</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-300 text-sm">Deselect / Clear selection</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-200 bg-gray-700 border border-gray-600 rounded">Esc</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-300 text-sm font-medium text-amber-400">Undo last batch action</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs font-semibold text-amber-200 bg-amber-900/50 border border-amber-700 rounded">Ctrl</kbd>
                    <span className="text-gray-500 mx-0.5">+</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-amber-200 bg-amber-900/50 border border-amber-700 rounded">Z</kbd>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Navigation</h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-300 text-sm">Show this help dialog</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-200 bg-gray-700 border border-gray-600 rounded">Ctrl</kbd>
                    <span className="text-gray-500 mx-0.5">+</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-200 bg-gray-700 border border-gray-600 rounded">/</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-300 text-sm">Show this help dialog</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-200 bg-gray-700 border border-gray-600 rounded">?</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowShortcutsHelp(false)} 
              className="bg-primary hover:bg-primary/90"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Shortcuts Help Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowShortcutsHelp(true)}
            className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gray-800 border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 shadow-lg z-50"
          >
            <Keyboard className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Keyboard Shortcuts (Ctrl+/ or ?)</p>
        </TooltipContent>
        </Tooltip>
      </SidebarInset>
    </div>
  </SidebarProvider>
  );
};

// Referral Statistics Component
const ReferralStats = () => {
  const [referralData, setReferralData] = useState<{
    topReferrers: Array<{ username: string; referral_code: string; count: number; commission: number }>;
    totalCommission: number;
  } | null>(null);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    // Get profiles with referral counts
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, referral_code, referred_by");

    const referrerCounts: Record<string, { username: string; code: string; count: number }> = {};
    
    profiles?.forEach(p => {
      if (p.referred_by) {
        const referrer = profiles.find(pr => pr.id === p.referred_by);
        if (referrer) {
          if (!referrerCounts[referrer.id]) {
            referrerCounts[referrer.id] = { 
              username: referrer.username || "Anonymous", 
              code: referrer.referral_code || "", 
              count: 0 
            };
          }
          referrerCounts[referrer.id].count++;
        }
      }
    });

    // Get commissions
    const { data: commissions } = await supabase
      .from("referral_commissions")
      .select("referrer_id, commission_amount");

    const commissionByReferrer: Record<string, number> = {};
    let totalCommission = 0;
    commissions?.forEach(c => {
      commissionByReferrer[c.referrer_id] = (commissionByReferrer[c.referrer_id] || 0) + c.commission_amount;
      totalCommission += c.commission_amount;
    });

    const topReferrers = Object.entries(referrerCounts)
      .map(([id, data]) => ({
        username: data.username,
        referral_code: data.code,
        count: data.count,
        commission: commissionByReferrer[id] || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setReferralData({ topReferrers, totalCommission });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Commission Paid</p>
          <p className="text-2xl font-bold text-green-400">৳{(referralData?.totalCommission || 0).toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Top Referrers</p>
          <p className="text-2xl font-bold text-white">{referralData?.topReferrers.length || 0}</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold">Top Referrers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Referrals</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {referralData?.topReferrers.map((r, i) => (
                <tr key={i} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 text-white">{r.username}</td>
                  <td className="px-4 py-3 text-teal-400 font-mono">{r.referral_code}</td>
                  <td className="px-4 py-3 text-white font-medium">{r.count}</td>
                  <td className="px-4 py-3 text-green-400">৳{r.commission.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Game Statistics Component
const GameStats = () => {
  const [gameData, setGameData] = useState<{
    totalBets: number;
    totalWagered: number;
    totalWon: number;
    byGame: Record<string, { bets: number; wagered: number; won: number }>;
  } | null>(null);

  useEffect(() => {
    loadGameData();
  }, []);

  const loadGameData = async () => {
    const { data: bets } = await supabase
      .from("game_bets")
      .select("game_type, bet_amount, payout, status");

    const byGame: Record<string, { bets: number; wagered: number; won: number }> = {};
    let totalBets = 0;
    let totalWagered = 0;
    let totalWon = 0;

    bets?.forEach(b => {
      const game = b.game_type || "unknown";
      if (!byGame[game]) {
        byGame[game] = { bets: 0, wagered: 0, won: 0 };
      }
      byGame[game].bets++;
      byGame[game].wagered += b.bet_amount || 0;
      byGame[game].won += b.payout || 0;
      
      totalBets++;
      totalWagered += b.bet_amount || 0;
      totalWon += b.payout || 0;
    });

    setGameData({ totalBets, totalWagered, totalWon, byGame });
  };

  const gameNames: Record<string, string> = {
    wingo: "Win Go",
    k3: "K3",
    fiveD: "5D",
    trxWin: "TRX Win",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Bets</p>
          <p className="text-2xl font-bold text-white">{(gameData?.totalBets || 0).toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Wagered</p>
          <p className="text-2xl font-bold text-blue-400">৳{(gameData?.totalWagered || 0).toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Won</p>
          <p className="text-2xl font-bold text-green-400">৳{(gameData?.totalWon || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold">Stats by Game</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Game</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Bets</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Wagered</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Won</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">House Edge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {Object.entries(gameData?.byGame || {}).map(([game, stats]) => (
                <tr key={game} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-white font-medium">{gameNames[game] || game}</td>
                  <td className="px-4 py-3 text-white">{stats.bets.toLocaleString()}</td>
                  <td className="px-4 py-3 text-blue-400">৳{stats.wagered.toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-400">৳{stats.won.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={stats.wagered > stats.won ? "text-green-400" : "text-red-400"}>
                      {stats.wagered > 0 ? ((1 - stats.won / stats.wagered) * 100).toFixed(1) : 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Notification History Component
const NotificationHistoryTab = ({ 
  notifications, 
  onMarkRead,
  onAcknowledge,
}: { 
  notifications: NotificationHistory[];
  onMarkRead: (ids: string[], isRead: boolean) => Promise<void>;
  onAcknowledge: (id: string) => Promise<void>;
}) => {
  const [typeFilter, setTypeFilter] = useState<"all" | "new_transaction_request" | "pending_requests_alert">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high" | "critical">("all");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<Date | undefined>(undefined);
  const [exportEndDate, setExportEndDate] = useState<Date | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [autoReadEnabled, setAutoReadEnabled] = useState(true);
  
  // Email digest state
  const [showDigestSettings, setShowDigestSettings] = useState(false);
  const [digestFrequency, setDigestFrequency] = useState<"none" | "daily" | "weekly">("none");
  const [digestEmail, setDigestEmail] = useState("");
  const [digestIncludeLow, setDigestIncludeLow] = useState(false);
  const [digestIncludeMedium, setDigestIncludeMedium] = useState(true);
  const [digestIncludeHigh, setDigestIncludeHigh] = useState(true);
  const [digestIncludeCritical, setDigestIncludeCritical] = useState(true);
  const [isSavingDigest, setIsSavingDigest] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSendingCriticalTest, setIsSendingCriticalTest] = useState(false);
  const [digestPreferenceId, setDigestPreferenceId] = useState<string | null>(null);
  const [digestTimezone, setDigestTimezone] = useState("UTC");
  const [digestPreferredHour, setDigestPreferredHour] = useState(9);
  const [instantCriticalAlerts, setInstantCriticalAlerts] = useState(true);
  
  const viewTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const notificationRefsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // Load digest preferences on mount
  useEffect(() => {
    const loadDigestPreferences = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('email_digest_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setDigestPreferenceId(data.id);
        setDigestFrequency(data.frequency as "none" | "daily" | "weekly");
        setDigestEmail(data.email || '');
        setDigestIncludeLow(data.include_low_priority || false);
        setDigestIncludeMedium(data.include_medium_priority !== false);
        setDigestIncludeHigh(data.include_high_priority !== false);
        setDigestIncludeCritical(data.include_critical_priority !== false);
        setDigestTimezone(data.timezone || 'UTC');
        setDigestPreferredHour(data.preferred_hour ?? 9);
        setInstantCriticalAlerts(data.instant_critical_alerts !== false);
      } else if (user.email) {
        setDigestEmail(user.email);
        // Try to detect user's timezone
        try {
          const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setDigestTimezone(detectedTz || 'UTC');
        } catch {
          setDigestTimezone('UTC');
        }
      }
    };
    loadDigestPreferences();
  }, []);

  const saveDigestPreferences = async () => {
    setIsSavingDigest(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const preferences = {
        user_id: user.id,
        email: digestEmail,
        frequency: digestFrequency,
        include_low_priority: digestIncludeLow,
        include_medium_priority: digestIncludeMedium,
        include_high_priority: digestIncludeHigh,
        include_critical_priority: digestIncludeCritical,
        timezone: digestTimezone,
        preferred_hour: digestPreferredHour,
        instant_critical_alerts: instantCriticalAlerts,
      };

      if (digestPreferenceId) {
        const { error } = await supabase
          .from('email_digest_preferences')
          .update(preferences)
          .eq('id', digestPreferenceId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('email_digest_preferences')
          .insert(preferences)
          .select('id')
          .single();
        if (error) throw error;
        if (data) setDigestPreferenceId(data.id);
      }

      toast.success("Email digest preferences saved!");
      setShowDigestSettings(false);
    } catch (error: unknown) {
      console.error("Error saving digest preferences:", error);
      toast.error("Failed to save preferences");
    }
    setIsSavingDigest(false);
  };

  const sendTestDigest = async () => {
    if (!digestEmail) {
      toast.error("Please enter an email address");
      return;
    }
    setIsSendingTest(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('send-email-digest', {
        body: { test_email: digestEmail, user_id: user.id }
      });

      if (error) throw error;
      toast.success("Test digest email sent!");
    } catch (error: unknown) {
      console.error("Error sending test digest:", error);
      toast.error("Failed to send test email");
    }
  };

  const sendTestCriticalAlert = async () => {
    if (!digestEmail) {
      toast.error("Please enter an email address first");
      return;
    }
    setIsSendingCriticalTest(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // First save preferences to ensure instant_critical_alerts is enabled
      if (!instantCriticalAlerts) {
        toast.error("Please enable instant critical alerts first");
        setIsSendingCriticalTest(false);
        return;
      }

      const { error } = await supabase.functions.invoke('send-instant-alert', {
        body: {
          notification_id: 'test-' + Date.now(),
          title: 'Test Critical Alert - ৳100,000 Withdrawal',
          message: 'This is a test critical alert to verify email delivery is working correctly.',
          priority: 'critical',
          notification_type: 'new_transaction_request',
          metadata: {
            type: 'withdraw',
            amount: 100000,
            payment_method: 'bkash',
            is_test: true,
          },
        },
      });

      if (error) throw error;
      toast.success("Test critical alert sent! Check your inbox.");
    } catch (error: unknown) {
      console.error("Error sending test critical alert:", error);
      toast.error("Failed to send test critical alert");
    }
    setIsSendingCriticalTest(false);
  };

  // Auto-mark as read after 3 seconds of viewing
  useEffect(() => {
    if (!autoReadEnabled) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-notification-id');
          if (!id) return;

          const notification = notifications.find(n => n.id === id);
          if (!notification || notification.is_read) return;

          if (entry.isIntersecting) {
            // Start timer when notification comes into view
            if (!viewTimersRef.current.has(id)) {
              const timer = setTimeout(() => {
                onMarkRead([id], true);
                viewTimersRef.current.delete(id);
              }, 3000);
              viewTimersRef.current.set(id, timer);
            }
          } else {
            // Clear timer when notification leaves view
            const timer = viewTimersRef.current.get(id);
            if (timer) {
              clearTimeout(timer);
              viewTimersRef.current.delete(id);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    // Observe all notification elements
    notificationRefsRef.current.forEach((el) => {
      if (el) observerRef.current?.observe(el);
    });

    return () => {
      // Cleanup timers
      viewTimersRef.current.forEach((timer) => clearTimeout(timer));
      viewTimersRef.current.clear();
      observerRef.current?.disconnect();
    };
  }, [autoReadEnabled, notifications, onMarkRead]);

  const setNotificationRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      notificationRefsRef.current.set(id, el);
      observerRef.current?.observe(el);
    } else {
      const existing = notificationRefsRef.current.get(id);
      if (existing) {
        observerRef.current?.unobserve(existing);
        notificationRefsRef.current.delete(id);
      }
    }
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_transaction_request':
        return <DollarSign className="text-teal-400" size={18} />;
      case 'pending_requests_alert':
        return <Clock className="text-amber-400" size={18} />;
      default:
        return <Bell className="text-gray-400" size={18} />;
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'critical':
        return {
          border: 'border-l-red-500 ring-red-500/20',
          badge: 'bg-red-500/20 text-red-400 border-red-500/50',
          icon: '🚨',
          label: 'Critical'
        };
      case 'high':
        return {
          border: 'border-l-orange-500 ring-orange-500/20',
          badge: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
          icon: '⚠️',
          label: 'High'
        };
      case 'low':
        return {
          border: 'border-l-gray-500 ring-gray-500/20',
          badge: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
          icon: '',
          label: 'Low'
        };
      default: // medium
        return {
          border: 'border-l-blue-500 ring-blue-500/20',
          badge: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
          icon: '',
          label: 'Medium'
        };
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_transaction_request':
        return 'border-l-teal-500 bg-teal-500/5';
      case 'pending_requests_alert':
        return 'border-l-amber-500 bg-amber-500/5';
      default:
        return 'border-l-gray-500 bg-gray-500/5';
    }
  };

  const formatType = (type: string) => {
    switch (type) {
      case 'new_transaction_request':
        return 'New Request';
      case 'pending_requests_alert':
        return 'Pending Alert';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    // Type filter
    if (typeFilter !== "all" && n.notification_type !== typeFilter) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== "all" && n.priority !== priorityFilter) {
      return false;
    }

    // Read filter
    if (readFilter === "unread" && n.is_read) return false;
    if (readFilter === "read" && !n.is_read) return false;

    // Date filter
    if (dateFilter !== "all") {
      const notifDate = new Date(n.created_at);
      const now = new Date();
      
      if (dateFilter === "today") {
        const today = startOfDay(now);
        if (notifDate < today) return false;
      } else if (dateFilter === "week") {
        const weekAgo = subDays(now, 7);
        if (notifDate < weekAgo) return false;
      } else if (dateFilter === "month") {
        const monthAgo = subDays(now, 30);
        if (notifDate < monthAgo) return false;
      } else if (dateFilter === "custom" && customStartDate && customEndDate) {
        const start = startOfDay(customStartDate);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (notifDate < start || notifDate > end) return false;
      }
    }

    return true;
  });

  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.is_read).length;
  const highCount = notifications.filter(n => n.priority === 'high' && !n.is_read).length;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkMarkRead = async (isRead: boolean) => {
    if (selectedIds.size === 0) return;
    await onMarkRead(Array.from(selectedIds), isRead);
    setSelectedIds(new Set());
  };

  // Handle CSV export
  const handleExport = () => {
    let dataToExport = notifications;
    
    // Apply date range filter for export
    if (exportStartDate && exportEndDate) {
      const start = startOfDay(exportStartDate);
      const end = new Date(exportEndDate);
      end.setHours(23, 59, 59, 999);
      
      dataToExport = notifications.filter(n => {
        const notifDate = new Date(n.created_at);
        return notifDate >= start && notifDate <= end;
      });
    }
    
    if (dataToExport.length === 0) {
      toast.error("No notifications to export in selected date range");
      return;
    }
    
    const exportData: NotificationExportItem[] = dataToExport.map(n => ({
      id: n.id,
      notification_type: n.notification_type,
      title: n.title,
      message: n.message,
      recipients: n.recipients,
      created_at: n.created_at
    }));
    
    exportNotificationHistory(exportData, exportStartDate, exportEndDate);
    toast.success(`Exported ${dataToExport.length} notifications to CSV`);
    setShowExportModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Type:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  typeFilter === "all" 
                    ? "bg-teal-500 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter("new_transaction_request")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  typeFilter === "new_transaction_request" 
                    ? "bg-teal-500 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                New Requests
              </button>
              <button
                onClick={() => setTypeFilter("pending_requests_alert")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  typeFilter === "pending_requests_alert" 
                    ? "bg-amber-500 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Pending Alerts
              </button>
            </div>
          </div>
          
          <div className="h-6 w-px bg-gray-700" />
          
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Date:</span>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setDateFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  dateFilter === "all" 
                    ? "bg-teal-500 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setDateFilter("today")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  dateFilter === "today" 
                    ? "bg-teal-500 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateFilter("week")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  dateFilter === "week" 
                    ? "bg-teal-500 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDateFilter("month")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  dateFilter === "month" 
                    ? "bg-teal-500 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Last 30 Days
              </button>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      dateFilter === "custom" 
                        ? "bg-teal-500 text-white" 
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    <Calendar size={12} />
                    Custom
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4 bg-gray-800 border-gray-700" align="start">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Start Date</label>
                      <CalendarComponent
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        className="rounded-md border border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">End Date</label>
                      <CalendarComponent
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        className="rounded-md border border-gray-700"
                      />
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-teal-500 hover:bg-teal-600"
                      onClick={() => {
                        if (customStartDate && customEndDate) {
                          setDateFilter("custom");
                        } else {
                          toast.error("Please select both start and end dates");
                        }
                      }}
                      disabled={!customStartDate || !customEndDate}
                    >
                      Apply Range
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-700" />

          {/* Read Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Status:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setReadFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  readFilter === "all" 
                    ? "bg-teal-500 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setReadFilter("unread")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                  readFilter === "unread" 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Circle size={10} />
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
              <button
                onClick={() => setReadFilter("read")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                  readFilter === "read" 
                    ? "bg-gray-500 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <CheckCheck size={12} />
                Read
              </button>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-700" />

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Priority:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPriorityFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  priorityFilter === "all" 
                    ? "bg-teal-500 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setPriorityFilter("critical")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                  priorityFilter === "critical" 
                    ? "bg-red-500 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                🚨 Critical {criticalCount > 0 && `(${criticalCount})`}
              </button>
              <button
                onClick={() => setPriorityFilter("high")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                  priorityFilter === "high" 
                    ? "bg-orange-500 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                ⚠️ High {highCount > 0 && `(${highCount})`}
              </button>
              <button
                onClick={() => setPriorityFilter("medium")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  priorityFilter === "medium" 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setPriorityFilter("low")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  priorityFilter === "low" 
                    ? "bg-gray-500 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Low
              </button>
            </div>
          </div>
          
          <div className="h-6 w-px bg-gray-700" />
          
          {/* Auto-read toggle */}
          <button
            onClick={() => setAutoReadEnabled(!autoReadEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
              autoReadEnabled 
                ? "bg-purple-500 text-white" 
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            title="Auto-mark as read after viewing for 3 seconds"
          >
            <Eye size={12} />
            Auto-read
          </button>
          
          <div className="h-6 w-px bg-gray-700 ml-auto" />
          
          {/* Export Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1"
          >
            <Download size={14} />
            Export CSV
          </button>
          
          {/* Email Digest Settings Button */}
          <button
            onClick={() => setShowDigestSettings(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
              digestFrequency !== 'none' 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Mail size={14} />
            Email Digest
            {digestFrequency !== 'none' && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px] uppercase">
                {digestFrequency}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Email Digest Settings Modal */}
      <Dialog open={showDigestSettings} onOpenChange={setShowDigestSettings}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail size={20} className="text-blue-400" />
              Email Digest Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <p className="text-gray-400 text-sm">
              Receive a summary of all notifications via email on a daily or weekly basis.
            </p>
            
            {/* Email Address */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Email Address</label>
              <Input
                type="email"
                value={digestEmail}
                onChange={(e) => setDigestEmail(e.target.value)}
                placeholder="admin@example.com"
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Frequency Selection */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Digest Frequency</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setDigestFrequency("none")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    digestFrequency === "none" 
                      ? "bg-gray-600 text-white ring-2 ring-gray-500" 
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Off
                </button>
                <button
                  onClick={() => setDigestFrequency("daily")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    digestFrequency === "daily" 
                      ? "bg-blue-600 text-white ring-2 ring-blue-500" 
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setDigestFrequency("weekly")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    digestFrequency === "weekly" 
                      ? "bg-blue-600 text-white ring-2 ring-blue-500" 
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Weekly
                </button>
              </div>
            </div>

            {/* Timezone and Time Selection */}
            {digestFrequency !== 'none' && (
              <div className="grid grid-cols-2 gap-4">
                {/* Timezone Selector */}
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Timezone</label>
                  <Select value={digestTimezone} onValueChange={setDigestTimezone}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                      {[
                        { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
                        { value: 'America/New_York', label: 'Eastern Time (US)' },
                        { value: 'America/Chicago', label: 'Central Time (US)' },
                        { value: 'America/Denver', label: 'Mountain Time (US)' },
                        { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
                        { value: 'Europe/London', label: 'London (GMT/BST)' },
                        { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
                        { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
                        { value: 'Asia/Dubai', label: 'Dubai (GST)' },
                        { value: 'Asia/Kolkata', label: 'India (IST)' },
                        { value: 'Asia/Dhaka', label: 'Bangladesh (BST)' },
                        { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
                        { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
                        { value: 'Asia/Shanghai', label: 'China (CST)' },
                        { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
                        { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
                      ].map((tz) => (
                        <SelectItem key={tz.value} value={tz.value} className="text-white hover:bg-gray-700">
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Selector */}
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">
                    Send at {digestFrequency === 'weekly' ? '(Mondays)' : '(Daily)'}
                  </label>
                  <Select value={digestPreferredHour.toString()} onValueChange={(v) => setDigestPreferredHour(parseInt(v))}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour12 = i === 0 ? 12 : i > 12 ? i - 12 : i;
                        const ampm = i < 12 ? 'AM' : 'PM';
                        return (
                          <SelectItem key={i} value={i.toString()} className="text-white hover:bg-gray-700">
                            {hour12}:00 {ampm}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Instant Critical Alerts */}
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Zap size={20} className="text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">Instant Critical Alerts</h4>
                    <p className="text-xs text-gray-400">
                      Get immediate email for critical alerts (can't wait for digest)
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={instantCriticalAlerts}
                    onChange={(e) => setInstantCriticalAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                </label>
              </div>
              {instantCriticalAlerts && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sendTestCriticalAlert}
                  disabled={isSendingCriticalTest || !digestEmail}
                  className="mt-3 w-full bg-red-900/30 border-red-500/50 text-red-400 hover:bg-red-900/50 hover:text-red-300"
                >
                  {isSendingCriticalTest ? (
                    <RefreshCw size={14} className="mr-2 animate-spin" />
                  ) : (
                    <Zap size={14} className="mr-2" />
                  )}
                  Send Test Critical Alert
                </Button>
              )}
            </div>

            {/* Priority Filters */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Include Priority Levels</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={digestIncludeCritical}
                    onChange={(e) => setDigestIncludeCritical(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm text-red-400">🚨 Critical</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={digestIncludeHigh}
                    onChange={(e) => setDigestIncludeHigh(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-orange-400">⚠️ High</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={digestIncludeMedium}
                    onChange={(e) => setDigestIncludeMedium(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-blue-400">Medium</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={digestIncludeLow}
                    onChange={(e) => setDigestIncludeLow(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-gray-500 focus:ring-gray-500"
                  />
                  <span className="text-sm text-gray-400">Low</span>
                </label>
              </div>
            </div>

            {/* Test Email Button */}
            <div className="pt-2 border-t border-gray-700">
              <Button
                variant="outline"
                className="w-full bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                onClick={sendTestDigest}
                disabled={isSendingTest || !digestEmail}
              >
                {isSendingTest ? (
                  <RefreshCw size={14} className="mr-2 animate-spin" />
                ) : (
                  <Send size={14} className="mr-2" />
                )}
                Send Test Email
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDigestSettings(false)} 
              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button 
              onClick={saveDigestPreferences}
              disabled={isSavingDigest || !digestEmail}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSavingDigest ? (
                <RefreshCw size={14} className="mr-2 animate-spin" />
              ) : (
                <Settings size={14} className="mr-2" />
              )}
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download size={20} className="text-emerald-400" />
              Export Notification History
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-gray-400 text-sm">
              Select a date range to export notifications. Leave empty to export all.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                      <Calendar size={14} className="mr-2" />
                      {exportStartDate ? format(exportStartDate, 'PP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                    <CalendarComponent
                      mode="single"
                      selected={exportStartDate}
                      onSelect={setExportStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-2 block">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                      <Calendar size={14} className="mr-2" />
                      {exportEndDate ? format(exportEndDate, 'PP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                    <CalendarComponent
                      mode="single"
                      selected={exportEndDate}
                      onSelect={setExportEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                onClick={() => {
                  const now = new Date();
                  setExportStartDate(subDays(now, 7));
                  setExportEndDate(now);
                }}
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                onClick={() => {
                  const now = new Date();
                  setExportStartDate(subDays(now, 30));
                  setExportEndDate(now);
                }}
              >
                Last 30 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                onClick={() => {
                  setExportStartDate(undefined);
                  setExportEndDate(undefined);
                }}
              >
                All Time
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportModal(false)} className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600">
              Cancel
            </Button>
            <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700">
              <Download size={14} className="mr-2" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-teal-900/30 rounded-xl p-3 border border-teal-700 flex items-center justify-between">
          <span className="text-teal-300 text-sm">
            {selectedIds.size} notification{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              onClick={() => handleBulkMarkRead(true)}
            >
              <CheckCheck size={14} className="mr-1" />
              Mark Read
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              onClick={() => handleBulkMarkRead(false)}
            >
              <Circle size={14} className="mr-1" />
              Mark Unread
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-white"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-white font-semibold">Alert History</h3>
          {filteredNotifications.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
            >
              {selectedIds.size === filteredNotifications.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
        <span className="text-gray-400 text-sm">
          {filteredNotifications.length} of {notifications.length} alerts
        </span>
      </div>

      {/* Empty State */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
          <History className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">
            {notifications.length === 0 ? "No Notifications Yet" : "No Matching Alerts"}
          </h3>
          <p className="text-gray-400 text-sm">
            {notifications.length === 0 
              ? "Notification history will appear here when alerts are sent."
              : "Try adjusting your filters to see more alerts."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const priorityStyles = getPriorityStyles(notification.priority);
            return (
            <div
              key={notification.id}
              ref={(el) => setNotificationRef(notification.id, el)}
              data-notification-id={notification.id}
              className={`bg-gray-800 rounded-xl p-4 border border-gray-700 border-l-4 ${priorityStyles.border} ${
                !notification.is_read ? `ring-1 ${priorityStyles.border.split(' ')[1]}` : ''
              } ${selectedIds.has(notification.id) ? 'ring-2 ring-teal-500' : ''} ${
                notification.priority === 'critical' ? 'animate-pulse' : ''
              } transition-all duration-300`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleSelect(notification.id)}
                  className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    selectedIds.has(notification.id)
                      ? 'bg-teal-500 border-teal-500'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  {selectedIds.has(notification.id) && (
                    <CheckCheck size={12} className="text-white" />
                  )}
                </button>
                
                <div className="mt-0.5">
                  {getNotificationIcon(notification.notification_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    {/* Priority Badge */}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${priorityStyles.badge}`}>
                      {priorityStyles.icon && <span className="mr-1">{priorityStyles.icon}</span>}
                      {priorityStyles.label}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                      {formatType(notification.notification_type)}
                    </span>
                    {!notification.is_read && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 flex items-center gap-1">
                        <Circle size={6} fill="currentColor" />
                        Unread
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <h4 className={`font-medium text-sm mb-1 ${notification.is_read ? 'text-gray-300' : 'text-white'}`}>
                    {priorityStyles.icon && notification.priority !== 'low' && notification.priority !== 'medium' && (
                      <span className="mr-1">{priorityStyles.icon}</span>
                    )}
                    {notification.title}
                  </h4>
                  {notification.message && (
                    <p className="text-gray-400 text-sm">{notification.message}</p>
                  )}
                  {notification.recipients && notification.recipients.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-500">Sent to:</span>
                      <div className="flex flex-wrap gap-1">
                        {notification.recipients.slice(0, 3).map((email, idx) => (
                          <span key={idx} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                            {email}
                          </span>
                        ))}
                        {notification.recipients.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{notification.recipients.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Escalation info for critical alerts */}
                  {notification.priority === 'critical' && notification.escalation_count > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="text-red-400 font-medium">
                        ⚡ Escalated {notification.escalation_count}x
                      </span>
                      {notification.last_escalated_at && (
                        <span className="text-gray-500">
                          (last: {format(new Date(notification.last_escalated_at), 'h:mm a')})
                        </span>
                      )}
                    </div>
                  )}
                  {notification.acknowledged_at && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle size={12} />
                      Acknowledged at {format(new Date(notification.acknowledged_at), 'MMM d, h:mm a')}
                    </div>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col gap-1">
                  {/* Acknowledge button for critical unacknowledged alerts */}
                  {notification.priority === 'critical' && !notification.acknowledged_at && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAcknowledge(notification.id)}
                      className="bg-red-900/30 border-red-500/50 text-red-400 hover:bg-red-900/50 hover:text-red-300 text-xs px-2 py-1 h-auto"
                    >
                      <Shield size={12} className="mr-1" />
                      Acknowledge
                    </Button>
                  )}
                  {/* Mark as read/unread button */}
                  <button
                    onClick={() => onMarkRead([notification.id], !notification.is_read)}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                    title={notification.is_read ? 'Mark as unread' : 'Mark as read'}
                  >
                    {notification.is_read ? (
                      <Circle size={16} />
                    ) : (
                      <CheckCheck size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
