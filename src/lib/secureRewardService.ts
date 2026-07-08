/**
 * Secure Reward Service
 * All reward/bonus operations go through secure database functions
 * NEVER update wallet balance directly from client
 */

import { supabase } from "@/integrations/supabase/client";

export interface RewardResult {
  success: boolean;
  newBalance?: number;
  error?: string;
}

/**
 * Credit a reward/bonus to user's wallet securely
 * Uses the secure credit_reward database function
 */
export const creditRewardSecure = async (
  amount: number,
  rewardType: string,
  reason?: string
): Promise<RewardResult> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  if (amount <= 0) {
    return { success: false, error: "Invalid reward amount" };
  }

  // Use secure database function
  const { data, error } = await supabase.rpc("credit_reward", {
    p_user_id: user.id,
    p_amount: amount,
    p_reward_type: rewardType,
    p_reason: reason || null,
  });

  if (error) {
    console.error("Error crediting reward:", error);
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; new_balance?: number; error?: string };
  return {
    success: result.success,
    newBalance: result.new_balance,
    error: result.error,
  };
};

/**
 * Check if user is rate limited for a specific reward type
 */
export const checkRewardRateLimit = async (
  rewardType: string,
  maxPerDay: number = 10
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("check_reward_rate_limit", {
    p_user_id: user.id,
    p_reward_type: rewardType,
    p_max_per_day: maxPerDay,
  });

  if (error) {
    console.error("Error checking rate limit:", error);
    return false;
  }

  return data as boolean;
};

/**
 * Credit daily login reward securely
 */
export const creditDailyReward = async (
  streakDay: number,
  amount: number
): Promise<RewardResult> => {
  return creditRewardSecure(
    amount,
    "daily_login",
    `Day ${streakDay} daily login reward`
  );
};

/**
 * Credit VIP reward securely
 */
export const creditVIPReward = async (
  vipLevel: number,
  amount: number,
  rewardType: "monthly" | "upgrade"
): Promise<RewardResult> => {
  return creditRewardSecure(
    amount,
    `vip_${rewardType}`,
    `VIP Level ${vipLevel} ${rewardType} reward`
  );
};

/**
 * Credit achievement reward securely
 */
export const creditAchievementReward = async (
  achievementCode: string,
  amount: number
): Promise<RewardResult> => {
  return creditRewardSecure(
    amount,
    "achievement",
    `Achievement unlocked: ${achievementCode}`
  );
};

/**
 * Credit challenge reward securely
 */
export const creditChallengeReward = async (
  challengeCode: string,
  amount: number
): Promise<RewardResult> => {
  return creditRewardSecure(
    amount,
    "challenge",
    `Challenge completed: ${challengeCode}`
  );
};

/**
 * Credit cashback securely
 */
export const creditCashback = async (
  amount: number,
  periodType: string
): Promise<RewardResult> => {
  return creditRewardSecure(
    amount,
    "cashback",
    `${periodType} cashback reward`
  );
};

/**
 * Credit spinner reward securely
 */
export const creditSpinnerReward = async (
  amount: number
): Promise<RewardResult> => {
  return creditRewardSecure(
    amount,
    "lucky_spin",
    "Lucky spinner reward"
  );
};

/**
 * Credit referral bonus securely
 */
export const creditReferralBonus = async (
  amount: number,
  type: "registration" | "deposit" | "betting"
): Promise<RewardResult> => {
  return creditRewardSecure(
    amount,
    `referral_${type}`,
    `Referral ${type} bonus`
  );
};

/**
 * Credit bonus code reward securely
 */
export const creditBonusCode = async (
  code: string,
  amount: number
): Promise<RewardResult> => {
  return creditRewardSecure(
    amount,
    "bonus_code",
    `Bonus code redeemed: ${code}`
  );
};
