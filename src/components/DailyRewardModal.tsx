import React, { useState, useEffect } from "react";
import { X, Gift, Flame, Check, Coins, Sparkles } from "lucide-react";
import { getDailyRewardInfo, claimDailyReward, type DailyRewardInfo } from "@/lib/dailyRewardService";
import { toast } from "sonner";
import Confetti from "./Confetti";
import CoinRain from "./CoinRain";

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimed?: () => void;
}

const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ isOpen, onClose, onClaimed }) => {
  const [rewardInfo, setRewardInfo] = useState<DailyRewardInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      loadRewardInfo();
    }
  }, [isOpen]);

  const loadRewardInfo = async () => {
    setIsLoading(true);
    const info = await getDailyRewardInfo();
    setRewardInfo(info);
    setIsLoading(false);
  };

  const handleClaim = async () => {
    if (isClaiming || !rewardInfo?.canClaim) return;
    
    setIsClaiming(true);
    const result = await claimDailyReward();
    
    if (result.success) {
      setClaimedAmount(result.rewardAmount || 0);
      setShowCelebration(true);
      toast.success(`🎉 ৳${result.rewardAmount} বোনাস পেয়েছেন!`, {
        description: `Day ${result.newStreak} streak!`,
      });
      
      await loadRewardInfo();
      onClaimed?.();
      
      setTimeout(() => setShowCelebration(false), 3000);
    } else {
      toast.error(result.error || "Failed to claim");
    }
    
    setIsClaiming(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {showCelebration && (
        <>
          <Confetti isActive={showCelebration} duration={3000} intensity="big" />
          <CoinRain active={showCelebration} duration={3000} intensity="big" />
        </>
      )}
      
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
          }}
        >
          <div className="relative p-4 text-center">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X size={18} className="text-white" />
            </button>
            
            <div className="flex justify-center mb-2">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                  boxShadow: "0 4px 20px rgba(251, 191, 36, 0.4)",
                }}
              >
                <Gift size={32} className="text-white" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-1">Daily Login Bonus</h2>
            <p className="text-white/60 text-sm">প্রতিদিন লগইন করে বোনাস নিন!</p>
          </div>

          {rewardInfo && (
            <div className="px-4 pb-3">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Flame className="text-orange-400" size={20} />
                <span className="text-white font-bold">
                  {rewardInfo.currentStreak} Day Streak
                </span>
                {rewardInfo.currentStreak >= 7 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    MAX!
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="px-4 pb-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            ) : rewardInfo && (
              <div className="grid grid-cols-7 gap-1.5">
                {rewardInfo.streakRewards.map((reward, idx) => (
                  <div
                    key={idx}
                    className={`relative flex flex-col items-center p-2 rounded-xl transition-all ${
                      reward.isToday
                        ? "bg-gradient-to-b from-yellow-400/30 to-orange-500/30 border-2 border-yellow-400 scale-105"
                        : reward.claimed
                          ? "bg-green-500/20 border border-green-500/40"
                          : "bg-white/5 border border-white/10"
                    }`}
                  >
                    <span className={`text-[8px] font-medium ${reward.isToday ? "text-yellow-300" : reward.claimed ? "text-green-400" : "text-white/50"}`}>
                      Day {reward.day}
                    </span>
                    
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center my-1 ${
                      reward.isToday
                        ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                        : reward.claimed
                          ? "bg-green-500"
                          : "bg-white/10"
                    }`}>
                      {reward.claimed ? (
                        <Check size={14} className="text-white" />
                      ) : (
                        <Coins size={14} className={reward.isToday ? "text-white" : "text-white/60"} />
                      )}
                    </div>
                    
                    <span className={`text-[10px] font-bold ${
                      reward.isToday ? "text-yellow-300" : reward.claimed ? "text-green-400" : "text-white/70"
                    }`}>
                      ৳{reward.amount}
                    </span>
                    
                    {reward.isToday && !reward.claimed && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                        <span className="text-[8px] text-white font-bold">!</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {rewardInfo && (
            <div className="px-4 pb-4">
              <div className="flex gap-2">
                <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/10">
                  <p className="text-[10px] text-white/50 mb-0.5">Total Earned</p>
                  <p className="text-sm font-bold text-green-400">৳{rewardInfo.totalEarned}</p>
                </div>
                <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/10">
                  <p className="text-[10px] text-white/50 mb-0.5">Today&apos;s Reward</p>
                  <p className="text-sm font-bold text-yellow-400">৳{rewardInfo.todayReward}</p>
                </div>
                <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/10">
                  <p className="text-[10px] text-white/50 mb-0.5">Tomorrow</p>
                  <p className="text-sm font-bold text-white/70">৳{rewardInfo.nextReward}</p>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 pt-0">
            <button
              onClick={handleClaim}
              disabled={isLoading || isClaiming || !rewardInfo?.canClaim}
              className="w-full py-4 rounded-2xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: rewardInfo?.canClaim
                  ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%)"
                  : "linear-gradient(135deg, #4b5563 0%, #374151 100%)",
                boxShadow: rewardInfo?.canClaim ? "0 4px 20px rgba(251, 191, 36, 0.4)" : "none",
              }}
            >
              {isClaiming ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-white">Claiming...</span>
                </>
              ) : rewardInfo?.canClaim ? (
                <>
                  <Sparkles size={20} className="text-white" />
                  <span className="text-white">Claim ৳{rewardInfo.todayReward} Bonus</span>
                </>
              ) : (
                <>
                  <Check size={20} className="text-white" />
                  <span className="text-white">Already Claimed Today</span>
                </>
              )}
            </button>
            
            {rewardInfo?.canClaim && (
              <p className="text-center text-white/40 text-[10px] mt-2">
                ⏰ Resets at midnight
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DailyRewardModal;
