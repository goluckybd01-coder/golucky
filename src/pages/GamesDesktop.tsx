import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, Bell, Globe, Play, Flame, Sparkles, Crown, Gift,
  Users, HeadphonesIcon, Wallet, ArrowLeftRight, TrendingUp,
  Star, Shield, ShieldCheck, ChevronRight, DollarSign,
} from "lucide-react";

/* ─── palette (matches HomeDesktop) ─── */
const goldText =
  "bg-gradient-to-r from-[#ffdf6b] via-[#f5c744] to-[#c48a10] bg-clip-text text-transparent";
const emeraldBtn =
  "bg-gradient-to-b from-[#22e58a] to-[#059b4d] text-black shadow-[0_6px_18px_rgba(5,243,149,0.35)]";
const goldBtn =
  "bg-gradient-to-b from-[#ffdf6b] to-[#c48a10] text-black shadow-[0_6px_18px_rgba(245,199,68,.35)]";
const card = "rounded-2xl bg-[#0b1310]/95 border border-[#1a2f24]";

/* ─── data ─── */
const NOTICES = [
  { icon: "🏆", text: "Rakib Hasan Won ৳52,500 in Wingo" },
  { icon: "🎰", text: "Mega Jackpot ৳1,25,78,500.75" },
  { icon: "🔥", text: "New TRX Win Game is Live" },
  { icon: "🎉", text: "Summer Flash Sale is Live" },
  { icon: "💎", text: "New Royal Partner Agent onboarded" },
  { icon: "📈", text: "GLC/USD Trading Winner ৳98,000" },
];

const CATEGORIES = [
  { emoji: "🎮", label: "All Game",       to: "/games?c=all",        color: "#12b76a" },
  { emoji: "🎱", label: "Lottery",        to: "/games?c=lottery",    color: "#38bdf8" },
  { emoji: "📊", label: "GoLucky Trading",to: "/trading",            color: "#22e58a" },
  { emoji: "💱", label: "Forex Trading",  to: "/binary-trading",     color: "#f5c744" },
  { emoji: "₿",  label: "Crypto Trading", to: "/binary-trading",     color: "#f7931a" },
  { emoji: "✈️", label: "Aviator",        to: "/aviator",            color: "#ef4444" },
  { emoji: "🚀", label: "Crash",          to: "/crash",              color: "#f97316" },
  { emoji: "🎰", label: "Slots",          to: "/games?c=slot",       color: "#f5c744" },
  { emoji: "🐟", label: "Fishing",        to: "/games?c=fishing",    color: "#38bdf8" },
  { emoji: "🃏", label: "Table",          to: "/games?c=table",      color: "#ef4444" },
  { emoji: "🕹️", label: "Arcade",         to: "/games?c=arcade",     color: "#a78bfa" },
  { emoji: "🎥", label: "Live Casino",    to: "/games?c=live",       color: "#ec4899" },
];

const FEATURED = [
  "Wingo","K3","5D","TRX Win","Aviator","Crash","Roulette","Blackjack",
  "Baccarat","Dragon Tiger","Fishing King","Golden Empire","Fortune Gems",
  "Book of Gold","Sweet Bonanza","Mega Wheel","Color Trading","Crypto Trading",
  "Lucky Spin","Jackpot",
];

const POPULAR = [
  "Starlight Princess","Gates of Olympus","Sugar Rush","Big Bass Bonanza",
  "Money Train 3","Wanted Dead","Reactoonz","Book of Dead","Buffalo King",
  "Mega Moolah","Wolf Gold","Sweet Alchemy","Dog House","Fire Joker",
  "Bonanza","Wild West Gold","Zeus vs Hades","Fruit Party","Rise of Olympus","Aztec Gems",
];

import { GAME_PROVIDERS as PROVIDERS } from "@/data/gameProviders";
const PAYMENTS = ["bKash","Nagad","Rocket","VISA","Mastercard","BTC","ETH","USDT","TRX"];

const COINS = [
  "GLC/USD","NOVA/USD","BTC/USD","ETH/USD","SOL/USD","XRP/USD","LTC/USD",
  "XAU/USD","XAG/USD","GBP/USD","EUR/USD","XTI/USD","XCU/USD","XNG/USD",
];

const WINNERS = [
  { name: "Rakib H.",   game: "Wingo",   amt: "৳52,500", flag: "🇧🇩" },
  { name: "Nusrat J.",  game: "K3",      amt: "৳31,000", flag: "🇧🇩" },
  { name: "Al Amin",    game: "TRX Win", amt: "৳75,000", flag: "🇧🇩" },
  { name: "Jannat I.",  game: "5D",      amt: "৳21,000", flag: "🇧🇩" },
  { name: "Sakib A.",   game: "Aviator", amt: "৳18,500", flag: "🇧🇩" },
  { name: "MD. Rony",   game: "Casino",  amt: "৳45,000", flag: "🇧🇩" },
  { name: "Farhan K.",  game: "Crash",   amt: "৳62,300", flag: "🇧🇩" },
  { name: "Tania R.",   game: "Slots",   amt: "৳39,900", flag: "🇧🇩" },
];

const TIERS = [
  { name: "STARTER",       color: "#12b76a" },
  { name: "SILVER",        color: "#cbd5e1" },
  { name: "GOLD",          color: "#f5c744" },
  { name: "PLATINUM",      color: "#38bdf8" },
  { name: "DIAMOND",       color: "#c084fc" },
  { name: "ELITE",         color: "#ef4444" },
  { name: "ROYAL PARTNER", color: "#ffcb37" },
];

const LUCKY_HUB = [
  { emoji: "🏦", label: "Fixed Deposit",     to: "/lucky-hub" },
  { emoji: "🎰", label: "Mega Jackpot",      to: "/lucky-hub" },
  { emoji: "🎟️", label: "Lucky Draw",        to: "/lucky-hub" },
  { emoji: "🏆", label: "Tournament",        to: "/lucky-hub" },
  { emoji: "🎯", label: "Campaign",          to: "/lucky-hub" },
  { emoji: "⚡", label: "Special Challenges",to: "/lucky-hub" },
];

/* ─── helpers ─── */
function useJackpot() {
  const [n, setN] = useState(12578500.75);
  useEffect(() => {
    const i = setInterval(() => setN((v) => v + Math.random() * 15), 1500);
    return () => clearInterval(i);
  }, []);
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ─── page ─── */
export default function GamesDesktop() {
  const navigate = useNavigate();
  const jackpot = useJackpot();

  return (
    <div className="min-h-screen bg-[#02070a] text-white relative overflow-x-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-40 left-1/4 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(18,183,106,.18), transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(245,199,68,.15), transparent 70%)", filter: "blur(70px)" }} />
      </div>

      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 bg-[#02070a]/95 backdrop-blur-md border-b border-[#1a2f24]">
        <div className="max-w-[1440px] mx-auto px-5 h-16 flex items-center gap-4">
          <Link to="/home" className="flex flex-col leading-none">
            <span className={`text-2xl font-black ${goldText}`}>GoLucky</span>
            <span className="text-[9px] tracking-[.3em] text-[#f5c744]/80">PLAY · INVEST · EARN</span>
          </Link>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1206] border border-[#f5c744]/40">
            <span className="w-7 h-7 rounded-full grid place-items-center bg-gradient-to-br from-[#f5c744] to-[#c48a10] text-black font-black text-xs">G</span>
            <div className="leading-tight">
              <div className="text-[10px] text-[#f5c744]/70">GoLucky Coin</div>
              <div className={`text-sm font-black ${goldText}`}>GLC 25,850.50</div>
            </div>
          </div>

          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input placeholder="Search 5,000+ games…" className="w-full pl-9 pr-3 h-9 rounded-full bg-[#0b1310] border border-[#1a2f24] text-sm outline-none focus:border-[#12b76a]" />
          </div>

          <nav className="flex items-center gap-1 text-xs font-semibold">
            {[
              { l: "Deposit",   i: <Wallet className="h-3.5 w-3.5" />,        to: "/deposit"  },
              { l: "Withdraw",  i: <ArrowLeftRight className="h-3.5 w-3.5" />,to: "/withdraw" },
              { l: "Transfer",  i: <ArrowLeftRight className="h-3.5 w-3.5" />,to: "/wallet"   },
              { l: "VIP",       i: <Crown className="h-3.5 w-3.5" />,         to: "/vip"      },
              { l: "Rewards",   i: <Gift className="h-3.5 w-3.5" />,          to: "/promotion"},
              { l: "Refer",     i: <Users className="h-3.5 w-3.5" />,         to: "/referral" },
              { l: "Support",   i: <HeadphonesIcon className="h-3.5 w-3.5" />,to: "/support"  },
            ].map((x) => (
              <button key={x.l} onClick={() => navigate(x.to)}
                className="flex items-center gap-1 px-2.5 h-9 rounded-lg hover:bg-white/5 text-white/80 hover:text-white transition">
                {x.i}<span>{x.l}</span>
              </button>
            ))}
          </nav>

          <button className="w-9 h-9 rounded-lg grid place-items-center hover:bg-white/5"><Bell className="h-4 w-4 text-[#f5c744]" /></button>
          <button className="w-9 h-9 rounded-lg grid place-items-center hover:bg-white/5"><Globe className="h-4 w-4 text-white/70" /></button>
          <button onClick={() => navigate("/deposit")} className={`px-4 h-9 rounded-lg text-xs font-black ${emeraldBtn}`}>DEPOSIT</button>
        </div>

        {/* Marquee */}
        <div className="max-w-[1440px] mx-auto px-5 h-10 flex items-center gap-4 overflow-hidden border-t border-[#1a2f24]">
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#12b76a]/20 text-[#12b76a] border border-[#12b76a]/40">NOTICE</span>
          <div className="flex-1 overflow-hidden">
            <div className="flex gap-8 animate-[marquee_38s_linear_infinite] whitespace-nowrap">
              {[...NOTICES, ...NOTICES].map((n, i) => (
                <span key={i} className="text-xs text-white/80">
                  <span className="mr-1">{n.icon}</span>{n.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-5 pt-6 pb-10 space-y-6 relative z-10">
        {/* ── HERO ── */}
        <section className={`${card} relative overflow-hidden`}>
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(60% 90% at 30% 50%, rgba(18,183,106,.18), transparent 60%), radial-gradient(50% 80% at 80% 40%, rgba(245,199,68,.14), transparent 60%)" }} />
          <div className="absolute top-6 right-10 text-6xl opacity-20">🎰</div>
          <div className="absolute bottom-6 right-40 text-4xl opacity-20">🪙</div>

          <div className="relative p-10 grid grid-cols-12 gap-6 items-center">
            <div className="col-span-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#12b76a]/15 border border-[#12b76a]/40 text-[11px] font-bold text-[#12b76a]">
                <Sparkles className="h-3 w-3" /> ULTRA PREMIUM · 2026 EDITION
              </div>
              <h1 className={`mt-3 text-5xl font-black leading-tight ${goldText}`}>
                Welcome to GoLucky Game Lobby
              </h1>
              <p className="mt-3 text-white/70 max-w-xl">
                Play • Win • Earn — 5,000+ games, live casino, trading & tournaments,
                all wrapped in one luxury experience.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={() => navigate("/games?c=all")} className={`px-6 h-11 rounded-lg text-sm font-black ${emeraldBtn}`}>▶ PLAY NOW</button>
                <button onClick={() => navigate("/deposit")}   className={`px-6 h-11 rounded-lg text-sm font-black ${goldBtn}`}>DEPOSIT</button>
                <button onClick={() => navigate("/agent-apply")} className="px-6 h-11 rounded-lg text-sm font-black bg-white/5 border border-[#1a2f24] hover:border-[#f5c744]/50 text-white">BECOME AGENT</button>
              </div>
            </div>
            <div className="col-span-4">
              <div className={`${card} p-5 relative overflow-hidden`}>
                <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 30%, rgba(245,199,68,.15), transparent 60%)" }} />
                <div className="relative text-center">
                  <div className="text-[10px] tracking-[.3em] text-[#f5c744]/70">MEGA JACKPOT</div>
                  <div className={`mt-1 text-3xl font-black tabular-nums ${goldText}`}>৳{jackpot}</div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                    <div className="rounded bg-[#12b76a]/15 border border-[#12b76a]/40 py-1"><b className="text-[#12b76a]">24</b><div className="text-white/50">HRS</div></div>
                    <div className="rounded bg-[#12b76a]/15 border border-[#12b76a]/40 py-1"><b className="text-[#12b76a]">45</b><div className="text-white/50">MIN</div></div>
                    <div className="rounded bg-[#12b76a]/15 border border-[#12b76a]/40 py-1"><b className="text-[#12b76a]">30</b><div className="text-white/50">SEC</div></div>
                  </div>
                  <button onClick={() => navigate("/lucky-hub")} className={`mt-3 w-full py-2 rounded-lg text-xs font-black ${goldBtn}`}>JOIN JACKPOT</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── AGENT HIGHLIGHT ── */}
        <section className={`${card} p-6 relative overflow-hidden`}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(245,199,68,.08), transparent 60%)" }} />
          <div className="relative flex items-center justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[10px] tracking-[.3em] text-[#f5c744]/70">AGENT PROGRAMME</div>
              <div className={`text-2xl font-black ${goldText}`}>Become Official GoLucky Agent</div>
              <div className="mt-1 text-xs text-white/60">7 Categories · High Commission · Instant Settlement · Agent → User Wallet Transfer</div>
            </div>
            <div className="flex items-center gap-2">
              {TIERS.map((t) => (
                <div key={t.name} className="flex flex-col items-center gap-1">
                  <div className="w-9 h-9 rounded-lg grid place-items-center border" style={{ borderColor: `${t.color}66`, boxShadow: `0 0 12px ${t.color}44` }}>
                    <Shield className="h-4 w-4" style={{ color: t.color }} />
                  </div>
                  <div className="text-[8px] font-black tracking-wider" style={{ color: t.color }}>{t.name}</div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate("/agent-apply")} className={`px-6 h-11 rounded-lg text-sm font-black ${goldBtn}`}>JOIN NOW →</button>
          </div>
        </section>

        {/* ── CATEGORY GRID ── */}
        <section>
          <SectionTitle title="🎮 Game Categories" hint="12 luxury categories" />
          <div className="grid grid-cols-4 lg:grid-cols-6 gap-3">
            {CATEGORIES.map((c) => (
              <button key={c.label} onClick={() => navigate(c.to)}
                className={`${card} group relative p-4 flex flex-col items-center gap-2 hover:-translate-y-1 hover:border-[#12b76a]/60 transition`}
                style={{ boxShadow: `inset 0 0 0 1px ${c.color}22` }}>
                <div className="w-12 h-12 rounded-xl grid place-items-center text-2xl"
                  style={{ background: `radial-gradient(circle at 50% 30%, ${c.color}33, transparent 70%)`, boxShadow: `0 0 20px ${c.color}44` }}>
                  {c.emoji}
                </div>
                <div className="text-[11px] font-black text-center">{c.label}</div>
                <div className="absolute inset-x-0 -bottom-px h-px opacity-0 group-hover:opacity-100 transition"
                  style={{ background: `linear-gradient(90deg, transparent, ${c.color}, transparent)` }} />
              </button>
            ))}
          </div>
        </section>

        {/* ── FEATURED GAMES 20 (5×4) ── */}
        <section>
          <SectionTitle title="🔥 Featured Games" hint="20 hand-picked premium titles" cta={{ label: "View All", to: "/games?c=featured" }} navigate={navigate} />
          <div className="grid grid-cols-4 lg:grid-cols-5 gap-3">
            {FEATURED.map((g, i) => (
              <GameCard key={g} name={g} idx={i} navigate={navigate} tag={i % 5 === 0 ? "HOT" : i % 7 === 0 ? "NEW" : undefined} />
            ))}
          </div>
        </section>

        {/* ── MOST POPULAR 20 ── */}
        <section>
          <SectionTitle title="⭐ Most Popular" hint="Trending across GoLucky right now" cta={{ label: "View All", to: "/games?c=all" }} navigate={navigate} />
          <div className="grid grid-cols-4 lg:grid-cols-5 gap-3">
            {POPULAR.map((g, i) => (
              <GameCard key={g} name={g} idx={i + 20} navigate={navigate} tag={i % 4 === 0 ? "TRENDING" : undefined} />
            ))}
          </div>
        </section>

        {/* ── GoLucky Trading ── */}
        <section className={`${card} p-6`}>
          <SectionTitle title="📊 GoLucky Trading" hint="14 live markets · CALL/PUT · TradingView" cta={{ label: "Open Terminal", to: "/trading" }} navigate={navigate} />
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8 rounded-xl bg-[#050f0b] border border-[#1a2f24] p-4 min-h-[280px] relative overflow-hidden">
              <div className="absolute inset-0 opacity-70"
                style={{ background: "repeating-linear-gradient(0deg, transparent 0 39px, rgba(18,183,106,.06) 39px 40px), repeating-linear-gradient(90deg, transparent 0 39px, rgba(18,183,106,.06) 39px 40px)" }} />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#12b76a]" />
                  <span className="font-black">GLC / USD</span>
                  <span className="text-xs text-[#12b76a]">+2.45%</span>
                </div>
                <div className="flex gap-1">
                  {["30s","1m","3m","5m"].map((t) => (
                    <button key={t} className="px-2 py-0.5 rounded text-[10px] font-black bg-[#12b76a]/15 text-[#12b76a] border border-[#12b76a]/40">{t}</button>
                  ))}
                </div>
              </div>
              <svg viewBox="0 0 400 160" className="relative w-full h-40 mt-2">
                <defs>
                  <linearGradient id="ln" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#12b76a" stopOpacity=".5"/>
                    <stop offset="100%" stopColor="#12b76a" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M0,120 L40,100 L80,110 L120,80 L160,90 L200,60 L240,70 L280,45 L320,55 L360,30 L400,40 L400,160 L0,160 Z" fill="url(#ln)"/>
                <path d="M0,120 L40,100 L80,110 L120,80 L160,90 L200,60 L240,70 L280,45 L320,55 L360,30 L400,40" fill="none" stroke="#12b76a" strokeWidth="2"/>
              </svg>
              <div className="relative mt-2 flex gap-2">
                <button className={`flex-1 py-2 rounded-lg font-black text-xs ${emeraldBtn}`}>BUY CALL</button>
                <button className="flex-1 py-2 rounded-lg font-black text-xs bg-gradient-to-b from-red-500 to-red-800 text-white shadow-[0_6px_18px_rgba(239,68,68,.4)]">BUY PUT</button>
              </div>
            </div>
            <div className="col-span-4 rounded-xl bg-[#050f0b] border border-[#1a2f24] p-3 overflow-hidden">
              <div className="text-[10px] tracking-[.3em] text-[#f5c744]/70 mb-2">14 COINS</div>
              <div className="space-y-1 max-h-[240px] overflow-auto pr-1">
                {COINS.map((c, i) => (
                  <button key={c} onClick={() => navigate("/trading")}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-white/5 text-xs">
                    <span className="font-semibold">{c}</span>
                    <span className={i % 2 === 0 ? "text-[#12b76a]" : "text-red-400"}>
                      {i % 2 === 0 ? "+" : "-"}{(1 + i * 0.13).toFixed(2)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── LUCKY HUB ── */}
        <section>
          <SectionTitle title="🍀 Lucky Hub" hint="Rewards, deposits & tournaments" cta={{ label: "Open Hub", to: "/lucky-hub" }} navigate={navigate} />
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {LUCKY_HUB.map((h) => (
              <button key={h.label} onClick={() => navigate(h.to)}
                className={`${card} p-4 flex flex-col items-center gap-2 hover:-translate-y-1 hover:border-[#f5c744]/60 transition`}>
                <div className="w-12 h-12 rounded-xl grid place-items-center text-2xl"
                  style={{ background: "radial-gradient(circle at 50% 30%, rgba(245,199,68,.25), transparent 70%)", boxShadow: "0 0 20px rgba(245,199,68,.35)" }}>
                  {h.emoji}
                </div>
                <div className="text-[11px] font-black text-center">{h.label}</div>
              </button>
            ))}
          </div>
        </section>

        {/* ── LIVE WINNERS ── */}
        <section className={`${card} p-4 overflow-hidden`}>
          <SectionTitle title="🏆 Live Winners" hint="Auto-scrolling · real-time" />
          <div className="relative overflow-hidden">
            <div className="flex gap-3 animate-[marquee_30s_linear_infinite]">
              {[...WINNERS, ...WINNERS].map((w, i) => (
                <div key={i} className="flex-shrink-0 flex items-center gap-3 px-3 py-2 rounded-xl bg-[#050f0b] border border-[#1a2f24] min-w-[240px]">
                  <div className="w-9 h-9 rounded-full grid place-items-center bg-gradient-to-br from-[#f5c744] to-[#c48a10] text-black font-black text-xs">{w.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{w.name} <span className="ml-1">{w.flag}</span></div>
                    <div className="text-[10px] text-white/50 truncate">{w.game}</div>
                  </div>
                  <div className="text-xs font-black text-[#12b76a]">{w.amt}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROVIDERS ── */}
        <section>
          <SectionTitle title="🎯 Game Providers" hint={`${PROVIDERS.length} world-class studios`} />
          <div className="grid grid-cols-5 gap-3">
            {PROVIDERS.map((p, i) => (
              <div key={p.name} className={`${card} p-4 flex items-center gap-3 hover:border-[#12b76a]/60 transition`}>
                <div className="w-10 h-10 rounded-lg grid place-items-center bg-[#12b76a]/15 border border-[#12b76a]/40 text-lg">
                  {p.logo}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-[#f5c744]/70 font-bold">#{i + 1}</div>
                  <div className={`text-sm font-black ${goldText} truncate`}>{p.name}</div>
                  <div className="text-[9px] text-white/50">Certified · Fair Play</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BOTTOM AGENT BANNER ── */}
        <section className={`${card} p-6 relative overflow-hidden`}>
          <div className="absolute inset-0" style={{ background: "radial-gradient(50% 100% at 20% 50%, rgba(245,199,68,.15), transparent 60%)" }} />
          <div className="relative flex items-center justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[10px] tracking-[.3em] text-[#f5c744]/70">JOIN TODAY</div>
              <div className={`text-3xl font-black ${goldText}`}>Become Official GoLucky Agent</div>
              <div className="mt-1 text-xs text-white/60">Earn up to ৳25 Lakh+ monthly · Lifetime commission · Instant settlement</div>
            </div>
            <div className="flex gap-3">
              <div className="px-4 py-2 rounded-lg bg-[#12b76a]/15 border border-[#12b76a]/40 text-xs font-black text-[#12b76a] flex items-center gap-1"><DollarSign className="h-3 w-3"/> HIGH COMMISSION</div>
              <div className="px-4 py-2 rounded-lg bg-[#f5c744]/15 border border-[#f5c744]/40 text-xs font-black text-[#f5c744] flex items-center gap-1"><Crown className="h-3 w-3"/> LIFETIME INCOME</div>
              <button onClick={() => navigate("/agent-apply")} className={`px-6 h-11 rounded-lg text-sm font-black ${emeraldBtn}`}>APPLY NOW →</button>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#1a2f24] bg-[#02070a]">
        <div className="max-w-[1440px] mx-auto px-5 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6 text-xs">
          <div>
            <div className={`text-2xl font-black ${goldText}`}>GoLucky</div>
            <p className="mt-2 text-white/60">Bangladesh's premier gaming & wallet platform. Play, win and earn — securely and responsibly.</p>
            <div className="mt-3 flex gap-3 text-lg">🌐 📘 📸 ▶️ ✈️</div>
          </div>
          <div>
            <div className="text-white/80 font-bold mb-2">Support</div>
            <ul className="space-y-1 text-white/50">
              <li><Link to="/support">Help Center</Link></li>
              <li><Link to="/promotion">Promotions</Link></li>
              <li><Link to="/vip">VIP Club</Link></li>
              <li><Link to="/referral">Refer & Earn</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-white/80 font-bold mb-2">Legal</div>
            <ul className="space-y-1 text-white/50">
              <li><Link to="/terms">Terms</Link></li>
              <li><Link to="/privacy">Privacy</Link></li>
              <li>Responsible Gaming</li>
              <li>Fair Play · Provably Fair</li>
            </ul>
          </div>
          <div>
            <div className="text-white/80 font-bold mb-2">Trust</div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded bg-[#12b76a]/15 border border-[#12b76a]/40 text-[10px] text-[#12b76a] flex items-center gap-1"><ShieldCheck className="h-3 w-3"/> SSL</span>
              <span className="px-2 py-1 rounded bg-[#f5c744]/15 border border-[#f5c744]/40 text-[10px] text-[#f5c744] flex items-center gap-1"><Shield className="h-3 w-3"/> LICENSED</span>
              <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-white/70">24/7 Support</span>
            </div>
            <div className="mt-3 text-white/80 font-bold mb-1">Payments</div>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENTS.map((p) => (
                <span key={p} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px]">{p}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-[#1a2f24] py-3 text-center text-[10px] text-white/40">© 2026 GoLucky. All Rights Reserved.</div>
      </footer>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
}

/* ─── local components ─── */
function SectionTitle({
  title, hint, cta, navigate,
}: { title: string; hint?: string; cta?: { label: string; to: string }; navigate?: (to: string) => void }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#ffdf6b] to-[#c48a10]" />
          <h2 className="text-lg font-black tracking-tight">{title}</h2>
        </div>
        {hint && <div className="mt-1 ml-3 text-[11px] text-white/50">{hint}</div>}
      </div>
      {cta && navigate && (
        <button onClick={() => navigate(cta.to)}
          className="text-[11px] font-bold text-[#f5c744] hover:opacity-80 transition flex items-center gap-1">
          {cta.label} <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function GameCard({ name, idx, navigate, tag }: { name: string; idx: number; navigate: (to: string) => void; tag?: string }) {
  const grads = [
    "from-blue-600 to-blue-900",
    "from-amber-500 to-orange-700",
    "from-red-600 to-rose-900",
    "from-emerald-600 to-teal-900",
    "from-purple-600 to-indigo-900",
    "from-pink-500 to-rose-800",
  ];
  const grad = grads[idx % grads.length];
  const players = (5000 + ((idx * 337) % 12000)).toLocaleString();
  const tagColor = tag === "HOT" ? "bg-red-500 text-white"
    : tag === "NEW" ? "bg-[#12b76a] text-black"
    : tag === "TRENDING" ? "bg-[#f5c744] text-black"
    : "";
  return (
    <button onClick={() => navigate("/games?c=all")}
      className="group relative rounded-xl overflow-hidden border border-[#1a2f24] bg-[#0b1310] hover:border-[#12b76a]/60 transition text-left">
      <div className={`aspect-[4/5] bg-gradient-to-br ${grad} relative flex items-center justify-center`}>
        <div className="text-4xl opacity-40">🎰</div>
        {tag && (
          <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-black ${tagColor}`}>{tag}</span>
        )}
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 backdrop-blur grid place-items-center opacity-0 group-hover:opacity-100 transition">
          <Star className="h-3 w-3 text-[#f5c744]" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
          <div className="text-[11px] font-black truncate">{name}</div>
          <div className="text-[9px] text-white/60 flex items-center gap-1">
            <Flame className="h-2.5 w-2.5 text-red-400" /> {players} playing
          </div>
        </div>
        <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition bg-black/40 backdrop-blur-sm">
          <div className={`px-3 py-1.5 rounded-lg text-[11px] font-black ${emeraldBtn}`}>
            <Play className="inline h-3 w-3 mr-1" /> PLAY
          </div>
        </div>
      </div>
    </button>
  );
}
