import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Trophy, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Zap, 
  Award,
  Flame,
  BarChart3,
  DollarSign,
  Percent,
  Star
} from "lucide-react";
import { formatTaka } from "@/lib/currency";
import type { SessionStats } from "./AviatorSessionStats";
import type { BetHistoryEntry } from "./AviatorBetHistory";
import { ComposedChart, Line, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from "recharts";

interface AviatorSessionSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  stats: SessionStats;
  betHistory: BetHistoryEntry[];
  balance: number;
  startingBalance: number;
  sessionStartTime: Date;
  bestStreak: number;
  totalBonusEarned: number;
  onResetSession: () => void;
}

const AviatorSessionSummary = ({
  isOpen,
  onClose,
  stats,
  betHistory,
  balance,
  startingBalance,
  sessionStartTime,
  bestStreak,
  totalBonusEarned,
  onResetSession,
}: AviatorSessionSummaryProps) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  
  const sessionDuration = useMemo(() => {
    const ms = Date.now() - sessionStartTime.getTime();
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }, [sessionStartTime, isOpen]);
  
  const avgBetSize = stats.totalBets > 0 ? stats.totalBetAmount / stats.totalBets : 0;
  const balanceChange = balance - startingBalance;
  const balanceChangePercent = startingBalance > 0 ? ((balanceChange / startingBalance) * 100) : 0;
  
  const chartData = useMemo(() => {
    if (betHistory.length === 0) return [];
    const reversed = [...betHistory].reverse();
    let cumulative = 0;
    return reversed.map((entry, index) => {
      cumulative += entry.profit;
      return { bet: index + 1, profit: cumulative, outcome: entry.outcome };
    });
  }, [betHistory]);
  
  const getPerformanceRating = () => {
    if (stats.winRate >= 60 && stats.profitLoss > 0) return { label: "Excellent", color: "text-yellow-400", icon: Trophy };
    if (stats.winRate >= 50 && stats.profitLoss > 0) return { label: "Great", color: "text-green-400", icon: TrendingUp };
    if (stats.winRate >= 40) return { label: "Good", color: "text-blue-400", icon: Target };
    if (stats.profitLoss >= 0) return { label: "OK", color: "text-gray-400", icon: Zap };
    return { label: "Tough Luck", color: "text-red-400", icon: TrendingDown };
  };
  
  const rating = getPerformanceRating();
  const RatingIcon = rating.icon;
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative px-4 pt-4 pb-6 bg-gradient-to-b from-purple-900/30 to-transparent">
              <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"><X className="w-4 h-4 text-white" /></button>
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-1">Session Summary</h2>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400"><Clock className="w-4 h-4" /><span>{sessionDuration}</span></div>
              </div>
              <div className="flex justify-center mt-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 ${rating.color}`}><RatingIcon className="w-5 h-5" /><span className="font-bold">{rating.label}</span></div>
              </div>
            </div>
            <div className="px-4 -mt-2">
              <div className={`text-center p-4 rounded-xl ${stats.profitLoss >= 0 ? 'bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-700/30' : 'bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-700/30'}`}>
                <div className="text-sm text-gray-400 mb-1">Total Profit/Loss</div>
                <div className={`text-3xl font-bold ${stats.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>{stats.profitLoss >= 0 ? '+' : ''}{formatTaka(stats.profitLoss)}</div>
              </div>
            </div>
            <div className="p-4 mt-2 space-y-2">
              <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-white bg-[#2ECC71] hover:bg-[#27AE60]">Continue Playing</button>
              {!showConfirmReset ? (
                <button onClick={() => setShowConfirmReset(true)} className="w-full py-3 rounded-xl font-medium text-gray-400 bg-[#2d2d2d]">Reset Session</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setShowConfirmReset(false)} className="flex-1 py-3 rounded-xl font-medium text-gray-400 bg-[#2d2d2d]">Cancel</button>
                  <button onClick={() => { onResetSession(); setShowConfirmReset(false); onClose(); }} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600">Confirm Reset</button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AviatorSessionSummary;
