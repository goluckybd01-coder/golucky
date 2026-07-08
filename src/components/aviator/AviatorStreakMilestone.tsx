import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap, Crown, Star, Trophy, Sparkles } from "lucide-react";
import { StreakBonusTier } from "./AviatorStreakBonus";
import { hapticForStreak } from "@/lib/haptics";

interface AviatorStreakMilestoneProps {
  tier: StreakBonusTier | null;
  streak: number;
  isVisible: boolean;
  onComplete?: () => void;
}

const ICON_MAP = {
  flame: Flame,
  zap: Zap,
  star: Star,
  crown: Crown,
  trophy: Trophy,
};

const TIER_COLORS: Record<string, { bg: string; glow: string; particles: string[] }> = {
  "Hot": { 
    bg: "from-orange-500 to-red-600", 
    glow: "shadow-orange-500/60",
    particles: ["#f97316", "#ef4444", "#fbbf24"]
  },
  "On Fire": { 
    bg: "from-orange-600 to-red-700", 
    glow: "shadow-red-500/60",
    particles: ["#ea580c", "#dc2626", "#f59e0b"]
  },
  "Blazing": { 
    bg: "from-cyan-500 to-blue-600", 
    glow: "shadow-cyan-500/60",
    particles: ["#06b6d4", "#3b82f6", "#22d3ee"]
  },
  "Unstoppable": { 
    bg: "from-purple-500 to-violet-600", 
    glow: "shadow-purple-500/60",
    particles: ["#a855f7", "#8b5cf6", "#c084fc"]
  },
  "Legendary": { 
    bg: "from-yellow-400 to-amber-600", 
    glow: "shadow-yellow-400/60",
    particles: ["#facc15", "#f59e0b", "#fbbf24"]
  },
  "Godlike": { 
    bg: "from-yellow-300 via-amber-500 to-orange-600", 
    glow: "shadow-yellow-300/80",
    particles: ["#fde047", "#f59e0b", "#ea580c", "#fbbf24"]
  },
};

const AviatorStreakMilestone = ({ 
  tier, 
  streak, 
  isVisible, 
  onComplete 
}: AviatorStreakMilestoneProps) => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    delay: number;
    duration: number;
    angle: number;
  }>>([]);

  useEffect(() => {
    if (isVisible && tier) {
      hapticForStreak(streak);
      
      const colors = TIER_COLORS[tier.name]?.particles || ["#f97316", "#22c55e", "#3b82f6"];
      const newParticles = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 10,
        y: 50 + (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 8,
        delay: Math.random() * 0.3,
        duration: 0.8 + Math.random() * 0.4,
        angle: Math.random() * 360,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        onComplete?.();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isVisible, tier, onComplete, streak]);

  if (!tier) return null;

  const IconComponent = ICON_MAP[tier.icon];
  const colorConfig = TIER_COLORS[tier.name] || TIER_COLORS["Hot"];
  const bonusPercent = Math.round((tier.bonus - 1) * 100);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 0.5 }}
            className={`absolute inset-0 bg-gradient-to-r ${colorConfig.bg}`}
          />

          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{ 
                x: Math.cos(particle.angle * Math.PI / 180) * (150 + Math.random() * 100),
                y: Math.sin(particle.angle * Math.PI / 180) * (150 + Math.random() * 100),
                scale: [0, 1.5, 0],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: "easeOut",
              }}
              className="absolute rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              }}
            />
          ))}

          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: [0, 1.2, 1], rotate: [-15, 5, 0] }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 15 }}
            className="relative"
          >
            <div className={`relative bg-gradient-to-br ${colorConfig.bg} rounded-3xl p-6 shadow-2xl ${colorConfig.glow}`}>
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.5, repeat: 4 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-3"
                >
                  <IconComponent className="w-10 h-10 text-white drop-shadow-lg" fill="currentColor" />
                </motion.div>
                <h2 className="text-2xl font-black text-white drop-shadow-lg tracking-wide">{tier.name}!</h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-lg text-white/90 font-medium">{streak}x Win Streak</span>
                </div>
                <div className="mt-3 inline-block px-4 py-1.5 rounded-full bg-white/25 backdrop-blur-sm">
                  <span className="text-lg font-bold text-white">+{bonusPercent}% Bonus Unlocked!</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AviatorStreakMilestone;
