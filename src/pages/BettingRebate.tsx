import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Percent, ChevronLeft, TrendingUp, Coins, Gift,
  Clock, CheckCircle2, ArrowUpRight, Sparkles, Crown, Loader2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, startOfWeek, subDays } from "date-fns";

interface RebateHistory {
  id: string;
  date: string;
  totalBet: number;
  rebateRate: number;
  rebateAmount: number;
  status: "claimed" | "pending" | "expired";
  gameType?: string;
}

interface VIPRebate {
  level: number;
  label: string;
  icon: React.ReactNode;
  rate: number;
  minBet: number;
  color: string;
}

interface GameRebateStats {
  game: string;
  rate: number;
  icon: string;
  totalBet: number;
  rebateAmount: number;
}

// VIP rebate rates configuration
const VIP_REBATE_RATES: Record<number, number> = {
  1: 0.005, // 0.5%
  2: 0.008, // 0.8%
  3: 0.01,  // 1.0%
  4: 0.015, // 1.5%
  5: 0.02,  // 2.0%
  6: 0.025, // 2.5%
  7: 0.03,  // 3.0%
  8: 0.035, // 3.5%
  9: 0.04,  // 4.0%
  10: 0.05, // 5.0%
};

// Game-specific rebate multipliers (applied on top of VIP rate)
const GAME_REBATE_MULTIPLIERS: Record<string, number> = {
  wingo: 1.2,
  trxwin: 1.2,
  k3: 1.0,
  "5d": 1.0,
  fived: 1.0,
  crash: 0.8,
  mines: 0.8,
};

const BettingRebate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [vipLevel, setVipLevel] = useState(1);
  const [todayBet, setTodayBet] = useState(0);
  const [todayRebate, setTodayRebate] = useState(0);
  const [weeklyBet, setWeeklyBet] = useState(0);
  const [weeklyRebate, setWeeklyRebate] = useState(0);
  const [rebateHistory, setRebateHistory] = useState<RebateHistory[]>([]);
  const [gameStats, setGameStats] = useState<GameRebateStats[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const currentRate = VIP_REBATE_RATES[vipLevel] || 0.005;
  const nextLevel = Math.min(vipLevel + 1, 10);
  const nextRate = VIP_REBATE_RATES[nextLevel] || currentRate;

  const vipRebates: VIPRebate[] = [
    { level: 1, label: "VIP1", icon: <Crown className="text-amber-600" size={20} />, rate: 0.5, minBet: 0, color: "from-amber-100 to-yellow-200" },
    { level: 2, label: "VIP2", icon: <Crown className="text-gray-400" size={20} />, rate: 0.8, minBet: 10000, color: "from-gray-100 to-gray-200" },
    { level: 3, label: "VIP3", icon: <Crown className="text-yellow-500" size={20} />, rate: 1.0, minBet: 50000, color: "from-yellow-100 to-amber-200" },
    { level: 4, label: "VIP4", icon: <Crown className="text-purple-500" size={20} />, rate: 1.5, minBet: 200000, color: "from-purple-100 to-violet-200" },
    { level: 5, label: "VIP5", icon: <Crown className="text-rose-500" size={20} />, rate: 2.0, minBet: 500000, color: "from-rose-100 to-pink-200" },
  ];

  const gameRebates = [
    { game: "Win Go", rate: 1.2, icon: "🎯", key: "wingo" },
    { game: "K3", rate: 1.0, icon: "🎲", key: "k3" },
    { game: "5D", rate: 1.0, icon: "🎰", key: "5d" },
    { game: "Crash", rate: 0.8, icon: "🚀", key: "crash" },
    { game: "Mines", rate: 0.8, icon: "💎", key: "mines" },
  ];

  // Calculate rebate for a bet amount based on VIP level and game type
  const calculateRebate = (betAmount: number, gameType: string, vipLvl: number): number => {
    const baseRate = VIP_REBATE_RATES[vipLvl] || 0.005;
    const gameMultiplier = GAME_REBATE_MULTIPLIERS[gameType.toLowerCase()] || 1.0;
    return betAmount * baseRate * gameMultiplier;
  };

  // Fetch user data and calculate rebates
  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setUserId(user.id);

      // Fetch user profile for VIP level
      const { data: profile } = await supabase
        .from("profiles")
        .select("vip_level")
        .eq("user_id", user.id)
        .single();

      const userVipLevel = profile?.vip_level || 1;
      setVipLevel(userVipLevel);

      // Calculate date ranges
      const today = startOfDay(new Date());
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

      // Fetch today's bets
      const { data: todayBets } = await supabase
        .from("game_bets")
        .select("bet_amount, game_type, created_at")
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString());

      // Calculate today's totals
      let todayTotal = 0;
      let todayRebateTotal = 0;
      const gameStatsMap = new Map<string, { totalBet: number; rebateAmount: number }>();

      todayBets?.forEach((bet) => {
        todayTotal += Number(bet.bet_amount);
        const rebate = calculateRebate(Number(bet.bet_amount), bet.game_type, userVipLevel);
        todayRebateTotal += rebate;

        const existing = gameStatsMap.get(bet.game_type) || { totalBet: 0, rebateAmount: 0 };
        gameStatsMap.set(bet.game_type, {
          totalBet: existing.totalBet + Number(bet.bet_amount),
          rebateAmount: existing.rebateAmount + rebate,
        });
      });

      setTodayBet(todayTotal);
      setTodayRebate(todayRebateTotal);

      // Fetch weekly bets
      const { data: weeklyBets } = await supabase
        .from("game_bets")
        .select("bet_amount, game_type")
        .eq("user_id", user.id)
        .gte("created_at", weekStart.toISOString());

      let weekTotal = 0;
      let weekRebateTotal = 0;

      weeklyBets?.forEach((bet) => {
        weekTotal += Number(bet.bet_amount);
        weekRebateTotal += calculateRebate(Number(bet.bet_amount), bet.game_type, userVipLevel);
      });

      setWeeklyBet(weekTotal);
      setWeeklyRebate(weekRebateTotal);

      // Build game stats for display
      const gameStatsArray: GameRebateStats[] = gameRebates.map((g) => {
        const stats = gameStatsMap.get(g.key) || gameStatsMap.get(g.game.toLowerCase()) || { totalBet: 0, rebateAmount: 0 };
        return {
          game: g.game,
          rate: g.rate * currentRate * 100,
          icon: g.icon,
          totalBet: stats.totalBet,
          rebateAmount: stats.rebateAmount,
        };
      });
      setGameStats(gameStatsArray);

      // Fetch daily betting history for rebate calculations (last 7 days)
      const history: RebateHistory[] = [];
      for (let i = 0; i < 7; i++) {
        const date = subDays(today, i);
        const nextDate = subDays(today, i - 1);
        
        const { data: dayBets } = await supabase
          .from("game_bets")
          .select("bet_amount, game_type")
          .eq("user_id", user.id)
          .gte("created_at", date.toISOString())
          .lt("created_at", i === 0 ? new Date().toISOString() : nextDate.toISOString());

        if (dayBets && dayBets.length > 0) {
          let dayTotal = 0;
          let dayRebate = 0;
          
          dayBets.forEach((bet) => {
            dayTotal += Number(bet.bet_amount);
            dayRebate += calculateRebate(Number(bet.bet_amount), bet.game_type, userVipLevel);
          });

          // Check if rebate was already claimed for this date
          const { data: claimed } = await supabase
            .from("wallet_transactions")
            .select("id")
            .eq("user_id", user.id)
            .eq("type", "bonus")
            .eq("description", `Betting Rebate - ${format(date, "yyyy-MM-dd")}`)
            .single();

          const status: "claimed" | "pending" | "expired" = 
            claimed ? "claimed" : 
            i <= 1 ? "pending" : "expired";

          history.push({
            id: format(date, "yyyy-MM-dd"),
            date: format(date, "yyyy-MM-dd"),
            totalBet: dayTotal,
            rebateRate: currentRate * 100,
            rebateAmount: dayRebate,
            status,
          });
        }
      }

      setRebateHistory(history);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching rebate data:", error);
      setIsLoading(false);
    }
  };

  // Claim rebate for a specific date
  const claimRebate = async (item: RebateHistory) => {
    if (!userId || item.status !== "pending") return;
    
    setClaimingId(item.id);
    
    try {
      // Use secure RPC to credit rebate
      const { data: result, error: creditError } = await supabase.rpc("credit_reward", {
        p_user_id: userId,
        p_amount: item.rebateAmount,
        p_reward_type: "betting_rebate",
        p_reason: `Betting Rebate - ${item.date}`,
      });

      const creditResult = result as { success: boolean; new_balance?: number; error?: string } | null;
      if (creditError || !creditResult?.success) {
        throw new Error(creditResult?.error || "Failed to credit rebate");
      }

      toast({
        title: "Rebate Claimed!",
        description: `৳${item.rebateAmount.toFixed(2)} has been added to your wallet.`,
      });

      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error claiming rebate:", error);
      toast({ title: "Error", description: "Failed to claim rebate", variant: "destructive" });
    } finally {
      setClaimingId(null);
    }
  };

  // Initial fetch and real-time subscription
  useEffect(() => {
    fetchData();

    // Set up real-time subscription for new bets
    const channel = supabase
      .channel("betting-rebate-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_bets",
        },
        () => {
          // Refresh data when new bets are placed
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate progress to next VIP level
  const progressToNext = vipLevel < 10 ? Math.min(((weeklyBet / (vipRebates[vipLevel]?.minBet || 10000)) * 100), 100) : 100;

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Loading rebate data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 pt-6 pb-8 px-4">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <ChevronLeft className="text-white" size={24} />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">Betting Rebate</h1>
            <p className="text-white/80 text-sm">Get cashback on every bet</p>
          </div>
        </div>

        {/* Current Rebate Stats */}
        <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-500 text-xs">Current Rebate Rate</p>
              <p className="text-3xl font-bold text-rose-600">{(currentRate * 100).toFixed(1)}%</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
              <Percent className="text-white" size={32} />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Progress to {(nextRate * 100).toFixed(1)}%</span>
              <span className="text-rose-600 font-medium">{progressToNext.toFixed(0)}%</span>
            </div>
            <Progress value={progressToNext} className="h-2" />
          </div>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="px-4 -mt-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="text-blue-500" size={16} />
              <span className="text-gray-500 text-xs">Today's Bet</span>
            </div>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(todayBet)}</p>
            <p className="text-xs text-emerald-600">Rebate: {formatCurrency(todayRebate)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="text-amber-500" size={16} />
              <span className="text-gray-500 text-xs">Weekly Bet</span>
            </div>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(weeklyBet)}</p>
            <p className="text-xs text-emerald-600">Rebate: {formatCurrency(weeklyRebate)}</p>
          </div>
        </div>
      </div>

      {/* Game Rebate Rates */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Sparkles className="text-amber-500" size={18} />
            Game Rebate Rates
          </h3>
          
          <div className="grid grid-cols-5 gap-2">
            {gameRebates.map((game) => (
              <div 
                key={game.game}
                className="flex flex-col items-center p-2 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl"
              >
                <span className="text-2xl mb-1">{game.icon}</span>
                <span className="text-[10px] text-gray-600 font-medium">{game.game}</span>
                <span className="text-xs font-bold text-rose-600">{(game.rate * currentRate * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* VIP Rebate Levels */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Crown className="text-purple-500" size={18} />
            VIP Rebate Levels
          </h3>
          
          <div className="space-y-2">
            {vipRebates.map((vip) => (
              <div 
                key={vip.level}
                className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${vip.color} ${
                  vip.level === vipLevel ? "ring-2 ring-rose-400" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center">
                  {vip.icon}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{vip.label}</p>
                  <p className="text-xs text-gray-500">Min bet: {formatCurrency(vip.minBet)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-rose-600">{vip.rate}%</p>
                  {vip.level === vipLevel && (
                    <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full">Current</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rebate History */}
      <div className="px-4 mt-4 pb-6">
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Clock className="text-gray-500" size={18} />
            Rebate History
          </h3>
          
          {rebateHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Coins size={40} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No betting activity yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rebateHistory.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{item.date}</p>
                    <p className="text-xs text-gray-500">
                      Bet: {formatCurrency(item.totalBet)} • Rate: {item.rebateRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="font-bold text-emerald-600">{formatCurrency(item.rebateAmount)}</p>
                      {item.status === "pending" ? (
                        <button
                          onClick={() => claimRebate(item)}
                          disabled={claimingId === item.id}
                          className="text-[10px] px-3 py-0.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                        >
                          {claimingId === item.id ? (
                            <Loader2 size={10} className="animate-spin inline" />
                          ) : (
                            "Claim"
                          )}
                        </button>
                      ) : (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          item.status === "claimed" 
                            ? "bg-green-100 text-green-600" 
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BettingRebate;
