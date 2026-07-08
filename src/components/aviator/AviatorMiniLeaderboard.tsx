import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown, Medal } from "lucide-react";
import { formatTaka } from "@/lib/currency";

interface TopWinner {
  id: string;
  playerName: string;
  avatar: string;
  payout: number;
  multiplier: number;
}

interface AviatorMiniLeaderboardProps {
  topWinners: TopWinner[];
}

const AviatorMiniLeaderboard = ({ topWinners }: AviatorMiniLeaderboardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const top3 = [...topWinners].sort((a, b) => b.payout - a.payout).slice(0, 3);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-3 h-3 text-yellow-400" />;
      case 1: return <Medal className="w-3 h-3 text-gray-300" />;
      case 2: return <Medal className="w-3 h-3 text-amber-600" />;
      default: return null;
    }
  };

  const getRankBg = (index: number) => {
    switch (index) {
      case 0: return "from-yellow-600/30 to-amber-500/20 border-yellow-500/50";
      case 1: return "from-gray-500/20 to-slate-400/10 border-gray-400/40";
      case 2: return "from-amber-700/20 to-orange-600/10 border-amber-600/40";
      default: return "";
    }
  };

  if (top3.length === 0) {
    return (
      <div className="bg-gradient-to-r from-[#1a1f2e] to-[#252b3d] rounded-lg p-2 mx-2">
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Trophy className="w-4 h-4" />
          <span>No winners yet this session</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div layout className="bg-gradient-to-r from-[#1a1f2e] to-[#252b3d] rounded-lg mx-2 overflow-hidden">
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <motion.div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          </div>
          <span className="text-yellow-400 text-xs font-medium">Top Winners</span>
        </div>
        <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} className="text-gray-400 text-xs">▼</motion.span>
      </button>
      <div className="px-2 pb-2">
        <div className="flex gap-1">
          <AnimatePresence mode="popLayout">
            {top3.map((winner, index) => (
              <motion.div key={winner.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ delay: index * 0.1 }} className={`flex-1 bg-gradient-to-br ${getRankBg(index)} border rounded-lg p-1.5`}>
                <div className="flex items-center gap-1 mb-1">
                  {getRankIcon(index)}
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${winner.avatar} flex items-center justify-center text-[8px] font-bold text-white`}>{winner.playerName.charAt(0)}</div>
                  <span className="text-gray-300 text-[10px] truncate max-w-[40px]">{winner.playerName.slice(0, 6)}</span>
                </div>
                <div className="text-center">
                  <span className="text-green-400 font-bold text-xs block">{formatTaka(winner.payout)}</span>
                  <span className="text-gray-500 text-[9px]">{winner.multiplier.toFixed(2)}x</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && topWinners.length > 3 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-gray-700/50 overflow-hidden">
            <div className="px-2 py-2 space-y-1 max-h-24 overflow-y-auto scrollbar-hide">
              {topWinners.slice(3, 10).map((winner, index) => (
                <motion.div key={winner.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-4 text-center">{index + 4}</span>
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${winner.avatar} flex items-center justify-center text-[8px] font-bold text-white`}>{winner.playerName.charAt(0)}</div>
                    <span className="text-gray-400 truncate max-w-[60px]">{winner.playerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{winner.multiplier.toFixed(2)}x</span>
                    <span className="text-green-400 font-medium">{formatTaka(winner.payout)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AviatorMiniLeaderboard;
