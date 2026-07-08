/**
 * AviatorLiveBetsFeed - Real-time live bets feed component
 * Shows anonymized public bets with realtime updates
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, TrendingUp, TrendingDown, Trophy, Zap, Users, Activity } from "lucide-react";
import { formatTaka } from "@/lib/currency";
import type { LiveBet, AviatorPhase } from "@/hooks/useAviatorLiveSync";

interface AviatorLiveBetsFeedProps {
  phase: AviatorPhase;
  multiplier: number;
  liveBets: LiveBet[];
  playerCount: number;
  totalBets: number;
}

const AviatorLiveBetsFeed = ({ 
  phase, 
  multiplier, 
  liveBets, 
  playerCount,
  totalBets,
}: AviatorLiveBetsFeedProps) => {
  const [activeTab, setActiveTab] = useState<'all' | 'winners' | 'top'>('all');
  
  const winners = liveBets.filter(b => b.outcome === "cashed_out");
  const pending = liveBets.filter(b => b.outcome === "pending");
  const crashed = liveBets.filter(b => b.outcome === "crashed");
  
  const totalWinnings = winners.reduce((sum, bet) => 
    sum + (bet.bet_amount * (bet.cashout_multiplier || 1)), 0
  );
  
  const topWinners = [...winners]
    .sort((a, b) => 
      (b.bet_amount * (b.cashout_multiplier || 1)) - 
      (a.bet_amount * (a.cashout_multiplier || 1))
    )
    .slice(0, 10);

  return (
    <div className="bg-[#1a1a1a] rounded-t-xl mx-2 mt-2 overflow-hidden flex-1 border border-white/5">
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#0f0f0f] to-[#141414] border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400 text-xs font-medium">{playerCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-blue-400 text-xs font-medium">{formatTaka(totalBets)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-green-400 text-xs">LIVE</span>
        </div>
      </div>

      <div className="flex items-center bg-[#0B0B0B]">
        <button onClick={() => setActiveTab('all')} className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activeTab === 'all' ? 'bg-[#2d2d2d] text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}>All Bets ({liveBets.length})</button>
        <button onClick={() => setActiveTab('winners')} className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activeTab === 'winners' ? 'bg-[#2d2d2d] text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}>Winners ({winners.length})</button>
        <button onClick={() => setActiveTab('top')} className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activeTab === 'top' ? 'bg-[#2d2d2d] text-white' : 'bg-transparent text-gray-400 hover:text-white'}`}>Top</button>
      </div>

      {activeTab === 'top' ? (
        <div className="max-h-48 overflow-y-auto scrollbar-hide">
          <div className="px-3 py-2 bg-gradient-to-r from-yellow-900/20 to-amber-900/20">
            <div className="flex items-center gap-2 text-yellow-400 text-xs font-medium mb-2">
              <Trophy className="w-3 h-3" />Biggest Wins This Round
            </div>
            {topWinners.length > 0 ? (
              <div className="space-y-1.5">
                {topWinners.map((bet, index) => (
                  <motion.div key={bet.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-gray-400 text-black' : index === 2 ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}>{index + 1}</span>
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${bet.avatar_color || 'from-blue-500 to-cyan-500'} flex items-center justify-center text-[10px] font-bold text-white`}>{(bet.display_name || 'P')[0]}</div>
                      <span className="text-gray-300 text-xs truncate max-w-[60px]">{bet.display_name || 'Player***'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs">{bet.cashout_multiplier?.toFixed(2)}x</span>
                      <span className="text-green-400 font-bold text-xs">+{formatTaka(bet.bet_amount * (bet.cashout_multiplier || 1))}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-xs text-center py-2">No winners yet</p>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 px-3 py-1.5 text-[10px] text-gray-500 border-b border-gray-800/50 uppercase tracking-wide">
            <span>Player</span><span className="text-center">Bet</span><span className="text-center">Mult</span><span className="text-right">Payout</span>
          </div>
          <div className="max-h-40 overflow-y-auto scrollbar-hide">
            <AnimatePresence mode="popLayout">
              {(activeTab === 'winners' ? winners : liveBets).map((bet) => {
                const isWinner = bet.outcome === "cashed_out";
                const isLoser = bet.outcome === "crashed";
                const isPending = bet.outcome === "pending";
                const payout = isWinner ? bet.bet_amount * (bet.cashout_multiplier || 0) : 0;
                return (
                  <motion.div key={bet.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className={`grid grid-cols-4 items-center px-3 py-1.5 text-sm border-b border-gray-800/30 ${isWinner ? 'bg-green-900/20' : isLoser ? 'bg-red-900/20' : ''}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${bet.avatar_color || 'from-blue-500 to-cyan-500'} flex items-center justify-center text-[10px] font-bold text-white`}>{(bet.display_name || 'P')[0]}</div>
                      <span className="text-gray-300 truncate text-xs">{(bet.display_name || 'Player***').slice(0, 8)}</span>
                    </div>
                    <div className="text-center text-gray-300 text-xs">{formatTaka(bet.bet_amount)}</div>
                    <div className="text-center">
                      {isWinner ? <span className="text-green-400 font-medium text-xs">{bet.cashout_multiplier?.toFixed(2)}x</span> : isLoser ? <span className="text-red-400 text-xs">—</span> : isPending ? <span className="text-yellow-400 text-xs animate-pulse">{multiplier.toFixed(2)}x</span> : <span className="text-gray-500">—</span>}
                    </div>
                    <div className="text-right">
                      {isWinner ? <span className="text-green-400 font-medium flex items-center justify-end gap-1 text-xs"><TrendingUp className="w-3 h-3" />{formatTaka(payout)}</span> : isLoser ? <span className="text-red-400 flex items-center justify-end gap-1 text-xs"><TrendingDown className="w-3 h-3" />-{formatTaka(bet.bet_amount)}</span> : isPending ? <span className="text-yellow-400 text-xs font-medium animate-pulse">{formatTaka(bet.bet_amount * multiplier)}</span> : <span className="text-gray-500 text-xs">—</span>}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {liveBets.length === 0 && <div className="text-center py-4 text-gray-500 text-sm">Waiting for bets...</div>}
          </div>
          {phase === "crashed" && winners.length > 0 && activeTab === 'all' && (
            <div className="px-3 py-2 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-t border-green-800/30">
              <div className="flex justify-between text-xs">
                <span className="text-green-400">{winners.length} winners</span>
                <span className="text-green-400 font-medium">Total won: {formatTaka(totalWinnings)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AviatorLiveBetsFeed;
