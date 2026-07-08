import { motion } from "framer-motion";
import { Volume2, Flame, Megaphone, Sparkles, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PremiumAnnouncementBarProps {
  messages?: string[];
}

const PremiumAnnouncementBar = ({
  messages = [
    "🎉 GoLucky তে স্বাগতম! দ্রুত উইথড্রল, নিরাপদ প্ল্যাটফর্ম।",
    "💰 এখনই ডিপোজিট করুন এবং ১০০% বোনাস পান!",
    "🏆 প্রতিদিন ৳৫০,০০০ প্রাইজ পুলে লাকি ড্র!",
    "🔥 মাস্টার এজেন্ট হয়ে ৳৫০,০০০+ মাসিক আয় করুন!",
  ],
}: PremiumAnnouncementBarProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="mx-3 mb-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="relative bg-gradient-to-r from-[#12122a] via-[#1a1a35] to-[#12122a] rounded-2xl px-3 py-3 flex items-center gap-3 shadow-xl shadow-amber-500/10 border border-amber-500/40 overflow-hidden">
        <motion.div
          className="absolute inset-0 decorative"
          style={{
            background: "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(139,92,246,0.05) 50%, rgba(251,191,36,0.15) 100%)",
          }}
        />
        <motion.div
          className="absolute inset-0 decorative"
          style={{ 
            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)",
          }}
          animate={{
            x: ["-100%", "200%"],
          }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 overflow-hidden decorative">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-amber-400 rounded-full"
              animate={{
                opacity: [0, 1, 0],
                y: [20, -20],
                x: [0, 10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
              }}
              style={{ 
                left: `${20 + i * 30}%`,
                top: "80%",
              }}
            />
          ))}
        </div>
        <motion.div 
          className="relative z-10 flex-shrink-0"
          whileHover={{ scale: 1.1 }}
        >
          <motion.div
            className="absolute -inset-1 rounded-xl decorative"
            style={{
              background: "linear-gradient(135deg, rgba(251,191,36,0.5), rgba(249,115,22,0.5))",
              filter: "blur(6px)",
            }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <div className="relative w-11 h-11 bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/40 border border-amber-400/40">
            <div 
              className="absolute inset-0 rounded-xl decorative"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
              }}
            />
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Megaphone size={20} className="text-white drop-shadow-lg" strokeWidth={2.5} />
            </motion.div>
          </div>
        </motion.div>
        <div className="relative z-10 flex-1 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap flex">
            {[...messages, ...messages].map((msg, i) => (
              <span
                key={i}
                className="text-sm text-white/90 font-semibold mx-8 drop-shadow-sm"
                style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}
              >
                {msg}
              </span>
            ))}
          </div>
        </div>
        <motion.button
          onClick={() => navigate("/promotion")}
          className="relative z-10 flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex-shrink-0 shadow-lg shadow-amber-500/30 border border-amber-400/40 overflow-hidden clickable"
          whileHover={{ scale: 1.05, x: 3 }}
          whileTap={{ scale: 0.95 }}
        >
          <div 
            className="absolute inset-0 decorative"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
            }}
          />
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Flame size={14} className="text-yellow-200 drop-shadow" />
          </motion.div>
          <span className="relative z-10 drop-shadow-sm">বিস্তারিত</span>
          <motion.div
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <ChevronRight size={14} className="text-white/80" />
          </motion.div>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default PremiumAnnouncementBar;
