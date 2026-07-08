import { useState, useEffect, useRef } from "react";
import { Bell, BellRing, X, Sparkles, TrendingUp, Trophy, Zap, Check, BellOff, BellPlus, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendHighAccuracyNotification,
  sendPerfectPredictionNotification,
  sendStreakNotification,
  sendMilestoneNotification,
} from "@/lib/browserNotifications";
import { usePredictionSounds } from "@/hooks/usePredictionSounds";

interface Notification {
  id: string;
  type: "high_accuracy" | "milestone" | "streak" | "new_prediction";
  title: string;
  message: string;
  game?: string;
  accuracy?: number;
  timestamp: Date;
  read: boolean;
  browserNotified?: boolean;
  soundPlayed?: boolean;
}

interface PredictionNotificationsProps {
  predictions: Array<{
    id: string;
    game_type: string;
    accuracy_score: number | null;
    verified_at: string | null;
    created_at: string;
  }>;
  gameStats?: Array<{
    game: string;
    avgAccuracy: number;
    highAccuracy: number;
  }>;
}

const SOUND_ENABLED_KEY = "ai_notification_sounds_enabled";

export const PredictionNotifications = ({ predictions, gameStats }: PredictionNotificationsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("default");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const sentBrowserNotifications = useRef<Set<string>>(new Set());
  const playedSounds = useRef<Set<string>>(new Set());

  const { playHighAccuracy, playPerfectPrediction, playStreak, playNotificationDing } = usePredictionSounds(soundEnabled, 0.7);

  useEffect(() => {
    setPushPermission(getNotificationPermission());
    const savedSound = localStorage.getItem(SOUND_ENABLED_KEY);
    if (savedSound !== null) setSoundEnabled(savedSound === "true");
  }, []);

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem(SOUND_ENABLED_KEY, String(newValue));
    if (newValue) playNotificationDing();
    toast.success(newValue ? "🔊 Notification sounds enabled" : "🔇 Notification sounds muted");
  };

  const handleEnablePush = async () => {
    const permission = await requestNotificationPermission();
    setPushPermission(permission);
    if (permission === "granted") toast.success("🔔 Browser notifications enabled!");
    else if (permission === "denied") toast.error("Notifications blocked. Enable in browser settings.");
    else if (permission === "unsupported") toast.error("Your browser doesn't support notifications");
  };

  useEffect(() => {
    const newNotifications: Notification[] = [];

    predictions.forEach((pred) => {
      if (pred.accuracy_score && pred.accuracy_score >= 80 && pred.verified_at) {
        const notifId = `high-${pred.id}`;
        newNotifications.push({
          id: notifId,
          type: "high_accuracy",
          title: "🎯 High Accuracy Alert!",
          message: `Your ${pred.game_type} prediction achieved ${pred.accuracy_score}% accuracy!`,
          game: pred.game_type,
          accuracy: pred.accuracy_score,
          timestamp: new Date(pred.verified_at),
          read: false,
          browserNotified: sentBrowserNotifications.current.has(notifId),
        });
        if (!sentBrowserNotifications.current.has(notifId)) {
          if (pushPermission === "granted") sendHighAccuracyNotification(pred.game_type, pred.accuracy_score);
          if (!playedSounds.current.has(notifId)) { playHighAccuracy(); playedSounds.current.add(notifId); }
          sentBrowserNotifications.current.add(notifId);
        }
      }
    });

    predictions.forEach((pred) => {
      if (pred.accuracy_score === 100 && pred.verified_at) {
        const notifId = `perfect-${pred.id}`;
        newNotifications.push({
          id: notifId,
          type: "milestone",
          title: "🏆 Perfect Prediction!",
          message: `Amazing! Your ${pred.game_type} prediction was 100% accurate!`,
          game: pred.game_type,
          accuracy: 100,
          timestamp: new Date(pred.verified_at),
          read: false,
          browserNotified: sentBrowserNotifications.current.has(notifId),
        });
        if (!sentBrowserNotifications.current.has(notifId)) {
          if (pushPermission === "granted") sendPerfectPredictionNotification(pred.game_type);
          if (!playedSounds.current.has(notifId)) { playPerfectPrediction(); playedSounds.current.add(notifId); }
          sentBrowserNotifications.current.add(notifId);
        }
      }
    });

    const sortedPreds = [...predictions].filter((p) => p.accuracy_score !== null).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    let streak = 0;
    for (const pred of sortedPreds) {
      if (pred.accuracy_score && pred.accuracy_score >= 70) streak++;
      else break;
    }

    if (streak >= 3) {
      const notifId = `streak-${streak}`;
      newNotifications.push({ id: notifId, type: "streak", title: "🔥 Hot Streak!", message: `You're on fire! ${streak} high accuracy predictions in a row!`, timestamp: new Date(), read: false, browserNotified: sentBrowserNotifications.current.has(notifId) });
      if (!sentBrowserNotifications.current.has(notifId)) {
        if (pushPermission === "granted") sendStreakNotification(streak);
        if (!playedSounds.current.has(notifId)) { playStreak(); playedSounds.current.add(notifId); }
        sentBrowserNotifications.current.add(notifId);
      }
    }

    if (gameStats) {
      const totalHighAccuracy = gameStats.reduce((sum, g) => sum + g.highAccuracy, 0);
      let milestoneId = "", milestoneMessage = "", milestoneValue = 0;
      if (totalHighAccuracy >= 50) { milestoneId = "milestone-50"; milestoneMessage = "Congratulations! You've made 50+ high accuracy predictions!"; milestoneValue = 50; }
      else if (totalHighAccuracy >= 25) { milestoneId = "milestone-25"; milestoneMessage = "Great progress! 25+ high accuracy predictions achieved!"; milestoneValue = 25; }
      else if (totalHighAccuracy >= 10) { milestoneId = "milestone-10"; milestoneMessage = "You've reached 10+ high accuracy predictions!"; milestoneValue = 10; }
      if (milestoneId) {
        newNotifications.push({ id: milestoneId, type: "milestone", title: "⭐ Milestone Reached!", message: milestoneMessage, timestamp: new Date(), read: false, browserNotified: sentBrowserNotifications.current.has(milestoneId) });
        if (!sentBrowserNotifications.current.has(milestoneId)) {
          if (pushPermission === "granted") sendMilestoneNotification(milestoneValue);
          if (!playedSounds.current.has(milestoneId)) { playNotificationDing(); playedSounds.current.add(milestoneId); }
          sentBrowserNotifications.current.add(milestoneId);
        }
      }
    }

    const uniqueNotifications = newNotifications.filter((n, i, arr) => arr.findIndex((x) => x.id === n.id) === i).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
    setNotifications(uniqueNotifications);
    setHasNewNotifications(uniqueNotifications.some((n) => !n.read));
  }, [predictions, gameStats, pushPermission, playHighAccuracy, playPerfectPrediction, playStreak, playNotificationDing]);

  const markAllRead = () => { setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))); setHasNewNotifications(false); };
  const dismissNotification = (id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "high_accuracy": return <TrendingUp className="w-4 h-4 text-green-400" />;
      case "milestone": return <Trophy className="w-4 h-4 text-yellow-400" />;
      case "streak": return <Zap className="w-4 h-4 text-orange-400" />;
      case "new_prediction": return <Sparkles className="w-4 h-4 text-purple-400" />;
      default: return <Bell className="w-4 h-4 text-white" />;
    }
  };

  const getNotificationBg = (type: Notification["type"]) => {
    switch (type) {
      case "high_accuracy": return "from-green-500/20 to-emerald-500/20 border-green-500/30";
      case "milestone": return "from-yellow-500/20 to-orange-500/20 border-yellow-500/30";
      case "streak": return "from-orange-500/20 to-red-500/20 border-orange-500/30";
      case "new_prediction": return "from-purple-500/20 to-pink-500/20 border-purple-500/30";
      default: return "from-slate-500/20 to-slate-600/20 border-slate-500/30";
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => { setIsOpen(!isOpen); if (!isOpen) markAllRead(); }} className="relative text-white hover:bg-white/10">
        {hasNewNotifications ? <BellRing className="w-5 h-5 animate-pulse text-yellow-400" /> : <Bell className="w-5 h-5" />}
        {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-bounce">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 w-80 max-h-[70vh] overflow-hidden bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50">
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><BellRing className="w-5 h-5 text-yellow-400" /><span className="font-bold text-white">Notifications</span></div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={toggleSound} className="w-7 h-7 text-white/60 hover:text-white hover:bg-white/10">{soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}</Button>
                  {notifications.length > 0 && <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-white/60 hover:text-white hover:bg-white/10"><Check className="w-3 h-3 mr-1" />Read</Button>}
                </div>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                <div className="flex items-center gap-2">{pushPermission === "granted" ? <Bell className="w-4 h-4 text-green-400" /> : <BellOff className="w-4 h-4 text-white/50" />}<span className="text-xs text-white/70">Browser Notifications</span></div>
                {pushPermission === "granted" ? <span className="text-[10px] text-green-400 px-2 py-0.5 bg-green-500/20 rounded-full">Enabled</span> : pushPermission === "denied" ? <span className="text-[10px] text-red-400 px-2 py-0.5 bg-red-500/20 rounded-full">Blocked</span> : pushPermission === "unsupported" ? <span className="text-[10px] text-white/50 px-2 py-0.5 bg-white/10 rounded-full">Unsupported</span> : <Button variant="ghost" size="sm" onClick={handleEnablePush} className="h-6 px-2 text-[10px] text-yellow-400 hover:bg-yellow-500/20"><BellPlus className="w-3 h-3 mr-1" />Enable</Button>}
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-80px)] p-2 space-y-2">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-white/50"><Bell className="w-10 h-10 mx-auto mb-2 opacity-50" /><p className="text-sm">No notifications yet</p><p className="text-xs mt-1">High accuracy predictions will appear here</p></div>
              ) : notifications.map((notification) => (
                <div key={notification.id} className={cn("relative bg-gradient-to-r border rounded-xl p-3 transition-all", getNotificationBg(notification.type), !notification.read && "ring-2 ring-yellow-500/50")}>
                  <Button variant="ghost" size="icon" onClick={() => dismissNotification(notification.id)} className="absolute top-1 right-1 w-6 h-6 text-white/50 hover:text-white hover:bg-white/10"><X className="w-3 h-3" /></Button>
                  <div className="flex items-start gap-3 pr-6">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1"><span className="font-semibold text-sm text-white">{notification.title}</span></div>
                      <p className="text-xs text-white/70 leading-relaxed">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {notification.game && <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] text-white/60">{notification.game}</span>}
                        {notification.accuracy && notification.accuracy >= 90 && <span className="px-2 py-0.5 bg-green-500/20 rounded text-[10px] text-green-400 font-bold">⭐ {notification.accuracy}%</span>}
                        <span className="text-[10px] text-white/40">{format(notification.timestamp, "MMM d, HH:mm")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {notifications.length > 0 && (
              <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 p-3">
                <Button variant="ghost" size="sm" onClick={() => setNotifications([])} className="w-full text-xs text-white/60 hover:text-white hover:bg-white/10">Clear all notifications</Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
