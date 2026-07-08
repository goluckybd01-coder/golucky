import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import PageScaffold from "@/components/templates/PageScaffold";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, HelpCircle, Menu, History, Heart, Shield, Keyboard, FileBarChart } from "lucide-react";
import { formatTaka, TAKA_SYMBOL } from "@/lib/currency";
import { toast } from "sonner";

// Components
import AviatorTopBar from "@/components/aviator/AviatorTopBar";
import AviatorHistoryRow from "@/components/aviator/AviatorHistoryRow";
import AviatorGamePanel from "@/components/aviator/AviatorGamePanel";
import AviatorBetPanel from "@/components/aviator/AviatorBetPanel";
import AviatorSettingsDrawer from "@/components/aviator/AviatorSettingsDrawer";
import AviatorLiveBets, { TopWinner } from "@/components/aviator/AviatorLiveBets";
import AviatorFairModal from "@/components/aviator/AviatorFairModal";
import AviatorChat from "@/components/aviator/AviatorChat";
import AviatorChatDrawer from "@/components/aviator/AviatorChatDrawer";
import AviatorMiniLeaderboard from "@/components/aviator/AviatorMiniLeaderboard";
import AviatorSessionStats, { SessionStats } from "@/components/aviator/AviatorSessionStats";
import AviatorStreakBonus, { 
  getAviatorStreakBonus, 
  calculateAviatorStreakPayout,
  defaultAviatorStreakConfig,
  AviatorStreakState,
  StreakBonusTier
} from "@/components/aviator/AviatorStreakBonus";
import AviatorBetHistory, { BetHistoryEntry } from "@/components/aviator/AviatorBetHistory";
import AviatorStreakMilestone from "@/components/aviator/AviatorStreakMilestone";
import AviatorSessionSummary from "@/components/aviator/AviatorSessionSummary";
import Confetti from "@/components/Confetti";
import { useAviatorSounds } from "@/hooks/useAviatorSounds";
import { useAviatorKeyboardShortcuts, AVIATOR_SHORTCUTS } from "@/hooks/useAviatorKeyboardShortcuts";
import { haptic, hapticForMultiplier, hapticForStreak } from "@/lib/haptics";
import { useWalletDB } from "@/hooks/useWalletDB";

// Simple trade ID generator for Aviator
const generateAviatorTradeId = (): string => {
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const random = Math.floor(100 + Math.random() * 900);
  return `AV${timestamp}${random}`;
};
// Types
export type RoundPhase = "WAITING" | "RUNNING" | "CRASHED";

export interface BetState {
  stake: number;
  isPlaced: boolean;
  isCashedOut: boolean;
  cashoutMultiplier: number | null;
  autoCashout: number | null;
  autoBet: boolean;
  stopOnWin: number | null;
  stopOnLoss: number | null;
  // Auto-play specific
  autoPlayEnabled: boolean;
  autoPlayRounds: number;
  autoPlayRoundsRemaining: number;
  autoPlayProfit: number;
  onWinAction: 'reset' | 'increase';
  onWinPercent: number;
  onLossAction: 'reset' | 'increase';
  onLossPercent: number;
  // Martingale mode
  martingaleEnabled: boolean;
  martingaleBaseStake: number;
  martingaleLossCount: number;
  martingaleMaxDoubles: number; // Max times to double (e.g., 5 = max 32x base stake)
}

export interface RoundResult {
  multiplier: number;
  roundId: string;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

// Demo provably fair functions
const hashSeed = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
};

const generateCrashPoint = (serverSeed: string, clientSeed: string, nonce: number): number => {
  const combined = `${serverSeed}-${clientSeed}-${nonce}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i);
    hash = hash & hash;
  }
  const normalized = Math.abs(hash % 10000) / 10000;
  // Generate crash point between 1.00 and 100.00
  // Lower values more likely (house edge simulation)
  const houseEdge = 0.04; // 4% house edge
  if (normalized < houseEdge) return 1.00;
  return Math.max(1.00, Math.pow(1 / (1 - normalized), 0.5) * 0.99);
};

const generateServerSeed = (): string => {
  const chars = 'abcdef0123456789';
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const generateRoundId = (): string => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

const AviatorGame = () => {
  const navigate = useNavigate();
  const sounds = useAviatorSounds();
  
  // Real wallet integration
  const { balance, placeBet: walletPlaceBet, claimWinnings: walletClaimWinnings, canAfford, refreshBalance, isLoading: walletLoading } = useWalletDB();
  
  // Track pending bet trade IDs for proper wallet transactions
  const pendingBetTradeIds = useRef<{ bet1?: string; bet2?: string }>({});
  
  // Settings
  const [houseEdge, setHouseEdge] = useState(0.04);
  const [roundSpeed, setRoundSpeed] = useState(1);
  const [countdownSeconds, setCountdownSeconds] = useState(10);
  const [clientSeed, setClientSeed] = useState(() => {
    return localStorage.getItem('aviator_client_seed') || 'demo_client_seed';
  });
  const [autoRun, setAutoRun] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [fairModalOpen, setFairModalOpen] = useState(false);
  
  // Game state
  const [phase, setPhase] = useState<RoundPhase>("WAITING");
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [multiplier, setMultiplier] = useState(1.00);
  const [visualMultiplier, setVisualMultiplier] = useState(1.00); // Visual-only, runs 35% faster
  const [crashPoint, setCrashPoint] = useState(0);
  const [serverSeed, setServerSeed] = useState(generateServerSeed());
  const [serverSeedHash, setServerSeedHash] = useState("");
  const [nonce, setNonce] = useState(1);
  const [roundId, setRoundId] = useState(generateRoundId());
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [topWinners, setTopWinners] = useState<TopWinner[]>([]);
  const [ping, setPing] = useState(150);
  
  // Confetti celebration state
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiIntensity, setConfettiIntensity] = useState<"small" | "medium" | "big">("medium");
  
  // Streak milestone celebration state
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneTier, setMilestoneTier] = useState<StreakBonusTier | null>(null);
  const [milestoneStreak, setMilestoneStreak] = useState(0);
  
  // Win streak tracking with bonus
  const [streakState, setStreakState] = useState<AviatorStreakState>(() => {
    const savedBest = localStorage.getItem('aviator_best_streak');
    const savedBonus = localStorage.getItem('aviator_total_bonus_earned');
    return {
      currentStreak: 0,
      bestStreak: savedBest ? parseInt(savedBest) : 0,
      totalBonusEarned: savedBonus ? parseFloat(savedBonus) : 0,
    };
  });
  
  // Session stats
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalBets: 0,
    totalWins: 0,
    totalBetAmount: 0,
    totalWinAmount: 0,
    profitLoss: 0,
    highestWin: 0,
    highestMultiplier: 0,
    winRate: 0,
  });
  
  // Session summary modal state
  const [sessionSummaryOpen, setSessionSummaryOpen] = useState(false);
  const [sessionStartTime] = useState(() => new Date());
  const [startingBalance] = useState(() => balance);
  
  // Reset session function
  const resetSession = useCallback(() => {
    setSessionStats({
      totalBets: 0,
      totalWins: 0,
      totalBetAmount: 0,
      totalWinAmount: 0,
      profitLoss: 0,
      highestWin: 0,
      highestMultiplier: 0,
      winRate: 0,
    });
    setBetHistory([]);
    setStreakState(prev => ({
      ...prev,
      currentStreak: 0,
    }));
    toast.success("Session reset!");
  }, []);
  
  // Bet history for showing recent bets
  const [betHistory, setBetHistory] = useState<BetHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('aviator_bet_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((e: any) => ({ ...e, timestamp: new Date(e.timestamp) }));
        }
      }
    } catch {}
    return [];
  });
  
  // Save bet history to localStorage
  useEffect(() => {
    localStorage.setItem('aviator_bet_history', JSON.stringify(betHistory.slice(0, 50)));
  }, [betHistory]);

  const [bet1, setBet1] = useState<BetState>({
    stake: 1,
    isPlaced: false,
    isCashedOut: false,
    cashoutMultiplier: null,
    autoCashout: null,
    autoBet: false,
    stopOnWin: null,
    stopOnLoss: null,
    autoPlayEnabled: false,
    autoPlayRounds: 10,
    autoPlayRoundsRemaining: 0,
    autoPlayProfit: 0,
    onWinAction: 'reset',
    onWinPercent: 0,
    onLossAction: 'reset',
    onLossPercent: 0,
    martingaleEnabled: false,
    martingaleBaseStake: 1,
    martingaleLossCount: 0,
    martingaleMaxDoubles: 5,
  });
  const [bet2, setBet2] = useState<BetState>({
    stake: 1,
    isPlaced: false,
    isCashedOut: false,
    cashoutMultiplier: null,
    autoCashout: null,
    autoBet: false,
    stopOnWin: null,
    stopOnLoss: null,
    autoPlayEnabled: false,
    autoPlayRounds: 10,
    autoPlayRoundsRemaining: 0,
    autoPlayProfit: 0,
    onWinAction: 'reset',
    onWinPercent: 0,
    onLossAction: 'reset',
    onLossPercent: 0,
    martingaleEnabled: false,
    martingaleBaseStake: 1,
    martingaleLossCount: 0,
    martingaleMaxDoubles: 5,
  });
  
  // Refs for animation
  const startTimeRef = useRef<number>(0);
  const animationRef = useRef<number>(0);
  
  // Refs to avoid dependency issues in animation loop
  const bet1Ref = useRef(bet1);
  const bet2Ref = useRef(bet2);
  const soundsRef = useRef(sounds);
  
  // Keep refs updated
  useEffect(() => {
    bet1Ref.current = bet1;
  }, [bet1]);
  
  useEffect(() => {
    bet2Ref.current = bet2;
  }, [bet2]);
  
  useEffect(() => {
    soundsRef.current = sounds;
  }, [sounds]);
  
  // Save client seed
  useEffect(() => {
    localStorage.setItem('aviator_client_seed', clientSeed);
  }, [clientSeed]);
  
  // Generate hash when server seed changes
  useEffect(() => {
    setServerSeedHash(hashSeed(serverSeed));
  }, [serverSeed]);
  
  // Simulate ping
  useEffect(() => {
    const interval = setInterval(() => {
      setPing(50 + Math.floor(Math.random() * 250));
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  
  // Start flight phase
  const startRound = useCallback(() => {
    const crash = generateCrashPoint(serverSeed, clientSeed, nonce);
    setCrashPoint(crash);
    setPhase("RUNNING");
    setMultiplier(1.00);
    setVisualMultiplier(1.00);
    startTimeRef.current = Date.now();
    
    // Stop waiting sound and start rising tension sound
    soundsRef.current.stopWaitingSound();
    soundsRef.current.startRisingTension();
    
    let lastTickMult = 1;
    
    // Visual speed multiplier - 25% faster for plane/curve animation only
    const visualSpeedMultiplier = 1.25;
    
    // Start animation loop
    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const speed = roundSpeed;
      
      // GAME LOGIC multiplier - unchanged, used for payouts/cashouts/crash detection
      const currentMult = Math.pow(Math.E, elapsed * 0.14 * speed);
      
      // VISUAL multiplier - runs 35% faster, capped at crash point for smooth visual
      const visualMult = Math.min(
        Math.pow(Math.E, elapsed * 0.14 * speed * visualSpeedMultiplier),
        crash // Cap at crash point so plane doesn't overshoot
      );
      
      if (currentMult >= crash) {
        // Crashed! - based on GAME LOGIC multiplier
        setMultiplier(crash);
        setVisualMultiplier(crash);
        setPhase("CRASHED");
        soundsRef.current.stopRisingTension();
        soundsRef.current.playCrashSound();
        handleCrash(crash);
        return;
      }
      
      // Update both multipliers
      setMultiplier(currentMult);
      setVisualMultiplier(visualMult);
      
      // Update rising tension sound
      soundsRef.current.updateRisingTension(currentMult);
      
      // Play tick sound at each 0.5x interval
      if (Math.floor(currentMult * 2) > Math.floor(lastTickMult * 2)) {
        soundsRef.current.playTickSound(currentMult);
        lastTickMult = currentMult;
      }
      
      // Check auto cashout for bet1 using ref
      const currentBet1 = bet1Ref.current;
      if (currentBet1.isPlaced && !currentBet1.isCashedOut && currentBet1.autoCashout && currentMult >= currentBet1.autoCashout) {
        handleCashout(1, currentMult);
      }
      
      // Check auto cashout for bet2 using ref
      const currentBet2 = bet2Ref.current;
      if (currentBet2.isPlaced && !currentBet2.isCashedOut && currentBet2.autoCashout && currentMult >= currentBet2.autoCashout) {
        handleCashout(2, currentMult);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [serverSeed, clientSeed, nonce, roundSpeed]);
  
  // Countdown timer with sound - MUST be after startRound declaration
  useEffect(() => {
    if (phase !== "WAITING") return;
    
    if (countdown <= 0) {
      startRound();
      return;
    }
    
    // Play countdown tick sound
    if (countdown <= 5) {
      soundsRef.current.playCountdownTick(countdown);
    }
    
    const timer = setTimeout(() => {
      setCountdown(c => c - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [phase, countdown, startRound]);
  
  // Waiting phase anticipation sound
  useEffect(() => {
    if (phase === "WAITING") {
      soundsRef.current.startWaitingSound();
    } else {
      soundsRef.current.stopWaitingSound();
    }
  }, [phase]);

  // Handle crash
  const handleCrash = useCallback((finalMult: number) => {
    cancelAnimationFrame(animationRef.current);
    
    // Record result
    const result: RoundResult = {
      multiplier: parseFloat(finalMult.toFixed(2)),
      roundId,
      serverSeed,
      serverSeedHash,
      clientSeed,
      nonce,
    };
    
    setHistory(prev => [result, ...prev].slice(0, 20));
    
    // Process bet1 result for auto-play and session stats
    if (bet1.isPlaced) {
      const won = bet1.isCashedOut;
      const profit = won 
        ? bet1.stake * (bet1.cashoutMultiplier || 1) - bet1.stake
        : -bet1.stake;
      const winAmount = won ? bet1.stake * (bet1.cashoutMultiplier || 1) : 0;
      
      // Add to bet history
      const historyEntry: BetHistoryEntry = {
        id: `${roundId}-1-${Date.now()}`,
        roundId,
        stake: bet1.stake,
        outcome: won ? 'win' : 'loss',
        multiplier: bet1.cashoutMultiplier,
        crashPoint: parseFloat(finalMult.toFixed(2)),
        payout: winAmount,
        profit,
        timestamp: new Date(),
      };
      setBetHistory(prev => [historyEntry, ...prev].slice(0, 50));
      
      // Update session stats and check for milestones
      setSessionStats(prev => {
        const newTotalBets = prev.totalBets + 1;
        const newTotalWins = prev.totalWins + (won ? 1 : 0);
        const newTotalBetAmount = prev.totalBetAmount + bet1.stake;
        const newTotalWinAmount = prev.totalWinAmount + winAmount;
        const newProfitLoss = prev.profitLoss + profit;
        const newHighestWin = won ? Math.max(prev.highestWin, winAmount) : prev.highestWin;
        const newHighestMultiplier = won && bet1.cashoutMultiplier 
          ? Math.max(prev.highestMultiplier, bet1.cashoutMultiplier) 
          : prev.highestMultiplier;
        const newWinRate = newTotalBets > 0 ? (newTotalWins / newTotalBets) * 100 : 0;
        
        // Check for session milestones (only on positive changes)
        // Profit milestones: 500, 1000, 2500, 5000, 10000
        const profitMilestones = [500, 1000, 2500, 5000, 10000];
        for (const milestone of profitMilestones) {
          if (newProfitLoss >= milestone && prev.profitLoss < milestone) {
            setTimeout(() => sounds.playSessionMilestoneSound('profit'), 100);
            toast.success(`🎉 Milestone: ${formatTaka(milestone)} profit reached!`);
            break;
          }
        }
        
        // Bet count milestones: 25, 50, 100, 250, 500
        const betMilestones = [25, 50, 100, 250, 500];
        for (const milestone of betMilestones) {
          if (newTotalBets === milestone) {
            setTimeout(() => sounds.playSessionMilestoneSound('bets'), 100);
            toast.success(`🎯 Milestone: ${milestone} bets placed!`);
            break;
          }
        }
        
        return {
          totalBets: newTotalBets,
          totalWins: newTotalWins,
          totalBetAmount: newTotalBetAmount,
          totalWinAmount: newTotalWinAmount,
          profitLoss: newProfitLoss,
          highestWin: newHighestWin,
          highestMultiplier: newHighestMultiplier,
          winRate: newWinRate,
        };
      });
      
      if (!won) {
        toast.error(`Bet 1 lost: ${formatTaka(bet1.stake)}`);
        sounds.playLoseSound();
        // Reset win streak on loss
        setStreakState(prev => ({ ...prev, currentStreak: 0 }));
      }
      
      // Update auto-play state and martingale
      // Track martingale changes for sound effects
      let martingaleAction: 'double' | 'recover' | 'max' | null = null;
      let martingalePrevLossCount = 0;
      let martingaleNewLossCount = 0;
      
      setBet1(prev => {
        let newStake = prev.stake;
        let newLossCount = prev.martingaleLossCount;
        
        // Martingale logic (works even without auto-play)
        if (prev.martingaleEnabled) {
          if (won) {
            // Win: reset to base stake
            newStake = prev.martingaleBaseStake;
            martingalePrevLossCount = prev.martingaleLossCount;
            newLossCount = 0;
            if (prev.martingaleLossCount > 0) {
              martingaleAction = 'recover';
              toast.success(`Martingale recovered after ${prev.martingaleLossCount} loss${prev.martingaleLossCount > 1 ? 'es' : ''}!`);
            }
          } else {
            // Loss: double stake (up to max)
            if (newLossCount < prev.martingaleMaxDoubles) {
              newLossCount++;
              martingaleNewLossCount = newLossCount;
              newStake = prev.martingaleBaseStake * Math.pow(2, newLossCount);
              martingaleAction = 'double';
              toast.warning(`Martingale: Doubling to ${formatTaka(newStake)} (${newLossCount}/${prev.martingaleMaxDoubles})`);
            } else {
              // Max reached, reset
              newStake = prev.martingaleBaseStake;
              newLossCount = 0;
              martingaleAction = 'max';
              toast.error(`Martingale max reached! Resetting to ${formatTaka(prev.martingaleBaseStake)}`);
            }
          }
          newStake = Math.max(1, Math.min(10000, Math.round(newStake * 100) / 100));
        }
        
        if (!prev.autoPlayEnabled || prev.autoPlayRoundsRemaining <= 0) {
          // Even without auto-play, update martingale state
          return {
            ...prev,
            stake: prev.martingaleEnabled ? newStake : prev.stake,
            martingaleLossCount: newLossCount,
          };
        }
        
        const newProfit = prev.autoPlayProfit + profit;
        const newRoundsRemaining = prev.autoPlayRoundsRemaining - 1;
        let shouldStop = false;
        
        // Check stop conditions
        if (prev.stopOnWin && newProfit >= prev.stopOnWin) {
          shouldStop = true;
          toast.success(`Auto-play stopped: Won ${formatTaka(newProfit)}`);
        }
        if (prev.stopOnLoss && newProfit <= -prev.stopOnLoss) {
          shouldStop = true;
          toast.error(`Auto-play stopped: Lost ${formatTaka(Math.abs(newProfit))}`);
        }
        if (newRoundsRemaining <= 0) {
          shouldStop = true;
          toast.info(`Auto-play completed: ${prev.autoPlayRounds} rounds`);
        }
        
        // Adjust stake based on win/loss action (if not using martingale)
        if (!shouldStop && !prev.martingaleEnabled) {
          if (won && prev.onWinAction === 'increase' && prev.onWinPercent > 0) {
            newStake = prev.stake * (1 + prev.onWinPercent / 100);
          } else if (won && prev.onWinAction === 'reset') {
            // Keep base stake
          } else if (!won && prev.onLossAction === 'increase' && prev.onLossPercent > 0) {
            newStake = prev.stake * (1 + prev.onLossPercent / 100);
          } else if (!won && prev.onLossAction === 'reset') {
            // Keep base stake
          }
          newStake = Math.max(1, Math.min(10000, Math.round(newStake * 100) / 100));
        }
        
        return {
          ...prev,
          autoPlayRoundsRemaining: shouldStop ? 0 : newRoundsRemaining,
          autoPlayEnabled: !shouldStop,
          autoBet: !shouldStop,
          autoPlayProfit: newProfit,
          stake: newStake,
          martingaleLossCount: newLossCount,
        };
      });
      
      // Play martingale sounds after state update
      setTimeout(() => {
        if (martingaleAction === 'double') {
          sounds.playMartingaleDoubleSound(martingaleNewLossCount);
        } else if (martingaleAction === 'recover') {
          sounds.playMartingaleRecoverySound(martingalePrevLossCount);
        } else if (martingaleAction === 'max') {
          sounds.playMartingaleMaxSound();
        }
      }, 50);
    }
    
    // Process bet2 result for auto-play and session stats
    if (bet2.isPlaced) {
      const won = bet2.isCashedOut;
      const profit = won 
        ? bet2.stake * (bet2.cashoutMultiplier || 1) - bet2.stake
        : -bet2.stake;
      const winAmount = won ? bet2.stake * (bet2.cashoutMultiplier || 1) : 0;
      
      // Add to bet history
      const historyEntry: BetHistoryEntry = {
        id: `${roundId}-2-${Date.now()}`,
        roundId,
        stake: bet2.stake,
        outcome: won ? 'win' : 'loss',
        multiplier: bet2.cashoutMultiplier,
        crashPoint: parseFloat(finalMult.toFixed(2)),
        payout: winAmount,
        profit,
        timestamp: new Date(),
      };
      setBetHistory(prev => [historyEntry, ...prev].slice(0, 50));
      
      // Update session stats
      setSessionStats(prev => {
        const newTotalBets = prev.totalBets + 1;
        const newTotalWins = prev.totalWins + (won ? 1 : 0);
        const newTotalBetAmount = prev.totalBetAmount + bet2.stake;
        const newTotalWinAmount = prev.totalWinAmount + winAmount;
        const newProfitLoss = prev.profitLoss + profit;
        const newHighestWin = won ? Math.max(prev.highestWin, winAmount) : prev.highestWin;
        const newHighestMultiplier = won && bet2.cashoutMultiplier 
          ? Math.max(prev.highestMultiplier, bet2.cashoutMultiplier) 
          : prev.highestMultiplier;
        
        return {
          totalBets: newTotalBets,
          totalWins: newTotalWins,
          totalBetAmount: newTotalBetAmount,
          totalWinAmount: newTotalWinAmount,
          profitLoss: newProfitLoss,
          highestWin: newHighestWin,
          highestMultiplier: newHighestMultiplier,
          winRate: newTotalBets > 0 ? (newTotalWins / newTotalBets) * 100 : 0,
        };
      });
      
      if (!won && !bet1.isPlaced) {
        toast.error(`Bet 2 lost: ${formatTaka(bet2.stake)}`);
      }
      
      setBet2(prev => {
        let newStake = prev.stake;
        let newLossCount = prev.martingaleLossCount;
        
        // Martingale logic (works even without auto-play)
        if (prev.martingaleEnabled) {
          if (won) {
            // Win: reset to base stake
            newStake = prev.martingaleBaseStake;
            newLossCount = 0;
          } else {
            // Loss: double stake (up to max)
            if (newLossCount < prev.martingaleMaxDoubles) {
              newLossCount++;
              newStake = prev.martingaleBaseStake * Math.pow(2, newLossCount);
            } else {
              // Max reached, reset
              newStake = prev.martingaleBaseStake;
              newLossCount = 0;
            }
          }
          newStake = Math.max(1, Math.min(10000, Math.round(newStake * 100) / 100));
        }
        
        if (!prev.autoPlayEnabled || prev.autoPlayRoundsRemaining <= 0) {
          // Even without auto-play, update martingale state
          return {
            ...prev,
            stake: prev.martingaleEnabled ? newStake : prev.stake,
            martingaleLossCount: newLossCount,
          };
        }
        
        const newProfit = prev.autoPlayProfit + profit;
        const newRoundsRemaining = prev.autoPlayRoundsRemaining - 1;
        let shouldStop = false;
        
        if (prev.stopOnWin && newProfit >= prev.stopOnWin) {
          shouldStop = true;
        }
        if (prev.stopOnLoss && newProfit <= -prev.stopOnLoss) {
          shouldStop = true;
        }
        if (newRoundsRemaining <= 0) {
          shouldStop = true;
        }
        
        // Adjust stake based on win/loss action (if not using martingale)
        if (!shouldStop && !prev.martingaleEnabled) {
          if (won && prev.onWinAction === 'increase' && prev.onWinPercent > 0) {
            newStake = prev.stake * (1 + prev.onWinPercent / 100);
          } else if (!won && prev.onLossAction === 'increase' && prev.onLossPercent > 0) {
            newStake = prev.stake * (1 + prev.onLossPercent / 100);
          }
          newStake = Math.max(1, Math.min(10000, Math.round(newStake * 100) / 100));
        }
        
        return {
          ...prev,
          autoPlayRoundsRemaining: shouldStop ? 0 : newRoundsRemaining,
          autoPlayEnabled: !shouldStop,
          autoBet: !shouldStop,
          autoPlayProfit: newProfit,
          stake: newStake,
          martingaleLossCount: newLossCount,
        };
      });
    }
    
    // Start next round after delay
    if (autoRun) {
      setTimeout(() => {
        resetForNextRound();
      }, 3000);
    }
  }, [roundId, serverSeed, serverSeedHash, clientSeed, nonce, bet1, bet2, autoRun, sounds]);
  
  // Reset for next round
  const resetForNextRound = useCallback(() => {
    setServerSeed(generateServerSeed());
    setNonce(n => n + 1);
    setRoundId(generateRoundId());
    setMultiplier(1.00);
    setCountdown(countdownSeconds);
    setCrashPoint(0);
    setPhase("WAITING");
    
    // Reset bet states with auto-play logic
    setBet1(prev => {
      const shouldAutoBet = prev.autoBet || (prev.autoPlayEnabled && prev.autoPlayRoundsRemaining > 0);
      return {
        ...prev,
        isPlaced: shouldAutoBet,
        isCashedOut: false,
        cashoutMultiplier: null,
      };
    });
    setBet2(prev => {
      const shouldAutoBet = prev.autoBet || (prev.autoPlayEnabled && prev.autoPlayRoundsRemaining > 0);
      return {
        ...prev,
        isPlaced: shouldAutoBet,
        isCashedOut: false,
        cashoutMultiplier: null,
      };
    });
    
    // Deduct auto bets using wallet
    const processAutoBets = async () => {
      if ((bet1.autoBet || bet1.autoPlayEnabled) && bet1.isPlaced) {
        const tradeId = generateAviatorTradeId();
        pendingBetTradeIds.current.bet1 = tradeId;
        await walletPlaceBet(bet1.stake, 'aviator', tradeId);
      }
      if ((bet2.autoBet || bet2.autoPlayEnabled) && bet2.isPlaced) {
        const tradeId = generateAviatorTradeId();
        pendingBetTradeIds.current.bet2 = tradeId;
        await walletPlaceBet(bet2.stake, 'aviator', tradeId);
      }
    };
    processAutoBets();
  }, [countdownSeconds, walletPlaceBet, bet1, bet2]);
  
  // Place bet - async for wallet integration
  const handlePlaceBet = useCallback(async (panelId: 1 | 2) => {
    if (phase !== "WAITING") return;
    
    const bet = panelId === 1 ? bet1 : bet2;
    const setBet = panelId === 1 ? setBet1 : setBet2;
    
    if (bet.isPlaced) return;
    if (!canAfford(bet.stake)) {
      toast.error("Insufficient balance");
      return;
    }
    
    // Generate trade ID and place bet via wallet
    const tradeId = generateAviatorTradeId();
    if (panelId === 1) {
      pendingBetTradeIds.current.bet1 = tradeId;
    } else {
      pendingBetTradeIds.current.bet2 = tradeId;
    }
    
    const success = await walletPlaceBet(bet.stake, 'aviator', tradeId);
    if (success) {
      setBet(prev => ({ ...prev, isPlaced: true }));
      sounds.playBetSound();
      toast.success(`Bet placed: ${formatTaka(bet.stake)}`);
    } else {
      toast.error("Failed to place bet");
    }
  }, [phase, bet1, bet2, canAfford, walletPlaceBet, sounds]);
  
  // Cancel bet - refund via wallet
  const handleCancelBet = useCallback(async (panelId: 1 | 2) => {
    if (phase !== "WAITING") return;
    
    const bet = panelId === 1 ? bet1 : bet2;
    const setBet = panelId === 1 ? setBet1 : setBet2;
    
    if (!bet.isPlaced) return;
    
    // Refund the bet via wallet
    const tradeId = generateAviatorTradeId();
    await walletClaimWinnings(bet.stake, 'aviator', tradeId);
    setBet(prev => ({ ...prev, isPlaced: false }));
    sounds.playCancelSound();
    toast.info("Bet cancelled");
  }, [phase, bet1, bet2, walletClaimWinnings, sounds]);
  
  // Cashout with streak bonus
  const handleCashout = useCallback((panelId: 1 | 2, mult?: number) => {
    if (phase !== "RUNNING") return;
    
    const bet = panelId === 1 ? bet1 : bet2;
    const setBet = panelId === 1 ? setBet1 : setBet2;
    
    if (!bet.isPlaced || bet.isCashedOut) return;
    
    const cashoutMult = mult || multiplier;
    const baseWinnings = bet.stake * cashoutMult;
    
    // Get current tier before incrementing streak
    const { tier: previousTier } = getAviatorStreakBonus(streakState.currentStreak);
    
    // Calculate streak bonus
    const newStreak = streakState.currentStreak + 1;
    const { finalPayout, bonusAmount, multiplier: streakMultiplier, tier: newTier } = 
      calculateAviatorStreakPayout(baseWinnings, newStreak);
    
    // Check if we reached a new tier milestone
    const reachedNewTier = newTier && (!previousTier || newTier.streak > previousTier.streak);
    
    // Credit winnings via wallet
    const tradeId = pendingBetTradeIds.current[panelId === 1 ? 'bet1' : 'bet2'] || generateAviatorTradeId();
    walletClaimWinnings(finalPayout, 'aviator', tradeId);
    setBet(prev => ({
      ...prev,
      isCashedOut: true,
      cashoutMultiplier: cashoutMult,
    }));
    
    // Update streak state
    setStreakState(prev => {
      const newBestStreak = Math.max(prev.bestStreak, newStreak);
      const newTotalBonus = prev.totalBonusEarned + bonusAmount;
      
      // Persist to localStorage
      localStorage.setItem('aviator_best_streak', newBestStreak.toString());
      localStorage.setItem('aviator_total_bonus_earned', newTotalBonus.toString());
      
      return {
        currentStreak: newStreak,
        bestStreak: newBestStreak,
        totalBonusEarned: newTotalBonus,
      };
    });
    
    // Trigger streak milestone celebration when reaching a new tier
    if (reachedNewTier && newTier) {
      setMilestoneTier(newTier);
      setMilestoneStreak(newStreak);
      setShowMilestone(true);
      // Haptic feedback for streak milestone
      hapticForStreak(newStreak);
    }
    // Otherwise, trigger confetti for high multiplier cashouts (3x+)
    else if (cashoutMult >= 3) {
      // Determine intensity based on multiplier
      if (cashoutMult >= 10) {
        setConfettiIntensity("big");
      } else if (cashoutMult >= 5) {
        setConfettiIntensity("medium");
      } else {
        setConfettiIntensity("small");
      }
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 100); // Reset trigger
      // Haptic feedback for high multiplier
      hapticForMultiplier(cashoutMult);
    } else {
      // Standard cashout haptic
      haptic('cashout');
    }
    
    sounds.playCashoutSound(cashoutMult);
    
    // Show toast with streak bonus info
    if (bonusAmount > 0 && newTier) {
      toast.success(
        <div className="flex flex-col">
          <span>Cashed out at {cashoutMult.toFixed(2)}x: {formatTaka(baseWinnings)}</span>
          <span className="text-green-400 text-sm">
            +{formatTaka(bonusAmount)} streak bonus ({newTier.name} {newStreak}x)
          </span>
        </div>
      );
    } else {
      toast.success(`Cashed out at ${cashoutMult.toFixed(2)}x: ${formatTaka(finalPayout)}`);
    }
  }, [phase, bet1, bet2, multiplier, streakState, sounds]);
  
  // Update stake
  const updateStake = useCallback((panelId: 1 | 2, value: number) => {
    const setBet = panelId === 1 ? setBet1 : setBet2;
    setBet(prev => ({ ...prev, stake: Math.max(1, Math.min(10000, value)) }));
  }, []);
  
  // Update auto settings
  const updateAutoSettings = useCallback((panelId: 1 | 2, settings: Partial<BetState>) => {
    const setBet = panelId === 1 ? setBet1 : setBet2;
    setBet(prev => ({ ...prev, ...settings }));
  }, []);

  // Keyboard shortcut state - show hints tooltip
  const [showShortcutsHint, setShowShortcutsHint] = useState(false);

  // Keyboard shortcuts handlers
  const keyboardHandlers = useMemo(() => ({
    onPlaceBet1: () => handlePlaceBet(1),
    onPlaceBet2: () => handlePlaceBet(2),
    onCashout1: () => handleCashout(1),
    onCashout2: () => handleCashout(2),
    onCancel1: () => handleCancelBet(1),
    onCancel2: () => handleCancelBet(2),
    onIncreaseStake1: () => updateStake(1, bet1.stake + 10),
    onDecreaseStake1: () => updateStake(1, bet1.stake - 10),
    onIncreaseStake2: () => updateStake(2, bet2.stake + 10),
    onDecreaseStake2: () => updateStake(2, bet2.stake - 10),
    canPlaceBet1: phase === "WAITING" && !bet1.isPlaced && balance >= bet1.stake,
    canPlaceBet2: phase === "WAITING" && !bet2.isPlaced && balance >= bet2.stake,
    canCashout1: phase === "RUNNING" && bet1.isPlaced && !bet1.isCashedOut,
    canCashout2: phase === "RUNNING" && bet2.isPlaced && !bet2.isCashedOut,
    canCancel1: phase === "WAITING" && bet1.isPlaced,
    canCancel2: phase === "WAITING" && bet2.isPlaced,
  }), [handlePlaceBet, handleCashout, handleCancelBet, updateStake, phase, bet1, bet2, balance]);

  useAviatorKeyboardShortcuts(keyboardHandlers);
  
  return (
    <PageScaffold
      title="Aviator | GoLucky"
      description="Play Aviator crash game — cash out before the plane flies away."
      canonicalPath="/game/aviator"
      fullWidth
    >
    <>
      {/* Confetti celebration for high multiplier cashouts */}
      <Confetti isActive={showConfetti} intensity={confettiIntensity} duration={3000} />
      
      <div className="min-h-screen bg-[#0B0B0B] flex flex-col">
      <div className="max-w-[420px] mx-auto w-full flex flex-col min-h-screen">
        {/* Top Bar */}
        <AviatorTopBar 
          balance={balance}
          onBack={() => navigate('/home')}
          onSettings={() => setSettingsOpen(true)}
          soundEnabled={sounds.settings.enabled}
          setSoundEnabled={sounds.setSoundEnabled}
          soundVolume={sounds.settings.volume}
          setSoundVolume={sounds.setVolume}
          onChatOpen={() => setChatOpen(true)}
        />
        
        {/* History Row */}
        <AviatorHistoryRow history={history.slice(0, 7)} />
        
        {/* Game Panel */}
        <AviatorGamePanel
          phase={phase}
          multiplier={multiplier}
          visualMultiplier={visualMultiplier}
          countdown={countdown}
          crashPoint={crashPoint}
          playerCount={4549}
          roundId={roundId}
          ping={ping}
          soundEnabled={sounds.settings.enabled}
          soundVolume={sounds.settings.volume}
          onToggleSound={sounds.toggleSounds}
          onSetVolume={sounds.setVolume}
        />
        
        {/* Streak Bonus Indicator */}
        <div className="px-2">
          <AviatorStreakBonus streakState={streakState} compact />
        </div>
        
        {/* Keyboard Shortcuts & Session Summary Buttons */}
        <div className="relative px-2 mb-1 flex items-center gap-2">
          <button
            onClick={() => setShowShortcutsHint(!showShortcutsHint)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors bg-[#1a1a1a] rounded-lg border border-gray-700/50"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Shortcuts</span>
          </button>
          
          {/* Session Summary Button */}
          <button
            onClick={() => setSessionSummaryOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-purple-400 hover:text-purple-300 transition-colors bg-purple-900/20 rounded-lg border border-purple-700/50 hover:bg-purple-900/30"
          >
            <FileBarChart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Session</span>
          </button>
          
          {showShortcutsHint && (
            <div className="absolute left-2 top-full mt-1 z-50 bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 shadow-xl min-w-[220px]">
              <div className="text-xs font-semibold text-white mb-2">Keyboard Shortcuts</div>
              <div className="space-y-1.5">
                {AVIATOR_SHORTCUTS.map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between gap-3">
                    <kbd className="px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded text-[10px] font-mono border border-gray-600">
                      {shortcut.key}
                    </kbd>
                    <span className="text-gray-400 text-[11px] text-right flex-1">{shortcut.action}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowShortcutsHint(false)}
                className="mt-2 w-full text-center text-[10px] text-gray-500 hover:text-gray-300"
              >
                Click to close
              </button>
            </div>
          )}
        </div>
        
        {/* Bet Panels - Two stacked panels */}
        <div className="space-y-2 p-2 bg-[#0B0B0B]">
          <AviatorBetPanel
            panelId={1}
            phase={phase}
            bet={bet1}
            multiplier={multiplier}
            onPlaceBet={() => handlePlaceBet(1)}
            onCancelBet={() => handleCancelBet(1)}
            onCashout={() => handleCashout(1)}
            onUpdateStake={(v) => updateStake(1, v)}
            onUpdateAuto={(s) => updateAutoSettings(1, s)}
          />
          <AviatorBetPanel
            panelId={2}
            phase={phase}
            bet={bet2}
            multiplier={multiplier}
            onPlaceBet={() => handlePlaceBet(2)}
            onCancelBet={() => handleCancelBet(2)}
            onCashout={() => handleCashout(2)}
            onUpdateStake={(v) => updateStake(2, v)}
            onUpdateAuto={(s) => updateAutoSettings(2, s)}
          />
        </div>
        
        {/* Bet History Panel */}
        <AviatorBetHistory history={betHistory} />
        
        {/* Live Bets Section at Bottom */}
        <AviatorLiveBets
          phase={phase}
          multiplier={multiplier}
          crashPoint={crashPoint}
          onTopWinnersChange={setTopWinners}
        />
        
        {/* Settings Drawer */}
        <AviatorSettingsDrawer
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          balance={balance}
          setBalance={() => {}} // Real wallet - balance is read-only
          houseEdge={houseEdge}
          setHouseEdge={setHouseEdge}
          roundSpeed={roundSpeed}
          setRoundSpeed={setRoundSpeed}
          countdownSeconds={countdownSeconds}
          setCountdownSeconds={setCountdownSeconds}
          clientSeed={clientSeed}
          setClientSeed={setClientSeed}
          autoRun={autoRun}
          setAutoRun={setAutoRun}
          serverSeedHash={serverSeedHash}
          nonce={nonce}
          soundSettings={sounds.settings}
          onSetBetVolume={sounds.setBetVolume}
          onSetCashoutVolume={sounds.setCashoutVolume}
          onSetCrashVolume={sounds.setCrashVolume}
          onSetAmbientVolume={sounds.setAmbientVolume}
        />
        
        {/* Provably Fair Modal */}
        <AviatorFairModal
          open={fairModalOpen}
          onClose={() => setFairModalOpen(false)}
          history={history}
          currentServerSeedHash={serverSeedHash}
          currentClientSeed={clientSeed}
          currentNonce={nonce}
        />
        
        {/* Chat Drawer */}
        <AviatorChatDrawer
          open={chatOpen}
          onClose={() => setChatOpen(false)}
        />
        
        {/* Streak Milestone Celebration */}
        <AviatorStreakMilestone
          tier={milestoneTier}
          streak={milestoneStreak}
          isVisible={showMilestone}
          onComplete={() => setShowMilestone(false)}
        />
        
        {/* Session Summary Modal */}
        <AviatorSessionSummary
          isOpen={sessionSummaryOpen}
          onClose={() => setSessionSummaryOpen(false)}
          stats={sessionStats}
          betHistory={betHistory}
          balance={balance}
          startingBalance={startingBalance}
          sessionStartTime={sessionStartTime}
          bestStreak={streakState.bestStreak}
          totalBonusEarned={streakState.totalBonusEarned}
          onResetSession={resetSession}
        />
      </div>
    </div>
    </>
    </PageScaffold>
  );
};

export default AviatorGame;
