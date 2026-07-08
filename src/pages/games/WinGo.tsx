import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import PageScaffold from "@/components/templates/PageScaffold";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Wallet, ChevronRight, Minus, Plus, Check, Volume2, Loader2, Sparkles } from "lucide-react";
import { useGameSounds } from "@/hooks/useGameSounds";
import VolumeControl from "@/components/game/VolumeControl";
import WinGoTrendStrip from "@/components/game/WinGoTrendStrip";
import { useWalletDB } from "@/hooks/useWalletDB";
import { useGameBets } from "@/hooks/useGameBets";
import { useAIPrediction } from "@/hooks/useAIPrediction";
import { toast } from "sonner";
import { formatPayout } from "@/lib/payout";
import { formatTaka } from "@/lib/currency";
import GameMessageBar from "@/components/game/GameMessageBar";
import HowToPlayModal from "@/components/game/HowToPlayModal";
import BetPlacedAnimation from "@/components/BetPlacedAnimation";
import BetSheet from "@/components/game/BetSheet";
import BetPanelContent from "@/components/game/BetPanelContent";
import { wingoHowToPlay } from "@/content/wingoHowToPlay";
import { AIPredictionHistory } from "@/components/game/AIPredictionHistory";
import { autoVerifyPredictions } from "@/lib/autoVerifyPredictions";
import { settleBetsDB } from "@/lib/gameHistoryService";
import BetHistoryFilters, { filterAndSortBetHistory, type FilterStatus, type SortOption, type DateRange } from "@/components/game/BetHistoryFilters";
import { useWingoResultBanner, WINGO_RESULT_EVENT } from "./useWingoResultBanner";
import BetHistoryChart from "@/components/game/BetHistoryChart";
import WinGoChartTab from "@/components/game/WinGoChartTab";
import ClearPendingButton from "@/components/game/ClearPendingButton";
import HistoryPagination, { usePagination } from "@/components/game/HistoryPagination";
import { CopyablePeriod } from "@/components/game/CopyablePeriod";
import { BetDetailsModal, type BetDetails } from "@/components/game/BetDetailsModal";
import {
  loadMyHistory,
  saveMyHistory,
  type BetHistoryItem,
  type PendingBet,
} from "@/lib/gameStorage";
import {
  startWinGoEngine,
  getCurrentRoundKey,
  getRemainingSeconds,
  getDurationFromGameType,
  getGameTypeFromDuration,
  type WinGoDuration,
  type WinGoEngineCallbacks,
} from "@/lib/winGoRoundEngine";
import {
  makeBetKey,
  isBetKeyExists,
  markBetKeyPlaced,
  getBetBreakdown,
} from "@/lib/betFees";
import { getPeriodFromRoundKey, generatePeriodHistory, type GameMode } from "@/lib/periodNumber";
import { supabase } from "@/integrations/supabase/client";
import LiveBetsFeed from "@/components/game/LiveBetsFeed";
import Leaderboard from "@/components/game/Leaderboard";
import { FirstDepositBonusBanner } from "@/components/FirstDepositBonusBanner";
import { getAdminSetResult, parseWinGoResult } from "@/lib/adminResultService";
import { fetchApiResultForRound, logWinGoRoundSource } from "@/lib/winGoApiResultService";

const GAME_NAME = "winGo" as const;

const gameTypes = [
  { id: "30sec", label: "Win Go", sublabel: "30Sec", duration: 30 },
  { id: "1min", label: "Win Go", sublabel: "1Min", duration: 60 },
  { id: "3min", label: "Win Go", sublabel: "3Min", duration: 180 },
  { id: "5min", label: "Win Go", sublabel: "5Min", duration: 300 },
];

const getNumberColors = (num: number): string[] => {
  if (num === 0) return ["violet", "red"];
  if (num === 5) return ["violet", "green"];
  if ([1, 3, 7, 9].includes(num)) return ["green"];
  return ["red"];
};

const getNumberTextColor = (num: number): string => {
  if ([1, 3, 7, 9].includes(num)) return "text-green-500";
  if ([2, 4, 6, 8].includes(num)) return "text-red-500";
  return "text-purple-500";
};

// localStorage keys for each game type
const getStorageKeys = (gameType: string) => {
  const typeKey = gameType === "30sec" ? "30s" : gameType === "1min" ? "1m" : gameType === "3min" ? "3m" : "5m";
  return {
    history: `winGo_${typeKey}_history`,
    myHistory: `winGo_${typeKey}_myHistory`,
  };
};

// Generate game history with different seeds per game type - uses period numbers
const generateGameHistory = (gameType: string) => {
  const storageKey = getStorageKeys(gameType).history;
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // Fall through to generate new
    }
  }
  
  const history = [];
  // Generate period history for this mode
  const periodHistory = generatePeriodHistory("winGo", gameType as GameMode, 11);
  const seed = gameType.charCodeAt(0) + gameType.length;
  
  for (let i = 0; i < 11; i++) {
    const num = (seed + i * 7 + Math.floor(seed / 2)) % 10;
    history.push({
      period: periodHistory[i],
      number: num,
      bigSmall: num >= 5 ? "Big" : "Small",
      colors: getNumberColors(num),
    });
  }
  
  localStorage.setItem(storageKey, JSON.stringify(history));
  return history;
};

// Generate statistics for each game type (derived from history)
const generateStatisticsData = (gameType: string) => {
  const seed = gameType.charCodeAt(0) + gameType.length;
  return {
    winning: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    missing: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, i) => (seed + i * 3) % 30),
    avgMissing: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, i) => (seed + i * 4 + 5) % 30),
    frequency: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, i) => (seed + i * 2 + 3) % 20),
    maxConsecutive: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, i) => (seed + i) % 5 + 1),
  };
};

// Generate recent results from history
const generateRecentResults = (gameType: string) => {
  const history = generateGameHistory(gameType);
  return history.slice(0, 5).map((h: { number: number }) => h.number);
};

// Trade ID extracted from engine's roundKey
const extractTradeIdFromRoundKey = (roundKey: string): string => {
  // roundKey format: WinGo:{duration}:{roundStartMs}
  const parts = roundKey.split(":");
  if (parts.length >= 3) {
    const timestamp = parseInt(parts[2]);
    if (!isNaN(timestamp)) {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');
      const secs = String(date.getSeconds()).padStart(2, '0');
      const ms = String(date.getMilliseconds()).padStart(3, '0');
      return `${year}${month}${day}${hours}${mins}${secs}${ms}`;
    }
  }
  return roundKey;
};

// Save game history to localStorage
const saveGameHistory = (gameType: string, history: any[]) => {
  const storageKey = getStorageKeys(gameType).history;
  localStorage.setItem(storageKey, JSON.stringify(history));
};

// Per-mode state interface
interface ModeState {
  roundKey: string;
  history: any[];
  myHistory: BetHistoryItem[];
  recentResults: number[];
}

const multipliers = ["Random", "X1", "X5", "X10", "X20", "X50", "X100"];

// Glossy 3D Number Ball - GoLucky style with DUAL COLOR support
const NumberBall = ({ num, size = "normal" }: { num: number; size?: "normal" | "small" | "tiny" }) => {
  const isTiny = size === "tiny";
  const isSmall = size === "small";
  const ballSize = isTiny ? 18 : isSmall ? 22 : 44;
  const fontSize = isTiny ? 8 : isSmall ? 9 : 16;
  const ringWidth = isTiny ? 1.5 : isSmall ? 2 : 3;

  // Color definitions (matching bet buttons)
  const GREEN = "#22c55e";
  const RED = "#ef4444";
  const VIOLET = "#a855f7";

  // Determine if dual-color ball
  const isDualColor = num === 0 || num === 5;

  // For dual-color: 0 = Red+Violet, 5 = Green+Violet
  // For single-color: 1,3,7,9 = Green, 2,4,6,8 = Red
  let leftColor = "";
  let rightColor = "";
  let singleColor = "";
  let ringColor = "";

  if (num === 0) {
    // Red (left) + Violet (right)
    leftColor = RED;
    rightColor = VIOLET;
    ringColor = RED;
  } else if (num === 5) {
    // Green (left) + Violet (right)
    leftColor = GREEN;
    rightColor = VIOLET;
    ringColor = GREEN;
  } else if ([1, 3, 7, 9].includes(num)) {
    singleColor = GREEN;
    ringColor = GREEN;
  } else {
    singleColor = RED;
    ringColor = RED;
  }

  return (
    <div
      style={{
        width: ballSize,
        height: ballSize,
        borderRadius: "50%",
        border: `${ringWidth}px solid ${ringColor}`,
        boxShadow: `
          inset 0 -2px 4px rgba(0,0,0,0.25),
          inset 0 2px 4px rgba(255,255,255,0.4),
          0 1px 4px rgba(0,0,0,0.2)
        `,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flexShrink: 0,
        overflow: "hidden",
        background: isDualColor ? "transparent" : singleColor,
      }}
    >
      {/* Dual-color split background for 0 and 5 */}
      {isDualColor && (
        <>
          {/* Left half */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "50%",
              height: "100%",
              background: leftColor,
            }}
          />
          {/* Right half */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "50%",
              height: "100%",
              background: rightColor,
            }}
          />
        </>
      )}

      {/* Glossy overlay for 3D effect */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: "50%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 40%, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.15) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Specular highlight */}
      <div
        style={{
          position: "absolute",
          top: isTiny ? 1 : isSmall ? 2 : 4,
          left: isTiny ? 3 : isSmall ? 4 : 8,
          width: isTiny ? 5 : isSmall ? 6 : 12,
          height: isTiny ? 3 : isSmall ? 4 : 7,
          background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)",
          borderRadius: "50%",
        }}
      />

      {/* Number text */}
      <span
        style={{
          color: "#fff",
          fontWeight: 700,
          fontSize,
          textShadow: "0 1px 2px rgba(0,0,0,0.4)",
          position: "relative",
          zIndex: 2,
        }}
      >
        {num}
      </span>
    </div>
  );
};

// SIMPLIFIED STATE - no per-page result modal needed
const WinGo = () => {
  const navigate = useNavigate();
  const [selectedGameType, setSelectedGameType] = useState("30sec");
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedMultiplier, setSelectedMultiplier] = useState("X1");
  const [activeTab, setActiveTab] = useState<"history" | "chart" | "strategy" | "my">("history");
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [statisticsData, setStatisticsData] = useState(() => generateStatisticsData("30sec"));
  const [howOpen, setHowOpen] = useState(false);
  const [showBetSheet, setShowBetSheet] = useState(false);
  const [betType, setBetType] = useState<"big" | "small" | "green" | "violet" | "red" | "number">("big");
  const [betNumber, setBetNumber] = useState<number>(0);
  const [betAmount, setBetAmount] = useState(1);
  const [betMultiplier, setBetMultiplier] = useState("X1");
  const [agreedToRules, setAgreedToRules] = useState(true);
  const [gameHistoryPage, setGameHistoryPage] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("game_sound_enabled");
    return saved !== null ? saved === "true" : true;
  });
  const [soundVolume, setSoundVolume] = useState(() => {
    const saved = localStorage.getItem("game_sound_volume");
    return saved !== null ? parseFloat(saved) : 0.7;
  });
  const [tabTick, setTabTick] = useState(0); // For updating tab countdown displays

  // Result announcement banner
  const resultBanner = useWingoResultBanner();
  
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

  // Save sound settings to localStorage
  useEffect(() => {
    localStorage.setItem("game_sound_enabled", String(soundEnabled));
  }, [soundEnabled]);
  
  useEffect(() => {
    localStorage.setItem("game_sound_volume", String(soundVolume));
  }, [soundVolume]);

  // Per-mode state management - now uses engine's roundKey
  const [modeStates, setModeStates] = useState<Record<string, ModeState>>(() => {
    const initial: Record<string, ModeState> = {};
    gameTypes.forEach(game => {
      const duration = getDurationFromGameType(game.id);
      initial[game.id] = {
        roundKey: getCurrentRoundKey(duration),
        history: generateGameHistory(game.id),
        myHistory: loadMyHistory(GAME_NAME, game.id),
        recentResults: generateRecentResults(game.id),
      };
    });
    return initial;
  });

  // Helper to update a specific mode's state
  const updateModeState = useCallback((modeId: string, updates: Partial<ModeState>) => {
    setModeStates(prev => ({
      ...prev,
      [modeId]: { ...prev[modeId], ...updates }
    }));
  }, []);

  // Current mode state
  const currentModeState = modeStates[selectedGameType];
  const currentDuration = getDurationFromGameType(selectedGameType);
  const currentRoundKey = currentModeState?.roundKey || getCurrentRoundKey(currentDuration);
  const currentTradeId = extractTradeIdFromRoundKey(currentRoundKey);
  // Period number - unique per game mode
  const currentPeriodNumber = getPeriodFromRoundKey("winGo", selectedGameType as GameMode, currentRoundKey);
  const gameHistory = currentModeState?.history || [];
  const recentResults = currentModeState?.recentResults || [];
  
  // Count bets placed in current round (match by roundKey, not period)
  const [pendingBets, setPendingBets] = useState<PendingBet[]>([]);
  
  // Pagination for Game History (10 items per page)
  const gameHistoryItemsPerPage = 10;
  const paginatedGameHistory = useMemo(() => {
    const startIndex = (gameHistoryPage - 1) * gameHistoryItemsPerPage;
    return gameHistory.slice(startIndex, startIndex + gameHistoryItemsPerPage);
  }, [gameHistory, gameHistoryPage]);
  const gameHistoryTotalPages = Math.max(1, Math.ceil(gameHistory.length / gameHistoryItemsPerPage));

  const currentGame = gameTypes.find((g) => g.id === selectedGameType) || gameTypes[0];
  
  // Database Wallet integration
  const { balance, formattedBalance, isLoading: walletLoading, isAuthenticated, refreshBalance } = useWalletDB();
  
  // Database Game Bets integration
  const { bets: dbBets, placeBet: placeDbBet, stats: gameStats, refresh: refreshBets, isLoading: isBetsLoading } = useGameBets("wingo");

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
        fee: bet.bet_amount * 0.02,
        netAmount: bet.bet_amount * 0.98,
        duration: bet.game_mode === "30sec" ? 0.5 : bet.game_mode === "1min" ? 1 : bet.game_mode === "3min" ? 3 : 5,
        roundKey: bet.trade_id,
      })) as BetHistoryItem[];
  }, [dbBets, selectedGameType, showAllModes]);
  
  // Active history based on view mode
  const activeHistory = myBetHistory;
  
  // Count bets placed in current round (match by roundKey, not period)
  const currentRoundBetCount = myBetHistory.filter(bet => bet.roundKey === currentRoundKey).length;
  
  // AI Prediction hook
  const { isLoading: isAILoading, predictions: aiPredictions, overallInsight: aiInsight, fetchPredictions, clearPredictions } = useAIPrediction();
  
  // Calculate statistics for AI predictions
  const wingoStats = useMemo(() => {
    if (gameHistory.length < 5) return null;
    const numbers = gameHistory.slice(0, 30).map((h: any) => h.number);
    const counts = Array(10).fill(0);
    numbers.forEach((n: number) => counts[n]++);
    
    const hotDigits = counts
      .map((c, i) => ({ num: i, count: c }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(x => x.num);
    const coldDigits = counts
      .map((c, i) => ({ num: i, count: c }))
      .sort((a, b) => a.count - b.count)
      .slice(0, 3)
      .map(x => x.num);
    
    const bigCount = numbers.filter((n: number) => n >= 5).length;
    const smallCount = numbers.length - bigCount;
    const oddCount = numbers.filter((n: number) => n % 2 === 1).length;
    const evenCount = numbers.length - oddCount;
    
    const lastThree = numbers.slice(0, 3);
    const trend: "UP" | "DOWN" | "STABLE" = lastThree.length >= 2 
      ? (lastThree[0] > lastThree[1] ? "UP" : lastThree[0] < lastThree[1] ? "DOWN" : "STABLE")
      : "STABLE";
    
    return {
      hotDigits,
      coldDigits,
      missing: [0,1,2,3,4,5,6,7,8,9].filter(n => !numbers.slice(0, 10).includes(n)),
      trend,
      bigSmallRatio: { 
        big: Math.round((bigCount / numbers.length) * 100), 
        small: Math.round((smallCount / numbers.length) * 100) 
      },
      oddEvenRatio: { 
        odd: Math.round((oddCount / numbers.length) * 100), 
        even: Math.round((evenCount / numbers.length) * 100) 
      },
    };
  }, [gameHistory]);
  
  // Helper function to check if user can afford
  const canAfford = useCallback((amount: number) => balance >= amount, [balance]);
  
  // Sound effects with volume control
  const { playTick, playWarningTick, playCountdownBeep, playBetPlaced, resetSoundGuard, playRoundEnd } = useGameSounds(soundEnabled, soundVolume);
  
  // Track last countdown beep to avoid double-play
  const lastCountdownBeepRef = useRef<number | null>(null);

  // Game type change - reset UI state, get time from engine
  useEffect(() => {
    setStatisticsData(generateStatisticsData(selectedGameType));
    setPendingBets([]);
    setSelectedNumber(null);
    setSelectedColor(null);
    
    // Get remaining time from engine
    const remaining = getRemainingSeconds(currentDuration);
    setTimeRemaining(remaining);
    
    resetSoundGuard();
  }, [selectedGameType, currentRoundKey, currentDuration, resetSoundGuard]);

  // ============= WINGO ENGINE SUBSCRIPTION =============
  // ONE engine drives ALL durations - UI just subscribes
  // NO per-page result listeners - GLOBAL_GAME_RESULT handled at MainLayout level
  useEffect(() => {
    const engineCallbacks: WinGoEngineCallbacks = {
      onTick: (states) => {
        // Update time remaining for selected duration - driven purely by engine
        const state = states[currentDuration];
        if (state) {
          const remaining = Math.ceil(state.remainingMs / 1000);
          setTimeRemaining(remaining);
          
          // Countdown sounds + vibration - play dramatic beep for each second in last 5
          if (remaining > 0 && remaining <= 5) {
            // Only play once per second value
            if (lastCountdownBeepRef.current !== remaining) {
              lastCountdownBeepRef.current = remaining;
              if (soundEnabled) {
                playCountdownBeep(remaining);
                // Extra tick-tick effect during final countdown
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
            lastCountdownBeepRef.current = null; // Reset
          }
          
          // Update roundKey in modeState if changed (round transition for UI)
          if (state.roundKey !== currentModeState?.roundKey) {
            updateModeState(selectedGameType, { roundKey: state.roundKey });
          }
        }
      },
      onRoundEnd: async (duration, roundKey, result) => {
        // Engine settled this round - update game history UI (NOT result modal)
        // Result modal is handled by GLOBAL_GAME_RESULT at MainLayout level
        const gameType = getGameTypeFromDuration(duration);
        const tradeId = extractTradeIdFromRoundKey(roundKey);
        
        // ============= CHECK FOR ADMIN-SET RESULT FIRST =============
        let finalResultNumber: number;
        let resultSource: "api" | "rng" = "rng";
        const adminResult = await getAdminSetResult('wingo', gameType, tradeId);
        
        if (adminResult && adminResult.result) {
          const parsedAdmin = parseWinGoResult(adminResult.result);
          if (parsedAdmin !== null) {
            finalResultNumber = parsedAdmin;
            console.log(`[WinGo] Using ADMIN-SET result: ${finalResultNumber} for ${tradeId}`);
          } else {
            // Fallback: try IndiaLotteryAPI, then engine RNG
            const apiNum = await fetchApiResultForRound(gameType, tradeId);
            if (apiNum !== null) {
              finalResultNumber = apiNum;
              resultSource = "api";
            } else {
              finalResultNumber = (result as any).number ?? result.sum;
            }
          }
        } else {
          // No admin result — try IndiaLotteryAPI (hybrid mode), else engine RNG
          const apiNum = await fetchApiResultForRound(gameType, tradeId);
          if (apiNum !== null) {
            finalResultNumber = apiNum;
            resultSource = "api";
          } else {
            finalResultNumber = (result as any).number ?? result.sum;
          }
        }

        // Log the round source for analytics / audit (non-blocking)
        void logWinGoRoundSource(gameType, tradeId, finalResultNumber, resultSource);
        
        // Update game history for this duration with final result
        const newHistoryItem = {
          period: tradeId,
          number: finalResultNumber,
          bigSmall: finalResultNumber >= 5 ? "Big" : "Small",
          colors: getNumberColors(finalResultNumber),
        };
        
        const currentHistory = modeStates[gameType]?.history || [];
        const currentRecent = modeStates[gameType]?.recentResults || [];
        updateModeState(gameType, {
          history: [newHistoryItem, ...currentHistory.slice(0, 10)],
          recentResults: [finalResultNumber, ...currentRecent.slice(0, 4)],
        });
        
        // Play round end sound for active tab
        if (gameType === selectedGameType && soundEnabled) {
          playRoundEnd();
        }

        // Dispatch animated result announcement event (banner handled in JSX) — only for active tab
        if (gameType === selectedGameType) {
          const colors = getNumberColors(finalResultNumber);
          window.dispatchEvent(
            new CustomEvent(WINGO_RESULT_EVENT, {
              detail: {
                number: finalResultNumber,
                color: colors[0],
                colors,
                bigSmall: finalResultNumber >= 5 ? "Big" : "Small",
              },
            })
          );
        }
        
        // ============= CALL USER-SIDE SETTLEMENT =============
        try {
          const settleResult = await settleBetsDB(
            tradeId,
            "wingo",
            gameType,
            String(finalResultNumber)
          );
          
          if (settleResult.success && settleResult.settledCount > 0) {
            console.log(`Settled ${settleResult.settledCount} bets, payouts: ${settleResult.totalPayouts}`);
            // Refresh wallet balance and bets after settlement
            refreshBalance();
            refreshBets(); // Update My Bets with settled results
          }
          
          // Auto-verify AI predictions with the actual result
          const verified = await autoVerifyPredictions("WinGo", [finalResultNumber]);
          if (verified.verified > 0) {
            console.log(`[WinGo] Auto-verified ${verified.verified} AI prediction(s)`);
          }
        } catch (err) {
          console.error("Settlement call failed:", err);
        }
      },
    };
    
    // Start engine (singleton - safe to call multiple times)
    const cleanup = startWinGoEngine(engineCallbacks);
    
    return cleanup;
  }, [currentDuration, selectedGameType, soundEnabled, playTick, playCountdownBeep, playRoundEnd, updateModeState, modeStates, currentModeState?.roundKey]);

  // ============= REFRESH_GAME_HISTORY listener =============
  // MainLayout dispatches this after GLOBAL_GAME_RESULT to refresh myHistory
  // This is the ONLY way WinGo updates its history - no per-page result listeners
  useEffect(() => {
    const handleRefreshHistory = (e: Event) => {
      const detail = (e as CustomEvent<{ game: string; duration: number }>).detail;
      if (!detail || detail.game !== "WinGo") return;
      
      // Reload myHistory for the settled duration
      const gameType = getGameTypeFromDuration(detail.duration as WinGoDuration);
      const reloadedHistory = loadMyHistory(GAME_NAME, gameType);
      updateModeState(gameType, { myHistory: reloadedHistory });
      
      // Also update other durations in case they had pending bets
      gameTypes.forEach((game) => {
        if (game.id !== gameType) {
          const otherHistory = loadMyHistory(GAME_NAME, game.id);
          const currentHistory = modeStates[game.id]?.myHistory || [];
          if (JSON.stringify(otherHistory) !== JSON.stringify(currentHistory)) {
            updateModeState(game.id, { myHistory: otherHistory });
          }
        }
      });
    };
    
    window.addEventListener("REFRESH_GAME_HISTORY", handleRefreshHistory);
    return () => window.removeEventListener("REFRESH_GAME_HISTORY", handleRefreshHistory);
  }, [updateModeState, modeStates]);

  // Update tab displays every second (lightweight, no settlement logic)
  useEffect(() => {
    const interval = window.setInterval(() => {
      setTabTick(t => t + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

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

  const openBetSheet = (type: "big" | "small" | "green" | "violet" | "red" | "number", number?: number) => {
    setBetType(type);
    if (type === "number" && number !== undefined) {
      setBetNumber(number);
    }
    setShowBetSheet(true);
  };

  return (
    <PageScaffold
      title="Win Go | GoLucky"
      description="Play Win Go lottery — bet on color, number, and big/small."
      canonicalPath="/game/wingo"
      fullWidth
    >
    <div className="min-h-screen" style={{ background: "#0B1426" }}>
      <div className="mx-auto" style={{ maxWidth: 480 }}>
        {/* Result Announcement Banner */}
        {resultBanner && (
          <div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[280px] animate-fade-in border border-white/25 text-white"
            style={{
              background:
                resultBanner.color === "green"
                  ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  : resultBanner.color === "red"
                  ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                  : "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
            }}
          >
            <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur flex items-center justify-center text-3xl font-extrabold">
              {resultBanner.number}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest opacity-90 font-semibold">
                Round Result!
              </p>
              <p className="font-bold text-lg capitalize leading-tight">
                {resultBanner.color} · {resultBanner.bigSmall}
              </p>
            </div>
          </div>
        )}

        {/* HEADER — red-orange gradient */}
        <header
          className="flex items-center justify-between px-3 py-3"
          style={{ background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)" }}
        >
          <button onClick={() => navigate("/home")} className="p-1 -ml-1">
            <ArrowLeft className="text-white" size={22} />
          </button>
          <h1 className="text-white font-bold text-lg tracking-wide">Win Go</h1>
          <div className="flex items-center gap-1.5 bg-white/15 rounded-full pl-2.5 pr-1.5 py-1">
            <Wallet className="text-white" size={13} />
            <span className="text-white font-bold text-xs">{formattedBalance}</span>
            <button onClick={() => refreshBalance()} className="bg-white/20 rounded-full p-1">
              <RefreshCw className="text-white" size={11} />
            </button>
          </div>
        </header>

        {/* GAME TABS */}
        <div className="px-3 -mt-1 pt-1 pb-3" style={{ background: "linear-gradient(180deg, #f97316 0%, #fb923c 100%)" }}>
          <div className="grid grid-cols-4 gap-2 bg-white/15 rounded-full p-1">
            {gameTypes.map((game) => {
              const isActive = selectedGameType === game.id;
              return (
                <button
                  key={game.id}
                  onClick={() => setSelectedGameType(game.id)}
                  className="flex items-center justify-center gap-1 py-2 rounded-full transition-all"
                  style={{
                    background: isActive ? "#ffffff" : "transparent",
                    color: isActive ? "#ef4444" : "#ffffff",
                    boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
                  }}
                >
                  <span style={{ fontSize: 11 }}>⏱</span>
                  <span className="font-bold" style={{ fontSize: 11 }}>{game.sublabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TIMER CARD */}
        <div className="px-3 -mt-2">
          <div
            className="rounded-2xl shadow-lg p-3 flex items-center justify-between"
            style={{ background: "#0F1E35", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium mb-1" style={{ color: "#64748B" }}>Period</p>
              <div style={{ color: "#E2E8F0" }}><CopyablePeriod period={currentPeriodNumber} className="text-[11px] font-mono font-bold truncate" /></div>
              <button onClick={() => setHowOpen(true)} className="text-[9px] text-orange-500 mt-0.5">📋 How to play</button>
            </div>
            <div className="flex-shrink-0 ml-3">
              <p className="text-[10px] font-medium text-right mb-1" style={{ color: "#64748B" }}>Count Down</p>
              <div className="flex gap-1">
                {[time.m1, time.m2, "colon", time.s1, time.s2].map((d, i) =>
                  d === "colon" ? (
                    <span key={i} className="flex items-center font-bold text-lg" style={{ color: "#F97316" }}>:</span>
                  ) : (
                    <span
                      key={i}
                      className="w-7 h-9 rounded-md flex items-center justify-center text-white font-bold text-lg"
                      style={{
                        background: "linear-gradient(180deg, #1E3A5F 0%, #0F2744 100%)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.3)",
                      }}
                    >
                      {d}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BETTING CARD */}
        <div className="px-3 mt-3">
          <div className="rounded-2xl shadow-lg p-3 space-y-3" style={{ background: "#0F1E35", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Color buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { color: "green" as const, label: "Green", bg: "linear-gradient(180deg, #4ade80 0%, #16a34a 100%)" },
                { color: "violet" as const, label: "Violet", bg: "linear-gradient(180deg, #c084fc 0%, #7c3aed 100%)" },
                { color: "red" as const, label: "Red", bg: "linear-gradient(180deg, #f87171 0%, #dc2626 100%)" },
              ].map((btn) => (
                <button
                  key={btn.color}
                  onClick={() => openBetSheet(btn.color)}
                  className="py-3 rounded-xl font-bold text-white text-sm relative overflow-hidden active:scale-95 transition-transform"
                  style={{ background: btn.bg, boxShadow: "0 3px 8px rgba(0,0,0,0.15)" }}
                >
                  <div className="absolute inset-x-0 top-0 h-1/2" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)" }} />
                  <span className="relative">{btn.label}</span>
                </button>
              ))}
            </div>

            {/* Number balls — 2 rows x 5 */}
            <div className="space-y-2">
              {[[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]].map((row, ri) => (
                <div key={ri} className="flex justify-between px-1">
                  {row.map((num) => (
                    <button
                      key={num}
                      onClick={() => openBetSheet("number", num)}
                      className="active:scale-90 transition-transform"
                    >
                      <NumberBall num={num} />
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Multiplier pills */}
            <div className="flex gap-1">
              {multipliers.map((m) => {
                const isActive = selectedMultiplier === m;
                const isRandom = m === "Random";
                return (
                  <button
                    key={m}
                    onClick={() => setSelectedMultiplier(m)}
                    className="flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all"
                    style={{
                      background: isActive
                        ? (isRandom ? "#f97316" : "#22c55e")
                        : "#1E3A5F",
                      color: isActive ? "#fff" : isRandom ? "#f97316" : "#94A3B8",
                      border: isRandom && !isActive ? "1px solid #f97316" : "1px solid transparent",
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            {/* Big / Small */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => openBetSheet("big")}
                className="py-3.5 rounded-xl font-bold text-white text-base relative overflow-hidden active:scale-95 transition-transform"
                style={{
                  background: "linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)",
                  boxShadow: "0 3px 8px rgba(249,115,22,0.35)",
                }}
              >
                <div className="absolute inset-x-0 top-0 h-1/2" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)" }} />
                <span className="relative">Big</span>
              </button>
              <button
                onClick={() => openBetSheet("small")}
                className="py-3.5 rounded-xl font-bold text-white text-base relative overflow-hidden active:scale-95 transition-transform"
                style={{
                  background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)",
                  boxShadow: "0 3px 8px rgba(59,130,246,0.35)",
                }}
              >
                <div className="absolute inset-x-0 top-0 h-1/2" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)" }} />
                <span className="relative">Small</span>
              </button>
            </div>
          </div>
        </div>

        {/* HISTORY TABS */}
        <div className="px-3 mt-3">
          {/* Recent trend strip */}
          <WinGoTrendStrip history={gameHistory} />
          <div className="flex gap-2">
            {[
              { id: "history", label: "Game history" },
              { id: "chart", label: "Chart" },
              { id: "my", label: "My History" },
              { id: "strategy", label: "Follow Strategy" },
            ].map((tab) => {
              const isActive = activeTab === (tab.id as typeof activeTab);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className="flex-1 py-2 rounded-full text-[11px] font-bold transition-all"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, #ef4444 0%, #f97316 100%)"
                      : "#0F1E35",
                    color: isActive ? "#fff" : "#94A3B8",
                    border: isActive ? "none" : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: isActive
                      ? "0 3px 8px rgba(239,68,68,0.35)"
                      : "none",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* HISTORY TABLE / CHART / STRATEGY */}
        <div className="px-3 mt-2 pb-6">
          <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: "#0F1E35", border: "1px solid rgba(255,255,255,0.08)" }}>
            {activeTab === "history" && (
              <div>
                <div
                  className="grid grid-cols-4 py-2 px-3 text-[11px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)" }}
                >
                  <span>Period</span>
                  <span className="text-center">Number</span>
                  <span className="text-center">Big Small</span>
                  <span className="text-center">Color</span>
                </div>
                <div>
                  {paginatedGameHistory.map((row: any, idx: number) => (
                    <div
                      key={idx}
                      className="grid grid-cols-4 items-center py-2 px-3"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <div style={{ color: "#94A3B8" }}><CopyablePeriod period={row.period} className="text-[9px] leading-tight font-mono" /></div>
                      <span className={`text-center text-lg font-extrabold ${getNumberTextColor(row.number)}`}>
                        {row.number}
                      </span>
                      <span className="text-center text-[10px] font-semibold" style={{ color: row.bigSmall === "Big" ? "#FB923C" : "#60A5FA" }}>{row.bigSmall}</span>
                      <div className="flex justify-center">
                        {(row.number === 0 || row.number === 5) ? (
                          <div
                            className="w-3.5 h-3.5 rounded-full overflow-hidden flex"
                            style={{ border: `1px solid ${row.number === 0 ? "#ef4444" : "#22c55e"}` }}
                          >
                            <div style={{ width: "50%", height: "100%", background: row.number === 0 ? "#ef4444" : "#22c55e" }} />
                            <div style={{ width: "50%", height: "100%", background: "#a855f7" }} />
                          </div>
                        ) : (
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ background: [1, 3, 7, 9].includes(row.number) ? "#22c55e" : "#ef4444" }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
              <WinGoChartTab history={gameHistory} rowsToShow={30} />
            )}

            {activeTab === "strategy" && (
              <div className="p-6 text-center">
                <p className="text-2xl mb-2">🎯</p>
                <p className="text-sm font-bold mb-1" style={{ color: "#E2E8F0" }}>Follow Strategy</p>
                <p className="text-[11px]" style={{ color: "#94A3B8" }}>Smart pattern-following coming soon.</p>
              </div>
            )}

            {activeTab === "my" && (
              <div>
                <div
                  className="grid grid-cols-4 py-2 px-3 text-[11px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)" }}
                >
                  <span>Period</span>
                  <span className="text-center">Bet</span>
                  <span className="text-center">Amount</span>
                  <span className="text-right">Result</span>
                </div>
                {isBetsLoading ? (
                  <div className="p-6 text-center text-[11px]" style={{ color: "#94A3B8" }}>Loading your bets…</div>
                ) : myBetHistory.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-2xl mb-2">📭</p>
                    <p className="text-sm font-bold mb-1" style={{ color: "#E2E8F0" }}>No bets yet</p>
                    <p className="text-[11px]" style={{ color: "#94A3B8" }}>Your placed bets will appear here.</p>
                  </div>
                ) : (
                  <>
                    <div>
                      {myBetHistory
                        .slice((myHistoryPage - 1) * 10, myHistoryPage * 10)
                        .map((bet, idx) => {
                          const won = bet.isWin === true;
                          const lost = bet.isWin === false;
                          const pending = bet.isWin === null;
                          const resultColor = won ? "#16a34a" : lost ? "#dc2626" : "#6b7280";
                          const resultLabel = pending
                            ? "Pending"
                            : won
                            ? `+৳${bet.payout.toFixed(2)}`
                            : `-৳${bet.betAmount.toFixed(2)}`;
                          return (
                            <div
                              key={idx}
                              className="grid grid-cols-4 items-center py-2 px-3"
                              style={{ borderBottom: "1px solid #f3f4f6" }}
                            >
                              <CopyablePeriod
                                period={bet.period}
                                className="text-gray-500 text-[9px] leading-tight font-mono"
                              />
                              <span className="text-center text-gray-700 text-[10px] font-semibold truncate">
                                {bet.betType}
                              </span>
                              <span className="text-center text-gray-600 text-[10px] font-semibold">
                                ৳{bet.betAmount.toFixed(2)}
                              </span>
                              <span
                                className="text-right text-[11px] font-extrabold"
                                style={{ color: resultColor }}
                              >
                                {resultLabel}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                    <HistoryPagination
                      currentPage={myHistoryPage}
                      totalPages={Math.max(1, Math.ceil(myBetHistory.length / 10))}
                      onPageChange={setMyHistoryPage}
                      itemsPerPage={10}
                      totalItems={myBetHistory.length}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bet Bottom Sheet - with slide-up animation and backdrop blur */}
      <BetSheet
        isOpen={showBetSheet}
        onClose={() => setShowBetSheet(false)}
        headerTitle={`Win Go ${currentGame.sublabel}`}
        headerColor={
          betType === "green" ? "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)" :
          betType === "violet" ? "linear-gradient(135deg, #c084fc 0%, #a855f7 100%)" :
          betType === "red" ? "linear-gradient(135deg, #f87171 0%, #ef4444 100%)" :
          betType === "small" ? "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)" :
          "linear-gradient(135deg, #fdba74 0%, #fb923c 100%)"
        }
        timeRemaining={timeRemaining}
      >
        <BetPanelContent
          betType={betType}
          betValue={betType === "number" ? betNumber : betType === "big" ? "Big" : betType === "small" ? "Small" : betType.charAt(0).toUpperCase() + betType.slice(1)}
          betAmount={betAmount}
          betMultiplier={betMultiplier}
          agreedToRules={agreedToRules}
          odds={betType === "number" ? 8 : 2}
          colorType={
            betType === "green" ? "green" :
            betType === "violet" ? "violet" :
            betType === "red" ? "red" :
            betType === "small" ? "blue" :
            "orange"
          }
          showNumberGrid={true}
          numberGridValues={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
          selectedNumber={betType === "number" ? betNumber : null}
          payoutGuide={[
            { label: "Number (0-9)", odds: "8x", color: "#f97316", highlight: betType === "number" },
            { label: "🟢 Green", odds: "2x", color: "#22c55e", highlight: betType === "green" },
            { label: "🔴 Red", odds: "2x", color: "#ef4444", highlight: betType === "red" },
            { label: "🟣 Violet", odds: "2x", color: "#a855f7", highlight: betType === "violet" },
            { label: "📈 Big", odds: "2x", color: "#f97316", highlight: betType === "big" },
            { label: "📉 Small", odds: "2x", color: "#3b82f6", highlight: betType === "small" },
          ]}
          onBetAmountChange={setBetAmount}
          onBetMultiplierChange={setBetMultiplier}
          onNumberSelect={(num) => {
            setBetType("number");
            setBetNumber(num);
          }}
          onAgreeChange={setAgreedToRules}
          onCancel={() => setShowBetSheet(false)}
          onConfirm={() => {
            // BLOCK betting during countdown (last 5 seconds)
            if (timeRemaining <= 5) {
              toast.error("সময় শেষ!", {
                description: "কাউন্টডাউন চলাকালীন বেট করা যাবে না। পরবর্তী রাউন্ডে চেষ্টা করুন।",
              });
              if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
              return;
            }
            
            const multiplier = parseInt(betMultiplier.replace("X", ""));
            const stake = betAmount;
            const totalStake = stake * multiplier;

            let betKind: "number" | "color" | "bigSmall" = "bigSmall";
            let betValue: number | "green" | "violet" | "red" | "Big" | "Small" = "Big";

            if (betType === "green" || betType === "violet" || betType === "red") {
              betKind = "color";
              betValue = betType;
            } else if (betType === "number") {
              betKind = "number";
              betValue = betNumber;
            } else {
              betKind = "bigSmall";
              betValue = betType === "big" ? "Big" : "Small";
            }

            const betTypeLabel = betKind === "number" 
              ? `Number ${betValue}` 
              : betKind === "color"
                ? String(betValue).charAt(0).toUpperCase() + String(betValue).slice(1)
                : String(betValue);

            const betKey = `WinGo:${currentDuration}:${currentRoundKey}:${betTypeLabel}:${totalStake}:${Date.now()}`;

            if (!canAfford(totalStake)) {
              toast.error("Insufficient balance!", {
                description: `You need ৳${totalStake.toLocaleString()} but have only ${formattedBalance}`,
              });
              if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
              return;
            }

            const breakdown = getBetBreakdown(totalStake, "WinGo");
            const odds = betType === "number" ? 8 : 2;
            const grossWin = breakdown.netAmount * odds;
            const potentialWinCalc = Math.floor((grossWin - grossWin * 0.02) * 100) / 100;

            if (soundEnabled) playBetPlaced();
            if (navigator.vibrate) navigator.vibrate([30, 20, 50]);
            markBetKeyPlaced(betKey);

            if (betType === "green" || betType === "violet" || betType === "red") {
              setSelectedColor(betType);
              setSelectedNumber(null);
            } else if (betType === "number") {
              setSelectedNumber(betNumber);
              setSelectedColor(null);
            } else {
              setSelectedColor(null);
              setSelectedNumber(null);
            }

            const newPendingBet = {
              gameType: selectedGameType,
              tradeId: currentTradeId,
              betKind,
              betValue,
              stake,
              multiplier,
              totalStake,
              createdAt: new Date().toISOString(),
            };
            setPendingBets(prev => [...prev, newPendingBet]);

            const pendingHistoryEntry: BetHistoryItem = {
              period: currentPeriodNumber,
              betType: betTypeLabel,
              betAmount: totalStake,
              fee: breakdown.fee,
              netAmount: breakdown.netAmount,
              result: null,
              isWin: null,
              payout: 0,
              timestamp: new Date(),
              roundKey: currentRoundKey,
              duration: currentDuration,
              betKey,
            };
            
            const updatedHistory = [pendingHistoryEntry, ...myBetHistory];
            updateModeState(selectedGameType, { myHistory: updatedHistory });
            saveMyHistory(GAME_NAME, selectedGameType, updatedHistory);

            setBetAnimationData({
              betAmount: totalStake,
              betType: betTypeLabel,
              potentialWin: potentialWinCalc,
            });
            setShowBetAnimation(true);
            setShowBetSheet(false);

            (async () => {
              try {
                const { data, error } = await supabase.functions.invoke("place-bet", {
                  body: {
                    gameType: "wingo",
                    gameMode: selectedGameType,
                    tradeId: currentTradeId,
                    betType: betKind,
                    betValue: String(betValue),
                    betAmount: totalStake,
                    multiplier: multiplier,
                    potentialWin: potentialWinCalc,
                  },
                });

                if (error || !data?.success) {
                  const errorMsg = data?.error || error?.message || "Failed to place bet";
                  toast.error(errorMsg);
                  setPendingBets(prev => prev.filter(b => b.createdAt !== newPendingBet.createdAt));
                  const rolledBackHistory = myBetHistory.filter(h => h.betKey !== betKey);
                  updateModeState(selectedGameType, { myHistory: rolledBackHistory });
                  saveMyHistory(GAME_NAME, selectedGameType, rolledBackHistory);
                  return;
                }

                refreshBalance();
                refreshBets();
              } catch (error) {
                console.error("Error saving bet:", error);
                toast.error("Failed to save bet - please check your connection");
              }
            })();
          }}
          disabled={timeRemaining <= 5}
        />
      </BetSheet>

      {/* Result Modal now handled globally in MainLayout via GlobalResultModal */}
      
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
      
      {/* How to Play Modal */}
      <HowToPlayModal
        open={howOpen}
        onClose={() => setHowOpen(false)}
        content={wingoHowToPlay}
        title="How to Play Win Go"
      />
      
      {/* History animations */}
      <style>{`
        @keyframes historySlideIn {
          0% {
            opacity: 0;
            transform: translateX(-20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes statusPop {
          0% {
            transform: scale(0);
          }
          60% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes winIconBounce {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          25% {
            transform: scale(1.2) rotate(-10deg);
          }
          50% {
            transform: scale(1) rotate(0deg);
          }
          75% {
            transform: scale(1.2) rotate(10deg);
          }
        }
        
        @keyframes loseIconShake {
          0%, 100% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-3px);
          }
          40% {
            transform: translateX(3px);
          }
          60% {
            transform: translateX(-2px);
          }
          80% {
            transform: translateX(2px);
          }
        }
        
        @keyframes starSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
      
      {/* Bet Details Modal */}
      <BetDetailsModal
        open={showBetDetailsModal}
        onOpenChange={setShowBetDetailsModal}
        bet={selectedBetDetails}
        gameType="WinGo"
      />

      {/* First Deposit Bonus Banner */}
      <FirstDepositBonusBanner />
    </div>
    </PageScaffold>
  );
};

export default WinGo;
