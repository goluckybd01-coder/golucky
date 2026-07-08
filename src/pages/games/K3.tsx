import React, { useState, useEffect, useCallback, useRef, forwardRef, useMemo } from "react";
import PageScaffold from "@/components/templates/PageScaffold";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Wallet, ChevronLeft, ChevronRight, Minus, Plus, Check, Headphones, Receipt, Share2, Sparkles, Loader2 } from "lucide-react";
import VolumeControl from "@/components/game/VolumeControl";
import { useGameSounds } from "@/hooks/useGameSounds";
import { useWalletDB } from "@/hooks/useWalletDB";
import { useGameBets } from "@/hooks/useGameBets";
import { useAIPrediction } from "@/hooks/useAIPrediction";
import { toast } from "sonner";
import { formatPayout } from "@/lib/payout";
import { formatTaka } from "@/lib/currency";
import { getGameTypeLabel } from "@/lib/tradeId";
import ResultModal from "@/components/game/ResultModal";
import GameMessageBar from "@/components/game/GameMessageBar";
import HowToPlayModal from "@/components/game/HowToPlayModal";
import BetPlacedAnimation from "@/components/BetPlacedAnimation";
import BetSheet from "@/components/game/BetSheet";
import K3DiceBoard from "@/components/game/K3DiceBoard";
import K3RecentResultsStrip from "@/components/game/K3RecentResultsStrip";
import K3SumBallGrid from "@/components/game/K3SumBallGrid";
import { ThreeSamePanel, TwoSamePanel, DifferentPanel } from "@/components/game/K3BettingPanels";
import BetSummaryModal from "@/components/game/BetSummaryModal";
import MultiBetResultModal, { type MultiBetResult } from "@/components/game/MultiBetResultModal";

import Confetti from "@/components/Confetti";
import WinAmountDisplay from "@/components/WinAmountDisplay";
import LoseDisplay from "@/components/LoseDisplay";
import { k3HowToPlay } from "@/content/k3HowToPlay";
import { AIPredictionHistory } from "@/components/game/AIPredictionHistory";
import { autoVerifyPredictions } from "@/lib/autoVerifyPredictions";
import { settleBetsDB } from "@/lib/gameHistoryService";
import BetHistoryFilters, { filterAndSortBetHistory, type FilterStatus, type SortOption, type DateRange } from "@/components/game/BetHistoryFilters";
import BetHistoryChart from "@/components/game/BetHistoryChart";
import ClearPendingButton from "@/components/game/ClearPendingButton";
import HistoryPagination, { usePagination } from "@/components/game/HistoryPagination";
import { CopyablePeriod } from "@/components/game/CopyablePeriod";
import { BetDetailsModal, type BetDetails } from "@/components/game/BetDetailsModal";
import {
  loadMyHistory,
  saveMyHistory,
  getRoundResult,
  type BetHistoryItem,
  type PendingBet,
  type ResultData,
  type RoundResult,
} from "@/lib/gameStorage";
import { makeRoundKey, getDurationFromGameType, type K3Duration } from "@/lib/k3RoundKey";
import { getPeriodFromRoundKey, generatePeriodHistory, type GameMode } from "@/lib/periodNumber";
import { FirstDepositBonusBanner } from "@/components/FirstDepositBonusBanner";
import { 
  startK3Engine, 
  getCurrentRoundKey, 
  getRemainingSeconds,
  generateK3Dice,
  getK3PatternType,
  type K3EngineCallbacks,
  type K3ResultEvent,
} from "@/lib/k3RoundEngine";
import {
  makeBetKey,
  isBetKeyExists,
  markBetKeyPlaced,
  getBetBreakdown,
} from "@/lib/betFees";
import { supabase } from "@/integrations/supabase/client";
import LiveBetsFeed from "@/components/game/LiveBetsFeed";
import Leaderboard from "@/components/game/Leaderboard";
import { getAdminSetResult, parseK3Result } from "@/lib/adminResultService";

const GAME_NAME = "k3" as const;

const gameTypes = [
  { id: "1min", label: "K3 Lotre", sublabel: "1Min", duration: 60 },
  { id: "3min", label: "K3 Lotre", sublabel: "3Min", duration: 180 },
  { id: "5min", label: "K3 Lotre", sublabel: "5Min", duration: 300 },
  { id: "10min", label: "K3 Lotre", sublabel: "10Min", duration: 600 },
];

// Trade ID now derived from engine's roundKey
const extractTradeIdFromRoundKey = (roundKey: string): string => {
  // roundKey format: K3:{duration}:{roundStartMs}
  const parts = roundKey.split(":");
  return parts[2] || roundKey;
};

// 3D Dice component - larger size matching screenshot
interface Dice3DProps {
  value: number;
  size?: number;
}

const Dice3D = forwardRef<HTMLDivElement, Dice3DProps>(({ value, size = 72 }, ref) => {
  const dotPositions: Record<number, number[][]> = {
    1: [[50, 50]],
    2: [[28, 28], [72, 72]],
    3: [[28, 28], [50, 50], [72, 72]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]],
    5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[28, 28], [72, 28], [28, 50], [72, 50], [28, 72], [72, 72]],
  };

  const dots = dotPositions[value] || dotPositions[1];
  const dotSize = size * 0.16;

  return (
    <div
      ref={ref}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(145deg, #ef4444 0%, #dc2626 40%, #b91c1c 100%)",
        borderRadius: size * 0.18,
        position: "relative",
        boxShadow: `
          0 ${size * 0.08}px ${size * 0.15}px rgba(0,0,0,0.4),
          inset 0 ${size * 0.03}px ${size * 0.05}px rgba(255,255,255,0.3),
          inset 0 -${size * 0.02}px ${size * 0.04}px rgba(0,0,0,0.2)
        `,
        flexShrink: 0,
      }}
    >
      {/* Glossy top highlight */}
      <div
        style={{
          position: "absolute",
          top: size * 0.06,
          left: size * 0.12,
          right: size * 0.12,
          height: size * 0.25,
          background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%)",
          borderRadius: size * 0.12,
        }}
      />
      {/* Dots */}
      {dots.map((pos, idx) => (
        <div
          key={idx}
          style={{
            position: "absolute",
            left: `${pos[0]}%`,
            top: `${pos[1]}%`,
            transform: "translate(-50%, -50%)",
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            background: "linear-gradient(145deg, #fef08a 0%, #fde047 40%, #facc15 100%)",
            boxShadow: `inset 0 -${dotSize * 0.15}px ${dotSize * 0.2}px rgba(0,0,0,0.25), 0 ${dotSize * 0.1}px ${dotSize * 0.15}px rgba(0,0,0,0.15)`,
          }}
        />
      ))}
    </div>
  );
});
Dice3D.displayName = "Dice3D";

// Mini dice for table display - larger size
interface MiniDiceProps {
  value: number;
  size?: number;
}

const MiniDice = forwardRef<HTMLDivElement, MiniDiceProps>(({ value, size = 22 }, ref) => {
  const dotPositions: Record<number, number[][]> = {
    1: [[50, 50]],
    2: [[30, 30], [70, 70]],
    3: [[30, 30], [50, 50], [70, 70]],
    4: [[30, 30], [70, 30], [30, 70], [70, 70]],
    5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
    6: [[30, 30], [70, 30], [30, 50], [70, 50], [30, 70], [70, 70]],
  };

  const dots = dotPositions[value] || dotPositions[1];
  const dotSize = size * 0.18;

  return (
    <div
      ref={ref}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(145deg, #ef4444 0%, #dc2626 100%)",
        borderRadius: size * 0.22,
        position: "relative",
        flexShrink: 0,
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }}
    >
      {dots.map((pos, idx) => (
        <div
          key={idx}
          style={{
            position: "absolute",
            left: `${pos[0]}%`,
            top: `${pos[1]}%`,
            transform: "translate(-50%, -50%)",
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            background: "#fde047",
          }}
        />
      ))}
    </div>
  );
});
MiniDice.displayName = "MiniDice";

// K3 number ball with glossy 3D effect - larger size
interface K3NumberBallProps {
  num: number;
  size?: number;
}

const K3NumberBall = forwardRef<HTMLDivElement, K3NumberBallProps>(({ num, size = 52 }, ref) => {
  const isSmall = num <= 10; // 3-10 = green (small), 11-18 = red (big)
  const ringColor = isSmall ? "#22c55e" : "#ef4444";
  const innerBg = isSmall 
    ? "linear-gradient(180deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)"
    : "linear-gradient(180deg, #f87171 0%, #ef4444 50%, #dc2626 100%)";

  return (
    <div
      ref={ref}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `3px solid ${ringColor}`,
        background: innerBg,
        boxShadow: `
          inset 0 -${size * 0.06}px ${size * 0.1}px rgba(0,0,0,0.3),
          inset 0 ${size * 0.06}px ${size * 0.1}px rgba(255,255,255,0.4),
          0 ${size * 0.04}px ${size * 0.08}px rgba(0,0,0,0.2)
        `,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* Glossy highlight */}
      <div
        style={{
          position: "absolute",
          top: size * 0.08,
          left: size * 0.15,
          width: size * 0.4,
          height: size * 0.25,
          background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)",
          borderRadius: "50%",
        }}
      />
      <span
        style={{
          color: "#fff",
          fontWeight: 700,
          fontSize: size * 0.4,
          textShadow: "0 1px 3px rgba(0,0,0,0.4)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {num}
      </span>
    </div>
  );
});
K3NumberBall.displayName = "K3NumberBall";

// K3 number odds (sum 3-18)
const K3_NUMBER_ODDS: Record<number, number> = {
  3: 207.36, 4: 69.12, 5: 34.56, 6: 20.74,
  7: 13.83, 8: 9.88, 9: 8.3, 10: 7.68,
  11: 7.68, 12: 8.3, 13: 9.88, 14: 13.83,
  15: 20.74, 16: 34.56, 17: 69.12, 18: 207.36,
};

// Generate random dice values (1-6 each) - for display animation only
const generateDiceResults = (): [number, number, number] => {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
};

// Get pattern type from dice results - now imported from engine
// const getPatternType = getK3PatternType;

// Per-mode state type - simplified, engine manages timing
interface ModeState {
  roundKey: string;
  history: any[];
  myHistory: BetHistoryItem[];
}

const K3 = () => {
  const navigate = useNavigate();
  const [selectedGameType, setSelectedGameType] = useState("1min");
  const [selectedBetTab, setSelectedBetTab] = useState<"total" | "2same" | "3same" | "different">("total");
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectedBigSmallOddEven, setSelectedBigSmallOddEven] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"history" | "chart" | "myHistory" | "liveBets" | "leaderboard">("history");
  
  // PER-MODE STATE - now uses engine's roundKey, no more targetEnd/tradeId per mode
  const [modeStates, setModeStates] = useState<Record<string, ModeState>>(() => {
    const states: Record<string, ModeState> = {};
    gameTypes.forEach((game) => {
      const history = [];
      // Generate period history for this mode
      const periodHistory = generatePeriodHistory("k3", game.id as GameMode, 10);
      for (let i = 0; i < 10; i++) {
        const dice = generateDiceResults();
        const sum = dice[0] + dice[1] + dice[2];
        history.push({
          period: periodHistory[i],
          dice,
          sum,
          bigSmall: sum >= 11 ? "Big" : "Small",
          oddEven: sum % 2 === 0 ? "Even" : "Odd",
          pattern: getK3PatternType(dice),
        });
      }
      const duration = getDurationFromGameType(game.id);
      states[game.id] = {
        roundKey: getCurrentRoundKey(duration),
        history,
        myHistory: loadMyHistory(GAME_NAME, game.id),
      };
    });
    return states;
  });
  
  // STRICT STATE MACHINE: PLAYING → REVEAL → SHOW_MODAL → RESETTING → PLAYING
  type RoundState = "PLAYING" | "REVEAL" | "SHOW_MODAL" | "RESETTING";
  const [roundState, setRoundState] = useState<RoundState>("PLAYING");
  const [hasRevealed, setHasRevealed] = useState(false);
  const [countdownDigits, setCountdownDigits] = useState({ d1: 0, d2: 0 });
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [tabTick, setTabTick] = useState(0); // For updating tab countdown displays
  const notifiedModesRef = useRef<Set<string>>(new Set()); // Track which modes have shown notifications
  // Dice rolling animation state
  const [isRolling, setIsRolling] = useState(true);
  const [displayDice, setDisplayDice] = useState<[number, number, number]>(() => generateDiceResults());
  const [finalDice, setFinalDice] = useState<[number, number, number] | null>(null);
  const diceRollIntervalRef = useRef<number | null>(null);
  
  const [howOpen, setHowOpen] = useState(false);
  const [showBetSheet, setShowBetSheet] = useState(false);
  const [betType, setBetType] = useState<"number" | "big" | "small" | "odd" | "even">("number");
  const [betNumber, setBetNumber] = useState<number>(3);
  const [betAmount, setBetAmount] = useState(1);
  const [betMultiplier, setBetMultiplier] = useState("X1");
  const [agreedToRules, setAgreedToRules] = useState(true);
  const [gameHistoryPage, setGameHistoryPage] = useState(1);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showBetSummary, setShowBetSummary] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("game_sound_enabled");
    return saved !== null ? saved === "true" : true;
  });
  const [soundVolume, setSoundVolume] = useState(() => {
    const saved = localStorage.getItem("game_sound_volume");
    return saved !== null ? parseFloat(saved) : 0.7;
  });
  
  // Save sound settings to localStorage
  useEffect(() => {
    localStorage.setItem("game_sound_enabled", String(soundEnabled));
  }, [soundEnabled]);
  
  useEffect(() => {
    localStorage.setItem("game_sound_volume", String(soundVolume));
  }, [soundVolume]);
  
  // Bet placement animation state
  const [showBetAnimation, setShowBetAnimation] = useState(false);
  const [betAnimationData, setBetAnimationData] = useState<{
    betAmount: number;
    betType: string;
    potentialWin: number;
  } | null>(null);
  
  // Filter and sort state for My History
  const [historyFilter, setHistoryFilter] = useState<FilterStatus>("all");
  const [historySort, setHistorySort] = useState<SortOption>("newest");
  const [historyDateRange, setHistoryDateRange] = useState<DateRange>("all");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [showAllModes, setShowAllModes] = useState(false);
  const [myHistoryPage, setMyHistoryPage] = useState(1);
  
  // Bet details modal state
  const [showBetDetailsModal, setShowBetDetailsModal] = useState(false);
  const [selectedBetDetails, setSelectedBetDetails] = useState<BetDetails | null>(null);
  
  // Combined history from all modes
  const allModesHistory = useMemo(() => {
    if (!showAllModes) return [];
    const combined: BetHistoryItem[] = [];
    Object.values(modeStates).forEach(mode => {
      if (mode?.myHistory) combined.push(...mode.myHistory);
    });
    return combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [modeStates, showAllModes]);

  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [resultPhase, setResultPhase] = useState<"reveal" | "outcome">("reveal");
  const [resultDisplayNumber, setResultDisplayNumber] = useState(0);
  
  // Multi-bet result summary modal
  const [showMultiBetModal, setShowMultiBetModal] = useState(false);
  const [multiBetResult, setMultiBetResult] = useState<MultiBetResult | null>(null);
  
  // Confetti celebration for wins
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Win/Lose display states
  const [showWinDisplay, setShowWinDisplay] = useState(false);
  const [showLoseDisplay, setShowLoseDisplay] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  
  // Big win modal state
  const [showBigWinModal, setShowBigWinModal] = useState(false);
  const [bigWinAmount, setBigWinAmount] = useState(0);

  // Refs for timer and timeout management
  const timerIntervalRef = useRef<number | null>(null);
  const didEndRef = useRef<boolean>(false);
  const revealIntervalRef = useRef<number | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);
  const modalTimeoutRef = useRef<number | null>(null);
  const resetTimeoutRef = useRef<number | null>(null);
  const lastTradeIdRef = useRef<string>("");

  const [pendingBets, setPendingBets] = useState<PendingBet[]>([]);

  const currentGame = gameTypes.find((g) => g.id === selectedGameType) || gameTypes[0];
  const currentModeState = modeStates[selectedGameType];
  const currentDuration = getDurationFromGameType(selectedGameType);
  // currentTradeId now derived from engine's roundKey
  const currentRoundKey = currentModeState?.roundKey || getCurrentRoundKey(currentDuration);
  const currentTradeId = extractTradeIdFromRoundKey(currentRoundKey);
  // Period number - unique per game mode
  const currentPeriodNumber = getPeriodFromRoundKey("k3", selectedGameType as GameMode, currentRoundKey);
  const gameHistory = currentModeState?.history || [];
  
  // Pagination for Game History (10 items per page)
  const gameHistoryItemsPerPage = 10;
  const paginatedGameHistory = useMemo(() => {
    const startIndex = (gameHistoryPage - 1) * gameHistoryItemsPerPage;
    return gameHistory.slice(startIndex, startIndex + gameHistoryItemsPerPage);
  }, [gameHistory, gameHistoryPage]);
  const gameHistoryTotalPages = Math.max(1, Math.ceil(gameHistory.length / gameHistoryItemsPerPage));
  
  const { playTick, playWarningTick, playCountdownBeep, playBetPlaced, playResultSound, resetSoundGuard, playRoundEnd, playConfettiBurst, playWin, playLose } = useGameSounds(soundEnabled);
  const lastCountdownBeepRef = useRef<number | null>(null);
  
  // Database-backed wallet and bet history
  const { formattedBalance, placeBet: placeBetWallet, canAfford, isAuthenticated, balance, refreshBalance } = useWalletDB();
  const { bets: dbBets, placeBet: placeBetDB, settleBets, refresh: refreshBets, isLoading: isBetsLoading } = useGameBets("k3");
  
  // Transform database bets to UI format - filter by selected mode or show all
  const myBetHistory = useMemo(() => {
    return dbBets
      .filter(bet => showAllModes || bet.game_mode === selectedGameType)
      .map(bet => ({
        period: bet.trade_id,
        betType: `${bet.bet_type}: ${bet.bet_value}`,
        betAmount: bet.bet_amount,
        multiplier: bet.multiplier,
        potentialWin: bet.potential_win,
        isWin: bet.status === "won" ? true : bet.status === "lost" ? false : null,
        result: bet.result ? parseInt(bet.result) : null,
        payout: bet.payout || 0,
        timestamp: new Date(bet.created_at),
        fee: bet.bet_amount * 0.03, // K3 = 3% fee
        netAmount: bet.bet_amount * 0.97,
        duration: bet.game_mode === "1min" ? 1 : bet.game_mode === "3min" ? 3 : bet.game_mode === "5min" ? 5 : 10,
        roundKey: bet.trade_id,
      })) as BetHistoryItem[];
  }, [dbBets, selectedGameType, showAllModes]);
  
  // Active history based on view mode
  const activeHistory = myBetHistory;

  // AI Prediction hook
  const { isLoading: isAILoading, predictions: aiPredictions, overallInsight: aiInsight, fetchPredictions, clearPredictions } = useAIPrediction();
  
  // Calculate statistics for AI predictions
  const k3Stats = useMemo(() => {
    if (gameHistory.length < 5) return null;
    const sums = gameHistory.slice(0, 30).map((h: any) => h.sum);
    const counts = Array(16).fill(0); // 3-18
    sums.forEach((s: number) => { if (s >= 3 && s <= 18) counts[s - 3]++; });
    
    const hotDigits = counts
      .map((c, i) => ({ num: i + 3, count: c }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(x => x.num);
    const coldDigits = counts
      .map((c, i) => ({ num: i + 3, count: c }))
      .sort((a, b) => a.count - b.count)
      .slice(0, 3)
      .map(x => x.num);
    
    const bigCount = sums.filter((s: number) => s >= 11).length;
    const smallCount = sums.length - bigCount;
    const oddCount = sums.filter((s: number) => s % 2 === 1).length;
    const evenCount = sums.length - oddCount;
    
    const lastThree = sums.slice(0, 3);
    const trend: "UP" | "DOWN" | "STABLE" = lastThree.length >= 2 
      ? (lastThree[0] > lastThree[1] ? "UP" : lastThree[0] < lastThree[1] ? "DOWN" : "STABLE")
      : "STABLE";
    
    return {
      hotDigits,
      coldDigits,
      missing: counts.map((c, i) => i + 3).filter(n => !sums.slice(0, 10).includes(n)),
      trend,
      bigSmallRatio: { 
        big: Math.round((bigCount / sums.length) * 100), 
        small: Math.round((smallCount / sums.length) * 100) 
      },
      oddEvenRatio: { 
        odd: Math.round((oddCount / sums.length) * 100), 
        even: Math.round((evenCount / sums.length) * 100) 
      },
    };
  }, [gameHistory]);

  // Helper to update mode state
  const updateModeState = useCallback((modeId: string, updates: Partial<ModeState>) => {
    setModeStates(prev => ({
      ...prev,
      [modeId]: { ...prev[modeId], ...updates },
    }));
  }, []);

  // Dice rolling animation - continuously rolls while playing
  useEffect(() => {
    if (isRolling && roundState === "PLAYING") {
      diceRollIntervalRef.current = window.setInterval(() => {
        // Generate 3 INDEPENDENT random values
        setDisplayDice([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
        ]);
      }, 150); // Roll every 150ms for visual effect
    } else {
      if (diceRollIntervalRef.current !== null) {
        window.clearInterval(diceRollIntervalRef.current);
        diceRollIntervalRef.current = null;
      }
    }
    
    return () => {
      if (diceRollIntervalRef.current !== null) {
        window.clearInterval(diceRollIntervalRef.current);
        diceRollIntervalRef.current = null;
      }
    };
  }, [isRolling, roundState]);

  // Cleanup all timers helper
  const clearAllTimers = useCallback(() => {
    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (revealIntervalRef.current !== null) {
      window.clearInterval(revealIntervalRef.current);
      revealIntervalRef.current = null;
    }
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
    if (modalTimeoutRef.current !== null) {
      window.clearTimeout(modalTimeoutRef.current);
      modalTimeoutRef.current = null;
    }
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    if (diceRollIntervalRef.current !== null) {
      window.clearInterval(diceRollIntervalRef.current);
      diceRollIntervalRef.current = null;
    }
  }, []);

  // Game type change - reset UI state, get time from engine
  useEffect(() => {
    clearAllTimers();
    
    lastTradeIdRef.current = currentRoundKey;
    setPendingBets([]);
    
    setShowResultModal(false);
    setResultData(null);
    setResultPhase("reveal");
    setResultDisplayNumber(0);
    setSelectedNumber(null);
    setSelectedBigSmallOddEven(null);
    setRoundState("PLAYING");
    setHasRevealed(false);
    didEndRef.current = false;
    setIsRolling(true);
    setFinalDice(null);
    
    // Get remaining time from engine
    const remaining = getRemainingSeconds(currentDuration);
    setTimeRemaining(remaining);
    
    resetSoundGuard();
  }, [selectedGameType, currentRoundKey, currentDuration, clearAllTimers, resetSoundGuard]);

  // ============= K3 ENGINE SUBSCRIPTION =============
  // ONE engine drives ALL durations - UI just subscribes
  useEffect(() => {
    const engineCallbacks: K3EngineCallbacks = {
      onTick: (states) => {
        // Update time remaining for selected duration
        const state = states[currentDuration];
        if (state && roundState === "PLAYING") {
          const remaining = Math.ceil(state.remainingMs / 1000);
          setTimeRemaining(remaining);
          
          // Countdown sounds + vibration with tick-tick effect
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
          } else if (remaining > 5 && remaining <= 10) {
            if (lastCountdownBeepRef.current !== remaining) {
              lastCountdownBeepRef.current = remaining;
              if (soundEnabled) playTick();
            }
          } else {
            lastCountdownBeepRef.current = null;
          }
          
          // Detect round about to end (for selected tab)
          if (remaining <= 0 && !didEndRef.current) {
            didEndRef.current = true;
            handleRoundEnd(state.roundKey);
          }
          
          // Update roundKey in modeState if changed
          if (state.roundKey !== currentModeState?.roundKey) {
            updateModeState(selectedGameType, { roundKey: state.roundKey });
          }
        }
        
        // Also update myHistory for ALL durations when settlements happen
        gameTypes.forEach((game) => {
          const reloadedHistory = loadMyHistory(GAME_NAME, game.id);
          const currentHistory = modeStates[game.id]?.myHistory || [];
          // Only update if there's a change (avoids infinite loops)
          if (JSON.stringify(reloadedHistory) !== JSON.stringify(currentHistory)) {
            updateModeState(game.id, { myHistory: reloadedHistory });
          }
        });
      },
      onRoundEnd: async (duration, roundKey, result) => {
        // Engine settled this round - update UI for ALL durations
        const gameType = `${duration}min`;
        const tradeId = extractTradeIdFromRoundKey(roundKey);
        
        // ============= CHECK FOR ADMIN-SET RESULT FIRST =============
        let finalDice: [number, number, number];
        const adminResult = await getAdminSetResult('k3', gameType, tradeId);
        
        if (adminResult && adminResult.result) {
          const parsedAdmin = parseK3Result(adminResult.result);
          if (parsedAdmin !== null) {
            finalDice = parsedAdmin;
            console.log(`[K3] Using ADMIN-SET result: ${finalDice.join(',')} for ${tradeId}`);
          } else {
            // Fallback to engine result if admin result is invalid
            finalDice = result.dice;
          }
        } else {
          // No admin result - use engine-generated result
          finalDice = result.dice;
        }
        
        const finalSum = finalDice[0] + finalDice[1] + finalDice[2];
        const finalBigSmall = finalSum >= 11 ? "Big" : "Small";
        const finalOddEven = finalSum % 2 === 1 ? "Odd" : "Even";
        
        // Reload myHistory for this duration
        const reloadedHistory = loadMyHistory(GAME_NAME, gameType);
        updateModeState(gameType, { myHistory: reloadedHistory });
        
        // Update game history for this duration with final result
        const newHistoryItem = {
          period: tradeId,
          dice: finalDice,
          sum: finalSum,
          bigSmall: finalBigSmall,
          oddEven: finalOddEven,
          pattern: finalDice ? getK3PatternType(finalDice) : "3 different numbers",
        };
        
        const currentHistory = modeStates[gameType]?.history || [];
        updateModeState(gameType, {
          history: [newHistoryItem, ...currentHistory.slice(0, 10)],
        });
        
        // ============= CALL USER-SIDE SETTLEMENT =============
        try {
          const settleResult = await settleBetsDB(
            tradeId,
            "k3",
            gameType,
            JSON.stringify(finalDice)
          );
          
          if (settleResult.success && settleResult.settledCount > 0) {
            console.log(`K3 Settled ${settleResult.settledCount} bets, payouts: ${settleResult.totalPayouts}`);
            // Refresh wallet balance and bets after settlement
            refreshBalance();
            refreshBets(); // Update My Bets with settled results
          }
          
          // Auto-verify AI predictions with the actual result
          if (finalDice) {
            const verified = await autoVerifyPredictions("K3", finalDice);
            if (verified.verified > 0) {
              console.log(`[K3] Auto-verified ${verified.verified} AI prediction(s)`);
            }
          }
        } catch (err) {
          console.error("K3 Settlement call failed:", err);
        }
        
        // If this is the active tab - show result modal with reveal animation
        // Use the engine result for display as it matches the engine's internal state
        if (gameType === selectedGameType && roundState === "PLAYING") {
          // Create a modified result object with the final dice for display
          const displayResult = { ...result, dice: finalDice, sum: finalSum, bigSmall: finalBigSmall as "Big" | "Small", oddEven: finalOddEven as "Odd" | "Even" };
          showRoundResult(displayResult);
        } else {
          // Check if there were bets for this background duration
          const myResolvedBets = reloadedHistory.filter(
            (b: BetHistoryItem) => b.roundKey === roundKey && b.result !== null
          );
          const hasBet = myResolvedBets.length > 0;
          const hasAnyWin = myResolvedBets.some((b: BetHistoryItem) => b.isWin);
          const totalPayout = myResolvedBets.reduce((sum: number, b: BetHistoryItem) => sum + (b.payout || 0), 0);
          
          // Show toast with result info
          const game = gameTypes.find(g => g.id === gameType);
          if (hasBet) {
            toast(hasAnyWin ? `🎉 K3 ${game?.sublabel || gameType} - You Won!` : `😔 K3 ${game?.sublabel || gameType} - Better luck next time`, {
              description: `Dice: ${result.dice?.join(", ")} | Sum: ${result.sum} (${result.bigSmall})${hasAnyWin ? ` | Payout: ৳${totalPayout.toFixed(2)}` : ""}`,
              duration: 5000,
            });
          } else {
            toast(`🎲 K3 ${game?.sublabel || gameType} round completed!`, {
              description: `Dice: ${result.dice?.join(", ")} | Sum: ${result.sum} (${result.bigSmall})`,
              duration: 4000,
            });
          }
        }
      },
    };
    
    // Start engine (singleton - safe to call multiple times)
    const cleanup = startK3Engine(engineCallbacks);
    
    return cleanup;
  }, [currentDuration, selectedGameType, roundState, soundEnabled, playTick, playWarningTick, updateModeState, modeStates, currentModeState?.roundKey]);

  // ============= K3_RESULT EVENT LISTENER (UI update only) =============
  // Global result modal + sound + confetti are handled in MainLayout via GLOBAL_GAME_RESULT
  // This listener just updates local myHistory state for UI consistency
  useEffect(() => {
    const handleK3Result = (e: Event) => {
      const detail = (e as CustomEvent<K3ResultEvent>).detail;
      if (!detail) return;
      
      // Reload myHistory for this duration to keep UI in sync
      const gameType = `${detail.duration}min`;
      const reloadedHistory = loadMyHistory(GAME_NAME, gameType);
      updateModeState(gameType, { myHistory: reloadedHistory });
    };
    
    window.addEventListener("K3_RESULT", handleK3Result);
    return () => window.removeEventListener("K3_RESULT", handleK3Result);
  }, [updateModeState]);

  // Start next round - defined first since used by other callbacks
  const startNextRound = useCallback(() => {
    setRoundState("RESETTING");
    setShowResultModal(false);
    setResultData(null);
    setResultPhase("reveal");
    setResultDisplayNumber(0);
    
    setTimeout(() => {
      const newRoundKey = getCurrentRoundKey(currentDuration);
      lastTradeIdRef.current = newRoundKey;
      
      updateModeState(selectedGameType, { roundKey: newRoundKey });
      
      setTimeRemaining(getRemainingSeconds(currentDuration));
      setHasRevealed(false);
      didEndRef.current = false;
      setFinalDice(null);
      setIsRolling(true);
      setRoundState("PLAYING");
    }, 300);
  }, [currentDuration, selectedGameType, updateModeState]);

  // Show round result modal - ALWAYS shows result first, then win/lose
  const showRoundResult = useCallback((result: RoundResult) => {
    setIsRolling(false);
    if (result.dice) {
      setFinalDice(result.dice);
      setDisplayDice(result.dice);
    }
    
    setCountdownDigits({ 
      d1: Math.floor(result.sum / 10), 
      d2: result.sum % 10 
    });
    
    // Update game history
    const newHistoryItem = {
      period: extractTradeIdFromRoundKey(result.roundKey || currentRoundKey),
      dice: result.dice,
      sum: result.sum,
      bigSmall: result.bigSmall,
      oddEven: result.oddEven,
      pattern: result.dice ? getK3PatternType(result.dice) : "3 different numbers",
    };
    
    updateModeState(selectedGameType, {
      history: [newHistoryItem, ...gameHistory.slice(0, 10)],
      myHistory: loadMyHistory(GAME_NAME, selectedGameType),
    });
    
    // Clear pending bets for this round
    setPendingBets(prev => prev.filter(b => b.roundKey !== result.roundKey));
    
    // PHASE 1: Show result reveal animation
    revealTimeoutRef.current = window.setTimeout(() => {
      setRoundState("SHOW_MODAL");
      
      // Check if user had any bets for this round
      const reloadedMyHistory = loadMyHistory(GAME_NAME, selectedGameType);
      const myResolvedBets = reloadedMyHistory.filter(
        (b: BetHistoryItem) => b.roundKey === result.roundKey && b.result !== null
      );
      const hasBet = myResolvedBets.length > 0;
      const hasAnyWin = myResolvedBets.some((b: BetHistoryItem) => b.isWin);
      const totalPayout = myResolvedBets.reduce((sum: number, b: BetHistoryItem) => sum + (b.payout || 0), 0);
      const totalBetAmount = myResolvedBets.reduce((sum: number, b: BetHistoryItem) => sum + b.betAmount, 0);
      
      const resultDataObj: ResultData = {
        gameType: selectedGameType,
        tradeId: extractTradeIdFromRoundKey(result.roundKey || currentRoundKey),
        number: result.sum,
        colors: [],
        bigSmall: result.bigSmall,
        hasBet,
        isWin: hasAnyWin,
        finalPayout: totalPayout,
        betAmount: totalBetAmount,
        dice: result.dice,
      };
      
      setResultData(resultDataObj);
      setResultPhase("reveal"); // Start with reveal animation
      setResultDisplayNumber(Math.floor(Math.random() * 16) + 3);
      setShowResultModal(true);
      
      // Animate reveal phase (spinning numbers)
      if (revealIntervalRef.current !== null) window.clearInterval(revealIntervalRef.current);
      revealIntervalRef.current = window.setInterval(() => {
        setResultDisplayNumber(Math.floor(Math.random() * 16) + 3);
      }, 60);
      
      // PHASE 2: After reveal animation, show final result or win/lose
      window.setTimeout(() => {
        if (revealIntervalRef.current !== null) {
          window.clearInterval(revealIntervalRef.current);
          revealIntervalRef.current = null;
        }
        setResultDisplayNumber(result.sum);
        setResultPhase("outcome"); // Show outcome (result details or win/lose)
        
        // Play sound and show confetti/win/lose display for bet result
        if (hasBet) {
          // Trigger win/lose display
          if (hasAnyWin) {
            setWinAmount(totalPayout);
            setShowConfetti(true);
            setShowWinDisplay(true);
            
            // Show big win modal for ৳1000+ wins (auto-close after 5s)
            if (totalPayout >= 1000) {
              setBigWinAmount(totalPayout);
              setShowBigWinModal(true);
              setTimeout(() => setShowBigWinModal(false), 5000);
            }
          } else {
            setShowLoseDisplay(true);
          }
        }
      }, 650);
      
      // Auto-close modal and start next round
      resetTimeoutRef.current = window.setTimeout(() => {
        startNextRound();
      }, hasBet ? 4000 : 3000); // Give more time for win/lose display
    }, 400);
  }, [selectedGameType, currentRoundKey, gameHistory, updateModeState, playResultSound, startNextRound]);

  // Handle round end for selected tab (UI animation)
  const handleRoundEnd = useCallback((roundKey: string) => {
    if (soundEnabled) playRoundEnd();
    
    // TRANSITION: PLAYING → REVEAL
    setRoundState("REVEAL");
    setHasRevealed(true);
    setIsRolling(true);
    
    // After 2.5s, show final result
    modalTimeoutRef.current = window.setTimeout(() => {
      // Get result from cache (engine already saved it)
      const result = getRoundResult("k3", roundKey);
      if (result) {
        showRoundResult(result);
      } else {
        // Fallback: generate dice for display
        const dice = generateK3Dice();
        const sum = dice[0] + dice[1] + dice[2];
        setIsRolling(false);
        setFinalDice(dice);
        setDisplayDice(dice);
        setCountdownDigits({ d1: Math.floor(sum / 10), d2: sum % 10 });
        startNextRound();
      }
    }, 2500);
  }, [soundEnabled, playRoundEnd, showRoundResult, startNextRound]);

  // Update tab displays every second (lightweight, no settlement logic)
  // Tab tick update for display only (engine handles settlement)
  useEffect(() => {
    const interval = window.setInterval(() => {
      setTabTick(t => t + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      m1: Math.floor(mins / 10),
      m2: mins % 10,
      s1: Math.floor(secs / 10),
      s2: secs % 10,
    };
  }, []);

  const time = formatTime(timeRemaining);

  // Extended bet types for K3 including 3same, 2same, different, consecutive
  type K3BetType = "number" | "big" | "small" | "odd" | "even" | "3same-all" | "3same-single" | "2same-multiple" | "2same-single" | "3different" | "2different" | "consecutive";
  
  const [advancedBetType, setAdvancedBetType] = useState<K3BetType>("number");
  const [advancedBetValue, setAdvancedBetValue] = useState<string>("");
  const [advancedBetOdds, setAdvancedBetOdds] = useState<number>(1);

  const openBetSheet = (type: K3BetType, numberOrValue?: number | string, odds?: number) => {
    setAdvancedBetType(type);
    setBetType(type as any);
    
    if (type === "number" && typeof numberOrValue === "number") {
      setBetNumber(numberOrValue);
      setAdvancedBetValue(String(numberOrValue));
      setAdvancedBetOdds(K3_SUM_ODDS[numberOrValue] || 2);
    } else if (typeof numberOrValue === "string") {
      setAdvancedBetValue(numberOrValue);
      setAdvancedBetOdds(odds || 1);
    }
    setShowBetSheet(true);
  };

  // K3 sum odds lookup
  const K3_SUM_ODDS: Record<number, number> = {
    3: 207.36, 4: 69.12, 5: 34.56, 6: 20.74,
    7: 13.83, 8: 9.88, 9: 8.3, 10: 7.68,
    11: 7.68, 12: 8.3, 13: 9.88, 14: 13.83,
    15: 20.74, 16: 34.56, 17: 69.12, 18: 207.36,
  };

  const handleCloseResultModal = () => {
    setShowResultModal(false);
    setResultData(null);
    setResultPhase("reveal");
    setResultDisplayNumber(0);
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  };

  return (
    <PageScaffold
      title="K3 Lottery | GoLucky"
      description="Play K3 dice lottery — bet on sums, patterns, and combinations."
      canonicalPath="/game/k3"
      fullWidth
    >
    <div className="flex flex-col" style={{ height: "100dvh", background: "#0B1426" }}>
      {/* Win Confetti Celebration - with intensity based on amount */}
      <Confetti 
        isActive={showConfetti} 
        duration={2500} 
        intensity={winAmount >= 5000 ? "big" : winAmount >= 500 ? "medium" : "small"} 
      />
      
      {/* Win Display with sound */}
      <WinAmountDisplay 
        show={showWinDisplay}
        amount={winAmount} 
        intensity={winAmount >= 5000 ? "big" : winAmount >= 500 ? "medium" : "small"}
        onShow={() => {
          if (soundEnabled) playWin(winAmount);
        }}
        onComplete={() => {
          setShowWinDisplay(false);
          setShowConfetti(false);
        }} 
      />

      {/* Lose Display with sound */}
      <LoseDisplay 
        show={showLoseDisplay}
        onShow={() => {
          if (soundEnabled) playLose();
        }}
        onComplete={() => setShowLoseDisplay(false)} 
      />
      
      {/* Header - Orange */}
      <header 
        className="flex items-center justify-between px-4 shrink-0"
        style={{ 
          background: "linear-gradient(180deg, #f97316 0%, #ea580c 100%)",
          height: 48,
        }}
      >
        <button onClick={() => navigate("/home")} className="p-1">
          <ArrowLeft className="text-white" size={22} />
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
        <div className="flex items-center gap-3">
          <button className="p-1">
            <Headphones className="text-white" size={20} />
          </button>
          <VolumeControl
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            soundVolume={soundVolume}
            setSoundVolume={setSoundVolume}
            buttonSize={20}
          />
        </div>
      </header>

      {/* Main scrollable container */}
      <div className="flex-1 overflow-y-auto">
        {/* Compact Wallet Card */}
        <div className="mx-3 mt-2 mb-2">
          <div
            className="rounded-xl px-3 py-2"
            style={{
              background: "linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="text-orange-400" size={14} />
                <span className="text-white text-lg font-bold">{formattedBalance}</span>
              </div>
              <div className="flex gap-1.5">
                <button className="px-3 py-1.5 rounded-full font-semibold text-xs text-white" style={{ background: "linear-gradient(180deg, #f87171 0%, #ef4444 100%)" }}>
                  Withdraw
                </button>
                <button className="px-3 py-1.5 rounded-full font-semibold text-xs text-white" style={{ background: "linear-gradient(180deg, #4ade80 0%, #22c55e 100%)" }}>
                  Deposit
                </button>
              </div>
            </div>
          </div>
        </div>

      {/* Compact Game Duration Tabs */}
      <div className="px-3 py-1.5">
        <div className="flex gap-1.5">
          {gameTypes.map((game) => {
            const isActive = selectedGameType === game.id;
            const modeRemaining = getRemainingSeconds(game.duration as K3Duration);
            const isUrgent = modeRemaining <= 10;
            
            return (
              <button
                key={game.id}
                onClick={() => {
                  setSelectedGameType(game.id);
                  setTimeRemaining(getRemainingSeconds(game.duration as K3Duration));
                }}
                className="flex-1 flex flex-col items-center py-1.5 rounded-lg transition-all relative"
                style={{
                  background: isActive ? "linear-gradient(135deg, #fb923c 0%, #f97316 100%)" : "#1E3A5F",
                  boxShadow: isActive ? "0 2px 6px rgba(249,115,22,0.35)" : "none",
                }}
              >
                {!isActive && modeRemaining > 0 && (
                  <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${isUrgent ? "bg-red-500 animate-pulse" : "bg-green-500"}`} />
                )}
                <span style={{ fontSize: 14 }}>🎲</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: isActive ? "#fff" : "#94A3B8" }}>{game.sublabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Compact Period + Timer Row */}
      <div className="px-3 py-1.5">
        <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "#0F1E35", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: "#E2E8F0" }}>{currentPeriodNumber}</span>
            <button onClick={() => setHowOpen(true)} className="text-[10px] text-orange-400">📋 How</button>
          </div>
          <div className="flex items-center gap-2">
            {timeRemaining <= 5 && timeRemaining > 0 && (
              <div className="px-2 py-0.5 rounded-full text-xs font-bold text-white animate-pulse bg-red-500">
                {timeRemaining}s
              </div>
            )}
            <div className="flex gap-0.5">
              {[time.m1, time.m2].map((d, i) => (
                <span key={`m${i}`} className="w-5 h-6 rounded flex items-center justify-center font-bold text-sm text-white" style={{ background: "linear-gradient(180deg, #1E3A5F 0%, #0F2744 100%)", border: "1px solid rgba(255,255,255,0.15)" }}>{d}</span>
              ))}
              <span className="text-orange-500 font-bold">:</span>
              {[time.s1, time.s2].map((d, i) => (
                <span key={`s${i}`} className="w-5 h-6 rounded flex items-center justify-center font-bold text-sm text-white" style={{ background: "linear-gradient(180deg, #1E3A5F 0%, #0F2744 100%)", border: "1px solid rgba(255,255,255,0.15)" }}>{d}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dice Display Tray - New K3DiceBoard component */}
      <K3DiceBoard
        dice={displayDice}
        isRolling={isRolling}
        timeRemaining={timeRemaining}
        isBettingLocked={roundState !== "PLAYING" || timeRemaining <= 5}
        isRevealPhase={roundState === "REVEAL"}
      />

      {/* Recent K3 results strip */}
      <K3RecentResultsStrip history={gameHistory} />

      {/* Reset swipe hint (dev/test helper) */}
      <div className="mx-3 mt-1 flex justify-end">
        <button
          type="button"
          onClick={() => {
            try { localStorage.removeItem("k3_swipe_hint_dismissed"); } catch { /* ignore */ }
            toast.success("Swipe hint reset — reload to see it again");
          }}
          className="text-[10px] text-gray-500 hover:text-gray-700 underline underline-offset-2"
        >
          Reset swipe hint
        </button>
      </div>

      {/* Betting Section */}
      <div className={`mx-3 rounded-2xl shadow-sm p-4 relative ${timeRemaining <= 5 && timeRemaining > 0 ? "animate-timer-shake" : ""}`} style={{ background: "#0F1E35", border: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Bet Type Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: "total" as const, label: "Total" },
            { id: "2same" as const, label: "2 same" },
            { id: "3same" as const, label: "3 same" },
            { id: "different" as const, label: "Different" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedBetTab(tab.id)}
              className="flex-1 py-2 rounded-full text-xs font-medium transition-all"
              style={{
                background: selectedBetTab === tab.id ? "#f97316" : "#1E3A5F",
                color: selectedBetTab === tab.id ? "#fff" : "#94A3B8",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content based on selectedBetTab */}
        {selectedBetTab === "total" && (
          <>
            {/* Number Grid (3-18) - Sum betting */}
            <K3SumBallGrid
              odds={K3_NUMBER_ODDS}
              selectedNumber={selectedNumber}
              onSelectNumber={(num) => openBetSheet("number", num)}
              disabled={roundState !== "PLAYING" || timeRemaining <= 5}
            />

            {/* Big/Small/Odd/Even Buttons */}
            <div className={`grid grid-cols-4 gap-2 mt-4 ${roundState !== "PLAYING" || timeRemaining <= 5 ? "opacity-50 pointer-events-none" : ""}`}>
              {[
                { id: "big", label: "Big", sub: "1.92X", bg: "linear-gradient(180deg, #fb923c 0%, #f97316 100%)", border: "#ea580c" },
                { id: "small", label: "Small", sub: "1.92X", bg: "linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)", border: "#2563eb" },
                { id: "odd", label: "Odd", sub: "1.92X", bg: "linear-gradient(180deg, #fca5a5 0%, #f87171 100%)", border: "#ef4444" },
                { id: "even", label: "Even", sub: "1.92X", bg: "linear-gradient(180deg, #86efac 0%, #4ade80 100%)", border: "#22c55e" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => openBetSheet(btn.id as any)}
                  disabled={roundState !== "PLAYING" || timeRemaining <= 5}
                  className={`py-2.5 rounded-lg text-white font-bold text-sm flex flex-col items-center min-h-[44px] disabled:cursor-not-allowed ${selectedBigSmallOddEven === btn.id ? "ring-2 ring-yellow-400" : ""}`}
                  style={{ 
                    background: btn.bg,
                    border: `1px solid ${btn.border}`,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  <span>{btn.label}</span>
                  <span className="text-[10px] font-medium opacity-90">{btn.sub}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {selectedBetTab === "3same" && (
          <ThreeSamePanel
            disabled={roundState !== "PLAYING" || timeRemaining <= 5}
            onPlaceBet={(betType, betValue, odds) => {
              openBetSheet(betType as K3BetType, betValue, odds);
            }}
          />
        )}

        {selectedBetTab === "2same" && (
          <TwoSamePanel
            disabled={roundState !== "PLAYING" || timeRemaining <= 5}
            onPlaceBet={(betType, betValue, odds) => {
              openBetSheet(betType as K3BetType, betValue, odds);
            }}
          />
        )}

        {selectedBetTab === "different" && (
          <DifferentPanel
            disabled={roundState !== "PLAYING" || timeRemaining <= 5}
            onPlaceBet={(betType, betValue, odds) => {
              openBetSheet(betType as K3BetType, betValue, odds);
            }}
          />
        )}

        {/* Betting Lock Overlay - Shows during REVEAL phase */}
        {roundState === "REVEAL" && (
          <div className="absolute inset-0 backdrop-blur-sm flex items-center justify-center rounded-2xl z-20 animate-fade-in overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.95) 0%, rgba(124,58,237,0.98) 50%, rgba(109,40,217,0.95) 100%)" }}>
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute w-32 h-32 rounded-full animate-ping" style={{ background: "rgba(255,255,255,0.1)", top: "50%", left: "50%", transform: "translate(-50%, -50%)", animationDuration: "1s" }} />
            </div>
            <div className="text-center relative z-10">
              <div className="flex gap-2 justify-center items-center mb-3">
                <div className="w-14 h-20 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg border border-white/30 animate-pulse">
                  <span className="text-white text-4xl font-bold" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>{countdownDigits.d1}</span>
                </div>
                <div className="w-14 h-20 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg border border-white/30 animate-pulse">
                  <span className="text-white text-4xl font-bold" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>{countdownDigits.d2}</span>
                </div>
              </div>
              <p className="text-white text-sm font-medium">🎲 Rolling dice... 🎲</p>
            </div>
          </div>
        )}
      </div>

      {/* History Tabs */}
      <div className="px-3 mt-4 mb-2">
        <div className="flex rounded-full p-1 shadow-sm" style={{ background: "#0F1E35", border: "1px solid rgba(255,255,255,0.08)" }}>
          {[
            { id: "history" as const, label: "History" },
            { id: "chart" as const, label: "Chart" },
            { id: "myHistory" as const, label: "My Bets" },
            { id: "liveBets" as const, label: "Live" },
            { id: "leaderboard" as const, label: "🏆 Top" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.id ? "linear-gradient(135deg, #FB923C 0%, #F97316 100%)" : "transparent",
                color: activeTab === tab.id ? "#fff" : "#94A3B8",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-3 pb-6">
        {activeTab === "history" && (
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: "#0F1E35", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Table Header */}
            <div 
              className="grid grid-cols-4 py-3 px-4 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #FB923C 0%, #F97316 100%)" }}
            >
              <span>Period</span>
              <span className="text-center">Sum</span>
              <span className="text-center"></span>
              <span className="text-center">Results</span>
            </div>
            {/* Table Rows */}
            <div>
              {paginatedGameHistory.map((row: any, idx: number) => (
                <div 
                  key={idx} 
                  className="grid grid-cols-4 items-center py-3.5 px-4"
                  style={{ borderBottom: idx < paginatedGameHistory.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                >
                  <div style={{ color: "#94A3B8" }}><CopyablePeriod period={row.period} className="" /></div>
                  <span className="text-center text-base font-bold" style={{ color: "#E2E8F0" }}>{row.sum}</span>
                  <span className="text-center text-xs" style={{ color: row.oddEven === "Big" || row.oddEven === "Odd" ? "#FB923C" : "#60A5FA" }}>{row.oddEven}</span>
                  <div className="flex justify-center gap-1.5">
                    {row.dice?.map((d: number, i: number) => (
                      <MiniDice key={i} value={d} size={20} />
                    ))}
                  </div>
                </div>
              ))}
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

        {activeTab === "chart" && (
          <div className="rounded-2xl overflow-hidden shadow-sm p-4" style={{ background: "#0F1E35", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* AI-Powered Prediction Section */}
            <div className="mb-4 p-3 rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)", border: "1px solid #6366f1" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-yellow-400" size={16} />
                  <span className="text-xs font-bold text-white">🤖 AI-Powered Predictions</span>
                </div>
                <button
                  onClick={() => {
                    if (!k3Stats) return;
                    const recentSums = gameHistory.slice(0, 20).map((h: any) => h.sum);
                    fetchPredictions("K3", "SUM", recentSums, k3Stats);
                  }}
                  disabled={isAILoading || !k3Stats}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all disabled:opacity-50"
                  style={{ 
                    background: isAILoading ? "#6b7280" : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    color: "white",
                    boxShadow: isAILoading ? "none" : "0 2px 8px rgba(245, 158, 11, 0.4)"
                  }}
                >
                  {isAILoading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} />
                      Get AI Tips
                    </>
                  )}
                </button>
              </div>
              
              {aiPredictions.length > 0 ? (
                <>
                  {aiInsight && (
                    <div className="mb-2 p-2 rounded-lg bg-white/10 border border-white/20">
                      <p className="text-[10px] text-white/90 text-center">💬 {aiInsight}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {aiPredictions.map((pred, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-white">{pred.title}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {pred.numbers.map((num) => (
                                <span key={num} className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg" style={{ background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)", color: "#1e1b4b" }}>
                                  {num}
                                </span>
                              ))}
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: pred.confidence >= 70 ? "linear-gradient(135deg, #22c55e, #16a34a)" : pred.confidence >= 50 ? "linear-gradient(135deg, #f97316, #ea580c)" : "linear-gradient(135deg, #6b7280, #4b5563)", color: "white" }}>
                              {pred.confidence}%
                            </span>
                          </div>
                        </div>
                        <p className="text-[9px] text-white/70">{pred.description}</p>
                        {pred.reasoning && <p className="text-[8px] text-yellow-400/80 mt-1">💡 {pred.reasoning}</p>}
                      </div>
                    ))}
                  </div>
                  <p className="text-[8px] text-center text-white/50 mt-2 italic">⚠️ AI predictions are for entertainment only. Gamble responsibly.</p>
                  
                  {/* AI Prediction History */}
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <AIPredictionHistory gameType="K3" />
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[10px] text-white/60">
                    {!k3Stats ? "📊 Need more data for AI analysis" : "🎯 Click 'Get AI Tips' to analyze patterns with AI"}
                  </p>
                  
                  {/* Show history even when no current predictions */}
                  <div className="mt-3">
                    <AIPredictionHistory gameType="K3" />
                  </div>
                </div>
              )}
            </div>
            
            {/* Table Header */}
            <div className="grid grid-cols-3 py-3 px-4 text-sm font-semibold text-white rounded-t-lg" style={{ background: "#f97316" }}>
              <span>Period</span>
              <span className="text-center">Results</span>
              <span className="text-right">Number</span>
            </div>
            {/* Table Rows */}
            <div>
              {paginatedGameHistory.map((row: any, idx: number) => (
                <div key={idx} className="grid grid-cols-3 items-center py-3.5 px-4" style={{ borderBottom: idx < paginatedGameHistory.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <CopyablePeriod period={row.period} className="text-gray-600" />
                  <div className="flex justify-center gap-1.5">
                    {row.dice?.map((d: number, i: number) => (
                      <MiniDice key={i} value={d} size={20} />
                    ))}
                  </div>
                  <span className="text-right text-gray-600 text-xs">{row.pattern}</span>
                </div>
              ))}
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

        {activeTab === "myHistory" && (
          <div className="rounded-2xl overflow-hidden shadow-sm p-4" style={{ background: "#0F1E35", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Mode Toggle Header with Clear Pending Button */}
            <div className="flex items-center justify-between gap-2 mb-3 py-1.5 px-3 bg-gradient-to-r from-purple-500/10 to-purple-400/10 rounded-lg border border-purple-200">
              <span className="text-[10px] text-purple-600 font-medium">
                📊 {showAllModes ? "সব মোডের হিস্ট্রি" : `${selectedGameType === "1min" ? "1 মিনিট" : selectedGameType === "3min" ? "3 মিনিট" : selectedGameType === "5min" ? "5 মিনিট" : "10 মিনিট"} মোডের হিস্ট্রি`}
              </span>
              <div className="flex items-center gap-2">
                <ClearPendingButton
                  gameName="k3"
                  gameTypes={gameTypes.map(g => g.id)}
                  onCleared={() => {
                    // Reload my history for all modes
                    gameTypes.forEach((game) => {
                      updateModeState(game.id, { myHistory: loadMyHistory(GAME_NAME, game.id) });
                    });
                  }}
                />
                <button
                  onClick={() => setShowAllModes(!showAllModes)}
                  className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all ${
                    showAllModes 
                      ? "bg-purple-500 text-white shadow-md" 
                      : "bg-white text-purple-600 border border-purple-300 hover:bg-purple-50"
                  }`}
                >
                  {showAllModes ? "✓ সব মোড" : "সব মোড দেখুন"}
                </button>
              </div>
            </div>

            {/* Win/Loss Chart */}
            {activeHistory.length > 0 && (
              <BetHistoryChart history={activeHistory} className="mb-3" />
            )}

            {/* Filter and Sort Controls */}
            {activeHistory.length > 0 && (
              <BetHistoryFilters
                onFilterChange={setHistoryFilter}
                onSortChange={setHistorySort}
                onDateRangeChange={setHistoryDateRange}
                onSearchChange={setHistorySearchQuery}
                currentFilter={historyFilter}
                currentSort={historySort}
                currentDateRange={historyDateRange}
                searchQuery={historySearchQuery}
                totalCount={activeHistory.length}
                filteredCount={filterAndSortBetHistory(activeHistory, historyFilter, historySort, historyDateRange, historySearchQuery).length}
                filteredHistory={filterAndSortBetHistory(activeHistory, historyFilter, historySort, historyDateRange, historySearchQuery)}
                gameName="K3"
              />
            )}
            
            {activeHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-400 text-sm">{showAllModes ? "কোন বেট নেই" : "এই মোডে কোন বেট নেই"}</p>
                {!showAllModes && <p className="text-gray-300 text-[10px] mt-1">({selectedGameType === "1min" ? "1 মিনিট" : selectedGameType === "3min" ? "3 মিনিট" : selectedGameType === "5min" ? "5 মিনিট" : "10 মিনিট"} মোড)</p>}
              </div>
            ) : filterAndSortBetHistory(activeHistory, historyFilter, historySort, historyDateRange, historySearchQuery).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-gray-400 text-xs">কোন রেজাল্ট পাওয়া যায়নি</p>
              </div>
            ) : (
              (() => {
                const filteredHistory = filterAndSortBetHistory(activeHistory, historyFilter, historySort, historyDateRange, historySearchQuery);
                const itemsPerPage = 10;
                const myHistoryTotalPages = Math.ceil(filteredHistory.length / itemsPerPage);
                const startIdx = (myHistoryPage - 1) * itemsPerPage;
                const paginatedHistory = filteredHistory.slice(startIdx, startIdx + itemsPerPage);
                
                return (
                  <>
                    <div className="space-y-3">
                      {paginatedHistory.map((bet, idx) => (
                        <div 
                          key={idx} 
                          className="rounded-xl p-4 border transition-all duration-300 cursor-pointer hover:shadow-md"
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
                          style={{
                            background: bet.result === null 
                              ? "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)"
                              : bet.isWin 
                                ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" 
                                : "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                            borderColor: bet.result === null ? "#fde047" : bet.isWin ? "#86efac" : "#fca5a5",
                            animation: idx === 0 && bet.result !== null ? "historySlideIn 0.4s ease-out" : "none",
                          }}
                        >
                          <div className="flex items-center justify-between mb-3 pb-3 border-b" style={{ borderColor: bet.result === null ? "#fde047" : bet.isWin ? "#86efac" : "#fca5a5" }}>
                            <div className="flex items-center gap-3">
                              <span className="px-2.5 py-1 rounded text-[10px] font-bold text-white" style={{ background: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)" }}>
                                {bet.duration === 1 ? "1Min" : bet.duration === 3 ? "3Min" : bet.duration === 5 ? "5Min" : bet.duration === 10 ? "10Min" : getGameTypeLabel(selectedGameType)}
                              </span>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400">Trade ID</span>
                                <CopyablePeriod period={bet.period} className="text-gray-600" />
                              </div>
                            </div>
                            {/* Animated Status Badge */}
                            {bet.result !== null ? (
                              <div 
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${bet.isWin ? "bg-green-500" : "bg-red-500"}`}
                                style={{
                                  boxShadow: bet.isWin ? "0 2px 8px rgba(34, 197, 94, 0.4)" : "0 2px 8px rgba(239, 68, 68, 0.4)",
                                  animation: "statusPop 0.3s ease-out",
                                }}
                              >
                                <div className="w-4 h-4 flex items-center justify-center" style={{ animation: bet.isWin ? "winIconBounce 1s ease-in-out infinite" : "loseIconShake 0.5s ease-in-out" }}>
                                  {bet.isWin ? (
                                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#fff" /></svg>
                                  ) : (
                                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" fill="none" /><path d="M8 8L16 16M16 8L8 16" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
                                  )}
                                </div>
                                <span className="text-[11px] font-bold text-white">{bet.isWin ? "WIN!" : "LOSE"}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500" style={{ boxShadow: "0 2px 8px rgba(234, 179, 8, 0.4)" }}>
                                <div className="w-4 h-4 flex items-center justify-center animate-spin">
                                  <svg viewBox="0 0 24 24" className="w-4 h-4"><circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" fill="none" strokeDasharray="40 60" /></svg>
                                </div>
                                <span className="text-[11px] font-bold text-white animate-pulse">PENDING</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-base font-semibold text-gray-800">{bet.betType}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Bet Amount: <span className="font-medium text-gray-700">৳{bet.betAmount.toLocaleString()}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              {bet.result !== null && (
                                <>
                                  <div className="flex items-center justify-end gap-2 mb-1">
                                    <span className="text-xs text-gray-400">Sum:</span>
                                    <K3NumberBall num={bet.result as number} size={28} />
                                  </div>
                                  {bet.isWin && (
                                    <div className="px-2 py-1 rounded-lg" style={{ background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)", border: "1px solid #86efac" }}>
                                      <p className="text-green-700 text-sm font-bold">+{formatPayout(bet.payout)}</p>
                                    </div>
                                  )}
                                  {!bet.isWin && (
                                    <div className="px-2 py-1 rounded-lg" style={{ background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)", border: "1px solid #fca5a5" }}>
                                      <p className="text-red-600 text-sm font-bold">-৳{bet.betAmount.toLocaleString()}</p>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <HistoryPagination
                      currentPage={myHistoryPage}
                      totalPages={myHistoryTotalPages}
                      onPageChange={setMyHistoryPage}
                      itemsPerPage={itemsPerPage}
                      totalItems={filteredHistory.length}
                    />
                  </>
                );
              })()
            )}
          </div>
        )}

        {activeTab === "liveBets" && (
          <div className="rounded-2xl overflow-hidden shadow-sm p-4" style={{ background: "#0F1E35", border: "1px solid rgba(255,255,255,0.08)" }}>
            <LiveBetsFeed gameType="k3" maxItems={12} className="bg-gray-50" />
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: "#0F1E35", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Leaderboard gameType="k3" />
          </div>
        )}
        </div>
      </div>
      {/* End of Main Scrollable Content */}

      {/* Bet Sheet with slide-up animation and backdrop blur */}
      <BetSheet
        isOpen={showBetSheet}
        onClose={() => setShowBetSheet(false)}
        headerTitle={`K3 ${currentGame.sublabel}`}
        headerColor={
          betType === "small" ? "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)" :
          betType === "odd" || betType === "even" ? "linear-gradient(135deg, #c084fc 0%, #a855f7 100%)" :
          "linear-gradient(135deg, #fdba74 0%, #fb923c 100%)"
        }
        timeRemaining={timeRemaining}
        footer={(() => {
          const multiplier = parseInt(betMultiplier.replace("X", ""));
          const totalStake = betAmount * multiplier;
          const feeRate = 0.03;
          const netAmount = totalStake - (totalStake * feeRate);
          const odds = betType === "number" ? 6 : 2;
          const grossWin = netAmount * odds;
          const potentialWin = Math.floor((grossWin - grossWin * 0.02) * 100) / 100;

          return (
            <div className="flex border-t border-gray-100 bg-white">
              <button
                onClick={() => setShowBetSheet(false)}
                className="flex-1 py-4 bg-gray-100 text-gray-600 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // BLOCK betting during countdown (last 5 seconds)
                  if (timeRemaining <= 5) {
                    toast.error("সময় শেষ!", {
                      description: "কাউন্টডাউন চলাকালীন বেট করা যাবে না। পরবর্তী রাউন্ডে চেষ্টা করুন।",
                    });
                    if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Error vibration
                    return;
                  }

                  const multiplier = parseInt(betMultiplier.replace("X", ""));
                  const stake = betAmount;
                  const totalStake = stake * multiplier;

                  // Determine bet type label early for idempotency key
                  let betKind: string = "bigSmall";
                  let betValue: number | string = "Big";

                  // Handle advanced K3 bet types
                  if (
                    advancedBetType.startsWith("3same") ||
                    advancedBetType.startsWith("2same") ||
                    advancedBetType.startsWith("3different") ||
                    advancedBetType.startsWith("2different") ||
                    advancedBetType === "consecutive"
                  ) {
                    betKind = advancedBetType;
                    betValue = advancedBetValue;
                  } else if (betType === "number") {
                    betKind = "number";
                    betValue = betNumber;
                  } else {
                    betKind = "bigSmall";
                    betValue = betType.charAt(0).toUpperCase() + betType.slice(1);
                  }

                  const betTypeLabel =
                    advancedBetType.startsWith("3same") ||
                    advancedBetType.startsWith("2same") ||
                    advancedBetType.startsWith("3different") ||
                    advancedBetType.startsWith("2different") ||
                    advancedBetType === "consecutive"
                      ? `${advancedBetType} ${advancedBetValue}`
                      : betKind === "number"
                        ? `Sum ${betValue}`
                        : String(betValue);

                  // Bet key for tracking (no duplicate prevention - duplicates allowed)
                  const duration = getDurationFromGameType(selectedGameType);
                  const roundKey = makeRoundKey(duration, currentTradeId);
                  const betKey = `K3:${duration}:${roundKey}:${betTypeLabel}:${totalStake}:${Date.now()}`;

                  // Check authentication
                  if (!isAuthenticated) {
                    toast.error("Please login first!", {
                      description: "You need to be logged in to place bets.",
                    });
                    if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Error vibration
                    return;
                  }

                  if (!canAfford(totalStake)) {
                    toast.error("Insufficient balance!", {
                      description: `You need ৳${totalStake.toLocaleString()} but have only ${formattedBalance}`,
                    });
                    if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Error vibration
                    return;
                  }

                  // ============= CALCULATE FEE (K3 = 3%) =============
                  const breakdown = getBetBreakdown(totalStake, "K3");
                  const odds =
                    advancedBetType === "3same-all"
                      ? 30
                      : advancedBetType === "3same-single"
                        ? 180
                        : advancedBetType === "2same-multiple"
                          ? 11
                          : advancedBetType === "2same-single"
                            ? 55
                            : advancedBetType === "3different"
                              ? 30
                              : advancedBetType === "2different"
                                ? 5
                                : advancedBetType === "consecutive"
                                  ? 8
                                  : betType === "number"
                                    ? (K3_SUM_ODDS[betNumber] || 6)
                                    : 1.92;

                  // ============= OPTIMISTIC UI - INSTANT FEEDBACK =============
                  // Show feedback IMMEDIATELY before database save
                  markBetKeyPlaced(betKey);
                  if (soundEnabled) playBetPlaced();

                  // Bet confirmation vibration
                  if (navigator.vibrate) {
                    navigator.vibrate([30, 20, 50]); // Quick "tap-tap" confirmation
                  }
                  if (betType === "number") {
                    setSelectedNumber(betNumber);
                    setSelectedBigSmallOddEven(null);
                  } else {
                    setSelectedBigSmallOddEven(betType);
                    setSelectedNumber(null);
                  }

                  // Set pending bet immediately
                  const newPendingBet: PendingBet = {
                    gameType: selectedGameType,
                    tradeId: currentTradeId,
                    betKind,
                    betValue: betValue as any,
                    stake,
                    multiplier,
                    totalStake,
                    createdAt: new Date().toISOString(),
                    duration,
                    roundKey,
                  };
                  setPendingBets((prev) => [...prev, newPendingBet]);

                  // Add pending entry to myHistory for UI immediately
                  // IMPORTANT: period is for DISPLAY (period number), roundKey is for SETTLEMENT MATCHING
                  const pendingHistoryEntry: BetHistoryItem = {
                    period: currentPeriodNumber, // Human-readable period number for display
                    betType: betTypeLabel,
                    betAmount: totalStake,
                    fee: breakdown.fee,
                    netAmount: breakdown.netAmount,
                    result: null,
                    isWin: null,
                    payout: 0,
                    timestamp: new Date(),
                    duration,
                    roundKey, // CRITICAL: Full roundKey for settlement matching
                    betKey,
                  };

                  const updatedHistory = [pendingHistoryEntry, ...myBetHistory];
                  updateModeState(selectedGameType, { myHistory: updatedHistory });
                  saveMyHistory(GAME_NAME, selectedGameType, updatedHistory);

                  // Trigger bet placed animation IMMEDIATELY
                  setBetAnimationData({
                    betAmount: totalStake,
                    betType: betTypeLabel,
                    potentialWin,
                  });
                  setShowBetAnimation(true);

                  // Close bet sheet IMMEDIATELY
                  setShowBetSheet(false);

                  // ============= OPTIMIZED SINGLE-CALL DATABASE SAVE =============
                  (async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke("place-bet", {
                        body: {
                          gameType: "k3",
                          gameMode: selectedGameType,
                          tradeId: currentTradeId,
                          betType: betKind,
                          betValue: String(betValue),
                          betAmount: totalStake,
                          multiplier: odds,
                          potentialWin: breakdown.netAmount * odds,
                        },
                      });

                      if (error || !data?.success) {
                        const errorMsg = data?.error || error?.message || "Bet failed";
                        toast.error(errorMsg);
                        // Rollback optimistic UI
                        setPendingBets((prev) => prev.filter((b) => b.createdAt !== newPendingBet.createdAt));
                        const rolledBack = myBetHistory.filter((h) => h.betKey !== betKey);
                        updateModeState(selectedGameType, { myHistory: rolledBack });
                        saveMyHistory(GAME_NAME, selectedGameType, rolledBack);
                        return;
                      }

                      refreshBalance();
                      refreshBets();
                    } catch (error) {
                      console.error("Bet save error:", error);
                    }
                  })();
                }}
                className="flex-1 py-4 text-white font-medium text-sm flex flex-col items-center justify-center"
                style={{ background: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)" }}
              >
                <span className="text-xs opacity-90">Bet ৳{totalStake} → Win</span>
                <span className="text-base font-bold">৳{potentialWin.toLocaleString()}</span>
              </button>
            </div>
          );
        })()}
      >
        <div className="p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-800">
              {advancedBetType === "number" ? `Sum ${betNumber}` :
               advancedBetType === "3same-all" ? "🎲 Any Triple (30X)" :
               advancedBetType === "3same-single" ? `🎲 Triple ${advancedBetValue} (180X)` :
               advancedBetType === "2same-multiple" ? `🎲 Pair ${advancedBetValue} (11X)` :
               advancedBetType === "2same-single" ? `🎲 Exact ${advancedBetValue} (55X)` :
               advancedBetType === "3different" ? `🎲 Different ${advancedBetValue} (30X)` :
               advancedBetType === "2different" ? `🎲 Two Different ${advancedBetValue} (5X)` :
               advancedBetType === "consecutive" ? "🎲 Consecutive (8X)" :
               betType.charAt(0).toUpperCase() + betType.slice(1)}
            </h3>
          </div>
              
              <div>
                <p className="text-gray-500 text-sm mb-2">Balance</p>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <Wallet className="text-orange-400" size={20} />
                  <span className="text-lg font-bold text-gray-800">{formattedBalance}</span>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-sm mb-2">Bet Amount</p>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <button onClick={() => setBetAmount(Math.max(1, betAmount - 1))} className="w-9 h-9 rounded-full bg-white shadow flex items-center justify-center">
                    <Minus size={18} className="text-gray-600" />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-xl font-bold text-gray-800">৳ {betAmount}</span>
                  </div>
                  <button onClick={() => setBetAmount(betAmount + 1)} className="w-9 h-9 rounded-full bg-white shadow flex items-center justify-center">
                    <Plus size={18} className="text-gray-600" />
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  {[1, 10, 100, 1000].map((amt) => (
                    <button key={amt} onClick={() => setBetAmount(amt)} className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${betAmount === amt ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                      ৳{amt}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-center gap-2">
                {["X1", "X5", "X10", "X20", "X50", "X100"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setBetMultiplier(m)}
                    className="px-3 py-1.5 rounded text-xs font-medium transition-all"
                    style={{ background: betMultiplier === m ? "#f97316" : "#fff", color: betMultiplier === m ? "#fff" : "#374151", border: betMultiplier === m ? "none" : "1px solid #d1d5db" }}
                  >
                    {m}
                  </button>
                ))}
              </div>
              
              {/* Odds Guide Table */}
              <div 
                className="rounded-lg p-2.5"
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
              >
                <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2 text-center">💰 Payout Odds Guide</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div 
                    className="flex items-center justify-between px-2 py-1.5 rounded"
                    style={{ background: betType === "number" ? "#fef3c7" : "#fff", border: "1px solid #e5e7eb" }}
                  >
                    <span className="text-xs text-gray-600">Sum (3-18)</span>
                    <span className="text-xs font-bold text-orange-500">6x</span>
                  </div>
                  <div 
                    className="flex items-center justify-between px-2 py-1.5 rounded"
                    style={{ background: betType === "big" ? "#fff7ed" : "#fff", border: "1px solid #e5e7eb" }}
                  >
                    <span className="text-xs text-gray-600">📈 Big</span>
                    <span className="text-xs font-bold text-orange-500">2x</span>
                  </div>
                  <div 
                    className="flex items-center justify-between px-2 py-1.5 rounded"
                    style={{ background: betType === "small" ? "#eff6ff" : "#fff", border: "1px solid #e5e7eb" }}
                  >
                    <span className="text-xs text-gray-600">📉 Small</span>
                    <span className="text-xs font-bold text-blue-500">2x</span>
                  </div>
                  <div 
                    className="flex items-center justify-between px-2 py-1.5 rounded"
                    style={{ background: betType === "odd" || betType === "even" ? "#f3e8ff" : "#fff", border: "1px solid #e5e7eb" }}
                  >
                    <span className="text-xs text-gray-600">Odd/Even</span>
                    <span className="text-xs font-bold text-purple-500">2x</span>
                  </div>
                </div>
                <p className="text-[9px] text-gray-400 text-center mt-1.5">* 3% service fee applies on all K3 bets</p>
              </div>
              
              {/* Potential Win Display */}
              {(() => {
                const multiplier = parseInt(betMultiplier.replace("X", ""));
                const totalStake = betAmount * multiplier;
                const feeRate = 0.03; // K3 = 3% fee
                const fee = Math.round(totalStake * feeRate * 100) / 100;
                const netAmount = totalStake - fee;
                const odds = betType === "number" ? 6 : 2; // Sum: 6x, Big/Small/Odd/Even: 2x
                const grossWin = netAmount * odds;
                const serviceFee = grossWin * 0.02;
                const potentialWin = Math.floor((grossWin - serviceFee) * 100) / 100;
                
                return (
                  <div 
                    className="rounded-xl p-3"
                    style={{ 
                      background: "linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)", 
                      border: "1px solid #fde68a" 
                    }}
                  >
                    <div className="grid grid-cols-2 gap-2 text-center mb-2">
                      <div>
                        <p className="text-[9px] text-gray-500 uppercase">Total Stake</p>
                        <p className="text-sm font-bold text-gray-800">{formatTaka(totalStake, 0)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-500 uppercase">Fee (3%)</p>
                        <p className="text-sm font-bold text-orange-500">-{formatTaka(fee)}</p>
                      </div>
                    </div>
                    <div className="border-t border-amber-200 pt-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase">Net Bet</p>
                          <p className="text-xs font-semibold text-gray-700">{formatTaka(netAmount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-gray-500 uppercase">Potential Win ({odds}x)</p>
                          <p className="text-lg font-bold text-green-600">{formatTaka(potentialWin, 0)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              <div className="flex items-center gap-2">
                <button onClick={() => setAgreedToRules(!agreedToRules)} className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: agreedToRules ? "#f97316" : "#e5e7eb" }}>
                  {agreedToRules && <Check size={10} className="text-white" />}
                </button>
                <span className="text-gray-600 text-sm">I agree</span>
                <button className="text-orange-500 text-sm">(Pre-sale rules)</button>
              </div>
        </div>
      </BetSheet>

      {/* How to Play Modal */}
      <HowToPlayModal
        open={howOpen}
        onClose={() => setHowOpen(false)}
        content={k3HowToPlay}
        title="How to Play K3"
      />

      {/* Result Modal */}
      <ResultModal
        showResultModal={showResultModal}
        resultData={resultData}
        resultPhase={resultPhase}
        resultDisplayNumber={resultDisplayNumber}
        onClose={handleCloseResultModal}
        gameName="K3"
      />

      {/* Bet Summary Modal */}
      <BetSummaryModal
        open={showBetSummary}
        onClose={() => setShowBetSummary(false)}
        pendingBets={pendingBets}
        currentTradeId={currentTradeId}
        gameName="K3"
      />

      {/* Multi-Bet Result Summary Modal */}
      <MultiBetResultModal
        show={showMultiBetModal}
        result={multiBetResult}
        onClose={() => {
          setShowMultiBetModal(false);
          setMultiBetResult(null);
        }}
        gameName="K3"
      />


      {/* Bet Placed Animation */}
      <BetPlacedAnimation
        show={showBetAnimation}
        betAmount={betAnimationData?.betAmount || 0}
        betType={betAnimationData?.betType || ""}
        potentialWin={betAnimationData?.potentialWin || 0}
        onComplete={() => {
          setShowBetAnimation(false);
          setBetAnimationData(null);
        }}
      />

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
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
              <p className="text-center text-gray-400 text-sm mb-4">অভিনন্দন! আপনি K3 গেমে বড় জিতেছেন!</p>
              
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
                    const shareText = `🏆 আমি K3 গেমে ৳${bigWinAmount.toFixed(2)} জিতেছি! 🎉\n\n💰 বড় জয়ের জন্য আজই খেলুন!\n🎮 GoLucky - সেরা গেমিং প্ল্যাটফর্ম`;
                    
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
      
      {/* Bet Details Modal */}
      <BetDetailsModal
        open={showBetDetailsModal}
        onOpenChange={setShowBetDetailsModal}
        bet={selectedBetDetails}
        gameType="K3"
      />

      {/* First Deposit Bonus Banner */}
      <FirstDepositBonusBanner />
    </div>
    </PageScaffold>
  );
};

export default K3;
