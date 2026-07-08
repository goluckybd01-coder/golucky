import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useWalletDB } from "@/hooks/useWalletDB";
import { ArrowUpRight, ArrowDownRight, RefreshCw, Loader2, X, Copy, Check, AlertCircle, ChevronLeft, Wallet as WalletIcon, History, FileText, ArrowLeftRight, RotateCcw, Gift, Trophy, Gamepad2, Star, Send, Eye, EyeOff, Sparkles, TrendingUp, Shield, Zap, Crown, BadgeDollarSign, Coins, CreditCard, ArrowRight, Diamond, Gem, Flame, Target, Clock, Award, Bell, CircleDollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import TransactionDetailsModal from "@/components/TransactionDetailsModal";
import TransactionRequestForm from "@/components/TransactionRequestForm";
import AgentHighlightBanner from "@/components/AgentHighlightBanner";
import AgentTransferModal from "@/components/wallet/AgentTransferModal";
import { motion, AnimatePresence } from "framer-motion";

// Import payment logos
import bkashLogo from "@/assets/payment/bkash-logo.png";
import nagadLogo from "@/assets/payment/nagad-logo.png";
import walletHeroImg from "@/assets/wallet/wallet-3d-hero.png";

// ============= CONSTANTS =============
const PAYMENT_METHODS = [
  { id: "nagad", name: "Nagad", icon: "🟧", color: "bg-orange-500" },
  { id: "bkash", name: "bKash", icon: "🩷", color: "bg-pink-500" },
];

const QUICK_AMOUNTS = [100, 200, 500, 1000, 5000, 50000];

const PAYMENT_CHANNELS: Record<string, Array<{ id: string; name: string; min: number; max: number }>> = {
  nagad: [
    { id: "payfastflow-nagad", name: "PayFastFlow-Nagad", min: 100, max: 50000 },
  ],
  bkash: [
    { id: "payfastflow-bkash", name: "PayFastFlow-bKash", min: 100, max: 50000 },
  ],
};

const WITHDRAWAL_CHANNELS: Record<string, Array<{ id: string; name: string; min: number; max: number }>> = {
  nagad: [
    { id: "payfastflow-nagad-w", name: "PayFastFlow-Nagad", min: 500, max: 50000 },
  ],
  bkash: [
    { id: "payfastflow-bkash-w", name: "PayFastFlow-bKash", min: 500, max: 50000 },
  ],
};

const GAME_PROVIDERS = [
  { id: "lottery", name: "Lottery", active: true },
  { id: "tb_chess", name: "TB_Chess", active: false },
  { id: "wickets9", name: "Wickets9", active: false },
  { id: "cq9", name: "CQ9", active: false },
  { id: "mg", name: "MG", active: false },
  { id: "jdb", name: "JDB", active: false },
  { id: "dg", name: "DG", active: false },
  { id: "cmd", name: "CMD", active: false },
  { id: "saba", name: "SaBa", active: false },
  { id: "evo_video", name: "EVO_Video", active: false },
  { id: "jili", name: "JILI", active: false },
  { id: "card365", name: "Card365", active: false },
  { id: "v8card", name: "V8Card", active: false },
  { id: "ag_video", name: "AG_Video", active: false },
  { id: "pg", name: "PG", active: false },
  { id: "tb", name: "TB", active: false },
  { id: "sexy_video", name: "SEXY_Video", active: false },
];

interface ProviderWallet {
  id: string;
  provider_id: string;
  provider_name: string;
  balance: number;
  is_active: boolean;
  last_synced_at: string | null;
}

// ============= OPTIMIZED LIGHTWEIGHT COMPONENTS =============

// Lightweight Glassmorphic Card - reduced animations for fast loading
const PremiumGlassCard = ({ 
  children, 
  className = "", 
  gradient = "from-cyan-500/10 via-emerald-500/5 to-teal-500/10",
  glowColor = "rgba(6,182,212,0.15)",
  delay = 0 
}: { 
  children: React.ReactNode; 
  className?: string; 
  gradient?: string;
  glowColor?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.5, duration: 0.3 }}
    className={`relative rounded-3xl overflow-hidden ${className}`}
  >
    {/* Static glow - no animation */}
    <div 
      className="absolute -inset-1 rounded-3xl opacity-50 pointer-events-none blur-xl"
      style={{ background: `radial-gradient(ellipse at center, ${glowColor}, transparent 70%)` }}
    />
    
    {/* Glassmorphic container */}
    <div 
      className={`relative backdrop-blur-xl bg-gradient-to-br ${gradient} border border-white/[0.12] rounded-3xl`}
      style={{
        boxShadow: `0 20px 40px -15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
      }}
    >
      {/* Top edge highlight */}
      <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      {/* Corner accents - static */}
      <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-cyan-500/20 rounded-tl-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-emerald-500/20 rounded-br-3xl pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  </motion.div>
);

// Static mesh gradient background - no animation
const MeshGradientBg = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    <div
      className="absolute inset-0"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 20% 20%, rgba(6,182,212,0.08), transparent 50%),
          radial-gradient(ellipse 60% 40% at 80% 30%, rgba(16,185,129,0.06), transparent 50%),
          radial-gradient(ellipse 70% 50% at 50% 80%, rgba(168,85,247,0.05), transparent 50%)
        `
      }}
    />
  </div>
);

// Static glow orbs - CSS only, no JS animation
const GlowingOrb = ({ color, size, x, y, blur }: { color: string; size: number; x: string; y: string; blur: number }) => (
  <div
    className={`absolute rounded-full ${color} pointer-events-none opacity-20`}
    style={{ 
      width: size, 
      height: size, 
      left: x, 
      top: y, 
      filter: `blur(${blur}px)`,
    }}
  />
);

// Lightweight shimmer effect - CSS only
const HolographicShine = () => (
  <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
    <div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer"
      style={{ animation: "shimmer 3s ease-in-out infinite" }}
    />
  </div>
);

// Empty placeholder - removed for performance
const FloatingSparkle = ({ delay = 0 }: { delay?: number }) => null;
const FloatingParticle = ({ delay = 0, size = 1 }: { delay?: number; duration?: number; size?: number }) => null;

const Premium3DCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    className={`relative overflow-hidden rounded-3xl backdrop-blur-xl border border-white/10 ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: delay * 0.3 }}
    whileHover={{ scale: 1.01 }}
  >
    {/* Top edge highlight */}
    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

// Static coin icon - simplified for performance
const AnimatedCoin = ({ delay = 0, size = "md" }: { delay?: number; size?: "sm" | "md" | "lg" }) => null;

const PremiumActionButton = ({ 
  icon: Icon, 
  label, 
  gradient, 
  onClick, 
  glow,
  badge,
  paymentLogos
}: { 
  icon: React.ElementType; 
  label: string; 
  gradient: string; 
  onClick: () => void; 
  glow: string;
  badge?: string;
  paymentLogos?: string[];
}) => (
  <motion.button
    onClick={onClick}
    className="flex flex-col items-center gap-2.5 group"
    initial={{ opacity: 0, scale: 0.5, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    whileHover={{ scale: 1.12, y: -6 }}
    whileTap={{ scale: 0.92 }}
  >
    <div className={`relative w-14 h-14 rounded-2xl ${gradient} flex items-center justify-center shadow-xl ${glow} overflow-hidden`}>
      <Icon className="text-white drop-shadow-lg relative z-10" size={24} />
      
      {/* Inner gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent opacity-50" />
      
      {/* Animated pulse */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-white/20"
        animate={{ opacity: [0, 0.6, 0], scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />
      
      {/* Badge */}
      {badge && (
        <motion.div
          className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-[8px] font-bold text-amber-900 border border-amber-300/50"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ boxShadow: "0 2px 8px rgba(251,191,36,0.5)" }}
        >
          {badge}
        </motion.div>
      )}
    </div>
    
    {/* Payment Logos Row */}
    {paymentLogos && paymentLogos.length > 0 && (
      <div className="flex items-center justify-center gap-0.5 -mt-1">
        {paymentLogos.map((logo, index) => (
          <motion.div
            key={index}
            className="w-4 h-4 rounded-full bg-white flex items-center justify-center overflow-hidden p-0.5 border border-white/20"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
          >
            <img src={logo} alt="" className="w-full h-full object-contain" />
          </motion.div>
        ))}
      </div>
    )}
    
    <span className={`text-xs font-semibold text-slate-400 group-hover:text-white transition-colors ${paymentLogos ? '-mt-1' : ''}`}>{label}</span>
  </motion.button>
);

const StatCard3D = ({
  icon: Icon, 
  label, 
  value, 
  gradient,
  delay = 0
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  gradient: string;
  delay?: number;
}) => (
  <motion.div
    className="relative overflow-hidden backdrop-blur-xl rounded-2xl p-4 border border-white/[0.08]"
    style={{
      background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      boxShadow: "0 8px 32px -8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)"
    }}
    initial={{ opacity: 0, scale: 0.85, y: 25, rotateX: 15 }}
    animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ scale: 1.04, borderColor: "rgba(6, 182, 212, 0.3)", y: -3 }}
  >
    {/* Glow effect */}
    <motion.div
      className={`absolute -top-4 -right-4 w-24 h-24 ${gradient.replace('bg-gradient-to-br', '')} opacity-20 rounded-full blur-2xl`}
      animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
      transition={{ duration: 3, repeat: Infinity }}
    />
    
    <div className="flex items-center gap-3 relative z-10">
      <motion.div 
        className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center shadow-lg`}
        whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
        transition={{ duration: 0.4 }}
        style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.25)" }}
      >
        <Icon className="text-white drop-shadow-lg" size={22} />
      </motion.div>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-lg font-bold text-white">{value}</p>
      </div>
    </div>
    
    {/* Shine effect */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
      animate={{ x: ["-100%", "100%"] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
    />
  </motion.div>
);

const TransactionItem3D = ({ 
  tx, 
  onClick,
  index = 0
}: { 
  tx: any; 
  onClick: () => void;
  index?: number;
}) => {
  const getIcon = () => {
    switch (tx.type) {
      case 'deposit': return <ArrowDownRight className="text-emerald-400" size={18} />;
      case 'withdraw': return <ArrowUpRight className="text-cyan-400" size={18} />;
      case 'bonus': return <Gift className="text-rose-400" size={18} />;
      case 'win': return <Trophy className="text-amber-400" size={18} />;
      case 'bet': return <Gamepad2 className="text-purple-400" size={18} />;
      case 'referral': return <Star className="text-pink-400" size={18} />;
      default: return <History className="text-slate-400" size={18} />;
    }
  };

  const getGradient = () => {
    switch (tx.type) {
      case 'deposit': return 'from-emerald-500/20 via-emerald-600/10 to-transparent';
      case 'withdraw': return 'from-cyan-500/20 via-cyan-600/10 to-transparent';
      case 'bonus': return 'from-rose-500/20 via-rose-600/10 to-transparent';
      case 'win': return 'from-amber-500/20 via-amber-600/10 to-transparent';
      case 'bet': return 'from-purple-500/20 via-purple-600/10 to-transparent';
      case 'referral': return 'from-pink-500/20 via-pink-600/10 to-transparent';
      default: return 'from-slate-500/20 via-slate-600/10 to-transparent';
    }
  };

  const getIconBg = () => {
    switch (tx.type) {
      case 'deposit': return 'from-emerald-500 to-emerald-600';
      case 'withdraw': return 'from-cyan-500 to-blue-600';
      case 'bonus': return 'from-rose-500 to-pink-600';
      case 'win': return 'from-amber-500 to-orange-600';
      case 'bet': return 'from-purple-500 to-indigo-600';
      case 'referral': return 'from-pink-500 to-rose-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      onClick={onClick}
      className={`relative overflow-hidden bg-gradient-to-r ${getGradient()} backdrop-blur-lg rounded-2xl p-4 cursor-pointer border border-white/5`}
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ scale: 1.02, borderColor: "rgba(6, 182, 212, 0.3)", x: 5 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-4">
        <motion.div 
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getIconBg()} flex items-center justify-center shadow-lg`}
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
        >
          {getIcon()}
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{tx.description || tx.type}</p>
          <p className="text-xs text-slate-400 mt-1">{formatDate(tx.created_at)}</p>
        </div>
        <div className="text-right">
          <motion.p 
            className={`font-bold text-lg ${tx.amount > 0 ? 'text-emerald-400' : 'text-slate-300'}`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            {tx.amount > 0 ? '+' : ''}৳{Math.abs(tx.amount).toLocaleString("en-IN")}
          </motion.p>
          <p className="text-xs text-slate-500 capitalize">{tx.type}</p>
        </div>
      </div>
      <motion.div
        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30"
        animate={{ x: [0, 5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <ArrowRight className="text-white" size={16} />
      </motion.div>
    </motion.div>
  );
};

const ProviderWalletCard = ({
  provider,
  balance,
  isActive,
  index,
  onClick
}: {
  provider: { id: string; name: string };
  balance: number;
  isActive: boolean;
  index: number;
  onClick: () => void;
}) => (
  <motion.div
    onClick={onClick}
    className={`relative overflow-hidden rounded-2xl p-4 cursor-pointer border transition-all ${
      isActive
        ? "bg-gradient-to-br from-cyan-500/20 via-emerald-500/10 to-teal-500/5 border-cyan-500/30"
        : "bg-slate-900/60 border-white/5 hover:border-slate-600/50"
    }`}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ scale: 1.03, y: -3 }}
    whileTap={{ scale: 0.97 }}
  >
    {isActive && (
      <>
        <motion.div
          className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400"
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
        />
      </>
    )}
    <p className={`text-lg font-bold ${isActive ? "text-white" : "text-slate-500"}`}>
      ৳{balance.toFixed(0)}
    </p>
    <p className={`text-xs mt-1 ${isActive ? "text-cyan-300" : "text-slate-500"}`}>
      {provider.name}
    </p>
  </motion.div>
);

// ============= MAIN COMPONENT =============
const Wallet = () => {
  const navigate = useNavigate();
  const { balance, formattedBalance, transactions, refreshBalance, isLoading, isAuthenticated } = useWalletDB();

  // Loading/error handling (prevents infinite skeleton)
  const [walletLoadError, setWalletLoadError] = useState<string | null>(null);
  const debugWalletLoggedRef = useRef(false);
  
  // Modal states
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDepositHistory, setShowDepositHistory] = useState(false);
  const [showWithdrawHistory, setShowWithdrawHistory] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showDepositRequest, setShowDepositRequest] = useState(false);
  const [showWithdrawRequest, setShowWithdrawRequest] = useState(false);
  const [showAgentTransfer, setShowAgentTransfer] = useState(false);
  const [isApprovedAgent, setIsApprovedAgent] = useState(false);

  // Form states
  const [selectedMethod, setSelectedMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [depositStep, setDepositStep] = useState<"amount" | "payment">("amount");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedWithdrawChannel, setSelectedWithdrawChannel] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // 3rd party wallet state
  const [providerWallets, setProviderWallets] = useState<ProviderWallet[]>([]);
  const [thirdPartyTotalBalance, setThirdPartyTotalBalance] = useState(0);
  const [transferDirection, setTransferDirection] = useState<"to3rd" | "toMain">("to3rd");
  const [transferAmount, setTransferAmount] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // UI states
  const [showBalance, setShowBalance] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const withTimeout = useCallback(async <T,>(
    promise: PromiseLike<T>,
    ms: number,
    label: string
  ): Promise<T> => {
    let timeoutId: number | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(`${label} timeout after ${ms}ms`));
      }, ms);
    });

    try {
      // supabase-js builders are PromiseLike (thenable) but not typed as Promise
      const resolved = Promise.resolve(promise as unknown as T);
      return await Promise.race([resolved, timeoutPromise]);
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  }, []);

  const refreshBalanceWithTimeout = useCallback(async () => {
    try {
      setWalletLoadError(null);
      await withTimeout(refreshBalance(), 4000, "refreshBalance");
    } catch (err) {
      console.error("[Wallet] refreshBalance failed:", err);
      setWalletLoadError("Wallet data failed to load. Please try again.");
      throw err;
    }
  }, [refreshBalance, withTimeout]);

  // If global wallet loading gets stuck, show an error instead of infinite skeleton
  useEffect(() => {
    if (!isLoading) return;

    const t = window.setTimeout(() => {
      console.error("[Wallet] Initial wallet load timed out (4s)");
      setWalletLoadError("Wallet is taking too long to load. Please refresh.");
    }, 4000);

    return () => window.clearTimeout(t);
  }, [isLoading]);

  // Check if current user is an approved agent
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u?.user) return;
        const { data: p } = await supabase
          .from("profiles")
          .select("agent_status")
          .eq("user_id", u.user.id)
          .maybeSingle();
        setIsApprovedAgent(p?.agent_status === "approved");
      } catch (e) {
        console.warn("[Wallet] agent status check failed", e);
      }
    })();
  }, [isAuthenticated]);

  // Debug log: wallet API response (one-time) once auth is ready
  useEffect(() => {
    if (!isAuthenticated || isLoading || debugWalletLoggedRef.current) return;
    debugWalletLoggedRef.current = true;

    (async () => {
      try {
        const { data: userRes, error: userErr } = await withTimeout(
          supabase.auth.getUser(),
          3000,
          "getUser"
        );

        if (userErr) throw userErr;
        const user = userRes?.user;
        if (!user) {
          console.log("[Wallet] wallet debug: no authenticated user");
          return;
        }

        const walletRes = await withTimeout(
          supabase.from("wallets").select("*").eq("user_id", user.id).maybeSingle(),
          3000,
          "wallets select"
        );

        console.log("[Wallet] wallet API response:", walletRes);
      } catch (err) {
        console.error("[Wallet] wallet debug fetch failed:", err);
      }
    })();
  }, [isAuthenticated, isLoading, withTimeout]);

  // Calculate totals
  const totalBalance = balance + thirdPartyTotalBalance;
  const mainWalletPercent = totalBalance > 0 ? Math.round((balance / totalBalance) * 100) : 100;
  const thirdPartyPercent = totalBalance > 0 ? Math.round((thirdPartyTotalBalance / totalBalance) * 100) : 0;

  const MERCHANT_NUMBERS: Record<string, string> = {
    bkash: "01712345678",
    nagad: "01812345678",
    rocket: "01512345678",
    upay: "01612345678",
  };

  // Fetch provider wallets with timeout
  const fetchProviderWallets = useCallback(async () => {
    try {
      const { data: { user } } = await withTimeout(
        supabase.auth.getUser(),
        3000,
        "fetchProviderWallets.getUser"
      );
      if (!user) return;

      const { data, error } = await withTimeout(
        supabase.from("game_provider_wallets").select("*").eq("user_id", user.id),
        3000,
        "fetchProviderWallets.select"
      );

      if (error) throw error;

      if (data) {
        setProviderWallets(data);
        const total = data.reduce((sum, w) => sum + Number(w.balance), 0);
        setThirdPartyTotalBalance(total);
      }
    } catch (error) {
      console.error("[Wallet] Error fetching provider wallets:", error);
    }
  }, [withTimeout]);

  // Initialize provider wallets with timeout
  const initializeProviderWallets = useCallback(async () => {
    try {
      const { data: { user } } = await withTimeout(
        supabase.auth.getUser(),
        3000,
        "initProviderWallets.getUser"
      );
      if (!user) return;

      const { data: existing } = await withTimeout(
        supabase.from("game_provider_wallets").select("id").eq("user_id", user.id).limit(1),
        3000,
        "initProviderWallets.check"
      );

      if (existing && existing.length > 0) return;

      const walletsToCreate = GAME_PROVIDERS.map(provider => ({
        user_id: user.id,
        provider_id: provider.id,
        provider_name: provider.name,
        balance: 0,
        is_active: provider.active,
      }));

      await withTimeout(
        supabase.from("game_provider_wallets").insert(walletsToCreate),
        3000,
        "initProviderWallets.insert"
      );
      await fetchProviderWallets();
    } catch (error) {
      console.error("[Wallet] Error initializing provider wallets:", error);
    }
  }, [fetchProviderWallets, withTimeout]);

  useEffect(() => {
    // Only run once auth is confirmed (prevents calling APIs while auth is still initializing)
    if (isAuthenticated && !isLoading) {
      initializeProviderWallets();
      fetchProviderWallets();
    }
  }, [isAuthenticated, isLoading, initializeProviderWallets, fetchProviderWallets]);

  const depositTransactions = useMemo(() => 
    transactions.filter(t => t.type === "deposit"), [transactions]);
  
  const withdrawTransactions = useMemo(() => 
    transactions.filter(t => t.type === "withdraw"), [transactions]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCopyNumber = (number: string) => {
    navigator.clipboard.writeText(number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await refreshBalanceWithTimeout();
      await withTimeout(fetchProviderWallets(), 10000, "fetchProviderWallets");
    } catch {
      // error already logged + stored in walletLoadError
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // ============= DEPOSIT HANDLERS =============
  const handleDeposit = async () => {
    if (!selectedMethod || !amount || !selectedChannel) {
      toast.error("Please select payment method, channel and enter amount");
      return;
    }

    const numAmount = parseFloat(amount);
    const channel = PAYMENT_CHANNELS[selectedMethod]?.find(c => c.id === selectedChannel);
    
    if (channel && (numAmount < channel.min || numAmount > channel.max)) {
      toast.error(`Amount must be between ৳${channel.min.toLocaleString()} - ৳${channel.max.toLocaleString()}`);
      return;
    }

    setDepositStep("payment");
  };

  const handleConfirmDeposit = async () => {
    setIsProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to deposit");
        return;
      }

      const numAmount = parseFloat(amount);

      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance, total_deposit")
        .eq("user_id", user.id)
        .single();

      if (!wallet) {
        toast.error("Wallet not found");
        return;
      }

      const newBalance = wallet.balance + numAmount;

      await supabase
        .from("wallets")
        .update({
          balance: newBalance,
          total_deposit: wallet.total_deposit + numAmount,
        })
        .eq("user_id", user.id);

      await supabase
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          type: "deposit",
          amount: numAmount,
          balance_after: newBalance,
          description: `Deposit via ${selectedMethod.toUpperCase()}`,
        });

      toast.success(`৳${numAmount.toLocaleString()} deposited successfully!`);
      setShowDepositModal(false);
      setDepositStep("amount");
      setAmount("");
      setSelectedMethod("");
      refreshBalanceWithTimeout().catch(() => {});
    } catch (error) {
      console.error("Deposit error:", error);
      toast.error("Deposit failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ============= WITHDRAW HANDLERS =============
  const handleWithdraw = async () => {
    if (!selectedMethod || !amount || !accountNumber || !selectedWithdrawChannel) {
      toast.error("Please fill all fields and select a channel");
      return;
    }

    const numAmount = parseFloat(amount);
    const channel = WITHDRAWAL_CHANNELS[selectedMethod]?.find(c => c.id === selectedWithdrawChannel);
    
    if (channel && (numAmount < channel.min || numAmount > channel.max)) {
      toast.error(`Amount must be between ৳${channel.min.toLocaleString()} - ৳${channel.max.toLocaleString()}`);
      return;
    }

    if (numAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    if (accountNumber.length < 11) {
      toast.error("Please enter a valid account number");
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to withdraw");
        return;
      }

      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance, total_withdraw")
        .eq("user_id", user.id)
        .single();

      if (!wallet) {
        toast.error("Wallet not found");
        return;
      }

      const newBalance = wallet.balance - numAmount;

      await supabase
        .from("wallets")
        .update({
          balance: newBalance,
          total_withdraw: wallet.total_withdraw + numAmount,
        })
        .eq("user_id", user.id);

      await supabase
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          type: "withdraw",
          amount: -numAmount,
          balance_after: newBalance,
          description: `Withdraw to ${selectedMethod.toUpperCase()} - ${accountNumber.slice(-4)}`,
        });

      toast.success(`Withdrawal request of ৳${numAmount.toLocaleString()} submitted!`);
      setShowWithdrawModal(false);
      setAmount("");
      setAccountNumber("");
      setSelectedMethod("");
      refreshBalanceWithTimeout().catch(() => {});
    } catch (error) {
      console.error("Withdraw error:", error);
      toast.error("Withdrawal failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ============= TRANSFER HANDLERS =============
  const handleTransfer = async () => {
    if (!transferAmount || !selectedProvider) {
      toast.error("Please select provider and enter amount");
      return;
    }

    const numAmount = parseFloat(transferAmount);
    if (numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (transferDirection === "to3rd" && numAmount > balance) {
      toast.error("Insufficient main wallet balance");
      return;
    }

    const providerWallet = providerWallets.find(w => w.provider_id === selectedProvider);
    if (transferDirection === "toMain" && providerWallet && numAmount > providerWallet.balance) {
      toast.error("Insufficient provider wallet balance");
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login");
        return;
      }

      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (!wallet) {
        toast.error("Wallet not found");
        return;
      }

      const { data: currentProviderWallet } = await supabase
        .from("game_provider_wallets")
        .select("*")
        .eq("user_id", user.id)
        .eq("provider_id", selectedProvider)
        .single();

      if (!currentProviderWallet) {
        toast.error("Provider wallet not found");
        return;
      }

      let newProviderBalance: number;

      if (transferDirection === "to3rd") {
        // Deduct from main wallet using secure RPC
        const { data: deductResult, error: deductError } = await supabase.rpc("secure_deduct_bet", {
          p_user_id: user.id,
          p_amount: numAmount,
          p_game_type: "wallet_transfer",
          p_trade_id: `transfer_${selectedProvider}_${Date.now()}`,
        });

        const deduct = deductResult as { success: boolean; new_balance?: number; error?: string } | null;
        if (deductError || !deduct?.success) {
          throw new Error(deduct?.error || "Failed to deduct from main wallet");
        }

        newProviderBalance = currentProviderWallet.balance + numAmount;
      } else {
        // Credit to main wallet using secure RPC
        const { data: creditResult, error: creditError } = await supabase.rpc("credit_reward", {
          p_user_id: user.id,
          p_amount: numAmount,
          p_reward_type: "wallet_transfer",
          p_reason: `Transfer from ${selectedProvider}`,
        });

        const credit = creditResult as { success: boolean; new_balance?: number; error?: string } | null;
        if (creditError || !credit?.success) {
          throw new Error(credit?.error || "Failed to credit main wallet");
        }

        newProviderBalance = currentProviderWallet.balance - numAmount;
      }

      // Update provider wallet (this is separate from main wallet)
      await supabase
        .from("game_provider_wallets")
        .update({ balance: newProviderBalance })
        .eq("user_id", user.id)
        .eq("provider_id", selectedProvider);

      await supabase
        .from("wallet_transfers")
        .insert({
          user_id: user.id,
          from_wallet: transferDirection === "to3rd" ? "main" : selectedProvider,
          to_wallet: transferDirection === "to3rd" ? selectedProvider : "main",
          amount: numAmount,
          status: "completed",
        });

      toast.success(`৳${numAmount.toLocaleString()} transferred successfully!`);
      
      setShowTransferModal(false);
      setTransferAmount("");
      setSelectedProvider("");
      refreshBalanceWithTimeout().catch(() => {});
      fetchProviderWallets();
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error("Transfer failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    toast.info("Syncing all provider wallets...");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("game_provider_wallets")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("user_id", user.id);

      await fetchProviderWallets();
      toast.success("All wallets synced successfully!");
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Sync failed. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Modal close handlers
  const closeDepositModal = () => {
    setShowDepositModal(false);
    setDepositStep("amount");
    setAmount("");
    setSelectedMethod("");
    setSelectedChannel("");
  };

  const closeWithdrawModal = () => {
    setShowWithdrawModal(false);
    setAmount("");
    setAccountNumber("");
    setSelectedMethod("");
    setSelectedWithdrawChannel("");
  };

  const closeTransferModal = () => {
    setShowTransferModal(false);
    setTransferAmount("");
    setSelectedProvider("");
  };

  const getProviderBalance = (providerId: string): number => {
    const wallet = providerWallets.find(w => w.provider_id === providerId);
    return wallet?.balance || 0;
  };

  // ============= LOADING STATE - FAST SKELETON =============
  if (isLoading && !walletLoadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        {/* Simple header skeleton */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="w-11 h-11 rounded-2xl bg-slate-800/60 animate-pulse" />
          <div className="w-32 h-6 rounded-lg bg-slate-800/60 animate-pulse" />
          <div className="w-11 h-11 rounded-2xl bg-slate-800/60 animate-pulse" />
        </div>
        
        {/* Balance card skeleton */}
        <div className="rounded-3xl bg-slate-800/40 border border-white/5 p-6 mb-6 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-16 h-6 rounded-full bg-slate-700/50" />
            <div className="w-12 h-6 rounded-full bg-slate-700/50" />
          </div>
          <div className="w-48 h-10 rounded-lg bg-slate-700/50 mb-4" />
          <div className="flex gap-4">
            <div className="flex-1 h-14 rounded-2xl bg-slate-700/50" />
            <div className="flex-1 h-14 rounded-2xl bg-slate-700/50" />
          </div>
        </div>
        
        {/* Quick actions skeleton */}
        <div className="rounded-3xl bg-slate-800/40 border border-white/5 p-6 mb-6 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-slate-700/50" />
                <div className="w-12 h-3 rounded bg-slate-700/50" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl bg-slate-800/40 border border-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-700/50" />
                <div>
                  <div className="w-16 h-3 rounded bg-slate-700/50 mb-2" />
                  <div className="w-20 h-5 rounded bg-slate-700/50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============= ERROR STATE - FALLBACK UI =============
  if (walletLoadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 text-center pointer-events-auto">
        <div className="fixed inset-0 noClick pointer-events-none overflow-hidden">
          <GlowingOrb color="bg-red-500" size={300} x="20%" y="30%" blur={120} />
          <GlowingOrb color="bg-orange-500" size={200} x="70%" y="60%" blur={100} />
        </div>
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 flex items-center justify-center mb-6 shadow-2xl shadow-red-500/30">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
        </motion.div>
        
        <motion.h2 
          className="text-2xl font-bold text-white mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Wallet Load Error
        </motion.h2>
        <motion.p 
          className="text-slate-400 mb-6 max-w-xs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {walletLoadError}
        </motion.p>
        
        <motion.button
          onClick={() => {
            setWalletLoadError(null);
            refreshBalanceWithTimeout().catch(() => {});
          }}
          className="relative overflow-hidden bg-gradient-to-r from-cyan-500 via-emerald-500 to-teal-500 text-white font-bold px-10 py-3.5 rounded-2xl shadow-xl shadow-cyan-500/30"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <span className="relative z-10 flex items-center gap-2">
            <RotateCcw size={18} />
            Try Again
          </span>
        </motion.button>
      </div>
    );
  }

  // ============= UNAUTHENTICATED STATE =============
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 text-center pointer-events-auto">
        <div className="fixed inset-0 noClick pointer-events-none overflow-hidden">
          <GlowingOrb color="bg-cyan-500" size={300} x="20%" y="30%" blur={120} />
          <GlowingOrb color="bg-emerald-500" size={200} x="70%" y="60%" blur={100} />
        </div>
        
        <motion.div
          initial={{ scale: 0, rotateY: 180 }}
          animate={{ scale: 1, rotateY: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500 via-emerald-500 to-teal-500 flex items-center justify-center mb-6 shadow-2xl shadow-cyan-500/30">
              <AlertCircle className="w-12 h-12 text-white" />
            </div>
            {[0, 1, 2].map(i => (
              <FloatingSparkle key={i} delay={i * 0.5} />
            ))}
          </div>
        </motion.div>
        
        <motion.h2 
          className="text-3xl font-bold text-white mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Login Required
        </motion.h2>
        <motion.p 
          className="text-slate-400 mb-8 max-w-xs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Please login to access your premium wallet and manage your funds
        </motion.p>
        
        <motion.a
          href="/login"
          className="relative overflow-hidden bg-gradient-to-r from-cyan-500 via-emerald-500 to-teal-500 text-white font-bold px-12 py-4 rounded-2xl shadow-xl shadow-cyan-500/30"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <HolographicShine />
          <span className="relative z-10 flex items-center gap-2">
            Go to Login
            <ArrowRight size={18} />
          </span>
        </motion.a>
      </div>
    );
  }

  // ============= MAIN RENDER =============
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 force-click page-content" style={{ pointerEvents: "auto", position: "relative", zIndex: 1 }}>
      {/* Lightweight Background - static, no animations - decorative layer */}
      <MeshGradientBg />
      
      {/* Reduced background orbs - decorative layer */}
      <div className="fixed inset-0 decorative" style={{ pointerEvents: "none", zIndex: 0 }}>
        <GlowingOrb color="bg-cyan-500" size={400} x="10%" y="15%" blur={120} />
        <GlowingOrb color="bg-emerald-500" size={300} x="80%" y="60%" blur={100} />
        <GlowingOrb color="bg-purple-500" size={250} x="50%" y="85%" blur={90} />
      </div>

      {/* Premium Header with Hero Image */}
      <div className="relative px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-11 h-11 rounded-2xl bg-slate-800/60 backdrop-blur-lg flex items-center justify-center border border-white/10 active:scale-95 transition-transform"
          >
            <ChevronLeft className="text-white" size={22} />
          </button>
          
          <div className="flex items-center gap-2">
            <Diamond className="text-cyan-400" size={22} />
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-cyan-100 to-emerald-100 bg-clip-text text-transparent">
              Premium Wallet
            </h1>
          </div>
          
          <button
            onClick={handleRefresh}
            className="w-11 h-11 rounded-2xl bg-slate-800/60 backdrop-blur-lg flex items-center justify-center border border-white/10 active:scale-95 transition-transform"
          >
            <RefreshCw className={`text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} size={18} />
          </button>
        </div>

        {/* Hero Banner with 3D Wallet */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/20 border border-amber-500/20 p-4"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          <div className="flex items-center gap-4">
            <motion.img 
              src={walletHeroImg} 
              alt="Wallet" 
              className="w-20 h-20 object-contain drop-shadow-2xl"
              animate={{ y: [-3, 3, -3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="flex-1">
              <p className="text-amber-200 text-xs font-medium mb-1">💰 আজকের অফার</p>
              <p className="text-white font-bold text-sm">প্রথম ডিপোজিটে +20% বোনাস পান!</p>
              <p className="text-amber-300/70 text-xs mt-1">সর্বোচ্চ ৳5,000 বোনাস</p>
            </div>
            <motion.div
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              এখনই
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Premium Balance Card - Enhanced Glassmorphic */}
      <div className="px-4 mb-6">
        <PremiumGlassCard 
          gradient="from-cyan-500/15 via-emerald-500/10 to-teal-500/15"
          glowColor="rgba(6,182,212,0.2)"
          delay={0.1}
          className="p-6"
        >
          {/* Removed heavy floating particles for performance */}

          {/* Premium Status badges - static */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-lg border border-emerald-500/40"
              style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%)" }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 tracking-wider">LIVE</span>
            </div>
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-lg border border-amber-500/40"
              style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.05) 100%)" }}
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 tracking-wider">PREMIUM</span>
            </div>
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-lg border border-cyan-500/40"
              style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0.05) 100%)" }}
            >
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-cyan-400 tracking-wider">SECURE</span>
            </div>
          </div>

          {/* Total Balance - Simplified */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-slate-400 text-sm font-medium uppercase tracking-widest flex items-center gap-2">
                <Gem className="w-4 h-4 text-cyan-400" />
                Total Balance
              </p>
              <button 
                onClick={() => setShowBalance(!showBalance)} 
                className="p-2 rounded-xl backdrop-blur-lg border border-white/10 hover:border-white/25 transition-colors active:scale-90"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)" }}
              >
                {showBalance ? <Eye size={16} className="text-slate-400" /> : <EyeOff size={16} className="text-slate-400" />}
              </button>
            </div>
            <div className={`flex items-baseline gap-3 transition-all ${!showBalance ? 'blur-md' : ''}`}>
              <span className="text-xl text-cyan-400 font-bold">৳</span>
              <span 
                className="text-5xl font-black"
                style={{
                  background: "linear-gradient(135deg, #ffffff 0%, #67e8f9 40%, #10b981 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {showBalance ? totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "••••••••"}
              </span>
            </div>
          </div>

          {/* Wallet Split Cards - Simplified */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div 
              className="relative overflow-hidden rounded-2xl p-5 backdrop-blur-xl border border-cyan-500/25 hover:scale-[1.02] hover:border-cyan-500/40 transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0.03) 100%)",
                boxShadow: "0 8px 32px -8px rgba(6,182,212,0.2), inset 0 1px 0 rgba(255,255,255,0.1)"
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                  <WalletIcon size={14} className="text-cyan-400" />
                  Main Wallet
                </span>
                <span className="text-xs font-bold text-cyan-400 bg-cyan-400/15 px-2.5 py-1 rounded-full border border-cyan-400/20">
                  {mainWalletPercent}%
                </span>
              </div>
              <p className="text-2xl font-bold text-white mb-3">
                ৳ {showBalance ? balance.toLocaleString("en-IN") : "••••"}
              </p>
              <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ 
                    background: "linear-gradient(90deg, #06b6d4, #10b981, #14b8a6)",
                    width: `${mainWalletPercent}%`
                  }}
                />
              </div>
            </div>
            
            <div 
              className="relative overflow-hidden rounded-2xl p-5 backdrop-blur-xl border border-emerald-500/25 hover:scale-[1.02] hover:border-emerald-500/40 transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.03) 100%)",
                boxShadow: "0 8px 32px -8px rgba(16,185,129,0.2), inset 0 1px 0 rgba(255,255,255,0.1)"
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                  <Gamepad2 size={14} className="text-emerald-400" />
                  3rd Party
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-400/15 px-2.5 py-1 rounded-full border border-emerald-400/20">
                  {thirdPartyPercent}%
                </span>
              </div>
              <p className="text-2xl font-bold text-white mb-3">
                ৳ {showBalance ? thirdPartyTotalBalance.toLocaleString("en-IN") : "••••"}
              </p>
              <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ 
                    background: "linear-gradient(90deg, #10b981, #14b8a6, #06b6d4)",
                    width: `${thirdPartyPercent}%`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Transfer Button - Simplified */}
          <button
            onClick={() => setShowTransferModal(true)}
            className="w-full py-5 rounded-2xl relative overflow-hidden text-white font-bold flex items-center justify-center gap-3 active:scale-[0.98] hover:scale-[1.01] transition-transform"
            style={{
              background: "linear-gradient(135deg, #06b6d4 0%, #10b981 50%, #14b8a6 100%)",
              boxShadow: "0 15px 40px -10px rgba(6,182,212,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"
            }}
          >
            <HolographicShine />
            <ArrowLeftRight size={22} className="relative z-10" />
            <span className="relative z-10 text-lg">Transfer Between Wallets</span>
            <ArrowRight size={20} className="relative z-10" />
          </button>
        </PremiumGlassCard>
      </div>

      {/* 🔥 HIGHLIGHTED DEPOSIT BANNER - Very Prominent */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Animated gradient border */}
          <div 
            className="absolute inset-0 rounded-3xl p-[2px]"
            style={{
              background: "linear-gradient(90deg, #10b981, #06b6d4, #8b5cf6, #f59e0b, #10b981)",
              backgroundSize: "300% 100%",
              animation: "gradientShift 3s linear infinite"
            }}
          >
            <div className="absolute inset-[2px] rounded-3xl bg-slate-900" />
          </div>

          {/* Content */}
          <div 
            className="relative p-5"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,182,212,0.1) 50%, rgba(139,92,246,0.1) 100%)"
            }}
          >
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
              animate={{ x: ["-200%", "200%"] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            />

            {/* HOT Badge */}
            <motion.div
              className="absolute -top-1 -right-1 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white text-xs font-bold shadow-lg shadow-rose-500/50"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              🔥 HOT
            </motion.div>

            <div className="flex items-center gap-4 relative z-10">
              {/* Deposit Icon with pulse */}
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-500/40"
                animate={{ 
                  scale: [1, 1.08, 1],
                  boxShadow: [
                    "0 10px 30px -10px rgba(16,185,129,0.4)",
                    "0 15px 40px -10px rgba(16,185,129,0.6)",
                    "0 10px 30px -10px rgba(16,185,129,0.4)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <BadgeDollarSign className="text-white" size={32} />
              </motion.div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">
                  এখনই ডিপোজিট করুন!
                </h3>
                <p className="text-sm text-slate-400">
                  Nagad ও bKash দিয়ে তাৎক্ষণিক ডিপোজিট করুন
                </p>
                {/* Payment logos */}
                <div className="flex items-center gap-2 mt-2">
                  {[nagadLogo, bkashLogo].map((logo, i) => (
                    <motion.div
                      key={i}
                      className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-1 shadow-md"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                    >
                      <img src={logo} alt="" className="w-full h-full object-contain" />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Deposit Button */}
              <motion.button
                onClick={() => navigate("/deposit")}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/40 flex items-center gap-2"
                whileHover={{ scale: 1.05, boxShadow: "0 15px 40px -10px rgba(16,185,129,0.5)" }}
                whileTap={{ scale: 0.95 }}
              >
                <span>ডিপোজিট</span>
                <ArrowRight size={18} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions - Enhanced Glassmorphic */}
      <div className="px-4 mb-6">
        <PremiumGlassCard 
          gradient="from-purple-500/10 via-pink-500/5 to-rose-500/10"
          glowColor="rgba(168,85,247,0.12)"
          delay={0.15}
          className="p-6"
        >
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              style={{ boxShadow: "0 4px 15px rgba(245,158,11,0.4)" }}
            >
              <Zap className="text-white" size={20} />
            </motion.div>
            <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Quick Actions</span>
          </h3>
          <div className="grid grid-cols-5 gap-4">
            <PremiumActionButton
              icon={BadgeDollarSign}
              label="Deposit"
              gradient="bg-gradient-to-br from-teal-500 to-cyan-600"
              glow="shadow-lg shadow-teal-500/40"
              onClick={() => navigate("/deposit")}
              badge="HOT"
              paymentLogos={[nagadLogo, bkashLogo]}
            />
            <PremiumActionButton
              icon={ArrowUpRight}
              label="Withdraw"
              gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
              glow="shadow-lg shadow-cyan-500/40"
              onClick={() => navigate("/withdraw")}
              paymentLogos={[nagadLogo, bkashLogo]}
            />
            <PremiumActionButton
              icon={Send}
              label="Transfer"
              gradient="bg-gradient-to-br from-emerald-500 to-green-600"
              glow="shadow-lg shadow-emerald-500/40"
              onClick={() => setShowTransferModal(true)}
            />
            <PremiumActionButton
              icon={FileText}
              label="History"
              gradient="bg-gradient-to-br from-rose-500 to-pink-600"
              glow="shadow-lg shadow-rose-500/40"
              onClick={() => setShowAllTransactions(true)}
            />
            <PremiumActionButton
              icon={History}
              label="Requests"
              gradient="bg-gradient-to-br from-purple-500 to-indigo-600"
              glow="shadow-lg shadow-purple-500/40"
              onClick={() => setShowDepositRequest(true)}
            />
          </div>
        </PremiumGlassCard>
      </div>

      {/* Stats Grid - Enhanced Glassmorphic */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <StatCard3D
            icon={TrendingUp}
            label="Today's Profit"
            value="৳0.00"
            gradient="bg-gradient-to-br from-emerald-500 to-green-600"
            delay={0.22}
          />
          <StatCard3D
            icon={Coins}
            label="Total Wagered"
            value="৳0.00"
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            delay={0.28}
          />
          <StatCard3D
            icon={Trophy}
            label="Total Won"
            value="৳0.00"
            gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
            delay={0.34}
          />
          <StatCard3D
            icon={Gift}
            label="Bonuses"
            value="৳0.00"
            gradient="bg-gradient-to-br from-rose-500 to-pink-600"
            delay={0.40}
          />
        </div>
      </div>

      {/* Game Provider Wallets - Enhanced Glassmorphic */}
      <div className="px-4 mb-6">
        <PremiumGlassCard 
          gradient="from-emerald-500/10 via-teal-500/5 to-cyan-500/10"
          glowColor="rgba(16,185,129,0.12)"
          delay={0.45}
          className="p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                style={{ boxShadow: "0 4px 15px rgba(16,185,129,0.4)" }}
              >
                <Gamepad2 className="text-white" size={20} />
              </motion.div>
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Game Wallets</span>
            </h3>
            <motion.button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl backdrop-blur-lg text-cyan-400 text-sm font-semibold border border-cyan-500/30"
              style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0.05) 100%)" }}
              whileHover={{ scale: 1.05, borderColor: "rgba(6,182,212,0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div animate={isSyncing ? { rotate: 360 } : {}} transition={{ duration: 0.6, repeat: isSyncing ? Infinity : 0, ease: "linear" }}>
                <RotateCcw size={16} />
              </motion.div>
              {isSyncing ? "Syncing..." : "Sync All"}
            </motion.button>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {GAME_PROVIDERS.slice(0, 9).map((provider, index) => {
              const providerBalance = getProviderBalance(provider.id);
              const isActive = provider.id === "lottery" || providerBalance > 0;

              return (
                <ProviderWalletCard
                  key={provider.id}
                  provider={provider}
                  balance={provider.id === "lottery" ? balance : providerBalance}
                  isActive={isActive}
                  index={index}
                  onClick={() => {
                    setSelectedProvider(provider.id);
                    setShowTransferModal(true);
                  }}
                />
              );
            })}
          </div>
        </PremiumGlassCard>
      </div>

      {/* Recent Transactions */}
      <div className="px-4 mb-6">
        <Premium3DCard className="bg-slate-800/50 p-6" delay={0.5}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="text-cyan-400" size={20} />
              Recent Transactions
            </h3>
            <motion.button
              onClick={() => setShowAllTransactions(true)}
              className="text-sm text-cyan-400 font-medium flex items-center gap-1"
              whileHover={{ x: 3 }}
            >
              View All
              <ArrowRight size={14} />
            </motion.button>
          </div>

          {transactions.length === 0 ? (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div 
                className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex items-center justify-center border border-white/5"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <History className="w-10 h-10 text-slate-500" />
              </motion.div>
              <p className="text-slate-400 font-medium">No transactions yet</p>
              <p className="text-slate-500 text-sm mt-1">Your transaction history will appear here</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx, index) => (
                <TransactionItem3D
                  key={tx.id}
                  tx={tx}
                  index={index}
                  onClick={() => {
                    setSelectedTransaction(tx);
                    setShowTransactionModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </Premium3DCard>
      </div>

      {/* ============= MODALS ============= */}
      
      {/* Transfer Modal */}
      <AnimatePresence>
        {showTransferModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto border-t border-white/10"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
            >
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl p-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ArrowLeftRight className="text-cyan-400" size={20} />
                  Wallet Transfer
                </h2>
                <motion.button 
                  onClick={closeTransferModal} 
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700"
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} className="text-slate-400" />
                </motion.button>
              </div>

              <div className="p-4 space-y-4">
                {/* Transfer Direction */}
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => setTransferDirection("to3rd")}
                    className={`flex-1 py-3.5 rounded-xl font-medium transition-all ${
                      transferDirection === "to3rd"
                        ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/30"
                        : "bg-slate-800 text-slate-400 border border-white/5"
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    Main → 3rd Party
                  </motion.button>
                  <motion.button
                    onClick={() => setTransferDirection("toMain")}
                    className={`flex-1 py-3.5 rounded-xl font-medium transition-all ${
                      transferDirection === "toMain"
                        ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/30"
                        : "bg-slate-800 text-slate-400 border border-white/5"
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    3rd Party → Main
                  </motion.button>
                </div>

                {/* Available Balance */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-5 text-center border border-white/5">
                  <p className="text-sm text-slate-400">
                    {transferDirection === "to3rd" ? "Main Wallet Balance" : "Select Provider Below"}
                  </p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {transferDirection === "to3rd"
                      ? formattedBalance
                      : selectedProvider
                        ? `৳${getProviderBalance(selectedProvider).toLocaleString("en-IN")}`
                        : "৳0.00"}
                  </p>
                </div>

                {/* Provider Selection */}
                <div className="grid grid-cols-3 gap-2">
                  {GAME_PROVIDERS.filter(p => p.id !== "lottery").slice(0, 9).map(provider => (
                    <motion.button
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider.id)}
                      className={`p-3 rounded-xl text-center transition-all ${
                        selectedProvider === provider.id
                          ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/20"
                          : "bg-slate-800 text-slate-400 border border-white/5"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <p className="text-xs font-medium">{provider.name}</p>
                    </motion.button>
                  ))}
                </div>

                {/* Amount Input */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-lg">৳</span>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-10 pr-4 py-4 bg-slate-800 border border-white/10 rounded-2xl text-lg text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                {/* Transfer Button */}
                <motion.button
                  onClick={handleTransfer}
                  disabled={!selectedProvider || !transferAmount || isProcessing}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <ArrowLeftRight size={20} />}
                  {isProcessing ? "Processing..." : "Transfer Now"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deposit Modal */}
      <AnimatePresence>
        {showDepositModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto border-t border-white/10"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
            >
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl p-4 border-b border-white/5 flex items-center justify-between">
                <motion.button onClick={closeDepositModal} className="p-2" whileTap={{ scale: 0.9 }}>
                  <ChevronLeft size={24} className="text-slate-400" />
                </motion.button>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Gem className="text-rose-400" size={20} />
                  Quick Deposit
                </h2>
                <button onClick={() => setShowDepositHistory(true)} className="text-sm text-cyan-400">
                  History
                </button>
              </div>

              {depositStep === "amount" ? (
                <div className="p-4 space-y-4">
                  {/* Balance Card */}
                  <motion.div 
                    className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-5 shadow-xl shadow-rose-500/30"
                    whileHover={{ scale: 1.01 }}
                  >
                    <p className="text-rose-100 text-xs mb-1">Current Balance</p>
                    <p className="text-white text-3xl font-bold">৳{balance.toFixed(2)}</p>
                  </motion.div>

                  {/* Payment Methods */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {PAYMENT_METHODS.map(method => (
                      <motion.button
                        key={method.id}
                        onClick={() => { setSelectedMethod(method.id); setSelectedChannel(""); }}
                        className={`flex flex-col items-center px-4 py-3 rounded-xl min-w-[70px] transition-all ${
                          selectedMethod === method.id
                            ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/30"
                            : "bg-slate-800 text-slate-400 border border-white/5"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-lg">{method.icon}</span>
                        <span className="text-xs mt-1 font-medium">{method.name}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Channel Selection */}
                  {selectedMethod && PAYMENT_CHANNELS[selectedMethod] && (
                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5">
                      <p className="text-sm font-medium text-slate-400 mb-3">Select Channel</p>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {PAYMENT_CHANNELS[selectedMethod].map(channel => (
                          <motion.button
                            key={channel.id}
                            onClick={() => setSelectedChannel(channel.id)}
                            className={`p-3 rounded-xl text-left transition-all ${
                              selectedChannel === channel.id
                                ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white"
                                : "bg-slate-700/50 text-slate-300 border border-white/5"
                            }`}
                            whileTap={{ scale: 0.98 }}
                          >
                            <p className="text-sm font-medium truncate">{channel.name}</p>
                            <p className="text-xs opacity-70 mt-1">৳{channel.min}-{channel.max >= 1000 ? `${channel.max/1000}K` : channel.max}</p>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Amounts */}
                  <div className="grid grid-cols-3 gap-2">
                    {QUICK_AMOUNTS.map(amt => (
                      <motion.button
                        key={amt}
                        onClick={() => setAmount(amt.toString())}
                        className={`py-3.5 rounded-xl font-medium transition-all ${
                          amount === amt.toString()
                            ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/20"
                            : "bg-slate-800 text-slate-400 border border-white/5"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        ৳{amt >= 1000 ? `${amt/1000}K` : amt}
                      </motion.button>
                    ))}
                  </div>

                  {/* Amount Input */}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400 font-bold text-lg">৳</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full pl-10 pr-12 py-4 bg-slate-800 border border-white/10 rounded-2xl text-lg text-white focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                    {amount && (
                      <button onClick={() => setAmount("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  {/* Deposit Button */}
                  <motion.button
                    onClick={handleDeposit}
                    disabled={!selectedMethod || !amount || !selectedChannel}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold disabled:opacity-50 shadow-xl shadow-rose-500/30"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continue to Payment
                  </motion.button>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  <div className="bg-rose-500/10 rounded-2xl p-4 border border-rose-500/30">
                    <p className="text-sm text-rose-400 font-medium mb-2">Send ৳{parseFloat(amount).toLocaleString()} to:</p>
                    <div className="flex items-center justify-between bg-slate-800 rounded-xl p-3">
                      <div>
                        <p className="text-xs text-slate-400">{PAYMENT_CHANNELS[selectedMethod]?.find(c => c.id === selectedChannel)?.name}</p>
                        <p className="text-lg font-bold text-white">{MERCHANT_NUMBERS[selectedMethod]}</p>
                      </div>
                      <motion.button
                        onClick={() => handleCopyNumber(MERCHANT_NUMBERS[selectedMethod])}
                        className="p-2 rounded-lg bg-rose-500/20 text-rose-400"
                        whileTap={{ scale: 0.9 }}
                      >
                        {copied ? <Check size={20} /> : <Copy size={20} />}
                      </motion.button>
                    </div>
                  </div>

                  <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/30">
                    <p className="text-sm text-amber-400">
                      <strong>Important:</strong> After sending payment, click "Confirm Deposit" below.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      onClick={() => setDepositStep("amount")}
                      className="flex-1 py-3.5 rounded-xl border-2 border-white/10 text-slate-300 font-medium"
                      whileTap={{ scale: 0.98 }}
                    >
                      Back
                    </motion.button>
                    <motion.button
                      onClick={handleConfirmDeposit}
                      disabled={isProcessing}
                      className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                      whileTap={{ scale: 0.98 }}
                    >
                      {isProcessing && <Loader2 className="animate-spin" size={18} />}
                      {isProcessing ? "Processing..." : "Confirm Deposit"}
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto border-t border-white/10"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
            >
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl p-4 border-b border-white/5 flex items-center justify-between">
                <motion.button onClick={closeWithdrawModal} className="p-2" whileTap={{ scale: 0.9 }}>
                  <ChevronLeft size={24} className="text-slate-400" />
                </motion.button>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="text-cyan-400" size={20} />
                  Quick Withdraw
                </h2>
                <button onClick={() => setShowWithdrawHistory(true)} className="text-sm text-cyan-400">
                  History
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Balance Card */}
                <motion.div 
                  className="bg-gradient-to-r from-cyan-500 to-emerald-600 rounded-2xl p-5 shadow-xl shadow-cyan-500/30"
                  whileHover={{ scale: 1.01 }}
                >
                  <p className="text-cyan-100 text-xs mb-1">Available Balance</p>
                  <p className="text-white text-3xl font-bold">৳{balance.toFixed(2)}</p>
                </motion.div>

                {/* Payment Methods */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {PAYMENT_METHODS.filter(m => m.id !== 'usdt').map(method => (
                    <motion.button
                      key={method.id}
                      onClick={() => { setSelectedMethod(method.id); setSelectedWithdrawChannel(""); }}
                      className={`flex flex-col items-center px-4 py-3 rounded-xl min-w-[70px] transition-all ${
                        selectedMethod === method.id
                          ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/30"
                          : "bg-slate-800 text-slate-400 border border-white/5"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-lg">{method.icon}</span>
                      <span className="text-xs mt-1 font-medium">{method.name}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Channel Selection */}
                {selectedMethod && WITHDRAWAL_CHANNELS[selectedMethod] && (
                  <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5">
                    <p className="text-sm font-medium text-slate-400 mb-3">Select Channel</p>
                    <div className="grid grid-cols-2 gap-2">
                      {WITHDRAWAL_CHANNELS[selectedMethod].map(channel => (
                        <motion.button
                          key={channel.id}
                          onClick={() => setSelectedWithdrawChannel(channel.id)}
                          className={`p-3 rounded-xl text-left transition-all ${
                            selectedWithdrawChannel === channel.id
                              ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white"
                              : "bg-slate-700/50 text-slate-300 border border-white/5"
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <p className="text-sm font-medium truncate">{channel.name}</p>
                          <p className="text-xs opacity-70 mt-1">৳{channel.min}-{channel.max >= 1000 ? `${channel.max/1000}K` : channel.max}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Account Number */}
                <input
                  type="tel"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="Enter 11-digit account number"
                  className="w-full px-4 py-4 bg-slate-800 border border-white/10 rounded-2xl text-lg text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />

                {/* Quick Amounts */}
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_AMOUNTS.map(amt => (
                    <motion.button
                      key={amt}
                      onClick={() => setAmount(amt.toString())}
                      className={`py-3.5 rounded-xl font-medium transition-all ${
                        amount === amt.toString()
                          ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/20"
                          : "bg-slate-800 text-slate-400 border border-white/5"
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      ৳{amt >= 1000 ? `${amt/1000}K` : amt}
                    </motion.button>
                  ))}
                </div>

                {/* Amount Input */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-lg">৳</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-10 pr-12 py-4 bg-slate-800 border border-white/10 rounded-2xl text-lg text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                {/* Withdraw Button */}
                <motion.button
                  onClick={handleWithdraw}
                  disabled={!selectedMethod || !amount || !accountNumber || !selectedWithdrawChannel || isProcessing}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isProcessing && <Loader2 className="animate-spin" size={18} />}
                  {isProcessing ? "Processing..." : "Withdraw Now"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modals */}
      <AnimatePresence>
        {showDepositHistory && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto border-t border-white/10"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
            >
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl p-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ArrowDownRight className="text-emerald-400" size={20} />
                  Deposit History
                </h2>
                <motion.button 
                  onClick={() => setShowDepositHistory(false)} 
                  className="p-2 rounded-xl bg-slate-800"
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} className="text-slate-400" />
                </motion.button>
              </div>
              <div className="p-4 space-y-3">
                {depositTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-slate-500" />
                    </div>
                    <p className="text-slate-400">No deposit history</p>
                  </div>
                ) : (
                  depositTransactions.map((tx, index) => (
                    <TransactionItem3D key={tx.id} tx={tx} index={index} onClick={() => { setSelectedTransaction(tx); setShowTransactionModal(true); }} />
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWithdrawHistory && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto border-t border-white/10"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
            >
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl p-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ArrowUpRight className="text-cyan-400" size={20} />
                  Withdrawal History
                </h2>
                <motion.button 
                  onClick={() => setShowWithdrawHistory(false)} 
                  className="p-2 rounded-xl bg-slate-800"
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} className="text-slate-400" />
                </motion.button>
              </div>
              <div className="p-4 space-y-3">
                {withdrawTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
                      <History className="w-8 h-8 text-slate-500" />
                    </div>
                    <p className="text-slate-400">No withdrawal history</p>
                  </div>
                ) : (
                  withdrawTransactions.map((tx, index) => (
                    <TransactionItem3D key={tx.id} tx={tx} index={index} onClick={() => { setSelectedTransaction(tx); setShowTransactionModal(true); }} />
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Transactions Modal */}
      <AnimatePresence>
        {showAllTransactions && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto border-t border-white/10"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
            >
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl p-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="text-cyan-400" size={20} />
                  All Transactions
                </h2>
                <motion.button 
                  onClick={() => setShowAllTransactions(false)} 
                  className="p-2 rounded-xl bg-slate-800"
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} className="text-slate-400" />
                </motion.button>
              </div>
              <div className="p-4 space-y-3">
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
                      <History className="w-8 h-8 text-slate-500" />
                    </div>
                    <p className="text-slate-400">No transactions yet</p>
                  </div>
                ) : (
                  transactions.map((tx, index) => (
                    <TransactionItem3D key={tx.id} tx={tx} index={index} onClick={() => { setSelectedTransaction(tx); setShowTransactionModal(true); }} />
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agent Recruit Banner */}
      <div className="px-4 py-4 space-y-3">
        {isApprovedAgent && (
          <button
            onClick={() => setShowAgentTransfer(true)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold flex items-center justify-center gap-2 shadow-lg"
          >
            <Send className="w-4 h-4" /> Transfer to User
          </button>
        )}
        <AgentHighlightBanner variant="compact" />
      </div>

      <AgentTransferModal
        open={showAgentTransfer}
        onClose={() => setShowAgentTransfer(false)}
        agentBalance={balance}
        onSuccess={refreshBalance}
      />

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        open={showTransactionModal}
        onOpenChange={setShowTransactionModal}
        transaction={selectedTransaction}
      />

      {/* Deposit Request Form */}
      <TransactionRequestForm
        type="deposit"
        isOpen={showDepositRequest}
        onClose={() => setShowDepositRequest(false)}
        balance={balance}
        onSuccess={refreshBalance}
      />

      {/* Withdraw Request Form */}
      <TransactionRequestForm
        type="withdraw"
        isOpen={showWithdrawRequest}
        onClose={() => setShowWithdrawRequest(false)}
        balance={balance}
        onSuccess={refreshBalance}
      />
    </div>
  );
};

export default Wallet;
