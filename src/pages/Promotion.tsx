import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Copy, Check, ChevronRight, Users, Coins, FileText,
  HelpCircle, Headphones, Percent, TrendingUp, UserPlus,
  Link2, BarChart3, Award, Gift, Crown, Loader2, Share2,
  QrCode, MessageCircle, Send, Sparkles, Zap, Star, Trophy,
  ArrowUp, Target, Rocket, Flame, PartyPopper, Medal, Gem
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays, startOfWeek } from "date-fns";
import RebateRatioModal from "@/components/RebateRatioModal";
import SubordinateDataModal from "@/components/SubordinateDataModal";
import CommissionDetailsModal from "@/components/CommissionDetailsModal";
import InvitationRulesModal from "@/components/InvitationRulesModal";
import ReferralShareCard from "@/components/ReferralShareCard";
import AgentHighlightBanner from "@/components/AgentHighlightBanner";
import promoHeroImg from "@/assets/promotion/promo-3d-hero.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Enhanced floating particle with glow
const FloatingParticle = (_props: any) => null; // Removed for performance (Final Polish Phase 2)

// Floating sparkle effect
const FloatingSparkle = ({ delay, x, y }: { delay: number; x: string; y: string }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: x, top: y }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0, 1, 0],
      scale: [0.5, 1.2, 0.5],
      rotate: [0, 180, 360]
    }}
    transition={{ 
      duration: 3, 
      delay, 
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <Sparkles size={14} className="text-cyan-400" />
  </motion.div>
);

// Enhanced glowing orb with pulse animation
const GlowingOrb = ({ className, color }: { className?: string; color?: string }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
    style={{ background: color }}
    animate={{
      scale: [1, 1.3, 1],
      opacity: [0.3, 0.6, 0.3],
    }}
    transition={{
      duration: 5,
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
    {/* Glass reflection */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl" />
    
    {/* Top highlight */}
    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    
    {/* Animated border glow */}
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

// Animated 3D stat card with enhanced effects
const StatCard3D = ({ 
  value, 
  label, 
  color, 
  index,
  icon: Icon,
  prefix = ""
}: { 
  value: string | number; 
  label: string; 
  color: string;
  index: number;
  icon?: any;
  prefix?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
    whileHover={{ scale: 1.05, y: -5 }}
    className="relative text-center p-4 bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
    style={{
      boxShadow: "0 8px 25px rgba(0,0,0,0.2)"
    }}
  >
    {Icon && (
      <motion.div
        className="absolute top-2 right-2 opacity-20"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <Icon size={24} className={color} />
      </motion.div>
    )}
    <motion.p 
      className={`text-2xl font-bold ${color}`}
      animate={{ scale: [1, 1.03, 1] }}
      transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
    >
      {prefix}{value}
    </motion.p>
    <p className="text-white/50 text-xs mt-1 font-medium">{label}</p>
  </motion.div>
);

// Enhanced animated menu item with 3D effect
const MenuItem3D = ({ 
  item, 
  index 
}: { 
  item: MenuItemType; 
  index: number;
}) => (
  <motion.button
    initial={{ opacity: 0, x: -30 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.05 * index, type: "spring", stiffness: 200 }}
    onClick={item.onClick}
    className="w-full flex items-center gap-4 p-5 hover:bg-white/5 transition-all group border-b border-white/5 last:border-0"
    whileHover={{ x: 8, backgroundColor: "rgba(255,255,255,0.08)" }}
    whileTap={{ scale: 0.98 }}
  >
    <motion.div
      whileHover={{ scale: 1.15, rotate: 10 }}
      transition={{ type: "spring", stiffness: 400 }}
      style={{
        boxShadow: "0 8px 20px rgba(0,0,0,0.3)"
      }}
    >
      {item.icon}
    </motion.div>
    <span className="flex-1 text-left text-white font-semibold text-sm">{item.title}</span>
    {item.value && (
      <motion.span 
        className="text-gray-400 text-sm font-mono bg-white/5 px-3 py-1 rounded-lg"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {item.value}
      </motion.span>
    )}
    {item.hasArrow ? (
      <motion.div
        animate={{ x: [0, 5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <ChevronRight size={20} className="text-gray-500" />
      </motion.div>
    ) : (
      <motion.button 
        onClick={(e) => {
          e.stopPropagation();
          item.onClick?.();
        }}
        className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
      >
        {item.copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-gray-400" />}
      </motion.button>
    )}
  </motion.button>
);

// Enhanced level tier card with 3D effect
const LevelTierCard3D = ({ 
  tier, 
  index 
}: { 
  tier: { level: string; rate: string; color: string; icon: string; earned: number; referrals: number };
  index: number;
}) => (
  <motion.div 
    initial={{ opacity: 0, x: -30, rotateY: -15 }}
    animate={{ opacity: 1, x: 0, rotateY: 0 }}
    transition={{ delay: 0.15 * index, type: "spring", stiffness: 150 }}
    whileHover={{ scale: 1.02, x: 5 }}
    className="relative overflow-hidden"
    style={{ transformStyle: "preserve-3d" }}
  >
    <Premium3DCard className="p-5" glowColor={tier.color.includes("amber") ? "rgba(245,158,11,0.2)" : "rgba(20,184,166,0.2)"}>
      <div className="flex items-center gap-4">
        <motion.div 
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-3xl`}
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 4, repeat: Infinity, delay: index * 0.3 }}
          style={{
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
          }}
        >
          {tier.icon}
        </motion.div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-white">{tier.level}</p>
            <motion.span 
              className="text-xs bg-teal-500/20 text-teal-400 px-3 py-1 rounded-full border border-teal-500/30 font-bold"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {tier.rate}
            </motion.span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={12} className="text-gray-500" />
            <p className="text-gray-400 text-xs">{tier.referrals} subordinates</p>
          </div>
        </div>
        <div className="text-right">
          <motion.p 
            className="font-bold text-emerald-400 text-lg"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
          >
            ৳{tier.earned.toFixed(2)}
          </motion.p>
          <p className="text-gray-500 text-[10px]">earned</p>
        </div>
      </div>
    </Premium3DCard>
  </motion.div>
);

// Animated counter component
const AnimatedCounter = ({ value, prefix = "৳", className = "" }: { value: number; prefix?: string; className?: string }) => (
  <motion.span
    className={className}
    animate={{ scale: [1, 1.02, 1] }}
    transition={{ duration: 2, repeat: Infinity }}
  >
    {prefix}{value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
  </motion.span>
);

interface MenuItemType {
  id: string;
  icon: React.ReactNode;
  title: string;
  value?: string;
  hasArrow: boolean;
  onClick?: () => void;
  copied?: boolean;
}

interface SubordinateStats {
  registerCount: number;
  depositCount: number;
  depositAmount: number;
  firstDepositCount: number;
}

interface ReferredUser {
  id: string;
  user_id: string;
  created_at: string;
  level?: number;
  wallet?: {
    total_deposit: number;
    total_bet: number;
  } | null;
}

interface LevelStats {
  level: number;
  total_referrals: number;
  deposited_count: number;
  total_deposit: number;
  total_bet: number;
  total_commission: number;
}

const Promotion = () => {
  const navigate = useNavigate();
  const [referralCode, setReferralCode] = useState<string>("");
  const [displayReferralId, setDisplayReferralId] = useState<string>("");
  const [profileId, setProfileId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"level1" | "level2" | "level3">("level1");
  const [isLoading, setIsLoading] = useState(true);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [levelStats, setLevelStats] = useState<LevelStats[]>([]);
  const [totalCommissionEarned, setTotalCommissionEarned] = useState(0);
  const [thisWeekCommission, setThisWeekCommission] = useState(0);
  const [yesterdayCommission, setYesterdayCommission] = useState(0);
  const [level1Commission, setLevel1Commission] = useState(0);
  const [level2Commission, setLevel2Commission] = useState(0);
  const [level3Commission, setLevel3Commission] = useState(0);
  const [showRebateModal, setShowRebateModal] = useState(false);
  const [showSubordinateModal, setShowSubordinateModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    loadUserData();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel(`referral_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'wallet_transactions',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newTx = payload.new as { type: string; amount: number };
            if (newTx.type === 'referral') {
              setTotalCommissionEarned(prev => prev + newTx.amount);
              setThisWeekCommission(prev => prev + newTx.amount);
              toast.success(`🎉 New commission earned: ৳${newTx.amount.toFixed(2)}`);
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    setupRealtime();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, referral_code, display_referral_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setReferralCode(profile.referral_code || "");
        setDisplayReferralId(profile.display_referral_id || "");
        setProfileId(profile.id);

        const { data: stats, error: statsError } = await supabase
          .rpc('get_referral_stats', { p_user_id: user.id });

        if (stats && !statsError) {
          setLevelStats(stats as LevelStats[]);
          
          const level1Stats = stats.find((s: LevelStats) => s.level === 1);
          const level2Stats = stats.find((s: LevelStats) => s.level === 2);
          const level3Stats = stats.find((s: LevelStats) => s.level === 3);
          
          setLevel1Commission(Number(level1Stats?.total_commission || 0));
          setLevel2Commission(Number(level2Stats?.total_commission || 0));
          setLevel3Commission(Number(level3Stats?.total_commission || 0));
        }

        const { data: referred } = await supabase
          .from("profiles")
          .select("id, user_id, created_at")
          .eq("referred_by", profile.id);

        if (referred && referred.length > 0) {
          const userIds = referred.map(r => r.user_id);
          const { data: wallets } = await supabase
            .from("wallets")
            .select("user_id, total_deposit, total_bet")
            .in("user_id", userIds);

          const referredWithWallets = referred.map(r => ({
            ...r,
            level: 1,
            wallet: wallets?.find(w => w.user_id === r.user_id) || null
          }));

          setReferredUsers(referredWithWallets);
        }

        const { data: referralTransactions } = await supabase
          .from("wallet_transactions")
          .select("amount, created_at")
          .eq("user_id", user.id)
          .eq("type", "referral");

        if (referralTransactions) {
          const total = referralTransactions.reduce((sum, t) => sum + t.amount, 0);
          setTotalCommissionEarned(total);

          const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
          const weekCommission = referralTransactions
            .filter(t => new Date(t.created_at) >= weekStart)
            .reduce((sum, t) => sum + t.amount, 0);
          setThisWeekCommission(weekCommission);

          const yesterday = startOfDay(subDays(new Date(), 1));
          const today = startOfDay(new Date());
          const ydayCommission = referralTransactions
            .filter(t => {
              const date = new Date(t.created_at);
              return date >= yesterday && date < today;
            })
            .reduce((sum, t) => sum + t.amount, 0);
          setYesterdayCommission(ydayCommission);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLevelStats = () => {
    const levelNum = parseInt(activeSubTab.replace('level', ''));
    const stats = levelStats.find(s => s.level === levelNum);
    return {
      registerCount: Number(stats?.total_referrals || 0),
      depositCount: Number(stats?.deposited_count || 0),
      depositAmount: Number(stats?.total_deposit || 0),
      totalBet: Number(stats?.total_bet || 0),
      commission: Number(stats?.total_commission || 0),
    };
  };

  const teamTotals = useMemo(() => {
    return {
      totalReferrals: levelStats.reduce((sum, s) => sum + Number(s.total_referrals), 0),
      totalDeposited: levelStats.reduce((sum, s) => sum + Number(s.deposited_count), 0),
      totalDeposit: levelStats.reduce((sum, s) => sum + Number(s.total_deposit), 0),
      totalBet: levelStats.reduce((sum, s) => sum + Number(s.total_bet), 0),
      totalCommission: levelStats.reduce((sum, s) => sum + Number(s.total_commission), 0),
    };
  }, [levelStats]);

  const directStats = useMemo<SubordinateStats>(() => {
    const registerCount = referredUsers.length;
    const usersWithDeposit = referredUsers.filter(u => u.wallet && u.wallet.total_deposit > 0);
    const depositCount = usersWithDeposit.length;
    const depositAmount = referredUsers.reduce((sum, u) => sum + (u.wallet?.total_deposit || 0), 0);
    const firstDepositCount = usersWithDeposit.length;

    return {
      registerCount,
      depositCount,
      depositAmount,
      firstDepositCount,
    };
  }, [referredUsers]);

  const handleCopyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success("✨ Invitation code copied!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Please login to get your invitation code");
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success("✨ Invitation link copied!");
  };

  const currentLevelStats = getCurrentLevelStats();

  const menuItems: MenuItemType[] = [
    {
      id: "referralId",
      icon: <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30"><Users className="text-white" size={20} /></div>,
      title: "Your Referral ID",
      value: displayReferralId || "Login Required",
      hasArrow: false,
      onClick: () => {
        if (displayReferralId) {
          navigator.clipboard.writeText(displayReferralId);
          toast.success("✨ Referral ID copied!");
        }
      },
    },
    {
      id: "copy",
      icon: <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30"><Copy className="text-white" size={20} /></div>,
      title: "Copy invitation code",
      value: referralCode || "Login Required",
      hasArrow: false,
      onClick: handleCopyCode,
      copied,
    },
    {
      id: "subordinate",
      icon: <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30"><Users className="text-white" size={20} /></div>,
      title: "Subordinate data",
      hasArrow: true,
      onClick: () => setShowSubordinateModal(true),
    },
    {
      id: "commission",
      icon: <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"><Coins className="text-white" size={20} /></div>,
      title: "Commission detail",
      hasArrow: true,
      onClick: () => setShowCommissionModal(true),
    },
    {
      id: "rules",
      icon: <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30"><FileText className="text-white" size={20} /></div>,
      title: "Invitation rules",
      hasArrow: true,
      onClick: () => setShowRulesModal(true),
    },
    {
      id: "support",
      icon: <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/40 ring-2 ring-amber-300/30"><Headphones className="text-amber-950" size={20} /></div>,
      title: "Agent line customer service",
      hasArrow: true,
      onClick: () => navigate("/support?type=agent"),
    },
    {
      id: "rebate",
      icon: <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30"><Percent className="text-white" size={20} /></div>,
      title: "Rebate ratio",
      hasArrow: true,
      onClick: () => setShowRebateModal(true),
    },
  ];

  const levelTabs = [
    { id: "level1", label: "Level 1", rate: "0.6%" },
    { id: "level2", label: "Level 2", rate: "0.18%" },
    { id: "level3", label: "Level 3", rate: "0.054%" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-24 overflow-hidden force-click page-content" style={{ pointerEvents: "auto", position: "relative", zIndex: 1 }}>
      {/* Animated mesh gradient background - decorative layer */}
      <div className="fixed inset-0 decorative" style={{ pointerEvents: "none", zIndex: 0 }}>
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse at 20% 0%, rgba(20,184,166,0.2) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 100%, rgba(6,182,212,0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(16,185,129,0.1) 0%, transparent 50%)
          `
        }} />
      </div>

      {/* Enhanced background effects - decorative layer */}
      <div className="fixed inset-0 decorative" style={{ pointerEvents: "none", zIndex: 0 }}>
        <GlowingOrb className="w-[500px] h-[500px] -top-64 -left-64" color="radial-gradient(circle, rgba(20,184,166,0.4) 0%, transparent 70%)" />
        <GlowingOrb className="w-96 h-96 top-1/4 -right-48" color="radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)" />
        <GlowingOrb className="w-80 h-80 bottom-1/3 left-1/4" color="radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)" />
        
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <FloatingParticle 
            key={i} 
            delay={i * 0.5} 
            duration={10 + Math.random() * 5}
            x={Math.random() * 100}
            size={4 + Math.random() * 4}
          />
        ))}

        {/* Floating sparkles */}
        {[...Array(8)].map((_, i) => (
          <FloatingSparkle
            key={i}
            delay={i * 0.7}
            x={`${10 + Math.random() * 80}%`}
            y={`${10 + Math.random() * 80}%`}
          />
        ))}

        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(20,184,166,0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(20,184,166,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Premium Hero Header with 3D Image */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/30 via-cyan-500/20 to-emerald-500/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950" />
        
        <div className="relative px-4 pt-8 pb-4">
          {/* Hero Banner */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500/30 via-cyan-500/20 to-emerald-500/30 border border-teal-500/30 p-5 mb-6"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            
            <div className="flex items-center gap-4">
              <motion.img 
                src={promoHeroImg} 
                alt="Promotion" 
                className="w-24 h-24 object-contain drop-shadow-2xl"
                animate={{ y: [-5, 5, -5], scale: [1, 1.02, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="text-cyan-400" size={18} />
                  <span className="text-cyan-200 text-xs font-bold uppercase tracking-wider">Referral Program</span>
                </div>
                <h1 className="text-white text-xl font-bold mb-1">এজেন্সি সেন্টার</h1>
                <p className="text-teal-200/70 text-xs">বন্ধুদের আমন্ত্রণ করুন এবং কমিশন উপার্জন করুন!</p>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="bg-black/30 rounded-xl p-2 text-center">
                <p className="text-emerald-400 font-bold text-lg">৳{totalCommissionEarned.toFixed(0)}</p>
                <p className="text-white/50 text-[10px]">মোট কমিশন</p>
              </div>
              <div className="bg-black/30 rounded-xl p-2 text-center">
                <p className="text-cyan-400 font-bold text-lg">{teamTotals.totalReferrals}</p>
                <p className="text-white/50 text-[10px]">টিম সদস্য</p>
              </div>
              <div className="bg-black/30 rounded-xl p-2 text-center">
                <p className="text-amber-400 font-bold text-lg">৳{yesterdayCommission.toFixed(0)}</p>
                <p className="text-white/50 text-[10px]">গতকালের আয়</p>
              </div>
            </div>
          </motion.div>

          {/* Invite Code Card - Enhanced */}
          <Premium3DCard className="p-5 mb-4" glowColor="rgba(20,184,166,0.3)">
            <div className="flex items-center gap-2 mb-3">
              <Medal className="text-amber-400" size={20} />
              <span className="text-white font-bold">আপনার ইনভাইট কোড</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-900/60 rounded-xl p-3 border border-teal-500/20">
                <p className="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400">
                  {referralCode || "লগইন করুন"}
                </p>
              </div>
              <motion.button
                onClick={handleCopyCode}
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {copied ? <Check className="text-white" size={22} /> : <Copy className="text-white" size={22} />}
              </motion.button>
            </div>
            
            {/* Share Buttons */}
            <div className="flex gap-2 mt-4">
              <motion.button
                onClick={handleCopyLink}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link2 size={16} />
                লিংক কপি
              </motion.button>
              <motion.button
                onClick={() => setShowShareModal(true)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Share2 size={16} />
                শেয়ার করুন
              </motion.button>
            </div>
          </Premium3DCard>

          {/* Commission Display - Compact */}
          <motion.div 
            className="text-center mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <motion.div
              className="inline-block relative"
              animate={{ y: [-2, 2, -2] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <motion.p 
                className="text-5xl font-black bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ৳{totalCommissionEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </motion.p>
              
              <motion.div
                className="absolute -top-2 -right-4"
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles size={18} className="text-yellow-400" />
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10"
              whileHover={{ scale: 1.05 }}
            >
              <Trophy className="text-amber-400" size={14} />
              <span className="text-white/80 text-xs font-medium">মোট কমিশন উপার্জন</span>
            </motion.div>
          </motion.div>

          {/* Level Tabs */}
          <Premium3DCard className="overflow-hidden" delay={0.1}>
            <div className="grid grid-cols-3 p-2">
              {levelTabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as "level1" | "level2" | "level3")}
                  className={`relative py-4 text-sm font-bold rounded-2xl transition-all ${
                    activeSubTab === tab.id
                      ? "text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {activeSubTab === tab.id && (
                    <motion.div
                      layoutId="activeLevelTab"
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: "linear-gradient(135deg, #14b8a6 0%, #06b6d4 50%, #10b981 100%)",
                        boxShadow: "0 8px 30px rgba(20,184,166,0.4)"
                      }}
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {activeSubTab === tab.id && <HolographicShine />}
                  <span className="relative z-10">
                    {tab.label} <span className="text-[10px] opacity-70">({tab.rate})</span>
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Stats Grid */}
            <div className="p-5 grid grid-cols-2 gap-4">
              <StatCard3D value={currentLevelStats.registerCount} label="Total Referrals" color="text-white" index={0} icon={Users} />
              <StatCard3D value={currentLevelStats.depositCount} label="Deposited" color="text-cyan-400" index={1} icon={Target} />
              <StatCard3D value={currentLevelStats.depositAmount.toLocaleString()} label="Total Deposit" color="text-emerald-400" index={2} icon={ArrowUp} prefix="৳" />
              <StatCard3D value={currentLevelStats.totalBet.toLocaleString()} label="Total Bet" color="text-amber-400" index={3} icon={Zap} prefix="৳" />
              
              <motion.div 
                className="col-span-2 bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-emerald-500/20 rounded-2xl p-5 border border-teal-500/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  boxShadow: "0 10px 40px rgba(20,184,166,0.2)"
                }}
              >
                <div className="text-center">
                  <motion.p 
                    className="text-yellow-400 text-3xl font-black"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ৳{currentLevelStats.commission.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </motion.p>
                  <p className="text-white/60 text-xs mt-2 font-medium">Commission Earned from this Level</p>
                </div>
              </motion.div>
            </div>
          </Premium3DCard>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative px-4 space-y-5 mt-4">
        {/* Invitation Link Button */}
        <motion.button
          onClick={handleCopyLink}
          className="relative w-full overflow-hidden rounded-3xl group"
          whileHover={{ scale: 1.02, y: -3 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"
          />
          <div 
            className="relative flex items-center justify-center gap-4 py-5 text-white font-black text-lg"
            style={{
              textShadow: "0 2px 10px rgba(0,0,0,0.3)"
            }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Link2 size={24} />
            </motion.div>
            INVITATION LINK
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Sparkles size={20} className="text-yellow-300" />
            </motion.div>
          </div>
          <HolographicShine />
        </motion.button>

        {/* Menu Items */}
        <Premium3DCard className="divide-y-0" delay={0.1}>
          {menuItems.map((item, index) => (
            <MenuItem3D key={item.id} item={item} index={index} />
          ))}
        </Premium3DCard>

        {/* Promotion Data */}
        <Premium3DCard className="p-5" delay={0.2} glowColor="rgba(245,158,11,0.2)">
          <div className="flex items-center gap-4 mb-5">
            <motion.div 
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{
                boxShadow: "0 10px 30px rgba(245,158,11,0.3)"
              }}
            >
              <BarChart3 className="text-white" size={22} />
            </motion.div>
            <span className="font-bold text-white text-lg">Promotion Data</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { value: thisWeekCommission.toLocaleString("en-IN", { minimumFractionDigits: 2 }), label: "This Week", color: "text-teal-400", icon: TrendingUp },
              { value: totalCommissionEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 }), label: "Total Commission", color: "text-cyan-400", icon: Coins },
              { value: directStats.registerCount, label: "Direct Subordinate", color: "text-white", icon: Users },
              { value: teamTotals.totalReferrals, label: "Total Team", color: "text-amber-400", icon: Trophy },
            ].map((stat, index) => (
              <motion.div 
                key={stat.label}
                className="text-center p-4 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <motion.div
                  className="absolute top-2 right-2 opacity-10"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <stat.icon size={28} className={stat.color} />
                </motion.div>
                <p className={`text-2xl font-bold ${stat.color}`}>৳{stat.value}</p>
                <p className="text-gray-500 text-xs mt-1 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </Premium3DCard>

        {/* Commission Tiers */}
        <Premium3DCard className="p-5" delay={0.3} glowColor="rgba(139,92,246,0.2)">
          <div className="flex items-center gap-4 mb-5">
            <motion.div 
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center"
              animate={{ 
                rotate: [0, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{
                boxShadow: "0 10px 30px rgba(139,92,246,0.3)"
              }}
            >
              <Crown className="text-white" size={22} />
            </motion.div>
            <span className="font-bold text-white text-lg">Commission by Level</span>
          </div>

          <div className="space-y-4">
            {[
              { level: "Level 1", rate: "0.6%", color: "from-amber-400 to-orange-500", icon: "🥇", earned: level1Commission, referrals: levelStats.find(s => s.level === 1)?.total_referrals || 0 },
              { level: "Level 2", rate: "0.18%", color: "from-gray-300 to-gray-500", icon: "🥈", earned: level2Commission, referrals: levelStats.find(s => s.level === 2)?.total_referrals || 0 },
              { level: "Level 3", rate: "0.054%", color: "from-yellow-500 to-amber-600", icon: "🥉", earned: level3Commission, referrals: levelStats.find(s => s.level === 3)?.total_referrals || 0 },
            ].map((tier, index) => (
              <LevelTierCard3D key={tier.level} tier={tier} index={index} />
            ))}
          </div>

          {/* Total Summary */}
          <motion.div 
            className="mt-5 p-5 bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-emerald-500/20 rounded-2xl border border-teal-500/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              boxShadow: "0 10px 40px rgba(20,184,166,0.2)"
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium">Total Team Commission</p>
                <motion.p 
                  className="text-3xl font-black text-teal-400"
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ৳{(level1Commission + level2Commission + level3Commission).toFixed(2)}
                </motion.p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs font-medium">Team Size</p>
                <p className="text-2xl font-bold text-white">{teamTotals.totalReferrals}</p>
              </div>
            </div>
          </motion.div>
        </Premium3DCard>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            onClick={() => setShowCommissionModal(true)}
            className="relative overflow-hidden group"
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Premium3DCard className="p-5">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center"
                  whileHover={{ rotate: 15 }}
                  style={{
                    boxShadow: "0 10px 30px rgba(20,184,166,0.4)"
                  }}
                >
                  <TrendingUp className="text-white" size={26} />
                </motion.div>
                <div className="text-left">
                  <p className="font-bold text-white">My Earnings</p>
                  <p className="text-teal-400 text-sm font-semibold">৳{totalCommissionEarned.toFixed(2)}</p>
                </div>
              </div>
            </Premium3DCard>
          </motion.button>
          
          <motion.button
            onClick={() => setShowShareModal(true)}
            className="relative overflow-hidden group"
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Premium3DCard className="p-5" glowColor="rgba(139,92,246,0.3)">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center"
                  whileHover={{ rotate: -15 }}
                  style={{
                    boxShadow: "0 10px 30px rgba(139,92,246,0.4)"
                  }}
                >
                  <Share2 className="text-white" size={26} />
                </motion.div>
                <div className="text-left">
                  <p className="font-bold text-white">Share Now</p>
                  <p className="text-violet-400 text-sm font-semibold">Earn ৳50/invite</p>
                </div>
              </div>
            </Premium3DCard>
          </motion.button>
        </div>
      </div>

      {/* Bottom Padding */}
      <div className="h-24" />

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2 text-white text-xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Share2 className="w-6 h-6 text-teal-400" />
              </motion.div>
              Share & Earn
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <ReferralShareCard
              referralCode={referralCode}
              referralLink={`${window.location.origin}/register?ref=${referralCode}`}
              totalEarned={totalCommissionEarned}
              teamSize={directStats.registerCount}
            />

            <div className="border-t border-white/10 pt-4">
              <p className="text-xs text-gray-500 text-center mb-3 font-medium">Quick Share</p>
              <div className="grid grid-cols-4 gap-3">
                <motion.button
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`🍀 Join GoLucky & Win Big!\n\n🎁 Get ৳125 bonus on signup!\n💰 Use my code: ${referralCode}\n\n👉 Register now: ${window.location.origin}/register?ref=${referralCode}`)}`, '_blank')}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                  whileHover={{ scale: 1.08, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <MessageCircle className="text-white" size={22} />
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">WhatsApp</span>
                </motion.button>
                
                <motion.button
                  onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/register?ref=${referralCode}`)}&text=${encodeURIComponent(`🍀 Join GoLucky & Win Big!\n\n🎁 Get ৳125 bonus on signup!\n💰 Use my code: ${referralCode}`)}`, '_blank')}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                  whileHover={{ scale: 1.08, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Send className="text-white" size={22} />
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">Telegram</span>
                </motion.button>
                
                <motion.button
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/register?ref=${referralCode}`)}`, '_blank')}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                  whileHover={{ scale: 1.08, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">f</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">Facebook</span>
                </motion.button>
                
                <motion.button
                  onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🍀 Join GoLucky & Win Big!\n\n🎁 Get ৳125 bonus on signup!\n💰 Use my code: ${referralCode}\n\n👉`)}&url=${encodeURIComponent(`${window.location.origin}/register?ref=${referralCode}`)}`, '_blank')}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                  whileHover={{ scale: 1.08, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">𝕏</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">Twitter</span>
                </motion.button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl p-5 border border-teal-500/20">
              <p className="text-xs text-gray-500 mb-3 font-medium">Your Invite Link</p>
              <div className="flex items-center gap-2 bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="flex-1 text-xs text-gray-400 truncate font-mono">
                  {`${window.location.origin}/register?ref=${referralCode}`}
                </span>
                <motion.button
                  onClick={handleCopyLink}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </motion.button>
              </div>
            </div>

            <motion.div 
              className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl p-5 border border-amber-500/20"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(245,158,11,0.1)",
                  "0 0 40px rgba(245,158,11,0.2)",
                  "0 0 20px rgba(245,158,11,0.1)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0"
                  animate={{ 
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{
                    boxShadow: "0 10px 30px rgba(245,158,11,0.3)"
                  }}
                >
                  <Gift className="text-white" size={28} />
                </motion.div>
                <div>
                  <p className="font-bold text-white text-lg">Earn ৳50 per Invite!</p>
                  <p className="text-sm text-gray-400">Your friend also gets ৳25 extra bonus</p>
                  <p className="text-xs text-amber-400 mt-1 font-semibold">+ Commission on every bet they place!</p>
                </div>
              </div>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agent Recruit Banner */}
      <div className="px-4 pb-4">
        <AgentHighlightBanner variant="compact" />
      </div>

      {/* Modals */}
      <RebateRatioModal open={showRebateModal} onOpenChange={setShowRebateModal} />
      <SubordinateDataModal open={showSubordinateModal} onOpenChange={setShowSubordinateModal} subordinates={referredUsers} />
      <CommissionDetailsModal open={showCommissionModal} onOpenChange={setShowCommissionModal} totalCommission={totalCommissionEarned} subordinatesCount={directStats.registerCount} totalBet={referredUsers.reduce((sum, u) => sum + (u.wallet?.total_bet || 0), 0)} />
      <InvitationRulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} onViewRebateRatio={() => { setShowRulesModal(false); setShowRebateModal(true); }} />
    </div>
  );
};

export default Promotion;
