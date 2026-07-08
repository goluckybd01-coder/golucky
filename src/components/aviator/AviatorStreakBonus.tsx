import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap, Crown, Star, Trophy, Sparkles, X, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatTaka } from "@/lib/currency";

// Streak bonus configuration
export interface StreakBonusTier {
  streak: number;
  bonus: number;
  name: string;
  icon: "flame" | "zap" | "star" | "crown" | "trophy";
}

export interface AviatorStreakConfig {
  bonusTiers: StreakBonusTier[];
  maxBonus: number;
  resetOnLoss: boolean;
}

export interface AviatorStreakState {
  currentStreak: number;
  bestStreak: number;
  totalBonusEarned: number;
}

interface AviatorStreakBonusProps {
  streakState: AviatorStreakState;
  config?: AviatorStreakConfig;
  compact?: boolean;
}

const ICON_MAP = {
  flame: Flame,
  zap: Zap,
  star: Star,
  crown: Crown,
  trophy: Trophy,
};

export const defaultAviatorStreakConfig: AviatorStreakConfig = {
  bonusTiers: [
    { streak: 2, bonus: 1.05, name: "Hot", icon: "flame" },
    { streak: 3, bonus: 1.10, name: "On Fire", icon: "flame" },
    { streak: 5, bonus: 1.20, name: "Blazing", icon: "zap" },
    { streak: 7, bonus: 1.35, name: "Unstoppable", icon: "star" },
    { streak: 10, bonus: 1.50, name: "Legendary", icon: "crown" },
    { streak: 15, bonus: 2.00, name: "Godlike", icon: "trophy" },
  ],
  maxBonus: 2.0,
  resetOnLoss: true,
};

// Calculate bonus multiplier for a given streak
export function getAviatorStreakBonus(
  streak: number, 
  config: AviatorStreakConfig = defaultAviatorStreakConfig
): { multiplier: number; tier: StreakBonusTier | null } {
  if (streak < 2) return { multiplier: 1.0, tier: null };
  
  let activeTier: StreakBonusTier | null = null;
  for (const tier of config.bonusTiers) {
    if (streak >= tier.streak) {
      activeTier = tier;
    }
  }
  
  return {
    multiplier: activeTier ? Math.min(activeTier.bonus, config.maxBonus) : 1.0,
    tier: activeTier,
  };
}

// Calculate payout with streak bonus
export function calculateAviatorStreakPayout(
  basePayout: number, 
  streak: number, 
  config: AviatorStreakConfig = defaultAviatorStreakConfig
): { 
  finalPayout: number; 
  bonusAmount: number; 
  multiplier: number;
  tier: StreakBonusTier | null;
} {
  const { multiplier, tier } = getAviatorStreakBonus(streak, config);
  const finalPayout = basePayout * multiplier;
  const bonusAmount = finalPayout - basePayout;
  
  return { finalPayout, bonusAmount, multiplier, tier };
}

const AviatorStreakBonus = ({ 
  streakState, 
  config = defaultAviatorStreakConfig,
  compact = false 
}: AviatorStreakBonusProps) => {
  const [showFullPanel, setShowFullPanel] = useState(false);
  const { multiplier, tier } = getAviatorStreakBonus(streakState.currentStreak, config);
  const nextTier = config.bonusTiers.find(t => t.streak > streakState.currentStreak);
  
  const getStreakColor = () => {
    if (streakState.currentStreak >= 10) return "from-yellow-500 to-amber-600";
    if (streakState.currentStreak >= 7) return "from-purple-500 to-violet-600";
    if (streakState.currentStreak >= 5) return "from-cyan-500 to-blue-600";
    if (streakState.currentStreak >= 3) return "from-orange-500 to-red-600";
    if (streakState.currentStreak >= 2) return "from-orange-400 to-orange-600";
    return "from-slate-500 to-slate-600";
  };

  const getGlowClass = () => {
    if (streakState.currentStreak >= 10) return "shadow-yellow-500/50";
    if (streakState.currentStreak >= 7) return "shadow-purple-500/50";
    if (streakState.currentStreak >= 5) return "shadow-cyan-500/50";
    if (streakState.currentStreak >= 3) return "shadow-orange-500/50";
    return "";
  };

  const IconComponent = tier ? ICON_MAP[tier.icon] : Flame;
  const bonusPercent = multiplier > 1 ? Math.round((multiplier - 1) * 100) : 0;
  const progressToNext = nextTier 
    ? (streakState.currentStreak / nextTier.streak) * 100 
    : 100;

  // Full panel modal
  const FullPanelModal = () => (
    <AnimatePresence>
      {showFullPanel && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={() => setShowFullPanel(false)}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
              {/* Close button */}
              <button
                onClick={() => setShowFullPanel(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors z-10"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
              
              {/* Header */}
              <div className={`relative p-4 border-b border-slate-700/50 bg-gradient-to-r ${getStreakColor()} bg-opacity-20`}>
                <div className="flex items-center gap-3">
                  <motion.div 
                    className={`p-2.5 rounded-xl bg-gradient-to-br ${getStreakColor()} shadow-lg ${getGlowClass()}`}
                    animate={streakState.currentStreak >= 3 ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Streak Bonus</h3>
                    <p className="text-xs text-slate-400">Win consecutively to earn bonus payouts!</p>
                  </div>
                </div>
                {tier && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-12"
                  >
                    <Badge className={`bg-gradient-to-r ${getStreakColor()} text-white border-0 px-3 py-1`}>
                      {tier.name}
                    </Badge>
                  </motion.div>
                )}
              </div>

              {/* Stats Section */}
              <div className="p-4 space-y-4">
                {/* Current Streak & Bonus Display */}
                <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className={`relative flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${getStreakColor()} shadow-lg ${getGlowClass()}`}
                      animate={streakState.currentStreak >= 3 ? { scale: [1, 1.02, 1] } : {}}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      {streakState.currentStreak >= 5 && (
                        <>
                          <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
                          <Sparkles className="absolute -bottom-1 -left-1 w-3 h-3 text-orange-300 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
                        </>
                      )}
                      <div className="text-center">
                        <div className="text-2xl font-black text-white">{streakState.currentStreak}</div>
                        <div className="text-[10px] text-white/80 font-medium">WINS</div>
                      </div>
                    </motion.div>
                    
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Current Bonus</div>
                      <motion.div
                        key={bonusPercent}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className={`text-2xl font-black ${multiplier > 1 ? 'text-green-400' : 'text-slate-500'}`}
                      >
                        {multiplier > 1 ? `+${bonusPercent}%` : 'None'}
                      </motion.div>
                      {multiplier > 1 && (
                        <div className="text-xs text-green-400/80">
                          {multiplier.toFixed(2)}x payout multiplier
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right space-y-2">
                    <div>
                      <div className="text-[10px] text-slate-500">Best Streak</div>
                      <div className="text-lg font-bold text-amber-400 flex items-center gap-1 justify-end">
                        <Trophy className="w-4 h-4" />
                        {streakState.bestStreak}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Total Bonus Earned</div>
                      <div className="text-sm font-bold text-green-400">
                        {formatTaka(streakState.totalBonusEarned)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress to Next Tier */}
                {nextTier && (
                  <div className="bg-slate-800/30 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">
                        Next: <span className="text-white font-medium">{nextTier.name}</span>
                      </span>
                      <span className="text-cyan-400 font-bold">
                        +{Math.round((nextTier.bonus - 1) * 100)}% bonus
                      </span>
                    </div>
                    <Progress value={progressToNext} className="h-2 bg-slate-700" />
                    <div className="text-xs text-slate-500 text-center">
                      {nextTier.streak - streakState.currentStreak} more win{nextTier.streak - streakState.currentStreak !== 1 ? 's' : ''} needed
                    </div>
                  </div>
                )}

                {/* All Tiers Grid */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">All Bonus Tiers</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {config.bonusTiers.map((bonusTier, idx) => {
                      const TierIcon = ICON_MAP[bonusTier.icon];
                      const isActive = streakState.currentStreak >= bonusTier.streak;
                      const isCurrent = tier?.streak === bonusTier.streak;
                      
                      return (
                        <motion.div 
                          key={idx}
                          initial={false}
                          animate={isCurrent ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                          transition={{ duration: 1.5, repeat: isCurrent ? Infinity : 0 }}
                          className={`relative p-3 rounded-xl border text-center transition-all ${
                            isCurrent 
                              ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/50 shadow-lg shadow-green-500/20' 
                              : isActive 
                                ? 'bg-slate-700/50 border-slate-600' 
                                : 'bg-slate-800/30 border-slate-700/30 opacity-50'
                          }`}
                        >
                          {isCurrent && (
                            <div className="absolute -top-1 -right-1">
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                              </span>
                            </div>
                          )}
                          <TierIcon className={`w-5 h-5 mx-auto mb-1 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                          <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-500'}`}>
                            {bonusTier.name}
                          </div>
                          <div className={`text-[11px] ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
                            {bonusTier.streak}+ wins
                          </div>
                          <div className={`text-sm font-bold mt-1 ${isActive ? 'text-green-400' : 'text-slate-600'}`}>
                            +{Math.round((bonusTier.bonus - 1) * 100)}%
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Info Note */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-xs text-amber-200/80 text-center">
                    💡 Streak resets when you lose. Cash out at the right time to keep your streak alive!
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Compact view for inline display
  if (compact) {
    if (streakState.currentStreak === 0 && streakState.bestStreak === 0) return null;
    
    return (
      <>
        <FullPanelModal />
        <button 
          onClick={() => setShowFullPanel(true)}
          className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <AnimatePresence mode="wait">
            {streakState.currentStreak > 0 && (
              <motion.div
                key={streakState.currentStreak}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${getStreakColor()}`}
              >
                <motion.div
                  animate={streakState.currentStreak >= 3 ? { 
                    scale: [1, 1.2, 1],
                    rotate: [0, -5, 5, 0],
                  } : {}}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.5 }}
                >
                  <IconComponent className="w-4 h-4 text-white" fill={streakState.currentStreak >= 3 ? 'currentColor' : 'none'} />
                </motion.div>
                <span className="text-xs font-bold text-white">
                  {streakState.currentStreak}x
                </span>
                {bonusPercent > 0 && (
                  <Badge className="bg-white/20 text-white text-[10px] px-1.5 py-0 h-4 border-0">
                    +{bonusPercent}%
                  </Badge>
                )}
                <ChevronRight className="w-3 h-3 text-white/60" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {streakState.bestStreak > 0 && streakState.currentStreak === 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700 hover:bg-slate-700/80 transition-colors">
              <Trophy className="w-3 h-3 text-yellow-500" />
              <span className="text-[10px] text-slate-400">Best: {streakState.bestStreak}</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
            </div>
          )}
        </button>
      </>
    );
  }

  // Full panel view
  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className={`flex items-center justify-between p-3 border-b border-slate-700 bg-gradient-to-r ${getStreakColor()} bg-opacity-20`}>
        <div className="flex items-center gap-2">
          <motion.div 
            className={`p-1.5 rounded-lg bg-gradient-to-r ${getStreakColor()}`}
            animate={streakState.currentStreak >= 3 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <IconComponent className="w-4 h-4 text-white" />
          </motion.div>
          <span className="font-bold text-white">Streak Bonus</span>
        </div>
        {tier && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`shadow-lg ${getGlowClass()}`}
          >
            <Badge className={`bg-gradient-to-r ${getStreakColor()} text-white border-0`}>
              {tier.name}
            </Badge>
          </motion.div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-3 space-y-3">
        {/* Current Streak Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Streak Counter */}
            <motion.div 
              className={`relative flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${getStreakColor()} shadow-lg ${getGlowClass()}`}
              animate={streakState.currentStreak >= 3 ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {streakState.currentStreak >= 5 && (
                <>
                  <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
                  <Sparkles className="absolute -bottom-1 -left-1 w-3 h-3 text-orange-300 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
                </>
              )}
              <div className="text-center">
                <div className="text-xl font-black text-white">{streakState.currentStreak}</div>
                <div className="text-[9px] text-white/80 font-medium">WINS</div>
              </div>
            </motion.div>
            
            {/* Bonus Info */}
            <div>
              <div className="text-xs text-slate-400">Current Bonus</div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={bonusPercent}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-xl font-black ${multiplier > 1 ? 'text-green-400' : 'text-slate-400'}`}
                >
                  {multiplier > 1 ? `+${bonusPercent}%` : 'None'}
                </motion.div>
              </AnimatePresence>
              {multiplier > 1 && (
                <div className="text-[10px] text-green-400/80">
                  {multiplier.toFixed(2)}x payout
                </div>
              )}
            </div>
          </div>
          
          {/* Stats */}
          <div className="text-right space-y-1">
            <div>
              <div className="text-[10px] text-slate-500">Best</div>
              <div className="text-sm font-bold text-amber-400 flex items-center gap-1 justify-end">
                <Trophy className="w-3 h-3" />
                {streakState.bestStreak}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Bonus Earned</div>
              <div className="text-xs font-bold text-green-400">
                {formatTaka(streakState.totalBonusEarned)}
              </div>
            </div>
          </div>
        </div>

        {/* Progress to Next Tier */}
        {nextTier && streakState.currentStreak >= 1 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {nextTier.streak - streakState.currentStreak} more to <span className="text-white">{nextTier.name}</span>
              </span>
              <span className="text-cyan-400 font-medium">
                +{Math.round((nextTier.bonus - 1) * 100)}%
              </span>
            </div>
            <Progress value={progressToNext} className="h-1.5 bg-slate-700" />
          </div>
        )}

        {/* Tier Breakdown - Mini */}
        <div className="flex gap-1">
          {config.bonusTiers.slice(0, 5).map((bonusTier, idx) => {
            const TierIcon = ICON_MAP[bonusTier.icon];
            const isActive = streakState.currentStreak >= bonusTier.streak;
            const isCurrent = tier?.streak === bonusTier.streak;
            
            return (
              <motion.div 
                key={idx}
                initial={false}
                animate={isCurrent ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                transition={{ duration: 1, repeat: isCurrent ? Infinity : 0 }}
                className={`flex-1 p-1.5 rounded-lg border text-center transition-all ${
                  isCurrent 
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/50 shadow-lg shadow-green-500/20' 
                    : isActive 
                      ? 'bg-slate-700/50 border-slate-600' 
                      : 'bg-slate-800/50 border-slate-700/50 opacity-40'
                }`}
              >
                <TierIcon className={`w-3 h-3 mx-auto ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <div className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-white' : 'text-slate-500'}`}>
                  {bonusTier.streak}+
                </div>
                <div className={`text-[8px] ${isActive ? 'text-green-400' : 'text-slate-600'}`}>
                  +{Math.round((bonusTier.bonus - 1) * 100)}%
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AviatorStreakBonus;
