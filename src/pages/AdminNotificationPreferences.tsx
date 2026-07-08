import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Bell, Mail, Clock, AlertTriangle, 
  TrendingUp, Save, RefreshCw, Zap, Settings,
  Play, CheckCircle, XCircle, Send, TestTube,
  History, Trash2, Eye, EyeOff, Search, Filter, X,
  CheckSquare, Square, Download, Calendar,
  Volume2, VolumeX
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { exportNotificationHistory } from "@/lib/csvExport";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, PieChart, Pie } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isAdminAuthenticated } from "@/lib/bannerConfig";

interface NotificationPreferences {
  id: string | null;
  user_id: string;
  email: string;
  frequency: "none" | "daily" | "weekly";
  include_low_priority: boolean;
  include_medium_priority: boolean;
  include_high_priority: boolean;
  include_critical_priority: boolean;
  timezone: string;
  preferred_hour: number;
  instant_critical_alerts: boolean;
  escalation_delay_minutes: number;
  max_escalations: number;
  transaction_critical_threshold: number;
  transaction_high_threshold: number;
  pending_requests_critical_threshold: number;
  pending_requests_warning_threshold: number;
}

interface NotificationHistoryItem {
  id: string;
  notification_type: string;
  title: string;
  message: string | null;
  priority: "low" | "medium" | "high" | "critical";
  is_read: boolean;
  created_at: string;
  escalation_count: number;
  acknowledged_at: string | null;
  metadata: Record<string, unknown> | null;
}

const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Australia/Sydney",
  "Pacific/Auckland",
];

// Sound notification helper
const playNotificationSound = (priority: string) => {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different sounds based on priority
    if (priority === 'critical') {
      // Urgent alarm-like sound for critical
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } else if (priority === 'high') {
      // Two-tone alert for high priority
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } else {
      // Simple chime for medium/low priority
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

const AdminNotificationPreferences = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string } | null>>({});
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('admin_notification_sound');
    return stored !== 'false';
  });
  const [historySearch, setHistorySearch] = useState("");
  const [historyPriorityFilter, setHistoryPriorityFilter] = useState<string>("all");
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>("all");
  const [historyReadFilter, setHistoryReadFilter] = useState<string>("all");
  const [historyDateFrom, setHistoryDateFrom] = useState<Date | undefined>(undefined);
  const [historyDateTo, setHistoryDateTo] = useState<Date | undefined>(undefined);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    id: null,
    user_id: "",
    email: "",
    frequency: "none",
    include_low_priority: false,
    include_medium_priority: true,
    include_high_priority: true,
    include_critical_priority: true,
    timezone: "UTC",
    preferred_hour: 9,
    instant_critical_alerts: true,
    escalation_delay_minutes: 10,
    max_escalations: 5,
    transaction_critical_threshold: 10000,
    transaction_high_threshold: 5000,
    pending_requests_critical_threshold: 10,
    pending_requests_warning_threshold: 5,
  });

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login");
      return;
    }
    loadPreferences();
    loadNotificationHistory();

    // Set up real-time subscription for notification history
    const channel = supabase
      .channel('admin-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_notification_history'
        },
        (payload) => {
          console.log('Notification change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as NotificationHistoryItem;
            setNotificationHistory(prev => [newNotification, ...prev].slice(0, 20));
            
            // Play sound notification based on priority
            const storedSoundSetting = localStorage.getItem('admin_notification_sound');
            if (storedSoundSetting !== 'false') {
              playNotificationSound(newNotification.priority);
            }
            
            toast.info('New notification received', {
              description: newNotification.title,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as NotificationHistoryItem;
            setNotificationHistory(prev =>
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setNotificationHistory(prev => prev.filter(n => n.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const loadNotificationHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("admin_notification_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotificationHistory((data || []) as NotificationHistoryItem[]);
    } catch (error) {
      console.error("Error loading notification history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("admin_notification_history")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      setNotificationHistory(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from("admin_notification_history")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setNotificationHistory(prev => prev.filter(n => n.id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const clearTestAlerts = async () => {
    try {
      const { error } = await supabase
        .from("admin_notification_history")
        .delete()
        .eq("notification_type", "test_alert");

      if (error) throw error;
      setNotificationHistory(prev => prev.filter(n => n.notification_type !== "test_alert"));
      toast.success("Test alerts cleared");
    } catch (error) {
      console.error("Error clearing test alerts:", error);
      toast.error("Failed to clear test alerts");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const filteredHistory = notificationHistory.filter((notification) => {
    // Search filter
    if (historySearch) {
      const searchLower = historySearch.toLowerCase();
      const matchesTitle = notification.title.toLowerCase().includes(searchLower);
      const matchesMessage = notification.message?.toLowerCase().includes(searchLower);
      if (!matchesTitle && !matchesMessage) return false;
    }

    // Priority filter
    if (historyPriorityFilter !== "all" && notification.priority !== historyPriorityFilter) {
      return false;
    }

    // Type filter
    if (historyTypeFilter === "test" && notification.notification_type !== "test_alert") {
      return false;
    }
    if (historyTypeFilter === "real" && notification.notification_type === "test_alert") {
      return false;
    }

    // Read filter
    if (historyReadFilter === "unread" && notification.is_read) {
      return false;
    }
    if (historyReadFilter === "read" && !notification.is_read) {
      return false;
    }

    // Date range filter
    const notificationDate = new Date(notification.created_at);
    if (historyDateFrom) {
      const fromStart = new Date(historyDateFrom);
      fromStart.setHours(0, 0, 0, 0);
      if (notificationDate < fromStart) return false;
    }
    if (historyDateTo) {
      const toEnd = new Date(historyDateTo);
      toEnd.setHours(23, 59, 59, 999);
      if (notificationDate > toEnd) return false;
    }

    return true;
  });

  const clearFilters = () => {
    setHistorySearch("");
    setHistoryPriorityFilter("all");
    setHistoryTypeFilter("all");
    setHistoryReadFilter("all");
    setHistoryDateFrom(undefined);
    setHistoryDateTo(undefined);
  };

  const hasActiveFilters = historySearch || historyPriorityFilter !== "all" || historyTypeFilter !== "all" || historyReadFilter !== "all" || historyDateFrom || historyDateTo;

  // Bulk selection handlers
  const toggleSelectNotification = (id: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllVisible = () => {
    const visibleIds = filteredHistory.map(n => n.id);
    setSelectedNotifications(new Set(visibleIds));
  };

  const deselectAll = () => {
    setSelectedNotifications(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.size === filteredHistory.length && filteredHistory.length > 0) {
      deselectAll();
    } else {
      selectAllVisible();
    }
  };

  const markAllAsRead = async () => {
    setIsProcessingBulk(true);
    try {
      const unreadIds = notificationHistory
        .filter(n => !n.is_read)
        .map(n => n.id);
      
      if (unreadIds.length === 0) {
        toast.info("No unread notifications");
        return;
      }

      const { error } = await supabase
        .from("admin_notification_history")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", unreadIds);

      if (error) throw error;
      
      setNotificationHistory(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      toast.success(`Marked ${unreadIds.length} notifications as read`);
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const markSelectedAsRead = async () => {
    if (selectedNotifications.size === 0) {
      toast.info("No notifications selected");
      return;
    }

    setIsProcessingBulk(true);
    try {
      const selectedIds = Array.from(selectedNotifications);
      const unreadSelectedIds = selectedIds.filter(
        id => !notificationHistory.find(n => n.id === id)?.is_read
      );

      if (unreadSelectedIds.length === 0) {
        toast.info("Selected notifications are already read");
        return;
      }

      const { error } = await supabase
        .from("admin_notification_history")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", unreadSelectedIds);

      if (error) throw error;
      
      setNotificationHistory(prev =>
        prev.map(n => selectedNotifications.has(n.id) ? { ...n, is_read: true } : n)
      );
      toast.success(`Marked ${unreadSelectedIds.length} notifications as read`);
    } catch (error) {
      console.error("Error marking selected as read:", error);
      toast.error("Failed to mark selected as read");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const deleteSelected = async () => {
    if (selectedNotifications.size === 0) {
      toast.info("No notifications selected");
      return;
    }

    setIsProcessingBulk(true);
    try {
      const selectedIds = Array.from(selectedNotifications);
      
      const { error } = await supabase
        .from("admin_notification_history")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;
      
      setNotificationHistory(prev =>
        prev.filter(n => !selectedNotifications.has(n.id))
      );
      setSelectedNotifications(new Set());
      toast.success(`Deleted ${selectedIds.length} notifications`);
    } catch (error) {
      console.error("Error deleting selected:", error);
      toast.error("Failed to delete selected notifications");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/admin/login");
        return;
      }

      const { data, error } = await supabase
        .from("email_digest_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setPreferences({
          id: data.id,
          user_id: data.user_id,
          email: data.email || user.email || "",
          frequency: data.frequency as "none" | "daily" | "weekly",
          include_low_priority: data.include_low_priority,
          include_medium_priority: data.include_medium_priority,
          include_high_priority: data.include_high_priority,
          include_critical_priority: data.include_critical_priority,
          timezone: data.timezone || "UTC",
          preferred_hour: data.preferred_hour ?? 9,
          instant_critical_alerts: data.instant_critical_alerts ?? true,
          escalation_delay_minutes: data.escalation_delay_minutes ?? 10,
          max_escalations: data.max_escalations ?? 5,
          transaction_critical_threshold: data.transaction_critical_threshold ?? 10000,
          transaction_high_threshold: data.transaction_high_threshold ?? 5000,
          pending_requests_critical_threshold: data.pending_requests_critical_threshold ?? 10,
          pending_requests_warning_threshold: data.pending_requests_warning_threshold ?? 5,
        });
      } else {
        // Initialize with user email and detected timezone
        let detectedTz = "UTC";
        try {
          detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        } catch {
          // Ignore timezone detection errors
        }
        setPreferences(prev => ({
          ...prev,
          user_id: user.id,
          email: user.email || "",
          timezone: detectedTz,
        }));
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
      toast.error("Failed to load preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const prefData = {
        user_id: user.id,
        email: preferences.email,
        frequency: preferences.frequency,
        include_low_priority: preferences.include_low_priority,
        include_medium_priority: preferences.include_medium_priority,
        include_high_priority: preferences.include_high_priority,
        include_critical_priority: preferences.include_critical_priority,
        timezone: preferences.timezone,
        preferred_hour: preferences.preferred_hour,
        instant_critical_alerts: preferences.instant_critical_alerts,
        escalation_delay_minutes: preferences.escalation_delay_minutes,
        max_escalations: preferences.max_escalations,
        transaction_critical_threshold: preferences.transaction_critical_threshold,
        transaction_high_threshold: preferences.transaction_high_threshold,
        pending_requests_critical_threshold: preferences.pending_requests_critical_threshold,
        pending_requests_warning_threshold: preferences.pending_requests_warning_threshold,
      };

      if (preferences.id) {
        const { error } = await supabase
          .from("email_digest_preferences")
          .update(prefData)
          .eq("id", preferences.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("email_digest_preferences")
          .insert(prefData)
          .select("id")
          .single();
        if (error) throw error;
        if (data) {
          setPreferences(prev => ({ ...prev, id: data.id }));
        }
      }

      toast.success("Preferences saved successfully!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const simulateAlert = async (testType: string, priority: "low" | "medium" | "high" | "critical", amount?: number) => {
    setIsTesting(testType);
    setTestResults(prev => ({ ...prev, [testType]: null }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create a test notification in the database
      const testTitle = `[TEST] ${priority.toUpperCase()} Priority Alert`;
      const testMessage = amount 
        ? `Test transaction alert for ৳${amount.toLocaleString()} - verifying ${priority} threshold`
        : `Test ${priority} priority alert to verify notification settings`;

      const { data: notification, error: insertError } = await supabase
        .from("admin_notification_history")
        .insert({
          notification_type: "test_alert",
          title: testTitle,
          message: testMessage,
          priority,
          metadata: { 
            test: true, 
            amount, 
            threshold_type: testType,
            created_by: user.id 
          },
          recipients: [preferences.email],
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      // If critical and instant alerts enabled, trigger the instant alert
      if (priority === "critical" && preferences.instant_critical_alerts && notification) {
        const { error: alertError } = await supabase.functions.invoke("send-instant-alert", {
          body: {
            notification_id: notification.id,
            title: testTitle,
            message: testMessage,
            priority: "critical",
            notification_type: "test_alert",
            metadata: { test: true, amount },
          },
        });

        if (alertError) {
          console.warn("Instant alert failed:", alertError);
        }
      }

      setTestResults(prev => ({
        ...prev,
        [testType]: {
          success: true,
          message: priority === "critical" && preferences.instant_critical_alerts
            ? "Test alert created and instant email triggered!"
            : "Test alert created successfully!",
        },
      }));

      toast.success(`${priority.toUpperCase()} test alert created!`, {
        description: priority === "critical" && preferences.instant_critical_alerts
          ? "Check your email for the instant alert"
          : "Check the notification history in the dashboard",
      });
    } catch (error) {
      console.error("Test alert failed:", error);
      setTestResults(prev => ({
        ...prev,
        [testType]: {
          success: false,
          message: error instanceof Error ? error.message : "Failed to create test alert",
        },
      }));
      toast.error("Failed to create test alert");
    } finally {
      setIsTesting(null);
    }
  };

  const testTransactionThreshold = async (type: "critical" | "high") => {
    const amount = type === "critical" 
      ? preferences.transaction_critical_threshold + 100
      : preferences.transaction_high_threshold + 100;
    await simulateAlert(`transaction_${type}`, type, amount);
  };

  const testPendingRequestsThreshold = async (type: "critical" | "warning") => {
    const count = type === "critical"
      ? preferences.pending_requests_critical_threshold
      : preferences.pending_requests_warning_threshold;
    await simulateAlert(
      `pending_${type}`,
      type === "critical" ? "critical" : "high",
      count
    );
  };

  const testEscalation = async () => {
    setIsTesting("escalation");
    setTestResults(prev => ({ ...prev, escalation: null }));

    try {
      // Trigger the escalation function manually
      const { data, error } = await supabase.functions.invoke("escalate-critical-alerts");

      if (error) throw error;

      setTestResults(prev => ({
        ...prev,
        escalation: {
          success: true,
          message: data?.escalatedCount > 0
            ? `Escalated ${data.escalatedCount} alert(s)!`
            : "No alerts needed escalation",
        },
      }));

      toast.success("Escalation check completed!", {
        description: data?.escalatedCount > 0
          ? `${data.escalatedCount} alert(s) were escalated`
          : "No unacknowledged critical alerts found",
      });
    } catch (error) {
      console.error("Escalation test failed:", error);
      setTestResults(prev => ({
        ...prev,
        escalation: {
          success: false,
          message: error instanceof Error ? error.message : "Failed to run escalation",
        },
      }));
      toast.error("Failed to test escalation");
    } finally {
      setIsTesting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/admin/dashboard")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Notification Preferences</h1>
              <p className="text-sm text-muted-foreground">Customize alerts and thresholds</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="alerts">
              <Bell className="w-4 h-4 mr-2" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="thresholds">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Thresholds
            </TabsTrigger>
            <TabsTrigger value="digest">
              <Mail className="w-4 h-4 mr-2" />
              Digest
            </TabsTrigger>
            <TabsTrigger value="testing">
              <TestTube className="w-4 h-4 mr-2" />
              Testing
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Alert Settings Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Instant Alerts
                </CardTitle>
                <CardDescription>
                  Configure how you receive immediate notifications for critical events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Critical Alert Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive instant email for critical priority alerts
                    </p>
                  </div>
                  <Switch
                    checked={preferences.instant_critical_alerts}
                    onCheckedChange={(checked) => updatePreference("instant_critical_alerts", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Notification Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={preferences.email}
                    onChange={(e) => updatePreference("email", e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  Escalation Settings
                </CardTitle>
                <CardDescription>
                  Configure how unacknowledged alerts are escalated
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Escalation Delay</Label>
                    <span className="text-sm font-medium text-primary">
                      {preferences.escalation_delay_minutes} minutes
                    </span>
                  </div>
                  <Slider
                    value={[preferences.escalation_delay_minutes]}
                    onValueChange={([value]) => updatePreference("escalation_delay_minutes", value)}
                    min={1}
                    max={60}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Time before sending a follow-up email for unacknowledged alerts
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Maximum Escalations</Label>
                    <span className="text-sm font-medium text-primary">
                      {preferences.max_escalations} emails
                    </span>
                  </div>
                  <Slider
                    value={[preferences.max_escalations]}
                    onValueChange={([value]) => updatePreference("max_escalations", value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of escalation emails per alert
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Thresholds Tab */}
          <TabsContent value="thresholds" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Transaction Thresholds
                </CardTitle>
                <CardDescription>
                  Set amount thresholds that trigger different priority levels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="critical-threshold" className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      Critical Threshold (৳)
                    </Label>
                    <Input
                      id="critical-threshold"
                      type="number"
                      min={0}
                      value={preferences.transaction_critical_threshold}
                      onChange={(e) => updatePreference("transaction_critical_threshold", Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Transactions above this amount trigger critical alerts
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="high-threshold" className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                      High Priority Threshold (৳)
                    </Label>
                    <Input
                      id="high-threshold"
                      type="number"
                      min={0}
                      value={preferences.transaction_high_threshold}
                      onChange={(e) => updatePreference("transaction_high_threshold", Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Transactions above this amount trigger high priority alerts
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Pending Request Thresholds
                </CardTitle>
                <CardDescription>
                  Set thresholds for pending request queue alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pending-critical" className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      Critical Threshold
                    </Label>
                    <Input
                      id="pending-critical"
                      type="number"
                      min={1}
                      value={preferences.pending_requests_critical_threshold}
                      onChange={(e) => updatePreference("pending_requests_critical_threshold", Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of pending requests to trigger critical alert
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pending-warning" className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                      Warning Threshold
                    </Label>
                    <Input
                      id="pending-warning"
                      type="number"
                      min={1}
                      value={preferences.pending_requests_warning_threshold}
                      onChange={(e) => updatePreference("pending_requests_warning_threshold", Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of pending requests to trigger warning alert
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Digest Tab */}
          <TabsContent value="digest" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-500" />
                  Email Digest Settings
                </CardTitle>
                <CardDescription>
                  Configure periodic summary emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Digest Frequency</Label>
                    <Select
                      value={preferences.frequency}
                      onValueChange={(value: "none" | "daily" | "weekly") => 
                        updatePreference("frequency", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Disabled</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                      value={preferences.timezone}
                      onValueChange={(value) => updatePreference("timezone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Preferred Send Time</Label>
                    <span className="text-sm font-medium text-primary">
                      {preferences.preferred_hour.toString().padStart(2, "0")}:00
                    </span>
                  </div>
                  <Slider
                    value={[preferences.preferred_hour]}
                    onValueChange={([value]) => updatePreference("preferred_hour", value)}
                    min={0}
                    max={23}
                    step={1}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-500" />
                  Include Priority Levels
                </CardTitle>
                <CardDescription>
                  Choose which priority levels to include in digest emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <Label className="text-base">Critical Priority</Label>
                  </div>
                  <Switch
                    checked={preferences.include_critical_priority}
                    onCheckedChange={(checked) => updatePreference("include_critical_priority", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    <Label className="text-base">High Priority</Label>
                  </div>
                  <Switch
                    checked={preferences.include_high_priority}
                    onCheckedChange={(checked) => updatePreference("include_high_priority", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    <Label className="text-base">Medium Priority</Label>
                  </div>
                  <Switch
                    checked={preferences.include_medium_priority}
                    onCheckedChange={(checked) => updatePreference("include_medium_priority", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <Label className="text-base">Low Priority</Label>
                  </div>
                  <Switch
                    checked={preferences.include_low_priority}
                    onCheckedChange={(checked) => updatePreference("include_low_priority", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-purple-500" />
                  Test Alert System
                </CardTitle>
                <CardDescription>
                  Send test alerts to verify your notification settings are working correctly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Transaction Threshold Tests */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Transaction Threshold Tests</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="font-medium">Critical Threshold</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Test with amount above ৳{preferences.transaction_critical_threshold.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testTransactionThreshold("critical")}
                          disabled={isTesting === "transaction_critical"}
                          className="flex-1"
                        >
                          {isTesting === "transaction_critical" ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 mr-2" />
                          )}
                          Test Critical
                        </Button>
                        {testResults.transaction_critical && (
                          testResults.transaction_critical.success ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )
                        )}
                      </div>
                      {testResults.transaction_critical && (
                        <p className={`text-xs ${testResults.transaction_critical.success ? 'text-green-600' : 'text-red-600'}`}>
                          {testResults.transaction_critical.message}
                        </p>
                      )}
                    </div>

                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                        <span className="font-medium">High Threshold</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Test with amount above ৳{preferences.transaction_high_threshold.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testTransactionThreshold("high")}
                          disabled={isTesting === "transaction_high"}
                          className="flex-1"
                        >
                          {isTesting === "transaction_high" ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 mr-2" />
                          )}
                          Test High
                        </Button>
                        {testResults.transaction_high && (
                          testResults.transaction_high.success ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )
                        )}
                      </div>
                      {testResults.transaction_high && (
                        <p className={`text-xs ${testResults.transaction_high.success ? 'text-green-600' : 'text-red-600'}`}>
                          {testResults.transaction_high.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pending Requests Tests */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Pending Requests Tests</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="font-medium">Critical Threshold</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Test alert for {preferences.pending_requests_critical_threshold}+ pending requests
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testPendingRequestsThreshold("critical")}
                          disabled={isTesting === "pending_critical"}
                          className="flex-1"
                        >
                          {isTesting === "pending_critical" ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 mr-2" />
                          )}
                          Test Critical
                        </Button>
                        {testResults.pending_critical && (
                          testResults.pending_critical.success ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )
                        )}
                      </div>
                      {testResults.pending_critical && (
                        <p className={`text-xs ${testResults.pending_critical.success ? 'text-green-600' : 'text-red-600'}`}>
                          {testResults.pending_critical.message}
                        </p>
                      )}
                    </div>

                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span className="font-medium">Warning Threshold</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Test alert for {preferences.pending_requests_warning_threshold}+ pending requests
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testPendingRequestsThreshold("warning")}
                          disabled={isTesting === "pending_warning"}
                          className="flex-1"
                        >
                          {isTesting === "pending_warning" ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 mr-2" />
                          )}
                          Test Warning
                        </Button>
                        {testResults.pending_warning && (
                          testResults.pending_warning.success ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )
                        )}
                      </div>
                      {testResults.pending_warning && (
                        <p className={`text-xs ${testResults.pending_warning.success ? 'text-green-600' : 'text-red-600'}`}>
                          {testResults.pending_warning.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  Test Escalation System
                </CardTitle>
                <CardDescription>
                  Manually trigger the escalation check for unacknowledged critical alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Run Escalation Check</p>
                      <p className="text-sm text-muted-foreground">
                        Checks for unacknowledged critical alerts older than {preferences.escalation_delay_minutes} minutes
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={testEscalation}
                        disabled={isTesting === "escalation"}
                        variant="secondary"
                      >
                        {isTesting === "escalation" ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Run Check
                      </Button>
                      {testResults.escalation && (
                        testResults.escalation.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )
                      )}
                    </div>
                  </div>
                  {testResults.escalation && (
                    <p className={`text-sm ${testResults.escalation.success ? 'text-green-600' : 'text-red-600'}`}>
                      {testResults.escalation.message}
                    </p>
                  )}
                </div>

                <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                  <p className="font-medium mb-2">How escalation works:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Critical alerts that remain unacknowledged for {preferences.escalation_delay_minutes} minutes trigger an escalation email</li>
                    <li>Escalation emails repeat every {preferences.escalation_delay_minutes} minutes</li>
                    <li>Maximum of {preferences.max_escalations} escalation emails per alert</li>
                    <li>Acknowledging an alert stops further escalations</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-500" />
                  Quick Priority Tests
                </CardTitle>
                <CardDescription>
                  Send test alerts at different priority levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => simulateAlert("quick_low", "low")}
                    disabled={isTesting === "quick_low"}
                    className="border-blue-500/50 hover:bg-blue-500/10"
                  >
                    {isTesting === "quick_low" ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                    )}
                    Low Priority
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => simulateAlert("quick_medium", "medium")}
                    disabled={isTesting === "quick_medium"}
                    className="border-yellow-500/50 hover:bg-yellow-500/10"
                  >
                    {isTesting === "quick_medium" ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
                    )}
                    Medium Priority
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => simulateAlert("quick_high", "high")}
                    disabled={isTesting === "quick_high"}
                    className="border-orange-500/50 hover:bg-orange-500/10"
                  >
                    {isTesting === "quick_high" ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
                    )}
                    High Priority
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => simulateAlert("quick_critical", "critical")}
                    disabled={isTesting === "quick_critical"}
                    className="border-red-500/50 hover:bg-red-500/10"
                  >
                    {isTesting === "quick_critical" ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                    )}
                    Critical Priority
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Critical priority tests will send an instant email if enabled in Alert Settings
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5 text-indigo-500" />
                      Recent Notifications
                    </CardTitle>
                    <CardDescription>
                      View and manage recent alert notifications
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={soundEnabled ? "default" : "outline"}
                      onClick={() => {
                        const newValue = !soundEnabled;
                        setSoundEnabled(newValue);
                        localStorage.setItem('admin_notification_sound', String(newValue));
                        if (newValue) {
                          playNotificationSound('medium');
                          toast.success('Sound notifications enabled');
                        } else {
                          toast.info('Sound notifications muted');
                        }
                      }}
                      className={soundEnabled ? "bg-indigo-500 hover:bg-indigo-600" : ""}
                    >
                      {soundEnabled ? (
                        <Volume2 className="w-4 h-4" />
                      ) : (
                        <VolumeX className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={loadNotificationHistory}
                      disabled={isLoadingHistory}
                    >
                      {isLoadingHistory ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearTestAlerts}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Test Alerts
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notifications..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="pl-9 pr-9"
                    />
                    {historySearch && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setHistorySearch("")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Select value={historyPriorityFilter} onValueChange={setHistoryPriorityFilter}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={historyTypeFilter} onValueChange={setHistoryTypeFilter}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="test">Test Only</SelectItem>
                        <SelectItem value="real">Real Only</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={historyReadFilter} onValueChange={setHistoryReadFilter}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="unread">Unread</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                      </SelectContent>
                    </Select>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`w-[130px] justify-start text-left font-normal ${!historyDateFrom && "text-muted-foreground"}`}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {historyDateFrom ? format(historyDateFrom, "MMM d, yyyy") : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={historyDateFrom}
                          onSelect={setHistoryDateFrom}
                          initialFocus
                        />
                        {historyDateFrom && (
                          <div className="p-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full"
                              onClick={() => setHistoryDateFrom(undefined)}
                            >
                              Clear
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`w-[130px] justify-start text-left font-normal ${!historyDateTo && "text-muted-foreground"}`}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {historyDateTo ? format(historyDateTo, "MMM d, yyyy") : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={historyDateTo}
                          onSelect={setHistoryDateTo}
                          initialFocus
                        />
                        {historyDateTo && (
                          <div className="p-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full"
                              onClick={() => setHistoryDateTo(undefined)}
                            >
                              Clear
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>

                    {/* Quick Date Presets */}
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant={historyDateFrom?.toDateString() === new Date().toDateString() && historyDateTo?.toDateString() === new Date().toDateString() ? "secondary" : "ghost"}
                        className="text-xs px-2 h-8"
                        onClick={() => {
                          const today = new Date();
                          setHistoryDateFrom(today);
                          setHistoryDateTo(today);
                        }}
                      >
                        Today
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs px-2 h-8"
                        onClick={() => {
                          const today = new Date();
                          const dayOfWeek = today.getDay();
                          const startOfWeek = new Date(today);
                          startOfWeek.setDate(today.getDate() - dayOfWeek);
                          setHistoryDateFrom(startOfWeek);
                          setHistoryDateTo(today);
                        }}
                      >
                        This week
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs px-2 h-8"
                        onClick={() => {
                          const today = new Date();
                          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                          setHistoryDateFrom(startOfMonth);
                          setHistoryDateTo(today);
                        }}
                      >
                        This month
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs px-2 h-8"
                        onClick={() => {
                          const today = new Date();
                          const weekAgo = new Date();
                          weekAgo.setDate(today.getDate() - 7);
                          setHistoryDateFrom(weekAgo);
                          setHistoryDateTo(today);
                        }}
                      >
                        Last 7 days
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs px-2 h-8"
                        onClick={() => {
                          const today = new Date();
                          const monthAgo = new Date();
                          monthAgo.setDate(today.getDate() - 30);
                          setHistoryDateFrom(monthAgo);
                          setHistoryDateTo(today);
                        }}
                      >
                        Last 30 days
                      </Button>
                      {(historyDateFrom || historyDateTo) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs px-2 h-8 text-muted-foreground"
                          onClick={() => {
                            setHistoryDateFrom(undefined);
                            setHistoryDateTo(undefined);
                          }}
                        >
                          Clear dates
                        </Button>
                      )}
                    </div>

                    {hasActiveFilters && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearFilters}
                        className="text-muted-foreground"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Clear Filters
                      </Button>
                    )}
                  </div>

                  {/* Bulk Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleSelectAll}
                      disabled={filteredHistory.length === 0}
                      className="gap-2"
                    >
                      {selectedNotifications.size === filteredHistory.length && filteredHistory.length > 0 ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      {selectedNotifications.size === filteredHistory.length && filteredHistory.length > 0 
                        ? "Deselect All" 
                        : "Select All"}
                    </Button>

                    {selectedNotifications.size > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {selectedNotifications.size} selected
                      </span>
                    )}

                    <div className="flex-1" />

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={markAllAsRead}
                      disabled={isProcessingBulk || notificationHistory.filter(n => !n.is_read).length === 0}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Mark All Read
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={markSelectedAsRead}
                      disabled={isProcessingBulk || selectedNotifications.size === 0}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Mark Selected Read
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={deleteSelected}
                      disabled={isProcessingBulk || selectedNotifications.size === 0}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const dataToExport = filteredHistory.map(n => ({
                          id: n.id,
                          notification_type: n.notification_type,
                          title: n.title,
                          message: n.message,
                          priority: n.priority,
                          is_read: n.is_read,
                          escalation_count: n.escalation_count,
                          acknowledged_at: n.acknowledged_at,
                          created_at: n.created_at,
                        }));
                        exportNotificationHistory(dataToExport);
                        toast.success(`Exported ${dataToExport.length} notifications to CSV`);
                      }}
                      disabled={filteredHistory.length === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>

                  {hasActiveFilters && (
                    <p className="text-xs text-muted-foreground">
                      Showing {filteredHistory.length} of {notificationHistory.length} notifications
                    </p>
                  )}
                </div>

                {/* Notification List */}
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : notificationHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No notifications yet</p>
                    <p className="text-sm">Test alerts will appear here</p>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No notifications match your filters</p>
                    <Button
                      size="sm"
                      variant="link"
                      onClick={clearFilters}
                      className="mt-2"
                    >
                      Clear all filters
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {filteredHistory.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border rounded-lg space-y-2 transition-colors ${
                            notification.is_read ? "bg-muted/30" : "bg-card border-primary/30"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Checkbox
                                checked={selectedNotifications.has(notification.id)}
                                onCheckedChange={() => toggleSelectNotification(notification.id)}
                                className="flex-shrink-0"
                              />
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(notification.priority)}`} />
                              <span className="font-medium truncate">{notification.title}</span>
                              {notification.notification_type === "test_alert" && (
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  Test
                                </Badge>
                              )}
                              {!notification.is_read && (
                                <Badge className="bg-primary text-xs flex-shrink-0">New</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.is_read && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => markAsRead(notification.id)}
                                  title="Mark as read"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-500 hover:text-red-600"
                                onClick={() => deleteNotification(notification.id)}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {notification.message && (
                            <p className="text-sm text-muted-foreground pl-4">
                              {notification.message}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground pl-4">
                            <span>{formatTimeAgo(notification.created_at)}</span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {notification.priority}
                            </Badge>
                            {notification.escalation_count > 0 && (
                              <span className="text-orange-500">
                                Escalated {notification.escalation_count}x
                              </span>
                            )}
                            {notification.acknowledged_at && (
                              <span className="text-green-500 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Acknowledged
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Notification Trends Chart */}
            {notificationHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Notification Trends
                  </CardTitle>
                  <CardDescription>
                    Notifications by day and priority
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={(() => {
                          // Group notifications by date
                          const grouped: Record<string, { date: string; critical: number; high: number; medium: number; low: number; total: number }> = {};
                          
                          notificationHistory.forEach(n => {
                            const date = format(new Date(n.created_at), "MMM d");
                            if (!grouped[date]) {
                              grouped[date] = { date, critical: 0, high: 0, medium: 0, low: 0, total: 0 };
                            }
                            grouped[date][n.priority as "critical" | "high" | "medium" | "low"]++;
                            grouped[date].total++;
                          });
                          
                          // Convert to array and sort by date
                          return Object.values(grouped)
                            .sort((a, b) => {
                              const dateA = notificationHistory.find(n => format(new Date(n.created_at), "MMM d") === a.date)?.created_at || "";
                              const dateB = notificationHistory.find(n => format(new Date(n.created_at), "MMM d") === b.date)?.created_at || "";
                              return new Date(dateA).getTime() - new Date(dateB).getTime();
                            })
                            .slice(-7); // Last 7 days with data
                        })()}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
                        />
                        <Legend 
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                        />
                        <Bar dataKey="critical" name="Critical" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="high" name="High" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="medium" name="Medium" stackId="a" fill="#eab308" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="low" name="Low" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Distribution Charts - Side by Side */}
            {notificationHistory.length > 0 && (
              <div className="grid md:grid-cols-3 gap-4">
                {/* Type Distribution Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Bell className="w-4 h-4 text-primary" />
                      Distribution by Type
                    </CardTitle>
                    <CardDescription>
                      Notification breakdown by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={(() => {
                              const typeGroups: Record<string, number> = {};
                              notificationHistory.forEach(n => {
                                const type = n.notification_type === "test_alert" ? "Test Alert" :
                                  n.notification_type === "new_transaction_request" ? "Transaction" :
                                  n.notification_type === "pending_requests_alert" ? "Pending Alert" :
                                  n.notification_type === "escalation" ? "Escalation" :
                                  n.notification_type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                                typeGroups[type] = (typeGroups[type] || 0) + 1;
                              });
                              return Object.entries(typeGroups).map(([name, value]) => ({ name, value }));
                            })()}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {(() => {
                              const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1"];
                              const typeGroups: Record<string, number> = {};
                              notificationHistory.forEach(n => {
                                const type = n.notification_type === "test_alert" ? "Test Alert" :
                                  n.notification_type === "new_transaction_request" ? "Transaction" :
                                  n.notification_type === "pending_requests_alert" ? "Pending Alert" :
                                  n.notification_type === "escalation" ? "Escalation" :
                                  n.notification_type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                                typeGroups[type] = (typeGroups[type] || 0) + 1;
                              });
                              return Object.keys(typeGroups).map((_, index) => (
                                <Cell key={`cell-type-${index}`} fill={colors[index % colors.length]} />
                              ));
                            })()}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                            formatter={(value: number) => [`${value} notifications`, "Count"]}
                          />
                          <Legend 
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Priority Distribution Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      Distribution by Priority
                    </CardTitle>
                    <CardDescription>
                      Notification breakdown by severity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={(() => {
                              const priorityGroups: Record<string, number> = {
                                Critical: 0,
                                High: 0,
                                Medium: 0,
                                Low: 0
                              };
                              notificationHistory.forEach(n => {
                                const priority = n.priority.charAt(0).toUpperCase() + n.priority.slice(1);
                                priorityGroups[priority] = (priorityGroups[priority] || 0) + 1;
                              });
                              return Object.entries(priorityGroups)
                                .filter(([_, value]) => value > 0)
                                .map(([name, value]) => ({ name, value }));
                            })()}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {(() => {
                              const priorityColors: Record<string, string> = {
                                Critical: "#ef4444",
                                High: "#f97316",
                                Medium: "#eab308",
                                Low: "#3b82f6"
                              };
                              const priorityGroups: Record<string, number> = {
                                Critical: 0,
                                High: 0,
                                Medium: 0,
                                Low: 0
                              };
                              notificationHistory.forEach(n => {
                                const priority = n.priority.charAt(0).toUpperCase() + n.priority.slice(1);
                                priorityGroups[priority] = (priorityGroups[priority] || 0) + 1;
                              });
                              return Object.entries(priorityGroups)
                                .filter(([_, value]) => value > 0)
                                .map(([name], index) => (
                                  <Cell key={`cell-priority-${index}`} fill={priorityColors[name] || "#6b7280"} />
                                ));
                            })()}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                            formatter={(value: number) => [`${value} notifications`, "Count"]}
                          />
                          <Legend 
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Read Status Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Eye className="w-4 h-4 text-green-500" />
                      Read Status
                    </CardTitle>
                    <CardDescription>
                      Read vs unread notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Read", value: notificationHistory.filter(n => n.is_read).length },
                              { name: "Unread", value: notificationHistory.filter(n => !n.is_read).length }
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            <Cell key="cell-read" fill="#10b981" />
                            <Cell key="cell-unread" fill="#8b5cf6" />
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                            formatter={(value: number) => [`${value} notifications`, "Count"]}
                          />
                          <Legend 
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  Notification Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{notificationHistory.length}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {notificationHistory.filter(n => !n.is_read).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Unread</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-red-500">
                      {notificationHistory.filter(n => n.priority === "critical").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Critical</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-500">
                      {notificationHistory.filter(n => n.notification_type === "test_alert").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Tests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminNotificationPreferences;
