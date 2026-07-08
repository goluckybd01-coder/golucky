import { motion } from "framer-motion";
import { ChevronRight, Gift, Sparkles, Flame, Clock, Coins, Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getDailyRewardInfo, type DailyRewardInfo } from "@/lib/dailyRewardService";
import DailyRewardModal from "@/components/DailyRewardModal";

const PremiumGiftsBanner = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rewardInfo, setRewardInfo] = useState<DailyRewardInfo | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRewardInfo();
    const interval = setInterval(() => {
      updateCountdown();
    }, 60000);
    updateCountdown();
    return () => clearInterval(interval);
  }, []);

  const loadRewardInfo = async () => {
    setIsLoading(true);
    try {
      const info = await getDailyRewardInfo();
      setRewardInfo(info);
    } catch (error) {
      console.error("Failed to load reward info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCountdown = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    setTimeUntilReset(`${hours}ঘ ${minutes}মি`);
  };

  const handleClaimed = () => {
    loadRewardInfo();
  };

  const currentStreak = rewardInfo?.currentStreak ?? 0;
  const todayReward = rewardInfo?.todayReward ?? 0;
  const canClaim = rewardInfo?.canClaim ?? false;

  return (
    <>
      <motion.div
        className="mx-3 mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <motion.div
          onClick={() => setIsModalOpen(true)}
          className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 rounded-xl p-2.5 cursor-pointer shadow-lg"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <motion.div
            className="absolute top-1 right-8 text-yellow-300"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles size={10} />
          </motion.div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  canClaim 
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                    : 'bg-white/20'
                }`}
                animate={canClaim ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Gift className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold text-sm">প্রতিদিন গিফ্ট নিন!</span>
                  {canClaim && (
                    <motion.span
                      className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      NEW
                    </motion.span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isLoading ? (
                    <Loader2 size={10} className="animate-spin text-white/60" />
                  ) : (
                    <>
                      <span className="flex items-center gap-0.5 text-white/80 text-[10px]">
                        <Flame size={10} className="text-orange-300" />
                        {currentStreak} Day
                      </span>
                      <span className="text-white/40">•</span>
                      <span className="flex items-center gap-0.5 text-yellow-300 text-[10px] font-bold">
                        <Coins size={10} />
                        ৳{todayReward}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isLoading ? (
                <span className="bg-white/20 text-white text-[10px] px-2.5 py-1 rounded-full">
                  <Loader2 size={10} className="animate-spin" />
                </span>
              ) : canClaim ? (
                <motion.span
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1"
                  animate={{
                    scale: [1, 1.03, 1],
                    boxShadow: [
                      "0 0 8px rgba(251, 191, 36, 0.3)",
                      "0 0 16px rgba(251, 191, 36, 0.5)",
                      "0 0 8px rgba(251, 191, 36, 0.3)",
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Gift size={12} />
                  ক্লেইম করুন
                </motion.span>
              ) : (
                <span className="bg-green-500/80 text-white text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1">
                  <Check size={10} />
                  সম্পন্ন
                </span>
              )}
              <div className="flex flex-col items-end">
                <span className="flex items-center gap-0.5 text-white/50 text-[9px]">
                  <Clock size={8} />
                  {timeUntilReset}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/60" />
            </div>
          </div>
        </motion.div>
      </motion.div>
      <DailyRewardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClaimed={handleClaimed}
      />
    </>
  );
};

export default PremiumGiftsBanner;
