import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Trophy, Crown, Flame, TrendingUp, 
  Medal, Star, Zap, Users, ChevronRight, Sparkles, Gem,
  RefreshCw, Clock, Wifi
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { VIP_LEVELS } from "@/hooks/useVIPLevel";
import { cn } from "@/lib/utils";
import GlassCard from "@/components/auth/GlassCard";

// Floating particle component
const FloatingParticle = (_props: any) => null; // Removed for performance (Final Polish Phase 2)

// Floating sparkle
const FloatingSparkle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      rotate: [0, 180, 360]
    }}
    transition={{
      duration: 3,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
  </motion.div>
);

// Glowing orb
const GlowingOrb = ({ className }: { className?: string }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
    animate={{
      scale: [1, 1.3, 1],
      opacity: [0.2, 0.4, 0.2],
    }}
    transition={{
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

// Holographic shine
const HolographicShine = () => (
  <motion.div
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none"
    initial={{ x: "-200%" }}
    animate={{ x: "200%" }}
    transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
  />
);

// Premium section card
const PremiumCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    className={`relative rounded-2xl overflow-hidden ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.01 }}
  >
    <div 
      className="absolute -inset-[1px] rounded-2xl opacity-40 pointer-events-none"
      style={{
        background: "linear-gradient(135deg, rgba(251,146,60,0.3) 0%, rgba(168,85,247,0.2) 50%, rgba(6,182,212,0.2) 100%)",
        filter: "blur(2px)",
      }}
    />
    <div 
      className="relative backdrop-blur-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.12] rounded-2xl"
      style={{
        boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
      }}
    >
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <HolographicShine />
      {children}
    </div>
  </motion.div>
);

interface LeaderboardEntry {
  profile_id: string;
  display_name: string;
  vip_level: number;
  avatar_url: string | null;
  total_win: number;
  total_bet: number;
}

interface ActivePlayer {
  user_id: string;
  display_name: string;
  vip_level: number;
  avatar_url: string | null;
  weekly_games: number;
  weekly_wagered: number;
  weekly_won: number;
}

// Generate dynamic mock data with large amounts
const generateMockWinners = (): LeaderboardEntry[] => {
  const names = ["Rah***23", "Kar***89", "Sha***12", "Moh***67", "Ami***34", "Nas***78", "Tan***56", "Hab***90", "Fai***23", "Asa***45"];
  const baseAmounts = [2500000, 1850000, 1420000, 980000, 756000, 625000, 498000, 387000, 312000, 275000];
  
  return names.map((name, i) => ({
    profile_id: String(i + 1),
    display_name: name,
    vip_level: Math.max(10 - i, 3),
    avatar_url: null,
    total_win: baseAmounts[i] + Math.floor(Math.random() * 50000),
    total_bet: baseAmounts[i] * 3 + Math.floor(Math.random() * 100000),
  }));
};

const generateMockVIPPlayers = (): LeaderboardEntry[] => {
  const names = ["Kin***88", "Rah***23", "Kar***89", "Sha***12", "Moh***67", "Ami***34", "Nas***78", "Tan***56", "Hab***90", "Fai***23"];
  const baseAmounts = [5200000, 3800000, 2650000, 1920000, 1580000, 1250000, 980000, 756000, 625000, 498000];
  
  return names.map((name, i) => ({
    profile_id: String(i + 1),
    display_name: name,
    vip_level: Math.max(10 - i, 4),
    avatar_url: null,
    total_win: baseAmounts[i] + Math.floor(Math.random() * 100000),
    total_bet: baseAmounts[i] * 4 + Math.floor(Math.random() * 200000),
  }));
};

const generateMockActivePlayers = (): ActivePlayer[] => {
  const names = ["Pro***99", "Gam***55", "Win***77", "Luc***33", "Hot***11", "Ace***22", "Bet***44", "Cha***66", "Max***88", "Sma***00"];
  const baseGames = [3250, 2890, 2475, 2120, 1850, 1580, 1320, 1180, 920, 780];
  const baseWagered = [1850000, 1420000, 1180000, 920000, 756000, 625000, 498000, 387000, 312000, 275000];
  
  return names.map((name, i) => ({
    user_id: String(i + 1),
    display_name: name,
    vip_level: Math.max(10 - i, 2),
    avatar_url: null,
    weekly_games: baseGames[i] + Math.floor(Math.random() * 100),
    weekly_wagered: baseWagered[i] + Math.floor(Math.random() * 50000),
    weekly_won: Math.floor(baseWagered[i] * (0.8 + Math.random() * 0.4)) + Math.floor(Math.random() * 30000),
  }));
};
const Leaderboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("winners");
  const [topWinners, setTopWinners] = useState<LeaderboardEntry[]>([]);
  const [topVIP, setTopVIP] = useState<LeaderboardEntry[]>([]);
  const [activePlayers, setActivePlayers] = useState<ActivePlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [nextUpdate, setNextUpdate] = useState(60);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update amounts with small random changes to simulate live updates
  const updateAmountsLive = useCallback(() => {
    setTopWinners(prev => prev.map(entry => ({
      ...entry,
      total_win: entry.total_win + Math.floor(Math.random() * 5000) - 1000,
      total_bet: entry.total_bet + Math.floor(Math.random() * 8000),
    })));
    
    setTopVIP(prev => prev.map(entry => ({
      ...entry,
      total_win: entry.total_win + Math.floor(Math.random() * 8000) - 2000,
      total_bet: entry.total_bet + Math.floor(Math.random() * 15000),
    })));
    
    setActivePlayers(prev => prev.map(entry => ({
      ...entry,
      weekly_games: entry.weekly_games + Math.floor(Math.random() * 5),
      weekly_won: entry.weekly_won + Math.floor(Math.random() * 3000) - 500,
    })));
    
    setLastUpdated(new Date());
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  // Countdown timer
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setNextUpdate(prev => {
        if (prev <= 1) {
          updateAmountsLive();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [updateAmountsLive]);

  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    try {
      const { data: winnersData } = await supabase
        .from("leaderboard_stats")
        .select("*")
        .order("total_win", { ascending: false })
        .limit(50);

      const { data: vipData } = await supabase
        .from("leaderboard_stats")
        .select("*")
        .order("vip_level", { ascending: false })
        .order("total_bet", { ascending: false })
        .limit(50);

      const { data: activeData } = await supabase
        .from("weekly_active_players")
        .select("*")
        .limit(50);

      setTopWinners(winnersData && winnersData.length > 0 ? winnersData : generateMockWinners());
      setTopVIP(vipData && vipData.length > 0 ? vipData : generateMockVIPPlayers());
      setActivePlayers(activeData && activeData.length > 0 ? activeData : generateMockActivePlayers());

      const { data: { user } } = await supabase.auth.getUser();
      if (user && winnersData) {
        const rank = winnersData.findIndex((entry: LeaderboardEntry) => 
          entry.profile_id === user.id
        );
        setUserRank(rank >= 0 ? rank + 1 : null);
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setTopWinners(generateMockWinners());
      setTopVIP(generateMockVIPPlayers());
      setActivePlayers(generateMockActivePlayers());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const formatAmount = (amount: number): string => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toLocaleString();
  };

  const getVIPColor = (level: number): string => {
    const vipLevel = VIP_LEVELS.find(v => v.level === level);
    return vipLevel?.color || "from-amber-400 to-yellow-500";
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return (
      <motion.div 
        className="w-11 h-11 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg"
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ boxShadow: "0 0 20px rgba(251, 191, 36, 0.5)" }}
      >
        <Trophy className="w-5 h-5 text-white" />
      </motion.div>
    );
    if (rank === 2) return (
      <motion.div 
        className="w-11 h-11 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center shadow-lg"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
      >
        <Medal className="w-5 h-5 text-white" />
      </motion.div>
    );
    if (rank === 3) return (
      <motion.div 
        className="w-11 h-11 rounded-full bg-gradient-to-r from-amber-600 to-orange-700 flex items-center justify-center shadow-lg"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
      >
        <Medal className="w-5 h-5 text-white" />
      </motion.div>
    );
    return (
      <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
        <span className="text-white font-bold text-sm">{rank}</span>
      </div>
    );
  };

  const renderWinnerCard = (entry: LeaderboardEntry, rank: number, index: number) => (
    <motion.div 
      key={entry.profile_id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, x: 5 }}
      className={cn(
        "relative flex items-center gap-3 p-4 rounded-2xl border transition-all overflow-hidden group",
        rank <= 3 
          ? "bg-gradient-to-r from-yellow-500/15 to-amber-500/10 border-yellow-500/30" 
          : "bg-white/5 backdrop-blur border-white/10 hover:border-white/20"
      )}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 opacity-0 group-hover:opacity-100"
        initial={{ x: "-200%" }}
        whileHover={{ x: "200%" }}
        transition={{ duration: 0.6 }}
      />
      
      {getRankBadge(rank)}
      
      <motion.div 
        className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-teal-500 to-cyan-500 p-0.5"
        whileHover={{ scale: 1.1 }}
      >
        <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
          {entry.avatar_url ? (
            <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Users className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </motion.div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{entry.display_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${getVIPColor(entry.vip_level)} text-white font-medium`}>
            VIP{entry.vip_level}
          </span>
          <span className="text-xs text-white/50">Bet: ৳{formatAmount(entry.total_bet)}</span>
        </div>
      </div>

      <div className="text-right">
        <motion.p 
          className="text-lg font-bold text-green-400"
          animate={rank <= 3 ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ৳{formatAmount(entry.total_win)}
        </motion.p>
        <p className="text-xs text-white/40">Total Win</p>
      </div>
    </motion.div>
  );

  const renderVIPCard = (entry: LeaderboardEntry, rank: number, index: number) => (
    <motion.div 
      key={entry.profile_id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, x: 5 }}
      className={cn(
        "relative flex items-center gap-3 p-4 rounded-2xl border transition-all overflow-hidden group",
        rank <= 3 
          ? "bg-gradient-to-r from-purple-500/15 to-pink-500/10 border-purple-500/30" 
          : "bg-white/5 backdrop-blur border-white/10 hover:border-white/20"
      )}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 opacity-0 group-hover:opacity-100"
        initial={{ x: "-200%" }}
        whileHover={{ x: "200%" }}
        transition={{ duration: 0.6 }}
      />
      
      {getRankBadge(rank)}
      
      <motion.div 
        className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 p-0.5"
        whileHover={{ scale: 1.1 }}
      >
        <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
          {entry.avatar_url ? (
            <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Crown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </motion.div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{entry.display_name}</p>
        <p className="text-xs text-white/50 mt-0.5">Total Bet: ৳{formatAmount(entry.total_bet)}</p>
      </div>

      <div className="text-right">
        <motion.span 
          className={`inline-flex items-center gap-1 text-lg font-bold px-3 py-1 rounded-full bg-gradient-to-r ${getVIPColor(entry.vip_level)} text-white`}
          animate={rank <= 3 ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Crown className="w-4 h-4" />
          VIP{entry.vip_level}
        </motion.span>
      </div>
    </motion.div>
  );

  const renderActiveCard = (entry: ActivePlayer, rank: number, index: number) => (
    <motion.div 
      key={entry.user_id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, x: 5 }}
      className={cn(
        "relative flex items-center gap-3 p-4 rounded-2xl border transition-all overflow-hidden group",
        rank <= 3 
          ? "bg-gradient-to-r from-orange-500/15 to-red-500/10 border-orange-500/30" 
          : "bg-white/5 backdrop-blur border-white/10 hover:border-white/20"
      )}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 opacity-0 group-hover:opacity-100"
        initial={{ x: "-200%" }}
        whileHover={{ x: "200%" }}
        transition={{ duration: 0.6 }}
      />
      
      {getRankBadge(rank)}
      
      <motion.div 
        className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 p-0.5"
        whileHover={{ scale: 1.1 }}
      >
        <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
          {entry.avatar_url ? (
            <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Flame className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </motion.div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{entry.display_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${getVIPColor(entry.vip_level)} text-white font-medium`}>
            VIP{entry.vip_level}
          </span>
          <span className="text-xs text-white/50">Won: ৳{formatAmount(entry.weekly_won)}</span>
        </div>
      </div>

      <div className="text-right">
        <motion.p 
          className="text-lg font-bold text-orange-400 flex items-center gap-1"
          animate={rank <= 3 ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-4 h-4" />
          {entry.weekly_games}
        </motion.p>
        <p className="text-xs text-white/40">Games</p>
      </div>
    </motion.div>
  );
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d15] to-[#0a0a0f] pb-24 overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <GlowingOrb className="w-[500px] h-[500px] bg-amber-500/20 -top-64 -left-64" />
        <GlowingOrb className="w-96 h-96 bg-orange-500/15 top-1/3 -right-48" />
        <GlowingOrb className="w-80 h-80 bg-purple-500/10 bottom-1/4 left-1/4" />
        
        {[...Array(15)].map((_, i) => (
          <FloatingParticle 
            key={i} 
            delay={i * 0.4} 
            duration={10 + Math.random() * 5}
            x={Math.random() * 100}
          />
        ))}

        {[...Array(10)].map((_, i) => (
          <FloatingSparkle
            key={`sparkle-${i}`}
            delay={i * 0.6}
            x={Math.random() * 100}
            y={Math.random() * 100}
          />
        ))}

        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(251,146,60,0.4) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(251,146,60,0.4) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Premium Header */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/30 via-orange-500/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-transparent to-purple-500/10" />
        
        <div className="relative px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="text-white hover:bg-white/10 backdrop-blur border border-white/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </motion.div>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Trophy className="w-7 h-7 text-amber-400" />
                </motion.div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-amber-100 to-orange-200 bg-clip-text text-transparent">
                  Leaderboard
                </h1>
              </div>
            </div>
            {/* Live Status & Countdown */}
            <div className="flex items-center gap-2">
              <motion.div 
                className={`flex items-center gap-1.5 backdrop-blur px-3 py-1.5 rounded-full border ${
                  isRefreshing 
                    ? "bg-green-500/20 border-green-500/40" 
                    : "bg-white/10 border-white/20"
                }`}
                animate={isRefreshing ? { scale: [1, 1.1, 1] } : { scale: [1, 1.03, 1] }}
                transition={{ duration: isRefreshing ? 0.3 : 2, repeat: isRefreshing ? 0 : Infinity }}
              >
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Wifi className="w-3.5 h-3.5 text-green-400" />
                </motion.div>
                <span className="text-green-400 text-xs font-bold">LIVE</span>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-1.5 bg-white/5 backdrop-blur px-2.5 py-1.5 rounded-full border border-white/10"
                animate={nextUpdate <= 5 ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5, repeat: nextUpdate <= 5 ? Infinity : 0 }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-green-400" : "text-white/60"}`} />
                <span className={`text-xs font-mono ${nextUpdate <= 10 ? "text-orange-400" : "text-white/60"}`}>
                  {nextUpdate}s
                </span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="mt-4 flex items-end justify-center gap-3 pb-4">
          {/* 2nd Place */}
          <motion.div 
            className="flex flex-col items-center"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className="w-16 h-16 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 p-0.5 mb-2"
              whileHover={{ scale: 1.1 }}
            >
              <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center">
                <span className="text-2xl">🥈</span>
              </div>
            </motion.div>
            <div className="bg-gradient-to-t from-gray-400 to-gray-300 w-22 h-20 rounded-t-lg flex flex-col items-center justify-center px-2">
              <span className="text-white font-bold text-lg">2</span>
              <span className="text-white/90 text-[10px] truncate max-w-full">
                {topWinners[1]?.display_name || "---"}
              </span>
              <motion.span 
                key={topWinners[1]?.total_win}
                initial={{ scale: 1.2, color: "#4ade80" }}
                animate={{ scale: 1, color: "#ffffff" }}
                className="text-white/80 text-[10px] font-bold"
              >
                ৳{formatAmount(topWinners[1]?.total_win || 0)}
              </motion.span>
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div 
            className="flex flex-col items-center -mt-4"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative">
              <motion.div 
                className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 p-0.5 mb-2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ boxShadow: "0 0 30px rgba(251, 191, 36, 0.5)" }}
                whileHover={{ scale: 1.1 }}
              >
                <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center">
                  <span className="text-3xl">👑</span>
                </div>
              </motion.div>
              <motion.div 
                className="absolute -top-2 left-1/2 -translate-x-1/2"
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Star className="w-6 h-6 text-yellow-400" />
              </motion.div>
            </div>
            <div className="bg-gradient-to-t from-yellow-500 to-amber-400 w-28 h-24 rounded-t-lg flex flex-col items-center justify-center shadow-lg px-2">
              <span className="text-white font-bold text-xl">1</span>
              <span className="text-white/90 text-xs truncate max-w-full font-medium">
                {topWinners[0]?.display_name || "---"}
              </span>
              <motion.span 
                key={topWinners[0]?.total_win}
                initial={{ scale: 1.3, color: "#4ade80" }}
                animate={{ scale: 1, color: "#ffffff" }}
                className="text-white font-bold text-sm"
              >
                ৳{formatAmount(topWinners[0]?.total_win || 0)}
              </motion.span>
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div 
            className="flex flex-col items-center"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div 
              className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-600 to-orange-700 p-0.5 mb-2"
              whileHover={{ scale: 1.1 }}
            >
              <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center">
                <span className="text-2xl">🥉</span>
              </div>
            </motion.div>
            <div className="bg-gradient-to-t from-amber-700 to-orange-600 w-22 h-18 rounded-t-lg flex flex-col items-center justify-center px-2">
              <span className="text-white font-bold text-lg">3</span>
              <span className="text-white/90 text-[10px] truncate max-w-full">
                {topWinners[2]?.display_name || "---"}
              </span>
              <motion.span 
                key={topWinners[2]?.total_win}
                initial={{ scale: 1.2, color: "#4ade80" }}
                animate={{ scale: 1, color: "#ffffff" }}
                className="text-white/80 text-[10px] font-bold"
              >
                ৳{formatAmount(topWinners[2]?.total_win || 0)}
              </motion.span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Your Rank Banner */}
      {userRank && (
        <motion.div 
          className="mx-4 mt-4 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <PremiumCard className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <TrendingUp className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <p className="text-white font-bold">Your Ranking</p>
                  <p className="text-white/50 text-sm">Keep playing to climb up!</p>
                </div>
              </div>
              <motion.span 
                className="text-3xl font-bold text-teal-400"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                #{userRank}
              </motion.span>
            </div>
          </PremiumCard>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <PremiumCard className="p-1.5">
            <TabsList className="w-full bg-transparent border-0 p-0">
              <TabsTrigger
                value="winners"
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all"
              >
                <Trophy className="w-4 h-4 mr-1" />
                Top Winners
              </TabsTrigger>
              <TabsTrigger
                value="vip"
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all"
              >
                <Crown className="w-4 h-4 mr-1" />
                VIP Elite
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all"
              >
                <Flame className="w-4 h-4 mr-1" />
                Most Active
              </TabsTrigger>
            </TabsList>
          </PremiumCard>

          {/* Top Winners Tab */}
          <TabsContent value="winners" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div 
                  className="w-10 h-10 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ) : (
              topWinners.map((entry, index) => renderWinnerCard(entry, index + 1, index))
            )}
          </TabsContent>

          {/* VIP Elite Tab */}
          <TabsContent value="vip" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div 
                  className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ) : (
              topVIP.map((entry, index) => renderVIPCard(entry, index + 1, index))
            )}
          </TabsContent>

          {/* Most Active Tab */}
          <TabsContent value="active" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div 
                  className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ) : (
              activePlayers.map((entry, index) => renderActiveCard(entry, index + 1, index))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Info Banner */}
      <motion.div 
        className="mx-4 mt-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <PremiumCard className="p-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Star className="w-6 h-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <p className="text-white font-bold">Climb the Ranks!</p>
              <p className="text-white/50 text-sm">Play more games and increase your VIP level to appear on the leaderboard</p>
            </div>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronRight className="w-5 h-5 text-white/40" />
            </motion.div>
          </div>
        </PremiumCard>
      </motion.div>
    </div>
  );
};

export default Leaderboard;
