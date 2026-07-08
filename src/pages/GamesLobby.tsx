import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu, Bell, Plus, Crown, Flame, Sparkles, Gift, Star, Heart, Play,
  ChevronRight, Trophy, ChevronDown, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import GamesLobbyDesktop from "./GamesLobbyDesktop";
import heroG from "@/assets/games/hero-golden-g.png";
import tileWingo from "@/assets/games/tile-wingo.png";
import tileK3 from "@/assets/games/tile-k3.png";
import tileLottery from "@/assets/games/tile-lottery.png";
import tileSports from "@/assets/games/tile-sports.png";
import tileCasino from "@/assets/games/tile-casino.png";
import tileFishing from "@/assets/games/tile-fishing.png";
import tileCrash from "@/assets/games/tile-crash.png";
import tileAviator from "@/assets/games/tile-aviator.png";
import tileSlots from "@/assets/games/tile-slots.png";
import tileMini from "@/assets/games/tile-mini.png";
import tileTower from "@/assets/games/tile-tower.png";
import tilePlinko from "@/assets/games/tile-plinko.png";
import tileLudo from "@/assets/games/tile-ludo.png";

/* =============================================================
   GOLUCKY · GAMES LOBBY · Ultra Pro Max (mobile reference build)
   ============================================================= */

const SLIDES = [
  { tag: "WELCOME TO GOLUCKY", t1: "PLAY MORE", t2: "WIN BIG", sub: "Hundreds of exciting games — endless rewards!" },
  { tag: "NEW THIS WEEK",      t1: "FRESH SLOTS", t2: "BIG WINS", sub: "Try the latest releases before everyone else." },
  { tag: "LIVE NOW",           t1: "REAL DEALERS", t2: "REAL THRILLS", sub: "Step into live casino tables right now." },
  { tag: "DAILY BOOST",        t1: "BONUS HOUR", t2: "2X REWARDS", sub: "Earn double during golden hours every day." },
];

const SIDE_CARDS = [
  { key: "hot",   label: "HOT GAMES",   count: 18, icon: Flame,    tint: "#FF7A1A", to: "/popular?c=hot" },
  { key: "new",   label: "NEW GAMES",   count: 12, icon: Sparkles, tint: "#22D3EE", to: "/popular?c=new" },
  { key: "bonus", label: "BONUS GAMES", count: 8,  icon: Gift,     tint: "#EC4899", to: "/popular?c=bonus" },
];

const CATEGORIES = [
  { key: "all",     label: "All Games",   emoji: "▦",  tint: "#00D27A", active: true },
  { key: "popular", label: "Popular",     emoji: "⭐", tint: "#22C55E" },
  { key: "new",     label: "New",         emoji: "🆕", tint: "#3B82F6", flag: "NEW" },
  { key: "hot",     label: "Hot",         emoji: "🔥", tint: "#F97316" },
  { key: "wingo",   label: "WinGo",       emoji: "🎱", tint: "#22C55E" },
  { key: "lottery", label: "Lottery",     emoji: "🎟️", tint: "#F5C542" },
  { key: "sports",  label: "Sports",      emoji: "⚽", tint: "#3B82F6" },
  { key: "casino",  label: "Live Casino", emoji: "💃", tint: "#EC4899" },
  { key: "fishing", label: "Fishing",     emoji: "🦈", tint: "#06B6D4" },
];

type Badge = "HOT" | "NEW" | "TOP" | "VIP";
type Featured = {
  key: string; title: string; players: number; badge: Badge;
  to: string; emoji: string; art: string; ringA: string; ringB: string; desc?: string;
};

const FEATURED: Featured[] = [
  { key: "wingo",   title: "WinGo",       players: 12856, badge: "HOT", to: "/game/win-go",  emoji: "🟢", art: tileWingo,   ringA: "#10E07A", ringB: "#04140C", desc: "Color prediction every 30s. Quick wins, instant rewards." },
  { key: "k3",      title: "K3",          players: 8763,  badge: "HOT", to: "/game/k3",      emoji: "🎲", art: tileK3,      ringA: "#8B5CF6", ringB: "#160A2E", desc: "Classic 3-dice prediction with massive multiplier payouts." },
  { key: "lottery", title: "Lottery",     players: 9245,  badge: "HOT", to: "/game/5d",      emoji: "7️⃣", art: tileLottery, ringA: "#F59E0B", ringB: "#2A0A0A", desc: "5D lottery draws with up to 100,000x prize potential." },
  { key: "sports",  title: "Sports",      players: 5432,  badge: "NEW", to: "/sports",       emoji: "⚽", art: tileSports,  ringA: "#22C55E", ringB: "#04140C", desc: "Live odds across football, cricket, basketball and more." },
  { key: "casino",  title: "Live Casino", players: 3256,  badge: "HOT", to: "/popular?c=casino", emoji: "🎴", art: tileCasino, ringA: "#E11D48", ringB: "#2A0712", desc: "Real dealers, real tables — Baccarat, Roulette, Blackjack." },
  { key: "fishing", title: "Fishing",     players: 2143,  badge: "NEW", to: "/popular?c=fishing", emoji: "🦈", art: tileFishing, ringA: "#0EA5E9", ringB: "#03182A", desc: "Catch big fish, win huge multipliers in arcade shooters." },
];

const TRENDING = [
  { key: "crash",   title: "Crash",      players: 2345, emoji: "🚀", art: tileCrash,   tint: "#F97316", to: "/game/crash",        desc: "Cash out before the rocket crashes!" },
  { key: "aviator", title: "Aviator",    players: 1987, emoji: "✈️", art: tileAviator, tint: "#EF4444", to: "/game/aviator",      desc: "Fly high, cash out before takeoff ends." },
  { key: "slots",   title: "Slots",      players: 4321, emoji: "🎰", art: tileSlots,   tint: "#F59E0B", to: "/popular?c=slots",   desc: "Hundreds of premium slot machines." },
  { key: "mini",    title: "Mini Games", players: 3421, emoji: "🎲", art: tileMini,    tint: "#A855F7", to: "/popular?c=mini",    desc: "Quick games, instant rewards." },
  { key: "tower",   title: "Tower",      players: 1234, emoji: "🏰", art: tileTower,   tint: "#06B6D4", to: "/popular?c=mini",    desc: "Climb the tower for bigger wins." },
  { key: "plinko",  title: "Plinko",     players: 987,  emoji: "🎯", art: tilePlinko,  tint: "#EC4899", to: "/popular?c=mini",    desc: "Drop the ball, multiply your bet." },
  { key: "ludo",    title: "Ludo",       players: 1876, emoji: "♟️", art: tileLudo,    tint: "#3B82F6", to: "/popular?c=mini",    desc: "Classic board game with real stakes." },
];

const PROVIDERS = [
  { name: "GoLucky",        tag: "Exclusive", color: "#00D27A" },
  { name: "Evolution",      tag: "Gaming",    color: "#94A3B8" },
  { name: "PG",             tag: "PocketGames", color: "#F97316" },
  { name: "JILI",           tag: "",          color: "#F5C542" },
  { name: "Spribe",         tag: "",          color: "#E2E8F0" },
  { name: "Pragmatic",      tag: "Play",      color: "#F5C542" },
  { name: "HACKSAW",        tag: "GAMING",    color: "#EF4444" },
];

const CTAS = [
  { key: "tour",    title: "TOURNAMENT",  sub: "Huge prizes every day",    btn: "Join Now",   tint: "#F5C542", emoji: "🏆", to: "/activity" },
  { key: "daily",   title: "DAILY BONUS", sub: "Claim free bonus",         btn: "Claim Now",  tint: "#00D27A", emoji: "🎁", to: "/activity" },
  { key: "streak",  title: "STREAK REWARD", sub: "Win more, earn more",    btn: "Play Now",   tint: "#FF7A1A", emoji: "🔥", to: "/activity" },
  { key: "vip",     title: "VIP CLUB",    sub: "Exclusive benefits",       btn: "View VIP",   tint: "#A855F7", emoji: "👑", to: "/vip" },
];

const bdt = (n: number) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const playersFmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

/* ===== Game detail content (rules + long description) ===== */
type GameDetail = {
  title: string;
  art: string;
  tint: string;
  to: string;
  players?: number;
  description: string;
  rules: string[];
};
const RULES: Record<string, { description: string; rules: string[] }> = {
  wingo:   { description: "WinGo is a fast-paced color & number prediction game with rounds every 30 seconds. Pick a color, number, or big/small and win instantly.", rules: ["Each round lasts 30s, 1m, 3m or 5m", "Pick Green/Red/Violet, a number 0-9, or Big/Small", "Color payout 2x, Number payout 9x, Violet 4.5x", "Service fee 2% per winning bet"] },
  k3:      { description: "K3 is a classic 3-dice prediction game. Bet on totals, combinations, or specific patterns for huge multipliers.", rules: ["3 dice rolled per round", "Bet on Sum, Big/Small, Odd/Even, Triple, Pair", "Triple payout up to 180x", "Service fee 3% per winning bet"] },
  lottery: { description: "5D Lottery features 5-digit draws with prize tiers from straight to mixed combinations and up to 100,000x payouts.", rules: ["5 digits drawn each round", "Bet on Position, Sum, Big/Small, Odd/Even", "Straight match pays 100,000x", "Multiple bet types per ticket"] },
  sports:  { description: "Live sports betting across football, cricket, basketball, tennis and more with real-time odds.", rules: ["Pre-match and in-play markets available", "Min stake ৳10, max payout ৳500,000", "Cash out available on selected markets", "Odds update in real-time"] },
  casino:  { description: "Live Casino streams real dealers and real tables from professional studios — Baccarat, Roulette, Blackjack, Dragon Tiger.", rules: ["24/7 live HD streaming", "Multi-camera dealer view", "Side bets and bet behind available", "Min/max table limits vary"] },
  fishing: { description: "Arcade-style fishing shooter — aim, fire, and catch high-value fish to multiply your bet.", rules: ["Choose cannon power 1x-1000x", "Each fish has its own multiplier", "Boss fish award jackpot prizes", "Auto-fire mode available"] },
  crash:   { description: "Watch the multiplier climb and cash out before it crashes. The longer you wait, the bigger the win — or the bigger the loss.", rules: ["Multiplier starts at 1.00x and grows", "Cash out anytime before the crash", "Auto cash-out option available", "Provably fair RNG"] },
  aviator: { description: "A plane takes off — your bet multiplies as it flies. Cash out before it disappears for guaranteed profit.", rules: ["Place bet before round starts", "Watch the multiplier rise with the plane", "Cash out before plane flies away", "Up to 2 simultaneous bets per round"] },
  slots:   { description: "Hundreds of premium slot machines from top providers including PG, JILI, Pragmatic Play and more.", rules: ["RTP 95-98% across titles", "Free spins and bonus rounds", "Progressive jackpots on select games", "Min spin ৳1"] },
  mini:    { description: "Quick instant-play games — perfect for short sessions with instant payouts.", rules: ["Rounds complete in under 60s", "Single-bet, single-outcome format", "Provably fair results", "Min bet ৳5"] },
  tower:   { description: "Climb the tower floor by floor — each level multiplies your stake. Cash out anytime or risk it for the top.", rules: ["Choose difficulty: Easy/Medium/Hard", "Pick safe tile per floor", "Cash out anytime to lock winnings", "Reach top floor for max multiplier"] },
  plinko:  { description: "Drop the ball through the pegs and watch where it lands — outer slots pay the biggest multipliers.", rules: ["Choose rows: 8 to 16", "Risk level: Low/Medium/High", "Multipliers up to 1000x on high risk", "Auto-bet up to 1000 rounds"] },
  ludo:    { description: "Classic board game reimagined with real stakes — race your pieces home before opponents do.", rules: ["2 or 4 player tables", "Standard ludo rules apply", "Entry fees from ৳10 to ৳5000", "Winner takes the pot minus 5% rake"] },
};
function buildDetail(src: any): GameDetail {
  const r = RULES[src.key] || { description: src.desc || "Premium GoLucky game.", rules: ["Provably fair results", "Instant payouts"] };
  return {
    title: src.title,
    art: src.art,
    tint: src.ringA || src.tint || "#10E07A",
    to: src.to,
    players: src.players,
    description: r.description,
    rules: r.rules,
  };
}

export default function GamesLobby() {
  const nav = useNavigate();
  const [slide, setSlide] = useState(0);
  const [activeCat, setActiveCat] = useState("all");
  const [coin] = useState(15489.5);
  const [wallet, setWallet] = useState(12129.29);
  const [notif] = useState(8);
  const [name, setName] = useState("Lok");
  const [vip] = useState(8);
  const slideRef = useRef<HTMLDivElement>(null);
  const [detail, setDetail] = useState<GameDetail | null>(null);

  // pull wallet + name (best-effort, falls back to static)
  useEffect(() => {
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u?.user) return;
        const [{ data: p }, { data: w }] = await Promise.all([
          supabase.from("profiles").select("username,full_name").eq("id", u.user.id).maybeSingle(),
          supabase.from("wallets").select("balance").eq("user_id", u.user.id).maybeSingle(),
        ]);
        if (p) setName((p as any).username || (p as any).full_name || name);
        if (w && (w as any).balance != null) setWallet(Number((w as any).balance));
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // hero auto-slide
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4500);
    return () => clearInterval(id);
  }, []);

  const slideData = SLIDES[slide];

  return (
    <>
      {/* ===== DESKTOP (≥ lg) ===== */}
      <div className="hidden lg:block">
        <GamesLobbyDesktop
          walletBalance={wallet}
          userName={name}
          vipLevel={vip}
          notif={notif}
          onOpenDetail={(k) => {
            const src = FEATURED.find(f => f.key === k) || TRENDING.find(t => t.key === k);
            if (src) setDetail(buildDetail(src));
          }}
        />
        <GameDetailModal detail={detail} onClose={() => setDetail(null)} onPlay={(to) => { setDetail(null); nav(to); }} />
      </div>

      {/* ===== MOBILE / TABLET (< lg) ===== */}
      <div className="min-h-screen w-full pb-28 lg:hidden" style={{ background: "#000" }}>
        <div className="mx-auto w-full max-w-[430px] px-3 pt-3 space-y-3">

        {/* ===== HEADER ===== */}
        <div className="flex items-center gap-2">
          <button
            aria-label="Menu"
            className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[#0B1220]"
          >
            <Menu className="h-5 w-5 text-white/90" />
          </button>

          <div className="px-1">
            <div className="text-[22px] font-black leading-none">
              <span className="text-emerald-400">Go</span>
              <span className="text-white">Lucky</span>
              <span className="ml-1 text-amber-300">👑</span>
            </div>
            <div className="mt-1 flex gap-1 text-[9px] font-bold tracking-[2px] text-emerald-400">
              PLAY <span className="text-amber-300">•</span> WIN <span className="text-amber-300">•</span> EARN
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Lucky Coin */}
            <button
              onClick={() => nav("/activity")}
              className="flex h-12 items-center gap-2 rounded-2xl border border-amber-400/30 bg-gradient-to-b from-[#1A1405] to-[#0B0902] px-2.5"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-[12px]">🪙</span>
              <span className="text-left leading-tight">
                <span className="block text-[9px] font-semibold text-amber-200/80">Lucky Coin</span>
                <span className="block text-[12px] font-extrabold text-amber-300 tabular-nums">{bdt(coin)}</span>
              </span>
              <span className="ml-1 grid h-5 w-5 place-items-center rounded-full bg-amber-400/20 text-amber-300">
                <Plus className="h-3 w-3" />
              </span>
            </button>

            {/* Wallet */}
            <button
              onClick={() => nav("/wallet")}
              className="flex h-12 items-center gap-2 rounded-2xl border border-emerald-400/30 bg-gradient-to-b from-[#06231A] to-[#02110C] px-2.5"
            >
              <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-emerald-300 to-emerald-700 text-[12px]">👛</span>
              <span className="text-left leading-tight">
                <span className="block text-[9px] font-semibold text-emerald-200/80">Wallet Balance</span>
                <span className="block text-[12px] font-extrabold text-emerald-300 tabular-nums">৳ {bdt(wallet)}</span>
              </span>
              <span className="ml-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-400/20 text-emerald-300">
                <Plus className="h-3 w-3" />
              </span>
            </button>
          </div>
        </div>

        <div className="-mt-1 flex items-center justify-end gap-2">
          {/* Bell */}
          <button
            onClick={() => nav("/notifications")}
            className="relative grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[#0B1220]"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-white/90" />
            {notif > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {notif}
              </span>
            )}
          </button>

          {/* Profile chip */}
          <button
            onClick={() => nav("/account")}
            className="flex h-12 items-center gap-2 rounded-2xl border border-amber-400/30 bg-[#0B1220] px-2"
          >
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-[14px]">
              👤
            </div>
            <div className="text-left leading-tight">
              <div className="flex items-center gap-1 text-[12px] font-bold text-white">
                {name} <Crown className="h-3 w-3 text-amber-300" />
              </div>
              <div className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-400 to-amber-600 px-1.5 py-[1px] text-[9px] font-extrabold text-black">
                VIP {vip}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-white/60" />
          </button>
        </div>

        {/* ===== HERO ===== */}
        <div
          ref={slideRef}
          className="relative overflow-hidden rounded-3xl border border-emerald-400/20"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 0%, rgba(0,210,122,.18) 0%, rgba(0,0,0,0) 60%), linear-gradient(180deg,#020912 0%, #000 100%)",
          }}
        >
          {/* radial glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                 style={{ background: "radial-gradient(closest-side, rgba(0,210,122,.35), transparent 70%)" }} />
          </div>

          <div className="relative grid grid-cols-[1fr_120px] gap-3 p-4">
            <div className="z-10 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold tracking-[2px] text-emerald-400">{slideData.tag}</div>
                <h1 className="mt-1 text-[26px] font-black leading-[1] text-white drop-shadow">{slideData.t1}</h1>
                <h1
                  className="text-[26px] font-black leading-[1]"
                  style={{ background: "linear-gradient(180deg,#FFD86B,#F59E0B)", WebkitBackgroundClip: "text", color: "transparent" }}
                >
                  {slideData.t2}
                </h1>
                <p className="mt-2 max-w-[180px] text-[11px] leading-snug text-white/70">{slideData.sub}</p>
              </div>
              <button
                onClick={() => setActiveCat("popular")}
                className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 px-4 py-2 text-[12px] font-bold text-black shadow-[0_8px_24px_-8px_rgba(0,210,122,.7)]"
              >
                Explore Games <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Side cards */}
            <div className="z-10 flex flex-col gap-2">
              {SIDE_CARDS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => nav(c.to)}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-2 py-2 text-left backdrop-blur"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `${c.tint}22`, color: c.tint }}>
                    <c.icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 leading-tight">
                    <span className="block text-[10px] font-extrabold tracking-wide text-white">{c.label}</span>
                    <span className="block text-[9px] text-white/60">{c.count} Games</span>
                  </span>
                  <ChevronRight className="h-4 w-4" style={{ color: c.tint }} />
                </button>
              ))}
            </div>

            {/* Mascot */}
            <img
              src={heroG}
              alt=""
              aria-hidden
              className="pointer-events-none absolute right-[100px] top-1/2 z-0 h-[180px] -translate-y-1/2 object-contain"
              style={{ filter: "drop-shadow(0 10px 30px rgba(245,197,66,.45))" }}
            />
          </div>

          {/* Dots */}
          <div className="relative z-10 flex items-center justify-center gap-1.5 pb-3">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === slide ? "w-5 bg-amber-300" : "w-1.5 bg-white/25"}`}
              />
            ))}
          </div>
        </div>

        {/* ===== CATEGORY BAR ===== */}
        <div className="-mx-3 overflow-x-auto px-3 [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2">
            {CATEGORIES.map((c) => {
              const active = c.key === activeCat;
              return (
                <button
                  key={c.key}
                  onClick={() => setActiveCat(c.key)}
                  className="relative flex w-[72px] flex-col items-center gap-1 rounded-2xl border px-2 py-2 transition"
                  style={{
                    borderColor: active ? `${c.tint}80` : "rgba(255,255,255,.08)",
                    background: active ? `linear-gradient(180deg, ${c.tint}33, #0B1220)` : "#0B1220",
                  }}
                >
                  {c.flag && (
                    <span className="absolute -top-1 left-1 rounded-md bg-rose-500 px-1 py-[1px] text-[8px] font-extrabold text-white">
                      {c.flag}
                    </span>
                  )}
                  <span className="grid h-9 w-9 place-items-center rounded-xl text-[18px]"
                        style={{ background: active ? `${c.tint}33` : "#0B1A2A" }}>
                    {c.emoji}
                  </span>
                  <span className="text-[10px] font-bold" style={{ color: active ? "#fff" : "rgba(255,255,255,.7)" }}>
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== FEATURED GAMES ===== */}
        <SectionHeader icon={<Star className="h-4 w-4 text-amber-300" />} title="FEATURED GAMES" onView={() => nav("/popular")} />
        <div className="-mx-3 overflow-x-auto px-3 [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-3">
            {FEATURED.map((g) => (
              <FeaturedCard key={g.key} g={g} onClick={() => setDetail(buildDetail(g))} />
            ))}
          </div>
        </div>

        {/* ===== TRADING MARKETS ===== */}
        <SectionHeader icon={<Sparkles className="h-4 w-4 text-amber-300" />} title="TRADING MARKETS" onView={() => nav("/trading")} />
        <div className="-mx-3 overflow-x-auto px-3 [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-3">
            {[
              { key: "trading", title: "GoLucky Trading", emoji: "📈", ringA: "#10E07A", ringB: "#04140C", to: "/trading", badge: "HOT" as const, desc: "Binary up/down on GLC, NOVA & majors." },
              { key: "crypto",  title: "Crypto",          emoji: "₿",  ringA: "#F59E0B", ringB: "#2A1A03", to: "/trading?cat=crypto", badge: "HOT" as const, desc: "BTC, ETH, BNB and more — 24/7 markets." },
              { key: "forex",   title: "Forex",           emoji: "💱", ringA: "#3B82F6", ringB: "#04101F", to: "/trading?cat=forex",  badge: "NEW" as const, desc: "Trade EUR/USD, GBP/USD and global FX pairs." },
            ].map((g) => (
              <button
                key={g.key}
                onClick={() => nav(g.to)}
                data-testid={`game-card-trading-${g.key}`}
                data-card-key={g.key}
                data-card-section="trading"
                className="group relative w-[142px] shrink-0 rounded-2xl border border-white/10 bg-[#0B1220] p-2 text-left transition-transform duration-300 hover:-translate-y-1 hover:border-white/20"
              >
                <div
                  className="relative grid h-[160px] place-items-center overflow-hidden rounded-xl text-[68px]"
                  style={{
                    background: `radial-gradient(90% 70% at 50% 35%, ${g.ringA}AA 0%, ${g.ringA}33 40%, transparent 75%), linear-gradient(180deg, ${g.ringB} 0%, #02060A 100%)`,
                    boxShadow: `inset 0 0 0 1px ${g.ringA}33, inset 0 -20px 40px -20px ${g.ringA}55`,
                  }}
                >
                  <span className={`absolute left-1.5 top-1.5 rounded-md px-1.5 py-[2px] text-[9px] font-extrabold text-white ${g.badge === "HOT" ? "bg-rose-500" : "bg-emerald-500"}`}>
                    {g.badge}
                  </span>
                  <span style={{ filter: `drop-shadow(0 10px 18px ${g.ringA}cc)` }}>{g.emoji}</span>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end gap-1.5 rounded-xl bg-gradient-to-t from-black/95 via-black/70 to-black/20 p-2.5 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                    <div className="text-center text-[12px] font-extrabold text-white leading-tight">{g.title}</div>
                    <div className="line-clamp-2 text-center text-[9px] font-medium leading-snug text-white/75">{g.desc}</div>
                  </div>
                </div>
                <div className="mt-2 text-[13px] font-extrabold text-white">{g.title}</div>
                <div className="mt-0.5 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-white/60">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
                  </div>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-black shadow-[0_6px_14px_-4px_rgba(0,210,122,.7)]">
                    <Play className="h-3.5 w-3.5" fill="currentColor" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ===== TRENDING GAMES ===== */}
        <SectionHeader icon={<Crown className="h-4 w-4 text-amber-300" />} title="TRENDING GAMES" onView={() => nav("/popular?c=trending")} />

        <div className="-mx-3 overflow-x-auto px-3 [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2.5">
            {TRENDING.map((t) => (
              <button
                key={t.key}
                onClick={() => setDetail(buildDetail(t))}
                data-testid={`game-card-trending-${t.key}`}
                data-card-key={t.key}
                data-card-section="trending"
                className="group relative w-[110px] shrink-0 rounded-2xl border border-white/10 bg-[#0B1220] p-2 text-left transition-transform duration-300 hover:-translate-y-1 hover:border-white/20"
              >
                <div
                  className="relative grid h-[90px] place-items-center overflow-hidden rounded-xl text-[36px]"
                  style={{
                    background: `radial-gradient(100% 80% at 50% 30%, ${t.tint}99 0%, ${t.tint}22 50%, transparent 80%), linear-gradient(180deg, #0a0f1a 0%, #03060A 100%)`,
                    boxShadow: `inset 0 0 0 1px ${t.tint}33`,
                  }}
                >
                  <img
                    src={t.art}
                    alt={t.title}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="h-[78px] w-[78px] object-contain transition-transform duration-500 group-hover:scale-110"
                    style={{ filter: `drop-shadow(0 6px 12px ${t.tint}aa)` }}
                  />
                  <button
                    aria-label="Favorite"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/40 backdrop-blur"
                  >
                    <Heart className="h-3.5 w-3.5 text-white/80" />
                  </button>
                  {/* Hover preview overlay */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end gap-1 rounded-xl bg-gradient-to-t from-black/95 via-black/70 to-black/10 p-1.5 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                    <img
                      src={t.art}
                      alt=""
                      aria-hidden
                      className="h-[54px] w-[54px] object-contain"
                      style={{ filter: `drop-shadow(0 6px 14px ${t.tint}ee)` }}
                    />
                    <div className="text-center text-[10px] font-extrabold leading-tight text-white">{t.title}</div>
                    {(t as any).desc && (
                      <div className="line-clamp-2 text-center text-[8px] font-medium leading-snug text-white/75">
                        {(t as any).desc}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-1.5 text-[12px] font-extrabold text-white">{t.title}</div>
                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-white/60">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {playersFmt(t.players)} Playing
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ===== GAME PROVIDERS ===== */}
        <SectionHeader icon={<span className="text-[14px]">🎮</span>} title="GAME PROVIDERS" onView={() => nav("/popular?c=providers")} />
        <div className="-mx-3 overflow-x-auto px-3 [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2">
            {PROVIDERS.map((p) => (
              <div
                key={p.name}
                className="flex h-[60px] min-w-[120px] items-center justify-center rounded-2xl border border-white/10 bg-[#0B1220] px-3"
              >
                <div className="text-center leading-tight">
                  <div className="text-[13px] font-black" style={{ color: p.color }}>{p.name}</div>
                  {p.tag && <div className="text-[8px] font-semibold tracking-wide text-white/60">{p.tag}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== CTA ROW (horizontal) ===== */}
        <div className="-mx-3 overflow-x-auto px-3 pt-1 [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2.5">
            {CTAS.map((c) => (
              <button
                key={c.key}
                onClick={() => nav(c.to)}
                className="relative w-[200px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B1220] to-[#050912] p-3 text-left"
                style={{ boxShadow: `inset 0 0 0 1px ${c.tint}22` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-[11px] font-extrabold tracking-wide" style={{ color: c.tint }}>
                      <Trophy className="h-3.5 w-3.5" /> {c.title}
                    </div>
                    <div className="mt-1 text-[10px] text-white/65">{c.sub}</div>
                  </div>
                  <div className="text-[30px] leading-none" style={{ filter: `drop-shadow(0 6px 12px ${c.tint}88)` }}>{c.emoji}</div>
                </div>
                <span
                  className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style={{ background: `${c.tint}22`, color: c.tint, border: `1px solid ${c.tint}55` }}
                >
                  {c.btn} <ChevronRight className="h-3 w-3" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <GameDetailModal detail={detail} onClose={() => setDetail(null)} onPlay={(to) => { setDetail(null); nav(to); }} />
      </div>
    </>
  );
}

/* =================== sub-components =================== */

function GameDetailModal({ detail, onClose, onPlay }: { detail: GameDetail | null; onClose: () => void; onPlay: (to: string) => void }) {
  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [detail, onClose]);
  if (!detail) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={`${detail.title} details`}>
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-[430px] overflow-hidden rounded-t-3xl border border-white/10 bg-[#0B1220] sm:rounded-3xl"
        style={{ boxShadow: `0 -10px 60px -10px ${detail.tint}66` }}
      >
        <div
          className="relative grid h-[200px] place-items-center overflow-hidden"
          style={{ background: `radial-gradient(80% 70% at 50% 35%, ${detail.tint}AA 0%, ${detail.tint}33 40%, transparent 75%), linear-gradient(180deg, #0a0f1a 0%, #02060A 100%)` }}
        >
          <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/50 backdrop-blur">
            <X className="h-4 w-4 text-white" />
          </button>
          <img src={detail.art} alt={detail.title} className="h-[160px] w-[160px] object-contain" style={{ filter: `drop-shadow(0 14px 24px ${detail.tint}dd)` }} />
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-black text-white">{detail.title}</h2>
            {detail.players != null && (
              <div className="flex items-center gap-1 text-[11px] text-white/60">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {playersFmt(detail.players)} Playing
              </div>
            )}
          </div>
          <p className="text-[12px] leading-relaxed text-white/75">{detail.description}</p>
          <div>
            <div className="mb-1.5 text-[11px] font-extrabold tracking-wide text-white/90">HOW TO PLAY</div>
            <ul className="space-y-1.5">
              {detail.rules.map((r, i) => (
                <li key={i} className="flex gap-2 text-[12px] text-white/75">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-black text-black" style={{ background: detail.tint }}>{i + 1}</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 bg-black/40 p-3">
          <button
            onClick={() => onPlay(detail.to)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[14px] font-extrabold text-black transition-transform active:scale-[0.98]"
            style={{ background: `linear-gradient(180deg, ${detail.tint} 0%, ${detail.tint}cc 100%)`, boxShadow: `0 10px 24px -8px ${detail.tint}aa` }}
          >
            <Play className="h-4 w-4" fill="currentColor" /> Play Now
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, onView }: { icon: React.ReactNode; title: string; onView: () => void }) {
  return (
    <div className="flex items-center justify-between pt-2">
      <div className="flex items-center gap-1.5 text-[12px] font-extrabold tracking-wide text-white">
        {icon} {title}
      </div>
      <button onClick={onView} className="flex items-center gap-0.5 text-[11px] font-bold text-amber-300">
        View All <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function FeaturedCard({ g, onClick }: { g: Featured; onClick: () => void }) {
  const badgeBg: Record<Badge, string> = {
    HOT: "bg-rose-500",
    NEW: "bg-emerald-500",
    TOP: "bg-amber-500",
    VIP: "bg-violet-500",
  };
  return (
    <button
      onClick={onClick}
      data-testid={`game-card-featured-${g.key}`}
      data-card-key={g.key}
      data-card-section="featured"
      className="group relative w-[142px] shrink-0 rounded-2xl border border-white/10 bg-[#0B1220] p-2 text-left transition-transform duration-300 hover:-translate-y-1 hover:border-white/20"
    >
      <div
        className="relative grid h-[160px] place-items-center overflow-hidden rounded-xl text-[68px]"
        style={{
          background: `radial-gradient(90% 70% at 50% 35%, ${g.ringA}AA 0%, ${g.ringA}33 40%, transparent 75%), linear-gradient(180deg, ${g.ringB} 0%, #02060A 100%)`,
          boxShadow: `inset 0 0 0 1px ${g.ringA}33, inset 0 -20px 40px -20px ${g.ringA}55`,
        }}
      >
        <span className={`absolute left-1.5 top-1.5 rounded-md px-1.5 py-[2px] text-[9px] font-extrabold text-white ${badgeBg[g.badge]}`}>
          {g.badge}
        </span>
        <button
          aria-label="Favorite"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/40 backdrop-blur"
        >
          <Heart className="h-3.5 w-3.5 text-white/80" />
        </button>
        <img
          src={g.art}
          alt={g.title}
          loading="lazy"
          width={512}
          height={512}
          className="h-[120px] w-[120px] object-contain transition-transform duration-500 group-hover:scale-110"
          style={{ filter: `drop-shadow(0 10px 18px ${g.ringA}cc)` }}
        />
        {/* Hover preview overlay */}
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end gap-1.5 rounded-xl bg-gradient-to-t from-black/95 via-black/70 to-black/20 p-2.5 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100"
        >
          <img
            src={g.art}
            alt=""
            aria-hidden
            className="h-[80px] w-[80px] object-contain"
            style={{ filter: `drop-shadow(0 8px 20px ${g.ringA}ee)` }}
          />
          <div className="text-center text-[12px] font-extrabold text-white leading-tight">{g.title}</div>
          {g.desc && (
            <div className="line-clamp-2 text-center text-[9px] font-medium leading-snug text-white/75">
              {g.desc}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 text-[13px] font-extrabold text-white">{g.title}</div>
      <div className="mt-0.5 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[10px] text-white/60">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {playersFmt(g.players)} Playing
        </div>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-black shadow-[0_6px_14px_-4px_rgba(0,210,122,.7)]">
          <Play className="h-3.5 w-3.5" fill="currentColor" />
        </span>
      </div>
    </button>
  );
}
