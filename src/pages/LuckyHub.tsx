import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Vault, Trophy, Ticket, Sparkles, Crown, ChevronRight, ChevronLeft,
  Flame, Gem, Gift, Zap, CalendarCheck, Megaphone, Star,
  Coins, Rocket, PartyPopper, Handshake, Target, Timer,
  Award, BadgeDollarSign, Users, Play, Percent, ShieldCheck,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";

/* ═══════════════════════════════════════════════════════════════════════
   LUCKY HUB · FINAL v1.0 · PRODUCTION READY (2026)
   Structure locked. Only visual polish / perf / data-wiring allowed.
═══════════════════════════════════════════════════════════════════════ */
/* ─── Design tokens (mirrored from GamesPremium — Ultra Pro Max 2026) ─── */
const BG        = "#050505";
const GOLD      = "#FEC013";
const GOLD_HI   = "#FDE68A";
const GOLD_DEEP = "#B8862F";
const EMERALD   = "#12C665";
const BLUE      = "#02B4FA";
const PURPLE    = "#DA29FB";
const PINK      = "#EC4899";
const ORANGE    = "#F97316";

/* ─── Utilities ─── */
const bdt = (n: number) => {
  if (n >= 1e7) return `৳${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `৳${(n / 1e5).toFixed(2)} L`;
  if (n >= 1e3) return `৳${(n / 1e3).toFixed(1)} K`;
  return `৳${Math.round(n).toLocaleString("en-IN")}`;
};

/* ─── Reusable shell ─── */
function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-3xl border border-white/10 bg-white/[0.035] backdrop-blur-xl p-3 lg:p-4 ${className}`}
      style={{ boxShadow: "0 10px 40px -20px rgba(0,0,0,0.8)" }}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  eyebrow, title, cta, onCta, color = GOLD,
}: { eyebrow: string; title: string; cta?: string; onCta?: () => void; color?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/50 truncate">
          {eyebrow}
        </div>
        <h2 className="text-[15px] lg:text-[17px] font-black text-white truncate"
          style={{ textShadow: `0 0 20px ${color}22` }}>
          {title}
        </h2>
      </div>
      {cta && (
        <button
          onClick={onCta}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider transition-transform hover:scale-[1.04] active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#FEC013]"
          style={{
            color: GOLD_HI, borderColor: `${GOLD}55`,
            background: `${GOLD}18`, boxShadow: `0 6px 16px -10px ${GOLD}aa`,
          }}
          aria-label={`${cta} — ${title}`}
        >
          {cta} <ChevronRight className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/* ─── Ultra Premium 3D Glassmorphism Section Badge ─── */
function SectionBadge({
  title, sub, icon: Icon, accent = GOLD, secondary = PURPLE,
}: {
  title: string; sub: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string; secondary?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 sm:gap-3 rounded-2xl border p-2 sm:p-2.5 lg:p-3 relative overflow-hidden min-w-0 lh-hover-breathe"
      style={{
        borderColor: `${accent}55`,
        background:
          `radial-gradient(120% 90% at 0% 0%, ${accent}22, transparent 60%),` +
          `radial-gradient(90% 70% at 100% 100%, ${secondary}22, transparent 60%),` +
          `linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.35))`,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: `0 14px 34px -18px ${accent}aa, inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}
    >
      {/* Gold shine sweep overlay */}
      <span aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 lh-shine-sweep"
        style={{
          background: `linear-gradient(90deg, transparent, ${GOLD_HI}55, transparent)`,
          mixBlendMode: "overlay",
        }} />
      {/* Floating particles removed — performance cleanup (Final Polish Phase 2). */}


      <span aria-hidden="true"
        className="relative inline-flex h-9 w-9 sm:h-11 sm:w-11 lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border"
        style={{
          borderColor: `${accent}88`,
          background:
            `radial-gradient(80% 80% at 30% 20%, ${accent}55, ${secondary}33 60%, rgba(0,0,0,0.6))`,
          color: GOLD_HI,
          boxShadow:
            `0 10px 22px -8px ${accent}cc,` +
            `inset 0 1px 0 rgba(255,255,255,0.35),` +
            `inset 0 -6px 12px -6px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Radial glow pulse behind icon */}
        <span aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-xl sm:rounded-2xl lh-badge-glow"
          style={{ color: `${accent}55`, opacity: 0.6 }} />
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 relative z-10" />
        {/* Micro crown top-right */}
        <Crown aria-hidden="true"
          className="absolute -top-1 -right-1 h-2.5 w-2.5 lh-crown-bob z-10"
          style={{ color: GOLD_HI, filter: `drop-shadow(0 0 4px ${GOLD}cc)` }} />
        <span className="pointer-events-none absolute inset-0 rounded-xl sm:rounded-2xl"
          style={{ background: `linear-gradient(160deg, rgba(255,255,255,0.35), transparent 45%)` }} />
      </span>
      <div className="min-w-0 flex-1 relative z-10">
        <div className="text-[11px] sm:text-[13px] lg:text-[15px] font-black truncate leading-tight"
          style={{
            background: `linear-gradient(90deg, ${GOLD_HI}, ${accent}, ${GOLD_HI})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            textShadow: `0 0 18px ${accent}66`,
            letterSpacing: "0.1em",
          }}>
          {title}
        </div>
        <div className="text-[9.5px] sm:text-[10px] lg:text-[11px] text-white/65 truncate leading-tight mt-0.5">{sub}</div>
      </div>
      {/* Live indicator — dual ring ping */}
      <span aria-hidden="true"
        className="relative hidden sm:inline-flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border"
        style={{ color: accent, borderColor: `${accent}66`, background: `${accent}18` }}>
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inset-0 rounded-full lh-ping-ring" style={{ background: accent }} />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
        </span>
        Live
      </span>
      <span aria-hidden="true"
        className="relative sm:hidden shrink-0 inline-flex h-1.5 w-1.5">
        <span className="absolute inset-0 rounded-full lh-ping-ring" style={{ background: accent }} />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
      </span>
    </div>

  );
}



/* ═══════════════════════════════════════════════════════════════════════
   Section 1 · Premium Hero Slider
═══════════════════════════════════════════════════════════════════════ */
type Slide = {
  eyebrow: string; title: string; sub: string; cta: string;
  route: string; color: string; icon: React.ComponentType<{ className?: string }>;
};

const SLIDES: Slide[] = [
  { eyebrow: "Featured",        title: "Fixed Deposit Special",       sub: "Earn up to 24% APY on locked BDT",              cta: "Invest Now",   route: "#fixed-deposit",  color: EMERALD, icon: Vault },
  { eyebrow: "Live",            title: "Mega Jackpot Event",          sub: "Prize pool over ৳5 Cr — draws every night",     cta: "Play Jackpot", route: "#live-jackpot",   color: GOLD,    icon: Trophy },
  { eyebrow: "Lucky Draw",      title: "৳200 Ticket → ৳1 Cr+",         sub: "Buy a ticket. Change your life tonight.",       cta: "Buy Ticket",   route: "#lucky-draw",     color: PURPLE,  icon: Ticket },
  { eyebrow: "VIP Festival",    title: "L1 – L10 Reward Blast",        sub: "3× rebate + surprise vault drops all week",     cta: "Enter VIP",    route: "#vip-festival",   color: PINK,    icon: Crown },
  { eyebrow: "Agent Program",   title: "Build Your Empire",            sub: "Earn up to 60% lifetime team commission",       cta: "Become Agent", route: "#agent-program",  color: BLUE,    icon: Handshake },
  { eyebrow: "Cashback Fest",   title: "Cashback Festival",            sub: "Up to 15% cashback on every bet, every day",    cta: "Claim Now",    route: "#cashback-fest",  color: ORANGE,  icon: PartyPopper },
];

function HeroSlider() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const arm = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 5500);
  };
  useEffect(() => { arm(); return () => { if (timer.current) clearInterval(timer.current); }; }, []);

  const go = (delta: number) => { setI((v) => (v + delta + SLIDES.length) % SLIDES.length); arm(); };
  const s = SLIDES[i];
  const Icon = s.icon;

  return (
    <section
      aria-label="Premium featured offers"
      className="relative overflow-hidden rounded-3xl border border-white/10"
      style={{
        background:
          `radial-gradient(120% 90% at 0% 0%, ${s.color}30, transparent 55%),` +
          `radial-gradient(90% 70% at 100% 100%, ${GOLD}22, transparent 55%),` +
          `linear-gradient(180deg, rgba(16,10,4,0.85), rgba(8,8,16,0.95))`,
        boxShadow: `0 20px 60px -28px ${s.color}88, inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          background:
            `conic-gradient(from 0deg at 50% 50%, ${GOLD}22, ${s.color}22, ${BLUE}22, ${EMERALD}22, ${GOLD}22)`,
          filter: "blur(40px)",
        }} />
      <div className="pointer-events-none absolute -top-16 -left-10 h-40 w-40 rounded-full blur-3xl"
        style={{ background: `${s.color}40` }} />
      <div className="pointer-events-none absolute -bottom-16 -right-10 h-44 w-44 rounded-full blur-3xl"
        style={{ background: `${GOLD}30` }} />

      <div className="relative z-10 p-4 lg:p-7 min-h-[220px] lg:min-h-[260px]">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.22em] border"
            style={{ color: s.color, borderColor: `${s.color}66`, background: `${s.color}18` }}>
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: s.color }} />
            {s.eyebrow}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1"
            style={{ color: GOLD_HI }}>
            <Sparkles className="h-3 w-3" /> Lucky Hub
          </span>
        </div>

        <div className="flex items-start gap-3">
          <span aria-hidden="true"
            className="inline-flex h-11 w-11 lg:h-14 lg:w-14 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              borderColor: `${s.color}66`, background: `${s.color}20`, color: s.color,
              boxShadow: `0 10px 24px -10px ${s.color}aa, inset 0 1px 0 rgba(255,255,255,0.1)`,
            }}>
            <Icon className="h-6 w-6 lg:h-7 lg:w-7" />
          </span>
          <div className="min-w-0">
            <h1 className="text-[20px] lg:text-[30px] font-black leading-[1.1] tracking-tight"
              style={{
                background: `linear-gradient(90deg, ${GOLD_HI}, ${GOLD}, ${GOLD_HI})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                textShadow: `0 0 22px ${s.color}55`,
              }}>
              {s.title}
            </h1>
            <p className="mt-1 text-[12px] lg:text-[14px] text-white/70 max-w-md">{s.sub}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => {
              if (s.route.startsWith("#")) {
                const id = s.route.slice(1);
                if (window.location.hash !== s.route) {
                  window.history.pushState(null, "", s.route);
                }
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              } else {
                navigate(s.route);
              }
            }}
            aria-label={`${s.cta} — ${s.title}`}
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-black text-[11px] uppercase tracking-wider transition-transform hover:scale-[1.03] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#FEC013]"
            style={{
              background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`,
              color: "#1a0f00", boxShadow: `0 10px 24px -8px ${GOLD}cc, inset 0 1px 0 rgba(255,255,255,0.4)`,
            }}>
            <Play className="h-3.5 w-3.5" aria-hidden="true" /> {s.cta}
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={() => go(-1)} aria-label="Previous slide"
              className="h-8 w-8 grid place-items-center rounded-full border border-white/15 bg-black/40 text-white/80 hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FEC013]">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => go(1)} aria-label="Next slide"
              className="h-8 w-8 grid place-items-center rounded-full border border-white/15 bg-black/40 text-white/80 hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FEC013]">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5" role="tablist" aria-label="Slide indicators">
          {SLIDES.map((_, k) => (
            <button
              key={k}
              role="tab"
              aria-selected={k === i}
              aria-label={`Show slide ${k + 1}`}
              onClick={() => { setI(k); arm(); }}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: k === i ? 22 : 8,
                background: k === i ? GOLD : "rgba(255,255,255,0.25)",
                boxShadow: k === i ? `0 0 10px ${GOLD}88` : "none",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Section 2 · Quick Access Center
═══════════════════════════════════════════════════════════════════════ */
const QUICKS = [
  { name: "Daily Check-In",  icon: CalendarCheck, color: EMERALD, route: "/activity" },
  { name: "Lucky Spin",      icon: Sparkles,      color: GOLD,    route: "/activity" },
  { name: "Millionaire Club",icon: Crown,         color: PURPLE,  route: "/vip" },
  { name: "Mystery Box",     icon: Gift,          color: PINK,    route: "/promotion" },
  { name: "Announcements",   icon: Megaphone,     color: BLUE,    route: "/activity" },
] as const;

function QuickAccess() {
  const navigate = useNavigate();
  return (
    <Panel>
      <SectionHeader eyebrow="Fast Lane" title="Quick Access Center" />
      <div className="grid grid-cols-5 gap-1.5 lg:gap-2.5">
        {QUICKS.map(({ name, icon: Icon, color, route }) => (
          <button
            key={name}
            onClick={() => navigate(route)}
            aria-label={`Open ${name}`}
            className="group relative aspect-square rounded-2xl border overflow-hidden flex flex-col items-center justify-center gap-1 p-1 transition-transform hover:scale-[1.05] active:scale-[0.95] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#FEC013]"
            style={{
              borderColor: `${color}55`,
              background: `linear-gradient(160deg, ${color}20, rgba(0,0,0,0.6) 70%)`,
              boxShadow: `0 10px 24px -14px ${color}aa, inset 0 1px 0 rgba(255,255,255,0.06)`,
            }}
          >
            <span aria-hidden="true"
              className="inline-flex h-7 w-7 items-center justify-center rounded-xl border"
              style={{ borderColor: `${color}66`, background: `${color}22`, color }}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="text-[9px] font-black text-white text-center leading-tight truncate w-full px-0.5">
              {name}
            </span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Section 3 · Featured Opportunities
═══════════════════════════════════════════════════════════════════════ */
const OPPORTUNITIES = [
  { name: "Fixed Deposit Centre", sub: "Up to 24% APY",  metric: "৳12.4 Cr locked",    icon: Vault,  color: EMERALD, route: "/promotion" },
  { name: "Mega Jackpot",         sub: "Draws tonight",  metric: "৳5.8 Cr pool",       icon: Trophy, color: GOLD,    route: "/promotion" },
  { name: "Lucky Draw",           sub: "৳200 ticket",    metric: "৳1 Cr+ prize",       icon: Ticket, color: PURPLE,  route: "/promotion" },
] as const;

function FeaturedOpportunities() {
  const navigate = useNavigate();
  const [sold, setSold] = useState(48213);
  const [ticketsLeft, setTicketsLeft] = useState(51657);
  const [buyers, setBuyers] = useState(12841);
  const [timeLeft, setTimeLeft] = useState(6 * 3600 + 40 * 60 + 36);
  useEffect(() => {
    const id = setInterval(() => {
      const inc = Math.floor(Math.random() * 4);
      setSold((s) => s + inc);
      setTicketsLeft((t) => Math.max(0, t - inc));
      if (Math.random() < 0.35) setBuyers((b) => b + 1);
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(Math.floor(timeLeft / 3600)).padStart(2, "0");
  const mm = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const simple = OPPORTUNITIES.slice(0, 2);
  return (
    <Panel>
      <SectionBadge title="FIXED DEPOSIT" sub="Invest & earn · From ৳100 · Up to 24% APY" icon={Vault} accent={EMERALD} secondary={GOLD} />
      <SectionHeader eyebrow="Big Wins" title="Featured Opportunities" />

      {/* ⭐ Lucky Draw · Main Attraction ⭐ */}
      <div
        className="relative overflow-hidden rounded-2xl border p-3 lg:p-4 mb-2.5 lh-hover-breathe"
        style={{
          borderColor: `${PURPLE}77`,
          background:
            `radial-gradient(120% 90% at 0% 0%, ${PURPLE}33, transparent 55%),` +
            `radial-gradient(90% 70% at 100% 100%, ${GOLD}22, transparent 55%),` +
            `linear-gradient(135deg, ${PURPLE}22, rgba(0,0,0,0.7) 65%)`,
          boxShadow: `0 20px 50px -22px ${PURPLE}cc, inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}
      >
        {/* Shine sweep */}
        <span aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 lh-shine-sweep"
          style={{ background: `linear-gradient(90deg, transparent, ${GOLD_HI}44, transparent)`, mixBlendMode: "overlay" }} />
        <div className="relative z-10 flex items-start gap-3">
          <span aria-hidden="true"
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border shrink-0 relative"
            style={{ borderColor: `${PURPLE}88`, background: `linear-gradient(135deg, ${PURPLE}44, ${PINK}33)`, color: GOLD_HI, boxShadow: `0 10px 24px -8px ${PURPLE}cc` }}>
            <Ticket className="h-6 w-6" />
            <Crown aria-hidden="true" className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 lh-crown-bob" style={{ color: GOLD_HI, filter: `drop-shadow(0 0 6px ${GOLD})` }} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border"
              style={{ color: EMERALD, borderColor: `${EMERALD}55`, background: `${EMERALD}18` }}>
              <span className="h-1 w-1 rounded-full animate-pulse" style={{ background: EMERALD }} /> LIVE · Draws Nightly
            </div>
            <h3 className="mt-1 text-[16px] lg:text-[20px] font-black leading-tight tracking-tight"
              style={{
                background: `linear-gradient(90deg, ${GOLD_HI}, ${GOLD}, ${GOLD_HI})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                textShadow: `0 0 18px ${GOLD}66`,
              }}>
              ৳200 Ticket → Win Up To ৳1 Crore
            </h3>
            <p className="text-[10.5px] lg:text-[11.5px] text-white/70 mt-0.5">Buy a ticket. Change your life tonight.</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-1.5 relative z-10">
          <div className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5">
            <div className="text-[9px] uppercase tracking-wider text-white/50">Tickets Left</div>
            <div className="text-[13px] font-black tabular-nums" style={{ color: EMERALD }}>{ticketsLeft.toLocaleString("en-IN")}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5">
            <div className="text-[9px] uppercase tracking-wider text-white/50">Today's Buyers</div>
            <div className="text-[13px] font-black tabular-nums" style={{ color: GOLD_HI }}>{buyers.toLocaleString("en-IN")}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5">
            <div className="text-[9px] uppercase tracking-wider text-white/50">Winner In</div>
            <div className="text-[13px] font-black tabular-nums" style={{ color: PINK }}>{hh}:{mm}:{ss}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5">
            <div className="text-[9px] uppercase tracking-wider text-white/50">Prize Pool</div>
            <div className="text-[13px] font-black tabular-nums" style={{ color: GOLD }}>৳1 Cr+</div>
          </div>
        </div>

        <button
          onClick={() => navigate("/promotion")}
          aria-label="Buy Lucky Draw ticket — ৳200"
          className="relative z-10 mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-black text-[12px] uppercase tracking-wider transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#FEC013] overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${GOLD}, ${PURPLE})`,
            color: "#1a0f00", boxShadow: `0 12px 28px -8px ${PURPLE}cc`,
          }}
        >
          <Ticket className="h-4 w-4" aria-hidden="true" /> Buy Ticket · ৳200
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1/3 lh-shine-sweep"
            style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)` }} />
        </button>

        <div className="mt-1.5 text-[9.5px] text-white/45 text-center tabular-nums">
          {sold.toLocaleString("en-IN")} tickets sold today
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {simple.map(({ name, sub, metric, icon: Icon, color, route }) => (
          <button
            key={name}
            onClick={() => navigate(route)}
            aria-label={`Open ${name} — ${sub}`}
            className="group relative overflow-hidden rounded-2xl border p-3 text-left transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#FEC013]"
            style={{
              borderColor: `${color}55`,
              background: `linear-gradient(135deg, ${color}22, rgba(0,0,0,0.55) 65%)`,
              boxShadow: `0 14px 30px -18px ${color}aa, inset 0 1px 0 rgba(255,255,255,0.06)`,
            }}
          >
            <div className="flex items-start gap-2.5">
              <span aria-hidden="true"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border shrink-0"
                style={{ borderColor: `${color}66`, background: `${color}22`, color }}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-black text-white truncate">{name}</div>
                <div className="text-[10px] text-white/60 truncate">{sub}</div>
                <div className="mt-1.5 text-[12px] font-black tabular-nums"
                  style={{ color, textShadow: `0 0 10px ${color}66` }}>
                  {metric}
                </div>
              </div>
              <ChevronRight aria-hidden="true" className="h-4 w-4 text-white/60 shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </Panel>

  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Section 4 · Running Events Center
═══════════════════════════════════════════════════════════════════════ */
type EventStatus = "Live" | "Upcoming" | "Ending Soon" | "Completed";
const STATUS_COLOR: Record<EventStatus, string> = {
  Live: EMERALD, "Ending Soon": ORANGE, Upcoming: BLUE, Completed: "#94a3b8",
};
const EVENTS: { name: string; sub: string; icon: typeof Award; color: string; status: EventStatus }[] = [
  { name: "Recharge Bonus Event", sub: "Up to +100%",  icon: BadgeDollarSign, color: GOLD,    status: "Live"        },
  { name: "Bet & Win Event",      sub: "Win daily",    icon: Target,          color: EMERALD, status: "Live"        },
  { name: "Cashback Festival",    sub: "15% back",     icon: PartyPopper,     color: PINK,    status: "Live"        },
  { name: "Deposit Challenge",    sub: "৳10 L pool",   icon: Rocket,          color: BLUE,    status: "Ending Soon" },
  { name: "Weekly Rewards",       sub: "Every Mon",    icon: CalendarCheck,   color: PURPLE,  status: "Upcoming"    },
  { name: "Monthly Rewards",      sub: "1st of month", icon: Award,           color: ORANGE,  status: "Upcoming"    },
  { name: "Eid Special",          sub: "Festival",     icon: Star,            color: GOLD,    status: "Upcoming"    },
  { name: "New User Event",       sub: "First 7 days", icon: Sparkles,        color: EMERALD, status: "Live"        },
];

function RunningEvents() {
  const navigate = useNavigate();
  return (
    <Panel>
      <SectionBadge title="LIVE EVENTS" sub="Festivals · Cashback · Tournaments" icon={PartyPopper} accent={ORANGE} secondary={PINK} />
      <SectionHeader eyebrow="Now Live" title="Running Events" cta="View All" onCta={() => navigate("/promotion")} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {EVENTS.map(({ name, sub, icon: Icon, color, status }) => {
          const sc = STATUS_COLOR[status];
          return (
            <button
              key={name}
              onClick={() => navigate("/promotion")}
              aria-label={`${name} — ${sub} — ${status}`}
              className="group relative overflow-hidden rounded-2xl border p-2.5 text-left transition-transform hover:scale-[1.03] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#FEC013]"
              style={{
                borderColor: `${color}55`,
                background: `linear-gradient(160deg, ${color}18, rgba(0,0,0,0.55) 70%)`,
                boxShadow: `0 10px 24px -16px ${color}aa`,
              }}
            >
              <div className="flex items-center gap-2">
                <span aria-hidden="true"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border"
                  style={{ borderColor: `${color}66`, background: `${color}22`, color }}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ml-auto whitespace-nowrap"
                  style={{ color: sc, borderColor: `${sc}55`, background: `${sc}18` }}>
                  {status === "Live" && (
                    <span className="h-1 w-1 rounded-full animate-pulse" style={{ background: sc }} />
                  )}
                  {status}
                </span>
              </div>
              <div className="mt-2 text-[11px] font-black text-white leading-tight truncate">{name}</div>
              <div className="text-[9px] text-white/60 truncate">{sub}</div>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Section 5 · Tournament Arena
═══════════════════════════════════════════════════════════════════════ */
const TOURNEYS = [
  { name: "WinGo Nightly",        prize: 250000, entrants: 842,  icon: Timer,  color: GOLD    },
  { name: "Aviator Championship", prize: 500000, entrants: 1240, icon: Rocket, color: PINK    },
  { name: "Slots Grand Prix",     prize: 750000, entrants: 987,  icon: Trophy, color: PURPLE  },
] as const;

function TournamentArena() {
  const navigate = useNavigate();
  return (
    <Panel>
      <SectionBadge title="TOURNAMENT ARENA" sub="Champion trophy · Weekly races" icon={Award} accent={GOLD} secondary={BLUE} />
      <SectionHeader eyebrow="Compete" title="Tournament Arena" cta="Join" onCta={() => navigate("/promotion")} />
      <div className="space-y-2">
        {TOURNEYS.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.name}
              className="flex items-center gap-3 rounded-2xl border p-2.5"
              style={{
                borderColor: `${t.color}55`,
                background: `linear-gradient(90deg, ${t.color}18, rgba(0,0,0,0.5) 60%)`,
                boxShadow: `0 10px 24px -18px ${t.color}aa`,
              }}
            >
              <span aria-hidden="true"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border shrink-0"
                style={{ borderColor: `${t.color}66`, background: `${t.color}22`, color: t.color }}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-black text-white truncate">{t.name}</div>
                <div className="text-[10px] text-white/60 tabular-nums">
                  <Users className="inline h-3 w-3 -mt-0.5 mr-0.5" aria-hidden="true" />
                  {t.entrants.toLocaleString("en-IN")} players
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[13px] font-black tabular-nums" style={{ color: t.color }}>{bdt(t.prize)}</div>
                <div className="text-[9px] uppercase tracking-wider text-white/50">Prize Pool</div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Section 6 · Challenge Center
═══════════════════════════════════════════════════════════════════════ */
const CHALLENGES = [
  { name: "Daily Mission — Bet ৳5K today",       reward: 300,  progress: 0.62, color: GOLD    },
  { name: "Weekly Mission — Win 20 rounds",      reward: 1500, progress: 0.40, color: EMERALD },
  { name: "Monthly Mission — ৳1L turnover",      reward: 5000, progress: 0.28, color: BLUE    },
  { name: "Referral Mission — Invite 5 friends", reward: 2500, progress: 0.60, color: PURPLE  },
] as const;

function ChallengeCenter() {
  return (
    <Panel>
      <SectionBadge title="MISSION HUB" sub="Daily · Weekly · Monthly targets" icon={Target} accent={BLUE} secondary={EMERALD} />
      <SectionHeader eyebrow="Missions" title="Challenge Center" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {CHALLENGES.map((c) => (
          <div key={c.name}
            className="rounded-2xl border p-2.5"
            style={{
              borderColor: `${c.color}55`,
              background: `linear-gradient(135deg, ${c.color}15, rgba(0,0,0,0.5) 70%)`,
              boxShadow: `0 10px 24px -18px ${c.color}aa`,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-[12px] font-black text-white truncate">{c.name}</div>
              <div className="text-[11px] font-black tabular-nums shrink-0" style={{ color: c.color }}>
                +{bdt(c.reward)}
              </div>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden" aria-hidden="true">
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.round(c.progress * 100)}%`,
                  background: `linear-gradient(90deg, ${c.color}, ${GOLD})`,
                  boxShadow: `0 0 8px ${c.color}aa`,
                }} />
            </div>
            <div className="mt-1 text-[9px] text-white/50 tabular-nums">
              {Math.round(c.progress * 100)}% complete
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Section 7 · Millionaire Club
═══════════════════════════════════════════════════════════════════════ */
function MillionaireClub() {
  const navigate = useNavigate();
  const perks = [
    { icon: Users,        label: "Personal Manager", tint: GOLD    },
    { icon: PartyPopper,  label: "Private Events",   tint: PURPLE  },
    { icon: Gem,          label: "VIP Lounge",       tint: BLUE    },
    { icon: Gift,         label: "Special Rewards",  tint: EMERALD },
  ] as const;
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 p-4 lg:p-5"
      style={{
        background:
          `radial-gradient(120% 90% at 0% 0%, ${GOLD}30, transparent 55%),` +
          `radial-gradient(90% 70% at 100% 100%, ${PURPLE}28, transparent 55%),` +
          `linear-gradient(180deg, rgba(20,12,4,0.9), rgba(8,6,20,0.95))`,
        boxShadow: `0 20px 60px -28px ${GOLD}aa, inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}
    >
      <div className="relative z-10"><SectionBadge title="MILLIONAIRE CLUB" sub="Diamond crown · Elite invites" icon={Crown} accent={GOLD} secondary={PURPLE} /></div>
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-screen"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, ${GOLD}44, ${PURPLE}44, ${GOLD}44)`,
          filter: "blur(48px)",
        }} />

      {/* Giant Crown Hero */}
      <div className="relative z-10 flex flex-col items-center text-center py-2">
        <div className="lh3-crown-glow relative inline-flex items-center justify-center"
          style={{ width: 128, height: 128 }}>
          <div className="absolute inset-0 rounded-full"
            style={{ background: `radial-gradient(circle, ${GOLD}55, transparent 70%)` }} />
          <Crown className="relative" style={{ width: 96, height: 96, color: GOLD_HI, strokeWidth: 1.6 }} />
          <Gem className="absolute -top-1 right-6 h-5 w-5" style={{ color: PURPLE, filter: `drop-shadow(0 0 8px ${PURPLE})` }} />
          <Star className="absolute -bottom-1 left-6 h-4 w-4" style={{ color: GOLD_HI, filter: `drop-shadow(0 0 8px ${GOLD})` }} />
        </div>
        <div className="mt-2 text-[10px] font-black uppercase tracking-widest" style={{ color: GOLD_HI }}>Elite Only</div>
        <h2 className="text-[20px] lg:text-[24px] font-black text-white leading-tight">Millionaire Club</h2>
        <p className="text-[11px] lg:text-[12px] text-white/70 mt-0.5 max-w-md">
          Cross ৳10 L lifetime wins and unlock invites, private tables & personal manager.
        </p>
      </div>

      {/* Perks grid */}
      <div className="relative z-10 mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {perks.map((p) => (
          <div key={p.label}
            className="rounded-xl border border-white/10 bg-black/40 px-2 py-2.5 text-center"
            style={{ boxShadow: `inset 0 0 20px ${p.tint}22, 0 8px 20px -14px ${p.tint}88` }}>
            <p.icon className="h-5 w-5 mx-auto mb-1" style={{ color: p.tint }} aria-hidden="true" />
            <div className="text-[10.5px] font-black leading-tight" style={{ color: p.tint }}>{p.label}</div>
          </div>
        ))}
      </div>

      <div className="relative z-10 mt-3 flex items-center gap-2">
        <button
          onClick={() => navigate("/vip")}
          aria-label="Join Millionaire Club"
          className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-black text-[11px] uppercase tracking-wider transition-transform hover:scale-[1.03] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#FEC013]"
          style={{
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`,
            color: "#1a0f00", boxShadow: `0 10px 24px -8px ${GOLD}cc`,
          }}>
          <Crown className="h-3.5 w-3.5" aria-hidden="true" /> Join Club
        </button>
        <div className="ml-auto text-right">
          <div className="text-[9px] uppercase tracking-wider text-white/50">Members</div>
          <div className="text-[13px] font-black tabular-nums" style={{ color: GOLD_HI }}>1,284</div>
        </div>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   Section 8 · Mystery & Lucky Zone
═══════════════════════════════════════════════════════════════════════ */
function MysteryBoxCard() {
  const navigate = useNavigate();
  const rewards = ["Cash", "Bonus", "Free Ticket", "VIP Day"];
  return (
    <div className="relative overflow-hidden rounded-2xl border p-3"
      style={{ borderColor: `${PINK}55`, background: `linear-gradient(160deg, ${PINK}22, rgba(0,0,0,0.65) 70%)`, boxShadow: `0 14px 30px -18px ${PINK}aa` }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: PINK }}>Mystery Box</div>
          <div className="text-[13px] font-black text-white leading-tight">Open Now</div>
        </div>
        <Sparkles className="h-4 w-4" style={{ color: GOLD_HI }} aria-hidden="true" />
      </div>
      {/* 3D gift box SVG */}
      <div className="my-3 flex justify-center" style={{ height: 96 }}>
        <svg viewBox="0 0 100 96" className="lh3-box-open" width="88" height="96" aria-hidden="true">
          <defs>
            <linearGradient id="mb-lid" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor={PINK} />
              <stop offset="1" stopColor={PURPLE} />
            </linearGradient>
            <linearGradient id="mb-body" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={PURPLE} />
              <stop offset="1" stopColor="#1a0728" />
            </linearGradient>
          </defs>
          <rect x="14" y="34" width="72" height="52" rx="4" fill="url(#mb-body)" stroke={GOLD} strokeWidth="1.5" />
          <rect x="10" y="26" width="80" height="16" rx="4" fill="url(#mb-lid)" stroke={GOLD_HI} strokeWidth="1.5" />
          <rect x="46" y="26" width="8" height="60" fill={GOLD} />
          <path d="M50 24 C 34 8, 22 20, 50 26 C 78 20, 66 8, 50 24 Z" fill={GOLD_HI} stroke={GOLD_DEEP} strokeWidth="0.8" />
          <circle cx="30" cy="20" r="1.5" fill={GOLD_HI} />
          <circle cx="70" cy="12" r="1.5" fill={PINK} />
          <circle cx="82" cy="24" r="1.5" fill={PURPLE} />
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-1 mb-2">
        {rewards.map((r) => (
          <div key={r} className="rounded-md border border-white/10 bg-black/40 px-1.5 py-1 text-center text-[9.5px] font-bold text-white/85">{r}</div>
        ))}
      </div>
      <button
        onClick={() => navigate("/promotion")}
        aria-label="Open Mystery Box"
        className="w-full rounded-xl px-2 py-2 text-[11px] font-black uppercase tracking-wider transition hover:brightness-110"
        style={{ background: `linear-gradient(135deg, ${PINK}, ${PURPLE})`, color: "white", boxShadow: `0 10px 24px -8px ${PINK}cc` }}>
        Open Box
      </button>
    </div>
  );
}

function ScratchCardBlock() {
  const navigate = useNavigate();
  const prizes = ["৳10", "৳50", "৳100", "৳500", "Mystery"];
  return (
    <div className="relative overflow-hidden rounded-2xl border p-3"
      style={{ borderColor: `${EMERALD}55`, background: `linear-gradient(160deg, ${EMERALD}22, rgba(0,0,0,0.65) 70%)`, boxShadow: `0 14px 30px -18px ${EMERALD}aa` }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: EMERALD }}>Scratch &amp; Win</div>
          <div className="text-[13px] font-black text-white leading-tight">Instant Prize</div>
        </div>
        <Zap className="h-4 w-4" style={{ color: EMERALD }} aria-hidden="true" />
      </div>
      {/* Faux scratch card */}
      <div className="relative my-3 mx-auto overflow-hidden rounded-xl border border-white/15"
        style={{ height: 96, width: "100%", background: `repeating-linear-gradient(45deg, ${EMERALD}44 0 8px, #1a3a1e 8px 16px)` }}>
        <span aria-hidden="true"
          className="lh3-scratch-shine absolute inset-y-0 left-0 w-1/3"
          style={{ background: `linear-gradient(90deg, transparent, ${GOLD_HI}88, transparent)`, mixBlendMode: "overlay" }} />
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/70">Scratch to Reveal</div>
            <div className="text-[18px] font-black" style={{ color: GOLD_HI, textShadow: `0 0 12px ${GOLD}` }}>৳ ???</div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {prizes.map((p) => (
          <span key={p} className="rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 text-[9.5px] font-bold text-white/85">{p}</span>
        ))}
      </div>
      <button
        onClick={() => navigate("/promotion")}
        aria-label="Scratch card now"
        className="w-full rounded-xl px-2 py-2 text-[11px] font-black uppercase tracking-wider transition hover:brightness-110"
        style={{ background: `linear-gradient(135deg, ${EMERALD}, ${BLUE})`, color: "white", boxShadow: `0 10px 24px -8px ${EMERALD}cc` }}>
        Scratch Now
      </button>
    </div>
  );
}

function GoldenEnvelope() {
  const navigate = useNavigate();
  return (
    <div className="relative overflow-hidden rounded-2xl border p-3"
      style={{ borderColor: `${GOLD}55`, background: `linear-gradient(160deg, ${GOLD}22, rgba(0,0,0,0.65) 70%)`, boxShadow: `0 14px 30px -18px ${GOLD}aa` }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: GOLD_HI }}>Golden Envelope</div>
          <div className="text-[13px] font-black text-white leading-tight">Claim Reward</div>
        </div>
        <Coins className="h-4 w-4" style={{ color: GOLD_HI }} aria-hidden="true" />
      </div>
      {/* CSS envelope illustration */}
      <div className="my-3 flex justify-center" style={{ height: 96, perspective: 400 }}>
        <div className="relative" style={{ width: 128, height: 88 }}>
          <div className="absolute inset-0 rounded-md border"
            style={{ background: `linear-gradient(180deg, ${GOLD}, ${GOLD_DEEP})`, borderColor: GOLD_HI, boxShadow: `0 8px 22px -6px ${GOLD}cc` }} />
          {/* Body content peek */}
          <div className="absolute inset-x-3 top-3 bottom-3 rounded bg-black/25 flex items-center justify-center">
            <Star className="h-6 w-6" style={{ color: GOLD_HI, filter: `drop-shadow(0 0 6px ${GOLD})` }} aria-hidden="true" />
          </div>
          {/* Flap (opens) */}
          <div className="lh3-envelope-open absolute inset-x-0 top-0 h-1/2"
            style={{
              background: `linear-gradient(180deg, ${GOLD_HI}, ${GOLD})`,
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              borderTop: `1px solid ${GOLD_HI}`,
              boxShadow: `inset 0 -6px 16px rgba(0,0,0,0.25)`,
            }} />
        </div>
      </div>
      <button
        onClick={() => navigate("/promotion")}
        aria-label="Open Golden Envelope"
        className="w-full rounded-xl px-2 py-2 text-[11px] font-black uppercase tracking-wider transition hover:brightness-110"
        style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`, color: "#1a0f00", boxShadow: `0 10px 24px -8px ${GOLD}cc` }}>
        Claim Reward
      </button>
    </div>
  );
}

function MysteryZone() {
  return (
    <Panel>
      <SectionBadge title="MYSTERY BOX" sub="Mystery · Scratch · Envelope" icon={Gift} accent={PINK} secondary={PURPLE} />
      <SectionHeader eyebrow="Surprise" title="Mystery Box & Lucky Zone" color={PURPLE} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <MysteryBoxCard />
        <ScratchCardBlock />
        <GoldenEnvelope />
      </div>
    </Panel>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   Section 9 · VIP Club
═══════════════════════════════════════════════════════════════════════ */
const VIP_TIER_GRADIENT = (i: number) => {
  // L1..L10 tint progression: slate → emerald → blue → purple → gold
  const palette = ["#94a3b8","#6ee7b7",EMERALD,"#22d3ee",BLUE,"#a78bfa",PURPLE,PINK,ORANGE,GOLD];
  return palette[i] ?? GOLD;
};
const VIP_TIERS_10 = Array.from({ length: 10 }, (_, i) => ({ name: `L${i + 1}`, color: VIP_TIER_GRADIENT(i) }));

function VipClub() {
  const navigate = useNavigate();
  return (
    <Panel>
      <SectionBadge title="VIP CLUB" sub="Royal diamond privileges · L1–L10" icon={Gem} accent={PINK} secondary={GOLD} />
      <SectionHeader eyebrow="Elite" title="VIP Club" cta="Enter" onCta={() => navigate("/vip")} color={PINK} />
      <div className="relative overflow-hidden rounded-2xl border p-3"
        style={{
          borderColor: `${PINK}44`,
          background: `linear-gradient(135deg, ${PINK}22, ${GOLD}12 60%, rgba(0,0,0,0.75))`,
          boxShadow: `0 14px 30px -18px ${PINK}aa`,
        }}>
        {/* Trio luxury badges */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {[
            { icon: Crown, label: "Crown",   tint: GOLD    },
            { icon: Gem,   label: "Diamond", tint: BLUE    },
            { icon: Award, label: "Elite",   tint: PURPLE  },
          ].map((b) => (
            <div key={b.label}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border lh-badge-glow"
              style={{ borderColor: `${b.tint}66`, background: `${b.tint}18`, boxShadow: `0 0 18px ${b.tint}55` }}>
              <b.icon className="h-3.5 w-3.5" style={{ color: b.tint }} aria-hidden="true" />
              <span className="text-[9.5px] font-black uppercase tracking-widest" style={{ color: b.tint }}>{b.label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span aria-hidden="true"
            className="lh3-crown-glow inline-flex h-14 w-14 items-center justify-center rounded-xl border shrink-0"
            style={{ borderColor: `${GOLD}66`, background: `${GOLD}22`, color: GOLD_HI }}>
            <Crown className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-black text-white leading-tight">Up to 3× rebate + exclusive vault drops</div>
            <div className="text-[10.5px] text-white/60 mt-0.5">Level up by wagering — auto-progresses.</div>
          </div>
        </div>

        {/* 10-tier row L1..L10 */}
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {VIP_TIERS_10.map((t) => (
            <div key={t.name}
              className="text-center rounded-lg px-1 py-1.5 text-[10px] font-black border tabular-nums"
              style={{
                color: t.color, borderColor: `${t.color}66`,
                background: `linear-gradient(180deg, ${t.color}22, transparent)`,
                boxShadow: `0 0 10px ${t.color}44, inset 0 0 8px ${t.color}22`,
              }}>
              {t.name}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

// small helper to keep icon color contrasty over pink
function PINK_LIKE_GOLD() { return "#FDE68A"; }

/* ═══════════════════════════════════════════════════════════════════════
   Section 10 · Recent Winners
═══════════════════════════════════════════════════════════════════════ */
const WINNER_NAMES = ["Rahim","Karim","Nayeem","Sabbir","Farhan","Tanvir","Imran","Jahid","Sakib","Rasel"];
const WINNER_COUNTRIES = ["🇧🇩 BD","🇮🇳 IN","🇵🇰 PK","🇳🇵 NP","🇱🇰 LK","🇲🇾 MY","🇮🇩 ID"];
const WINNER_GAMES = ["Aviator","WinGo","Sweet Bonanza","K3","Crash","Roulette","5D","Fishing","Lucky Draw","Mega Jackpot"];
type Winner = { id: string; name: string; country: string; game: string; amt: number; at: number };

function timeAgo(ms: number) {
  const s = Math.max(1, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

function seedWinners(): Winner[] {
  const now = Date.now();
  return Array.from({ length: 6 }, (_, i) => ({
    id: `seed-${i}`,
    name: WINNER_NAMES[i % WINNER_NAMES.length],
    country: WINNER_COUNTRIES[i % WINNER_COUNTRIES.length],
    game: WINNER_GAMES[i % WINNER_GAMES.length],
    amt: 5000 + Math.floor(Math.random() * 250000),
    at: now - (i + 1) * 47_000,
  }));
}

function RecentWinners() {
  const [items, setItems] = useState<Winner[]>(seedWinners);
  const [, force] = useState(0);
  useEffect(() => {
    const add = setInterval(() => {
      setItems((prev) => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: WINNER_NAMES[Math.floor(Math.random() * WINNER_NAMES.length)],
          country: WINNER_COUNTRIES[Math.floor(Math.random() * WINNER_COUNTRIES.length)],
          game: WINNER_GAMES[Math.floor(Math.random() * WINNER_GAMES.length)],
          amt: 5000 + Math.floor(Math.random() * 250000),
          at: Date.now(),
        },
        ...prev,
      ].slice(0, 8));
    }, 3200);
    const tick = setInterval(() => force((x) => x + 1), 15_000);
    return () => { clearInterval(add); clearInterval(tick); };
  }, []);

  const gameColor = (g: string) => {
    if (/aviator|crash|rocket/i.test(g)) return PINK;
    if (/wingo/i.test(g)) return GOLD;
    if (/k3|5d/i.test(g)) return BLUE;
    if (/bonanza|slot|fish/i.test(g)) return PURPLE;
    if (/lucky|jackpot/i.test(g)) return EMERALD;
    return GOLD_HI;
  };
  return (
    <Panel>
      <SectionHeader eyebrow="Live Feed" title="Recent Winners" color={EMERALD} />
      <ul className="space-y-1.5" role="list" aria-live="polite">
        {items.map((w, i) => {
          const gc = gameColor(w.game);
          return (
            <li key={w.id}
              className={`flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/30 px-2.5 py-1.5 ${i === 0 ? "lh-slide-in-up" : ""}`}
              style={i === 0 ? { boxShadow: `0 0 0 1px ${EMERALD}44, 0 8px 20px -12px ${EMERALD}88` } : undefined}
            >
              <span aria-hidden="true" className="text-[15px] leading-none shrink-0">
                {w.country.split(" ")[0]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11.5px] font-black text-white truncate">
                  {w.name}
                  <span className="ml-1.5 inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border align-middle"
                    style={{ color: gc, borderColor: `${gc}55`, background: `${gc}18` }}>
                    <span className="h-1 w-1 rounded-full" style={{ background: gc }} /> {w.game}
                  </span>
                </div>
                <div className="text-[9.5px] text-white/50 truncate">{timeAgo(w.at)}</div>
              </div>
              <div className="text-[12px] font-black tabular-nums shrink-0 lh-slide-in-up"
                style={{ color: EMERALD, textShadow: `0 0 10px ${EMERALD}88` }}>
                +{bdt(w.amt)}
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   Section 11 · Agent Opportunity Center
═══════════════════════════════════════════════════════════════════════ */
function AgentOpportunity() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 p-4"
      style={{
        background:
          `radial-gradient(120% 90% at 0% 0%, ${BLUE}30, transparent 55%),` +
          `radial-gradient(90% 70% at 100% 100%, ${PURPLE}22, transparent 55%),` +
          `linear-gradient(180deg, rgba(6,12,20,0.9), rgba(8,8,16,0.95))`,
        boxShadow: `0 20px 60px -28px ${BLUE}aa, inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      <SectionBadge title="AGENT PROGRAMME" sub="Build your empire · Lifetime income" icon={ShieldCheck} accent={BLUE} secondary={PURPLE} />
      <div className="flex items-center gap-3">
        <span aria-hidden="true"
          className="inline-flex h-12 w-12 items-center justify-center rounded-xl border shrink-0"
          style={{ borderColor: `${BLUE}66`, background: `${BLUE}22`, color: BLUE }}>
          <Handshake className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border animate-pulse"
              style={{ color: ORANGE, borderColor: `${ORANGE}66`, background: `${ORANGE}22`, boxShadow: `0 0 12px ${ORANGE}66` }}>
              <Flame className="h-2.5 w-2.5" aria-hidden="true" /> HOT OPPORTUNITY
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border"
              style={{ color: GOLD_HI, borderColor: `${GOLD}55`, background: `${GOLD}18` }}>
              JOIN FEE ৳200
            </span>
          </div>
          <h2 className="mt-1 text-[16px] font-black text-white leading-tight">Agent Opportunity Center</h2>
          <p className="text-[11px] text-white/60 mt-0.5">Win monthly salary · Earn daily commission · Build lifetime income · 7 career levels</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { k: "Monthly Salary",   v: "Guaranteed",  icon: BadgeDollarSign, c: GOLD    },
          { k: "Daily Commission", v: "Every 24h",   icon: Coins,           c: EMERALD },
          { k: "Lifetime Income",  v: "Team profit", icon: Users,           c: BLUE    },
          { k: "7 Career Levels",  v: "AG-1 → AG-7", icon: ShieldCheck,     c: PURPLE  },
        ].map((s) => (
          <div key={s.k}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 text-center relative overflow-hidden"
            style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 20px -14px ${s.c}88` }}>
            <s.icon className="h-4 w-4 mx-auto mb-1" style={{ color: s.c }} aria-hidden="true" />
            <div className="text-[10.5px] font-black leading-tight" style={{ color: s.c }}>{s.k}</div>
            <div className="text-[8.5px] uppercase tracking-wider text-white/55 mt-0.5">{s.v}</div>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <button
          onClick={() => navigate("/agent")}
          aria-label="Become an agent"
          className="relative overflow-hidden w-full rounded-xl px-3 py-2.5 font-black text-[11px] uppercase tracking-wider transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#FEC013]"
          style={{
            background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})`,
            color: "white", boxShadow: `0 10px 24px -8px ${BLUE}cc`,
          }}>
          <Handshake className="inline h-3.5 w-3.5 -mt-0.5 mr-1" aria-hidden="true" /> Become an Agent · ৳200
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1/3 lh-shine-sweep"
            style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)` }} />
        </button>
      </div>

      {/* Success Stories · Live Commission · Leaderboard */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        {/* Success Stories */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Award className="h-3.5 w-3.5" style={{ color: GOLD_HI }} aria-hidden="true" />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: GOLD_HI }}>Success Stories</span>
          </div>
          <ul className="space-y-1.5">
            {[
              { name: "Rahim (AG-2)",   quote: "৳48,000 in month 1",     tint: EMERALD },
              { name: "Sabbir (AG-4)",  quote: "Team of 210 · ৳2.1L",    tint: BLUE    },
              { name: "Nayeem (AG-6)",  quote: "Monthly salary unlocked", tint: PURPLE  },
            ].map((s) => (
              <li key={s.name} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5">
                <div className="text-[10.5px] font-black" style={{ color: s.tint }}>{s.name}</div>
                <div className="text-[10px] text-white/70">“{s.quote}”</div>
              </li>
            ))}
          </ul>
        </div>

        {/* Live Commission Feed */}
        <div className="relative rounded-2xl border border-white/10 bg-black/40 p-3 overflow-hidden" style={{ maxHeight: 178 }}>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: EMERALD }} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: EMERALD }}>Live Commission</span>
          </div>
          <div className="relative h-[130px] overflow-hidden">
            <div className="dc-ticker absolute inset-x-0 top-0 flex flex-col gap-1">
              {[
                { name: "AG-1024", amt: "৳620"  },
                { name: "AG-0871", amt: "৳1,250"},
                { name: "AG-0442", amt: "৳340"  },
                { name: "AG-2011", amt: "৳980"  },
                { name: "AG-1567", amt: "৳480"  },
                { name: "AG-0209", amt: "৳2,150"},
                { name: "AG-1024", amt: "৳620"  },
                { name: "AG-0871", amt: "৳1,250"},
                { name: "AG-0442", amt: "৳340"  },
                { name: "AG-2011", amt: "৳980"  },
                { name: "AG-1567", amt: "৳480"  },
                { name: "AG-0209", amt: "৳2,150"},
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
                  <span className="text-[10px] font-bold text-white/85">{r.name}</span>
                  <span className="text-[10px] font-black" style={{ color: EMERALD }}>+{r.amt}</span>
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/70 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-black/70 to-transparent" />
          </div>
        </div>

        {/* Top Agents Leaderboard */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Trophy className="h-3.5 w-3.5" style={{ color: GOLD }} aria-hidden="true" />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: GOLD }}>Top Agents</span>
          </div>
          <ol className="space-y-1">
            {[
              { rank: 1, name: "AG-0001 · Karim",  earn: "৳4.8 L", medal: GOLD    },
              { rank: 2, name: "AG-0007 · Rahim",  earn: "৳3.6 L", medal: "#C0C0C0" },
              { rank: 3, name: "AG-0021 · Farhan", earn: "৳2.9 L", medal: "#CD7F32" },
              { rank: 4, name: "AG-0044 · Tanvir", earn: "৳2.1 L", medal: BLUE    },
              { rank: 5, name: "AG-0078 · Sabbir", earn: "৳1.7 L", medal: PURPLE  },
            ].map((a) => (
              <li key={a.rank} className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
                <span className="grid h-5 w-5 place-items-center rounded-full text-[9.5px] font-black text-black tabular-nums"
                  style={{ background: a.medal }}>{a.rank}</span>
                <span className="text-[10px] font-bold text-white/85 flex-1 truncate">{a.name}</span>
                <span className="text-[10px] font-black" style={{ color: GOLD_HI }}>{a.earn}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   Section 12 · Live Jackpot Counter
═══════════════════════════════════════════════════════════════════════ */
function useCountUp(target: number, ratePerSec: number) {
  const [v, setV] = useState(target);
  useEffect(() => {
    const id = setInterval(() => setV((p) => p + ratePerSec / 4), 250);
    return () => clearInterval(id);
  }, [ratePerSec]);
  return v;
}

function LiveJackpotCounter() {
  const value = useCountUp(58421000, 320);
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 p-4"
      style={{
        background:
          `radial-gradient(120% 90% at 0% 0%, ${GOLD}35, transparent 55%),` +
          `radial-gradient(90% 70% at 100% 100%, ${ORANGE}30, transparent 55%),` +
          `linear-gradient(180deg, rgba(20,10,0,0.92), rgba(12,4,0,0.98))`,
        boxShadow: `0 20px 60px -28px ${GOLD}cc, inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}
    >
      <SectionBadge title="MEGA JACKPOT" sub="Live prize pool · Draws tonight" icon={Trophy} accent={GOLD} secondary={ORANGE} />
      <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, ${GOLD}44, ${ORANGE}44, ${GOLD}44)`,
          filter: "blur(50px)",
        }} />
      <div className="relative z-10 text-center">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest"
          style={{ color: GOLD_HI, borderColor: `${GOLD}66`, background: `${GOLD}18` }}>
          <Flame className="h-3 w-3" aria-hidden="true" /> Live Jackpot
        </div>
        <div className="mt-2 text-[32px] lg:text-[46px] font-black tabular-nums leading-none"
          style={{
            background: `linear-gradient(90deg, ${GOLD_HI}, ${GOLD}, ${ORANGE}, ${GOLD_HI})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            textShadow: `0 0 30px ${GOLD}88`,
          }}>
          {bdt(value)}
        </div>
        <div className="mt-1 text-[10.5px] text-white/60">Total prize pool — growing every second</div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Section 13 · Free Daily Lucky Spin
═══════════════════════════════════════════════════════════════════════ */
function FreeDailySpin() {
  const navigate = useNavigate();
  const [spinning, setSpinning] = useState(false);
  const wheelRef = useRef<HTMLDivElement | null>(null);

  const slices = useMemo(() => ([
    { label: "৳50",         color: EMERALD },
    { label: "৳100",        color: BLUE    },
    { label: "৳500",        color: GOLD    },
    { label: "VIP Day",     color: PURPLE  },
    { label: "Free Ticket", color: PINK    },
    { label: "Cashback",    color: ORANGE  },
  ]), []);

  // Build 6-slice conic gradient
  const conic = `conic-gradient(from 0deg, ${slices
    .map((s, i) => `${s.color} ${(i * 100) / slices.length}% ${((i + 1) * 100) / slices.length}%`)
    .join(", ")})`;

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    const el = wheelRef.current;
    if (el) {
      el.style.animation = "none";
      // reflow
      void el.offsetWidth;
      el.style.animation = "lh3-wheel-spin 6s cubic-bezier(0.17,0.67,0.24,1) both";
    }
    setTimeout(() => setSpinning(false), 6100);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 p-4"
      style={{
        background:
          `radial-gradient(120% 90% at 100% 0%, ${PURPLE}30, transparent 55%),` +
          `radial-gradient(90% 70% at 0% 100%, ${GOLD}25, transparent 55%),` +
          `linear-gradient(180deg, rgba(14,4,20,0.92), rgba(4,4,12,0.98))`,
        boxShadow: `0 20px 60px -28px ${PURPLE}aa, inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      <SectionBadge title="LUCKY WHEEL" sub="Free spin · Daily rewards" icon={Sparkles} accent={GOLD} secondary={PURPLE} />

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-3 items-center">
        {/* WHEEL */}
        <div className="relative mx-auto" style={{ width: 260, height: 260 }}>
          {/* Pointer */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-20"
            style={{
              width: 0, height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderTop: `18px solid ${GOLD_HI}`,
              filter: `drop-shadow(0 0 8px ${GOLD})`,
            }} aria-hidden="true" />
          {/* Wheel body */}
          <div ref={wheelRef} className="absolute inset-0 rounded-full border-4"
            style={{
              borderColor: GOLD,
              background: conic,
              boxShadow: `0 0 40px ${GOLD}55, inset 0 0 20px rgba(0,0,0,0.35)`,
            }} aria-hidden="true">
            {/* Slice labels */}
            {slices.map((s, i) => {
              const angle = (360 / slices.length) * i + (360 / slices.length) / 2;
              return (
                <div key={s.label}
                  className="absolute left-1/2 top-1/2 origin-[0_0] text-[10.5px] font-black uppercase tracking-wider text-black/85 whitespace-nowrap"
                  style={{ transform: `rotate(${angle}deg) translate(50px, -6px)` }}>
                  {s.label}
                </div>
              );
            })}
          </div>
          {/* Center hub with crown */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 grid place-items-center rounded-full border-2"
            style={{
              width: 76, height: 76,
              borderColor: GOLD_HI,
              background: `radial-gradient(circle at 30% 30%, ${GOLD_HI}, ${GOLD_DEEP})`,
              boxShadow: `0 0 20px ${GOLD}aa, inset 0 0 10px rgba(0,0,0,0.4)`,
            }}>
            <Crown className="lh3-crown-glow h-8 w-8" style={{ color: "#1a0f00" }} aria-hidden="true" />
          </div>
        </div>

        {/* CTA + Stats */}
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: GOLD_HI }}>Free Every 24h</div>
          <h2 className="text-[18px] font-black text-white leading-tight">Daily Lucky Spin</h2>
          <p className="text-[11.5px] text-white/60 mt-0.5">6 slices · Cash · VIP Day · Free Tickets · Cashback</p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 bg-black/40 px-2 py-2 text-center">
              <div className="text-[9px] uppercase tracking-wider text-white/50">Free Spins</div>
              <div className="text-[14px] font-black tabular-nums" style={{ color: EMERALD }}>2 / 3</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 px-2 py-2 text-center">
              <div className="text-[9px] uppercase tracking-wider text-white/50">Top Today</div>
              <div className="text-[14px] font-black tabular-nums" style={{ color: GOLD }}>৳12.5K</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 px-2 py-2 text-center">
              <div className="text-[9px] uppercase tracking-wider text-white/50">History</div>
              <div className="text-[14px] font-black tabular-nums" style={{ color: BLUE }}>18</div>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={spin}
              disabled={spinning}
              aria-label="Spin the wheel"
              className="flex-1 relative overflow-hidden inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 font-black text-[12px] uppercase tracking-wider transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#FEC013]"
              style={{
                background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`,
                color: "#1a0f00", boxShadow: `0 12px 26px -8px ${GOLD}cc`,
              }}>
              <Sparkles className="h-4 w-4" aria-hidden="true" /> {spinning ? "Spinning…" : "Spin Now"}
            </button>
            <button
              onClick={() => navigate("/activity")}
              className="rounded-xl border px-3 py-2.5 text-[11px] font-black uppercase tracking-wider text-white/85 hover:bg-white/5"
              style={{ borderColor: `${GOLD}55`, background: `${GOLD}10` }}>
              History
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Section 4 (v3) · Premium Fixed Deposit Centre
═══════════════════════════════════════════════════════════════════════ */
const FD_PLANS = [
  { days: 15,  apy: 8,  min: 500,   ret: "৳16.4"   },
  { days: 30,  apy: 12, min: 1000,  ret: "৳9.8"    },
  { days: 60,  apy: 16, min: 2000,  ret: "৳52.5"   },
  { days: 90,  apy: 20, min: 5000,  ret: "৳246"    },
  { days: 180, apy: 24, min: 10000, ret: "৳1,183"  },
] as const;

function PremiumFixedDeposit() {
  const navigate = useNavigate();
  const plansRef = useRef<HTMLDivElement | null>(null);
  const stats = [
    { label: "Total Locked",     value: "৳12.4 Cr+", tint: EMERALD },
    { label: "Active Investors", value: "25,000+",   tint: BLUE    },
    { label: "Highest APY",      value: "24%",       tint: GOLD    },
    { label: "Trust Score",      value: "99.8%",     tint: PURPLE  },
  ];
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 p-4 lg:p-5"
      style={{
        background:
          `radial-gradient(120% 90% at 0% 0%, ${EMERALD}30, transparent 55%),` +
          `radial-gradient(90% 70% at 100% 100%, ${GOLD}22, transparent 55%),` +
          `linear-gradient(180deg, rgba(4,16,10,0.92), rgba(6,10,16,0.98))`,
        boxShadow: `0 20px 60px -28px ${EMERALD}aa, inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      <SectionBadge title="FIXED DEPOSIT" sub="Invest · Lock · Earn up to 24% APY" icon={Vault} accent={EMERALD} secondary={GOLD} />

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl border p-3 lg:p-4 mb-3"
        style={{
          borderColor: `${EMERALD}55`,
          background: `linear-gradient(135deg, ${EMERALD}22, rgba(0,0,0,0.6) 65%)`,
          boxShadow: `0 14px 30px -18px ${EMERALD}aa, inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}>
        <span aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 lh-shine-sweep"
          style={{ background: `linear-gradient(90deg, transparent, ${GOLD_HI}55, transparent)`, mixBlendMode: "overlay" }} />
        <div className="relative z-10 flex items-start gap-3">
          <span aria-hidden="true"
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border shrink-0"
            style={{ borderColor: `${EMERALD}77`, background: `linear-gradient(135deg, ${EMERALD}44, ${GOLD}22)`, color: GOLD_HI, boxShadow: `0 10px 24px -8px ${EMERALD}cc` }}>
            <Vault className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border"
              style={{ color: EMERALD, borderColor: `${EMERALD}55`, background: `${EMERALD}18` }}>
              <span className="h-1 w-1 rounded-full animate-pulse" style={{ background: EMERALD }} /> Guaranteed Returns
            </div>
            <h3 className="mt-1 text-[16px] lg:text-[20px] font-black leading-tight tracking-tight"
              style={{
                background: `linear-gradient(90deg, ${GOLD_HI}, ${EMERALD}, ${GOLD_HI})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                textShadow: `0 0 18px ${EMERALD}66`,
              }}>
              Premium Fixed Deposit Centre
            </h3>
            <p className="text-[10.5px] lg:text-[11.5px] text-white/70 mt-0.5">Lock ৳500+ from 15 to 180 days. Bank-grade returns, on-chain audited.</p>
          </div>
        </div>

        <div className="relative z-10 mt-3 grid grid-cols-2 lg:grid-cols-4 gap-1.5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5">
              <div className="text-[9px] uppercase tracking-wider text-white/50">{s.label}</div>
              <div className="text-[13px] font-black tabular-nums" style={{ color: s.tint, textShadow: `0 0 10px ${s.tint}66` }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="relative z-10 mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate("/fixed-deposits")}
            aria-label="Invest Now"
            className="relative overflow-hidden inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 font-black text-[12px] uppercase tracking-wider transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#FEC013]"
            style={{ background: `linear-gradient(135deg, ${EMERALD}, ${GOLD})`, color: "#0a1a12", boxShadow: `0 12px 26px -8px ${EMERALD}cc` }}>
            <Vault className="h-4 w-4" aria-hidden="true" /> Invest Now
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1/3 lh-shine-sweep"
              style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)` }} />
          </button>
          <button
            onClick={() => plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            aria-label="View Plans"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 font-black text-[12px] uppercase tracking-wider border text-white/90 hover:bg-white/5"
            style={{ borderColor: `${GOLD}55`, background: `${GOLD}12` }}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" /> View Plans
          </button>
        </div>
      </div>

      {/* Plans grid */}
      <div ref={plansRef} className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {FD_PLANS.map((p) => (
          <button
            key={p.days}
            onClick={() => navigate("/fixed-deposits")}
            aria-label={`Invest for ${p.days} days at ${p.apy}% APY`}
            className="group relative overflow-hidden rounded-2xl border p-2.5 text-left transition-transform hover:scale-[1.03] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#FEC013]"
            style={{
              borderColor: `${GOLD}55`,
              background: `linear-gradient(160deg, ${GOLD}22, rgba(0,0,0,0.6) 70%)`,
              boxShadow: `0 14px 30px -18px ${GOLD}aa`,
            }}>
            <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: GOLD_HI }}>{p.days} Days</div>
            <div className="mt-0.5 text-[18px] font-black tabular-nums" style={{ color: EMERALD, textShadow: `0 0 10px ${EMERALD}66` }}>{p.apy}%</div>
            <div className="text-[9px] uppercase tracking-wider text-white/50">APY</div>
            <div className="mt-2 text-[10px] text-white/60 tabular-nums">Min ৳{p.min.toLocaleString("en-IN")}</div>
            <div className="text-[10px] text-white/60 tabular-nums">Return / ৳100: {p.ret}</div>
          </button>
        ))}
      </div>
    </section>
  );
}





/* ═══════════════════════════════════════════════════════════════════════
   Section 14 · Upcoming Event Calendar
═══════════════════════════════════════════════════════════════════════ */
const UPCOMING = [
  { date: "Mon",  label: "Weekly Cashback",       color: EMERALD },
  { date: "Wed",  label: "Aviator Tournament",    color: PINK    },
  { date: "Fri",  label: "Mega Jackpot Draw",     color: GOLD    },
  { date: "Sat",  label: "VIP Vault Drop",        color: PURPLE  },
  { date: "Sun",  label: "Lucky Draw Reveal",     color: BLUE    },
] as const;

function UpcomingCalendar() {
  return (
    <Panel>
      <SectionHeader eyebrow="This Week" title="Upcoming Events" color={BLUE} />
      <ul className="space-y-1.5" role="list">
        {UPCOMING.map((u) => (
          <li key={u.date}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-2.5 py-2"
          >
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-[10px] font-black uppercase tracking-wider shrink-0 tabular-nums"
              style={{ borderColor: `${u.color}66`, background: `${u.color}22`, color: u.color }}>
              {u.date}
            </span>
            <div className="min-w-0 flex-1 text-[12px] font-bold text-white truncate">{u.label}</div>
            <ChevronRight aria-hidden="true" className="h-4 w-4 text-white/40 shrink-0" />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Section 15 · GoLucky Ecosystem CTA
═══════════════════════════════════════════════════════════════════════ */
function EcosystemCTA() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 p-5 lg:p-7 text-center"
      style={{
        background:
          `radial-gradient(120% 90% at 50% 0%, ${GOLD}30, transparent 55%),` +
          `radial-gradient(90% 70% at 50% 100%, ${PURPLE}25, transparent 55%),` +
          `linear-gradient(180deg, rgba(16,10,4,0.92), rgba(6,4,16,0.98))`,
        boxShadow: `0 20px 60px -28px ${GOLD}aa, inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-screen"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, ${GOLD}44, ${PURPLE}44, ${BLUE}44, ${EMERALD}44, ${GOLD}44)`,
          filter: "blur(50px)",
        }} />
      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.22em]"
          style={{ color: GOLD_HI, borderColor: `${GOLD}55`, background: `${GOLD}18` }}>
          <ShieldCheck className="h-3 w-3" aria-hidden="true" /> GoLucky Ecosystem
        </div>
        <h2 className="mt-3 text-[24px] lg:text-[36px] font-black leading-[1.05] tracking-tight"
          style={{
            background: `linear-gradient(90deg, ${GOLD_HI}, ${GOLD}, ${GOLD_HI})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            textShadow: `0 0 22px ${GOLD}66`,
          }}>
          Play. Invest. Earn.
        </h2>
        <p className="mt-1 text-[12px] lg:text-[14px] text-white/70 max-w-md mx-auto">
          One premium ecosystem for gaming, investing, and building generational wealth.
        </p>

        {/* Ecosystem stats subline */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] lg:text-[11px] font-black uppercase tracking-wider">
          <span style={{ color: GOLD_HI }}>20,000+ Games</span>
          <span className="text-white/25">·</span>
          <span style={{ color: PURPLE }}>৳1 Cr Lucky Draw</span>
          <span className="text-white/25">·</span>
          <span style={{ color: EMERALD }}>Fixed Deposit</span>
          <span className="text-white/25">·</span>
          <span style={{ color: BLUE }}>Agent Programme</span>
          <span className="text-white/25">·</span>
          <span style={{ color: PINK }}>VIP Rewards</span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => navigate("/games")}
            aria-label="Play Games"
            className="relative overflow-hidden inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 font-black text-[12px] uppercase tracking-wider transition-transform hover:scale-[1.03] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#FEC013]"
            style={{
              background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`,
              color: "#1a0f00", boxShadow: `0 12px 26px -8px ${GOLD}cc`,
            }}>
            <Play className="h-4 w-4" aria-hidden="true" /> Play Games
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1/3 lh-shine-sweep"
              style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)` }} />
          </button>
          <button
            onClick={() => {
              window.history.pushState(null, "", "#fixed-deposit");
              document.getElementById("fixed-deposit")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            aria-label="Invest Now"
            className="relative overflow-hidden inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 font-black text-[12px] uppercase tracking-wider transition-transform hover:scale-[1.03] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#FEC013]"
            style={{
              background: `linear-gradient(135deg, ${EMERALD}, ${BLUE})`,
              color: "white", boxShadow: `0 12px 26px -8px ${EMERALD}cc`,
            }}>
            <Vault className="h-4 w-4" aria-hidden="true" /> Invest Now
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1/3 lh-shine-sweep"
              style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)` }} />
          </button>
          <button
            onClick={() => navigate("/agent")}
            aria-label="Become Agent"
            className="relative overflow-hidden inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 font-black text-[12px] uppercase tracking-wider transition-transform hover:scale-[1.03] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#FEC013]"
            style={{
              background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`,
              color: "white", boxShadow: `0 12px 26px -8px ${PURPLE}cc`,
            }}>
            <Handshake className="h-4 w-4" aria-hidden="true" /> Become Agent
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1/3 lh-shine-sweep"
              style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)` }} />
          </button>
        </div>

      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Lucky Hub Exclusive Master Brand Badge
═══════════════════════════════════════════════════════════════════════ */
function LuckyHubBrand() {
  return (
    <header
      aria-label="Lucky Hub master brand"
      className="relative overflow-hidden rounded-3xl border p-3 lg:p-4 flex items-center gap-3"
      style={{
        borderColor: `${GOLD}55`,
        background:
          `radial-gradient(120% 90% at 0% 0%, ${GOLD}28, transparent 55%),` +
          `radial-gradient(90% 70% at 100% 100%, ${EMERALD}22, transparent 55%),` +
          `linear-gradient(180deg, rgba(14,10,4,0.85), rgba(6,10,8,0.95))`,
        backdropFilter: "blur(18px)",
        boxShadow: `0 20px 50px -24px ${GOLD}aa, 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 40px -20px ${EMERALD}88`,
      }}
    >
      <span
        aria-hidden="true"
        className="relative inline-flex h-12 w-12 lg:h-14 lg:w-14 items-center justify-center rounded-2xl border shrink-0"
        style={{
          borderColor: `${GOLD}77`,
          background: `linear-gradient(135deg, ${GOLD}30, ${EMERALD}20)`,
          boxShadow: `0 10px 24px -8px ${GOLD}aa, inset 0 1px 0 rgba(255,255,255,0.15)`,
          color: GOLD_HI,
        }}
      >
        <Crown className="h-6 w-6 lg:h-7 lg:w-7" />
        <Gift
          className="absolute -bottom-1 -right-1 h-4 w-4"
          style={{ color: EMERALD, filter: `drop-shadow(0 0 6px ${EMERALD}cc)` }}
        />
        <Star
          className="absolute -top-1 -left-1 h-3 w-3"
          style={{ color: GOLD_HI, filter: `drop-shadow(0 0 6px ${GOLD}cc)` }}
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h1
            className="text-[18px] lg:text-[22px] font-black leading-none tracking-tight"
            style={{
              background: `linear-gradient(90deg, ${GOLD_HI}, ${GOLD}, ${EMERALD}, ${GOLD_HI})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: `0 0 22px ${GOLD}66`,
            }}
          >
            LUCKY HUB
          </h1>
          <Sparkles className="h-4 w-4" style={{ color: GOLD_HI }} aria-hidden="true" />
        </div>
        <div className="mt-1 text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.18em] text-white/65 truncate">
          Rewards · Events · Jackpot · Missions
        </div>
      </div>
      <span
        className="hidden sm:inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-widest shrink-0"
        style={{ color: EMERALD, borderColor: `${EMERALD}66`, background: `${EMERALD}18` }}
      >
        <span className="h-1 w-1 rounded-full animate-pulse" style={{ background: EMERALD }} />
        v1.0
      </span>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════════════════════════ */
function AgentProgramHero() {
  const navigate = useNavigate();
  return (
    <section aria-label="Agent Program Hero"
      className="relative overflow-hidden rounded-3xl border p-3 flex items-center gap-3"
      style={{
        borderColor: `${BLUE}44`,
        background:
          `radial-gradient(120% 90% at 0% 0%, ${BLUE}30, transparent 55%),` +
          `linear-gradient(135deg, ${PURPLE}22, rgba(0,0,0,0.7))`,
        boxShadow: `0 14px 30px -18px ${BLUE}aa`,
      }}>
      <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 lh-shine-sweep"
        style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)` }} aria-hidden="true" />
      <span aria-hidden="true"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border shrink-0"
        style={{ borderColor: `${BLUE}66`, background: `${BLUE}22`, color: BLUE }}>
        <Handshake className="h-5 w-5" />
      </span>
      <div className="relative min-w-0 flex-1">
        <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border animate-pulse"
          style={{ color: ORANGE, borderColor: `${ORANGE}66`, background: `${ORANGE}22` }}>
          <Flame className="h-2.5 w-2.5" aria-hidden="true" /> HOT · Agent Program
        </div>
        <div className="mt-0.5 text-[14px] font-black text-white leading-tight">Become GoLucky Agent · ৳200</div>
        <div className="text-[10.5px] text-white/60">7 levels · Salary · Commission · Lifetime income</div>
      </div>
      <button
        onClick={() => navigate("/agent")}
        aria-label="Join Agent Program"
        className="relative shrink-0 rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-wider"
        style={{ background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})`, color: "white", boxShadow: `0 10px 24px -8px ${BLUE}cc` }}>
        Join
      </button>
    </section>
  );
}

export default function LuckyHub() {
  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);
  return (
    <div className="min-h-dvh w-full flex justify-center" style={{ background: BG }}>
      <main
        aria-label="Lucky Hub"
        className="w-full max-w-[430px] lg:max-w-[1280px] px-3 lg:px-8 py-3 lg:py-6 pb-28 space-y-3 lg:space-y-5"
      >
        {/* 1 · Lucky Hub Hero */}
        <LuckyHubBrand />
        <HeroSlider />
        {/* 2 · Agent Program Hero */}
        <AgentProgramHero />
        {/* 3 · Quick Access Center */}
        <QuickAccess />
        {/* 4 · Premium Fixed Deposit Centre */}
        <div id="fixed-deposit" style={{ scrollMarginTop: 80 }}><PremiumFixedDeposit /></div>
        {/* 5 · Mega Jackpot */}
        <div id="lucky-draw" style={{ scrollMarginTop: 80 }}><FeaturedOpportunities /></div>
        {/* 6 · Live Events */}
        <RunningEvents />
        {/* 7 · Tournament Arena */}
        <TournamentArena />
        {/* 8 · Mission Hub */}
        <div id="cashback-fest" style={{ scrollMarginTop: 80 }}><ChallengeCenter /></div>
        {/* 9 · Millionaire Club */}
        <MillionaireClub />
        {/* 10 · Mystery Box & Lucky Zone */}
        <MysteryZone />
        {/* 11 · VIP Club */}
        <div id="vip-festival" style={{ scrollMarginTop: 80 }}><VipClub /></div>
        {/* 12 · Recent Winners Feed */}
        <RecentWinners />
        {/* 13 · Agent Opportunity Center */}
        <div id="agent-program" style={{ scrollMarginTop: 80 }}><AgentOpportunity /></div>
        {/* Live Jackpot counter — supplementary */}
        <div id="live-jackpot" style={{ scrollMarginTop: 80 }}><LiveJackpotCounter /></div>
        {/* 14 · Lucky Wheel */}
        <FreeDailySpin />
        {/* 15 · Upcoming Events */}
        <UpcomingCalendar />
        {/* 16 · GoLucky Ecosystem Footer */}
        <EcosystemCTA />
      </main>
      <BottomNav />
    </div>
  );
}
