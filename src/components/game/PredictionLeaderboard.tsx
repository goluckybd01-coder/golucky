import { useState } from "react";
import { Trophy, Medal, Crown, Star, TrendingUp, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar: string;
  totalPredictions: number;
  avgAccuracy: number;
  perfectPredictions: number;
  streak: number;
  isCurrentUser?: boolean;
}

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: "PredictionKing", avatar: "👑", totalPredictions: 245, avgAccuracy: 89, perfectPredictions: 32, streak: 12 },
  { rank: 2, username: "LuckyMaster88", avatar: "🎯", totalPredictions: 189, avgAccuracy: 85, perfectPredictions: 24, streak: 8 },
  { rank: 3, username: "WinGoChamp", avatar: "🏆", totalPredictions: 312, avgAccuracy: 82, perfectPredictions: 28, streak: 6 },
  { rank: 4, username: "AIWizard", avatar: "🧙", totalPredictions: 156, avgAccuracy: 81, perfectPredictions: 18, streak: 5 },
  { rank: 5, username: "NumberNinja", avatar: "🥷", totalPredictions: 278, avgAccuracy: 79, perfectPredictions: 22, streak: 7 },
  { rank: 6, username: "PatternPro", avatar: "📊", totalPredictions: 198, avgAccuracy: 77, perfectPredictions: 15, streak: 4 },
  { rank: 7, username: "You", avatar: "⭐", totalPredictions: 166, avgAccuracy: 76, perfectPredictions: 12, streak: 5, isCurrentUser: true },
  { rank: 8, username: "StatsMaster", avatar: "📈", totalPredictions: 145, avgAccuracy: 74, perfectPredictions: 10, streak: 3 },
  { rank: 9, username: "LotteryGuru", avatar: "🎰", totalPredictions: 223, avgAccuracy: 72, perfectPredictions: 14, streak: 4 },
  { rank: 10, username: "GameTheory99", avatar: "🎮", totalPredictions: 134, avgAccuracy: 70, perfectPredictions: 8, streak: 2 },
];

interface PredictionLeaderboardProps {
  userStats?: {
    totalPredictions: number;
    avgAccuracy: number;
    perfectPredictions: number;
    streak: number;
  };
}

export const PredictionLeaderboard = ({ userStats }: PredictionLeaderboardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"weekly" | "monthly" | "allTime">("weekly");

  const leaderboard = userStats 
    ? DEMO_LEADERBOARD.map(entry => 
        entry.isCurrentUser 
          ? { ...entry, ...userStats }
          : entry
      )
    : DEMO_LEADERBOARD;

  const displayedEntries = isExpanded ? leaderboard : leaderboard.slice(0, 5);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-white/50">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number, isCurrentUser?: boolean) => {
    if (isCurrentUser) return "bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-blue-500/50";
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30";
      default:
        return "bg-white/5 border-white/10";
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                Leaderboard
                <Users className="w-4 h-4 text-white/50" />
              </h3>
              <p className="text-xs text-white/60">Top Predictors</p>
            </div>
          </div>

          <div className="flex gap-1 bg-white/10 rounded-lg p-0.5">
            {(["weekly", "monthly", "allTime"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-medium transition-all",
                  selectedPeriod === period
                    ? "bg-white text-slate-900"
                    : "text-white/70 hover:text-white"
                )}
              >
                {period === "weekly" ? "Week" : period === "monthly" ? "Month" : "All"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {displayedEntries.map((entry) => (
          <div
            key={entry.rank}
            className={cn(
              "relative flex items-center gap-3 p-3 rounded-xl border transition-all",
              getRankBg(entry.rank, entry.isCurrentUser),
              entry.isCurrentUser && "ring-2 ring-blue-500/50"
            )}
          >
            <div className="flex-shrink-0 w-8 flex justify-center">
              {getRankIcon(entry.rank)}
            </div>

            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl">
              {entry.avatar}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-semibold text-sm truncate",
                  entry.isCurrentUser ? "text-blue-400" : "text-white"
                )}>
                  {entry.username}
                </span>
                {entry.isCurrentUser && (
                  <span className="px-1.5 py-0.5 bg-blue-500/30 rounded text-[8px] text-blue-300 font-medium">
                    YOU
                  </span>
                )}
                {entry.streak >= 5 && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-500/30 rounded text-[8px] text-orange-300 font-medium">
                    🔥 {entry.streak}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] text-white/50">
                  {entry.totalPredictions} predictions
                </span>
                <span className="text-[10px] text-white/50">
                  ⭐ {entry.perfectPredictions} perfect
                </span>
              </div>
            </div>

            <div className="flex-shrink-0 text-right">
              <div className={cn(
                "text-lg font-black",
                entry.avgAccuracy >= 85 ? "text-green-400" :
                entry.avgAccuracy >= 75 ? "text-yellow-400" :
                "text-orange-400"
              )}>
                {entry.avgAccuracy}%
              </div>
              <div className="text-[10px] text-white/50 flex items-center justify-end gap-1">
                <TrendingUp className="w-3 h-3" />
                accuracy
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-white/60 hover:text-white hover:bg-white/10"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              Show All ({leaderboard.length})
            </>
          )}
        </Button>
      </div>

      {!isExpanded && (
        <div className="border-t border-white/10 p-3 bg-blue-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white/70">Your Rank</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-blue-400">
                #{leaderboard.find(e => e.isCurrentUser)?.rank || 7}
              </span>
              <span className="text-xs text-white/50">
                of {leaderboard.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
