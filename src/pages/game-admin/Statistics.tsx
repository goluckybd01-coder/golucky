import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Coins, 
  Trophy,
  Target,
  Activity,
  Calendar,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import GameAdminSidebar from "@/components/game-admin/GameAdminSidebar";
import { cn } from "@/lib/utils";

interface GameStats {
  game_type: string;
  total_bets: number;
  total_payouts: number;
  total_fees: number;
  net_profit: number;
  bet_count: number;
}

interface DailyStats {
  date: string;
  displayDate: string;
  bets: number;
  payouts: number;
  profit: number;
  players: number;
}

const GAME_COLORS: Record<string, string> = {
  wingo: "#22c55e",
  k3: "#3b82f6",
  "5d": "#a855f7",
  trxwin: "#f59e0b",
  crash: "#ef4444",
  mines: "#06b6d4",
  aviator: "#ec4899",
};

const formatTaka = (amount: number) => {
  return `৳${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function Statistics() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalBets: 0,
    totalPayouts: 0,
    totalProfit: 0,
    totalPlayers: 0,
    totalRounds: 0,
  });
  const [dateRange, setDateRange] = useState(7);

  const loadStats = async () => {
    try {
      const startDate = format(subDays(new Date(), dateRange), "yyyy-MM-dd");
      
      const { data: gameStatsData, error: gameError } = await supabase
        .from("daily_game_stats")
        .select("*")
        .gte("stat_date", startDate);

      if (gameError) throw gameError;

      const gameAggregates: Record<string, GameStats> = {};
      gameStatsData?.forEach((stat) => {
        if (!gameAggregates[stat.game_type]) {
          gameAggregates[stat.game_type] = {
            game_type: stat.game_type,
            total_bets: 0,
            total_payouts: 0,
            total_fees: 0,
            net_profit: 0,
            bet_count: 0,
          };
        }
        gameAggregates[stat.game_type].total_bets += stat.total_bets || 0;
        gameAggregates[stat.game_type].total_payouts += stat.total_payouts || 0;
        gameAggregates[stat.game_type].total_fees += stat.total_fees || 0;
        gameAggregates[stat.game_type].net_profit += stat.net_profit || 0;
        gameAggregates[stat.game_type].bet_count += stat.total_bet_count || 0;
      });

      setGameStats(Object.values(gameAggregates));

      const dailyAggregates: Record<string, DailyStats> = {};
      gameStatsData?.forEach((stat) => {
        const date = stat.stat_date;
        if (!dailyAggregates[date]) {
          dailyAggregates[date] = {
            date,
            displayDate: format(new Date(date), "MMM dd"),
            bets: 0,
            payouts: 0,
            profit: 0,
            players: 0,
          };
        }
        dailyAggregates[date].bets += stat.total_bets || 0;
        dailyAggregates[date].payouts += stat.total_payouts || 0;
        dailyAggregates[date].profit += stat.net_profit || 0;
      });

      const sortedDailyStats = Object.values(dailyAggregates).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setDailyStats(sortedDailyStats);

      const totals = {
        totalBets: Object.values(gameAggregates).reduce((acc, g) => acc + g.total_bets, 0),
        totalPayouts: Object.values(gameAggregates).reduce((acc, g) => acc + g.total_payouts, 0),
        totalProfit: Object.values(gameAggregates).reduce((acc, g) => acc + g.net_profit, 0),
        totalPlayers: 0,
        totalRounds: Object.values(gameAggregates).reduce((acc, g) => acc + g.bet_count, 0),
      };

      const { count: playerCount } = await supabase
        .from("game_bets")
        .select("user_id", { count: "exact", head: true })
        .gte("created_at", startOfDay(subDays(new Date(), dateRange)).toISOString());

      totals.totalPlayers = playerCount || 0;
      setTotalStats(totals);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const pieData = gameStats.map((g) => ({
    name: g.game_type.toUpperCase(),
    value: g.total_bets,
    color: GAME_COLORS[g.game_type] || "#6b7280",
  }));

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <GameAdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <GameAdminSidebar />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              Game Statistics
            </h1>
            <p className="text-gray-400 mt-1">
              Comprehensive analytics for all games
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-800 rounded-lg p-1">
              {[7, 14, 30].map((days) => (
                <Button
                  key={days}
                  variant={dateRange === days ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDateRange(days)}
                  className={cn(
                    "text-xs",
                    dateRange === days 
                      ? "bg-primary text-white" 
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  {days}D
                </Button>
              ))}
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-300">Total Bets</p>
                    <p className="text-2xl font-bold text-white">{formatTaka(totalStats.totalBets)}</p>
                  </div>
                  <Coins className="h-10 w-10 text-blue-400/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-300">Total Payouts</p>
                    <p className="text-2xl font-bold text-white">{formatTaka(totalStats.totalPayouts)}</p>
                  </div>
                  <Trophy className="h-10 w-10 text-amber-400/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className={cn("border", totalStats.totalProfit >= 0 ? "bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30" : "bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={cn("text-sm", totalStats.totalProfit >= 0 ? "text-green-300" : "text-red-300")}>Net Profit</p>
                    <p className="text-2xl font-bold text-white">{formatTaka(totalStats.totalProfit)}</p>
                  </div>
                  {totalStats.totalProfit >= 0 ? <TrendingUp className="h-10 w-10 text-green-400/50" /> : <TrendingDown className="h-10 w-10 text-red-400/50" />}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-300">Active Players</p>
                    <p className="text-2xl font-bold text-white">{totalStats.totalPlayers.toLocaleString()}</p>
                  </div>
                  <Users className="h-10 w-10 text-purple-400/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border-cyan-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-cyan-300">Total Rounds</p>
                    <p className="text-2xl font-bold text-white">{totalStats.totalRounds.toLocaleString()}</p>
                  </div>
                  <Target className="h-10 w-10 text-cyan-400/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-gray-800/50 border border-gray-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="games">By Game</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Daily Volume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyStats}>
                        <defs>
                          <linearGradient id="colorBets" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="displayDate" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}K`} />
                        <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }} formatter={(value: number) => [formatTaka(value), ""]} />
                        <Area type="monotone" dataKey="bets" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBets)" name="Bets" />
                        <Area type="monotone" dataKey="profit" stroke="#22c55e" fillOpacity={1} fill="url(#colorProfit)" name="Profit" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Bet Distribution by Game
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }} formatter={(value: number) => [formatTaka(value), "Bets"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="games" className="space-y-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Game Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gameStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}K`} />
                      <YAxis type="category" dataKey="game_type" stroke="#9ca3af" fontSize={12} width={80} tickFormatter={(v) => v.toUpperCase()} />
                      <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }} formatter={(value: number) => [formatTaka(value), ""]} />
                      <Legend />
                      <Bar dataKey="total_bets" name="Bets" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="total_payouts" name="Payouts" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="net_profit" name="Profit" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Detailed Game Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Game</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Total Bets</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Payouts</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Fees</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Net Profit</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Rounds</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">RTP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gameStats.map((game) => {
                        const rtp = game.total_bets > 0 ? ((game.total_payouts / game.total_bets) * 100).toFixed(1) : "0.0";
                        return (
                          <tr key={game.game_type} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GAME_COLORS[game.game_type] || "#6b7280" }} />
                                <span className="text-white font-medium">{game.game_type.toUpperCase()}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right text-white">{formatTaka(game.total_bets)}</td>
                            <td className="py-3 px-4 text-right text-amber-400">{formatTaka(game.total_payouts)}</td>
                            <td className="py-3 px-4 text-right text-gray-400">{formatTaka(game.total_fees)}</td>
                            <td className={cn("py-3 px-4 text-right font-medium", game.net_profit >= 0 ? "text-green-400" : "text-red-400")}>{formatTaka(game.net_profit)}</td>
                            <td className="py-3 px-4 text-right text-gray-300">{game.bet_count.toLocaleString()}</td>
                            <td className={cn("py-3 px-4 text-right font-medium", parseFloat(rtp) > 100 ? "text-red-400" : "text-green-400")}>{rtp}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Daily Profit Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="displayDate" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}K`} />
                      <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }} formatter={(value: number) => [formatTaka(value), ""]} />
                      <Bar dataKey="profit" name="Profit" radius={[4, 4, 0, 0]}>
                        {dailyStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? "#22c55e" : "#ef4444"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
