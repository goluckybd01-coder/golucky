import { useEffect, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
} from "recharts";
import { Activity, TrendingUp, Gamepad2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

interface UserActivityChartProps {
  userId: string;
  className?: string;
}

interface ActivityData {
  date: string;
  displayDate: string;
  gamesPlayed: number;
  totalWagered: number;
  totalWon: number;
  profit: number;
}

interface DailyLoginData {
  date: string;
  displayDate: string;
  hasActivity: boolean;
  rewardClaimed: boolean;
}

export const UserActivityChart = ({ userId, className = "" }: UserActivityChartProps) => {
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loginData, setLoginData] = useState<DailyLoginData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<"betting" | "activity">("betting");

  useEffect(() => {
    loadUserActivity();
  }, [userId]);

  const loadUserActivity = async () => {
    setLoading(true);
    try {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split("T")[0];

      const { data: playerActivity } = await supabase
        .from("player_activity")
        .select("*")
        .eq("user_id", userId)
        .gte("activity_date", thirtyDaysAgo)
        .order("activity_date", { ascending: true });

      const { data: loginRewards } = await supabase
        .from("daily_login_rewards")
        .select("*")
        .eq("user_id", userId)
        .gte("claim_date", thirtyDaysAgo)
        .order("claim_date", { ascending: true });

      const activityMap = new Map<string, ActivityData>();
      const loginMap = new Map<string, boolean>();

      for (let i = 13; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "yyyy-MM-dd");
        activityMap.set(dateStr, {
          date: dateStr,
          displayDate: format(date, "dd/MM"),
          gamesPlayed: 0,
          totalWagered: 0,
          totalWon: 0,
          profit: 0,
        });
        loginMap.set(dateStr, false);
      }

      playerActivity?.forEach((activity) => {
        const dateStr = activity.activity_date;
        if (activityMap.has(dateStr)) {
          activityMap.set(dateStr, {
            date: dateStr,
            displayDate: format(new Date(dateStr), "dd/MM"),
            gamesPlayed: activity.games_played,
            totalWagered: Number(activity.total_wagered),
            totalWon: Number(activity.total_won),
            profit: Number(activity.total_won) - Number(activity.total_wagered),
          });
          loginMap.set(dateStr, true);
        }
      });

      const loginRewardDates = new Set(loginRewards?.map((r) => r.claim_date) || []);

      const processedLoginData: DailyLoginData[] = Array.from(loginMap.entries()).map(
        ([date, hasActivity]) => ({
          date,
          displayDate: format(new Date(date), "dd/MM"),
          hasActivity,
          rewardClaimed: loginRewardDates.has(date),
        })
      );

      setActivityData(Array.from(activityMap.values()));
      setLoginData(processedLoginData);
    } catch (error) {
      console.error("Error loading user activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalGames: activityData.reduce((sum, d) => sum + d.gamesPlayed, 0),
    totalWagered: activityData.reduce((sum, d) => sum + d.totalWagered, 0),
    totalWon: activityData.reduce((sum, d) => sum + d.totalWon, 0),
    activeDays: activityData.filter((d) => d.gamesPlayed > 0).length,
    loginStreak: loginData.filter((d) => d.rewardClaimed).length,
  };

  const netProfit = stats.totalWon - stats.totalWagered;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ActivityData;
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-lg">
          <p className="text-[10px] text-gray-400 mb-1">{data.displayDate}</p>
          <p className="text-[10px] text-white">
            Games: <span className="font-bold text-blue-400">{data.gamesPlayed}</span>
          </p>
          <p className="text-[10px] text-white">
            Wagered: <span className="font-bold text-orange-400">৳{data.totalWagered.toLocaleString()}</span>
          </p>
          <p className="text-[10px] text-white">
            Won: <span className="font-bold text-green-400">৳{data.totalWon.toLocaleString()}</span>
          </p>
          <p className="text-[10px] text-white">
            Profit:{" "}
            <span className={`font-bold ${data.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
              {data.profit >= 0 ? "+" : ""}৳{data.profit.toLocaleString()}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const ActivityTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DailyLoginData;
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-lg">
          <p className="text-[10px] text-gray-400 mb-1">{data.displayDate}</p>
          <p className="text-[10px] text-white">
            Status:{" "}
            <span className={`font-bold ${data.hasActivity ? "text-green-400" : "text-gray-500"}`}>
              {data.hasActivity ? "Active" : "Inactive"}
            </span>
          </p>
          {data.rewardClaimed && (
            <p className="text-[10px] text-amber-400">✓ Daily reward claimed</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`bg-gray-700/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading activity...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-700/30 rounded-lg overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 bg-gray-700/50 border-b border-gray-600">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-primary" />
          <span className="text-xs font-semibold text-white">User Activity (14 Days)</span>
        </div>
        <div className="flex bg-gray-800 rounded-full p-0.5">
          <button
            onClick={() => setChartView("betting")}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
              chartView === "betting"
                ? "bg-primary text-primary-foreground"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Betting
          </button>
          <button
            onClick={() => setChartView("activity")}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
              chartView === "activity"
                ? "bg-primary text-primary-foreground"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Activity
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 p-2 bg-gray-800/30">
        <div className="text-center">
          <p className="text-[9px] text-gray-500">Games</p>
          <p className="text-[11px] font-bold text-blue-400">{stats.totalGames}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-gray-500">Wagered</p>
          <p className="text-[11px] font-bold text-orange-400">
            ৳{stats.totalWagered > 1000 ? `${(stats.totalWagered / 1000).toFixed(1)}K` : stats.totalWagered}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-gray-500">Profit</p>
          <p className={`text-[11px] font-bold ${netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
            {netProfit >= 0 ? "+" : ""}৳{Math.abs(netProfit) > 1000 ? `${(netProfit / 1000).toFixed(1)}K` : netProfit}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-gray-500">Active Days</p>
          <p className="text-[11px] font-bold text-purple-400">{stats.activeDays}/14</p>
        </div>
      </div>

      <div className="h-32 px-2 pb-2">
        {chartView === "betting" ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={activityData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="wageredGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="wonGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 9, fill: "#9ca3af" }}
                axisLine={{ stroke: "#4b5563" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#9ca3af" }}
                axisLine={{ stroke: "#4b5563" }}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : v)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="totalWagered"
                stroke="#f97316"
                strokeWidth={1.5}
                fill="url(#wageredGradient)"
                name="Wagered"
              />
              <Area
                type="monotone"
                dataKey="totalWon"
                stroke="#22c55e"
                strokeWidth={1.5}
                fill="url(#wonGradient)"
                name="Won"
              />
              <Line
                type="monotone"
                dataKey="gamesPlayed"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                yAxisId={0}
                name="Games"
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={loginData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 9, fill: "#9ca3af" }}
                axisLine={{ stroke: "#4b5563" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#9ca3af" }}
                axisLine={{ stroke: "#4b5563" }}
                tickLine={false}
                domain={[0, 1]}
                tickFormatter={() => ""}
              />
              <Tooltip content={<ActivityTooltip />} />
              <Bar
                dataKey={(d: DailyLoginData) => (d.hasActivity ? 1 : 0.2)}
                fill="#3b82f6"
                radius={[2, 2, 0, 0]}
                name="Activity"
              />
              <Bar
                dataKey={(d: DailyLoginData) => (d.rewardClaimed ? 0.8 : 0)}
                fill="#f59e0b"
                radius={[2, 2, 0, 0]}
                name="Reward"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 px-2 pb-2 text-[9px]">
        {chartView === "betting" ? (
          <>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-gray-400">Wagered</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-400">Won</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-gray-400">Games</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-400">Active Day</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-gray-400">Reward Claimed</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
