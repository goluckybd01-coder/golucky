import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Gift, Check, Lock } from "lucide-react";
import { AchievementBadge } from "./AchievementBadge";
import type { Achievement, UserAchievement } from "@/lib/achievementService";
import { formatTaka } from "@/lib/currency";

interface AchievementCardProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  currentProgress?: number;
  onClaimReward?: (userAchievementId: string) => void;
  isClaiming?: boolean;
  language?: "en" | "bn";
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  userAchievement,
  currentProgress = 0,
  onClaimReward,
  isClaiming = false,
  language = "bn",
}) => {
  const isUnlocked = !!userAchievement;
  const isClaimed = userAchievement?.reward_claimed;
  const progress = Math.min(
    (currentProgress / achievement.requirement_value) * 100,
    100
  );

  const name = language === "bn" && achievement.name_bn ? achievement.name_bn : achievement.name;
  const description = language === "bn" && achievement.description_bn ? achievement.description_bn : achievement.description;

  const tierLabel = {
    bronze: "ব্রোঞ্জ",
    silver: "সিলভার",
    gold: "গোল্ড",
    platinum: "প্লাটিনাম",
    diamond: "ডায়মন্ড",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-300",
        isUnlocked
          ? "bg-card/80 border-primary/30 shadow-lg"
          : "bg-muted/30 border-border/50"
      )}
    >
      <div className="flex gap-4">
        <AchievementBadge
          icon={achievement.icon}
          tier={achievement.tier}
          unlocked={isUnlocked}
          size="lg"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className={cn(
                "font-semibold truncate",
                isUnlocked ? "text-foreground" : "text-muted-foreground"
              )}>
                {name}
              </h4>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                achievement.tier === "bronze" && "bg-amber-900/30 text-amber-600",
                achievement.tier === "silver" && "bg-slate-400/30 text-slate-400",
                achievement.tier === "gold" && "bg-yellow-500/30 text-yellow-500",
                achievement.tier === "platinum" && "bg-cyan-500/30 text-cyan-400",
                achievement.tier === "diamond" && "bg-purple-500/30 text-purple-400"
              )}>
                {tierLabel[achievement.tier]}
              </span>
            </div>

            {achievement.reward_amount > 0 && (
              <div className={cn(
                "text-right",
                isUnlocked ? "text-primary" : "text-muted-foreground"
              )}>
                <div className="flex items-center gap-1 text-sm font-bold">
                  <Gift className="w-4 h-4" />
                  {formatTaka(achievement.reward_amount)}
                </div>
              </div>
            )}
          </div>

          <p className={cn(
            "text-sm mt-1 line-clamp-2",
            isUnlocked ? "text-muted-foreground" : "text-muted-foreground/70"
          )}>
            {description}
          </p>

          {!isUnlocked && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>অগ্রগতি</span>
                <span>{currentProgress} / {achievement.requirement_value}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {isUnlocked && !isClaimed && achievement.reward_amount > 0 && (
            <Button
              size="sm"
              className="mt-3 w-full bg-gradient-to-r from-primary to-primary/80"
              onClick={() => onClaimReward?.(userAchievement.id)}
              disabled={isClaiming}
            >
              {isClaiming ? (
                <span className="animate-pulse">দাবি করা হচ্ছে...</span>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-1" />
                  পুরস্কার সংগ্রহ করুন
                </>
              )}
            </Button>
          )}

          {isClaimed && (
            <div className="mt-3 flex items-center gap-1.5 text-sm text-emerald-500">
              <Check className="w-4 h-4" />
              পুরস্কার সংগ্রহ করা হয়েছে
            </div>
          )}

          {!isUnlocked && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              আনলক করতে শর্ত পূরণ করুন
            </div>
          )}
        </div>
      </div>

      {isUnlocked && !isClaimed && (
        <motion.div
          className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default AchievementCard;
