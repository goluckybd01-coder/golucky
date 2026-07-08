import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Gamepad2, Loader2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, endOfDay } from "date-fns";

interface GameRevenueData {
  game: string;
  displayName: string;
  totalBets: number;
  totalWins: number;
  revenue: number;
  betCount: number;
  color: string;
}

interface GameRevenueChartProps {
  className?: string;
}

const GAME_COLORS: Record<string, { color: string; displayName: string }> = {
  wingo: { color: "#f97316", displayName: "WinGo" },
  k3: { color: "#8b5cf6", displayName: "K3" },
  "5d": { color: "#06b6d4", displayName: "5D" },
  trxwin: { color: "#22c55e", displayName: "TRX Win" },
  crash: { color: "#ef4444", displayName: "Crash" },
  mines: { color: "#eab308", displayName: "Mines" },
  aviator: { color: "#ec4899", displayName: "Aviator" },
};

export const GameRevenueChart = ({ className = "" }: GameRevenueChartProps) => {
  const [data, setData] = useState<GameRevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<7 | 14 | 30>(7);
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");

  useEffect(() => {
    loadGameRevenueData();
  }, [days]);

  const loadGameRevenueData = async () => {
    setLoading(true);
    try {
      const startDate = subDays(new Date(), days - 1);
      
      // Fetch game bets within date range
      const { data: gameBets } = await supabase
        .from("game_bets")
        .select("game_type, bet_amount, payout, status")
        .gte("created_at", startOfDay(startDate).toISOString())
        .lte("created_at", endOfDay(new Date()).toISOString());

      // Aggregate by game type
      const gameMap = new Map<string, { totalBets: number; totalWins: number; betCount: number }>();
      
      // Initialize all games
      Object.keys(GAME_COLORS).forEach(game => {
        gameMap.set(game, { totalBets: 0, totalWins: 0, betCount: 0 });
      });

      gameBets?.forEach((record) => {
        const gameType = record.game_type?.toLowerCase() || "unknown";
        const existing = gameMap.get(gameType) || { totalBets: 0, totalWins: 0, betCount: 0 };
        
        existing.totalBets += Number(record.bet_amount) || 0;
        existing.totalWins += Number(record.payout) || 0;
        existing.betCount += 1;
        
        gameMap.set(gameType, existing);
      });

      // Build chart data
      const chartData: GameRevenueData[] = [];
      gameMap.forEach((stats, game) => {
        const gameInfo = GAME_COLORS[game] || { color: "#6b7280", displayName: game };
        const revenue = stats.totalBets - stats.totalWins;
        
        if (stats.betCount > 0) {
          chartData.push({
            game,
            displayName: gameInfo.displayName,
            totalBets: stats.totalBets,
            totalWins: stats.totalWins,
            revenue,
            betCount: stats.betCount,
            color: gameInfo.color,
          });
        }
      });

      // Sort by revenue
      chartData.sort((a, b) => b.revenue - a.revenue);
      
      setData(chartData);
    } catch (error) {
      console.error("Error loading game revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalBets = data.reduce((sum, d) => sum + d.totalBets, 0);
  const totalWins = data.reduce((sum, d) => sum + d.totalWins, 0);
  const totalBetCount = data.reduce((sum, d) => sum + d.betCount, 0);
  const houseEdge = totalBets > 0 ? ((totalRevenue / totalBets) * 100).toFixed(1) : "0";

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload as GameRevenueData;
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
            <p className="text-sm font-medium text-white">{d.displayName}</p>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-gray-300">
              Bets: <span className="font-bold text-orange-400">৳{d.totalBets.toLocaleString()}</span>
              <span className="text-gray-500 ml-1">({d.betCount} rounds)</span>
            </p>
            <p className="text-gray-300">
              Payouts: <span className="font-bold text-green-400">৳{d.totalWins.toLocaleString()}</span>
            </p>
            <div className="border-t border-gray-700 pt-1 mt-1">
              <p className="text-gray-300">
                Revenue: <span className={`font-bold ${d.revenue >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {d.revenue >= 0 ? "+" : ""}৳{d.revenue.toLocaleString()}
                </span>
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLegend = () => (
    <div className="flex flex-wrap justify-center gap-3 mt-2">
      {data.slice(0, 6).map((entry) => (
        <div key={entry.game} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[10px] text-gray-400">{entry.displayName}</span>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-xl border border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-gray-400 h-48">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading game revenue data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-xl border border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Gamepad2 size={18} className="text-purple-400" />
          <span className="font-semibold text-white">Game Revenue Breakdown</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Chart Type Toggle */}
          <div className="flex bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => setChartType("pie")}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                chartType === "pie"
                  ? "bg-purple-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Pie
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                chartType === "bar"
                  ? "bg-purple-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Bar
            </button>
          </div>
          {/* Days Toggle */}
          <div className="flex bg-gray-700 rounded-lg p-0.5">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d as 7 | 14 | 30)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  days === d
                    ? "bg-purple-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-800/50">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Total Bets</p>
          <p className="text-lg font-bold text-orange-400">
            ৳{totalBets > 100000 ? `${(totalBets / 100000).toFixed(1)}L` : totalBets.toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Total Payouts</p>
          <p className="text-lg font-bold text-green-400">
            ৳{totalWins > 100000 ? `${(totalWins / 100000).toFixed(1)}L` : totalWins.toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Net Revenue</p>
          <p className={`text-lg font-bold ${totalRevenue >= 0 ? "text-green-400" : "text-red-400"}`}>
            {totalRevenue >= 0 ? "+" : ""}৳{Math.abs(totalRevenue) > 100000 
              ? `${(totalRevenue / 100000).toFixed(1)}L` 
              : totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">House Edge</p>
          <div className="flex items-center justify-center gap-1">
            <TrendingUp size={14} className={Number(houseEdge) >= 0 ? "text-green-400" : "text-red-400"} />
            <p className={`text-lg font-bold ${Number(houseEdge) >= 0 ? "text-green-400" : "text-red-400"}`}>
              {houseEdge}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56 px-4 pb-2">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No game data available for this period
          </div>
        ) : chartType === "pie" ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="revenue"
                nameKey="displayName"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                label={({ displayName, percent }) => 
                  percent > 0.05 ? `${displayName}: ${(percent * 100).toFixed(0)}%` : ""
                }
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.4} />
              <XAxis
                dataKey="displayName"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={{ stroke: "#4b5563" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={{ stroke: "#4b5563" }}
                tickLine={false}
                tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={50}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      {chartType === "pie" && renderCustomLegend()}
      
      {/* Game Stats Table */}
      <div className="px-4 pb-4">
        <div className="bg-gray-700/30 rounded-lg overflow-hidden">
          <div className="grid grid-cols-5 gap-2 px-3 py-2 text-[10px] text-gray-500 border-b border-gray-700">
            <span>Game</span>
            <span className="text-right">Bets</span>
            <span className="text-right">Payouts</span>
            <span className="text-right">Revenue</span>
            <span className="text-right">Rounds</span>
          </div>
          <div className="max-h-24 overflow-y-auto">
            {data.map((game) => (
              <div key={game.game} className="grid grid-cols-5 gap-2 px-3 py-1.5 text-xs hover:bg-gray-700/30">
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: game.color }} />
                  <span className="text-gray-300">{game.displayName}</span>
                </span>
                <span className="text-right text-orange-400">৳{game.totalBets.toLocaleString()}</span>
                <span className="text-right text-green-400">৳{game.totalWins.toLocaleString()}</span>
                <span className={`text-right font-medium ${game.revenue >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {game.revenue >= 0 ? "+" : ""}৳{game.revenue.toLocaleString()}
                </span>
                <span className="text-right text-gray-400">{game.betCount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
