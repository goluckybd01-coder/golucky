import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, User, Crown, Wallet, TrendingUp, 
  History, DollarSign, Gamepad2, RefreshCw, Calendar, Search, X, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { exportUserTransactions, exportUserBets, UserTransactionExportItem, UserBetExportItem } from "@/lib/csvExport";

import bkashLogo from "@/assets/payment/bkash-logo.png";
import nagadLogo from "@/assets/payment/nagad-logo.png";
import usdtLogo from "@/assets/payment/usdt-logo.png";

const getPaymentLogoFromDescription = (description: string | null): string | null => {
  if (!description) return null;
  const lowerDesc = description.toLowerCase();
  if (lowerDesc.includes("bkash")) return bkashLogo;
  if (lowerDesc.includes("nagad")) return nagadLogo;
  if (lowerDesc.includes("usdt")) return usdtLogo;
  return null;
};

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  phone: string | null;
  display_user_id: string | null;
  vip_level: number;
  vip_exp: number;
  referral_code: string | null;
  created_at: string;
}

interface UserWallet {
  balance: number;
  total_bet: number;
  total_win: number;
  total_deposit: number;
  total_withdraw: number;
}

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  game_type: string | null;
  trade_id: string | null;
  created_at: string;
}

interface GameBet {
  id: string;
  game_type: string;
  game_mode: string;
  bet_type: string;
  bet_value: string;
  bet_amount: number;
  multiplier: number;
  potential_win: number;
  payout: number | null;
  status: string;
  result: string | null;
  trade_id: string;
  created_at: string;
  settled_at: string | null;
}

const UserHistory = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [bets, setBets] = useState<GameBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("transactions");
  
  const [txTypeFilter, setTxTypeFilter] = useState<string>("all");
  const [txAmountMin, setTxAmountMin] = useState<string>("");
  const [txAmountMax, setTxAmountMax] = useState<string>("");
  const [txDateRange, setTxDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [txSearch, setTxSearch] = useState("");
  
  const [betGameFilter, setBetGameFilter] = useState<string>("all");
  const [betStatusFilter, setBetStatusFilter] = useState<string>("all");
  const [betAmountMin, setBetAmountMin] = useState<string>("");
  const [betAmountMax, setBetAmountMax] = useState<string>("");
  const [betDateRange, setBetDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login");
      return;
    }
    if (!userId) {
      toast.error("No user ID provided");
      navigate("/admin/dashboard");
      return;
    }
    loadData();
  }, [navigate, userId]);

  const loadData = async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      const [profileResult, walletResult, transactionsResult, betsResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("wallets").select("balance, total_bet, total_win, total_deposit, total_withdraw").eq("user_id", userId).single(),
        supabase.from("wallet_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
        supabase.from("game_bets").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
      ]);

      if (profileResult.data) setProfile(profileResult.data as UserProfile);
      if (walletResult.data) setWallet(walletResult.data as UserWallet);
      if (transactionsResult.data) setTransactions(transactionsResult.data as WalletTransaction[]);
      if (betsResult.data) setBets(betsResult.data as GameBet[]);
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load user data");
    }
    
    setIsLoading(false);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (txTypeFilter !== "all" && tx.type !== txTypeFilter) return false;
      if (txAmountMin && Math.abs(tx.amount) < parseFloat(txAmountMin)) return false;
      if (txAmountMax && Math.abs(tx.amount) > parseFloat(txAmountMax)) return false;
      if (txDateRange.from || txDateRange.to) {
        const txDate = new Date(tx.created_at);
        if (txDateRange.from && txDateRange.to) {
          if (!isWithinInterval(txDate, { start: startOfDay(txDateRange.from), end: endOfDay(txDateRange.to) })) return false;
        } else if (txDateRange.from && txDate < startOfDay(txDateRange.from)) return false;
        else if (txDateRange.to && txDate > endOfDay(txDateRange.to)) return false;
      }
      if (txSearch) {
        const query = txSearch.toLowerCase();
        const matchesDesc = tx.description?.toLowerCase().includes(query);
        const matchesTradeId = tx.trade_id?.toLowerCase().includes(query);
        const matchesGameType = tx.game_type?.toLowerCase().includes(query);
        if (!matchesDesc && !matchesTradeId && !matchesGameType) return false;
      }
      return true;
    });
  }, [transactions, txTypeFilter, txAmountMin, txAmountMax, txDateRange, txSearch]);

  const filteredBets = useMemo(() => {
    return bets.filter(bet => {
      if (betGameFilter !== "all" && bet.game_type !== betGameFilter) return false;
      if (betStatusFilter !== "all" && bet.status !== betStatusFilter) return false;
      if (betAmountMin && bet.bet_amount < parseFloat(betAmountMin)) return false;
      if (betAmountMax && bet.bet_amount > parseFloat(betAmountMax)) return false;
      if (betDateRange.from || betDateRange.to) {
        const betDate = new Date(bet.created_at);
        if (betDateRange.from && betDateRange.to) {
          if (!isWithinInterval(betDate, { start: startOfDay(betDateRange.from), end: endOfDay(betDateRange.to) })) return false;
        } else if (betDateRange.from && betDate < startOfDay(betDateRange.from)) return false;
        else if (betDateRange.to && betDate > endOfDay(betDateRange.to)) return false;
      }
      return true;
    });
  }, [bets, betGameFilter, betStatusFilter, betAmountMin, betAmountMax, betDateRange]);

  const uniqueGameTypes = useMemo(() => {
    const types = new Set<string>();
    bets.forEach(bet => types.add(bet.game_type));
    return Array.from(types);
  }, [bets]);

  const clearTxFilters = () => {
    setTxTypeFilter("all");
    setTxAmountMin("");
    setTxAmountMax("");
    setTxDateRange({ from: undefined, to: undefined });
    setTxSearch("");
  };

  const clearBetFilters = () => {
    setBetGameFilter("all");
    setBetStatusFilter("all");
    setBetAmountMin("");
    setBetAmountMax("");
    setBetDateRange({ from: undefined, to: undefined });
  };

  const handleExportTransactions = () => {
    if (filteredTransactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }
    const exportData: UserTransactionExportItem[] = filteredTransactions.map(tx => ({
      id: tx.id, type: tx.type, amount: tx.amount, balance_after: tx.balance_after,
      description: tx.description, game_type: tx.game_type, trade_id: tx.trade_id, created_at: tx.created_at,
    }));
    exportUserTransactions(exportData, profile?.username || "User", userId || undefined);
    toast.success(`Exported ${filteredTransactions.length} transactions`);
  };

  const handleExportBets = () => {
    if (filteredBets.length === 0) {
      toast.error("No bets to export");
      return;
    }
    const exportData: UserBetExportItem[] = filteredBets.map(bet => ({
      id: bet.id, game_type: bet.game_type, game_mode: bet.game_mode, bet_type: bet.bet_type,
      bet_value: bet.bet_value, bet_amount: bet.bet_amount, multiplier: bet.multiplier,
      potential_win: bet.potential_win, payout: bet.payout, status: bet.status, result: bet.result,
      trade_id: bet.trade_id, created_at: bet.created_at, settled_at: bet.settled_at,
    }));
    exportUserBets(exportData, profile?.username || "User", userId || undefined);
    toast.success(`Exported ${filteredBets.length} bets`);
  };

  const hasTxFilters = txTypeFilter !== "all" || txAmountMin || txAmountMax || txDateRange.from || txDateRange.to || txSearch;
  const hasBetFilters = betGameFilter !== "all" || betStatusFilter !== "all" || betAmountMin || betAmountMax || betDateRange.from || betDateRange.to;

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "deposit": return <Badge className="bg-emerald-500">Deposit</Badge>;
      case "withdraw": return <Badge className="bg-orange-500">Withdraw</Badge>;
      case "bet": return <Badge variant="secondary">Bet</Badge>;
      case "win": return <Badge className="bg-green-500">Win</Badge>;
      case "bonus": return <Badge className="bg-purple-500">Bonus</Badge>;
      case "referral": return <Badge className="bg-blue-500">Referral</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getBetStatusBadge = (status: string) => {
    switch (status) {
      case "won": return <Badge className="bg-green-500">Won</Badge>;
      case "lost": return <Badge variant="destructive">Lost</Badge>;
      case "pending": return <Badge variant="secondary">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateWinRate = () => {
    if (!wallet || wallet.total_bet === 0) return 0;
    return ((wallet.total_win / wallet.total_bet) * 100).toFixed(1);
  };

  const calculateNetProfit = () => {
    if (!wallet) return 0;
    return wallet.total_win - wallet.total_bet;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                User History
              </h1>
              <p className="text-sm text-muted-foreground">
                {profile?.username || "Anonymous"} • VIP {profile?.vip_level || 1}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-bold text-lg">{profile?.username || "Anonymous"}</p>
                  <p className="text-sm text-muted-foreground">{profile?.phone || "No phone"}</p>
                  {profile?.display_user_id && (
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {profile.display_user_id}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Crown className="h-5 w-5 text-yellow-500" />
                <span className="font-bold text-yellow-500">VIP {profile?.vip_level || 1}</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Referral Code</p>
                <p className="font-mono text-sm">{profile?.referral_code || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Joined</p>
                <p className="text-sm">{profile ? format(new Date(profile.created_at), "MMM d, yyyy") : "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {wallet && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Card><CardContent className="p-4 text-center">
              <Wallet className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="font-bold text-lg text-primary">৳{wallet.balance.toLocaleString()}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto text-blue-500 mb-1" />
              <p className="text-xs text-muted-foreground">Total Bet</p>
              <p className="font-bold text-lg">৳{wallet.total_bet.toLocaleString()}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <DollarSign className="h-5 w-5 mx-auto text-green-500 mb-1" />
              <p className="text-xs text-muted-foreground">Total Win</p>
              <p className="font-bold text-lg text-green-500">৳{wallet.total_win.toLocaleString()}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Win Rate</p>
              <p className={`font-bold text-lg ${Number(calculateWinRate()) > 100 ? 'text-red-500' : 'text-muted-foreground'}`}>{calculateWinRate()}%</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Deposits</p>
              <p className="font-bold text-lg text-emerald-500">৳{wallet.total_deposit.toLocaleString()}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Withdrawals</p>
              <p className="font-bold text-lg text-orange-500">৳{wallet.total_withdraw.toLocaleString()}</p>
            </CardContent></Card>
          </div>
        )}

        {wallet && (
          <Card className={calculateNetProfit() > 0 ? "border-red-500/50 bg-red-500/5" : "border-green-500/50 bg-green-500/5"}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Profit (Player)</p>
                <p className={`font-bold text-xl ${calculateNetProfit() > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {calculateNetProfit() > 0 ? '+' : ''}৳{calculateNetProfit().toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {calculateNetProfit() > 0 ? "Player is winning against the house" : "House is winning"}
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Transactions ({filteredTransactions.length}/{transactions.length})
            </TabsTrigger>
            <TabsTrigger value="bets" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              Bets ({filteredBets.length}/{bets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>Last 200 wallet transactions</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportTransactions} disabled={filteredTransactions.length === 0}>
                      <Download className="h-4 w-4 mr-1" /> Export CSV
                    </Button>
                    {hasTxFilters && (
                      <Button variant="ghost" size="sm" onClick={clearTxFilters}>
                        <X className="h-4 w-4 mr-1" /> Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-[150px]">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search description..." value={txSearch} onChange={(e) => setTxSearch(e.target.value)} className="pl-8 h-9" />
                    </div>
                  </div>
                  <Select value={txTypeFilter} onValueChange={setTxTypeFilter}>
                    <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="withdraw">Withdraw</SelectItem>
                      <SelectItem value="bet">Bet</SelectItem>
                      <SelectItem value="win">Win</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                    </SelectContent>
                  </Select>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9">
                        <Calendar className="h-4 w-4 mr-1" />
                        {txDateRange.from ? (txDateRange.to ? <>{format(txDateRange.from, "MMM d")} - {format(txDateRange.to, "MMM d")}</> : format(txDateRange.from, "MMM d")) : "Date Range"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <CalendarComponent initialFocus mode="range" defaultMonth={txDateRange.from} selected={txDateRange} onSelect={(range) => setTxDateRange({ from: range?.from, to: range?.to })} numberOfMonths={2} />
                    </PopoverContent>
                  </Popover>
                </div>
                {filteredTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{transactions.length === 0 ? "No transactions found" : "No transactions match filters"}</p>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Balance After</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map((tx) => {
                          const paymentLogo = getPaymentLogoFromDescription(tx.description);
                          return (
                            <TableRow key={tx.id}>
                              <TableCell className="text-sm">{format(new Date(tx.created_at), "MMM d, HH:mm")}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {(tx.type === 'deposit' || tx.type === 'withdraw') && paymentLogo && (
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden p-1 border border-border shadow-sm flex-shrink-0">
                                      <img src={paymentLogo} alt="" className="w-full h-full object-contain" />
                                    </div>
                                  )}
                                  {getTransactionBadge(tx.type)}
                                </div>
                              </TableCell>
                              <TableCell className={`text-right font-medium ${tx.type === 'bet' || tx.type === 'withdraw' ? 'text-red-500' : 'text-green-500'}`}>
                                {tx.type === 'bet' || tx.type === 'withdraw' ? '-' : '+'}৳{Math.abs(tx.amount).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">৳{tx.balance_after.toLocaleString()}</TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{tx.description || tx.game_type || "-"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bets">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle>Bet History</CardTitle>
                    <CardDescription>Last 200 game bets</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportBets} disabled={filteredBets.length === 0}>
                      <Download className="h-4 w-4 mr-1" /> Export CSV
                    </Button>
                    {hasBetFilters && (
                      <Button variant="ghost" size="sm" onClick={clearBetFilters}>
                        <X className="h-4 w-4 mr-1" /> Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                  <Select value={betGameFilter} onValueChange={setBetGameFilter}>
                    <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Game" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Games</SelectItem>
                      {uniqueGameTypes.map(type => (<SelectItem key={type} value={type}>{type.toUpperCase()}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select value={betStatusFilter} onValueChange={setBetStatusFilter}>
                    <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {filteredBets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{bets.length === 0 ? "No bets found" : "No bets match filters"}</p>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Game</TableHead>
                          <TableHead>Bet</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Payout</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBets.map((bet) => (
                          <TableRow key={bet.id}>
                            <TableCell className="text-sm">{format(new Date(bet.created_at), "MMM d, HH:mm")}</TableCell>
                            <TableCell><Badge variant="outline">{bet.game_type.toUpperCase()}</Badge></TableCell>
                            <TableCell className="text-sm">{bet.bet_type}: {bet.bet_value}</TableCell>
                            <TableCell className="text-right font-medium">৳{bet.bet_amount.toLocaleString()}</TableCell>
                            <TableCell className={`text-right font-medium ${bet.status === 'won' ? 'text-green-500' : ''}`}>
                              {bet.payout ? `৳${bet.payout.toLocaleString()}` : '-'}
                            </TableCell>
                            <TableCell>{getBetStatusBadge(bet.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserHistory;
