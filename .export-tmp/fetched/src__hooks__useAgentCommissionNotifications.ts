import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatBDT } from "@/lib/agentConfig";
import { sendBrowserNotification, requestNotificationPermission } from "@/lib/browserNotifications";
import AudioManager from "./useAudioManager";
interface AgentCommission {
  id: string;
  commission_type: string;
  commission_amount: number;
  source_amount: number;
  commission_rate: number;
  referred_user_id: string;
  created_at: string;
}

export const useAgentCommissionNotifications = () => {
  const lastNotifiedId = useRef<string | null>(null);
  const isSetup = useRef(false);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscription = async () => {
      if (isSetup.current) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is an approved agent
      const { data: profile } = await supabase
        .from("profiles")
        .select("agent_status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile || profile.agent_status !== "approved") return;

      isSetup.current = true;

      // Request notification permission
      requestNotificationPermission();

      // Get the most recent commission to avoid notifying on old ones
      const { data: recentCommission } = await supabase
        .from("agent_commissions")
        .select("id")
        .eq("agent_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentCommission) {
        lastNotifiedId.current = recentCommission.id;
      }

      // Subscribe to new commissions for this agent
      channel = supabase
        .channel('agent-commission-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'agent_commissions',
            filter: `agent_user_id=eq.${user.id}`,
          },
          async (payload) => {
            const commission = payload.new as AgentCommission;
            
            // Avoid duplicate notifications
            if (lastNotifiedId.current === commission.id) return;
            lastNotifiedId.current = commission.id;

            const typeLabel = commission.commission_type === "deposit" 
              ? "Deposit Commission" 
              : "Betting Commission";
            const amount = formatBDT(commission.commission_amount);
            const sourceAmount = formatBDT(commission.source_amount);

            // Show toast notification
            toast.success(
              `💰 ${typeLabel} Earned!`,
              {
                description: `You earned ${amount} (${commission.commission_rate}% of ${sourceAmount})`,
                duration: 6000,
                action: {
                  label: "View",
                  onClick: () => {
                    window.location.href = "/agent";
                  },
                },
              }
            );

            // Send browser notification
            sendBrowserNotification({
              title: `${typeLabel} Earned!`,
              body: `You earned ${amount} from a referral's ${commission.commission_type}!`,
              icon: "/pwa-192x192.png",
              tag: `commission-${commission.id}`,
            });

            // Play notification sound (through AudioManager for proper cleanup)
            AudioManager.getInstance().playSound('/sounds/coin.mp3', 0.4);
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);
};
