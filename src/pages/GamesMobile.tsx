import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Plus, Bell, ChevronRight, Heart, Crown, Flame, Sparkles } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import logoText from "@/assets/golucky-text-logo-transparent.png";

/* ----------------------------- Data ------------------------------------ */

type Cat = {
  key: string;
  title: string;
  sub: string;
  emoji: string;
  route: string;
  ring: string;   // border / glow color
  bg: string;     // radial background tint
  text: string;   // title color
};

const CATS: Cat[] = [
  { key: "all",     title: "ALL GAME",       sub: "120+ GAMES",       emoji: "🎮", route: "/games?c=all",       ring: "#f5d442", bg: "rgba(245,212,66,.12)",  text: "#f5d442" },
  { key: "lottery", title: "LOTTERY",        sub: "WINGO, K3, 5D, TRX", emoji: "🎱", route: "/games?c=lottery",   ring: "#a855f7", bg: "rgba(168,85,247,.15)",  text: "#c084fc" },
  { key: "trading", title: "GOLUCKY TRADING", sub: "TRADE & EARN",     emoji: "🐂", route: "/trading",           ring: "#10b981", bg: "rgba(16,185,129,.15)",  text: "#34d399" },
  { key: "forex",   title: "FOREX TRADING",  sub: "TRADE & EARN",     emoji: "💱", route: "/trading?type=forex", ring: "#3b82f6", bg: "rgba(59,130,246,.15)",  text: "#60a5fa" },
  { key: "crypto",  title: "CRYPTO TRADING", sub: "TRADE & EARN",     emoji: "₿",  route: "/trading?type=crypto", ring: "#f59e0b", bg: "rgba(245,158,11,.15)",  text: "#fbbf24" },
  { key: "aviator", title: "AVIATOR",        sub: "FLY HIGH, WIN BIG", emoji: "✈️", route: "/aviator",           ring: "#ef4444", bg: "rgba(239,68,68,.15)",   text: "#f87171" },
  { key: "crash",   title: "CRASH",          sub: "INSTANT CASH",     emoji: "🚀", route: "/crash",             ring: "#fb923c", bg: "rgba(251,146,60,.15)",  text: "#fdba74" },
  { key: "slots",   title: "SLOTS",          sub: "150+ GAMES",       emoji: "🎰", route: "/games?c=slot",      ring: "#f59e0b", bg: "rgba(245,158,11,.15)",  text: "#fbbf24" },
  { key: "fishing", title: "FISHING",        sub: "CATCH FISH, WIN COINS", emoji: "🦈", route: "/games?c=fishing", ring: "#38bdf8", bg: "rgba(56,189,248,.15)", text: "#7dd3fc" },
  { key: "table",   title: "TABLE",          sub: "POKER & MORE",     emoji: "🃏", route: "/games?c=table",     ring: "#22c55e", bg: "rgba(34,197,94,.15)",   text: "#4ade80" },
  { key: "arcade",  title: "ARCADE",         sub: "RETRO & MODERN",   emoji: "🕹️", route: "/games?c=arcade",    ring: "#a855f7", bg: "rgba(168,85,247,.15)",  text: "#c084fc" },
  { key: "live",    title: "LIVE CASINO",    sub: "REAL DEALERS",     emoji: "🎥", route: "/games?c=live",      ring: "#ef4444", bg: "rgba(239,68,68,.15)",   text: "#f87171" },
];

const POPULAR = [
  { name: "Sweet Bonanza",   emoji: "🍭", tint: "from-pink-500/40 to-fuchsia-700/40" },
  { name: "Gates of Olympus", emoji: "⚡", tint: "from-indigo-500/40 to-purple-700/40" },
  { name: "Aviator",         emoji: "✈️", tint: "from-red-500/40 to-rose-800/40" },
  { name: "Big Bass Splash", emoji: "🎣", tint: "from-emerald-500/40 to-teal-700/40" },
  { name: "Roulette Live",   emoji: "🎡", tint: "from-amber-500/40 to-orange-700/40" },
  { name: "Blackjack",       emoji: "🂡", tint: "from-slate-500/40 to-slate-800/40" },
  { name: "Monopoly",        emoji: "🎩", tint: "from-red-500/40 to-orange-700/40" },
  { name: "Lightning",       emoji: "⚡", tint: "from-amber-500/40 to-yellow-700/40" },
  { name: "Frazy Crazy",     emoji: "🎯", tint: "from-purple-500/40 to-indigo-800/40" },
  { name: "Crazy Timer",     emoji: "🍓", tint: "from-rose-500/40 to-pink-700/40" },
  { name: "Buffalo King",    emoji: "📖", tint: "from-amber-500/40 to-yellow-800/40" },
  { name: "Mehing Roulette", emoji: "🤠", tint: "from-orange-500/40 to-amber-800/40" },
  { name: "Wolf Gold",       emoji: "🐺", tint: "from-cyan-500/40 to-blue-800/40" },
  { name: "Fruit Party",     emoji: "🍓", tint: "from-pink-500/40 to-rose-700/40" },
  { name: "Book of Deed",    emoji: "📕", tint: "from-amber-600/40 to-yellow-800/40" },
  { name: "Mega Ball",       emoji: "🎩", tint: "from-emerald-500/40 to-green-800/40" },
  { name: "Pearl Legend",    emoji: "🐚", tint: "from-sky-500/40 to-cyan-800/40" },
  { name: "Fire Joker",      emoji: "🃏", tint: "from-orange-500/40 to-red-800/40" },
  { name: "Medusa Megaways", emoji: "🧝‍♀️", tint: "from-emerald-500/40 to-teal-800/40" },
  { name: "Joker's Jewels",  emoji: "🎭", tint: "from-purple-500/40 to-fuchsia-800/40" },
];

import { GAME_PROVIDERS as PROVIDERS } from "@/data/gameProviders";

/* --------------------------- Helpers ----------------------------------- */

const bdt = (n: number) =>
  "৳ " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ----------------------------- Page ----------------------------------- */

export default function GamesMobile() {
  const navigate = useNavigate();
  const [jackpot, setJackpot] = useState(25789250.5);

  useEffect(() => {
    const t = setInterval(() => setJackpot((j) => j + Math.random() * 12), 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="min-h-screen w-full text-white"
      style={{
        background:
          "radial-gradient(1200px 600px at 50% -10%, rgba(16,185,129,.10), transparent 60%), #02070a",
      }}
    >
      <div className="mx-auto w-full max-w-[430px] pb-28">
        {/* ================= HEADER ================= */}
        <header className="flex items-center gap-2 px-3 pt-3">
          <button className="p-2 -ml-1 text-white/80" aria-label="Menu">
            <Menu size={22} />
          </button>
          <img src={logoText} alt="GoLucky" className="h-8 w-auto" />
          <div className="flex-1" />
          <div className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 pl-3 pr-1 py-1">
            <span className="text-[13px] font-semibold tabular-nums">25,850.50</span>
            <button
              onClick={() => navigate("/deposit")}
              className="ml-1 h-6 w-6 grid place-items-center rounded-full bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,.6)]"
              aria-label="Deposit"
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>
          <button
            onClick={() => navigate("/vip")}
            className="flex items-center gap-1 rounded-full pl-2 pr-2 py-1 border border-amber-400/50 bg-amber-500/10"
          >
            <Crown size={14} className="text-amber-300" />
            <span className="text-[12px] font-bold text-amber-300">VIP 5</span>
            <ChevronRight size={12} className="text-amber-300" />
          </button>
          <button className="relative p-1.5 text-white/80" aria-label="Notifications">
            <Bell size={20} />
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[10px] font-bold grid place-items-center">
              5
            </span>
          </button>
          <button
            onClick={() => navigate("/account")}
            className="h-8 w-8 rounded-full border-2 border-emerald-400 overflow-hidden shrink-0 relative"
          >
            <div className="w-full h-full bg-gradient-to-br from-amber-300 to-orange-500" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-black" />
          </button>
        </header>

        {/* ================= AGENT HERO ================= */}
        <section className="mx-3 mt-3 rounded-2xl border border-emerald-400/40 overflow-hidden relative"
          style={{
            background:
              "radial-gradient(120% 100% at 0% 0%, rgba(16,185,129,.35), transparent 55%), radial-gradient(100% 100% at 100% 100%, rgba(245,158,11,.25), transparent 55%), linear-gradient(180deg, #06110d 0%, #04140e 100%)",
            boxShadow: "0 0 40px rgba(16,185,129,.25) inset",
          }}
        >
          <div className="grid grid-cols-[92px_1fr_112px] gap-2 p-3">
            <div className="rounded-xl bg-gradient-to-b from-emerald-900/70 to-emerald-950 border border-emerald-400/30 grid place-items-center text-5xl">
              🕴️
            </div>
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.18em] text-emerald-300/90 font-semibold">
                BECOME OUR
              </p>
              <h2 className="text-[19px] leading-tight font-black bg-gradient-to-b from-amber-200 to-amber-500 bg-clip-text text-transparent">
                AGENT &amp; EARN
              </h2>
              <ul className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-white/85">
                <li className="flex items-center gap-1"><span className="text-emerald-400">★</span>High Commission</li>
                <li className="flex items-center gap-1"><span className="text-emerald-400">★</span>Lifetime Earning</li>
                <li className="flex items-center gap-1"><span className="text-emerald-400">●</span>Daily Payout</li>
                <li className="flex items-center gap-1"><span className="text-emerald-400">●</span>24/7 Support</li>
              </ul>
              <button
                onClick={() => navigate("/agent-apply")}
                className="mt-2 w-full flex items-center justify-center gap-1.5 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-black text-[11px] font-bold shadow-[0_0_18px_rgba(16,185,129,.55)]"
              >
                JOIN AGENT PROGRAM
                <ChevronRight size={14} strokeWidth={3} />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="rounded-lg bg-black/40 border border-emerald-400/25 px-2 py-1.5">
                <p className="text-[9px] text-emerald-300/80 uppercase font-bold tracking-wide">Earn up to</p>
                <p className="text-[18px] font-black text-amber-300 leading-none">40%</p>
                <p className="text-[9px] text-white/70 uppercase">Commission</p>
              </div>
              <div className="rounded-lg bg-black/40 border border-emerald-400/25 px-2 py-1">
                <p className="text-[8.5px] text-emerald-300/80 uppercase font-bold">Total Agents</p>
                <p className="text-[12px] font-black text-white">25,000+</p>
              </div>
              <div className="rounded-lg bg-black/40 border border-emerald-400/25 px-2 py-1">
                <p className="text-[8.5px] text-emerald-300/80 uppercase font-bold">Total Earned</p>
                <p className="text-[11px] font-black text-amber-300">৳ 1,250,000+</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-3 mt-3 rounded-2xl border border-amber-400/40 p-3 flex items-center gap-2"
          style={{
            background:
              "linear-gradient(90deg, rgba(245,158,11,.18) 0%, rgba(2,7,10,.6) 55%, rgba(59,130,246,.15) 100%)",
          }}
        >
          <div className="h-11 w-11 rounded-lg grid place-items-center text-2xl bg-amber-500/20 border border-amber-400/40">
            🎰
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-amber-300 tracking-widest">MEGA JACKPOT</p>
            <p className="text-[16px] font-black text-amber-200 tabular-nums truncate">{bdt(jackpot)}</p>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {[
              { l: "MAJOR", v: "৳ 5,789,250", c: "text-amber-300" },
              { l: "MINOR", v: "৳ 789,250",   c: "text-sky-300" },
              { l: "MINI",  v: "৳ 289,250",   c: "text-fuchsia-300" },
            ].map((x) => (
              <div key={x.l} className="rounded-md bg-black/40 border border-white/10 px-1.5 py-1">
                <p className={`text-[9px] font-bold ${x.c}`}>{x.l}</p>
                <p className="text-[9px] font-semibold text-white/90 whitespace-nowrap">{x.v}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5 flex items-center justify-center gap-2">
          <Sparkles size={12} className="text-amber-300" />
          <p className="text-[11px] font-bold tracking-[0.25em] text-amber-300">PLAY &amp; WIN BIG EVERY DAY</p>
          <Sparkles size={12} className="text-amber-300" />
        </div>

        <section className="mx-3 mt-3 grid grid-cols-3 gap-2.5">
          {CATS.map((c) => (
            <button
              key={c.key}
              onClick={() => navigate(c.route)}
              className="relative rounded-xl p-2.5 flex flex-col items-center text-center border transition active:scale-[.97]"
              style={{
                borderColor: c.ring,
                background: `radial-gradient(120% 100% at 50% 0%, ${c.bg}, rgba(0,0,0,.5)), #050d10`,
                boxShadow: `0 0 14px ${c.ring}33, inset 0 0 12px ${c.ring}22`,
              }}
            >
              <div className="text-[30px] leading-none mb-1.5 drop-shadow-[0_2px_6px_rgba(0,0,0,.6)]">
                {c.emoji}
              </div>
              <p className="text-[11px] font-black leading-tight" style={{ color: c.text, textShadow: `0 0 8px ${c.ring}88` }}>
                {c.title}
              </p>
              <p className="text-[8.5px] text-white/70 mt-0.5">{c.sub}</p>
              <span
                className="mt-1.5 h-5 w-5 rounded-full grid place-items-center"
                style={{ background: c.ring, boxShadow: `0 0 10px ${c.ring}` }}
              >
                <ChevronRight size={12} className="text-black" strokeWidth={3} />
              </span>
            </button>
          ))}
        </section>

        <div className="mx-3 mt-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame size={16} className="text-orange-400" />
            <h3 className="text-[13px] font-black tracking-wide">MOST POPULAR</h3>
          </div>
          <button
            onClick={() => navigate("/games?c=featured")}
            className="flex items-center gap-1 text-[11px] font-semibold text-white/85 border border-white/15 rounded-full px-3 py-1 bg-white/5"
          >
            View All <ChevronRight size={12} />
          </button>
        </div>

        <section className="mx-3 mt-2.5 grid grid-cols-4 gap-2">
          {POPULAR.map((g, i) => (
            <button
              key={i}
              onClick={() => navigate("/games?c=featured")}
              className="relative rounded-lg overflow-hidden aspect-[4/5] border border-white/10 active:scale-[.97] transition"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${g.tint}`} />
              <div className="absolute inset-0 grid place-items-center text-4xl opacity-90">
                {g.emoji}
              </div>
              <span className="absolute top-1 left-1 text-[8px] font-black bg-red-500 text-white px-1.5 py-[1px] rounded-sm shadow">
                HOT
              </span>
              <button className="absolute top-1 right-1 text-white/90" aria-label="Favorite">
                <Heart size={11} />
              </button>
              <div className="absolute inset-x-0 bottom-0 pt-6 pb-1 px-1 text-center bg-gradient-to-t from-black/85 to-transparent">
                <p className="text-[9.5px] font-black leading-tight text-white truncate">{g.name}</p>
              </div>
            </button>
          ))}
        </section>

        <div className="mx-3 mt-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-300" />
            <h3 className="text-[12px] font-black tracking-[0.2em] text-amber-300">TOP GAME PROVIDERS</h3>
            <Sparkles size={12} className="text-amber-300" />
          </div>
          <button className="flex items-center gap-1 text-[11px] font-semibold text-white/85 border border-white/15 rounded-full px-3 py-1 bg-white/5">
            View All <ChevronRight size={12} />
          </button>
        </div>
        <section className="mx-3 mt-2.5 grid grid-cols-3 gap-2">
          {PROVIDERS.map((p, i) => (
            <div
              key={p.name}
              className={`h-16 rounded-lg border border-white/10 flex flex-col items-center justify-center gap-0.5 px-1 text-center bg-gradient-to-br ${p.tint}`}
            >
              <div className="flex items-center gap-1">
                <span className="text-[11px] leading-none opacity-90">{p.logo}</span>
                <span className="text-[8px] font-bold text-amber-300/80">{i + 1}</span>
              </div>
              <div className="text-[9px] font-black tracking-tight text-white/95 leading-tight line-clamp-2">
                {p.name}
              </div>
            </div>
          ))}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
