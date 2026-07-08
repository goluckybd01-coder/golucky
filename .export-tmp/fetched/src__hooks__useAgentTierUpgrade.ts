import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AgentTier, AGENT_TIERS, getTierConfig } from '@/lib/agentConfig';
import { sendAgentTierUpgradeNotification } from '@/lib/pushNotificationService';
import { toast } from 'sonner';
import AudioManager from './useAudioManager';
interface TierUpgradeState {
  showUpgradeModal: boolean;
  oldTier: AgentTier | null;
  newTier: AgentTier | null;
  setShowUpgradeModal: (show: boolean) => void;
}

// Helper function outside component to avoid hook changes
const triggerUpgradeEffects = (
  previousTier: AgentTier, 
  upgradedTier: AgentTier,
  setOldTier: (tier: AgentTier | null) => void,
  setNewTier: (tier: AgentTier | null) => void,
  setShowUpgradeModal: (show: boolean) => void
) => {
  const oldConfig = getTierConfig(previousTier);
  const newConfig = getTierConfig(upgradedTier);
  
  if (!oldConfig || !newConfig) return;

  // Set state for modal
  setOldTier(previousTier);
  setNewTier(upgradedTier);
  setShowUpgradeModal(true);

  // Send push notification
  sendAgentTierUpgradeNotification(
    oldConfig.name,
    newConfig.name,
    newConfig.depositCommissionRate,
    newConfig.bettingCommissionRate
  );

  // Show toast notification
  toast.success(
    `🚀 টায়ার আপগ্রেড! ${oldConfig.name} → ${newConfig.name}`,
    {
      description: `নতুন ডিপোজিট কমিশন: ${newConfig.depositCommissionRate}% | বেটিং: ${newConfig.bettingCommissionRate}%`,
      duration: 5000,
    }
  );

  // Vibration celebration pattern
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100, 50, 200, 100, 300]);
  }

  // Play upgrade sound (through AudioManager for proper cleanup)
  AudioManager.getInstance().playSound('/sounds/level-up.mp3', 0.6);
};

export const useAgentTierUpgrade = (): TierUpgradeState => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [oldTier, setOldTier] = useState<AgentTier | null>(null);
  const [newTier, setNewTier] = useState<AgentTier | null>(null);
  const currentTierRef = useRef<AgentTier | null>(null);
  const isSetup = useRef(false);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscription = async () => {
      if (isSetup.current) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current agent profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('agent_tier, agent_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile || profile.agent_status !== 'approved' || !profile.agent_tier) {
        return;
      }

      currentTierRef.current = profile.agent_tier as AgentTier;
      isSetup.current = true;

      // Subscribe to profile changes with unique channel name
      channel = supabase
        .channel(`agent-tier-upgrade-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newRecord = payload.new as { agent_tier: AgentTier | null };
            const previousTier = currentTierRef.current;

            if (newRecord.agent_tier && previousTier && newRecord.agent_tier !== previousTier) {
              // Check if it's an upgrade (higher tier)
              const prevIndex = AGENT_TIERS.findIndex(t => t.tier === previousTier);
              const newIndex = AGENT_TIERS.findIndex(t => t.tier === newRecord.agent_tier);

              if (newIndex > prevIndex) {
                // It's an upgrade! Trigger all effects
                triggerUpgradeEffects(
                  previousTier, 
                  newRecord.agent_tier,
                  setOldTier,
                  setNewTier,
                  setShowUpgradeModal
                );
              }

              currentTierRef.current = newRecord.agent_tier;
            }
          }
        )
        .subscribe((status) => {
          console.log('[AgentTierUpgrade] Subscription status:', status);
        });
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return {
    showUpgradeModal,
    oldTier,
    newTier,
    setShowUpgradeModal,
  };
};
