import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Megaphone, Bell, Gift, Zap, Star, ChevronRight, Sparkles, Crown, AlertCircle, Info, PartyPopper } from "lucide-react";
import GlassCard from "@/components/auth/GlassCard";

// Floating particle
const FloatingParticle = (_props: any) => null; // Removed for performance (Final Polish Phase 2)

// Glowing orb
const GlowingOrb = ({ className, color }: { className?: string; color: string }) => (
  <motion.div 
    className={`absolute rounded-full blur-3xl ${className}`} 
    style={{ background: color }}
    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
    transition={{ duration: 4, repeat: Infinity }}
  />
);

// Holographic shine
const HolographicShine = () => (
  <motion.div
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
    initial={{ x: "-200%" }}
    animate={{ x: "200%" }}
    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
  />
);

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "promo" | "update" | "alert" | "event";
  date: string;
  isNew: boolean;
}

const announcements: Announcement[] = [
  {
    id: "1",
    title: "🎉 New Year Mega Bonus!",
    content: "Celebrate 2024 with us! Get up to ৳10,000 bonus on your first deposit this month. Use code: NEWYEAR2024",
    type: "promo",
    date: "2024-01-15",
    isNew: true,
  },
  {
    id: "2",
    title: "⚡ Crash Game Update",
    content: "We've improved the Crash game experience with faster payouts and new multiplier animations. Try it now!",
    type: "update",
    date: "2024-01-12",
    isNew: true,
  },
  {
    id: "3",
    title: "🏆 VIP Rewards Upgraded",
    content: "VIP members now enjoy higher rebate rates and exclusive monthly bonuses. Check your VIP page for details.",
    type: "event",
    date: "2024-01-10",
    isNew: false,
  },
  {
    id: "4",
    title: "🔒 Security Enhancement",
    content: "We've added 2FA support for enhanced account security. Enable it in Settings to protect your account.",
    type: "alert",
    date: "2024-01-08",
    isNew: false,
  },
  {
    id: "5",
    title: "🎁 Refer & Earn Program",
    content: "Invite friends and earn ৳50 for each successful referral plus 0.6% commission on their bets forever!",
    type: "promo",
    date: "2024-01-05",
    isNew: false,
  },
];

const getTypeConfig = (type: string) => {
  switch (type) {
    case "promo":
      return { icon: Gift, gradient: "from-amber-500 to-orange-500", color: "text-amber-400", bg: "bg-amber-500/10" };
    case "update":
      return { icon: Zap, gradient: "from-cyan-500 to-teal-500", color: "text-cyan-400", bg: "bg-cyan-500/10" };
    case "alert":
      return { icon: AlertCircle, gradient: "from-red-500 to-rose-500", color: "text-red-400", bg: "bg-red-500/10" };
    case "event":
      return { icon: PartyPopper, gradient: "from-purple-500 to-pink-500", color: "text-purple-400", bg: "bg-purple-500/10" };
    default:
      return { icon: Info, gradient: "from-gray-500 to-slate-500", color: "text-gray-400", bg: "bg-gray-500/10" };
  }
};

const AnnouncementCard = ({ announcement, index, onClick }: { announcement: Announcement; index: number; onClick: () => void }) => {
  const config = getTypeConfig(announcement.type);
  const Icon = config.icon;

  return (
    <motion.button
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index, type: "spring" }}
      whileHover={{ scale: 1.02, x: 5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-5 text-left"
    >
      <HolographicShine />
      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <motion.div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Icon size={22} className="text-white" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-bold text-sm truncate">{announcement.title}</h3>
              {announcement.isNew && (
                <motion.span
                  className="px-2 py-0.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold rounded-full"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  NEW
                </motion.span>
              )}
            </div>
            <p className="text-white/50 text-xs line-clamp-2">{announcement.content}</p>
            <p className="text-white/30 text-[10px] mt-2">{announcement.date}</p>
          </div>
          <ChevronRight size={18} className="text-white/30 flex-shrink-0" />
        </div>
      </div>
    </motion.button>
  );
};

const Announcement = () => {
  const navigate = useNavigate();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse at 20% 20%, rgba(20,184,166,0.15) 0%, transparent 50%)`
        }} />
      </div>

      {/* Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.5} size={Math.random() * 10 + 6} left={`${Math.random() * 100}%`} duration={Math.random() * 6 + 10} />
        ))}
      </div>

      {/* Orbs */}
      <GlowingOrb className="w-[400px] h-[400px] -top-48 -right-48" color="radial-gradient(circle, rgba(20,184,166,0.4) 0%, transparent 70%)" />
      <GlowingOrb className="w-64 h-64 bottom-32 -left-32" color="radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)" />

      {/* Header */}
      <div className="relative pt-6 pb-6 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-600/20 via-orange-600/10 to-transparent" />
        
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex items-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-sm"
          >
            <ArrowLeft size={22} />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Megaphone size={20} className="text-white" />
              </motion.div>
              Announcements
            </h1>
            <p className="text-white/50 text-sm mt-1">Latest news & updates</p>
          </div>
          <motion.div
            animate={{ y: [-3, 3, -3], rotate: [0, 360] }}
            transition={{ y: { duration: 2, repeat: Infinity }, rotate: { duration: 8, repeat: Infinity, ease: "linear" } }}
          >
            <Sparkles size={24} className="text-amber-400" />
          </motion.div>
        </motion.div>
      </div>

      <div className="px-4 space-y-3">
        {announcements.map((announcement, index) => (
          <AnnouncementCard
            key={announcement.id}
            announcement={announcement}
            index={index}
            onClick={() => setSelectedAnnouncement(announcement)}
          />
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAnnouncement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAnnouncement(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <GlassCard className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getTypeConfig(selectedAnnouncement.type).gradient} flex items-center justify-center`}>
                    {(() => { const Icon = getTypeConfig(selectedAnnouncement.type).icon; return <Icon size={28} className="text-white" />; })()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-white font-bold text-lg">{selectedAnnouncement.title}</h2>
                    <p className="text-white/40 text-xs">{selectedAnnouncement.date}</p>
                  </div>
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-6">{selectedAnnouncement.content}</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedAnnouncement(null)}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-2xl"
                >
                  Got it!
                </motion.button>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Announcement;
