import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Crown, TrendingUp, Users, Sparkles, ChevronRight, 
  Zap, Gift, Wallet, Star, Award, DollarSign, Target,
  BadgeCheck, Percent, Rocket, Trophy, Shield, Clock,
  Coins, Heart, CreditCard, Building, Phone, Globe,
  CheckCircle2, ArrowUpRight, Flame, Diamond, Medal,
  Calculator, BookOpen, Headphones, Banknote, PiggyBank,
  UserPlus, TrendingDown, Layers, CircleDollarSign, Gem,
  PartyPopper, Handshake, Timer, Wifi, BriefcaseBusiness
} from "lucide-react";
import { Button } from "@/components/ui/button";
import goluckyTextLogo from "@/assets/golucky-text-logo-1.png";

interface AgentHighlightBannerProps {
  variant?: "full" | "compact" | "mini" | "floating";
  className?: string;
}

const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{count.toLocaleString()}{suffix}</span>;
};

const AgentHighlightBanner = ({ variant = "full", className = "" }: AgentHighlightBannerProps) => {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<'benefits' | 'earnings' | 'process'>('benefits');

  // Extended benefits with categories
  const benefitCategories = [
    {
      title: "💰 আয়ের সুযোগ",
      benefits: [
        { icon: Percent, text: "৩.৫% পর্যন্ত ডিপোজিট কমিশন", desc: "প্রতিটি রেফারেলের ডিপোজিট থেকে", highlight: true },
        { icon: Coins, text: "১.৫% বেটিং ভলিউম কমিশন", desc: "রেফারেলদের প্রতিটি বেট থেকে" },
        { icon: Banknote, text: "৳৫০,০০০+ মাসিক বেতন", desc: "মাস্টার এজেন্টদের জন্য", highlight: true },
        { icon: Gift, text: "মাইলস্টোন বোনাস", desc: "লক্ষ্য পূরণে বিশেষ পুরস্কার" },
        { icon: Trophy, text: "লিডারবোর্ড পুরস্কার", desc: "সেরা পারফর্মারদের জন্য" },
        { icon: PartyPopper, text: "ফেস্টিভাল বোনাস", desc: "ঈদ, পূজা, নববর্ষে বিশেষ" },
      ]
    },
    {
      title: "🛠️ টুলস ও সাপোর্ট",
      benefits: [
        { icon: Headphones, text: "২৪/৭ ডেডিকেটেড সাপোর্ট", desc: "এজেন্ট সাপোর্ট টিম" },
        { icon: Calculator, text: "রিয়েল-টাইম ড্যাশবোর্ড", desc: "আয় ও রেফারেল ট্র্যাকিং" },
        { icon: BookOpen, text: "ট্রেনিং ম্যাটেরিয়াল", desc: "বিনামূল্যে প্রশিক্ষণ" },
        { icon: UserPlus, text: "রিক্রুটমেন্ট টুলস", desc: "QR কোড, লিংক শেয়ার" },
        { icon: BriefcaseBusiness, text: "ডেডিকেটেড ম্যানেজার", desc: "মাস্টার এজেন্টদের জন্য" },
        { icon: Wifi, text: "মোবাইল অ্যাপ এক্সেস", desc: "যেকোনো জায়গা থেকে" },
      ]
    },
    {
      title: "⚡ পেমেন্ট সুবিধা",
      benefits: [
        { icon: Zap, text: "তাৎক্ষণিক পেআউট", desc: "কোন দেরি নেই" },
        { icon: CreditCard, text: "বিকাশ/নগদ পেমেন্ট", desc: "সরাসরি মোবাইলে" },
        { icon: PiggyBank, text: "ইউজার টপআপ সুবিধা", desc: "সরাসরি রেফারেল টপআপ" },
        { icon: CircleDollarSign, text: "কোন হিডেন চার্জ নেই", desc: "১০০% ট্রান্সপারেন্ট" },
        { icon: Timer, text: "দৈনিক উত্তোলন", desc: "প্রতিদিন টাকা তুলুন" },
        { icon: Shield, text: "সিকিউর ট্রানজেকশন", desc: "নিরাপদ লেনদেন" },
      ]
    },
    {
      title: "🌟 এক্সক্লুসিভ সুবিধা",
      benefits: [
        { icon: Users, text: "সীমাহীন রেফারেল", desc: "কোন সীমাবদ্ধতা নেই" },
        { icon: Layers, text: "সাব-এজেন্ট নিয়োগ", desc: "নিজের টিম তৈরি করুন" },
        { icon: Gem, text: "VIP ক্লায়েন্ট এক্সেস", desc: "হাই-রোলার ক্লায়েন্ট" },
        { icon: Handshake, text: "পার্টনারশিপ সুযোগ", desc: "ব্র্যান্ড অ্যাম্বাসেডর" },
        { icon: Award, text: "অ্যাওয়ার্ড প্রোগ্রাম", desc: "বার্ষিক স্বীকৃতি" },
        { icon: Globe, text: "সারাদেশে সার্ভিস", desc: "যেকোনো জেলা থেকে" },
      ]
    },
  ];

  const benefits = benefitCategories.flatMap(cat => cat.benefits).slice(0, 8);

  const megaStats = [
    { value: 50000, label: "মাসিক বেতন", suffix: "+", prefix: "৳", icon: Wallet, color: "from-green-500 to-emerald-500" },
    { value: 3.5, label: "সর্বোচ্চ কমিশন", suffix: "%", prefix: "", icon: Percent, color: "from-yellow-500 to-orange-500" },
    { value: 500, label: "সক্রিয় এজেন্ট", suffix: "+", prefix: "", icon: Users, color: "from-blue-500 to-cyan-500" },
    { value: 10, label: "লাখ+ মাসিক পেআউট", suffix: "", prefix: "৳", icon: Banknote, color: "from-purple-500 to-pink-500" },
  ];

  const tiers = [
    { 
      name: "স্টার্টার", 
      deposit: "২,০০,০০০", 
      depositNum: 200000,
      commission: "২.০%", 
      salary: "১০,০০০",
      bettingComm: "০.৫%",
      color: "from-slate-400 to-slate-500",
      benefits: ["বেসিক ড্যাশবোর্ড", "স্ট্যান্ডার্ড সাপোর্ট", "সাপ্তাহিক পেআউট"],
      potentialEarning: "৫০,০০০+"
    },
    { 
      name: "গোল্ড", 
      deposit: "৮,০০,০০০", 
      depositNum: 800000,
      commission: "২.৮%",
      salary: "৩০,০০০",
      bettingComm: "১.০%",
      color: "from-yellow-400 to-amber-500",
      benefits: ["প্রিমিয়াম ড্যাশবোর্ড", "প্রায়োরিটি সাপোর্ট", "দৈনিক পেআউট"],
      potentialEarning: "১,৫০,০০০+"
    },
    { 
      name: "মাস্টার", 
      deposit: "২৫,০০,০০০", 
      depositNum: 2500000,
      commission: "৩.৫%",
      salary: "৫০,০০০",
      bettingComm: "১.৫%",
      color: "from-purple-400 to-pink-500",
      benefits: ["VIP ড্যাশবোর্ড", "ডেডিকেটেড ম্যানেজার", "ইনস্ট্যান্ট পেআউট", "সাব-এজেন্ট নিয়োগ"],
      potentialEarning: "৫,০০,০০০+"
    },
  ];

  const testimonials = [
    { name: "রহিম মিয়া", tier: "মাস্টার", earning: "৪,৫০,০০০", month: "জানুয়ারি", referrals: 156, growth: "+45%" },
    { name: "করিম সাহেব", tier: "গোল্ড", earning: "১,৮২,০০০", month: "জানুয়ারি", referrals: 89, growth: "+32%" },
    { name: "সালমা বেগম", tier: "মাস্টার", earning: "৩,২০,০০০", month: "জানুয়ারি", referrals: 134, growth: "+28%" },
    { name: "জাহিদ হাসান", tier: "গোল্ড", earning: "২,১০,০০০", month: "জানুয়ারি", referrals: 98, growth: "+55%" },
    { name: "নাসরিন আক্তার", tier: "মাস্টার", earning: "৫,৭৫,০০০", month: "জানুয়ারি", referrals: 203, growth: "+38%" },
  ];

  const processSteps = [
    { step: 1, title: "আবেদন করুন", desc: "ফর্ম পূরণ করে আবেদন জমা দিন", icon: BookOpen, time: "৫ মিনিট" },
    { step: 2, title: "ডিপোজিট করুন", desc: "টায়ার অনুযায়ী ডিপোজিট দিন", icon: Wallet, time: "তাৎক্ষণিক" },
    { step: 3, title: "অনুমোদন পান", desc: "এডমিন দ্বারা যাচাই ও অনুমোদন", icon: CheckCircle2, time: "২৪ ঘন্টায়" },
    { step: 4, title: "আয় শুরু করুন", desc: "রেফারেল করে আয় করতে শুরু করুন", icon: Rocket, time: "সাথে সাথে" },
  ];

  const earningsExamples = [
    { referrals: 10, monthlyDeposit: "৫০,০০০", commission: "১,৭৫০", tier: "স্টার্টার" },
    { referrals: 50, monthlyDeposit: "৫,০০,০০০", commission: "১৭,৫০০", tier: "গোল্ড" },
    { referrals: 100, monthlyDeposit: "১৫,০০,০০০", commission: "৫২,৫০০", tier: "মাস্টার" },
    { referrals: 200, monthlyDeposit: "৫০,০০,০০০", commission: "১,৭৫,০০০", tier: "মাস্টার" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % testimonials.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Floating mini banner for other pages
   if (variant === "floating") {
     return (
       <motion.div
         initial={{ x: 100, opacity: 0 }}
         animate={{ x: 0, opacity: 1 }}
         className={`fixed right-0 top-1/4 z-30 ${className}`}
         style={{ pointerEvents: "none" }}
       >
         <motion.button
           onClick={() => navigate("/agent/apply")}
           className="relative flex items-center gap-2 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 px-4 py-3 rounded-l-2xl shadow-2xl border-l-4 border-yellow-400 clickable force-click"
           whileHover={{ x: -8, scale: 1.02 }}
           whileTap={{ scale: 0.95 }}
           style={{ pointerEvents: "auto" }}
         >
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-l-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          <motion.div
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown className="w-6 h-6 text-yellow-300 drop-shadow-lg" />
          </motion.div>
          <div className="text-left relative z-10">
            <p className="text-white font-bold text-sm flex items-center gap-1">
              এজেন্ট হন
              <Flame className="w-3 h-3 text-yellow-300" />
            </p>
            <p className="text-white/90 text-xs font-medium">৳৫০,০০০+ মাসিক</p>
          </div>
          
          {/* Notification badge */}
           <motion.div
             animate={{ scale: [1, 1.3, 1] }}
             transition={{ duration: 1, repeat: Infinity }}
             className="absolute -top-2 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg decorative"
             style={{ pointerEvents: "none" }}
           >
            HOT
          </motion.div>
        </motion.button>
      </motion.div>
    );
  }

  // Mini banner for bottom of pages - ENHANCED
  if (variant === "mini") {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`mx-4 ${className}`}
      >
        <motion.div
          onClick={() => navigate("/agent/apply")}
          className="relative overflow-hidden rounded-2xl cursor-pointer"
          style={{
            background: "linear-gradient(135deg, rgba(251,146,60,0.2) 0%, rgba(236,72,153,0.2) 50%, rgba(139,92,246,0.2) 100%)",
            border: "1px solid rgba(251,146,60,0.3)",
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Animated shine */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)" }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
          />
          
          <div className="relative z-10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Crown className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <p className="font-bold text-sm flex items-center gap-2">
                    <span className="text-white">🔥 এজেন্ট হয়ে লাখ টাকা আয় করুন!</span>
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-green-400 font-semibold">৳৫০,০০০+</span>
                    <span>মাসিক বেতন</span>
                    <span className="text-yellow-400">•</span>
                    <span className="text-yellow-400 font-semibold">৩.৫%</span>
                    <span>কমিশন</span>
                  </div>
                </div>
              </div>
              <Button size="sm" className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-full shadow-lg">
                আবেদন
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            {/* Quick stats */}
            <div className="flex items-center justify-around mt-3 pt-3 border-t border-white/10">
              <div className="text-center">
                <p className="text-yellow-400 font-bold text-sm">৩.৫%</p>
                <p className="text-[10px] text-muted-foreground">কমিশন</p>
              </div>
              <div className="text-center">
                <p className="text-green-400 font-bold text-sm">৫০K+</p>
                <p className="text-[10px] text-muted-foreground">মাসিক বেতন</p>
              </div>
              <div className="text-center">
                <p className="text-blue-400 font-bold text-sm">২৪/৭</p>
                <p className="text-[10px] text-muted-foreground">সাপোর্ট</p>
              </div>
              <div className="text-center">
                <p className="text-purple-400 font-bold text-sm">∞</p>
                <p className="text-[10px] text-muted-foreground">রেফারেল</p>
              </div>
            </div>

            {/* Mini testimonial */}
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 bg-green-500 rounded-full"
              />
              <p className="text-[10px] text-white/60">
                এইমাত্র <span className="text-green-400 font-bold">নাসরিন আক্তার</span> ৳৫,৭৫,০০০ আয় করেছেন!
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Compact banner for sidebars - ENHANCED
  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${className}`}
      >
        <div
          onClick={() => navigate("/agent/apply")}
          className="relative overflow-hidden rounded-xl cursor-pointer"
          style={{
            background: "linear-gradient(135deg, rgba(251,146,60,0.25) 0%, rgba(236,72,153,0.25) 50%, rgba(139,92,246,0.25) 100%)",
            border: "1px solid rgba(251,146,60,0.4)",
          }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
          />
          
          <div className="relative z-10 p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crown className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1">
                  🔥 এজেন্ট প্রোগ্রাম
                </h3>
                <p className="text-[10px] text-green-400 font-semibold">৳৫০,০০০+ মাসিক আয়</p>
              </div>
            </div>

            {/* Key highlights */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <p className="text-lg font-black text-yellow-400">৩.৫%</p>
                <p className="text-[9px] text-white/60">সর্বোচ্চ কমিশন</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <p className="text-lg font-black text-green-400">৳৫০K</p>
                <p className="text-[9px] text-white/60">মাসিক বেতন</p>
              </div>
            </div>
            
            {/* Benefits */}
            <ul className="space-y-1.5 mb-3">
              {[
                { icon: Percent, text: "প্রতি ডিপোজিটে ৩.৫% কমিশন", color: "text-yellow-400" },
                { icon: Banknote, text: "নিশ্চিত মাসিক বেতন", color: "text-green-400" },
                { icon: Zap, text: "তাৎক্ষণিক পেমেন্ট", color: "text-blue-400" },
                { icon: Users, text: "সীমাহীন রেফারেল সুযোগ", color: "text-purple-400" },
              ].map((benefit, i) => (
                <motion.li
                  key={i}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-2 text-xs"
                >
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                    <benefit.icon className={`w-3 h-3 ${benefit.color}`} />
                  </div>
                  <span className="text-white/90">{benefit.text}</span>
                </motion.li>
              ))}
            </ul>
            
            {/* Tier preview */}
            <div className="flex gap-1 mb-3">
              {tiers.map((tier, i) => (
                <div key={i} className={`flex-1 text-center p-2 rounded-lg ${i === 2 ? 'bg-gradient-to-br from-orange-500/20 to-pink-500/20 ring-1 ring-yellow-500/50' : 'bg-white/5'}`}>
                  <p className="text-[9px] text-muted-foreground">{tier.name}</p>
                  <p className="text-sm font-bold text-white">{tier.commission}</p>
                  {i === 2 && <p className="text-[8px] text-yellow-400">সেরা!</p>}
                </div>
              ))}
            </div>

            {/* Quick earnings example */}
            <div className="bg-green-500/10 rounded-lg p-2 mb-3 border border-green-500/20">
              <p className="text-[10px] text-green-400 text-center">
                ১০০ রেফারেল = <span className="font-bold text-white">৳৫২,৫০০+ মাসিক</span> আয়!
              </p>
            </div>
            
            <Button 
              size="sm" 
              className="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 shadow-lg"
              onClick={() => navigate("/agent/apply")}
            >
              <Rocket className="w-4 h-4 mr-1" />
              এখনই আবেদন করুন
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Full banner (default) - MEGA ENHANCED VERSION
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-3 mb-4 ${className}`}
    >
      <div
        className="relative overflow-hidden rounded-3xl"
        style={{
          background: "linear-gradient(135deg, rgba(251,146,60,0.15) 0%, rgba(236,72,153,0.15) 25%, rgba(139,92,246,0.15) 50%, rgba(59,130,246,0.15) 75%, rgba(16,185,129,0.15) 100%)",
          border: "2px solid rgba(251,146,60,0.3)",
        }}
      >
        {/* Multiple animated backgrounds */}
        <motion.div
          className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(251,146,60,0.5) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.4, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)" }}
          animate={{ scale: [1.3, 1, 1.3], rotate: [360, 180, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.25) 50%, transparent 80%)" }}
          animate={{ x: ["-150%", "250%"] }}
          transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
        />

        <div className="relative z-10 p-5">
          {/* Top Badge */}
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500/30 to-orange-500/30 px-4 py-1.5 rounded-full border border-red-500/50"
            >
              <motion.span
                animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Flame className="w-4 h-4 text-orange-400" />
              </motion.span>
              <span className="text-xs font-bold text-yellow-400">🎉 সীমিত সময়ের অফার - এখনই যোগ দিন!</span>
              <motion.span
                animate={{ scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: 0.25 }}
              >
                <Flame className="w-4 h-4 text-orange-400" />
              </motion.span>
            </motion.div>
          </div>

          {/* Header */}
          <div className="text-center mb-5">
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 shadow-2xl mb-3"
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Crown className="w-10 h-10 text-white drop-shadow-lg" />
            </motion.div>
            <h2 className="text-2xl font-black text-white mb-1 flex items-center justify-center gap-3">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              <motion.div className="relative" style={{ perspective: "1000px" }}>
                <motion.div
                  className="absolute inset-0 -z-10"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    background: "radial-gradient(ellipse, rgba(251,191,36,0.6) 0%, rgba(16,185,129,0.4) 50%, transparent 70%)",
                    filter: "blur(20px)",
                    transform: "scale(1.6)",
                  }}
                />
                <motion.img
                  src={goluckyTextLogo}
                  alt="GoLucky"
                  className="h-12 w-auto object-contain"
                  animate={{ rotateY: [0, 10, 0, -10, 0], rotateX: [0, 3, 0, -3, 0], scale: [1, 1.06, 1] }}
                  transition={{ duration: 3.5, repeat: Infinity }}
                  style={{ 
                    filter: "drop-shadow(0 0 15px rgba(251,191,36,0.9)) drop-shadow(0 0 30px rgba(16,185,129,0.7)) drop-shadow(0 0 50px rgba(251,191,36,0.5)) brightness(1.15) contrast(1.05)" 
                  }}
                />
              </motion.div>
              <span className="text-xl">এজেন্ট হন</span>
              <Diamond className="w-6 h-6 text-yellow-400" />
            </h2>
            <p className="text-white/80 text-sm">বাংলাদেশের সবচেয়ে লাভজনক এজেন্ট প্রোগ্রাম!</p>
            <p className="text-green-400 text-xs mt-1 font-medium">৫০০+ সক্রিয় এজেন্ট | ৳১০ লাখ+ মাসিক পেআউট</p>
          </div>

          {/* Mega Stats */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {megaStats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05, y: -3 }}
                className="relative text-center p-3 rounded-xl bg-white/5 border border-white/10 overflow-hidden cursor-pointer"
              >
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10`}
                  animate={{ opacity: [0.1, 0.25, 0.1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <stat.icon className="w-5 h-5 mx-auto mb-1 text-white/70" />
                <p className="text-lg font-black text-white">
                  {stat.prefix}{stat.value > 0 ? <AnimatedCounter value={stat.value} suffix={stat.suffix} /> : stat.suffix}
                </p>
                <p className="text-[9px] text-white/60">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center gap-2 mb-4">
            {[
              { key: 'benefits', label: '🎁 সুবিধাসমূহ', icon: Gift },
              { key: 'earnings', label: '💰 আয়ের হিসাব', icon: Calculator },
              { key: 'process', label: '📋 প্রক্রিয়া', icon: BookOpen },
            ].map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'benefits' && (
              <motion.div
                key="benefits"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-5"
              >
                {/* Benefits by Category */}
                {benefitCategories.map((category, catIdx) => (
                  <div key={catIdx} className="mb-4">
                    <h4 className="text-sm font-bold text-white/80 mb-2">{category.title}</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {category.benefits.map((benefit, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (catIdx * 6 + i) * 0.03 }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all border ${
                            benefit.highlight 
                              ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30' 
                              : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                            <benefit.icon className={`w-4 h-4 ${benefit.highlight ? 'text-yellow-400' : 'text-white/70'}`} />
                          </div>
                          <span className="text-[9px] text-white/90 text-center font-medium leading-tight">{benefit.text}</span>
                          <span className="text-[8px] text-white/50 text-center leading-tight">{benefit.desc}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'earnings' && (
              <motion.div
                key="earnings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-5"
              >
                {/* Earnings Calculator Preview */}
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20 mb-4">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-green-400" />
                    আয়ের উদাহরণ
                  </h4>
                  <div className="space-y-2">
                    {earningsExamples.map((example, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center text-xs font-bold text-green-400">
                            {example.referrals}
                          </div>
                          <div>
                            <p className="text-[10px] text-white/60">রেফারেল</p>
                            <p className="text-xs text-white/80">মাসিক ডিপোজিট: ৳{example.monthlyDeposit}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-400">৳{example.commission}</p>
                          <p className="text-[9px] text-white/50">{example.tier} টায়ার</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Income Breakdown */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-sm font-bold text-white mb-3">💎 মাস্টার এজেন্ট হলে আপনি পাবেন:</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-yellow-500/10 rounded-lg">
                      <span className="text-xs text-white/80">ডিপোজিট কমিশন (৩.৫%)</span>
                      <span className="text-sm font-bold text-yellow-400">৳৮৭,৫০০</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-blue-500/10 rounded-lg">
                      <span className="text-xs text-white/80">বেটিং কমিশন (১.৫%)</span>
                      <span className="text-sm font-bold text-blue-400">৳৩৭,৫০০</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-green-500/10 rounded-lg">
                      <span className="text-xs text-white/80">মাসিক বেতন</span>
                      <span className="text-sm font-bold text-green-400">৳৫০,০০০</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-lg border border-orange-500/30">
                      <span className="text-sm font-bold text-white">মোট মাসিক আয়</span>
                      <span className="text-xl font-black text-orange-400">৳১,৭৫,০০০+</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/50 text-center mt-2">
                    *১০০ সক্রিয় রেফারেল এবং ৳২৫ লাখ মাসিক ডিপোজিটের ভিত্তিতে
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'process' && (
              <motion.div
                key="process"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-5"
              >
                <h4 className="text-sm font-bold text-white mb-3 text-center">📋 কিভাবে এজেন্ট হবেন?</h4>
                <div className="grid grid-cols-4 gap-2">
                  {processSteps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="relative text-center p-3 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="absolute -top-2 -left-1 w-5 h-5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
                        {step.step}
                      </div>
                      <step.icon className="w-6 h-6 mx-auto mb-2 text-white/70" />
                      <p className="text-[10px] font-bold text-white mb-1">{step.title}</p>
                      <p className="text-[8px] text-white/50">{step.desc}</p>
                      <p className="text-[8px] text-green-400 mt-1">{step.time}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Quick FAQ */}
                <div className="mt-4 bg-white/5 rounded-xl p-3 border border-white/10">
                  <h5 className="text-xs font-bold text-white mb-2">❓ সাধারণ প্রশ্ন</h5>
                  <div className="space-y-2 text-[10px]">
                    <div className="flex gap-2">
                      <span className="text-yellow-400">প্র:</span>
                      <span className="text-white/80">ন্যূনতম ডিপোজিট কত?</span>
                    </div>
                    <div className="flex gap-2 ml-3">
                      <span className="text-green-400">উ:</span>
                      <span className="text-white/60">স্টার্টার টায়ারের জন্য ৳২,০০,০০০</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-yellow-400">প্র:</span>
                      <span className="text-white/80">কত দিনে টাকা তোলা যায়?</span>
                    </div>
                    <div className="flex gap-2 ml-3">
                      <span className="text-green-400">উ:</span>
                      <span className="text-white/60">প্রতিদিন উত্তোলন করতে পারবেন</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tier Cards - Enhanced */}
          <div className="mb-5">
            <h3 className="text-center text-sm font-bold text-white/80 mb-3 flex items-center justify-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              এজেন্ট টায়ার সিস্টেম
              <Star className="w-4 h-4 text-yellow-400" />
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {tiers.map((tier, index) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.15 }}
                  whileHover={{ scale: 1.03, y: -3 }}
                  className={`relative p-3 rounded-xl overflow-hidden ${
                    index === 2 ? "ring-2 ring-yellow-400/60" : ""
                  }`}
                  style={{
                    background: index === 2 
                      ? "linear-gradient(135deg, rgba(251,146,60,0.35) 0%, rgba(168,85,247,0.35) 100%)"
                      : "rgba(255,255,255,0.08)",
                    border: index === 2 ? "1px solid rgba(251,146,60,0.6)" : "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {/* Best value badge */}
                  {index === 2 && (
                    <motion.div
                      className="absolute -top-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-[8px] font-bold px-2 py-0.5 rounded-full text-white"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      🏆 সেরা
                    </motion.div>
                  )}
                  
                  <div className={`w-8 h-8 mx-auto rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center mb-2 ${index === 2 ? 'mt-2' : ''}`}>
                    {index === 0 && <Medal className="w-4 h-4 text-white" />}
                    {index === 1 && <Trophy className="w-4 h-4 text-white" />}
                    {index === 2 && <Crown className="w-4 h-4 text-white" />}
                  </div>
                  
                  <p className="text-[10px] text-white/60 text-center">{tier.name}</p>
                  <p className="text-2xl font-black text-white text-center">{tier.commission}</p>
                  <p className="text-[9px] text-white/50 text-center mb-2">ডিপোজিট কমিশন</p>
                  
                  <div className="space-y-1 pt-2 border-t border-white/10">
                    <p className="text-[9px] text-center">
                      <span className="text-white/50">বেটিং:</span>
                      <span className="text-blue-400 font-bold ml-1">{tier.bettingComm}</span>
                    </p>
                    <p className="text-[9px] text-center">
                      <span className="text-white/50">বেতন:</span>
                      <span className="text-green-400 font-bold ml-1">৳{tier.salary}</span>
                    </p>
                    <p className="text-[9px] text-center text-white/50">
                      ডিপোজিট: ৳{tier.deposit}
                    </p>
                    <p className="text-[8px] text-center text-orange-400 font-medium pt-1">
                      সম্ভাব্য আয়: ৳{tier.potentialEarning}/মাস
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Live Earnings Testimonial - Enhanced */}
          <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-green-500/15 to-emerald-500/15 border border-green-500/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"
                />
                <span className="text-xs text-green-400 font-bold">🔴 লাইভ এজেন্ট আয়</span>
              </div>
              <span className="text-[9px] text-white/50">প্রতি ৩ সেকেন্ডে আপডেট</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg ring-2 ring-green-500/50">
                    {testimonials[activeSlide].name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{testimonials[activeSlide].name}</p>
                    <p className="text-[10px] text-white/50">
                      {testimonials[activeSlide].tier} এজেন্ট • {testimonials[activeSlide].referrals} রেফারেল
                    </p>
                    <p className="text-[10px] text-white/40">{testimonials[activeSlide].month} মাসে আয়</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-green-400">৳{testimonials[activeSlide].earning}</p>
                  <p className="text-xs text-green-500 flex items-center gap-1 justify-end font-medium">
                    <TrendingUp className="w-3 h-3" />
                    {testimonials[activeSlide].growth}
                  </p>
                  <p className="text-[9px] text-white/40 flex items-center gap-1 justify-end mt-0.5">
                    <BadgeCheck className="w-3 h-3 text-blue-400" />
                    ভেরিফাইড
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Dots indicator */}
            <div className="flex justify-center gap-1.5 mt-3">
              {testimonials.map((_, i) => (
                <motion.div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeSlide ? "bg-green-400 w-4" : "bg-white/30 w-1.5"
                  }`}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/agent/apply")}
          >
            <Button className="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white font-bold shadow-2xl rounded-xl py-7 text-lg relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Crown className="w-6 h-6" />
                এখনই এজেন্ট আবেদন করুন
                <ArrowUpRight className="w-5 h-5" />
              </span>
            </Button>
          </motion.div>

          {/* Bottom Trust Badges */}
          <div className="flex items-center justify-center flex-wrap gap-4 pt-4 mt-4 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-[10px] text-white/60">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>১০০% নিরাপদ</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/60">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>ভেরিফাইড পেমেন্ট</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/60">
              <Phone className="w-4 h-4 text-purple-400" />
              <span>২৪/৭ সাপোর্ট</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/60">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>সারাদেশে সার্ভিস</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/60">
              <Users className="w-4 h-4 text-orange-400" />
              <span>৫০০+ সক্রিয় এজেন্ট</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AgentHighlightBanner;
