import { motionScrollBehavior } from "@/lib/reducedMotion";
import { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, TrendingUp, User, Trophy, Sparkles, Flame, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import VolumeControl from "./VolumeControl";

interface LiveBet {
  id: string;
  bet_amount: number;
  bet_type: string;
  bet_value: string;
  game_type: string;
  game_mode: string;
  created_at: string;
  potential_win: number;
  user_id: string;
  isDemo?: boolean;
  isWin?: boolean;
  winAmount?: number;
  isBigWin?: boolean;
}

interface LiveBetsFeedProps {
  gameType?: string;
  maxItems?: number;
  className?: string;
}

// Audio context for sound effects
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Play a notification beep sound with volume control - Enhanced
const playBetSound = (volume: number, betAmount: number = 0) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Higher pitch for bigger bets
    const baseFreq = betAmount >= 1000 ? 900 : betAmount >= 500 ? 850 : 800;
    oscillator.frequency.value = baseFreq;
    oscillator.type = "sine";
    
    const adjustedVolume = 0.15 * volume;
    gainNode.gain.setValueAtTime(adjustedVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
    
    // Add a subtle second tone for big bets
    if (betAmount >= 500) {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = baseFreq * 1.5;
      osc2.type = "triangle";
      gain2.gain.setValueAtTime(adjustedVolume * 0.5, ctx.currentTime + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc2.start(ctx.currentTime + 0.05);
      osc2.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    console.log("Audio not available");
  }
};

// Play a win chime sound with volume control - Enhanced
const playWinSound = (volume: number, isBigWin?: boolean, winAmount?: number) => {
  try {
    const ctx = getAudioContext();
    
    // Different chord progressions based on win size
    let frequencies: number[];
    let waveType: OscillatorType = "sine";
    let duration = 0.3;
    
    if (isBigWin && winAmount && winAmount >= 5000) {
      // Jackpot sound - triumphant fanfare
      frequencies = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      waveType = "triangle";
      duration = 0.6;
    } else if (isBigWin) {
      // Big win - triumphant chord
      frequencies = [523.25, 659.25, 783.99, 1046.50];
      waveType = "triangle";
      duration = 0.5;
    } else if (winAmount && winAmount >= 500) {
      // Medium win
      frequencies = [523.25, 659.25, 783.99, 987.77];
      waveType = "sine";
      duration = 0.4;
    } else {
      // Small win
      frequencies = [659.25, 783.99, 987.77];
      waveType = "sine";
      duration = 0.3;
    }
    
    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = waveType;
      
      const startTime = ctx.currentTime + (i * 0.06);
      const baseVolume = isBigWin ? 0.22 : 0.15;
      const adjustedVolume = baseVolume * volume;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(adjustedVolume, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
    
    // Add shimmer effect for big wins
    if (isBigWin) {
      for (let i = 0; i < 3; i++) {
        const shimmer = ctx.createOscillator();
        const shimmerGain = ctx.createGain();
        shimmer.connect(shimmerGain);
        shimmerGain.connect(ctx.destination);
        shimmer.frequency.value = 2000 + (i * 500);
        shimmer.type = "sine";
        const shimmerStart = ctx.currentTime + 0.3 + (i * 0.1);
        shimmerGain.gain.setValueAtTime(0.05 * volume, shimmerStart);
        shimmerGain.gain.exponentialRampToValueAtTime(0.001, shimmerStart + 0.2);
        shimmer.start(shimmerStart);
        shimmer.stop(shimmerStart + 0.2);
      }
    }
  } catch (e) {
    console.log("Audio not available");
  }
};

// Play coin drop sound
const playCoinSound = (volume: number) => {
  try {
    const ctx = getAudioContext();
    const frequencies = [1200, 1400, 1600, 1800];
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      const startTime = ctx.currentTime + (i * 0.03);
      gain.gain.setValueAtTime(0.08 * volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);
      osc.start(startTime);
      osc.stop(startTime + 0.08);
    });
  } catch (e) {
    console.log("Audio not available");
  }
};

const GAME_LABELS: Record<string, string> = {
  wingo: "WinGo",
  k3: "K3",
  fiveD: "5D",
  trxWin: "TRX Win",
  crash: "Crash",
  aviator: "Aviator",
  mines: "Mines",
};

// Format large amounts nicely
const formatBetAmount = (amount: number): string => {
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toLocaleString();
};

const GAME_MODES = ["1min", "3min", "5min", "10min"];

const DEMO_NAMES = [
  "Rahim", "Karim", "Jahid", "Sohel", "Mamun", "Rafiq", "Shakil", "Imran",
  "Tanvir", "Nahid", "Farhan", "Arif", "Saiful", "Mizanur", "Rubel", "Hasib",
  "Shamim", "Jamal", "Kabir", "Faisal", "Nasir", "Habib", "Liton", "Sumon",
  "Shanto", "Rakib", "Sajib", "Asif", "Biplab", "Tushar", "Jewel", "Rony",
  "Shuvo", "Lucky", "Hero", "Star", "Winner", "Pro", "King", "Boss",
  "Messi", "Ronaldo", "Neymar", "Shakib", "Tamim", "Mustafiz", "Liton", "Taskin"
];

// Much bigger bet amounts for more exciting display
const BET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000, 10000, 25000, 50000, 100000];
const COLOR_BETS = ["green", "red", "violet"];
const NUMBER_BETS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const BIG_SMALL_BETS = ["Big", "Small"];
const ODD_EVEN_BETS = ["odd", "even"];

const WIN_EMOJIS = ["🎉", "🏆", "💰", "🔥", "⭐", "💎", "🚀", "✨"];

const getBetLabel = (betType: string, betValue: string): string => {
  if (betType === "number") return `#${betValue}`;
  if (betType === "color") {
    const colors: Record<string, string> = {
      green: "🟢",
      red: "🔴",
      violet: "🟣",
    };
    return colors[betValue] || betValue;
  }
  if (betType === "bigSmall") return betValue === "Big" ? "⬆️ Big" : "⬇️ Small";
  if (betType === "oddEven") return betValue === "odd" ? "Odd" : "Even";
  if (betType === "sum") return `Sum ${betValue}`;
  return betValue;
};

const generateAnonymousName = (userId: string, isDemo?: boolean): string => {
  if (isDemo) {
    const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const name = DEMO_NAMES[hash % DEMO_NAMES.length];
    const num = (hash % 900) + 100;
    return `${name}${num}`;
  }
  const names = ["Player", "Gamer", "Bettor", "Lucky", "Winner", "Star", "Pro", "Ace"];
  const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const name = names[hash % names.length];
  const num = (hash % 9000) + 1000;
  return `${name}${num.toString().slice(-3)}`;
};

const getMultiplier = (betType: string, betValue: string): number => {
  if (betType === "number") return 9;
  if (betType === "color") {
    if (betValue === "violet") return 4.5;
    return 2;
  }
  if (betType === "bigSmall" || betType === "oddEven") return 2;
  return 2;
};

const generateDemoBet = (gameType?: string): LiveBet => {
  const id = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const userId = `demo-user-${Math.random().toString(36).slice(2, 11)}`;
  const selectedGameType = gameType || ["wingo", "k3", "fiveD", "trxWin", "crash", "aviator", "mines"][Math.floor(Math.random() * 7)];
  
  const betTypes = ["number", "color", "bigSmall", "oddEven"];
  const betType = betTypes[Math.floor(Math.random() * betTypes.length)];
  
  let betValue: string;
  if (betType === "number") {
    betValue = NUMBER_BETS[Math.floor(Math.random() * NUMBER_BETS.length)];
  } else if (betType === "color") {
    betValue = COLOR_BETS[Math.floor(Math.random() * COLOR_BETS.length)];
  } else if (betType === "bigSmall") {
    betValue = BIG_SMALL_BETS[Math.floor(Math.random() * BIG_SMALL_BETS.length)];
  } else {
    betValue = ODD_EVEN_BETS[Math.floor(Math.random() * ODD_EVEN_BETS.length)];
  }
  
  // Generate bigger, more exciting bet amounts with tiers
  const tier = Math.random();
  let betAmount: number;
  if (tier > 0.95) {
    // Whale bets (5%) - ৳50K - ৳500K
    betAmount = Math.floor(Math.random() * 450000) + 50000;
  } else if (tier > 0.85) {
    // High roller (10%) - ৳10K - ৳50K
    betAmount = Math.floor(Math.random() * 40000) + 10000;
  } else if (tier > 0.65) {
    // Medium bets (20%) - ৳2K - ৳10K
    betAmount = Math.floor(Math.random() * 8000) + 2000;
  } else if (tier > 0.40) {
    // Regular bets (25%) - ৳500 - ৳2K
    betAmount = Math.floor(Math.random() * 1500) + 500;
  } else {
    // Small bets (40%) - ৳100 - ৳500
    betAmount = Math.floor(Math.random() * 400) + 100;
  }
  
  const multiplier = getMultiplier(betType, betValue);
  const potentialWin = betAmount * multiplier;
  
  // Higher win rate for bigger bets to make it more exciting
  const winChance = betAmount >= 50000 ? 0.5 : betAmount >= 10000 ? 0.45 : 0.4;
  const isWin = Math.random() < winChance;
  const winAmount = isWin ? potentialWin : 0;
  const isBigWin = isWin && winAmount >= 10000; // Raised threshold for big win
  
  return {
    id,
    bet_amount: betAmount,
    bet_type: betType,
    bet_value: betValue,
    game_type: selectedGameType,
    game_mode: GAME_MODES[Math.floor(Math.random() * GAME_MODES.length)],
    created_at: new Date().toISOString(),
    potential_win: potentialWin,
    user_id: userId,
    isDemo: true,
    isWin,
    winAmount,
    isBigWin,
  };
};

// Mini confetti component for wins - Enhanced with more particles
const MiniConfetti = forwardRef<HTMLDivElement, { isBigWin?: boolean; isJackpot?: boolean }>(
  ({ isBigWin, isJackpot }, ref) => {
    const particleCount = isJackpot ? 20 : isBigWin ? 12 : 6;
    const colors = isJackpot 
      ? ["bg-yellow-400", "bg-orange-400", "bg-red-400", "bg-pink-400", "bg-purple-400"]
      : ["bg-yellow-400", "bg-green-400", "bg-orange-400", "bg-pink-400"];
    
    return (
      <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(particleCount)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute rounded-full animate-confetti-fall",
              isJackpot ? "w-2 h-2" : isBigWin ? "w-1.5 h-1.5" : "w-1 h-1",
              colors[i % colors.length],
            )}
            style={{
              left: `${5 + (i * 10) % 90}%`,
              animationDelay: `${i * 0.08}s`,
              animationDuration: `${0.8 + Math.random() * 0.7}s`,
            }}
          />
        ))}
        {/* Extra star particles for jackpot */}
        {isJackpot && [...Array(5)].map((_, i) => (
          <Star
            key={`star-${i}`}
            size={8}
            className="absolute text-yellow-300 animate-sparkle fill-yellow-300"
            style={{
              top: `${10 + (i * 18)}%`,
              left: `${15 + (i * 17)}%`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    );
  }
);
MiniConfetti.displayName = "MiniConfetti";

// Sparkle effect component - Enhanced
const SparkleEffect = forwardRef<HTMLDivElement, { intensity?: "low" | "medium" | "high" }>(
  ({ intensity = "medium" }, ref) => {
    const count = intensity === "high" ? 8 : intensity === "medium" ? 5 : 3;
    return (
      <div ref={ref} className="absolute -inset-1 overflow-hidden pointer-events-none">
        {[...Array(count)].map((_, i) => (
          <Sparkles
            key={i}
            size={intensity === "high" ? 12 : 10}
            className={cn(
              "absolute animate-sparkle",
              intensity === "high" ? "text-yellow-200" : "text-yellow-300"
            )}
            style={{
              top: `${10 + (i * (80 / count))}%`,
              left: `${i % 2 === 0 ? `${5 + (i * 3)}%` : `${85 - (i * 3)}%`}`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    );
  }
);
SparkleEffect.displayName = "SparkleEffect";

// Fire effect for big wins
const FireEffect = forwardRef<HTMLDivElement, object>((_, ref) => (
  <div ref={ref} className="absolute -inset-1 overflow-hidden pointer-events-none">
    {[...Array(3)].map((_, i) => (
      <Flame
        key={i}
        size={14}
        className="absolute text-orange-400 animate-fire-flicker"
        style={{
          bottom: "-5px",
          left: `${20 + (i * 30)}%`,
          animationDelay: `${i * 0.1}s`,
        }}
      />
    ))}
  </div>
));
FireEffect.displayName = "FireEffect";

// Coin rain effect for jackpots
const CoinRainEffect = forwardRef<HTMLDivElement, object>((_, ref) => (
  <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="absolute w-3 h-3 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 animate-confetti-fall shadow-lg"
        style={{
          left: `${8 + (i * 12)}%`,
          animationDelay: `${i * 0.12}s`,
          animationDuration: `${1 + Math.random() * 0.5}s`,
          boxShadow: "0 0 4px rgba(234, 179, 8, 0.6)",
        }}
      >
        <span className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-yellow-800">৳</span>
      </div>
    ))}
  </div>
));
CoinRainEffect.displayName = "CoinRainEffect";

const LiveBetsFeed = ({ gameType, maxItems = 10, className }: LiveBetsFeedProps) => {
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.7);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const generateInitialDemoBets = useCallback(() => {
    const demoBets: LiveBet[] = [];
    for (let i = 0; i < 8; i++) {
      demoBets.push(generateDemoBet(gameType));
    }
    return demoBets;
  }, [gameType]);

  // Play sound for new bets - Enhanced
  const handleNewBet = useCallback((bet: LiveBet, isInitial: boolean = false) => {
    if (!isInitial && soundEnabled) {
      const isJackpot = bet.isWin && (bet.winAmount || 0) >= 5000;
      
      if (isJackpot) {
        // Play jackpot sound
        playWinSound(soundVolume, true, bet.winAmount);
        setTimeout(() => playCoinSound(soundVolume), 300);
      } else if (bet.isWin) {
        playWinSound(soundVolume, bet.isBigWin, bet.winAmount);
      } else {
        playBetSound(soundVolume, bet.bet_amount);
      }
      
      // Vibration feedback for mobile
      if (navigator.vibrate) {
        if (isJackpot) {
          navigator.vibrate([100, 50, 100, 50, 200]);
        } else if (bet.isBigWin) {
          navigator.vibrate([100, 50, 100]);
        } else if (bet.isWin) {
          navigator.vibrate(80);
        } else if (bet.bet_amount >= 1000) {
          navigator.vibrate(50);
        }
      }
    }
  }, [soundEnabled, soundVolume]);

  // Smooth scroll to top when new bet arrives
  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: motionScrollBehavior()
      });
    }
  }, []);

  useEffect(() => {
    const initialBets = generateInitialDemoBets();
    setLiveBets(initialBets);
    isFirstRender.current = false;

    const fetchRecentBets = async () => {
      let query = supabase
        .from("game_bets")
        .select("id, bet_amount, bet_type, bet_value, game_type, game_mode, created_at, potential_win, user_id, status, payout")
        .order("created_at", { ascending: false })
        .limit(maxItems);

      if (gameType) {
        query = query.eq("game_type", gameType);
      }

      const { data } = await query;
      if (data && data.length > 0) {
        const realBets = data.map(bet => ({
          ...bet,
          isDemo: false,
          isWin: bet.status === "won",
          winAmount: bet.payout || 0,
          isBigWin: (bet.payout || 0) >= 1000,
        }));
        setLiveBets(prev => [...realBets, ...prev].slice(0, maxItems + 5));
      }
    };

    fetchRecentBets();

    const channel = supabase
      .channel("live-bets-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_bets",
          ...(gameType ? { filter: `game_type=eq.${gameType}` } : {}),
        },
        (payload) => {
          const newBet = payload.new as LiveBet;
          const betWithMeta = { ...newBet, isDemo: false };
          handleNewBet(betWithMeta);
          setLiveBets((prev) => {
            const updated = [betWithMeta, ...prev].slice(0, maxItems + 5);
            return updated;
          });
          scrollToTop();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    const demoInterval = setInterval(() => {
      const newDemoBet = generateDemoBet(gameType);
      handleNewBet(newDemoBet);
      setLiveBets((prev) => {
        const updated = [newDemoBet, ...prev].slice(0, maxItems + 5);
        return updated;
      });
      scrollToTop();
    }, 2000 + Math.random() * 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(demoInterval);
    };
  }, [gameType, maxItems, generateInitialDemoBets, handleNewBet]);

  if (liveBets.length === 0) {
    return (
      <div className={cn("bg-gray-800/50 rounded-xl p-4", className)}>
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} className="text-orange-500" />
          <span className="text-white text-sm font-medium">🔴 Live Bets</span>
          <span className={cn(
            "w-2 h-2 rounded-full ml-auto",
            isConnected ? "bg-green-500 animate-pulse" : "bg-gray-500"
          )} />
        </div>
        <p className="text-gray-500 text-xs text-center py-4">
          Waiting for bets...
        </p>
      </div>
    );
  }

  // Calculate total wagered for stats
  const totalWagered = liveBets.reduce((sum, bet) => sum + bet.bet_amount, 0);
  const totalWins = liveBets.filter(b => b.isWin).reduce((sum, bet) => sum + (bet.winAmount || 0), 0);

  return (
    <div className={cn("bg-gray-800/50 rounded-xl p-4 relative overflow-hidden", className)}>
      {/* Premium background glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-center gap-2 mb-3 relative z-10">
        <div className="relative">
          <Activity size={18} className="text-orange-500" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        </div>
        <span className="text-white text-sm font-bold">🔴 Live Bets</span>
        <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full animate-pulse font-semibold">
          {liveBets.length}+ Active
        </span>
        
        {/* Volume Control with Slider */}
        <div className="ml-auto">
          <VolumeControl
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            soundVolume={soundVolume}
            setSoundVolume={setSoundVolume}
            buttonSize={14}
          />
        </div>
        
        <span className={cn(
          "w-2.5 h-2.5 rounded-full relative",
          "bg-green-500"
        )}>
          <span className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
        </span>
      </div>
      
      {/* Live Stats Bar */}
      <div className="flex items-center gap-3 mb-3 p-2 bg-gradient-to-r from-orange-500/10 via-transparent to-green-500/10 rounded-lg border border-white/5 relative z-10">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={12} className="text-orange-400" />
          <span className="text-[10px] text-gray-400">Wagered:</span>
          <span className="text-xs font-bold text-orange-400">৳{formatBetAmount(totalWagered)}</span>
        </div>
        <div className="w-px h-4 bg-gray-600" />
        <div className="flex items-center gap-1.5">
          <Trophy size={12} className="text-green-400" />
          <span className="text-[10px] text-gray-400">Won:</span>
          <span className="text-xs font-bold text-green-400">৳{formatBetAmount(totalWins)}</span>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide"
      >
        {liveBets.map((bet, index) => {
          const isJackpot = bet.isWin && (bet.winAmount || 0) >= 50000;
          const isMegaWin = bet.isWin && (bet.winAmount || 0) >= 20000 && !isJackpot;
          const isHighRoller = bet.bet_amount >= 10000;
          const isWhale = bet.bet_amount >= 50000;
          
          return (
            <div
              key={bet.id}
              className={cn(
                "relative flex items-center gap-2 p-2 rounded-lg transition-all duration-300",
                // Staggered entrance animations for first 5 items
                index === 0 && "animate-bet-slide-in animate-bet-glow-in",
                index === 1 && "animate-bet-pop-in",
                index === 2 && "animate-bet-slide-in",
                index === 3 && "animate-bet-pop-in",
                index === 4 && "animate-bet-slide-in",
                // Win animations
                isJackpot && "animate-rainbow-border animate-jackpot-shake",
                isMegaWin && "animate-big-win-glow",
                bet.isBigWin && !isJackpot && !isMegaWin && "animate-big-win-glow",
                bet.isWin && !bet.isBigWin && "animate-win-shimmer",
                // Background colors
                isJackpot
                  ? "bg-gradient-to-r from-purple-500/40 via-yellow-500/40 to-pink-500/40 border-2 border-yellow-400 shadow-2xl shadow-yellow-500/50"
                  : isMegaWin
                    ? "bg-gradient-to-r from-orange-500/30 via-yellow-500/30 to-orange-500/30 border-2 border-orange-400/70 shadow-xl shadow-orange-500/30"
                  : bet.isBigWin 
                    ? "bg-gradient-to-r from-yellow-500/30 via-orange-500/20 to-yellow-500/30 border-2 border-yellow-400/60 shadow-lg shadow-yellow-500/20" 
                    : bet.isWin 
                      ? "bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/40" 
                      : isWhale
                        ? "bg-gradient-to-r from-purple-500/20 via-indigo-500/15 to-purple-500/20 border-2 border-purple-400/50 shadow-lg shadow-purple-500/20"
                      : isHighRoller
                        ? "bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30"
                        : "bg-gray-700/30",
                index === 0 && !bet.isWin && !isHighRoller && "bg-orange-500/10 border border-orange-500/30"
              )}
              style={{
                animationDelay: index < 5 ? `${index * 0.1}s` : '0s',
              }}
            >
              {/* Jackpot coin rain effect */}
              {isJackpot && index < 2 && <CoinRainEffect />}
              
              {/* Confetti for wins */}
              {bet.isWin && index < 3 && <MiniConfetti isBigWin={bet.isBigWin} isJackpot={isJackpot} />}
              
              {/* Fire effect for big wins */}
              {bet.isBigWin && !isJackpot && index < 2 && <FireEffect />}
              
              {/* Sparkle effect for big wins */}
              {bet.isBigWin && <SparkleEffect intensity={isJackpot ? "high" : "medium"} />}
            
            {/* User Avatar */}
            <div className={cn(
              "relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10",
              bet.isBigWin 
                ? "bg-gradient-to-br from-yellow-300 via-orange-400 to-yellow-500 animate-pulse shadow-lg shadow-yellow-500/50" 
                : bet.isWin 
                  ? "bg-gradient-to-br from-green-400 to-emerald-500" 
                  : "bg-gradient-to-br from-orange-400 to-orange-600"
            )}>
              {bet.isBigWin ? (
                <Flame size={16} className="text-white animate-bounce" />
              ) : bet.isWin ? (
                <Trophy size={14} className="text-white" />
              ) : (
                <User size={14} className="text-white" />
              )}
              
              {/* Glow ring for big wins */}
              {bet.isBigWin && (
                <div className="absolute inset-0 rounded-full bg-yellow-400/50 animate-ping" />
              )}
            </div>
            
            {/* Bet Info */}
            <div className="flex-1 min-w-0 z-10">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={cn(
                  "text-xs font-medium truncate",
                  bet.isBigWin ? "text-yellow-300" : "text-white"
                )}>
                  {generateAnonymousName(bet.user_id, bet.isDemo)}
                </span>
                {!gameType && (
                  <span className="text-gray-400 text-[10px] bg-gray-700/50 px-1.5 py-0.5 rounded">
                    {GAME_LABELS[bet.game_type] || bet.game_type}
                  </span>
                )}
                {isJackpot && (
                  <span className="text-[10px] bg-gradient-to-r from-purple-500 via-yellow-500 to-pink-500 text-white px-2.5 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-0.5 shadow-lg">
                    <Star size={10} className="fill-white animate-spin" />
                    JACKPOT!
                  </span>
                )}
                {isMegaWin && !isJackpot && (
                  <span className="text-[10px] bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-0.5">
                    <Flame size={9} className="fill-white" />
                    MEGA WIN!
                  </span>
                )}
                {bet.isBigWin && !isMegaWin && !isJackpot && (
                  <span className="text-[10px] bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-0.5">
                    <Star size={8} className="fill-white" />
                    BIG WIN!
                  </span>
                )}
                {isWhale && !bet.isWin && (
                  <span className="text-[10px] bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                    🐋 WHALE
                  </span>
                )}
                {bet.isWin && !bet.isBigWin && (
                  <span className="text-[10px] bg-green-500/30 text-green-300 px-1.5 py-0.5 rounded-full">
                    {WIN_EMOJIS[Math.floor(Math.random() * WIN_EMOJIS.length)]} Won!
                  </span>
                )}
              </div>
              <p className={cn(
                "text-[10px]",
                bet.isBigWin ? "text-yellow-200/80" : "text-gray-400"
              )}>
                {bet.isWin ? "Won on" : "Bet on"} {getBetLabel(bet.bet_type, bet.bet_value)}
              </p>
            </div>
            
            {/* Amount */}
            <div className="text-right flex-shrink-0 z-10">
              {bet.isWin ? (
                <>
                  <p className={cn(
                    "font-bold flex items-center gap-0.5 justify-end",
                    isJackpot
                      ? "text-yellow-300 text-base animate-pulse"
                      : isMegaWin
                        ? "text-orange-300 text-sm animate-pulse"
                      : bet.isBigWin 
                        ? "text-yellow-300 text-sm animate-pulse" 
                        : "text-green-400 text-xs"
                  )}>
                    {isJackpot ? <Star size={14} className="animate-spin" /> : bet.isBigWin ? <Flame size={12} /> : <Trophy size={10} />}
                    +৳{formatBetAmount(bet.winAmount || bet.potential_win)}
                  </p>
                  <p className={cn(
                    "text-[10px]",
                    bet.isBigWin ? "text-yellow-200/60" : "text-gray-400"
                  )}>
                    from ৳{formatBetAmount(bet.bet_amount)}
                  </p>
                </>
              ) : (
                <>
                  <p className={cn(
                    "font-bold",
                    isWhale ? "text-purple-300 text-sm" : isHighRoller ? "text-purple-400 text-xs" : "text-orange-400 text-xs"
                  )}>
                    ৳{formatBetAmount(bet.bet_amount)}
                  </p>
                  <p className="text-green-400 text-[10px] flex items-center gap-0.5 justify-end">
                    <TrendingUp size={10} />
                    ৳{formatBetAmount(bet.potential_win)}
                  </p>
                </>
              )}
            </div>
          </div>
        )})}
      </div>
      
      {/* Activity indicator - Premium */}
      <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 border-2 border-gray-800 flex items-center justify-center shadow-lg"
                style={{ zIndex: 6 - i }}
              >
                <User size={12} className="text-white" />
              </div>
            ))}
          </div>
          <span className="text-gray-400 text-[10px]">
            +{Math.floor(Math.random() * 500) + 1500} online
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-full border border-green-500/20">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[9px] text-green-400 font-medium">LIVE</span>
        </div>
      </div>
    </div>
  );
};

export default LiveBetsFeed;
