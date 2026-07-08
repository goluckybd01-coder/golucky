import { motion } from "framer-motion";
import { Shield, Zap, Headphones, BadgeCheck, Diamond } from "lucide-react";

const badges = [
  { id: "secure", icon: Shield,     label: "100% Secure",    tone: "from-emerald-400 to-emerald-600" },
  { id: "fast",   icon: Zap,         label: "Fast Payout",    tone: "from-amber-300 to-amber-600" },
  { id: "supp",   icon: Headphones,  label: "24/7 Support",   tone: "from-cyan-300 to-blue-600" },
  { id: "fair",   icon: BadgeCheck,  label: "Fair & Trusted", tone: "from-emerald-300 to-teal-600" },
  { id: "best",   icon: Diamond,     label: "Best Experience",tone: "from-violet-400 to-fuchsia-600" },
];

export default function TrustBadgesRow() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
      {badges.map((b, i) => {
        const Icon = b.icon;
        return (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="rounded-2xl gl-glass border border-white/8 px-3 py-2.5 flex items-center gap-2.5"
          >
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${b.tone} flex items-center justify-center shadow-md`}>
              <Icon size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="text-xs md:text-sm font-bold gl-text truncate">{b.label}</div>
          </motion.div>
        );
      })}
    </div>
  );
}
