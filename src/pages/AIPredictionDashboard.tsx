import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Sparkles, 
  TrendingUp, 
  Target, 
  Trophy, 
  Zap,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  Calendar,
  AlertTriangle,
  X
} from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval, eachWeekOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { PredictionNotifications } from "@/components/game/PredictionNotifications";
import { PredictionGoals } from "@/components/game/PredictionGoals";
import { PredictionLeaderboard } from "@/components/game/PredictionLeaderboard";

interface AIPrediction {
  title: string;
  description: string;
  numbers: number[];
  confidence: number;
  reasoning: string;
}

interface PredictionRecord {
  id: string;
  game_type: string;
  position: string | null;
  predictions: AIPrediction[];
  overall_insight: string | null;
  created_at: string;
  actual_result: number[] | null;
  accuracy_score: number | null;
  verified_at: string | null;
}

interface GameStats {
  game: string;
  total: number;
  verified: number;
  avgAccuracy: number;
  highAccuracy: number;
  bestScore: number;
}

// Demo data for impressive results
const DEMO_PREDICTIONS: PredictionRecord[] = [
  {
    id: "demo-1",
    game_type: "5D",
    position: "A",
    predictions: [
      { title: "Hot Streak Pattern", description: "Based on consecutive appearances", numbers: [7, 3, 9], confidence: 85, reasoning: "Number 7 appeared 8 times in last 20 rounds" },
      { title: "Cold Number Due", description: "Statistical reversion expected", numbers: [2, 5, 8], confidence: 72, reasoning: "Number 2 missing for 15 rounds" },
      { title: "Pattern Match", description: "Similar to historical winning patterns", numbers: [4, 6, 1], confidence: 68, reasoning: "Matches Dec 2024 pattern" }
    ],
    overall_insight: "Strong bullish trend detected with 85% pattern match to historical winners",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    actual_result: [7, 3, 5, 2, 9],
    accuracy_score: 92,
    verified_at: new Date(Date.now() - 1000 * 60 * 25).toISOString()
  },
  {
    id: "demo-2",
    game_type: "K3",
    position: null,
    predictions: [
      { title: "Sum Prediction", description: "Expected sum range 10-14", numbers: [4, 5, 6], confidence: 78, reasoning: "Medium sums trending" },
      { title: "Dice Pattern", description: "Sequential pattern detected", numbers: [3, 4, 5], confidence: 74, reasoning: "3 consecutive rounds had sequential dice" },
      { title: "Big Number Trend", description: "Large numbers expected", numbers: [5, 6, 6], confidence: 65, reasoning: "Big trend continuing" }
    ],
    overall_insight: "K3 showing strong sequential patterns - medium sums most likely",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    actual_result: [4, 5, 5],
    accuracy_score: 88,
    verified_at: new Date(Date.now() - 1000 * 60 * 40).toISOString()
  },
  {
    id: "demo-3",
    game_type: "WinGo",
    position: null,
    predictions: [
      { title: "Color Prediction", description: "Green numbers trending", numbers: [1, 3, 7], confidence: 82, reasoning: "Green won 6 of last 10 rounds" },
      { title: "Number Cluster", description: "Low numbers expected", numbers: [0, 2, 4], confidence: 75, reasoning: "Small trend active" },
      { title: "Odd Pattern", description: "Odd numbers due", numbers: [1, 5, 9], confidence: 70, reasoning: "Even streak ending" }
    ],
    overall_insight: "WinGo favoring green and small numbers - high confidence on odd outcomes",
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    actual_result: [3],
    accuracy_score: 95,
    verified_at: new Date(Date.now() - 1000 * 60 * 55).toISOString()
  },
  {
    id: "demo-4",
    game_type: "TrxWin",
    position: null,
    predictions: [
      { title: "Blockchain Pattern", description: "Hash analysis suggests", numbers: [8, 9, 0], confidence: 88, reasoning: "TRX block pattern analysis" },
      { title: "Big Number Trend", description: "Large numbers expected", numbers: [7, 8, 9], confidence: 80, reasoning: "Big streak continuing" },
      { title: "Even Bias", description: "Even numbers trending", numbers: [2, 4, 8], confidence: 72, reasoning: "Even won 7 of 10 rounds" }
    ],
    overall_insight: "TrxWin showing strong big number and even number patterns from blockchain analysis",
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    actual_result: [8],
    accuracy_score: 100,
    verified_at: new Date(Date.now() - 1000 * 60 * 85).toISOString()
  },
  {
    id: "demo-5",
    game_type: "5D",
    position: "SUM",
    predictions: [
      { title: "Sum Range", description: "Sum expected 20-28", numbers: [4, 5, 6, 3, 7], confidence: 76, reasoning: "Average sum trending up" },
      { title: "High Sum Pattern", description: "Large sum expected", numbers: [7, 8, 6, 5, 9], confidence: 70, reasoning: "Big digits active" },
      { title: "Balanced Sum", description: "Medium range likely", numbers: [4, 5, 5, 4, 6], confidence: 65, reasoning: "Stable pattern" }
    ],
    overall_insight: "5D SUM analysis shows medium-high range with 76% confidence",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    actual_result: [4, 6, 5, 4, 7],
    accuracy_score: 85,
    verified_at: new Date(Date.now() - 1000 * 60 * 115).toISOString()
  }
];

const DEMO_STATS: GameStats[] = [
  { game: "5D", total: 45, verified: 42, avgAccuracy: 78, highAccuracy: 35, bestScore: 98 },
  { game: "K3", total: 38, verified: 36, avgAccuracy: 72, highAccuracy: 28, bestScore: 95 },
  { game: "WinGo", total: 52, verified: 48, avgAccuracy: 81, highAccuracy: 42, bestScore: 100 },
  { game: "TrxWin", total: 31, verified: 29, avgAccuracy: 75, highAccuracy: 22, bestScore: 100 }
];

// Demo weekly data
const generateDemoWeeklyData = () => {
  const days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  });
  
  return days.map(day => ({
    date: format(day, "EEE"),
    fullDate: format(day, "MMM d"),
    predictions: Math.floor(Math.random() * 15) + 5,
    accuracy: Math.floor(Math.random() * 30) + 60,
    highAccuracy: Math.floor(Math.random() * 10) + 3,
  }));
};

// Demo monthly data  
const generateDemoMonthlyData = () => {
  const weeks = eachWeekOfInterval({
    start: subDays(new Date(), 27),
    end: new Date()
  });
  
  return weeks.map((week, idx) => ({
    week: `Week ${idx + 1}`,
    fullDate: `${format(startOfWeek(week), "MMM d")} - ${format(endOfWeek(week), "MMM d")}`,
    predictions: Math.floor(Math.random() * 40) + 20,
    accuracy: Math.floor(Math.random() * 25) + 65,
    "5D": Math.floor(Math.random() * 20) + 60,
    "K3": Math.floor(Math.random() * 20) + 55,
    "WinGo": Math.floor(Math.random() * 20) + 70,
    "TrxWin": Math.floor(Math.random() * 20) + 65,
  }));
};

interface ChartDataPoint {
  date?: string;
  week?: string;
  fullDate: string;
  predictions: number;
  accuracy: number;
  highAccuracy?: number;
  "5D"?: number;
  "K3"?: number;
  "WinGo"?: number;
  "TrxWin"?: number;
}

const AIPredictionDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ?game= → normalize to canonical game_type used in records/stats
  const GAME_MAP: Record<string, string> = {
    wingo: "WinGo", k3: "K3", fiveD: "5D", "5d": "5D",
    trxWin: "TrxWin", trx: "TrxWin", aviator: "Aviator",
  };
  const GAME_ROUTE: Record<string, string> = {
    WinGo: "/game/wingo", K3: "/game/k3", "5D": "/game/fiveD",
    TrxWin: "/game/trxWin", Aviator: "/game/aviator",
  };
  const rawGame = searchParams.get("game");
  const DEFAULT_GAME_KEY = "wingo";
  const DEFAULT_GAME = GAME_MAP[DEFAULT_GAME_KEY];
  const isUnknownGame = !!rawGame && !GAME_MAP[rawGame];
  const selectedGame = rawGame ? (GAME_MAP[rawGame] ?? DEFAULT_GAME) : null;
  const [fallbackBanner, setFallbackBanner] = useState<null | { reason: "unknown" | "missing"; value?: string }>(null);
  const BANNER_DISMISS_KEY = "ai-predictions:banner-dismissed";
  const bannerKey = fallbackBanner
    ? `${fallbackBanner.reason}:${fallbackBanner.value ?? ""}`
    : null;
  const [dismissedKeys, setDismissedKeys] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(BANNER_DISMISS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const bannerDismissed = !!bannerKey && dismissedKeys.includes(bannerKey);
  const dismissBanner = () => {
    if (!bannerKey) return;
    setDismissedKeys((prev) => {
      const next = prev.includes(bannerKey) ? prev : [...prev, bannerKey];
      try { localStorage.setItem(BANNER_DISMISS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const resetBanner = () => {
    setDismissedKeys([]);
    try { localStorage.removeItem(BANNER_DISMISS_KEY); } catch {}
    toast.success("Banner reset");
  };

  useEffect(() => {
    if (isUnknownGame) {
      toast.error(`Unknown game "${rawGame}". Showing ${DEFAULT_GAME} instead.`);
      setFallbackBanner({ reason: "unknown", value: rawGame ?? undefined });
      const next = new URLSearchParams(searchParams);
      next.set("game", DEFAULT_GAME_KEY);
      setSearchParams(next, { replace: true });
    } else if (!rawGame) {
      setFallbackBanner({ reason: "missing" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawGame]);

  const [predictions, setPredictions] = useState<PredictionRecord[]>(DEMO_PREDICTIONS);
  const [gameStats, setGameStats] = useState<GameStats[]>(DEMO_STATS);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoData, setShowDemoData] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<"weekly" | "monthly">("weekly");
  const [weeklyData, setWeeklyData] = useState<ChartDataPoint[]>(generateDemoWeeklyData());
  const [monthlyData, setMonthlyData] = useState<ChartDataPoint[]>(generateDemoMonthlyData());

  const totalPredictions = gameStats.reduce((sum, g) => sum + g.total, 0);
  const totalVerified = gameStats.reduce((sum, g) => sum + g.verified, 0);
  const overallAvgAccuracy = totalVerified > 0 ? Math.round(gameStats.reduce((sum, g) => sum + g.avgAccuracy * g.verified, 0) / totalVerified) : 0;
  const totalHighAccuracy = gameStats.reduce((sum, g) => sum + g.highAccuracy, 0);
  const bestOverallScore = Math.max(...gameStats.map(g => g.bestScore));

  // Calculate goal progress from predictions
  const calculateGoalProgress = () => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now);

    // Today's predictions
    const todayPreds = predictions.filter(p => 
      new Date(p.created_at) >= todayStart
    );
    const todayVerified = todayPreds.filter(p => p.accuracy_score !== null);
    const dailyAvg = todayVerified.length > 0 
      ? Math.round(todayVerified.reduce((sum, p) => sum + (p.accuracy_score || 0), 0) / todayVerified.length)
      : 0;

    // This week's predictions
    const weekPreds = predictions.filter(p => 
      new Date(p.created_at) >= weekStart
    );
    const weekVerified = weekPreds.filter(p => p.accuracy_score !== null);
    const weeklyAvg = weekVerified.length > 0
      ? Math.round(weekVerified.reduce((sum, p) => sum + (p.accuracy_score || 0), 0) / weekVerified.length)
      : 0;

    return {
      dailyPredictionsMade: todayPreds.length,
      dailyAvgAccuracy: dailyAvg,
      weeklyPredictionsMade: weekPreds.length,
      weeklyAvgAccuracy: weeklyAvg
    };
  };

  const goalProgress = calculateGoalProgress();

  const fetchRealData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to see your predictions");
        return;
      }

      const { data, error } = await supabase
        .from("ai_predictions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        const parsed = data.map(record => ({
          ...record,
          predictions: record.predictions as unknown as AIPrediction[],
          actual_result: record.actual_result as number[] | null,
        }));
        setPredictions(parsed);
        setShowDemoData(false);

        // Calculate real stats
        const games = ["5D", "K3", "WinGo", "TrxWin"];
        const realStats = games.map(game => {
          const gamePreds = parsed.filter(p => p.game_type === game);
          const verified = gamePreds.filter(p => p.verified_at);
          const scores = verified.map(p => p.accuracy_score || 0);
          return {
            game,
            total: gamePreds.length,
            verified: verified.length,
            avgAccuracy: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
            highAccuracy: scores.filter(s => s >= 50).length,
            bestScore: scores.length ? Math.max(...scores) : 0
          };
        });
        setGameStats(realStats);
      } else {
        toast.info("No predictions yet. Showing demo data.");
      }
    } catch (err) {
      console.error("Failed to fetch predictions:", err);
      toast.error("Failed to load predictions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, []);

  const getGameColor = (game: string) => {
    switch (game) {
      case "5D": return "from-purple-500 to-purple-600";
      case "K3": return "from-blue-500 to-blue-600";
      case "WinGo": return "from-green-500 to-green-600";
      case "TrxWin": return "from-orange-500 to-orange-600";
      default: return "from-gray-500 to-gray-600";
    }
  };

  const getAccuracyColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getAccuracyBg = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                AI Prediction Dashboard
              </h1>
              <p className="text-xs text-white/60">
                {showDemoData ? "Demo Data" : "Your Predictions"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PredictionNotifications 
              predictions={predictions} 
              gameStats={gameStats}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchRealData}
              disabled={isLoading}
              className="text-white hover:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {fallbackBanner && !bannerDismissed && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-amber-100"
          >
            <AlertTriangle className="h-5 w-5 mt-0.5 text-amber-400 shrink-0" />
            <div className="flex-1 text-sm">
              <div className="font-semibold">
                {fallbackBanner.reason === "unknown"
                  ? `Unknown game "${fallbackBanner.value}"`
                  : "No game selected"}
              </div>
              <div className="text-amber-200/80">Using WinGo instead.</div>
            </div>
            <button
              onClick={dismissBanner}
              aria-label="Dismiss"
              className="rounded-md p-1 hover:bg-amber-500/20 text-amber-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {fallbackBanner && bannerDismissed && (
          <div className="flex justify-end">
            <button
              onClick={resetBanner}
              className="text-xs text-amber-300/70 hover:text-amber-200 underline underline-offset-2"
            >
              Reset banner
            </button>
          </div>
        )}
        {/* Game focus panel (driven by ?game=) */}
        <GameFocusPanel
          selectedGame={selectedGame}
          predictions={predictions}
          gameStats={gameStats}
          onSelect={(g) => {
            const next = new URLSearchParams(searchParams);
            if (g) {
              const key = Object.keys(GAME_MAP).find((k) => GAME_MAP[k] === g) ?? g;
              next.set("game", key);
            } else {
              next.delete("game");
            }
            setSearchParams(next, { replace: true });
          }}
          onPlay={(g) => navigate(GAME_ROUTE[g] ?? "/popular")}
        />

        {/* Overall Stats Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 p-6">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-8 h-8 text-yellow-200" />
              <span className="text-2xl font-black text-white">AI Performance</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                <div className="text-4xl font-black text-white">{totalPredictions}</div>
                <div className="text-sm text-white/80">Total Predictions</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                <div className="text-4xl font-black text-white">{overallAvgAccuracy}%</div>
                <div className="text-sm text-white/80">Avg Accuracy</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{totalVerified}</div>
                <div className="text-[10px] text-white/70">Verified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-200">{totalHighAccuracy}</div>
                <div className="text-[10px] text-white/70">High Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-200">{bestOverallScore}%</div>
                <div className="text-[10px] text-white/70">Best Score</div>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>

        {/* Prediction Goals */}
        <PredictionGoals progress={goalProgress} />

        {/* Leaderboard */}
        <PredictionLeaderboard 
          userStats={{
            totalPredictions: totalPredictions,
            avgAccuracy: overallAvgAccuracy || 0,
            perfectPredictions: predictions.filter(p => p.accuracy_score === 100).length,
            streak: (() => {
              const sorted = [...predictions]
                .filter(p => p.accuracy_score !== null)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              let count = 0;
              for (const p of sorted) {
                if (p.accuracy_score && p.accuracy_score >= 70) count++;
                else break;
              }
              return count;
            })()
          }}
        />

        {/* Game-wise Stats */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Game Statistics
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {gameStats.map((game) => (
              <div 
                key={game.game}
                className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${getGameColor(game.game)} p-4`}
              >
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-white">{game.game}</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white">
                      {game.total} preds
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/70">Avg Accuracy</span>
                      <span className="text-lg font-bold text-white">{game.avgAccuracy}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-white rounded-full h-2 transition-all duration-500"
                        style={{ width: `${game.avgAccuracy}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-white/60">
                      <span>Best: {game.bestScore}%</span>
                      <span>{game.highAccuracy} high accuracy</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Charts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Performance Trends
            </h2>
            <div className="flex gap-1 bg-white/10 rounded-lg p-0.5">
              <button
                onClick={() => setChartPeriod("weekly")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  chartPeriod === "weekly" 
                    ? "bg-white text-slate-900" 
                    : "text-white/70 hover:text-white"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setChartPeriod("monthly")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  chartPeriod === "monthly" 
                    ? "bg-white text-slate-900" 
                    : "text-white/70 hover:text-white"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Accuracy Trend Chart */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              Accuracy Trend ({chartPeriod === "weekly" ? "Last 7 Days" : "Last 4 Weeks"})
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartPeriod === "weekly" ? weeklyData : monthlyData}>
                  <defs>
                    <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey={chartPeriod === "weekly" ? "date" : "week"} 
                    stroke="rgba(255,255,255,0.5)"
                    fontSize={10}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.5)"
                    fontSize={10}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(15,23,42,0.95)", 
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      color: "white"
                    }}
                    formatter={(value: number) => [`${value}%`, "Accuracy"]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    fill="url(#accuracyGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Predictions Count Chart */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              Predictions Made ({chartPeriod === "weekly" ? "Last 7 Days" : "Last 4 Weeks"})
            </h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartPeriod === "weekly" ? weeklyData : monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey={chartPeriod === "weekly" ? "date" : "week"} 
                    stroke="rgba(255,255,255,0.5)"
                    fontSize={10}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.5)"
                    fontSize={10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(15,23,42,0.95)", 
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      color: "white"
                    }}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                  />
                  <Bar 
                    dataKey="predictions" 
                    fill="#a855f7" 
                    radius={[4, 4, 0, 0]}
                    name="Predictions"
                  />
                  {chartPeriod === "weekly" && (
                    <Bar 
                      dataKey="highAccuracy" 
                      fill="#22c55e" 
                      radius={[4, 4, 0, 0]}
                      name="High Accuracy"
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Game-wise Accuracy Comparison (Monthly only) */}
          {chartPeriod === "monthly" && (
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-400" />
                Game-wise Accuracy Comparison
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="week" 
                      stroke="rgba(255,255,255,0.5)"
                      fontSize={10}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)"
                      fontSize={10}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "rgba(15,23,42,0.95)", 
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                        color: "white"
                      }}
                      formatter={(value: number) => [`${value}%`]}
                    />
                    <Legend 
                      wrapperStyle={{ color: "white", fontSize: "10px" }}
                    />
                    <Bar dataKey="5D" fill="#a855f7" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="K3" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="WinGo" fill="#22c55e" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="TrxWin" fill="#f97316" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Recent Predictions
          </h2>
          
          <div className="space-y-3">
            {predictions.map((pred) => (
              <div 
                key={pred.id}
                className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${getGameColor(pred.game_type)}`}>
                      {pred.game_type}
                    </span>
                    {pred.position && (
                      <span className="px-2 py-1 rounded bg-white/10 text-xs text-white/70">
                        {pred.position}
                      </span>
                    )}
                    <span className="text-xs text-white/50">
                      {format(new Date(pred.created_at), "MMM d, HH:mm")}
                    </span>
                  </div>
                  
                  {pred.verified_at ? (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getAccuracyBg(pred.accuracy_score || 0)} text-white text-xs font-bold`}>
                      <CheckCircle className="w-3 h-3" />
                      {pred.accuracy_score}%
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-500/50 text-white/70 text-xs">
                      <Clock className="w-3 h-3" />
                      Pending
                    </div>
                  )}
                </div>

                {/* Insight */}
                {pred.overall_insight && (
                  <p className="text-sm text-white/70 italic">
                    💬 {pred.overall_insight}
                  </p>
                )}

                {/* Predictions Grid */}
                <div className="grid grid-cols-1 gap-2">
                  {pred.predictions.slice(0, 3).map((p, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between bg-white/5 rounded-lg p-2"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{p.title}</span>
                          <span className={`text-xs font-bold ${getAccuracyColor(p.confidence)}`}>
                            {p.confidence}%
                          </span>
                        </div>
                        <p className="text-[10px] text-white/50">{p.reasoning}</p>
                      </div>
                      <div className="flex gap-1">
                        {p.numbers.slice(0, 5).map((num, i) => {
                          const isMatched = pred.actual_result?.includes(num);
                          return (
                            <span
                              key={i}
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isMatched 
                                  ? "bg-green-500 text-white ring-2 ring-green-300" 
                                  : "bg-white/20 text-white"
                              }`}
                            >
                              {num}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actual Result */}
                {pred.actual_result && (
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-xs text-white/50">Actual Result:</span>
                    <div className="flex gap-1">
                      {pred.actual_result.map((num, i) => (
                        <span
                          key={i}
                          className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xs font-bold text-slate-900"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            🏆 Top Performing Predictions
          </h2>
          
          <div className="space-y-2">
            {predictions
              .filter(p => p.accuracy_score && p.accuracy_score >= 80)
              .sort((a, b) => (b.accuracy_score || 0) - (a.accuracy_score || 0))
              .slice(0, 5)
              .map((pred, idx) => (
                <div 
                  key={pred.id}
                  className="flex items-center gap-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-sm font-black text-slate-900">
                    #{idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white bg-gradient-to-r ${getGameColor(pred.game_type)}`}>
                        {pred.game_type}
                      </span>
                      <span className="text-xs text-white/50">
                        {format(new Date(pred.created_at), "MMM d")}
                      </span>
                    </div>
                    <p className="text-xs text-white/70 truncate mt-0.5">
                      {pred.predictions[0]?.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-green-400">{pred.accuracy_score}%</div>
                    <div className="text-[10px] text-white/50">accuracy</div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {showDemoData && (
          <div className="text-center py-4">
            <p className="text-xs text-white/50 mb-2">
              📊 This is demo data. Your real predictions will appear after you use AI predictions in games.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/game/5d")}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start Making Predictions
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPredictionDashboard;

/* ───────────────── Game Focus Panel ───────────────── */
const GAMES_FOCUS: { id: string; label: string; emoji: string; grad: string }[] = [
  { id: "WinGo",   label: "WinGo",   emoji: "🎯", grad: "from-emerald-500 to-emerald-700" },
  { id: "K3",      label: "K3",      emoji: "🎲", grad: "from-fuchsia-500 to-purple-700" },
  { id: "5D",      label: "5D",      emoji: "🎰", grad: "from-amber-500 to-orange-700" },
  { id: "TrxWin",  label: "TRX Win", emoji: "⚡", grad: "from-rose-500 to-red-700" },
  { id: "Aviator", label: "Aviator", emoji: "✈️", grad: "from-red-500 to-rose-700" },
];

function GameFocusPanel({
  selectedGame, predictions, gameStats, onSelect, onPlay,
}: {
  selectedGame: string | null;
  predictions: PredictionRecord[];
  gameStats: GameStats[];
  onSelect: (g: string | null) => void;
  onPlay: (g: string) => void;
}) {
  const filtered = selectedGame
    ? predictions.filter((p) => p.game_type === selectedGame)
    : [];
  const stat = selectedGame ? gameStats.find((g) => g.game === selectedGame) : null;
  const meta = selectedGame ? GAMES_FOCUS.find((g) => g.id === selectedGame) : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs font-bold text-white/70 mr-1">Focus:</span>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
            !selectedGame
              ? "bg-white text-slate-900"
              : "bg-white/10 text-white hover:bg-white/15"
          }`}
        >
          All
        </button>
        {GAMES_FOCUS.map((g) => {
          const active = selectedGame === g.id;
          return (
            <button
              type="button"
              key={g.id}
              onClick={() => onSelect(g.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                active
                  ? `bg-gradient-to-r ${g.grad} text-white shadow-lg`
                  : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              <span>{g.emoji}</span> {g.label}
            </button>
          );
        })}
      </div>

      {selectedGame && meta && (
        <div className={`rounded-xl p-4 bg-gradient-to-br ${meta.grad} text-white`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{meta.emoji}</span>
              <div>
                <div className="text-lg font-black leading-tight">{meta.label} AI</div>
                <div className="text-[11px] text-white/80">Smart predictions for {meta.label}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onPlay(selectedGame)}
              className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-bold backdrop-blur transition"
            >
              Play {meta.label} →
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-lg bg-black/20 p-2 text-center">
              <div className="text-xl font-black">{stat?.total ?? 0}</div>
              <div className="text-[10px] text-white/80">Predictions</div>
            </div>
            <div className="rounded-lg bg-black/20 p-2 text-center">
              <div className="text-xl font-black">{stat?.avgAccuracy ?? 0}%</div>
              <div className="text-[10px] text-white/80">Avg Accuracy</div>
            </div>
            <div className="rounded-lg bg-black/20 p-2 text-center">
              <div className="text-xl font-black">{stat?.bestScore ?? 0}%</div>
              <div className="text-[10px] text-white/80">Best Score</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-bold text-white/90 uppercase tracking-wider">
              Recent {meta.label} predictions
            </div>
            {filtered.length === 0 ? (
              <div className="rounded-lg bg-black/20 p-3 text-xs text-white/80">
                No {meta.label} predictions yet. Play a round to start generating AI signals.
              </div>
            ) : (
              filtered.slice(0, 3).map((p) => (
                <div key={p.id} className="rounded-lg bg-black/20 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-bold">
                      {p.predictions[0]?.title ?? "AI Signal"}
                    </div>
                    {p.accuracy_score !== null && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/20">
                        {p.accuracy_score}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(p.predictions[0]?.numbers ?? []).map((n, i) => (
                      <span
                        key={i}
                        className="w-7 h-7 rounded-full bg-white text-slate-900 grid place-items-center text-xs font-black"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                  {p.predictions[0]?.reasoning && (
                    <div className="mt-1.5 text-[10px] text-white/80">
                      {p.predictions[0].reasoning}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
