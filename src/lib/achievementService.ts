/**
 * Achievement Service - Handles achievement checking and unlocking
 */

import { supabase } from "@/integrations/supabase/client";

export interface Achievement {
  id: string;
  code: string;
  name: string;
  name_bn: string | null;
  description: string;
  description_bn: string | null;
  icon: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  requirement_type: string;
  requirement_value: number;
  reward_amount: number;
  is_hidden: boolean;
  sort_order: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  reward_claimed: boolean;
  reward_claimed_at: string | null;
  progress: number;
  achievement?: Achievement;
}

/**
 * Fetch all achievements
 */
export const fetchAllAchievements = async (): Promise<Achievement[]> => {
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching achievements:", error);
    return [];
  }

  return data as Achievement[];
};

/**
 * Fetch user's unlocked achievements
 */
export const fetchUserAchievements = async (userId: string): Promise<UserAchievement[]> => {
  const { data, error } = await supabase
    .from("user_achievements")
    .select(`
      *,
      achievement:achievements(*)
    `)
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user achievements:", error);
    return [];
  }

  return data as UserAchievement[];
};

/**
 * Check if user has unlocked an achievement
 */
export const hasAchievement = async (userId: string, achievementCode: string): Promise<boolean> => {
  const { data } = await supabase
    .from("user_achievements")
    .select("id, achievements!inner(code)")
    .eq("user_id", userId)
    .eq("achievements.code", achievementCode)
    .maybeSingle();

  return !!data;
};

/**
 * Unlock an achievement for a user
 */
export const unlockAchievement = async (
  userId: string,
  achievementId: string,
  progress: number = 0
): Promise<{ success: boolean; error?: string; isNew?: boolean }> => {
  // Check if already unlocked
  const { data: existing } = await supabase
    .from("user_achievements")
    .select("id")
    .eq("user_id", userId)
    .eq("achievement_id", achievementId)
    .maybeSingle();

  if (existing) {
    return { success: true, isNew: false };
  }

  const { error } = await supabase
    .from("user_achievements")
    .insert({
      user_id: userId,
      achievement_id: achievementId,
      progress: progress,
    });

  if (error) {
    console.error("Error unlocking achievement:", error);
    return { success: false, error: error.message };
  }

  return { success: true, isNew: true };
};

/**
 * Claim reward for an achievement
 */
export const claimAchievementReward = async (
  userId: string,
  userAchievementId: string
): Promise<{ success: boolean; amount?: number; error?: string }> => {
  // Get the user achievement with achievement details
  const { data: userAchievement, error: fetchError } = await supabase
    .from("user_achievements")
    .select(`
      *,
      achievement:achievements(reward_amount, name)
    `)
    .eq("id", userAchievementId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !userAchievement) {
    return { success: false, error: "Achievement not found" };
  }

  if (userAchievement.reward_claimed) {
    return { success: false, error: "Reward already claimed" };
  }

  const rewardAmount = (userAchievement.achievement as { reward_amount?: number } | null)?.reward_amount || 0;

  if (rewardAmount <= 0) {
    // Mark as claimed even if no reward
    await supabase
      .from("user_achievements")
      .update({ reward_claimed: true, reward_claimed_at: new Date().toISOString() })
      .eq("id", userAchievementId);
    return { success: true, amount: 0 };
  }

  // Use secure RPC to credit reward (handles wallet update + transaction atomically)
  const achievementName = (userAchievement.achievement as { name?: string } | null)?.name || "Achievement";
  const { data: result, error: creditError } = await supabase.rpc("credit_reward", {
    p_user_id: userId,
    p_amount: Number(rewardAmount),
    p_reward_type: "achievement",
    p_reason: `Achievement Reward: ${achievementName}`,
  });

  const creditResult = result as { success: boolean; new_balance?: number; error?: string } | null;
  if (creditError || !creditResult?.success) {
    console.error("Error crediting reward:", creditError || creditResult?.error);
    return { success: false, error: "Failed to credit reward" };
  }

  // Mark reward as claimed
  await supabase
    .from("user_achievements")
    .update({ reward_claimed: true, reward_claimed_at: new Date().toISOString() })
    .eq("id", userAchievementId);

  return { success: true, amount: rewardAmount };
};

/**
 * Check and unlock achievements based on user stats
 */
export const checkAndUnlockAchievements = async (userId: string): Promise<string[]> => {
  const unlockedCodes: string[] = [];

  try {
    // Fetch all achievements and user achievements
    const [achievements, userAchievements] = await Promise.all([
      fetchAllAchievements(),
      fetchUserAchievements(userId),
    ]);

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievement_id));

    // Fetch user stats
    const [profileResult, walletResult, betsResult, referralsResult, loginResult] = await Promise.all([
      supabase.from("profiles").select("vip_level").eq("user_id", userId).single(),
      supabase.from("wallets").select("total_deposit, total_bet").eq("user_id", userId).single(),
      supabase.from("game_bets").select("id, result, payout").eq("user_id", userId),
      supabase.from("agent_referrals").select("id").eq("agent_user_id", userId),
      supabase.from("daily_login_rewards").select("streak_day").eq("user_id", userId).order("claim_date", { ascending: false }).limit(1),
    ]);

    const vipLevel = profileResult.data?.vip_level || 0;
    const totalDeposit = walletResult.data?.total_deposit || 0;
    const totalBet = walletResult.data?.total_bet || 0;
    const bets = betsResult.data || [];
    const wins = bets.filter((b) => b.result === "win");
    const referralCount = referralsResult.data?.length || 0;
    const loginStreak = loginResult.data?.[0]?.streak_day || 1;

    // Check each achievement
    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;
      let progress = 0;

      switch (achievement.requirement_type) {
        case "login_count":
          shouldUnlock = true; // First login
          progress = 1;
          break;

        case "login_streak":
          progress = loginStreak;
          shouldUnlock = loginStreak >= achievement.requirement_value;
          break;

        case "deposit_count":
          shouldUnlock = totalDeposit > 0;
          progress = totalDeposit > 0 ? 1 : 0;
          break;

        case "total_deposit":
          progress = Number(totalDeposit);
          shouldUnlock = progress >= achievement.requirement_value;
          break;

        case "bet_count":
          progress = bets.length;
          shouldUnlock = progress >= achievement.requirement_value;
          break;

        case "win_count":
          progress = wins.length;
          shouldUnlock = progress >= achievement.requirement_value;
          break;

        case "referral_count":
          progress = referralCount;
          shouldUnlock = progress >= achievement.requirement_value;
          break;

        case "vip_level":
          progress = vipLevel;
          shouldUnlock = progress >= achievement.requirement_value;
          break;

        case "single_win":
          const maxWin = Math.max(...wins.map((w) => Number(w.payout) || 0), 0);
          progress = maxWin;
          shouldUnlock = maxWin >= achievement.requirement_value;
          break;
      }

      if (shouldUnlock) {
        const result = await unlockAchievement(userId, achievement.id, progress);
        if (result.isNew) {
          unlockedCodes.push(achievement.code);
        }
      }
    }
  } catch (error) {
    console.error("Error checking achievements:", error);
  }

  return unlockedCodes;
};

/**
 * Get achievement stats for a user
 */
export const getAchievementStats = async (userId: string): Promise<{
  total: number;
  unlocked: number;
  totalRewards: number;
  claimedRewards: number;
}> => {
  const [achievements, userAchievements] = await Promise.all([
    fetchAllAchievements(),
    fetchUserAchievements(userId),
  ]);

  const totalRewards = achievements.reduce((sum, a) => sum + Number(a.reward_amount), 0);
  const claimedRewards = userAchievements
    .filter((ua) => ua.reward_claimed)
    .reduce((sum, ua) => sum + Number((ua.achievement as { reward_amount?: number } | null)?.reward_amount || 0), 0);

  return {
    total: achievements.length,
    unlocked: userAchievements.length,
    totalRewards,
    claimedRewards,
  };
};
