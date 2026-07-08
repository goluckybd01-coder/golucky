import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, TrendingUp, Gift, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentTier, getTierConfig, formatBDT } from '@/lib/agentConfig';
import Confetti from '@/components/Confetti';
import Fireworks from '@/components/Fireworks';
import AudioManager from '@/hooks/useAudioManager';
interface AgentTierUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  oldTier: AgentTier | null;
  newTier: AgentTier | null;
}

export default function AgentTierUpgradeModal({
  open,
  onOpenChange,
  oldTier,
  newTier,
}: AgentTierUpgradeModalProps) {
  const [showEffects, setShowEffects] = useState(false);

  const oldConfig = oldTier ? getTierConfig(oldTier) : null;
  const newConfig = newTier ? getTierConfig(newTier) : null;

  useEffect(() => {
    if (open) {
      setShowEffects(true);
      AudioManager.getInstance().playSound('/sounds/level-up.mp3', 0.5);
      const timer = setTimeout(() => {
        onOpenChange(false);
        setShowEffects(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [open, onOpenChange]);

  if (!open || !oldConfig || !newConfig) return null;

  const commissionIncrease = newConfig.depositCommissionRate - oldConfig.depositCommissionRate;
  const bettingIncrease = newConfig.bettingCommissionRate - oldConfig.bettingCommissionRate;

  return (
    <>
      <Confetti isActive={showEffects} intensity="big" />
      <Fireworks active={showEffects} duration={5000} />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={() => onOpenChange(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotateY: -30 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${newConfig.gradient} rounded-3xl blur-2xl opacity-40 animate-pulse`} />
              <div className="relative bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 rounded-3xl border border-white/10 overflow-hidden">
                <button onClick={() => onOpenChange(false)} className="absolute top-4 right-4 text-white/50 hover:text-white z-10">
                  <X className="h-5 w-5" />
                </button>
                <div className={`h-2 bg-gradient-to-r ${newConfig.gradient}`} />
                <div className="p-6 space-y-6">
                  <div className="text-center">
                    <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} className="inline-block mb-4">
                      <div className="relative">
                        <span className="text-8xl">{newConfig.icon}</span>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} className="absolute -top-2 -right-2">
                          <Sparkles className="h-8 w-8 text-yellow-400" />
                        </motion.div>
                      </div>
                    </motion.div>
                    <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400">
                      🎊 টায়ার আপগ্রেড! 🎊
                    </motion.h2>
                    <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-gray-400 mt-2">
                      অভিনন্দন! আপনি নতুন টায়ারে পৌঁছে গেছেন!
                    </motion.p>
                  </div>
                  <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${oldConfig.gradient} opacity-50`}>
                        <span className="text-3xl">{oldConfig.icon}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{oldConfig.name}</p>
                    </div>
                    <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
                      <ArrowRight className="h-6 w-6 text-primary" />
                    </motion.div>
                    <div className="text-center">
                      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className={`p-3 rounded-xl bg-gradient-to-br ${newConfig.gradient} shadow-lg`}>
                        <span className="text-3xl">{newConfig.icon}</span>
                      </motion.div>
                      <p className={`text-xs font-bold mt-1 ${newConfig.color}`}>{newConfig.name}</p>
                    </div>
                  </motion.div>
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                      <Gift className="h-4 w-4 text-primary" />
                      নতুন সুবিধা আনলক হয়েছে
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/30">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-green-400" />
                          <span className="text-xs text-gray-400">ডিপোজিট কমিশন</span>
                        </div>
                        <p className="text-xl font-bold text-green-400">{newConfig.depositCommissionRate}%</p>
                        <p className="text-xs text-green-400/70">+{commissionIncrease.toFixed(1)}% বৃদ্ধি</p>
                      </div>
                      <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/30">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-blue-400" />
                          <span className="text-xs text-gray-400">বেটিং কমিশন</span>
                        </div>
                        <p className="text-xl font-bold text-blue-400">{newConfig.bettingCommissionRate}%</p>
                        <p className="text-xs text-blue-400/70">+{bettingIncrease.toFixed(2)}% বৃদ্ধি</p>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 space-y-2">
                      {newConfig.benefits.slice(0, 3).map((benefit, i) => (
                        <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.7 + i * 0.1 }} className="flex items-center gap-2 text-sm text-gray-300">
                          <span className="text-primary">✓</span>
                          {benefit}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }}>
                    <Button onClick={() => onOpenChange(false)} className={`w-full py-6 text-lg font-bold bg-gradient-to-r ${newConfig.gradient} hover:opacity-90`}>
                      <Sparkles className="h-5 w-5 mr-2" />
                      অসাধারণ! চালিয়ে যান
                    </Button>
                  </motion.div>
                  <div className="flex justify-center gap-2 text-2xl">
                    {['🎉', '💰', '🚀', '💎', '🎊'].map((emoji, i) => (
                      <motion.span key={i} animate={{ y: [0, -10, 0] }} transition={{ delay: i * 0.1, repeat: Infinity, duration: 1 }}>
                        {emoji}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
