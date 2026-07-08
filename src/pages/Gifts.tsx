import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Gift, Star, Clock, Copy, Check, Sparkles, 
  Calendar, Trophy, Zap, Crown, Percent, Timer, ChevronRight,
  Loader2, PartyPopper, Flame, Diamond
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Floating particle component
const FloatingParticle = (_props: any) => null; // Removed for performance (Final Polish Phase 2)

// Glowing orb component
const GlowingOrb = ({ color, size, position }: { color: string; size: number; position: { top?: string; left?: string; right?: string; bottom?: string } }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl ${color}`}
    style={{ width: size, height: size, ...position }}
    animate={{
      scale: [1, 1.3, 1],
      opacity: [0.3, 0.5, 0.3],
    }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
  />
);

// Glass card component
const GlassCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className={`relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/30 rounded-2xl shadow-xl overflow-hidden ${className}`}
  >
    {/* Holographic shine */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
      animate={{ x: ["-200%", "200%"] }}
      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
    />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

interface BonusCode {
  id: string;
  code: string;
  description: string;
  reward: number;
  minDeposit: number;
  expiresAt: string;
  isActive: boolean;
}

interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  reward: string;
  validUntil: string;
  conditions: string;
}

// Sample bonus codes
const bonusCodes: BonusCode[] = [
  { id: "1", code: "WELCOME100", description: "New user welcome bonus - 100% deposit match", reward: 100, minDeposit: 500, expiresAt: "2026-02-28", isActive: true },
  { id: "2", code: "LUCKY50", description: "Weekend special - 50% extra on deposits", reward: 50, minDeposit: 1000, expiresAt: "2026-01-31", isActive: true },
  { id: "3", code: "VIP200", description: "VIP exclusive - 200% bonus for VIP5+", reward: 200, minDeposit: 2000, expiresAt: "2026-03-15", isActive: true },
  { id: "4", code: "DAILY25", description: "Daily deposit bonus - 25% extra every day", reward: 25, minDeposit: 300, expiresAt: "2026-12-31", isActive: true },
  { id: "5", code: "MEGA500", description: "Mega deposit bonus - 500% for deposits over ৳10,000", reward: 500, minDeposit: 10000, expiresAt: "2026-02-15", isActive: true },
  { id: "6", code: "WINGO20", description: "Win Go special - 20% cashback on Win Go games", reward: 20, minDeposit: 200, expiresAt: "2026-03-01", isActive: true },
  { id: "7", code: "K3BONUS", description: "K3 Game bonus - 30% extra on K3 bets", reward: 30, minDeposit: 500, expiresAt: "2026-02-20", isActive: true },
  { id: "8", code: "NEWYR2026", description: "New Year special - 150% deposit bonus", reward: 150, minDeposit: 1000, expiresAt: "2026-01-31", isActive: true },
];

// Special offers
const specialOffers: SpecialOffer[] = [
  { id: "1", title: "First Deposit Bonus", description: "Get 100% bonus on your first deposit up to ৳5,000", icon: "🎁", gradient: "from-rose-500 to-pink-600", reward: "100% up to ৳5,000", validUntil: "New users only", conditions: "Min deposit ৳500, 5x wagering" },
  { id: "2", title: "Daily Cashback", description: "Get 5% cashback on all losses every day", icon: "💰", gradient: "from-emerald-500 to-teal-600", reward: "5% Cashback", validUntil: "Daily", conditions: "Min loss ৳1,000, credited next day" },
  { id: "3", title: "Referral Bonus", description: "Earn ৳100 for every friend you refer", icon: "👥", gradient: "from-violet-500 to-purple-600", reward: "৳100 per referral", validUntil: "Unlimited", conditions: "Friend must deposit ৳500+" },
  { id: "4", title: "Weekly Tournament", description: "Compete for ৳50,000 prize pool every week", icon: "🏆", gradient: "from-amber-500 to-orange-600", reward: "৳50,000 Pool", validUntil: "Every Sunday", conditions: "Top 10 winners share prize" },
  { id: "5", title: "Lucky Spin Wheel", description: "Spin the wheel daily for free rewards up to ৳1,000", icon: "🎰", gradient: "from-pink-500 to-rose-600", reward: "Up to ৳1,000", validUntil: "Daily", conditions: "One free spin per day" },
  { id: "6", title: "Reload Bonus", description: "Get 50% bonus on every deposit after your first", icon: "🔄", gradient: "from-cyan-500 to-blue-600", reward: "50% Reload", validUntil: "Always", conditions: "Min deposit ৳1,000, 3x wagering" },
  { id: "7", title: "Birthday Bonus", description: "Get a special ৳500 bonus on your birthday", icon: "🎂", gradient: "from-fuchsia-500 to-purple-600", reward: "৳500 Free", validUntil: "On Birthday", conditions: "Verified account required" },
  { id: "8", title: "High Roller Bonus", description: "Exclusive 300% bonus for deposits over ৳50,000", icon: "💎", gradient: "from-indigo-500 to-violet-600", reward: "300% Bonus", validUntil: "Always", conditions: "VIP3+ required, 8x wagering" },
  { id: "9", title: "Loss Recovery", description: "Get 10% back on weekly losses up to ৳10,000", icon: "🛡️", gradient: "from-teal-500 to-emerald-600", reward: "10% Recovery", validUntil: "Weekly", conditions: "Credited every Monday" },
  { id: "10", title: "Mega Jackpot", description: "Win up to ৳1,00,000 in our monthly mega draw", icon: "💵", gradient: "from-yellow-500 to-amber-600", reward: "৳1,00,000", validUntil: "Monthly", conditions: "Every ৳1,000 bet = 1 entry" },
];

// Daily reward tiers
const dailyRewardTiers = [
  { day: 1, reward: 5, icon: "🎁" },
  { day: 2, reward: 10, icon: "💎" },
  { day: 3, reward: 15, icon: "⭐" },
  { day: 4, reward: 20, icon: "🎯" },
  { day: 5, reward: 30, icon: "🔥" },
  { day: 6, reward: 50, icon: "💰" },
  { day: 7, reward: 100, icon: "👑" },
];

const Gifts = () => {
  const navigate = useNavigate();
  const [bonusCodeInput, setBonusCodeInput] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [redeemedCodes, setRedeemedCodes] = useState<string[]>([]);

  useEffect(() => {
    fetchDailyRewardStatus();
    fetchRedeemedCodes();
  }, []);

  const fetchRedeemedCodes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("redeemed_bonus_codes")
      .select("code")
      .eq("user_id", user.id);

    if (data) {
      setRedeemedCodes(data.map(d => d.code.toUpperCase()));
    }
  };

  const fetchDailyRewardStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setUserId(user.id);

    const { data: claims } = await supabase
      .from("daily_login_rewards")
      .select("claim_date, streak_day")
      .eq("user_id", user.id)
      .order("claim_date", { ascending: false })
      .limit(1);

    if (claims && claims.length > 0) {
      const lastClaim = claims[0];
      setLastClaimDate(lastClaim.claim_date);
      setCurrentStreak(lastClaim.streak_day);

      const today = new Date().toISOString().split('T')[0];
      const lastClaimDay = lastClaim.claim_date;
      
      if (lastClaimDay !== today) {
        setCanClaimDaily(true);
        const lastDate = new Date(lastClaimDay);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 1) setCurrentStreak(0);
      }
    } else {
      setCanClaimDaily(true);
      setCurrentStreak(0);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: "Code Copied!", description: `${code} copied to clipboard` });
  };

  const handleRedeemCode = async () => {
    if (!bonusCodeInput.trim()) {
      toast({ title: "Enter Code", description: "Please enter a bonus code", variant: "destructive" });
      return;
    }

    if (!userId) {
      toast({ title: "Login Required", description: "Please login to redeem bonus codes", variant: "destructive" });
      navigate("/login");
      return;
    }

    const codeUpper = bonusCodeInput.trim().toUpperCase();

    if (redeemedCodes.includes(codeUpper)) {
      toast({ title: "Already Redeemed", description: "You have already redeemed this bonus code", variant: "destructive" });
      return;
    }

    setIsRedeeming(true);

    try {
      const foundCode = bonusCodes.find(c => c.code.toUpperCase() === codeUpper && c.isActive);

      if (!foundCode) {
        toast({ title: "Invalid Code", description: "This code is invalid or expired", variant: "destructive" });
        setIsRedeeming(false);
        return;
      }

      if (new Date(foundCode.expiresAt) < new Date()) {
        toast({ title: "Expired Code", description: "This bonus code has expired", variant: "destructive" });
        setIsRedeeming(false);
        return;
      }

      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (!wallet) throw new Error("Wallet not found");

      const rewardAmount = Math.floor((foundCode.reward / 100) * foundCode.minDeposit);

      // Use secure RPC to credit reward
      const { data: result, error: creditError } = await supabase.rpc("credit_reward", {
        p_user_id: userId,
        p_amount: rewardAmount,
        p_reward_type: "bonus_code",
        p_reason: `Bonus Code: ${codeUpper}`,
      });

      const creditResult = result as { success: boolean; new_balance?: number; error?: string } | null;
      if (creditError || !creditResult?.success) {
        throw new Error(creditResult?.error || "Failed to credit bonus");
      }

      const redeemResult = await supabase.from("redeemed_bonus_codes").insert({
        user_id: userId,
        code: codeUpper,
        reward_amount: rewardAmount,
        description: foundCode.description,
      });

      if (redeemResult.error) {
        if (redeemResult.error.code === '23505') {
          toast({ title: "Already Redeemed", description: "You have already redeemed this bonus code", variant: "destructive" });
          return;
        }
        throw redeemResult.error;
      }

      setRedeemedCodes(prev => [...prev, codeUpper]);
      setBonusCodeInput("");
      toast({ title: "🎉 Bonus Redeemed!", description: `৳${rewardAmount} has been added to your wallet!` });

    } catch (error: any) {
      console.error("Error redeeming code:", error);
      toast({ title: "Redemption Failed", description: error.message || "Could not redeem code", variant: "destructive" });
    } finally {
      setIsRedeeming(false);
    }
  };

  const isCodeRedeemed = (code: string) => redeemedCodes.includes(code.toUpperCase());

  const handleClaimDailyReward = async () => {
    if (!userId || !canClaimDaily || isClaimingDaily) return;

    setIsClaimingDaily(true);

    try {
      const newStreakDay = (currentStreak % 7) + 1;
      const rewardAmount = dailyRewardTiers[newStreakDay - 1].reward;
      const today = new Date().toISOString().split('T')[0];

      // Use secure RPC to credit reward
      const { data: result, error: creditError } = await supabase.rpc("credit_reward", {
        p_user_id: userId,
        p_amount: rewardAmount,
        p_reward_type: "daily_login",
        p_reason: `Day ${newStreakDay} Login Reward`,
      });

      const creditResult = result as { success: boolean; new_balance?: number; error?: string } | null;
      if (creditError || !creditResult?.success) {
        throw new Error(creditResult?.error || "Failed to credit reward");
      }

      const claimResult = await supabase.from("daily_login_rewards").insert({
        user_id: userId,
        claim_date: today,
        reward_amount: rewardAmount,
        streak_day: newStreakDay,
      });

      if (claimResult.error) throw claimResult.error;

      setCurrentStreak(newStreakDay);
      setCanClaimDaily(false);
      setLastClaimDate(today);

      toast({
        title: `🎉 Day ${newStreakDay} Reward Claimed!`,
        description: `You received ৳${rewardAmount}! Keep logging in for bigger rewards.`,
      });
    } catch (error: any) {
      console.error("Error claiming daily reward:", error);
      toast({ title: "Claim Failed", description: error.message || "Could not claim reward", variant: "destructive" });
    } finally {
      setIsClaimingDaily(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-24 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <GlowingOrb color="bg-rose-500/30" size={300} position={{ top: "-10%", left: "-10%" }} />
        <GlowingOrb color="bg-purple-500/30" size={400} position={{ top: "30%", right: "-15%" }} />
        <GlowingOrb color="bg-amber-500/20" size={250} position={{ bottom: "10%", left: "20%" }} />
        
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.3} size={3 + Math.random() * 4} />
        ))}
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-r from-rose-600/90 via-pink-600/90 to-fuchsia-600/90 backdrop-blur-xl px-4 py-4 pt-6 border-b border-white/10"
      >
        {/* Animated sparkles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              top: `${20 + Math.random() * 60}%`,
              left: `${10 + Math.random() * 80}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              repeat: Infinity,
            }}
          >
            <Sparkles className="w-3 h-3 text-yellow-300/60" />
          </motion.div>
        ))}

        <div className="flex items-center justify-between mb-4 relative z-10">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Gifts & Rewards
          </h1>
          <div className="w-10" />
        </div>

        {/* Hero Banner */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center pb-4 relative z-10"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-3 border border-white/30"
          >
            <PartyPopper className="w-4 h-4 text-yellow-300" />
            <span className="text-white text-sm font-medium">Exclusive Rewards</span>
          </motion.div>
          <h2 className="text-white text-2xl font-bold mb-1">Claim Your Rewards</h2>
          <p className="text-white/80 text-sm">Bonus codes, daily rewards & special offers</p>
        </motion.div>
      </motion.div>

      {/* Daily Login Rewards */}
      <div className="mx-4 -mt-4 relative z-20">
        <GlassCard className="p-4" delay={0.3}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30"
              >
                <Calendar className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white">Daily Login Rewards</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Collect daily for bigger prizes</p>
              </div>
            </div>
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1.5 rounded-full shadow-lg shadow-rose-500/30"
            >
              Day {currentStreak}/7
            </motion.span>
          </div>

          {/* Reward Tiers */}
          <div className="grid grid-cols-7 gap-1.5 mb-4">
            {dailyRewardTiers.map((tier, index) => {
              const isClaimed = tier.day <= currentStreak;
              const isToday = tier.day === (currentStreak % 7) + 1 && canClaimDaily;
              
              return (
                <motion.div
                  key={tier.day}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  whileHover={{ scale: 1.1, y: -5 }}
                  className={`relative rounded-xl p-2 text-center transition-all cursor-pointer ${
                    isClaimed
                      ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-500/30"
                      : isToday
                        ? "bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-lg shadow-rose-500/30"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                  }`}
                >
                  {isToday && (
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-white/30"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  <span className="text-lg relative z-10">{tier.icon}</span>
                  <p className="text-[10px] font-bold mt-1 relative z-10">৳{tier.reward}</p>
                  <p className="text-[8px] relative z-10">Day {tier.day}</p>
                  {isClaimed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md"
                    >
                      <Check className="w-3 h-3 text-emerald-500" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Claim Button */}
          <motion.button
            whileHover={{ scale: canClaimDaily ? 1.02 : 1 }}
            whileTap={{ scale: canClaimDaily ? 0.98 : 1 }}
            onClick={handleClaimDailyReward}
            disabled={!canClaimDaily || isClaimingDaily || !userId}
            className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 relative overflow-hidden ${
              canClaimDaily
                ? "bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 shadow-lg shadow-rose-500/30"
                : "bg-gray-300 dark:bg-gray-700"
            }`}
          >
            {canClaimDaily && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {isClaimingDaily ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : canClaimDaily ? (
                <>
                  <Gift className="w-5 h-5" />
                  Claim Day {(currentStreak % 7) + 1} Reward (৳{dailyRewardTiers[currentStreak % 7].reward})
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5" />
                  Already Claimed Today
                </>
              )}
            </span>
          </motion.button>
        </GlassCard>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-6 relative z-10">
        <Tabs defaultValue="codes" className="w-full">
          <GlassCard className="p-1 mb-4" delay={0.4}>
            <TabsList className="grid w-full grid-cols-2 bg-transparent gap-1">
              <TabsTrigger 
                value="codes" 
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-rose-500/30 py-3 transition-all"
              >
                <Gift className="w-4 h-4 mr-2" />
                Bonus Codes
              </TabsTrigger>
              <TabsTrigger 
                value="offers"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/30 py-3 transition-all"
              >
                <Zap className="w-4 h-4 mr-2" />
                Special Offers
              </TabsTrigger>
            </TabsList>
          </GlassCard>

          {/* Bonus Codes Tab */}
          <TabsContent value="codes" className="mt-4 space-y-4">
            {/* Redeem Code Input */}
            <GlassCard className="p-4" delay={0.5}>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500" />
                Enter Bonus Code
              </p>
              <div className="flex gap-2">
                <Input
                  value={bonusCodeInput}
                  onChange={(e) => setBonusCodeInput(e.target.value.toUpperCase())}
                  placeholder="Enter code here..."
                  className="flex-1 uppercase bg-white/50 dark:bg-gray-800/50 border-white/30 focus:border-rose-500"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRedeemCode}
                  disabled={isRedeeming}
                  className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 rounded-xl font-medium shadow-lg shadow-rose-500/30 flex items-center gap-2"
                >
                  {isRedeeming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Redeem
                    </>
                  )}
                </motion.button>
              </div>
            </GlassCard>

            {/* Available Codes */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-white/80 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Available Codes
              </p>
              <AnimatePresence>
                {bonusCodes.filter(c => c.isActive).map((code, index) => {
                  const redeemed = isCodeRedeemed(code.code);
                  const rewardAmount = Math.floor((code.reward / 100) * code.minDeposit);
                  
                  return (
                    <motion.div
                      key={code.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                    >
                      <GlassCard className={`p-4 ${redeemed ? 'border-emerald-400/50' : ''}`}>
                        {/* Redeemed Badge */}
                        {redeemed && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-lg"
                          >
                            <Check className="w-3 h-3" />
                            REDEEMED
                          </motion.div>
                        )}
                        
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <motion.div
                                whileHover={{ rotate: 10, scale: 1.1 }}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                                  redeemed 
                                    ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-emerald-500/30' 
                                    : 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-500/30'
                                }`}
                              >
                                {redeemed ? (
                                  <Check className="w-6 h-6 text-white" />
                                ) : (
                                  <Percent className="w-6 h-6 text-white" />
                                )}
                              </motion.div>
                              <div>
                                <p className="font-bold text-gray-800 dark:text-white">{code.reward}% Bonus</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {redeemed ? (
                                    <span className="text-emerald-500">Received ৳{rewardAmount}</span>
                                  ) : (
                                    `Reward: ৳${rewardAmount}`
                                  )}
                                </p>
                              </div>
                            </div>
                            {!redeemed ? (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleCopyCode(code.code)}
                                className="flex items-center gap-1.5 bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-500/20 dark:to-pink-500/20 text-rose-600 dark:text-rose-400 px-3 py-2 rounded-xl text-sm font-bold border border-rose-200 dark:border-rose-500/30"
                              >
                                {copiedCode === code.code ? (
                                  <>
                                    <Check className="w-4 h-4" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4" />
                                    {code.code}
                                  </>
                                )}
                              </motion.button>
                            ) : (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1.5 rounded-xl">
                                ✓ Claimed
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{code.description}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Timer className="w-3 h-3" />
                            Expires: {new Date(code.expiresAt).toLocaleDateString()}
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* Special Offers Tab */}
          <TabsContent value="offers" className="mt-4 space-y-3">
            {specialOffers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <GlassCard className="overflow-hidden">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`bg-gradient-to-r ${offer.gradient} p-4 relative overflow-hidden`}
                  >
                    {/* Animated shine */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
                    />
                    <div className="flex items-center gap-3 relative z-10">
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-4xl"
                      >
                        {offer.icon}
                      </motion.span>
                      <div className="flex-1">
                        <h4 className="text-white font-bold">{offer.title}</h4>
                        <p className="text-white/80 text-sm">{offer.description}</p>
                      </div>
                    </div>
                  </motion.div>
                  <div className="p-4 bg-white/50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Reward</p>
                        <p className="font-bold text-rose-500">{offer.reward}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Valid</p>
                        <p className="font-medium text-gray-700 dark:text-gray-300">{offer.validUntil}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">{offer.conditions}</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg shadow-rose-500/30 flex items-center gap-1"
                      >
                        Claim
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* VIP Exclusive Banner */}
      <div className="mx-4 mt-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/vip")}
          className="relative overflow-hidden bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-2xl p-4 cursor-pointer shadow-xl shadow-amber-500/30"
        >
          {/* Animated sparkles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                top: `${10 + Math.random() * 80}%`,
                left: `${10 + Math.random() * 80}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                delay: i * 0.3,
                repeat: Infinity,
              }}
            >
              <Diamond className="w-3 h-3 text-amber-800/50" />
            </motion.div>
          ))}
          
          <div className="flex items-center gap-3 relative z-10">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-14 h-14 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"
            >
              <Crown className="w-7 h-7 text-amber-800" />
            </motion.div>
            <div className="flex-1">
              <h4 className="font-bold text-amber-900 text-lg">VIP Exclusive Rewards</h4>
              <p className="text-amber-800/80 text-sm">Level up for bigger bonuses!</p>
            </div>
            <ChevronRight className="w-6 h-6 text-amber-800" />
          </div>
        </motion.div>
      </div>

      {/* Info Section */}
      <div className="mx-4 mt-6 pb-8 relative z-10">
        <GlassCard className="p-4 bg-rose-500/10 border-rose-300/30" delay={0.7}>
          <h4 className="font-bold text-rose-400 mb-3 flex items-center gap-2">
            <Star className="w-5 h-5" />
            How It Works
          </h4>
          <ul className="space-y-2.5 text-sm">
            {[
              "Login daily to claim increasing rewards (Day 1-7)",
              "Enter bonus codes during deposit for extra bonuses",
              "Check special offers regularly for limited deals",
              "Higher VIP levels unlock exclusive rewards",
            ].map((item, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-start gap-2 text-gray-300"
              >
                <span className="w-5 h-5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs flex items-center justify-center font-bold mt-0.5 shrink-0">
                  {index + 1}
                </span>
                {item}
              </motion.li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
};

export default Gifts;
