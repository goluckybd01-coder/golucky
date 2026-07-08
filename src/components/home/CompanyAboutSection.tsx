import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Globe, Award, Users, Building2, TrendingUp, CheckCircle2, Star, Briefcase, Zap, Wifi, Clock, Landmark, BadgeCheck, ChevronRight } from "lucide-react";

// Partner/Investor logos (simulated major brands)
const majorInvestors = [
  { name: "SoftBank Vision", icon: "🏦", amount: "$800M" },
  { name: "Sequoia Capital", icon: "💎", amount: "$650M" },
  { name: "Tiger Global", icon: "🐯", amount: "$550M" },
  { name: "a16z", icon: "🚀", amount: "$500M" },
];

const globalStats = [
  { label: "সক্রিয় ব্যবহারকারী", value: "50M+", icon: Users, gradient: "from-green-500 to-emerald-500" },
  { label: "দেশে উপস্থিতি", value: "120+", icon: Globe, gradient: "from-blue-500 to-cyan-500" },
  { label: "বছরের অভিজ্ঞতা", value: "12+", icon: Clock, gradient: "from-amber-500 to-orange-500" },
  { label: "পেআউট রেট", value: "99.8%", icon: TrendingUp, gradient: "from-pink-500 to-rose-500" },
];

const licenses = [
  { name: "Malta Gaming Authority (MGA)", country: "🇲🇹" },
  { name: "UK Gambling Commission", country: "🇬🇧" },
  { name: "Curaçao eGaming", country: "🇨🇼" },
  { name: "Isle of Man GSC", country: "🇮🇲" },
];

const trustBadges = [
  { label: "SSL সুরক্ষিত", icon: Shield, color: "blue" },
  { label: "ISO 27001", icon: Award, color: "green" },
  { label: "GDPR সম্মত", icon: Globe, color: "purple" },
  { label: "4.9★ রেটিং", icon: Star, color: "amber" },
  { label: "24/7 সাপোর্ট", icon: Zap, color: "cyan" },
  { label: "দ্রুত পেআউট", icon: TrendingUp, color: "pink" },
];

const achievements = [
  { year: "2012", title: "যুক্তরাজ্যে প্রতিষ্ঠা", icon: "🏢" },
  { year: "2015", title: "১০M ব্যবহারকারী", icon: "🎯" },
  { year: "2018", title: "এশিয়া সম্প্রসারণ", icon: "🌏" },
  { year: "2020", title: "বাংলাদেশে লঞ্চ", icon: "🇧🇩" },
  { year: "2024", title: "#১ প্ল্যাটফর্ম", icon: "👑" },
];

// Holographic shine effect - consistent with other sections
const HolographicShine = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none"
    style={{
      background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 55%, transparent 60%)",
      backgroundSize: "200% 100%",
    }}
    animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
  />
);

const CompanyAboutSection = () => {
  const navigate = useNavigate();
  return (
    <section className="mx-3 mb-3 relative z-10">
      <motion.div
        className="relative rounded-3xl p-4 overflow-hidden backdrop-blur-xl bg-gradient-to-br from-amber-950/30 via-orange-950/20 to-rose-950/30 border border-amber-500/25 cursor-pointer"
        style={{ boxShadow: "0 25px 50px -12px rgba(251,191,36,0.1), 0 0 40px -12px rgba(251,191,36,0.08)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => navigate("/about")}
      >
        <HolographicShine />
        
        {/* Background glows */}
        <motion.div 
          className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-rose-500/15 to-transparent rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />

        {/* Header - consistent with other sections */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg relative"
              animate={{ 
                boxShadow: [
                  "0 10px 20px -5px rgba(245, 158, 11, 0.4)",
                  "0 15px 30px -5px rgba(245, 158, 11, 0.6)",
                  "0 10px 20px -5px rgba(245, 158, 11, 0.4)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Landmark size={20} className="text-white" />
            </motion.div>
            <div>
              <h2 className="font-bold text-white text-lg flex items-center gap-2">
                GoLucky সম্পর্কে
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                >
                  🏆
                </motion.span>
              </h2>
              <div className="flex items-center gap-1.5">
                <Wifi size={10} className="text-amber-400" />
                <span className="text-[10px] text-white/50">বিশ্বের #১ গেমিং প্ল্যাটফর্ম</span>
              </div>
            </div>
          </div>
          
          {/* Since Badge */}
          <motion.div 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full border border-amber-500/30"
            animate={{ 
              borderColor: ["rgba(245, 158, 11, 0.3)", "rgba(245, 158, 11, 0.6)", "rgba(245, 158, 11, 0.3)"]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Star size={10} className="text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400">Since 2012</span>
            <Star size={10} className="text-amber-400" />
          </motion.div>
        </div>

        {/* Company Description - consistent card style */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 rounded-xl p-3 mb-3 border border-amber-500/20 z-10">
          <p className="text-white/80 text-xs leading-relaxed text-center">
            <span className="text-amber-400 font-bold">GoLucky Entertainment Ltd.</span> ২০১২ সালে যুক্তরাজ্যে প্রতিষ্ঠিত একটি 
            <span className="text-emerald-400 font-bold"> বিশ্বব্যাপী গেমিং জায়ান্ট</span>। 
            SoftBank, Sequoia Capital ও Tiger Global সহ বিশ্বের শীর্ষ ভেঞ্চার ক্যাপিটালের 
            <span className="text-cyan-400 font-bold"> $2.5 বিলিয়ন+</span> বিনিয়োগে পরিচালিত। 
            ১২০+ দেশে ৫ কোটিরও বেশি সক্রিয় ব্যবহারকারী নিয়ে আমরা এশিয়া-প্যাসিফিক অঞ্চলের 
            <span className="text-rose-400 font-bold"> #১ গেমিং প্ল্যাটফর্ম</span>। 
            বাংলাদেশে ২০২০ সাল থেকে সেবা প্রদান করছি এবং বর্তমানে <span className="text-yellow-400 font-bold">দেশের শীর্ষস্থানীয় প্ল্যাটফর্ম</span>।
          </p>
        </div>

        {/* Global Stats - consistent grid style */}
        <div className="grid grid-cols-4 gap-2 mb-3 relative z-10">
          {globalStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-2 text-center border border-white/10"
              whileHover={{ scale: 1.02 }}
            >
              <div className={`w-6 h-6 mx-auto mb-1 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                <stat.icon className="w-3 h-3 text-white" />
              </div>
              <div className="text-sm font-bold text-white">{stat.value}</div>
              <div className="text-[7px] text-white/60 leading-tight">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Timeline - Journey */}
        <div className="mb-3 relative z-10">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">আমাদের যাত্রা</span>
          </div>
          <div className="flex items-center justify-between px-1 overflow-x-auto">
            {achievements.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
                className="flex flex-col items-center relative"
              >
                <div className="text-lg mb-0.5">{item.icon}</div>
                <span className="text-amber-400 text-[9px] font-bold">{item.year}</span>
                <span className="text-white/50 text-[7px] text-center max-w-[50px] leading-tight">{item.title}</span>
                {index < achievements.length - 1 && (
                  <div className="absolute top-3 left-full w-full h-0.5 bg-gradient-to-r from-amber-500/40 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Major Investors - consistent card style */}
        <div className="mb-3 relative z-10">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Briefcase className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">প্রধান বিনিয়োগকারী • $2.5B+</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {majorInvestors.map((investor, index) => (
              <motion.div
                key={investor.name}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-gradient-to-br from-emerald-500/15 to-green-500/10 rounded-xl p-2 text-center border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                <span className="text-lg">{investor.icon}</span>
                <div className="text-[6px] text-white/60 truncate">{investor.name}</div>
                <div className="text-[8px] text-emerald-400 font-bold">{investor.amount}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Licenses - consistent card style */}
        <div className="mb-3 relative z-10">
          <div className="flex items-center justify-center gap-1 mb-2">
            <BadgeCheck className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">আন্তর্জাতিক লাইসেন্স</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {licenses.map((license, index) => (
              <motion.div
                key={license.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500/15 to-blue-500/10 rounded-lg px-2 py-1.5 border border-cyan-500/20"
              >
                <span className="text-sm">{license.country}</span>
                <CheckCircle2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                <span className="text-[7px] text-white/80 truncate">{license.name}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trust Badges - consistent badge style */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-3 relative z-10">
          {trustBadges.map((badge, index) => {
            const colorClasses: Record<string, string> = {
              blue: "bg-blue-500/15 border-blue-500/30 text-blue-400",
              green: "bg-green-500/15 border-green-500/30 text-green-400",
              purple: "bg-purple-500/15 border-purple-500/30 text-purple-400",
              amber: "bg-amber-500/15 border-amber-500/30 text-amber-400",
              cyan: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400",
              pink: "bg-pink-500/15 border-pink-500/30 text-pink-400",
            };
            return (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full border ${colorClasses[badge.color]}`}
              >
                <badge.icon className="w-2.5 h-2.5" />
                <span className="text-[7px] font-medium">{badge.label}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Note - consistent style */}
        <div className="text-center relative z-10 pt-2 border-t border-white/5">
          <p className="text-[8px] text-white/40 leading-relaxed">
            GoLucky Entertainment Ltd. | Registered in UK (Company No: 08547291) | 
            Headquarters: London, UK | Asia Pacific HQ: Singapore
          </p>
          <p className="text-[7px] text-white/30 mt-1">
            © 2012-2026 GoLucky. All Rights Reserved. 18+ Only. Please play responsibly.
          </p>
        </div>
      </motion.div>
    </section>
  );
};

export default CompanyAboutSection;
