import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, TrendingUp, TrendingDown, Trophy, Zap } from "lucide-react";
import { formatTaka, TAKA_SYMBOL } from "@/lib/currency";
import type { RoundPhase } from "@/pages/games/AviatorGame";

interface LiveBet {
  id: string;
  playerName: string;
  avatar: string;
  stake: number;
  autoCashout: number | null;
  cashedOut: boolean;
  cashoutMultiplier: number | null;
  timestamp: number;
}

// TopWinner interface is exported below the component props

interface AviatorLiveBetsProps {
  phase: RoundPhase;
  multiplier: number;
  crashPoint: number;
}

// Random player name generator - more realistic Bangladeshi names
const playerNames = [
  // English nicknames
  "RocketMan", "LuckyAce", "BigWinner", "CashKing", "ProGamer",
  "HighRoller", "GoldMiner", "StarPlayer", "TopBet", "FastCash",
  "BetMaster", "WinStreak", "CoinFlip", "JackpotJoe", "AcePlayer",
  "BoldBet", "QuickWin", "RiskTaker", "ChampBet", "SmartPlay",
  "SkyHigh", "MoonShot", "FireBet", "IceKing", "ThunderBolt",
  "DiamondX", "GoldenEye", "NightOwl", "DawnRider", "StormChaser",
  // Bangladeshi names  
  "Rahim_BD", "Karim_99", "Sakib_Pro", "Tamim_X", "Masud_VIP",
  "Hasan_Win", "Kabir_Bet", "Jamal_Ace", "Faruk_123", "Salim_King",
  "Rafiq_Star", "Zahid_Top", "Noman_Fly", "Imran_777", "Rubel_Go",
  "Rony_Best", "Shakil_HD", "Sohel_VIP", "Ripon_Bet", "Sumon_Win",
  // Hidden display IDs (GLU format)
  "GLU-2***41", "GLU-2***82", "GLU-2***15", "GLU-2***93", "GLU-2***67",
  "GLU-2***24", "GLU-2***58", "GLU-2***36", "GLU-2***79", "GLU-2***02",
];

const avatarColors = [
  "from-red-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-emerald-500",
  "from-purple-500 to-violet-500",
  "from-orange-500 to-amber-500",
  "from-teal-500 to-green-500",
  "from-indigo-500 to-blue-500",
  "from-rose-500 to-red-500",
  "from-yellow-500 to-orange-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-fuchsia-500 to-pink-500",
];

// Realistic stake distribution - more small bets, fewer large ones
const generateRandomStake = (): number => {
  const rand = Math.random();
  if (rand < 0.35) return [10, 20, 25, 30, 50][Math.floor(Math.random() * 5)]; // 35% small
  if (rand < 0.65) return [100, 150, 200, 250, 300][Math.floor(Math.random() * 5)]; // 30% medium
  if (rand < 0.85) return [500, 750, 1000, 1500, 2000][Math.floor(Math.random() * 5)]; // 20% large
  return [3000, 5000, 7500, 10000][Math.floor(Math.random() * 4)]; // 15% high roller
};

const generateRandomBet = (): LiveBet => {
  const autoCashouts = [null, null, 1.3, 1.5, 1.8, 2.0, 2.5, 3.0, 5.0, 10.0];
  
  return {
    id: Math.random().toString(36).substring(7),
    playerName: playerNames[Math.floor(Math.random() * playerNames.length)],
    avatar: avatarColors[Math.floor(Math.random() * avatarColors.length)],
    stake: generateRandomStake(),
    autoCashout: autoCashouts[Math.floor(Math.random() * autoCashouts.length)],
    cashedOut: false,
    cashoutMultiplier: null,
    timestamp: Date.now(),
  };
};

export interface TopWinner {
  id: string;
  playerName: string;
  avatar: string;
  stake: number;
  multiplier: number;
  payout: number;
  timestamp: number;
}

interface AviatorLiveBetsExtendedProps extends AviatorLiveBetsProps {
  onTopWinnersChange?: (winners: TopWinner[]) => void;
}

const AviatorLiveBets = ({ phase, multiplier, crashPoint, onTopWinnersChange }: AviatorLiveBetsExtendedProps) => {
  const [bets, setBets] = useState<LiveBet[]>([]);
  const [topWinners, setTopWinners] = useState<TopWinner[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'top'>('all');
  const prevPhaseRef = useRef<RoundPhase>(phase);
  
  // Notify parent of top winners changes
  useEffect(() => {
    if (onTopWinnersChange) {
      onTopWinnersChange(topWinners);
    }
  }, [topWinners, onTopWinnersChange]);
  // Generate initial bets when round starts - MORE BETS for busy feel
  useEffect(() => {
    if (phase === "WAITING" && prevPhaseRef.current === "CRASHED") {
      // New round - generate more bets for realistic feel
      const numBets = 15 + Math.floor(Math.random() * 20); // 15-35 initial bets
      const newBets = Array.from({ length: numBets }, () => generateRandomBet());
      setBets(newBets);
    }
    prevPhaseRef.current = phase;
  }, [phase]);
  
  // Add more bets during waiting phase - faster and more frequent
  useEffect(() => {
    if (phase !== "WAITING") return;
    
    const interval = setInterval(() => {
      // 70% chance to add 1-3 new bets
      if (Math.random() > 0.3) {
        const newBetsCount = 1 + Math.floor(Math.random() * 3);
        const newBets = Array.from({ length: newBetsCount }, () => generateRandomBet());
        setBets(prev => [...prev, ...newBets].slice(-50)); // Keep max 50 bets
      }
    }, 500); // Faster interval
    
    return () => clearInterval(interval);
  }, [phase]);
  
  // Simulate cashouts during running phase
  useEffect(() => {
    if (phase !== "RUNNING") return;
    
    const interval = setInterval(() => {
      setBets(prev => prev.map(bet => {
        if (bet.cashedOut) return bet;
        
        // Check auto cashout
        if (bet.autoCashout && multiplier >= bet.autoCashout) {
          return {
            ...bet,
            cashedOut: true,
            cashoutMultiplier: bet.autoCashout,
          };
        }
        
        // Random cashout (more likely at higher multipliers)
        const cashoutChance = 0.02 + (multiplier - 1) * 0.01;
        if (Math.random() < cashoutChance) {
          return {
            ...bet,
            cashedOut: true,
            cashoutMultiplier: multiplier,
          };
        }
        
        return bet;
      }));
    }, 100);
    
    return () => clearInterval(interval);
  }, [phase, multiplier]);
  
  // Mark remaining bets as lost on crash and update top winners
  useEffect(() => {
    if (phase === "CRASHED") {
      // Update top winners with this round's winners
      const winners = bets.filter(b => b.cashedOut && b.cashoutMultiplier);
      const newTopWinners: TopWinner[] = winners.map(bet => ({
        id: bet.id,
        playerName: bet.playerName,
        avatar: bet.avatar,
        stake: bet.stake,
        multiplier: bet.cashoutMultiplier || 0,
        payout: bet.stake * (bet.cashoutMultiplier || 0),
        timestamp: Date.now(),
      }));
      
      setTopWinners(prev => {
        const combined = [...newTopWinners, ...prev];
        // Sort by payout (biggest wins) and multiplier (highest cashouts)
        return combined.slice(0, 50); // Keep top 50
      });
    }
  }, [phase, bets]);
  
  // Calculate stats
  const totalBets = bets.length;
  const totalStake = bets.reduce((sum, bet) => sum + bet.stake, 0);
  const cashedOutBets = bets.filter(b => b.cashedOut);
  const totalWinnings = cashedOutBets.reduce((sum, bet) => 
    sum + (bet.stake * (bet.cashoutMultiplier || 0)), 0
  );
  
  // Get top winners sorted
  const topByPayout = [...topWinners].sort((a, b) => b.payout - a.payout).slice(0, 10);
  const topByMultiplier = [...topWinners].sort((a, b) => b.multiplier - a.multiplier).slice(0, 10);
  
  return (
    <div className="bg-[#1a1a1a] rounded-t-xl mx-2 mt-2 overflow-hidden flex-1">
      {/* Header with tabs matching reference exactly */}
      <div className="flex items-center bg-[#0B0B0B]">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'all' 
              ? 'bg-[#2d2d2d] text-white' 
              : 'bg-transparent text-gray-400 hover:text-white'
          }`}
        >
          All Bets
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'my' 
              ? 'bg-[#2d2d2d] text-white' 
              : 'bg-transparent text-gray-400 hover:text-white'
          }`}
        >
          Previous
        </button>
        <button
          onClick={() => setActiveTab('top')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'top' 
              ? 'bg-[#2d2d2d] text-white' 
              : 'bg-transparent text-gray-400 hover:text-white'
          }`}
        >
          Top
        </button>
      </div>
      
      {/* Tab content */}
      {activeTab === 'top' ? (
        <div className="max-h-48 overflow-y-auto scrollbar-hide">
          {/* Top by Payout */}
          <div className="px-3 py-2 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border-b border-yellow-800/30">
            <div className="flex items-center gap-2 text-yellow-400 text-xs font-medium mb-2">
              <Trophy className="w-3 h-3" />
              Biggest Wins
            </div>
            {topByPayout.length > 0 ? (
              <div className="space-y-1">
                {topByPayout.slice(0, 5).map((winner, index) => (
                  <motion.div
                    key={`payout-${winner.id}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-black' : 
                        index === 1 ? 'bg-gray-400 text-black' : 
                        index === 2 ? 'bg-amber-600 text-white' : 
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {index + 1}
                      </span>
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${winner.avatar} flex items-center justify-center text-[10px] font-bold text-white`}>
                        {winner.playerName.charAt(0)}
                      </div>
                      <span className="text-gray-300 text-xs truncate max-w-[60px]">
                        {winner.playerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs">
                        {winner.multiplier.toFixed(2)}x
                      </span>
                      <span className="text-green-400 font-bold text-xs">
                        +{formatTaka(winner.payout)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-xs text-center py-2">No winners yet</p>
            )}
          </div>
          
          {/* Top by Multiplier */}
          <div className="px-3 py-2 bg-gradient-to-r from-purple-900/20 to-violet-900/20">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-medium mb-2">
              <Zap className="w-3 h-3" />
              Highest Multipliers
            </div>
            {topByMultiplier.length > 0 ? (
              <div className="space-y-1">
                {topByMultiplier.slice(0, 5).map((winner, index) => (
                  <motion.div
                    key={`mult-${winner.id}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-purple-500 text-white' : 
                        index === 1 ? 'bg-purple-400 text-white' : 
                        index === 2 ? 'bg-purple-600 text-white' : 
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {index + 1}
                      </span>
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${winner.avatar} flex items-center justify-center text-[10px] font-bold text-white`}>
                        {winner.playerName.charAt(0)}
                      </div>
                      <span className="text-gray-300 text-xs truncate max-w-[60px]">
                        {winner.playerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-purple-400 font-bold text-xs">
                        {winner.multiplier.toFixed(2)}x
                      </span>
                      <span className="text-gray-400 text-xs">
                        {formatTaka(winner.payout)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-xs text-center py-2">No high multipliers yet</p>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div className="grid grid-cols-4 px-3 py-1.5 text-xs text-gray-500 border-b border-gray-800/50">
            <span>Player</span>
            <span className="text-center">Bet</span>
            <span className="text-center">Mult</span>
            <span className="text-right">Payout</span>
          </div>
          
          {/* Bets list */}
          <div className="max-h-40 overflow-y-auto scrollbar-hide">
            <AnimatePresence mode="popLayout">
              {activeTab === 'my' ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No bets placed yet
                </div>
              ) : (
                bets.slice().reverse().map((bet) => {
                  const isWinner = bet.cashedOut && bet.cashoutMultiplier;
                  const isLoser = phase === "CRASHED" && !bet.cashedOut;
                  const payout = isWinner ? bet.stake * (bet.cashoutMultiplier || 0) : 0;
                  
                  return (
                    <motion.div
                      key={bet.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`grid grid-cols-4 items-center px-3 py-1.5 text-sm border-b border-gray-800/30 ${
                        isWinner ? 'bg-green-900/20' : isLoser ? 'bg-red-900/20' : ''
                      }`}
                    >
                      {/* Player */}
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${bet.avatar} flex items-center justify-center text-xs font-bold text-white`}>
                          {bet.playerName.charAt(0)}
                        </div>
                        <span className="text-gray-300 truncate text-xs">
                          {bet.playerName.slice(0, 8)}
                        </span>
                      </div>
                      
                      {/* Bet amount */}
                      <div className="text-center text-gray-300">
                        {formatTaka(bet.stake)}
                      </div>
                      
                      {/* Multiplier */}
                      <div className="text-center">
                        {isWinner ? (
                          <span className="text-green-400 font-medium">
                            {bet.cashoutMultiplier?.toFixed(2)}x
                          </span>
                        ) : isLoser ? (
                          <span className="text-red-400">—</span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </div>
                      
                      {/* Payout */}
                      <div className="text-right">
                        {isWinner ? (
                          <span className="text-green-400 font-medium flex items-center justify-end gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {formatTaka(payout)}
                          </span>
                        ) : isLoser ? (
                          <span className="text-red-400 flex items-center justify-end gap-1">
                            <TrendingDown className="w-3 h-3" />
                            -{formatTaka(bet.stake)}
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
            
            {activeTab === 'all' && bets.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Waiting for bets...
              </div>
            )}
          </div>
          
          {/* Footer stats */}
          {phase === "CRASHED" && cashedOutBets.length > 0 && activeTab === 'all' && (
            <div className="px-3 py-2 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-t border-green-800/30">
              <div className="flex justify-between text-xs">
                <span className="text-green-400">
                  {cashedOutBets.length} winners
                </span>
                <span className="text-green-400 font-medium">
                  Total won: {formatTaka(totalWinnings)}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AviatorLiveBets;
