import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useState } from "react";
import ParallaxCard from "@/components/ParallaxCard";
import tileWingo from "@/assets/games/tile-wingo.jpg";
import tileK3 from "@/assets/games/tile-k3.jpg";
import tileLottery from "@/assets/games/tile-lottery.jpg";
import tileSports from "@/assets/games/tile-sports.jpg";
import tileCasino from "@/assets/games/tile-casino.jpg";
import tileFishing from "@/assets/games/tile-fishing.jpg";

type Game = {
  id: string; name: string; players: number; to: string;
  art: string; glow: string; badge: "HOT" | "NEW";
};

const games: Game[] = [
  { id: "wingo",   name: "WinGo",       players: 12856, to: "/game/wingo",     art: tileWingo,   glow: "rgba(16,185,129,0.6)",  badge: "HOT" },
  { id: "k3",      name: "K3",          players:  8763, to: "/game/k3",        art: tileK3,      glow: "rgba(192,132,252,0.6)", badge: "HOT" },
  { id: "lottery", name: "Lottery",     players:  9245, to: "/game/fiveD",     art: tileLottery, glow: "rgba(251,191,36,0.65)", badge: "HOT" },
  { id: "sports",  name: "Sports",      players:  5432, to: "/sports-betting", art: tileSports,  glow: "rgba(16,185,129,0.55)", badge: "NEW" },
  { id: "casino",  name: "Live Casino", players:  3256, to: "/popular",        art: tileCasino,  glow: "rgba(244,114,182,0.55)", badge: "HOT" },
  { id: "fishing", name: "Fishing",     players:  2143, to: "/popular",        art: tileFishing, glow: "rgba(34,211,238,0.6)",  badge: "NEW" },
];

function GameTile({ g, i, isFav, toggleFav }: { g: Game; i: number; isFav: boolean; toggleFav: (id: string) => void }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04, duration: 0.35, ease: "easeOut" }}
      className="relative"
    >
      <ParallaxCard
        onClick={() => navigate(g.to)}
        maxTilt={8}
        scale={1.03}
        className="clickable group relative rounded-[20px] overflow-hidden border border-white/10 w-full"
        style={{ boxShadow: `0 30px 60px -22px ${g.glow}, 0 0 0 1px rgba(212,175,55,0.15) inset, 0 0 0 1px rgba(255,255,255,0.05)` }}
      >
        <span className="pointer-events-none absolute -inset-1 rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 decorative"
          style={{ background: `radial-gradient(55% 45% at 50% 0%, ${g.glow}, transparent 72%)`, filter: "blur(14px)" }} />
        <span className="pointer-events-none absolute inset-0 rounded-[20px] border border-amber-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 decorative" />
        {g.badge && (
          <span className="absolute top-1.5 left-1.5 z-20 px-1.5 py-[3px] rounded-md text-[8px] font-black text-white tracking-[0.14em] shadow-lg ring-1 ring-white/25 backdrop-blur"
            style={{ background: g.badge === "HOT" ? "linear-gradient(135deg,#ff5b5b,#b91c1c)" : "linear-gradient(135deg,#34D399,#047857)", boxShadow: g.badge === "HOT" ? "0 6px 14px -4px rgba(239,68,68,0.7)" : "0 6px 14px -4px rgba(16,185,129,0.7)" }}>
            {g.badge}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleFav(g.id); }}
          className="clickable absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full grid place-items-center bg-black/50 backdrop-blur border border-white/20 hover:bg-black/70 transition"
          aria-label="favorite"
        >
          <Heart size={11} className={isFav ? "fill-rose-400 text-rose-400" : "text-white/80"} strokeWidth={2.5} />
        </button>
        <div className="relative aspect-square w-full overflow-hidden">
          <img
            src={g.art}
            alt={g.name}
            loading="lazy"
            width={816}
            height={816}
            className="absolute inset-0 w-full h-full object-cover select-none transition-transform duration-500 group-hover:scale-[1.06]"
            draggable={false}
          />
          <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
          <div className="absolute inset-0 decorative pointer-events-none"
            style={{ background: "radial-gradient(120% 80% at 50% 110%, rgba(0,0,0,0.55), transparent 65%)" }} />
          <div className="absolute inset-0 decorative pointer-events-none opacity-60"
            style={{ background: `radial-gradient(120% 70% at 50% 0%, ${g.glow}, transparent 65%)`, mixBlendMode: "screen" }} />
          <div className="absolute inset-x-2 bottom-1 h-1 rounded-full decorative pointer-events-none opacity-60"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)" }} />
          <div className="absolute inset-0 decorative pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)" }} />
        </div>
        <div className="relative px-2 py-2.5 text-center backdrop-blur-xl border-t border-amber-300/15"
          style={{ background: "linear-gradient(180deg, rgba(4,17,31,0.85) 0%, rgba(2,10,20,0.92) 100%)" }}>
          <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
          <div className="text-[12px] md:text-sm font-black gl-text tracking-tight">{g.name}</div>
          <div className="mt-1 flex items-center justify-center gap-1 text-[9px] text-emerald-300/95">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
            <span className="gl-num font-bold">{g.players.toLocaleString()}</span>
            <span className="text-emerald-400/70">Playing</span>
          </div>
        </div>
      </ParallaxCard>
    </motion.div>
  );
}

export default function FeaturedGamesGrid() {
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const toggleFav = (id: string) =>
    setFavs(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-3.5">
      {games.map((g, i) => (
        <GameTile key={g.id} g={g} i={i} isFav={favs.has(g.id)} toggleFav={toggleFav} />
      ))}
    </div>
  );
}
