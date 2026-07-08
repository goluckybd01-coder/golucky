import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatTaka } from "@/lib/currency";
import AudioManager from "./useAudioManager";
interface TransactionRequest {
  id: string;
  type: string;
  amount: number;
  status: string;
  admin_notes: string | null;
}

export const useTransactionNotifications = () => {
  const previousStatuses = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch current pending requests to track their statuses
      const { data: pendingRequests } = await supabase
        .from("transaction_requests")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (pendingRequests) {
        pendingRequests.forEach(req => {
          previousStatuses.current.set(req.id, req.status);
        });
      }

      // Subscribe to changes on transaction_requests for this user
      channel = supabase
        .channel('transaction-status-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'transaction_requests',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newRecord = payload.new as TransactionRequest;
            const oldStatus = previousStatuses.current.get(newRecord.id);
            
            // Only notify if status changed from pending
            if (oldStatus === "pending" && newRecord.status !== "pending") {
              const typeLabel = newRecord.type === "deposit" ? "Deposit" : "Withdrawal";
              const amount = formatTaka(newRecord.amount, 0);
              
              if (newRecord.status === "approved") {
                toast.success(
                  `${typeLabel} Approved! 🎉`,
                  {
                    description: `Your ${typeLabel.toLowerCase()} request of ${amount} has been approved.${newRecord.admin_notes ? ` Note: ${newRecord.admin_notes}` : ''}`,
                    duration: 8000,
                  }
                );
                
                // Play success sound (through AudioManager for proper cleanup)
                AudioManager.getInstance().playSound('/sounds/success.mp3', 0.3);
              } else if (newRecord.status === "rejected") {
                toast.error(
                  `${typeLabel} Rejected`,
                  {
                    description: `Your ${typeLabel.toLowerCase()} request of ${amount} was rejected.${newRecord.admin_notes ? ` Reason: ${newRecord.admin_notes}` : ''}`,
                    duration: 10000,
                  }
                );
              }
              
              // Update tracked status
              previousStatuses.current.set(newRecord.id, newRecord.status);
            }
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
