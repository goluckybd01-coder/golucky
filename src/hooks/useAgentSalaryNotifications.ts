import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatBDT } from "@/lib/agentConfig";
import { sendBrowserNotification, requestNotificationPermission } from "@/lib/browserNotifications";
import { addNotification, isPushEnabled, getStoredNotifications } from "@/lib/pushNotificationService";
import AudioManager from "./useAudioManager";
interface SalaryRecord {
  id: string;
  agent_user_id: string;
  status: string;
  salary_month: string;
  total_salary: number;
  base_salary: number;
  referral_bonus: number;
  admin_notes: string | null;
}

type SalaryStatus = "approved" | "paid" | "rejected";

const getStatusConfig = (status: SalaryStatus) => {
  switch (status) {
    case "approved":
      return {
        icon: "✅",
        title: "বেতন অনুমোদিত!",
        titleEn: "Salary Approved!",
        color: "text-green-500",
        sound: "/sounds/success.mp3",
      };
    case "paid":
      return {
        icon: "💰",
        title: "বেতন প্রদান করা হয়েছে!",
        titleEn: "Salary Paid!",
        color: "text-emerald-500",
        sound: "/sounds/coin.mp3",
      };
    case "rejected":
      return {
        icon: "❌",
        title: "বেতন প্রত্যাখ্যাত",
        titleEn: "Salary Rejected",
        color: "text-red-500",
        sound: "/sounds/error.mp3",
      };
    default:
      return {
        icon: "📋",
        title: "বেতন আপডেট",
        titleEn: "Salary Update",
        color: "text-blue-500",
        sound: "/sounds/notification.mp3",
      };
  }
};

const formatMonth = (monthStr: string): string => {
  try {
    const date = new Date(monthStr + "-01");
    return date.toLocaleDateString("bn-BD", { month: "long", year: "numeric" });
  } catch {
    return monthStr;
  }
};

export const useAgentSalaryNotifications = () => {
  const lastNotifiedId = useRef<string | null>(null);
  const lastStatus = useRef<Map<string, string>>(new Map());
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

      // Get existing salary records to track status changes
      const { data: existingRecords } = await supabase
        .from("agent_salary_records")
        .select("id, status")
        .eq("agent_user_id", user.id);

      if (existingRecords) {
        existingRecords.forEach(record => {
          lastStatus.current.set(record.id, record.status);
        });
      }

      // Subscribe to salary record updates for this agent
      channel = supabase
        .channel('agent-salary-notifications')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'agent_salary_records',
            filter: `agent_user_id=eq.${user.id}`,
          },
          async (payload) => {
            const record = payload.new as SalaryRecord;
            const oldRecord = payload.old as Partial<SalaryRecord>;
            
            // Only notify if status changed
            const previousStatus = lastStatus.current.get(record.id) || oldRecord.status;
            if (previousStatus === record.status) return;
            
            // Update tracked status
            lastStatus.current.set(record.id, record.status);
            
            // Avoid duplicate notifications
            const notificationKey = `${record.id}-${record.status}`;
            if (lastNotifiedId.current === notificationKey) return;
            lastNotifiedId.current = notificationKey;

            const statusConfig = getStatusConfig(record.status as SalaryStatus);
            const monthFormatted = formatMonth(record.salary_month);
            const amount = formatBDT(record.total_salary);

            // Build message based on status
            let message = "";
            switch (record.status) {
              case "approved":
                message = `${monthFormatted} মাসের ৳${record.total_salary.toFixed(0)} বেতন অনুমোদিত হয়েছে। শীঘ্রই প্রদান করা হবে।`;
                break;
              case "paid":
                message = `${monthFormatted} মাসের ${amount} বেতন আপনার ওয়ালেটে জমা হয়েছে!`;
                break;
              case "rejected":
                message = `${monthFormatted} মাসের বেতন প্রত্যাখ্যাত হয়েছে।${record.admin_notes ? ` কারণ: ${record.admin_notes}` : ""}`;
                break;
              default:
                message = `${monthFormatted} মাসের বেতন স্ট্যাটাস আপডেট হয়েছে।`;
            }

            // Add to in-app notifications
            addNotification("salary_update", `${statusConfig.icon} ${statusConfig.title}`, message, {
              salaryId: record.id,
              status: record.status,
              amount: record.total_salary,
              month: record.salary_month,
            });

            // Show toast notification
            if (record.status === "paid") {
              toast.success(
                `${statusConfig.icon} ${statusConfig.title}`,
                {
                  description: message,
                  duration: 8000,
                  action: {
                    label: "ওয়ালেট দেখুন",
                    onClick: () => {
                      window.location.href = "/wallet";
                    },
                  },
                }
              );
            } else if (record.status === "rejected") {
              toast.error(
                `${statusConfig.icon} ${statusConfig.title}`,
                {
                  description: message,
                  duration: 8000,
                  action: {
                    label: "বিস্তারিত",
                    onClick: () => {
                      window.location.href = "/agent";
                    },
                  },
                }
              );
            } else {
              toast.info(
                `${statusConfig.icon} ${statusConfig.title}`,
                {
                  description: message,
                  duration: 6000,
                  action: {
                    label: "দেখুন",
                    onClick: () => {
                      window.location.href = "/agent";
                    },
                  },
                }
              );
            }

            // Send browser notification
            if (isPushEnabled()) {
              sendBrowserNotification({
                title: `${statusConfig.icon} ${statusConfig.titleEn}`,
                body: record.status === "paid" 
                  ? `Your salary of ${amount} has been credited!`
                  : record.status === "approved"
                  ? `Your salary of ${amount} has been approved!`
                  : `Your salary claim has been ${record.status}.`,
                icon: "/pwa-192x192.png",
                tag: `salary-${record.id}-${record.status}`,
                requireInteraction: record.status === "paid",
              });
            }

            // Play notification sound (through AudioManager for proper cleanup)
            AudioManager.getInstance().playSound(statusConfig.sound, 0.5);

            // Celebration vibration for paid salary
            if (record.status === "paid" && navigator.vibrate) {
              navigator.vibrate([100, 50, 100, 50, 200]);
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
