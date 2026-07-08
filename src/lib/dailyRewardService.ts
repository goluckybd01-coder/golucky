/**
 * Daily Login Reward Service
 * Handles daily reward claiming, streak tracking, and reward calculations
 */

import { supabase } from "@/integrations/supabase/client";
import { sendDailyRewardNotification } from "@/lib/pushNotificationService";

// Reward amounts for each streak day (1-7, then repeats)
const STREAK_REWARDS = [5, 10, 15, 25, 35, 50, 100]; // Day 1-7 rewards

export interface DailyRewardInfo {
  canClaim: boolean;
  currentStreak: number;
  lastClaimDate: string | null;
  todayReward: number;
  totalEarned: number;
  nextReward: number;
  streakRewards: { day: number; amount: number; claimed: boolean; isToday: boolean }[];
}

export interface ClaimResult {
  success: boolean;
  rewardAmount?: number;
  newStreak?: number;
  error?: string;
}

/**
 * Get reward amount for a specific streak day
 */
export const getRewardForDay = (streakDay: number): number => {
  const dayIndex = ((streakDay - 1) % 7);
  return STREAK_REWARDS[dayIndex];
};

/**
 * Check if a date is yesterday relative to today
 */
const isYesterday = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

/**
 * Check if a date is today
 */
const isToday = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Get daily reward information for current user
 */
export const getDailyRewardInfo = async (): Promise<DailyRewardInfo> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return {
      canClaim: false,
      currentStreak: 0,
      lastClaimDate: null,
      todayReward: STREAK_REWARDS[0],
      totalEarned: 0,
      nextReward: STREAK_REWARDS[0],
      streakRewards: STREAK_REWARDS.map((amount, i) => ({
        day: i + 1,
        amount,
        claimed: false,
        isToday: i === 0,
      })),
    };
  }

  // Get user's claim history (last 30 days)
  const { data: claims, error } = await supabase
    .from("daily_login_rewards")
    .select("*")
    .eq("user_id", user.id)
    .order("claim_date", { ascending: false })
    .limit(30);

  if (error) {
    console.error("Error fetching daily rewards:", error);
    return {
      canClaim: true,
      currentStreak: 0,
      lastClaimDate: null,
      todayReward: STREAK_REWARDS[0],
      totalEarned: 0,
      nextReward: STREAK_REWARDS[0],
      streakRewards: STREAK_REWARDS.map((amount, i) => ({
        day: i + 1,
        amount,
        claimed: false,
        isToday: i === 0,
      })),
    };
  }

  const lastClaim = claims?.[0];
  const hasClaimedToday = lastClaim ? isToday(lastClaim.claim_date) : false;
  const wasYesterday = lastClaim ? isYesterday(lastClaim.claim_date) : false;
  
  // Calculate current streak
  let currentStreak = 0;
  if (hasClaimedToday) {
    currentStreak = lastClaim.streak_day;
  } else if (wasYesterday && lastClaim) {
    currentStreak = lastClaim.streak_day; // Will be incremented on claim
  } else {
    currentStreak = 0; // Streak broken
  }

  // Calculate next streak day (for claiming)
  const nextStreakDay = hasClaimedToday ? currentStreak : (wasYesterday ? currentStreak + 1 : 1);
  const todayReward = getRewardForDay(nextStreakDay);
  const nextReward = getRewardForDay(nextStreakDay + 1);

  // Calculate total earned
  const totalEarned = claims?.reduce((sum, c) => sum + Number(c.reward_amount), 0) || 0;

  // Build streak rewards display (7 days)
  const streakRewards = STREAK_REWARDS.map((amount, i) => {
    const dayNum = i + 1;
    const isCurrentDay = dayNum === nextStreakDay;
    const isClaimed = hasClaimedToday && dayNum <= currentStreak;
    
    return {
      day: dayNum,
      amount,
      claimed: isClaimed || (dayNum < nextStreakDay && currentStreak > 0),
      isToday: isCurrentDay && !hasClaimedToday,
    };
  });

  return {
    canClaim: !hasClaimedToday,
    currentStreak: hasClaimedToday ? currentStreak : (wasYesterday ? currentStreak : 0),
    lastClaimDate: lastClaim?.claim_date || null,
    todayReward,
    totalEarned,
    nextReward,
    streakRewards,
  };
};

/**
 * Claim daily reward
 */
export const claimDailyReward = async (): Promise<ClaimResult> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: "Please login to claim reward" };
  }

  // Get last claim to determine streak
  const { data: lastClaims } = await supabase
    .from("daily_login_rewards")
    .select("*")
    .eq("user_id", user.id)
    .order("claim_date", { ascending: false })
    .limit(1);

  const lastClaim = lastClaims?.[0];
  const wasYesterday = lastClaim ? isYesterday(lastClaim.claim_date) : false;
  const hasClaimedToday = lastClaim ? isToday(lastClaim.claim_date) : false;

  if (hasClaimedToday) {
    return { success: false, error: "Already claimed today" };
  }

  // Calculate new streak
  const newStreak = wasYesterday ? (lastClaim.streak_day % 7) + 1 : 1;
  const rewardAmount = getRewardForDay(newStreak);

  // Insert claim record
  const { error: claimError } = await supabase
    .from("daily_login_rewards")
    .insert({
      user_id: user.id,
      reward_amount: rewardAmount,
      streak_day: newStreak,
    });

  if (claimError) {
    console.error("Error claiming reward:", claimError);
    return { success: false, error: "Failed to claim reward" };
  }

  // Use secure RPC to credit reward (handles wallet update + transaction atomically)
  const { data: result, error: creditError } = await supabase.rpc("credit_reward", {
    p_user_id: user.id,
    p_amount: rewardAmount,
    p_reward_type: "daily_login",
    p_reason: `Day ${newStreak} Login Bonus`,
  });

  const creditResult = result as { success: boolean; new_balance?: number; error?: string } | null;
  if (creditError || !creditResult?.success) {
    console.error("Error crediting reward:", creditError || creditResult?.error);
    return { success: false, error: "Failed to credit reward" };
  }

  // Send push notification for daily reward
  await sendDailyRewardNotification(rewardAmount, newStreak);

  return {
    success: true,
    rewardAmount,
    newStreak,
  };
};
