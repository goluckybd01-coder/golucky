import { useEffect, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { TrendingUp, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface DailyTransactionData {
  date: string;
  displayDate: string;
  deposits: number;
  withdrawals: number;
  depositCount: number;
  withdrawalCount: number;
  net: number;
}

interface TransactionStatsChartProps {
  className?: string;
}

export const TransactionStatsChart = ({ className = "" }: TransactionStatsChartProps) => {
  const [data, setData] = useState<DailyTransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<7 | 14 | 30>(7);

  useEffect(() => {
    loadTransactionData();
  }, [days]);

  const loadTransactionData = async () => {
    setLoading(true);
    try {
      const startDate = subDays(new Date(), days - 1);
      
      const { data: transactions } = await supabase
        .from("transaction_requests")
        .select("type, amount, created_at, status")
        .eq("status", "approved")
        .gte("created_at", startOfDay(startDate).toISOString())
        .lte("created_at", endOfDay(new Date()).toISOString())
        .order("created_at", { ascending: true });

      const dailyMap = new Map<string, DailyTransactionData>();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "yyyy-MM-dd");
        dailyMap.set(dateStr, {
          date: dateStr,
          displayDate: format(date, "dd/MM"),
          deposits: 0,
          withdrawals: 0,
          depositCount: 0,
          withdrawalCount: 0,
          net: 0,
        });
      }

      transactions?.forEach((tx) => {
        const dateStr = format(new Date(tx.created_at), "yyyy-MM-dd");
        const existing = dailyMap.get(dateStr);
        if (existing) {
          if (tx.type === "deposit") {
            existing.deposits += Number(tx.amount);
            existing.depositCount += 1;
          } else if (tx.type === "withdrawal") {
            existing.withdrawals += Number(tx.amount);
            existing.withdrawalCount += 1;
          }
          existing.net = existing.deposits - existing.withdrawals;
        }
      });

      setData(Array.from(dailyMap.values()));
    } catch (error) {
      console.error("Error loading transaction data:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalDeposits: data.reduce((sum, d) => sum + d.deposits, 0),
    totalWithdrawals: data.reduce((sum, d) => sum + d.withdrawals, 0),
    depositCount: data.reduce((sum, d) => sum + d.depositCount, 0),
    withdrawalCount: data.reduce((sum, d) => sum + d.withdrawalCount, 0),
  };
  const netFlow = stats.totalDeposits - stats.totalWithdrawals;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload as DailyTransactionData;
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-xs text-gray-400 mb-2 font-medium">{d.displayDate}</p>
          <div className="space-y-1">
            <p className="text-xs text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Deposits: <span className="font-bold text-green-400">৳{d.deposits.toLocaleString()}</span>
              <span className="text-gray-500">({d.depositCount})</span>
            </p>
            <p className="text-xs text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Withdrawals: <span className="font-bold text-red-400">৳{d.withdrawals.toLocaleString()}</span>
              <span className="text-gray-500">({d.withdrawalCount})</span>
            </p>
            <div className="border-t border-gray-700 pt-1 mt-1">
              <p className="text-xs text-white">
                Net:{" "}
                <span className={`font-bold ${d.net >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {d.net >= 0 ? "+" : ""}৳{d.net.toLocaleString()}
                </span>
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-xl border border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-gray-400 h-48">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading transaction data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-xl border border-gray-700 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" />
          <span className="font-semibold text-white">Transaction Overview</span>
        </div>
        <div className="flex bg-gray-700 rounded-lg p-0.5">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d as 7 | 14 | 30)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                days === d
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-800/50">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
            <ArrowDownRight size={14} />
            <span className="text-xs text-gray-400">Total Deposits</span>
          </div>
          <p className="text-lg font-bold text-green-400">
            ৳{stats.totalDeposits > 100000 
              ? `${(stats.totalDeposits / 100000).toFixed(1)}L` 
              : stats.totalDeposits.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-500">{stats.depositCount} transactions</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
            <ArrowUpRight size={14} />
            <span className="text-xs text-gray-400">Total Withdrawals</span>
          </div>
          <p className="text-lg font-bold text-red-400">
            ৳{stats.totalWithdrawals > 100000 
              ? `${(stats.totalWithdrawals / 100000).toFixed(1)}L` 
              : stats.totalWithdrawals.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-500">{stats.withdrawalCount} transactions</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp size={14} className={netFlow >= 0 ? "text-green-400" : "text-red-400"} />
            <span className="text-xs text-gray-400">Net Flow</span>
          </div>
          <p className={`text-lg font-bold ${netFlow >= 0 ? "text-green-400" : "text-red-400"}`}>
            {netFlow >= 0 ? "+" : ""}৳{Math.abs(netFlow) > 100000 
              ? `${(netFlow / 100000).toFixed(1)}L` 
              : netFlow.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-500">
            {netFlow >= 0 ? "Profit" : "Loss"} this period
          </p>
        </div>
      </div>

      <div className="h-56 px-4 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="depositGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="withdrawalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.4} />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={{ stroke: "#4b5563" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={{ stroke: "#4b5563" }}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="deposits"
              name="Deposits"
              fill="url(#depositGradient)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="withdrawals"
              name="Withdrawals"
              fill="url(#withdrawalGradient)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
