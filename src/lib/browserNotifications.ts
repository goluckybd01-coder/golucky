// Browser Push Notification Service

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
}

// Check if notifications are supported
export const isNotificationSupported = (): boolean => {
  return "Notification" in window;
};

// Get current permission status
export const getNotificationPermission = (): NotificationPermission | "unsupported" => {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission | "unsupported"> => {
  if (!isNotificationSupported()) {
    console.warn("Browser notifications are not supported");
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error("Failed to request notification permission:", err);
    return "default";
  }
};

// Send a browser notification
export const sendBrowserNotification = async (options: NotificationOptions): Promise<Notification | null> => {
  if (!isNotificationSupported()) {
    console.warn("Browser notifications are not supported");
    return null;
  }

  if (Notification.permission !== "granted") {
    console.warn("Notification permission not granted");
    return null;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || "/pwa-192x192.png",
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction || false,
    });

    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (err) {
    console.error("Failed to send notification:", err);
    return null;
  }
};

// Notification types for AI predictions
export const sendHighAccuracyNotification = async (
  gameType: string,
  accuracy: number
): Promise<Notification | null> => {
  return sendBrowserNotification({
    title: "🎯 High Accuracy Prediction!",
    body: `Your ${gameType} prediction achieved ${accuracy}% accuracy!`,
    tag: `high-accuracy-${Date.now()}`,
    requireInteraction: true,
  });
};

export const sendPerfectPredictionNotification = async (
  gameType: string
): Promise<Notification | null> => {
  return sendBrowserNotification({
    title: "🏆 Perfect Prediction!",
    body: `Amazing! Your ${gameType} prediction was 100% accurate!`,
    tag: `perfect-${Date.now()}`,
    requireInteraction: true,
  });
};

export const sendStreakNotification = async (
  streakCount: number
): Promise<Notification | null> => {
  return sendBrowserNotification({
    title: "🔥 Hot Streak!",
    body: `You're on fire! ${streakCount} high accuracy predictions in a row!`,
    tag: `streak-${Date.now()}`,
    requireInteraction: true,
  });
};

export const sendMilestoneNotification = async (
  milestone: number
): Promise<Notification | null> => {
  return sendBrowserNotification({
    title: "⭐ Milestone Reached!",
    body: `Congratulations! You've made ${milestone}+ high accuracy predictions!`,
    tag: `milestone-${milestone}`,
    requireInteraction: false,
  });
};

// Critical alert notification for admins
export const sendCriticalAlertNotification = async (
  title: string,
  body: string,
  metadata?: Record<string, unknown>
): Promise<Notification | null> => {
  return sendBrowserNotification({
    title: `🚨 CRITICAL: ${title}`,
    body,
    tag: `critical-alert-${Date.now()}`,
    data: metadata,
    requireInteraction: true, // Stay until dismissed
    icon: "/pwa-512x512.png",
  });
};
