import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, UserPlus, Crown, Gift, ArrowRight } from "lucide-react";

const cards = [
  { id: "spin", title: "Lucky Spin", sub: "Spin everyday & win exclusive prizes", cta: "Spin Now", to: "/lucky-spinner", icon: Sparkles, grad: "from-fuchsia-500 to-purple-700" },
  { id: "ref",  title: "Referral Bonus", sub: "Invite friends & earn lifetime bonus", cta: "Invite Now", to: "/agent", icon: UserPlus, grad: "from-amber-400 to-orange-600" },
  { id: "vip",  title: "VIP Club", sub: "Exclusive rewards for VIP members", cta: "View VIP", to: "/vip", icon: Crown, grad: "from-yellow-400 to-amber-700" },
  { id: "dep",  title: "Deposit Bonus", sub: "Get up to 15% bonus on every deposit", cta: "Deposit Now", to: "/deposit", icon: Gift, grad: "from-emerald-400 to-emerald-700" },
];

export default function PromoCardsRow() {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            whileHover={{ y: -3 }}
            className="relative rounded-2xl gl-glass gl-lift p-3 md:p-4 overflow-hidden border border-white/8"
          >
            <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-2xl bg-gradient-to-br ${c.grad} opacity-90 flex items-center justify-center rotate-12 shadow-2xl decorative pointer-events-none`}>
              <Icon size={28} className="text-white drop-shadow" strokeWidth={2.2} />
            </div>
            <div className="relative z-10 pr-14">
              <div className="text-sm md:text-base font-black gl-text tracking-tight">{c.title}</div>
              <div className="mt-1 text-[10px] md:text-[11px] gl-text-dim leading-tight">{c.sub}</div>
            </div>
            <button
              type="button" onClick={() => navigate(c.to)}
              className="clickable relative z-10 mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold gl-gold-text hover:gap-2.5 transition-all"
            >
              {c.cta} <ArrowRight size={12} />
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
