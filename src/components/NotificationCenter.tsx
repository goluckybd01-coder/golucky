import { useState } from "react";
import { 
  Bell, BellRing, BellOff, Check, Trash2, X, 
  Crown, Coins, Gift, Star, Trophy, Users, Zap,
  Volume2, VolumeX, Settings, Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { NotificationType, AppNotification } from "@/lib/pushNotificationService";

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    pushEnabled,
    permission,
    togglePush,
    markRead,
    markAllRead,
    removeNotification,
    clearAll,
  } = usePushNotifications();

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "vip_upgrade":
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case "commission_earned":
        return <Coins className="w-4 h-4 text-green-400" />;
      case "new_offer":
        return <Gift className="w-4 h-4 text-pink-400" />;
      case "deposit_bonus":
        return <Star className="w-4 h-4 text-amber-400" />;
      case "daily_reward":
        return <Trophy className="w-4 h-4 text-orange-400" />;
      case "referral_signup":
        return <Users className="w-4 h-4 text-cyan-400" />;
      case "win_notification":
        return <Zap className="w-4 h-4 text-purple-400" />;
      case "salary_update":
        return <Wallet className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const getNotificationBg = (type: NotificationType) => {
    switch (type) {
      case "vip_upgrade":
        return "from-yellow-500/20 to-amber-500/20 border-yellow-500/30";
      case "commission_earned":
        return "from-green-500/20 to-emerald-500/20 border-green-500/30";
      case "new_offer":
        return "from-pink-500/20 to-rose-500/20 border-pink-500/30";
      case "deposit_bonus":
        return "from-amber-500/20 to-orange-500/20 border-amber-500/30";
      case "daily_reward":
        return "from-orange-500/20 to-red-500/20 border-orange-500/30";
      case "referral_signup":
        return "from-cyan-500/20 to-teal-500/20 border-cyan-500/30";
      case "win_notification":
        return "from-purple-500/20 to-violet-500/20 border-purple-500/30";
      case "salary_update":
        return "from-emerald-500/20 to-teal-500/20 border-emerald-500/30";
      default:
        return "from-gray-500/20 to-slate-500/20 border-gray-500/30";
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            markAllRead();
          }
        }}
        className="relative text-white hover:bg-white/10"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 animate-pulse text-yellow-400" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          <div className="absolute right-0 top-12 w-80 max-h-[70vh] overflow-hidden bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50">
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-yellow-400" />
                  <span className="font-bold text-white">নোটিফিকেশন</span>
                </div>
                <div className="flex items-center gap-1">
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllRead}
                      className="text-xs text-white/60 hover:text-white hover:bg-white/10 h-7 px-2"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      সব পড়া হয়েছে
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  {pushEnabled ? (
                    <Bell className="w-4 h-4 text-green-400" />
                  ) : (
                    <BellOff className="w-4 h-4 text-white/50" />
                  )}
                  <span className="text-xs text-white/70">
                    Push Notifications
                  </span>
                </div>
                {permission === "granted" || permission === "default" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePush}
                    className={cn(
                      "h-6 px-2 text-[10px]",
                      pushEnabled 
                        ? "text-green-400 hover:bg-green-500/20" 
                        : "text-yellow-400 hover:bg-yellow-500/20"
                    )}
                  >
                    {pushEnabled ? (
                      <>
                        <Volume2 className="w-3 h-3 mr-1" />
                        চালু
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3 h-3 mr-1" />
                        বন্ধ
                      </>
                    )}
                  </Button>
                ) : permission === "denied" ? (
                  <span className="text-[10px] text-red-400 px-2 py-0.5 bg-red-500/20 rounded-full">
                    ব্লক করা
                  </span>
                ) : (
                  <span className="text-[10px] text-white/50 px-2 py-0.5 bg-white/10 rounded-full">
                    সাপোর্টেড নয়
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(70vh-120px)] p-2 space-y-2">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-white/50">
                  <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">কোন নোটিফিকেশন নেই</p>
                  <p className="text-xs mt-1">VIP আপগ্রেড, কমিশন এবং অফার এখানে দেখুন</p>
                </div>
              ) : (
                <>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "relative bg-gradient-to-r border rounded-xl p-3 transition-all cursor-pointer",
                        getNotificationBg(notification.type),
                        !notification.read && "ring-2 ring-yellow-500/50"
                      )}
                      onClick={() => markRead(notification.id)}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="absolute top-1 right-1 w-6 h-6 text-white/50 hover:text-white hover:bg-white/10"
                      >
                        <X className="w-3 h-3" />
                      </Button>

                      <div className="flex items-start gap-3 pr-6">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-white">
                              {notification.title}
                            </span>
                          </div>
                          <p className="text-xs text-white/70 leading-relaxed">
                            {notification.message}
                          </p>
                          <span className="text-[10px] text-white/40 mt-2 block">
                            {format(notification.timestamp, "dd MMM, HH:mm")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      className="w-full mt-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                      onClick={clearAll}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      সব মুছে ফেলুন
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
