import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Star, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Terminal, Trash2 } from "lucide-react";
import { fetchLiveMatches, type MatchData, type Sport } from "@/services/sportsApi";

const POLL_SECONDS = (() => {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  const raw = Number(env.VITE_SPORTS_POLL_SECONDS);
  if (!Number.isFinite(raw) || raw <= 0) return 15;
  return Math.min(300, Math.max(5, Math.round(raw)));
})();

const SPORTS: { key: Sport | "all"; label: string; icon: string }[] = [
  { key: "all", label: "সবগুলো", icon: "🎯" },
  { key: "football", label: "ফুটবল", icon: "⚽" },
  { key: "cricket", label: "ক্রিকেট", icon: "🏏" },
  { key: "basketball", label: "বাস্কেটবল", icon: "🏀" },
  { key: "tennis", label: "টেনিস", icon: "🎾" },
  { key: "kabaddi", label: "কবাডি", icon: "🤼" },
  { key: "volleyball", label: "ভলিবল", icon: "🏐" },
];

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const fmtExact = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("bn-BD", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "";

const fmtLastUpdated = (iso?: string) => {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 10) return "এইমাত্র";
  if (diff < 60) return `${diff}s আগে`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m আগে`;
  return `${Math.floor(diff / 3600)}h আগে`;
};

const OddsButton = ({
  label, value, change, disabled, onClick,
}: {
  label: string; value: number; change?: "up" | "down" | "same"; disabled?: boolean; onClick?: () => void;
}) => {
  if (value === 0) return <div className="flex-1" />;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 rounded-lg px-2 py-2 font-bold text-xs transition-all flex flex-col items-center gap-0.5 border ${
        disabled
          ? "bg-slate-700/40 text-slate-500 border-slate-700 cursor-not-allowed"
          : "bg-amber-500 hover:bg-amber-400 hover:scale-105 text-slate-900 border-amber-400 shadow-sm"
      }`}
    >
      <span className="text-[10px] opacity-80">{label}</span>
      <span className="flex items-center gap-0.5">
        {value.toFixed(2)}
        {change === "up" && <TrendingUp className="h-3 w-3 text-emerald-700" />}
        {change === "down" && <TrendingDown className="h-3 w-3 text-red-700" />}
      </span>
    </button>
  );
};

const StatusBadge = ({ match }: { match: MatchData }) => {
  if (match.status === "live") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-full">
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        লাইভ {match.elapsed && <span className="opacity-90">· {match.elapsed}</span>}
      </span>
    );
  }
  if (match.status === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
        <Clock className="h-3 w-3" /> {fmtTime(match.startTime)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
      সমাপ্ত
    </span>
  );
};

const MatchCard = ({ match, onBet }: { match: MatchData; onBet: () => void }) => {
  const finished = match.status === "finished";
  return (
    <div
      onClick={onBet}
      className={`group cursor-pointer rounded-xl border bg-[#252538] p-3 transition-all hover:scale-[1.01] ${
        finished ? "border-emerald-600/40" : "border-[#3A3A4A] hover:border-emerald-500/60"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-slate-400 truncate max-w-[60%]">{match.league}</span>
        <StatusBadge match={match} />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-white font-semibold text-sm truncate">{match.homeTeam}</span>
            {match.homeScore != null && (
              <span className="text-amber-300 font-bold text-base">{match.homeScore}</span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 my-0.5">বনাম</div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-white font-semibold text-sm truncate">{match.awayTeam}</span>
            {match.awayScore != null && (
              <span className="text-amber-300 font-bold text-base">{match.awayScore}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 mb-2">
        <OddsButton label="1" value={match.odds.home} change={match.oddsChanges?.home} disabled={finished} />
        <OddsButton label="X" value={match.odds.draw} change={match.oddsChanges?.draw} disabled={finished} />
        <OddsButton label="2" value={match.odds.away} change={match.oddsChanges?.away} disabled={finished} />
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
          onClick={(e) => { e.stopPropagation(); onBet(); }}
        >
          আরও {match.totalMarkets}টি বাজার
        </button>
        <div className="flex items-center gap-2">
          {match.lastUpdated && (
            <span className="text-[9px] text-slate-500" title={match.lastUpdated}>
              {fmtLastUpdated(match.lastUpdated)}
            </span>
          )}
          <button type="button" onClick={(e) => e.stopPropagation()} aria-label="favorite">
            <Star className="h-3.5 w-3.5 text-slate-500 hover:text-amber-400" />
          </button>
          {!finished && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onBet(); }}
              className="text-[11px] font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 px-3 py-1 rounded-md"
            >
              বাজি রাখুন
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="rounded-xl border border-[#3A3A4A] bg-[#252538] p-3 animate-pulse">
    <div className="h-3 w-32 bg-white/10 rounded mb-3" />
    <div className="h-4 w-40 bg-white/10 rounded mb-2" />
    <div className="h-4 w-36 bg-white/10 rounded mb-3" />
    <div className="flex gap-1.5">
      <div className="h-8 flex-1 bg-white/10 rounded" />
      <div className="h-8 flex-1 bg-white/10 rounded" />
      <div className="h-8 flex-1 bg-white/10 rounded" />
    </div>
  </div>
);

const LiveSportsBettingSection = () => {
  const navigate = useNavigate();
  const [activeSport, setActiveSport] = useState<Sport | "all">("all");
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshError, setLastRefreshError] = useState<string | null>(null);
  const [sectionUpdated, setSectionUpdated] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<"idle" | "updating" | "failed">("updating");
  const [nextRefreshAt, setNextRefreshAt] = useState<number>(Date.now() + POLL_SECONDS * 1000);
  const [countdown, setCountdown] = useState<number>(POLL_SECONDS);
  const [showDebug, setShowDebug] = useState(false);
  const [logsTick, setLogsTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failuresRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MAX_LOGS = 50;
  const LOG_KEY = "golucky.liveSports.logs";
  type LogEntry = {
    t: string;
    event: "backoff" | "retry" | "success" | "reset" | "error";
    sport?: string;
    failures?: number;
    delaySeconds?: number;
    message?: string;
  };
  const logsRef = useRef<LogEntry[]>([]);
  const pushLog = (entry: Omit<LogEntry, "t">) => {
    const full: LogEntry = { ...entry, t: new Date().toISOString() };
    const next = [full, ...logsRef.current].slice(0, MAX_LOGS);
    logsRef.current = next;
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(next));
    } catch {
    }
    setLogsTick((v) => v + 1);
    if (import.meta.env.DEV) {
      console.debug("[LiveSports]", full.event, full);
    }
  };
  const clearLogs = () => {
    logsRef.current = [];
    try {
      localStorage.removeItem(LOG_KEY);
    } catch {
    }
    setLogsTick((v) => v + 1);
  };

  const computeBackoffSeconds = (failures: number) => {
    if (failures <= 0) return POLL_SECONDS;
    const baseDelay = Math.min(300, POLL_SECONDS * Math.pow(2, failures));
    const jitter = Math.random() * baseDelay * 0.3;
    const delay = Math.round(baseDelay + jitter);
    pushLog({ event: "backoff", failures, delaySeconds: delay });
    return delay;
  };

  const load = async (sport: Sport | "all", { silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setLoading(true);
    setStatus("updating");
    setError(null);
    setLastRefreshError(null);
    try {
      const data = await fetchLiveMatches(sport);
      setMatches(data.matches);
      if (data.lastUpdated) setSectionUpdated(data.lastUpdated);
      setStatus("idle");
      failuresRef.current = 0;
      const next = computeBackoffSeconds(0);
      setNextRefreshAt(Date.now() + next * 1000);
      setCountdown(next);
      pushLog({ event: "success", sport });
    } catch (e) {
      const msg = "ডেটা লোড করতে সমস্যা হয়েছে";
      if (silent) {
        setLastRefreshError(msg);
      } else {
        setError(msg);
      }
      setStatus("failed");
      failuresRef.current += 1;
      const next = computeBackoffSeconds(failuresRef.current);
      setNextRefreshAt(Date.now() + next * 1000);
      setCountdown(next);
      pushLog({
        event: "error",
        sport,
        failures: failuresRef.current,
        delaySeconds: next,
        message: e instanceof Error ? e.message : "unknown",
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const startPolling = (sport: Sport | "all") => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);

    const schedule = () => {
      const delay = computeBackoffSeconds(failuresRef.current) * 1000;
      setNextRefreshAt(Date.now() + delay);
      setCountdown(Math.round(delay / 1000));
      pushLog({ event: "retry", sport, failures: failuresRef.current, delaySeconds: Math.round(delay / 1000) });
      retryTimeoutRef.current = setTimeout(async () => {
        await load(sport, { silent: true });
        schedule();
      }, delay);
    };
    schedule();
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setLastRefreshError(null);
    setStatus("updating");
    try {
      failuresRef.current = 0;
      pushLog({ event: "reset", sport: activeSport, message: "manual refresh" });
      await load(activeSport, { silent: true });
    } finally {
      setRefreshing(false);
      startPolling(activeSport);
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOG_KEY);
      if (raw) logsRef.current = JSON.parse(raw).slice(0, MAX_LOGS);
    } catch {
      logsRef.current = [];
    }
  }, []);

  useEffect(() => {
    load(activeSport);
    startPolling(activeSport);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [activeSport]);

  useEffect(() => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const goBetSlip = () => navigate("/sports-betting");

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      );
    }
    if (error) {
      return (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-center">
          <AlertTriangle className="h-6 w-6 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-200 mb-3">{error}</p>
          <button
            type="button"
            onClick={() => load(activeSport)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-red-500 hover:bg-red-400 text-white px-3 py-1.5 rounded-md"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </button>
        </div>
      );
    }
    if (matches.length === 0) {
      return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
          <div className="text-4xl mb-2 opacity-40">🏟️</div>
          <p className="text-sm text-slate-300 mb-3">বর্তমানে কোনো লাইভ ম্যাচ নেই</p>
          <button
            type="button"
            onClick={() => load(activeSport)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-md"
          >
            <RefreshCw className="h-3.5 w-3.5" /> রিফ্রেশ করুন
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-2.5">
        {matches.map((m) => <MatchCard key={m.id} match={m} onBet={goBetSlip} />)}
      </div>
    );
  }, [loading, error, matches, activeSport]);

  return (
    <section className="relative py-8 px-4 bg-[#1B1B2F]">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 30% 0%, rgba(46,125,50,0.4), transparent 60%), radial-gradient(circle at 70% 100%, rgba(255,179,0,0.2), transparent 60%)" }}
      />
      <div className="relative">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-extrabold text-amber-400">লাইভ স্পোর্টস বেটিং</h2>
          <div className="text-xs text-slate-400 mt-0.5">Live Sports Betting</div>
          <div className="h-0.5 w-12 bg-emerald-500 rounded-full mx-auto mt-2" />
          <div className="mt-1 inline-flex items-center gap-2 text-[10px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              প্রতি {POLL_SECONDS}s এ আপডেট
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 disabled:text-slate-500 transition-colors"
              aria-label="Refresh now"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "আপডেট হচ্ছে..." : "এখনই রিফ্রেশ"}
            </button>
          </div>
          <div className="mt-1.5 inline-flex items-center gap-2 text-[10px]">
            {status === "idle" && (
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                সচল · পরবর্তী {countdown}s এ
              </span>
            )}
            {status === "updating" && (
              <span className="inline-flex items-center gap-1 text-amber-400">
                <RefreshCw className="h-3 w-3 animate-spin" />
                আপডেট হচ্ছে...
              </span>
            )}
            {status === "failed" && (
              <span className="inline-flex items-center gap-1 text-red-400">
                <AlertTriangle className="h-3 w-3" />
                ব্যর্থ · {countdown}s পরে পুনরায় চেষ্টা
              </span>
            )}
            {sectionUpdated && (
              <span className="text-slate-500" title={fmtExact(sectionUpdated)}>
                শেষ আপডেট: {fmtLastUpdated(sectionUpdated)} · {fmtExact(sectionUpdated)}
              </span>
            )}
          </div>
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1"
          style={{ scrollbarWidth: "none" }}
        >
          {SPORTS.map((s) => {
            const active = s.key === activeSport;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setActiveSport(s.key)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-emerald-700 text-white"
                    : "bg-white/10 text-white/80 hover:bg-white/15"
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {lastRefreshError && (
          <div className="rounded-xl border border-red-500/50 bg-red-500/15 p-3 mb-3 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-200">ম্যাচ আপডেট ব্যর্থ</p>
                <p className="text-xs text-red-300/80">{lastRefreshError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRefresh()}
              disabled={refreshing}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold bg-red-500 hover:bg-red-400 disabled:bg-red-500/50 text-white px-3 py-1.5 rounded-md transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "চেষ্টা..." : "Try again"}
            </button>
          </div>
        )}

        {content}

        <div className="mt-4 border-t border-white/10 pt-2">
          <button
            type="button"
            onClick={() => setShowDebug((s) => !s)}
            className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Terminal className="h-3 w-3" />
            {showDebug ? "লগ প্যানেল বন্ধ করুন" : "রিট্রাই লগ দেখুন"}
          </button>

          {showDebug && (
            <div data-logs-tick={logsTick} className="mt-2 rounded-lg border border-white/10 bg-black/30 p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-400">Rolling retry logs</span>
                <button
                  type="button"
                  onClick={clearLogs}
                  className="inline-flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                {logsRef.current.length === 0 ? (
                  <p className="text-[10px] text-slate-500">কোনো লগ পাওয়া যায়নি</p>
                ) : (
                  logsRef.current.map((log, i) => (
                    <div
                      key={i}
                      className={`text-[10px] px-2 py-1 rounded flex items-center justify-between gap-2 ${
                        log.event === "error"
                          ? "bg-red-500/10 text-red-300"
                          : log.event === "success"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-white/5 text-slate-300"
                      }`}
                    >
                      <span className="font-mono uppercase tracking-wider">{log.event}</span>
                      <span className="text-slate-500 shrink-0">{new Date(log.t).toLocaleTimeString("bn-BD")}</span>
                      {log.failures != null && <span className="text-slate-400">f:{log.failures}</span>}
                      {log.delaySeconds != null && <span className="text-slate-400">d:{log.delaySeconds}s</span>}
                      {log.message && <span className="truncate text-slate-400 flex-1 text-right">{log.message}</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LiveSportsBettingSection;
