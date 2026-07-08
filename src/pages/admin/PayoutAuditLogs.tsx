import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Search, RefreshCw, AlertTriangle, 
  DollarSign, Calendar, Filter, Eye, User,
  TrendingUp, CheckCircle, Download, Crown, Loader2, Wallet, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isAdminAuthenticated } from "@/lib/bannerConfig";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface PayoutAuditLog {
  id: string;
  notification_type: string;
  title: string;
  message: string | null;
  metadata: {
    user_id?: string;
    bet_id?: string;
    payout?: number;
    bet_amount?: number;
    multiplier?: number;
    game_type?: string;
    trade_id?: string;
    result?: string;
  } | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  is_read: boolean;
  acknowledged_at: string | null;
}

interface PayoutStats {
  totalPayouts: number;
  totalAmount: number;
  criticalCount: number;
  highCount: number;
  averagePayout: number;
}

interface UserProfile {
  username: string | null;
  vip_level: number;
  phone: string | null;
  created_at: string;
  wallet?: {
    balance: number;
    total_bet: number;
    total_win: number;
    total_deposit: number;
    total_withdraw: number;
  } | null;
}

const PayoutAuditLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<PayoutAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "critical" | "high" | "medium">("all");
  const [gameTypeFilter, setGameTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [selectedLog, setSelectedLog] = useState<PayoutAuditLog | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [stats, setStats] = useState<PayoutStats | null>(null);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login");
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadLogs(), loadStats()]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    }
    setIsLoading(false);
  };

  const loadLogs = async () => {
    let query = supabase
      .from("admin_notification_history")
      .select("*")
      .eq("notification_type", "large_payout")
      .order("created_at", { ascending: false })
      .limit(500);

    if (dateRange.from) {
      query = query.gte("created_at", startOfDay(dateRange.from).toISOString());
    }
    if (dateRange.to) {
      query = query.lte("created_at", endOfDay(dateRange.to).toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading payout logs:", error);
      return;
    }

    setLogs((data || []) as PayoutAuditLog[]);
  };

  const loadStats = async () => {
    const { data, error } = await supabase
      .from("admin_notification_history")
      .select("priority, metadata")
      .eq("notification_type", "large_payout");

    if (error) {
      console.error("Error loading stats:", error);
      return;
    }

    if (data) {
      const payoutLogs = data as PayoutAuditLog[];
      const totalPayouts = payoutLogs.length;
      const totalAmount = payoutLogs.reduce((sum, log) => sum + (log.metadata?.payout || 0), 0);
      const criticalCount = payoutLogs.filter(l => l.priority === 'critical').length;
      const highCount = payoutLogs.filter(l => l.priority === 'high').length;
      const averagePayout = totalPayouts > 0 ? totalAmount / totalPayouts : 0;

      setStats({
        totalPayouts,
        totalAmount,
        criticalCount,
        highCount,
        averagePayout,
      });
    }
  };

  const loadUserProfile = async (userId: string) => {
    setIsLoadingProfile(true);
    setSelectedUserProfile(null);
    
    try {
      const [profileResult, walletResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("username, vip_level, phone, created_at")
          .eq("user_id", userId)
          .single(),
        supabase
          .from("wallets")
          .select("balance, total_bet, total_win, total_deposit, total_withdraw")
          .eq("user_id", userId)
          .single()
      ]);

      if (profileResult.error) {
        console.error("Error loading user profile:", profileResult.error);
        return;
      }

      const profile: UserProfile = {
        ...profileResult.data,
        wallet: walletResult.data || null
      };

      setSelectedUserProfile(profile);
    } catch (error) {
      console.error("Error loading user profile:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSelectLog = (log: PayoutAuditLog) => {
    setSelectedLog(log);
    if (log.metadata?.user_id) {
      loadUserProfile(log.metadata.user_id);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (priorityFilter !== "all" && log.priority !== priorityFilter) {
        return false;
      }
      if (gameTypeFilter !== "all" && log.metadata?.game_type !== gameTypeFilter) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesUserId = log.metadata?.user_id?.toLowerCase().includes(query);
        const matchesBetId = log.metadata?.bet_id?.toLowerCase().includes(query);
        const matchesTradeId = log.metadata?.trade_id?.toLowerCase().includes(query);
        const matchesTitle = log.title.toLowerCase().includes(query);
        
        if (!matchesUserId && !matchesBetId && !matchesTradeId && !matchesTitle) {
          return false;
        }
      }
      return true;
    });
  }, [logs, priorityFilter, gameTypeFilter, searchQuery]);

  const uniqueGameTypes = useMemo(() => {
    const types = new Set<string>();
    logs.forEach(log => {
      if (log.metadata?.game_type) {
        types.add(log.metadata.game_type);
      }
    });
    return Array.from(types);
  }, [logs]);

  const handleMarkAsRead = async (id: string) => {
    const { error } = await supabase
      .from("admin_notification_history")
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to mark as read");
      return;
    }

    setLogs(prev => prev.map(l => l.id === id ? { ...l, is_read: true } : l));
    toast.success("Marked as read");
  };

  const handleAcknowledge = async (id: string) => {
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
      toast.error("Failed to acknowledge");
      return;
    }

    setLogs(prev => prev.map(l => l.id === id ? { ...l, acknowledged_at: now, is_read: true } : l));
    setSelectedLog(prev => prev?.id === id ? { ...prev, acknowledged_at: now, is_read: true } : prev);
    toast.success("Alert acknowledged");
  };

  const exportToCSV = () => {
    const headers = ["Date", "Priority", "Game Type", "User ID", "Bet Amount", "Payout", "Multiplier", "Trade ID", "Acknowledged"];
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      log.priority,
      log.metadata?.game_type || "N/A",
      log.metadata?.user_id || "N/A",
      log.metadata?.bet_amount?.toString() || "0",
      log.metadata?.payout?.toString() || "0",
      log.metadata?.multiplier?.toString() || "0",
      log.metadata?.trade_id || "N/A",
      log.acknowledged_at ? "Yes" : "No",
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payout-audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive" className="animate-pulse">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Large Payout Audit Logs
              </h1>
              <p className="text-sm text-muted-foreground">
                Monitor payouts over ৳10,000 for suspicious activity
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={filteredLogs.length === 0}>
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Payouts</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.totalPayouts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                </div>
                <p className="text-2xl font-bold mt-1">৳{stats.totalAmount.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-muted-foreground">Critical</span>
                </div>
                <p className="text-2xl font-bold text-destructive mt-1">{stats.criticalCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">High Priority</span>
                </div>
                <p className="text-2xl font-bold text-orange-500 mt-1">{stats.highCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Avg. Payout</span>
                </div>
                <p className="text-2xl font-bold mt-1">৳{Math.round(stats.averagePayout).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user ID, bet ID, or trade ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as typeof priorityFilter)}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                </SelectContent>
              </Select>
              <Select value={gameTypeFilter} onValueChange={setGameTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Game Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  {uniqueGameTypes.map(type => (
                    <SelectItem key={type} value={type}>{type.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>{format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}</>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      "Pick date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange({ from: range?.from, to: range?.to });
                      if (range?.from && range?.to) {
                        loadLogs();
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <Button variant="secondary" onClick={loadLogs}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Audit Logs ({filteredLogs.length})</span>
              {filteredLogs.filter(l => !l.is_read).length > 0 && (
                <Badge variant="destructive">
                  {filteredLogs.filter(l => !l.is_read).length} Unread
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Large payouts above ৳10,000 threshold</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No payout audit logs found</div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Game</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead className="text-right">Bet</TableHead>
                      <TableHead className="text-right">Payout</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id} className={!log.is_read ? "bg-primary/5" : ""}>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell>{getPriorityBadge(log.priority)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {log.metadata?.game_type?.toUpperCase() || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.metadata?.user_id?.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="text-right">
                          ৳{(log.metadata?.bet_amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          ৳{(log.metadata?.payout || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {log.acknowledged_at ? (
                            <Badge variant="outline" className="text-green-500 border-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Acknowledged
                            </Badge>
                          ) : log.is_read ? (
                            <Badge variant="secondary">Read</Badge>
                          ) : (
                            <Badge variant="destructive">Unread</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleSelectLog(log)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={() => { setSelectedLog(null); setSelectedUserProfile(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Payout Details
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 border">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">User Profile</span>
                </div>
                {isLoadingProfile ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading profile...</span>
                  </div>
                ) : selectedUserProfile ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Username</p>
                        <p className="font-medium">{selectedUserProfile.username || "No username"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">VIP Level</p>
                        <div className="flex items-center gap-1">
                          <Crown className="h-4 w-4 text-yellow-500" />
                          <span className="font-bold text-yellow-500">VIP {selectedUserProfile.vip_level}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedUserProfile.phone || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Joined</p>
                        <p className="font-medium text-sm">
                          {format(new Date(selectedUserProfile.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    {selectedUserProfile.wallet && (
                      <div className="pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Wallet className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">Wallet Stats</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-background rounded p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">Balance</p>
                            <p className="font-bold text-sm text-primary">
                              ৳{selectedUserProfile.wallet.balance.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-background rounded p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">Total Bet</p>
                            <p className="font-bold text-sm">
                              ৳{selectedUserProfile.wallet.total_bet.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-background rounded p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">Total Win</p>
                            <p className="font-bold text-sm text-green-500">
                              ৳{selectedUserProfile.wallet.total_win.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Profile not found</p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Priority</span>
                {getPriorityBadge(selectedLog.priority)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_at), "MMM d, yyyy HH:mm:ss")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Game Type</p>
                  <p className="font-medium uppercase">{selectedLog.metadata?.game_type || "N/A"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bet Amount</p>
                  <p className="font-medium">৳{(selectedLog.metadata?.bet_amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payout</p>
                  <p className="font-bold text-primary text-lg">
                    ৳{(selectedLog.metadata?.payout || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-mono text-sm bg-muted p-2 rounded">{selectedLog.metadata?.user_id || "N/A"}</p>
              </div>
              <div className="flex gap-2 pt-2 flex-wrap">
                {selectedLog.metadata?.user_id && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelectedLog(null);
                      setSelectedUserProfile(null);
                      navigate(`/admin/user-history?userId=${selectedLog.metadata?.user_id}`);
                    }}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Full History
                  </Button>
                )}
                {!selectedLog.is_read && (
                  <Button variant="outline" onClick={() => handleMarkAsRead(selectedLog.id)} className="flex-1">
                    Mark as Read
                  </Button>
                )}
                {!selectedLog.acknowledged_at && (
                  <Button onClick={() => handleAcknowledge(selectedLog.id)} className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Acknowledge
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayoutAuditLogs;
