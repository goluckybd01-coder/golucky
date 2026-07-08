import { useState, useEffect } from "react";
import { Bug, ChevronDown, ChevronUp, Zap, Trash2, Eye } from "lucide-react";
import { 
  getK3RoundState, 
  getRemainingSeconds,
  getCurrentRoundKey,
  isK3EngineRunning,
  sweepPendingBets,
  addSettlementListener,
} from "@/lib/k3RoundEngine";
import { loadMyHistory } from "@/lib/gameStorage";
import type { K3Duration } from "@/lib/k3RoundKey";

const DURATIONS: K3Duration[] = [1, 3, 5, 10];

interface DebugState {
  duration: K3Duration;
  roundKey: string;
  remaining: number;
  pendingCount: number;
  roundStartMs: number;
  lastSettled: number;
}

const K3DebugPanel = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [states, setStates] = useState<DebugState[]>([]);
  const [engineRunning, setEngineRunning] = useState(false);
  const [lastSweepResult, setLastSweepResult] = useState<number | null>(null);
  const [settlementTimes, setSettlementTimes] = useState<Record<K3Duration, number>>({ 1: 0, 3: 0, 5: 0, 10: 0 });

  useEffect(() => {
    const unsubscribe = addSettlementListener((duration, roundKey, result, settledAt) => {
      setSettlementTimes((prev) => ({ ...prev, [duration]: settledAt }));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const updateStates = () => {
      setEngineRunning(isK3EngineRunning());
      
      const newStates = DURATIONS.map((duration) => {
        const state = getK3RoundState(duration);
        const roundKey = getCurrentRoundKey(duration);
        const remaining = getRemainingSeconds(duration);
        const roundStartMs = parseInt(roundKey.split(":")[2] || "0", 10);
        const gameType = `${duration}min`;
        const history = loadMyHistory("k3", gameType);
        const pendingCount = history.filter((h: { result: number | null }) => h.result === null).length;
        
        return {
          duration,
          roundKey,
          remaining,
          pendingCount,
          roundStartMs,
          lastSettled: settlementTimes[duration],
        };
      });
      
      setStates(newStates);
    };

    updateStates();
    const interval = setInterval(updateStates, 500);
    return () => clearInterval(interval);
  }, []);

  const handleSweep = () => {
    const resolved = sweepPendingBets();
    setLastSweepResult(resolved);
    setTimeout(() => setLastSweepResult(null), 2000);
  };

  const handleClearHistory = () => {
    const keys = ["k3_1m_myHistory", "k3_3m_myHistory", "k3_5m_myHistory", "k3_10m_myHistory"];
    keys.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem("k3_roundResults");
    localStorage.removeItem("k3_settledRounds");
    setLastSweepResult(-1);
    setTimeout(() => setLastSweepResult(null), 2000);
  };

  const handleClearSeen = () => {
    localStorage.removeItem("K3_SEEN_RESULTS");
    setLastSweepResult(-2);
    setTimeout(() => setLastSweepResult(null), 2000);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, "0")}`;
  };

  const formatTimestamp = (ms: number) => {
    if (!ms) return "--:--:--";
    const d = new Date(ms);
    return d.toLocaleTimeString("en-US", { hour12: false });
  };

  const formatAgo = (ms: number) => {
    if (!ms) return "never";
    const ago = Math.floor((Date.now() - ms) / 1000);
    if (ago < 60) return `${ago}s ago`;
    return `${Math.floor(ago / 60)}m ago`;
  };

  return (
    <div className="fixed bottom-20 left-2 right-2 z-50 bg-black/90 text-green-400 rounded-lg border border-green-500/50 font-mono text-xs overflow-hidden shadow-xl">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-green-900/30 hover:bg-green-900/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4" />
          <span className="font-bold">K3 Engine Debug</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] ${engineRunning ? "bg-green-500/30 text-green-300" : "bg-red-500/30 text-red-300"}`}>
            {engineRunning ? "RUNNING" : "STOPPED"}
          </span>
        </div>
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>

      {isExpanded && (
        <div className="p-2 space-y-1">
          <div className="grid grid-cols-6 gap-1 text-[10px] text-green-300/70 border-b border-green-500/20 pb-1">
            <span>Mode</span>
            <span>Round Key</span>
            <span>Left</span>
            <span>Started</span>
            <span>Settled</span>
            <span>Pend</span>
          </div>
          
          {states.map((s) => (
            <div 
              key={s.duration} 
              className="grid grid-cols-6 gap-1 items-center py-1 border-b border-green-500/10 last:border-0 text-[10px]"
            >
              <span className="font-bold text-yellow-400">{s.duration}m</span>
              <span className="truncate text-[9px]" title={s.roundKey}>
                ...{s.roundKey.split(":").slice(-1)[0].slice(-8)}
              </span>
              <span className={s.remaining <= 10 ? "text-red-400 font-bold animate-pulse" : ""}>
                {formatTime(s.remaining)}
              </span>
              <span className="text-blue-300 text-[9px]">
                {formatTimestamp(s.roundStartMs)}
              </span>
              <span className="text-purple-300 text-[9px]">
                {formatAgo(s.lastSettled)}
              </span>
              <span className={s.pendingCount > 0 ? "text-orange-400 font-bold" : "text-green-300"}>
                {s.pendingCount}
              </span>
            </div>
          ))}
          
          <div className="pt-2 border-t border-green-500/30 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px]">
              <div>
                <span className="text-green-300/70">Total Pending: </span>
                <span className={states.reduce((a, s) => a + s.pendingCount, 0) > 0 ? "text-orange-400 font-bold" : "text-green-300"}>
                  {states.reduce((a, s) => a + s.pendingCount, 0)}
                </span>
              </div>
              {lastSweepResult !== null && lastSweepResult >= 0 && (
                <span className="text-cyan-400 animate-pulse">
                  Swept {lastSweepResult} bets
                </span>
              )}
              {lastSweepResult === -1 && (
                <span className="text-red-400 animate-pulse">
                  History cleared!
                </span>
              )}
              {lastSweepResult === -2 && (
                <span className="text-blue-400 animate-pulse">
                  Seen cleared!
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSweep}
                className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 rounded text-[10px] font-bold transition-colors"
              >
                <Zap className="w-3 h-3" />
                Sweep
              </button>
              <button
                onClick={handleClearSeen}
                className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded text-[10px] font-bold transition-colors"
              >
                <Eye className="w-3 h-3" />
                Seen
              </button>
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded text-[10px] font-bold transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default K3DebugPanel;
