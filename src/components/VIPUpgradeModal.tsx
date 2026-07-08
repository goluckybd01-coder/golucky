import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Gift, Star, Sparkles, Zap } from "lucide-react";
import { VIP_BENEFITS, VIP_LEVELS } from "@/hooks/useVIPLevel";
import Confetti from "./Confetti";

interface VIPUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newLevel: number;
}

const VIPUpgradeModal = ({ open, onOpenChange, newLevel }: VIPUpgradeModalProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  
  const levelData = VIP_LEVELS.find(v => v.level === newLevel);
  const benefits = VIP_BENEFITS[newLevel as keyof typeof VIP_BENEFITS];

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [open]);

  if (!levelData || !benefits) return null;

  return (
    <>
      <Confetti isActive={showConfetti} duration={5000} intensity="big" />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-0">
          <div className={`bg-gradient-to-br ${levelData.color} p-1 rounded-2xl`}>
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl overflow-hidden">
              <div className={`bg-gradient-to-r ${levelData.color} p-6 text-center relative overflow-hidden`}>
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur rounded-full mb-4">
                    <Crown className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-white text-2xl font-bold">Level Up!</h2>
                  <p className="text-white/90 text-lg mt-1">You've reached {levelData.name}!</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-400 text-sm text-center">Your new exclusive benefits:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                    <Gift className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <p className="text-white font-bold">৳{benefits.levelUpBonus.toLocaleString()}</p>
                    <p className="text-gray-400 text-xs">Level Up Bonus</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                    <Star className="w-6 h-6 text-rose-400 mx-auto mb-2" />
                    <p className="text-white font-bold">৳{benefits.monthlyBonus.toLocaleString()}</p>
                    <p className="text-gray-400 text-xs">Monthly Bonus</p>
                  </div>
                </div>
                <Button onClick={() => onOpenChange(false)} className={`w-full bg-gradient-to-r ${levelData.color} hover:opacity-90 text-white font-bold py-6 rounded-xl`}>
                  <Gift className="w-5 h-5 mr-2" />
                  Claim Your Rewards
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VIPUpgradeModal;
