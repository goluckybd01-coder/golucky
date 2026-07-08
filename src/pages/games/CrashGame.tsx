import { useState, useEffect, useRef, useCallback } from "react";
import PageScaffold from "@/components/templates/PageScaffold";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Rocket, TrendingUp, History, RefreshCw, Volume2, VolumeX, Info, Zap, Sparkles, Trophy, Crown, Medal, Users, Shield, Keyboard, Plus, Minus, Settings2, Save, RotateCcw, Flame, Lock, Timer, WifiOff, Loader2 } from "lucide-react";
import LivePlayersList from "@/components/game/LivePlayersList";
import ProvablyFairDisplay, { generateHash, generateRandomSeed, calculateCrashPoint } from "@/components/game/ProvablyFairDisplay";
import CrashBetStats from "@/components/game/CrashBetStats";
import CrashSessionTracker from "@/components/game/CrashSessionTracker";
import CrashSoundSettings, { loadSoundSettings, saveSoundSettings, type SoundSettings } from "@/components/game/CrashSoundSettings";
import CrashAutoBet, { 
  type AutoBetSettings, 
  type AutoBetStats, 
  defaultAutoBetSettings, 
  defaultAutoBetStats,
  calculateNextBet 
} from "@/components/game/CrashAutoBet";
import CrashStreakBonus, {
  type StreakState,
  type StreakBonusConfig,
  defaultStreakState,
  defaultStreakConfig,
  calculateStreakPayout,
  getStreakBonus,
} from "@/components/game/CrashStreakBonus";
import { 
  type CrashGameSettings,
  defaultCrashGameSettings,
  loadCrashGameSettings,
  MAX_ANIMATION_SPEED_FACTOR,
} from "@/lib/crashGameSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWalletDB } from "@/hooks/useWalletDB";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import Confetti from "@/components/Confetti";
import CashoutConfetti from "@/components/game/CashoutConfetti";
import { useCrashSounds } from "@/hooks/useCrashSounds";
import CrashDebrisParticles from "@/components/game/CrashDebrisParticles";
import RocketSmokeTrail from "@/components/game/RocketSmokeTrail";
import RocketEngineFireParticles from "@/components/game/RocketEngineFireParticles";
import { useCrashRoundSync, CRASH_TIMING } from "@/hooks/useCrashRoundSync";
import CrashHistoryPanel from "@/components/game/CrashHistoryPanel";

import { formatTaka } from "@/lib/currency";

// Currency formatter for Bangladeshi Taka - uses centralized utility
const formatCurrency = (amount: number): string => {
  return formatTaka(amount);
};

interface FairnessData {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  crashPoint: number;
}

type GamePhase = "waiting" | "betting" | "locking" | "running" | "crashed";

interface CrashBet {
  id: string;
  bet_amount: number;
  cashout_multiplier: number | null;
  outcome: string | null;
  win_amount: number;
  fee_amount: number;
  placed_at: string;
  crash_multiplier?: number;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  win_amount: number;
  cashout_multiplier: number;
  bet_amount: number;
}

const CrashGame = () => {
  const navigate = useNavigate();
  const { balance, placeBet, claimWinnings } = useWalletDB();
  
  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => loadSoundSettings());
  const {
    playCountdownTick,
    playBetPlaced,
    playRocketLaunch,
    startRocketLoop,
    stopRocketLoop,
    startIgnitionRoar,
    stopIgnitionRoar,
    playMultiplierMilestone,
    playCashout,
    playCrashExplosion,
    playLoss,
    playBigWin,
    playJackpot,
    playMilestoneAlert,
    playTimeWarp,
    setHapticEnabled,
  } = useCrashSounds(soundEnabled, soundSettings.masterVolume);
  
  // Sync haptic setting when soundSettings changes
  useEffect(() => {
    setHapticEnabled(soundSettings.hapticEnabled);
  }, [soundSettings.hapticEnabled, setHapticEnabled]);
  
  // Track which custom milestones have been triggered this round
  const triggeredMilestonesRef = useRef<Set<number>>(new Set());
  
  // Game settings (admin configurable)
  const [gameSettings] = useState<CrashGameSettings>(() => loadCrashGameSettings());
  
  // Server-synced round state
  const roundSync = useCrashRoundSync();
  
  // Game state - derived from server sync
  const phase = roundSync.phase as GamePhase;
  const currentMultiplier = roundSync.currentMultiplier;
  const crashMultiplier = roundSync.crashMultiplier;
  const countdown = roundSync.countdown;
  const lockingCountdown = roundSync.phase === "locking" ? roundSync.countdown : 2;
  const isResyncing = roundSync.phase === "syncing";
  const isConnected = roundSync.isConnected;
  
  // Betting state
  const [betAmount, setBetAmount] = useState("100");
  const [autoCashout, setAutoCashout] = useState(false);
  const [autoCashoutValue, setAutoCashoutValue] = useState("2.00");
  const [hasBet, setHasBet] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [cashoutMultiplier, setCashoutMultiplier] = useState<number | null>(null);
  const [winAmount, setWinAmount] = useState<number | null>(null);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isCashingOut, setIsCashingOut] = useState(false);
  
  // Visual effects state
  const [showCashoutEffect, setShowCashoutEffect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCashoutConfetti, setShowCashoutConfetti] = useState(false);
  const [cashoutConfettiMultiplier, setCashoutConfettiMultiplier] = useState(1);
  const [rocketY, setRocketY] = useState(0);
  const [showCrashExplosion, setShowCrashExplosion] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [showRedFlash, setShowRedFlash] = useState(false);
  const [showDebris, setShowDebris] = useState(false);
  const [isSlowMotion, setIsSlowMotion] = useState(false);
  const [preCrashSlowMo, setPreCrashSlowMo] = useState(false);
  
  // Milestone tracking for sounds
  const lastMilestoneRef = useRef<number>(0);
  
  // History
  const [recentResults, setRecentResults] = useState<number[]>([2.34, 1.12, 5.67, 1.45, 3.21, 8.90, 1.08, 2.11, 4.55, 1.33]);
  const [myBets, setMyBets] = useState<CrashBet[]>([]);
  const [selectedBet, setSelectedBet] = useState<CrashBet | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistoryTab, setShowHistoryTab] = useState(false);
  
  // Current round tracking for database
  const currentRoundIdRef = useRef<string | null>(null);
  const currentBetIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  
  // Leaderboard state
  const [leaderboardTab, setLeaderboardTab] = useState<"biggest" | "highest">("biggest");
  const [biggestWins, setBiggestWins] = useState<LeaderboardEntry[]>([]);
  const [highestMultipliers, setHighestMultipliers] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  
  // Provably fair state
  const [currentServerSeed, setCurrentServerSeed] = useState<string>("");
  const [currentServerSeedHash, setCurrentServerSeedHash] = useState<string>("");
  const [currentClientSeed, setCurrentClientSeed] = useState<string>("");
  const [currentNonce, setCurrentNonce] = useState<number>(1);
  const [isHashRevealed, setIsHashRevealed] = useState<boolean>(false);
  const [revealedFairnessData, setRevealedFairnessData] = useState<FairnessData | null>(null);
  const [roundHistory, setRoundHistory] = useState<FairnessData[]>([]);
  
  // Auto-bet state
  const [autoBetEnabled, setAutoBetEnabled] = useState(false);
  const [autoBetSettings, setAutoBetSettings] = useState<AutoBetSettings>(defaultAutoBetSettings);
  const [autoBetStats, setAutoBetStats] = useState<AutoBetStats>(defaultAutoBetStats);
  const [currentAutoBetAmount, setCurrentAutoBetAmount] = useState(100);
  const fibonacciSequenceRef = useRef([1, 1, 2, 3, 5, 8, 13, 21, 34, 55]);
  const lastAutoBetOutcomeRef = useRef<"win" | "loss" | null>(null);
  const autoBetStartBalanceRef = useRef<number>(0);
  
  // Streak bonus state
  const [streakState, setStreakState] = useState<StreakState>(defaultStreakState);
  const [streakConfig] = useState<StreakBonusConfig>(defaultStreakConfig);
  const [isStreakAnimating, setIsStreakAnimating] = useState(false);
  
  // Animation ref
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  // Get current user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        currentUserIdRef.current = user.id;
        fetchMyBetHistory();
      }
    };
    getUser();
  }, []);
  
  // Fetch user's bet history
  const fetchMyBetHistory = async () => {
    if (!currentUserIdRef.current) return;
    
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("crash_bets")
        .select("*")
        .eq("user_id", currentUserIdRef.current)
        .order("placed_at", { ascending: false })
        .limit(50);
      
      if (!error && data) {
        const formattedBets: CrashBet[] = data.map(bet => ({
          id: bet.id,
          bet_amount: bet.bet_amount,
          cashout_multiplier: bet.cashout_multiplier,
          outcome: bet.outcome as "win" | "lose" | null,
          win_amount: bet.win_amount || 0,
          fee_amount: bet.fee_amount || 0,
          placed_at: bet.placed_at,
          crash_multiplier: undefined, // We don't have this directly
        }));
        setMyBets(formattedBets);
      }
    } catch (error) {
      console.error("Failed to fetch bet history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  // Save bet to database
  const saveBetToDatabase = async (amount: number): Promise<string | null> => {
    if (!currentUserIdRef.current || !currentRoundIdRef.current) return null;
    
    try {
      const { data, error } = await supabase
        .from("crash_bets")
        .insert({
          user_id: currentUserIdRef.current,
          round_id: currentRoundIdRef.current,
          bet_amount: amount,
          balance_before: balance,
          placed_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      
      if (error) {
        console.error("Failed to save bet:", error);
        return null;
      }
      
      return data?.id || null;
    } catch (error) {
      console.error("Failed to save bet:", error);
      return null;
    }
  };
  
  // Update bet with cashout result
  const updateBetWithCashout = async (betId: string, cashoutMult: number, payout: number) => {
    try {
      await supabase
        .from("crash_bets")
        .update({
          cashout_multiplier: cashoutMult,
          cashout_time: new Date().toISOString(),
          outcome: "WIN",
          win_amount: payout,
          final_amount: payout,
          balance_after: balance + payout,
          settled_at: new Date().toISOString(),
        })
        .eq("id", betId);
      
      // Refresh history
      fetchMyBetHistory();
    } catch (error) {
      console.error("Failed to update bet:", error);
    }
  };
  
  // Update bet with loss result
  const updateBetWithLoss = async (betId: string, crashMult: number) => {
    try {
      await supabase
        .from("crash_bets")
        .update({
          outcome: "LOSE",
          win_amount: 0,
          final_amount: 0,
          balance_after: balance,
          settled_at: new Date().toISOString(),
        })
        .eq("id", betId);
      
      // Refresh history
      fetchMyBetHistory();
    } catch (error) {
      console.error("Failed to update bet:", error);
    }
  };
  
  // Generate crash point
  const generateCrashPoint = useCallback(() => {
    const rtp = 0.94;
    const random = Math.random();
    const crash = 1 / (1 - random * rtp);
    if (Math.random() < 0.002) return Math.min(100, crash * 2);
    return Math.min(20, Math.max(1.01, Number(crash.toFixed(2))));
  }, []);
  
  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoadingLeaderboard(true);
      try {
        // Fetch biggest wins (by win_amount)
        const { data: bigWins, error: bigError } = await supabase
          .from("crash_bets")
          .select("id, bet_amount, cashout_multiplier, win_amount, user_id")
          .eq("outcome", "WIN")
          .not("win_amount", "is", null)
          .order("win_amount", { ascending: false })
          .limit(10);
        
        if (!bigError && bigWins) {
          const formattedBigWins: LeaderboardEntry[] = bigWins.map((bet, idx) => ({
            rank: idx + 1,
            username: `Player***${bet.user_id?.slice(-4) || "xxxx"}`,
            win_amount: bet.win_amount || 0,
            cashout_multiplier: bet.cashout_multiplier || 0,
            bet_amount: bet.bet_amount,
          }));
          setBiggestWins(formattedBigWins);
        }
        
        // Fetch highest multiplier cashouts
        const { data: highMults, error: highError } = await supabase
          .from("crash_bets")
          .select("id, bet_amount, cashout_multiplier, win_amount, user_id")
          .eq("outcome", "WIN")
          .not("cashout_multiplier", "is", null)
          .order("cashout_multiplier", { ascending: false })
          .limit(10);
        
        if (!highError && highMults) {
          const formattedHighMults: LeaderboardEntry[] = highMults.map((bet, idx) => ({
            rank: idx + 1,
            username: `Player***${bet.user_id?.slice(-4) || "xxxx"}`,
            win_amount: bet.win_amount || 0,
            cashout_multiplier: bet.cashout_multiplier || 0,
            bet_amount: bet.bet_amount,
          }));
          setHighestMultipliers(formattedHighMults);
        }
        
        // If no real data, use demo data
        if ((!bigWins || bigWins.length === 0) && (!highMults || highMults.length === 0)) {
          const demoData: LeaderboardEntry[] = [
            { rank: 1, username: "Rah***23", win_amount: 45000, cashout_multiplier: 15.32, bet_amount: 2938 },
            { rank: 2, username: "Kar***89", win_amount: 32500, cashout_multiplier: 12.50, bet_amount: 2600 },
            { rank: 3, username: "Sha***12", win_amount: 28000, cashout_multiplier: 8.75, bet_amount: 3200 },
            { rank: 4, username: "Ami***45", win_amount: 21000, cashout_multiplier: 7.00, bet_amount: 3000 },
            { rank: 5, username: "Nas***67", win_amount: 18500, cashout_multiplier: 6.17, bet_amount: 3000 },
            { rank: 6, username: "Tan***34", win_amount: 15200, cashout_multiplier: 5.07, bet_amount: 3000 },
            { rank: 7, username: "Hab***78", win_amount: 12800, cashout_multiplier: 4.27, bet_amount: 3000 },
            { rank: 8, username: "Fai***90", win_amount: 10500, cashout_multiplier: 3.50, bet_amount: 3000 },
          ];
          setBiggestWins(demoData);
          
          const demoMultData: LeaderboardEntry[] = [
            { rank: 1, username: "Moh***56", win_amount: 8500, cashout_multiplier: 42.50, bet_amount: 200 },
            { rank: 2, username: "Rah***23", win_amount: 15320, cashout_multiplier: 15.32, bet_amount: 1000 },
            { rank: 3, username: "Kar***89", win_amount: 6250, cashout_multiplier: 12.50, bet_amount: 500 },
            { rank: 4, username: "Sha***12", win_amount: 4375, cashout_multiplier: 8.75, bet_amount: 500 },
            { rank: 5, username: "Ami***45", win_amount: 3500, cashout_multiplier: 7.00, bet_amount: 500 },
            { rank: 6, username: "Nas***67", win_amount: 3085, cashout_multiplier: 6.17, bet_amount: 500 },
            { rank: 7, username: "Tan***34", win_amount: 2535, cashout_multiplier: 5.07, bet_amount: 500 },
            { rank: 8, username: "Hab***78", win_amount: 2135, cashout_multiplier: 4.27, bet_amount: 500 },
          ];
          setHighestMultipliers(demoMultData);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    };
    
    fetchLeaderboard();
  }, []);

  // Rocket position based on multiplier (flying bottom-left to top along left side)
  useEffect(() => {
    if (phase === "running") {
      // Calculate rocket Y position - flies from bottom to top along left side
      // Reduced speed by 35% - using 20 for smoother progression over longer flight
      const progress = Math.min(1, (currentMultiplier - 1) / 20);
      // Smooth easing for more natural flight
      const easedProgress = 1 - Math.pow(1 - progress, 2);
      setRocketY(easedProgress * 100);
    } else if (phase === "betting" || phase === "locking") {
      setRocketY(0);
    }
  }, [currentMultiplier, phase]);
  
  // Initialize provably fair seeds on mount
  useEffect(() => {
    const initSeeds = async () => {
      const serverSeed = generateRandomSeed();
      const clientSeed = generateRandomSeed(16);
      const hash = await generateHash(serverSeed);
      
      setCurrentServerSeed(serverSeed);
      setCurrentClientSeed(clientSeed);
      setCurrentServerSeedHash(hash);
    };
    initSeeds();
  }, []);
  
  // Refs for sound and effect triggers
  const lastPhaseRef = useRef<string>("");
  const lastRoundIdRef = useRef<string | null>(null);
  
  // Effect to handle phase transitions and trigger sounds/effects
  useEffect(() => {
    const currentPhase = roundSync.phase;
    const prevPhase = lastPhaseRef.current;
    
    // Skip if phase hasn't changed
    if (currentPhase === prevPhase) return;
    
    console.log(`[CrashGame] Phase transition: ${prevPhase} -> ${currentPhase}`);
    lastPhaseRef.current = currentPhase;
    
    // Handle new round
    if (roundSync.id !== lastRoundIdRef.current) {
      lastRoundIdRef.current = roundSync.id;
      // Reset bet state for new round
      setHasBet(false);
      setHasCashedOut(false);
      setCashoutMultiplier(null);
      setWinAmount(null);
      setShowCashoutEffect(false);
      setShowConfetti(false);
      setShowCrashExplosion(false);
      setRocketY(0);
      setIsSlowMotion(false);
      lastMilestoneRef.current = 0;
      triggeredMilestonesRef.current.clear();
      currentBetIdRef.current = null;
      currentRoundIdRef.current = roundSync.id;
    }
    
    // Phase-specific triggers
    if (currentPhase === "betting" && prevPhase !== "betting") {
      // New betting phase started
      console.log("[CrashGame] BETTING phase started");
    }
    
    if (currentPhase === "locking" && prevPhase === "betting") {
      // Transition to locking - start ignition effects
      startIgnitionRoar();
      if ('vibrate' in navigator) {
        const rumblePattern = [
          50, 30, 60, 25, 70, 20, 80, 15, 90, 10, 100, 10, 
          110, 10, 120, 10, 130, 10, 150, 10, 180, 10, 200
        ];
        try { navigator.vibrate(rumblePattern); } catch (e) {}
      }
    }
    
    if (currentPhase === "running" && prevPhase === "locking") {
      // Transition to running - stop ignition, start rocket
      stopIgnitionRoar();
      if ('vibrate' in navigator) {
        try { navigator.vibrate(0); } catch (e) {}
      }
      playRocketLaunch();
      startRocketLoop();
    }
    
    if (currentPhase === "crashed" && prevPhase === "running") {
      // Crash occurred - trigger pre-crash slow motion first for dramatic effect
      setPreCrashSlowMo(true);
      
      // After brief slow-mo, trigger explosion effects
      setTimeout(() => {
        setPreCrashSlowMo(false);
        stopRocketLoop();
        playCrashExplosion();
        setShowCrashExplosion(true);
        setIsSlowMotion(false);
        
        // Screen shake - more intense for higher multipliers
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), crashMultiplier && crashMultiplier >= 5 ? 800 : 600);
        
        // Red flash
        setShowRedFlash(true);
        setTimeout(() => setShowRedFlash(false), 300);
        
        // Debris
        setShowDebris(true);
        setTimeout(() => setShowDebris(false), 1500);
        
        // Vibration
        if ('vibrate' in navigator) {
          try { navigator.vibrate([100, 50, 150, 50, 200]); } catch (e) {}
        }
      }, 300); // 300ms of slow-mo before explosion
      
      // Add to recent results
      if (crashMultiplier) {
        setRecentResults(prev => [crashMultiplier, ...prev.slice(0, 9)]);
      }
    }
  }, [roundSync.phase, roundSync.id, crashMultiplier, startIgnitionRoar, stopIgnitionRoar, playRocketLaunch, startRocketLoop, stopRocketLoop, playCrashExplosion]);
  
  // Effect to handle countdown sounds
  useEffect(() => {
    if (phase === "betting" && countdown <= 5 && countdown > 0) {
      playCountdownTick(countdown, false);
    }
    if (phase === "locking" && lockingCountdown > 0) {
      playCountdownTick(lockingCountdown, true);
    }
  }, [phase, countdown, lockingCountdown, playCountdownTick]);
  
  // Effect to handle multiplier milestones and sounds
  useEffect(() => {
    if (phase !== "running") return;
    
    // Check for milestone sounds
    const currentMilestone = Math.floor(currentMultiplier * 2) / 2;
    if (currentMilestone >= 1.5 && currentMilestone > lastMilestoneRef.current) {
      lastMilestoneRef.current = currentMilestone;
      playMultiplierMilestone(currentMilestone);
    }
    
    // Trigger slow-motion effect at 10x+
    if (currentMultiplier >= 10 && !isSlowMotion) {
      setIsSlowMotion(true);
      playTimeWarp();
    } else if (currentMultiplier < 10 && isSlowMotion) {
      setIsSlowMotion(false);
    }
    
    // Check for custom milestone alerts
    if (soundSettings.milestoneEnabled) {
      for (const threshold of soundSettings.milestoneThresholds) {
        if (currentMultiplier >= threshold && !triggeredMilestonesRef.current.has(threshold)) {
          triggeredMilestonesRef.current.add(threshold);
          playMilestoneAlert(threshold);
        }
      }
    }
    
    // Check for jackpot alert
    if (soundSettings.jackpotEnabled && currentMultiplier >= soundSettings.jackpotMultiplier) {
      if (!triggeredMilestonesRef.current.has(999)) {
        triggeredMilestonesRef.current.add(999);
        playJackpot();
      }
    }
  }, [phase, currentMultiplier, isSlowMotion, soundSettings, playMultiplierMilestone, playTimeWarp, playMilestoneAlert, playJackpot]);
  
  // Update rocket Y position based on multiplier
  useEffect(() => {
    if (phase === "running") {
      // Rocket rises as multiplier increases
      const progress = Math.min((currentMultiplier - 1) / 9, 1);
      setRocketY(progress * 70);
    } else if (phase !== "crashed") {
      setRocketY(0);
    }
  }, [phase, currentMultiplier]);
  
  // Handle loss when crashed with active bet + save to DB + auto-bet tracking
  useEffect(() => {
    if (phase === "crashed" && hasBet && !hasCashedOut) {
      // Small delay after crash explosion
      const timeout = setTimeout(() => {
        playLoss();
        // Update bet in database with loss
        if (currentBetIdRef.current && crashMultiplier) {
          updateBetWithLoss(currentBetIdRef.current, crashMultiplier);
        }
        
        // Reset streak on loss
        if (streakConfig.resetOnLoss) {
          setStreakState(prev => ({
            ...prev,
            currentStreak: 0,
            currentBonusMultiplier: 1.0,
            lastOutcome: "loss",
          }));
        }
        
        // Update auto-bet stats on loss
        if (autoBetEnabled) {
          const lossAmount = parseFloat(betAmount);
          lastAutoBetOutcomeRef.current = "loss";
          
          setAutoBetStats(prev => {
            const newStreak = prev.streakType === "loss" ? prev.currentStreak + 1 : 1;
            return {
              ...prev,
              roundsPlayed: prev.roundsPlayed + 1,
              losses: prev.losses + 1,
              totalProfit: prev.totalProfit - lossAmount,
              currentStreak: newStreak,
              streakType: "loss",
            };
          });
          
          // Calculate next bet amount based on strategy
          setCurrentAutoBetAmount(prev => {
            const nextBet = calculateNextBetForStrategy(autoBetSettings, autoBetStats, "loss", prev);
            return Math.max(10, nextBet);
          });
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [phase, hasBet, hasCashedOut, playLoss, crashMultiplier, autoBetEnabled, betAmount, autoBetSettings, streakConfig.resetOnLoss]);
  
  // Calculate next bet based on strategy
  const calculateNextBetForStrategy = (
    settings: AutoBetSettings,
    stats: AutoBetStats,
    outcome: "win" | "loss",
    currentBet: number
  ): number => {
    const { baseBet, strategy, onWinAction, onLossAction, increasePercent, decreasePercent } = settings;
    
    switch (strategy) {
      case "flat": {
        const action = outcome === "win" ? onWinAction : onLossAction;
        if (action === "reset") return baseBet;
        if (action === "increase") return Math.ceil(currentBet * (1 + increasePercent / 100));
        if (action === "decrease") return Math.max(10, Math.floor(currentBet * (1 - decreasePercent / 100)));
        return baseBet;
      }
      
      case "martingale": {
        if (outcome === "win") return baseBet;
        return currentBet * 2; // Double after loss
      }
      
      case "reverse-martingale": {
        if (outcome === "loss") return baseBet;
        return currentBet * 2; // Double after win
      }
      
      case "fibonacci": {
        if (outcome === "win") return baseBet;
        // Move up fibonacci sequence on loss
        const currentIndex = fibonacciSequenceRef.current.findIndex(f => baseBet * f >= currentBet);
        const nextIndex = Math.min(currentIndex + 1, fibonacciSequenceRef.current.length - 1);
        return baseBet * fibonacciSequenceRef.current[nextIndex];
      }
      
      case "dalembert": {
        const unit = baseBet;
        if (outcome === "win") {
          return Math.max(baseBet, currentBet - unit);
        } else {
          return currentBet + unit;
        }
      }
      
      default:
        return baseBet;
    }
  };
  
  // Auto-bet: track wins
  const handleAutoBetWin = (payout: number, betAmt: number) => {
    if (!autoBetEnabled) return;
    
    const profit = payout - betAmt;
    lastAutoBetOutcomeRef.current = "win";
    
    setAutoBetStats(prev => {
      const newStreak = prev.streakType === "win" ? prev.currentStreak + 1 : 1;
      return {
        ...prev,
        roundsPlayed: prev.roundsPlayed + 1,
        wins: prev.wins + 1,
        totalProfit: prev.totalProfit + profit,
        currentStreak: newStreak,
        streakType: "win",
      };
    });
    
    // Calculate next bet amount
    setCurrentAutoBetAmount(prev => {
      const nextBet = calculateNextBetForStrategy(autoBetSettings, autoBetStats, "win", prev);
      return Math.max(10, nextBet);
    });
  };
  
  // Auto-bet: Check stop conditions
  useEffect(() => {
    if (!autoBetEnabled) return;
    
    const { stopLoss, takeProfit, maxRounds } = autoBetSettings;
    const { roundsPlayed, totalProfit } = autoBetStats;
    
    // Check stop loss
    if (stopLoss > 0 && totalProfit <= -stopLoss) {
      setAutoBetEnabled(false);
      toast.error(`Auto-bet stopped: Stop loss reached (৳${stopLoss})`);
      return;
    }
    
    // Check take profit
    if (takeProfit > 0 && totalProfit >= takeProfit) {
      setAutoBetEnabled(false);
      toast.success(`Auto-bet stopped: Take profit reached (৳${takeProfit})`);
      return;
    }
    
    // Check max rounds
    if (maxRounds > 0 && roundsPlayed >= maxRounds) {
      setAutoBetEnabled(false);
      toast.info(`Auto-bet stopped: Max rounds reached (${maxRounds})`);
      return;
    }
    
    // Check insufficient balance
    if (balance < currentAutoBetAmount) {
      setAutoBetEnabled(false);
      toast.error("Auto-bet stopped: Insufficient balance");
      return;
    }
  }, [autoBetStats, autoBetEnabled, autoBetSettings, balance, currentAutoBetAmount]);
  
  // Auto-bet: Place bet automatically when betting phase starts
  useEffect(() => {
    if (autoBetEnabled && phase === "betting" && !hasBet && !isPlacingBet) {
      // Small delay to ensure UI is ready
      const timeout = setTimeout(async () => {
        const amount = currentAutoBetAmount;
        
        if (amount > balance) {
          setAutoBetEnabled(false);
          toast.error("Auto-bet stopped: Insufficient balance");
          return;
        }
        
        // Update bet amount display
        setBetAmount(amount.toString());
        
        // Enable auto-cashout with settings
        setAutoCashout(true);
        setAutoCashoutValue(autoBetSettings.autoCashout.toFixed(2));
        
        // Place the bet
        setIsPlacingBet(true);
        try {
          const success = await placeBet(amount, "crash", `crash-auto-${Date.now()}`);
          if (success) {
            setHasBet(true);
            playBetPlaced();
            
            // Save bet to database
            const betId = await saveBetToDatabase(amount);
            if (betId) {
              currentBetIdRef.current = betId;
            }
          } else {
            setAutoBetEnabled(false);
            toast.error("Auto-bet stopped: Failed to place bet");
          }
        } catch (error) {
          setAutoBetEnabled(false);
          toast.error("Auto-bet stopped: Error placing bet");
        } finally {
          setIsPlacingBet(false);
        }
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [autoBetEnabled, phase, hasBet, isPlacingBet, currentAutoBetAmount, balance, autoBetSettings.autoCashout]);
  
  // Reset auto-bet stats
  const handleAutoBetReset = () => {
    setAutoBetStats(defaultAutoBetStats);
    setCurrentAutoBetAmount(autoBetSettings.baseBet);
    lastAutoBetOutcomeRef.current = null;
    autoBetStartBalanceRef.current = balance;
  };
  
  // Handle auto-bet toggle
  const handleAutoBetToggle = (enabled: boolean) => {
    setAutoBetEnabled(enabled);
    if (enabled) {
      setCurrentAutoBetAmount(autoBetSettings.baseBet);
      autoBetStartBalanceRef.current = balance;
      // Set auto-cashout from settings
      setAutoCashout(true);
      setAutoCashoutValue(autoBetSettings.autoCashout.toFixed(2));
    }
  };
  
  // Auto-cashout logic
  useEffect(() => {
    if (
      phase === "running" &&
      hasBet &&
      !hasCashedOut &&
      !isCashingOut &&
      autoCashout
    ) {
      const targetMultiplier = parseFloat(autoCashoutValue);
      if (!isNaN(targetMultiplier) && targetMultiplier >= 1.01 && currentMultiplier >= targetMultiplier) {
        // Trigger auto cashout
        handleAutoCashout(targetMultiplier);
      }
    }
  }, [currentMultiplier, phase, hasBet, hasCashedOut, isCashingOut, autoCashout, autoCashoutValue]);
  
  // Auto cashout handler
  const handleAutoCashout = async (targetMultiplier: number) => {
    if (!hasBet || hasCashedOut || phase !== "running" || isCashingOut) return;
    
    setIsCashingOut(true);
    const amount = parseFloat(betAmount);
    const basePayout = amount * targetMultiplier;
    
    // Calculate streak bonus
    const { finalPayout, bonusAmount, multiplier: streakMult, tier } = calculateStreakPayout(
      basePayout, 
      streakState.currentStreak + 1, // +1 because this win will increase streak
      streakConfig
    );
    
    const payout = finalPayout;
    
    try {
      await claimWinnings(payout, "crash", `crash-auto-${Date.now()}`);
      setHasCashedOut(true);
      setCashoutMultiplier(targetMultiplier);
      setWinAmount(payout);
      setShowCashoutEffect(true);
      setShowConfetti(true);
      // Trigger high-multiplier confetti burst
      if (targetMultiplier >= 1.5) {
        setCashoutConfettiMultiplier(targetMultiplier);
        setShowCashoutConfetti(true);
        setTimeout(() => setShowCashoutConfetti(false), 3000);
      }
      playCashout(targetMultiplier);
      
      // Play big win sound if threshold met
      if (soundSettings.bigWinEnabled && payout >= soundSettings.bigWinThreshold) {
        playBigWin(payout);
      }
      
      // Update streak state
      setIsStreakAnimating(true);
      setStreakState(prev => {
        const newStreak = prev.currentStreak + 1;
        const { multiplier } = getStreakBonus(newStreak, streakConfig);
        return {
          ...prev,
          currentStreak: newStreak,
          highestStreak: Math.max(prev.highestStreak, newStreak),
          currentBonusMultiplier: multiplier,
          totalBonusEarned: prev.totalBonusEarned + bonusAmount,
          lastOutcome: "win",
        };
      });
      setTimeout(() => setIsStreakAnimating(false), 1000);
      
      // Update bet in database with win
      if (currentBetIdRef.current) {
        updateBetWithCashout(currentBetIdRef.current, targetMultiplier, payout);
      }
      
      // Track auto-bet win
      handleAutoBetWin(payout, amount);
      
      // Show streak bonus in toast if applicable
      if (bonusAmount > 0 && tier) {
        toast.success(
          <div className="flex flex-col">
            <span>Auto cashed out at {targetMultiplier.toFixed(2)}x!</span>
            <span className="text-green-300">Won ৳{payout.toFixed(2)}</span>
            <span className="text-amber-300 text-sm">🔥 {tier.name} Streak Bonus: +৳{bonusAmount.toFixed(2)}</span>
          </div>
        );
      } else {
        toast.success(`Auto cashed out at ${targetMultiplier.toFixed(2)}x! Won ৳${payout.toFixed(2)}`);
      }
      
      setTimeout(() => setShowCashoutEffect(false), 2000);
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (error) {
      toast.error("Failed to auto cash out");
    } finally {
      setIsCashingOut(false);
    }
  };

  // Place bet - only allowed during betting phase
  const handlePlaceBet = async () => {
    // Check if in locking phase
    if (phase === "locking") {
      toast.error("Bets are locked for this round. Wait for next round.");
      return;
    }
    
    if (phase !== "betting") {
      toast.error("Wait for next round to place bets");
      return;
    }
    
    const amount = parseFloat(betAmount);
    
    // Validate bet amount
    if (isNaN(amount) || amount < gameSettings.minBet) {
      toast.error(`Minimum bet is ৳${gameSettings.minBet}`);
      return;
    }
    
    if (amount > gameSettings.maxBet) {
      toast.error(`Maximum bet is ৳${gameSettings.maxBet}`);
      return;
    }
    
    if (amount > balance) {
      toast.error(`Insufficient balance (৳${balance.toFixed(2)})`);
      return;
    }
    
    setIsPlacingBet(true);
    try {
      const success = await placeBet(amount, "crash", `crash-${Date.now()}`);
      if (success) {
        setHasBet(true);
        playBetPlaced();
        
        // Save bet to database
        const betId = await saveBetToDatabase(amount);
        if (betId) {
          currentBetIdRef.current = betId;
        }
        
        toast.success(`Bet placed: ৳${amount}`);
      }
    } catch (error) {
      toast.error("Failed to place bet");
    } finally {
      setIsPlacingBet(false);
    }
  };
  
  // Cash out
  const handleCashout = async () => {
    if (!hasBet || hasCashedOut || phase !== "running") return;
    
    setIsCashingOut(true);
    const cashoutMult = currentMultiplier;
    const amount = parseFloat(betAmount);
    const basePayout = amount * cashoutMult;
    
    // Calculate streak bonus
    const { finalPayout, bonusAmount, multiplier: streakMult, tier } = calculateStreakPayout(
      basePayout, 
      streakState.currentStreak + 1, // +1 because this win will increase streak
      streakConfig
    );
    
    const payout = finalPayout;
    
    try {
      await claimWinnings(payout, "crash", `crash-win-${Date.now()}`);
      setHasCashedOut(true);
      setCashoutMultiplier(cashoutMult);
      setWinAmount(payout);
      setShowCashoutEffect(true);
      setShowConfetti(true);
      // Trigger high-multiplier confetti burst
      if (cashoutMult >= 1.5) {
        setCashoutConfettiMultiplier(cashoutMult);
        setShowCashoutConfetti(true);
        setTimeout(() => setShowCashoutConfetti(false), 3000);
      }
      playCashout(cashoutMult);
      
      // Play big win sound if threshold met
      if (soundSettings.bigWinEnabled && payout >= soundSettings.bigWinThreshold) {
        playBigWin(payout);
      }
      
      // Update streak state
      setIsStreakAnimating(true);
      setStreakState(prev => {
        const newStreak = prev.currentStreak + 1;
        const { multiplier } = getStreakBonus(newStreak, streakConfig);
        return {
          ...prev,
          currentStreak: newStreak,
          highestStreak: Math.max(prev.highestStreak, newStreak),
          currentBonusMultiplier: multiplier,
          totalBonusEarned: prev.totalBonusEarned + bonusAmount,
          lastOutcome: "win",
        };
      });
      setTimeout(() => setIsStreakAnimating(false), 1000);
      
      // Update bet in database with win
      if (currentBetIdRef.current) {
        updateBetWithCashout(currentBetIdRef.current, cashoutMult, payout);
      }
      
      // Track auto-bet win (manual cashout during auto-bet)
      handleAutoBetWin(payout, amount);
      
      // Show streak bonus in toast if applicable
      if (bonusAmount > 0 && tier) {
        toast.success(
          <div className="flex flex-col">
            <span>Cashed out at {cashoutMult.toFixed(2)}x!</span>
            <span className="text-green-300">Won ৳{payout.toFixed(2)}</span>
            <span className="text-amber-300 text-sm">🔥 {tier.name} Streak Bonus: +৳{bonusAmount.toFixed(2)}</span>
          </div>
        );
      } else {
        toast.success(`Cashed out at ${cashoutMult.toFixed(2)}x! Won ৳${payout.toFixed(2)}`);
      }
      
      // Hide cashout effect after animation
      setTimeout(() => setShowCashoutEffect(false), 2000);
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (error) {
      toast.error("Failed to cash out");
    } finally {
      setIsCashingOut(false);
    }
  };
  
  // Default bet presets
  const defaultPresets = [50, 100, 250, 500, 1000, 2000];
  
  // Custom bet presets with localStorage persistence
  const [customPresets, setCustomPresets] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem("crash_bet_presets");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 6) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load presets:", e);
    }
    return defaultPresets;
  });
  
  const [showPresetEditor, setShowPresetEditor] = useState(false);
  const [editingPresets, setEditingPresets] = useState<number[]>([...customPresets]);
  
  // Format preset label
  const formatPresetLabel = (amount: number) => {
    if (amount >= 1000) {
      return `৳${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
    }
    return `৳${amount}`;
  };
  
  // Build bet presets with keyboard shortcuts
  const betPresets = customPresets.map((amount, idx) => ({
    amount,
    key: (idx + 1).toString(),
    label: formatPresetLabel(amount),
  }));
  
  // Save presets to localStorage
  const savePresets = () => {
    const validPresets = editingPresets.map(p => Math.max(10, Math.round(p)));
    setCustomPresets(validPresets);
    localStorage.setItem("crash_bet_presets", JSON.stringify(validPresets));
    setShowPresetEditor(false);
    toast.success("Bet presets saved!");
  };
  
  // Reset presets to default
  const resetPresets = () => {
    setEditingPresets([...defaultPresets]);
  };
  
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  
  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const key = e.key.toLowerCase();
      
      // Number keys 1-6 for bet presets (only during betting phase when no bet placed)
      if (!hasBet && phase === "betting") {
        const preset = betPresets.find(p => p.key === key);
        if (preset) {
          e.preventDefault();
          setBetAmount(preset.amount.toString());
          toast.success(`Bet set to ৳${preset.amount}`, { duration: 1000 });
          return;
        }
      }
      
      // Space or Enter to place bet / cashout
      if (key === " " || key === "enter") {
        e.preventDefault();
        if (!hasBet && phase === "betting" && !isPlacingBet) {
          handlePlaceBet();
        } else if (hasBet && !hasCashedOut && phase === "running" && !isCashingOut) {
          handleCashout();
        }
        return;
      }
      
      // Arrow Up to increase bet by 50
      if (key === "arrowup" && !hasBet) {
        e.preventDefault();
        const current = parseFloat(betAmount) || 0;
        setBetAmount((current + 50).toString());
        return;
      }
      
      // Arrow Down to decrease bet by 50
      if (key === "arrowdown" && !hasBet) {
        e.preventDefault();
        const current = parseFloat(betAmount) || 0;
        setBetAmount(Math.max(10, current - 50).toString());
        return;
      }
      
      // D to double bet
      if (key === "d" && !hasBet) {
        e.preventDefault();
        const current = parseFloat(betAmount) || 0;
        setBetAmount((current * 2).toString());
        toast.success("Bet doubled!", { duration: 1000 });
        return;
      }
      
      // H to halve bet
      if (key === "h" && !hasBet) {
        e.preventDefault();
        const current = parseFloat(betAmount) || 0;
        setBetAmount(Math.max(10, Math.floor(current / 2)).toString());
        toast.success("Bet halved!", { duration: 1000 });
        return;
      }
      
      // M to set max bet (balance)
      if (key === "m" && !hasBet) {
        e.preventDefault();
        setBetAmount(Math.floor(balance).toString());
        toast.success("Max bet set!", { duration: 1000 });
        return;
      }
      
      // A to toggle auto-cashout
      if (key === "a" && !hasBet) {
        e.preventDefault();
        setAutoCashout(prev => !prev);
        toast.success(autoCashout ? "Auto-cashout disabled" : "Auto-cashout enabled", { duration: 1000 });
        return;
      }
      
      // S to toggle sound
      if (key === "s") {
        e.preventDefault();
        setSoundEnabled(prev => !prev);
        toast.success(soundEnabled ? "Sound off" : "Sound on", { duration: 1000 });
        return;
      }
      
      // ? or / to show shortcuts help
      if (key === "?" || key === "/") {
        e.preventDefault();
        setShowShortcutsHelp(prev => !prev);
        return;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasBet, phase, isPlacingBet, isCashingOut, hasCashedOut, betAmount, balance, autoCashout, soundEnabled, handlePlaceBet, handleCashout]);
  
  const quickAmounts = [50, 100, 500, 1000];
  
  const getMultiplierColor = (mult: number) => {
    if (mult < 1.5) return "text-gray-400";
    if (mult < 2) return "text-green-400";
    if (mult < 5) return "text-cyan-400";
    if (mult < 10) return "text-purple-400";
    return "text-yellow-400";
  };
  
  const getMultiplierGlow = (mult: number) => {
    if (mult < 1.5) return "";
    if (mult < 2) return "drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]";
    if (mult < 5) return "drop-shadow-[0_0_30px_rgba(34,211,238,0.6)]";
    if (mult < 10) return "drop-shadow-[0_0_40px_rgba(192,132,252,0.7)]";
    return "drop-shadow-[0_0_50px_rgba(250,204,21,0.8)]";
  };
  
  const getResultChipColor = (mult: number) => {
    if (mult < 1.5) return "bg-gray-600";
    if (mult < 2) return "bg-green-600";
    if (mult < 5) return "bg-cyan-600";
    if (mult < 10) return "bg-purple-600";
    return "bg-yellow-500";
  };
  
  return (
    <PageScaffold
      title="Crash | GoLucky"
      description="Play Crash — cash out before the multiplier crashes."
      canonicalPath="/game/crash"
      fullWidth
    >
    <div className={`min-h-screen bg-gradient-to-b from-[#0d1b2a] via-[#1b4332] to-[#0d1b2a] overflow-hidden ${screenShake ? (crashMultiplier && crashMultiplier >= 5 ? 'animate-screen-shake-intense' : 'animate-screen-shake') : ''} ${isSlowMotion ? 'slow-motion-active' : ''} ${preCrashSlowMo ? 'pre-crash-slowmo' : ''}`}>
      {/* Pre-Crash Slow Motion Overlay - Dramatic tension effect */}
      {preCrashSlowMo && (
        <div className="fixed inset-0 z-[9998] pointer-events-none pre-crash-vignette">
          {/* Dark vignette */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at center, transparent 20%, rgba(0, 0, 0, 0.6) 80%)',
            }}
          />
          {/* Red warning tint */}
          <div 
            className="absolute inset-0 animate-pulse"
            style={{
              background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.3) 100%)',
              animationDuration: '0.15s',
            }}
          />
          {/* Time freeze lines */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-[200%] h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{
                  transform: `rotate(${i * 15}deg)`,
                  animation: 'time-freeze-lines 0.3s ease-out forwards',
                  animationDelay: `${i * 0.02}s`,
                }}
              />
            ))}
          </div>
          {/* Center focus glow */}
          <div 
            className="absolute inset-0 flex items-center justify-center"
          >
            <div 
              className="w-32 h-32 rounded-full animate-ping"
              style={{
                background: 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)',
                animationDuration: '0.2s',
              }}
            />
          </div>
          {/* "CRASH" text flash */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className="text-6xl font-black text-red-500/80 animate-pulse tracking-widest"
              style={{
                textShadow: '0 0 40px rgba(239, 68, 68, 0.8), 0 0 80px rgba(239, 68, 68, 0.5)',
                animationDuration: '0.1s',
              }}
            >
              💥
            </span>
          </div>
        </div>
      )}
      
      {/* Slow Motion Overlay Effect */}
      {isSlowMotion && (
        <div className="fixed inset-0 z-[9997] pointer-events-none slow-motion-overlay">
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-purple-900/20" />
          <div className="absolute inset-0 animate-slow-motion-pulse" style={{
            background: 'radial-gradient(circle at center, transparent 30%, rgba(139, 92, 246, 0.1) 70%)',
          }} />
        </div>
      )}
      
      {/* Red Flash Overlay for Crash Impact */}
      {showRedFlash && (
        <div className="fixed inset-0 bg-red-600/40 z-[9999] pointer-events-none animate-crash-flash" />
      )}
      
      {/* Debris Particles for Crash Impact */}
      <CrashDebrisParticles show={showDebris} originX={50} originY={35} />
      
      {/* Smoke Trail Following Rocket */}
      <RocketSmokeTrail 
        isActive={phase === "running"} 
        rocketX={15} 
        rocketY={90 - (10 + rocketY * 0.85)}
      />
      
      {/* Keyboard Shortcuts Help Dialog */}
      <Dialog open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="text-cyan-400" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <h4 className="text-cyan-400 font-medium text-sm">Betting</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2">
                  <span className="text-slate-300">Place Bet / Cashout</span>
                  <kbd className="bg-slate-600 px-2 py-0.5 rounded text-xs font-mono">Space</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2">
                  <span className="text-slate-300">Bet ৳50</span>
                  <kbd className="bg-slate-600 px-2 py-0.5 rounded text-xs font-mono">1</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2">
                  <span className="text-slate-300">Bet ৳100</span>
                  <kbd className="bg-slate-600 px-2 py-0.5 rounded text-xs font-mono">2</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2">
                  <span className="text-slate-300">Bet ৳250</span>
                  <kbd className="bg-slate-600 px-2 py-0.5 rounded text-xs font-mono">3</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2">
                  <span className="text-slate-300">Bet ৳500</span>
                  <kbd className="bg-slate-600 px-2 py-0.5 rounded text-xs font-mono">4</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2">
                  <span className="text-slate-300">Bet ৳1000</span>
                  <kbd className="bg-slate-600 px-2 py-0.5 rounded text-xs font-mono">5</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2">
                  <span className="text-slate-300">Bet ৳2000</span>
                  <kbd className="bg-slate-600 px-2 py-0.5 rounded text-xs font-mono">6</kbd>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-amber-400 font-medium text-sm">Adjustments</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2">
                  <span className="text-slate-300">Increase +৳50</span>
                  <kbd className="bg-slate-600 px-2 py-0.5 rounded text-xs font-mono">↑</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2">
                  <span className="text-slate-300">Decrease -৳50</span>
                  <kbd className="bg-slate-600 px-2 py-0.5 rounded text-xs font-mono">↓</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2">
                  <span className="text-slate-300">Double Bet</span>
                  <kbd className="bg-slate-600 px-2 py-0.5 rounded text-xs font-mono">D</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2">
                  <span className="text-slate-300">Halve Bet</span>
                  <kbd className="bg-slate-600 px-2 py-0.5 rounded text-xs font-mono">H</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2">
                  <span className="text-slate-300">Max Bet</span>
                  <kbd className="bg-slate-600 px-2 py-0.5 rounded text-xs font-mono">M</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2">
                  <span className="text-slate-300">Auto Cashout</span>
                  <kbd className="bg-slate-600 px-2 py-0.5 rounded text-xs font-mono">A</kbd>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-purple-400 font-medium text-sm">General</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2">
                  <span className="text-slate-300">Toggle Sound</span>
                  <kbd className="bg-slate-600 px-2 py-0.5 rounded text-xs font-mono">S</kbd>
                </div>
                <div className="flex items-center justify-between bg-slate-700/50 rounded px-3 py-2">
                  <span className="text-slate-300">Show Shortcuts</span>
                  <kbd className="bg-slate-600 px-2 py-0.5 rounded text-xs font-mono">?</kbd>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Bet Preset Editor Dialog */}
      <Dialog open={showPresetEditor} onOpenChange={setShowPresetEditor}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="text-cyan-400" />
              Customize Bet Presets
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            <p className="text-slate-400 text-sm">
              Set your preferred quick bet amounts. Use keyboard keys 1-6 to select.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {editingPresets.map((preset, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="text-slate-400 text-xs flex items-center gap-1">
                    <kbd className="bg-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono">{idx + 1}</kbd>
                    Preset {idx + 1}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">৳</span>
                    <Input
                      type="number"
                      value={preset}
                      onChange={(e) => {
                        const newPresets = [...editingPresets];
                        newPresets[idx] = parseInt(e.target.value) || 10;
                        setEditingPresets(newPresets);
                      }}
                      className="bg-slate-700 border-slate-600 text-white pl-7 h-10"
                      min={10}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={resetPresets}
                className="flex-1 bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
              >
                <RotateCcw size={14} className="mr-1" />
                Reset
              </Button>
              <Button
                onClick={savePresets}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                <Save size={14} className="mr-1" />
                Save Presets
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Confetti Effect on Cashout */}
      {showConfetti && <Confetti isActive={showConfetti} intensity="big" />}
      
      {/* High-multiplier Cashout Confetti Burst */}
      <CashoutConfetti 
        isActive={showCashoutConfetti} 
        multiplier={cashoutConfettiMultiplier}
        originX={50}
        originY={40}
      />
      
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg flex items-center gap-2">
              <Rocket className="text-orange-500" size={20} />
              Crash Game
            </h1>
            <p className="text-slate-400 text-xs">Cash out before it crashes!</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Resync Button - for manual recovery */}
          <button
            onClick={roundSync.forceResync}
            disabled={isResyncing}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isResyncing ? 'bg-yellow-500 animate-pulse' : 'bg-slate-700 hover:bg-slate-600'}`}
            title="Resync game state"
          >
            <RefreshCw size={16} className={`text-white ${isResyncing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowHistoryTab(!showHistoryTab)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showHistoryTab ? 'bg-cyan-500' : 'bg-slate-700'}`}
          >
            <History size={16} className="text-white" />
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center"
          >
            {soundEnabled ? <Volume2 size={16} className="text-white" /> : <VolumeX size={16} className="text-slate-400" />}
          </button>
          <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-1.5">
            <Wallet size={16} className="text-teal-400" />
            <span className="text-white font-bold">৳{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </header>
      
      {/* History Panel */}
      {showHistoryTab && (
        <div className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold flex items-center gap-2">
              <History size={18} className="text-cyan-400" />
              My Bet History
            </h3>
            <button
              onClick={fetchMyBetHistory}
              disabled={isLoadingHistory}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <RefreshCw size={16} className={isLoadingHistory ? "animate-spin" : ""} />
            </button>
          </div>
          
          <ScrollArea className="h-48">
            {isLoadingHistory ? (
              <div className="text-center text-slate-400 py-4">Loading history...</div>
            ) : myBets.length === 0 ? (
              <div className="text-center text-slate-400 py-4">No bets yet. Place your first bet!</div>
            ) : (
              <div className="space-y-2">
                {myBets.map((bet) => (
                  <div
                    key={bet.id}
                    className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">৳{bet.bet_amount.toLocaleString()}</span>
                        {bet.outcome?.toUpperCase() === "WIN" ? (
                          <Badge className="bg-green-500/20 text-green-400 text-xs">WIN</Badge>
                        ) : bet.outcome?.toUpperCase() === "LOSE" ? (
                          <Badge className="bg-red-500/20 text-red-400 text-xs">LOSE</Badge>
                        ) : (
                          <Badge className="bg-slate-500/20 text-slate-400 text-xs">Pending</Badge>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs mt-1">
                        {format(new Date(bet.placed_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <div className="text-right">
                      {bet.cashout_multiplier ? (
                        <Badge className="bg-cyan-500/20 text-cyan-400 font-bold">
                          {bet.cashout_multiplier.toFixed(2)}x
                        </Badge>
                      ) : null}
                      {bet.outcome?.toUpperCase() === "WIN" && bet.win_amount > 0 && (
                        <p className="text-green-400 font-bold text-sm mt-1">
                          +৳{bet.win_amount.toLocaleString()}
                        </p>
                      )}
                      {bet.outcome?.toUpperCase() === "LOSE" && (
                        <p className="text-red-400 font-medium text-sm mt-1">
                          -৳{bet.bet_amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
      
      {/* Main Game Area */}
      <div className="p-4 space-y-4">
        {/* Game Display - with tension zoom effect */}
        <div 
          className="relative bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#1a0a2e] rounded-2xl p-6 min-h-[320px] flex flex-col items-center justify-center border border-slate-700 overflow-hidden transition-transform duration-300 ease-out"
          style={{
            transform: phase === "running" 
              ? `scale(${1 + Math.min(0.08, currentMultiplier * 0.006)})` 
              : 'scale(1)',
            transformOrigin: 'center 60%', // Focus zoom slightly below center where rocket flies
          }}
        >
          {/* Animated Stars Background */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(40)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-white rounded-full animate-twinkle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${1 + Math.random() * 2}px`,
                  height: `${1 + Math.random() * 2}px`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                  opacity: 0.3 + Math.random() * 0.7,
                }}
              />
            ))}
          </div>
          
          {/* Danger Vignette - intensifies red as multiplier climbs */}
          {phase === "running" && (
            <div 
              className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
              style={{
                background: `
                  radial-gradient(ellipse at center, 
                    transparent ${Math.max(20, 70 - currentMultiplier * 4)}%, 
                    rgba(${Math.min(220, 80 + currentMultiplier * 15)}, ${Math.max(0, 40 - currentMultiplier * 4)}, ${Math.max(0, 60 - currentMultiplier * 6)}, ${Math.min(0.7, 0.1 + currentMultiplier * 0.04)}) 100%
                  )
                `,
                opacity: Math.min(1, 0.3 + currentMultiplier * 0.07),
              }}
            />
          )}
          
          {/* Pulsing danger border glow at high multipliers */}
          {phase === "running" && currentMultiplier >= 3 && (
            <div 
              className="absolute inset-0 pointer-events-none z-10 rounded-2xl"
              style={{
                boxShadow: currentMultiplier >= 10 
                  ? `inset 0 0 ${40 + Math.sin(Date.now() / 80) * 15}px rgba(239, 68, 68, ${0.5 + Math.sin(Date.now() / 100) * 0.2}), inset 0 0 ${80 + Math.sin(Date.now() / 60) * 20}px rgba(185, 28, 28, 0.3)`
                  : currentMultiplier >= 5 
                  ? `inset 0 0 ${30 + Math.sin(Date.now() / 100) * 10}px rgba(239, 68, 68, ${0.35 + Math.sin(Date.now() / 120) * 0.15}), inset 0 0 ${50 + Math.sin(Date.now() / 80) * 15}px rgba(185, 28, 28, 0.2)`
                  : `inset 0 0 ${20 + Math.sin(Date.now() / 150) * 8}px rgba(239, 68, 68, ${0.2 + Math.sin(Date.now() / 150) * 0.1})`,
                animation: `pulse ${Math.max(0.2, 0.8 - currentMultiplier * 0.05)}s ease-in-out infinite`,
              }}
            />
          )}
          
          {/* Corner danger flares at extreme multipliers */}
          {phase === "running" && currentMultiplier >= 7 && (
            <>
              {/* Top-left corner flare */}
              <div 
                className="absolute top-0 left-0 w-32 h-32 pointer-events-none z-10"
                style={{
                  background: `radial-gradient(ellipse at top left, rgba(239, 68, 68, ${0.3 + Math.sin(Date.now() / 100) * 0.15}) 0%, transparent 70%)`,
                  animation: `pulse ${0.4 - currentMultiplier * 0.02}s ease-in-out infinite`,
                }}
              />
              {/* Top-right corner flare */}
              <div 
                className="absolute top-0 right-0 w-32 h-32 pointer-events-none z-10"
                style={{
                  background: `radial-gradient(ellipse at top right, rgba(239, 68, 68, ${0.3 + Math.sin(Date.now() / 120) * 0.15}) 0%, transparent 70%)`,
                  animation: `pulse ${0.45 - currentMultiplier * 0.02}s ease-in-out infinite`,
                  animationDelay: '0.1s',
                }}
              />
              {/* Bottom-left corner flare */}
              <div 
                className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none z-10"
                style={{
                  background: `radial-gradient(ellipse at bottom left, rgba(239, 68, 68, ${0.25 + Math.sin(Date.now() / 140) * 0.12}) 0%, transparent 70%)`,
                  animation: `pulse ${0.5 - currentMultiplier * 0.02}s ease-in-out infinite`,
                  animationDelay: '0.2s',
                }}
              />
              {/* Bottom-right corner flare */}
              <div 
                className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none z-10"
                style={{
                  background: `radial-gradient(ellipse at bottom right, rgba(239, 68, 68, ${0.25 + Math.sin(Date.now() / 130) * 0.12}) 0%, transparent 70%)`,
                  animation: `pulse ${0.35 - currentMultiplier * 0.015}s ease-in-out infinite`,
                  animationDelay: '0.15s',
                }}
              />
            </>
          )}
          
          {/* Chromatic Aberration Effect - glitchy RGB separation at high multipliers */}
          {phase === "running" && currentMultiplier >= 4 && (
            <>
              {/* Red channel shift - left edge */}
              <div 
                className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
                style={{
                  background: `linear-gradient(to right, rgba(255, 0, 0, ${Math.min(0.25, (currentMultiplier - 4) * 0.03 + Math.sin(Date.now() / 80) * 0.08)}) 0%, transparent ${Math.min(25, 8 + currentMultiplier)}%)`,
                  mixBlendMode: 'screen',
                }}
              />
              {/* Cyan channel shift - right edge */}
              <div 
                className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
                style={{
                  background: `linear-gradient(to left, rgba(0, 255, 255, ${Math.min(0.25, (currentMultiplier - 4) * 0.03 + Math.sin(Date.now() / 90) * 0.08)}) 0%, transparent ${Math.min(25, 8 + currentMultiplier)}%)`,
                  mixBlendMode: 'screen',
                }}
              />
              {/* Green/Magenta vertical aberration at extreme multipliers */}
              {currentMultiplier >= 7 && (
                <>
                  <div 
                    className="absolute inset-0 pointer-events-none z-20"
                    style={{
                      background: `linear-gradient(to bottom, rgba(255, 0, 255, ${Math.min(0.2, (currentMultiplier - 7) * 0.025 + Math.sin(Date.now() / 70) * 0.06)}) 0%, transparent ${Math.min(20, 6 + currentMultiplier * 0.8)}%)`,
                      mixBlendMode: 'screen',
                    }}
                  />
                  <div 
                    className="absolute inset-0 pointer-events-none z-20"
                    style={{
                      background: `linear-gradient(to top, rgba(0, 255, 0, ${Math.min(0.18, (currentMultiplier - 7) * 0.02 + Math.sin(Date.now() / 100) * 0.05)}) 0%, transparent ${Math.min(18, 5 + currentMultiplier * 0.7)}%)`,
                      mixBlendMode: 'screen',
                    }}
                  />
                </>
              )}
              
              {/* Glitch scan lines at very high multipliers */}
              {currentMultiplier >= 8 && (
                <div 
                  className="absolute inset-0 pointer-events-none z-20"
                  style={{
                    background: `repeating-linear-gradient(
                      0deg,
                      transparent,
                      transparent 2px,
                      rgba(255, 255, 255, ${0.02 + Math.sin(Date.now() / 50) * 0.015}) 2px,
                      rgba(255, 255, 255, ${0.02 + Math.sin(Date.now() / 50) * 0.015}) 4px
                    )`,
                    animation: `glitch-scan ${Math.max(0.1, 0.5 - currentMultiplier * 0.03)}s steps(10) infinite`,
                  }}
                />
              )}
              
              {/* Corner RGB split flares for legendary multipliers */}
              {currentMultiplier >= 10 && (
                <>
                  {/* Top-left RGB split */}
                  <div className="absolute top-0 left-0 w-24 h-24 pointer-events-none z-20">
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: 'radial-gradient(ellipse at top left, rgba(255,0,0,0.4) 0%, transparent 60%)',
                        transform: `translate(${2 + Math.sin(Date.now() / 60) * 3}px, ${1 + Math.sin(Date.now() / 70) * 2}px)`,
                      }}
                    />
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: 'radial-gradient(ellipse at top left, rgba(0,255,0,0.3) 0%, transparent 55%)',
                        transform: `translate(${-1 + Math.sin(Date.now() / 80) * 2}px, ${2 + Math.sin(Date.now() / 65) * 2}px)`,
                      }}
                    />
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: 'radial-gradient(ellipse at top left, rgba(0,0,255,0.35) 0%, transparent 50%)',
                        transform: `translate(${-2 + Math.sin(Date.now() / 75) * 2}px, ${-1 + Math.sin(Date.now() / 85) * 2}px)`,
                      }}
                    />
                  </div>
                  {/* Bottom-right RGB split */}
                  <div className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none z-20">
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: 'radial-gradient(ellipse at bottom right, rgba(255,0,0,0.4) 0%, transparent 60%)',
                        transform: `translate(${-2 + Math.sin(Date.now() / 55) * 3}px, ${-1 + Math.sin(Date.now() / 75) * 2}px)`,
                      }}
                    />
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: 'radial-gradient(ellipse at bottom right, rgba(0,255,0,0.3) 0%, transparent 55%)',
                        transform: `translate(${1 + Math.sin(Date.now() / 85) * 2}px, ${-2 + Math.sin(Date.now() / 60) * 2}px)`,
                      }}
                    />
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: 'radial-gradient(ellipse at bottom right, rgba(0,0,255,0.35) 0%, transparent 50%)',
                        transform: `translate(${2 + Math.sin(Date.now() / 70) * 2}px, ${1 + Math.sin(Date.now() / 90) * 2}px)`,
                      }}
                    />
                  </div>
                </>
              )}
            </>
          )}
          
          {/* Locking Phase Edge Glow Effect - intensifies as countdown progresses */}
          {phase === "locking" && (
            <>
              {/* Top edge glow */}
              <div 
                className="absolute top-0 left-0 right-0 h-24 pointer-events-none z-10"
                style={{
                  background: `linear-gradient(to bottom, 
                    rgba(${lockingCountdown <= 1 ? '239, 68, 68' : '234, 179, 8'}, ${0.15 + (2 - lockingCountdown) * 0.2}) 0%, 
                    transparent 100%)`,
                  animation: lockingCountdown <= 1 ? 'pulse 0.3s ease-in-out infinite' : 'pulse 0.8s ease-in-out infinite',
                }}
              />
              {/* Bottom edge glow */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-10"
                style={{
                  background: `linear-gradient(to top, 
                    rgba(${lockingCountdown <= 1 ? '239, 68, 68' : '234, 179, 8'}, ${0.15 + (2 - lockingCountdown) * 0.2}) 0%, 
                    transparent 100%)`,
                  animation: lockingCountdown <= 1 ? 'pulse 0.3s ease-in-out infinite' : 'pulse 0.8s ease-in-out infinite',
                }}
              />
              {/* Left edge glow */}
              <div 
                className="absolute top-0 bottom-0 left-0 w-20 pointer-events-none z-10"
                style={{
                  background: `linear-gradient(to right, 
                    rgba(${lockingCountdown <= 1 ? '239, 68, 68' : '234, 179, 8'}, ${0.15 + (2 - lockingCountdown) * 0.2}) 0%, 
                    transparent 100%)`,
                  animation: lockingCountdown <= 1 ? 'pulse 0.3s ease-in-out infinite' : 'pulse 0.8s ease-in-out infinite',
                }}
              />
              {/* Right edge glow */}
              <div 
                className="absolute top-0 bottom-0 right-0 w-20 pointer-events-none z-10"
                style={{
                  background: `linear-gradient(to left, 
                    rgba(${lockingCountdown <= 1 ? '239, 68, 68' : '234, 179, 8'}, ${0.15 + (2 - lockingCountdown) * 0.2}) 0%, 
                    transparent 100%)`,
                  animation: lockingCountdown <= 1 ? 'pulse 0.3s ease-in-out infinite' : 'pulse 0.8s ease-in-out infinite',
                }}
              />
              {/* Corner accent glows - more intense */}
              <div 
                className="absolute top-0 left-0 w-32 h-32 pointer-events-none z-10"
                style={{
                  background: `radial-gradient(circle at top left, 
                    rgba(${lockingCountdown <= 1 ? '239, 68, 68' : '251, 146, 60'}, ${0.25 + (2 - lockingCountdown) * 0.25}) 0%, 
                    transparent 70%)`,
                }}
              />
              <div 
                className="absolute top-0 right-0 w-32 h-32 pointer-events-none z-10"
                style={{
                  background: `radial-gradient(circle at top right, 
                    rgba(${lockingCountdown <= 1 ? '239, 68, 68' : '251, 146, 60'}, ${0.25 + (2 - lockingCountdown) * 0.25}) 0%, 
                    transparent 70%)`,
                }}
              />
              <div 
                className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none z-10"
                style={{
                  background: `radial-gradient(circle at bottom left, 
                    rgba(${lockingCountdown <= 1 ? '239, 68, 68' : '251, 146, 60'}, ${0.25 + (2 - lockingCountdown) * 0.25}) 0%, 
                    transparent 70%)`,
                }}
              />
              <div 
                className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none z-10"
                style={{
                  background: `radial-gradient(circle at bottom right, 
                    rgba(${lockingCountdown <= 1 ? '239, 68, 68' : '251, 146, 60'}, ${0.25 + (2 - lockingCountdown) * 0.25}) 0%, 
                    transparent 70%)`,
                }}
              />
            </>
          )}
          
          {/* Vertical Flight Path on left side (visible during running) */}
          {phase === "running" && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              <defs>
                {/* Dynamic gradient based on multiplier */}
                <linearGradient id="pathGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor={
                    currentMultiplier >= 10 ? "rgba(234, 179, 8, 0.9)" :
                    currentMultiplier >= 5 ? "rgba(168, 85, 247, 0.8)" :
                    currentMultiplier >= 2 ? "rgba(139, 92, 246, 0.7)" :
                    "rgba(34, 211, 238, 0.8)"
                  } />
                  <stop offset="50%" stopColor={
                    currentMultiplier >= 10 ? "rgba(251, 146, 60, 0.6)" :
                    currentMultiplier >= 5 ? "rgba(192, 132, 252, 0.5)" :
                    currentMultiplier >= 2 ? "rgba(167, 139, 250, 0.4)" :
                    "rgba(34, 211, 238, 0.4)"
                  } />
                  <stop offset="100%" stopColor={
                    currentMultiplier >= 10 ? "rgba(253, 224, 71, 0.3)" :
                    currentMultiplier >= 5 ? "rgba(216, 180, 254, 0.2)" :
                    currentMultiplier >= 2 ? "rgba(196, 181, 253, 0.2)" :
                    "rgba(34, 211, 238, 0.1)"
                  } />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              {/* Vertical trail line on left side - showing rocket's path */}
              <path
                d={`M 60,${300 - rocketY * 2.8} L 60,300`}
                fill="none"
                stroke="url(#pathGradient)"
                strokeWidth={3 + Math.min(currentMultiplier * 0.2, 2)}
                strokeLinecap="round"
                filter="url(#glow)"
                opacity={0.7 + Math.min(currentMultiplier * 0.02, 0.2)}
              />
              {/* Glowing dots along the path - color changes with multiplier */}
              {[...Array(5)].map((_, i) => {
                const dotY = 300 - (rocketY * 2.8 * (i + 1) / 6);
                const dotColor = currentMultiplier >= 10 
                  ? `rgba(253, 224, 71, ${0.4 + i * 0.12})` 
                  : currentMultiplier >= 5 
                  ? `rgba(192, 132, 252, ${0.3 + i * 0.1})` 
                  : currentMultiplier >= 2 
                  ? `rgba(167, 139, 250, ${0.3 + i * 0.1})` 
                  : `rgba(34, 211, 238, ${0.3 + i * 0.1})`;
                return dotY > 20 && dotY < 290 ? (
                  <circle
                    key={i}
                    cx="60"
                    cy={dotY}
                    r={2 + (5 - i) * 0.5 + (currentMultiplier >= 5 ? 1 : 0)}
                    fill={dotColor}
                    className="animate-pulse"
                  />
                ) : null;
              })}
            </svg>
          )}
          
          {/* Particle Trail System - follows rocket on left side going up */}
          {phase === "running" && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Fire particles trailing behind rocket - colors change with multiplier */}
              {[...Array(15)].map((_, i) => {
                const delay = i * 0.08;
                // Rocket is at left side (x ~15%) moving upward
                const rocketX = 15;
                const rocketBottomY = 10 + rocketY * 0.85;
                
                // Dynamic color palette based on multiplier
                const getParticleColors = () => {
                  if (currentMultiplier >= 10) {
                    // Gold/yellow theme
                    return {
                      colors: ['rgba(253,224,71,0.95)', 'rgba(234,179,8,0.9)', 'rgba(251,191,36,0.85)', 'rgba(255,255,255,0.95)'],
                      shadows: ['rgba(253,224,71,0.7)', 'rgba(234,179,8,0.6)', 'rgba(251,191,36,0.5)']
                    };
                  } else if (currentMultiplier >= 5) {
                    // Purple theme
                    return {
                      colors: ['rgba(192,132,252,0.9)', 'rgba(168,85,247,0.85)', 'rgba(139,92,246,0.8)', 'rgba(255,255,255,0.9)'],
                      shadows: ['rgba(192,132,252,0.6)', 'rgba(168,85,247,0.5)', 'rgba(139,92,246,0.4)']
                    };
                  } else if (currentMultiplier >= 2) {
                    // Violet/indigo theme
                    return {
                      colors: ['rgba(167,139,250,0.9)', 'rgba(139,92,246,0.85)', 'rgba(99,102,241,0.8)', 'rgba(255,255,255,0.9)'],
                      shadows: ['rgba(167,139,250,0.6)', 'rgba(139,92,246,0.5)', 'rgba(99,102,241,0.4)']
                    };
                  } else {
                    // Cyan/blue theme (default)
                    return {
                      colors: ['rgba(34,211,238,0.9)', 'rgba(6,182,212,0.85)', 'rgba(14,165,233,0.8)', 'rgba(255,255,255,0.9)'],
                      shadows: ['rgba(34,211,238,0.6)', 'rgba(6,182,212,0.5)', 'rgba(14,165,233,0.4)']
                    };
                  }
                };
                
                const palette = getParticleColors();
                
                return (
                  <div
                    key={`particle-${i}-${Math.floor(Date.now() / 100)}`}
                    className="absolute animate-particle-fall"
                    style={{
                      left: `${rocketX - 1 + (Math.random() - 0.5) * 4}%`,
                      bottom: `${rocketBottomY - 8 - i * 2 + (Math.random() - 0.5) * 3}%`,
                      animationDelay: `${delay}s`,
                      animationDuration: `${0.8 + Math.random() * 0.4}s`,
                    }}
                  >
                    <div
                      className="rounded-full"
                      style={{
                        width: `${4 + Math.random() * 8}px`,
                        height: `${4 + Math.random() * 8}px`,
                        background: `radial-gradient(circle, ${
                          palette.colors[Math.floor(Math.random() * palette.colors.length)]
                        } 0%, transparent 70%)`,
                        boxShadow: `0 0 ${6 + Math.random() * 10}px ${palette.shadows[Math.floor(Math.random() * palette.shadows.length)]}`,
                      }}
                    />
                  </div>
                );
              })}
              
              {/* Smoke trail particles - fall downward from rocket */}
              {currentMultiplier > 1.5 && [...Array(10)].map((_, i) => (
                <div
                  key={`smoke-${i}`}
                  className="absolute animate-smoke-fall"
                  style={{
                    left: `${15 - 1 + (Math.random() - 0.5) * 6}%`,
                    bottom: `${10 + rocketY * 0.85 - 15 - i * 4}%`,
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: `${1.5 + Math.random() * 0.8}s`,
                    opacity: Math.max(0, 0.5 - i * 0.05),
                  }}
                >
                  <div
                    className="rounded-full blur-md"
                    style={{
                      width: `${12 + Math.random() * 16}px`,
                      height: `${12 + Math.random() * 16}px`,
                      background: currentMultiplier >= 10 
                        ? 'rgba(253,224,71,0.15)' 
                        : currentMultiplier >= 5 
                        ? 'rgba(168,85,247,0.15)' 
                        : currentMultiplier >= 2 
                        ? 'rgba(139,92,246,0.15)' 
                        : 'rgba(148,163,184,0.2)',
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Animated Rocket - flies up along left side */}
          <div 
            className={`absolute transition-all ${phase === "crashed" ? "opacity-0 scale-[2] duration-300" : "opacity-100 duration-75"}`}
            style={{ 
              // Rocket starts at bottom-left and flies straight up
              bottom: `${10 + rocketY * 0.85}%`,
              left: '15%',
              // Slight tilt as it flies up, with subtle wobble
              transform: `rotate(${phase === "running" ? -15 + Math.sin(Date.now() / 400) * 2 : phase === "locking" ? -5 : 0}deg)`,
            }}
          >
            {/* IGNITION PHASE - During Locking */}
            {phase === "locking" && (
              <>
                {/* Ignition sparks shooting outward */}
                <div className="absolute top-[80%] left-1/2 -translate-x-1/2">
                  {[...Array(12)].map((_, i) => {
                    const angle = (i * 30) - 90; // Spread sparks in a semicircle downward
                    const distance = 20 + Math.random() * 30;
                    return (
                      <div
                        key={`spark-${i}`}
                        className="absolute animate-ignition-spark"
                        style={{
                          left: `${Math.cos(angle * Math.PI / 180) * distance}px`,
                          top: `${Math.sin(angle * Math.PI / 180) * distance + 10}px`,
                          animationDelay: `${Math.random() * 0.5}s`,
                          animationDuration: `${0.3 + Math.random() * 0.4}s`,
                        }}
                      >
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: ['#fbbf24', '#f97316', '#ef4444', '#ffffff'][Math.floor(Math.random() * 4)],
                            boxShadow: `0 0 6px ${['rgba(251,191,36,0.8)', 'rgba(249,115,22,0.8)', 'rgba(239,68,68,0.8)'][Math.floor(Math.random() * 3)]}`,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                
                {/* Pre-ignition smoke puffs */}
                <div className="absolute top-[85%] left-1/2 -translate-x-1/2">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={`smoke-puff-${i}`}
                      className="absolute animate-smoke-puff"
                      style={{
                        left: `${(Math.random() - 0.5) * 60}px`,
                        top: `${10 + Math.random() * 20}px`,
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: `${1 + Math.random() * 0.5}s`,
                      }}
                    >
                      <div 
                        className="rounded-full blur-md"
                        style={{
                          width: `${15 + Math.random() * 20}px`,
                          height: `${15 + Math.random() * 20}px`,
                          background: `radial-gradient(circle, rgba(100,116,139,${0.4 + Math.random() * 0.3}) 0%, transparent 70%)`,
                        }}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Small ignition flame flickering */}
                <div className="absolute top-[75%] left-1/2 -translate-x-1/2 origin-top animate-ignition-flicker">
                  <div 
                    className="w-4 bg-gradient-to-b from-white via-yellow-400 to-orange-500 rounded-full blur-[1px]"
                    style={{ 
                      height: `${15 + Math.sin(Date.now() / 30) * 10}px`,
                    }}
                  />
                  <div 
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-2 bg-gradient-to-b from-white via-yellow-200 to-transparent rounded-full"
                    style={{ 
                      height: `${8 + Math.sin(Date.now() / 25) * 5}px`,
                    }}
                  />
                </div>
                
                {/* Ignition glow around rocket base */}
                <div 
                  className="absolute top-[70%] left-1/2 -translate-x-1/2 w-20 h-20 rounded-full animate-pulse"
                  style={{
                    background: 'radial-gradient(circle, rgba(251,146,60,0.4) 0%, rgba(239,68,68,0.2) 40%, transparent 70%)',
                    animationDuration: '0.2s',
                    filter: 'blur(8px)',
                  }}
                />
                
                {/* Vibration effect on rocket */}
                <div className="animate-rocket-vibrate">
                  <img 
                    src="/assets/images/games/crash-rocket.png" 
                    alt="Rocket animation" 
                    className="w-20 h-20 object-contain"
                    style={{ 
                      filter: 'drop-shadow(0 0 15px rgba(251, 146, 60, 0.6))',
                    }}
                  />
                </div>
              </>
            )}
            
            {/* FLYING PHASE - Rocket Exhaust Trail - Dynamic colors based on multiplier */}
            {phase === "running" && (
              <div className="absolute top-[75%] left-1/2 -translate-x-1/2 rotate-[15deg] origin-top">
                {/* Outer glow - color changes with multiplier */}
                <div 
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-28 rounded-full blur-xl animate-pulse"
                  style={{ 
                    animationDuration: '0.12s',
                    background: currentMultiplier >= 10 
                      ? 'linear-gradient(to bottom, rgba(253,224,71,0.7), rgba(234,179,8,0.5), transparent)'
                      : currentMultiplier >= 5 
                      ? 'linear-gradient(to bottom, rgba(192,132,252,0.6), rgba(139,92,246,0.4), transparent)'
                      : currentMultiplier >= 2 
                      ? 'linear-gradient(to bottom, rgba(167,139,250,0.6), rgba(99,102,241,0.4), transparent)'
                      : 'linear-gradient(to bottom, rgba(34,211,238,0.6), rgba(6,182,212,0.4), transparent)'
                  }}
                />
                {/* Main flame - dynamic gradient */}
                <div 
                  className="relative w-6 rounded-full blur-[2px]"
                  style={{ 
                    height: `${50 + Math.sin(Date.now() / 40) * 18}px`,
                    transition: 'height 0.04s ease-out, background 0.3s ease-out',
                    background: currentMultiplier >= 10 
                      ? 'linear-gradient(to bottom, white, #fde047, #eab308, #ca8a04)'
                      : currentMultiplier >= 5 
                      ? 'linear-gradient(to bottom, white, #c4b5fd, #a855f7, #7c3aed)'
                      : currentMultiplier >= 2 
                      ? 'linear-gradient(to bottom, white, #a5b4fc, #818cf8, #6366f1)'
                      : 'linear-gradient(to bottom, white, #a5f3fc, #22d3ee, #0891b2)'
                  }}
                />
                {/* Inner white core */}
                <div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-2 rounded-full"
                  style={{ 
                    height: `${30 + Math.sin(Date.now() / 35) * 12}px`,
                    background: currentMultiplier >= 10 
                      ? 'linear-gradient(to bottom, white, #fef9c3, transparent)'
                      : currentMultiplier >= 5 
                      ? 'linear-gradient(to bottom, white, #ede9fe, transparent)'
                      : currentMultiplier >= 2 
                      ? 'linear-gradient(to bottom, white, #e0e7ff, transparent)'
                      : 'linear-gradient(to bottom, white, #cffafe, transparent)'
                  }}
                />
                {/* Flame particles falling down - dynamic colors */}
                {[...Array(5)].map((_, i) => {
                  const particleColor = currentMultiplier >= 10 
                    ? ['#fde047', '#eab308', '#fbbf24'][i % 3]
                    : currentMultiplier >= 5 
                    ? ['#c4b5fd', '#a855f7', '#8b5cf6'][i % 3]
                    : currentMultiplier >= 2 
                    ? ['#a5b4fc', '#818cf8', '#6366f1'][i % 3]
                    : ['#a5f3fc', '#22d3ee', '#06b6d4'][i % 3];
                  return (
                    <div
                      key={i}
                      className="absolute rounded-full animate-ping"
                      style={{
                        width: `${2 + Math.random() * 3}px`,
                        height: `${2 + Math.random() * 3}px`,
                        left: `${40 + (Math.random() - 0.5) * 40}%`,
                        top: `${45 + i * 12}%`,
                        opacity: 0.8 - i * 0.15,
                        animationDuration: `${0.25 + Math.random() * 0.2}s`,
                        backgroundColor: particleColor,
                      }}
                    />
                  );
                })}
              </div>
            )}
            
            
            {/* Engine Fire Particles - during running */}
            {phase === "running" && (
              <div className="absolute top-[70%] left-1/2 -translate-x-1/2 w-24 h-32">
                <RocketEngineFireParticles 
                  isActive={true} 
                  intensity={Math.min(10, 3 + currentMultiplier * 0.5)} 
                />
              </div>
            )}
            
            {/* Dynamic Rocket Glow Aura - pulses faster and brighter at higher multipliers */}
            {phase === "running" && (
              <>
                {/* Outer soft glow - largest, slowest pulse */}
                <div 
                  className="absolute rounded-full blur-3xl animate-pulse pointer-events-none"
                  style={{
                    inset: currentMultiplier >= 10 ? -48 : currentMultiplier >= 5 ? -40 : currentMultiplier >= 2 ? -32 : -24,
                    background: currentMultiplier >= 10 
                      ? `radial-gradient(circle, rgba(253,224,71,${0.4 + Math.sin(Date.now() / 100) * 0.2}) 0%, rgba(234,179,8,0.2) 40%, transparent 70%)`
                      : currentMultiplier >= 5 
                      ? `radial-gradient(circle, rgba(192,132,252,${0.35 + Math.sin(Date.now() / 120) * 0.15}) 0%, rgba(139,92,246,0.2) 40%, transparent 70%)`
                      : currentMultiplier >= 2 
                      ? `radial-gradient(circle, rgba(129,140,248,${0.3 + Math.sin(Date.now() / 150) * 0.1}) 0%, rgba(99,102,241,0.15) 40%, transparent 70%)`
                      : `radial-gradient(circle, rgba(34,211,238,${0.25 + Math.sin(Date.now() / 200) * 0.1}) 0%, rgba(6,182,212,0.1) 40%, transparent 70%)`,
                    animationDuration: `${Math.max(0.15, 0.6 - currentMultiplier * 0.03)}s`,
                  }}
                />
                
                {/* Middle glow layer - medium pulse */}
                <div 
                  className="absolute rounded-full blur-xl animate-pulse pointer-events-none"
                  style={{
                    inset: currentMultiplier >= 10 ? -28 : currentMultiplier >= 5 ? -24 : currentMultiplier >= 2 ? -18 : -12,
                    background: currentMultiplier >= 10 
                      ? `radial-gradient(circle, rgba(253,224,71,${0.5 + Math.sin(Date.now() / 80) * 0.2}) 0%, rgba(251,191,36,0.3) 50%, transparent 75%)`
                      : currentMultiplier >= 5 
                      ? `radial-gradient(circle, rgba(216,180,254,${0.45 + Math.sin(Date.now() / 100) * 0.15}) 0%, rgba(168,85,247,0.25) 50%, transparent 75%)`
                      : currentMultiplier >= 2 
                      ? `radial-gradient(circle, rgba(165,180,252,${0.4 + Math.sin(Date.now() / 120) * 0.12}) 0%, rgba(129,140,248,0.2) 50%, transparent 75%)`
                      : `radial-gradient(circle, rgba(103,232,249,${0.35 + Math.sin(Date.now() / 150) * 0.1}) 0%, rgba(34,211,238,0.15) 50%, transparent 75%)`,
                    animationDuration: `${Math.max(0.1, 0.4 - currentMultiplier * 0.025)}s`,
                  }}
                />
                
                {/* Inner bright core glow - fastest pulse */}
                <div 
                  className="absolute rounded-full blur-lg pointer-events-none"
                  style={{
                    inset: currentMultiplier >= 10 ? -14 : currentMultiplier >= 5 ? -10 : currentMultiplier >= 2 ? -8 : -6,
                    background: currentMultiplier >= 10 
                      ? `radial-gradient(circle, rgba(255,255,255,${0.7 + Math.sin(Date.now() / 50) * 0.3}) 0%, rgba(253,224,71,0.5) 40%, transparent 70%)`
                      : currentMultiplier >= 5 
                      ? `radial-gradient(circle, rgba(255,255,255,${0.6 + Math.sin(Date.now() / 60) * 0.25}) 0%, rgba(192,132,252,0.4) 40%, transparent 70%)`
                      : currentMultiplier >= 2 
                      ? `radial-gradient(circle, rgba(255,255,255,${0.5 + Math.sin(Date.now() / 80) * 0.2}) 0%, rgba(165,180,252,0.35) 40%, transparent 70%)`
                      : `radial-gradient(circle, rgba(255,255,255,${0.4 + Math.sin(Date.now() / 100) * 0.15}) 0%, rgba(103,232,249,0.25) 40%, transparent 70%)`,
                    animation: `pulse ${Math.max(0.08, 0.25 - currentMultiplier * 0.015)}s ease-in-out infinite`,
                  }}
                />
                
                {/* Rotating halo ring for 5x+ multipliers */}
                {currentMultiplier >= 5 && (
                  <div 
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      inset: currentMultiplier >= 10 ? -36 : -28,
                      border: currentMultiplier >= 10 
                        ? '2px solid rgba(253,224,71,0.4)' 
                        : '2px solid rgba(192,132,252,0.35)',
                      boxShadow: currentMultiplier >= 10 
                        ? '0 0 20px rgba(253,224,71,0.3), inset 0 0 20px rgba(253,224,71,0.2)'
                        : '0 0 15px rgba(192,132,252,0.25), inset 0 0 15px rgba(192,132,252,0.15)',
                      animation: `spin ${Math.max(1, 4 - currentMultiplier * 0.2)}s linear infinite`,
                      background: `conic-gradient(from 0deg, transparent, ${currentMultiplier >= 10 ? 'rgba(253,224,71,0.4)' : 'rgba(192,132,252,0.3)'}, transparent, ${currentMultiplier >= 10 ? 'rgba(253,224,71,0.4)' : 'rgba(192,132,252,0.3)'}, transparent)`,
                    }}
                  />
                )}
                
                {/* Secondary rotating ring (opposite direction) for 10x+ */}
                {currentMultiplier >= 10 && (
                  <div 
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      inset: -44,
                      border: '1px solid rgba(251,191,36,0.3)',
                      boxShadow: '0 0 25px rgba(251,191,36,0.25)',
                      animation: 'spin 2s linear infinite reverse',
                      background: 'conic-gradient(from 45deg, transparent, rgba(251,191,36,0.3), transparent, rgba(251,191,36,0.3), transparent)',
                    }}
                  />
                )}
                
                {/* Pulsing energy spikes for legendary multipliers */}
                {currentMultiplier >= 10 && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute left-1/2 top-1/2 origin-center"
                        style={{
                          width: 3,
                          height: 30 + Math.sin(Date.now() / 100 + i) * 10,
                          background: 'linear-gradient(to top, transparent, rgba(253,224,71,0.6), rgba(255,255,255,0.8))',
                          transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-40px)`,
                          filter: 'blur(1px)',
                          animation: `pulse ${0.15 + (i % 3) * 0.05}s ease-in-out infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
            
            {/* Rocket Image - during running and other phases (except locking which has its own) */}
            {phase !== "locking" && (
              <img 
                src="/assets/images/games/crash-rocket.png" 
                alt="Rocket animation" 
                className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(251,146,60,0.5)]"
                style={{ 
                  filter: phase === "running" ? `drop-shadow(0 0 ${20 + currentMultiplier * 2}px rgba(251, 146, 60, ${0.7 + currentMultiplier * 0.03}))` : 'none',
                }}
              />
            )}
            
            {/* Speed lines below rocket (showing upward motion) */}
            {phase === "running" && currentMultiplier > 1.5 && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute bg-gradient-to-t from-cyan-400/60 to-transparent w-0.5 rounded-full"
                    style={{
                      height: `${20 + i * 8 + currentMultiplier * 1.5}px`,
                      left: `${30 + i * 12}%`,
                      bottom: `${-25 - i * 10}px`,
                      opacity: 0.7 - i * 0.15,
                      animation: `pulse ${0.3 + i * 0.1}s ease-in-out infinite`,
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Energy ring at high multipliers */}
            {phase === "running" && currentMultiplier > 5 && (
              <div className="absolute inset-0 -m-8">
                <div 
                  className="w-full h-full rounded-full border-2 border-cyan-400/50 animate-ping"
                  style={{ animationDuration: '1s' }}
                />
              </div>
            )}
          </div>
          
          {/* Crash Explosion Effect - at rocket's last position */}
          {showCrashExplosion && (
            <div 
              className="absolute pointer-events-none z-20"
              style={{
                // Position where rocket was (left side, near top based on rocketY)
                bottom: `${10 + rocketY * 0.85}%`,
                left: '15%',
                transform: 'translate(-50%, 50%)',
              }}
            >
              <div className="relative">
                {/* Large shockwave ripples emanating outward */}
                {[...Array(5)].map((_, i) => (
                  <div
                    key={`shockwave-${i}`}
                    className="absolute rounded-full border-2"
                    style={{
                      width: '20px',
                      height: '20px',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      borderColor: i < 2 ? 'rgba(255, 255, 255, 0.8)' : i < 4 ? 'rgba(251, 146, 60, 0.6)' : 'rgba(239, 68, 68, 0.4)',
                      animation: `shockwave-ripple ${0.8 + i * 0.15}s ease-out forwards`,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                ))}
                
                {/* Distortion ring effect */}
                <div 
                  className="absolute rounded-full"
                  style={{
                    width: '40px',
                    height: '40px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'radial-gradient(circle, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
                    animation: 'shockwave-distort 0.6s ease-out forwards',
                  }}
                />
                
                {/* Expanding shockwave rings - original but enhanced */}
                <div className="absolute -inset-24 bg-red-500/30 rounded-full animate-ping" style={{ animationDuration: '0.6s' }} />
                <div className="absolute -inset-20 bg-orange-500/40 rounded-full animate-ping" style={{ animationDelay: '0.08s', animationDuration: '0.5s' }} />
                <div className="absolute -inset-14 bg-yellow-500/50 rounded-full animate-ping" style={{ animationDelay: '0.15s', animationDuration: '0.4s' }} />
                
                {/* Ground impact shockwave - horizontal spread */}
                <div 
                  className="absolute"
                  style={{
                    width: '10px',
                    height: '4px',
                    left: '50%',
                    top: '60%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(90deg, transparent, rgba(255,200,100,0.8), transparent)',
                    animation: 'ground-shockwave 0.5s ease-out forwards',
                  }}
                />
                
                {/* Energy burst rays */}
                {[...Array(16)].map((_, i) => (
                  <div
                    key={`ray-${i}`}
                    className="absolute"
                    style={{
                      width: '2px',
                      height: '60px',
                      left: '50%',
                      top: '50%',
                      transformOrigin: 'center top',
                      transform: `translateX(-50%) rotate(${i * 22.5}deg)`,
                      background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(251,146,60,0.6), transparent)',
                      animation: `energy-ray 0.4s ease-out forwards`,
                      animationDelay: `${i * 0.02}s`,
                    }}
                  />
                ))}
                
                {/* Central explosion */}
                <div className="text-7xl animate-bounce" style={{ animationDuration: '0.3s' }}>💥</div>
                
                {/* Flying debris particles */}
                {[...Array(12)].map((_, i) => {
                  const angle = i * 30;
                  const distance = 60 + Math.random() * 40;
                  return (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-orange-500 rounded-full"
                      style={{
                        left: `${Math.cos(angle * Math.PI / 180) * distance}px`,
                        top: `${Math.sin(angle * Math.PI / 180) * distance}px`,
                        animation: `ping 0.6s ease-out forwards`,
                        animationDelay: `${i * 0.03}s`,
                        boxShadow: '0 0 8px rgba(251, 146, 60, 0.8)',
                      }}
                    />
                  );
                })}
                
                {/* Sparks */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={`spark-${i}`}
                    className="absolute w-1 h-4 bg-gradient-to-t from-yellow-400 to-white rounded-full"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `rotate(${i * 45}deg) translateY(-${30 + Math.random() * 20}px)`,
                      animation: `ping 0.4s ease-out forwards`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                ))}
                
                {/* Smoke clouds after explosion */}
                {[...Array(6)].map((_, i) => (
                  <div
                    key={`smoke-cloud-${i}`}
                    className="absolute rounded-full blur-md"
                    style={{
                      width: `${30 + Math.random() * 20}px`,
                      height: `${30 + Math.random() * 20}px`,
                      left: `${(Math.random() - 0.5) * 80}px`,
                      top: `${(Math.random() - 0.5) * 80}px`,
                      background: `radial-gradient(circle, rgba(100,100,100,${0.4 + Math.random() * 0.3}) 0%, transparent 70%)`,
                      animation: 'smoke-rise 1.2s ease-out forwards',
                      animationDelay: `${0.2 + i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Cashout Success Effect */}
          {showCashoutEffect && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="relative">
                <div className="absolute inset-0 -m-20 bg-green-500/20 rounded-full animate-ping" />
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl animate-bounce font-bold text-xl flex items-center gap-2">
                  <Sparkles className="animate-spin" />
                  +৳{winAmount?.toFixed(2)}
                  <Sparkles className="animate-spin" />
                </div>
              </div>
            </div>
          )}
          
          <div className="absolute top-4 left-4 z-10 space-y-2">
            {phase === "betting" && (
              <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse flex items-center gap-1">
                <Timer size={14} />
                Place your bets!
              </Badge>
            )}
            {phase === "locking" && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse flex items-center gap-1">
                <Lock size={14} />
                Locking bets...
              </Badge>
            )}
            {phase === "running" && (
              <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                <TrendingUp size={14} className="animate-bounce" />
                Flying...
              </Badge>
            )}
            {phase === "crashed" && (
              <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
                💥 Crashed!
              </Badge>
            )}
          </div>
          
          {/* Hash display in top right */}
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-xs flex items-center gap-1">
              <Shield size={12} />
              {currentServerSeedHash.slice(0, 8)}...
            </Badge>
          </div>
          
          <div className="relative z-10 text-center">
            {phase === "betting" && (
              <div className="space-y-3">
                {/* Circular Progress Ring with Countdown */}
                <div className="relative inline-flex items-center justify-center">
                  {/* SVG Circular Progress Ring */}
                  <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
                    {/* Background circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="rgba(100, 116, 139, 0.3)"
                      strokeWidth="8"
                    />
                    {/* Progress circle - depletes as countdown decreases */}
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="url(#countdownGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 54}
                      strokeDashoffset={2 * Math.PI * 54 * (1 - countdown / gameSettings.betWindowSec)}
                      className="transition-all duration-1000 ease-linear"
                      style={{
                        filter: countdown <= 3 ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.8))' : 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.6))',
                      }}
                    />
                    {/* Gradient definition */}
                    <defs>
                      <linearGradient id="countdownGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={countdown <= 3 ? '#ef4444' : '#22d3ee'} />
                        <stop offset="50%" stopColor={countdown <= 3 ? '#f97316' : '#06b6d4'} />
                        <stop offset="100%" stopColor={countdown <= 3 ? '#eab308' : '#0ea5e9'} />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Countdown Number in Center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span 
                      className={`text-7xl font-black transition-all duration-300 ${
                        countdown <= 3 
                          ? 'text-red-400 animate-pulse scale-110' 
                          : countdown <= 5 
                            ? 'text-yellow-400' 
                            : 'text-white'
                      }`}
                      style={{
                        textShadow: countdown <= 3 
                          ? '0 0 30px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.4)' 
                          : '0 0 20px rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      {countdown}
                    </span>
                  </div>
                  
                  {/* Pulsing outer ring for urgency */}
                  {countdown <= 3 && (
                    <div className="absolute inset-0 rounded-full border-4 border-red-500/50 animate-ping" style={{ animationDuration: '0.8s' }} />
                  )}
                </div>
                
                <p className="text-slate-300 text-lg font-medium">Place your bets!</p>
                {gameSettings.showBetsCloseWarning && countdown <= gameSettings.betsCloseWarningSec && countdown > 0 && (
                  <p className="text-yellow-400 text-sm animate-pulse font-medium">⚠️ Bets close soon!</p>
                )}
              </div>
            )}
            
            {phase === "locking" && (
              <div className="space-y-3 relative">
                {/* Pulsing red overlay for final second */}
                {lockingCountdown <= 1 && (
                  <div 
                    className="absolute inset-0 -m-20 pointer-events-none rounded-full animate-pulse"
                    style={{
                      background: 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0) 70%)',
                      animation: 'pulse 0.3s ease-in-out infinite',
                    }}
                  />
                )}
                
                {/* Locking Phase - Circular with Lock Icon */}
                <div className={`relative inline-flex items-center justify-center ${lockingCountdown <= 1 ? 'animate-pulse' : ''}`}>
                  {/* Outer glow ring for final second */}
                  {lockingCountdown <= 1 && (
                    <div 
                      className="absolute inset-0 -m-4 rounded-full"
                      style={{
                        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)',
                        animation: 'ping 0.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                      }}
                    />
                  )}
                  
                  <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke={lockingCountdown <= 1 ? "rgba(239, 68, 68, 0.3)" : "rgba(234, 179, 8, 0.3)"}
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke={lockingCountdown <= 1 ? "url(#lockingGradientRed)" : "url(#lockingGradient)"}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 54}
                      strokeDashoffset={2 * Math.PI * 54 * (1 - lockingCountdown / gameSettings.lockingSec)}
                      className="transition-all duration-1000 ease-linear"
                      style={{ 
                        filter: lockingCountdown <= 1 
                          ? 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.8))' 
                          : 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.6))' 
                      }}
                    />
                    <defs>
                      <linearGradient id="lockingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                      <linearGradient id="lockingGradientRed" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Lock 
                      size={28} 
                      className={`mb-1 transition-colors duration-300 ${
                        lockingCountdown <= 1 ? 'text-red-400' : 'text-yellow-400'
                      }`} 
                    />
                    <span 
                      className={`text-4xl font-black transition-colors duration-300 ${
                        lockingCountdown <= 1 ? 'text-red-400 animate-bounce' : 'text-yellow-400'
                      }`}
                    >
                      {lockingCountdown}
                    </span>
                  </div>
                </div>
                
                <p className={`text-lg font-medium transition-colors duration-300 ${
                  lockingCountdown <= 1 ? 'text-red-300' : 'text-yellow-300'
                }`}>
                  {lockingCountdown <= 1 ? '⚠️ LAUNCHING!' : 'Locking bets...'}
                </p>
                <p className="text-slate-500 text-sm">No new bets accepted</p>
              </div>
            )}
            
            {phase === "running" && (
              <div className="relative">
                {/* Sparkle effects around multiplier */}
                {currentMultiplier > 3 && (
                  <div className="absolute inset-0 -m-8 pointer-events-none">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={`sparkle-${i}-${Math.floor(currentMultiplier)}`}
                        className="absolute animate-sparkle-burst"
                        style={{
                          left: `${50 + Math.cos(i * 45 * Math.PI / 180) * 80}%`,
                          top: `${50 + Math.sin(i * 45 * Math.PI / 180) * 80}%`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      >
                        <Sparkles 
                          size={12 + Math.random() * 8} 
                          className={currentMultiplier > 10 ? 'text-yellow-300' : 'text-cyan-400'}
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Glowing ring behind multiplier */}
                {currentMultiplier > 5 && (
                  <div 
                    className="absolute inset-0 -m-12 rounded-full animate-pulse"
                    style={{
                      background: `radial-gradient(circle, ${currentMultiplier > 10 ? 'rgba(234,179,8,0.3)' : 'rgba(34,211,238,0.2)'} 0%, transparent 70%)`,
                      animationDuration: '0.5s',
                    }}
                  />
                )}
                
                <div 
                  className={`text-8xl font-black transition-all duration-200 ${getMultiplierColor(currentMultiplier)} ${getMultiplierGlow(currentMultiplier)} ${currentMultiplier > 10 ? 'animate-rainbow-glow' : currentMultiplier > 3 ? 'animate-glow-pulse' : ''}`}
                  style={{ 
                    transform: `scale(${1 + (currentMultiplier - 1) * 0.02})`,
                    textShadow: currentMultiplier > 5 
                      ? `0 0 ${20 + currentMultiplier * 3}px currentColor, 0 0 ${40 + currentMultiplier * 5}px currentColor` 
                      : undefined,
                  }}
                >
                  {currentMultiplier.toFixed(2)}x
                </div>
                
                {hasBet && !hasCashedOut && (
                  <div className="mt-3 space-y-1">
                    {/* Show streak bonus preview */}
                    {streakState.currentStreak >= 1 && (() => {
                      const { multiplier, tier } = getStreakBonus(streakState.currentStreak + 1, streakConfig);
                      const basePayout = parseFloat(betAmount) * currentMultiplier;
                      const bonusPayout = basePayout * multiplier;
                      const bonusAmount = bonusPayout - basePayout;
                      
                      return multiplier > 1 ? (
                        <div className="flex flex-col items-center">
                          <p className={`text-green-400 text-xl font-bold ${currentMultiplier > 2 ? 'animate-pulse' : ''}`}
                            style={{
                              textShadow: currentMultiplier > 3 ? '0 0 15px rgba(74,222,128,0.6), 0 0 30px rgba(74,222,128,0.4)' : undefined,
                            }}
                          >
                            ৳{bonusPayout.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-1 text-amber-400 text-xs">
                            <Flame size={12} />
                            <span>+৳{bonusAmount.toFixed(2)} {tier?.name} bonus</span>
                          </div>
                        </div>
                      ) : (
                        <p className={`text-green-400 text-xl font-bold ${currentMultiplier > 2 ? 'animate-pulse' : ''}`}
                          style={{
                            textShadow: currentMultiplier > 3 ? '0 0 15px rgba(74,222,128,0.6), 0 0 30px rgba(74,222,128,0.4)' : undefined,
                          }}
                        >
                          ৳{basePayout.toFixed(2)}
                        </p>
                      );
                    })()}
                    {streakState.currentStreak < 1 && (
                      <p className={`text-green-400 text-xl font-bold ${currentMultiplier > 2 ? 'animate-pulse' : ''}`}
                        style={{
                          textShadow: currentMultiplier > 3 ? '0 0 15px rgba(74,222,128,0.6), 0 0 30px rgba(74,222,128,0.4)' : undefined,
                        }}
                      >
                        ৳{(parseFloat(betAmount) * currentMultiplier).toFixed(2)}
                      </p>
                    )}
                    <p className="text-slate-500 text-sm">Potential win</p>
                  </div>
                )}
              </div>
            )}
            
            {phase === "crashed" && crashMultiplier && (
              <>
                <div className="text-7xl font-black text-red-500 mb-2 animate-pulse drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                  {crashMultiplier.toFixed(2)}x
                </div>
                <p className="text-red-400 text-xl font-bold">CRASHED!</p>
                {hasBet && !hasCashedOut && (
                  <p className="text-red-300 text-lg mt-3 bg-red-500/10 px-4 py-2 rounded-lg">
                    Lost ৳{betAmount}
                  </p>
                )}
                {hasCashedOut && (
                  <p className="text-green-400 text-lg mt-3 bg-green-500/10 px-4 py-2 rounded-lg flex items-center justify-center gap-2">
                    <Sparkles size={18} />
                    Won ৳{winAmount?.toFixed(2)} at {cashoutMultiplier?.toFixed(2)}x
                    <Sparkles size={18} />
                  </p>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Crash History Panel - Last 10 Results */}
        <CrashHistoryPanel />
        
        {/* Betting Controls */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 space-y-4 border border-slate-700">
          {/* Header with streak indicator and keyboard shortcut hint */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-slate-400 text-sm font-medium">Bet Amount (৳)</label>
              {/* Streak indicator badge */}
              {streakState.currentStreak >= 2 && (() => {
                const { tier } = getStreakBonus(streakState.currentStreak, streakConfig);
                return tier ? (
                  <Badge className={`bg-gradient-to-r ${
                    streakState.currentStreak >= 10 ? 'from-yellow-500 to-amber-600' :
                    streakState.currentStreak >= 7 ? 'from-purple-500 to-violet-600' :
                    streakState.currentStreak >= 5 ? 'from-cyan-500 to-blue-600' :
                    'from-orange-500 to-red-600'
                  } text-white border-0 text-xs px-2 py-0.5 animate-pulse`}>
                    <Flame size={10} className="mr-1" />
                    {streakState.currentStreak}🔥 +{((tier.bonus - 1) * 100).toFixed(0)}%
                  </Badge>
                ) : null;
              })()}
            </div>
            <button
              onClick={() => setShowShortcutsHelp(true)}
              className="text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1 text-xs"
            >
              <Keyboard size={14} />
              <span className="hidden sm:inline">Press ? for shortcuts</span>
            </button>
          </div>
          
          {/* Bet input with +/- buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBetAmount(Math.max(10, parseFloat(betAmount) - 50).toString())}
              disabled={hasBet}
              className="bg-slate-700 border-slate-600 hover:bg-slate-600 h-12 w-12"
            >
              <Minus size={18} />
            </Button>
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white text-lg font-bold h-12 text-center flex-1"
              min={10}
              disabled={hasBet}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBetAmount((parseFloat(betAmount) + 50).toString())}
              disabled={hasBet}
              className="bg-slate-700 border-slate-600 hover:bg-slate-600 h-12 w-12"
            >
              <Plus size={18} />
            </Button>
          </div>
          
          {/* Bet presets with keyboard hints and edit button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Quick Bets</span>
              <button
                onClick={() => {
                  setEditingPresets([...customPresets]);
                  setShowPresetEditor(true);
                }}
                className="text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1 text-xs"
              >
                <Settings2 size={12} />
                <span>Customize</span>
              </button>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {betPresets.map((preset) => (
                <Button 
                  key={`${preset.key}-${preset.amount}`} 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setBetAmount(preset.amount.toString())} 
                  disabled={hasBet} 
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:scale-105 transition-all flex flex-col items-center py-2 h-auto relative group"
                >
                  <span className="text-xs font-bold">{preset.label}</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-cyan-400 transition-colors">[{preset.key}]</span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Quick actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBetAmount(Math.max(10, Math.floor(parseFloat(betAmount) / 2)).toString())}
              disabled={hasBet}
              className="flex-1 bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600 text-xs"
            >
              ½ [H]
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBetAmount((parseFloat(betAmount) * 2).toString())}
              disabled={hasBet}
              className="flex-1 bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600 text-xs"
            >
              2× [D]
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBetAmount(Math.floor(balance).toString())}
              disabled={hasBet}
              className="flex-1 bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600 text-xs"
            >
              MAX [M]
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Switch checked={autoCashout} onCheckedChange={setAutoCashout} disabled={hasBet} />
              <span className="text-slate-300 text-sm font-medium">Auto Cashout</span>
              <span className="text-slate-500 text-xs">[A]</span>
            </div>
            {autoCashout && (
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  value={autoCashoutValue} 
                  onChange={(e) => setAutoCashoutValue(e.target.value)} 
                  className="w-20 bg-slate-600 border-slate-500 text-white text-sm font-bold" 
                  min="1.01" 
                  step="0.01" 
                  disabled={hasBet} 
                />
                <span className="text-slate-400 text-sm font-bold">x</span>
              </div>
            )}
          </div>
          
          {/* Place Bet / Cash Out Button */}
          {!hasBet ? (
            <div className="space-y-2">
              <Button 
                onClick={handlePlaceBet} 
                disabled={phase !== "betting" || isPlacingBet || parseFloat(betAmount) > balance} 
                className={`w-full h-14 text-lg font-bold shadow-lg transition-all hover:scale-[1.02] ${
                  phase === "locking" 
                    ? 'bg-yellow-600 hover:bg-yellow-700 shadow-yellow-500/25' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/25 hover:shadow-green-500/40'
                }`}
              >
                {isPlacingBet ? (
                  <RefreshCw className="animate-spin mr-2" />
                ) : phase === "locking" ? (
                  <Lock className="mr-2" />
                ) : (
                  <Zap className="mr-2" />
                )}
                {phase === "betting" ? (
                  <span className="flex items-center gap-2">
                    Place Bet
                    <kbd className="bg-white/20 px-2 py-0.5 rounded text-sm font-mono">Space</kbd>
                  </span>
                ) : phase === "locking" ? (
                  <span>Bets Locked</span>
                ) : (
                  <span>Wait for next round...</span>
                )}
              </Button>
              
              {/* Balance warning */}
              {parseFloat(betAmount) > balance && (
                <p className="text-red-400 text-xs text-center animate-pulse">
                  Insufficient balance (৳{balance.toFixed(2)})
                </p>
              )}
              
              {/* Bets close warning */}
              {phase === "betting" && countdown <= gameSettings.betsCloseWarningSec && countdown > 0 && (
                <p className="text-yellow-400 text-xs text-center animate-pulse">
                  ⚠️ Bets close in {countdown}s
                </p>
              )}
            </div>
          ) : !hasCashedOut && phase === "running" ? (
            <Button 
              onClick={handleCashout} 
              disabled={isCashingOut} 
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 animate-pulse shadow-lg shadow-orange-500/40 transition-all hover:scale-[1.02]"
            >
              <span className="flex items-center gap-2">
                💰 CASH OUT - ৳{(parseFloat(betAmount) * currentMultiplier).toFixed(2)}
                <kbd className="bg-white/20 px-2 py-0.5 rounded text-sm font-mono">Space</kbd>
              </span>
            </Button>
          ) : !hasCashedOut && phase === "locking" ? (
            <Button disabled className="w-full h-14 text-lg font-bold bg-slate-600">
              <Lock className="mr-2" size={18} />
              Waiting for launch...
            </Button>
          ) : (
            <Button disabled className="w-full h-14 text-lg font-bold bg-slate-600">
              {hasCashedOut ? (
                <span className="flex items-center gap-2">
                  ✅ Cashed out at {cashoutMultiplier?.toFixed(2)}x
                </span>
              ) : phase === "crashed" && hasBet ? (
                <span className="text-red-400">Round ended</span>
              ) : (
                "Waiting..."
              )}
            </Button>
          )}
        </div>
        
        {/* Provably Fair Section */}
        <ProvablyFairDisplay
          currentHash={currentServerSeedHash}
          isRevealed={isHashRevealed}
          revealedData={revealedFairnessData}
          roundHistory={roundHistory}
          clientSeed={currentClientSeed}
          onClientSeedChange={setCurrentClientSeed}
          nonce={currentNonce}
        />
        
        {/* Session Tracker */}
        <CrashSessionTracker bets={myBets} currentBalance={balance} />
        
        {/* Streak Bonus Panel */}
        <CrashStreakBonus 
          streakState={streakState}
          config={streakConfig}
          isAnimating={isStreakAnimating}
        />
        
        {/* Auto-Bet Panel */}
        <CrashAutoBet
          isEnabled={autoBetEnabled}
          onToggle={handleAutoBetToggle}
          settings={autoBetSettings}
          onSettingsChange={setAutoBetSettings}
          stats={autoBetStats}
          onReset={handleAutoBetReset}
          currentBet={currentAutoBetAmount}
          balance={balance}
          phase={phase}
          hasBet={hasBet}
        />
        
        {/* Bet Statistics Section */}
        <CrashBetStats bets={myBets} isLoading={isLoadingHistory} />
        
        {/* Sound Settings */}
        <CrashSoundSettings
          soundEnabled={soundEnabled}
          onSoundEnabledChange={setSoundEnabled}
          settings={soundSettings}
          onSettingsChange={setSoundSettings}
        />
        
        {/* Live Players Section */}
        <LivePlayersList
          roundId={currentRoundIdRef.current}
          currentMultiplier={currentMultiplier}
          phase={phase}
          soundEnabled={soundEnabled}
        />
        
        {/* Leaderboard Section */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-4 py-3 border-b border-slate-700">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Trophy className="text-amber-400" size={18} />
              Crash Leaderboard
            </h3>
          </div>
          
          <Tabs value={leaderboardTab} onValueChange={(v) => setLeaderboardTab(v as "biggest" | "highest")} className="w-full">
            <TabsList className="w-full bg-slate-700/50 rounded-none h-10">
              <TabsTrigger 
                value="biggest" 
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-slate-300"
              >
                💰 Biggest Wins
              </TabsTrigger>
              <TabsTrigger 
                value="highest" 
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-600 data-[state=active]:text-white text-slate-300"
              >
                🚀 Highest X
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="biggest" className="mt-0 p-0">
              <div className="divide-y divide-slate-700/50">
                {isLoadingLeaderboard ? (
                  <div className="p-4 text-center text-slate-400">Loading...</div>
                ) : biggestWins.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No wins yet</div>
                ) : (
                  biggestWins.map((entry) => (
                    <div key={entry.rank} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/30 transition-colors">
                      <div className="w-8 flex-shrink-0">
                        {entry.rank === 1 ? (
                          <Crown className="text-yellow-400" size={20} />
                        ) : entry.rank === 2 ? (
                          <Medal className="text-slate-300" size={20} />
                        ) : entry.rank === 3 ? (
                          <Medal className="text-amber-600" size={20} />
                        ) : (
                          <span className="text-slate-500 font-bold text-sm">#{entry.rank}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{entry.username}</p>
                        <p className="text-slate-500 text-xs">
                          Bet: ৳{entry.bet_amount.toLocaleString()} → {entry.cashout_multiplier.toFixed(2)}x
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-green-400 font-bold">৳{entry.win_amount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="highest" className="mt-0 p-0">
              <div className="divide-y divide-slate-700/50">
                {isLoadingLeaderboard ? (
                  <div className="p-4 text-center text-slate-400">Loading...</div>
                ) : highestMultipliers.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No cashouts yet</div>
                ) : (
                  highestMultipliers.map((entry) => (
                    <div key={entry.rank} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/30 transition-colors">
                      <div className="w-8 flex-shrink-0">
                        {entry.rank === 1 ? (
                          <Crown className="text-yellow-400" size={20} />
                        ) : entry.rank === 2 ? (
                          <Medal className="text-slate-300" size={20} />
                        ) : entry.rank === 3 ? (
                          <Medal className="text-amber-600" size={20} />
                        ) : (
                          <span className="text-slate-500 font-bold text-sm">#{entry.rank}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{entry.username}</p>
                        <p className="text-slate-500 text-xs">
                          Bet: ৳{entry.bet_amount.toLocaleString()} → Won ৳{entry.win_amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge className="bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold px-2">
                          {entry.cashout_multiplier.toFixed(2)}x
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
    </PageScaffold>
  );
};

export default CrashGame;
