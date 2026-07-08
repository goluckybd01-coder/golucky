import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import PageScaffold from "@/components/templates/PageScaffold";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Clock, Trash2, RefreshCw, Download, Share2, Sparkles, Loader2 } from "lucide-react";
import VolumeControl from "@/components/game/VolumeControl";
import { useGameSounds } from "@/hooks/useGameSounds";
import { useWalletDB } from "@/hooks/useWalletDB";
import { useGameBets } from "@/hooks/useGameBets";
import { useAIPrediction } from "@/hooks/useAIPrediction";
import { toast } from "sonner";
import { formatTaka } from "@/lib/currency";
import GameMessageBar from "@/components/game/GameMessageBar";
import HowToPlayModal from "@/components/game/HowToPlayModal";
import BetPlacedAnimation from "@/components/BetPlacedAnimation";
import Confetti from "@/components/Confetti";
import BetSheet from "@/components/game/BetSheet";
import CountdownOverlay from "@/components/game/CountdownOverlay";
import { fiveDHowToPlay } from "@/content/fiveDHowToPlay";
import BetHistoryFilters, { filterAndSortBetHistory, type FilterStatus, type SortOption, type DateRange } from "@/components/game/BetHistoryFilters";
import BetHistoryChart from "@/components/game/BetHistoryChart";
import ClearPendingButton from "@/components/game/ClearPendingButton";
import HistoryPagination from "@/components/game/HistoryPagination";
import { CopyablePeriod } from "@/components/game/CopyablePeriod";
import { BetDetailsModal, type BetDetails } from "@/components/game/BetDetailsModal";
import { saveGameHistory, loadMyHistory, type BetHistoryItem } from "@/lib/gameStorage";
import { supabase } from "@/integrations/supabase/client";
import LiveBetsFeed from "@/components/game/LiveBetsFeed";
import Leaderboard from "@/components/game/Leaderboard";
import FiveDSlotMachine from "@/components/game/FiveDSlotMachine";
import { generateDigitStats, analyzeTrend, generatePredictionTips, type TrendAnalysis, type PredictionTip } from "@/lib/fiveDChartStats";
import { exportChartHistory, exportBetHistory } from "@/lib/csvExport";
import { AIPredictionHistory } from "@/components/game/AIPredictionHistory";
import { autoVerifyPredictions } from "@/lib/autoVerifyPredictions";
import { settleBetsDB } from "@/lib/gameHistoryService";
import { FirstDepositBonusBanner } from "@/components/FirstDepositBonusBanner";
import { getAdminSetResult, parse5DResult } from "@/lib/adminResultService";
import {
  start5DEngine,
  stop5DEngine,
  getCurrentRoundKey,
  getRemainingSeconds,
  extractTradeIdFromRoundKey,
  getPeriodFromRoundKey,
  getDurationFromGameType,
  type FiveDDuration,
  type FiveDRoundResult,
  type FiveDEngineCallbacks,
} from "@/lib/fiveDRoundEngine";
import type { DurationState } from "@/lib/gameEngineBase";

const GAME_NAME = "fiveD" as const;
const gameTypes = [
  { id: "1min", label: "5D", sublabel: "1Min", duration: 60 },
  { id: "3min", label: "5D", sublabel: "3Min", duration: 180 },
  { id: "5min", label: "5D", sublabel: "5Min", duration: 300 },
  { id: "10min", label: "5D", sublabel: "10Min", duration: 600 },
];

type BettingTab = "A" | "B" | "C" | "D" | "E" | "SUM";
type RoundState = "PLAYING" | "COUNTDOWN_LOCK" | "REVEAL" | "RESETTING";

// FiveD-specific bet history item with array result
interface FiveDBetHistoryItem {
  period: string;
  betType: string;
  betAmount: number;
  multiplier?: number;
  potentialWin?: number;
  fee?: number;
  netAmount?: number;
  result: number[] | null;
  isWin: boolean | null;
  payout: number;
  timestamp: Date;
  duration?: number;
  roundKey?: string;
}

interface ModeState {
  roundKey: string;
  history: any[];
  myHistory: FiveDBetHistoryItem[];
  currentDigits?: number[];
}

// Generate unique period for 5D game modes
const generate5DPeriod = (gameType: string, timestamp: number): string => {
  const duration = getDurationFromGameType(gameType);
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  // Mode codes: 1min=A, 3min=B, 5min=C, 10min=D
  const modeCode = { 1: "A", 3: "B", 5: "C", 10: "D" }[duration] || "A";
  
  // Calculate daily serial
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const durationMs = duration * 60 * 1000;
  const dailySerial = Math.floor((timestamp - dayStart) / durationMs) + 1;
  
  return `5D-${year}${month}${day}-${modeCode}-${String(dailySerial).padStart(4, "0")}`;
};

// Generate initial game history
const generateInitialHistory = (gameType: string): any[] => {
  const stored = localStorage.getItem(`fiveD_${gameType === "1min" ? "1m" : gameType === "3min" ? "3m" : gameType === "5min" ? "5m" : "10m"}_history`);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  
  // Generate fresh history with mode-specific periods
  const duration = getDurationFromGameType(gameType);
  const durationMs = duration * 60 * 1000;
  const now = Date.now();
  
  const history = [];
  for (let i = 0; i < 10; i++) {
    const roundTime = now - (i * durationMs);
    const digits = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10));
    const sum = digits.reduce((a, b) => a + b, 0);
    history.push({
      period: generate5DPeriod(gameType, roundTime),
      digits,
      sum,
      bigSmall: sum >= 23 ? "Big" : "Small",
      oddEven: sum % 2 === 0 ? "Even" : "Odd",
    });
  }
  return history;
};

const FiveD = () => {
  const navigate = useNavigate();
  const [selectedGameType, setSelectedGameType] = useState("1min");
  const [activeTab, setActiveTab] = useState<"history" | "chart" | "myHistory" | "liveBets" | "leaderboard">("history");
  const [bettingTab, setBettingTab] = useState<BettingTab>("A");
  const [chartDigitTab, setChartDigitTab] = useState<"A" | "B" | "C" | "D" | "E" | "SUM">("A");
  
  // Mode states for all durations
  const [modeStates, setModeStates] = useState<Record<string, ModeState>>(() => {
    const states: Record<string, ModeState> = {};
    gameTypes.forEach((game) => {
      const duration = getDurationFromGameType(game.id);
      states[game.id] = {
        roundKey: getCurrentRoundKey(duration),
        history: generateInitialHistory(game.id),
        myHistory: loadMyHistory(GAME_NAME, game.id),
        currentDigits: [0, 0, 0, 0, 0],
      };
    });
    return states;
  });
  
  const [roundState, setRoundState] = useState<RoundState>("PLAYING");
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [countdownDigits, setCountdownDigits] = useState({ d1: 0, d2: 0 });
  const [currentDigits, setCurrentDigits] = useState<number[]>([0, 0, 0, 0, 0]);
  const [isRolling, setIsRolling] = useState(false);
  
  // Betting states
  const [showBetSheet, setShowBetSheet] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [betType, setBetType] = useState<"big" | "small" | "odd" | "even" | "number" | "range">("big");
  const [betRange, setBetRange] = useState<string>("0-9");
  const [betDigit, setBetDigit] = useState<BettingTab>("A");
  const [betNumber, setBetNumber] = useState<number>(0);
  const [betAmount, setBetAmount] = useState(1);
  const [betMultiplier, setBetMultiplier] = useState("X1");
  const [agreedToRules, setAgreedToRules] = useState(true);
  const [gameHistoryPage, setGameHistoryPage] = useState(1);
  const [chartPage, setChartPage] = useState(1);
  
  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("game_sound_enabled");
    return saved !== null ? saved === "true" : true;
  });
  const [soundVolume, setSoundVolume] = useState(() => {
    const saved = localStorage.getItem("game_sound_volume");
    return saved !== null ? parseFloat(saved) : 0.7;
  });
  
  // Bet animation
  const [showBetAnimation, setShowBetAnimation] = useState(false);
  const [betAnimationData, setBetAnimationData] = useState<{
    betAmount: number;
    betType: string;
    potentialWin: number;
  } | null>(null);
  
  // My History filters
  const [historyFilter, setHistoryFilter] = useState<FilterStatus>("all");
  const [historySort, setHistorySort] = useState<SortOption>("newest");
  const [historyDateRange, setHistoryDateRange] = useState<DateRange>("all");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [showAllModes, setShowAllModes] = useState(false);
  const [myHistoryPage, setMyHistoryPage] = useState(1);
  
  // Bet details modal state
  const [showBetDetailsModal, setShowBetDetailsModal] = useState(false);
  const [selectedBetDetails, setSelectedBetDetails] = useState<BetDetails | null>(null);
  
  // Reset dialog
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetInProgress, setResetInProgress] = useState(false);
  
  // Win confetti
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiIntensity, setConfettiIntensity] = useState<"small" | "medium" | "big">("medium");
  
  // Big win modal
  const [showBigWinModal, setShowBigWinModal] = useState(false);
  const [bigWinAmount, setBigWinAmount] = useState(0);
  
  // Refs
  const lastCountdownBeepRef = useRef<number | null>(null);
  const didEndRef = useRef(false);
  const rollingIntervalRef = useRef<number | null>(null);
  
  // Sounds & wallet & AI
  const { playTick, playWarningTick, playCountdownBeep, playBetPlaced, playRoundEnd, playSlotSpinStart, playSlotTick, playSlotReelStop, playSlotSpinComplete, playBigWin, playMediumWin, playSmallWin } = useGameSounds(soundEnabled);
  const { formattedBalance, placeBet: placeBetWallet, canAfford, isAuthenticated, refreshBalance } = useWalletDB();
  const { bets: dbBets, placeBet: placeBetDB, refresh: refreshBets, isLoading: isBetsLoading } = useGameBets("fiveD");
  const { isLoading: isAILoading, predictions: aiPredictions, overallInsight: aiInsight, fetchPredictions, clearPredictions } = useAIPrediction();
  
  // Derived values
  const currentDuration = getDurationFromGameType(selectedGameType);
  const currentModeState = modeStates[selectedGameType];
  const currentRoundKey = currentModeState?.roundKey || getCurrentRoundKey(currentDuration);
  const currentTradeId = extractTradeIdFromRoundKey(currentRoundKey);
  const currentPeriodNumber = getPeriodFromRoundKey(currentRoundKey, currentDuration);
  const gameHistory = currentModeState?.history || [];
  const currentGame = gameTypes.find((g) => g.id === selectedGameType) || gameTypes[0];
  
  // Transform database bets to UI format - filter by selected mode or show all
  const myBetHistory: FiveDBetHistoryItem[] = useMemo(() => {
    return dbBets
      .filter(bet => showAllModes || bet.game_mode === selectedGameType)
      .map(bet => ({
        period: bet.trade_id,
        betType: `${bet.bet_type}: ${bet.bet_value}`,
        betAmount: bet.bet_amount,
        multiplier: bet.multiplier,
        potentialWin: bet.potential_win,
        isWin: bet.status === "won" ? true : bet.status === "lost" ? false : null,
        result: bet.result ? bet.result.split(",").map(Number) : null,
        payout: bet.payout || 0,
        timestamp: new Date(bet.created_at),
        fee: bet.bet_amount * 0.02,
        netAmount: bet.bet_amount * 0.98,
        duration: bet.game_mode === "1min" ? 1 : bet.game_mode === "3min" ? 3 : bet.game_mode === "5min" ? 5 : 10,
        roundKey: bet.trade_id,
      }));
  }, [dbBets, selectedGameType, showAllModes]);
  
  // Active history based on view mode (cast to any for component compatibility)
  const activeHistory = myBetHistory as any[];
  
  // Last result
  const lastResult = gameHistory[0];
  const lastDigits = lastResult?.digits || [0, 0, 0, 0, 0];
  const lastSum = lastResult?.sum || 0;
  
  // Helper to update mode state
  const updateModeState = useCallback((modeId: string, updates: Partial<ModeState>) => {
    setModeStates(prev => ({
      ...prev,
      [modeId]: { ...prev[modeId], ...updates },
    }));
  }, []);
  
  // Format time
  const formatTime = useCallback((s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return { m1: Math.floor(mins / 10), m2: mins % 10, s1: Math.floor(secs / 10), s2: secs % 10 };
  }, []);
  const time = formatTime(timeRemaining);
  
  // Handle round end (result reveal)
  const handleRoundEnd = useCallback((roundKey: string, result: FiveDRoundResult) => {
    if (didEndRef.current) return;
    didEndRef.current = true;
    
    if (soundEnabled) playRoundEnd();
    setRoundState("REVEAL");
    setIsRolling(true);
    
    // Rolling animation
    rollingIntervalRef.current = window.setInterval(() => {
      setCurrentDigits(Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)));
    }, 80);
    
    // Stop rolling after 1.5s and show final result
    setTimeout(() => {
      if (rollingIntervalRef.current) {
        window.clearInterval(rollingIntervalRef.current);
        rollingIntervalRef.current = null;
      }
      
      setCurrentDigits(result.digits);
      setIsRolling(false);
      
      // Update game history
      const newHistoryItem = {
        period: result.tradeId,
        digits: result.digits,
        sum: result.sum,
        bigSmall: result.bigSmall,
        oddEven: result.oddEven,
      };
      
      const currentHistory = modeStates[selectedGameType]?.history || [];
      const updatedHistory = [newHistoryItem, ...currentHistory.slice(0, 99)];
      updateModeState(selectedGameType, {
        history: updatedHistory,
        currentDigits: result.digits,
      });
      saveGameHistory(GAME_NAME, selectedGameType, updatedHistory);
      
      // Reload my history and check for wins/losses
      const reloadedMyHistory = loadMyHistory(GAME_NAME, selectedGameType);
      updateModeState(selectedGameType, { myHistory: reloadedMyHistory });
      
      // Check settled bets and show win/lose toasts
      const settledBets = reloadedMyHistory.filter(
        (bet) => bet.period === result.tradeId && bet.isWin !== null
      );
      
      if (settledBets.length > 0) {
        const wins = settledBets.filter((b) => b.isWin === true);
        const losses = settledBets.filter((b) => b.isWin === false);
        const totalWinAmount = wins.reduce((sum, b) => sum + (b.payout || 0), 0);
        const totalLossAmount = losses.reduce((sum, b) => sum + (b.betAmount || 0), 0);
        
        if (wins.length > 0) {
          // Show confetti animation
          const intensity = totalWinAmount >= 500 ? "big" : totalWinAmount >= 100 ? "medium" : "small";
          setConfettiIntensity(intensity);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3500);
          
          // Play win sound based on amount
          if (soundEnabled) {
            if (totalWinAmount >= 1000) {
              playBigWin();
            } else if (totalWinAmount >= 100) {
              playMediumWin();
            } else {
              playSmallWin();
            }
          }
          
          // Show big win modal for ৳1000+ wins (auto-close after 5s)
          if (totalWinAmount >= 1000) {
            setBigWinAmount(totalWinAmount);
            setShowBigWinModal(true);
            setTimeout(() => setShowBigWinModal(false), 5000);
          } else {
            toast.success(`🎉 অভিনন্দন! আপনি জিতেছেন!`, {
              description: `${wins.length}টি বেট জিতেছে | মোট জয় ৳${totalWinAmount.toFixed(2)}`,
              duration: 5000,
            });
          }
        }
        
        if (losses.length > 0 && wins.length === 0) {
          toast.error(`😔 দুর্ভাগ্য! আপনি হেরেছেন`, {
            description: `${losses.length}টি বেট হেরেছে | মোট হার ৳${totalLossAmount.toFixed(2)}`,
            duration: 4000,
          });
        } else if (losses.length > 0 && wins.length > 0) {
          toast(`📊 মিশ্র ফলাফল`, {
            description: `${wins.length}টি জয় (৳${totalWinAmount.toFixed(2)}) | ${losses.length}টি হার (৳${totalLossAmount.toFixed(2)})`,
            duration: 4000,
          });
        }
      }
      
      // Call settlement edge function with admin result check
      (async () => {
        try {
          // Check for admin-set result first
          const adminResult = await getAdminSetResult('fiveD', selectedGameType, result.tradeId);
          let finalDigits = result.digits;
          
          if (adminResult && adminResult.result) {
            const parsedAdmin = parse5DResult(adminResult.result);
            if (parsedAdmin !== null) {
              finalDigits = parsedAdmin;
              console.log(`[5D] Using ADMIN-SET result: ${finalDigits.join(',')} for ${result.tradeId}`);
            }
          }
          
          const settleResult = await settleBetsDB(
            result.tradeId,
            "fiveD",
            selectedGameType,
            finalDigits.join(",")
          );
          
          if (settleResult.success && settleResult.settledCount > 0) {
            console.log(`5D Settled ${settleResult.settledCount} bets, payouts: ${settleResult.totalPayouts}`);
          }
          refreshBalance();
          refreshBets();
          
          const verified = await autoVerifyPredictions("5D", finalDigits);
          if (verified.verified > 0) {
            console.log(`[5D] Auto-verified ${verified.verified} AI prediction(s)`);
          }
        } catch (err) {
          console.error("5D Settlement error:", err);
        }
      })();
      
      // Transition to next round
      setTimeout(() => {
        setRoundState("RESETTING");
        setTimeout(() => {
          didEndRef.current = false;
          setRoundState("PLAYING");
        }, 300);
      }, 2000);
    }, 1500);
  }, [soundEnabled, playRoundEnd, selectedGameType, modeStates, updateModeState, refreshBalance]);
  
  // ============= 5D ENGINE SUBSCRIPTION =============
  useEffect(() => {
    const callbacks: FiveDEngineCallbacks = {
      onTick: (states) => {
        const state = states[currentDuration];
        // CRITICAL: Always update timer, regardless of roundState (except during REVEAL/RESETTING)
        if (state && roundState !== "REVEAL" && roundState !== "RESETTING") {
          const remaining = Math.ceil(state.remainingMs / 1000);
          setTimeRemaining(remaining);
          setCountdownDigits({ d1: Math.floor(remaining / 10), d2: remaining % 10 });
          
          // Update roundKey if changed (new round started)
          if (state.roundKey !== currentModeState?.roundKey) {
            updateModeState(selectedGameType, { roundKey: state.roundKey });
            // Reset to PLAYING state for new round
            if (roundState === "COUNTDOWN_LOCK") {
              didEndRef.current = false;
              setRoundState("PLAYING");
            }
          }
          
          // Countdown sounds + vibration - only during PLAYING state
          if (remaining > 0 && remaining <= 5) {
            if (lastCountdownBeepRef.current !== remaining) {
              lastCountdownBeepRef.current = remaining;
              if (soundEnabled) {
                playCountdownBeep(remaining);
                playWarningTick();
              }
              // Vibration effect on mobile (stronger as countdown gets lower)
              if (navigator.vibrate) {
                const vibrationDuration = remaining <= 2 ? 100 : remaining <= 3 ? 60 : 40;
                navigator.vibrate(vibrationDuration);
              }
            }
            // Enter countdown lock (betting disabled)
            if (roundState === "PLAYING") {
              setRoundState("COUNTDOWN_LOCK");
            }
          } else if (remaining > 5 && remaining <= 10) {
            if (lastCountdownBeepRef.current !== remaining) {
              lastCountdownBeepRef.current = remaining;
              if (soundEnabled) playTick();
            }
          } else {
            lastCountdownBeepRef.current = null;
          }
        }
      },
      onRoundEnd: (duration, roundKey, result) => {
        const gameType = `${duration}min`;
        
        // Update history for this mode
        const newHistoryItem = {
          period: result.tradeId,
          digits: result.digits,
          sum: result.sum,
          bigSmall: result.bigSmall,
          oddEven: result.oddEven,
        };
        
        const currentHistory = modeStates[gameType]?.history || [];
        updateModeState(gameType, {
          history: [newHistoryItem, ...currentHistory.slice(0, 99)],
          currentDigits: result.digits,
        });
        
        // Reload myHistory
        const reloadedMyHistory = loadMyHistory(GAME_NAME, gameType);
        updateModeState(gameType, { myHistory: reloadedMyHistory });
        
        // If active tab, show reveal animation (allow from PLAYING or COUNTDOWN_LOCK)
        if (gameType === selectedGameType && (roundState === "PLAYING" || roundState === "COUNTDOWN_LOCK")) {
          handleRoundEnd(roundKey, result);
        } else if (gameType !== selectedGameType) {
          // Background mode - show toast
          const game = gameTypes.find(g => g.id === gameType);
          toast(`🎯 5D ${game?.sublabel} round completed`, {
            description: `Result: ${result.digits.join("-")} = ${result.sum}`,
            duration: 3000,
          });
        }
      },
    };
    
    const cleanup = start5DEngine(callbacks);
    
    return () => {
      cleanup();
      if (rollingIntervalRef.current) {
        window.clearInterval(rollingIntervalRef.current);
      }
    };
  }, [currentDuration, selectedGameType, roundState, soundEnabled, handleRoundEnd, updateModeState, modeStates, playTick, playWarningTick, playCountdownBeep, currentModeState?.roundKey]);
  
  // Game type change - reset UI
  useEffect(() => {
    didEndRef.current = false;
    setRoundState("PLAYING");
    setIsRolling(false);
    lastCountdownBeepRef.current = null;
    
    const remaining = getRemainingSeconds(currentDuration);
    setTimeRemaining(remaining);
    
    // Set digits from mode state (show last result)
    if (currentModeState?.currentDigits) {
      setCurrentDigits(currentModeState.currentDigits);
    } else if (currentModeState?.history?.[0]?.digits) {
      setCurrentDigits(currentModeState.history[0].digits);
    } else {
      setCurrentDigits([0, 0, 0, 0, 0]);
    }
  }, [selectedGameType]); // Only depend on selectedGameType, not currentDuration/currentModeState
  
  // Save sound settings
  useEffect(() => {
    localStorage.setItem("game_sound_enabled", String(soundEnabled));
  }, [soundEnabled]);
  
  useEffect(() => {
    localStorage.setItem("game_sound_volume", String(soundVolume));
  }, [soundVolume]);
  
  // Open bet sheet
  const openBetSheet = (digit: BettingTab, type: typeof betType, num?: number, range?: string) => {
    setBetDigit(digit);
    setBetType(type);
    if (type === "number" && num !== undefined) setBetNumber(num);
    if (type === "range" && range) setBetRange(range);
    setShowBetSheet(true);
  };
  
  // Handle place bet
  const handlePlaceBet = async () => {
    if (timeRemaining <= 5) {
      toast.error("সময় শেষ!", { description: "পরবর্তী রাউন্ডে চেষ্টা করুন।" });
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Error vibration
      return;
    }
    
    if (!isAuthenticated) {
      toast.error("Please login first!");
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Error vibration
      return;
    }
    
    const mult = parseInt(betMultiplier.replace("X", ""));
    const totalStake = betAmount * mult;
    
    if (!canAfford(totalStake)) {
      toast.error("Insufficient balance!");
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Error vibration
      return;
    }
    
    const betLabel = betType === "number" 
      ? `${betDigit} - Number ${betNumber}` 
      : betType === "range"
        ? `SUM Range ${betRange}`
        : `${betDigit} - ${betType.charAt(0).toUpperCase() + betType.slice(1)}`;
    
    // Range odds: 0-9 = 4.5x, 10-19 = 2.5x, 20-29 = 2.5x, 30-45 = 4.5x
    const getRangeOdds = (r: string) => {
      if (r === "0-9" || r === "30-45") return 4.5;
      return 2.5;
    };
    const odds = betType === "number" ? 9 : betType === "range" ? getRangeOdds(betRange) : 1.98;
    const fee = totalStake * 0.02;
    const netAmount = totalStake - fee;
    
    if (soundEnabled) playBetPlaced();
    
    // Bet confirmation vibration
    if (navigator.vibrate) {
      navigator.vibrate([30, 20, 50]); // Quick "tap-tap" confirmation
    }
    // Show detailed success toast
    toast.success("✅ বেট সফলভাবে প্লেস হয়েছে!", {
      description: `${betLabel} | ৳${totalStake} বেট | ${odds}X odds | সম্ভাব্য জয় ৳${(netAmount * odds).toFixed(2)}`,
      duration: 4000,
    });
    
    setBetAnimationData({
      betAmount: totalStake,
      betType: betLabel,
      potentialWin: Math.floor(netAmount * odds * 100) / 100,
    });
    setShowBetAnimation(true);
    setShowBetSheet(false);
    
    // Generate unique betId
    const betId = `${currentTradeId}_${Date.now()}`;
    
    // Add to local My History immediately (pending state)
    const durationMinutes = getDurationFromGameType(selectedGameType);
    const historyItem: FiveDBetHistoryItem = {
      period: currentTradeId,
      betType: betType === "range" 
        ? `SUM_range_${betRange}` 
        : `${betDigit}_${betType}${betType === "number" ? `_${betNumber}` : ""}`,
      betAmount: totalStake,
      fee: fee,
      netAmount: netAmount,
      result: null,
      isWin: null,
      payout: 0,
      timestamp: new Date(),
      duration: durationMinutes,
      roundKey: currentRoundKey,
    };
    
    // Note: Local history is now handled via database refresh, no localStorage update needed
    // Just refresh bets from database after placing
    
    // Optimized single-call database save
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("place-bet", {
          body: {
            gameType: "5d",
            gameMode: selectedGameType,
            tradeId: currentTradeId,
            betType: `${betDigit}_${betType}`,
            betValue: betType === "number" ? String(betNumber) : betType,
            betAmount: totalStake,
            multiplier: odds,
            potentialWin: netAmount * odds,
          },
        });

        if (error || !data?.success) {
          toast.error(data?.error || "Bet failed");
          return;
        }
        
        refreshBalance();
        refreshBets();
      } catch (error) {
        console.error("Bet save error:", error);
      }
    })();
  };
  
  // Reset 5D history
  const handleReset5DHistory = useCallback(() => {
    setResetInProgress(true);
    
    const modeKeys = ["1min", "3min", "5min", "10min"];
    const oldModeKeys = ["1m", "3m", "5m", "10m"];
    
    modeKeys.forEach((mode) => {
      localStorage.removeItem(`fiveD_${mode}_history`);
      localStorage.removeItem(`fiveD_${mode}_myHistory`);
    });
    oldModeKeys.forEach((mode) => {
      localStorage.removeItem(`fiveD_${mode}_history`);
      localStorage.removeItem(`fiveD_${mode}_myHistory`);
    });
    
    localStorage.removeItem("fiveD_history_migrated_v4");
    
    toast.success("5D হিস্ট্রি রিসেট করা হয়েছে!", { description: "নতুন ডেটা জেনারেট হচ্ছে..." });
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }, []);
  
  // Pagination
  const gameHistoryItemsPerPage = 10;
  const paginatedGameHistory = useMemo(() => {
    const startIndex = (gameHistoryPage - 1) * gameHistoryItemsPerPage;
    return gameHistory.slice(startIndex, startIndex + gameHistoryItemsPerPage);
  }, [gameHistory, gameHistoryPage]);
  const gameHistoryTotalPages = Math.max(1, Math.ceil(gameHistory.length / gameHistoryItemsPerPage));
  
  // Chart history with validation
  const chartHistory = useMemo(() => {
    return (gameHistory || []).filter((row: any) => {
      if (!row || typeof row !== "object") return false;
      if (!Array.isArray(row.digits) || row.digits.length !== 5) return false;
      if (!row.digits.every((d: any) => typeof d === "number" && d >= 0 && d <= 9)) return false;
      return true;
    }).map((row: any) => ({
      ...row,
      sum: row.digits.reduce((a: number, b: number) => a + b, 0),
    }));
  }, [gameHistory]);
  
  const chartItemsPerPage = 10;
  const paginatedChartHistory = useMemo(() => {
    const startIndex = (chartPage - 1) * chartItemsPerPage;
    return chartHistory.slice(startIndex, startIndex + chartItemsPerPage);
  }, [chartHistory, chartPage]);
  const chartTotalPages = Math.max(1, Math.ceil(chartHistory.length / chartItemsPerPage));

  // Fix: when switching game mode (or after history resets), ensure chart page never points to an empty page
  useEffect(() => {
    setChartPage(1);
  }, [selectedGameType]);

  useEffect(() => {
    if (chartPage > chartTotalPages) setChartPage(1);
  }, [chartTotalPages, chartPage]);
  
  // Generate statistics using refactored utility
  const currentStats = useMemo(() => {
    const isSumTab = chartDigitTab === "SUM";
    const digitIndex = isSumTab ? -1 : ["A", "B", "C", "D", "E"].indexOf(chartDigitTab);
    return generateDigitStats(chartHistory, digitIndex, 100);
  }, [chartHistory, chartDigitTab]);

  // Generate trend analysis
  const currentTrend = useMemo((): TrendAnalysis => {
    const isSumTab = chartDigitTab === "SUM";
    const digitIndex = isSumTab ? -1 : ["A", "B", "C", "D", "E"].indexOf(chartDigitTab);
    return analyzeTrend(chartHistory, digitIndex);
  }, [chartHistory, chartDigitTab]);

  // Generate prediction tips
  const predictionTips = useMemo((): PredictionTip[] => {
    const isSumTab = chartDigitTab === "SUM";
    const digitIndex = isSumTab ? -1 : ["A", "B", "C", "D", "E"].indexOf(chartDigitTab);
    return generatePredictionTips(currentStats, currentTrend, chartHistory, digitIndex);
  }, [currentStats, currentTrend, chartHistory, chartDigitTab]);

  return (
    <PageScaffold
      title="5D Lottery | GoLucky"
      description="Play 5D lottery — pick digits A/B/C/D/E for big multipliers."
      canonicalPath="/game/fived"
      fullWidth
    >
    <div className="min-h-screen" style={{ background: "#0B1426" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(180deg, #f97316 0%, #fb923c 100%)", paddingBottom: 12 }}>
        <header className="flex items-center justify-between px-3 py-2">
          <button onClick={() => navigate("/home")} className="p-1">
            <ArrowLeft className="text-white" size={20} />
          </button>
          <div className="flex items-center">
            <span 
              className="text-2xl font-extrabold tracking-tight"
              style={{ 
                background: "linear-gradient(135deg, #fef08a 0%, #fbbf24 50%, #f59e0b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 2px 10px rgba(251, 191, 36, 0.4)",
                fontFamily: "'Poppins', sans-serif",
                letterSpacing: "-0.5px",
              }}
            >
              Go<span style={{ 
                background: "linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>Lucky</span>
            </span>
            <span className="ml-1 text-yellow-300 text-lg">🍀</span>
          </div>
          <div className="flex items-center gap-2">
            <VolumeControl soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled} soundVolume={soundVolume} setSoundVolume={setSoundVolume} />
          </div>
        </header>

        {/* Compact Wallet Card */}
        <div className="mx-2 rounded-2xl shadow-lg overflow-hidden" style={{ background: "#0F1E35", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="text-orange-400" size={14} />
                <span className="text-lg font-bold text-white">{formattedBalance}</span>
              </div>
              <div className="flex gap-1.5">
                <button className="px-3 py-1.5 rounded-full bg-orange-500 text-white text-xs font-bold">Withdraw</button>
                <button className="px-3 py-1.5 rounded-full bg-green-500 text-white text-xs font-bold">Deposit</button>
              </div>
            </div>
          </div>

          {/* Compact Game Mode Tabs */}
          <div className="px-3 py-1.5 border-t border-white/5">
            <div className="flex gap-1.5">
              {gameTypes.map((g) => {
                const isActive = selectedGameType === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGameType(g.id)}
                    className="flex-1 flex flex-col items-center py-1.5 rounded-lg transition-all"
                    style={{
                      background: isActive ? "linear-gradient(135deg, #fb923c 0%, #f97316 100%)" : "#1E3A5F",
                      boxShadow: isActive ? "0 2px 6px rgba(249,115,22,0.3)" : "none",
                    }}
                  >
                    <Clock size={14} className={isActive ? "text-white" : "text-gray-400"} />
                    <span className={`text-[10px] font-bold ${isActive ? "text-white" : "text-slate-300"}`}>{g.sublabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compact Lottery Results Row */}
          <div className="px-3 py-1.5 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {["A", "B", "C", "D", "E"].map((label, i) => (
                  <div key={label} className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#1E3A5F", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <span className="text-xs font-bold text-white">{lastDigits[i]}</span>
                    </div>
                    <span className="text-[8px] text-gray-400">{label}</span>
                  </div>
                ))}
                <span className="text-gray-400 mx-1">=</span>
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{lastSum}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex gap-0.5 justify-end">
                  {[time.m1, time.m2].map((d, i) => (
                    <span key={i} className="w-5 h-6 rounded bg-orange-100 flex items-center justify-center font-bold text-sm text-orange-500">{d}</span>
                  ))}
                  <span className="font-bold text-sm text-orange-400 mx-0.5">:</span>
                  {[time.s1, time.s2].map((d, i) => (
                    <span key={i} className="w-5 h-6 rounded bg-orange-100 flex items-center justify-center font-bold text-sm text-orange-500">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Period Row */}
          <div className="px-3 py-1.5 flex justify-between items-center border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm" style={{ color: "#E2E8F0" }}>{currentPeriodNumber}</span>
              <button onClick={() => setHowOpen(true)} className="flex items-center gap-1 bg-orange-100 rounded-full px-2 py-0.5">
                <span className="text-[10px] text-orange-600 font-medium">📋 How to play</span>
              </button>
            </div>
            {timeRemaining <= 5 && timeRemaining > 0 && (
              <div 
                className="px-3 py-1 rounded-full text-xs font-bold text-white animate-pulse"
                style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}
              >
                ⏱️ {timeRemaining}s
              </div>
            )}
          </div>

          {/* Compact Slot Machine */}
          <div className="px-3 py-2">
            <FiveDSlotMachine 
              digits={currentDigits} 
              isRolling={isRolling}
              isWin={false}
              isLose={false}
              onSpinStart={playSlotSpinStart}
              onSpinTick={playSlotTick}
              onReelStop={playSlotReelStop}
              onSpinComplete={playSlotSpinComplete}
            />
          </div>

          {/* Betting Panel - Reference Style */}
          <div className={`relative px-3 py-2 ${timeRemaining <= 5 && timeRemaining > 0 ? "animate-timer-shake" : ""}`}>
            {/* Dramatic Countdown Overlay with particles and flares */}
            <CountdownOverlay 
              timeRemaining={timeRemaining} 
              show={timeRemaining <= 5 && timeRemaining > 0} 
            />
            
            {/* Betting Tabs - Simple Style */}
            <div className="flex gap-1.5 mb-3">
              {(["A", "B", "C", "D", "E", "SUM"] as BettingTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setBettingTab(tab)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    bettingTab === tab 
                      ? "bg-orange-500 text-white" 
                      : "text-slate-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Big/Small/Odd/Even Row - Simple Reference Style */}
            <div className={`grid grid-cols-4 gap-2 mb-4 ${roundState !== "PLAYING" || timeRemaining <= 5 ? "opacity-50 pointer-events-none" : ""}`}>
              <button 
                onClick={() => openBetSheet(bettingTab, "big")} 
                disabled={roundState !== "PLAYING" || timeRemaining <= 5}
                className="py-3 rounded-lg font-medium text-sm text-slate-200 disabled:cursor-not-allowed hover:opacity-90 transition-all"
              >
                <span>Big</span>
                <span className="ml-1 text-xs">1.98</span>
              </button>
              <button 
                onClick={() => openBetSheet(bettingTab, "small")} 
                disabled={roundState !== "PLAYING" || timeRemaining <= 5}
                className="py-3 rounded-lg font-medium text-sm text-slate-200 disabled:cursor-not-allowed hover:opacity-90 transition-all"
              >
                <span>Small</span>
                <span className="text-xs">1.98</span>
              </button>
              <button 
                onClick={() => openBetSheet(bettingTab, "odd")} 
                disabled={roundState !== "PLAYING" || timeRemaining <= 5}
                className="py-3 rounded-lg font-medium text-sm text-slate-200 disabled:cursor-not-allowed hover:opacity-90 transition-all"
              >
                <span>Odd</span>
                <span className="ml-1 text-xs">1.98</span>
              </button>
              <button 
                onClick={() => openBetSheet(bettingTab, "even")} 
                disabled={roundState !== "PLAYING" || timeRemaining <= 5}
                className="py-3 rounded-lg font-medium text-sm text-slate-200 disabled:cursor-not-allowed hover:opacity-90 transition-all"
              >
                <span>Even</span>
                <span className="ml-1 text-xs">1.98</span>
              </button>
            </div>

            {/* Number Grid - Simple Circular Style */}
            <div className={`mb-3 ${roundState !== "PLAYING" || timeRemaining <= 5 ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="flex justify-center gap-2 mb-2">
                {[0, 1, 2, 3, 4].map((n) => (
                  <button 
                    key={n} 
                    onClick={() => openBetSheet(bettingTab, "number", n)}
                    disabled={roundState !== "PLAYING" || timeRemaining <= 5}
                    className="flex flex-col items-center disabled:cursor-not-allowed"
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center hover:border-orange-400 transition-all" style={{ background: "#1E3A5F", border: "2px solid rgba(255,255,255,0.1)" }}>
                      <span className="text-lg font-medium text-white">{n}</span>
                    </div>
                    <span className="text-[10px] mt-0.5" style={{ color: "#94A3B8" }}>9</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-center gap-2">
                {[5, 6, 7, 8, 9].map((n) => (
                  <button 
                    key={n} 
                    onClick={() => openBetSheet(bettingTab, "number", n)}
                    disabled={roundState !== "PLAYING" || timeRemaining <= 5}
                    className="flex flex-col items-center disabled:cursor-not-allowed"
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center hover:border-orange-400 transition-all" style={{ background: "#1E3A5F", border: "2px solid rgba(255,255,255,0.1)" }}>
                      <span className="text-lg font-medium text-white">{n}</span>
                    </div>
                    <span className="text-[10px] mt-0.5" style={{ color: "#94A3B8" }}>9</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sum Range Section - Only for SUM tab */}
            {bettingTab === "SUM" && (
              <div className={`mt-3 ${roundState !== "PLAYING" || timeRemaining <= 5 ? "opacity-50 pointer-events-none" : ""}`}>
                <p className="text-xs font-medium mb-2" style={{ color: "#94A3B8" }}>Sum Range</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { range: "0-9", odds: "4.5" },
                    { range: "10-19", odds: "2.5" },
                    { range: "20-29", odds: "2.5" },
                    { range: "30-45", odds: "4.5" },
                  ].map((item) => (
                    <button
                      key={item.range}
                      onClick={() => openBetSheet("SUM", "range", undefined, item.range)}
                      disabled={roundState !== "PLAYING" || timeRemaining <= 5}
                      className="py-2.5 rounded-lg bg-purple-100 text-purple-700 font-medium text-xs disabled:cursor-not-allowed hover:bg-purple-200 transition-all"
                    >
                      <span className="block">{item.range}</span>
                      <span className="text-[10px] opacity-70">{item.odds}x</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-t border-white/5" style={{ background: "#0F1E35" }}>
        <div className="flex">
          {[{ id: "history", l: "History" }, { id: "chart", l: "Chart" }, { id: "myHistory", l: "My Bets" }, { id: "liveBets", l: "Live" }, { id: "leaderboard", l: "🏆 Top" }].map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex-1 py-2.5 text-xs font-medium relative ${activeTab === t.id ? "text-orange-400" : "text-slate-400"}`}>
              {t.l}
              {activeTab === t.id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-orange-500 rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* Game History Tab - WinGo/K3 Style */}
      {activeTab === "history" && (
        <div className="rounded-lg shadow-sm overflow-hidden" style={{ background: "#0F1E35", border: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Header with Reset Button */}
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/5">
            <span className="text-xs font-medium" style={{ color: "#94A3B8" }}>Game History</span>
            <button 
              onClick={() => setShowResetDialog(true)} 
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-500 text-[9px] font-medium hover:bg-red-100 border border-red-200"
            >
              <Trash2 size={10} /> Reset
            </button>
          </div>

          {/* Reset Dialog */}
          {showResetDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-xl shadow-2xl p-4 mx-4 max-w-sm w-full">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                    <Trash2 className="text-red-500" size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">5D হিস্ট্রি রিসেট করবেন?</h3>
                  <p className="text-gray-500 text-sm mb-4">এটি সব 5D গেম হিস্ট্রি মুছে ফেলবে।</p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowResetDialog(false)} disabled={resetInProgress} className="flex-1 py-2.5 rounded-full bg-gray-100 text-gray-600 font-medium text-sm">বাতিল</button>
                    <button onClick={() => { setShowResetDialog(false); handleReset5DHistory(); }} disabled={resetInProgress} className="flex-1 py-2.5 rounded-full bg-red-500 text-white font-medium text-sm flex items-center justify-center gap-1">
                      {resetInProgress ? <><RefreshCw size={14} className="animate-spin" /> রিসেট হচ্ছে...</> : <><Trash2 size={14} /> রিসেট করুন</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table Header */}
          <div
            className="grid grid-cols-4 py-1.5 px-2 text-[9px] font-medium text-white"
            style={{ background: "#f97316" }}
          >
            <span>Period</span>
            <span className="text-center">Number</span>
            <span className="text-center">Big Small</span>
            <span className="text-center">Odd Even</span>
          </div>

          {/* Table Body */}
          <div>
            {paginatedGameHistory.map((r: any, idx: number) => {
              const sum = r.sum || 0;
              const isBig = sum >= 23;
              const isOdd = sum % 2 === 1;
              return (
                <div
                  key={idx}
                  className="grid grid-cols-4 items-center py-1.5 px-2"
                  style={{ borderBottom: "1px solid #f9fafb" }}
                >
                  <CopyablePeriod period={r.period} className="text-gray-500 text-[8px] leading-tight" />
                  <div className="flex justify-center items-center gap-0.5">
                    {(r.digits || [0, 0, 0, 0, 0]).map((d: number, j: number) => (
                      <span key={j} className="text-[9px] font-medium text-gray-600">{d}</span>
                    ))}
                    <span className="text-gray-400 text-[9px] mx-0.5">=</span>
                    <span 
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: "#f97316" }}
                    >
                      {sum}
                    </span>
                  </div>
                  <span className="text-center text-gray-600 text-[9px]">{isBig ? "Big" : "Small"}</span>
                  <span className="text-center text-gray-600 text-[9px]">{isOdd ? "Odd" : "Even"}</span>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <HistoryPagination 
            currentPage={gameHistoryPage} 
            totalPages={gameHistoryTotalPages} 
            onPageChange={setGameHistoryPage} 
            itemsPerPage={gameHistoryItemsPerPage} 
            totalItems={gameHistory.length} 
          />
        </div>
      )}

      {/* Chart Tab */}
      {activeTab === "chart" && (
        <div className="p-2" style={{ background: "#0F1E35" }}>
          {/* Digit Tabs + Export */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-1 flex-1">
              {(["A", "B", "C", "D", "E", "SUM"] as const).map((tab) => (
                <button key={tab} onClick={() => setChartDigitTab(tab)} className={`flex-1 py-1.5 rounded text-[10px] font-bold ${chartDigitTab === tab ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"}`}>{tab}</button>
              ))}
            </div>
            <button
              onClick={() => exportChartHistory(chartHistory, `5D_${selectedGameType}`)}
              className="ml-2 p-1.5 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
              title="Export CSV"
            >
              <Download size={14} />
            </button>
          </div>

          {/* Header Bar - WinGo Style */}
          <div
            className="flex rounded py-1.5 px-2 mb-2 text-[10px] font-medium text-white"
            style={{ background: "#f97316" }}
          >
            <span className="flex-shrink-0" style={{ width: 100 }}>Period</span>
            <span className="flex-1 text-center">{chartDigitTab === "SUM" ? "Sum (mod 10)" : `Digit ${chartDigitTab}`}</span>
          </div>
          
          {/* Hot/Cold Numbers Section */}
          <div className="mb-3 p-2.5 rounded-lg" style={{ background: "linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)", border: "1px solid #fde68a" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-amber-700">🔥 Hot & Cold Numbers</span>
              <span className="text-[9px] text-amber-600">{chartDigitTab} Position</span>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-[8px] text-gray-500 mb-1">🔥 HOT (Most Frequent)</p>
                <div className="flex gap-1">
                  {currentStats.hotDigits.map((num, idx) => (
                    <span 
                      key={num} 
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-sm"
                      style={{ 
                        background: idx === 0 ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : 
                                   idx === 1 ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" : 
                                              "linear-gradient(135deg, #fb923c 0%, #f97316 100%)"
                      }}
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[8px] text-gray-500 mb-1">❄️ COLD (Least Frequent)</p>
                <div className="flex gap-1">
                  {currentStats.coldDigits.map((num, idx) => (
                    <span 
                      key={num} 
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-sm"
                      style={{ 
                        background: idx === 0 ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" : 
                                   idx === 1 ? "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)" : 
                                              "linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%)"
                      }}
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trend Analysis Section */}
          <div className="mb-3 p-2.5 rounded-lg" style={{ background: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)", border: "1px solid #c4b5fd" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-purple-700">📊 Trend Analysis</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold text-white ${
                currentTrend.trend === "UP" ? "bg-green-500" : 
                currentTrend.trend === "DOWN" ? "bg-red-500" : "bg-gray-400"
              }`}>
                {currentTrend.trend === "UP" ? "📈 Uptrend" : currentTrend.trend === "DOWN" ? "📉 Downtrend" : "➡️ Stable"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="text-center p-1.5 rounded bg-white/60">
                <p className="text-[8px] text-gray-500">Pattern</p>
                <p className="text-[9px] font-medium text-gray-700">{currentTrend.recentPattern}</p>
              </div>
              <div className="text-center p-1.5 rounded bg-white/60">
                <p className="text-[8px] text-gray-500">Big/Small</p>
                <div className="flex justify-center gap-1">
                  <span className="text-[9px] font-bold text-orange-500">{currentTrend.bigSmallTrend.big}%</span>
                  <span className="text-[9px] text-gray-400">/</span>
                  <span className="text-[9px] font-bold text-blue-500">{currentTrend.bigSmallTrend.small}%</span>
                </div>
              </div>
              <div className="text-center p-1.5 rounded bg-white/60">
                <p className="text-[8px] text-gray-500">Odd/Even</p>
                <div className="flex justify-center gap-1">
                  <span className="text-[9px] font-bold text-green-500">{currentTrend.oddEvenTrend.odd}%</span>
                  <span className="text-[9px] text-gray-400">/</span>
                  <span className="text-[9px] font-bold text-orange-500">{currentTrend.oddEvenTrend.even}%</span>
                </div>
              </div>
            </div>
            {/* Trend Strength Bar */}
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-gray-500">Strength:</span>
              <div className="flex-1 h-2 rounded-full bg-white/60 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${currentTrend.trendStrength}%`,
                    background: currentTrend.trend === "UP" ? "linear-gradient(90deg, #22c55e, #16a34a)" :
                               currentTrend.trend === "DOWN" ? "linear-gradient(90deg, #ef4444, #dc2626)" :
                               "linear-gradient(90deg, #9ca3af, #6b7280)"
                  }}
                />
              </div>
              <span className="text-[9px] font-bold text-purple-700">{currentTrend.trendStrength}%</span>
            </div>
          </div>

          {/* AI-Powered Prediction Section */}
          <div className="mb-3 p-2.5 rounded-lg overflow-hidden" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)", border: "1px solid #6366f1" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="text-yellow-400" size={14} />
                <span className="text-[11px] font-bold text-white">🤖 AI-Powered Predictions</span>
              </div>
              <button
                onClick={() => {
                  const isSumTab = chartDigitTab === "SUM";
                  const digitIndex = isSumTab ? -1 : ["A", "B", "C", "D", "E"].indexOf(chartDigitTab);
                  const recentValues = chartHistory.slice(0, 20).map(h => 
                    isSumTab ? h.sum % 10 : (h.digits?.[digitIndex] ?? 0)
                  );
                  fetchPredictions("5D", chartDigitTab, recentValues, {
                    hotDigits: currentStats.hotDigits,
                    coldDigits: currentStats.coldDigits,
                    missing: currentStats.missing,
                    trend: currentTrend.trend,
                    bigSmallRatio: currentTrend.bigSmallTrend,
                    oddEvenRatio: currentTrend.oddEvenTrend,
                  });
                }}
                disabled={isAILoading || chartHistory.length < 10}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold transition-all disabled:opacity-50"
                style={{ 
                  background: isAILoading ? "#6b7280" : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  color: "white",
                  boxShadow: isAILoading ? "none" : "0 2px 8px rgba(245, 158, 11, 0.4)"
                }}
              >
                {isAILoading ? (
                  <>
                    <Loader2 size={10} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={10} />
                    Get AI Tips
                  </>
                )}
              </button>
            </div>
            
            {/* AI Predictions Display */}
            {aiPredictions.length > 0 ? (
              <>
                {aiInsight && (
                  <div className="mb-2 p-2 rounded-lg bg-white/10 border border-white/20">
                    <p className="text-[9px] text-white/90 text-center">💬 {aiInsight}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-2">
                  {aiPredictions.map((pred, idx) => (
                    <div 
                      key={idx} 
                      className="p-2.5 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-white">{pred.title}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-1">
                            {pred.numbers.map((num) => (
                              <span 
                                key={num} 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg"
                                style={{ 
                                  background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                                  color: "#1e1b4b"
                                }}
                              >
                                {num}
                              </span>
                            ))}
                          </div>
                          <span 
                            className="px-2 py-0.5 rounded-full text-[8px] font-bold"
                            style={{ 
                              background: pred.confidence >= 70 ? "linear-gradient(135deg, #22c55e, #16a34a)" : 
                                         pred.confidence >= 50 ? "linear-gradient(135deg, #f97316, #ea580c)" : 
                                         "linear-gradient(135deg, #6b7280, #4b5563)",
                              color: "white"
                            }}
                          >
                            {pred.confidence}%
                          </span>
                        </div>
                      </div>
                      <p className="text-[8px] text-white/70">{pred.description}</p>
                      {pred.reasoning && (
                        <p className="text-[7px] text-yellow-400/80 mt-1">💡 {pred.reasoning}</p>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[7px] text-center text-white/50 mt-2 italic">
                  ⚠️ AI predictions are for entertainment only. Gamble responsibly.
                </p>
                
                {/* AI Prediction History */}
                <div className="mt-3 pt-3 border-t border-white/20">
                  <AIPredictionHistory gameType="5D" position={chartDigitTab} />
                </div>
              </>
            ) : (
              <div className="text-center py-3">
                <p className="text-[9px] text-white/60">
                  {chartHistory.length < 10 
                    ? "📊 Need at least 10 rounds of data for AI analysis" 
                    : "🎯 Click 'Get AI Tips' to analyze patterns with AI"}
                </p>
                
                {/* Show history even when no current predictions */}
                <div className="mt-3">
                  <AIPredictionHistory gameType="5D" position={chartDigitTab} />
                </div>
              </div>
            )}
          </div>

          {/* Prediction Tips Section (Statistical) */}
          {predictionTips.length > 0 && (
            <div className="mb-3 p-2.5 rounded-lg" style={{ background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)", border: "1px solid #86efac" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-green-700">💡 Statistical Tips</span>
                <span className="text-[8px] text-green-600 italic">Based on patterns</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {predictionTips.map((tip, idx) => (
                  <div 
                    key={idx} 
                    className="p-2 rounded-lg bg-white/70 border border-green-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold text-gray-700">{tip.emoji} {tip.title}</span>
                      <span 
                        className="px-1.5 py-0.5 rounded text-[8px] font-bold text-white"
                        style={{ 
                          background: tip.confidence >= 70 ? "#22c55e" : 
                                     tip.confidence >= 50 ? "#f97316" : "#6b7280"
                        }}
                      >
                        {tip.confidence}%
                      </span>
                    </div>
                    <p className="text-[8px] text-gray-500 mb-1.5">{tip.description}</p>
                    <div className="flex gap-1">
                      {tip.numbers.map((num) => (
                        <span 
                          key={num} 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                          style={{ background: "#f97316" }}
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[7px] text-center text-gray-400 mt-2 italic">
                ⚠️ Tips are for reference only. Gambling involves risk.
              </p>
            </div>
          )}

          {/* Statistics Section */}
          <div className="mb-2">
            <p className="font-medium text-gray-700 text-[10px] mb-1.5">📈 Statistic (last 100 Periods)</p>
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="flex-shrink-0 text-gray-500 text-[9px]" style={{ width: 100 }}>{chartDigitTab === "SUM" ? "Sum last digit" : "Winning number"}</span>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                    const isHot = currentStats.hotDigits.includes(num);
                    const isCold = currentStats.coldDigits.includes(num);
                    return (
                      <span 
                        key={num} 
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium"
                        style={{ 
                          border: isHot ? "2px solid #ef4444" : isCold ? "2px solid #3b82f6" : "1px solid #f97316", 
                          color: isHot ? "#ef4444" : isCold ? "#3b82f6" : "#f97316",
                          background: isHot ? "#fef2f2" : isCold ? "#eff6ff" : "transparent"
                        }}
                      >
                        {num}
                      </span>
                    );
                  })}
                </div>
              </div>
              {[{ label: "Missing", data: currentStats.missing }, { label: "Avg missing", data: currentStats.avgMissing }, { label: "Frequency", data: currentStats.counts }, { label: "Max consecutive", data: currentStats.maxConsecutive }].map((r) => (
                <div key={r.label} className="flex items-center">
                  <span className="flex-shrink-0 text-gray-500 text-[9px]" style={{ width: 100 }}>{r.label}</span>
                  <div className="flex gap-1.5">
                    {r.data.map((v, i) => {
                      const isHot = currentStats.hotDigits.includes(i);
                      const isCold = currentStats.coldDigits.includes(i);
                      return (
                        <span 
                          key={i} 
                          className="w-5 text-center text-[9px]"
                          style={{ 
                            color: isHot ? "#ef4444" : isCold ? "#3b82f6" : "#9ca3af",
                            fontWeight: isHot || isCold ? 600 : 400
                          }}
                        >
                          {v}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {chartHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <p className="text-sm font-medium">কোনো ডেটা নেই</p>
            </div>
          ) : (
            <div className="relative">
              {/* SVG Connecting Lines - WinGo Style */}
              <svg
                className="absolute pointer-events-none"
                style={{ left: 100, top: 0, width: "calc(100% - 125px)", height: "100%", overflow: "visible" }}
              >
                {paginatedChartHistory.slice(0, 12).map((row: any, idx: number) => {
                  if (idx === paginatedChartHistory.slice(0, 12).length - 1) return null;
                  const nextRow = paginatedChartHistory.slice(0, 12)[idx + 1];
                  if (!nextRow) return null;
                  
                  const isSumTabRow = chartDigitTab === "SUM";
                  const currentValue = isSumTabRow ? (row.sum % 10) : (row.digits?.[["A", "B", "C", "D", "E"].indexOf(chartDigitTab)] ?? 0);
                  const nextValue = isSumTabRow ? (nextRow.sum % 10) : (nextRow.digits?.[["A", "B", "C", "D", "E"].indexOf(chartDigitTab)] ?? 0);
                  
                  const cellWidth = 22;
                  const startX = currentValue * cellWidth + 10;
                  const endX = nextValue * cellWidth + 10;
                  const startY = idx * 32 + 16;
                  const endY = (idx + 1) * 32 + 16;
                  
                  return (
                    <line
                      key={idx}
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke="#f97316"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>

              {/* Chart Rows */}
              <div>
                {paginatedChartHistory.map((row: any, idx: number) => {
                  const isSumTabRow = chartDigitTab === "SUM";
                  const displayValue = isSumTabRow ? (row.sum % 10) : (row.digits?.[["A", "B", "C", "D", "E"].indexOf(chartDigitTab)] ?? 0);
                  const isHigh = isSumTabRow ? row.sum >= 23 : displayValue >= 5;
                  const isOdd = isSumTabRow ? row.sum % 2 === 1 : displayValue % 2 === 1;
                  const isNewResult = idx === 0 && chartPage === 1;
                  return (
                    <div 
                      key={`${row.period}-${idx}`} 
                      className={`flex items-center rounded-md ${isNewResult ? "animate-chart-row-new" : ""}`} 
                      style={{ height: 32 }}
                    >
                      <div className="flex-shrink-0" style={{ width: 100 }}>
                        <CopyablePeriod period={row.period} className="text-gray-500 text-[8px]" />
                      </div>
                      <div className="flex gap-1" style={{ position: "relative", zIndex: 1 }}>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                          const isWin = displayValue === num;
                          return (
                            <span
                              key={num}
                              className={`flex items-center justify-center text-[9px] ${isWin && isNewResult ? "animate-chart-ball-new" : ""}`}
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                background: isWin ? "#f97316" : "transparent",
                                color: isWin ? "#fff" : "#d1d5db",
                                border: isWin ? "none" : "1px solid #e5e7eb",
                                fontWeight: isWin ? 700 : 400,
                                position: "relative",
                                zIndex: isWin ? 2 : 1,
                              }}
                            >
                              {num}
                            </span>
                          );
                        })}
                      </div>
                      <div className="flex gap-1 ml-auto">
                        {isSumTabRow && <span className="flex items-center justify-center text-[8px] font-bold text-white" style={{ width: 22, height: 18, borderRadius: 9, background: "#6b7280" }}>{row.sum}</span>}
                        <span className="flex items-center justify-center text-[8px] font-bold" style={{ width: 18, height: 18, borderRadius: "50%", background: isHigh ? "#f97316" : "#3b82f6", color: "#fff" }}>{isHigh ? "H" : "L"}</span>
                        <span className="flex items-center justify-center text-[8px] font-bold" style={{ width: 18, height: 18, borderRadius: "50%", background: isOdd ? "#22c55e" : "#f97316", color: "#fff" }}>{isOdd ? "O" : "E"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <HistoryPagination currentPage={chartPage} totalPages={chartTotalPages} onPageChange={setChartPage} itemsPerPage={chartItemsPerPage} totalItems={chartHistory.length} />
        </div>
      )}

      {/* My History Tab */}
      {activeTab === "myHistory" && (
        <div className="p-3" style={{ background: "#0F1E35" }}>
          <div className="flex items-center justify-between gap-2 mb-3 py-1.5 px-3 bg-gradient-to-r from-orange-500/10 to-orange-400/10 rounded-lg border border-orange-200">
            <span className="text-[10px] text-orange-600 font-medium">📊 {showAllModes ? "সব মোডের হিস্ট্রি" : `${currentGame.sublabel} মোডের হিস্ট্রি`}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportBetHistory(activeHistory.map(b => ({ period: b.period, betType: b.betType, betAmount: b.betAmount, isWin: b.isWin, payout: b.payout })), `5D_${showAllModes ? "all" : selectedGameType}`)}
                className="p-1.5 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
                title="Export CSV"
                disabled={activeHistory.length === 0}
              >
                <Download size={12} />
              </button>
              <ClearPendingButton gameName="fiveD" gameTypes={gameTypes.map((g) => g.id)} onCleared={() => gameTypes.forEach((game) => updateModeState(game.id, { myHistory: loadMyHistory(GAME_NAME, game.id) }))} />
              <button onClick={() => setShowAllModes(!showAllModes)} className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all ${showAllModes ? "bg-orange-500 text-white shadow-md" : "bg-white text-orange-600 border border-orange-300 hover:bg-orange-50"}`}>
                {showAllModes ? "✓ সব মোড" : "সব মোড দেখুন"}
              </button>
            </div>
          </div>

          {activeHistory.length > 0 && <BetHistoryChart history={activeHistory} className="mb-3" />}
          {activeHistory.length > 0 && (
            <BetHistoryFilters onFilterChange={setHistoryFilter} onSortChange={setHistorySort} onDateRangeChange={setHistoryDateRange} onSearchChange={setHistorySearchQuery} currentFilter={historyFilter} currentSort={historySort} currentDateRange={historyDateRange} searchQuery={historySearchQuery} totalCount={activeHistory.length} filteredCount={filterAndSortBetHistory(activeHistory, historyFilter, historySort, historyDateRange, historySearchQuery).length} filteredHistory={filterAndSortBetHistory(activeHistory, historyFilter, historySort, historyDateRange, historySearchQuery)} gameName="5D" />
          )}
          
          {activeHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-400 text-sm">{showAllModes ? "কোন বেট নেই" : "এই মোডে কোন বেট নেই"}</p>
            </div>
          ) : (
            filterAndSortBetHistory(activeHistory, historyFilter, historySort, historyDateRange, historySearchQuery).slice((myHistoryPage - 1) * 10, myHistoryPage * 10).map((bet, i) => {
              // Get game mode label from duration
              const getModeLabel = (duration?: number) => {
                if (!duration) return "";
                if (duration === 1) return "1Min";
                if (duration === 3) return "3Min";
                if (duration === 5) return "5Min";
                if (duration === 10) return "10Min";
                return `${duration}Min`;
              };
              const modeLabel = getModeLabel(bet.duration);
              
              return (
                <div 
                  key={i} 
                  className="rounded-xl mb-3 p-3 shadow-sm cursor-pointer hover:shadow-md transition-all"
                  style={{ background: "#0F1E35", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                  onClick={() => {
                    setSelectedBetDetails({
                      period: bet.period,
                      betType: bet.betType,
                      betAmount: bet.betAmount,
                      fee: bet.fee,
                      netAmount: bet.netAmount,
                      multiplier: (bet as any).multiplier,
                      potentialWin: (bet as any).potentialWin,
                      result: bet.result,
                      isWin: bet.isWin,
                      payout: bet.payout,
                      timestamp: bet.timestamp,
                      duration: bet.duration,
                      roundKey: bet.roundKey,
                    });
                    setShowBetDetailsModal(true);
                  }}
                >
                  {/* Header Row - Trade ID + Status */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {modeLabel && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}>
                          {modeLabel}
                        </span>
                      )}
                      <div>
                        <p className="text-[9px] text-gray-400">Trade ID</p>
                        <p className="text-[11px] font-medium text-gray-700">{bet.period}</p>
                      </div>
                    </div>
                    {/* Animated Status Badge */}
                    {bet.isWin === null ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500" style={{ boxShadow: "0 2px 8px rgba(234, 179, 8, 0.4)" }}>
                        <div className="w-4 h-4 flex items-center justify-center animate-spin">
                          <svg viewBox="0 0 24 24" className="w-4 h-4"><circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" fill="none" strokeDasharray="40 60" /></svg>
                        </div>
                        <span className="text-[11px] font-bold text-white animate-pulse">PENDING</span>
                      </div>
                    ) : bet.isWin ? (
                      <div 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500"
                        style={{ boxShadow: "0 2px 8px rgba(34, 197, 94, 0.4)", animation: "statusPop 0.3s ease-out" }}
                      >
                        <div className="w-4 h-4 flex items-center justify-center" style={{ animation: "winIconBounce 1s ease-in-out infinite" }}>
                          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#fff" /></svg>
                        </div>
                        <span className="text-[11px] font-bold text-white">WIN!</span>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500"
                        style={{ boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)", animation: "statusPop 0.3s ease-out" }}
                      >
                        <div className="w-4 h-4 flex items-center justify-center" style={{ animation: "loseIconShake 0.5s ease-in-out" }}>
                          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" fill="none" /><path d="M8 8L16 16M16 8L8 16" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
                        </div>
                        <span className="text-[11px] font-bold text-white">LOSE</span>
                      </div>
                    )}
                  </div>

                  {/* Bet Type */}
                  <p className="text-sm font-semibold text-gray-800 mb-2">{bet.betType}</p>

                  {/* Content Row - Bet Details + Result */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="rounded-lg p-2" style={{ background: "linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)", border: "1px solid #fde68a" }}>
                        <div className="grid grid-cols-3 gap-1 text-center">
                          <div>
                            <p className="text-[8px] text-gray-500 uppercase tracking-wide">Bet</p>
                            <p className="text-[11px] font-bold text-gray-800">৳{bet.betAmount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-gray-500 uppercase tracking-wide">Fee (2%)</p>
                            <p className="text-[11px] font-bold text-orange-500">{bet.fee !== undefined && bet.fee > 0 ? `-৳${bet.fee.toFixed(2)}` : "৳0"}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-gray-500 uppercase tracking-wide">Net</p>
                            <p className="text-[11px] font-bold text-green-600">৳{bet.netAmount !== undefined ? bet.netAmount.toFixed(2) : bet.betAmount.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      {bet.result !== null && bet.result !== undefined && (
                        <>
                          <div className="flex items-center justify-end gap-1.5 mb-1">
                            <span className="text-[10px] text-gray-400">Result:</span>
                            <div className="flex gap-0.5">
                              {(Array.isArray(bet.result) ? bet.result : String(bet.result).split("").map(Number)).slice(0, 5).map((d: number, idx: number) => (
                                <span 
                                  key={idx} 
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                                  style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
                                >
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                          {bet.isWin && bet.payout > 0 && (
                            <div className="px-2 py-1 rounded-lg" style={{ background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)", border: "1px solid #86efac" }}>
                              <p className="text-xs font-bold text-green-700">+৳{bet.payout.toFixed(2)}</p>
                            </div>
                          )}
                          {!bet.isWin && (
                            <div className="px-2 py-1 rounded-lg" style={{ background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)", border: "1px solid #fca5a5" }}>
                              <p className="text-xs font-bold text-red-600">-৳{bet.betAmount.toLocaleString()}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {activeHistory.length > 10 && (
            <HistoryPagination currentPage={myHistoryPage} totalPages={Math.ceil(filterAndSortBetHistory(activeHistory, historyFilter, historySort, historyDateRange, historySearchQuery).length / 10)} onPageChange={setMyHistoryPage} itemsPerPage={10} totalItems={filterAndSortBetHistory(activeHistory, historyFilter, historySort, historyDateRange, historySearchQuery).length} />
          )}
        </div>
      )}

      {/* Live Bets Tab */}
      {activeTab === "liveBets" && (
        <div className="p-3" style={{ background: "#0F1E35" }}>
          <LiveBetsFeed gameType="fiveD" />
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === "leaderboard" && (
        <div style={{ background: "#0F1E35" }}>
          <Leaderboard gameType="fiveD" />
        </div>
      )}

      {/* Modals */}
      <BetSheet 
        isOpen={showBetSheet} 
        onClose={() => setShowBetSheet(false)}
        headerTitle={
          betType === "number" 
            ? `${betDigit} - Number ${betNumber}` 
            : betType === "range"
              ? `SUM Range ${betRange}`
              : `${betDigit} - ${betType?.charAt(0).toUpperCase()}${betType?.slice(1)}`
        }
        timeRemaining={timeRemaining}
        footer={(
          <div className="grid grid-cols-2 gap-3 p-4 bg-white border-t border-white/5">
            <button
              onClick={() => setShowBetSheet(false)}
              className="py-3 rounded-lg text-gray-600 font-bold text-sm bg-gray-100 hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handlePlaceBet}
              disabled={!agreedToRules || timeRemaining <= 5}
              className="py-3 rounded-lg text-white font-bold text-sm disabled:opacity-50 transition-all"
              style={{
                background:
                  betType === "range"
                    ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                    : "linear-gradient(135deg, #fb923c 0%, #f97316 100%)",
              }}
            >
              {timeRemaining <= 5 ? (
                "Betting Closed"
              ) : (
                <>
                  Bet {formatTaka(betAmount * parseInt(betMultiplier.replace("X", "")), 0)} → Win{" "}
                  {formatTaka(
                    (() => {
                      const stake = betAmount * parseInt(betMultiplier.replace("X", ""));
                      const netStake = stake * 0.98;
                      const odds =
                        betType === "number"
                          ? 9
                          : betType === "range"
                            ? betRange === "0-9" || betRange === "30-45"
                              ? 4.5
                              : 2.5
                            : 1.98;
                      return netStake * odds;
                    })(),
                    0
                  )}
                </>
              )}
            </button>
          </div>
        )}
      >
        <div className="p-4 space-y-3">
          {/* Bet Type Header */}
          <div className="text-center py-2 rounded-lg" style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}>
            <span className="text-white font-bold text-sm">5D {currentGame.sublabel}</span>
          </div>
          
          {/* Bet Type Display */}
          <h3 className="text-xl font-bold text-gray-800">
            {betType === "number" 
              ? `${betDigit} - Number ${betNumber}` 
              : betType === "range"
                ? `SUM Range ${betRange}`
                : `${betDigit} - ${betType?.charAt(0).toUpperCase()}${betType?.slice(1)}`}
          </h3>
          
          {/* Balance Display */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Balance</p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
              <span className="text-lg">💰</span>
              <span className="text-lg font-bold text-white">{formattedBalance}</span>
            </div>
          </div>
          
          {/* Bet Amount with +/- Controls */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Bet Amount</p>
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              <button 
                onClick={() => setBetAmount(Math.max(1, betAmount - 1))}
                className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 text-gray-600 text-xl font-bold hover:border-orange-400 transition-all flex items-center justify-center"
              >
                −
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-bold text-gray-800">৳ {betAmount}</span>
              </div>
              <button 
                onClick={() => setBetAmount(betAmount + 1)}
                className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 text-gray-600 text-xl font-bold hover:border-orange-400 transition-all flex items-center justify-center"
              >
                +
              </button>
            </div>
            
            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[1, 10, 100, 1000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  className={`py-2.5 rounded-full text-sm font-bold transition-all ${
                    betAmount === amount
                      ? "bg-orange-500 text-white"
                      : "bg-white text-gray-600 border-2 border-gray-200 hover:border-orange-400"
                  }`}
                >
                  {formatTaka(amount, 0)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Multiplier */}
          <div className="flex gap-2">
            {["X1", "X5", "X10", "X20", "X50", "X100"].map((mult) => (
              <button
                key={mult}
                onClick={() => setBetMultiplier(mult)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  betMultiplier === mult
                    ? "bg-orange-500 text-white border-2 border-orange-600"
                    : "bg-white text-gray-600 border-2 border-gray-200 hover:border-orange-400"
                }`}
              >
                {mult}
              </button>
            ))}
          </div>
          
          {/* Payout Odds Guide */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 text-center border-b border-gray-200">
              <span className="text-xs font-bold text-gray-600">🎰 PAYOUT ODDS GUIDE</span>
            </div>
            <div className="grid grid-cols-2 gap-0">
              <div className="flex justify-between items-center px-3 py-2 border-b border-r border-gray-100">
                <span className="text-xs text-gray-600">Number (0-9)</span>
                <span className="text-xs font-bold text-orange-500">9x</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 border-b border-white/5">
                <span className="text-xs text-gray-600 flex items-center gap-1">🔷 Big</span>
                <span className="text-xs font-bold text-orange-500">2x</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 border-b border-r border-gray-100">
                <span className="text-xs text-gray-600 flex items-center gap-1">🔶 Small</span>
                <span className="text-xs font-bold text-orange-500">2x</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 border-b border-white/5">
                <span className="text-xs text-gray-600">Odd/Even</span>
                <span className="text-xs font-bold text-orange-500">2x</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 border-r border-gray-100">
                <span className="text-xs text-gray-600">Range 0-9/30-45</span>
                <span className="text-xs font-bold text-purple-500">4.5x</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2">
                <span className="text-xs text-gray-600">Range 10-29</span>
                <span className="text-xs font-bold text-purple-500">2.5x</span>
              </div>
            </div>
            <div className="bg-gray-50 px-3 py-1.5 text-center border-t border-gray-200">
              <span className="text-[10px] text-gray-400">* 2% service fee applies on all 5D bets</span>
            </div>
          </div>
          
          {/* Summary with Fee Breakdown */}
          <div className="border border-orange-200 rounded-lg overflow-hidden">
            <div className="bg-orange-50 grid grid-cols-2 divide-x divide-orange-200">
              <div className="px-3 py-2 text-center">
                <p className="text-[10px] text-gray-500 uppercase">Total Stake</p>
                <p className="text-lg font-bold text-gray-800">{formatTaka(betAmount * parseInt(betMultiplier.replace("X", "")), 0)}</p>
              </div>
              <div className="px-3 py-2 text-center">
                <p className="text-[10px] text-gray-500 uppercase">Fee (2%)</p>
                <p className="text-lg font-bold text-red-500">-{formatTaka(betAmount * parseInt(betMultiplier.replace("X", "")) * 0.02)}</p>
              </div>
            </div>
            <div className="bg-white grid grid-cols-2 divide-x divide-gray-200 border-t border-orange-200">
              <div className="px-3 py-2">
                <p className="text-[10px] text-gray-400 uppercase">Net Bet</p>
                <p className="text-sm font-bold text-gray-700">{formatTaka(betAmount * parseInt(betMultiplier.replace("X", "")) * 0.98)}</p>
              </div>
              <div className="px-3 py-2 text-right">
                <p className="text-[10px] text-gray-400 uppercase">
                  Potential Win ({betType === "number" ? "9X" : betType === "range" ? ((betRange === "0-9" || betRange === "30-45") ? "4.5X" : "2.5X") : "2X"})
                </p>
                <p className="text-lg font-bold text-green-600">
                  {formatTaka((() => {
                    const stake = betAmount * parseInt(betMultiplier.replace("X", ""));
                    const netStake = stake * 0.98;
                    const odds = betType === "number" ? 9 : betType === "range" ? ((betRange === "0-9" || betRange === "30-45") ? 4.5 : 2.5) : 1.98;
                    return netStake * odds;
                  })())}
                </p>
              </div>
            </div>
          </div>
          
          {/* Rules Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToRules}
              onChange={(e) => setAgreedToRules(e.target.checked)}
              className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500"
            />
            <span className="text-xs text-gray-600">I agree</span>
            <span className="text-xs text-orange-500 font-medium">(Pre-sale rules)</span>
          </label>
        </div>
      </BetSheet>
      
      <HowToPlayModal 
        open={howOpen} 
        onClose={() => setHowOpen(false)} 
        content={fiveDHowToPlay} 
        title="5D Lottery - How to Play" 
      />
      
      <BetPlacedAnimation 
        show={showBetAnimation} 
        onComplete={() => setShowBetAnimation(false)} 
        betAmount={betAnimationData?.betAmount || 0}
        betType={betAnimationData?.betType || ""}
        potentialWin={betAnimationData?.potentialWin || 0}
      />
      
      {/* Win Confetti Animation */}
      <Confetti 
        isActive={showConfetti} 
        duration={3500} 
        intensity={confettiIntensity} 
      />
      
      {/* Big Win Celebration Modal */}
      {showBigWinModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative mx-4 max-w-sm w-full">
            {/* Glowing background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-3xl blur-xl opacity-50 animate-pulse" />
            
            <div className="relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-3xl p-6 border-2 border-yellow-500/50 shadow-2xl overflow-hidden">
              {/* Sparkle effects */}
              <div className="absolute top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
              <div className="absolute top-8 right-8 w-1.5 h-1.5 bg-orange-400 rounded-full animate-ping" style={{ animationDelay: "0.3s" }} />
              <div className="absolute bottom-12 left-8 w-1 h-1 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: "0.6s" }} />
              <div className="absolute bottom-8 right-12 w-2 h-2 bg-orange-300 rounded-full animate-ping" style={{ animationDelay: "0.9s" }} />
              
              {/* Trophy Icon */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="text-7xl animate-bounce">🏆</div>
                  <div className="absolute -top-2 -right-2 text-2xl animate-spin" style={{ animationDuration: "3s" }}>✨</div>
                  <div className="absolute -bottom-1 -left-2 text-xl animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }}>⭐</div>
                </div>
              </div>
              
              {/* Title */}
              <h2 className="text-center text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 mb-2">
                🎊 বিশাল জয়! 🎊
              </h2>
              <p className="text-center text-gray-400 text-sm mb-4">অভিনন্দন! আপনি বড় জিতেছেন!</p>
              
              {/* Win Amount */}
              <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 rounded-2xl p-4 mb-4 border border-yellow-500/30">
                <p className="text-center text-gray-400 text-xs mb-1">মোট জয়ের পরিমাণ</p>
                <p className="text-center text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  ৳{bigWinAmount.toFixed(2)}
                </p>
              </div>
              
              {/* Celebration emojis */}
              <div className="flex justify-center gap-2 mb-4 text-2xl">
                <span className="animate-bounce" style={{ animationDelay: "0s" }}>🎉</span>
                <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>💰</span>
                <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>🎊</span>
                <span className="animate-bounce" style={{ animationDelay: "0.3s" }}>💎</span>
                <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>🎉</span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                {/* Share Button */}
                <button
                  onClick={async () => {
                    const shareText = `🏆 আমি 5D গেমে ৳${bigWinAmount.toFixed(2)} জিতেছি! 🎉\n\n💰 বড় জয়ের জন্য আজই খেলুন!\n🎮 GoLucky - সেরা গেমিং প্ল্যাটফর্ম`;
                    
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: '🏆 বিশাল জয়! - GoLucky',
                          text: shareText,
                          url: window.location.origin
                        });
                        toast.success("শেয়ার সফল হয়েছে!");
                      } catch (err) {
                        if ((err as Error).name !== 'AbortError') {
                          await navigator.clipboard.writeText(shareText);
                          toast.success("টেক্সট কপি হয়েছে!");
                        }
                      }
                    } else {
                      await navigator.clipboard.writeText(shareText);
                      toast.success("টেক্সট কপি হয়েছে!");
                    }
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                >
                  <Share2 className="w-5 h-5" />
                  শেয়ার করুন
                </button>
                
                {/* Close Button */}
                <button
                  onClick={() => setShowBigWinModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-lg transition-all hover:scale-105 active:scale-95"
                  style={{ background: "linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #dc2626 100%)" }}
                >
                  ✨ অসাধারণ! ✨
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* History animations */}
      <style>{`
        @keyframes historySlideIn {
          0% { opacity: 0; transform: translateX(-20px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes statusPop {
          0% { transform: scale(0); }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes winIconBounce {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.2) rotate(-10deg); }
          50% { transform: scale(1) rotate(0deg); }
          75% { transform: scale(1.2) rotate(10deg); }
        }
        @keyframes loseIconShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
      `}</style>
      
      {/* Bet Details Modal */}
      <BetDetailsModal
        open={showBetDetailsModal}
        onOpenChange={setShowBetDetailsModal}
        bet={selectedBetDetails}
        gameType="5D"
      />

      {/* First Deposit Bonus Banner */}
      <FirstDepositBonusBanner />
    </div>
    </PageScaffold>
  );
};

export default FiveD;
