import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AchievementBadge } from "./AchievementBadge";
import { formatTaka } from "@/lib/currency";
import { Gift, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Achievement } from "@/lib/achievementService";

interface AchievementPopupProps {
  achievement: Achievement | null;
  isVisible: boolean;
  onClose: () => void;
  language?: "en" | "bn";
}

export const AchievementPopup: React.FC<AchievementPopupProps> = ({
  achievement,
  isVisible,
  onClose,
  language = "bn",
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!achievement) return null;

  const name = language === "bn" && achievement.name_bn ? achievement.name_bn : achievement.name;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-20 left-1/2 z-[100] pointer-events-none"
          initial={{ x: "-50%", y: -100, opacity: 0, scale: 0.8 }}
          animate={{ x: "-50%", y: 0, opacity: 1, scale: 1 }}
          exit={{ x: "-50%", y: -100, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", damping: 15, stiffness: 300 }}
        >
          <div className="absolute inset-0 blur-3xl opacity-50">
            <div className={cn(
              "w-full h-full rounded-full",
              achievement.tier === "bronze" && "bg-amber-500",
              achievement.tier === "silver" && "bg-slate-400",
              achievement.tier === "gold" && "bg-yellow-500",
              achievement.tier === "platinum" && "bg-cyan-500",
              achievement.tier === "diamond" && "bg-purple-500"
            )} />
          </div>

          <motion.div
            className="relative bg-card/95 backdrop-blur-xl border border-primary/30 rounded-2xl p-6 shadow-2xl min-w-[280px] pointer-events-auto"
            onClick={onClose}
          >
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 0.5, repeat: 3 }}
            >
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </motion.div>

            <div className="text-center mb-4">
              <motion.p
                className="text-sm text-primary font-medium mb-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                🎉 অভিনন্দন! 🎉
              </motion.p>
              <motion.h3
                className="text-lg font-bold text-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                অ্যাচিভমেন্ট আনলক!
              </motion.h3>
            </div>

            <motion.div
              className="flex justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", damping: 10 }}
            >
              <AchievementBadge
                icon={achievement.icon}
                tier={achievement.tier}
                unlocked={true}
                size="lg"
              />
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h4 className="font-bold text-foreground mb-1">{name}</h4>
              
              {achievement.reward_amount > 0 && (
                <motion.div
                  className="flex items-center justify-center gap-1.5 text-primary font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                >
                  <Gift className="w-4 h-4" />
                  <span>+{formatTaka(achievement.reward_amount)} বোনাস!</span>
                </motion.div>
              )}
            </motion.div>

            <motion.p
              className="text-xs text-muted-foreground text-center mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              বন্ধ করতে ট্যাপ করুন
            </motion.p>

            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "absolute w-2 h-2 rounded-full",
                  i % 4 === 0 && "bg-yellow-500",
                  i % 4 === 1 && "bg-primary",
                  i % 4 === 2 && "bg-emerald-500",
                  i % 4 === 3 && "bg-pink-500"
                )}
                initial={{
                  x: 0,
                  y: 0,
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: Math.cos((i / 12) * Math.PI * 2) * 100,
                  y: Math.sin((i / 12) * Math.PI * 2) * 100,
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 1,
                  delay: 0.3 + i * 0.05,
                  ease: "easeOut",
                }}
                style={{
                  left: "50%",
                  top: "50%",
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementPopup;
