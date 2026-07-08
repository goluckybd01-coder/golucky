/**
 * Challenge Service - Handles daily/weekly challenge operations
 */

import { supabase } from "@/integrations/supabase/client";

export interface Challenge {
  id: string;
  code: string;
  name: string;
  name_bn: string | null;
  description: string;
  description_bn: string | null;
  icon: string;
  challenge_type: 'daily' | 'weekly';
  category: string;
  requirement_type: string;
  requirement_value: number;
  reward_amount: number;
  bonus_multiplier: number;
  is_active: boolean;
  sort_order: number;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  target_value: number;
  is_completed: boolean;
  completed_at: string | null;
  reward_claimed: boolean;
  reward_claimed_at: string | null;
  period_start: string;
  period_end: string;
  challenge?: Challenge;
}

/**
 * Get current period dates for daily/weekly challenges
 */
export const getPeriodDates = (type: 'daily' | 'weekly'): { start: Date; end: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (type === 'daily') {
    const end = new Date(today);
    end.setDate(end.getDate() + 1);
    end.setMilliseconds(-1);
    return { start: today, end };
  } else {
    // Weekly: Monday to Sunday
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return { start: monday, end: sunday };
  }
};

/**
 * Format date as YYYY-MM-DD
 */
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Fetch all active challenges
 */
export const fetchChallenges = async (type?: 'daily' | 'weekly'): Promise<Challenge[]> => {
  let query = supabase
    .from("challenges")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (type) {
    query = query.eq("challenge_type", type);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching challenges:", error);
    return [];
  }

  return data as Challenge[];
};

/**
 * Fetch user's challenge progress for current period
 */
export const fetchUserChallenges = async (
  userId: string,
  type: 'daily' | 'weekly'
): Promise<UserChallenge[]> => {
  const { start } = getPeriodDates(type);
  const periodStart = formatDate(start);

  const { data, error } = await supabase
    .from("user_challenges")
    .select(`
      *,
      challenge:challenges(*)
    `)
    .eq("user_id", userId)
    .eq("period_start", periodStart);

  if (error) {
    console.error("Error fetching user challenges:", error);
    return [];
  }

  return data as UserChallenge[];
};

/**
 * Initialize challenges for user for current period
 */
export const initializeChallenges = async (
  userId: string,
  type: 'daily' | 'weekly'
): Promise<void> => {
  const challenges = await fetchChallenges(type);
  const { start, end } = getPeriodDates(type);
  const periodStart = formatDate(start);
  const periodEnd = formatDate(end);

  // Check existing challenges for this period
  const { data: existing } = await supabase
    .from("user_challenges")
    .select("challenge_id")
    .eq("user_id", userId)
    .eq("period_start", periodStart);

  const existingIds = new Set((existing || []).map(e => e.challenge_id));

  // Insert missing challenges
  const newChallenges = challenges
    .filter(c => !existingIds.has(c.id))
    .map(c => ({
      user_id: userId,
      challenge_id: c.id,
      progress: 0,
      target_value: c.requirement_value,
      period_start: periodStart,
      period_end: periodEnd,
    }));

  if (newChallenges.length > 0) {
    await supabase.from("user_challenges").insert(newChallenges);
  }
};

/**
 * Update challenge progress
 */
export const updateChallengeProgress = async (
  userId: string,
  challengeId: string,
  progress: number
): Promise<{ success: boolean; completed?: boolean }> => {
  const { data: userChallenge, error: fetchError } = await supabase
    .from("user_challenges")
    .select("*, challenge:challenges(*)")
    .eq("user_id", userId)
    .eq("challenge_id", challengeId)
    .order("period_start", { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !userChallenge) {
    return { success: false };
  }

  const isCompleted = progress >= userChallenge.target_value;
  
  const { error: updateError } = await supabase
    .from("user_challenges")
    .update({
      progress,
      is_completed: isCompleted,
      completed_at: isCompleted && !userChallenge.is_completed ? new Date().toISOString() : userChallenge.completed_at,
    })
    .eq("id", userChallenge.id);

  if (updateError) {
    return { success: false };
  }

  return { success: true, completed: isCompleted && !userChallenge.is_completed };
};

/**
 * Claim challenge reward
 */
export const claimChallengeReward = async (
  userId: string,
  userChallengeId: string
): Promise<{ success: boolean; amount?: number; error?: string }> => {
  // Get user challenge with challenge details
  const { data: userChallenge, error: fetchError } = await supabase
    .from("user_challenges")
    .select(`
      *,
      challenge:challenges(reward_amount, name)
    `)
    .eq("id", userChallengeId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !userChallenge) {
    return { success: false, error: "Challenge not found" };
  }

  if (!userChallenge.is_completed) {
    return { success: false, error: "Challenge not completed" };
  }

  if (userChallenge.reward_claimed) {
    return { success: false, error: "Reward already claimed" };
  }

  const rewardAmount = (userChallenge.challenge as { reward_amount?: number } | null)?.reward_amount || 0;

  if (rewardAmount <= 0) {
    await supabase
      .from("user_challenges")
      .update({ reward_claimed: true, reward_claimed_at: new Date().toISOString() })
      .eq("id", userChallengeId);
    return { success: true, amount: 0 };
  }

  // Use secure RPC to credit reward (handles wallet update + transaction atomically)
  const challengeName = (userChallenge.challenge as { name?: string } | null)?.name || "Challenge";
  const { data: result, error: creditError } = await supabase.rpc("credit_reward", {
    p_user_id: userId,
    p_amount: Number(rewardAmount),
    p_reward_type: "challenge",
    p_reason: `Challenge Reward: ${challengeName}`,
  });

  const creditResult = result as { success: boolean; new_balance?: number; error?: string } | null;
  if (creditError || !creditResult?.success) {
    console.error("Error crediting reward:", creditError || creditResult?.error);
    return { success: false, error: "Failed to credit reward" };
  }

  // Mark reward as claimed
  await supabase
    .from("user_challenges")
    .update({ reward_claimed: true, reward_claimed_at: new Date().toISOString() })
    .eq("id", userChallengeId);

  return { success: true, amount: rewardAmount };
};

/**
 * Calculate user's current progress for different requirement types
 */
export const calculateUserProgress = async (
  userId: string,
  type: 'daily' | 'weekly'
): Promise<Record<string, number>> => {
  const { start, end } = getPeriodDates(type);
  const startStr = start.toISOString();
  const endStr = end.toISOString();

  // Fetch bets for period
  const { data: bets } = await supabase
    .from("game_bets")
    .select("id, bet_amount, result, payout, game_type, created_at")
    .eq("user_id", userId)
    .gte("created_at", startStr)
    .lte("created_at", endStr);

  const betList = bets || [];
  const wins = betList.filter(b => b.result === "win");
  const totalWager = betList.reduce((sum, b) => sum + Number(b.bet_amount), 0);
  const totalPayout = betList.reduce((sum, b) => sum + Number(b.payout || 0), 0);
  const uniqueGames = new Set(betList.map(b => b.game_type)).size;

  // Fetch login days for period (from daily_login_rewards)
  const { data: logins } = await supabase
    .from("daily_login_rewards")
    .select("claim_date")
    .eq("user_id", userId)
    .gte("claim_date", formatDate(start))
    .lte("claim_date", formatDate(end));

  const loginDays = logins?.length || 0;

  // Fetch deposits for period
  const { data: deposits } = await supabase
    .from("wallet_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "deposit")
    .gte("created_at", startStr)
    .lte("created_at", endStr);

  // Fetch referrals for period
  const { data: referrals } = await supabase
    .from("agent_referrals")
    .select("id")
    .eq("agent_user_id", userId)
    .gte("created_at", startStr)
    .lte("created_at", endStr);

  return {
    login: 1, // Today's login
    login_days: loginDays,
    bet_count: betList.length,
    win_count: wins.length,
    wager_amount: totalWager,
    unique_games: uniqueGames,
    deposit_count: deposits?.length || 0,
    referral_count: referrals?.length || 0,
    profit_amount: Math.max(0, totalPayout - totalWager),
  };
};

/**
 * Sync user challenges with current progress
 */
export const syncChallengeProgress = async (
  userId: string,
  type: 'daily' | 'weekly'
): Promise<void> => {
  await initializeChallenges(userId, type);
  
  const [userChallenges, progress] = await Promise.all([
    fetchUserChallenges(userId, type),
    calculateUserProgress(userId, type),
  ]);

  // Update each challenge with current progress
  for (const uc of userChallenges) {
    if (uc.reward_claimed) continue;
    
    const challenge = uc.challenge as Challenge;
    if (!challenge) continue;

    const currentProgress = progress[challenge.requirement_type] || 0;
    
    if (currentProgress !== uc.progress) {
      await updateChallengeProgress(userId, challenge.id, currentProgress);
    }
  }
};

/**
 * Get time remaining until period ends
 */
export const getTimeRemaining = (type: 'daily' | 'weekly'): { hours: number; minutes: number; seconds: number } => {
  const { end } = getPeriodDates(type);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
};

/**
 * Get challenge stats
 */
export const getChallengeStats = async (
  userId: string,
  type: 'daily' | 'weekly'
): Promise<{
  total: number;
  completed: number;
  claimed: number;
  totalRewards: number;
  earnedRewards: number;
}> => {
  const [challenges, userChallenges] = await Promise.all([
    fetchChallenges(type),
    fetchUserChallenges(userId, type),
  ]);

  const completed = userChallenges.filter(uc => uc.is_completed).length;
  const claimed = userChallenges.filter(uc => uc.reward_claimed).length;
  const totalRewards = challenges.reduce((sum, c) => sum + Number(c.reward_amount), 0);
  const earnedRewards = userChallenges
    .filter(uc => uc.reward_claimed)
    .reduce((sum, uc) => sum + Number((uc.challenge as { reward_amount?: number } | null)?.reward_amount || 0), 0);

  return {
    total: challenges.length,
    completed,
    claimed,
    totalRewards,
    earnedRewards,
  };
};
