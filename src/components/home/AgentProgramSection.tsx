import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  TrendingUp, 
  Gift, 
  Zap, 
  Crown, 
  Star, 
  Sparkles,
  ArrowRight,
  Wallet,
  Trophy
} from "lucide-react";

// Agent tier data
const AGENT_TIERS = [
  { tier: 1, name: "Bronze", color: "from-amber-600 to-amber-700", icon: "🥉", commission: "5%" },
  { tier: 2, name: "Silver", color: "from-slate-400 to-slate-500", icon: "🥈", commission: "7%" },
  { tier: 3, name: "Gold", color: "from-yellow-400 to-amber-500", icon: "🥇", commission: "10%" },
  { tier: 4, name: "Platinum", color: "from-cyan-400 to-blue-500", icon: "💎", commission: "12%" },
  { tier: 5, name: "Diamond", color: "from-violet-400 to-purple-600", icon: "👑", commission: "15%" },
  { tier: 6, name: "Elite", color: "from-rose-400 to-pink-600", icon: "⭐", commission: "18%" },
  { tier: 7, name: "Legend", color: "from-amber-400 via-yellow-500 to-orange-500", icon: "🏆", commission: "20%" },
];

// Simulated live stats
const generateStats = () => ({
  totalAgents: Math.floor(Math.random() * 500) + 2500,
  todayPayout: Math.floor(Math.random() * 500000) + 1500000,
  topEarner: Math.floor(Math.random() * 100000) + 200000,
  activeReferrals: Math.floor(Math.random() * 2000) + 8000,
});

const formatAmount = (amount: number): string => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return amount.toLocaleString();
};

const AgentProgramSection = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(generateStats());
  const [currentTierIndex, setCurrentTierIndex] = useState(0);
  const [isLive, setIsLive] = useState(true);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(generateStats());
      setIsLive(false);
      setTimeout(() => setIsLive(true), 100);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Rotate through tiers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTierIndex(prev => (prev + 1) % AGENT_TIERS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const currentTier = AGENT_TIERS[currentTierIndex];

  return (
    <section className="mx-3 mb-4">
      <motion.div
        className="relative rounded-3xl overflow-hidden cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onClick={() => navigate("/agent")}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2a1a] via-[#0a3a2a] to-[#0a2a2a]" />
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: "radial-gradient(circle at 30% 20%, rgba(16, 185, 129, 0.4) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)"
          }}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        
        {/* Holographic shine */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 55%, transparent 60%)",
            backgroundSize: "200% 100%",
          }}
          animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative z-10 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg"
                animate={{ 
                  boxShadow: [
                    "0 10px 20px -5px rgba(16, 185, 129, 0.4)",
                    "0 15px 30px -5px rgba(16, 185, 129, 0.6)",
                    "0 10px 20px -5px rgba(16, 185, 129, 0.4)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Users size={24} className="text-white" />
              </motion.div>
              <div>
                <h2 className="font-bold text-white text-lg flex items-center gap-2">
                  Agent Program
                  <motion.span
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                  >
                    💼
                  </motion.span>
                </h2>
                <p className="text-emerald-300/70 text-xs">আনলিমিটেড কমিশন আয় করুন</p>
              </div>
            </div>

            {/* Live Badge */}
            <motion.div 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full border border-emerald-500/30"
              animate={{ 
                borderColor: isLive 
                  ? ["rgba(16, 185, 129, 0.3)", "rgba(16, 185, 129, 0.8)", "rgba(16, 185, 129, 0.3)"] 
                  : "rgba(16, 185, 129, 0.3)"
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <motion.div 
                className="w-2 h-2 bg-emerald-500 rounded-full"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-[10px] font-bold text-emerald-400">LIVE</span>
            </motion.div>
          </div>

          {/* Live Stats Grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <motion.div 
              className="bg-black/30 rounded-xl p-2.5 text-center backdrop-blur-sm border border-white/5"
              whileHover={{ scale: 1.02 }}
            >
              <Users size={16} className="mx-auto text-emerald-400 mb-1" />
              <motion.p 
                className="text-emerald-300 text-sm font-bold"
                key={stats.totalAgents}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
              >
                {formatAmount(stats.totalAgents)}
              </motion.p>
              <p className="text-white/50 text-[8px] mt-0.5">মোট এজেন্ট</p>
            </motion.div>

            <motion.div 
              className="bg-black/30 rounded-xl p-2.5 text-center backdrop-blur-sm border border-white/5"
              whileHover={{ scale: 1.02 }}
            >
              <Wallet size={16} className="mx-auto text-cyan-400 mb-1" />
              <motion.p 
                className="text-cyan-300 text-sm font-bold"
                key={stats.todayPayout}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
              >
                ৳{formatAmount(stats.todayPayout)}
              </motion.p>
              <p className="text-white/50 text-[8px] mt-0.5">আজকের পেআউট</p>
            </motion.div>

            <motion.div 
              className="bg-black/30 rounded-xl p-2.5 text-center backdrop-blur-sm border border-white/5"
              whileHover={{ scale: 1.02 }}
            >
              <Trophy size={16} className="mx-auto text-yellow-400 mb-1" />
              <motion.p 
                className="text-yellow-300 text-sm font-bold"
                key={stats.topEarner}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
              >
                ৳{formatAmount(stats.topEarner)}
              </motion.p>
              <p className="text-white/50 text-[8px] mt-0.5">টপ আর্নার</p>
            </motion.div>

            <motion.div 
              className="bg-black/30 rounded-xl p-2.5 text-center backdrop-blur-sm border border-white/5"
              whileHover={{ scale: 1.02 }}
            >
              <TrendingUp size={16} className="mx-auto text-pink-400 mb-1" />
              <motion.p 
                className="text-pink-300 text-sm font-bold"
                key={stats.activeReferrals}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
              >
                {formatAmount(stats.activeReferrals)}
              </motion.p>
              <p className="text-white/50 text-[8px] mt-0.5">অ্যাক্টিভ রেফারেল</p>
            </motion.div>
          </div>

          {/* 7 Tier System Showcase */}
          <div className="bg-black/20 rounded-xl p-3 mb-4 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <Crown size={14} className="text-yellow-400" />
                7 টায়ার কমিশন সিস্টেম
              </h3>
              <motion.div
                className={`px-2.5 py-1 rounded-full bg-gradient-to-r ${currentTier.color} text-white text-[10px] font-bold flex items-center gap-1`}
                key={currentTierIndex}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <span>{currentTier.icon}</span>
                <span>{currentTier.name}</span>
                <span className="ml-1 bg-white/20 px-1.5 rounded">{currentTier.commission}</span>
              </motion.div>
            </div>

            {/* Tier Progress Bar */}
            <div className="flex gap-1 mb-3">
              {AGENT_TIERS.map((tier, idx) => (
                <motion.div
                  key={tier.tier}
                  className={`flex-1 h-2 rounded-full bg-gradient-to-r ${tier.color} ${
                    idx <= currentTierIndex ? 'opacity-100' : 'opacity-30'
                  }`}
                  animate={idx === currentTierIndex ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5 }}
                />
              ))}
            </div>

            {/* Tier Icons Row */}
            <div className="flex justify-between px-1">
              {AGENT_TIERS.map((tier, idx) => (
                <motion.div
                  key={tier.tier}
                  className={`text-center ${idx === currentTierIndex ? 'opacity-100' : 'opacity-40'}`}
                  animate={idx === currentTierIndex ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <span className="text-lg">{tier.icon}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <motion.div 
              className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-xl p-3 border border-emerald-500/20"
              whileHover={{ x: 3 }}
            >
              <div className="w-10 h-10 bg-emerald-500/30 rounded-lg flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <p className="text-white font-semibold text-xs">আনলিমিটেড কমিশন</p>
                <p className="text-emerald-300/60 text-[9px]">কোনো সীমা নেই</p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center gap-2.5 bg-gradient-to-r from-cyan-500/20 to-transparent rounded-xl p-3 border border-cyan-500/20"
              whileHover={{ x: 3 }}
            >
              <div className="w-10 h-10 bg-cyan-500/30 rounded-lg flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <p className="text-white font-semibold text-xs">তাৎক্ষণিক পেমেন্ট</p>
                <p className="text-cyan-300/60 text-[9px]">রিয়েল-টাইম ক্রেডিট</p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center gap-2.5 bg-gradient-to-r from-purple-500/20 to-transparent rounded-xl p-3 border border-purple-500/20"
              whileHover={{ x: 3 }}
            >
              <div className="w-10 h-10 bg-purple-500/30 rounded-lg flex items-center justify-center">
                <span className="text-xl">🎁</span>
              </div>
              <div>
                <p className="text-white font-semibold text-xs">মাসিক বোনাস</p>
                <p className="text-purple-300/60 text-[9px]">টপ পারফর্মার পুরস্কার</p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center gap-2.5 bg-gradient-to-r from-amber-500/20 to-transparent rounded-xl p-3 border border-amber-500/20"
              whileHover={{ x: 3 }}
            >
              <div className="w-10 h-10 bg-amber-500/30 rounded-lg flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <p className="text-white font-semibold text-xs">ড্যাশবোর্ড</p>
                <p className="text-amber-300/60 text-[9px]">রিয়েল-টাইম ট্র্যাকিং</p>
              </div>
            </motion.div>
          </div>

          {/* Commission Highlight */}
          <motion.div 
            className="bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 rounded-xl p-3 mb-4 border border-yellow-500/30"
            animate={{ 
              borderColor: ["rgba(234, 179, 8, 0.3)", "rgba(234, 179, 8, 0.6)", "rgba(234, 179, 8, 0.3)"]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-yellow-400" />
                <span className="text-white text-sm">ডিপোজিট + বেটিং</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 font-bold text-lg">20%</span>
                <span className="text-white/60 text-xs">পর্যন্ত কমিশন</span>
              </div>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.button
            onClick={() => navigate("/agent/apply")}
            className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold text-base py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            <span className="relative z-10">এজেন্ট হিসেবে যোগ দিন</span>
            <ArrowRight size={18} className="relative z-10" />
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
};

export default AgentProgramSection;
