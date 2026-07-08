import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Crown, Gem, Gift, Sparkles, Trophy, Users, Wallet as WalletIcon,
  Landmark, Ticket, ShoppingBag, HeartHandshake, Radio, Star,
  Zap, Flame, TrendingUp, Award, Diamond, ChevronRight, Coins,
  Calendar, CheckCircle2, Lock, Brain, Rocket, Package, Mail,
  BarChart3, Swords,
} from "lucide-react";
import { toast } from "sonner";
import { formatTaka, formatTakaCompact } from "@/lib/currency";
import { useRewardsFeed } from "@/hooks/useRewardsFeed";

// ─── Palette (reuse Home tokens, kept local per project convention) ───────
const GOLD = "#FEC013";
const GOLD_HI = "#FDE68A";
const GOLD_DEEP = "#B8862F";
const EMERALD = "#12C665";
const BLUE = "#02B4FA";
const PURPLE = "#DA29FB";
const ROSE = "#F43F5E";

// ─── Shared primitives ────────────────────────────────────────────────────
function SectionShell({
  eyebrow, title, subtitle, icon, tone = GOLD, tone2, children,
}: {
  eyebrow: string; title: string; subtitle?: string;
  icon: React.ReactNode; tone?: string; tone2?: string; children: React.ReactNode;
}) {
  const accent = tone2 ?? tone;
  return (
    <section
      className="relative overflow-hidden rounded-3xl border bg-[#0b1220]/70 p-4 shadow-[0_25px_80px_-30px_rgba(0,0,0,0.9)] md:p-6"
      style={{ borderColor: `${tone}33` }}
    >
      {/* Dual-tone identity: top gradient stripe + corner glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${tone}, ${accent})` }}
      />
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full opacity-40 blur-3xl"
        style={{ background: `radial-gradient(circle, ${tone}55, transparent 60%)` }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full opacity-30 blur-3xl"
        style={{ background: `radial-gradient(circle, ${accent}44, transparent 60%)` }}
      />
      <header className="relative mb-4 flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-inner"
          style={{
            color: tone,
            borderColor: `${tone}55`,
            background: `linear-gradient(135deg, ${tone}22, ${accent}22)`,
          }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: tone }}>
            {eyebrow}
          </div>
          <h2 className="truncate text-lg font-black text-white md:text-xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[11px] text-white/55">{subtitle}</p>}
        </div>
      </header>
      <div className="relative">{children}</div>
    </section>
  );
}

function KPI({ label, value, hint, tone = GOLD }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/45">{label}</div>
      <div className="mt-1 text-lg font-black tabular-nums" style={{ color: tone }}>{value}</div>
      {hint && <div className="mt-0.5 text-[10px] text-white/40">{hint}</div>}
    </div>
  );
}

// ─── Screen 1 · Rewards Hero Arena ────────────────────────────────────────
function Screen1Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-[#1a1204] via-[#0b1220] to-[#0a1a1a] p-5 shadow-[0_35px_100px_-30px_rgba(254,192,19,0.35)] md:p-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-10 h-56 w-56 rounded-full blur-3xl" style={{ background: `${GOLD}44` }} />
        <div className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full blur-3xl" style={{ background: `${PURPLE}33` }} />
      </div>

      <div className="relative flex items-start gap-3">
        <div className="flex items-center gap-1.5">
          <Crown className="h-6 w-6 animate-pulse" style={{ color: GOLD_HI }} />
          <Diamond className="h-5 w-5" style={{ color: BLUE }} />
          <Gift className="h-6 w-6" style={{ color: EMERALD }} />
        </div>
        <span className="ml-auto rounded-full border border-amber-300/40 bg-amber-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">
          <Flame className="mr-1 inline h-3 w-3" />Rewards Live
        </span>
      </div>

      <h1 className="relative mt-3 bg-gradient-to-r from-amber-200 via-white to-emerald-200 bg-clip-text text-3xl font-black uppercase leading-[0.95] tracking-tight text-transparent md:text-5xl">
        Rewards<br />Vault Arena
      </h1>
      <p className="relative mt-2 max-w-lg text-xs text-white/60 md:text-sm">
        The complete GoLucky rewards ecosystem — daily bonuses, cashback, VIP perks, referral commissions, and mystery drops, all in one command centre.
      </p>

      <div className="relative mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        <KPI label="Total Distributed" value={formatTakaCompact(184_562_300)} tone={GOLD_HI} hint="Lifetime payout" />
        <KPI label="Today's Pool" value={formatTakaCompact(4_820_000)} tone={EMERALD} hint="Refresh 24h" />
        <KPI label="Claimable" value={formatTaka(0, 0)} tone={BLUE} hint="Your available" />
        <KPI label="VIP Bonus" value={formatTakaCompact(2500)} tone={PURPLE} hint="Unlock at L3" />
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        <Link
          to="/wallet"
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-emerald-400 px-5 text-sm font-black text-black shadow-[0_18px_45px_-15px_rgba(254,192,19,0.6)]"
        >
          <Gift className="h-4 w-4" /> Claim Rewards
        </Link>
        <Link
          to="/vip"
          className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 text-sm font-black text-white hover:bg-white/10"
        >
          <Crown className="h-4 w-4" /> VIP Vault
        </Link>
      </div>
    </section>
  );
}

// ─── Screen 2 · Daily Login Rewards ───────────────────────────────────────
const DAILY = [
  { d: 1, r: 10 }, { d: 2, r: 20 }, { d: 3, r: 50 }, { d: 4, r: 100 },
  { d: 5, r: 200 }, { d: 6, r: 500 }, { d: 7, r: null as null | number },
];
function Screen2Daily() {
  const currentDay = 3;
  return (
    <SectionShell
      eyebrow="7-Day Streak"
      title="Daily Login Rewards"
      subtitle="Log in every day to climb the streak. Miss a day and the ladder resets."
      icon={<Gift className="h-5 w-5" />} tone={EMERALD} tone2={GOLD_HI}
    >
      <div className="relative mb-4 flex justify-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-emerald-300/40 bg-gradient-to-br from-emerald-500/30 via-amber-500/20 to-transparent shadow-[0_20px_50px_-15px_rgba(18,198,101,0.6)]">
          <Gift className="h-12 w-12 animate-pulse" style={{ color: GOLD_HI }} />
          <Sparkles className="absolute -top-2 -right-2 h-5 w-5 animate-pulse" style={{ color: GOLD_HI }} />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {DAILY.map(({ d, r }) => {
          const claimed = d < currentDay;
          const active = d === currentDay;
          const mystery = r === null;
          return (
            <div
              key={d}
              className={`relative flex flex-col items-center justify-center rounded-xl border p-2 text-center transition ${
                active
                  ? "border-amber-300/60 bg-amber-500/15 shadow-[0_10px_25px_-8px_rgba(254,192,19,0.5)]"
                  : claimed
                    ? "border-emerald-400/30 bg-emerald-500/10"
                    : "border-white/8 bg-white/[0.03] opacity-70"
              }`}
            >
              <div className="text-[9px] font-black uppercase tracking-widest text-white/50">Day {d}</div>
              <div className={`mt-1 text-[13px] font-black tabular-nums ${mystery ? "text-purple-300" : "text-amber-200"}`}>
                {mystery ? "?" : formatTakaCompact(r!)}
              </div>
              {claimed && <CheckCircle2 className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-emerald-500 p-0.5 text-black" />}
              {active && <div className="mt-0.5 text-[8px] font-black text-amber-300">TODAY</div>}
            </div>
          );
        })}
      </div>

      <Link
        to="/activity"
        className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-400 text-xs font-black text-black shadow-[0_15px_30px_-10px_rgba(18,198,101,0.5)]"
      >
        <Calendar className="h-4 w-4" /> Open Daily Reward Centre
      </Link>
    </SectionShell>
  );
}

// ─── Screen 3 · Cashback Center ───────────────────────────────────────────
const CASHBACKS = [
  { k: "Daily",   pct: "1.5%",  earned: 320,   avail: 120,  tone: EMERALD, icon: <Zap className="h-4 w-4" /> },
  { k: "Weekly",  pct: "3%",    earned: 1420,  avail: 640,  tone: BLUE,    icon: <TrendingUp className="h-4 w-4" /> },
  { k: "Monthly", pct: "6%",    earned: 6820,  avail: 2100, tone: GOLD_HI, icon: <Trophy className="h-4 w-4" /> },
  { k: "VIP",     pct: "10%",   earned: 24800, avail: 5200, tone: PURPLE,  icon: <Crown className="h-4 w-4" /> },
];
function Screen3Cashback() {
  return (
    <SectionShell
      eyebrow="Loss Recovery"
      title="Cashback Center"
      subtitle="Get a percentage back on every wagered amount, paid on schedule."
      icon={<HeartHandshake className="h-5 w-5" />} tone={EMERALD} tone2={BLUE}
    >
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {CASHBACKS.map((c) => (
          <div key={c.k} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center gap-1.5" style={{ color: c.tone }}>
              {c.icon}
              <span className="text-[11px] font-black uppercase tracking-widest">{c.k}</span>
            </div>
            <div className="mt-2 text-2xl font-black" style={{ color: c.tone }}>{c.pct}</div>
            <div className="mt-2 space-y-0.5 text-[10px] text-white/50">
              <div className="flex justify-between"><span>Earned</span><span className="font-bold text-white/80">{formatTaka(c.earned, 0)}</span></div>
              <div className="flex justify-between"><span>Available</span><span className="font-bold text-emerald-300">{formatTaka(c.avail, 0)}</span></div>
            </div>
            <button
              onClick={() => toast("Cashback claim opens in Wallet Centre.")}
              className="mt-2 flex h-8 items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 text-[10px] font-black text-white hover:bg-white/10"
            >
              <Coins className="h-3 w-3" /> Claim
            </button>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

// ─── Screen 4 · Achievement Rewards ───────────────────────────────────────
const ACHIEVEMENTS = [
  { t: "First Deposit",  prog: 100, r: 100,  icon: <WalletIcon className="h-4 w-4" />, done: true,  tone: EMERALD },
  { t: "First Win",       prog: 100, r: 50,   icon: <Trophy    className="h-4 w-4" />, done: true,  tone: GOLD_HI },
  { t: "100 Games Played",prog: 62,  r: 500,  icon: <Flame     className="h-4 w-4" />, done: false, tone: ROSE },
  { t: "VIP Upgrade",     prog: 40,  r: 1000, icon: <Crown     className="h-4 w-4" />, done: false, tone: PURPLE },
  { t: "Agent Join",      prog: 0,   r: 2000, icon: <Users     className="h-4 w-4" />, done: false, tone: BLUE },
  { t: "FD Investor",     prog: 15,  r: 5000, icon: <Landmark  className="h-4 w-4" />, done: false, tone: GOLD },
];
function Screen4Achievements() {
  return (
    <SectionShell
      eyebrow="Milestones"
      title="Achievement Rewards"
      subtitle="Unlock permanent bonuses for hitting play, deposit and loyalty milestones."
      icon={<Award className="h-5 w-5" />} tone={GOLD_HI} tone2={EMERALD}
    >
      <div className="grid gap-2 md:grid-cols-2">
        {ACHIEVEMENTS.map((a) => (
          <div key={a.t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5" style={{ color: a.tone }}>{a.icon}</span>
                <div>
                  <div className="text-xs font-black text-white">{a.t}</div>
                  <div className="text-[10px] text-white/50">Reward · <span className="font-bold text-amber-200">{formatTaka(a.r, 0)}</span></div>
                </div>
              </div>
              <button
                onClick={() => a.done ? toast.success("Achievement reward already credited.") : toast("Complete this milestone to claim.")}
                disabled={!a.done}
                className={`h-7 rounded-lg px-2 text-[10px] font-black ${a.done ? "bg-emerald-500 text-black" : "border border-white/10 bg-white/5 text-white/50"}`}
              >
                {a.done ? "Claim" : "Locked"}
              </button>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full" style={{ width: `${a.prog}%`, background: `linear-gradient(90deg, ${a.tone}, ${GOLD_HI})` }} />
            </div>
            <div className="mt-1 text-right text-[10px] text-white/45">{a.prog}%</div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

// ─── Screen 5 · Referral Rewards Empire ───────────────────────────────────
const REF_LEVELS = [
  { l: "L1", pct: "10%" }, { l: "L2", pct: "5%" }, { l: "L3", pct: "3%" },
  { l: "L4", pct: "2%" }, { l: "L5", pct: "1%" }, { l: "L6", pct: "0.5%" },
];
function Screen5Referral() {
  return (
    <SectionShell
      eyebrow="Network Growth"
      title="Referral Rewards Empire"
      subtitle="Build a 6-level downline and earn commission from every rupee they wager."
      icon={<Users className="h-5 w-5" />} tone={BLUE} tone2="#22D3EE"
    >
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <KPI label="Total Referrals" value="248" tone={BLUE} />
        <KPI label="Active" value="184" tone={EMERALD} />
        <KPI label="Referral Earnings" value={formatTakaCompact(58_400)} tone={GOLD_HI} />
        <KPI label="Lifetime" value={formatTakaCompact(320_000)} tone={PURPLE} />
      </div>

      {/* SVG Network Visual */}
      <div className="mt-4 flex items-center justify-center rounded-2xl border border-white/10 bg-black/40 p-3">
        <svg viewBox="0 0 300 140" className="h-32 w-full max-w-md">
          <defs>
            <radialGradient id="rf-core"><stop offset="0%" stopColor={GOLD_HI} /><stop offset="100%" stopColor={GOLD_DEEP} /></radialGradient>
          </defs>
          {[
            [40, 30], [90, 20], [150, 15], [210, 20], [260, 30],
            [30, 110], [90, 120], [150, 125], [210, 120], [270, 110],
          ].map(([x, y], i) => (
            <g key={i}>
              <line x1={150} y1={70} x2={x} y2={y} stroke={BLUE + "66"} strokeWidth={0.7} />
              <circle cx={x} cy={y} r={4} fill={i % 2 ? EMERALD : BLUE} opacity={0.85} />
            </g>
          ))}
          <circle cx={150} cy={70} r={14} fill="url(#rf-core)" />
          <text x={150} y={74} textAnchor="middle" fontSize={9} fontWeight="900" fill="#000">YOU</text>
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5 md:grid-cols-6">
        {REF_LEVELS.map((r) => (
          <div key={r.l} className="rounded-xl border border-blue-400/20 bg-blue-500/5 p-2 text-center">
            <div className="text-[10px] font-black text-blue-200">{r.l}</div>
            <div className="text-sm font-black text-amber-200">{r.pct}</div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

// ─── Screen 6 · VIP Rewards Vault ─────────────────────────────────────────
const VIP_LEVELS = Array.from({ length: 10 }, (_, i) => ({
  n: i + 1,
  cashback: `${1 + i * 0.5}%`,
  deposit: `${2 + i}%`,
  birthday: formatTakaCompact(500 * (i + 1)),
  monthly: formatTakaCompact(1000 * (i + 1)),
  special: i >= 4 ? "✓" : "—",
}));
function Screen6VIP() {
  return (
    <SectionShell
      eyebrow="Elite Tiers"
      title="VIP Rewards Vault"
      subtitle="10 progression tiers, each with escalating cashback, deposit bonuses and special drops."
      icon={<Crown className="h-5 w-5" />} tone={PURPLE} tone2={GOLD_HI}
    >
      <div className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        <div className="flex gap-2">
          {VIP_LEVELS.map((v) => (
            <div key={v.n} className="w-[160px] shrink-0 rounded-2xl border border-purple-400/25 bg-gradient-to-br from-purple-500/10 via-white/[0.02] to-amber-500/10 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Crown className="h-3.5 w-3.5" style={{ color: GOLD_HI }} />
                  <Diamond className="h-3 w-3" style={{ color: PURPLE }} />
                </div>
                <span className="text-[10px] font-black text-purple-200">VIP {v.n}</span>
              </div>
              <div className="mt-2 space-y-1 text-[10px]">
                <Row label="Cashback"  value={v.cashback}  color={EMERALD} />
                <Row label="Deposit"   value={v.deposit}   color={BLUE} />
                <Row label="Birthday"  value={v.birthday}  color={GOLD_HI} />
                <Row label="Monthly"   value={v.monthly}   color={PURPLE} />
                <Row label="Special"   value={v.special}   color={ROSE} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Link to="/vip" className="mt-3 flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-amber-400 text-xs font-black text-black">
        <Crown className="h-4 w-4" /> Enter VIP Club
      </Link>
    </SectionShell>
  );
}
function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/50">{label}</span>
      <span className="font-black" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── Screen 7 · FD Investor Rewards ───────────────────────────────────────
const FD_REWARDS = [
  { t: "Investor Bonus",       d: "One-time bonus on first FD lock", r: "+2%",    icon: <Gem className="h-4 w-4" />,        tone: GOLD_HI },
  { t: "APY Booster",          d: "Extra APY on 90+ day tenures",    r: "+0.5%",  icon: <TrendingUp className="h-4 w-4" />, tone: EMERALD },
  { t: "Loyalty Reward",       d: "Roll-over bonus each maturity",   r: "+1%",    icon: <Star className="h-4 w-4" />,       tone: BLUE },
  { t: "Milestone Reward",     d: "৳1L / ৳5L / ৳10L cumulative lock", r: "৳25K",  icon: <Trophy className="h-4 w-4" />,     tone: PURPLE },
];
function Screen7FD() {
  return (
    <SectionShell
      eyebrow="Investor Perks"
      title="FD Investor Rewards"
      subtitle="Extra yield layered on top of the base APY for Fixed Deposit holders."
      icon={<Landmark className="h-5 w-5" />} tone={GOLD} tone2={BLUE}
    >
      <div className="mb-4 flex items-center justify-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-amber-300/40 bg-gradient-to-br from-amber-500/25 via-yellow-500/15 to-transparent shadow-[0_20px_50px_-15px_rgba(254,192,19,0.6)]">
          <Landmark className="h-10 w-10" style={{ color: GOLD_HI }} />
          <Diamond className="absolute -top-2 -right-2 h-5 w-5 animate-pulse" style={{ color: BLUE }} />
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {FD_REWARDS.map((f) => (
          <div key={f.t} className="rounded-2xl border border-amber-400/15 bg-white/[0.03] p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5" style={{ color: f.tone }}>{f.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-xs font-black text-white">{f.t}</div>
                  <div className="text-sm font-black" style={{ color: f.tone }}>{f.r}</div>
                </div>
                <div className="mt-0.5 truncate text-[10px] text-white/50">{f.d}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Link to="/fixed-deposits" className="mt-3 flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-xs font-black text-black">
        <Landmark className="h-4 w-4" /> Explore Fixed Deposits
      </Link>
    </SectionShell>
  );
}

// ─── Screen 8 · Lucky Coupon Centre ───────────────────────────────────────
const COUPONS = [
  { t: "Cashback Coupon", code: "CASH25",  val: "25% back",  tone: EMERALD },
  { t: "Deposit Coupon",  code: "DEP100",  val: "+100% bonus", tone: BLUE },
  { t: "Free Bet",        code: "FREE500", val: "৳500 stake", tone: GOLD_HI },
  { t: "VIP Coupon",      code: "VIP2X",   val: "2× points",   tone: PURPLE },
];
function Screen8Coupons() {
  return (
    <SectionShell
      eyebrow="Redeem Codes"
      title="Lucky Coupon Centre"
      subtitle="Enter or claim promo codes distributed via events, agents and VIP hosts."
      icon={<Ticket className="h-5 w-5" />} tone={ROSE} tone2={GOLD_HI}
    >
      <div className="grid gap-2 md:grid-cols-2">
        {COUPONS.map((c) => (
          <div
            key={c.code}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3"
            style={{
              backgroundImage: `radial-gradient(circle at 0 50%, transparent 8px, ${c.tone}15 8px), radial-gradient(circle at 100% 50%, transparent 8px, ${c.tone}15 8px)`,
              backgroundSize: "51% 100%, 51% 100%",
              backgroundPosition: "left, right",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4" style={{ color: c.tone }} />
              <div className="text-xs font-black text-white">{c.t}</div>
              <span className="ml-auto text-xs font-black" style={{ color: c.tone }}>{c.val}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded-md border border-white/10 bg-black/50 px-2 py-1.5 font-mono text-[11px] text-amber-100">{c.code}</code>
              <button
                onClick={() => { navigator.clipboard?.writeText(c.code); toast.success(`Copied ${c.code}`); }}
                className="h-8 rounded-md bg-white/10 px-3 text-[10px] font-black text-white hover:bg-white/20"
              >
                Redeem
              </button>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

// ─── Screen 9 · Rewards Marketplace ───────────────────────────────────────
const SHOP = [
  { t: "Bonus Balance",     cost: 500,  gain: "৳500 wallet",   icon: <WalletIcon className="h-4 w-4" />, tone: EMERALD },
  { t: "Cashback Voucher",  cost: 1000, gain: "৳1,200",         icon: <HeartHandshake className="h-4 w-4" />, tone: BLUE },
  { t: "Lucky Draw Ticket", cost: 250,  gain: "1 entry",        icon: <Ticket className="h-4 w-4" />, tone: ROSE },
  { t: "VIP Days",          cost: 3000, gain: "7 days elite",   icon: <Crown className="h-4 w-4" />, tone: PURPLE },
  { t: "Mystery Box",       cost: 750,  gain: "৳100–৳10K",      icon: <Gift className="h-4 w-4" />, tone: GOLD_HI },
];
function Screen9Marketplace() {
  const points = 2450;
  return (
    <SectionShell
      eyebrow="Redemption"
      title="Rewards Marketplace"
      subtitle="Convert your loyalty points into wallet balance, tickets, or premium perks."
      icon={<ShoppingBag className="h-5 w-5" />} tone={GOLD_HI} tone2={EMERALD}
    >
      <div className="mb-3 flex items-center justify-between rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-amber-200">Your Points</div>
          <div className="text-2xl font-black tabular-nums" style={{ color: GOLD_HI }}>{points.toLocaleString()}</div>
        </div>
        <Sparkles className="h-8 w-8 animate-pulse" style={{ color: GOLD_HI }} />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {SHOP.map((s) => {
          const canAfford = points >= s.cost;
          return (
            <div key={s.t} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5" style={{ color: s.tone }}>{s.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-black text-white">{s.t}</div>
                <div className="text-[10px] text-white/50">{s.gain}</div>
              </div>
              <button
                onClick={() => canAfford ? toast.success(`Redeem flow for ${s.t} opens soon.`) : toast.error("Not enough points.")}
                className={`flex h-8 items-center gap-1 rounded-lg px-2 text-[10px] font-black ${canAfford ? "bg-gradient-to-r from-amber-400 to-emerald-400 text-black" : "border border-white/10 bg-white/5 text-white/50"}`}
              >
                {canAfford ? <Coins className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {s.cost} pts
              </button>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}

// ─── Screen 10 · Agent Rewards Center ─────────────────────────────────────
const AGENT_REWARDS = [
  { t: "Daily Commission",  v: formatTakaCompact(1250),  d: "0.5% on team turnover",   tone: GOLD_HI },
  { t: "Monthly Salary",    v: formatTakaCompact(15000), d: "Tier-based fixed pay",    tone: EMERALD },
  { t: "Team Growth Bonus", v: formatTakaCompact(8500),  d: "For net-new active users",tone: BLUE },
  { t: "Milestone Reward",  v: formatTakaCompact(50000), d: "৳50L lifetime turnover",  tone: PURPLE },
];
function Screen10Agent() {
  return (
    <SectionShell
      eyebrow="Agent Empire"
      title="Agent Rewards Center"
      subtitle="Rewards stack for verified agents — commission, salary and expansion bonuses."
      icon={<Users className="h-5 w-5" />} tone={PURPLE} tone2={ROSE}
    >
      <div className="grid gap-2 md:grid-cols-2">
        {AGENT_REWARDS.map((a) => (
          <div key={a.t} className="rounded-2xl border border-purple-400/20 bg-gradient-to-br from-purple-500/10 to-amber-500/5 p-3">
            <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: a.tone }}>{a.t}</div>
            <div className="mt-1 text-xl font-black" style={{ color: a.tone }}>{a.v}</div>
            <div className="mt-0.5 text-[10px] text-white/55">{a.d}</div>
          </div>
        ))}
      </div>
      <Link to="/agent" className="mt-3 flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-amber-400 text-xs font-black text-black">
        <ChevronRight className="h-4 w-4" /> Enter Agent Empire
      </Link>
    </SectionShell>
  );
}

// ─── Screen 11 · Recent Reward Winners (Live Feed) ────────────────────────
function Screen11Feed() {
  const feed = useRewardsFeed(20);
  // Duplicate list once so the CSS marquee loops seamlessly (translateX -50%).
  const ticker = useMemo(() => (feed.length ? [...feed, ...feed] : []), [feed]);
  const visible = useMemo(() => feed.slice(0, 6), [feed]);
  const biggest = useMemo(
    () => (feed.length ? [...feed].sort((a, b) => b.amount - a.amount)[0] : null),
    [feed],
  );
  const liveCount = feed.filter((f) => f.live).length;

  return (
    <SectionShell
      eyebrow="Live Feed"
      title="Recent Reward Winners"
      subtitle={`Live payouts across the platform · ${liveCount} live · ${feed.length - liveCount} sample`}
      icon={<Radio className="h-5 w-5 animate-pulse" />} tone={ROSE} tone2={GOLD_HI}
    >
      {/* Live scrolling marquee — driven by useRewardsFeed (DB + mock merge) */}
      <div className="mb-3 overflow-hidden rounded-2xl border border-rose-400/25 bg-black/40">
        <div
          className="flex whitespace-nowrap gap-8 py-2 text-[11px] font-black text-white/85"
          style={{ animation: "rc-ticker 32s linear infinite" }}
        >
          {ticker.map((r, i) => (
            <span key={`${r.id}-${i}`} className="inline-flex items-center gap-2 px-3">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: r.tone, boxShadow: `0 0 8px ${r.tone}` }}
              />
              <span className="text-white">{r.user}</span>
              <span style={{ color: r.tone }}>{r.kind}</span>
              <span className="text-white/50">·</span>
              <span className="tabular-nums" style={{ color: GOLD_HI }}>+{formatTaka(r.amount, 0)}</span>
              {r.live && (
                <span className="rounded-full border border-rose-400/40 px-1.5 py-0.5 text-[8px] uppercase tracking-widest text-rose-200">
                  Live
                </span>
              )}
            </span>
          ))}
        </div>
        <style>{`@keyframes rc-ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      </div>

      {biggest && (
        <div className="mb-3 flex items-center justify-between rounded-2xl border border-rose-400/25 bg-rose-500/5 p-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-rose-200">Biggest Today</div>
            <div className="text-xl font-black text-white">{biggest.user}</div>
            <div className="text-[10px] text-white/55">{biggest.kind}</div>
          </div>
          <div className="text-2xl font-black" style={{ color: GOLD_HI }}>{formatTakaCompact(biggest.amount)}</div>
        </div>
      )}

      <ul className="space-y-1.5">
        {visible.map((f) => (
          <li
            key={f.id}
            className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] p-2.5 animate-in fade-in slide-in-from-bottom-1 duration-500"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-black"
                style={{ background: f.tone }}
              >
                {f.user.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="truncate text-xs font-black text-white">{f.user}</div>
                <div className="text-[10px] text-white/50">{f.kind}</div>
              </div>
            </div>
            <div className="text-sm font-black tabular-nums" style={{ color: f.tone }}>
              +{formatTaka(f.amount, 0)}
            </div>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

// ─── Screen 12 · Ecosystem Footer ─────────────────────────────────────────
function Screen12Footer() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-br from-[#1a1204] via-[#0b1220] to-[#140628] p-6 text-center shadow-[0_35px_100px_-30px_rgba(218,41,251,0.35)] md:p-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/4 h-56 w-56 rounded-full blur-3xl" style={{ background: `${GOLD}33` }} />
        <div className="absolute -bottom-24 right-1/4 h-56 w-56 rounded-full blur-3xl" style={{ background: `${PURPLE}33` }} />
      </div>
      <div className="relative">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Crown className="h-6 w-6 animate-pulse" style={{ color: GOLD_HI }} />
          <Diamond className="h-5 w-5" style={{ color: BLUE }} />
          <Gift className="h-6 w-6" style={{ color: EMERALD }} />
        </div>
        <h2 className="bg-gradient-to-r from-amber-200 via-white to-purple-200 bg-clip-text text-4xl font-black uppercase tracking-tight text-transparent md:text-6xl">
          Play. Invest.<br />Earn.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-xs text-white/60 md:text-sm">
          The GoLucky rewards ecosystem pays you for every play, every deposit, every friend you bring in, and every day you stay loyal.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link to="/wallet"    className="flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-emerald-400 px-5 text-sm font-black text-black shadow-[0_18px_45px_-15px_rgba(254,192,19,0.6)]"><Gift className="h-4 w-4" /> Claim Rewards</Link>
          <Link to="/lucky-hub" className="flex h-11 items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 text-sm font-black text-white hover:bg-white/10"><Sparkles className="h-4 w-4" /> Open Lucky Hub</Link>
          <Link to="/vip"       className="flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-amber-400 px-5 text-sm font-black text-black"><Crown className="h-4 w-4" /> VIP Club</Link>
          <Link to="/agent"     className="flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 px-5 text-sm font-black text-white shadow-[0_18px_45px_-15px_rgba(218,41,251,0.6)]"><Rocket className="h-4 w-4" /> Agent Empire</Link>
        </div>
      </div>
    </section>
  );
}

// ─── Extra · Rewards Analytics Dashboard ──────────────────────────────────
function SectionAnalytics() {
  const rows = [
    { label: "Total Claimed",     v: 184_562_300, tone: GOLD_HI },
    { label: "This Month",        v: 12_480_000,  tone: EMERALD },
    { label: "Cashback Earned",   v: 46_200_000,  tone: EMERALD },
    { label: "Referral Rewards",  v: 28_900_000,  tone: BLUE },
    { label: "VIP Rewards",       v: 61_800_000,  tone: PURPLE },
    { label: "FD Rewards",        v: 37_100_000,  tone: GOLD },
  ];
  const max = Math.max(...rows.map((r) => r.v));
  return (
    <SectionShell
      eyebrow="Analytics"
      title="Rewards Analytics Dashboard"
      subtitle="Total, monthly, and per-programme reward payouts across the platform."
      icon={<BarChart3 className="h-5 w-5" />} tone={BLUE} tone2={EMERALD}
    >
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/45">{r.label}</div>
            <div className="mt-1 text-base font-black tabular-nums md:text-lg" style={{ color: r.tone }}>
              {formatTakaCompact(r.v)}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full" style={{ width: `${(r.v / max) * 100}%`, background: r.tone, boxShadow: `0 0 12px ${r.tone}80` }} />
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

// ─── Extra · Mystery Rewards Arena ────────────────────────────────────────
function SectionMystery() {
  const boxes = [
    { name: "Mystery Box",      hint: "Random ৳100 – ৳25K",  icon: <Package className="h-6 w-6" />, tone: ROSE },
    { name: "Golden Envelope",  hint: "Guaranteed cash",     icon: <Mail className="h-6 w-6" />,    tone: GOLD_HI },
    { name: "Lucky Chest",      hint: "Unlock 3 keys/day",   icon: <Gem className="h-6 w-6" />,     tone: BLUE },
    { name: "Super Reward Crate", hint: "Weekly grand prize", icon: <Trophy className="h-6 w-6" />, tone: PURPLE },
    { name: "Daily Surprise",   hint: "Login = 1 drop",      icon: <Sparkles className="h-6 w-6" />, tone: EMERALD },
  ];
  return (
    <SectionShell
      eyebrow="Mystery Arena"
      title="Mystery Rewards Arena"
      subtitle="Random drops, sealed boxes, and surprise crates — outside the normal marketplace."
      icon={<Package className="h-5 w-5" />} tone={ROSE} tone2={PURPLE}
    >
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {boxes.map((b) => (
          <button
            key={b.name}
            onClick={() => toast(`${b.name} · coming soon`)}
            className="group relative overflow-hidden rounded-2xl border p-3 text-left transition hover:scale-[1.02]"
            style={{ borderColor: `${b.tone}55`, background: `linear-gradient(135deg, ${b.tone}18, transparent 70%)` }}
          >
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl border" style={{ color: b.tone, borderColor: `${b.tone}55`, background: `${b.tone}14` }}>
              {b.icon}
            </div>
            <div className="text-sm font-black text-white">{b.name}</div>
            <div className="text-[10px] text-white/50">{b.hint}</div>
          </button>
        ))}
      </div>
    </SectionShell>
  );
}

// ─── Extra · Tournament Reward Hub ────────────────────────────────────────
function SectionTournament() {
  const rows = [
    { rank: 1, u: "GLU★Rakib",   pts: 184_200, prize: 250_000, tone: GOLD_HI },
    { rank: 2, u: "TanvirPro",   pts: 152_800, prize: 120_000, tone: BLUE },
    { rank: 3, u: "Nayeem007",   pts: 141_400, prize: 60_000,  tone: EMERALD },
    { rank: 4, u: "Sakib",       pts: 98_100,  prize: 25_000,  tone: PURPLE },
    { rank: 5, u: "Farhan",      pts: 82_700,  prize: 10_000,  tone: ROSE },
  ];
  return (
    <SectionShell
      eyebrow="Tournaments"
      title="Tournament Reward Hub"
      subtitle="Compete in weekly and monthly tournaments — climb the leaderboard, claim prize pools."
      icon={<Swords className="h-5 w-5" />} tone={GOLD_HI} tone2={ROSE}
    >
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-amber-200">Weekly Pool</div>
          <div className="mt-1 text-lg font-black" style={{ color: GOLD_HI }}>{formatTakaCompact(500_000)}</div>
          <div className="text-[10px] text-white/50">Ends Sunday 23:59</div>
        </div>
        <div className="rounded-2xl border border-purple-400/25 bg-purple-500/10 p-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-purple-200">Monthly Pool</div>
          <div className="mt-1 text-lg font-black" style={{ color: PURPLE }}>{formatTakaCompact(2_500_000)}</div>
          <div className="text-[10px] text-white/50">30-day cycle</div>
        </div>
        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Players</div>
          <div className="mt-1 text-lg font-black" style={{ color: EMERALD }}>12,480</div>
          <div className="text-[10px] text-white/50">Active this week</div>
        </div>
        <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-rose-200">Your Rank</div>
          <div className="mt-1 text-lg font-black text-white">#—</div>
          <div className="text-[10px] text-white/50">Join to enter</div>
        </div>
      </div>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li key={r.rank} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black text-black" style={{ background: r.tone }}>
                {r.rank}
              </span>
              <div className="truncate text-xs font-black text-white">{r.u}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-[10px] text-white/50 tabular-nums">{r.pts.toLocaleString()} pts</div>
              <div className="text-sm font-black tabular-nums" style={{ color: GOLD_HI }}>{formatTakaCompact(r.prize)}</div>
            </div>
          </li>
        ))}
      </ul>
      <button
        onClick={() => toast("Tournament registration opens shortly")}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-rose-500 text-sm font-black text-black shadow-[0_18px_45px_-15px_rgba(254,192,19,0.6)]"
      >
        <Trophy className="h-4 w-4" /> Join Tournament
      </button>
    </SectionShell>
  );
}

// ─── Extra · AI Rewards Engine ────────────────────────────────────────────
function SectionAIEngine() {
  const cards = [
    { title: "Recommended Reward",  desc: "Claim ৳500 Daily Bonus",      icon: <Gift className="h-5 w-5" />,      tone: EMERALD },
    { title: "Next Best Bonus",     desc: "Cashback multiplier x1.5",    icon: <Zap className="h-5 w-5" />,       tone: GOLD_HI },
    { title: "VIP Upgrade",         desc: "৳2,300 to reach VIP L4",      icon: <Crown className="h-5 w-5" />,     tone: PURPLE },
    { title: "Cashback Prediction", desc: "≈ ৳4,120 payout Sun 02:00",   icon: <TrendingUp className="h-5 w-5" />,tone: BLUE },
  ];
  return (
    <SectionShell
      eyebrow="AI Engine"
      title="AI Rewards Engine"
      subtitle="Personalised suggestions ranked by your play, deposits, and reward history."
      icon={<Brain className="h-5 w-5" />} tone={PURPLE} tone2={BLUE}
    >
      <div className="mb-3 flex items-center justify-between rounded-2xl border border-purple-400/25 bg-purple-500/5 p-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-purple-200">Reward Score</div>
          <div className="text-2xl font-black text-white">82<span className="text-sm text-white/40">/100</span></div>
          <div className="text-[10px] text-white/55">Elite tier · engine confidence 94%</div>
        </div>
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${PURPLE} 0 82%, rgba(255,255,255,0.08) 82% 100%)` }} />
          <div className="absolute inset-1.5 flex items-center justify-center rounded-full bg-[#0b1220]">
            <Brain className="h-5 w-5" style={{ color: PURPLE }} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border p-3" style={{ borderColor: `${c.tone}44`, background: `linear-gradient(135deg, ${c.tone}12, transparent 75%)` }}>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ color: c.tone, borderColor: `${c.tone}55` }}>
                {c.icon}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: c.tone }}>{c.title}</div>
            </div>
            <div className="mt-1.5 text-sm font-black text-white">{c.desc}</div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

// ─── Ambient FX layer (static glows only — particles/drifters removed for perf) ───
function AmbientFX() {
  return (
    <div data-rc-fx aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Ambient radial glows (static, GPU-cheap) */}
      <div className="absolute -top-32 left-[10%] h-80 w-80 rounded-full blur-[100px] opacity-40" style={{ background: `${GOLD}33` }} />
      <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full blur-[110px] opacity-30" style={{ background: `${PURPLE}33` }} />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full blur-[120px] opacity-25" style={{ background: `${EMERALD}2e` }} />
      <div className="absolute top-2/3 left-0 h-72 w-72 rounded-full blur-[100px] opacity-25" style={{ background: `${BLUE}2e` }} />
    </div>
  );
}


// ─── Page ────────────────────────────────────────────────────────────────
export default function RewardsCentre() {
  useEffect(() => {
    document.title = "Rewards Centre · GoLucky";
  }, []);
  return (
    <div data-rc-root className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#05060f] via-[#070b1c] to-[#050914] pb-24 pt-4 text-white">
      <AmbientFX />
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-4 px-3 md:gap-6 md:px-6">
        {/* 11 required Rewards Centre sections in exact locked order.
           No duplicates, no legacy Lucky Vault, no extra reward systems. */}
        <Screen1Hero />
        <Screen2Daily />
        <Screen3Cashback />
        <Screen4Achievements />
        <Screen5Referral />
        <Screen6VIP />
        <Screen7FD />
        <Screen8Coupons />
        <Screen9Marketplace />
        <Screen10Agent />
        <Screen11Feed />
        <Screen12Footer />
      </div>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          /* Freeze every animation/transition inside the Rewards page
             (animate-pulse, animate-ping, animate-in, custom keyframes)
             while preserving all glass, blur, gradient, and layout styles. */
          [data-rc-root], [data-rc-root] * {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            animation-delay: 0ms !important;
            transition-duration: 0.001ms !important;
            transition-delay: 0ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
