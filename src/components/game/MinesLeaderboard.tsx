import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_wins: number;
  total_profit: number;
  biggest_win: number;
  best_multiplier: number;
  total_games: number;
  win_rate: number;
}

interface MinesLeaderboardProps {
  className?: string;
}

export function MinesLeaderboard({ className }: MinesLeaderboardProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'total_profit' | 'biggest_win' | 'best_multiplier'>('total_profit');

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mines_leaderboard')
        .select('*')
        .order(sortBy, { ascending: false })
        .limit(50);

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-xs text-muted-foreground font-bold">{rank}</span>;
  };

  const userRank = entries.findIndex(e => e.user_id === user?.id) + 1;

  return (
    <div className={cn("bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="font-bold text-foreground">Mines Leaderboard</h3>
          </div>
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4 text-muted-foreground", loading && "animate-spin")} />
          </button>
        </div>

        {/* Sort Tabs */}
        <div className="flex gap-2 mt-3">
          {[
            { key: 'total_profit', label: 'Profit' },
            { key: 'biggest_win', label: 'Big Win' },
            { key: 'best_multiplier', label: 'Best Mult' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key as typeof sortBy)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                sortBy === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* User Rank Banner */}
      {user && userRank > 0 && (
        <div className="px-4 py-2 bg-primary/10 border-b border-border/50 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Your Rank</span>
          <span className="font-bold text-primary">#{userRank}</span>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading...
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No players yet. Be the first!</p>
          </div>
        ) : (
          entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 border-b border-border/30 hover:bg-muted/30 transition-colors",
                entry.user_id === user?.id && "bg-primary/5"
              )}
            >
              {/* Rank */}
              <div className="w-8 flex justify-center">
                {getRankIcon(index + 1)}
              </div>

              {/* Avatar & Name */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center overflow-hidden">
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-primary">
                      {entry.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <span className="font-medium text-foreground truncate">
                  {entry.username || 'Anonymous'}
                </span>
              </div>

              {/* Stats */}
              <div className="text-right">
                <div className="font-bold text-green-400">
                  {sortBy === 'total_profit' && `$${entry.total_profit.toFixed(2)}`}
                  {sortBy === 'biggest_win' && `$${entry.biggest_win.toFixed(2)}`}
                  {sortBy === 'best_multiplier' && `${entry.best_multiplier.toFixed(2)}x`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {entry.total_games} games • {entry.win_rate.toFixed(0)}% win
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
