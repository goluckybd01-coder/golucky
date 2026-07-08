import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

type GameTile = {
  key: string;
  title: string;
  subtitle: string;
  tag: string;
  to: string;
  emoji: string;
  grad: string;
  glow: string;
  accent: string;
};

const TILES: GameTile[] = [
  { key: "wingo",  title: "Win Go",   subtitle: "30s · 1m · 3m · 5m",  tag: "HOT",    to: "/game/win-go",  emoji: "🎯", grad: "from-amber-500/30 via-orange-500/15 to-transparent",  glow: "rgba(247,181,0,0.45)",  accent: "text-amber-300" },
  { key: "k3",     title: "K3 Lotre", subtitle: "Roll 3 dice · Big/Sm", tag: "LIVE",   to: "/game/k3",     emoji: "🎲", grad: "from-rose-500/30 via-pink-500/15 to-transparent",     glow: "rgba(244,63,94,0.40)",  accent: "text-rose-300" },
  { key: "5d",     title: "5D Lotto", subtitle: "5 numbers · 5 chances", tag: "NEW",   to: "/game/5d",     emoji: "🔢", grad: "from-violet-500/30 via-fuchsia-500/15 to-transparent", glow: "rgba(123,97,255,0.45)", accent: "text-violet-300" },
  { key: "trx",    title: "TRX Win",  subtitle: "On-chain · Provably fair", tag: "WEB3", to: "/game/trx-win", emoji: "⚡", grad: "from-emerald-500/30 via-teal-500/15 to-transparent",  glow: "rgba(23,199,132,0.45)", accent: "text-emerald-300" },
  { key: "aviator",title: "Aviator",  subtitle: "Crash · Cash out early", tag: "x100", to: "/game/aviator", emoji: "✈️", grad: "from-red-500/30 via-amber-500/15 to-transparent",     glow: "rgba(239,68,68,0.45)",  accent: "text-red-300" },
  { key: "sports", title: "Sports",   subtitle: "Live odds · 200+ matches", tag: "LIVE", to: "/sports",      emoji: "⚽", grad: "from-sky-500/30 via-cyan-500/15 to-transparent",      glow: "rgba(36,214,255,0.45)", accent: "text-cyan-300" },
  { key: "casino", title: "Casino",   subtitle: "Live dealers · Tables", tag: "VIP",   to: "/popular?category=casino", emoji: "🃏", grad: "from-fuchsia-500/30 via-purple-500/15 to-transparent", glow: "rgba(217,70,239,0.40)", accent: "text-fuchsia-300" },
  { key: "slots",  title: "Slots",    subtitle: "PG · PP · JILI · Amatic", tag: "MEGA", to: "/popular?category=slots", emoji: "🎰", grad: "from-yellow-500/30 via-amber-500/15 to-transparent",  glow: "rgba(234,179,8,0.45)",  accent: "text-yellow-300" },
];

export default function PremiumGameSection() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ background: "var(--gl-grad-gold)" }} />
            <h2 className="text-base md:text-xl font-black gl-text tracking-tight">
              🎮 Game Lobby
            </h2>
          </div>
          <div className="mt-1 ml-3 text-[11px] gl-text-dim">
            Pick your game · All providers · Instant play
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/popular")}
          className="clickable text-[11px] font-bold gl-gold-text hover:opacity-80 transition"
        >
          Browse All →
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
        {TILES.map((t, i) => (
          <motion.button
            key={t.key}
            type="button"
            onClick={() => navigate(t.to)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.35, ease: "easeOut" }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="clickable group relative h-[128px] md:h-[150px] rounded-2xl overflow-hidden border border-white/10 gl-glass text-left"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${t.grad}`} />
            <div
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity"
              style={{ background: `radial-gradient(closest-side, ${t.glow}, transparent 70%)`, filter: "blur(22px)" }}
            />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <div className="relative z-10 h-full p-3 md:p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div
                  className="text-3xl md:text-4xl drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)] group-hover:scale-110 transition-transform"
                  style={{ filter: `drop-shadow(0 0 14px ${t.glow})` }}
                >
                  {t.emoji}
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wider ${t.accent} bg-black/35 border border-white/10 backdrop-blur-sm`}
                >
                  {t.tag}
                </span>
              </div>

              <div>
                <div className="text-sm md:text-base font-black gl-text leading-tight">
                  {t.title}
                </div>
                <div className="mt-0.5 text-[10px] md:text-[11px] gl-text-dim line-clamp-1">
                  {t.subtitle}
                </div>
                <div className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold ${t.accent} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Play now →
                </div>
              </div>
            </div>

            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ boxShadow: `inset 0 0 0 1px ${t.glow}, 0 12px 32px -8px ${t.glow}` }}
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
