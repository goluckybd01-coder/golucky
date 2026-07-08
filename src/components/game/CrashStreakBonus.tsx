import { useState } from "react";
import { Flame, Zap, Crown, Star, Trophy, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface StreakBonusConfig {
  bonusTiers: { streak: number; bonus: number; name: string; icon: "flame" | "zap" | "star" | "crown" | "trophy" }[];
  maxBonus: number;
  resetOnLoss: boolean;
}

export interface StreakState {
  currentStreak: number;
  highestStreak: number;
  currentBonusMultiplier: number;
  totalBonusEarned: number;
  lastOutcome: "win" | "loss" | null;
}

interface CrashStreakBonusProps {
  streakState: StreakState;
  config: StreakBonusConfig;
  isAnimating?: boolean;
}

const ICON_MAP = {
  flame: Flame,
  zap: Zap,
  star: Star,
  crown: Crown,
  trophy: Trophy,
};

export const defaultStreakConfig: StreakBonusConfig = {
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

export const defaultStreakState: StreakState = {
  currentStreak: 0,
  highestStreak: 0,
  currentBonusMultiplier: 1.0,
  totalBonusEarned: 0,
  lastOutcome: null,
};

export function getStreakBonus(streak: number, config: StreakBonusConfig): { multiplier: number; tier: typeof config.bonusTiers[0] | null } {
  if (streak < 2) return { multiplier: 1.0, tier: null };
  let activeTier = null;
  for (const tier of config.bonusTiers) {
    if (streak >= tier.streak) activeTier = tier;
  }
  return {
    multiplier: activeTier ? Math.min(activeTier.bonus, config.maxBonus) : 1.0,
    tier: activeTier,
  };
}

export function calculateStreakPayout(basePayout: number, streak: number, config: StreakBonusConfig): {
  finalPayout: number;
  bonusAmount: number;
  multiplier: number;
  tier: typeof config.bonusTiers[0] | null;
} {
  const { multiplier, tier } = getStreakBonus(streak, config);
  const finalPayout = basePayout * multiplier;
  const bonusAmount = finalPayout - basePayout;
  return { finalPayout, bonusAmount, multiplier, tier };
}

export default function CrashStreakBonus({ streakState, config, isAnimating }: CrashStreakBonusProps) {
  const { multiplier, tier } = getStreakBonus(streakState.currentStreak, config);
  const nextTier = config.bonusTiers.find(t => t.streak > streakState.currentStreak);

  const getStreakColor = () => {
    if (streakState.currentStreak >= 10) return "from-yellow-500 to-amber-600";
    if (streakState.currentStreak >= 7) return "from-purple-500 to-violet-600";
    if (streakState.currentStreak >= 5) return "from-cyan-500 to-blue-600";
    if (streakState.currentStreak >= 3) return "from-orange-500 to-red-600";
    if (streakState.currentStreak >= 2) return "from-orange-400 to-orange-600";
    return "from-slate-500 to-slate-600";
  };

  const getGlowColor = () => {
    if (streakState.currentStreak >= 10) return "shadow-yellow-500/50";
    if (streakState.currentStreak >= 7) return "shadow-purple-500/50";
    if (streakState.currentStreak >= 5) return "shadow-cyan-500/50";
    if (streakState.currentStreak >= 3) return "shadow-orange-500/50";
    return "";
  };

  const IconComponent = tier ? ICON_MAP[tier.icon] : Flame;

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
      <div className={`flex items-center justify-between p-3 border-b border-slate-700 bg-gradient-to-r ${getStreakColor()} bg-opacity-20`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-gradient-to-r ${getStreakColor()} ${isAnimating ? 'animate-pulse' : ''}`}>
            <IconComponent className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">Win Streak Bonus</span>
        </div>
        {streakState.currentStreak >= 2 && (
          <Badge className={`bg-gradient-to-r ${getStreakColor()} text-white border-0 shadow-lg ${getGlowColor()} ${isAnimating ? 'animate-bounce' : ''}`}>
            {tier?.name || "Active"}
          </Badge>
        )}
      </div>
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`relative flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${getStreakColor()} shadow-lg ${getGlowColor()} ${isAnimating ? 'animate-pulse' : ''}`}>
              {streakState.currentStreak >= 3 && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent animate-pulse" />
              )}
              <div className="text-center">
                <div className="text-2xl font-black text-white">{streakState.currentStreak}</div>
                <div className="text-[10px] text-white/80 font-medium">WINS</div>
              </div>
              {streakState.currentStreak >= 5 && (
                <>
                  <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
                  <Sparkles className="absolute -bottom-1 -left-1 w-3 h-3 text-orange-300 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
                </>
              )}
            </div>
            <div>
              <div className="text-sm text-slate-400">Current Bonus</div>
              <div className={`text-2xl font-black ${multiplier > 1 ? 'text-green-400' : 'text-slate-300'}`}>
                {multiplier > 1 ? `+${((multiplier - 1) * 100).toFixed(0)}%` : 'None'}
              </div>
              {multiplier > 1 && (
                <div className="text-xs text-green-400/80">{multiplier.toFixed(2)}x payout multiplier</div>
              )}
            </div>
          </div>
          <div className="text-right space-y-1">
            <div>
              <div className="text-xs text-slate-500">Best Streak</div>
              <div className="text-lg font-bold text-amber-400">{streakState.highestStreak}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Bonus Earned</div>
              <div className="text-sm font-bold text-green-400">+৳{streakState.totalBonusEarned.toFixed(0)}</div>
            </div>
          </div>
        </div>
        {nextTier && streakState.currentStreak >= 1 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{nextTier.streak - streakState.currentStreak} more wins to {nextTier.name}</span>
              <span className="text-cyan-400 font-medium">+{((nextTier.bonus - 1) * 100).toFixed(0)}% bonus</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${getStreakColor()} transition-all duration-500`}
                style={{ width: `${Math.min(100, (streakState.currentStreak / nextTier.streak) * 100)}%` }} />
            </div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-1.5">
          {config.bonusTiers.slice(0, 6).map((bonusTier, idx) => {
            const TierIcon = ICON_MAP[bonusTier.icon];
            const isActive = streakState.currentStreak >= bonusTier.streak;
            const isCurrent = tier?.streak === bonusTier.streak;
            return (
              <div key={idx} className={`p-2 rounded-lg border text-center transition-all ${
                isCurrent ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/50 shadow-lg shadow-green-500/20'
                : isActive ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-800/50 border-slate-700/50 opacity-50'}`}>
                <TierIcon className={`w-4 h-4 mx-auto mb-1 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-500'}`}>{bonusTier.streak}+</div>
                <div className={`text-[10px] ${isActive ? 'text-green-400' : 'text-slate-600'}`}>+{((bonusTier.bonus - 1) * 100).toFixed(0)}%</div>
              </div>
            );
          })}
        </div>
        <div className="text-xs text-slate-500 text-center pt-1 border-t border-slate-700/50">
          Win consecutive rounds to earn bonus multipliers on your payouts!
        </div>
      </div>
    </div>
  );
}
