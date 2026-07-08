import { useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/context/WalletContext";
import { DEMO_MODE_ALLOWED } from "@/lib/featureFlags";


import {
  Bell, Menu, ArrowDownToLine, ArrowUpFromLine, Crown, Gift, Users,
  ChevronRight, Ticket, ShieldCheck, Coins, Wallet as WalletIcon,
  Sparkles, TrendingUp, Flame, Zap, Star, Rocket, Brain, Target, Send,
  Globe, LineChart, Timer, Diamond, PiggyBank, Award, BarChart3,
  Briefcase, Calendar, CheckCircle2, Trophy, Play, Gamepad2, Fish,
  Layers, Landmark, Activity, Cpu, Radio, Lock, Headset, BadgeCheck,
  UserPlus, Handshake, GitBranch, Percent, ArrowRight, Repeat2,
  History as HistoryIcon, MessageCircle, Phone,
} from "lucide-react";
import InstallPromptBanner from "@/components/InstallPromptBanner";
import DemoModeBanner from "@/components/DemoModeBanner";
import LiveRewardsTicker from "@/components/home/LiveRewardsTicker";
import PromoCountdown from "@/components/home/PromoCountdown";
import VerifiedDomainsTicker from "@/components/home/VerifiedDomainsTicker";

import artWinGo from "@/assets/highlight-wingo.png";
import artLottery from "@/assets/highlight-lottery.png";
import artCrypto from "@/assets/highlight-crypto.png";
import artWinners from "@/assets/highlight-winners.png";
import vaultHero from "@/assets/wallet-vault-hero.png.asset.json";
import agentHero from "@/assets/agent-empire-hero-v2.jpg.asset.json";
import fixedDepositHero from "@/assets/fixed-deposit-hero.jpg.asset.json";
import goluckyLogo from "@/assets/golucky-logo.png";
import catAviator from "@/assets/cat-aviator.png.asset.json";
import catCasino from "@/assets/cat-casino.png.asset.json";
import catSports from "@/assets/cat-sports.png.asset.json";
import catSlots from "@/assets/cat-slots.png.asset.json";
import catFishing from "@/assets/cat-fishing.png.asset.json";
import catArcade from "@/assets/cat-arcade.png.asset.json";

/* ─── Tokens ─── */
// ── Reference-derived neon palette (sampled from master ref image) ──
const BG = "#050505";
const NEON_GOLD  = "#FEC013"; // WinGo / Withdraw / Winners
const NEON_GREEN = "#12C665"; // Deposit
const NEON_BLUE  = "#02B4FA"; // Crypto / Transfer
const NEON_PURPLE = "#DA29FB"; // History / 5D Lottery accent side
// Legacy aliases kept for existing consumers below (do not re-invent — reuse tokens)
const GOLD = NEON_GOLD;
const GOLD_HI = "#FDE68A";
const GOLD_DEEP = "#B8862F";
const EMERALD = NEON_GREEN;
const EMERALD_HI = NEON_GREEN;
const PURPLE = NEON_PURPLE;
const BLUE = NEON_BLUE;
const PINK = "#EC4899";
const RED = "#EF4444";
const CYAN = NEON_BLUE;
const ORANGE = "#F97316";


const glass =
  "rounded-[20px] border backdrop-blur-xl bg-white/[0.035] border-white/10 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)]";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCompact = (n: number) => {
  if (n >= 1e7) return `${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `${(n / 1e5).toFixed(2)}L`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
};

/* ─── Reusable primitives ─── */
const Section = ({ id, title, sub, cta, children }: {
  id: string; title: string; sub?: string; cta?: { label: string; to: string }; children: ReactNode;
}) => {
  const navigate = useNavigate();
  return (
    <section data-testid={id} className="space-y-2">
      <div className="flex items-end justify-between px-0.5">
        <div>
          <h2 className="font-display font-bold text-[14px] leading-none">{title}</h2>
          {sub && <div className="mt-1 text-[10px] text-white/50">{sub}</div>}
        </div>
        {cta && (
          <button onClick={() => navigate(cta.to)}
            className="text-[10px] font-semibold flex items-center gap-0.5"
            style={{ color: GOLD_HI }}>
            {cta.label} <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
      {children}
    </section>
  );
};

const SmallStat = ({ i: Icon, label, value, color, onClick }: {
  i: any; label: string; value: string; color: string; onClick?: () => void;
}) => (
  <button onClick={onClick}
    className={`${glass} p-2.5 flex flex-col items-start gap-1 text-left active:scale-[0.98] transition`}
    style={{ boxShadow: `inset 0 0 0 1px ${color}22` }}>
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" style={{ color }} />
      <span className="text-[9px] uppercase tracking-wider text-white/50">{label}</span>
    </div>
    <div className="font-display font-bold text-[15px] tabular-nums leading-none" style={{ color }}>
      {value}
    </div>
  </button>
);

const MediumCard = ({ i: Icon, title, sub, color, badge, onClick, footer, bgArt }: {
  i: any; title: string; sub: string; color: string; badge?: string; onClick?: () => void; footer?: ReactNode; bgArt?: string;
}) => (
  <button
    onClick={onClick}
    type="button"
    aria-label={`${title}${badge ? ` (${badge})` : ""} — ${sub}`}
    className={`${glass} group relative overflow-hidden p-3.5 flex flex-col gap-2.5 text-left active:scale-[0.98] transition-all duration-300 min-h-[124px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-white/80 lg:hover:-translate-y-0.5 lg:hover:shadow-[0_18px_50px_-20px_rgba(0,0,0,0.9)]`}
    style={{ boxShadow: `inset 0 0 0 1px ${color}22` }}>
    {bgArt && (
      <>
        <img
          src={bgArt}
          alt=""
          aria-hidden
          loading="lazy"
          width={512}
          height={512}
          className="pointer-events-none select-none absolute right-1.5 bottom-1.5 h-[78%] w-auto aspect-square object-contain opacity-[0.18] group-hover:opacity-[0.24] transition-opacity duration-300 drop-shadow-[0_0_18px_rgba(0,0,0,0.5)]"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(120% 90% at 0% 0%, ${color}14, transparent 55%), linear-gradient(90deg, rgba(5,5,5,0.55) 0%, rgba(5,5,5,0.15) 60%, transparent 100%)` }} />
      </>
    )}
    <div className="relative flex items-start justify-between gap-2">
      <div aria-hidden className="h-9 w-9 rounded-[10px] grid place-items-center shrink-0 backdrop-blur-sm"
        style={{ background: `${color}22`, border: `1px solid ${color}55`, boxShadow: `0 0 14px ${color}33` }}>
        <Icon className="h-[18px] w-[18px]" style={{ color }} />
      </div>
      {badge && (
        <span aria-hidden className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-[0.12em] leading-none backdrop-blur-sm"
          style={{ background: `${color}26`, color, border: `1px solid ${color}66` }}>
          {badge}
        </span>
      )}
    </div>
    <div className="relative flex-1 min-w-0 space-y-0.5">
      <div className="font-display font-semibold text-[14px] leading-tight tracking-[-0.01em] truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
        {title}
      </div>
      <div className="text-[10.5px] leading-snug text-white/75 truncate">{sub}</div>
    </div>
    {footer && (
      <div className="relative pt-2 border-t border-white/[0.1] tabular-nums">{footer}</div>
    )}
  </button>
);

const HomeMobile = () => {
  const navigate = useNavigate();
  const { balance, refresh } = useWalletContext();
  const [bonus, setBonus] = useState(0);
  const [luckyCoin, setLuckyCoin] = useState(0);
  const [name, setName] = useState("Player");
  const [userId, setUserId] = useState<string | null>(null);

  // Load profile + wallet extras (bonus / lucky coin)
  const loadExtras = async (uid: string) => {
    const { data: w } = await supabase
      .from("wallets")
      .select("bonus_balance, lucky_coin")
      .eq("user_id", uid)
      .maybeSingle();
    if (w) {
      setBonus(Number((w as any).bonus_balance ?? 0));
      setLuckyCoin(Number((w as any).lucky_coin ?? 0));
    }
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const uname = (user.user_metadata as any)?.full_name ||
        (user.user_metadata as any)?.username ||
        user.email?.split("@")[0] || "Player";
      setName(uname);
      await loadExtras(user.id);
    })();
  }, []);

  // Realtime updates for this user's wallet row (bonus + lucky coin)
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`home-wallet-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${userId}` },
        (payload) => {
          const row: any = payload.new ?? payload.old;
          if (!row) return;
          if (row.bonus_balance != null) setBonus(Number(row.bonus_balance));
          if (row.lucky_coin != null) setLuckyCoin(Number(row.lucky_coin));
          refresh(); // pull authoritative balance
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, refresh]);

  // Refresh when tab becomes visible again (e.g., after Deposit/Withdraw pages)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
        if (userId) loadExtras(userId);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [userId, refresh]);


  const vipLevel = 3;

  // Demo mode: gated by staging-only flag. In production DEMO_MODE_ALLOWED is
  // false, so demoActive is hard-forced off — real wallet values always render.
  const [demoActive, setDemoActive] = useState<boolean>(() => {
    if (!DEMO_MODE_ALLOWED) return false;
    if (typeof window === "undefined") return false;
    if (new URLSearchParams(window.location.search).get("demo") === "1") return true;
    return window.localStorage.getItem("section1_demo") === "1";
  });
  useEffect(() => {
    if (!DEMO_MODE_ALLOWED) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("section1_demo", demoActive ? "1" : "0");
    }
  }, [demoActive]);

  const heroTotalBalance = demoActive ? 27500 : balance + bonus;
  const heroBonus = demoActive ? 2500 : bonus;
  const heroLuckyCoin = demoActive ? 14300 : luckyCoin;
  const totalBalance = balance + bonus;





  return (
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden" style={{ background: BG }}>
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-25"
          style={{ background: `radial-gradient(circle, ${EMERALD}, transparent 70%)`, filter: "blur(100px)" }} />
        <div className="absolute top-1/4 -right-32 h-[28rem] w-[28rem] rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${GOLD}, transparent 70%)`, filter: "blur(110px)" }} />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full opacity-15"
          style={{ background: `radial-gradient(circle, ${PURPLE}, transparent 70%)`, filter: "blur(120px)" }} />
      </div>

      <style>{`
        @keyframes glxMarquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes glxFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
        .glx-marquee { animation: glxMarquee 32s linear infinite }
        .glx-float { animation: glxFloat 3s ease-in-out infinite }
      `}</style>

      {/* ═══ HEADER — matched to reference neon casino chrome ═══ */}
      <header className="sticky top-0 z-40 px-2.5 pt-2 pb-2 backdrop-blur-xl"
        style={{ background: "linear-gradient(180deg, rgba(1,1,5,0.98), rgba(1,1,5,0.9))" }}>
        <div className="flex items-center gap-2">
          <button aria-label="Menu" className="h-11 w-11 rounded-[11px] grid place-items-center shrink-0"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.015))",
              border: "1px solid rgba(255,255,255,0.24)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 0 18px rgba(255,255,255,0.08)",
            }}>
            <Menu className="h-[21px] w-[21px]" />
          </button>

          <button onClick={() => navigate("/home")} className="flex items-center gap-1.5 shrink-0 min-w-0">
            <span aria-hidden className="relative h-10 w-10 shrink-0 grid place-items-center">
              <span className="absolute h-5 w-5 rounded-full" style={{ background: GOLD_HI, filter: `blur(8px)`, opacity: 0.85 }} />
              {["top-0 left-1/2 -translate-x-1/2", "right-0 top-1/2 -translate-y-1/2", "bottom-0 left-1/2 -translate-x-1/2", "left-0 top-1/2 -translate-y-1/2"].map((pos, i) => (
                <span key={pos} className={`absolute ${pos} h-[18px] w-[18px] rotate-45 rounded-[70%_18%_70%_18%]`}
                  style={{
                    background: `linear-gradient(135deg, ${GOLD_HI}, ${EMERALD_HI} 45%, #02884b)`,
                    boxShadow: `0 0 8px ${EMERALD_HI}, inset 0 1px 1px rgba(255,255,255,0.75)`,
                    transform: `${i === 0 || i === 2 ? "translateX(-50%)" : "translateY(-50%)"} rotate(${45 + i * 90}deg)`,
                  }} />
              ))}
              <span className="relative h-3 w-3 rounded-full" style={{ background: GOLD_HI, boxShadow: `0 0 8px ${GOLD_HI}` }} />
            </span>
            <span className="leading-none text-left">
              <span className="block font-display font-black text-[26px] leading-[0.9] bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(180deg, #fff7c8 0%, ${GOLD_HI} 30%, ${GOLD} 62%, ${GOLD_DEEP} 100%)`,
                  WebkitTextStroke: "0.35px rgba(120,65,0,0.55)",
                  filter: `drop-shadow(0 0 8px ${GOLD}80)`,
                }}>
                GoLucky
              </span>
              <span className="block mt-1 text-[8px] font-black tracking-[0.32em] text-white/75">PLAY · WIN · GROW</span>
            </span>
          </button>

          <div className="flex-1 min-w-[2px]" />

          {[
            { label: "Rewards", icon: Gift, to: "/activity", color: PURPLE, badge: null },
            { label: "Notifications", icon: Bell, to: null, color: PURPLE, badge: "3" },
          ].map((item) => (
            <button key={item.label} aria-label={item.label} onClick={() => item.to && navigate(item.to)}
              className="relative h-11 w-11 rounded-full grid place-items-center shrink-0"
              style={{
                background: `radial-gradient(circle at 50% 30%, ${item.color}44, rgba(8,4,15,0.96) 64%)`,
                border: `1.5px solid ${item.color}aa`,
                boxShadow: `0 0 16px ${item.color}88, inset 0 0 14px ${item.color}55, inset 0 1px 0 rgba(255,255,255,0.35)`,
              }}>
              <item.icon className="h-5 w-5" style={{ color: NEON_PURPLE, filter: `drop-shadow(0 0 7px ${item.color})` }} />
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[7px] text-white/70 whitespace-nowrap">{item.label}</span>
              {item.badge && <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full grid place-items-center text-[10px] font-black"
                style={{ background: RED, color: "#fff", boxShadow: `0 0 10px ${RED}` }}>{item.badge}</span>}
            </button>
          ))}

          <button onClick={() => navigate("/account")}
            className="h-12 min-w-[104px] rounded-[16px] p-[1.5px] shrink-0"
            style={{ background: `linear-gradient(135deg, ${GOLD_HI}, ${GOLD_DEEP} 45%, ${PURPLE})`, boxShadow: `0 0 18px ${GOLD}77` }}>
            <span className="h-full w-full rounded-[14px] px-2 flex items-center gap-2"
              style={{ background: "linear-gradient(180deg, #120f0a, #050508)", boxShadow: `inset 0 0 16px ${GOLD_DEEP}66` }}>
              <span className="h-8 w-8 rounded-full grid place-items-center font-display font-black text-[15px]"
                style={{ color: GOLD_HI, border: `1.5px solid ${GOLD_HI}`, boxShadow: `0 0 12px ${GOLD}88, inset 0 0 10px ${GOLD_DEEP}77` }}>
                {name[0]?.toUpperCase()}
              </span>
              <span className="min-w-0 text-left leading-none">
                <span className="block text-[11px] font-black truncate max-w-[52px]">{name}</span>
                <span className="mt-1 flex items-center gap-1 text-[10px] font-black" style={{ color: GOLD_HI }}><Crown className="h-3 w-3" /> VIP 10</span>
              </span>
              <ChevronRight className="h-4 w-4" style={{ color: GOLD_HI }} />
            </span>
          </button>
        </div>
      </header>

      <InstallPromptBanner />



      <a
        href="#home-hero"
        onClick={(e) => {
          e.preventDefault();
          const target = document.getElementById("home-hero");
          if (!target) return;
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
          target.focus({ preventScroll: true });
          history.replaceState(null, "", "#home-hero");
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-1/2 focus:-translate-x-1/2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-black focus:font-bold focus:text-sm focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      >
        Skip to main content
      </a>

      <main id="main-content" className="scroll-smooth px-3 pt-3 pb-24 space-y-6">

        {/* ═══ S1 · UNIFIED HERO · GOLD PRIMARY (no rainbow / no flash) ═══ */}
        <section id="home-hero" data-testid="home-hero" tabIndex={-1}
          aria-label="Account overview and quick actions"
          className="relative overflow-hidden rounded-[22px] p-3"
          style={{
            background:
              "radial-gradient(120% 80% at 0% 0%, rgba(254,192,19,0.05), transparent 55%), linear-gradient(180deg, #0a0a0c 0%, #030304 100%)",
            border: `1px solid ${GOLD_HI}33`,
            boxShadow: "0 12px 44px -18px rgba(0,0,0,0.9)",
          }}>





          <div className="relative grid grid-cols-[60px_1fr_90px] items-stretch gap-2 min-h-[118px]">

            {/* LEFT — Avatar · Username · VIP */}
            <div className="flex flex-col items-center justify-center gap-1 pr-1.5 border-r border-white/[0.06]">
              <div aria-hidden className="relative h-[50px] w-[50px] shrink-0 rounded-full grid place-items-center"
                style={{ background: "radial-gradient(circle at 50% 35%, #14161c, #030306 72%)", border: `1px solid ${GOLD_HI}55` }}>
                <Crown className="absolute -top-1.5 h-3.5 w-3.5" style={{ color: GOLD_HI }} />
                <ShieldCheck className="h-5 w-5" style={{ color: GOLD_HI }} />
              </div>
              <div className="text-[10.5px] font-black leading-none truncate max-w-full text-white">{name}</div>
              <button onClick={() => navigate("/vip")} type="button" aria-label="VIP level 10, open VIP club"
                className="h-[18px] px-1.5 rounded-full inline-flex items-center gap-0.5 text-[9px] font-black whitespace-nowrap"
                style={{ background: "#0a0a0c", color: GOLD_HI, border: `1px solid ${GOLD_HI}55` }}>
                <Crown className="h-2.5 w-2.5" /> VIP 10
              </button>
            </div>

            {/* CENTER — Total Balance (largest) · Bonus · Coin */}
            <div className="relative min-w-0 flex flex-col justify-center py-0.5">
              <div className="flex items-center gap-1 text-[9px] uppercase tracking-[0.18em] text-white/60 font-black leading-none">
                <Lock className="h-2.5 w-2.5" style={{ color: GOLD_HI }} /> Total Balance
              </div>
              <div className="mt-1 font-display font-black text-[26px] tabular-nums leading-none bg-clip-text text-transparent whitespace-nowrap"
                style={{ backgroundImage: `linear-gradient(180deg, #fff2b8 0%, ${GOLD_HI} 55%, ${GOLD_DEEP} 100%)` }}>
                ৳{fmt(heroTotalBalance)}
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[9px]">
                <span className="rounded-lg px-1.5 py-0.5 border leading-tight"
                  style={{ background: "rgba(0,0,0,0.6)", borderColor: "rgba(255,255,255,0.08)" }}>
                  <span className="block uppercase text-white/55 text-[7px] tracking-wider">Bonus</span>
                  <b className="mt-0.5 block text-[10.5px] tabular-nums text-white">৳{fmt(heroBonus)}</b>
                </span>
                <span className="rounded-lg px-1.5 py-0.5 border leading-tight"
                  style={{ background: "rgba(0,0,0,0.6)", borderColor: "rgba(255,255,255,0.08)" }}>
                  <span className="block uppercase text-white/55 text-[7px] tracking-wider">Coin</span>
                  <b className="mt-0.5 block text-[10.5px] tabular-nums text-white">{fmtCompact(heroLuckyCoin)}</b>
                </span>
              </div>

            </div>

            {/* RIGHT — Vault artwork (−15%, soft static glow behind) */}
            <div className="relative flex items-center justify-center">
              <div aria-hidden className="pointer-events-none absolute inset-0"
                style={{ background: `radial-gradient(60% 55% at 50% 50%, ${GOLD_HI}33 0%, transparent 70%)` }} />
              <img
                src={vaultHero.url}
                alt=""
                aria-hidden
                loading="lazy"
                className="relative pointer-events-none select-none h-[100%] w-auto aspect-square object-contain"
              />
            </div>

          </div>


          {/* ACTION ROW · 4 buttons · identical size · premium glass · static luxury glow */}
          <div className="mt-2.5 grid grid-cols-4 gap-2" role="group" aria-label="Wallet quick actions">
            {[
              // Deposit green intensity reduced ~40% via low-alpha tint + softer border
              { l: "Deposit",  i: ArrowDownToLine, c: EMERALD_HI, tint: 0.24, to: "/deposit",             tid: "home-cta-deposit"  },
              { l: "Withdraw", i: ArrowUpFromLine, c: GOLD_HI,    tint: 1,    to: "/withdraw",            tid: "home-cta-withdraw" },
              { l: "Transfer", i: Repeat2,         c: BLUE,       tint: 1,    to: "/wallet?tab=transfer", tid: "home-cta-transfer" },
              { l: "History",  i: HistoryIcon,     c: PURPLE,     tint: 1,    to: "/wallet",              tid: "home-cta-history"  },
            ].map((a) => (
              <button key={a.l} onClick={() => navigate(a.to)}
                type="button"
                data-testid={a.tid}
                aria-label={a.l}
                className="group relative overflow-hidden rounded-[14px] h-[54px] flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-white/70"
                style={{
                  background: `linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.75) 100%)`,
                  border: `1px solid ${a.c}${a.tint < 1 ? "55" : "88"}`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 14px -6px ${a.c}${a.tint < 1 ? "22" : "44"}`,
                }}>
                {/* Glass reflection strip */}
                <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-[13px]"
                  style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.10), transparent)" }} />
                <a.i aria-hidden className="relative h-[18px] w-[18px] shrink-0" style={{ color: a.c, opacity: a.tint }} />
                <span className="relative font-display text-[11px] font-black tracking-[0.03em] uppercase whitespace-nowrap"
                  style={{ color: a.c, opacity: a.tint }}>
                  {a.l}
                </span>
              </button>
            ))}
          </div>



          {/* PREMIUM 2×2 GRID · 4 cards · identical h / w / padding / radius */}
          <div className="mt-3 grid grid-cols-2 gap-2 overflow-hidden">
            {([
              // accent = card frame/glow · statColor = large numeric · ctaColor = pill CTA
              { title: "WIN GO",         sub: "Win Big Every 30s",         accent: EMERALD_HI, statColor: EMERALD_HI, ctaColor: EMERALD_HI, badge: "LIVE", badgeVariant: "live", art: artWinGo,   to: "/game/wingo",       statLabel: "NEXT DRAW", statValue: "00:00:28", cta: "PLAY NOW",  glowA: "#FFD447", glowB: EMERALD_HI, tileIcon: Gamepad2 },
              { title: "5D LOTTERY",     sub: "Mega Jackpot Awaits",       accent: PINK,       statColor: PINK,       ctaColor: PINK,       badge: "HOT",  badgeVariant: "hot",  art: artLottery, to: "/game/5d",          statLabel: "JACKPOT",   statValue: "৳2.50 Cr", cta: "PLAY NOW",  glowA: "#FFD447", glowB: "#FF3DA5", tileIcon: Ticket },
              { title: "CRYPTO TRADING", sub: "Trade Top Coins Instantly", accent: BLUE,       statColor: EMERALD_HI, ctaColor: BLUE,       badge: "LIVE", badgeVariant: "live", art: artCrypto,  to: "/trading/markets",  statLabel: "BTC/USDT",  statValue: "+2.34%",   cta: "TRADE NOW", glowA: BLUE,      glowB: "#22D3EE", tileIcon: LineChart },
              { title: "LIVE WINNERS",   sub: "Real People · Real Wins",   accent: BLUE,       statColor: GOLD_HI,    ctaColor: GOLD_HI,    badge: "LIVE", badgeVariant: "live", art: artWinners, to: "/activity",         statLabel: "TOP TODAY", statValue: "৳12,500",  cta: "VIEW ALL",  glowA: "#FFD447", glowB: "#7C3AED", tileIcon: Trophy },
            ] as const).map((c) => {

              const isLive = c.badgeVariant === "live";
              const isHot = c.badgeVariant === "hot";
              return (
              <button key={c.title} onClick={() => navigate(c.to)} type="button"
                aria-label={`${c.title} — ${c.sub}`}
                data-feature-card={c.title}
                className="group relative overflow-hidden [contain:paint] max-w-full rounded-[18px] h-[210px] min-[380px]:h-[258px] w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-white/70 active:scale-[0.985] transition-transform duration-200"
                style={{
                  border: `1px solid ${c.accent}66`,
                  boxShadow: `0 8px 24px -12px rgba(0,0,0,0.9), inset 0 0 24px ${c.accent}18`,
                }}>

                {/* Background */}
                <div aria-hidden className="absolute inset-0 z-[0]"
                  style={{ background: `linear-gradient(160deg, #0a0a0c 0%, #050507 60%, #020203 100%)` }} />

                {/* Static luxury ambient glow — dual radial, stays inside card */}
                <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]"
                  style={{
                    background:
                      `radial-gradient(58% 55% at 22% 20%, ${c.glowA}2E 0%, transparent 70%),` +
                      `radial-gradient(62% 58% at 78% 82%, ${c.glowB}33 0%, transparent 72%)`,
                  }} />

                {/* Accent glow behind artwork (static) */}
                <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]"
                  style={{
                    background: `radial-gradient(60% 55% at 74% 55%, ${c.accent}40 0%, transparent 74%)`,
                  }} />

                {/* Artwork — +5% brightness / +8% contrast · parity: subtle zoom on press/hover */}
                <img src={c.art} alt="" aria-hidden loading="lazy" width={640} height={640}
                  className="pointer-events-none select-none absolute right-0 top-1/2 -translate-y-1/2 h-[92%] w-auto aspect-square object-contain z-[2] transition-transform duration-500 group-hover:scale-[1.06] group-active:scale-[1.04]"
                  style={{ filter: "brightness(1.05) contrast(1.08)" }} />

                {/* Shimmer sweep — parity with desktop HeroCard */}
                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-[2]">
                  <div className="absolute inset-y-0 -left-1/2 w-1/2 animate-shimmer opacity-40"
                    style={{ background: `linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.24) 50%, transparent 65%)` }} />
                </div>

                {/* Decorative premium tile icon — absolute, no layout shift */}
                <span aria-hidden className="pointer-events-none absolute top-2 left-2 z-[4] h-7 w-7 rounded-lg grid place-items-center backdrop-blur-md"
                  style={{ background: `linear-gradient(140deg, ${c.accent}33, rgba(0,0,0,0.6))`, border: `1px solid ${c.accent}88`, boxShadow: `0 0 10px ${c.accent}66, inset 0 1px 0 rgba(255,255,255,0.12)` }}>
                  <c.tileIcon className="h-3.5 w-3.5" style={{ color: c.accent, filter: `drop-shadow(0 0 4px ${c.accent}aa)` }} strokeWidth={2.4} />
                </span>



                {/* Readability veil */}
                <div aria-hidden className="pointer-events-none absolute inset-0 z-[3]"
                  style={{
                    background: `linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 28%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.15) 72%, rgba(0,0,0,0.80) 100%)`,
                  }} />

                {/* Premium interior vignette — soft dark edges, luminous center */}
                <div aria-hidden className="pointer-events-none absolute inset-0 z-[3]"
                  style={{
                    background: `radial-gradient(120% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)`,
                  }} />

                {/* Content — identical layout every card */}
                <div className="relative z-[4] p-[11px] flex flex-col h-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="max-w-[64%]">
                      {/* Card title — luxury gold gradient (matches reference) */}
                      <div className="font-display font-black text-[19px] leading-none tracking-normal bg-clip-text text-transparent"
                        style={{ backgroundImage: `linear-gradient(180deg, #fff2b8 0%, ${GOLD_HI} 55%, ${GOLD_DEEP} 100%)` }}>
                        {c.title}
                      </div>
                      <div className="mt-1.5 text-[10.5px] leading-snug text-white font-semibold"
                        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>
                        {c.sub}
                      </div>
                    </div>
                    {/* Badge · LIVE = premium red · HOT = pink · other = accent */}
                    <span className="text-[9.5px] font-black uppercase tracking-[0.12em] px-2 py-1 rounded-md shrink-0"
                      style={{
                        background: "rgba(0,0,0,0.7)",
                        color: isLive ? RED : PINK,
                        border: `1px solid ${isLive ? RED : PINK}99`,

                      }}>
                      {c.badge}
                    </span>
                  </div>

                  <div className="mt-auto">
                    <div className="text-[9.5px] uppercase tracking-[0.10em] text-white/85 font-black"
                      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}>
                      {c.statLabel}
                    </div>
                    <div className="text-[19px] font-black tabular-nums leading-none mt-1 whitespace-nowrap"
                      style={{ color: c.statColor, textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}>
                      {c.statValue}
                    </div>
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black tracking-wide uppercase"
                        style={{
                          background: "rgba(0,0,0,0.7)",
                          color: c.ctaColor,
                          border: `1px solid ${c.ctaColor}99`,
                        }}>
                        {c.cta} <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subtle glass reflection (static, no rainbow, no flash) */}
                <div aria-hidden className="pointer-events-none absolute inset-0 z-[5] rounded-[17px]"
                  style={{
                    background: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 18%, transparent 42%)`,
                  }} />
              </button>
            );})}
          </div>
        </section>



        {/* ═══ S2 · AGENT EMPIRE — Purple + Gold Luxury (reference-matched) ═══ */}
        <section
          id="home-agent-empire"
          data-testid="home-agent-empire"
          aria-label="Agent Empire"
          className="relative overflow-hidden rounded-[22px] pt-3 px-3 pb-2 space-y-2.5 mb-[-8px]"
          style={{
            background:
              "radial-gradient(90% 60% at 100% 0%, rgba(218,41,251,0.22), transparent 60%), radial-gradient(90% 60% at 0% 100%, rgba(254,192,19,0.18), transparent 60%), radial-gradient(70% 50% at 50% 50%, rgba(88,28,135,0.14), transparent 70%), linear-gradient(180deg, #0b0714 0%, #05040a 100%)",
            border: `1px solid ${GOLD_HI}44`,
            boxShadow: `0 22px 60px -24px rgba(0,0,0,0.95), 0 0 44px -12px ${PURPLE}55, inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px ${GOLD_HI}1f`,
          }}
        >
          {/* Cinematic lighting layer (non-interactive) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(30% 22% at 12% 8%, rgba(254,192,19,0.28), transparent 70%), radial-gradient(28% 22% at 92% 92%, rgba(218,41,251,0.30), transparent 70%)",
              filter: "blur(2px)",
              mixBlendMode: "screen",
            }}
          />

          {/* ── Hero Banner ── */}
          <div
            className="relative overflow-hidden rounded-[18px]"
            style={{
              border: `1px solid transparent`,
              backgroundImage: `linear-gradient(#05040a,#05040a), linear-gradient(135deg, ${GOLD_HI}dd 0%, ${GOLD_DEEP}99 38%, ${PURPLE}dd 100%)`,
              backgroundOrigin: "border-box",
              backgroundClip: "padding-box, border-box",
              boxShadow: `0 0 52px ${PURPLE}66, 0 0 44px ${GOLD}3a, 0 22px 52px -20px rgba(0,0,0,0.98), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 0 0 1px ${GOLD_HI}22`,
            }}
          >
            {/* Background artwork */}
            <img
              src={agentHero.url}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              width={1536}
              height={640}
            />
            {/* Darken bottom & sides so text pops, keep silhouettes visible */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(5,4,10,0.82) 0%, rgba(5,4,10,0.30) 32%, rgba(5,4,10,0.18) 62%, rgba(5,4,10,0.78) 100%), linear-gradient(180deg, rgba(5,4,10,0.20) 0%, transparent 40%, rgba(5,4,10,0.55) 100%)",
              }}
            />
            {/* Cinematic dual-tone volumetric lighting */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(38% 62% at 6% 18%, rgba(254,192,19,0.34), transparent 70%), radial-gradient(46% 68% at 98% 82%, rgba(218,41,251,0.36), transparent 72%), radial-gradient(28% 40% at 92% 8%, rgba(255,240,180,0.28), transparent 70%)",
                mixBlendMode: "screen",
              }}
            />
            {/* Diagonal gold light rays */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  "repeating-linear-gradient(115deg, transparent 0px, transparent 32px, rgba(254,224,140,0.05) 33px, rgba(254,224,140,0.09) 40px, transparent 41px, transparent 78px)",
                mixBlendMode: "screen",
              }}
            />
            {/* Glassmorphism inner ring */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-[3px] rounded-[15px]"
              style={{
                border: `1px solid rgba(255,255,255,0.10)`,
                boxShadow: `inset 0 0 30px rgba(218,41,251,0.18), inset 0 0 60px rgba(0,0,0,0.35)`,
              }}
            />
            {/* Top gold sheen */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-4 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${GOLD_HI}ee, transparent)` }}
            />
            {/* Bottom purple underglow line */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-6 bottom-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${PURPLE}cc, transparent)` }}
            />


            <div className="relative z-10 px-3.5 pt-1 pb-1">
              {/* Title block */}
              <div className="flex items-start gap-2">
                <span
                  aria-hidden
                  className="relative shrink-0 h-8 w-8 rounded-[10px] grid place-items-center"
                  style={{
                    background: `radial-gradient(circle at 50% 35%, ${GOLD_HI}44, rgba(8,4,15,0.9) 70%)`,
                    border: `1px solid ${GOLD_HI}aa`,
                    boxShadow: `0 0 18px ${GOLD}88, inset 0 1px 0 rgba(255,255,255,0.25)`,
                  }}
                >
                  <Crown className="h-5 w-5" style={{ color: GOLD_HI, filter: `drop-shadow(0 0 8px ${GOLD}cc)` }} />
                </span>
                <div className="min-w-0">
                  <h3
                    className="font-display font-black text-[24px] leading-none tracking-tight bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(180deg, #FFF7C8 0%, ${GOLD_HI} 45%, ${GOLD_DEEP} 100%)`,
                      WebkitTextStroke: "0.35px rgba(120,65,0,0.55)",
                      filter: `drop-shadow(0 0 10px ${GOLD}66)`,
                    }}
                  >
                    Agent Empire
                  </h3>
                  <p className="mt-1 text-[10.5px] text-white/85">
                    Build Your Team <span style={{ color: GOLD_HI }}>•</span> Earn Unlimited Commission
                  </p>
                </div>
              </div>


              {/* Become Agent CTA — premium enlarged */}
              <button
                type="button"
                onClick={() => navigate("/agent/apply")}
                className="mt-1.5 h-12 px-6 rounded-full inline-flex items-center gap-2 font-display font-black text-[13.5px] tracking-[0.16em] uppercase active:scale-[0.98] transition-transform"
                style={{
                  background: `linear-gradient(135deg, #FFF7C8 0%, ${GOLD_HI} 32%, ${GOLD_DEEP} 62%, ${PURPLE} 100%)`,
                  color: "#150a02",
                  border: `1.5px solid ${GOLD_HI}`,
                  boxShadow: `0 0 26px ${GOLD}b3, 0 0 38px ${PURPLE}77, inset 0 1px 0 rgba(255,255,255,0.65), inset 0 0 0 1px rgba(255,255,255,0.18), inset 0 -1px 0 rgba(90,45,0,0.4)`,
                  textShadow: "0 1px 0 rgba(255,255,255,0.4)",
                }}

              >
                <Crown className="h-4 w-4" style={{ color: "#3a1d00" }} />
                Become Agent
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>


          {/* ── Stats Grid 2×2 ── */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { i: Users, label: "Active Agents", value: "8,240", sub: "Total Active Worldwide", c: NEON_GREEN },
              { i: Coins, label: "Today's Commission", value: "৳12.4K", sub: "Total Earned Today", c: GOLD_HI },
              { i: TrendingUp, label: "Team Growth", value: "+24.8%", sub: "Growth This Month", c: PURPLE },
              { i: Gift, label: "Monthly Rewards", value: "৳125.6K", sub: "Total Rewards Paid", c: BLUE },
            ].map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => navigate("/agent")}
                className="relative overflow-hidden rounded-[14px] p-3 text-center active:scale-[0.99] transition min-h-[104px] flex flex-col items-center justify-center gap-1"
                style={{
                  background: `radial-gradient(80% 60% at 50% 0%, ${s.c}18, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.35))`,
                  border: `1px solid ${s.c}62`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 1px ${s.c}1f, 0 0 22px ${s.c}33, 0 0 6px ${s.c}44`,
                }}
              >
                <s.i className="h-5 w-5" style={{ color: s.c, filter: `drop-shadow(0 0 6px ${s.c}88)` }} />
                <div className="text-[9px] font-bold tracking-wider uppercase text-white/70">{s.label}</div>
                <div className="font-display font-black text-[17px] tabular-nums leading-none" style={{ color: s.c, textShadow: `0 0 10px ${s.c}66` }}>
                  {s.value}
                </div>
                <div className="text-[8.5px] text-white/50 leading-tight">{s.sub}</div>
              </button>
            ))}
          </div>

          {/* ── Compact Live Earnings ticker (72px · 3 entries) ── */}
          <div
            className="relative overflow-hidden rounded-[10px] px-2 h-[72px] flex flex-col justify-center gap-1"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35))",
              border: `1px solid ${GOLD_HI}33`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-[5px] text-[8px] font-black tracking-wider"
                style={{ background: `${NEON_GREEN}22`, border: `1px solid ${NEON_GREEN}77`, color: NEON_GREEN }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: NEON_GREEN, boxShadow: `0 0 6px ${NEON_GREEN}` }} />
                LIVE EARNINGS
              </span>
              <button
                onClick={() => navigate("/agent")}
                className="text-[9px] font-black tracking-wider uppercase flex items-center gap-0.5"
                style={{ color: GOLD_HI }}
              >
                View All <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 overflow-hidden">
              {[
                { n: "Rakib", v: "৳4,250" },
                { n: "Nusrat", v: "৳2,800" },
                { n: "Sabbir", v: "৳5,400" },
              ].map((x) => (
                <span
                  key={x.n}
                  className="flex-1 min-w-0 flex items-center gap-1 px-1.5 h-[26px] rounded-[7px]"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.4))",
                    border: `1px solid ${GOLD_HI}33`,
                  }}
                >
                  <ShieldCheck className="h-2.5 w-2.5 shrink-0" style={{ color: GOLD_HI }} />
                  <span className="text-[8.5px] font-bold text-white/80 truncate">{x.n[0]}*****</span>
                  <span className="ml-auto font-black text-[10px] tabular-nums" style={{ color: NEON_GREEN, textShadow: `0 0 6px ${NEON_GREEN}55` }}>
                    +{x.v}
                  </span>
                </span>
              ))}
            </div>
          </div>

        </section>




        {/* ═══ S3 · FIXED DEPOSIT CENTRE — Gold + Emerald Preview ═══ */}
        <section
          id="home-fixed-deposit"
          data-testid="home-fixed-deposit"
          aria-label="Fixed Deposit Centre"
          className="relative overflow-hidden rounded-[22px] pt-3 px-3 pb-2 space-y-2.5 mb-[-8px]"
          style={{
            background:
              "radial-gradient(90% 60% at 100% 0%, rgba(18,198,101,0.20), transparent 60%), radial-gradient(90% 60% at 0% 100%, rgba(254,192,19,0.18), transparent 60%), radial-gradient(70% 50% at 50% 50%, rgba(2,68,45,0.20), transparent 70%), linear-gradient(180deg, #060d0a 0%, #04070a 100%)",
            border: `1px solid ${GOLD_HI}44`,
            boxShadow: `0 22px 60px -24px rgba(0,0,0,0.95), 0 0 44px -12px ${EMERALD}55, inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px ${GOLD_HI}1f`,
          }}
        >
          {/* Cinematic lighting */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(30% 22% at 12% 8%, rgba(254,192,19,0.28), transparent 70%), radial-gradient(28% 22% at 92% 92%, rgba(18,198,101,0.30), transparent 70%)",
              filter: "blur(2px)",
              mixBlendMode: "screen",
            }}
          />

          {/* ── Hero Banner ── */}
          <div
            className="relative overflow-hidden rounded-[18px]"
            style={{
              border: `1px solid transparent`,
              backgroundImage: `linear-gradient(#04070a,#04070a), linear-gradient(135deg, ${GOLD_HI}dd 0%, ${GOLD_DEEP}99 40%, ${EMERALD}dd 100%)`,
              backgroundOrigin: "border-box",
              backgroundClip: "padding-box, border-box",
              boxShadow: `0 0 52px ${EMERALD}55, 0 0 44px ${GOLD}3a, 0 22px 52px -20px rgba(0,0,0,0.98), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 0 0 1px ${GOLD_HI}22`,
            }}
          >
            <img
              src={fixedDepositHero.url}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              width={1536}
              height={640}
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(4,7,10,0.82) 0%, rgba(4,7,10,0.30) 32%, rgba(4,7,10,0.18) 62%, rgba(4,7,10,0.78) 100%), linear-gradient(180deg, rgba(4,7,10,0.20) 0%, transparent 40%, rgba(4,7,10,0.55) 100%)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(38% 62% at 6% 18%, rgba(254,192,19,0.34), transparent 70%), radial-gradient(46% 68% at 98% 82%, rgba(18,198,101,0.36), transparent 72%)",
                mixBlendMode: "screen",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-[3px] rounded-[15px]"
              style={{
                border: `1px solid rgba(255,255,255,0.10)`,
                boxShadow: `inset 0 0 30px rgba(18,198,101,0.16), inset 0 0 60px rgba(0,0,0,0.35)`,
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-4 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${GOLD_HI}ee, transparent)` }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-6 bottom-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${EMERALD}cc, transparent)` }}
            />

            {/* Emerald vault glow pulse */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(24% 42% at 68% 55%, ${EMERALD}66, transparent 70%)`,
                mixBlendMode: "screen",
                animation: "fdVaultGlow 4.6s ease-in-out infinite",
              }}
            />

            {/* Moving light sweep */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
              style={{ mixBlendMode: "screen" }}
            >
              <div
                className="absolute top-0 h-full w-[38%] -skew-x-12"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,247,200,0.14) 45%, rgba(255,255,255,0.32) 50%, rgba(255,247,200,0.14) 55%, transparent 100%)",
                  filter: "blur(6px)",
                  animation: "fdSweep 5.2s linear infinite",
                }}
              />
            </div>

            {/* Floating gold coins */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              {[
                { l: "18%", t: "22%", s: 8, d: "0s", dur: "4.8s" },
                { l: "32%", t: "68%", s: 6, d: "0.8s", dur: "5.6s" },
                { l: "58%", t: "18%", s: 5, d: "1.6s", dur: "6.2s" },
                { l: "74%", t: "72%", s: 7, d: "0.4s", dur: "5.2s" },
                { l: "88%", t: "34%", s: 4, d: "1.2s", dur: "6.8s" },
              ].map((c, i) => (
                <span
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: c.l,
                    top: c.t,
                    width: c.s,
                    height: c.s,
                    background: `radial-gradient(circle at 35% 30%, #FFF7C8 0%, ${GOLD_HI} 45%, ${GOLD_DEEP} 100%)`,
                    boxShadow: `0 0 8px ${GOLD}cc, 0 0 14px ${GOLD}66`,
                    animation: `fdCoinFloat ${c.dur} ease-in-out ${c.d} infinite`,
                  }}
                />
              ))}
            </div>

            <style>{`
              @keyframes fdSweep {
                0% { transform: translateX(-140%) skewX(-12deg); }
                100% { transform: translateX(360%) skewX(-12deg); }
              }
              @keyframes fdCoinFloat {
                0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.55; }
                50% { transform: translateY(-6px) rotate(180deg); opacity: 1; }
              }
              @keyframes fdVaultGlow {
                0%, 100% { opacity: 0.7; }
                50% { opacity: 1; }
              }
            `}</style>

            <div className="relative z-10 px-3.5 pt-1 pb-1">
              <div className="flex items-start gap-2">
                <span
                  aria-hidden
                  className="relative shrink-0 h-8 w-8 rounded-[10px] grid place-items-center"
                  style={{
                    background: `radial-gradient(circle at 50% 35%, ${GOLD_HI}44, rgba(4,10,6,0.9) 70%)`,
                    border: `1px solid ${GOLD_HI}aa`,
                    boxShadow: `0 0 18px ${GOLD}88, inset 0 1px 0 rgba(255,255,255,0.25)`,
                  }}
                >
                  <PiggyBank className="h-5 w-5" style={{ color: GOLD_HI, filter: `drop-shadow(0 0 8px ${GOLD}cc)` }} />
                </span>
                <div className="min-w-0">
                  <h3
                    className="font-display font-black text-[22px] leading-none tracking-tight bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(180deg, #FFF7C8 0%, ${GOLD_HI} 45%, ${GOLD_DEEP} 100%)`,
                      WebkitTextStroke: "0.35px rgba(120,65,0,0.55)",
                      filter: `drop-shadow(0 0 10px ${GOLD}66)`,
                    }}
                  >
                    Fixed Deposit Centre
                  </h3>
                  <p className="mt-1 text-[10.5px] text-white/85">
                    Invest 15–365 Days <span style={{ color: GOLD_HI }}>•</span> Up to 25% Return
                  </p>
                </div>
              </div>

              {/* Invest Now CTA */}
              <button
                type="button"
                onClick={() => navigate("/fixed-deposits")}
                className="mt-1.5 h-12 px-6 rounded-full inline-flex items-center gap-2 font-display font-black text-[13.5px] tracking-[0.16em] uppercase active:scale-[0.98] transition-transform"
                style={{
                  background: `linear-gradient(135deg, #FFF7C8 0%, ${GOLD_HI} 32%, ${GOLD_DEEP} 62%, ${EMERALD} 100%)`,
                  color: "#0a1a10",
                  border: `1.5px solid ${GOLD_HI}`,
                  boxShadow: `0 0 26px ${GOLD}b3, 0 0 38px ${EMERALD}77, inset 0 1px 0 rgba(255,255,255,0.65), inset 0 0 0 1px rgba(255,255,255,0.18), inset 0 -1px 0 rgba(90,45,0,0.4)`,
                  textShadow: "0 1px 0 rgba(255,255,255,0.4)",
                }}
              >
                <PiggyBank className="h-4 w-4" style={{ color: "#0a2a18" }} />
                Invest Now
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Stats Grid 2×2 ── */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { i: Users, label: "Investors", value: "24,120", sub: "Trusted Depositors", c: EMERALD_HI },
              { i: Layers, label: "Active Plans", value: "15", sub: "Ranges 15–365 days", c: GOLD_HI },
              { i: ShieldCheck, label: "Trust Score", value: "9.4/10", sub: "Verified & Secure", c: BLUE },
              { i: TrendingUp, label: "Top Return", value: "25%", sub: "365-day Premium", c: PINK },
            ].map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => navigate("/fixed-deposits")}
                className="relative overflow-hidden rounded-[14px] p-3 text-center active:scale-[0.99] transition min-h-[104px] flex flex-col items-center justify-center gap-1"
                style={{
                  background: `radial-gradient(80% 60% at 50% 0%, ${s.c}18, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.35))`,
                  border: `1px solid ${s.c}62`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 1px ${s.c}1f, 0 0 22px ${s.c}33, 0 0 6px ${s.c}44`,
                }}
              >
                <s.i className="h-5 w-5" style={{ color: s.c, filter: `drop-shadow(0 0 6px ${s.c}88)` }} />
                <div className="text-[9px] font-bold tracking-wider uppercase text-white/70">{s.label}</div>
                <div className="font-display font-black text-[17px] tabular-nums leading-none" style={{ color: s.c, textShadow: `0 0 10px ${s.c}66` }}>
                  {s.value}
                </div>
                <div className="text-[8.5px] text-white/50 leading-tight">{s.sub}</div>
              </button>
            ))}
          </div>

          {/* ── 4 Featured Plans 2×2 ── */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { days: "15 Days", rate: "5%", tag: "STARTER", c: BLUE, i: Timer },
              { days: "30 Days", rate: "9%", tag: "GROWTH", c: EMERALD_HI, i: Calendar },
              { days: "90 Days", rate: "15%", tag: "POPULAR", c: GOLD_HI, i: Award },
              { days: "365 Days", rate: "25%", tag: "ELITE", c: PINK, i: Crown },
            ].map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => navigate("/fixed-deposits")}
                className="group relative overflow-hidden rounded-[14px] p-2.5 text-left active:scale-[0.99] transition min-h-[86px] flex flex-col justify-between"
                style={{
                  background: `radial-gradient(80% 60% at 100% 0%, ${p.c}2e, transparent 70%), radial-gradient(70% 60% at 0% 100%, ${p.c}1a, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 40%, rgba(0,0,0,0.55) 100%)`,
                  border: `1px solid transparent`,
                  backgroundClip: "padding-box",
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.5), inset 0 0 22px ${p.c}22, inset 0 0 0 1px ${p.c}2a, 0 8px 20px -8px rgba(0,0,0,0.9), 0 0 22px ${p.c}3a`,
                  backdropFilter: "blur(10px) saturate(140%)",
                  WebkitBackdropFilter: "blur(10px) saturate(140%)",
                }}
              >
                {/* Gold edge highlight ring */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[14px]"
                  style={{
                    padding: 1,
                    background: `linear-gradient(140deg, ${GOLD_HI}cc 0%, ${p.c}66 35%, transparent 55%, ${GOLD_HI}55 100%)`,
                    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}
                />
                {/* Top gloss */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-2 top-0 h-1/2 rounded-t-[13px]"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.14), transparent 100%)",
                    mixBlendMode: "screen",
                  }}
                />
                {/* Soft inner glow */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-px rounded-[14px]"
                  style={{
                    boxShadow: `inset 0 0 30px ${p.c}33, inset 0 0 60px rgba(0,0,0,0.35)`,
                  }}
                />

                <div className="relative flex items-center justify-between">
                  <span
                    className="h-7 w-7 rounded-[9px] grid place-items-center"
                    style={{
                      background: `radial-gradient(circle at 35% 25%, ${p.c}55, ${p.c}18 70%)`,
                      border: `1px solid ${p.c}88`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 0 10px ${p.c}66`,
                    }}
                  >
                    <p.i className="h-4 w-4" style={{ color: p.c, filter: `drop-shadow(0 0 4px ${p.c}aa)` }} />
                  </span>
                  <span
                    className="text-[7.5px] font-black tracking-widest uppercase px-1.5 py-[1px] rounded-[4px]"
                    style={{
                      background: `linear-gradient(180deg, ${p.c}33, ${p.c}14)`,
                      border: `1px solid ${p.c}88`,
                      color: p.c,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 0 6px ${p.c}55`,
                    }}
                  >
                    {p.tag}
                  </span>
                </div>
                <div className="relative">
                  <div
                    className="font-display font-black text-[13px] leading-none bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(180deg, #ffffff 0%, #d8dde3 100%)`,
                      filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.6))",
                    }}
                  >
                    {p.days}
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-[8.5px] uppercase tracking-widest text-white/55">Return</span>
                    <span
                      className="font-display font-black text-[16px] tabular-nums"
                      style={{ color: p.c, textShadow: `0 0 10px ${p.c}88, 0 1px 0 rgba(0,0,0,0.5)` }}
                    >
                      {p.rate}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* ── Bottom CTA row ── */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => navigate("/fixed-deposits")}
              className="h-11 rounded-[12px] font-display font-black text-[11px] tracking-[0.14em] uppercase inline-flex items-center justify-center gap-1.5 active:scale-[0.99] transition"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.4))",
                border: `1px solid ${GOLD_HI}66`,
                color: GOLD_HI,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 14px ${GOLD}33`,
              }}
            >
              View All Plans <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/fixed-deposits")}
              className="h-11 rounded-[12px] font-display font-black text-[11px] tracking-[0.14em] uppercase inline-flex items-center justify-center gap-1.5 active:scale-[0.99] transition"
              style={{
                background: `linear-gradient(135deg, ${GOLD_HI} 0%, ${GOLD_DEEP} 55%, ${EMERALD} 100%)`,
                color: "#0a1a10",
                border: `1px solid ${GOLD_HI}`,
                boxShadow: `0 0 20px ${EMERALD}66, 0 0 18px ${GOLD}55, inset 0 1px 0 rgba(255,255,255,0.55)`,
                textShadow: "0 1px 0 rgba(255,255,255,0.35)",
              }}
            >
              Start Investing <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>


        {/* ═══ S4 · EXCLUSIVE GAMES — Gold + Purple + Blue Preview (LOCKED v1.0) ═══ */}
        <section
          id="home-exclusive-games"
          data-testid="home-exclusive-games"
          aria-label="Exclusive Games"
          className="relative overflow-hidden rounded-[22px] pt-3 px-3 pb-2.5 space-y-2.5 mb-[-8px]"
          style={{
            background:
              "radial-gradient(90% 60% at 0% 0%, rgba(254,192,19,0.18), transparent 60%), radial-gradient(90% 60% at 100% 100%, rgba(139,92,246,0.22), transparent 60%), radial-gradient(70% 50% at 50% 50%, rgba(37,99,235,0.16), transparent 70%), linear-gradient(180deg, #0a0714 0%, #04060d 100%)",
            border: `1px solid ${GOLD_HI}44`,
            boxShadow: `0 22px 60px -24px rgba(0,0,0,0.95), 0 0 44px -12px ${PURPLE}55, inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px ${GOLD_HI}1f`,
          }}
        >
          {/* Cinematic corner lighting */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(30% 22% at 88% 8%, rgba(254,192,19,0.24), transparent 70%), radial-gradient(28% 22% at 8% 92%, rgba(37,99,235,0.28), transparent 70%), radial-gradient(30% 24% at 92% 90%, rgba(139,92,246,0.26), transparent 72%)",
              filter: "blur(2px)",
              mixBlendMode: "screen",
            }}
          />

          {/* ── TOP HERO ── */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                aria-hidden
                className="relative shrink-0 h-11 w-11 rounded-[12px] grid place-items-center overflow-hidden"
                style={{
                  background: `radial-gradient(circle at 50% 30%, ${GOLD_HI}55, rgba(6,4,20,0.92) 72%)`,
                  border: `1px solid ${GOLD_HI}aa`,
                  boxShadow: `0 0 20px ${GOLD}99, 0 0 34px ${GOLD}55, inset 0 1px 0 rgba(255,255,255,0.28)`,
                  backdropFilter: "blur(8px) saturate(150%)",
                  WebkitBackdropFilter: "blur(8px) saturate(150%)",
                }}
              >
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(60% 55% at 50% 45%, ${GOLD}55, transparent 70%)`,
                    filter: "blur(6px)",
                    mixBlendMode: "screen",
                  }}
                />
                <img
                  src={goluckyLogo}
                  alt="GoLucky"
                  className="relative h-8 w-8 object-contain"
                  style={{ filter: `drop-shadow(0 0 6px ${GOLD}cc) drop-shadow(0 0 12px ${GOLD}66)` }}
                  loading="lazy"
                />
              </span>
              <div className="min-w-0">
                <h3
                  className="font-display font-black text-[17px] leading-none tracking-tight bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(180deg, #FFF7C8 0%, ${GOLD_HI} 45%, ${GOLD_DEEP} 100%)`,
                    filter: `drop-shadow(0 0 8px ${GOLD}55)`,
                  }}
                >
                  Exclusive Games
                </h3>
                <p className="mt-1 text-[10px] text-white/70 truncate">
                  20,000+ Premium Games <span style={{ color: GOLD_HI }}>•</span> 50+ Providers
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/games")}
              className="shrink-0 h-8 px-3 rounded-full inline-flex items-center gap-1 font-display font-black text-[10.5px] tracking-[0.14em] uppercase active:scale-[0.98] transition"
              style={{
                background: `linear-gradient(135deg, ${GOLD_HI} 0%, ${GOLD_DEEP} 55%, ${PURPLE} 100%)`,
                color: "#0a0714",
                border: `1px solid ${GOLD_HI}`,
                boxShadow: `0 0 18px ${GOLD}88, 0 0 18px ${PURPLE}66, inset 0 1px 0 rgba(255,255,255,0.55)`,
                textShadow: "0 1px 0 rgba(255,255,255,0.35)",
              }}
            >
              Explore <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* ── CATEGORY GRID 2×3 ── */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { title: "Aviator", art: catAviator.url, c: RED, to: "/aviator" },
              { title: "Casino", art: catCasino.url, c: PURPLE, to: "/games?cat=casino" },
              { title: "Sports", art: catSports.url, c: PINK, to: "/games?cat=sports" },
              { title: "Slots", art: catSlots.url, c: GOLD_HI, to: "/games?cat=slots" },
              { title: "Fishing", art: catFishing.url, c: CYAN, to: "/games?cat=fishing" },
              { title: "Arcade", art: catArcade.url, c: ORANGE, to: "/games?cat=arcade" },
            ].map((cat) => (
              <button
                key={cat.title}
                type="button"
                onClick={() => navigate(cat.to)}
                className="group relative overflow-hidden rounded-[12px] h-[70px] transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.96] motion-reduce:transition-none motion-reduce:transform-none motion-reduce:hover:transform-none motion-reduce:active:transform-none"
                style={{
                  background: `radial-gradient(75% 90% at 65% 45%, ${cat.c}33, transparent 70%), radial-gradient(90% 70% at 20% 100%, ${cat.c}22, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.65) 100%)`,
                  border: `1px solid ${cat.c}66`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), inset 0 0 22px ${cat.c}2a, 0 0 16px ${cat.c}3a`,
                  backdropFilter: "blur(8px) saturate(140%)",
                  WebkitBackdropFilter: "blur(8px) saturate(140%)",
                }}
              >
                {/* Radial glow behind artwork */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `radial-gradient(45% 60% at 68% 45%, ${cat.c}55, transparent 70%)`,
                    filter: "blur(8px)",
                    mixBlendMode: "screen",
                  }}
                />
                {/* Full artwork (covers ~60% of card, right-aligned) */}
                <img
                  src={cat.art}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className="pointer-events-none absolute right-[-4px] top-1/2 -translate-y-1/2 h-[110%] w-auto object-contain transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-2 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0 motion-reduce:group-active:scale-100"
                  style={{ filter: `drop-shadow(0 2px 6px rgba(0,0,0,0.6)) drop-shadow(0 0 8px ${cat.c}88)` }}
                />
                {/* Left readability gradient for title */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-3/5"
                  style={{
                    background: "linear-gradient(90deg, rgba(4,7,10,0.85) 0%, rgba(4,7,10,0.35) 60%, transparent 100%)",
                  }}
                />
                {/* Top hairline */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-2 top-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${cat.c}cc, transparent)` }}
                />
                {/* Title */}
                <div className="relative z-10 h-full flex items-end p-2">
                  <div
                    className="font-display font-black text-[11.5px] leading-none tracking-tight"
                    style={{
                      color: "#fff",
                      textShadow: `0 1px 4px rgba(0,0,0,0.9), 0 0 8px ${cat.c}88`,
                    }}
                  >
                    {cat.title}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* ── PROVIDER STATS BAR (4 cols) ── */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { v: "20K+", l: "Games", c: GOLD_HI },
              { v: "50+", l: "Providers", c: PURPLE },
              { v: "24/7", l: "Live Play", c: EMERALD_HI },
              { v: "99.9%", l: "Uptime", c: BLUE },
            ].map((s) => (
              <div
                key={s.l}
                className="relative overflow-hidden rounded-[10px] h-[52px] flex flex-col items-center justify-center"
                style={{
                  background: `linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.45))`,
                  border: `1px solid ${s.c}55`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 12px ${s.c}2a`,
                }}
              >
                <div
                  className="font-display font-black text-[13px] tabular-nums leading-none"
                  style={{ color: s.c, textShadow: `0 0 8px ${s.c}88` }}
                >
                  {s.v}
                </div>
                <div className="mt-1 text-[8px] uppercase tracking-widest text-white/55">{s.l}</div>
              </div>
            ))}
          </div>

          {/* ── FEATURED GAME PREVIEW (3 cards, equal size) ── */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { title: "Aviator", tag: "HOT", c: RED, i: Rocket, to: "/aviator", dot: true },
              { title: "Casino", tag: "TRENDING", c: PURPLE, i: Diamond, to: "/games?cat=casino", dot: false },
              { title: "Sports", tag: "LIVE", c: EMERALD_HI, i: Trophy, to: "/games?cat=sports", dot: true },
            ].map((p) => (
              <button
                key={p.title}
                type="button"
                onClick={() => navigate(p.to)}
                className="relative overflow-hidden rounded-[12px] h-[64px] px-2 flex items-center gap-2 active:scale-[0.98] transition"
                style={{
                  background: `radial-gradient(80% 60% at 100% 0%, ${p.c}2a, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.5) 100%)`,
                  border: `1px solid ${p.c}66`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), inset 0 0 18px ${p.c}22, 0 0 14px ${p.c}33`,
                  backdropFilter: "blur(8px) saturate(140%)",
                  WebkitBackdropFilter: "blur(8px) saturate(140%)",
                }}
              >
                <span
                  className="shrink-0 h-7 w-7 rounded-[8px] grid place-items-center"
                  style={{
                    background: `radial-gradient(circle at 35% 25%, ${p.c}55, ${p.c}18 70%)`,
                    border: `1px solid ${p.c}88`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 0 8px ${p.c}66`,
                  }}
                >
                  <p.i className="h-3.5 w-3.5" style={{ color: p.c, filter: `drop-shadow(0 0 3px ${p.c}aa)` }} />
                </span>
                <div className="min-w-0 text-left flex-1">
                  <div className="font-display font-black text-[11.5px] text-white leading-none truncate">{p.title}</div>
                  <div className="mt-1 flex items-center gap-1">
                    {p.dot && (
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 rounded-full animate-pulse"
                        style={{ background: p.c, boxShadow: `0 0 6px ${p.c}` }}
                      />
                    )}
                    <span
                      className="text-[7.5px] font-black tracking-widest uppercase"
                      style={{ color: p.c }}
                    >
                      {p.tag}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* ── BOTTOM CTA ── */}
          <button
            type="button"
            onClick={() => navigate("/games")}
            className="w-full h-11 rounded-[12px] font-display font-black text-[11.5px] tracking-[0.16em] uppercase inline-flex items-center justify-center gap-1.5 active:scale-[0.99] transition"
            style={{
              background: `linear-gradient(135deg, ${GOLD_HI} 0%, ${GOLD_DEEP} 40%, ${PURPLE} 75%, ${BLUE} 100%)`,
              color: "#0a0714",
              border: `1px solid ${GOLD_HI}`,
              boxShadow: `0 0 22px ${PURPLE}66, 0 0 18px ${GOLD}55, inset 0 1px 0 rgba(255,255,255,0.55)`,
              textShadow: "0 1px 0 rgba(255,255,255,0.35)",
            }}
          >
            View All Games <ArrowRight className="h-4 w-4" />
          </button>
        </section>

        {/* ═══ S4b · LIVE WINNERS TICKER (compact 54px) ═══ */}
        <div
          className="relative overflow-hidden rounded-[14px] h-[54px] flex items-center"
          style={{
            background:
              "radial-gradient(60% 120% at 0% 50%, rgba(18,198,101,0.18), transparent 60%), radial-gradient(60% 120% at 100% 50%, rgba(254,192,19,0.14), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.55))",
            border: `1px solid ${GOLD_HI}44`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px ${EMERALD}33, 0 0 18px ${GOLD}22`,
            backdropFilter: "blur(8px) saturate(140%)",
            WebkitBackdropFilter: "blur(8px) saturate(140%)",
          }}
        >
          {/* Left LIVE badge (sticky) */}
          <div
            className="relative z-20 shrink-0 h-full flex items-center gap-1.5 pl-3 pr-2.5"
            style={{
              background: "linear-gradient(90deg, rgba(4,7,10,0.92) 0%, rgba(4,7,10,0.85) 70%, transparent 100%)",
            }}
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ background: EMERALD_HI, boxShadow: `0 0 8px ${EMERALD_HI}` }}
            />
            <span
              className="text-[10px] font-black tracking-[0.18em] uppercase px-1.5 py-[2px] rounded-[4px]"
              style={{
                background: `linear-gradient(180deg, ${EMERALD}33, ${EMERALD}12)`,
                border: `1px solid ${EMERALD}88`,
                color: EMERALD_HI,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 0 8px ${EMERALD}66`,
              }}
            >
              LIVE
            </span>
          </div>

          {/* Fade edges */}
          <span
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 z-10"
            style={{ background: "linear-gradient(90deg, transparent, rgba(4,7,10,0.9))" }}
          />

          {/* Scrolling track */}
          <div className="relative flex-1 overflow-hidden h-full flex items-center">
            <div
              className="flex items-center gap-6 whitespace-nowrap will-change-transform"
              style={{ animation: "lwTickerScroll 42s linear infinite" }}
            >
              {(() => {
                const winners = [
                  { n: "Jakir***", g: "Aviator", a: "12,500" },
                  { n: "Rahim***", g: "WinGo", a: "8,200" },
                  { n: "Karim***", g: "Casino", a: "15,400" },
                  { n: "Nusrat***", g: "Lottery", a: "22,800" },
                  { n: "Sabbir***", g: "Crash", a: "6,750" },
                  { n: "Farhan***", g: "Aviator", a: "31,200" },
                  { n: "Mitu***", g: "WinGo", a: "4,900" },
                  { n: "Arif***", g: "Sports", a: "18,600" },
                ];
                return [...winners, ...winners].map((w, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-[11.5px]">
                    <ShieldCheck className="h-3 w-3" style={{ color: EMERALD_HI }} />
                    <span className="text-white/85 font-medium">{w.n}</span>
                    <span className="text-white/40">won</span>
                    <span
                      className="font-display font-black tabular-nums"
                      style={{ color: GOLD_HI, textShadow: `0 0 6px ${GOLD}66` }}
                    >
                      ৳{w.a}
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-[1px] rounded-[3px] uppercase tracking-widest"
                      style={{ background: `${GOLD_HI}18`, color: GOLD_HI, border: `1px solid ${GOLD_HI}44` }}
                    >
                      {w.g}
                    </span>
                    <span aria-hidden className="text-white/20 ml-2">•</span>
                  </span>
                ));
              })()}
            </div>
          </div>

          <style>{`
            @keyframes lwTickerScroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
        </div>



        {/* ═══ S5 · AI PREDICTION CENTER ═══ */}
        <Section id="home-ai-prediction" title="AI Prediction Center" sub="Smart signals · trend analysis" cta={{ label: "Explore AI", to: "/ai-hub" }}>
          <div className="relative space-y-2 rounded-[22px] overflow-hidden">
            {/* ── AI Hologram Backdrop ── */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
              {/* Concentric holographic rings */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[260px] w-[260px] rounded-full opacity-60"
                style={{ background: `radial-gradient(circle, ${GOLD_HI}1a 0%, transparent 42%), radial-gradient(circle at 50% 50%, transparent 54%, ${EMERALD}22 57%, transparent 60%), radial-gradient(circle at 50% 50%, transparent 68%, ${CYAN}1c 71%, transparent 74%)`, filter: "blur(1.5px)" }} />
              {/* Brain silhouette */}
              <svg viewBox="0 0 200 200" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[150px] w-[150px] opacity-[0.10]" fill="none" stroke={GOLD_HI} strokeWidth="0.9" strokeLinecap="round">
                <path d="M72 62 Q52 62 52 86 Q40 96 52 112 Q46 132 72 138 Q82 152 100 148 L100 55 Q82 50 72 62Z" />
                <path d="M128 62 Q148 62 148 86 Q160 96 148 112 Q154 132 128 138 Q118 152 100 148 L100 55 Q118 50 128 62Z" />
                <path d="M60 92 Q76 92 82 102 M140 92 Q124 92 118 102 M100 70 L100 132 M74 112 Q84 118 92 112 M126 112 Q116 118 108 112" stroke={EMERALD_HI} />
                <circle cx="100" cy="100" r="46" stroke={CYAN} strokeDasharray="2 4" opacity="0.7" />
              </svg>
              {/* Floating particles removed — performance cleanup (Final Polish Phase 2). */}

              {/* Grid scanlines */}
              <div className="absolute inset-0 opacity-[0.05]"
                style={{ backgroundImage: `linear-gradient(${GOLD_HI}66 1px, transparent 1px), linear-gradient(90deg, ${EMERALD}44 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
            </div>

            <div className="relative z-10 space-y-2">
          {/* Confidence Hero Bar — compact, gold+emerald+blue luxury */}
          <div
            className={`${glass} relative overflow-hidden p-3 flex items-center gap-3`}
            style={{
              borderColor: `${GOLD_HI}55`,
              background: `linear-gradient(120deg, ${GOLD_HI}18 0%, ${EMERALD}14 45%, ${CYAN}18 100%)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 24px ${GOLD_HI}22`,
            }}
          >
            <span aria-hidden className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full"
              style={{ background: `radial-gradient(circle, ${GOLD_HI}55, transparent 70%)`, filter: "blur(14px)" }} />
            <div className="h-11 w-11 rounded-xl grid place-items-center shrink-0"
              style={{ background: `linear-gradient(135deg, ${GOLD_HI}33, ${EMERALD}22)`, border: `1px solid ${GOLD_HI}66`, boxShadow: `0 0 14px ${GOLD_HI}55` }}>
              <Cpu className="h-5 w-5" style={{ color: GOLD_HI }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9.5px] uppercase tracking-[0.18em] text-white/60">AI Model Confidence</div>
              <div className="flex items-baseline gap-1.5">
                <div className="font-display font-black text-[22px] leading-none tabular-nums" style={{ color: GOLD_HI, textShadow: `0 0 10px ${GOLD_HI}66` }}>94.2%</div>
                <div className="text-[10px] font-semibold" style={{ color: EMERALD_HI }}>↑ 2.4</div>
              </div>
              {/* Micro progress bar */}
              <div className="mt-1 h-[4px] w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="ai-confidence-bar h-full rounded-full" style={{ width: "94%", backgroundImage: `linear-gradient(90deg, ${GOLD_HI}, ${EMERALD}, ${CYAN}, ${GOLD_HI})`, boxShadow: `0 0 10px ${GOLD_HI}aa` }} />
              </div>
            </div>
            <span className="text-[9.5px] px-2 py-1 rounded-full whitespace-nowrap"
              style={{ background: `${EMERALD}22`, color: EMERALD_HI, border: `1px solid ${EMERALD}66` }}>
              LIVE
            </span>
          </div>

          {/* ── LIVE AI SIGNALS ticker ── */}
          <div
            className="relative overflow-hidden rounded-[12px] h-[42px] flex items-center"
            style={{
              background: `linear-gradient(90deg, rgba(4,7,10,0.85) 0%, rgba(4,7,10,0.55) 100%)`,
              border: `1px solid ${EMERALD}44`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px ${EMERALD}22, 0 0 20px ${GOLD_HI}12`,
              backdropFilter: "blur(10px) saturate(140%)",
              WebkitBackdropFilter: "blur(10px) saturate(140%)",
            }}
          >
            {/* LIVE badge */}
            <div className="shrink-0 flex items-center gap-1.5 pl-2.5 pr-2 h-full"
              style={{ background: `linear-gradient(90deg, ${EMERALD}26, transparent)`, borderRight: `1px solid ${EMERALD}44` }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full animate-ping motion-reduce:animate-none" style={{ background: EMERALD_HI, opacity: 0.75 }} />
                <span className="relative rounded-full h-1.5 w-1.5" style={{ background: EMERALD_HI, boxShadow: `0 0 6px ${EMERALD_HI}` }} />
              </span>
              <span className="text-[9px] font-black tracking-[0.18em]" style={{ color: EMERALD_HI, textShadow: `0 0 6px ${EMERALD}88` }}>LIVE</span>
            </div>
            {/* Marquee track */}
            <div className="flex-1 overflow-hidden relative">
              <div className="ai-signals-track flex whitespace-nowrap will-change-transform" style={{ width: "max-content" }}>
                {(() => {
                  const signals = [
                    { t: "BTC Bullish +82%",       c: EMERALD_HI },
                    { t: "WinGo Trend · Green",    c: EMERALD_HI },
                    { t: "Aviator Traffic +37%",   c: GOLD_HI },
                    { t: "5D Pattern Match 91%",   c: CYAN },
                    { t: "TRX Momentum · Strong",  c: GOLD_HI },
                    { t: "ETH Signal · Buy",       c: EMERALD_HI },
                  ];
                  const row = (
                    <div className="flex items-center gap-4 pl-4 pr-4 text-[11px] font-semibold tabular-nums">
                      {signals.map((s, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                          <span className="text-white/45">•</span>
                          <span style={{ color: s.c, textShadow: `0 0 6px ${s.c}66` }}>{s.t}</span>
                        </span>
                      ))}
                    </div>
                  );
                  return <>{row}{row}</>;
                })()}
              </div>
              {/* Edge fades */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-6" style={{ background: "linear-gradient(90deg, rgba(4,7,10,0.9), transparent)" }} />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-6" style={{ background: "linear-gradient(-90deg, rgba(4,7,10,0.9), transparent)" }} />
            </div>
          </div>

          {/* 4 Insight Cards — compact 2×2 */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { i: Brain,       title: "AI Confidence", metric: "94.2%",  sub: "12 active signals", tag: "STRONG",  c: GOLD_HI, accent: EMERALD },
              { i: Flame,       title: "Hot Trend",     metric: "Aviator", sub: "+37% players 1h",  tag: "HOT",     c: EMERALD_HI, accent: GOLD_HI },
              { i: TrendingUp,  title: "Market Signal", metric: "BTC ↑",  sub: "Bullish · 4h",     tag: "BUY",     c: CYAN, accent: EMERALD },
              { i: Zap,         title: "Quick Insight", metric: "5D • No.8", sub: "Pattern Match 91%", tag: "NEW",     c: GOLD_HI, accent: CYAN },
            ].map((k) => (
              <button
                key={k.title}
                type="button"
                onClick={() => navigate("/ai-hub")}
                className="group relative overflow-hidden rounded-[14px] p-2.5 text-left transition-transform duration-300 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:transform-none"
                style={{
                  background: `radial-gradient(90% 100% at 100% 0%, ${k.c}22, transparent 65%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.55) 100%)`,
                  border: `1px solid ${k.c}55`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 18px ${k.c}1f, 0 0 14px ${k.c}2a`,
                  backdropFilter: "blur(10px) saturate(140%)",
                  WebkitBackdropFilter: "blur(10px) saturate(140%)",
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="h-7 w-7 rounded-lg grid place-items-center"
                    style={{ background: `linear-gradient(135deg, ${k.c}33, ${k.accent}22)`, border: `1px solid ${k.c}66`, boxShadow: `0 0 8px ${k.c}55` }}>
                    <k.i className="h-3.5 w-3.5" style={{ color: k.c }} />
                  </div>
                  <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: `${k.accent}22`, color: k.accent, border: `1px solid ${k.accent}55` }}>
                    {k.tag}
                  </span>
                </div>
                <div className="text-[9.5px] uppercase tracking-wider text-white/55 leading-none">{k.title}</div>
                <div className="font-display font-black text-[15px] leading-tight mt-0.5 tabular-nums" style={{ color: k.c, textShadow: `0 0 6px ${k.c}55` }}>{k.metric}</div>
                <div className="text-[10px] text-white/65 truncate mt-0.5">{k.sub}</div>
              </button>
            ))}
          </div>
            </div>
          </div>
        </Section>



        {/* ═══ S6 · SMART FINANCE HUB ═══ */}
        <Section id="home-finance-hub" title="Smart Finance Hub" sub="Trade & track your assets" cta={{ label: "Open Wallet", to: "/wallet" }}>
          <div className="grid grid-cols-4 gap-2">
            {[
              { s: "BTC", p: "68.4K", c: "+2.3%", col: "#F7931A" },
              { s: "ETH", p: "3.5K", c: "+1.4%", col: "#627EEA" },
              { s: "BNB", p: "612", c: "-0.6%", col: "#F3BA2F" },
              { s: "SOL", p: "178", c: "+4.1%", col: "#14F195" },
              { s: "TRX", p: "0.12", c: "+0.8%", col: "#EF4444" },
              { s: "DOGE", p: "0.15", c: "+3.2%", col: "#C2A633" },
              { s: "USDT", p: "1.00", c: "0.0%", col: "#26A17B" },
              { s: "XRP", p: "0.52", c: "-1.1%", col: "#0085C0" },
            ].map((c) => {
              const up = c.c.startsWith("+");
              return (
                <button key={c.s} onClick={() => navigate("/trading/markets")}
                  className={`${glass} p-1.5 flex flex-col items-center gap-0.5`}
                  style={{ borderColor: `${c.col}33` }}>
                  <div className="text-[9px] font-bold" style={{ color: c.col }}>{c.s}</div>
                  <div className="text-[10px] tabular-nums text-white/85">{c.p}</div>
                  <div className="text-[8px] tabular-nums" style={{ color: up ? EMERALD_HI : RED }}>{c.c}</div>
                </button>
              );
            })}
          </div>
          {/* Compact Finance tiles — info-rich · 20% shorter · neon-glow · Ultra Pro Max 2026 */}
          <div className="grid grid-cols-2 gap-3">
            {(() => {
              const cards = [
                {
                  key: "wallet",
                  i: WalletIcon, c: EMERALD_HI, to: "/wallet", title: "Wallet",
                  primary: { label: "Total",  value: `৳${fmtCompact(balance)}` },
                  secondary:{ label: "Growth", value: "+5.2%", up: true },
                  chart: "wallet-actions" as "wallet-actions" | "bars" | "line" | "accuracy",
                },
                {
                  key: "assets",
                  i: PiggyBank, c: GOLD_HI, to: "/wallet", title: "Assets",
                  primary: { label: "Value",     value: `৳${fmtCompact(balance * 1.24)}` },
                  secondary:{ label: "Portfolio", value: "+8.4%", up: true },
                  chart: "bars" as const,
                },
                {
                  key: "insights",
                  i: LineChart, c: CYAN, to: "/trading/markets", title: "Insights",
                  primary: { label: "Weekly Profit", value: "+৳3,240" },
                  secondary:{ label: "7D ROI",       value: "+12.6%", up: true },
                  chart: "line" as const,
                },
                {
                  key: "analysis",
                  i: BarChart3, c: PURPLE, to: "/trading/markets", title: "Analysis",
                  primary: { label: "AI Score", value: "82" },
                  secondary:{ label: "Risk",    value: "Low" },
                  chart: "accuracy" as const,
                },

              ];

              return cards.map((f) => (
                <button
                  key={f.key}
                  onClick={() => navigate(f.to)}
                  className="group relative overflow-hidden rounded-[16px] min-h-[99px] p-2.5 flex flex-col text-left backdrop-blur-xl active:scale-[0.98] transition"
                  style={{
                    background: `linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.012) 100%)`,
                    border: `1px solid ${f.c}66`,
                    boxShadow: `0 0 0 1px ${f.c}22, 0 0 22px -6px ${f.c}88, inset 0 1px 0 rgba(255,255,255,0.06)`,
                  }}
                >
                  <div aria-hidden className="pointer-events-none absolute inset-0"
                    style={{ background: `radial-gradient(120% 90% at 0% 0%, ${f.c}18, transparent 55%)` }} />

                  {/* Top row: icon + title */}
                  <div className="relative flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded-[8px] grid place-items-center shrink-0"
                      style={{ background: `${f.c}22`, border: `1px solid ${f.c}66`, boxShadow: `0 0 10px ${f.c}55` }}>
                      <f.i className="h-3 w-3" style={{ color: f.c }} />
                    </div>
                    <div className="font-display font-semibold text-[11px] leading-none text-white/90">{f.title}</div>
                  </div>

                  {/* Primary metric */}
                  <div className="relative mt-1.5 flex items-baseline justify-between gap-2">
                    <div className="text-[9px] uppercase tracking-wider text-white/45 leading-none">{f.primary.label}</div>
                    <div className="font-display font-black text-[15px] leading-none tabular-nums" style={{ color: f.c, textShadow: `0 0 10px ${f.c}55` }}>
                      {f.primary.value}
                    </div>
                  </div>

                  {/* Secondary + inline micro chart */}
                  <div className="relative mt-1 flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-1 min-w-0">
                      <span className="text-[9px] text-white/45 leading-none">{f.secondary.label}</span>
                      <span className="text-[10.5px] font-bold leading-none tabular-nums"
                        style={{ color: "up" in f.secondary && f.secondary.up ? EMERALD_HI : f.c }}>
                        {f.secondary.value}
                      </span>
                    </div>
                    {f.chart === "bars" && (
                      <div className="flex items-end gap-[2px] h-3.5">
                        {[38, 62, 48, 78, 58, 92].map((h, i) => (
                          <span key={i} className="w-[3px] rounded-sm" style={{ height: `${h}%`, background: f.c, boxShadow: `0 0 4px ${f.c}` }} />
                        ))}
                      </div>
                    )}
                    {f.chart === "line" && (
                      <svg viewBox="0 0 60 16" className="h-3.5 w-14" preserveAspectRatio="none" aria-hidden>
                        <polyline points="0,12 10,9 20,11 30,6 40,7 50,3 60,4" fill="none" stroke={f.c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                          style={{ filter: `drop-shadow(0 0 3px ${f.c})` }} />
                      </svg>
                    )}
                    {f.chart === "accuracy" && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none tabular-nums"
                        style={{ background: `${f.c}22`, color: f.c, border: `1px solid ${f.c}66`, boxShadow: `0 0 8px ${f.c}55` }}>
                        94% WIN
                      </span>
                    )}
                    {f.chart === "wallet-actions" && (
                      <div className="flex items-center gap-1">
                        <span
                          role="button" tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); navigate("/deposit"); }}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); navigate("/deposit"); } }}
                          aria-label="Deposit"
                          className="inline-flex items-center justify-center h-5 w-5 rounded-[6px] cursor-pointer"
                          style={{ background: `linear-gradient(135deg, ${f.c}, ${f.c}cc)`, color: "#04120a", boxShadow: `0 0 8px ${f.c}88, inset 0 1px 0 rgba(255,255,255,0.4)` }}>
                          <ArrowDownToLine className="h-3 w-3" />
                        </span>
                        <span
                          role="button" tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); navigate("/withdraw"); }}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); navigate("/withdraw"); } }}
                          aria-label="Withdraw"
                          className="inline-flex items-center justify-center h-5 w-5 rounded-[6px] cursor-pointer"
                          style={{ background: `${f.c}18`, color: f.c, border: `1px solid ${f.c}66`, boxShadow: `0 0 6px ${f.c}55` }}>
                          <ArrowUpFromLine className="h-3 w-3" />
                        </span>
                      </div>
                    )}


                  </div>
                </button>
              ));
            })()}
          </div>
        </Section>



        {/* ═══ S7 · VIP CLUB — PREMIUM ULTRA PRO MAX 2026 ═══ */}
        <Section id="home-vip-club" title="VIP Club" sub="Luxury membership · exclusive perks" cta={{ label: "Enter VIP Club", to: "/vip" }}>
          {/* Hero Card — Gold + Diamond */}
          <button onClick={() => navigate("/vip")}
            className="w-full relative overflow-hidden rounded-[20px] p-4 text-left"
            style={{
              background: `linear-gradient(135deg, #150b02 0%, #241704 40%, #0a0703 100%)`,
              border: `1.5px solid ${GOLD}88`,
              boxShadow: `0 20px 46px -22px ${GOLD_DEEP}, 0 0 34px -10px ${GOLD}77, inset 0 1px 0 rgba(255,255,255,0.09), inset 0 0 40px -18px ${GOLD}55`,
            }}>
            {/* Aurora glow only — diamond particles removed for perf */}
            <div aria-hidden className="pointer-events-none absolute inset-0"
              style={{ background: `radial-gradient(60% 90% at 100% 0%, ${GOLD}2c, transparent 65%), radial-gradient(50% 90% at 0% 100%, ${PURPLE}22, transparent 70%), radial-gradient(60% 60% at 50% 50%, ${EMERALD}12, transparent 75%)` }} />
            {/* Decorative premium gem accent */}
            <Diamond aria-hidden className="pointer-events-none absolute top-2 right-2 h-4 w-4 opacity-80" style={{ color: GOLD_HI, filter: `drop-shadow(0 0 6px ${GOLD}bb)` }} />
            <Sparkles aria-hidden className="pointer-events-none absolute top-3 right-7 h-3 w-3 opacity-70" style={{ color: "#F59E0B" }} />




            <div className="relative z-10 flex items-center gap-3">
              <div className="crown-shine relative h-14 w-14 rounded-2xl grid place-items-center shrink-0 overflow-hidden"
                style={{ background: `linear-gradient(140deg, ${GOLD_HI} 0%, #F59E0B 50%, ${GOLD_DEEP} 100%)`, boxShadow: `0 0 22px ${GOLD}cc, inset 0 1px 0 rgba(255,255,255,0.55)` }}>
                {/* Premium VIP ring — subtle rotating conic glow */}
                <span aria-hidden className="pointer-events-none absolute -inset-[2px] rounded-2xl opacity-70"
                  style={{ background: `conic-gradient(from 0deg, ${GOLD_HI}, transparent 40%, ${GOLD_HI}88 70%, transparent)`, animation: "vip-ring-spin 6s linear infinite", filter: "blur(1px)" }} />
                <span aria-hidden className="absolute inset-[2px] rounded-[14px]"
                  style={{ background: `linear-gradient(140deg, ${GOLD_HI} 0%, #F59E0B 50%, ${GOLD_DEEP} 100%)` }} />
                <Crown className="h-7 w-7 text-black relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]" strokeWidth={2.4} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-black text-[15px] leading-none" style={{ color: GOLD_HI, textShadow: `0 0 12px ${GOLD}55` }}>
                    VIP {vipLevel} Diamond
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-[0.14em] leading-none inline-flex items-center gap-1"
                    style={{ background: `${GOLD}22`, color: GOLD_HI, border: `1px solid ${GOLD}66` }}>
                    <BadgeCheck className="h-2.5 w-2.5" /> Elite Member
                  </span>

                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-white/60">Next VIP {vipLevel + 1}</span>
                  <span className="text-[10px] font-bold tabular-nums" style={{ color: "#F59E0B" }}>72% Complete</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full relative overflow-hidden" style={{ width: "72%", background: `linear-gradient(90deg, ${GOLD_HI}, #F59E0B 55%, ${GOLD_DEEP})`, boxShadow: `0 0 10px ${GOLD}bb` }}>
                    <div aria-hidden className="absolute inset-y-0 -inset-x-4 opacity-70"
                      style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)`, animation: "aiSignalsMarquee 2.4s linear infinite" }} />
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/60 shrink-0" />
            </div>

            {/* Benefits preview chips */}
            <div className="relative z-10 mt-2.5 flex items-center gap-1.5 flex-wrap">
              {[
                { i: Percent,  l: "5% Cashback", c: EMERALD_HI },
                { i: Gift,     l: "৳2,500/mo",   c: "#F59E0B"  },
                { i: Headset,  l: "Priority",    c: PURPLE     },
                { i: Sparkles, l: "Draws",       c: GOLD_HI    },
              ].map((p) => (
                <span key={p.l}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 border backdrop-blur-md"
                  style={{ borderColor: `${p.c}55`, background: `linear-gradient(135deg, ${p.c}1c, ${p.c}08)` }}>
                  <p.i className="h-2.5 w-2.5" style={{ color: p.c }} />
                  <span className="text-[9.5px] font-semibold" style={{ color: p.c }}>{p.l}</span>
                </span>
              ))}
            </div>
          </button>

          {/* Rewards Preview — 4 mini cards */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { i: Gift,          t: "Daily",       s: "Reward",      c: EMERALD_HI, to: "/activity" },
              { i: Diamond,       t: "Cashback",    s: "Weekly",      c: BLUE,       to: "/vip" },
              { i: Trophy,        t: "Achieve",     s: "12/40",       c: GOLD_HI,    to: "/activity" },
              { i: Ticket,        t: "Gift Code",   s: "Redeem",      c: PURPLE,     to: "/activity" },
            ].map((r) => (
              <button key={r.t} onClick={() => navigate(r.to)}
                className="group relative overflow-hidden rounded-[13px] p-2 flex flex-col items-center gap-1 text-center backdrop-blur-xl active:scale-[0.97] transition"
                style={{
                  background: `linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))`,
                  border: `1px solid ${r.c}55`,
                  boxShadow: `0 0 18px -6px ${r.c}88, inset 0 1px 0 rgba(255,255,255,0.06)`,
                }}>
                <div className="h-7 w-7 rounded-[9px] grid place-items-center"
                  style={{ background: `${r.c}22`, border: `1px solid ${r.c}66`, boxShadow: `0 0 10px ${r.c}55` }}>
                  <r.i className="h-3.5 w-3.5" style={{ color: r.c }} />
                </div>
                <div className="font-display font-bold text-[10px] leading-none" style={{ color: r.c }}>{r.t}</div>
                <div className="text-[8.5px] leading-none text-white/55">{r.s}</div>
              </button>
            ))}
          </div>

          {/* Live Reward Ticker */}
          <div className="relative overflow-hidden rounded-[12px] h-[38px] flex items-center backdrop-blur-xl"
            style={{
              background: `linear-gradient(90deg, rgba(10,7,3,0.85), rgba(20,14,4,0.75))`,
              border: `1px solid ${GOLD}55`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px -10px ${GOLD}77`,
            }}>
            <div className="shrink-0 flex items-center gap-1.5 pl-2.5 pr-2 h-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full animate-ping" style={{ background: EMERALD_HI, opacity: 0.7 }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: EMERALD_HI, boxShadow: `0 0 8px ${EMERALD_HI}` }} />
              </span>
              <span className="text-[9px] font-black tracking-[0.16em]" style={{ color: EMERALD_HI, textShadow: `0 0 8px ${EMERALD_HI}88` }}>LIVE</span>
            </div>
            <div className="flex-1 overflow-hidden relative"
              style={{ maskImage: "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)" }}>
              <div className="vip-ticker-track flex whitespace-nowrap will-change-transform">
                {(() => {
                  const items = [
                    { u: "Rahim",  a: "claimed ৳500 Cashback",   c: EMERALD_HI },
                    { u: "Karim",  a: "redeemed Gift Code",      c: PURPLE },
                    { u: "Nayeem", a: "reached VIP 5",           c: GOLD_HI },
                    { u: "Sadia",  a: "earned ৳1,200 Rebate",    c: "#F59E0B" },
                    { u: "Tania",  a: "unlocked Diamond Perk",   c: BLUE },
                    { u: "Imran",  a: "won Lucky Draw ৳25K",     c: GOLD_HI },
                  ];
                  return [...items, ...items].map((it, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 text-[10.5px]">
                      <Sparkles className="h-2.5 w-2.5" style={{ color: it.c }} />
                      <span className="font-bold" style={{ color: it.c }}>{it.u}</span>
                      <span className="text-white/70">{it.a}</span>
                      <span className="text-white/25">•</span>
                    </span>
                  ));
                })()}
              </div>
            </div>
          </div>
        </Section>



        {/* ═══ S8 · REWARDS CENTRE — Final Premium (LOCKED v2.0) ═══ */}
        <Section id="home-rewards" title="Rewards Centre" sub="Tasks · missions · challenges" cta={{ label: "View All", to: "/activity" }}>
          {/* TOP — Live Rewards Ticker */}
          <LiveRewardsTicker
            compact
            accent={EMERALD_HI}
            items={[
              { u: "Rahim",   a: "claimed ৳500 Daily Task",     c: EMERALD_HI },
              { u: "Karim",   a: "won Lucky Wheel ৳1,000",      c: PURPLE },
              { u: "Arif",    a: "completed Weekly Challenge",  c: GOLD_HI },
              { u: "Nayeem",  a: "earned ৳300 Referral",        c: CYAN },
              { u: "Tania",   a: "unlocked Event Reward",       c: BLUE },
              { u: "Farhan",  a: "completed Mission ৳500",      c: ORANGE },
            ]}
          />

          {/* MIDDLE — 2×3 Premium Reward Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { i: CheckCircle2, t: "Daily Tasks",       s: "3 of 5 complete",   p: 60,  r: "৳120",   c: EMERALD_HI },
              { i: Target,       t: "Missions",          s: "2 of 4 active",     p: 50,  r: "৳500",   c: PURPLE     },
              { i: Sparkles,     t: "Lucky Wheel",       s: "1 free spin",       p: 100, r: "৳1,000", c: ORANGE     },
              { i: Calendar,     t: "Weekly Challenge",  s: "Day 4 of 7",        p: 57,  r: "৳2,500", c: BLUE       },
              { i: UserPlus,     t: "Referral Rewards",  s: "2 friends joined",  p: 40,  r: "৳300",   c: CYAN       },
              { i: Gift,         t: "Event Rewards",     s: "Season pass · L3",  p: 30,  r: "৳5,000", c: GOLD_HI    },
            ].map((r) => {
              const ready = r.p >= 100;
              return (
                <button key={r.t} onClick={() => navigate("/activity")}
                  className="relative overflow-hidden rounded-[14px] p-2.5 flex flex-col gap-1.5 backdrop-blur-xl active:scale-[0.98] transition text-left"
                  style={{
                    background: `linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))`,
                    border: `1px solid ${r.c}55`,
                    boxShadow: `0 0 20px -8px ${r.c}88, inset 0 1px 0 rgba(255,255,255,0.06)`,
                  }}>
                  <div className="flex items-center gap-1.5">
                    <div className="h-7 w-7 rounded-[9px] grid place-items-center shrink-0"
                      style={{ background: `${r.c}22`, border: `1px solid ${r.c}66`, boxShadow: `0 0 10px ${r.c}55` }}>
                      <r.i className="h-3.5 w-3.5" style={{ color: r.c }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-bold text-[11px] leading-tight truncate" style={{ color: r.c }}>{r.t}</div>
                      <div className="text-[9px] leading-tight text-white/55 truncate">{r.s}</div>
                    </div>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full" style={{ width: `${r.p}%`, background: `linear-gradient(90deg, ${r.c}, ${r.c}cc)`, boxShadow: `0 0 6px ${r.c}` }} />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-display font-black text-[11px] tabular-nums" style={{ color: r.c }}>{r.r}</span>
                    <span className="px-1.5 h-[18px] rounded-[6px] flex items-center text-[9px] font-black tracking-wide"
                      style={{
                        background: ready ? `linear-gradient(135deg, ${r.c}, ${r.c}aa)` : "rgba(255,255,255,0.06)",
                        color: ready ? "#000" : "rgba(255,255,255,0.55)",
                        border: `1px solid ${ready ? r.c : "rgba(255,255,255,0.12)"}`,
                        boxShadow: ready ? `0 0 10px ${r.c}88` : "none",
                      }}>
                      {ready ? "CLAIM" : `${r.p}%`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* BOTTOM — Large Gradient CTA */}
          <button onClick={() => navigate("/activity")}
            className="relative overflow-hidden rounded-[14px] h-[48px] w-full flex items-center justify-center gap-2 active:scale-[0.99] transition"
            style={{
              background: `linear-gradient(90deg, ${GOLD_DEEP}, ${PURPLE}, ${EMERALD_HI})`,
              border: `1px solid ${GOLD_HI}66`,
              boxShadow: `0 0 22px -6px ${GOLD_HI}aa, inset 0 1px 0 rgba(255,255,255,0.18)`,
            }}>
            <span className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 20% 50%, ${GOLD_HI}55, transparent 60%), radial-gradient(circle at 80% 50%, ${EMERALD_HI}55, transparent 60%)` }} />
            <Sparkles className="h-4 w-4 relative" style={{ color: "#fff" }} />
            <span className="relative font-display font-black text-[13px] tracking-wide text-white">OPEN REWARDS CENTRE</span>
            <ChevronRight className="h-4 w-4 relative text-white" />
          </button>
        </Section>

        {/* ═══ S9 · PROMOTIONS HUB — Final Premium (LOCKED v1.0) ═══ */}
        <Section id="home-promotions" title="Promotions Hub" sub="Bonuses · draws · events · campaigns" cta={{ label: "View All", to: "/promotions" }}>
          {/* Live Promotions Ticker */}
          <LiveRewardsTicker
            compact
            accent={GOLD_HI}
            ariaLabel="Live promotions ticker"
            items={[
              { u: "Rahim",   a: "claimed ৳5,000 bonus",       c: GOLD_HI },
              { u: "Karim",   a: "entered Lucky Draw",         c: PURPLE },
              { u: "Arif",    a: "earned Referral Reward",     c: CYAN },
              { u: "Nayeem",  a: "unlocked VIP Reward",        c: EMERALD_HI },
              { u: "Tania",   a: "grabbed Limited Offer",      c: ORANGE },
            ]}
          />

          {/* Top Row — 2 Large Hero Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                t: "Welcome Bonus", s: "Up to ৳50,000", tag: "NEW USER", i: Gift,
                accent: GOLD_HI,
                bg: `linear-gradient(140deg, #2a1c05 0%, #120a01 60%, #050505 100%)`,
                glow: `0 0 30px -8px ${GOLD_HI}aa, inset 0 0 30px -20px ${GOLD_HI}88`,
                ends: Date.now() + 3 * 86_400_000 + 4 * 3_600_000,
              },
              {
                t: "Lucky Draw", s: "Weekly Mega Draw", tag: "৳2.5L POOL", i: Star,
                accent: PURPLE,
                bg: `linear-gradient(140deg, #1a0d2e 0%, #0c0616 60%, #050505 100%)`,
                glow: `0 0 30px -8px ${PURPLE}aa, inset 0 0 30px -20px ${PURPLE}88`,
                ends: Date.now() + 5 * 86_400_000 + 12 * 3_600_000,
              },
            ].map((p) => (
              <button key={p.t} onClick={() => navigate("/promotions")}
                className="relative overflow-hidden rounded-[16px] p-3 flex flex-col gap-2 text-left backdrop-blur-xl active:scale-[0.98] transition"
                style={{ background: p.bg, border: `1px solid ${p.accent}66`, boxShadow: p.glow }}>
                {/* Limited badge */}
                <span className="absolute top-2 right-2 px-1.5 h-[16px] rounded-[5px] flex items-center gap-1 text-[8.5px] font-black tracking-wider"
                  style={{ background: `${p.accent}22`, color: p.accent, border: `1px solid ${p.accent}66`, boxShadow: `0 0 8px ${p.accent}55` }}>
                  <Flame className="h-2.5 w-2.5" /> LIMITED
                </span>
                {/* Glow orb */}
                <span className="absolute -top-6 -right-6 h-16 w-16 rounded-full opacity-40 blur-2xl" style={{ background: p.accent }} />

                <div className="h-9 w-9 rounded-[11px] grid place-items-center"
                  style={{ background: `${p.accent}22`, border: `1px solid ${p.accent}66`, boxShadow: `0 0 12px ${p.accent}66` }}>
                  <p.i className="h-4.5 w-4.5" style={{ color: p.accent }} />
                </div>
                <div>
                  <div className="font-display font-black text-[12.5px] leading-tight" style={{ color: p.accent }}>{p.t}</div>
                  <div className="font-display font-bold text-[11px] text-white/85 leading-tight">{p.s}</div>
                </div>
                <div className="mt-auto pt-1">
                  <div className="text-[8.5px] uppercase tracking-widest text-white/45 mb-1">Ends in</div>
                  <PromoCountdown targetMs={p.ends} color={p.accent} />
                </div>
              </button>
            ))}
          </div>

          {/* Second Row — 4 Compact Promotion Cards (2×2) */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { i: Calendar, t: "Event Center",    s: "Seasonal Events",     c: EMERALD_HI, tag: "LIVE" },
              { i: Rocket,   t: "Campaign Center", s: "Refer & Earn",        c: CYAN,       tag: "NEW"  },
              { i: Gift,     t: "Special Offers",  s: "Limited Promotions",  c: ORANGE,     tag: "HOT"  },
              { i: Crown,    t: "VIP Events",      s: "Exclusive Rewards",   c: GOLD_HI,    tag: "VIP"  },
            ].map((p) => (
              <button key={p.t} onClick={() => navigate("/promotions")}
                className="relative overflow-hidden rounded-[12px] p-2 flex items-center gap-1.5 text-left backdrop-blur-xl active:scale-[0.98] transition"
                style={{
                  background: `linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))`,
                  border: `1px solid ${p.c}55`,
                  boxShadow: `0 0 16px -8px ${p.c}88, inset 0 1px 0 rgba(255,255,255,0.06)`,
                }}>
                <div className="h-7 w-7 rounded-[9px] grid place-items-center shrink-0"
                  style={{ background: `${p.c}22`, border: `1px solid ${p.c}66`, boxShadow: `0 0 8px ${p.c}55` }}>
                  <p.i className="h-3.5 w-3.5" style={{ color: p.c }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-bold text-[10.5px] leading-tight truncate" style={{ color: p.c }}>{p.t}</div>
                  <div className="text-[8.5px] leading-tight text-white/55 truncate">{p.s}</div>
                </div>
                <span className="px-1 h-[14px] rounded-[4px] flex items-center text-[8px] font-black tracking-wider"
                  style={{ background: `${p.c}22`, color: p.c, border: `1px solid ${p.c}66` }}>
                  {p.tag}
                </span>
              </button>
            ))}
          </div>

          {/* Limited Offer Bar */}
          <div className="relative overflow-hidden rounded-[12px] p-2 flex items-center gap-2 backdrop-blur-xl"
            style={{
              background: `linear-gradient(90deg, rgba(42,20,4,0.9), rgba(28,10,4,0.85))`,
              border: `1px solid ${ORANGE}66`,
              boxShadow: `0 0 20px -8px ${ORANGE}99, inset 0 1px 0 rgba(255,255,255,0.06)`,
            }}>
            <span className="absolute -top-4 -left-4 h-12 w-12 rounded-full opacity-30 blur-2xl" style={{ background: ORANGE }} />
            <div className="relative shrink-0 h-7 w-7 rounded-[9px] grid place-items-center"
              style={{ background: `${ORANGE}22`, border: `1px solid ${ORANGE}66`, boxShadow: `0 0 10px ${ORANGE}66` }}>
              <Zap className="h-3.5 w-3.5" style={{ color: ORANGE }} />
            </div>
            <div className="relative min-w-0 flex-1">
              <div className="text-[8.5px] uppercase tracking-widest font-black" style={{ color: ORANGE }}>Limited Time Offer</div>
              <div className="mt-0.5"><PromoCountdown targetMs={Date.now() + 23 * 3_600_000 + 15 * 60_000 + 8_000} color={ORANGE} /></div>
            </div>
            <button onClick={() => navigate("/promotions")}
              className="relative shrink-0 h-7 px-2.5 rounded-[8px] font-display font-black text-[10px] tracking-wide active:scale-95 transition"
              style={{
                background: `linear-gradient(135deg, ${ORANGE}, #F59E0B)`,
                color: "#000",
                border: `1px solid ${ORANGE}`,
                boxShadow: `0 0 12px ${ORANGE}88`,
              }}>
              CLAIM NOW
            </button>
          </div>

          {/* Bottom CTA */}
          <button onClick={() => navigate("/promotions")}
            className="relative overflow-hidden rounded-[14px] h-[46px] w-full flex items-center justify-center gap-2 active:scale-[0.99] transition"
            style={{
              background: `linear-gradient(90deg, ${GOLD_DEEP}, ${PURPLE}, ${EMERALD_HI})`,
              border: `1px solid ${GOLD_HI}66`,
              boxShadow: `0 0 22px -6px ${GOLD_HI}aa, inset 0 1px 0 rgba(255,255,255,0.18)`,
            }}>
            <span className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 20% 50%, ${GOLD_HI}55, transparent 60%), radial-gradient(circle at 80% 50%, ${EMERALD_HI}55, transparent 60%)` }} />
            <Sparkles className="h-4 w-4 relative text-white" />
            <span className="relative font-display font-black text-[13px] tracking-wide text-white">EXPLORE ALL PROMOTIONS</span>
            <ChevronRight className="h-4 w-4 relative text-white" />
          </button>
        </Section>

        {/* ═══ S10 · TRUST ECOSYSTEM — FINAL CLOSING (LOCKED v2.0) ═══ */}
        <Section id="home-trust-center" title="Trust Ecosystem" sub="The billion-dollar closing · Secured by GoLucky infrastructure">
          {/* ── HERO ── */}
          <div
            className={`${glass} relative overflow-hidden p-4`}
            style={{ borderColor: `${GOLD}55`, boxShadow: `0 20px 60px -20px ${GOLD}44, 0 0 80px -40px ${EMERALD}55` }}
          >
            {/* static glow (pulse removed for perf) */}
            <div className="pointer-events-none absolute inset-0 opacity-70">
              <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full blur-3xl" style={{ background: `${GOLD}44` }} />
              <div className="absolute -bottom-12 -right-8 h-36 w-36 rounded-full blur-3xl" style={{ background: `${EMERALD}44` }} />
              <div className="absolute top-1/2 left-1/3 h-24 w-24 rounded-full blur-3xl" style={{ background: `${BLUE}44` }} />
            </div>

            <div className="relative flex items-center gap-3 mb-3">
              <div className="relative h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${GOLD}33, ${EMERALD}33)`, border: `1px solid ${GOLD}66`, boxShadow: `0 0 24px ${GOLD}55` }}>
                <ShieldCheck className="h-6 w-6 animate-pulse" style={{ color: GOLD_HI, filter: `drop-shadow(0 0 10px ${GOLD})` }} />
                <span className="absolute inset-0 rounded-xl animate-ping opacity-30" style={{ border: `1px solid ${GOLD}` }} />
              </div>
              <div className="min-w-0">
                <div className="font-display font-black text-[15px] leading-tight bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(90deg, ${GOLD_HI}, #fff, ${EMERALD_HI})` }}>
                  GO LUCKY SECURE ECOSYSTEM
                </div>
                <div className="text-[9px] uppercase tracking-widest text-white/55 mt-0.5">
                  Trusted · Protected · Verified · 24/7
                </div>
              </div>
            </div>

            <div className="relative grid grid-cols-2 gap-1.5">
              {[
                { i: ShieldCheck, t: "256-bit SSL",         c: GOLD_HI },
                { i: Activity,    t: "99.9% Uptime",        c: EMERALD_HI },
                { i: Users,       t: "100K+ Members",       c: BLUE },
                { i: Globe,       t: "Global Infra",        c: CYAN },
              ].map((m) => (
                <div key={m.t} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${m.c}33` }}>
                  <m.i className="h-3.5 w-3.5 shrink-0" style={{ color: m.c, filter: `drop-shadow(0 0 6px ${m.c})` }} />
                  <span className="text-[10px] font-bold truncate" style={{ color: m.c }}>{m.t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── STATS ── */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { l: "Security", v: "98.9%",       c: GOLD_HI },
              { l: "Trust",    v: "9.8/10",      c: BLUE },
              { l: "Support",  v: "ONLINE",      c: EMERALD_HI },
              { l: "System",   v: "OPERATIONAL", c: EMERALD_HI },
            ].map((s) => (
              <div key={s.l} className={`${glass} p-2 text-center`} style={{ borderColor: `${s.c}44` }}>
                <div className="text-[8px] uppercase tracking-widest text-white/50 mb-0.5 truncate">{s.l}</div>
                <div className="font-display font-black text-[11px] truncate" style={{ color: s.c, textShadow: `0 0 12px ${s.c}66` }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* ── OFFICIAL VERIFIED DOMAINS TICKER ── */}
          <VerifiedDomainsTicker compact />


          {/* ── 24/7 SUPPORT HUB ── */}
          <div className={`${glass} p-2.5`} style={{ borderColor: `${BLUE}44` }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Headset className="h-3.5 w-3.5" style={{ color: BLUE }} />
              <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: BLUE }}>24/7 Support Hub</div>
              <div className="flex-1" />
              <span className="text-[9px] font-bold flex items-center gap-1" style={{ color: EMERALD_HI }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-70" style={{ background: EMERALD }} />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: EMERALD_HI }} />
                </span>
                58 Agents Online
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { i: MessageCircle, l: "Live Chat", c: PURPLE,     onClick: () => navigate("/support/chat") },
                { i: Send,          l: "Telegram",  c: BLUE,       onClick: () => window.open("https://t.me/goluckyofficial", "_blank", "noopener,noreferrer") },
                { i: Phone,         l: "WhatsApp",  c: EMERALD_HI, onClick: () => window.open("https://wa.me/8801700000000?text=" + encodeURIComponent("Hi GoLucky Support"), "_blank", "noopener,noreferrer") },
                { i: Ticket,        l: "Ticket",    c: GOLD_HI,    onClick: () => navigate("/support") },
              ].map((b) => (
                <button
                  key={b.l}
                  onClick={b.onClick}
                  aria-label={`Contact support via ${b.l}`}
                  className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg font-bold text-[9px] transition active:scale-95"
                  style={{ background: `${b.c}18`, color: b.c, border: `1px solid ${b.c}55` }}
                >
                  <b.i className="h-3.5 w-3.5" /> {b.l}
                </button>
              ))}
            </div>

          </div>

          {/* ── BOTTOM HERO CTA ── */}
          <div className="space-y-1.5">
            <div className="text-center text-[9px] uppercase tracking-[0.4em] font-black" style={{ color: GOLD_HI }}>
              PLAY • INVEST • EARN
            </div>
            <div
              className="relative w-full rounded-2xl overflow-hidden p-[1.5px]"
              style={{
                background: `linear-gradient(135deg, ${GOLD} 0%, #f5c15b 40%, ${EMERALD} 100%)`,
                boxShadow: `0 12px 40px ${GOLD}66, 0 0 60px ${EMERALD}33`,
              }}
            >
              <div className="grid grid-cols-3 rounded-[14px] overflow-hidden" style={{ background: "#0a0a12" }}>
                {[
                  { l: "PLAY",   to: "/home",           c: GOLD },
                  { l: "INVEST", to: "/fixed-deposits", c: EMERALD },
                  { l: "EARN",   to: "/agent",          c: BLUE },
                ].map((seg, i) => (
                  <button
                    key={seg.l}
                    onClick={() => navigate(seg.to)}
                    className={`relative py-3 font-display font-black text-[12px] tracking-[0.24em] text-white transition active:scale-[0.97] ${i > 0 ? "border-l border-white/10" : ""}`}
                  >
                    <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 50% 50%, ${seg.c}66, transparent 70%)` }} />
                    <span className="relative">{seg.l}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => navigate("/home")}
              className="relative w-full py-3.5 rounded-2xl overflow-hidden font-display font-black text-[13px] tracking-[0.3em] text-black transition active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${GOLD_HI} 0%, #ffd97a 50%, ${GOLD} 100%)`,
                boxShadow: `0 16px 50px ${GOLD}77, inset 0 1px 0 rgba(255,255,255,0.5)`,
              }}
            >
              <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 30% 50%, #fff8, transparent 60%)` }} />
              <span className="relative inline-flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" /> ENTER GOLUCKY ECOSYSTEM <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </div>
        </Section>




        {/* ═══ S11 · COMING SOON — API GAME EXPANSION (LOCKED v1.0) ═══ */}
        <Section id="home-future-expansion" title="Coming Soon" sub="Future API Game Expansion Zone">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { i: Cpu,       t: "API Games",    s: "20,000+ games ready",       c: GOLD_HI },
              { i: Trophy,    t: "Live Sports",  s: "Cricket · Football",        c: BLUE },
              { i: Award,     t: "Tournament",   s: "Prize pools ৳1Cr+",         c: PURPLE },
              { i: Layers,    t: "Provider Hub", s: "Multi-game integration",    c: EMERALD_HI },
            ].map((c) => (
              <div
                key={c.t}
                className={`${glass} relative overflow-hidden p-3`}
                style={{ borderColor: `${c.c}55`, boxShadow: `0 8px 24px -12px ${c.c}66` }}
              >
                <div className="pointer-events-none absolute -top-6 -right-6 h-16 w-16 rounded-full blur-2xl opacity-60" style={{ background: `${c.c}55` }} />
                <div className="relative flex items-start gap-2">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${c.c}22`, border: `1px solid ${c.c}66`, boxShadow: `0 0 14px ${c.c}44` }}>
                    <c.i className="h-4 w-4" style={{ color: c.c, filter: `drop-shadow(0 0 6px ${c.c})` }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="font-display font-black text-[12px] leading-tight truncate">{c.t}</div>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md" style={{ background: `${c.c}22`, color: c.c, border: `1px solid ${c.c}66` }}>SOON</span>
                    </div>
                    <div className="text-[9.5px] text-white/60 mt-0.5 truncate">{c.s}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/support")}
            className="relative w-full py-2.5 rounded-xl overflow-hidden font-display font-black text-[11px] tracking-[0.28em] text-white flex items-center justify-center gap-2 transition active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${GOLD}22, ${PURPLE}22, ${BLUE}22)`,
              border: `1px solid ${GOLD}55`,
              boxShadow: `0 10px 30px -14px ${PURPLE}88`,
            }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: GOLD_HI }} />
            REQUEST GAME ACCESS
            <ArrowRight className="h-3.5 w-3.5" style={{ color: GOLD_HI }} />
          </button>
        </Section>

        {/* ═══ S12 · ABOUT GOLUCKY (LOCKED v2.0 — Next Gen Ecosystem) ═══ */}
        <Section id="home-about" title="About GoLucky" sub="The Next Generation Play • Invest • Earn Ecosystem">
          <div
            className={`${glass} relative overflow-hidden`}
            style={{
              padding: "clamp(8px, 2.4vw, 14px)",
              display: "flex",
              flexDirection: "column",
              gap: "clamp(6px, 1.8vw, 12px)",
              borderColor: `${GOLD}44`,
              boxShadow: `0 10px 26px -14px ${GOLD}44`,
            }}
          >
            <div className="pointer-events-none absolute -top-8 -right-8 h-20 w-20 rounded-full blur-2xl opacity-50" style={{ background: `${GOLD}66` }} />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-20 w-20 rounded-full blur-2xl opacity-40" style={{ background: `${EMERALD}66` }} />

            {/* Stats 4-col */}
            <div className="relative grid grid-cols-4" style={{ gap: "clamp(3px, 1vw, 6px)" }}>
              {[
                { v: "20K+",  l: "Games",     c: GOLD_HI },
                { v: "50+",   l: "Providers", c: EMERALD_HI },
                { v: "24/7",  l: "Support",   c: BLUE },
                { v: "99.9%", l: "Uptime",    c: PURPLE },
              ].map((s) => (
                <div
                  key={s.l}
                  className="relative overflow-hidden rounded-md flex flex-col items-center justify-center"
                  style={{
                    padding: "clamp(4px, 1.4vw, 8px) clamp(2px, 0.8vw, 6px)",
                    background: `${s.c}12`,
                    border: `1px solid ${s.c}44`,
                  }}
                >
                  <div
                    className="font-display font-black leading-none"
                    style={{ fontSize: "clamp(10px, 3.2vw, 14px)", color: s.c, filter: `drop-shadow(0 0 5px ${s.c}88)` }}
                  >
                    {s.v}
                  </div>
                  <div
                    className="font-bold uppercase tracking-wider text-white/60"
                    style={{ fontSize: "clamp(7px, 2vw, 9px)", marginTop: "clamp(1px, 0.4vw, 3px)" }}
                  >
                    {s.l}
                  </div>
                </div>
              ))}
            </div>

            {/* Compact verified domains marquee */}
            <div
              className="relative overflow-hidden rounded-lg"
              style={{
                background: "linear-gradient(180deg, rgba(20,14,4,0.7), rgba(10,10,18,0.7))",
                border: `1px solid ${GOLD}55`,
                padding: "clamp(4px, 1.2vw, 7px) clamp(6px, 1.6vw, 10px)",
              }}
              aria-label="Official verified domains"
            >
              <div className="flex items-center" style={{ gap: "clamp(4px, 1.2vw, 8px)" }}>
                <ShieldCheck className="shrink-0" style={{ width: "clamp(10px, 2.8vw, 13px)", height: "clamp(10px, 2.8vw, 13px)", color: GOLD_HI, filter: `drop-shadow(0 0 4px ${GOLD})` }} />
                <div className="relative flex-1 overflow-hidden">
                  <div
                    className="pointer-events-none absolute inset-y-0 left-0 z-10"
                    style={{ width: "12px", background: "linear-gradient(90deg, rgba(10,10,18,0.9), transparent)" }}
                  />
                  <div
                    className="pointer-events-none absolute inset-y-0 right-0 z-10"
                    style={{ width: "12px", background: "linear-gradient(-90deg, rgba(10,10,18,0.9), transparent)" }}
                  />
                  <div
                    className="flex whitespace-nowrap animate-marquee will-change-transform motion-reduce:animate-none"
                    style={{ animationDuration: "38s", gap: "clamp(10px, 3vw, 18px)" }}
                    aria-hidden="true"
                  >
                    {[
                      "goinglucky.com","golucky01.com","goluckyapp.net","go-lucky-bd.com","goluckybd.com","goluckyofficial.com",
                      "goluckyonline.com","goluckyprime.com","golucky.vip","golucky.win","goluckyzone.com",
                      "goinglucky.com","golucky01.com","goluckyapp.net","go-lucky-bd.com","goluckybd.com","goluckyofficial.com",
                      "goluckyonline.com","goluckyprime.com","golucky.vip","golucky.win","goluckyzone.com",
                    ].map((d, i) => (
                      <span
                        key={`${d}-${i}`}
                        className="font-mono font-bold shrink-0"
                        style={{ fontSize: "clamp(9px, 2.5vw, 11px)", color: GOLD_HI, textShadow: `0 0 8px ${GOLD}44` }}
                      >
                        {d}<span style={{ color: `${GOLD}66`, margin: "0 6px" }}>•</span>
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  className="shrink-0 font-black rounded-md flex items-center gap-0.5 animate-pulse"
                  style={{
                    fontSize: "clamp(7px, 2vw, 9px)",
                    padding: "clamp(1px, 0.4vw, 3px) clamp(3px, 1vw, 6px)",
                    background: `${EMERALD}22`,
                    color: EMERALD_HI,
                    border: `1px solid ${EMERALD}66`,
                  }}
                >
                  <BadgeCheck style={{ width: "clamp(8px, 2.4vw, 11px)", height: "clamp(8px, 2.4vw, 11px)" }} />
                  VERIFIED
                </span>
              </div>
            </div>

            {/* Features 2-col */}
            <div
              className="relative grid grid-cols-2"
              style={{ columnGap: "clamp(4px, 1.6vw, 10px)", rowGap: "clamp(1px, 0.4vw, 3px)" }}
            >
              {[
                { i: Users,     t: "100K+ Members",   c: GOLD_HI },
                { i: Headset,   t: "24/7 Support",    c: EMERALD_HI },
                { i: Lock,      t: "Secure Wallet",   c: BLUE },
                { i: Gamepad2,  t: "Premium Games",   c: GOLD_HI },
                { i: Handshake, t: "Agent Programme", c: EMERALD_HI },
                { i: Crown,     t: "VIP Rewards",     c: PURPLE },
              ].map((f) => (
                <div key={f.t} className="flex items-center" style={{ gap: "clamp(2px, 0.8vw, 5px)" }}>
                  <f.i
                    className="shrink-0"
                    style={{ width: "clamp(9px, 2.6vw, 12px)", height: "clamp(9px, 2.6vw, 12px)", color: f.c, filter: `drop-shadow(0 0 3px ${f.c})` }}
                  />
                  <span className="text-white/80 truncate" style={{ fontSize: "clamp(8.5px, 2.4vw, 10.5px)" }}>{f.t}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate("/home")}
              className="group relative w-full rounded-lg overflow-hidden font-display font-black text-black flex items-center justify-center transition-all duration-300 active:scale-[0.97]"
              style={{
                padding: "clamp(8px, 2.4vw, 12px) clamp(8px, 2vw, 14px)",
                fontSize: "clamp(10px, 2.8vw, 12px)",
                letterSpacing: "clamp(0.16em, 0.6vw, 0.28em)",
                gap: "clamp(4px, 1.2vw, 8px)",
                background: `linear-gradient(135deg, ${GOLD_HI} 0%, #ffd97a 45%, ${GOLD} 100%)`,
                boxShadow: `0 10px 26px -10px ${GOLD}88, 0 0 20px ${EMERALD}44`,
              }}
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)" }} />
              <span className="relative flex items-center" style={{ gap: "clamp(4px, 1.2vw, 8px)" }}>
                <Sparkles style={{ width: "clamp(11px, 3vw, 14px)", height: "clamp(11px, 3vw, 14px)" }} />
                JOIN GOLUCKY ECOSYSTEM
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" style={{ width: "clamp(11px, 3vw, 14px)", height: "clamp(11px, 3vw, 14px)" }} />
              </span>
            </button>
          </div>
        </Section>



        <div className="pt-4 pb-2 text-center text-[9px] text-white/30 uppercase tracking-[0.3em]">
          GoLucky · Play · Invest · Earn
        </div>
      </main>
    </div>
  );
};

export default HomeMobile;
