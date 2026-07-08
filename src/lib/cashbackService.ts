/**
 * Cashback Service - Handles weekly/monthly cashback calculations and claims
 */

import { supabase } from "@/integrations/supabase/client";

export interface CashbackSettings {
  id: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  min_loss_amount: number;
  cashback_percent: number;
  max_cashback: number;
  min_bets_required: number;
  is_enabled: boolean;
  vip_multipliers: Record<string, number>;
  game_rates: Record<string, number>;
}

export interface CashbackRecord {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  period_type: string;
  total_bets: number;
  total_wins: number;
  net_loss: number;
  bet_count: number;
  base_cashback: number;
  vip_multiplier: number;
  final_cashback: number;
  vip_level: number;
  status: 'pending' | 'eligible' | 'claimed' | 'expired';
  claimed_at: string | null;
  expires_at: string | null;
  created_at: string;
}

/**
 * Get period dates based on type
 */
export const getCashbackPeriod = (type: 'daily' | 'weekly' | 'monthly'): { start: Date; end: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (type === 'daily') {
    // Yesterday's cashback
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const end = new Date(today);
    end.setMilliseconds(-1);
    return { start: yesterday, end };
  } else if (type === 'weekly') {
    // Last week (Monday to Sunday)
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() + mondayOffset - 7);
    
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    lastSunday.setHours(23, 59, 59, 999);
    
    return { start: lastMonday, end: lastSunday };
  } else {
    // Last month
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { start: firstDayLastMonth, end: lastDayLastMonth };
  }
};

/**
 * Get current period for claim eligibility check
 */
export const getCurrentPeriod = (type: 'daily' | 'weekly' | 'monthly'): { start: Date; end: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (type === 'daily') {
    const end = new Date(today);
    end.setDate(end.getDate() + 1);
    end.setMilliseconds(-1);
    return { start: today, end };
  } else if (type === 'weekly') {
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return { start: monday, end: sunday };
  } else {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start: firstDay, end: lastDay };
  }
};

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

/**
 * Fetch cashback settings
 */
export const fetchCashbackSettings = async (): Promise<CashbackSettings | null> => {
  const { data, error } = await supabase
    .from("cashback_settings")
    .select("*")
    .eq("is_enabled", true)
    .single();

  if (error) {
    console.error("Error fetching cashback settings:", error);
    return null;
  }

  return data as CashbackSettings;
};

/**
 * Fetch user's cashback records
 */
export const fetchCashbackRecords = async (userId: string): Promise<CashbackRecord[]> => {
  const { data, error } = await supabase
    .from("cashback_records")
    .select("*")
    .eq("user_id", userId)
    .order("period_start", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching cashback records:", error);
    return [];
  }

  return data as CashbackRecord[];
};

/**
 * Calculate cashback for a period
 */
export const calculateCashback = async (
  userId: string,
  periodType: 'daily' | 'weekly' | 'monthly'
): Promise<{
  totalBets: number;
  totalWins: number;
  netLoss: number;
  betCount: number;
  baseCashback: number;
  vipMultiplier: number;
  finalCashback: number;
  isEligible: boolean;
  reason?: string;
}> => {
  const settings = await fetchCashbackSettings();
  if (!settings) {
    return {
      totalBets: 0, totalWins: 0, netLoss: 0, betCount: 0,
      baseCashback: 0, vipMultiplier: 1, finalCashback: 0,
      isEligible: false, reason: "Cashback is not enabled"
    };
  }

  const { start, end } = getCashbackPeriod(periodType);
  const startStr = start.toISOString();
  const endStr = end.toISOString();

  // Fetch bets for period
  const { data: bets } = await supabase
    .from("game_bets")
    .select("bet_amount, payout, result")
    .eq("user_id", userId)
    .gte("created_at", startStr)
    .lte("created_at", endStr);

  const betList = bets || [];
  const totalBets = betList.reduce((sum, b) => sum + Number(b.bet_amount), 0);
  const totalWins = betList.reduce((sum, b) => sum + Number(b.payout || 0), 0);
  const netLoss = Math.max(0, totalBets - totalWins);
  const betCount = betList.length;

  // Get user's VIP level
  const { data: profile } = await supabase
    .from("profiles")
    .select("vip_level")
    .eq("user_id", userId)
    .single();

  const vipLevel = profile?.vip_level || 1;
  const vipMultiplier = settings.vip_multipliers[vipLevel.toString()] || 1.0;

  // Check eligibility
  if (betCount < settings.min_bets_required) {
    return {
      totalBets, totalWins, netLoss, betCount,
      baseCashback: 0, vipMultiplier, finalCashback: 0,
      isEligible: false, reason: `ন্যূনতম ${settings.min_bets_required}টি বেট প্রয়োজন`
    };
  }

  if (netLoss < settings.min_loss_amount) {
    return {
      totalBets, totalWins, netLoss, betCount,
      baseCashback: 0, vipMultiplier, finalCashback: 0,
      isEligible: false, reason: `ন্যূনতম ৳${settings.min_loss_amount} লস প্রয়োজন`
    };
  }

  // Calculate cashback
  const baseCashback = (netLoss * settings.cashback_percent) / 100;
  let finalCashback = baseCashback * vipMultiplier;
  finalCashback = Math.min(finalCashback, settings.max_cashback);

  return {
    totalBets, totalWins, netLoss, betCount,
    baseCashback, vipMultiplier, finalCashback,
    isEligible: true
  };
};

/**
 * Create or update cashback record
 */
export const createCashbackRecord = async (
  userId: string,
  periodType: 'daily' | 'weekly' | 'monthly'
): Promise<{ success: boolean; record?: CashbackRecord; error?: string }> => {
  const { start, end } = getCashbackPeriod(periodType);
  const periodStart = formatDate(start);
  const periodEnd = formatDate(end);

  // Check if record already exists
  const { data: existing } = await supabase
    .from("cashback_records")
    .select("*")
    .eq("user_id", userId)
    .eq("period_start", periodStart)
    .eq("period_type", periodType)
    .single();

  if (existing) {
    return { success: true, record: existing as CashbackRecord };
  }

  // Calculate cashback
  const calculation = await calculateCashback(userId, periodType);
  
  // Get VIP level
  const { data: profile } = await supabase
    .from("profiles")
    .select("vip_level")
    .eq("user_id", userId)
    .single();

  const vipLevel = profile?.vip_level || 1;

  // Set expiry (7 days from now for claiming)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabase
    .from("cashback_records")
    .insert({
      user_id: userId,
      period_start: periodStart,
      period_end: periodEnd,
      period_type: periodType,
      total_bets: calculation.totalBets,
      total_wins: calculation.totalWins,
      net_loss: calculation.netLoss,
      bet_count: calculation.betCount,
      base_cashback: calculation.baseCashback,
      vip_multiplier: calculation.vipMultiplier,
      final_cashback: calculation.finalCashback,
      vip_level: vipLevel,
      status: calculation.isEligible ? 'eligible' : 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating cashback record:", error);
    return { success: false, error: error.message };
  }

  return { success: true, record: data as CashbackRecord };
};

/**
 * Claim cashback
 */
export const claimCashback = async (
  userId: string,
  recordId: string
): Promise<{ success: boolean; amount?: number; error?: string }> => {
  // Get the record
  const { data: record, error: fetchError } = await supabase
    .from("cashback_records")
    .select("*")
    .eq("id", recordId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !record) {
    return { success: false, error: "Cashback record not found" };
  }

  if (record.status === 'claimed') {
    return { success: false, error: "Already claimed" };
  }

  if (record.status !== 'eligible') {
    return { success: false, error: "Not eligible for cashback" };
  }

  if (record.expires_at && new Date(record.expires_at) < new Date()) {
    // Mark as expired
    await supabase
      .from("cashback_records")
      .update({ status: 'expired' })
      .eq("id", recordId);
    return { success: false, error: "Cashback expired" };
  }

  const amount = Number(record.final_cashback);
  if (amount <= 0) {
    return { success: false, error: "No cashback available" };
  }

  // Use secure RPC to credit reward (handles wallet update + transaction atomically)
  const { data: result, error: creditError } = await supabase.rpc("credit_reward", {
    p_user_id: userId,
    p_amount: amount,
    p_reward_type: "cashback",
    p_reason: `Weekly Cashback (${record.period_start} - ${record.period_end})`,
  });

  const creditResult = result as { success: boolean; new_balance?: number; error?: string } | null;
  if (creditError || !creditResult?.success) {
    console.error("Error crediting cashback:", creditError || creditResult?.error);
    return { success: false, error: "Failed to credit cashback" };
  }

  // Update record status
  await supabase
    .from("cashback_records")
    .update({ status: 'claimed', claimed_at: new Date().toISOString() })
    .eq("id", recordId);

  return { success: true, amount };
};

/**
 * Get cashback stats
 */
export const getCashbackStats = async (userId: string): Promise<{
  totalClaimed: number;
  pendingAmount: number;
  lastClaimed: string | null;
}> => {
  const { data: records } = await supabase
    .from("cashback_records")
    .select("final_cashback, status, claimed_at")
    .eq("user_id", userId);

  const list = records || [];
  
  const totalClaimed = list
    .filter(r => r.status === 'claimed')
    .reduce((sum, r) => sum + Number(r.final_cashback), 0);

  const pendingAmount = list
    .filter(r => r.status === 'eligible')
    .reduce((sum, r) => sum + Number(r.final_cashback), 0);

  const claimedRecords = list.filter(r => r.claimed_at);
  const lastClaimed = claimedRecords.length > 0
    ? claimedRecords.sort((a, b) => new Date(b.claimed_at!).getTime() - new Date(a.claimed_at!).getTime())[0].claimed_at
    : null;

  return { totalClaimed, pendingAmount, lastClaimed };
};

/**
 * Get time until next cashback period
 */
export const getTimeUntilNextPeriod = (type: 'daily' | 'weekly' | 'monthly'): { days: number; hours: number; minutes: number } => {
  const { end } = getCurrentPeriod(type);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
};
