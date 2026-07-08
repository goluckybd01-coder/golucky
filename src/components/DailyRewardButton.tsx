import React, { useState, useEffect } from "react";
import { Gift } from "lucide-react";
import { getDailyRewardInfo } from "@/lib/dailyRewardService";
import DailyRewardModal from "./DailyRewardModal";

interface DailyRewardButtonProps {
  onClaimed?: () => void;
  className?: string;
}

const DailyRewardButton: React.FC<DailyRewardButtonProps> = ({ onClaimed, className = "" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    checkRewardStatus();
  }, []);

  const checkRewardStatus = async () => {
    const info = await getDailyRewardInfo();
    setCanClaim(info.canClaim);
    setStreak(info.currentStreak);
  };

  const handleClaimed = () => {
    checkRewardStatus();
    onClaimed?.();
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${className}`}
        style={{
          background: canClaim
            ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
            : "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
          boxShadow: canClaim ? "0 2px 10px rgba(251, 191, 36, 0.4)" : "none",
        }}
      >
        <Gift size={18} className="text-white" />
        <span className="text-white">
          {canClaim ? "Claim Bonus" : `Day ${streak}`}
        </span>
        
        {/* Notification Badge */}
        {canClaim && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
            <span className="text-[10px] text-white font-bold">!</span>
          </span>
        )}
      </button>

      <DailyRewardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClaimed={handleClaimed}
      />
    </>
  );
};

export default DailyRewardButton;
