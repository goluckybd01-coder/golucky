import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, History, TrendingUp, TrendingDown, Clock, Gamepad2, Sparkles, Trophy, Target, Zap, Star, Crown, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { BetDetailsModal, BetDetails } from "@/components/game/BetDetailsModal";

// Enhanced floating particle with glow
const FloatingParticle = (_props: any) => null; // Removed for performance (Final Polish Phase 2)

// Floating sparkle with glow
const FloatingSparkle = ({ delay, x, y }: { delay: number; x: string; y: string }) => (
  <motion.div
    className="absolute"
    style={{ left: x, top: y }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0, 1, 0],
      scale: [0.5, 1, 0.5],
      rotate: [0, 180, 360]
    }}
    transition={{ 
      duration: 2, 
      delay, 
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <Sparkles size={12} className="text-cyan-400" />
  </motion.div>
);

// Glowing orb with pulse animation
const GlowingOrb = ({ className, color }: { className?: string; color: string }) => (
  <motion.div 
    className={`absolute rounded-full blur-3xl ${className}`} 
    style={{ background: color }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.5, 0.3]
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

// Premium holographic shine effect
const HolographicShine = () => (
  <motion.div
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
    initial={{ x: "-200%" }}
    animate={{ x: "200%" }}
    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
  />
);

// Premium 3D glass card component
const Premium3DCard = ({ 
  children, 
  className = "",
  delay = 0,
  glowColor = "rgba(20,184,166,0.2)"
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
  glowColor?: string;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 30, rotateX: -10 }}
    animate={{ opacity: 1, y: 0, rotateX: 0 }}
    transition={{ duration: 0.6, delay, type: "spring", stiffness: 100 }}
    whileHover={{ 
      scale: 1.01,
      rotateX: 2,
      boxShadow: `0 25px 50px -12px ${glowColor}`
    }}
    className={`relative backdrop-blur-2xl bg-gradient-to-br from-white/[0.12] via-white/[0.08] to-white/[0.04] border border-white/15 rounded-3xl overflow-hidden ${className}`}
    style={{
      boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 60px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.15)`,
      transformStyle: "preserve-3d",
      perspective: "1000px"
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />
    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    <motion.div
      className="absolute inset-0 rounded-3xl opacity-40"
      style={{
        background: `linear-gradient(45deg, transparent 30%, ${glowColor} 50%, transparent 70%)`,
        backgroundSize: "200% 200%"
      }}
      animate={{
        backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
      }}
      transition={{ duration: 6, repeat: Infinity }}
    />
    <HolographicShine />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

const StatCard3D = ({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  delay = 0 
}: { 
  icon: any; 
  label: string; 
  value: string; 
  color: string; 
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
    transition={{ delay, duration: 0.5, type: "spring" }}
    whileHover={{ scale: 1.05, y: -5 }}
    className="relative"
    style={{ transformStyle: "preserve-3d" }}
  >
    <Premium3DCard className="p-4" delay={delay}>
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}
          style={{ boxShadow: "0 8px 25px rgba(0,0,0,0.3)" }}
        >
          <Icon className="w-5 h-5 text-white" />
        </motion.div>
        <div>
          <p className="text-white/50 text-xs font-medium">{label}</p>
          <motion.p className="text-white text-xl font-bold" animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            {value}
          </motion.p>
        </div>
      </div>
    </Premium3DCard>
  </motion.div>
);

const BetCard = ({ 
  bet, index, getGameIcon, getStatusBadge, getStatusColor, formatBetValue, onViewDetails
}: { 
  bet: GameBet; index: number;
  getGameIcon: (type: string) => string;
  getStatusBadge: (status: string, result: string | null) => JSX.Element;
  getStatusColor: (status: string, result: string | null) => string;
  formatBetValue: (type: string, value: string) => string;
  onViewDetails: (bet: GameBet) => void;
}) => (
  <motion.div initial={{ opacity: 0, x: -30, rotateY: -10 }} animate={{ opacity: 1, x: 0, rotateY: 0 }}
    transition={{ delay: index * 0.05, type: "spring", stiffness: 150 }} whileHover={{ scale: 1.01, x: 5 }} style={{ transformStyle: "preserve-3d" }}>
    <Premium3DCard className="p-5" glowColor={bet.result === "win" || bet.status === "won" ? "rgba(16,185,129,0.2)" : "rgba(20,184,166,0.15)"}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.15, rotate: 15 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/30 to-cyan-500/30 flex items-center justify-center text-2xl border border-white/10"
            style={{ boxShadow: "0 8px 25px rgba(20,184,166,0.2)" }}>{getGameIcon(bet.game_type)}</motion.div>
          <div>
            <p className="text-white font-bold text-lg">{bet.game_type}</p>
            <p className="text-white/40 text-xs font-medium">{bet.game_mode}</p>
          </div>
        </div>
        {getStatusBadge(bet.status, bet.result)}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "Bet", value: formatBetValue(bet.bet_type, bet.bet_value), color: "text-white" },
          { label: "Amount", value: `৳${bet.bet_amount.toFixed(2)}`, color: "text-amber-400" },
          { label: "Multiplier", value: `${bet.multiplier}x`, color: "text-cyan-400" },
          { label: "Payout", value: bet.result === "win" || bet.status === "won" ? `+৳${(bet.payout || 0).toFixed(2)}` : bet.result === "lose" || bet.status === "lost" ? `-৳${bet.bet_amount.toFixed(2)}` : `৳${bet.potential_win.toFixed(2)}`, color: getStatusColor(bet.status, bet.result) },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.03 + i * 0.05 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10" whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <p className="text-white/40 text-xs font-medium mb-1">{item.label}</p>
            <p className={`font-bold text-sm ${item.color}`}>{item.value}</p>
          </motion.div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-white/40 pt-3 border-t border-white/5">
        <div className="flex items-center gap-2"><Clock className="w-3 h-3" /><span>{format(new Date(bet.created_at), "dd MMM yyyy, HH:mm")}</span></div>
        <div className="flex items-center gap-2">
          <button onClick={() => onViewDetails(bet)} className="px-3 py-1.5 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-colors font-medium text-xs">Details</button>
          <span className="font-mono bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">#{bet.trade_id.slice(-8)}</span>
        </div>
      </div>
    </Premium3DCard>
  </motion.div>
);

interface GameBet {
  id: string; game_type: string; game_mode: string; bet_type: string; bet_value: string;
  bet_amount: number; multiplier: number; potential_win: number; payout: number | null;
  status: string; result: string | null; trade_id: string; created_at: string; settled_at: string | null;
}

const GameHistory = () => {
  const navigate = useNavigate();
  const [bets, setBets] = useState<GameBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [stats, setStats] = useState({ totalBets: 0, totalWon: 0, totalLost: 0, netProfit: 0 });
  const [selectedBet, setSelectedBet] = useState<GameBet | null>(null);
  const [showBetDetails, setShowBetDetails] = useState(false);
  
  const handleViewDetails = (bet: GameBet) => { setSelectedBet(bet); setShowBetDetails(true); };
  
  const convertToBetDetails = (bet: GameBet): BetDetails => {
    const isWin = bet.result === 'win' || bet.status === 'won';
    const isLose = bet.result === 'lose' || bet.status === 'lost';
    let duration = 1;
    if (bet.game_mode.includes('1min') || bet.game_mode.includes('1 min')) duration = 1;
    else if (bet.game_mode.includes('3min') || bet.game_mode.includes('3 min')) duration = 3;
    else if (bet.game_mode.includes('5min') || bet.game_mode.includes('5 min')) duration = 5;
    else if (bet.game_mode.includes('10min') || bet.game_mode.includes('10 min')) duration = 10;
    return {
      period: bet.trade_id, betType: `${bet.bet_type}: ${bet.bet_value}`, betAmount: bet.bet_amount,
      multiplier: bet.multiplier, potentialWin: bet.potential_win,
      result: isWin || isLose ? (isWin ? 1 : 0) : null, isWin: isWin ? true : isLose ? false : null,
      payout: bet.payout || 0, timestamp: new Date(bet.created_at), duration, roundKey: bet.trade_id,
    };
  };

  useEffect(() => { fetchBetHistory(); }, []);
  useEffect(() => { calculateStats(); }, [bets, activeTab]);

  const fetchBetHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("game_bets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      setBets(data || []);
    } catch (error) { console.error("Error fetching bet history:", error); }
    finally { setIsLoading(false); }
  };

  const calculateStats = () => {
    const filteredBets = activeTab === "all" ? bets : bets.filter(b => b.game_type.toLowerCase().replace(/\s+/g, '') === activeTab);
    const wonBets = filteredBets.filter(b => b.result === "win" || b.status === "won");
    const lostBets = filteredBets.filter(b => b.result === "lose" || b.status === "lost");
    const totalWon = wonBets.reduce((sum, b) => sum + (b.payout || 0), 0);
    const totalLost = lostBets.reduce((sum, b) => sum + b.bet_amount, 0);
    setStats({ totalBets: filteredBets.length, totalWon, totalLost, netProfit: totalWon - totalLost });
  };

  const getFilteredBets = () => activeTab === "all" ? bets : bets.filter(b => b.game_type.toLowerCase().replace(/\s+/g, '') === activeTab);

  const getGameIcon = (gameType: string) => {
    const type = gameType.toLowerCase();
    if (type.includes("wingo") || type.includes("win go")) return "🎯";
    if (type.includes("k3")) return "🎲";
    if (type.includes("5d") || type.includes("fived")) return "🎰";
    if (type.includes("trx")) return "💎";
    if (type.includes("crash")) return "🚀";
    if (type.includes("mines")) return "💣";
    return "🎮";
  };

  const getStatusColor = (status: string, result: string | null) => {
    if (result === "win" || status === "won") return "text-emerald-400";
    if (result === "lose" || status === "lost") return "text-red-400";
    if (status === "pending") return "text-amber-400";
    return "text-gray-400";
  };

  const getStatusBadge = (status: string, result: string | null) => {
    if (result === "win" || status === "won") return (
      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200 }}>
        <Badge className="bg-gradient-to-r from-emerald-500/30 to-green-500/30 text-emerald-400 border-emerald-500/50 backdrop-blur-sm px-3 py-1.5 rounded-xl">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}><Trophy className="w-3.5 h-3.5 mr-1.5" /></motion.div>
          Won
        </Badge>
      </motion.div>
    );
    if (result === "lose" || status === "lost") return (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
        <Badge className="bg-gradient-to-r from-red-500/30 to-rose-500/30 text-red-400 border-red-500/50 backdrop-blur-sm px-3 py-1.5 rounded-xl">Lost</Badge>
      </motion.div>
    );
    if (status === "pending") return (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
        <Badge className="bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-400 border-amber-500/50 backdrop-blur-sm px-3 py-1.5 rounded-xl">
          <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>Pending</motion.span>
        </Badge>
      </motion.div>
    );
    return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 rounded-xl">{status}</Badge>;
  };

  const formatBetValue = (betType: string, betValue: string) => {
    if (betType === "number") return `Number: ${betValue}`;
    if (betType === "color") return `Color: ${betValue}`;
    if (betType === "size") return `Size: ${betValue}`;
    return `${betType}: ${betValue}`;
  };

  const gameFilters = [
    { value: "all", label: "All", icon: "📊" },
    { value: "wingo", label: "WinGo", icon: "🎯" },
    { value: "k3", label: "K3", icon: "🎲" },
    { value: "5d", label: "5D", icon: "🎰" },
    { value: "trxwin", label: "TRX", icon: "💎" },
    { value: "crash", label: "Crash", icon: "🚀" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 20% 20%, rgba(20,184,166,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(6,182,212,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.05) 0%, transparent 50%)` }} />
      </div>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (<FloatingParticle key={i} delay={i * 0.5} size={Math.random() * 10 + 6} left={`${Math.random() * 100}%`} duration={Math.random() * 6 + 10} />))}
      </div>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (<FloatingSparkle key={i} delay={i * 0.8} x={`${10 + Math.random() * 80}%`} y={`${10 + Math.random() * 80}%`} />))}
      </div>
      <GlowingOrb className="w-[500px] h-[500px] -top-64 -right-64" color="radial-gradient(circle, rgba(20,184,166,0.4) 0%, transparent 70%)" />
      <GlowingOrb className="w-80 h-80 top-1/3 -left-40" color="radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)" />
      <GlowingOrb className="w-96 h-96 bottom-10 right-0" color="radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)" />

      <div className="relative pt-6 pb-6 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-600/20 via-teal-600/10 to-transparent" />
        {[...Array(6)].map((_, i) => (
          <motion.div key={i} className="absolute" style={{ top: `${20 + Math.random() * 60}%`, left: `${10 + Math.random() * 80}%` }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }} transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}>
            <Star className="w-3 h-3 text-yellow-300/60" />
          </motion.div>
        ))}
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, type: "spring" }} className="relative z-10 flex items-center gap-4">
          <motion.button whileHover={{ scale: 1.1, rotate: -5 }} whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all backdrop-blur-sm" style={{ boxShadow: "0 8px 25px rgba(0,0,0,0.2)" }}>
            <ArrowLeft size={22} />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <motion.div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center"
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }} style={{ boxShadow: "0 8px 25px rgba(20,184,166,0.4)" }}>
                <History size={20} className="text-white" />
              </motion.div>
              Game History
            </h1>
            <p className="text-white/50 text-sm mt-1">View your betting records</p>
          </div>
          <motion.div animate={{ y: [-3, 3, -3], rotate: [0, 360] }} transition={{ y: { duration: 2, repeat: Infinity }, rotate: { duration: 8, repeat: Infinity, ease: "linear" } }}>
            <Sparkles size={24} className="text-cyan-400" />
          </motion.div>
        </motion.div>
      </div>

      <div className="px-4 py-4 relative z-10">
        <div className="grid grid-cols-2 gap-4 mb-5">
          <StatCard3D icon={Gamepad2} label="Total Bets" value={stats.totalBets.toString()} color="bg-gradient-to-br from-teal-500 to-cyan-600" delay={0.1} />
          <StatCard3D icon={stats.netProfit >= 0 ? TrendingUp : TrendingDown} label="Net Profit" value={`${stats.netProfit >= 0 ? "+" : ""}৳${stats.netProfit.toFixed(2)}`}
            color={stats.netProfit >= 0 ? "bg-gradient-to-br from-emerald-500 to-green-600" : "bg-gradient-to-br from-red-500 to-rose-600"} delay={0.2} />
          <StatCard3D icon={Trophy} label="Total Won" value={`৳${stats.totalWon.toFixed(2)}`} color="bg-gradient-to-br from-emerald-500 to-teal-600" delay={0.3} />
          <StatCard3D icon={Target} label="Total Lost" value={`৳${stats.totalLost.toFixed(2)}`} color="bg-gradient-to-br from-red-500 to-pink-600" delay={0.4} />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Premium3DCard className="p-2 mb-5" delay={0.5}>
              <TabsList className="w-full bg-transparent grid grid-cols-6 gap-1">
                {gameFilters.map((filter) => (
                  <TabsTrigger key={filter.value} value={filter.value}
                    className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-teal-500/30 text-xs py-3 rounded-xl transition-all data-[state=inactive]:text-white/60">
                    <span className="mr-1">{filter.icon}</span><span className="hidden sm:inline">{filter.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Premium3DCard>
          </motion.div>
          <TabsContent value={activeTab} className="mt-4">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-16 h-16 rounded-full border-4 border-teal-500/30 border-t-teal-500" />
                  <p className="text-white/50 mt-4 font-medium">Loading history...</p>
                </motion.div>
              ) : getFilteredBets().length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20">
                  <motion.div animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}
                    className="w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mb-5 border border-white/10" style={{ boxShadow: "0 15px 40px rgba(20,184,166,0.2)" }}>
                    <History className="w-12 h-12 text-teal-400/50" />
                  </motion.div>
                  <p className="text-xl font-bold text-white">No bet history</p>
                  <p className="text-white/50 mt-2">Start playing to see your history here!</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {getFilteredBets().map((bet, index) => (
                    <BetCard key={bet.id} bet={bet} index={index} getGameIcon={getGameIcon} getStatusBadge={getStatusBadge}
                      getStatusColor={getStatusColor} formatBetValue={formatBetValue} onViewDetails={handleViewDetails} />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
      {selectedBet && (
        <BetDetailsModal open={showBetDetails} onOpenChange={setShowBetDetails} bet={convertToBetDetails(selectedBet)} gameType={selectedBet.game_type} />
      )}
    </div>
  );
};

export default GameHistory;
