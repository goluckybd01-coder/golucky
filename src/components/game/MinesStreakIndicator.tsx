import { Flame, Zap, Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface MinesStreakIndicatorProps {
  streak: number;
  bonusMultiplier: number;
}

const translations = {
  winStreak: { en: "Win Streak", bn: "জয় স্ট্রীক" },
  bonus: { en: "Bonus", bn: "বোনাস" },
  onFire: { en: "On Fire!", bn: "অন ফায়ার!" },
  unstoppable: { en: "Unstoppable!", bn: "অপ্রতিরোধ্য!" },
  legendary: { en: "Legendary!", bn: "কিংবদন্তি!" },
};

const t = (key: keyof typeof translations, lang: 'en' | 'bn') => translations[key][lang];

const getStreakTier = (streak: number) => {
  if (streak >= 10) {
    return {
      tier: 'legendary',
      icon: Trophy,
      gradient: 'from-yellow-400 via-amber-500 to-orange-500',
      bgGradient: 'from-yellow-500/20 to-orange-500/20',
      borderColor: 'border-yellow-400',
      textColor: 'text-yellow-400',
      pulseColor: 'bg-yellow-400',
    };
  }
  if (streak >= 5) {
    return {
      tier: 'unstoppable',
      icon: Zap,
      gradient: 'from-purple-400 via-pink-500 to-red-500',
      bgGradient: 'from-purple-500/20 to-red-500/20',
      borderColor: 'border-purple-400',
      textColor: 'text-purple-400',
      pulseColor: 'bg-purple-400',
    };
  }
  if (streak >= 3) {
    return {
      tier: 'onFire',
      icon: Flame,
      gradient: 'from-orange-400 to-red-500',
      bgGradient: 'from-orange-500/20 to-red-500/20',
      borderColor: 'border-orange-400',
      textColor: 'text-orange-400',
      pulseColor: 'bg-orange-400',
    };
  }
  return {
    tier: 'normal',
    icon: Star,
    gradient: 'from-emerald-400 to-green-500',
    bgGradient: 'from-emerald-500/20 to-green-500/20',
    borderColor: 'border-emerald-400',
    textColor: 'text-emerald-400',
    pulseColor: 'bg-emerald-400',
  };
};

export const calculateStreakBonus = (streak: number): number => {
  if (streak < 2) return 1.0;
  if (streak === 2) return 1.02;
  if (streak === 3) return 1.05;
  if (streak === 4) return 1.08;
  if (streak === 5) return 1.10;
  if (streak >= 6 && streak < 10) return 1.12;
  if (streak >= 10) return 1.15;
  return 1.0;
};

const MinesStreakIndicator = ({ streak, bonusMultiplier }: MinesStreakIndicatorProps) => {
  const { language } = useLanguage();
  
  if (streak < 1) return null;

  const tierInfo = getStreakTier(streak);
  const Icon = tierInfo.icon;
  const bonusPercent = Math.round((bonusMultiplier - 1) * 100);

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl p-3 border-2 transition-all duration-500",
        `bg-gradient-to-r ${tierInfo.bgGradient}`,
        tierInfo.borderColor,
        streak >= 3 && "animate-pulse"
      )}
    >
      {streak >= 5 && (
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className={cn(
              "absolute -inset-1 rounded-xl opacity-30 blur-xl animate-pulse",
              `bg-gradient-to-r ${tierInfo.gradient}`
            )}
          />
        </div>
      )}

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "relative p-2 rounded-lg bg-gradient-to-br",
            tierInfo.gradient
          )}>
            <Icon className="w-5 h-5 text-white" />
            {streak >= 5 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white animate-ping" />
            )}
          </div>
          
          <div>
            <p className="text-slate-400 text-xs">{t('winStreak', language)}</p>
            <div className="flex items-center gap-1">
              <span className={cn("text-xl font-bold", tierInfo.textColor)}>
                {streak}
              </span>
              <div className="flex">
                {Array.from({ length: Math.min(streak, 5) }).map((_, i) => (
                  <Flame 
                    key={i} 
                    className={cn(
                      "w-3 h-3 -ml-0.5",
                      i < 3 ? "text-orange-400" : "text-red-500"
                    )}
                    style={{ 
                      animationDelay: `${i * 0.1}s`,
                      animation: streak >= 3 ? 'pulse 1s infinite' : undefined 
                    }}
                  />
                ))}
                {streak > 5 && (
                  <span className="text-xs text-orange-400 ml-1">+{streak - 5}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {bonusPercent > 0 && (
          <div className="text-right">
            <p className="text-slate-400 text-xs">{t('bonus', language)}</p>
            <span className={cn(
              "text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent",
              tierInfo.gradient
            )}>
              +{bonusPercent}%
            </span>
          </div>
        )}
      </div>

      {streak >= 3 && (
        <div className={cn(
          "mt-2 text-center text-xs font-bold uppercase tracking-wider",
          tierInfo.textColor
        )}>
          {streak >= 10 
            ? t('legendary', language) 
            : streak >= 5 
              ? t('unstoppable', language) 
              : t('onFire', language)
          }
        </div>
      )}
    </div>
  );
};

export default MinesStreakIndicator;
