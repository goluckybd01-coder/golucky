import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Crown, TrendingUp, Users, Sparkles, ChevronRight, Zap, 
  Diamond, Star, Gift, Wallet, Award, Percent, Target, BadgeCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import goluckyTextLogo from "@/assets/golucky-text-logo-1.png";

const AgentRecruitBanner = () => {
  const navigate = useNavigate();

  const tierHighlights = [
    { tier: "স্টার্টার", deposit: "২ লাখ", commission: "২.০%", color: "from-gray-400 to-gray-500" },
    { tier: "গোল্ড", deposit: "৮ লাখ", commission: "২.৮%", color: "from-yellow-400 to-amber-500" },
    { tier: "মাস্টার", deposit: "২৫ লাখ", commission: "৩.৫%", color: "from-purple-400 to-pink-500" },
  ];

  const benefits = [
    { icon: TrendingUp, text: "রিয়েল-টাইম আয়", color: "text-green-400" },
    { icon: Users, text: "সীমাহীন রেফারেল", color: "text-blue-400" },
    { icon: Zap, text: "তাৎক্ষণিক পেআউট", color: "text-yellow-400" },
    { icon: Award, text: "মাসিক বেতন", color: "text-purple-400" },
    { icon: Wallet, text: "সরাসরি টপআপ", color: "text-cyan-400" },
    { icon: Gift, text: "বোনাস রিওয়ার্ড", color: "text-pink-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-3 mb-4 relative z-10"
    >
      <div 
        className="relative overflow-hidden rounded-2xl p-4 cursor-pointer group"
        onClick={() => navigate("/agent/apply")}
        style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(20,184,166,0.25) 50%, rgba(6,182,212,0.2) 100%)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(16,185,129,0.4)",
        }}
      >
        {/* Animated background glow */}
        <motion.div
          className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 70%)" }}
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.5) 0%, transparent 70%)" }}
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.3, 0.4]
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Holographic shine effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)",
          }}
          animate={{
            x: ["-100%", "200%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut",
          }}
        />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <motion.div className="relative" style={{ perspective: "800px" }}>
                  <motion.div
                    className="absolute inset-0 -z-10"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      background: "radial-gradient(ellipse, rgba(251,191,36,0.5) 0%, transparent 70%)",
                      filter: "blur(12px)",
                      transform: "scale(1.4)",
                    }}
                  />
                  <motion.img
                    src={goluckyTextLogo}
                    alt="GoLucky"
                    className="h-8 w-auto object-contain"
                    animate={{ rotateY: [0, 8, 0, -8, 0], scale: [1, 1.03, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    style={{ 
                      filter: "drop-shadow(0 0 10px rgba(251,191,36,0.8)) drop-shadow(0 0 20px rgba(16,185,129,0.6)) brightness(1.1)" 
                    }}
                  />
                </motion.div>
                <span>এজেন্ট হন</span>
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </motion.span>
              </h3>
              <p className="text-white/70 text-sm">রেফারেল করে প্রতিদিন আয় করুন!</p>
            </div>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden sm:block"
          >
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold shadow-lg shadow-emerald-500/30 rounded-full px-5">
              আবেদন করুন
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </div>

        {/* Tier Cards */}
        <div className="relative z-10 grid grid-cols-3 gap-2 mb-4">
          {tierHighlights.map((tier, index) => (
            <motion.div
              key={tier.tier}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={`relative p-3 rounded-xl overflow-hidden text-center ${
                index === 2 ? "ring-2 ring-emerald-400/50" : ""
              }`}
              style={{
                background: index === 2 
                  ? "linear-gradient(135deg, rgba(16,185,129,0.35) 0%, rgba(6,182,212,0.35) 100%)"
                  : "rgba(255,255,255,0.1)",
                border: index === 2 ? "1px solid rgba(16,185,129,0.5)" : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {index === 2 && (
                <motion.div
                  className="absolute top-1 right-1"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Star className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                </motion.div>
              )}
              <p className="text-[10px] text-white/60 mb-1">{tier.tier}</p>
              <p className="text-xl font-bold text-white">{tier.commission}</p>
              <p className="text-[10px] text-white/50">মিনিমাম ৳{tier.deposit}</p>
            </motion.div>
          ))}
        </div>

        {/* Benefits Grid */}
        <div className="relative z-10 grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <benefit.icon className={`w-4 h-4 ${benefit.color}`} />
              <span className="text-[8px] text-white/70 text-center leading-tight">{benefit.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Mobile Apply Button */}
        <motion.div className="sm:hidden relative z-10">
          <Button className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold shadow-lg shadow-emerald-500/30 rounded-xl py-5">
            <Crown className="w-5 h-5 mr-2" />
            এখনই এজেন্ট হন
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>

        {/* Bottom Info */}
        <div className="relative z-10 flex items-center justify-center gap-4 pt-3 border-t border-white/10 mt-2">
          <div className="flex items-center gap-1.5 text-[10px] text-white/60">
            <BadgeCheck className="w-3.5 h-3.5 text-green-400" />
            <span>ভেরিফাইড</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/60">
            <Target className="w-3.5 h-3.5 text-blue-400" />
            <span>লক্ষ্য বোনাস</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/60">
            <Percent className="w-3.5 h-3.5 text-yellow-400" />
            <span>৩.৫% পর্যন্ত</span>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-3 right-20 opacity-20 pointer-events-none">
          <Diamond className="w-8 h-8 text-teal-400" />
        </div>
      </div>
    </motion.div>
  );
};

export default AgentRecruitBanner;
