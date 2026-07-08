import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Target, Dices, Trophy, Spade, Fish, Ticket, Plane, LayoutGrid,
} from "lucide-react";

type Cat = {
  id: string;
  label: string;
  to: string;
  Icon: typeof Target;
  grad: string;   // tile gradient (rich, jewel-toned)
  glow: string;   // outer glow rgba
  badge?: "NEW" | "HOT";
};

const cats: Cat[] = [
  { id: "wingo",   label: "WinGo",       to: "/game/wingo",       Icon: Target, badge: "NEW",
    grad: "linear-gradient(155deg,#1bf0a3 0%,#0f9b69 55%,#053b2a 100%)", glow: "rgba(34,211,153,0.55)" },
  { id: "k3",      label: "K3",          to: "/game/k3",          Icon: Dices,  badge: "NEW",
    grad: "linear-gradient(155deg,#c084fc 0%,#7c3aed 55%,#2e1065 100%)", glow: "rgba(167,139,250,0.55)" },
  { id: "sports",  label: "Sports",      to: "/sports-betting",   Icon: Trophy,
    grad: "linear-gradient(155deg,#fde68a 0%,#d4a017 55%,#5c3d05 100%)", glow: "rgba(212,160,23,0.55)" },
  { id: "casino",  label: "Live Casino", to: "/popular",          Icon: Spade,
    grad: "linear-gradient(155deg,#fb7185 0%,#e11d48 55%,#4c0519 100%)", glow: "rgba(244,63,94,0.55)" },
  { id: "fishing", label: "Fishing",     to: "/popular",          Icon: Fish,
    grad: "linear-gradient(155deg,#67e8f9 0%,#0284c7 55%,#082f49 100%)", glow: "rgba(56,189,248,0.55)" },
  { id: "lottery", label: "Lottery",     to: "/game/fiveD",       Icon: Ticket,
    grad: "linear-gradient(155deg,#fcd34d 0%,#ea580c 55%,#451a03 100%)", glow: "rgba(249,115,22,0.55)" },
  { id: "aviator", label: "Aviator",     to: "/game/aviator",     Icon: Plane,
    grad: "linear-gradient(155deg,#fda4af 0%,#dc2626 55%,#450a0a 100%)", glow: "rgba(239,68,68,0.55)" },
];

function PremiumTile({
  Icon, grad, glow, badge,
}: { Icon: Cat["Icon"]; grad: string; glow: string; badge?: Cat["badge"] }) {
  return (
    <div className="relative w-12 h-12 md:w-[52px] md:h-[52px]">
      {/* outer ambient glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-1.5 rounded-[20px] opacity-70 blur-md decorative"
        style={{ background: `radial-gradient(60% 60% at 50% 35%, ${glow}, transparent 70%)` }}
      />
      {/* tile body */}
      <div
        className="relative w-full h-full rounded-[16px] grid place-items-center overflow-hidden"
        style={{
          background: grad,
          boxShadow:
            `0 10px 22px -8px ${glow}, 0 0 0 1px rgba(212,175,55,0.35) inset, 0 1px 0 rgba(255,255,255,0.45) inset, 0 -6px 14px rgba(0,0,0,0.45) inset`,
        }}
      >
        {/* glossy top sheen */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-1 top-0 h-1/2 rounded-t-[15px] opacity-80 decorative"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.06) 65%, transparent 100%)" }}
        />
        {/* corner highlight */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-2 -left-2 w-6 h-6 rounded-full bg-white/45 blur-md decorative"
        />
        {/* inner ring */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-[3px] rounded-[13px] border border-white/15 decorative"
        />
        <Icon
          size={22}
          strokeWidth={2.4}
          className="relative z-[1] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)]"
        />
      </div>
      {badge && (
        <span
          className="absolute -top-1.5 -left-1.5 z-20 px-1.5 py-[1px] rounded-md text-[8px] font-black text-white tracking-[0.14em] ring-1 ring-white/30 shadow-[0_4px_10px_-2px_rgba(239,68,68,0.7)]"
          style={{ background: "linear-gradient(135deg,#ff5b5b,#b91c1c)" }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

export default function CategoryStrip() {
  const navigate = useNavigate();
  const items: Cat[] = [
    ...cats,
    {
      id: "more", label: "More", to: "/popular", Icon: LayoutGrid,
      grad: "linear-gradient(155deg,#475569 0%,#1e293b 55%,#020617 100%)",
      glow: "rgba(212,175,55,0.45)",
    },
  ];
  return (
    <div
      className="rounded-3xl p-3 md:p-3.5 border border-amber-300/15"
      style={{
        background:
          "linear-gradient(180deg, rgba(8,18,32,0.85) 0%, rgba(3,10,20,0.92) 100%)",
        boxShadow:
          "0 24px 50px -22px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04) inset",
      }}
    >
      {/* top hairline */}
      <span className="block h-px mb-3 bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 md:gap-3">
        {items.map((c, i) => (
          <motion.button
            type="button"
            key={c.id}
            onClick={() => navigate(c.to)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.32, ease: "easeOut" }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.94 }}
            className="clickable group relative flex flex-col items-center gap-1.5 rounded-2xl py-2.5 px-1.5"
          >
            <PremiumTile Icon={c.Icon} grad={c.grad} glow={c.glow} badge={c.badge} />
            <span className="mt-0.5 text-[10px] md:text-[11px] font-black gl-text tracking-tight text-center leading-tight">
              {c.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
