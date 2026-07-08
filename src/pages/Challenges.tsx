import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Clock, Gift, Trophy, Flame, Target, Zap, Star,
  Calendar, Crown, CheckCircle2, Lock, Sparkles, Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatTaka } from "@/lib/currency";
import { cn } from "@/lib/utils";
import {
  fetchChallenges,
  fetchUserChallenges,
  syncChallengeProgress,
  claimChallengeReward,
  getTimeRemaining,
  getChallengeStats,
  type Challenge,
  type UserChallenge,
} from "@/lib/challengeService";

// Icon mapping
import {
  LogIn, Wallet, Award, Banknote, Gem, Gamepad2, Medal,
  Rocket, TrendingUp, Fish, Diamond, UserPlus, Swords
} from "lucide-react";

const iconMap: Record<string, typeof Trophy> = {
  "log-in": LogIn,
  target: Target,
  zap: Zap,
  flame: Flame,
  trophy: Trophy,
  award: Award,
  banknote: Banknote,
  gem: Gem,
  "gamepad-2": Gamepad2,
  wallet: Wallet,
  calendar: Calendar,
  crown: Crown,
  sword: Swords,
  medal: Medal,
  star: Star,
  rocket: Rocket,
  "trending-up": TrendingUp,
  fish: Fish,
  diamond: Diamond,
  "user-plus": UserPlus,
};

interface ChallengeCardProps {
  challenge: Challenge;
  userChallenge?: UserChallenge;
  onClaim: (id: string) => void;
  isClaiming: boolean;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  userChallenge,
  onClaim,
  isClaiming,
}) => {
  const IconComponent = iconMap[challenge.icon] || Target;
  const progress = userChallenge?.progress || 0;
  const target = challenge.requirement_value;
  const progressPercent = Math.min((progress / target) * 100, 100);
  const isCompleted = userChallenge?.is_completed;
  const isClaimed = userChallenge?.reward_claimed;

  const name = challenge.name_bn || challenge.name;
  const description = challenge.description_bn || challenge.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative p-4 rounded-2xl border backdrop-blur-sm transition-all",
        isCompleted && !isClaimed
          ? "bg-gradient-to-br from-primary/20 to-primary/5 border-primary/40 shadow-lg shadow-primary/10"
          : isCompleted && isClaimed
          ? "bg-muted/30 border-border/30"
          : "bg-card/60 border-border/50"
      )}
    >
      {/* Completion glow */}
      {isCompleted && !isClaimed && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-primary/10"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className="relative flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
          isCompleted
            ? "bg-gradient-to-br from-primary to-primary/70"
            : "bg-muted/50"
        )}>
          <IconComponent className={cn(
            "w-7 h-7",
            isCompleted ? "text-primary-foreground" : "text-muted-foreground"
          )} />
          {isClaimed && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className={cn(
                "font-semibold",
                isClaimed ? "text-muted-foreground" : "text-foreground"
              )}>
                {name}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {description}
              </p>
            </div>

            {/* Reward */}
            <div className={cn(
              "text-right flex-shrink-0",
              isCompleted ? "text-primary" : "text-muted-foreground"
            )}>
              <div className="flex items-center gap-1 font-bold">
                <Gift className="w-4 h-4" />
                {formatTaka(challenge.reward_amount)}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className={isClaimed ? "text-muted-foreground/50" : "text-muted-foreground"}>
                অগ্রগতি
              </span>
              <span className={cn(
                "font-medium",
                isCompleted ? "text-primary" : "text-foreground"
              )}>
                {progress} / {target}
              </span>
            </div>
            <Progress 
              value={progressPercent} 
              className={cn("h-2", isClaimed && "opacity-50")}
            />
          </div>

          {/* Action */}
          {isCompleted && !isClaimed && (
            <Button
              size="sm"
              className="mt-3 w-full bg-gradient-to-r from-primary to-primary/80"
              onClick={() => onClaim(userChallenge!.id)}
              disabled={isClaiming}
            >
              {isClaiming ? (
                <span className="animate-pulse">সংগ্রহ হচ্ছে...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" />
                  পুরস্কার সংগ্রহ করুন
                </>
              )}
            </Button>
          )}

          {isClaimed && (
            <div className="mt-3 flex items-center gap-1.5 text-sm text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
              সংগ্রহ করা হয়েছে
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Challenges: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"daily" | "weekly">("daily");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [stats, setStats] = useState({ total: 0, completed: 0, claimed: 0, totalRewards: 0, earnedRewards: 0 });

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Sync progress first
      await syncChallengeProgress(user.id, activeTab);

      // Load data
      const [allChallenges, userChalls, challengeStats] = await Promise.all([
        fetchChallenges(activeTab),
        fetchUserChallenges(user.id, activeTab),
        getChallengeStats(user.id, activeTab),
      ]);

      setChallenges(allChallenges);
      setUserChallenges(userChalls);
      setStats(challengeStats);
      setTimeRemaining(getTimeRemaining(activeTab));
    } catch (error) {
      console.error("Error loading challenges:", error);
      toast.error("ডাটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  }, [activeTab, navigate]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  // Update countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(getTimeRemaining(activeTab));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTab]);

  const handleClaim = async (userChallengeId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setClaimingId(userChallengeId);
    try {
      const result = await claimChallengeReward(user.id, userChallengeId);
      if (result.success) {
        toast.success(`🎁 ${formatTaka(result.amount || 0)} বোনাস সংগ্রহ করা হয়েছে!`);
        await loadData();
      } else {
        toast.error(result.error || "পুরস্কার সংগ্রহ করতে সমস্যা হয়েছে");
      }
    } catch (error) {
      toast.error("কিছু সমস্যা হয়েছে");
    } finally {
      setClaimingId(null);
    }
  };

  const formatTime = (h: number, m: number, s: number) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">চ্যালেঞ্জ</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Timer Banner */}
      <div className="p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl p-4 border",
            activeTab === "daily"
              ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30"
              : "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-500/30"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                activeTab === "daily" ? "bg-amber-500/30" : "bg-purple-500/30"
              )}>
                <Timer className={cn(
                  "w-6 h-6",
                  activeTab === "daily" ? "text-amber-500" : "text-purple-500"
                )} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "daily" ? "দৈনিক রিসেট" : "সাপ্তাহিক রিসেট"}
                </p>
                <p className="text-2xl font-bold font-mono">
                  {formatTime(timeRemaining.hours, timeRemaining.minutes, timeRemaining.seconds)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">সম্পন্ন</p>
              <p className="text-lg font-bold text-primary">
                {stats.completed}/{stats.total}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats Summary */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card/60 rounded-xl p-4 border border-border/50"
          >
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">মোট পুরস্কার</span>
            </div>
            <p className="text-lg font-bold">{formatTaka(stats.totalRewards)}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-card/60 rounded-xl p-4 border border-border/50"
          >
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">অর্জিত</span>
            </div>
            <p className="text-lg font-bold text-emerald-500">{formatTaka(stats.earnedRewards)}</p>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "daily" | "weekly")}>
          <TabsList className="w-full grid grid-cols-2 bg-muted/50">
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Flame className="w-4 h-4" />
              দৈনিক
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              সাপ্তাহিক
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Challenge List */}
      <div className="px-4 space-y-3">
        <AnimatePresence mode="wait">
          {challenges.map((challenge, index) => {
            const userChallenge = userChallenges.find(
              uc => uc.challenge_id === challenge.id
            );

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <ChallengeCard
                  challenge={challenge}
                  userChallenge={userChallenge}
                  onClaim={handleClaim}
                  isClaiming={claimingId === userChallenge?.id}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {challenges.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>কোনো চ্যালেঞ্জ নেই</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Challenges;
