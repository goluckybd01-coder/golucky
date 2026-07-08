import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatTaka } from "@/lib/currency";
import {
  getStoredNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount,
  isPushEnabled,
  setPushEnabled,
  initializePushNotifications,
  sendCommissionNotification,
  sendVIPUpgradeNotification,
  sendOfferNotification,
  AppNotification,
} from "@/lib/pushNotificationService";
import {
  getNotificationPermission,
  requestNotificationPermission,
} from "@/lib/browserNotifications";

export const usePushNotifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushEnabled, setLocalPushEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(() => {
    const stored = getStoredNotifications();
    setNotifications(stored);
    setUnreadCount(getUnreadCount());
  }, []);

  useEffect(() => {
    loadNotifications();
    setLocalPushEnabled(isPushEnabled());
    setPermission(getNotificationPermission());
    setIsLoading(false);
  }, [loadNotifications]);

  useEffect(() => {
    let commissionChannel: ReturnType<typeof supabase.channel> | null = null;
    let vipChannel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    const setupRealtimeListeners = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      commissionChannel = supabase
        .channel(`notifications_commission_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'wallet_transactions',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            if (!isMounted) return;
            const newTx = payload.new as { type: string; amount: number; description?: string };
            
            if (newTx.type === 'referral') {
              await sendCommissionNotification(newTx.amount);
              loadNotifications();
              toast.success(`💰 ${formatTaka(newTx.amount)} কমিশন পেয়েছেন!`);
            }
          }
        )
        .subscribe();

      vipChannel = supabase
        .channel(`notifications_vip_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'vip_level_history',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            if (!isMounted) return;
            const vipChange = payload.new as { new_level: number; old_level: number };
            
            if (vipChange.new_level > vipChange.old_level) {
              loadNotifications();
            }
          }
        )
        .subscribe();
    };

    setupRealtimeListeners();

    return () => {
      isMounted = false;
      if (commissionChannel) {
        supabase.removeChannel(commissionChannel);
      }
      if (vipChannel) {
        supabase.removeChannel(vipChannel);
      }
    };
  }, [loadNotifications]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const result = await initializePushNotifications();
    setPermission(result);
    
    if (result === "granted") {
      setLocalPushEnabled(true);
      toast.success("🔔 Push notifications সক্রিয় হয়েছে!");
      return true;
    } else if (result === "denied") {
      toast.error("Push notifications ব্লক করা আছে। ব্রাউজার সেটিংস থেকে এনাবল করুন।");
      return false;
    } else if (result === "unsupported") {
      toast.error("আপনার ব্রাউজার push notifications সাপোর্ট করে না।");
      return false;
    }
    
    return false;
  }, []);

  const togglePush = useCallback(async (): Promise<boolean> => {
    if (pushEnabled) {
      setPushEnabled(false);
      setLocalPushEnabled(false);
      toast.info("🔕 Push notifications বন্ধ করা হয়েছে");
      return false;
    } else {
      return requestPermission();
    }
  }, [pushEnabled, requestPermission]);

  const markRead = useCallback((id: string) => {
    markNotificationRead(id);
    loadNotifications();
  }, [loadNotifications]);

  const markAllRead = useCallback(() => {
    markAllNotificationsRead();
    loadNotifications();
  }, [loadNotifications]);

  const removeNotification = useCallback((id: string) => {
    deleteNotification(id);
    loadNotifications();
  }, [loadNotifications]);

  const clearAll = useCallback(() => {
    clearAllNotifications();
    loadNotifications();
  }, [loadNotifications]);

  const sendTestNotification = useCallback(async () => {
    await sendOfferNotification(
      "স্পেশাল অফার!",
      "এখনই ডিপোজিট করুন এবং ৳৫০০ বোনাস পান!",
      { type: "test" }
    );
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    pushEnabled,
    permission,
    isLoading,
    requestPermission,
    togglePush,
    markRead,
    markAllRead,
    removeNotification,
    clearAll,
    sendTestNotification,
    refresh: loadNotifications,
  };
};
