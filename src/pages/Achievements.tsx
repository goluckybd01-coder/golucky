import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Filter, Award, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AchievementCard } from "@/components/achievement/AchievementCard";
import { AchievementPopup } from "@/components/achievement/AchievementPopup";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatTaka } from "@/lib/currency";
import {
  fetchAllAchievements,
  fetchUserAchievements,
  claimAchievementReward,
  checkAndUnlockAchievements,
  type Achievement,
  type UserAchievement,
} from "@/lib/achievementService";

const categories = [
  { id: "all", label: "সব", icon: Trophy },
  { id: "onboarding", label: "শুরু", icon: Award },
  { id: "betting", label: "বেটিং", icon: Trophy },
  { id: "winning", label: "জয়", icon: Sparkles },
  { id: "deposit", label: "ডিপোজিট", icon: Trophy },
  { id: "referral", label: "রেফারেল", icon: Trophy },
  { id: "vip", label: "ভিআইপি", icon: Trophy },
];

const Achievements: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [popupAchievement, setPopupAchievement] = useState<Achievement | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [userProgress, setUserProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Check for new achievements first
      const newAchievements = await checkAndUnlockAchievements(user.id);
      
      // Load all data
      const [allAchievements, userAchievs] = await Promise.all([
        fetchAllAchievements(),
        fetchUserAchievements(user.id),
      ]);

      // Load user progress for display
      const [walletRes, betsRes, referralsRes, loginRes, profileRes] = await Promise.all([
        supabase.from("wallets").select("total_deposit, total_bet").eq("user_id", user.id).single(),
        supabase.from("game_bets").select("id, result, payout").eq("user_id", user.id),
        supabase.from("agent_referrals").select("id").eq("agent_user_id", user.id),
        supabase.from("daily_login_rewards").select("streak_day").eq("user_id", user.id).order("claim_date", { ascending: false }).limit(1),
        supabase.from("profiles").select("vip_level").eq("user_id", user.id).single(),
      ]);

      const bets = betsRes.data || [];
      const wins = bets.filter(b => b.result === "win");
      
      const progress: Record<string, number> = {
        login_count: 1,
        login_streak: loginRes.data?.[0]?.streak_day || 1,
        deposit_count: (walletRes.data?.total_deposit || 0) > 0 ? 1 : 0,
        total_deposit: walletRes.data?.total_deposit || 0,
        bet_count: bets.length,
        win_count: wins.length,
        referral_count: referralsRes.data?.length || 0,
        vip_level: profileRes.data?.vip_level || 0,
        single_win: Math.max(...wins.map(w => Number(w.payout) || 0), 0),
      };

      setUserProgress(progress);
      setAchievements(allAchievements);
      setUserAchievements(userAchievs);

      // Show popup for first new achievement
      if (newAchievements.length > 0) {
        const newAchiev = allAchievements.find(a => a.code === newAchievements[0]);
        if (newAchiev) {
          setPopupAchievement(newAchiev);
          setShowPopup(true);
        }
      }
    } catch (error) {
      console.error("Error loading achievements:", error);
      toast.error("ডাটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (userAchievementId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setClaimingId(userAchievementId);
    try {
      const result = await claimAchievementReward(user.id, userAchievementId);
      if (result.success) {
        toast.success(`🎁 ${formatTaka(result.amount || 0)} বোনাস সংগ্রহ করা হয়েছে!`);
        // Reload user achievements
        const updatedUserAchievs = await fetchUserAchievements(user.id);
        setUserAchievements(updatedUserAchievs);
      } else {
        toast.error(result.error || "পুরস্কার সংগ্রহ করতে সমস্যা হয়েছে");
      }
    } catch (error) {
      toast.error("কিছু সমস্যা হয়েছে");
    } finally {
      setClaimingId(null);
    }
  };

  const filteredAchievements = achievements.filter(
    a => selectedCategory === "all" || a.category === selectedCategory
  );

  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const totalRewards = achievements.reduce((sum, a) => sum + Number(a.reward_amount), 0);
  const claimedRewards = userAchievements
    .filter(ua => ua.reward_claimed)
    .reduce((sum, ua) => {
      const achievement = achievements.find(a => a.id === ua.achievement_id);
      return sum + Number(achievement?.reward_amount || 0);
    }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Achievement Popup */}
      <AchievementPopup
        achievement={popupAchievement}
        isVisible={showPopup}
        onClose={() => setShowPopup(false)}
      />

      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">অ্যাচিভমেন্ট</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Stats Card */}
      <div className="p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/20 via-primary/10 to-background rounded-2xl p-5 border border-primary/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{unlockedCount} / {totalCount}</h3>
                <p className="text-sm text-muted-foreground">অ্যাচিভমেন্ট আনলক</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">মোট পুরস্কার</p>
              <p className="font-bold text-primary">{formatTaka(totalRewards)}</p>
            </div>
          </div>

          <Progress value={progressPercent} className="h-3 mb-2" />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(progressPercent)}% সম্পন্ন</span>
            <span>{formatTaka(claimedRewards)} সংগ্রহ করা হয়েছে</span>
          </div>
        </motion.div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 mb-4">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full overflow-x-auto flex justify-start gap-1 bg-muted/50 p-1 h-auto">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="flex-shrink-0 px-3 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Achievement List */}
      <div className="px-4 space-y-3">
        {filteredAchievements.map((achievement, index) => {
          const userAchievement = userAchievements.find(
            (ua) => ua.achievement_id === achievement.id
          );
          const progress = userProgress[achievement.requirement_type] || 0;

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <AchievementCard
                achievement={achievement}
                userAchievement={userAchievement}
                currentProgress={progress}
                onClaimReward={handleClaimReward}
                isClaiming={claimingId === userAchievement?.id}
              />
            </motion.div>
          );
        })}

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>এই ক্যাটাগরিতে কোনো অ্যাচিভমেন্ট নেই</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements;
