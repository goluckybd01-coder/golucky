import { useState, useEffect, useMemo } from "react";
import { Clock, TrendingUp, TrendingDown, RotateCcw, History, ChevronDown, ChevronUp, Target, Flame, Timer, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isToday, isYesterday, differenceInMinutes, startOfDay } from "date-fns";

interface CrashBet {
  id: string;
  bet_amount: number;
  cashout_multiplier: number | null;
  outcome: string | null;
  win_amount: number;
  placed_at: string;
}

interface SessionData {
  id: string;
  startTime: string;
  endTime: string | null;
  bets: number;
  wins: number;
  losses: number;
  wagered: number;
  won: number;
  profit: number;
  highestWin: number;
  bestMultiplier: number;
}

interface CrashSessionTrackerProps {
  bets: CrashBet[];
  currentBalance: number;
}

type ResetOption = "manual" | "daily" | "hourly" | "session";

const STORAGE_KEY = "crash_session_data";
const HISTORY_KEY = "crash_session_history";

const CrashSessionTracker = ({ bets, currentBalance }: CrashSessionTrackerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [resetOption, setResetOption] = useState<ResetOption>(() => {
    return (localStorage.getItem("crash_session_reset_option") as ResetOption) || "session";
  });
  
  const [sessionStart, setSessionStart] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        return data.startTime || new Date().toISOString();
      } catch {
        return new Date().toISOString();
      }
    }
    return new Date().toISOString();
  });
  
  const [startingBalance, setStartingBalance] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        return data.startingBalance ?? currentBalance;
      } catch {
        return currentBalance;
      }
    }
    return currentBalance;
  });
  
  const [sessionHistory, setSessionHistory] = useState<SessionData[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const sessionStats = useMemo(() => {
    const sessionBets = bets.filter(b => new Date(b.placed_at) >= new Date(sessionStart));
    const completedBets = sessionBets.filter(b => b.outcome);
    const wins = sessionBets.filter(b => b.outcome?.toUpperCase() === "WIN");
    const losses = sessionBets.filter(b => b.outcome?.toUpperCase() === "LOSE");
    
    const totalWagered = sessionBets.reduce((sum, b) => sum + b.bet_amount, 0);
    const totalWon = wins.reduce((sum, b) => sum + (b.win_amount || 0), 0);
    const profit = totalWon - totalWagered;
    
    const highestWin = Math.max(...wins.map(b => b.win_amount || 0), 0);
    const bestMultiplier = Math.max(...wins.map(b => b.cashout_multiplier || 0), 0);
    
    let currentStreak = { type: 'none' as 'win' | 'lose' | 'none', count: 0 };
    for (const bet of completedBets) {
      if (currentStreak.type === 'none') {
        currentStreak = { 
          type: bet.outcome?.toUpperCase() === "WIN" ? 'win' : 'lose', 
          count: 1 
        };
      } else if (
        (currentStreak.type === 'win' && bet.outcome?.toUpperCase() === "WIN") ||
        (currentStreak.type === 'lose' && bet.outcome?.toUpperCase() === "LOSE")
      ) {
        currentStreak.count++;
      } else {
        break;
      }
    }
    
    return {
      bets: sessionBets.length,
      completedBets: completedBets.length,
      wins: wins.length,
      losses: losses.length,
      wagered: totalWagered,
      won: totalWon,
      profit,
      highestWin,
      bestMultiplier,
      winRate: completedBets.length > 0 ? (wins.length / completedBets.length) * 100 : 0,
      currentStreak,
      balanceChange: currentBalance - startingBalance,
    };
  }, [bets, sessionStart, currentBalance, startingBalance]);

  useEffect(() => {
    const data = { startTime: sessionStart, startingBalance };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [sessionStart, startingBalance]);

  useEffect(() => {
    localStorage.setItem("crash_session_reset_option", resetOption);
  }, [resetOption]);

  useEffect(() => {
    const checkAutoReset = () => {
      const now = new Date();
      const start = new Date(sessionStart);
      if (resetOption === "daily" && !isToday(start)) {
        handleResetSession(true);
      } else if (resetOption === "hourly" && differenceInMinutes(now, start) >= 60) {
        handleResetSession(true);
      }
    };
    checkAutoReset();
    const interval = setInterval(checkAutoReset, 60000);
    return () => clearInterval(interval);
  }, [resetOption, sessionStart]);

  const saveToHistory = () => {
    if (sessionStats.bets === 0) return;
    const session: SessionData = {
      id: `session-${Date.now()}`,
      startTime: sessionStart,
      endTime: new Date().toISOString(),
      bets: sessionStats.bets,
      wins: sessionStats.wins,
      losses: sessionStats.losses,
      wagered: sessionStats.wagered,
      won: sessionStats.won,
      profit: sessionStats.profit,
      highestWin: sessionStats.highestWin,
      bestMultiplier: sessionStats.bestMultiplier,
    };
    const updatedHistory = [session, ...sessionHistory].slice(0, 50);
    setSessionHistory(updatedHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  };

  const handleResetSession = (auto = false) => {
    if (!auto && sessionStats.bets > 0) saveToHistory();
    setSessionStart(new Date().toISOString());
    setStartingBalance(currentBalance);
  };

  const formatDuration = (start: string, end?: string | null) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const mins = differenceInMinutes(endDate, startDate);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours < 24) return `${hours}h ${remainingMins}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  const formatSessionDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return `Today ${format(date, "h:mm a")}`;
    if (isYesterday(date)) return `Yesterday ${format(date, "h:mm a")}`;
    return format(date, "MMM d, h:mm a");
  };

  return (
    <>
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-slate-700 hover:from-purple-500/30 hover:to-pink-500/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Timer className="text-purple-400" size={18} />
            <span className="text-white font-bold">Session Tracker</span>
            <Badge className={`text-xs ${sessionStats.profit >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {sessionStats.profit >= 0 ? '+' : ''}৳{sessionStats.profit.toFixed(0)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">{formatDuration(sessionStart)}</span>
            {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </div>
        </button>

        <div className="grid grid-cols-4 gap-2 p-3 border-b border-slate-700/50">
          <div className="text-center">
            <p className="text-slate-500 text-xs font-medium">Bets</p>
            <p className="text-white text-lg font-bold">{sessionStats.bets}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-xs font-medium">Win Rate</p>
            <p className={`text-lg font-bold ${sessionStats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
              {sessionStats.winRate.toFixed(0)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-xs font-medium">Session P/L</p>
            <p className={`text-lg font-bold ${sessionStats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {sessionStats.profit >= 0 ? '+' : ''}৳{sessionStats.profit.toFixed(0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-xs font-medium">Streak</p>
            <p className={`text-lg font-bold flex items-center justify-center gap-1 ${
              sessionStats.currentStreak.type === 'win' ? 'text-green-400' : 
              sessionStats.currentStreak.type === 'lose' ? 'text-red-400' : 'text-slate-400'
            }`}>
              {sessionStats.currentStreak.count}
              {sessionStats.currentStreak.type === 'win' && <Flame size={14} />}
            </p>
          </div>
        </div>

        {isExpanded && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <Clock size={12} /> Session Started
                </div>
                <p className="text-white font-medium text-sm">{formatSessionDate(sessionStart)}</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                  <Timer size={12} /> Duration
                </div>
                <p className="text-white font-medium text-sm">{formatDuration(sessionStart)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-700/30 rounded-lg p-2 text-center">
                <p className="text-slate-500 text-xs">Wagered</p>
                <p className="text-white font-bold">৳{sessionStats.wagered.toLocaleString()}</p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-2 text-center">
                <p className="text-slate-500 text-xs">Won</p>
                <p className="text-green-400 font-bold">৳{sessionStats.won.toLocaleString()}</p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-2 text-center">
                <p className="text-slate-500 text-xs">Best Win</p>
                <p className="text-amber-400 font-bold">৳{sessionStats.highestWin.toLocaleString()}</p>
              </div>
            </div>

            <div className={`rounded-lg p-3 ${
              sessionStats.balanceChange >= 0 
                ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20' 
                : 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {sessionStats.balanceChange >= 0 ? (
                    <TrendingUp className="text-green-400" size={18} />
                  ) : (
                    <TrendingDown className="text-red-400" size={18} />
                  )}
                  <span className="text-slate-300 text-sm">Balance Change</span>
                </div>
                <span className={`text-xl font-bold ${sessionStats.balanceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {sessionStats.balanceChange >= 0 ? '+' : ''}৳{sessionStats.balanceChange.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Started: ৳{startingBalance.toLocaleString()}</span>
                <span>Current: ৳{currentBalance.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={resetOption} onValueChange={(v) => setResetOption(v as ResetOption)}>
                <SelectTrigger className="flex-1 bg-slate-700 border-slate-600 text-white h-9">
                  <SelectValue placeholder="Reset option" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="manual" className="text-white hover:bg-slate-700">
                    <div className="flex items-center gap-2"><RotateCcw size={14} /> Manual Reset</div>
                  </SelectItem>
                  <SelectItem value="session" className="text-white hover:bg-slate-700">
                    <div className="flex items-center gap-2"><Timer size={14} /> Reset on Page Reload</div>
                  </SelectItem>
                  <SelectItem value="hourly" className="text-white hover:bg-slate-700">
                    <div className="flex items-center gap-2"><Clock size={14} /> Hourly Auto-Reset</div>
                  </SelectItem>
                  <SelectItem value="daily" className="text-white hover:bg-slate-700">
                    <div className="flex items-center gap-2"><Calendar size={14} /> Daily Auto-Reset</div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => setShowHistory(true)} className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 h-9">
                <History size={14} className="mr-1" /> History
              </Button>
              <Button size="sm" onClick={() => handleResetSession()} className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 h-9">
                <RotateCcw size={14} className="mr-1" /> Reset
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="text-purple-400" /> Session History
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-80 pr-4">
            {sessionHistory.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <History size={32} className="mx-auto mb-2 opacity-50" />
                <p>No session history yet</p>
                <p className="text-sm">Complete sessions will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessionHistory.map((session) => (
                  <div key={session.id} className="bg-slate-700/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm">{formatSessionDate(session.startTime)}</span>
                      <Badge className={`text-xs ${session.profit >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {session.profit >= 0 ? '+' : ''}৳{session.profit.toFixed(0)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div><p className="text-slate-500">Bets</p><p className="text-white font-medium">{session.bets}</p></div>
                      <div><p className="text-slate-500">W/L</p><p className="text-white font-medium"><span className="text-green-400">{session.wins}</span>/<span className="text-red-400">{session.losses}</span></p></div>
                      <div><p className="text-slate-500">Wagered</p><p className="text-white font-medium">৳{session.wagered.toLocaleString()}</p></div>
                      <div><p className="text-slate-500">Duration</p><p className="text-white font-medium">{formatDuration(session.startTime, session.endTime)}</p></div>
                    </div>
                    {(session.highestWin > 0 || session.bestMultiplier > 0) && (
                      <div className="flex items-center gap-3 pt-1 border-t border-slate-600/50 text-xs">
                        {session.highestWin > 0 && <span className="text-amber-400">Best: ৳{session.highestWin.toLocaleString()}</span>}
                        {session.bestMultiplier > 0 && <span className="text-cyan-400">{session.bestMultiplier.toFixed(2)}x</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          {sessionHistory.length > 0 && (
            <div className="pt-2 border-t border-slate-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total Sessions: {sessionHistory.length}</span>
                <span className={`font-bold ${sessionHistory.reduce((sum, s) => sum + s.profit, 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  All-time: {sessionHistory.reduce((sum, s) => sum + s.profit, 0) >= 0 ? '+' : ''}
                  ৳{sessionHistory.reduce((sum, s) => sum + s.profit, 0).toFixed(0)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CrashSessionTracker;
