import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Trophy, Award, Crown, Gem, Medal, Star, Zap, Flame,
  Target, Wallet, Users, LogIn, TrendingUp, Shield,
  UserPlus, Share2, Gamepad2, Rocket, Fish, Banknote
} from "lucide-react";

interface AchievementBadgeProps {
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  unlocked: boolean;
  size?: "sm" | "md" | "lg";
  showGlow?: boolean;
  className?: string;
}

const tierColors = {
  bronze: {
    bg: "from-amber-700 to-amber-900",
    border: "border-amber-600",
    shadow: "shadow-amber-500/30",
    glow: "bg-amber-500/20",
  },
  silver: {
    bg: "from-slate-300 to-slate-500",
    border: "border-slate-400",
    shadow: "shadow-slate-400/30",
    glow: "bg-slate-400/20",
  },
  gold: {
    bg: "from-yellow-400 to-amber-600",
    border: "border-yellow-500",
    shadow: "shadow-yellow-500/40",
    glow: "bg-yellow-500/30",
  },
  platinum: {
    bg: "from-cyan-300 to-teal-500",
    border: "border-cyan-400",
    shadow: "shadow-cyan-500/40",
    glow: "bg-cyan-500/30",
  },
  diamond: {
    bg: "from-purple-400 via-pink-500 to-blue-500",
    border: "border-purple-400",
    shadow: "shadow-purple-500/50",
    glow: "bg-purple-500/40",
  },
};

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
};

const iconSizes = {
  sm: 16,
  md: 24,
  lg: 32,
};

const iconMap: Record<string, typeof Trophy> = {
  trophy: Trophy,
  award: Award,
  crown: Crown,
  gem: Gem,
  medal: Medal,
  star: Star,
  zap: Zap,
  flame: Flame,
  target: Target,
  wallet: Wallet,
  users: Users,
  "log-in": LogIn,
  "trending-up": TrendingUp,
  shield: Shield,
  "user-plus": UserPlus,
  "share-2": Share2,
  "gamepad-2": Gamepad2,
  rocket: Rocket,
  fish: Fish,
  banknote: Banknote,
};

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  icon,
  tier,
  unlocked,
  size = "md",
  showGlow = true,
  className,
}) => {
  const IconComponent = iconMap[icon] || Trophy;
  const colors = tierColors[tier];

  return (
    <motion.div
      className={cn("relative", className)}
      whileHover={unlocked ? { scale: 1.1, rotate: 5 } : undefined}
      whileTap={unlocked ? { scale: 0.95 } : undefined}
    >
      {unlocked && showGlow && (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full blur-lg",
            colors.glow
          )}
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      <div
        className={cn(
          "relative rounded-full flex items-center justify-center border-2",
          sizeClasses[size],
          unlocked
            ? cn("bg-gradient-to-br", colors.bg, colors.border, colors.shadow, "shadow-lg")
            : "bg-muted/50 border-muted-foreground/20 grayscale opacity-50"
        )}
      >
        {unlocked && (
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut",
              }}
            />
          </div>
        )}

        <IconComponent
          size={iconSizes[size]}
          className={cn(
            "relative z-10",
            unlocked ? "text-white drop-shadow-md" : "text-muted-foreground"
          )}
        />

        {!unlocked && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-background/30">
            <div className="w-3 h-4 bg-muted-foreground/40 rounded-sm" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AchievementBadge;
