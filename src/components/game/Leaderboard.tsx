import { useState, useEffect, useMemo, useCallback } from "react";
import { Trophy, Crown, Medal, Star, TrendingUp, Users, Loader2, RefreshCw, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";

interface LeaderboardEntry {
  rank: number;
  username: string;
  totalWin: number;
  winCount: number;
  avatar?: string;
  isNew?: boolean;
}

interface LeaderboardProps {
  gameType: string;
  className?: string;
}

// Generate impressive mock data with big amounts
const generateMockData = (): LeaderboardEntry[] => {
  const players = [
    { name: "🏆 MegaChampion", totalWin: 2547800, winCount: 342 },
    { name: "💎 DiamondKing", totalWin: 1892450, winCount: 289 },
    { name: "🔥 FireStorm99", totalWin: 1456230, winCount: 256 },
    { name: "⭐ StarPlayer77", totalWin: 1234560, winCount: 198 },
    { name: "👑 RoyalAce88", totalWin: 987650, winCount: 167 },
    { name: "🚀 RocketWinner", totalWin: 845320, winCount: 145 },
    { name: "💰 GoldRush2024", totalWin: 756890, winCount: 132 },
    { name: "🎯 BullseyePro", totalWin: 654320, winCount: 118 },
    { name: "⚡ LightningBet", totalWin: 543210, winCount: 98 },
    { name: "🌟 LuckyStar45", totalWin: 432100, winCount: 87 },
  ];
  
  return players.map((p, i) => ({
    rank: i + 1,
    username: p.name,
    totalWin: p.totalWin,
    winCount: p.winCount,
  }));
};

// Simulate real-time new winners
const generateNewWinner = (existingEntries: LeaderboardEntry[]): LeaderboardEntry | null => {
  const newNames = [
    "🎲 DiceKing", "💫 CometRider", "🏅 Champion01", "🎰 SlotMaster", 
    "💵 CashFlow", "🌙 MoonShot", "🔮 MysticWin", "⚔️ BattleAce"
  ];
  
  const randomName = newNames[Math.floor(Math.random() * newNames.length)];
  const newWinAmount = Math.floor(Math.random() * 150000) + 50000; // 50k-200k win
  
  // Check if this simulated win would affect rankings
  const lowestTop10 = existingEntries[9]?.totalWin || 0;
  
  if (newWinAmount > lowestTop10 * 0.3) { // Simulate someone climbing up
    const existingPlayer = existingEntries[Math.floor(Math.random() * 5) + 5]; // Pick from rank 6-10
    if (existingPlayer) {
      return {
        ...existingPlayer,
        totalWin: existingPlayer.totalWin + newWinAmount,
        winCount: existingPlayer.winCount + 1,
        isNew: true,
      };
    }
  }
  
  return null;
};

const Leaderboard = ({ gameType, className = "" }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "all">("today");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [newWinnerAlert, setNewWinnerAlert] = useState<string | null>(null);
  const { isDark } = useTheme();

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    
    try {
      // Calculate date range based on filter
      let startDate: string | undefined;
      const now = new Date();
      
      if (timeFilter === "today") {
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      } else if (timeFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString();
      }

      // Query wallet_transactions for wins
      let query = supabase
        .from("wallet_transactions")
        .select("user_id, amount")
        .eq("type", "win");

      if (startDate) {
        query = query.gte("created_at", startDate);
      }

      if (gameType && gameType !== "all") {
        query = query.eq("game_type", gameType);
      }

      const { data: transactions, error } = await query;

      if (error) {
        console.error("Leaderboard fetch error:", error);
        setEntries(generateMockData());
        return;
      }

      if (!transactions || transactions.length === 0) {
        setEntries(generateMockData());
        return;
      }

      // Aggregate by user
      const userWins: Record<string, { totalWin: number; winCount: number }> = {};
      transactions.forEach((tx) => {
        if (!userWins[tx.user_id]) {
          userWins[tx.user_id] = { totalWin: 0, winCount: 0 };
        }
        userWins[tx.user_id].totalWin += Number(tx.amount);
        userWins[tx.user_id].winCount += 1;
      });

      // Convert to array and sort
      const sortedUsers = Object.entries(userWins)
        .map(([userId, stats]) => ({
          rank: 0,
          username: `User_${userId.slice(0, 6)}`,
          totalWin: stats.totalWin,
          winCount: stats.winCount,
        }))
        .sort((a, b) => b.totalWin - a.totalWin)
        .slice(0, 10)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      setEntries(sortedUsers.length > 0 ? sortedUsers : generateMockData());
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Leaderboard error:", err);
      setEntries(generateMockData());
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [gameType, timeFilter]);

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Real-time subscription to wallet_transactions
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions',
          filter: 'type=eq.win'
        },
        (payload) => {
          console.log('New win detected:', payload);
          // Refresh leaderboard when new win is recorded
          fetchLeaderboard(true);
          
          // Show notification
          const amount = payload.new?.amount || 0;
          if (amount > 0) {
            setNewWinnerAlert(`নতুন জয়! ৳${Number(amount).toLocaleString()}`);
            setTimeout(() => setNewWinnerAlert(null), 3000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  // Simulated demo updates (every 8-15 seconds for demo effect)
  useEffect(() => {
    const simulateNewWinner = () => {
      const randomDelay = Math.floor(Math.random() * 7000) + 8000; // 8-15 seconds
      
      return setTimeout(() => {
        setEntries(prev => {
          const newWinner = generateNewWinner(prev);
          if (newWinner) {
            // Update the entry
            const updated = prev.map(e => 
              e.username === newWinner.username 
                ? { ...newWinner, isNew: true }
                : { ...e, isNew: false }
            );
            
            // Re-sort and re-rank
            const sorted = updated
              .sort((a, b) => b.totalWin - a.totalWin)
              .map((e, i) => ({ ...e, rank: i + 1 }));
            
            // Show notification
            const winAmount = newWinner.totalWin - (prev.find(e => e.username === newWinner.username)?.totalWin || 0);
            setNewWinnerAlert(`🎉 ${newWinner.username} জিতেছেন ৳${winAmount.toLocaleString()}!`);
            setTimeout(() => setNewWinnerAlert(null), 3000);
            
            // Toast notification
            toast.success(`${newWinner.username} র‍্যাঙ্কিং এ উঠেছে!`, {
              description: `৳${winAmount.toLocaleString()} জিতেছে`,
              duration: 2000,
            });
            
            setLastUpdate(new Date());
            return sorted;
          }
          return prev;
        });
      }, randomDelay);
    };

    let timeout = simulateNewWinner();
    
    // Keep simulating
    const interval = setInterval(() => {
      clearTimeout(timeout);
      timeout = simulateNewWinner();
    }, 15000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // Clear "new" flags after animation
  useEffect(() => {
    const timeout = setTimeout(() => {
      setEntries(prev => prev.map(e => ({ ...e, isNew: false })));
    }, 2000);
    return () => clearTimeout(timeout);
  }, [entries]);

  // Get rank icon
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="text-yellow-400" size={20} />;
    if (rank === 2) return <Medal className="text-gray-400" size={18} />;
    if (rank === 3) return <Medal className="text-amber-600" size={18} />;
    return <span className={`text-sm font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}>{rank}</span>;
  };

  return (
    <div className={`p-3 ${className}`}>
      {/* New winner alert banner */}
      {newWinnerAlert && (
        <div 
          className="mb-3 px-3 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center text-sm font-bold animate-pulse"
          style={{ animation: "slideDown 0.3s ease-out" }}
        >
          <Zap className="inline-block mr-1" size={16} />
          {newWinnerAlert}
        </div>
      )}

      {/* Header with filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="text-yellow-500" size={20} />
          <span className={`font-bold ${isDark ? "text-gray-200" : "text-gray-800"}`}>
            Top Winners
          </span>
          {/* Live indicator */}
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-[8px] text-red-500 font-bold">LIVE</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => fetchLeaderboard(true)}
            disabled={isRefreshing}
            className={`p-1.5 rounded-full transition-all ${
              isDark ? "bg-slate-700 hover:bg-slate-600" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <RefreshCw className={`${isRefreshing ? "animate-spin" : ""} ${isDark ? "text-gray-400" : "text-gray-600"}`} size={14} />
          </button>
          {(["today", "week", "all"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                timeFilter === filter
                  ? "bg-orange-500 text-white"
                  : isDark
                    ? "bg-slate-700 text-gray-400"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {filter === "today" ? "আজ" : filter === "week" ? "সপ্তাহ" : "সব"}
            </button>
          ))}
        </div>
      </div>

      {/* Last update indicator */}
      <div className={`text-[9px] text-center mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
        আপডেট: {lastUpdate.toLocaleTimeString('bn-BD')}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-orange-500" size={24} />
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          <div className="flex justify-center items-end gap-2 mb-4">
            {/* 2nd place */}
            {entries[1] && (
              <div className={`flex flex-col items-center transition-all duration-500 ${entries[1].isNew ? "scale-110" : ""}`}>
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${entries[1].isNew ? "ring-2 ring-green-400 ring-offset-2" : ""}`}
                  style={{ background: "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)" }}
                >
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <div 
                  className="w-16 rounded-t-lg flex flex-col items-center py-2"
                  style={{ 
                    height: 60, 
                    background: isDark 
                      ? "linear-gradient(180deg, #374151 0%, #1f2937 100%)" 
                      : "linear-gradient(180deg, #e5e7eb 0%, #d1d5db 100%)" 
                  }}
                >
                  <span className={`text-[9px] font-bold truncate max-w-14 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    {entries[1].username.replace(/^[^\w]+/, '')}
                  </span>
                  <span className={`text-[10px] font-bold text-green-500 ${entries[1].isNew ? "animate-pulse" : ""}`}>
                    ৳{entries[1].totalWin.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* 1st place */}
            {entries[0] && (
              <div className={`flex flex-col items-center -mt-4 transition-all duration-500 ${entries[0].isNew ? "scale-110" : ""}`}>
                <Crown className="text-yellow-400 mb-1" size={24} style={{ animation: "pulse 2s infinite" }} />
                <div 
                  className={`w-14 h-14 rounded-full flex items-center justify-center mb-1 ring-2 ring-yellow-400 ${entries[0].isNew ? "ring-4 ring-green-400" : ""}`}
                  style={{ background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)" }}
                >
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <div 
                  className="w-20 rounded-t-lg flex flex-col items-center py-2"
                  style={{ 
                    height: 80, 
                    background: isDark 
                      ? "linear-gradient(180deg, #b45309 0%, #92400e 100%)" 
                      : "linear-gradient(180deg, #fde047 0%, #fbbf24 100%)" 
                  }}
                >
                  <span className={`text-[10px] font-bold truncate max-w-18 ${isDark ? "text-white" : "text-gray-800"}`}>
                    {entries[0].username.replace(/^[^\w]+/, '')}
                  </span>
                  <span className={`text-[11px] font-bold text-green-500 ${entries[0].isNew ? "animate-pulse" : ""}`}>
                    ৳{entries[0].totalWin.toLocaleString()}
                  </span>
                  <span className={`text-[8px] ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                    {entries[0].winCount} wins
                  </span>
                </div>
              </div>
            )}

            {/* 3rd place */}
            {entries[2] && (
              <div className={`flex flex-col items-center transition-all duration-500 ${entries[2].isNew ? "scale-110" : ""}`}>
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${entries[2].isNew ? "ring-2 ring-green-400 ring-offset-2" : ""}`}
                  style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
                >
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <div 
                  className="w-16 rounded-t-lg flex flex-col items-center py-2"
                  style={{ 
                    height: 50, 
                    background: isDark 
                      ? "linear-gradient(180deg, #78350f 0%, #451a03 100%)" 
                      : "linear-gradient(180deg, #fde68a 0%, #fcd34d 100%)" 
                  }}
                >
                  <span className={`text-[9px] font-bold truncate max-w-14 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    {entries[2].username.replace(/^[^\w]+/, '')}
                  </span>
                  <span className={`text-[10px] font-bold text-green-500 ${entries[2].isNew ? "animate-pulse" : ""}`}>
                    ৳{entries[2].totalWin.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Rest of the list */}
          <div className="space-y-2">
            {entries.slice(3).map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-500 ${
                  isDark ? "bg-slate-800" : "bg-gray-50"
                } ${entry.isNew ? "ring-2 ring-green-400 scale-[1.02]" : ""}`}
              >
                {/* Rank */}
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-200 dark:bg-slate-700">
                  {getRankIcon(entry.rank)}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                    {entry.username}
                  </p>
                  <p className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    {entry.winCount} wins
                  </p>
                </div>

                {/* Win amount */}
                <div className="text-right">
                  <p className={`text-sm font-bold text-green-500 ${entry.isNew ? "animate-pulse" : ""}`}>
                    ৳{entry.totalWin.toLocaleString()}
                  </p>
                  <div className="flex items-center justify-end gap-0.5">
                    <TrendingUp className="text-green-500" size={10} />
                    <span className="text-[9px] text-green-500">+{Math.floor(Math.random() * 20) + 5}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats footer */}
          <div 
            className={`flex items-center justify-center gap-4 mt-4 pt-3 border-t ${
              isDark ? "border-slate-700" : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-1">
              <Users className={isDark ? "text-gray-500" : "text-gray-400"} size={14} />
              <span className={`text-[10px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {entries.length} Players
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="text-yellow-500" size={14} />
              <span className={`text-[10px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                ৳{entries.reduce((sum, e) => sum + e.totalWin, 0).toLocaleString()} Total
              </span>
            </div>
          </div>
        </>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;
