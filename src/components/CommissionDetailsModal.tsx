import { useState, useEffect } from "react";
import { ChevronLeft, CheckCircle, Coins, Calendar, Filter, TrendingUp, Users, ChevronDown, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { format, subDays, startOfDay, endOfDay, startOfWeek, startOfMonth, isWithinInterval } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CommissionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalCommission: number;
  subordinatesCount: number;
  totalBet: number;
}

interface CommissionEntry {
  id: string;
  amount: number;
  created_at: string;
  description: string | null;
  level?: number;
}

interface DailyBreakdown {
  date: string;
  level1: number;
  level2: number;
  level3: number;
  total: number;
  count: number;
}

const CommissionDetailsModal = ({ 
  open, 
  onOpenChange, 
  totalCommission, 
  subordinatesCount, 
  totalBet 
}: CommissionDetailsModalProps) => {
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month" | "all" | "custom">("all");
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);
  const [commissions, setCommissions] = useState<CommissionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyBreakdowns, setDailyBreakdowns] = useState<DailyBreakdown[]>([]);

  useEffect(() => {
    if (open) {
      loadCommissions();
    }
  }, [open, dateFilter, customDate]);

  const loadCommissions = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let startDate: Date | null = null;
      let endDate: Date = new Date();

      switch (dateFilter) {
        case "today":
          startDate = startOfDay(new Date());
          break;
        case "week":
          startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
          break;
        case "month":
          startDate = startOfMonth(new Date());
          break;
        case "custom":
          if (customDate) {
            startDate = startOfDay(customDate);
            endDate = endOfDay(customDate);
          }
          break;
        case "all":
        default:
          startDate = null;
      }

      let query = supabase
        .from("wallet_transactions")
        .select("id, amount, created_at, description")
        .eq("user_id", user.id)
        .eq("type", "referral")
        .order("created_at", { ascending: false });

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }
      if (dateFilter === "custom" && customDate) {
        query = query.lte("created_at", endDate.toISOString());
      }

      const { data: transactions } = await query;

      if (transactions) {
        const parsed = transactions.map(t => {
          let level = 1;
          if (t.description?.includes("Level 2")) level = 2;
          else if (t.description?.includes("Level 3")) level = 3;
          else if (t.description?.includes("level 2")) level = 2;
          else if (t.description?.includes("level 3")) level = 3;
          
          return { ...t, level };
        });
        setCommissions(parsed);

        const breakdownMap = new Map<string, DailyBreakdown>();
        parsed.forEach(c => {
          const dateKey = format(new Date(c.created_at), "yyyy-MM-dd");
          const existing = breakdownMap.get(dateKey) || {
            date: dateKey,
            level1: 0,
            level2: 0,
            level3: 0,
            total: 0,
            count: 0
          };
          
          if (c.level === 1) existing.level1 += c.amount;
          else if (c.level === 2) existing.level2 += c.amount;
          else if (c.level === 3) existing.level3 += c.amount;
          
          existing.total += c.amount;
          existing.count += 1;
          breakdownMap.set(dateKey, existing);
        });

        setDailyBreakdowns(Array.from(breakdownMap.values()));
      }
    } catch (error) {
      console.error("Error loading commissions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTotal = commissions.reduce((sum, c) => sum + c.amount, 0);
  const level1Total = commissions.filter(c => c.level === 1).reduce((sum, c) => sum + c.amount, 0);
  const level2Total = commissions.filter(c => c.level === 2).reduce((sum, c) => sum + c.amount, 0);
  const level3Total = commissions.filter(c => c.level === 3).reduce((sum, c) => sum + c.amount, 0);

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case "today": return "Today";
      case "week": return "This Week";
      case "month": return "This Month";
      case "custom": return customDate ? format(customDate, "MMM dd, yyyy") : "Select Date";
      default: return "All Time";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl p-0 bg-gradient-to-b from-slate-50 to-white">
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-cyan-600 z-10 rounded-t-3xl">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => onOpenChange(false)} className="p-1">
              <ChevronLeft size={24} className="text-white" />
            </button>
            <SheetTitle className="text-lg font-bold text-white">Commission Details</SheetTitle>
            <div className="w-8" />
          </div>

          <div className="px-4 pb-4 grid grid-cols-3 gap-2">
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-white/70 text-xs">Total Earned</p>
              <p className="text-white font-bold text-lg">৳{totalCommission.toLocaleString()}</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-white/70 text-xs">Team Size</p>
              <p className="text-white font-bold text-lg">{subordinatesCount}</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-white/70 text-xs">Team Bet</p>
              <p className="text-white font-bold text-lg">৳{totalBet.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 bg-white border-b sticky top-[140px] z-10">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Filter size={16} className="text-gray-500 flex-shrink-0" />
            {(["today", "week", "month", "all"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setDateFilter(filter);
                  setCustomDate(undefined);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  dateFilter === filter
                    ? "bg-teal-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter === "today" ? "Today" : filter === "week" ? "This Week" : filter === "month" ? "This Month" : "All Time"}
              </button>
            ))}
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <button
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1 transition-all ${
                    dateFilter === "custom"
                      ? "bg-teal-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Calendar size={12} />
                  {customDate ? format(customDate, "MMM dd") : "Custom"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="end">
                <CalendarComponent
                  mode="single"
                  selected={customDate}
                  onSelect={(date) => {
                    setCustomDate(date);
                    setDateFilter("custom");
                    setShowCalendar(false);
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <TrendingUp size={16} className="text-amber-600" />
              {getDateFilterLabel()} Breakdown
            </span>
            <span className="text-lg font-bold text-amber-600">৳{filteredTotal.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-lg p-2 text-center border border-amber-100">
              <p className="text-[10px] text-gray-500">Level 1 (0.6%)</p>
              <p className="text-sm font-bold text-emerald-600">৳{level1Total.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center border border-amber-100">
              <p className="text-[10px] text-gray-500">Level 2 (0.18%)</p>
              <p className="text-sm font-bold text-blue-600">৳{level2Total.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center border border-amber-100">
              <p className="text-[10px] text-gray-500">Level 3 (0.054%)</p>
              <p className="text-sm font-bold text-purple-600">৳{level3Total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="daily" className="flex-1">
          <TabsList className="w-full bg-gray-100 p-1 mx-4 mt-3 rounded-xl" style={{ width: 'calc(100% - 32px)' }}>
            <TabsTrigger value="daily" className="flex-1 rounded-lg data-[state=active]:bg-white">
              Daily Summary
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1 rounded-lg data-[state=active]:bg-white">
              All Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-0 px-4 pb-24 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 420px)' }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-teal-500" size={32} />
              </div>
            ) : dailyBreakdowns.length > 0 ? (
              <div className="space-y-3 py-3">
                {dailyBreakdowns.map((day) => (
                  <div key={day.date} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="font-medium text-gray-800 text-sm">{format(new Date(day.date), "MMM dd, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{day.count} transactions</span>
                        <span className="font-bold text-teal-600">৳{day.total.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="px-4 py-2 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[10px] text-gray-400">Level 1</p>
                        <p className="text-xs font-semibold text-emerald-600">৳{day.level1.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Level 2</p>
                        <p className="text-xs font-semibold text-blue-600">৳{day.level2.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Level 3</p>
                        <p className="text-xs font-semibold text-purple-600">৳{day.level3.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <Coins className="mx-auto mb-3 opacity-50" size={48} />
                <p className="text-sm">No commission records</p>
                <p className="text-xs mt-1">Commission will appear here after settlement</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="mt-0 px-4 pb-24 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 420px)' }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-teal-500" size={32} />
              </div>
            ) : commissions.length > 0 ? (
              <div className="space-y-2 py-3">
                {commissions.map((entry) => (
                  <div key={entry.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        entry.level === 1 ? "bg-emerald-100" :
                        entry.level === 2 ? "bg-blue-100" : "bg-purple-100"
                      }`}>
                        <Users size={18} className={
                          entry.level === 1 ? "text-emerald-600" :
                          entry.level === 2 ? "text-blue-600" : "text-purple-600"
                        } />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          Level {entry.level} Commission
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(entry.created_at), "MMM dd, yyyy HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        entry.level === 1 ? "text-emerald-600" :
                        entry.level === 2 ? "text-blue-600" : "text-purple-600"
                      }`}>
                        +৳{entry.amount.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {entry.level === 1 ? "0.6%" : entry.level === 2 ? "0.18%" : "0.054%"} rate
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <Coins className="mx-auto mb-3 opacity-50" size={48} />
                <p className="text-sm">No transactions found</p>
                <p className="text-xs mt-1">Try a different date filter</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default CommissionDetailsModal;
