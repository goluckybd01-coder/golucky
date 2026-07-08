import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Info, Shield, Award, Users, Sparkles, Star, Heart, Globe, Zap, CheckCircle, Crown } from "lucide-react";
import GlassCard from "@/components/auth/GlassCard";
import Seo from "@/components/seo/Seo";

// Floating particle component
const FloatingParticle = (_props: any) => null; // Removed for performance (Final Polish Phase 2)

// Glowing orb
const GlowingOrb = ({ className, color }: { className?: string; color: string }) => (
  <motion.div 
    className={`absolute rounded-full blur-3xl ${className}`} 
    style={{ background: color }}
    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
  />
);

// Premium holographic shine
const HolographicShine = () => (
  <motion.div
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
    initial={{ x: "-200%" }}
    animate={{ x: "200%" }}
    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
  />
);

// Feature card
const FeatureCard = ({ icon: Icon, title, description, gradient, delay }: { icon: any; title: string; description: string; gradient: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, type: "spring" }}
    whileHover={{ scale: 1.03, y: -5 }}
    className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-5"
  >
    <HolographicShine />
    <div className="relative z-10 flex items-start gap-4">
      <motion.div
        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <Icon size={22} className="text-white" />
      </motion.div>
      <div>
        <h3 className="text-white font-bold mb-1">{title}</h3>
        <p className="text-white/50 text-sm">{description}</p>
      </div>
    </div>
  </motion.div>
);

const About = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Shield, title: "100% Secure", description: "Bank-grade encryption protects your data and transactions", gradient: "from-cyan-500 to-teal-500" },
    { icon: Zap, title: "Instant Payouts", description: "Lightning-fast withdrawals processed within minutes", gradient: "from-amber-500 to-orange-500" },
    { icon: Award, title: "Licensed & Regulated", description: "Fully licensed gaming platform with fair play guarantee", gradient: "from-purple-500 to-pink-500" },
    { icon: Users, title: "24/7 Support", description: "Round-the-clock customer support for all your needs", gradient: "from-emerald-500 to-green-500" },
    { icon: Heart, title: "Responsible Gaming", description: "Tools and resources for safe, responsible gaming", gradient: "from-rose-500 to-red-500" },
    { icon: Globe, title: "Global Community", description: "Join millions of players from around the world", gradient: "from-blue-500 to-indigo-500" },
  ];

  const stats = [
    { value: "1M+", label: "Active Players" },
    { value: "৳500Cr+", label: "Paid Out" },
    { value: "99.9%", label: "Uptime" },
    { value: "4.9★", label: "Rating" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 overflow-hidden">
      <Seo
        title="About GoLucky — Bangladesh's Premium Lottery & Gaming Platform"
        description="Learn about GoLucky: our mission, licensing, security, and why millions trust us for premium lottery, casino, and trading entertainment in BDT."
        path="/about"
      />

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(20,184,166,0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(6,182,212,0.1) 0%, transparent 50%)
          `
        }} />
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <FloatingParticle 
            key={i} 
            delay={i * 0.5} 
            size={Math.random() * 10 + 6}
            left={`${Math.random() * 100}%`}
            duration={Math.random() * 6 + 10}
          />
        ))}
      </div>

      {/* Glowing orbs */}
      <GlowingOrb className="w-[500px] h-[500px] -top-64 -right-64" color="radial-gradient(circle, rgba(20,184,166,0.4) 0%, transparent 70%)" />
      <GlowingOrb className="w-80 h-80 top-1/3 -left-40" color="radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)" />

      {/* Header */}
      <div className="relative pt-6 pb-6 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-600/20 via-teal-600/10 to-transparent" />
        
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex items-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-sm"
          >
            <ArrowLeft size={22} />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Info size={20} className="text-white" />
              </motion.div>
              About Us
            </h1>
            <p className="text-white/50 text-sm mt-1">Learn more about GoLucky</p>
          </div>
        </motion.div>
      </div>

      <div className="px-4 space-y-5">
        {/* Logo & Intro */}
        <GlassCard className="p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="relative inline-block mb-4"
          >
            <motion.div
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto"
              animate={{ 
                boxShadow: ["0 0 30px rgba(20,184,166,0.4)", "0 0 60px rgba(20,184,166,0.6)", "0 0 30px rgba(20,184,166,0.4)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown size={48} className="text-white" />
            </motion.div>
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Star size={24} className="text-amber-400" fill="currentColor" />
            </motion.div>
          </motion.div>
          
          <motion.h2 
            className="text-3xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            GoLucky
          </motion.h2>
          <motion.p 
            className="text-white/60 text-sm leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Bangladesh's #1 trusted gaming platform. We provide a safe, fair, and exciting gaming experience with instant payouts and 24/7 support.
          </motion.p>
        </GlassCard>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-3 text-center"
            >
              <motion.p 
                className="text-xl font-bold text-teal-400"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
              >
                {stat.value}
              </motion.p>
              <p className="text-white/40 text-[10px] mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Features */}
        <div className="space-y-3">
          <h3 className="text-white font-bold flex items-center gap-2 px-1">
            <Sparkles size={18} className="text-amber-400" />
            Why Choose GoLucky?
          </h3>
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} {...feature} delay={0.1 * index} />
          ))}
        </div>

        {/* Version Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center pt-4"
        >
          <p className="text-white/30 text-xs">Version 2.0.1</p>
          <p className="text-white/20 text-[10px] mt-1">© 2024 GoLucky. All rights reserved.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
