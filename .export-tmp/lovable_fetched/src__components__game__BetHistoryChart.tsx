import { useMemo, useState } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, BarChart3, Eye, EyeOff, PieChart as PieChartIcon, Calendar, Filter } from "lucide-react";
import type { BetHistoryItem } from "@/lib/gameStorage";
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";

interface BetHistoryChartProps {
  history: BetHistoryItem[];
  className?: string;
}

interface ChartDataPoint {
  index: number;
  betAmount: number;
  payout: number;
  profit: number;
  cumulativeProfit: number;
  isWin: boolean | null;
  period: string;
}

interface BetTypeData {
  name: string;
  value: number;
  count: number;
  color: string;
}

interface DailyData {
  date: string;
  displayDate: string;
  betAmount: number;
  payout: number;
  profit: number;
  count: number;
  wins: number;
  losses: number;
}

type TimeFilter = "all" | "today" | "yesterday" | "7days" | "30days";

const TIME_FILTERS: { id: TimeFilter; label: string }[] = [
  { id: "all", label: "সব" },
  { id: "today", label: "আজ" },
  { id: "yesterday", label: "গতকাল" },
  { id: "7days", label: "৭ দিন" },
  { id: "30days", label: "৩০ দিন" },
];

const BET_TYPE_COLORS: Record<string, string> = {
  "Green": "#22c55e",
  "Red": "#ef4444",
  "Violet": "#a855f7",
  "Big": "#f97316",
  "Small": "#3b82f6",
  "Odd": "#f87171",
  "Even": "#4ade80",
  "Number": "#8b5cf6",
  "Other": "#6b7280",
};

const getBetTypeColor = (betType: string): string => {
  if (BET_TYPE_COLORS[betType]) return BET_TYPE_COLORS[betType];
  const lowerType = betType.toLowerCase();
  if (lowerType.includes("green")) return BET_TYPE_COLORS["Green"];
  if (lowerType.includes("red")) return BET_TYPE_COLORS["Red"];
  if (lowerType.includes("violet") || lowerType.includes("purple")) return BET_TYPE_COLORS["Violet"];
  if (lowerType.includes("big")) return BET_TYPE_COLORS["Big"];
  if (lowerType.includes("small")) return BET_TYPE_COLORS["Small"];
  if (lowerType.includes("odd")) return BET_TYPE_COLORS["Odd"];
  if (lowerType.includes("even")) return BET_TYPE_COLORS["Even"];
  if (/number|^[0-9]$/.test(lowerType)) return BET_TYPE_COLORS["Number"];
  return BET_TYPE_COLORS["Other"];
};

const getTimeFilterRange = (filter: TimeFilter): { start: Date; end: Date } | null => {
  const now = new Date();
  const today = startOfDay(now);
  switch (filter) {
    case "today": return { start: today, end: endOfDay(now) };
    case "yesterday": { const yesterday = subDays(today, 1); return { start: yesterday, end: endOfDay(yesterday) }; }
    case "7days": return { start: subDays(today, 6), end: endOfDay(now) };
    case "30days": return { start: subDays(today, 29), end: endOfDay(now) };
    default: return null;
  }
};

const BetHistoryChart = ({ history, className = "" }: BetHistoryChartProps) => {
  const [showChart, setShowChart] = useState(true);
  const [chartView, setChartView] = useState<"trend" | "pie" | "daily">("trend");
  const [chartType, setChartType] = useState<"profit" | "cumulative">("cumulative");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const filteredHistory = useMemo(() => {
    const range = getTimeFilterRange(timeFilter);
    if (!range) return history;
    return history.filter((bet) => isWithinInterval(new Date(bet.timestamp), { start: range.start, end: range.end }));
  }, [history, timeFilter]);

  const chartData = useMemo(() => {
    const settledBets = filteredHistory.filter((bet) => bet.result !== null).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let cumulative = 0;
    return settledBets.map((bet, index) => {
      const profit = bet.isWin ? (bet.payout - bet.betAmount) : -bet.betAmount;
      cumulative += profit;
      return { index: index + 1, betAmount: bet.betAmount, payout: bet.payout, profit, cumulativeProfit: cumulative, isWin: bet.isWin, period: bet.period.slice(-6) };
    });
  }, [filteredHistory]);

  const pieData = useMemo(() => {
    const settledBets = filteredHistory.filter((bet) => bet.result !== null);
    const betTypeMap = new Map<string, { amount: number; count: number }>();
    settledBets.forEach((bet) => {
      const existing = betTypeMap.get(bet.betType) || { amount: 0, count: 0 };
      betTypeMap.set(bet.betType, { amount: existing.amount + bet.betAmount, count: existing.count + 1 });
    });
    return Array.from(betTypeMap.entries()).map(([name, { amount, count }]) => ({ name, value: amount, count, color: getBetTypeColor(name) })).sort((a, b) => b.value - a.value);
  }, [filteredHistory]);

  const dailyData = useMemo(() => {
    const settledBets = filteredHistory.filter((bet) => bet.result !== null);
    const dailyMap = new Map<string, DailyData>();
    settledBets.forEach((bet) => {
      const date = format(new Date(bet.timestamp), "yyyy-MM-dd");
      const displayDate = format(new Date(bet.timestamp), "dd/MM");
      const existing = dailyMap.get(date) || { date, displayDate, betAmount: 0, payout: 0, profit: 0, count: 0, wins: 0, losses: 0 };
      const profit = bet.isWin ? (bet.payout - bet.betAmount) : -bet.betAmount;
      dailyMap.set(date, { ...existing, betAmount: existing.betAmount + bet.betAmount, payout: existing.payout + bet.payout, profit: existing.profit + profit, count: existing.count + 1, wins: existing.wins + (bet.isWin ? 1 : 0), losses: existing.losses + (bet.isWin ? 0 : 1) });
    });
    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  }, [filteredHistory]);

  const stats = useMemo(() => {
    const settledBets = filteredHistory.filter((bet) => bet.result !== null);
    const wins = settledBets.filter((bet) => bet.isWin);
    const losses = settledBets.filter((bet) => !bet.isWin);
    const totalBet = settledBets.reduce((sum, bet) => sum + bet.betAmount, 0);
    const totalPayout = settledBets.reduce((sum, bet) => sum + bet.payout, 0);
    const netProfit = totalPayout - totalBet;
    const winRate = settledBets.length > 0 ? (wins.length / settledBets.length) * 100 : 0;
    return { totalBets: settledBets.length, wins: wins.length, losses: losses.length, totalBet, totalPayout, netProfit, winRate };
  }, [filteredHistory]);

  const hasEnoughData = useMemo(() => history.filter((bet) => bet.result !== null).length >= 2, [history]);
  if (!hasEnoughData) return null;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-2 shadow-lg">
          <p className="text-[10px] text-gray-500">#{data.index} - {data.period}</p>
          <p className="text-[11px] font-semibold" style={{ color: data.isWin ? "#22c55e" : "#ef4444" }}>{data.isWin ? "জিতেছেন" : "হেরেছেন"}</p>
          <p className="text-[10px] text-gray-600">বেট: ৳{data.betAmount.toFixed(2)}</p>
          {data.isWin && <p className="text-[10px] text-green-600">জয়: ৳{data.payout.toFixed(2)}</p>}
          <p className="text-[10px] font-medium" style={{ color: data.profit >= 0 ? "#22c55e" : "#ef4444" }}>
            {chartType === "cumulative" ? "মোট লাভ/ক্ষতি" : "লাভ/ক্ষতি"}: {data.profit >= 0 ? "+" : ""}৳{chartType === "cumulative" ? data.cumulativeProfit.toFixed(2) : data.profit.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as BetTypeData;
      const percentage = stats.totalBet > 0 ? ((data.value / stats.totalBet) * 100).toFixed(1) : "0";
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-2 shadow-lg">
          <div className="flex items-center gap-1.5 mb-1"><div className="w-2.5 h-2.5 rounded-full" style={{ background: data.color }} /><p className="text-[11px] font-semibold text-gray-700">{data.name}</p></div>
          <p className="text-[10px] text-gray-600">মোট বেট: ৳{data.value.toFixed(2)}</p>
          <p className="text-[10px] text-gray-600">বেট সংখ্যা: {data.count}</p>
          <p className="text-[10px] font-medium text-purple-600">{percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const DailyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DailyData;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-2 shadow-lg">
          <p className="text-[11px] font-semibold text-gray-700 mb-1">{data.displayDate}</p>
          <p className="text-[10px] text-gray-600">বেট সংখ্যা: {data.count}</p>
          <p className="text-[10px] text-gray-600">মোট বেট: ৳{data.betAmount.toFixed(2)}</p>
          <p className="text-[10px] text-green-600">জয়: {data.wins} | হার: {data.losses}</p>
          <p className="text-[10px] font-medium" style={{ color: data.profit >= 0 ? "#22c55e" : "#ef4444" }}>লাভ/ক্ষতি: {data.profit >= 0 ? "+" : ""}৳{data.profit.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  const getChartTitle = () => {
    switch (chartView) {
      case "trend": return "উইন/লস ট্রেন্ড";
      case "pie": return "বেট টাইপ ব্রেকডাউন";
      case "daily": return "দৈনিক বেট পরিমাণ";
      default: return "";
    }
  };

  const getChartIcon = () => {
    switch (chartView) {
      case "trend": return <BarChart3 size={14} className="text-purple-500" />;
      case "pie": return <PieChartIcon size={14} className="text-purple-500" />;
      case "daily": return <Calendar size={14} className="text-purple-500" />;
      default: return null;
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-100 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {getChartIcon()}
          <span className="text-[11px] font-semibold text-gray-700">{getChartTitle()}</span>
          {timeFilter !== "all" && <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 text-[8px] font-medium">{TIME_FILTERS.find(f => f.id === timeFilter)?.label}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <button onClick={() => setShowFilterMenu(!showFilterMenu)} className={`p-1 rounded-full transition-all ${timeFilter !== "all" ? "bg-purple-500 text-white" : "text-gray-400 hover:text-gray-600 hover:bg-white/50"}`} title="সময় ফিল্টার"><Filter size={11} /></button>
            {showFilterMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[100px]">
                  {TIME_FILTERS.map((filter) => (
                    <button key={filter.id} onClick={() => { setTimeFilter(filter.id); setShowFilterMenu(false); }} className={`w-full px-3 py-1.5 text-left text-[10px] font-medium transition-colors ${timeFilter === filter.id ? "bg-purple-50 text-purple-600" : "text-gray-600 hover:bg-gray-50"}`}>
                      {filter.label}{timeFilter === filter.id && <span className="float-right text-purple-500">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex bg-white rounded-full p-0.5 border border-gray-200">
            <button onClick={() => setChartView("trend")} className={`p-1 rounded-full transition-all ${chartView === "trend" ? "bg-purple-500 text-white" : "text-gray-400 hover:text-gray-600"}`} title="ট্রেন্ড চার্ট"><BarChart3 size={10} /></button>
            <button onClick={() => setChartView("pie")} className={`p-1 rounded-full transition-all ${chartView === "pie" ? "bg-purple-500 text-white" : "text-gray-400 hover:text-gray-600"}`} title="পাই চার্ট"><PieChartIcon size={10} /></button>
            <button onClick={() => setChartView("daily")} className={`p-1 rounded-full transition-all ${chartView === "daily" ? "bg-purple-500 text-white" : "text-gray-400 hover:text-gray-600"}`} title="দৈনিক চার্ট"><Calendar size={10} /></button>
          </div>
          {chartView === "trend" && (
            <div className="flex bg-white rounded-full p-0.5 border border-gray-200">
              <button onClick={() => setChartType("cumulative")} className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium transition-all ${chartType === "cumulative" ? "bg-purple-500 text-white" : "text-gray-500 hover:text-gray-700"}`}>মোট</button>
              <button onClick={() => setChartType("profit")} className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium transition-all ${chartType === "profit" ? "bg-purple-500 text-white" : "text-gray-500 hover:text-gray-700"}`}>প্রতি বেট</button>
            </div>
          )}
          <button onClick={() => setShowChart(!showChart)} className="p-1 rounded-full hover:bg-white/50 transition-colors">
            {showChart ? <EyeOff size={11} className="text-gray-400" /> : <Eye size={11} className="text-gray-400" />}
          </button>
        </div>
      </div>

      {showChart && (
        <>
          {stats.totalBets === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-400 text-xs">এই সময়ে কোন বেট নেই</p>
              <button onClick={() => setTimeFilter("all")} className="mt-2 text-[10px] text-purple-500 hover:underline">সব দেখুন</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-1 p-2 bg-gray-50/50">
                <div className="text-center"><p className="text-[9px] text-gray-400">মোট বেট</p><p className="text-[11px] font-bold text-gray-700">{stats.totalBets}</p></div>
                <div className="text-center"><p className="text-[9px] text-gray-400">জয়</p><p className="text-[11px] font-bold text-green-500">{stats.wins}</p></div>
                <div className="text-center"><p className="text-[9px] text-gray-400">হার</p><p className="text-[11px] font-bold text-red-500">{stats.losses}</p></div>
                <div className="text-center"><p className="text-[9px] text-gray-400">জয় হার</p><p className="text-[11px] font-bold text-purple-500">{stats.winRate.toFixed(1)}%</p></div>
              </div>
              <div className="mx-2 mb-2 px-3 py-1.5 rounded-lg flex items-center justify-between" style={{ background: stats.netProfit >= 0 ? "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)" : "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)" }}>
                <div className="flex items-center gap-1.5">{stats.netProfit >= 0 ? <TrendingUp size={14} className="text-green-600" /> : <TrendingDown size={14} className="text-red-600" />}<span className="text-[10px] text-gray-600">নেট লাভ/ক্ষতি</span></div>
                <span className="text-[13px] font-bold" style={{ color: stats.netProfit >= 0 ? "#16a34a" : "#dc2626" }}>{stats.netProfit >= 0 ? "+" : ""}৳{stats.netProfit.toFixed(2)}</span>
              </div>
              {chartView === "trend" && chartData.length >= 2 && (
                <div className="h-36 px-2 pb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                        <linearGradient id="colorProfitPositive" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                        <linearGradient id="colorProfitNegative" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="index" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} tickFormatter={(value) => `৳${value}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey={chartType === "cumulative" ? "cumulativeProfit" : "profit"} stroke={chartType === "cumulative" ? (stats.netProfit >= 0 ? "#22c55e" : "#ef4444") : "#8b5cf6"} strokeWidth={2} fill={chartType === "cumulative" ? (stats.netProfit >= 0 ? "url(#colorProfitPositive)" : "url(#colorProfitNegative)") : "url(#colorProfit)"} dot={(props: any) => { const { cx, cy, payload } = props; if (!payload) return null; return <circle cx={cx} cy={cy} r={3} fill={payload.isWin ? "#22c55e" : "#ef4444"} stroke="white" strokeWidth={1} />; }} activeDot={{ r: 5, stroke: "white", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
              {chartView === "trend" && chartData.length < 2 && <div className="h-36 flex items-center justify-center"><p className="text-gray-400 text-xs">চার্ট দেখতে কমপক্ষে ২টি বেট প্রয়োজন</p></div>}
              {chartView === "pie" && pieData.length > 0 && (
                <div className="px-2 pb-2">
                  <div className="flex items-center">
                    <div className="h-32 w-32 flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={50} paddingAngle={2} dataKey="value" animationBegin={0} animationDuration={500}>
                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={1} />)}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 pl-2 space-y-1 max-h-32 overflow-y-auto">
                      {pieData.map((item, index) => {
                        const percentage = stats.totalBet > 0 ? ((item.value / stats.totalBet) * 100).toFixed(1) : "0";
                        return (
                          <div key={index} className="flex items-center justify-between py-0.5 px-2 rounded hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} /><span className="text-[9px] text-gray-600 truncate max-w-[60px]">{item.name}</span></div>
                            <div className="flex items-center gap-2"><span className="text-[9px] text-gray-400">({item.count})</span><span className="text-[9px] font-semibold text-gray-700 w-10 text-right">{percentage}%</span></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center px-2">
                    <span className="text-[10px] text-gray-500">মোট বেট পরিমাণ</span>
                    <span className="text-[12px] font-bold text-purple-600">৳{stats.totalBet.toFixed(2)}</span>
                  </div>
                </div>
              )}
              {chartView === "pie" && pieData.length === 0 && <div className="h-36 flex items-center justify-center"><p className="text-gray-400 text-xs">কোন ডাটা নেই</p></div>}
              {chartView === "daily" && (
                <div className="px-2 pb-2">
                  {dailyData.length === 0 ? (
                    <div className="h-36 flex items-center justify-center"><p className="text-gray-400 text-xs">কোন দৈনিক ডাটা নেই</p></div>
                  ) : (
                    <>
                      <div className="h-36">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailyData} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
                            <defs><linearGradient id="barGradientBet" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} /><stop offset="100%" stopColor="#a78bfa" stopOpacity={0.7} /></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis dataKey="displayDate" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} tickFormatter={(value) => `৳${value}`} />
                            <Tooltip content={<DailyTooltip />} cursor={{ fill: "rgba(139, 92, 246, 0.1)" }} />
                            <Bar dataKey="betAmount" radius={[4, 4, 0, 0]} maxBarSize={30}>{dailyData.map((entry, index) => <Cell key={`cell-${index}`} fill="url(#barGradientBet)" />)}</Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-3 gap-2">
                        <div className="text-center px-2 py-1 rounded bg-purple-50"><p className="text-[8px] text-purple-400">সর্বোচ্চ বেট</p><p className="text-[10px] font-bold text-purple-600">৳{Math.max(...dailyData.map(d => d.betAmount)).toFixed(0)}</p></div>
                        <div className="text-center px-2 py-1 rounded bg-green-50"><p className="text-[8px] text-green-400">সেরা দিন</p><p className="text-[10px] font-bold text-green-600">+৳{Math.max(...dailyData.map(d => d.profit), 0).toFixed(0)}</p></div>
                        <div className="text-center px-2 py-1 rounded bg-orange-50"><p className="text-[8px] text-orange-400">গড় বেট/দিন</p><p className="text-[10px] font-bold text-orange-600">৳{(dailyData.reduce((s, d) => s + d.betAmount, 0) / dailyData.length).toFixed(0)}</p></div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default BetHistoryChart;
