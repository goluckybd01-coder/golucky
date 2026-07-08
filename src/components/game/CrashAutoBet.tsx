import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  RefreshCw, 
  Play, 
  Square, 
  Info,
  Zap,
  Shield
} from "lucide-react";
import { toast } from "sonner";

export type BetStrategy = "flat" | "martingale" | "reverse-martingale" | "fibonacci" | "dalembert";

export interface AutoBetSettings {
  enabled: boolean;
  baseBet: number;
  autoCashout: number;
  stopLoss: number;
  takeProfit: number;
  maxRounds: number;
  strategy: BetStrategy;
  onWinAction: "reset" | "increase" | "decrease";
  onLossAction: "reset" | "increase" | "decrease";
  increasePercent: number;
  decreasePercent: number;
}

export interface AutoBetStats {
  roundsPlayed: number;
  wins: number;
  losses: number;
  totalProfit: number;
  currentStreak: number;
  streakType: "win" | "loss" | "none";
}

interface CrashAutoBetProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  settings: AutoBetSettings;
  onSettingsChange: (settings: AutoBetSettings) => void;
  stats: AutoBetStats;
  onReset: () => void;
  currentBet: number;
  balance: number;
  phase: string;
  hasBet: boolean;
}

const STRATEGY_INFO: Record<BetStrategy, { name: string; description: string }> = {
  flat: { 
    name: "Flat Betting", 
    description: "Same bet amount every round" 
  },
  martingale: { 
    name: "Martingale", 
    description: "Double bet after loss, reset after win" 
  },
  "reverse-martingale": { 
    name: "Reverse Martingale", 
    description: "Double bet after win, reset after loss" 
  },
  fibonacci: { 
    name: "Fibonacci", 
    description: "Follow Fibonacci sequence on losses" 
  },
  dalembert: { 
    name: "D'Alembert", 
    description: "Increase by 1 unit after loss, decrease after win" 
  },
};

export default function CrashAutoBet({
  isEnabled,
  onToggle,
  settings,
  onSettingsChange,
  stats,
  onReset,
  currentBet,
  balance,
  phase,
  hasBet,
}: CrashAutoBetProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateSetting = <K extends keyof AutoBetSettings>(key: K, value: AutoBetSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const canStart = !isEnabled && phase === "betting" && !hasBet && balance >= settings.baseBet;
  const canStop = isEnabled;

  const handleToggle = () => {
    if (!isEnabled) {
      if (settings.baseBet < 10) {
        toast.error("Minimum base bet is ৳10");
        return;
      }
      if (settings.autoCashout < 1.01) {
        toast.error("Minimum auto-cashout is 1.01x");
        return;
      }
      if (settings.baseBet > balance) {
        toast.error("Insufficient balance for base bet");
        return;
      }
      toast.success("Auto-bet started!");
    } else {
      toast.info("Auto-bet stopped");
    }
    onToggle(!isEnabled);
  };

  const winRate = stats.roundsPlayed > 0 
    ? ((stats.wins / stats.roundsPlayed) * 100).toFixed(1) 
    : "0.0";

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
        <div className="flex items-center gap-2">
          <Bot className={`w-5 h-5 ${isEnabled ? 'text-green-400 animate-pulse' : 'text-slate-400'}`} />
          <span className="font-bold text-white">Auto-Bet</span>
          {isEnabled && (
            <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs animate-pulse">
              ACTIVE
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleToggle}
          disabled={!canStart && !canStop}
          className={`${
            isEnabled 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600'
          } text-white font-bold px-4`}
        >
          {isEnabled ? (
            <>
              <Square className="w-4 h-4 mr-1" /> Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-1" /> Start
            </>
          )}
        </Button>
      </div>

      {(isEnabled || stats.roundsPlayed > 0) && (
        <div className="grid grid-cols-4 gap-2 p-3 bg-slate-900/50 border-b border-slate-700">
          <div className="text-center">
            <div className="text-xs text-slate-400">Rounds</div>
            <div className="text-sm font-bold text-white">{stats.roundsPlayed}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Win Rate</div>
            <div className="text-sm font-bold text-cyan-400">{winRate}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Streak</div>
            <div className={`text-sm font-bold ${
              stats.streakType === 'win' ? 'text-green-400' : 
              stats.streakType === 'loss' ? 'text-red-400' : 'text-slate-400'
            }`}>
              {stats.currentStreak > 0 ? `${stats.currentStreak}${stats.streakType === 'win' ? 'W' : 'L'}` : '-'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Profit</div>
            <div className={`text-sm font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.totalProfit >= 0 ? '+' : ''}৳{stats.totalProfit.toFixed(0)}
            </div>
          </div>
        </div>
      )}

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Base Bet (৳)</label>
            <Input
              type="number"
              value={settings.baseBet}
              onChange={(e) => updateSetting("baseBet", Number(e.target.value))}
              disabled={isEnabled}
              className="bg-slate-700 border-slate-600 text-white h-9"
              min={10}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Auto Cashout (x)</label>
            <Input
              type="number"
              value={settings.autoCashout}
              onChange={(e) => updateSetting("autoCashout", Number(e.target.value))}
              disabled={isEnabled}
              className="bg-slate-700 border-slate-600 text-white h-9"
              min={1.01}
              step={0.01}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-red-400" />
              Stop Loss (৳)
            </label>
            <Input
              type="number"
              value={settings.stopLoss}
              onChange={(e) => updateSetting("stopLoss", Number(e.target.value))}
              disabled={isEnabled}
              className="bg-slate-700 border-slate-600 text-white h-9"
              min={0}
              placeholder="0 = disabled"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-400" />
              Take Profit (৳)
            </label>
            <Input
              type="number"
              value={settings.takeProfit}
              onChange={(e) => updateSetting("takeProfit", Number(e.target.value))}
              disabled={isEnabled}
              className="bg-slate-700 border-slate-600 text-white h-9"
              min={0}
              placeholder="0 = disabled"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <Target className="w-3 h-3" />
            Max Rounds (0 = unlimited)
          </label>
          <Input
            type="number"
            value={settings.maxRounds}
            onChange={(e) => updateSetting("maxRounds", Number(e.target.value))}
            disabled={isEnabled}
            className="bg-slate-700 border-slate-600 text-white h-9"
            min={0}
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" />
            Bet Strategy
          </label>
          <Select
            value={settings.strategy}
            onValueChange={(value: BetStrategy) => updateSetting("strategy", value)}
            disabled={isEnabled}
          >
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {Object.entries(STRATEGY_INFO).map(([key, info]) => (
                <SelectItem key={key} value={key} className="text-white hover:bg-slate-700">
                  <div className="flex flex-col">
                    <span>{info.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500 mt-1">
            {STRATEGY_INFO[settings.strategy].description}
          </p>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
        >
          <Info className="w-3 h-3" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </button>

        {showAdvanced && settings.strategy === "flat" && (
          <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">On Win</label>
                <Select
                  value={settings.onWinAction}
                  onValueChange={(value: "reset" | "increase" | "decrease") => updateSetting("onWinAction", value)}
                  disabled={isEnabled}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="reset" className="text-white text-xs">Reset to Base</SelectItem>
                    <SelectItem value="increase" className="text-white text-xs">Increase Bet</SelectItem>
                    <SelectItem value="decrease" className="text-white text-xs">Decrease Bet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">On Loss</label>
                <Select
                  value={settings.onLossAction}
                  onValueChange={(value: "reset" | "increase" | "decrease") => updateSetting("onLossAction", value)}
                  disabled={isEnabled}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="reset" className="text-white text-xs">Reset to Base</SelectItem>
                    <SelectItem value="increase" className="text-white text-xs">Increase Bet</SelectItem>
                    <SelectItem value="decrease" className="text-white text-xs">Decrease Bet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {(settings.onWinAction !== "reset" || settings.onLossAction !== "reset") && (
              <div className="grid grid-cols-2 gap-3">
                {settings.onWinAction === "increase" || settings.onLossAction === "increase" ? (
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Increase %</label>
                    <Input
                      type="number"
                      value={settings.increasePercent}
                      onChange={(e) => updateSetting("increasePercent", Number(e.target.value))}
                      disabled={isEnabled}
                      className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                      min={1}
                      max={500}
                    />
                  </div>
                ) : null}
                {settings.onWinAction === "decrease" || settings.onLossAction === "decrease" ? (
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Decrease %</label>
                    <Input
                      type="number"
                      value={settings.decreasePercent}
                      onChange={(e) => updateSetting("decreasePercent", Number(e.target.value))}
                      disabled={isEnabled}
                      className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                      min={1}
                      max={99}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {isEnabled && (
          <div className="flex items-center justify-between p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
            <span className="text-xs text-slate-400">Next Bet Amount:</span>
            <span className="text-sm font-bold text-purple-400">৳{currentBet.toFixed(0)}</span>
          </div>
        )}

        {stats.roundsPlayed > 0 && !isEnabled && (
          <Button
            size="sm"
            variant="outline"
            onClick={onReset}
            className="w-full bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Stats
          </Button>
        )}

        <div className="flex items-start gap-2 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
          <Shield className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-200/80">
            Auto-bet can result in rapid losses. Set stop-loss limits and play responsibly.
          </p>
        </div>
      </div>
    </div>
  );
}

export function calculateNextBet(
  settings: AutoBetSettings,
  stats: AutoBetStats,
  lastOutcome: "win" | "loss" | null,
  fibonacciSequence: number[]
): number {
  const { baseBet, strategy, onWinAction, onLossAction, increasePercent, decreasePercent } = settings;
  
  if (!lastOutcome) return baseBet;
  
  switch (strategy) {
    case "flat": {
      const action = lastOutcome === "win" ? onWinAction : onLossAction;
      if (action === "reset") return baseBet;
      if (action === "increase") return Math.ceil(baseBet * (1 + increasePercent / 100));
      if (action === "decrease") return Math.max(10, Math.floor(baseBet * (1 - decreasePercent / 100)));
      return baseBet;
    }
    case "martingale": {
      if (lastOutcome === "win") return baseBet;
      return baseBet * Math.pow(2, stats.currentStreak);
    }
    case "reverse-martingale": {
      if (lastOutcome === "loss") return baseBet;
      return baseBet * Math.pow(2, stats.currentStreak);
    }
    case "fibonacci": {
      if (lastOutcome === "win") return baseBet;
      const fibIndex = Math.min(stats.currentStreak, fibonacciSequence.length - 1);
      return baseBet * fibonacciSequence[fibIndex];
    }
    case "dalembert": {
      const unit = baseBet;
      if (lastOutcome === "win") {
        return Math.max(baseBet, baseBet + (stats.currentStreak - 1) * unit - unit);
      } else {
        return baseBet + stats.currentStreak * unit;
      }
    }
    default:
      return baseBet;
  }
}

export const defaultAutoBetSettings: AutoBetSettings = {
  enabled: false,
  baseBet: 100,
  autoCashout: 2.0,
  stopLoss: 500,
  takeProfit: 500,
  maxRounds: 0,
  strategy: "flat",
  onWinAction: "reset",
  onLossAction: "reset",
  increasePercent: 50,
  decreasePercent: 25,
};

export const defaultAutoBetStats: AutoBetStats = {
  roundsPlayed: 0,
  wins: 0,
  losses: 0,
  totalProfit: 0,
  currentStreak: 0,
  streakType: "none",
};
