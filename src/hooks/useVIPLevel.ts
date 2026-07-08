import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendVIPUpgradeNotification } from "@/lib/pushNotificationService";

// VIP Level thresholds (EXP = total bet amount)
export const VIP_LEVELS = [
  { level: 1, minExp: 0, name: "VIP1", color: "from-amber-400 to-yellow-500" },
  { level: 2, minExp: 1000, name: "VIP2", color: "from-amber-500 to-orange-500" },
  { level: 3, minExp: 5000, name: "VIP3", color: "from-rose-400 to-pink-500" },
  { level: 4, minExp: 25000, name: "VIP4", color: "from-fuchsia-400 to-purple-500" },
  { level: 5, minExp: 100000, name: "VIP5", color: "from-violet-400 to-purple-500" },
  { level: 6, minExp: 500000, name: "VIP6", color: "from-pink-400 to-rose-500" },
  { level: 7, minExp: 2000000, name: "VIP7", color: "from-emerald-400 to-teal-500" },
  { level: 8, minExp: 10000000, name: "VIP8", color: "from-amber-500 to-orange-600" },
  { level: 9, minExp: 50000000, name: "VIP9", color: "from-purple-400 to-violet-600" },
  { level: 10, minExp: 100000000, name: "VIP10", color: "from-rose-500 to-pink-600" },
];

// VIP Benefits by level
export const VIP_BENEFITS = {
  1: { levelUpBonus: 30, monthlyBonus: 0, rebateRate: 0.6, withdrawLimit: 50000 },
  2: { levelUpBonus: 60, monthlyBonus: 0, rebateRate: 0.6, withdrawLimit: 100000 },
  3: { levelUpBonus: 120, monthlyBonus: 360, rebateRate: 0.6, withdrawLimit: 200000 },
  4: { levelUpBonus: 580, monthlyBonus: 900, rebateRate: 0.65, withdrawLimit: 500000 },
  5: { levelUpBonus: 1200, monthlyBonus: 2000, rebateRate: 0.65, withdrawLimit: 1000000 },
  6: { levelUpBonus: 2000, monthlyBonus: 6000, rebateRate: 0.7, withdrawLimit: 2000000 },
  7: { levelUpBonus: 3500, monthlyBonus: 10500, rebateRate: 0.7, withdrawLimit: 5000000 },
  8: { levelUpBonus: 12000, monthlyBonus: 36000, rebateRate: 0.75, withdrawLimit: 10000000 },
  9: { levelUpBonus: 18000, monthlyBonus: 54000, rebateRate: 0.8, withdrawLimit: 50000000 },
  10: { levelUpBonus: 58000, monthlyBonus: 174000, rebateRate: 0.8, withdrawLimit: 100000000 },
};

export interface VIPData {
  level: number;
  name: string;
  exp: number;
  nextLevelExp: number;
  progress: number;
  benefits: typeof VIP_BENEFITS[1];
}

/**
 * Calculate VIP level from total bet (EXP)
 */
export const calculateVIPLevel = (totalBet: number): number => {
  for (let i = VIP_LEVELS.length - 1; i >= 0; i--) {
    if (totalBet >= VIP_LEVELS[i].minExp) {
      return VIP_LEVELS[i].level;
    }
  }
  return 1;
};

/**
 * Hook for VIP level management with automatic upgrades
 */
export const useVIPLevel = () => {
  const [vipData, setVIPData] = useState<VIPData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [newLevel, setNewLevel] = useState<number | null>(null);
  const previousLevelRef = useRef<number | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastUpgradeShownRef = useRef<number>(0);
  const shownLevelsRef = useRef<Set<number>>(new Set());
  const isInitializedRef = useRef(false);
  
  const UPGRADE_POPUP_COOLDOWN_MS = 60000;

  const fetchVIPData = useCallback(async (isRealtimeUpdate = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const [walletResult, profileResult] = await Promise.all([
        supabase
          .from("wallets")
          .select("total_bet")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("vip_level, vip_exp")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      const totalBet = walletResult.data?.total_bet || 0;
      const storedLevel = profileResult.data?.vip_level || 1;
      const calculatedLevel = calculateVIPLevel(totalBet);

      const previousKnownLevel = previousLevelRef.current ?? storedLevel;
      const isLevelUp = calculatedLevel > previousKnownLevel;
      
      const now = Date.now();
      const cooldownPassed = now - lastUpgradeShownRef.current > UPGRADE_POPUP_COOLDOWN_MS;
      const notShownThisLevel = !shownLevelsRef.current.has(calculatedLevel);
      
      if (isLevelUp && cooldownPassed && notShownThisLevel && isRealtimeUpdate) {
        if (calculatedLevel > storedLevel) {
          await Promise.all([
            supabase
              .from("profiles")
              .update({ vip_level: calculatedLevel, vip_exp: totalBet })
              .eq("user_id", user.id),
            supabase
              .from("vip_level_history")
              .insert({
                user_id: user.id,
                old_level: storedLevel,
                new_level: calculatedLevel,
                exp_at_change: totalBet,
              }),
          ]);
        }

        shownLevelsRef.current.add(calculatedLevel);
        lastUpgradeShownRef.current = now;
        
        setNewLevel(calculatedLevel);
        setShowUpgradeModal(true);
        
        const benefits = VIP_BENEFITS[calculatedLevel as keyof typeof VIP_BENEFITS];
        await sendVIPUpgradeNotification(calculatedLevel, benefits.levelUpBonus);
        
        toast.success(`🎉 অভিনন্দন! আপনি VIP${calculatedLevel} এ পৌঁছেছেন!`, {
          duration: 5000,
        });
      } else if (calculatedLevel > storedLevel) {
        await supabase
          .from("profiles")
          .update({ vip_level: calculatedLevel, vip_exp: totalBet })
          .eq("user_id", user.id);
      }

      previousLevelRef.current = calculatedLevel;

      const currentLevelData = VIP_LEVELS[calculatedLevel - 1];
      const nextLevelData = VIP_LEVELS[calculatedLevel] || null;
      const expNeeded = nextLevelData ? nextLevelData.minExp - currentLevelData.minExp : 0;
      const expProgress = totalBet - currentLevelData.minExp;
      const progress = nextLevelData ? Math.min(100, (expProgress / expNeeded) * 100) : 100;

      setVIPData({
        level: calculatedLevel,
        name: currentLevelData.name,
        exp: totalBet,
        nextLevelExp: nextLevelData?.minExp || totalBet,
        progress,
        benefits: VIP_BENEFITS[calculatedLevel as keyof typeof VIP_BENEFITS],
      });
    } catch (error) {
      console.error("Error fetching VIP data:", error);
    } finally {
      setIsLoading(false);
      isInitializedRef.current = true;
    }
  }, []);

  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel(`vip_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchVIPData(true);
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    fetchVIPData(false);
    setupRealtime();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchVIPData]);

  return {
    vipData,
    isLoading,
    showUpgradeModal,
    setShowUpgradeModal,
    newLevel,
    refreshVIPData: fetchVIPData,
  };
};

export const getVIPBadgeColor = (level: number): string => {
  const levelData = VIP_LEVELS.find(v => v.level === level);
  return levelData?.color || "from-amber-400 to-yellow-500";
};

export const formatExp = (exp: number): string => {
  if (exp >= 1000000000) return `${(exp / 1000000000).toFixed(1)}B`;
  if (exp >= 1000000) return `${(exp / 1000000).toFixed(1)}M`;
  if (exp >= 1000) return `${(exp / 1000).toFixed(1)}K`;
  return exp.toFixed(0);
};
