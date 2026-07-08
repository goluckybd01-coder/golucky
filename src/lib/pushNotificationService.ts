// Push Notification Service for VIP, Commission, and Offers
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendBrowserNotification,
  NotificationOptions,
} from "./browserNotifications";

// Notification event types
export type NotificationType = 
  | "vip_upgrade"
  | "commission_earned"
  | "new_offer"
  | "deposit_bonus"
  | "daily_reward"
  | "referral_signup"
  | "win_notification"
  | "salary_update"
  | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  data?: Record<string, unknown>;
  timestamp: Date;
  read: boolean;
}

// Local storage key for notifications
const NOTIFICATIONS_KEY = "app_notifications";
const PUSH_ENABLED_KEY = "push_notifications_enabled";
const MAX_NOTIFICATIONS = 50;

// Get stored notifications
export const getStoredNotifications = (): AppNotification[] => {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    if (stored) {
      const notifications = JSON.parse(stored);
      return notifications.map((n: AppNotification) => ({
        ...n,
        timestamp: new Date(n.timestamp),
      }));
    }
  } catch (e) {
    console.error("Error loading notifications:", e);
  }
  return [];
};

// Save notifications to storage
export const saveNotifications = (notifications: AppNotification[]): void => {
  try {
    // Keep only the latest MAX_NOTIFICATIONS
    const toSave = notifications.slice(0, MAX_NOTIFICATIONS);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error("Error saving notifications:", e);
  }
};

// Add a new notification
export const addNotification = (
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
): AppNotification => {
  const notification: AppNotification = {
    id: `${type}-${Date.now()}`,
    type,
    title,
    message,
    data,
    timestamp: new Date(),
    read: false,
  };

  const existing = getStoredNotifications();
  const updated = [notification, ...existing];
  saveNotifications(updated);

  return notification;
};

// Mark notification as read
export const markNotificationRead = (id: string): void => {
  const notifications = getStoredNotifications();
  const updated = notifications.map(n =>
    n.id === id ? { ...n, read: true } : n
  );
  saveNotifications(updated);
};

// Mark all notifications as read
export const markAllNotificationsRead = (): void => {
  const notifications = getStoredNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  saveNotifications(updated);
};

// Delete a notification
export const deleteNotification = (id: string): void => {
  const notifications = getStoredNotifications();
  const updated = notifications.filter(n => n.id !== id);
  saveNotifications(updated);
};

// Clear all notifications
export const clearAllNotifications = (): void => {
  localStorage.removeItem(NOTIFICATIONS_KEY);
};

// Get unread count
export const getUnreadCount = (): number => {
  return getStoredNotifications().filter(n => !n.read).length;
};

// Check if push is enabled
export const isPushEnabled = (): boolean => {
  return localStorage.getItem(PUSH_ENABLED_KEY) === "true";
};

// Set push enabled status
export const setPushEnabled = (enabled: boolean): void => {
  localStorage.setItem(PUSH_ENABLED_KEY, String(enabled));
};

// Send VIP upgrade notification
export const sendVIPUpgradeNotification = async (
  newLevel: number,
  levelUpBonus: number
): Promise<void> => {
  const title = `🎉 VIP${newLevel} অর্জন করেছেন!`;
  const message = `অভিনন্দন! আপনি VIP${newLevel} তে উন্নীত হয়েছেন। ৳${levelUpBonus} বোনাস পেয়েছেন!`;

  // Add to local notifications
  addNotification("vip_upgrade", title, message, { level: newLevel, bonus: levelUpBonus });

  // Send browser push notification if enabled
  if (isPushEnabled() && getNotificationPermission() === "granted") {
    await sendBrowserNotification({
      title,
      body: message,
      tag: `vip-upgrade-${newLevel}`,
      requireInteraction: true,
    });
  }
};

// Send commission earned notification
export const sendCommissionNotification = async (
  amount: number,
  fromUser?: string
): Promise<void> => {
  const title = "💰 কমিশন পেয়েছেন!";
  const message = fromUser
    ? `${fromUser} এর কার্যকলাপ থেকে ৳${amount.toFixed(2)} কমিশন পেয়েছেন!`
    : `৳${amount.toFixed(2)} রেফারেল কমিশন পেয়েছেন!`;

  addNotification("commission_earned", title, message, { amount });

  if (isPushEnabled() && getNotificationPermission() === "granted") {
    await sendBrowserNotification({
      title,
      body: message,
      tag: `commission-${Date.now()}`,
    });
  }
};

// Send new offer notification
export const sendOfferNotification = async (
  offerTitle: string,
  offerDescription: string,
  offerData?: Record<string, unknown>
): Promise<void> => {
  const title = `🎁 ${offerTitle}`;

  addNotification("new_offer", title, offerDescription, offerData);

  if (isPushEnabled() && getNotificationPermission() === "granted") {
    await sendBrowserNotification({
      title,
      body: offerDescription,
      tag: `offer-${Date.now()}`,
      requireInteraction: true,
    });
  }
};

// Send deposit bonus notification
export const sendDepositBonusNotification = async (
  bonusAmount: number,
  bonusType: string
): Promise<void> => {
  const title = "🎊 ডিপোজিট বোনাস!";
  const message = `${bonusType} থেকে ৳${bonusAmount.toFixed(2)} বোনাস পেয়েছেন!`;

  addNotification("deposit_bonus", title, message, { amount: bonusAmount, type: bonusType });

  if (isPushEnabled() && getNotificationPermission() === "granted") {
    await sendBrowserNotification({
      title,
      body: message,
      tag: `deposit-bonus-${Date.now()}`,
    });
  }
};

// Send daily reward notification
export const sendDailyRewardNotification = async (
  rewardAmount: number,
  streakDay: number
): Promise<void> => {
  const title = "🌟 ডেইলি রিওয়ার্ড!";
  const message = `${streakDay} দিনের স্ট্রিক! ৳${rewardAmount.toFixed(2)} রিওয়ার্ড পেয়েছেন!`;

  addNotification("daily_reward", title, message, { amount: rewardAmount, streak: streakDay });

  if (isPushEnabled() && getNotificationPermission() === "granted") {
    await sendBrowserNotification({
      title,
      body: message,
      tag: `daily-reward-${Date.now()}`,
    });
  }
};

// Send referral signup notification
export const sendReferralSignupNotification = async (
  bonusAmount: number
): Promise<void> => {
  const title = "👥 নতুন রেফারেল!";
  const message = `আপনার রেফারেলে নতুন ইউজার জয়েন করেছে! ৳${bonusAmount.toFixed(2)} বোনাস পেয়েছেন!`;

  addNotification("referral_signup", title, message, { amount: bonusAmount });

  if (isPushEnabled() && getNotificationPermission() === "granted") {
    await sendBrowserNotification({
      title,
      body: message,
      tag: `referral-signup-${Date.now()}`,
    });
  }
};

// Send win notification
export const sendWinNotification = async (
  winAmount: number,
  gameType: string
): Promise<void> => {
  const title = "🏆 জিতেছেন!";
  const message = `${gameType} এ ৳${winAmount.toFixed(2)} জিতেছেন!`;

  addNotification("win_notification", title, message, { amount: winAmount, game: gameType });

  if (isPushEnabled() && getNotificationPermission() === "granted") {
    await sendBrowserNotification({
      title,
      body: message,
      tag: `win-${Date.now()}`,
    });
  }
};

// Send salary status notification
export const sendSalaryNotification = async (
  status: "approved" | "paid" | "rejected",
  amount: number,
  month: string,
  adminNotes?: string
): Promise<void> => {
  const statusConfig = {
    approved: { icon: "✅", title: "বেতন অনুমোদিত!", color: "green" },
    paid: { icon: "💰", title: "বেতন প্রদান করা হয়েছে!", color: "emerald" },
    rejected: { icon: "❌", title: "বেতন প্রত্যাখ্যাত", color: "red" },
  };

  const config = statusConfig[status];
  let message = "";
  
  switch (status) {
    case "approved":
      message = `${month} মাসের ৳${amount.toFixed(0)} বেতন অনুমোদিত হয়েছে।`;
      break;
    case "paid":
      message = `${month} মাসের ৳${amount.toFixed(0)} বেতন আপনার ওয়ালেটে জমা হয়েছে!`;
      break;
    case "rejected":
      message = `${month} মাসের বেতন প্রত্যাখ্যাত হয়েছে।${adminNotes ? ` কারণ: ${adminNotes}` : ""}`;
      break;
  }

  const title = `${config.icon} ${config.title}`;
  
  addNotification("salary_update", title, message, { status, amount, month });

  if (isPushEnabled() && getNotificationPermission() === "granted") {
    await sendBrowserNotification({
      title,
      body: message,
      tag: `salary-${status}-${Date.now()}`,
      requireInteraction: status === "paid",
    });
  }
};

// Send agent tier upgrade notification
export const sendAgentTierUpgradeNotification = async (
  oldTier: string,
  newTier: string,
  newCommissionRate: number,
  newBettingRate: number
): Promise<void> => {
  const title = "🚀 এজেন্ট টায়ার আপগ্রেড!";
  const message = `অভিনন্দন! আপনি ${oldTier} থেকে ${newTier} এ উন্নীত হয়েছেন! নতুন কমিশন রেট: ${newCommissionRate}%`;

  addNotification("system", title, message, { 
    oldTier, 
    newTier, 
    depositCommission: newCommissionRate,
    bettingCommission: newBettingRate
  });

  if (isPushEnabled() && getNotificationPermission() === "granted") {
    await sendBrowserNotification({
      title,
      body: message,
      tag: `agent-tier-upgrade-${Date.now()}`,
      requireInteraction: true,
    });
  }
};

// Send system notification
export const sendSystemNotification = async (
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<void> => {
  addNotification("system", title, message, data);

  if (isPushEnabled() && getNotificationPermission() === "granted") {
    await sendBrowserNotification({
      title,
      body: message,
      tag: `system-${Date.now()}`,
    });
  }
};

// Initialize push notifications
export const initializePushNotifications = async (): Promise<NotificationPermission | "unsupported"> => {
  if (!isNotificationSupported()) {
    return "unsupported";
  }

  const currentPermission = getNotificationPermission();
  
  if (currentPermission === "granted") {
    setPushEnabled(true);
    return "granted";
  }

  if (currentPermission === "denied") {
    setPushEnabled(false);
    return "denied";
  }

  // Request permission
  const permission = await requestNotificationPermission();
  setPushEnabled(permission === "granted");
  return permission;
};
