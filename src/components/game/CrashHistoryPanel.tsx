import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { History, Zap, TrendingUp, BarChart3, Flame, Snowflake, RefreshCw, ChevronDown, Loader2 } from "lucide-react";

const PAGE_SIZE = 10;

interface CrashRoundHistory {
  id: string;
  round_number: number;
  crash_multiplier: number;
  crashed_at: string;
}

export function CrashHistoryPanel() {
  const [history, setHistory] = useState<CrashRoundHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchHistory = useCallback(async () => {
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from("crash_rounds")
        .select("id, round_number, crash_multiplier, crashed_at")
        .eq("status", "settled")
        .not("crashed_at", "is", null)
        .order("crashed_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      const rows = data || [];
      setHistory(rows);
      setHasMore(rows.length > 0 && rows.length >= limit);
      setErrorMessage(null);
    } catch (err) {
      console.error("Failed to fetch crash history:", err);
      setErrorMessage("Failed to load crash history. Please try again later.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [limit]);

  const loadMore = useCallback(() => {
    setIsLoadingMore(true);
    setLimit((prev) => prev + PAGE_SIZE);
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier >= 10) return "bg-gradient-to-r from-yellow-400 to-amber-500 text-black";
    if (multiplier >= 5) return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
    if (multiplier >= 2) return "bg-gradient-to-r from-emerald-500 to-green-500 text-white";
    if (multiplier >= 1.5) return "bg-gradient-to-r from-cyan-500 to-blue-500 text-white";
    return "bg-slate-600 text-slate-200";
  };

  const hotStreak = useMemo(() => {
    if (history.length === 0) return null;
    const HIGH_THRESHOLD = 2;
    const MIN_STREAK = 2;
    let streak = 0;
    let maxMultiplier = 0;
    let totalStreak = 0;
    for (const round of history) {
      if (round.crash_multiplier >= HIGH_THRESHOLD) {
        streak++;
        totalStreak += round.crash_multiplier;
        maxMultiplier = Math.max(maxMultiplier, round.crash_multiplier);
      } else {
        break;
      }
    }
    if (streak >= MIN_STREAK) {
      const avgStreak = totalStreak / streak;
      let intensity: 'warm' | 'hot' | 'blazing' = 'warm';
      if (streak >= 5 || maxMultiplier >= 10) intensity = 'blazing';
      else if (streak >= 3 || maxMultiplier >= 5) intensity = 'hot';
      return { count: streak, maxMultiplier, avgMultiplier: avgStreak, intensity };
    }
    return null;
  }, [history]);

  const coldStreak = useMemo(() => {
    if (history.length === 0) return null;
    const LOW_THRESHOLD = 1.5;
    const MIN_STREAK = 2;
    let streak = 0;
    let minMultiplier = Infinity;
    let totalStreak = 0;
    for (const round of history) {
      if (round.crash_multiplier < LOW_THRESHOLD) {
        streak++;
        totalStreak += round.crash_multiplier;
        minMultiplier = Math.min(minMultiplier, round.crash_multiplier);
      } else {
        break;
      }
    }
    if (streak >= MIN_STREAK) {
      const avgStreak = totalStreak / streak;
      let intensity: 'cool' | 'cold' | 'freezing' = 'cool';
      if (streak >= 5 || minMultiplier <= 1.1) intensity = 'freezing';
      else if (streak >= 3 || minMultiplier <= 1.2) intensity = 'cold';
      return { count: streak, minMultiplier, avgMultiplier: avgStreak, intensity };
    }
    return null;
  }, [history]);

  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const multipliers = history.map(r => r.crash_multiplier);
    const avg = multipliers.reduce((a, b) => a + b, 0) / multipliers.length;
    const max = Math.max(...multipliers);
    const min = Math.min(...multipliers);
    const distribution = {
      early: multipliers.filter(m => m < 1.5).length,
      low: multipliers.filter(m => m >= 1.5 && m < 2).length,
      mid: multipliers.filter(m => m >= 2 && m < 5).length,
      high: multipliers.filter(m => m >= 5 && m < 10).length,
      ultra: multipliers.filter(m => m >= 10).length,
    };
    const total = history.length;
    return {
      avg, max, min, distribution, total,
      distributionPercents: {
        early: (distribution.early / total) * 100,
        low: (distribution.low / total) * 100,
        mid: (distribution.mid / total) * 100,
        high: (distribution.high / total) * 100,
        ultra: (distribution.ultra / total) * 100,
      }
    };
  }, [history]);

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-2">
          <History size={14} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-400">Recent Crashes</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="w-12 h-6 bg-slate-700 rounded animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div role="alert" className="bg-slate-800/50 rounded-lg p-3 border border-red-500/50">
        <div className="flex items-center gap-2 mb-2">
          <History size={14} className="text-red-400" />
          <span className="text-xs font-medium text-red-400">Recent Crashes</span>
        </div>
        <p className="text-xs text-red-400 text-center py-2">{errorMessage}</p>
        <div className="flex justify-center">
          <button type="button" onClick={() => { setIsLoading(true); fetchHistory(); }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium border border-red-500/40 transition-colors">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-2">
          <History size={14} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-400">Recent Crashes</span>
        </div>
        <p className="text-xs text-slate-500 text-center py-2">No crash history yet</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={14} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-400">Recent Crashes</span>
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <Zap size={10} className="animate-pulse" /> LIVE
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-500">Last {history.length}</span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-600">
        {history.map((round) => (
          <div key={round.id}
            className={`px-2 py-1 rounded text-xs font-bold flex-shrink-0 ${getMultiplierColor(round.crash_multiplier)}`}
            title={`Round #${round.round_number}`}>
            {round.crash_multiplier.toFixed(2)}x
          </div>
        ))}
        {isLoadingMore && [...Array(PAGE_SIZE)].map((_, i) => (
          <div key={`skeleton-${i}`} data-testid="crash-pill-skeleton"
            className="w-12 h-6 bg-slate-700 rounded animate-pulse flex-shrink-0" />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center pt-1">
          <button type="button" onClick={loadMore} disabled={isLoadingMore}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-700/50 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-600/50 transition-colors disabled:opacity-60">
            {isLoadingMore ? (<><Loader2 size={12} className="animate-spin" /> Loading...</>) : (<><ChevronDown size={12} /> Load More</>)}
          </button>
        </div>
      )}
    </div>
  );
}

export default CrashHistoryPanel;
