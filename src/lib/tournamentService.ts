import { supabase } from "@/integrations/supabase/client";

export interface Tournament {
  id: string;
  name: string;
  name_bn: string | null;
  description: string | null;
  description_bn: string | null;
  game_type: string;
  tournament_type: 'daily' | 'weekly' | 'special';
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  entry_fee: number;
  prize_pool: number;
  max_participants: number;
  min_participants: number;
  start_time: string;
  end_time: string;
  prize_distribution: unknown;
  rules: unknown;
  banner_url: string | null;
  created_at: string;
}

// Helper to safely parse prize distribution
export function parsePrizeDistribution(distribution: unknown): { rank: number; percent: number }[] {
  if (Array.isArray(distribution)) {
    return distribution as { rank: number; percent: number }[];
  }
  return [{ rank: 1, percent: 50 }, { rank: 2, percent: 30 }, { rank: 3, percent: 20 }];
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  joined_at: string;
  total_wagered: number;
  total_won: number;
  net_profit: number;
  games_played: number;
  best_win: number;
  score: number;
  prize_won: number | null;
  current_rank: number | null;
}

export interface LeaderboardEntry {
  id: string;
  tournament_id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  vip_level: number;
  total_wagered: number;
  total_won: number;
  net_profit: number;
  games_played: number;
  best_win: number;
  score: number;
  prize_won: number | null;
  rank: number;
}

// Fetch all active and upcoming tournaments
export async function fetchTournaments(status?: string) {
  let query = supabase
    .from('tournaments')
    .select('*')
    .order('start_time', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  } else {
    query = query.in('status', ['active', 'upcoming']);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data as Tournament[];
}

// Fetch single tournament details
export async function fetchTournament(id: string) {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Tournament;
}

// Fetch tournament leaderboard
export async function fetchTournamentLeaderboard(tournamentId: string, limit = 50) {
  const { data, error } = await supabase
    .from('tournament_leaderboard')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as LeaderboardEntry[];
}

// Check if user is participating
export async function checkParticipation(tournamentId: string, userId: string) {
  const { data, error } = await supabase
    .from('tournament_participants')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as TournamentParticipant | null;
}

// Join tournament
export async function joinTournament(tournamentId: string, userId: string) {
  // First check if tournament exists and is active
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();

  if (tournamentError) throw tournamentError;
  
  if (tournament.status !== 'active' && tournament.status !== 'upcoming') {
    throw new Error('Tournament is not available for joining');
  }

  // Check participant count
  const { count, error: countError } = await supabase
    .from('tournament_participants')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId);

  if (countError) throw countError;
  
  if (count && count >= tournament.max_participants) {
    throw new Error('Tournament is full');
  }

  // Deduct entry fee if applicable
  if (tournament.entry_fee > 0) {
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (walletError) throw walletError;
    
    if (wallet.balance < tournament.entry_fee) {
      throw new Error('Insufficient balance for entry fee');
    }

    // Deduct entry fee using secure RPC
    const { data: result, error: deductError } = await supabase.rpc("secure_deduct_bet", {
      p_user_id: userId,
      p_amount: tournament.entry_fee,
      p_game_type: "tournament",
      p_trade_id: `tournament_${tournamentId}_${Date.now()}`,
    });

    const deductResult = result as { success: boolean; new_balance?: number; error?: string } | null;
    if (deductError || !deductResult?.success) {
      throw new Error(deductResult?.error || "Failed to deduct entry fee");
    }
  }

  // Join tournament
  const { data, error } = await supabase
    .from('tournament_participants')
    .insert({
      tournament_id: tournamentId,
      user_id: userId
    })
    .select()
    .single();

  if (error) throw error;
  return data as TournamentParticipant;
}

// Get user's current rank in tournament
export async function getUserTournamentRank(tournamentId: string, userId: string) {
  const { data, error } = await supabase
    .from('tournament_leaderboard')
    .select('rank, score, net_profit, games_played')
    .eq('tournament_id', tournamentId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Get participant count for tournament
export async function getParticipantCount(tournamentId: string) {
  const { count, error } = await supabase
    .from('tournament_participants')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId);

  if (error) throw error;
  return count || 0;
}

// Calculate remaining time
export function getRemainingTime(endTime: string) {
  const end = new Date(endTime).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, expired: false };
}

// Format game type display name
export function getGameDisplayName(gameType: string, isBangla: boolean = false) {
  const names: Record<string, { en: string; bn: string }> = {
    wingo: { en: 'WinGo', bn: 'উইনগো' },
    k3: { en: 'K3', bn: 'কে৩' },
    '5d': { en: '5D', bn: '৫ডি' },
    trxwin: { en: 'TRX Win', bn: 'টিআরএক্স উইন' },
    crash: { en: 'Crash', bn: 'ক্র্যাশ' },
    mines: { en: 'Mines', bn: 'মাইনস' },
    aviator: { en: 'Aviator', bn: 'এভিয়েটর' }
  };

  return names[gameType]?.[isBangla ? 'bn' : 'en'] || gameType;
}
