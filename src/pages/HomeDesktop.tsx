import { useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowDownToLine, ArrowUpFromLine, Crown, Gift, Users,
  ChevronRight, Ticket, ShieldCheck, Coins, Wallet as WalletIcon,
  Sparkles, TrendingUp, Flame, Zap, Star, Rocket, Brain, Target, Send,
  Globe, LineChart, Timer, Diamond, PiggyBank, Award, BarChart3,
  Briefcase, Calendar, CheckCircle2, Trophy, Play, Gamepad2, Fish,
  Layers, Landmark, Activity, Cpu, Radio, Lock, Headset, BadgeCheck,
  UserPlus, Handshake, GitBranch, Percent, ArrowRight, Repeat2,
  History as HistoryIcon, MessageCircle, Phone,
} from "lucide-react";
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
import catAviator from "@/assets/cat-aviator.png.asset.json";
import catCasino from "@/assets/cat-casino.png.asset.json";
import catSports from "@/assets/cat-sports.png.asset.json";
import catSlots from "@/assets/cat-slots.png.asset.json";
import catFishing from "@/assets/cat-fishing.png.asset.json";
import catArcade from "@/assets/cat-arcade.png.asset.json";

/**
 * HomeDesktop — 11-screen premium dashboard (≥1024px).
 * Each of S1..S11 becomes a row with a strict 2-card-per-row grid.
 * Deposit/Withdraw/Transfer/History live ONLY inside the S1 Hero.
 */

const GOLD = "#F5C86A";
const GOLD_HI = "#FDE68A";
const GOLD_DEEP = "#B8862F";
const EMERALD = "#10B981";
const EMERALD_HI = "#34D399";
const PURPLE = "#A855F7";
const BLUE = "#3B82F6";
const PINK = "#EC4899";
const RED = "#EF4444";
const CYAN = "#06B6D4";
const ORANGE = "#F97316";

const glass =
  "rounded-3xl border backdrop-blur-xl bg-white/[0.035] border-white/10 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)]";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCompact = (n: number) => {
  if (n >= 1e7) return `${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `${(n / 1e5).toFixed(2)}L`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
};

const Row = ({ id, title, sub, cta, children }: {
  id: string; title: string; sub?: string; cta?: { label: string; to: string }; children: ReactNode;
}) => {
  const navigate = useNavigate();
  return (
    <section data-testid={id} className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display font-bold text-[20px] leading-none">{title}</h2>
          {sub && <div className="mt-1.5 text-[12px] text-white/55">{sub}</div>}
        </div>
        {cta && (
          <button onClick={() => navigate(cta.to)}
            className="text-[12px] font-semibold flex items-center gap-1 hover:opacity-80"
            style={{ color: GOLD_HI }}>
            {cta.label} <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
      {children}
    </section>
  );
};

const HeroBanner = ({
  icon: Icon, title, tagline, ctaLabel, ctaTo, art, accentA = "#FDE68A", accentB = "#A855F7",
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string; tagline: ReactNode; ctaLabel: string; ctaTo: string; art: string;
  accentA?: string; accentB?: string;
}) => {
  const navigate = useNavigate();
  return (
    <div
      className="relative block w-full overflow-hidden rounded-[24px] min-h-[220px] h-[220px]"
      style={{
        border: `1px solid transparent`,
        backgroundImage: `linear-gradient(#05040a,#05040a), linear-gradient(135deg, ${accentA}dd 0%, ${GOLD_DEEP}99 40%, ${accentB}dd 100%)`,
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        boxShadow: `0 0 60px ${accentB}55, 0 0 48px ${GOLD}33, 0 22px 60px -20px rgba(0,0,0,0.98), inset 0 1px 0 rgba(255,255,255,0.16), inset 0 0 0 1px ${accentA}22`,
      }}
    >
      <img src={art} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      <div aria-hidden className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, rgba(5,4,10,0.86) 0%, rgba(5,4,10,0.28) 34%, rgba(5,4,10,0.18) 60%, rgba(5,4,10,0.78) 100%), linear-gradient(180deg, rgba(5,4,10,0.18) 0%, transparent 40%, rgba(5,4,10,0.55) 100%)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(38% 62% at 6% 18%, ${accentA}55, transparent 70%), radial-gradient(46% 68% at 98% 82%, ${accentB}55, transparent 72%)`, mixBlendMode: "screen" }} />
      <span aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accentA}ee, transparent)` }} />
      <span aria-hidden className="pointer-events-none absolute inset-x-10 bottom-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accentB}cc, transparent)` }} />

      <div className="relative z-10 h-full px-8 py-6 flex items-center justify-between gap-6">
        <div className="min-w-0 flex items-center gap-4">
          <span className="shrink-0 h-14 w-14 rounded-2xl grid place-items-center"
            style={{ background: `radial-gradient(circle at 50% 35%, ${accentA}55, rgba(8,4,15,0.9) 70%)`, border: `1px solid ${accentA}aa`, boxShadow: `0 0 22px ${GOLD}88, inset 0 1px 0 rgba(255,255,255,0.25)` }}>
            <Icon className="h-8 w-8" style={{ color: accentA, filter: `drop-shadow(0 0 8px ${GOLD}cc)` }} />
          </span>
          <div className="min-w-0">
            <h3 className="font-display font-black text-[42px] leading-none tracking-tight bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(180deg, #FFF7C8 0%, ${accentA} 45%, ${GOLD_DEEP} 100%)`, WebkitTextStroke: "0.4px rgba(120,65,0,0.55)", filter: `drop-shadow(0 0 12px ${GOLD}66)` }}>
              {title}
            </h3>
            <p className="mt-3 text-[15px] font-semibold text-white/90">{tagline}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(ctaTo)}
          className="shrink-0 h-12 px-6 rounded-full inline-flex items-center gap-2 font-display font-black text-[13.5px] tracking-[0.16em] uppercase active:scale-[0.98] transition-transform"
          style={{
            background: `linear-gradient(135deg, #FFF7C8 0%, ${accentA} 32%, ${GOLD_DEEP} 62%, ${accentB} 100%)`,
            color: "#150a02",
            border: `1.5px solid ${accentA}`,
            boxShadow: `0 0 26px ${GOLD}b3, 0 0 38px ${accentB}77, inset 0 1px 0 rgba(255,255,255,0.65), inset 0 0 0 1px rgba(255,255,255,0.18), inset 0 -1px 0 rgba(90,45,0,0.4)`,
            textShadow: "0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          <Icon className="h-4 w-4" style={{ color: "#3a1d00" }} />
          {ctaLabel}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const Stat = ({ i: Icon, label, value, color, onClick }: {
  i: any; label: string; value: string; color: string; onClick?: () => void;
}) => (
  <button onClick={onClick}
    className={`${glass} p-4 flex flex-col items-start gap-2 text-left hover:-translate-y-0.5 transition`}
    style={{ boxShadow: `inset 0 0 0 1px ${color}22` }}>
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4" style={{ color }} />
      <span className="text-[10px] uppercase tracking-widest text-white/50">{label}</span>
    </div>
    <div className="font-display font-black text-[22px] tabular-nums leading-none" style={{ color }}>
      {value}
    </div>
  </button>
);

const Card = ({ i: Icon, title, sub, color, badge, onClick, className = "" }: {
  i: any; title: string; sub: string; color: string; badge?: string; onClick?: () => void; className?: string;
}) => (
  <button onClick={onClick}
    className={`${glass} p-4 flex flex-col gap-3 text-left hover:-translate-y-0.5 transition min-h-[128px] ${className}`}
    style={{ boxShadow: `inset 0 0 0 1px ${color}22` }}>
    <div className="flex items-start justify-between gap-2">
      <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0"
        style={{ background: `${color}20`, border: `1px solid ${color}44` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      {badge && (
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
          style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}>
          {badge}
        </span>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-display font-bold text-[15px] leading-tight">{title}</div>
      <div className="mt-1 text-[12px] text-white/55">{sub}</div>
    </div>
  </button>
);

const HeroCard = ({ title, sub, color, badge, art, flabel, fvalue, fcolor, cta, onClick }: {
  title: string; sub: string; color: string; badge?: string; art: string;
  flabel: string; fvalue: string; fcolor: string; cta: string; onClick?: () => void;
}) => {
  const isWinners = title === "LIVE WINNERS";
  const isWinGo = title === "WIN GO";
  const isLottery = title === "5D LOTTERY";
  const isCrypto = title === "CRYPTO TRADING";
  const TileIcon = isWinGo ? Gamepad2 : isLottery ? Ticket : isCrypto ? LineChart : Trophy;


  // PARITY: every card in the 2×2 grid MUST share width, height, radius, padding.
  const CARD_BOX =
    "group relative overflow-hidden rounded-[18px] h-[300px] w-full text-left hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80";
  return (
    <button onClick={onClick} type="button" aria-label={title}
      data-feature-card={title}
      className={CARD_BOX}
      style={{ border: `1.5px solid ${color}`, boxShadow: `0 0 0 1px ${color}44, 0 0 22px -1px ${color}dd, inset 0 1px 0 ${color}aa, inset 0 0 40px -14px ${color}` }}>
      <div aria-hidden className="absolute inset-0"
        style={{
          background:
            `radial-gradient(130% 95% at 50% 100%, ${color}44 0%, transparent 56%),` +
            `radial-gradient(80% 55% at 18% 16%, ${color}2e 0%, transparent 58%),` +
            `linear-gradient(160deg, #090a12 0%, #03040a 58%, #010103 100%)`,
        }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-screen"
        style={{ background: `conic-gradient(from 210deg at 30% 30%, ${color}66, ${GOLD_HI}55, ${BLUE}55, ${PURPLE}55, ${color}66)`, maskImage: "radial-gradient(ellipse at 30% 30%, black 0%, transparent 65%)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] opacity-90">
        <div className="absolute left-1/2 bottom-8 h-14 w-[78%] -translate-x-1/2 rounded-full"
          style={{ background: `radial-gradient(ellipse at center, transparent 35%, ${color}99 42%, transparent 50%, ${BLUE}77 58%, transparent 68%)`, transform: "translateX(-50%) perspective(120px) rotateX(64deg)", boxShadow: `0 0 26px ${color}88` }} />
        <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-50"
          style={{ backgroundImage: `linear-gradient(${color}22 1px, transparent 1px), linear-gradient(90deg, ${color}22 1px, transparent 1px)`, backgroundSize: "14px 14px", maskImage: "linear-gradient(180deg, transparent 0%, black 62%, transparent 100%)" }} />
      </div>

      {isWinners ? (
        <img src={art} alt="" aria-hidden loading="lazy" width={640} height={640}
          className="pointer-events-none select-none absolute left-[7%] bottom-4 h-[72%] w-auto aspect-square object-contain group-hover:scale-[1.06] transition-transform duration-500 drop-shadow-[0_22px_50px_rgba(0,0,0,0.95)] z-[1]"
          style={{ filter: `drop-shadow(0 14px 40px ${color}dd) drop-shadow(0 0 28px ${GOLD_HI}bb)` }} />
      ) : (
        <img src={art} alt="" aria-hidden loading="lazy" width={640} height={640}
          className={`pointer-events-none select-none absolute w-auto aspect-square object-contain object-right-bottom group-hover:scale-[1.08] transition-transform duration-500 drop-shadow-[0_18px_44px_rgba(0,0,0,0.9)] z-[1] ${isWinGo ? "right-[2%] bottom-4 h-[82%]" : isLottery ? "-right-5 -bottom-3 h-[98%]" : "right-[4%] bottom-8 h-[72%]"}`}
          style={{ filter: `drop-shadow(0 12px 36px ${color}cc) drop-shadow(0 0 20px ${color}88)` }} />
      )}

      {isWinGo && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[2]">
          {[{ n: "3", x: "10%", y: "46%", col: "#ff357d" }, { n: "0", x: "7%", y: "64%", col: "#2ecbff" }, { n: "5", x: "31%", y: "64%", col: GOLD_HI }, { n: "9", x: "72%", y: "38%", col: PURPLE }].map((b) => (
            <span key={b.n + b.x} className="absolute h-11 w-11 rounded-full grid place-items-center font-display font-black text-[21px]"
              style={{ left: b.x, top: b.y, color: "#080808", background: `radial-gradient(circle at 30% 22%, #fff, ${b.col} 32%, #4a2100 82%)`, boxShadow: `0 0 16px ${b.col}, inset -5px -7px 12px rgba(0,0,0,0.48)` }}>{b.n}</span>
          ))}
        </div>
      )}
      {isLottery && <div aria-hidden className="pointer-events-none absolute inset-0 z-[2]">
        <div className="absolute left-[8%] bottom-[17%] h-11 w-16 -rotate-12 rounded-sm" style={{ background: `linear-gradient(135deg, ${GOLD_HI}, ${GOLD_DEEP})`, boxShadow: `0 0 14px ${GOLD}`, border: `1px solid ${GOLD_HI}` }} />
        {[...Array(14)].map((_, i) => <span key={i} className="absolute h-4 w-4 rounded-full" style={{ left: `${6 + i * 3.8}%`, bottom: `${4 + (i % 4) * 3}%`, background: `linear-gradient(135deg, ${GOLD_HI}, ${GOLD_DEEP})`, boxShadow: `0 0 7px ${GOLD}` }} />)}
      </div>}
      {isCrypto && <div aria-hidden className="pointer-events-none absolute inset-0 z-[2]">
        {[26, 42, 56, 74, 92, 110].map((h, i) => <span key={h} className="absolute bottom-[38%] w-2 rounded-sm" style={{ left: `${57 + i * 6}%`, height: `${h * 0.45}px`, background: i % 2 ? RED : EMERALD_HI, boxShadow: `0 0 9px ${i % 2 ? RED : EMERALD_HI}` }} />)}
        {["Ξ", "◆", "✦"].map((s, i) => <span key={s} className="absolute h-9 w-9 rounded-full grid place-items-center text-[16px] font-black" style={{ left: `${8 + i * 18}%`, top: `${38 + (i % 2) * 18}%`, color: "#fff", border: `1px solid ${BLUE}aa`, background: "rgba(5,12,25,0.72)", boxShadow: `0 0 12px ${BLUE}` }}>{s}</span>)}
      </div>}

      <div aria-hidden className="pointer-events-none absolute inset-0 z-[2]" style={{ background: isWinners ? `linear-gradient(270deg, rgba(0,0,0,0.74) 0%, rgba(0,0,0,0.32) 48%, rgba(0,0,0,0) 74%)` : `linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.27) 40%, rgba(0,0,0,0) 62%)` }} />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/3 z-[2] rounded-t-[18px]" style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 45%, transparent 100%)` }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-[2]"><div className="absolute inset-y-0 -left-1/2 w-1/2 animate-shimmer opacity-50" style={{ background: `linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.28) 50%, transparent 65%)` }} /></div>


      {/* Decorative premium tile icon — absolute, no layout shift */}
      <span aria-hidden className="pointer-events-none absolute top-3 left-3 z-[3] h-9 w-9 rounded-xl grid place-items-center backdrop-blur-md"
        style={{ background: `linear-gradient(140deg, ${color}33, rgba(0,0,0,0.6))`, border: `1px solid ${color}aa`, boxShadow: `0 0 14px ${color}66, inset 0 1px 0 rgba(255,255,255,0.14)` }}>
        <TileIcon className="h-4.5 w-4.5" style={{ color, filter: `drop-shadow(0 0 5px ${color}bb)`, height: 18, width: 18 }} strokeWidth={2.4} />
      </span>

      <div className="relative z-[3] p-[14px] flex flex-col h-full">


        <div className="flex items-start justify-between gap-2">
          <div className={isWinners ? "max-w-[54%]" : "max-w-[58%]"}>
            <div className="font-display font-black text-[30px] leading-none" style={{ color: isCrypto ? CYAN : color, textShadow: `0 0 14px ${color}99, 0 1px 0 #000` }}>{title}</div>
            <div className="mt-2 text-[14px] leading-snug text-white/90 font-semibold">{sub}</div>
          </div>
          {badge && <span className="text-[11px] font-black uppercase tracking-[0.10em] px-2.5 py-1.5 rounded-md backdrop-blur-md shrink-0" style={{ background: `${color}2e`, color, border: `1px solid ${color}aa`, boxShadow: `0 0 12px ${color}55` }}>{badge}</span>}
        </div>
        {isWinners && <div className="mt-5 ml-auto w-[58%] space-y-2">
          {[{ n: "Rakib****", a: "৳12,500", r: 1 }, { n: "Nusrat****", a: "৳8,200", r: 2 }, { n: "Alamin****", a: "৳6,750", r: 3 }].map((w) => (
            <div key={w.n} className="flex items-center gap-2 px-2 py-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.6)", border: `1px solid ${GOLD}44`, backdropFilter: "blur(4px)" }}>
              <span className="h-7 w-7 rounded-full grid place-items-center text-[13px] shrink-0" style={{ background: `linear-gradient(135deg, ${GOLD_HI}, ${GOLD_DEEP})` }}>👤</span>
              <span className="text-[12px] font-bold text-white/90 flex-1 min-w-0 truncate">{w.n}</span>
              <span className="text-[13px] font-black tabular-nums shrink-0" style={{ color: GOLD_HI, textShadow: `0 0 6px ${GOLD}88` }}>{w.a}</span>
              <span className="shrink-0 h-5 w-5 rounded-full grid place-items-center text-[10px] font-black text-black" style={{ background: `linear-gradient(135deg, ${GOLD_HI}, ${GOLD_DEEP})`, boxShadow: `0 0 6px ${GOLD}aa` }}>{w.r}</span>
            </div>
          ))}
        </div>}
        {!isWinners && <div className="mt-auto w-fit">
          <div className="text-[12px] uppercase tracking-[0.08em] text-white/75 font-black">{flabel}</div>
          <div className="text-[25px] font-black tabular-nums leading-none mt-1 whitespace-nowrap" style={{ color: fcolor, textShadow: `0 0 12px ${fcolor}aa` }}>{fvalue}</div>
        </div>}
        <div className={`${isWinners ? "mt-auto ml-auto" : "mt-3"} flex ${isWinners ? "justify-end" : "justify-start"}`}>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-black tracking-wide" style={{ background: `linear-gradient(180deg, ${color}36, rgba(0,0,0,0.78))`, color, border: `1px solid ${color}cc`, boxShadow: `0 0 16px ${color}66, inset 0 1px 0 ${color}66`, textShadow: `0 0 8px ${color}88` }}>{cta} <ChevronRight className="h-4 w-4" /></span>
        </div>
      </div>
    </button>
  );
};

const HomeDesktop = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(25000);
  const [bonus, setBonus] = useState(2500);
  const [luckyCoin, setLuckyCoin] = useState(14250);
  const [name, setName] = useState("Player");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const uname = (user.user_metadata as any)?.full_name ||
        (user.user_metadata as any)?.username ||
        user.email?.split("@")[0] || "Player";
      setName(uname);
      const { data: w } = await supabase
        .from("wallets")
        .select("balance, lucky_coin, bonus_balance")
        .eq("user_id", user.id)
        .maybeSingle();
      if (w) {
        setBalance(Number((w as any).balance ?? 0));
        setBonus(Number((w as any).bonus_balance ?? 0));
        setLuckyCoin(Number((w as any).lucky_coin ?? 0));
      }
    })();
  }, []);

  const vipLevel = 3;
  const totalBalance = balance + bonus;

  return (
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden" style={{ background: "#050505" }}>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[32rem] w-[32rem] rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${EMERALD}, transparent 70%)`, filter: "blur(120px)" }} />
        <div className="absolute top-1/4 -right-32 h-[36rem] w-[36rem] rounded-full opacity-15"
          style={{ background: `radial-gradient(circle, ${GOLD}, transparent 70%)`, filter: "blur(140px)" }} />
        <div className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${PURPLE}, transparent 70%)`, filter: "blur(140px)" }} />
      </div>

      <div className="mx-auto w-full max-w-[1280px] px-6 xl:px-8 py-8 space-y-10">

        {/* ═══ S1 · HERO COMMAND CENTER ═══ */}
        <section data-testid="home-hero" className="relative overflow-hidden rounded-[26px] p-[1.5px]"
          style={{
            background: `linear-gradient(90deg, ${PURPLE}, ${GOLD_HI} 18%, ${BLUE} 55%, ${PURPLE} 78%, ${GOLD_HI})`,
            boxShadow: `0 0 24px ${PURPLE}aa, 0 0 28px ${GOLD}66`,
          }}>
          <div className="relative overflow-hidden rounded-[24px] p-3"
            style={{
              background: `radial-gradient(82% 95% at 8% 42%, ${PURPLE}55, transparent 48%), radial-gradient(95% 85% at 96% 32%, ${BLUE}55, transparent 50%), radial-gradient(55% 65% at 64% 0%, ${GOLD_DEEP}45, transparent 58%), linear-gradient(180deg, #08070d 0%, #020205 100%)`,
            }}>
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]"
              style={{ backgroundImage: `linear-gradient(${GOLD}44 1px, transparent 1px), linear-gradient(90deg, ${BLUE}44 1px, transparent 1px)`, backgroundSize: "20px 20px", maskImage: "radial-gradient(ellipse at center, black 20%, transparent 78%)" }} />
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute inset-y-0 -left-1/2 w-1/2 animate-shimmer opacity-60" style={{ background: `linear-gradient(105deg, transparent 34%, rgba(255,255,255,0.22) 50%, transparent 66%)` }} />
            </div>

            <div className="relative z-[2] grid grid-cols-[42%_58%] min-h-[155px] rounded-[20px] overflow-hidden border border-white/10"
              style={{ background: "rgba(0,0,0,0.18)", boxShadow: `inset 0 0 26px ${GOLD_DEEP}22` }}>
              <div className="relative flex items-center gap-3 p-3 border-r border-white/10">
                <div aria-hidden className="relative h-[116px] w-[116px] shrink-0 rounded-full grid place-items-center glx-float">
                  <span className="absolute -inset-1 rounded-full" style={{ background: `conic-gradient(${GOLD_HI}, ${GOLD_DEEP}, ${PURPLE}, ${BLUE}, ${GOLD_HI})`, boxShadow: `0 0 28px ${GOLD}, 0 0 30px ${PURPLE}` }} />
                  <span className="absolute inset-1 rounded-full" style={{ background: "radial-gradient(circle at 50% 35%, #151b28, #010104 72%)", border: `2px solid ${GOLD_HI}`, boxShadow: `inset 0 0 26px #001b30, 0 0 18px ${GOLD}` }} />
                  <Crown className="absolute -top-1 h-8 w-8 z-[3]" style={{ color: GOLD_HI, filter: `drop-shadow(0 0 8px ${GOLD})` }} />
                  <ShieldCheck className="relative z-[2] h-12 w-12" style={{ color: CYAN, filter: `drop-shadow(0 0 12px ${CYAN})` }} />
                  <button onClick={() => navigate("/vip")} type="button" aria-label="VIP level 10, open VIP club" className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-7 px-2.5 rounded-full flex items-center gap-1 text-[13px] font-black whitespace-nowrap z-[4]" style={{ background: `linear-gradient(180deg, #1b1100, #050505)`, color: GOLD_HI, border: `1px solid ${GOLD_HI}`, boxShadow: `0 0 14px ${GOLD}aa` }}>৳ VIP 10</button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] uppercase tracking-[0.18em] text-white/72 font-black leading-none">Welcome back</div>
                  <div className="mt-2 font-display font-black text-[30px] leading-none truncate text-white" style={{ textShadow: "0 1px 2px #000, 0 0 8px rgba(255,255,255,0.22)" }}>{name}</div>
                  <div className="mt-1.5 text-[14px] tracking-[0.12em] uppercase font-black" style={{ color: GOLD_HI, textShadow: `0 0 7px ${GOLD}88` }}>Play · Invest · Earn</div>
                  <span aria-label="Up 2.45 percent today" className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[15px] font-black" style={{ background: "rgba(0,0,0,0.45)", color: EMERALD_HI, border: `1px solid ${EMERALD}66`, boxShadow: `inset 0 0 12px ${EMERALD}22, 0 0 12px ${EMERALD}33` }}><TrendingUp className="h-4 w-4" /> +2.45%</span>
                </div>
              </div>

              <div className="relative min-w-0 pl-6 pr-[190px] flex flex-col justify-center overflow-hidden py-2">
                <img src={vaultHero.url} alt="" aria-hidden loading="lazy" className="pointer-events-none select-none absolute right-0 -bottom-4 h-[112%] w-auto aspect-square object-contain object-right-bottom z-[2] opacity-100" style={{ filter: `drop-shadow(0 14px 30px ${GOLD}aa) drop-shadow(0 0 24px ${BLUE}aa)` }} />
                <div aria-hidden className="absolute right-8 bottom-3 h-20 w-32 rounded-full z-[1]" style={{ background: `radial-gradient(circle, ${GOLD}aa, transparent 70%)`, filter: "blur(20px)" }} />
                <div className="relative z-[2] flex items-center gap-2 text-[13px] uppercase tracking-[0.15em] text-white/80 font-black leading-none"><Lock className="h-3.5 w-3.5" style={{ color: GOLD_HI, filter: `drop-shadow(0 0 6px ${GOLD})` }} />Total Balance</div>
                <div className="relative z-[2] mt-2 font-display font-black text-[44px] tabular-nums leading-none bg-clip-text text-transparent whitespace-nowrap" style={{ backgroundImage: `linear-gradient(180deg, #fff8d0 0%, ${GOLD_HI} 34%, ${GOLD} 72%, ${GOLD_DEEP} 100%)`, filter: `drop-shadow(0 0 10px ${GOLD}77)` }}>৳{fmt(totalBalance)}</div>
                <div className="relative z-[2] mt-2.5 grid grid-cols-2 gap-2 max-w-[340px]">
                  <span className="rounded-lg px-2.5 py-1.5 border leading-tight" style={{ background: "rgba(0,0,0,0.5)", borderColor: "rgba(255,255,255,0.16)" }}><span className="block uppercase text-white/60 text-[9px]">Bonus Balance</span><b className="mt-0.5 block text-[15px] tabular-nums text-white">৳{fmtCompact(bonus)}</b></span>
                  <span className="rounded-lg px-2.5 py-1.5 border leading-tight" style={{ background: "rgba(0,0,0,0.5)", borderColor: "rgba(255,255,255,0.16)" }}><span className="block uppercase text-white/60 text-[9px]">Coin Balance</span><b className="mt-0.5 block text-[15px] tabular-nums text-white">{fmtCompact(luckyCoin)}</b></span>
                </div>
              </div>
            </div>

            <div className="relative z-[2] mt-3 grid grid-cols-4 gap-2.5">
              {[
                { l: "Deposit",  i: ArrowDownToLine, c: EMERALD_HI, to: "/deposit", tid: "home-cta-deposit" },
                { l: "Withdraw", i: ArrowUpFromLine, c: GOLD_HI,    to: "/withdraw", tid: "home-cta-withdraw" },
                { l: "Transfer", i: Repeat2,         c: CYAN,       to: "/wallet?tab=transfer", tid: "home-cta-transfer" },
                { l: "History",  i: HistoryIcon,     c: PURPLE,     to: "/wallet", tid: "home-cta-history" },
              ].map((a) => (
                <button key={a.l} onClick={() => navigate(a.to)}
                  data-testid={a.tid}
                  className="rounded-xl py-3.5 flex flex-col items-center justify-center gap-1.5 hover:-translate-y-0.5 transition"
                  style={{
                    background: `radial-gradient(120% 100% at 50% 0%, ${a.c}28 0%, transparent 55%), linear-gradient(180deg, #0b0c12 0%, #030306 100%)`,
                    border: `2px solid ${a.c}`,
                    boxShadow: `0 0 0 1px ${a.c}66, 0 0 20px -2px ${a.c}ee, inset 0 0 20px -5px ${a.c}, inset 0 1px 0 ${a.c}88`,
                  }}>
                  <a.i className="h-6 w-6" style={{ color: a.c, filter: `drop-shadow(0 0 8px ${a.c}) drop-shadow(0 0 16px ${a.c}aa)` }} />
                  <span className="text-[12px] font-black uppercase" style={{ color: "#fff", textShadow: `0 0 8px ${a.c}` }}>{a.l}</span>
                </button>
              ))}
            </div>

            <div className="relative z-[2] mt-3 grid grid-cols-2 gap-2.5">
              <HeroCard title="WIN GO" sub="Win Big Every 30s" color={GOLD_HI} badge="LIVE" art={artWinGo} flabel="NEXT DRAW" fvalue="00:00:28" fcolor={EMERALD_HI} cta="PLAY NOW" onClick={() => navigate("/game/wingo")} />
              <HeroCard title="5D LOTTERY" sub="Mega Jackpot Awaits" color={PINK} badge="HOT" art={artLottery} flabel="JACKPOT" fvalue="৳2.50 CR" fcolor={PINK} cta="PLAY NOW" onClick={() => navigate("/game/5d")} />
              <HeroCard title="CRYPTO TRADING" sub="Trade Top Coins Instantly" color={CYAN} badge="LIVE" art={artCrypto} flabel="BTC/USDT" fvalue="+2.34%" fcolor={EMERALD_HI} cta="TRADE NOW" onClick={() => navigate("/trading/markets")} />
              <HeroCard title="LIVE WINNERS" sub="Real People, Real Wins" color={GOLD_HI} badge="LIVE" art={artWinners} flabel="PAID" fvalue="৳12.4M" fcolor={GOLD_HI} cta="VIEW ALL" onClick={() => navigate("/activity")} />
            </div>
          </div>
        </section>

        {/* ═══ S2 · AGENT EMPIRE ═══ */}
        <Row id="home-agent-empire" title="Agent Empire" sub="Build your team · earn recurring commission" cta={{ label: "Become Agent", to: "/agent" }}>
          {/* SAFEGUARD: Hero banner always renders above the stats grid — do not wrap in conditionals */}
          <div
            data-testid="home-agent-empire-hero"
            data-hero-banner="agent-empire"
            style={{ display: "block", visibility: "visible", opacity: 1, width: "100%" }}
          >
            <HeroBanner
              icon={Crown}
              title="Agent Empire"
              tagline={<>Build Your Team <span style={{ color: GOLD_HI }}>•</span> Earn Commission</>}
              ctaLabel="Become Agent"
              ctaTo="/agent/apply"
              art={agentHero.url}
              accentA={GOLD_HI}
              accentB={PURPLE}
            />
          </div>


          <div className="grid grid-cols-4 gap-3">
            <Stat i={Users} label="Active Agents" value="8,240" color={EMERALD_HI} onClick={() => navigate("/agent")} />
            <Stat i={Coins} label="Today Commission" value="৳12.4K" color={GOLD_HI} onClick={() => navigate("/agent")} />
            <Stat i={GitBranch} label="Team Growth" value="+38%" color={CYAN} onClick={() => navigate("/agent")} />
            <Stat i={Trophy} label="Monthly Rewards" value="৳2.1L" color={PINK} onClick={() => navigate("/agent")} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Card i={Percent} title="Commission" sub="Up to 3.5% per deposit" color={GOLD_HI} onClick={() => navigate("/agent")} />
            <Card i={Briefcase} title="Salary" sub="Monthly base + bonus" color={EMERALD_HI} onClick={() => navigate("/agent")} />
            <Card i={Gift} title="Bonus" sub="Milestone rewards" color={PINK} onClick={() => navigate("/agent")} />
            <Card i={Handshake} title="Leadership" sub="Master tier benefits" color={PURPLE} onClick={() => navigate("/agent")} />
          </div>
        </Row>

        {/* ═══ S3 · FIXED DEPOSIT CENTRE ═══ */}
        <Row id="home-fixed-deposit" title="Fixed Deposit Centre" sub="15 plans · 15–365 days · up to 25% return" cta={{ label: "Invest Now", to: "/fixed-deposits" }}>
          {/* SAFEGUARD: Hero banner always renders above the stats grid — do not wrap in conditionals */}
          <div
            data-testid="home-fixed-deposit-hero"
            data-hero-banner="fixed-deposit"
            style={{ display: "block", visibility: "visible", opacity: 1, width: "100%" }}
          >
            <HeroBanner
              icon={PiggyBank}
              title="Fixed Deposit Centre"
              tagline={<>Invest 15–365 Days <span style={{ color: GOLD_HI }}>•</span> Up To 25% Return</>}
              ctaLabel="Invest Now"
              ctaTo="/fixed-deposits"
              art={fixedDepositHero.url}
              accentA={GOLD_HI}
              accentB={EMERALD}
            />
          </div>


          <div className="grid grid-cols-4 gap-3">
            <Stat i={Users} label="Investors" value="24,120" color={EMERALD_HI} onClick={() => navigate("/fixed-deposits")} />
            <Stat i={Layers} label="Active Plans" value="15" color={GOLD_HI} onClick={() => navigate("/fixed-deposits")} />
            <Stat i={ShieldCheck} label="Trust Score" value="9.4/10" color={BLUE} onClick={() => navigate("/fixed-deposits")} />
            <Stat i={TrendingUp} label="Top Return" value="25%" color={PINK} onClick={() => navigate("/fixed-deposits")} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Card i={Timer} title="15 Days" sub="Starter · 5% return" color={CYAN} badge="ENTRY" onClick={() => navigate("/fixed-deposits")} />
            <Card i={Calendar} title="30 Days" sub="Growth · 9% return" color={EMERALD_HI} onClick={() => navigate("/fixed-deposits")} />
            <Card i={Award} title="90 Days" sub="Diamond · 15%" color={GOLD_HI} badge="POPULAR" onClick={() => navigate("/fixed-deposits")} />
            <Card i={Crown} title="Premium 365d" sub="Elite · 25%" color={PINK} badge="ELITE" onClick={() => navigate("/fixed-deposits")} />
          </div>
        </Row>

        {/* ═══ S4 · EXCLUSIVE GAMES ═══ */}
        <Row id="home-exclusive-games" title="Exclusive Games" sub="20,000+ premium games · 50+ providers" cta={{ label: "Explore Catalog", to: "/games" }}>
          <div className="grid grid-cols-6 gap-3">
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
                className="group relative overflow-hidden rounded-2xl h-[128px] transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.97] motion-reduce:transition-none motion-reduce:transform-none motion-reduce:hover:transform-none motion-reduce:active:transform-none"
                style={{
                  background: `radial-gradient(75% 90% at 65% 45%, ${cat.c}33, transparent 70%), radial-gradient(90% 70% at 20% 100%, ${cat.c}22, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.65) 100%)`,
                  border: `1px solid ${cat.c}66`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), inset 0 0 26px ${cat.c}2a, 0 0 22px ${cat.c}3a`,
                  backdropFilter: "blur(10px) saturate(140%)",
                  WebkitBackdropFilter: "blur(10px) saturate(140%)",
                }}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `radial-gradient(45% 60% at 68% 45%, ${cat.c}55, transparent 70%)`,
                    filter: "blur(10px)",
                    mixBlendMode: "screen",
                  }}
                />
                <img
                  src={cat.art}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className="pointer-events-none absolute right-[-8px] top-1/2 -translate-y-1/2 h-[115%] w-auto object-contain transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-2 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0 motion-reduce:group-active:scale-100"
                  style={{ filter: `drop-shadow(0 2px 8px rgba(0,0,0,0.6)) drop-shadow(0 0 10px ${cat.c}88)` }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-3/5"
                  style={{ background: "linear-gradient(90deg, rgba(4,7,10,0.85) 0%, rgba(4,7,10,0.35) 60%, transparent 100%)" }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-3 top-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${cat.c}cc, transparent)` }}
                />
                <div className="relative z-10 h-full flex items-end p-3">
                  <div
                    className="font-display font-black text-[15px] leading-none tracking-tight"
                    style={{ color: "#fff", textShadow: `0 1px 4px rgba(0,0,0,0.9), 0 0 10px ${cat.c}88` }}
                  >
                    {cat.title}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Row>

        {/* ═══ S4b · LIVE WINNERS TICKER (compact 54px) — parity with mobile ═══ */}
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
          <div
            className="relative z-20 shrink-0 h-full flex items-center gap-1.5 pl-3 pr-2.5"
            style={{ background: "linear-gradient(90deg, rgba(4,7,10,0.92) 0%, rgba(4,7,10,0.85) 70%, transparent 100%)" }}
          >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: EMERALD_HI, boxShadow: `0 0 8px ${EMERALD_HI}` }} />
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

          <span
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 z-10"
            style={{ background: "linear-gradient(90deg, transparent, rgba(4,7,10,0.9))" }}
          />

          <div className="relative flex-1 overflow-hidden h-full flex items-center">
            <div
              className="flex items-center gap-6 whitespace-nowrap will-change-transform"
              style={{ animation: "lwTickerScrollDesktop 42s linear infinite" }}
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
                    <span className="font-display font-black tabular-nums" style={{ color: GOLD_HI, textShadow: `0 0 6px ${GOLD}66` }}>
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
            @keyframes lwTickerScrollDesktop {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
        </div>

        {/* ═══ S5 · AI PREDICTION CENTER ═══ */}
        <Row id="home-ai-prediction" title="AI Prediction Center" sub="Smart signals · trend analysis" cta={{ label: "Explore AI", to: "/ai-hub" }}>
          <div className="relative rounded-3xl overflow-hidden">
            {/* ── AI Hologram Backdrop ── */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[380px] w-[380px] rounded-full opacity-60"
                style={{ background: `radial-gradient(circle, ${GOLD_HI}1a 0%, transparent 42%), radial-gradient(circle at 50% 50%, transparent 54%, ${EMERALD}22 57%, transparent 60%), radial-gradient(circle at 50% 50%, transparent 68%, ${CYAN}1c 71%, transparent 74%)`, filter: "blur(2px)" }} />
              <svg viewBox="0 0 200 200" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[220px] w-[220px] opacity-[0.09]" fill="none" stroke={GOLD_HI} strokeWidth="0.9" strokeLinecap="round">
                <path d="M72 62 Q52 62 52 86 Q40 96 52 112 Q46 132 72 138 Q82 152 100 148 L100 55 Q82 50 72 62Z" />
                <path d="M128 62 Q148 62 148 86 Q160 96 148 112 Q154 132 128 138 Q118 152 100 148 L100 55 Q118 50 128 62Z" />
                <path d="M60 92 Q76 92 82 102 M140 92 Q124 92 118 102 M100 70 L100 132 M74 112 Q84 118 92 112 M126 112 Q116 118 108 112" stroke={EMERALD_HI} />
                <circle cx="100" cy="100" r="46" stroke={CYAN} strokeDasharray="2 4" opacity="0.7" />
              </svg>
              {[
                { t: "6%",  l: "10%", c: GOLD_HI,    d: "0s" },
                { t: "14%", l: "86%", c: EMERALD_HI, d: ".4s" },
                { t: "42%", l: "4%",  c: CYAN,       d: ".9s" },
                { t: "72%", l: "96%", c: GOLD_HI,    d: ".2s" },
                { t: "32%", l: "46%", c: EMERALD_HI, d: "1.1s" },
                { t: "88%", l: "28%", c: CYAN,       d: ".6s" },
                { t: "10%", l: "56%", c: GOLD_HI,    d: "1.4s" },
                { t: "80%", l: "70%", c: EMERALD_HI, d: ".3s" },
                { t: "56%", l: "20%", c: GOLD_HI,    d: ".8s" },
                { t: "24%", l: "36%", c: CYAN,       d: "1.2s" },
              ].map((p, i) => (
                <span key={i} aria-hidden
                  className="absolute h-[3px] w-[3px] rounded-full animate-pulse motion-reduce:animate-none"
                  style={{ top: p.t, left: p.l, background: p.c, boxShadow: `0 0 4px ${p.c}, 0 0 10px ${p.c}aa`, animationDelay: p.d, animationDuration: "2.4s" }} />
              ))}
              <div className="absolute inset-0 opacity-[0.05]"
                style={{ backgroundImage: `linear-gradient(${GOLD_HI}66 1px, transparent 1px), linear-gradient(90deg, ${EMERALD}44 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />
            </div>

            <div className="relative z-10 grid grid-cols-12 gap-3">

            {/* Confidence Hero Bar — spans left */}
            <div
              className={`${glass} col-span-5 relative overflow-hidden p-4 flex items-center gap-4`}
              style={{
                borderColor: `${GOLD_HI}55`,
                background: `linear-gradient(120deg, ${GOLD_HI}18 0%, ${EMERALD}14 45%, ${CYAN}18 100%)`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 30px ${GOLD_HI}22`,
              }}
            >
              <span aria-hidden className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full"
                style={{ background: `radial-gradient(circle, ${GOLD_HI}55, transparent 70%)`, filter: "blur(18px)" }} />
              <div className="h-14 w-14 rounded-2xl grid place-items-center shrink-0"
                style={{ background: `linear-gradient(135deg, ${GOLD_HI}33, ${EMERALD}22)`, border: `1px solid ${GOLD_HI}66`, boxShadow: `0 0 18px ${GOLD_HI}55` }}>
                <Cpu className="h-7 w-7" style={{ color: GOLD_HI }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">AI Model Confidence</div>
                <div className="flex items-baseline gap-2">
                  <div className="font-display font-black text-[32px] leading-none tabular-nums" style={{ color: GOLD_HI, textShadow: `0 0 12px ${GOLD_HI}66` }}>94.2%</div>
                  <div className="text-[12px] font-semibold" style={{ color: EMERALD_HI }}>↑ 2.4</div>
                </div>
                <div className="mt-2 h-[5px] w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="ai-confidence-bar h-full rounded-full" style={{ width: "94%", backgroundImage: `linear-gradient(90deg, ${GOLD_HI}, ${EMERALD}, ${CYAN}, ${GOLD_HI})`, boxShadow: `0 0 12px ${GOLD_HI}aa` }} />
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap"
                style={{ background: `${EMERALD}22`, color: EMERALD_HI, border: `1px solid ${EMERALD}66` }}>
                LIVE
              </span>
            </div>

            {/* 4 Insight Cards — 2×2 on the right */}
            <div className="col-span-7 grid grid-cols-2 gap-3">
              {[
                { i: Brain,      title: "AI Confidence", metric: "94.2%",   sub: "12 active signals",  tag: "STRONG", c: GOLD_HI,    accent: EMERALD },
                { i: Flame,      title: "Hot Trend",     metric: "Aviator", sub: "+37% players 1h",    tag: "HOT",    c: EMERALD_HI, accent: GOLD_HI },
                { i: TrendingUp, title: "Market Signal", metric: "BTC ↑",   sub: "Bullish · 4h",       tag: "BUY",    c: CYAN,       accent: EMERALD },
                { i: Zap,        title: "Quick Insight", metric: "5D • No.8", sub: "Pattern Match 91%",  tag: "NEW",    c: GOLD_HI,    accent: CYAN },
              ].map((k) => (
                <button
                  key={k.title}
                  type="button"
                  onClick={() => navigate("/ai-hub")}
                  className="group relative overflow-hidden rounded-2xl p-3 text-left transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.97] motion-reduce:transition-none motion-reduce:transform-none motion-reduce:hover:transform-none motion-reduce:active:transform-none"
                  style={{
                    background: `radial-gradient(90% 100% at 100% 0%, ${k.c}22, transparent 65%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.55) 100%)`,
                    border: `1px solid ${k.c}55`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 22px ${k.c}1f, 0 0 18px ${k.c}2a`,
                    backdropFilter: "blur(10px) saturate(140%)",
                    WebkitBackdropFilter: "blur(10px) saturate(140%)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-9 w-9 rounded-xl grid place-items-center"
                      style={{ background: `linear-gradient(135deg, ${k.c}33, ${k.accent}22)`, border: `1px solid ${k.c}66`, boxShadow: `0 0 10px ${k.c}55` }}>
                      <k.i className="h-4 w-4" style={{ color: k.c }} />
                    </div>
                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded"
                      style={{ background: `${k.accent}22`, color: k.accent, border: `1px solid ${k.accent}55` }}>
                      {k.tag}
                    </span>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-white/55 leading-none">{k.title}</div>
                  <div className="font-display font-black text-[20px] leading-tight mt-1 tabular-nums" style={{ color: k.c, textShadow: `0 0 8px ${k.c}55` }}>{k.metric}</div>
                  <div className="text-[11px] text-white/65 truncate mt-0.5">{k.sub}</div>
                </button>
              ))}
            </div>

            {/* ── LIVE AI SIGNALS ticker (full-width, compact) ── */}
            <div
              className="col-span-12 relative z-10 overflow-hidden rounded-[14px] h-[46px] flex items-center"
              style={{
                background: `linear-gradient(90deg, rgba(4,7,10,0.85) 0%, rgba(4,7,10,0.55) 100%)`,
                border: `1px solid ${EMERALD}44`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 18px ${EMERALD}22, 0 0 24px ${GOLD_HI}14`,
                backdropFilter: "blur(10px) saturate(140%)",
                WebkitBackdropFilter: "blur(10px) saturate(140%)",
              }}
            >
              <div className="shrink-0 flex items-center gap-2 pl-3.5 pr-3 h-full"
                style={{ background: `linear-gradient(90deg, ${EMERALD}26, transparent)`, borderRight: `1px solid ${EMERALD}44` }}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full animate-ping motion-reduce:animate-none" style={{ background: EMERALD_HI, opacity: 0.75 }} />
                  <span className="relative rounded-full h-2 w-2" style={{ background: EMERALD_HI, boxShadow: `0 0 8px ${EMERALD_HI}` }} />
                </span>
                <span className="text-[10px] font-black tracking-[0.2em]" style={{ color: EMERALD_HI, textShadow: `0 0 6px ${EMERALD}88` }}>LIVE AI</span>
              </div>
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
                      <div className="flex items-center gap-6 pl-6 pr-6 text-[12px] font-semibold tabular-nums">
                        {signals.map((s, i) => (
                          <span key={i} className="flex items-center gap-2">
                            <span className="text-white/45">•</span>
                            <span style={{ color: s.c, textShadow: `0 0 6px ${s.c}66` }}>{s.t}</span>
                          </span>
                        ))}
                      </div>
                    );
                    return <>{row}{row}</>;
                  })()}
                </div>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-8" style={{ background: "linear-gradient(90deg, rgba(4,7,10,0.9), transparent)" }} />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-8" style={{ background: "linear-gradient(-90deg, rgba(4,7,10,0.9), transparent)" }} />
              </div>
            </div>
          </div>
          </div>

        </Row>




        {/* ═══ S6 · SMART FINANCE HUB ═══ */}
        <Row id="home-finance-hub" title="Smart Finance Hub" sub="Trade & track your assets" cta={{ label: "Open Wallet", to: "/wallet" }}>
          <div className="grid grid-cols-8 gap-2">
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
                  className={`${glass} p-3 flex flex-col items-center gap-1 hover:-translate-y-0.5 transition`}
                  style={{ borderColor: `${c.col}44` }}>
                  <div className="text-[12px] font-bold" style={{ color: c.col }}>{c.s}</div>
                  <div className="text-[13px] tabular-nums text-white/85">{c.p}</div>
                  <div className="text-[10px] tabular-nums" style={{ color: up ? EMERALD_HI : RED }}>{c.c}</div>
                </button>
              );
            })}
          </div>
          {/* Compact Finance tiles — info-rich · neon-glow · Ultra Pro Max 2026 */}
          <div className="grid grid-cols-4 gap-3">
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
                  className="group relative overflow-hidden rounded-2xl min-h-[102px] p-3 flex flex-col text-left backdrop-blur-xl hover:-translate-y-0.5 transition"
                  style={{
                    background: `linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.012))`,
                    border: `1px solid ${f.c}66`,
                    boxShadow: `0 0 0 1px ${f.c}22, 0 0 26px -6px ${f.c}88, inset 0 1px 0 rgba(255,255,255,0.06)`,
                  }}
                >
                  <div aria-hidden className="pointer-events-none absolute inset-0"
                    style={{ background: `radial-gradient(120% 90% at 0% 0%, ${f.c}18, transparent 55%)` }} />
                  <div className="relative flex items-center gap-2">
                    <div className="h-7 w-7 rounded-[10px] grid place-items-center shrink-0"
                      style={{ background: `${f.c}22`, border: `1px solid ${f.c}66`, boxShadow: `0 0 12px ${f.c}55` }}>
                      <f.i className="h-3.5 w-3.5" style={{ color: f.c }} />
                    </div>
                    <div className="font-display font-bold text-[13px] leading-none text-white/90">{f.title}</div>
                  </div>
                  <div className="relative mt-2 flex items-baseline justify-between gap-2">
                    <div className="text-[10px] uppercase tracking-wider text-white/45 leading-none">{f.primary.label}</div>
                    <div className="font-display font-black text-[17px] leading-none tabular-nums" style={{ color: f.c, textShadow: `0 0 12px ${f.c}55` }}>
                      {f.primary.value}
                    </div>
                  </div>
                  <div className="relative mt-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-1 min-w-0">
                      <span className="text-[10px] text-white/45 leading-none">{f.secondary.label}</span>
                      <span className="text-[11.5px] font-bold leading-none tabular-nums"
                        style={{ color: "up" in f.secondary && f.secondary.up ? EMERALD_HI : f.c }}>
                        {f.secondary.value}
                      </span>
                    </div>
                    {f.chart === "bars" && (
                      <div className="flex items-end gap-[3px] h-4">
                        {[38, 62, 48, 78, 58, 92].map((h, i) => (
                          <span key={i} className="w-[3.5px] rounded-sm" style={{ height: `${h}%`, background: f.c, boxShadow: `0 0 5px ${f.c}` }} />
                        ))}
                      </div>
                    )}
                    {f.chart === "line" && (
                      <svg viewBox="0 0 60 16" className="h-4 w-16" preserveAspectRatio="none" aria-hidden>
                        <polyline points="0,12 10,9 20,11 30,6 40,7 50,3 60,4" fill="none" stroke={f.c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                          style={{ filter: `drop-shadow(0 0 4px ${f.c})` }} />
                      </svg>
                    )}
                    {f.chart === "accuracy" && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md leading-none tabular-nums"
                        style={{ background: `${f.c}22`, color: f.c, border: `1px solid ${f.c}66`, boxShadow: `0 0 8px ${f.c}55` }}>
                        94% WIN
                      </span>
                    )}
                    {f.chart === "wallet-actions" && (
                      <div className="flex items-center gap-1.5">
                        <span
                          role="button" tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); navigate("/deposit"); }}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); navigate("/deposit"); } }}
                          aria-label="Deposit"
                          className="inline-flex items-center justify-center h-6 w-6 rounded-[7px] cursor-pointer"
                          style={{ background: `linear-gradient(135deg, ${f.c}, ${f.c}cc)`, color: "#04120a", boxShadow: `0 0 10px ${f.c}88, inset 0 1px 0 rgba(255,255,255,0.4)` }}>
                          <ArrowDownToLine className="h-3.5 w-3.5" />
                        </span>
                        <span
                          role="button" tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); navigate("/withdraw"); }}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); navigate("/withdraw"); } }}
                          aria-label="Withdraw"
                          className="inline-flex items-center justify-center h-6 w-6 rounded-[7px] cursor-pointer"
                          style={{ background: `${f.c}18`, color: f.c, border: `1px solid ${f.c}66`, boxShadow: `0 0 8px ${f.c}55` }}>
                          <ArrowUpFromLine className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    )}


                  </div>
                </button>
              ));
            })()}
          </div>

        </Row>

        {/* ═══ S7 · VIP CLUB — PREMIUM ULTRA PRO MAX 2026 ═══ */}
        <Row id="home-vip-club" title="VIP Club" sub="Luxury membership · exclusive perks" cta={{ label: "Enter VIP Club", to: "/vip" }}>
          {/* Hero Card */}
          <button onClick={() => navigate("/vip")}
            className="w-full relative overflow-hidden rounded-[22px] p-5 text-left"
            style={{
              background: `linear-gradient(135deg, #150b02 0%, #241704 40%, #0a0703 100%)`,
              border: `1.5px solid ${GOLD}88`,
              boxShadow: `0 26px 60px -22px ${GOLD_DEEP}, 0 0 44px -10px ${GOLD}77, inset 0 1px 0 rgba(255,255,255,0.09), inset 0 0 60px -22px ${GOLD}66`,
            }}>
            <div aria-hidden className="pointer-events-none absolute inset-0"
              style={{ background: `radial-gradient(50% 90% at 100% 0%, ${GOLD}30, transparent 65%), radial-gradient(50% 90% at 0% 100%, ${PURPLE}22, transparent 70%), radial-gradient(60% 60% at 50% 50%, ${EMERALD}12, transparent 75%)` }} />
            {/* Decorative premium gem accents */}
            <Diamond aria-hidden className="pointer-events-none absolute top-3 right-3 h-5 w-5 opacity-85" style={{ color: GOLD_HI, filter: `drop-shadow(0 0 8px ${GOLD}cc)` }} />
            <Sparkles aria-hidden className="pointer-events-none absolute top-4 right-9 h-4 w-4 opacity-75" style={{ color: "#F59E0B" }} />



            <div className="relative z-10 flex items-center gap-4">
              <div className="crown-shine relative h-16 w-16 rounded-2xl grid place-items-center shrink-0 overflow-hidden"
                style={{ background: `linear-gradient(140deg, ${GOLD_HI} 0%, #F59E0B 50%, ${GOLD_DEEP} 100%)`, boxShadow: `0 0 26px ${GOLD}cc, inset 0 1px 0 rgba(255,255,255,0.55)` }}>
                {/* Premium VIP ring — subtle rotating conic glow */}
                <span aria-hidden className="pointer-events-none absolute -inset-[2px] rounded-2xl opacity-70"
                  style={{ background: `conic-gradient(from 0deg, ${GOLD_HI}, transparent 40%, ${GOLD_HI}88 70%, transparent)`, animation: "vip-ring-spin 6s linear infinite", filter: "blur(1px)" }} />
                <span aria-hidden className="absolute inset-[2px] rounded-[14px]"
                  style={{ background: `linear-gradient(140deg, ${GOLD_HI} 0%, #F59E0B 50%, ${GOLD_DEEP} 100%)` }} />
                <Crown className="h-8 w-8 text-black relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]" strokeWidth={2.4} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-black text-[19px] leading-none" style={{ color: GOLD_HI, textShadow: `0 0 14px ${GOLD}66` }}>
                    VIP {vipLevel} Diamond
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-[0.14em] leading-none inline-flex items-center gap-1"
                    style={{ background: `${GOLD}22`, color: GOLD_HI, border: `1px solid ${GOLD}66` }}>
                    <BadgeCheck className="h-3 w-3" /> Elite Member
                  </span>

                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[12px] text-white/60">Next VIP {vipLevel + 1}</span>
                  <span className="text-[12px] font-bold tabular-nums" style={{ color: "#F59E0B" }}>72% Complete</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full relative overflow-hidden" style={{ width: "72%", background: `linear-gradient(90deg, ${GOLD_HI}, #F59E0B 55%, ${GOLD_DEEP})`, boxShadow: `0 0 12px ${GOLD}bb` }}>
                    <div aria-hidden className="absolute inset-y-0 -inset-x-4 opacity-70"
                      style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)`, animation: "aiSignalsMarquee 2.4s linear infinite" }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap max-w-[380px] justify-end">
                {[
                  { i: Percent,  l: "5% Cashback", c: EMERALD_HI },
                  { i: Gift,     l: "৳2,500/mo",   c: "#F59E0B"  },
                  { i: Headset,  l: "Priority",    c: PURPLE     },
                  { i: Sparkles, l: "Draws",       c: GOLD_HI    },
                ].map((p) => (
                  <span key={p.l}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 border backdrop-blur-md"
                    style={{ borderColor: `${p.c}55`, background: `linear-gradient(135deg, ${p.c}1c, ${p.c}08)` }}>
                    <p.i className="h-3 w-3" style={{ color: p.c }} />
                    <span className="text-[11px] font-semibold" style={{ color: p.c }}>{p.l}</span>
                  </span>
                ))}
              </div>
              <ChevronRight className="h-5 w-5 text-white/60 shrink-0" />
            </div>
          </button>

          <div className="grid grid-cols-12 gap-3">
            {/* Rewards mini cards — 4 */}
            <div className="col-span-5 grid grid-cols-4 gap-2">
              {[
                { i: Gift,    t: "Daily",    s: "Reward",  c: EMERALD_HI, to: "/activity" },
                { i: Diamond, t: "Cashback", s: "Weekly",  c: BLUE,       to: "/vip" },
                { i: Trophy,  t: "Achieve",  s: "12/40",   c: GOLD_HI,    to: "/activity" },
                { i: Ticket,  t: "Gift Code",s: "Redeem",  c: PURPLE,     to: "/activity" },
              ].map((r) => (
                <button key={r.t} onClick={() => navigate(r.to)}
                  className="relative overflow-hidden rounded-[14px] p-2.5 flex flex-col items-center gap-1 text-center backdrop-blur-xl hover:-translate-y-0.5 transition"
                  style={{
                    background: `linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))`,
                    border: `1px solid ${r.c}55`,
                    boxShadow: `0 0 22px -8px ${r.c}99, inset 0 1px 0 rgba(255,255,255,0.06)`,
                  }}>
                  <div className="h-8 w-8 rounded-[10px] grid place-items-center"
                    style={{ background: `${r.c}22`, border: `1px solid ${r.c}66`, boxShadow: `0 0 12px ${r.c}66` }}>
                    <r.i className="h-4 w-4" style={{ color: r.c }} />
                  </div>
                  <div className="font-display font-bold text-[11px] leading-none" style={{ color: r.c }}>{r.t}</div>
                  <div className="text-[9.5px] leading-none text-white/55">{r.s}</div>
                </button>
              ))}
            </div>

            {/* Live Reward Ticker */}
            <div className="col-span-7 relative overflow-hidden rounded-[14px] h-[46px] flex items-center backdrop-blur-xl"
              style={{
                background: `linear-gradient(90deg, rgba(10,7,3,0.85), rgba(20,14,4,0.75))`,
                border: `1px solid ${GOLD}55`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 26px -10px ${GOLD}88`,
              }}>
              <div className="shrink-0 flex items-center gap-2 pl-3 pr-2.5 h-full">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full animate-ping" style={{ background: EMERALD_HI, opacity: 0.7 }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: EMERALD_HI, boxShadow: `0 0 10px ${EMERALD_HI}` }} />
                </span>
                <span className="text-[10px] font-black tracking-[0.18em]" style={{ color: EMERALD_HI, textShadow: `0 0 10px ${EMERALD_HI}88` }}>LIVE REWARDS</span>
              </div>
              <div className="flex-1 overflow-hidden relative"
                style={{ maskImage: "linear-gradient(90deg, transparent, black 4%, black 96%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, black 4%, black 96%, transparent)" }}>
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
                      <span key={i} className="inline-flex items-center gap-1.5 px-4 text-[12px]">
                        <Sparkles className="h-3 w-3" style={{ color: it.c }} />
                        <span className="font-bold" style={{ color: it.c }}>{it.u}</span>
                        <span className="text-white/70">{it.a}</span>
                        <span className="text-white/25">•</span>
                      </span>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        </Row>



        {/* ═══ S8 · REWARDS CENTRE — Final Premium (LOCKED v2.0) ═══ */}
        <Row id="home-rewards" title="Rewards Centre" sub="Tasks · missions · challenges" cta={{ label: "View All", to: "/activity" }}>
          {/* TOP — Live Rewards Ticker */}
          <LiveRewardsTicker
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

          {/* MIDDLE — 3×2 Premium Reward Grid */}
          <div className="mt-3 grid grid-cols-3 gap-3">
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
                  className="relative overflow-hidden rounded-[14px] p-3 flex flex-col gap-2 backdrop-blur-xl hover:-translate-y-0.5 transition text-left"
                  style={{
                    background: `linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))`,
                    border: `1px solid ${r.c}55`,
                    boxShadow: `0 0 22px -8px ${r.c}99, inset 0 1px 0 rgba(255,255,255,0.06)`,
                  }}>
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-[10px] grid place-items-center shrink-0"
                      style={{ background: `${r.c}22`, border: `1px solid ${r.c}66`, boxShadow: `0 0 12px ${r.c}66` }}>
                      <r.i className="h-4.5 w-4.5" style={{ color: r.c }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-bold text-[13px] leading-tight truncate" style={{ color: r.c }}>{r.t}</div>
                      <div className="text-[10.5px] leading-tight text-white/55 truncate">{r.s}</div>
                    </div>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full" style={{ width: `${r.p}%`, background: `linear-gradient(90deg, ${r.c}, ${r.c}cc)`, boxShadow: `0 0 6px ${r.c}` }} />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-display font-black text-[13px] tabular-nums" style={{ color: r.c }}>{r.r}</span>
                    <span className="px-2 h-[22px] rounded-[7px] flex items-center text-[10px] font-black tracking-wide"
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
            className="mt-3 relative overflow-hidden rounded-[14px] h-[56px] w-full flex items-center justify-center gap-2.5 hover:-translate-y-0.5 transition"
            style={{
              background: `linear-gradient(90deg, ${GOLD_DEEP}, ${PURPLE}, ${EMERALD_HI})`,
              border: `1px solid ${GOLD_HI}66`,
              boxShadow: `0 0 26px -6px ${GOLD_HI}aa, inset 0 1px 0 rgba(255,255,255,0.18)`,
            }}>
            <span className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 20% 50%, ${GOLD_HI}55, transparent 60%), radial-gradient(circle at 80% 50%, ${EMERALD_HI}55, transparent 60%)` }} />
            <Sparkles className="h-5 w-5 relative text-white" />
            <span className="relative font-display font-black text-[15px] tracking-wide text-white">OPEN REWARDS CENTRE</span>
            <ChevronRight className="h-5 w-5 relative text-white" />
          </button>
        </Row>

        {/* ═══ S9 · PROMOTIONS HUB — Final Premium (LOCKED v1.0) ═══ */}
        <Row id="home-promotions" title="Promotions Hub" sub="Bonuses · draws · events · campaigns" cta={{ label: "View All", to: "/promotions" }}>
          {/* Live Promotions Ticker */}
          <LiveRewardsTicker
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
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[
              {
                t: "Welcome Bonus", s: "Up to ৳50,000", i: Gift,
                accent: GOLD_HI,
                bg: `linear-gradient(140deg, #2a1c05 0%, #120a01 60%, #050505 100%)`,
                glow: `0 0 34px -8px ${GOLD_HI}aa, inset 0 0 34px -20px ${GOLD_HI}88`,
                ends: Date.now() + 3 * 86_400_000 + 4 * 3_600_000,
              },
              {
                t: "Lucky Draw", s: "Weekly Mega Draw · ৳2.5L Pool", i: Star,
                accent: PURPLE,
                bg: `linear-gradient(140deg, #1a0d2e 0%, #0c0616 60%, #050505 100%)`,
                glow: `0 0 34px -8px ${PURPLE}aa, inset 0 0 34px -20px ${PURPLE}88`,
                ends: Date.now() + 5 * 86_400_000 + 12 * 3_600_000,
              },
            ].map((p) => (
              <button key={p.t} onClick={() => navigate("/promotions")}
                className="relative overflow-hidden rounded-[18px] p-5 flex flex-col gap-3 text-left backdrop-blur-xl hover:-translate-y-0.5 transition"
                style={{ background: p.bg, border: `1px solid ${p.accent}66`, boxShadow: p.glow }}>
                <span className="absolute top-3 right-3 px-2 h-[20px] rounded-[6px] flex items-center gap-1 text-[10px] font-black tracking-wider"
                  style={{ background: `${p.accent}22`, color: p.accent, border: `1px solid ${p.accent}66`, boxShadow: `0 0 10px ${p.accent}55` }}>
                  <Flame className="h-3 w-3" /> LIMITED
                </span>
                <span className="absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-40 blur-3xl" style={{ background: p.accent }} />

                <div className="h-11 w-11 rounded-[12px] grid place-items-center"
                  style={{ background: `${p.accent}22`, border: `1px solid ${p.accent}66`, boxShadow: `0 0 14px ${p.accent}66` }}>
                  <p.i className="h-5 w-5" style={{ color: p.accent }} />
                </div>
                <div>
                  <div className="font-display font-black text-[18px] leading-tight" style={{ color: p.accent }}>{p.t}</div>
                  <div className="font-display font-bold text-[13px] text-white/85 leading-tight mt-0.5">{p.s}</div>
                </div>
                <div className="mt-auto">
                  <div className="text-[10px] uppercase tracking-widest text-white/45 mb-1.5">Ends in</div>
                  <PromoCountdown targetMs={p.ends} color={p.accent} size="md" />
                </div>
              </button>
            ))}
          </div>

          {/* Bottom Row — 2 Compact Cards */}
          {/* Second Row — 4 Compact Promotion Cards */}
          <div className="mt-3 grid grid-cols-4 gap-3">
            {[
              { i: Calendar, t: "Event Center",    s: "Seasonal Events",    c: EMERALD_HI, tag: "LIVE" },
              { i: Rocket,   t: "Campaign Center", s: "Refer & Earn",       c: CYAN,       tag: "NEW"  },
              { i: Gift,     t: "Special Offers",  s: "Limited Promotions", c: ORANGE,     tag: "HOT"  },
              { i: Crown,    t: "VIP Events",      s: "Exclusive Rewards",  c: GOLD_HI,    tag: "VIP"  },
            ].map((p) => (
              <button key={p.t} onClick={() => navigate("/promotions")}
                className="relative overflow-hidden rounded-[14px] p-3 flex items-center gap-2.5 text-left backdrop-blur-xl hover:-translate-y-0.5 transition"
                style={{
                  background: `linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))`,
                  border: `1px solid ${p.c}55`,
                  boxShadow: `0 0 22px -8px ${p.c}99, inset 0 1px 0 rgba(255,255,255,0.06)`,
                }}>
                <div className="h-9 w-9 rounded-[10px] grid place-items-center shrink-0"
                  style={{ background: `${p.c}22`, border: `1px solid ${p.c}66`, boxShadow: `0 0 12px ${p.c}66` }}>
                  <p.i className="h-4.5 w-4.5" style={{ color: p.c }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-bold text-[13px] leading-tight truncate" style={{ color: p.c }}>{p.t}</div>
                  <div className="text-[10.5px] leading-tight text-white/55 truncate">{p.s}</div>
                </div>
                <span className="px-1.5 h-[18px] rounded-[6px] flex items-center text-[9.5px] font-black tracking-wider"
                  style={{ background: `${p.c}22`, color: p.c, border: `1px solid ${p.c}66` }}>
                  {p.tag}
                </span>
              </button>
            ))}
          </div>

          {/* Limited Offer Bar */}
          <div className="mt-3 relative overflow-hidden rounded-[14px] p-3 flex items-center gap-3 backdrop-blur-xl"
            style={{
              background: `linear-gradient(90deg, rgba(42,20,4,0.9), rgba(28,10,4,0.85))`,
              border: `1px solid ${ORANGE}66`,
              boxShadow: `0 0 24px -8px ${ORANGE}99, inset 0 1px 0 rgba(255,255,255,0.06)`,
            }}>
            <span className="absolute -top-6 -left-6 h-16 w-16 rounded-full opacity-30 blur-3xl" style={{ background: ORANGE }} />
            <div className="relative shrink-0 h-9 w-9 rounded-[10px] grid place-items-center"
              style={{ background: `${ORANGE}22`, border: `1px solid ${ORANGE}66`, boxShadow: `0 0 12px ${ORANGE}66` }}>
              <Zap className="h-4.5 w-4.5" style={{ color: ORANGE }} />
            </div>
            <div className="relative min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-widest font-black" style={{ color: ORANGE }}>Limited Time Offer</div>
              <div className="mt-1"><PromoCountdown targetMs={Date.now() + 23 * 3_600_000 + 15 * 60_000 + 8_000} color={ORANGE} size="md" /></div>
            </div>
            <button onClick={() => navigate("/promotions")}
              className="relative shrink-0 h-9 px-4 rounded-[10px] font-display font-black text-[12px] tracking-wide hover:scale-[1.02] active:scale-95 transition"
              style={{
                background: `linear-gradient(135deg, ${ORANGE}, #F59E0B)`,
                color: "#000",
                border: `1px solid ${ORANGE}`,
                boxShadow: `0 0 14px ${ORANGE}88`,
              }}>
              CLAIM NOW
            </button>
          </div>

          {/* Bottom CTA */}
          <button onClick={() => navigate("/promotions")}
            className="mt-3 relative overflow-hidden rounded-[14px] h-[56px] w-full flex items-center justify-center gap-2.5 hover:-translate-y-0.5 transition"
            style={{
              background: `linear-gradient(90deg, ${GOLD_DEEP}, ${PURPLE}, ${EMERALD_HI})`,
              border: `1px solid ${GOLD_HI}66`,
              boxShadow: `0 0 26px -6px ${GOLD_HI}aa, inset 0 1px 0 rgba(255,255,255,0.18)`,
            }}>
            <span className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 20% 50%, ${GOLD_HI}55, transparent 60%), radial-gradient(circle at 80% 50%, ${EMERALD_HI}55, transparent 60%)` }} />
            <Sparkles className="h-5 w-5 relative text-white" />
            <span className="relative font-display font-black text-[15px] tracking-wide text-white">EXPLORE ALL PROMOTIONS</span>
            <ChevronRight className="h-5 w-5 relative text-white" />
          </button>
        </Row>

        {/* ═══ S10 · TRUST ECOSYSTEM — FINAL CLOSING (LOCKED v2.0) ═══ */}
        <Row id="home-trust-center" title="Trust Ecosystem" sub="The billion-dollar closing · Secured by GoLucky infrastructure">
          {/* ── HERO ── */}
          <div
            className={`${glass} relative overflow-hidden p-5`}
            style={{ borderColor: `${GOLD}55`, boxShadow: `0 24px 80px -20px ${GOLD}44, 0 0 100px -40px ${EMERALD}55` }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-70">
              <div className="absolute -top-16 -left-12 h-48 w-48 rounded-full blur-3xl animate-pulse" style={{ background: `${GOLD}44` }} />
              <div className="absolute -bottom-16 -right-10 h-52 w-52 rounded-full blur-3xl animate-pulse" style={{ background: `${EMERALD}44`, animationDelay: "0.8s" }} />
              <div className="absolute top-1/2 left-1/2 h-40 w-40 rounded-full blur-3xl animate-pulse" style={{ background: `${BLUE}44`, animationDelay: "1.4s" }} />
            </div>

            <div className="relative flex items-center gap-4 mb-4">
              <div className="relative h-14 w-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${GOLD}33, ${EMERALD}33)`, border: `1px solid ${GOLD}66`, boxShadow: `0 0 30px ${GOLD}55` }}>
                <ShieldCheck className="h-8 w-8 animate-pulse" style={{ color: GOLD_HI, filter: `drop-shadow(0 0 12px ${GOLD})` }} />
                <span className="absolute inset-0 rounded-2xl animate-ping opacity-30" style={{ border: `1px solid ${GOLD}` }} />
              </div>
              <div className="min-w-0">
                <div className="font-display font-black text-[22px] leading-tight bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(90deg, ${GOLD_HI}, #fff, ${EMERALD_HI})` }}>
                  GO LUCKY SECURE ECOSYSTEM
                </div>
                <div className="text-[11px] uppercase tracking-widest text-white/55 mt-0.5">
                  Trusted · Protected · Verified · Available 24/7
                </div>
              </div>
            </div>

            <div className="relative grid grid-cols-4 gap-2">
              {[
                { i: ShieldCheck, t: "256-bit SSL Security",   c: GOLD_HI },
                { i: Activity,    t: "99.9% Uptime",           c: EMERALD_HI },
                { i: Users,       t: "100K+ Members",          c: BLUE },
                { i: Globe,       t: "Global Infrastructure",  c: CYAN },
              ].map((m) => (
                <div key={m.t} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${m.c}33` }}>
                  <m.i className="h-4 w-4 shrink-0" style={{ color: m.c, filter: `drop-shadow(0 0 8px ${m.c})` }} />
                  <span className="text-[12px] font-bold truncate" style={{ color: m.c }}>{m.t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── STATS ── */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { l: "Security Score", v: "98.9%",       c: GOLD_HI },
              { l: "Trust Score",    v: "9.8/10",      c: BLUE },
              { l: "Support Status", v: "ONLINE",      c: EMERALD_HI },
              { l: "System Status",  v: "OPERATIONAL", c: EMERALD_HI },
            ].map((s) => (
              <div key={s.l} className={`${glass} p-3 text-center`} style={{ borderColor: `${s.c}44` }}>
                <div className="text-[10px] uppercase tracking-widest text-white/50 mb-1">{s.l}</div>
                <div className="font-display font-black text-[16px]" style={{ color: s.c, textShadow: `0 0 16px ${s.c}66` }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* ── OFFICIAL VERIFIED DOMAINS TICKER (full-width marquee) ── */}
          <VerifiedDomainsTicker />

          {/* ── SUPPORT HUB ── */}
          <div className="grid grid-cols-1 gap-3">


            <div className={`${glass} p-3`} style={{ borderColor: `${BLUE}44` }}>
              <div className="flex items-center gap-2 mb-2">
                <Headset className="h-4 w-4" style={{ color: BLUE }} />
                <div className="text-[11px] font-black uppercase tracking-widest" style={{ color: BLUE }}>24/7 Support Hub</div>
                <div className="flex-1" />
                <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: EMERALD_HI }}>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-70" style={{ background: EMERALD }} />
                    <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: EMERALD_HI }} />
                  </span>
                  58 Agents Online
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
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
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-[11px] transition hover:-translate-y-0.5 active:scale-95"
                    style={{ background: `${b.c}18`, color: b.c, border: `1px solid ${b.c}55` }}
                  >
                    <b.i className="h-3.5 w-3.5" /> {b.l}
                  </button>
                ))}

              </div>
            </div>
          </div>

          {/* ── BOTTOM HERO CTA ── */}
          <div className="space-y-2">
            <div className="text-center text-[11px] uppercase tracking-[0.5em] font-black" style={{ color: GOLD_HI }}>
              PLAY • INVEST • EARN
            </div>
            <div
              className="relative w-full rounded-2xl overflow-hidden p-[1.5px]"
              style={{
                background: `linear-gradient(135deg, ${GOLD} 0%, #f5c15b 40%, ${EMERALD} 100%)`,
                boxShadow: `0 16px 50px ${GOLD}66, 0 0 80px ${EMERALD}33`,
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
                    className={`relative py-3.5 font-display font-black text-[14px] tracking-[0.3em] text-white transition hover:-translate-y-0.5 active:scale-[0.98] ${i > 0 ? "border-l border-white/10" : ""}`}
                  >
                    <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 50% 50%, ${seg.c}66, transparent 70%)` }} />
                    <span className="relative">{seg.l}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => navigate("/home")}
              className="relative w-full py-4 rounded-2xl overflow-hidden font-display font-black text-[16px] tracking-[0.35em] text-black transition hover:-translate-y-0.5 active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${GOLD_HI} 0%, #ffd97a 50%, ${GOLD} 100%)`,
                boxShadow: `0 20px 60px ${GOLD}77, inset 0 1px 0 rgba(255,255,255,0.5)`,
              }}
            >
              <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 30% 50%, #fff8, transparent 60%)` }} />
              <span className="relative inline-flex items-center justify-center gap-2.5">
                <Sparkles className="h-5 w-5" /> ENTER GOLUCKY ECOSYSTEM <ArrowRight className="h-5 w-5" />
              </span>
            </button>
          </div>
        </Row>



        {/* ═══ S11 · COMING SOON — API GAME EXPANSION (LOCKED v1.0) ═══ */}
        <Row id="home-future-expansion" title="Coming Soon" sub="Future API Game Expansion Zone">
          <div className="grid grid-cols-4 gap-3">
            {[
              { i: Cpu,    t: "API Games",    s: "20,000+ games ready",    c: GOLD_HI },
              { i: Trophy, t: "Live Sports",  s: "Cricket · Football",     c: BLUE },
              { i: Award,  t: "Tournament",   s: "Prize pools ৳1Cr+",      c: PURPLE },
              { i: Layers, t: "Provider Hub", s: "Multi-game integration", c: EMERALD_HI },
            ].map((c) => (
              <div
                key={c.t}
                className={`${glass} relative overflow-hidden p-4`}
                style={{ borderColor: `${c.c}55`, boxShadow: `0 12px 32px -14px ${c.c}66` }}
              >
                <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-60" style={{ background: `${c.c}55` }} />
                <div className="relative flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${c.c}22`, border: `1px solid ${c.c}66`, boxShadow: `0 0 18px ${c.c}44` }}>
                    <c.i className="h-5 w-5" style={{ color: c.c, filter: `drop-shadow(0 0 8px ${c.c})` }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-display font-black text-[14px] leading-tight truncate">{c.t}</div>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md" style={{ background: `${c.c}22`, color: c.c, border: `1px solid ${c.c}66` }}>SOON</span>
                    </div>
                    <div className="text-[11px] text-white/60 mt-1 truncate">{c.s}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/support")}
            className="relative w-full py-3 rounded-xl overflow-hidden font-display font-black text-[13px] tracking-[0.32em] text-white flex items-center justify-center gap-2.5 transition hover:-translate-y-0.5 active:scale-[0.99]"
            style={{
              background: `linear-gradient(135deg, ${GOLD}22, ${PURPLE}22, ${BLUE}22)`,
              border: `1px solid ${GOLD}55`,
              boxShadow: `0 14px 40px -14px ${PURPLE}88`,
            }}
          >
            <Sparkles className="h-4 w-4" style={{ color: GOLD_HI }} />
            REQUEST GAME ACCESS
            <ArrowRight className="h-4 w-4" style={{ color: GOLD_HI }} />
          </button>
        </Row>

        {/* ═══ S12 · ABOUT GOLUCKY (LOCKED v2.0 — Next Gen Ecosystem) ═══ */}
        <Row id="home-about" title="About GoLucky" sub="The Next Generation Play • Invest • Earn Ecosystem">
          <div className={`${glass} relative overflow-hidden p-6`} style={{ borderColor: `${GOLD}44`, boxShadow: `0 20px 50px -20px ${GOLD}55` }}>
            <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full blur-3xl opacity-50" style={{ background: `${GOLD}66` }} />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full blur-3xl opacity-40" style={{ background: `${EMERALD}66` }} />

            {/* Stats row */}
            <div className="relative grid grid-cols-4 gap-3 mb-5">
              {[
                { v: "20K+",  l: "Games",     c: GOLD_HI },
                { v: "50+",   l: "Providers", c: EMERALD_HI },
                { v: "24/7",  l: "Support",   c: BLUE },
                { v: "99.9%", l: "Uptime",    c: PURPLE },
              ].map((s) => (
                <div
                  key={s.l}
                  className="relative overflow-hidden rounded-xl px-4 py-3 flex items-center gap-2.5 transition-all duration-300 hover:-translate-y-0.5"
                  style={{ background: `${s.c}12`, border: `1px solid ${s.c}44`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06)` }}
                >
                  <div className="font-display font-black text-[22px] leading-none" style={{ color: s.c, filter: `drop-shadow(0 0 8px ${s.c}88)` }}>{s.v}</div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-white/60">{s.l}</div>
                </div>
              ))}
            </div>

            {/* Verified domains marquee */}
            <div
              className="relative overflow-hidden rounded-xl mb-4"
              style={{
                background: "linear-gradient(180deg, rgba(20,14,4,0.7), rgba(10,10,18,0.7))",
                border: `1px solid ${GOLD}55`,
                padding: "8px 14px",
              }}
              aria-label="Official verified domains"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: GOLD_HI, filter: `drop-shadow(0 0 6px ${GOLD})` }} />
                <div className="relative flex-1 overflow-hidden">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6" style={{ background: "linear-gradient(90deg, rgba(10,10,18,0.9), transparent)" }} />
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6" style={{ background: "linear-gradient(-90deg, rgba(10,10,18,0.9), transparent)" }} />
                  <div
                    className="flex whitespace-nowrap animate-marquee will-change-transform motion-reduce:animate-none gap-6"
                    style={{ animationDuration: "42s" }}
                    aria-hidden="true"
                  >
                    {[
                      "goinglucky.com","golucky01.com","goluckyapp.net","go-lucky-bd.com","goluckybd.com","goluckyofficial.com",
                      "goluckyonline.com","goluckyprime.com","golucky.vip","golucky.win","goluckyzone.com",
                      "goinglucky.com","golucky01.com","goluckyapp.net","go-lucky-bd.com","goluckybd.com","goluckyofficial.com",
                      "goluckyonline.com","goluckyprime.com","golucky.vip","golucky.win","goluckyzone.com",
                    ].map((d, i) => (
                      <span key={`${d}-${i}`} className="font-mono font-bold text-[12px] shrink-0" style={{ color: GOLD_HI, textShadow: `0 0 8px ${GOLD}44` }}>
                        {d}<span style={{ color: `${GOLD}66`, margin: "0 8px" }}>•</span>
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  className="shrink-0 font-black rounded-md flex items-center gap-1 animate-pulse text-[10px] px-2 py-0.5"
                  style={{ background: `${EMERALD}22`, color: EMERALD_HI, border: `1px solid ${EMERALD}66` }}
                >
                  <BadgeCheck className="h-3 w-3" /> VERIFIED ✓
                </span>
              </div>
            </div>

            <div className="relative grid grid-cols-12 gap-6 items-center">
              <div className="col-span-5">
                <p className="text-[13px] leading-relaxed text-white/70">
                  GoLucky is a next generation digital ecosystem combining entertainment, rewards, finance tools, community programs and future innovation under one platform.
                </p>
              </div>

              <div className="col-span-4 grid grid-cols-2 gap-x-3 gap-y-1.5">
                {[
                  { i: Users,     t: "100K+ Members",   c: GOLD_HI },
                  { i: Headset,   t: "24/7 Support",    c: EMERALD_HI },
                  { i: Lock,      t: "Secure Wallet",   c: BLUE },
                  { i: Gamepad2,  t: "Premium Games",   c: GOLD_HI },
                  { i: Handshake, t: "Agent Programme", c: EMERALD_HI },
                  { i: Crown,     t: "VIP Rewards",     c: PURPLE },
                ].map((f) => (
                  <div key={f.t} className="flex items-center gap-1.5">
                    <f.i className="h-3.5 w-3.5 shrink-0" style={{ color: f.c, filter: `drop-shadow(0 0 5px ${f.c})` }} />
                    <span className="text-[11.5px] text-white/80 truncate">{f.t}</span>
                  </div>
                ))}
              </div>

              <div className="col-span-3">
                <button
                  onClick={() => navigate("/home")}
                  className="group relative w-full py-3.5 rounded-xl overflow-hidden font-display font-black text-[13px] tracking-[0.26em] text-black flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:tracking-[0.3em] active:scale-[0.97]"
                  style={{
                    background: `linear-gradient(135deg, ${GOLD_HI} 0%, #ffd97a 45%, ${GOLD} 100%)`,
                    boxShadow: `0 16px 36px -10px ${GOLD}99, 0 0 28px ${EMERALD}55`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 24px 52px -8px ${GOLD}cc, 0 0 40px ${EMERALD}77`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 16px 36px -10px ${GOLD}99, 0 0 28px ${EMERALD}55`; }}
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)" }} />
                  <span className="relative flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> JOIN GOLUCKY <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </Row>


        <div className="pt-4 pb-2 text-center text-[10px] text-white/30 uppercase tracking-[0.3em]">
          GoLucky · Play · Invest · Earn
        </div>
      </div>
    </div>
  );
};

export default HomeDesktop;
