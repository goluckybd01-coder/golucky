import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target, Coins, Trophy, BarChart3 } from "lucide-react";
import { formatTaka } from "@/lib/currency";

export interface SessionStats {
  totalBets: number;
  totalWins: number;
  totalBetAmount: number;
  totalWinAmount: number;
  profitLoss: number;
  highestWin: number;
  highestMultiplier: number;
  winRate: number;
}

interface AviatorSessionStatsProps {
  stats: SessionStats;
}

const AviatorSessionStats = ({ stats }: AviatorSessionStatsProps) => {
  const isProfit = stats.profitLoss >= 0;
  
  return (
    <div className="bg-gradient-to-r from-[#1a1f2e] to-[#1e2438] rounded-lg mx-2 p-2">
      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-700/50">
        <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-blue-400 text-xs font-medium">Session Stats</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <motion.div className="bg-[#252b3d]/70 rounded-lg p-1.5 text-center" whileHover={{ scale: 1.02 }}>
          <div className="flex items-center justify-center gap-1 mb-0.5"><Target className="w-3 h-3 text-gray-400" /></div>
          <div className="text-white font-bold text-sm">{stats.totalBets}</div>
          <div className="text-gray-500 text-[9px]">Bets</div>
        </motion.div>
        <motion.div className="bg-[#252b3d]/70 rounded-lg p-1.5 text-center" whileHover={{ scale: 1.02 }}>
          <div className="flex items-center justify-center gap-1 mb-0.5"><Trophy className="w-3 h-3 text-yellow-400" /></div>
          <div className="text-green-400 font-bold text-sm">{stats.totalWins}</div>
          <div className="text-gray-500 text-[9px]">Wins</div>
        </motion.div>
        <motion.div className="bg-[#252b3d]/70 rounded-lg p-1.5 text-center" whileHover={{ scale: 1.02 }}>
          <div className="flex items-center justify-center gap-1 mb-0.5"><Coins className="w-3 h-3 text-amber-400" /></div>
          <div className="text-amber-400 font-bold text-sm">{stats.totalBets > 0 ? Math.round(stats.winRate) : 0}%</div>
          <div className="text-gray-500 text-[9px]">Win Rate</div>
        </motion.div>
        <motion.div className={`rounded-lg p-1.5 text-center ${isProfit ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/20 border border-green-700/30' : 'bg-gradient-to-br from-red-900/30 to-rose-900/20 border border-red-700/30'}`} whileHover={{ scale: 1.02 }}>
          <div className="flex items-center justify-center gap-1 mb-0.5">{isProfit ? <TrendingUp className="w-3 h-3 text-green-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}</div>
          <div className={`font-bold text-sm ${isProfit ? 'text-green-400' : 'text-red-400'}`}>{isProfit ? '+' : ''}{formatTaka(stats.profitLoss)}</div>
          <div className="text-gray-500 text-[9px]">P/L</div>
        </motion.div>
      </div>
      {(stats.highestWin > 0 || stats.highestMultiplier > 1) && (
        <div className="flex justify-between mt-1.5 pt-1.5 border-t border-gray-700/30">
          {stats.highestWin > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 text-[9px]">Best Win:</span>
              <span className="text-green-400 text-[10px] font-medium">{formatTaka(stats.highestWin)}</span>
            </div>
          )}
          {stats.highestMultiplier > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 text-[9px]">Best Mult:</span>
              <span className="text-purple-400 text-[10px] font-medium">{stats.highestMultiplier.toFixed(2)}x</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AviatorSessionStats;
