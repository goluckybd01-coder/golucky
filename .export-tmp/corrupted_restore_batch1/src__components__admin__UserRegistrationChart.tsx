import { useEffect, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Users, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface DailyRegistrationData {
  date: string;
  displayDate: string;
  registrations: number;
  cumulative: number;
}

interface UserRegistrationChartProps {
  className?: string;
}

export const UserRegistrationChart = ({ className = "" }: UserRegistrationChartProps) => {
  const [data, setData] = useState<DailyRegistrationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<7 | 14 | 30>(14);

  useEffect(() => {
    loadRegistrationData();
  }, [days]);

  const loadRegistrationData = async () => {
    setLoading(true);
    try {
      const startDate = subDays(new Date(), days - 1);
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", startOfDay(startDate).toISOString())
        .lte("created_at", endOfDay(new Date()).toISOString())
        .order("created_at", { ascending: true });

      const dailyMap = new Map<string, number>();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "yyyy-MM-dd");
        dailyMap.set(dateStr, 0);
      }

      profiles?.forEach((profile) => {
        const dateStr = format(new Date(profile.created_at), "yyyy-MM-dd");
        if (dailyMap.has(dateStr)) {
          dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
        }
      });

      let cumulative = 0;
      const chartData: DailyRegistrationData[] = [];
      
      dailyMap.forEach((count, dateStr) => {
        cumulative += count;
        chartData.push({
          date: dateStr,
          displayDate: format(new Date(dateStr), "dd/MM"),
          registrations: count,
          cumulative,
        });
      });

      setData(chartData);
    } catch (error) {
      console.error("Error loading registration data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalRegistrations = data.reduce((sum, d) => sum + d.registrations, 0);
  const avgPerDay = totalRegistrations / (days || 1);
  const todayRegistrations = data[data.length - 1]?.registrations || 0;
  const yesterdayRegistrations = data[data.length - 2]?.registrations || 0;
  const trend = todayRegistrations - yesterdayRegistrations;
  const trendPercent = yesterdayRegistrations > 0 
    ? ((trend / yesterdayRegistrations) * 100).toFixed(0) 
    : todayRegistrations > 0 ? "+100" : "0";

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload as DailyRegistrationData;
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-xs text-gray-400 mb-2 font-medium">{d.displayDate}</p>
          <div className="space-y-1">
            <p className="text-xs text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              New Users: <span className="font-bold text-cyan-400">{d.registrations}</span>
            </p>
            <p className="text-xs text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Cumulative: <span className="font-bold text-purple-400">{d.cumulative}</span>
            </p>
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
          <span>Loading registration data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-xl border border-gray-700 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-cyan-400" />
          <span className="font-semibold text-white">User Registration Trend</span>
        </div>
        <div className="flex bg-gray-700 rounded-lg p-0.5">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d as 7 | 14 | 30)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                days === d
                  ? "bg-cyan-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-800/50">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Total ({days}d)</p>
          <p className="text-lg font-bold text-cyan-400">{totalRegistrations}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Avg/Day</p>
          <p className="text-lg font-bold text-blue-400">{avgPerDay.toFixed(1)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Today</p>
          <p className="text-lg font-bold text-purple-400">{todayRegistrations}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">vs Yesterday</p>
          <div className="flex items-center justify-center gap-1">
            {trend >= 0 ? (
              <TrendingUp size={14} className="text-green-400" />
            ) : (
              <TrendingDown size={14} className="text-red-400" />
            )}
            <p className={`text-lg font-bold ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
              {trend >= 0 ? "+" : ""}{trendPercent}%
            </p>
          </div>
        </div>
      </div>

      <div className="h-48 px-4 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="registrationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
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
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="registrations"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#registrationGradient)"
              dot={{ r: 3, fill: "#06b6d4", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#06b6d4", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 px-4 pb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-cyan-500" />
          <span className="text-gray-400">Daily Registrations</span>
        </div>
      </div>
    </div>
  );
};
