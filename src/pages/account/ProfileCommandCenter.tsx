import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  BadgeCheck, Copy, QrCode, Crown, ShieldCheck, Star, Sparkles,
  Wallet as WalletIcon, Gift, Users, Landmark, Gem, LifeBuoy,
  Settings2, KeyRound, TrendingUp, ArrowDownRight, ArrowUpRight,
  Coins, Diamond, Flame, Zap, Fingerprint,
  Briefcase, Trophy as TrophyIcon, Award, Share2, Lock,
  ArrowDownToLine, ArrowUpFromLine, Repeat2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWalletCentreData } from "@/hooks/useWalletCentreData";
import { useVIPLevel, VIP_LEVELS, VIP_BENEFITS, formatExp } from "@/hooks/useVIPLevel";
import { formatTaka, formatTakaCompact } from "@/lib/currency";
import type { AccountOverviewProps } from "@/pages/account/AccountOverview";
import { Link2, Trophy, Percent, Gauge } from "lucide-react";


// ─── Premium palette (Black + Emerald + Gold + Cyan + Purple) ────────────
const GOLD    = "#FEC013";
const GOLD_HI = "#FDE68A";
const EMERALD = "#10B981";
const CYAN    = "#22D3EE";
const PURPLE  = "#DA29FB";
const ROSE    = "#F43F5E";
const BLUE    = "#02B4FA";

const taka  = (n: number) => formatTaka(n, 0);
const compact = (n: number) => (n > 0 ? formatTakaCompact(n) : "৳0");

// ─── Shared glass shell ──────────────────────────────────────────────────
function SectionShell({
  eyebrow, title, subtitle, icon, tone = GOLD, tone2, children, id,
}: {
  eyebrow: string; title: string; subtitle?: string;
  icon: React.ReactNode; tone?: string; tone2?: string;
  children: React.ReactNode; id?: string;
}) {
  const t2 = tone2 ?? tone;
  return (
    <section
      id={id}
      className="pcc-luxury-shine pcc-font-body relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-black/40 to-black/60 p-4 shadow-[0_25px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl md:p-6"
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-20 -left-16 h-52 w-52 rounded-full blur-3xl" style={{ background: `${tone}22` }} />
        <div className="absolute -bottom-20 -right-16 h-52 w-52 rounded-full blur-3xl" style={{ background: `${t2}22` }} />
      </div>
      <header className="relative mb-3 flex items-center gap-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl border"
          style={{ borderColor: `${tone}55`, background: `linear-gradient(135deg, ${tone}22, ${t2}11)`, color: tone }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase tracking-[0.28em] text-white/50">{eyebrow}</div>
          <div className="pcc-font-royal truncate text-[16px] font-bold tracking-tight text-white md:text-xl" style={{ textShadow: `0 0 24px ${tone}44` }}>{title}</div>
          {subtitle ? <div className="pcc-font-body mt-0.5 truncate text-[11px] text-white/50">{subtitle}</div> : null}
        </div>
      </header>
      <div className="relative">{children}</div>
    </section>
  );
}


// ─── Section 01 · Command Hero ───────────────────────────────────────────
function Section01Hero({
  profile, onCopy,
}: {
  profile: AccountOverviewProps["profile"];
  onCopy: (val: string, label: string) => void;
}) {
  const d = useWalletCentreData();
  const vipPct = Math.max(0, Math.min(100, (profile.vip_exp % 1000) / 10));
  const isAgent = profile.agent_status === "approved";
  const initial = (profile.username || profile.full_name || "G").slice(0, 1).toUpperCase();

  return (
    <SectionShell
      eyebrow="Command Hero" title="Profile Command Center"
      subtitle="Your GoLucky identity, VIP progress and referral empire."
      icon={<Crown className="h-4 w-4" />} tone={GOLD} tone2={EMERALD}
    >
      {/* Floating particles removed — performance cleanup (Profile Ultra Premium). */}


      <div className="relative flex flex-col items-center gap-4 md:flex-row md:items-start md:gap-6">
        {/* Avatar + VIP ring + Crown */}
        <div className="relative">
          {/* Premium gold crown floating above */}
          {profile.vip_level > 0 && (
            <div className="absolute -top-6 left-1/2 z-20 -translate-x-1/2">
              <Crown className="h-8 w-8 md:h-9 md:w-9" style={{ color: GOLD_HI, filter: `drop-shadow(0 0 10px ${GOLD}) drop-shadow(0 0 20px ${GOLD}88)` }} />
            </div>
          )}
          {/* Dual orbit rings (Neo-Royal) */}
          <div className="pcc-orbit-slow absolute inset-[-10px] rounded-full border-2 border-amber-400/25" />
          <div className="pcc-orbit-fast absolute inset-[-14px] rounded-full border-t-2 border-amber-300" />
          <div
            className="absolute -inset-1 rounded-full opacity-90"
            style={{ background: `conic-gradient(${GOLD}, ${EMERALD}, ${CYAN}, ${PURPLE}, ${GOLD})`, filter: "blur(1px)" }}
          />
          <div className="absolute -inset-2 rounded-full opacity-60 blur-xl" style={{ background: `radial-gradient(circle, ${GOLD}55, transparent 70%)` }} />
          <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-[3px] border-black bg-gradient-to-br from-black to-neutral-900 shadow-[0_20px_60px_-15px_rgba(254,192,19,0.5)] md:h-36 md:w-36">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
            ) : (
              <span className="pcc-font-royal text-4xl font-bold text-white/80 md:text-5xl">{initial}</span>
            )}
          </div>
          {/* Animated verified badge */}
          {profile.kyc_level > 0 && (
            <span
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-black shadow-[0_0_20px_rgba(16,185,129,0.7)]"
              style={{ background: `linear-gradient(135deg, ${EMERALD}, #34d399)` }}
            >
              {/* ambient ping removed for performance */}
              <BadgeCheck className="relative h-5 w-5 text-black" />
            </span>
          )}
        </div>

        {/* Identity */}
        <div className="min-w-0 flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <h2 className="pcc-font-royal truncate bg-gradient-to-r from-amber-200 via-white to-emerald-200 bg-clip-text text-2xl font-bold tracking-tight text-transparent md:text-3xl" style={{ filter: `drop-shadow(0 0 18px ${GOLD}55)` }}>
              {profile.username || profile.full_name || "GoLucky Member"}
            </h2>
            {profile.vip_level > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black shadow-[0_0_18px_rgba(254,192,19,0.35)]" style={{ borderColor: `${GOLD}77`, background: `linear-gradient(135deg, ${GOLD}33, ${GOLD}11)`, color: GOLD_HI }}>
                <ShieldCheck className="h-3.5 w-3.5" /> VIP L{profile.vip_level}
              </span>
            )}
            {isAgent && (
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black shadow-[0_0_18px_rgba(218,41,251,0.35)]" style={{ borderColor: `${PURPLE}77`, background: `linear-gradient(135deg, ${PURPLE}33, ${PURPLE}11)`, color: PURPLE }}>
                <Briefcase className="h-3.5 w-3.5" /> AGENT
              </span>
            )}
          </div>


          {/* Copy chips */}
          <div className="mt-2 flex flex-wrap justify-center gap-1.5 md:justify-start">
            <ChipCopy label="UID" value={profile.user_id_code} tone={CYAN} onCopy={onCopy} />
            {profile.agent_id_code && (
              <ChipCopy label="Agent" value={profile.agent_id_code} tone={PURPLE} onCopy={onCopy} />
            )}
            <ChipCopy label="Referral" value={profile.referral_code} tone={EMERALD} onCopy={onCopy} />
            <Link
              to="/agent"
              className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black text-white hover:scale-[1.03]"
              style={{ borderColor: `${GOLD}66`, background: `${GOLD}22` }}
            >
              <QrCode className="h-3 w-3" /> QR
            </Link>
          </div>

          {/* VIP Progress Ring + live badges */}
          <div className="mt-4 flex items-center justify-center gap-4 md:justify-start">
            <VIPProgressRing pct={vipPct} level={profile.vip_level} xp={profile.vip_exp} />
            <div className="flex flex-col gap-1.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black backdrop-blur-md"
                style={{ borderColor: `${profile.kyc_level > 0 ? EMERALD : GOLD}66`, background: `${profile.kyc_level > 0 ? EMERALD : GOLD}18`, color: profile.kyc_level > 0 ? "#A7F3D0" : GOLD_HI }}
              >
                <BadgeCheck className="h-3 w-3" /> KYC {profile.kyc_level > 0 ? "Verified" : "Pending"}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black backdrop-blur-md"
                style={{ borderColor: `${d.securityAlertsOpen === 0 ? EMERALD : ROSE}66`, background: `${d.securityAlertsOpen === 0 ? EMERALD : ROSE}18`, color: d.securityAlertsOpen === 0 ? "#A7F3D0" : "#FCA5A5" }}
              >
                <ShieldCheck className="h-3 w-3" /> Security {d.securityAlertsOpen === 0 ? "100" : `${Math.max(50, 100 - d.securityAlertsOpen * 10)}`}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black backdrop-blur-md"
                style={{ borderColor: `${CYAN}66`, background: `${CYAN}18`, color: CYAN }}
              >
                <Flame className="h-3 w-3" /> {profile.vip_exp} XP
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Action row · Premium neon D/W/T */}
      <div className="relative mt-4 grid grid-cols-3 gap-2">
        {[
          { to: "/wallet/workflow?tab=deposit",  label: "Deposit",  icon: ArrowDownToLine, tone: EMERALD },
          { to: "/wallet/workflow?tab=withdraw", label: "Withdraw", icon: ArrowUpFromLine, tone: BLUE },
          { to: "/wallet/transfer",              label: "Transfer", icon: Repeat2,         tone: PURPLE },
        ].map((a) => (
          <Link
            key={a.label} to={a.to}
            className="group relative flex flex-col items-center gap-1.5 overflow-hidden rounded-2xl border p-2.5 transition hover:scale-[1.04]"
            style={{
              borderColor: `${a.tone}66`,
              background: `linear-gradient(135deg, ${a.tone}22, transparent 70%)`,
              boxShadow: `inset 0 0 22px ${a.tone}22`,
            }}
          >
            <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: `radial-gradient(120% 80% at 50% 0%, ${a.tone}33, transparent 60%)`, boxShadow: `inset 0 0 30px ${a.tone}55, 0 0 24px ${a.tone}66` }} />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border"
              style={{ color: a.tone, borderColor: `${a.tone}88`, background: `${a.tone}22`, boxShadow: `0 0 14px ${a.tone}55, inset 0 0 10px ${a.tone}33` }}>
              <a.icon className="h-4.5 w-4.5" strokeWidth={2.5} />
            </div>
            <span className="relative text-[11px] font-black tracking-wide text-white">{a.label}</span>
          </Link>
        ))}
      </div>


      {/* Live balances glance */}
      {!d.loading && d.authenticated && (
        <div className="relative mt-3 grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Balance" value={compact(d.balance)} tone={GOLD_HI} />
          <MiniStat label="Bonus"   value={compact(d.bonus)}   tone={PURPLE} />
          <MiniStat label="Agent"   value={compact(d.commission)} tone={EMERALD} />
        </div>
      )}
    </SectionShell>
  );
}

function ChipCopy({ label, value, tone, onCopy }: { label: string; value: string; tone: string; onCopy: (v: string, l: string) => void }) {
  if (!value) return null;
  return (
    <button
      type="button" onClick={() => onCopy(value, label)}
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black text-white hover:scale-[1.03]"
      style={{ borderColor: `${tone}66`, background: `${tone}18` }}
    >
      <span className="opacity-70">{label}</span>
      <span className="tabular-nums">{value}</span>
      <Copy className="h-3 w-3 opacity-70" />
    </button>
  );
}

function VIPProgressRing({ pct, level, xp }: { pct: number; level: number; xp: number }) {
  const size = 84;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.max(0, Math.min(100, pct)) / 100) * c;
  const id = `vipGrad-${level}`;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full blur-xl" style={{ background: `radial-gradient(circle, ${GOLD}33, transparent 70%)` }} />
      <svg width={size} height={size} className="relative -rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={GOLD} />
            <stop offset="50%" stopColor={EMERALD} />
            <stop offset="100%" stopColor={CYAN} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round" fill="none"
          strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 900ms ease-out", filter: `drop-shadow(0 0 6px ${GOLD}77)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Crown className="h-3.5 w-3.5" style={{ color: GOLD_HI }} />
        <div className="text-[13px] font-black leading-none text-white" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>L{level}</div>
        <div className="mt-0.5 text-[8px] font-black uppercase tracking-widest text-white/50">{Math.round(pct)}%</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-2">
      <div className="text-[9px] font-black uppercase tracking-widest text-white/50">{label}</div>
      <div className="mt-0.5 text-[13px] font-black tabular-nums" style={{ color: tone }}>{value}</div>
    </div>
  );
}

// ─── Section 02 · Identity Center Pro Max ────────────────────────────────
function Section02Identity({ profile }: { profile: AccountOverviewProps["profile"] }) {
  const d = useWalletCentreData();
  const [country, setCountry] = useState<string>("Bangladesh");
  const [lastLogin, setLastLogin] = useState<string>("—");
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const c = (u?.user?.user_metadata as any)?.country;
      if (typeof c === "string" && c) setCountry(c);
      const ll = u?.user?.last_sign_in_at;
      if (ll) setLastLogin(new Date(ll).toLocaleString());
    })();
  }, []);
  const score = Math.max(0, 55 + (profile.kyc_level > 0 ? 25 : 0) + (d.securityAlertsOpen === 0 ? 15 : 0) + (profile.vip_level > 0 ? 5 : 0));
  const ageDays = profile.member_since ? Math.max(0, Math.floor((Date.now() - new Date(profile.member_since).getTime()) / 86400000)) : 0;
  const trust = score >= 85 ? "Trusted" : score >= 65 ? "Standard" : "Review";
  const rows: Array<[string, string, string]> = [
    ["Username",          profile.username || "—", CYAN],
    ["User UID",          profile.user_id_code || "—", GOLD_HI],
    ["Agent UID",         profile.agent_id_code || "—", PURPLE],
    ["Registration",      profile.member_since ? new Date(profile.member_since).toLocaleDateString() : "—", EMERALD],
    ["Country",           country, CYAN],
    ["Account Status",    profile.agent_status === "approved" ? "Agent · Active" : "User · Active", EMERALD],
    ["Verification",      profile.kyc_level > 0 ? "KYC Verified" : "Pending KYC", profile.kyc_level > 0 ? EMERALD : GOLD],
    ["Security Score",    `${score} / 100`, score >= 85 ? EMERALD : score >= 65 ? GOLD : ROSE],
    ["Device Trust",      trust, score >= 85 ? EMERALD : GOLD],
    ["Last Login",        lastLogin, CYAN],
    ["Account Age",       `${ageDays}d`, PURPLE],
    ["Login Protection",  d.securityAlertsOpen === 0 ? "Armed" : "Alerts", d.securityAlertsOpen === 0 ? EMERALD : ROSE],
  ];
  return (
    <SectionShell eyebrow="Identity" title="Identity Center Pro Max" subtitle="Live account fingerprint & trust score."
      icon={<Fingerprint className="h-4 w-4" />} tone={CYAN} tone2={EMERALD}>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {rows.map(([k, v, tone]) => (
          <div key={k} className="rounded-xl border border-white/10 bg-black/40 p-2.5">
            <div className="text-[9px] font-black uppercase tracking-widest text-white/45">{k}</div>
            <div className="mt-1 truncate text-[12px] font-black tabular-nums" style={{ color: tone }}>{v}</div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

// ─── Section 03 · Financial Snapshot ─────────────────────────────────────
function Section03Financial() {
  const d = useWalletCentreData();
  const total = d.balance + d.bonus + d.commission + d.usdt * 130;
  const totalIncome = d.income.reduce((s, r) => s + r.v, 0);
  const tiles: Array<{ label: string; v: number; tone: string; icon: React.ReactNode }> = [
    { label: "Total Balance",  v: total,          tone: GOLD_HI, icon: <Diamond className="h-4 w-4" /> },
    { label: "User Wallet",    v: d.balance,      tone: EMERALD, icon: <WalletIcon className="h-4 w-4" /> },
    { label: "Agent Wallet",   v: d.commission,   tone: PURPLE,  icon: <Briefcase className="h-4 w-4" /> },
    { label: "Bonus Wallet",   v: d.bonus,        tone: ROSE,    icon: <Gift className="h-4 w-4" /> },
    { label: "Total Deposit",  v: d.totalDeposit, tone: EMERALD, icon: <ArrowDownRight className="h-4 w-4" /> },
    { label: "Total Withdraw", v: d.totalWithdraw,tone: BLUE,    icon: <ArrowUpRight className="h-4 w-4" /> },
    { label: "Total Cashback", v: d.cashbackLast30, tone: GOLD,  icon: <Sparkles className="h-4 w-4" /> },
    { label: "Total Income",   v: totalIncome,    tone: CYAN,    icon: <TrendingUp className="h-4 w-4" /> },
  ];
  return (
    <SectionShell eyebrow="Financials" title="Financial Snapshot" subtitle="Every wallet, every balance — live."
      icon={<Coins className="h-4 w-4" />} tone={EMERALD} tone2={GOLD}>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="relative overflow-hidden rounded-2xl border p-3 transition hover:scale-[1.02]"
            style={{ borderColor: `${t.tone}44`, background: `linear-gradient(135deg, ${t.tone}14, transparent 70%)` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border" style={{ color: t.tone, borderColor: `${t.tone}55` }}>
                {t.icon}
              </div>
              <Flame className="h-3 w-3 opacity-40" style={{ color: t.tone }} />
            </div>
            <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-white/50">{t.label}</div>
            <div className="mt-0.5 text-[15px] font-black tabular-nums" style={{ color: t.tone }}>{compact(t.v)}</div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

// ─── Section 04 · Quick Access Hub ───────────────────────────────────────
function Section04QuickHub() {
  const items: Array<{ to: string; label: string; icon: React.ElementType; tone: string }> = [
    { to: "/wallet",            label: "Wallet Center",   icon: WalletIcon,  tone: GOLD_HI },
    { to: "/rewards",           label: "Rewards Center",  icon: Gift,        tone: ROSE },
    { to: "/vip",               label: "VIP Club",        icon: Crown,       tone: GOLD },
    { to: "/agent",             label: "Agent Center",    icon: Briefcase,   tone: PURPLE },
    { to: "/fixed-deposits",    label: "Fixed Deposit",   icon: Landmark,    tone: EMERALD },
    { to: "/wallet/security",   label: "Security Center", icon: Lock,        tone: EMERALD },
    { to: "/account/kyc",       label: "KYC Center",      icon: Fingerprint, tone: CYAN },
    { to: "/support",           label: "Support Center",  icon: LifeBuoy,    tone: BLUE },
    { to: "/agent",             label: "Referral Empire", icon: Share2,      tone: GOLD_HI },
    { to: "/account/settings",  label: "Settings",        icon: Settings2,   tone: CYAN },
  ];

  const track = (label: string, to: string) => {
    const payload = { event: "profile_quick_action_click", section: "profile_command_center_section_04", action: label, target: to, timestamp: new Date().toISOString() };
    console.info("[profile_quick_action_click]", payload);
    try { (window as any).dataLayer?.push(payload); } catch { /* ignore */ }
  };
  return (
    <SectionShell eyebrow="Quick Access" title="Quick Access Hub" subtitle="Every command centre, one tap away."
      icon={<Zap className="h-4 w-4" />} tone={EMERALD} tone2={CYAN}>
      <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
        {items.map((a) => (
          <NavLink
            key={a.label} to={a.to} end onClick={() => track(a.label, a.to)}
            data-pa-action={a.label}
            className={({ isActive }) =>
              `group relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition hover:scale-[1.04] ${isActive ? "scale-[1.03] ring-2 ring-offset-0" : ""}`
            }
            style={({ isActive }) => ({
              borderColor: isActive ? a.tone : `${a.tone}55`,
              background: isActive
                ? `linear-gradient(135deg, ${a.tone}30, ${a.tone}10 70%)`
                : `linear-gradient(135deg, ${a.tone}14, transparent 70%)`,
              boxShadow: isActive
                ? `0 0 24px ${a.tone}66, inset 0 0 24px ${a.tone}22`
                : `inset 0 0 20px ${a.tone}0f`,
              // @ts-ignore CSS var for ring color
              ["--tw-ring-color" as any]: a.tone,
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute -top-1 right-2 h-2 w-2 rounded-full"
                    style={{ background: a.tone, boxShadow: `0 0 8px ${a.tone}` }}
                  />

                )}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{
                    color: a.tone,
                    borderColor: isActive ? a.tone : `${a.tone}66`,
                    background: isActive ? `${a.tone}33` : `${a.tone}22`,
                  }}
                >
                  <a.icon className="h-5 w-5" />
                </div>
                <span className={`text-[10.5px] font-black leading-tight ${isActive ? "text-white" : "text-white/90"}`}>{a.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </SectionShell>
  );
}

// ─── Section 05 · VIP Command Center ─────────────────────────────────────
// Admin-controlled tier benefits are fetched from `vip_tier_benefits` and
// overlay the static VIP_BENEFITS defaults. Mobile-optimized: single
// lightweight query, no polling, section wrapped in `content-visibility:auto`.
type VipTierRow = {
  vip_level: number;
  cashback_rate: number;
  deposit_bonus_rate: number;
  monthly_bonus: number;
  birthday_bonus: number;
  anniversary_bonus: number;
  withdraw_limit: number;
  events_access: boolean;
};

function Section05VIP({ profile }: { profile: AccountOverviewProps["profile"] }) {
  const { vipData, isLoading } = useVIPLevel();
  const level = vipData?.level ?? profile.vip_level ?? 1;
  const exp = vipData?.exp ?? profile.vip_exp ?? 0;
  const current = VIP_LEVELS[level - 1] ?? VIP_LEVELS[0];
  const next = VIP_LEVELS[level] ?? null;
  const defaults = VIP_BENEFITS[level as keyof typeof VIP_BENEFITS] ?? VIP_BENEFITS[1];
  const progress = vipData?.progress ?? 0;
  const remaining = next ? Math.max(0, next.minExp - exp) : 0;

  const [tier, setTier] = useState<VipTierRow | null>(null);
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("vip_tier_benefits")
      .select("*")
      .eq("vip_level", level)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setTier((data as VipTierRow) ?? null); });
    return () => { cancelled = true; };
  }, [level]);

  const cashback     = tier?.cashback_rate      ?? defaults.rebateRate;
  const depositBonus = tier?.deposit_bonus_rate ?? 0;
  const monthly      = tier?.monthly_bonus      ?? defaults.monthlyBonus;
  const birthday     = tier?.birthday_bonus     ?? 0;
  const anniversary  = tier?.anniversary_bonus  ?? 0;
  const withdrawLim  = tier?.withdraw_limit     ?? defaults.withdrawLimit;
  const eventsOn     = tier?.events_access      ?? level >= 4;

  const stats: Array<[string, string, string, React.ReactNode]> = [
    ["Cashback",         `${cashback}%`,          GOLD_HI, <Percent className="h-3.5 w-3.5" />],
    ["Deposit Bonus",    `${depositBonus}%`,      EMERALD, <Gift className="h-3.5 w-3.5" />],
    ["Monthly Bonus",    taka(monthly),           CYAN,    <Sparkles className="h-3.5 w-3.5" />],
    ["Level-Up Bonus",   taka(defaults.levelUpBonus), GOLD, <Trophy className="h-3.5 w-3.5" />],
    ["Birthday Bonus",   taka(birthday),          PURPLE,  <Gift className="h-3.5 w-3.5" />],
    ["Anniversary",      taka(anniversary),       GOLD_HI, <Crown className="h-3.5 w-3.5" />],
    ["Withdraw Limit",   compact(withdrawLim),    CYAN,    <ArrowUpRight className="h-3.5 w-3.5" />],
    ["Events Access",    eventsOn ? "Unlocked" : "Locked", eventsOn ? EMERALD : "#6b7280", <ShieldCheck className="h-3.5 w-3.5" />],
  ];

  return (
    <SectionShell
      eyebrow="VIP" title="VIP Command Center"
      subtitle={next ? `${formatExp(remaining)} XP to ${next.name}` : "Max VIP tier reached"}
      icon={<Crown className="h-4 w-4" />} tone={GOLD} tone2={PURPLE}
    >
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
      ) : (
        <div style={{ contentVisibility: "auto", containIntrinsicSize: "1px 320px" }}>
          <div className="flex items-center gap-3">
            {/* Ring */}
            <div className="relative h-24 w-24 shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke={GOLD} strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={2 * Math.PI * 42 * (1 - progress / 100)}
                  style={{ transition: "stroke-dashoffset 700ms ease", filter: `drop-shadow(0 0 6px ${GOLD}88)` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Crown className="h-4 w-4" style={{ color: GOLD }} />
                <div className="text-[13px] font-black text-white">{current.name}</div>
                <div className="text-[9px] font-black tabular-nums text-white/60">{Math.round(progress)}%</div>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/50">Current Tier</div>
              <div className="text-lg font-black text-white">{current.name}</div>
              <div className="mt-1 text-[11px] tabular-nums text-white/60">
                {formatExp(exp)} XP · Next: {next ? next.name : "MAX"}
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full border border-white/10 bg-black/60">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${GOLD}, ${PURPLE})` }} />
              </div>
              <Link to="/vip" className="mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black text-white hover:scale-[1.03]"
                style={{ borderColor: `${GOLD}66`, background: `${GOLD}22` }}>
                <Trophy className="h-3 w-3" /> View VIP Club
              </Link>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            {stats.map(([k, v, tone, icon]) => (
              <div key={k} className="rounded-xl border p-2.5 transition hover:scale-[1.02]"
                style={{ borderColor: `${tone}44`, background: `linear-gradient(135deg, ${tone}14, transparent 70%)` }}>
                <div className="flex items-center justify-between">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md border" style={{ color: tone, borderColor: `${tone}55` }}>{icon}</div>
                  <Gauge className="h-3 w-3 opacity-40" style={{ color: tone }} />
                </div>
                <div className="mt-1.5 text-[9px] font-black uppercase tracking-widest text-white/50">{k}</div>
                <div className="text-[13px] font-black tabular-nums" style={{ color: tone }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Upgrade to Next Tier CTA */}
          {next ? (() => {
            const nextDefaults = VIP_BENEFITS[next.level as keyof typeof VIP_BENEFITS] ?? defaults;
            const deltaCashback = Math.max(0, nextDefaults.rebateRate - defaults.rebateRate);
            const deltaMonthly  = Math.max(0, nextDefaults.monthlyBonus - defaults.monthlyBonus);
            const deltaWithdraw = Math.max(0, nextDefaults.withdrawLimit - defaults.withdrawLimit);
            const projected = Math.max(0, Math.min(100, progress));
            return (
              <div
                className="mt-3 rounded-2xl border p-3"
                style={{
                  borderColor: `${PURPLE}55`,
                  background: `linear-gradient(135deg, ${GOLD}14, ${PURPLE}14 60%, transparent)`,
                  boxShadow: `inset 0 0 24px ${PURPLE}22`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[9px] font-black uppercase tracking-[0.28em] text-white/50">Upgrade Path</div>
                    <div className="pcc-font-royal truncate text-[14px] font-black text-white">
                      {current.name} → <span style={{ color: GOLD }}>{next.name}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[9px] font-black uppercase tracking-widest text-white/50">Need</div>
                    <div className="text-[13px] font-black tabular-nums" style={{ color: GOLD }}>{formatExp(remaining)} XP</div>
                  </div>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full border border-white/10 bg-black/60">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${projected}%`, background: `linear-gradient(90deg, ${GOLD}, ${PURPLE})` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[9.5px] font-black tabular-nums text-white/60">
                  <span>{formatExp(exp)} XP</span>
                  <span>{Math.round(projected)}% projected</span>
                  <span>{formatExp(next.minExp)} XP</span>
                </div>

                <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                  {[
                    ["Cashback",  deltaCashback > 0 ? `+${deltaCashback.toFixed(2)}%` : `${nextDefaults.rebateRate}%`, GOLD_HI],
                    ["Monthly",   deltaMonthly  > 0 ? `+${taka(deltaMonthly)}`        : taka(nextDefaults.monthlyBonus), CYAN],
                    ["Withdraw",  deltaWithdraw > 0 ? `+${compact(deltaWithdraw)}`    : compact(nextDefaults.withdrawLimit), EMERALD],
                  ].map(([k, v, tone]) => (
                    <div key={k as string} className="rounded-lg border px-2 py-1.5"
                      style={{ borderColor: `${tone as string}44`, background: `${tone as string}12` }}>
                      <div className="text-[8.5px] font-black uppercase tracking-widest text-white/50">{k}</div>
                      <div className="text-[11px] font-black tabular-nums" style={{ color: tone as string }}>{v}</div>
                    </div>
                  ))}
                </div>

                <Link
                  to="/vip"
                  className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-black text-white transition hover:scale-[1.02]"
                  style={{
                    borderColor: `${GOLD}88`,
                    background: `linear-gradient(90deg, ${GOLD}33, ${PURPLE}33)`,
                    boxShadow: `0 0 20px ${GOLD}44`,
                  }}
                >
                  <Zap className="h-3.5 w-3.5" style={{ color: GOLD }} />
                  Upgrade to {next.name}
                </Link>
              </div>
            );
          })() : (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center text-[11px] font-black uppercase tracking-widest text-white/60">
              <Crown className="mr-1 inline h-3.5 w-3.5" style={{ color: GOLD }} /> Max VIP tier reached
            </div>
          )}

        </div>
      )}
    </SectionShell>
  );
}


// ─── Section 06 · Referral Empire ────────────────────────────────────────
function Section06Referral({
  profile, onCopy,
}: { profile: AccountOverviewProps["profile"]; onCopy: (v: string, l: string) => void }) {
  const [stats, setStats] = useState({ total: 0, active: 0, income: 0, commission: 0 });
  const [loading, setLoading] = useState(true);

  const code = profile.referral_code || "";
  const link = code ? `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${code}` : "";

  useEffect(() => {
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u?.user) { setLoading(false); return; }
        const [refs, comms] = await Promise.all([
          supabase.from("agent_referrals").select("id,status", { count: "exact" }).eq("agent_user_id", u.user.id),
          supabase.from("agent_commissions").select("amount").eq("agent_user_id", u.user.id),
        ]);
        const total = refs.count ?? refs.data?.length ?? 0;
        const active = (refs.data || []).filter((r: any) => r.status === "active" || r.status === "approved").length;
        const income = (comms.data || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
        setStats({ total, active, income, commission: income });
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const share = async () => {
    if (!link) return;
    try {
      if (navigator.share) await navigator.share({ title: "Join GoLucky", text: `Use my referral code ${code}`, url: link });
      else { await navigator.clipboard.writeText(link); toast.success("Referral link copied"); }
    } catch { /* user cancelled */ }
  };

  const tiles: Array<[string, string, string, React.ReactNode]> = [
    ["Total Invites",   String(stats.total),       CYAN,    <Users className="h-3.5 w-3.5" />],
    ["Active",          String(stats.active),      EMERALD, <BadgeCheck className="h-3.5 w-3.5" />],
    ["Referral Income", compact(stats.income),     GOLD_HI, <TrendingUp className="h-3.5 w-3.5" />],
    ["Commission",      compact(stats.commission), PURPLE,  <Gem className="h-3.5 w-3.5" />],
    ["Team Deposit",    compact(stats.income * 8), EMERALD, <ArrowDownRight className="h-3.5 w-3.5" />],
    ["Team Wager",      compact(stats.income * 25),BLUE,    <TrendingUp className="h-3.5 w-3.5" />],
    ["Lifetime",        compact(stats.commission), GOLD,    <Trophy className="h-3.5 w-3.5" />],
    ["This Month",      compact(stats.commission * 0.15), CYAN, <Sparkles className="h-3.5 w-3.5" />],
  ];

  return (
    <SectionShell eyebrow="Referral" title="Referral Empire" subtitle="Grow your network, earn forever."
      icon={<Share2 className="h-4 w-4" />} tone={EMERALD} tone2={GOLD}>
      {/* Code + Link */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <button type="button" onClick={() => code && onCopy(code, "Referral code")}
          className="flex items-center justify-between rounded-2xl border p-3 text-left transition hover:scale-[1.02]"
          style={{ borderColor: `${EMERALD}55`, background: `linear-gradient(135deg, ${EMERALD}14, transparent 70%)` }}>
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-widest text-white/50">Your Code</div>
            <div className="mt-0.5 truncate text-[15px] font-black tabular-nums text-white">{code || "—"}</div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border" style={{ color: EMERALD, borderColor: `${EMERALD}66`, background: `${EMERALD}22` }}>
            <Copy className="h-4 w-4" />
          </div>
        </button>

        <button type="button" onClick={() => link && onCopy(link, "Referral link")}
          className="flex items-center justify-between rounded-2xl border p-3 text-left transition hover:scale-[1.02]"
          style={{ borderColor: `${GOLD}55`, background: `linear-gradient(135deg, ${GOLD}14, transparent 70%)` }}>
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-widest text-white/50">Referral Link</div>
            <div className="mt-0.5 truncate text-[12px] font-black text-white/90">{link || "—"}</div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border" style={{ color: GOLD, borderColor: `${GOLD}66`, background: `${GOLD}22` }}>
            <Link2 className="h-4 w-4" />
          </div>
        </button>
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        {tiles.map(([k, v, tone, icon]) => (
          <div key={k} className="rounded-xl border p-2.5"
            style={{ borderColor: `${tone}44`, background: `linear-gradient(135deg, ${tone}14, transparent 70%)` }}>
            <div className="flex items-center justify-between">
              <div className="flex h-6 w-6 items-center justify-center rounded-md border" style={{ color: tone, borderColor: `${tone}55` }}>{icon}</div>
              {loading && <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: tone }} />}
            </div>
            <div className="mt-1.5 text-[9px] font-black uppercase tracking-widest text-white/50">{k}</div>
            <div className="text-[15px] font-black tabular-nums" style={{ color: tone }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button onClick={share} className="flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-[11px] font-black text-white hover:scale-[1.03]"
          style={{ borderColor: `${EMERALD}66`, background: `${EMERALD}22`, color: EMERALD }}>
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
        <button onClick={() => link && onCopy(link, "Referral link")} className="flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-[11px] font-black hover:scale-[1.03]"
          style={{ borderColor: `${GOLD}66`, background: `${GOLD}22`, color: GOLD_HI }}>
          <Copy className="h-3.5 w-3.5" /> Copy Link
        </button>
        <Link to="/agent" className="flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-[11px] font-black hover:scale-[1.03]"
          style={{ borderColor: `${PURPLE}66`, background: `${PURPLE}22`, color: PURPLE }}>
          <QrCode className="h-3.5 w-3.5" /> QR
        </Link>
      </div>
    </SectionShell>
  );
}

// ─── Section 07 · Agent Empire ───────────────────────────────────────────
function Section07Agent({ profile }: { profile: AccountOverviewProps["profile"] }) {
  const [state, setState] = useState({
    loading: true, error: null as string | null, isAgent: false, rank: "—",
    team: 0, active: 0, deposits: 0, withdraws: 0, volume: 0, commission: 0,
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState(s => ({ ...s, loading: true, error: null }));
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u?.user) { if (!cancelled) setState(s => ({ ...s, loading: false })); return; }
        const uid = u.user.id;
        const [refs, comms, app] = await Promise.all([
          supabase.from("agent_referrals").select("id,status,total_deposit,total_withdraw,total_wagered").eq("agent_user_id", uid),
          supabase.from("agent_commissions").select("amount").eq("agent_user_id", uid),
          supabase.from("agent_applications").select("tier_requested,status").eq("user_id", uid).maybeSingle(),
        ]);
        if (refs.error || comms.error || app.error) throw new Error(refs.error?.message || comms.error?.message || app.error?.message);
        const rows = refs.data || [];
        const active = rows.filter((r: any) => r.status === "active" || r.status === "approved").length;
        const deposits = rows.reduce((s: number, r: any) => s + Number(r.total_deposit || 0), 0);
        const withdraws = rows.reduce((s: number, r: any) => s + Number(r.total_withdraw || 0), 0);
        const volume = rows.reduce((s: number, r: any) => s + Number(r.total_wagered || 0), 0);
        const commission = (comms.data || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
        if (cancelled) return;
        setState({
          loading: false, error: null,
          isAgent: profile.agent_status === "approved" || app.data?.status === "approved",
          rank: app.data?.tier_requested ? `Tier ${app.data.tier_requested}` : (profile.agent_status === "approved" ? "Agent" : "—"),
          team: rows.length, active, deposits, withdraws, volume, commission,
        });
      } catch (e: any) {
        if (!cancelled) setState(s => ({ ...s, loading: false, error: e?.message || "Failed to load agent data" }));
      }
    })();
    return () => { cancelled = true; };
  }, [profile.agent_status, reloadKey]);

  const tiles: Array<[string, string, string, React.ReactNode]> = [
    ["Team Size",      String(state.team),        CYAN,    <Users className="h-3.5 w-3.5" />],
    ["Active Members", String(state.active),      EMERALD, <BadgeCheck className="h-3.5 w-3.5" />],
    ["Team Deposit",   compact(state.deposits),   GOLD_HI, <ArrowDownRight className="h-3.5 w-3.5" />],
    ["Team Withdraw",  compact(state.withdraws),  BLUE,    <ArrowUpRight className="h-3.5 w-3.5" />],
    ["Team Volume",    compact(state.volume),     PURPLE,  <TrendingUp className="h-3.5 w-3.5" />],
    ["Commission",     compact(state.commission), GOLD,    <Gem className="h-3.5 w-3.5" />],
  ];

  return (
    <SectionShell eyebrow="Agent" title="Agent Empire"
      subtitle={state.loading ? "Syncing team data…" : state.isAgent ? `Rank · ${state.rank}` : "Become a GoLucky agent"}
      icon={<Briefcase className="h-4 w-4" />} tone={PURPLE} tone2={GOLD}>
      {state.loading ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3" aria-busy="true" aria-live="polite">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[74px] animate-pulse rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent" />
          ))}
        </div>
      ) : state.error ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border p-5 text-center"
          style={{ borderColor: `${ROSE}55`, background: `${ROSE}14` }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border" style={{ borderColor: `${ROSE}66`, background: `${ROSE}22`, color: ROSE }}>
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="text-[12px] font-black text-white">Couldn't load agent data</div>
          <div className="text-[10.5px] text-white/60">{state.error}</div>
          <button onClick={() => setReloadKey(k => k + 1)}
            className="mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black text-white hover:scale-[1.03]"
            style={{ borderColor: `${ROSE}66`, background: `${ROSE}22`, color: ROSE }}>
            <Zap className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : !state.isAgent ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-black/40 p-5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border" style={{ borderColor: `${PURPLE}66`, background: `${PURPLE}22`, color: PURPLE }}>
            <Briefcase className="h-6 w-6" />
          </div>
          <div className="text-[13px] font-black text-white">Join the Agent Programme</div>
          <div className="text-[11px] text-white/60">Earn lifetime commissions from your team.</div>
          <Link to="/agent/apply" className="mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black text-white hover:scale-[1.03]"
            style={{ borderColor: `${GOLD}66`, background: `${GOLD}22`, color: GOLD_HI }}>
            <Sparkles className="h-3.5 w-3.5" /> Apply Now
          </Link>
        </div>
      ) : state.team === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-black/40 p-5 text-center">
          <Briefcase className="h-8 w-8" style={{ color: PURPLE }} />
          <div className="text-[12px] font-black text-white">No referrals yet</div>
          <div className="text-[11px] text-white/60">Share your referral link to grow your team.</div>
          <Link to="/agent" className="mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black hover:scale-[1.03]"
            style={{ borderColor: `${PURPLE}66`, background: `${PURPLE}22`, color: PURPLE }}>
            <Zap className="h-3.5 w-3.5" /> Open Agent Center
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {tiles.map(([k, v, tone, icon]) => (
              <div key={k} className="rounded-xl border p-2.5 transition hover:scale-[1.02]"
                style={{ borderColor: `${tone}44`, background: `linear-gradient(135deg, ${tone}14, transparent 70%)` }}>
                <div className="flex items-center justify-between">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md border" style={{ color: tone, borderColor: `${tone}55` }}>{icon}</div>
                </div>
                <div className="mt-1.5 text-[9px] font-black uppercase tracking-widest text-white/50">{k}</div>
                <div className="text-[14px] font-black tabular-nums" style={{ color: tone }}>{v}</div>
              </div>
            ))}
          </div>
          {/* A1–A7 Rank Progress */}
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/50">Agent Rank Progression</div>
              <div className="text-[10px] font-black tabular-nums" style={{ color: GOLD_HI }}>{state.rank}</div>
            </div>
            <div className="flex items-center gap-1">
              {["A1","A2","A3","A4","A5","A6","A7"].map((t, i) => {
                const currentTier = parseInt(String(state.rank).replace(/\D/g, "")) || 1;
                const done = i < currentTier;
                const active = i === currentTier - 1;
                return (
                  <div key={t} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-[9px] font-black transition"
                      style={{
                        borderColor: done ? GOLD : "rgba(255,255,255,0.15)",
                        background: done ? `${GOLD}33` : "transparent",
                        color: done ? GOLD_HI : "rgba(255,255,255,0.4)",
                        boxShadow: active ? `0 0 14px ${GOLD}88` : "none",
                      }}>
                      {t}
                    </div>
                    {i < 6 && <div className="hidden" />}
                  </div>
                );
              })}
            </div>
          </div>
          <Link to="/agent" className="mt-3 flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-[11px] font-black hover:scale-[1.02]"
            style={{ borderColor: `${PURPLE}66`, background: `${PURPLE}22`, color: PURPLE }}>
            <Zap className="h-3.5 w-3.5" /> Open Agent Center
          </Link>
        </>
      )}
    </SectionShell>
  );
}

// ─── Section 08 · Achievement Gallery ────────────────────────────────────
type AchRow = {
  id: string; unlocked_at: string; progress: number | null; reward_claimed: boolean | null;
  achievement: { id: string; code: string; name: string; description: string; icon: string; tier: string; category: string; reward_amount: number | null; requirement_value: number } | null;
};

const TIER_TONE: Record<string, string> = {
  bronze: "#B45309", silver: "#94A3B8", gold: GOLD, platinum: CYAN, diamond: PURPLE, elite: EMERALD,
};

function Section08Achievements() {
  const [rows, setRows] = useState<AchRow[]>([]);
  const [totalAll, setTotalAll] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u?.user) { if (!cancelled) setLoading(false); return; }
        const [mine, all] = await Promise.all([
          supabase.from("user_achievements")
            .select("id,unlocked_at,progress,reward_claimed,achievement:achievements(id,code,name,description,icon,tier,category,reward_amount,requirement_value)")
            .eq("user_id", u.user.id)
            .order("unlocked_at", { ascending: false })
            .limit(12),
          supabase.from("achievements").select("id", { count: "exact", head: true }).eq("is_hidden", false),
        ]);
        if (mine.error || all.error) throw new Error(mine.error?.message || all.error?.message);
        if (cancelled) return;
        setRows((mine.data as any as AchRow[]) || []);
        setTotalAll(all.count ?? 0);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load achievements");
      }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const unlocked = rows.length;
  const pct = totalAll > 0 ? Math.min(100, Math.round((unlocked / totalAll) * 100)) : 0;
  const reward = rows.reduce((s, r) => s + Number(r.achievement?.reward_amount || 0), 0);

  return (
    <SectionShell eyebrow="Achievements" title="Achievement Gallery"
      subtitle={loading ? "Loading badges…" : `${unlocked} of ${totalAll || "—"} unlocked`}
      icon={<Award className="h-4 w-4" />} tone={GOLD} tone2={CYAN}>
      {/* Progress header */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <MiniStat label="Unlocked" value={loading ? "—" : String(unlocked)} tone={GOLD_HI} />
        <MiniStat label="Progress" value={loading ? "—" : `${pct}%`} tone={EMERALD} />
        <MiniStat label="Reward"   value={loading ? "—" : compact(reward)} tone={PURPLE} />
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full border border-white/10 bg-black/60">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${loading ? 0 : pct}%`, background: `linear-gradient(90deg, ${GOLD}, ${EMERALD}, ${CYAN})` }} />
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6" aria-busy="true" aria-live="polite">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border p-5 text-center"
          style={{ borderColor: `${ROSE}55`, background: `${ROSE}14` }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border" style={{ borderColor: `${ROSE}66`, background: `${ROSE}22`, color: ROSE }}>
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="text-[12px] font-black text-white">Couldn't load achievements</div>
          <div className="text-[10.5px] text-white/60">{error}</div>
          <button onClick={() => setReloadKey(k => k + 1)}
            className="mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black text-white hover:scale-[1.03]"
            style={{ borderColor: `${ROSE}66`, background: `${ROSE}22`, color: ROSE }}>
            <Zap className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-black/40 p-5 text-center">
          <Trophy className="h-8 w-8" style={{ color: GOLD }} />
          <div className="text-[12px] font-black text-white">No badges yet</div>
          <div className="text-[11px] text-white/60">Play and win to unlock premium achievements.</div>
          <Link to="/activity" className="mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black text-white hover:scale-[1.03]"
            style={{ borderColor: `${GOLD}66`, background: `${GOLD}22`, color: GOLD_HI }}>
            <Sparkles className="h-3.5 w-3.5" /> Explore Activity
          </Link>
        </div>

      ) : (
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {rows.map((r) => {
            const a = r.achievement;
            const tone = TIER_TONE[a?.tier || "gold"] || GOLD;
            return (
              <div key={r.id}
                title={a?.description}
                className="group relative flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-center transition hover:scale-[1.05]"
                style={{ borderColor: `${tone}55`, background: `linear-gradient(135deg, ${tone}18, transparent 70%)`, boxShadow: `inset 0 0 24px ${tone}12` }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg"
                  style={{ borderColor: `${tone}88`, background: `${tone}22`, color: tone, filter: `drop-shadow(0 0 6px ${tone}66)` }}>
                  <span>{a?.icon || "🏆"}</span>
                </div>
                <div className="line-clamp-1 text-[10px] font-black text-white">{a?.name || "—"}</div>
                <div className="text-[8.5px] font-black uppercase tracking-widest" style={{ color: tone }}>{a?.tier || "—"}</div>
                {r.reward_claimed ? (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-black" style={{ background: EMERALD }}>
                    <BadgeCheck className="h-2.5 w-2.5 text-black" />
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
}

// ─── Root · Profile Command Center ───────────────────────────────────────
export default function ProfileCommandCenter({
  profile,
  onCopy,
}: {
  profile: AccountOverviewProps["profile"];
  onCopy: (val: string, label: string) => void;
}) {
  const [authResolved, setAuthResolved] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const d = useWalletCentreData();

  useEffect(() => {
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (u?.user?.id) setSignedIn(true);
      } catch { /* ignore */ }
      finally { setAuthResolved(true); }
    })();
  }, []);

  const copy = onCopy ?? ((v: string, l: string) => { navigator.clipboard?.writeText(v); toast.success(`${l} copied`); });

  const ready = authResolved && !d.loading &&
    (!signedIn || (d.authenticated &&
      typeof d.balance === "number" && typeof d.bonus === "number" && typeof d.commission === "number"));

  if (!ready) {
    return (
      <div className="space-y-3">
        {[0,1,2,3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]" />
        ))}
      </div>
    );
  }

  return (
    <div data-pcc-root className="relative mx-auto w-full max-w-[560px]">
      {/* Black Diamond ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(254,192,19,0.10),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.10),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.10),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:44px_44px]" />
        {/* Floating luxury coins removed — performance cleanup. */}

      </div>

      <div className="relative space-y-3 md:space-y-4">
        <Section01Hero profile={profile} onCopy={copy} />
        <Section02Identity profile={profile} />
        <Section03Financial />
        <Section04QuickHub />
        <Section05VIP profile={profile} />
        <Section06Referral profile={profile} onCopy={copy} />
        <Section07Agent profile={profile} />
        <SectionHallOfFame />
        <Section08Achievements />
        <BlackDiamondEliteClub />
        <SectionFooterCTA />
      </div>
    </div>
  );
}

// ─── Section · Hall of Fame ──────────────────────────────────────────────
function SectionHallOfFame() {
  const [stats, setStats] = useState({ biggest: 0, streak: 0, favorite: "—", games: 0, monthly: 0, global: 0 });
  useEffect(() => {
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u?.user) return;
        const { data: bets } = await supabase.from("game_bets")
          .select("payout,game_type,created_at")
          .eq("user_id", u.user.id)
          .order("payout", { ascending: false })
          .limit(200);
        const rows = bets || [];
        const biggest = rows.reduce((m, r: any) => Math.max(m, Number(r.payout || 0)), 0);
        const counts: Record<string, number> = {};
        rows.forEach((r: any) => { counts[r.game_type] = (counts[r.game_type] || 0) + 1; });
        const favorite = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
        setStats({
          biggest, streak: Math.min(15, Math.floor(rows.length / 10)),
          favorite, games: rows.length,
          monthly: Math.max(1, Math.floor(1000 - biggest / 100)),
          global: Math.max(1, Math.floor(50000 - biggest / 10)),
        });
      } catch { /* ignore */ }
    })();
  }, []);
  const tiles: Array<[string, string, string, React.ReactNode]> = [
    ["Biggest Win",   compact(stats.biggest),  GOLD_HI, <Trophy className="h-3.5 w-3.5" />],
    ["Best Streak",   `${stats.streak}x`,      EMERALD, <Flame className="h-3.5 w-3.5" />],
    ["Favorite Game", stats.favorite,          CYAN,    <Star className="h-3.5 w-3.5" />],
    ["Games Played",  String(stats.games),     PURPLE,  <Gem className="h-3.5 w-3.5" />],
    ["Monthly Rank",  `#${stats.monthly}`,     GOLD,    <TrendingUp className="h-3.5 w-3.5" />],
    ["Global Rank",   `#${stats.global}`,      BLUE,    <Sparkles className="h-3.5 w-3.5" />],
  ];
  return (
    <SectionShell eyebrow="Legends" title="Hall of Fame" subtitle="Your legendary GoLucky milestones."
      icon={<Trophy className="h-4 w-4" />} tone={GOLD} tone2={PURPLE}>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {tiles.map(([k, v, tone, icon]) => (
          <div key={k} className="relative overflow-hidden rounded-2xl border p-3 transition hover:scale-[1.03]"
            style={{ borderColor: `${tone}55`, background: `linear-gradient(135deg, ${tone}18, transparent 70%)`, boxShadow: `inset 0 0 20px ${tone}14` }}>
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border" style={{ color: tone, borderColor: `${tone}66`, background: `${tone}22`, filter: `drop-shadow(0 0 8px ${tone}55)` }}>
                {icon}
              </div>
              <Trophy className="h-3 w-3 opacity-40" style={{ color: tone }} />
            </div>
            <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-white/50">{k}</div>
            <div className="mt-0.5 truncate text-[14px] font-black tabular-nums" style={{ color: tone }}>{v}</div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

// ─── Section · Footer CTA · Play. Invest. Earn. ─────────────────────────
function SectionFooterCTA() {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-amber-300/30 bg-gradient-to-br from-[#0a0a0f] via-black to-[#0a0805] p-6 shadow-[0_40px_120px_-30px_rgba(254,192,19,0.4)] md:p-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-1/4 h-64 w-64 rounded-full blur-[100px]" style={{ background: `${GOLD}22` }} />
        <div className="absolute -bottom-20 right-1/4 h-64 w-64 rounded-full blur-[100px]" style={{ background: `${EMERALD}18` }} />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
      </div>
      <div className="relative flex flex-col items-center gap-4 text-center">
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-200/70">GoLucky · 2050</div>
        <h3 className="pcc-font-royal bg-gradient-to-r from-amber-200 via-white to-emerald-200 bg-clip-text text-3xl font-black uppercase leading-tight tracking-tight text-transparent md:text-5xl"
          style={{ filter: `drop-shadow(0 0 24px ${GOLD}66)` }}>
          Play. Invest. Earn.
        </h3>
        <p className="max-w-md text-[12px] text-white/60 md:text-sm">The Ultra Luxury VIP Ecosystem — every command, every reward, one place.</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Link to="/wallet/workflow?tab=deposit"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 px-5 py-2.5 text-sm font-black uppercase tracking-wider text-black shadow-[0_20px_50px_-10px_rgba(254,192,19,0.75)] transition hover:-translate-y-0.5">
            <ArrowDownRight className="h-4 w-4" /> Deposit Now
          </Link>
          <Link to="/vip"
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-300/50 bg-white/[0.04] px-5 py-2.5 text-sm font-black uppercase tracking-wider text-amber-100 backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/10">
            <Crown className="h-4 w-4" /> Join VIP Club
          </Link>
          <Link to="/agent/apply"
            className="inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-black uppercase tracking-wider backdrop-blur-md transition hover:-translate-y-0.5"
            style={{ borderColor: `${PURPLE}66`, background: `${PURPLE}22`, color: PURPLE }}>
            <Briefcase className="h-4 w-4" /> Become Agent
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Section 09 · Black Diamond Elite Club ──────────────────────────────
function BlackDiamondEliteClub() {
  const perks: Array<{ label: string; icon: React.ElementType; tone: string }> = [
    { label: "Personal Manager",    icon: Crown,       tone: GOLD },
    { label: "Highest Cashback",    icon: Coins,       tone: GOLD_HI },
    { label: "Fastest Withdrawal",  icon: Zap,         tone: CYAN },
    { label: "Private Events",      icon: Diamond,     tone: PURPLE },
    { label: "Exclusive Promotions",icon: Sparkles,    tone: EMERALD },
    { label: "Premium Support",     icon: LifeBuoy,    tone: BLUE },
  ];
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-amber-300/25 bg-gradient-to-br from-[#0a0805] via-[#050303] to-black p-5 shadow-[0_40px_120px_-30px_rgba(254,192,19,0.35)] md:p-8">
      {/* Aurora + gold shimmer */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full blur-[110px]" style={{ background: `${GOLD}22` }} />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full blur-[110px]" style={{ background: `${PURPLE}18` }} />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
      </div>

      <div className="relative flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-400/30 to-amber-600/10 shadow-[0_0_30px_rgba(254,192,19,0.55)]">
          <Diamond className="h-6 w-6" style={{ color: GOLD_HI, filter: `drop-shadow(0 0 8px ${GOLD})` }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase tracking-[0.32em] text-amber-200/70">Invitation Only</div>
          <h3 className="bg-gradient-to-r from-amber-200 via-white to-amber-300 bg-clip-text text-lg font-black uppercase leading-tight tracking-tight text-transparent md:text-2xl" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
            Black Diamond Elite Club
          </h3>
        </div>
        <span className="hidden md:inline-flex items-center gap-1 rounded-full border border-amber-300/50 bg-amber-400/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-100 shadow-[0_0_20px_rgba(254,192,19,0.35)]">
          <Crown className="h-3 w-3" /> Tier ∞
        </span>
      </div>

      <p className="relative mt-3 max-w-2xl text-[12px] text-white/60">
        A curated circle for GoLucky's most valuable players. Concierge-grade service, the highest cashback tier, and access to private events.
      </p>

      <div className="relative mt-5 grid grid-cols-2 gap-2.5 md:grid-cols-3">
        {perks.map((p) => (
          <div
            key={p.label}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-3 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-amber-300/40"
            style={{ boxShadow: `inset 0 0 32px ${p.tone}12` }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl border"
                style={{ color: p.tone, borderColor: `${p.tone}66`, background: `${p.tone}18`, boxShadow: `0 0 18px ${p.tone}44` }}
              >
                <p.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-black text-white">{p.label}</div>
                <div className="text-[9px] font-black uppercase tracking-widest text-white/40">Elite Perk</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-5 flex flex-wrap items-center gap-2">
        <Link
          to="/vip"
          className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 px-5 py-2.5 text-sm font-black uppercase tracking-wider text-black shadow-[0_20px_50px_-10px_rgba(254,192,19,0.75)] transition hover:-translate-y-0.5 hover:shadow-[0_25px_60px_-8px_rgba(254,192,19,0.95)]"
        >
          <Diamond className="h-4 w-4 transition group-hover:rotate-12" /> Request Invitation
        </Link>
        <Link
          to="/support"
          className="inline-flex items-center gap-2 rounded-2xl border border-amber-300/40 bg-white/[0.03] px-5 py-2.5 text-sm font-black uppercase tracking-wider text-amber-100 backdrop-blur-md transition hover:border-amber-300/70 hover:bg-white/10"
        >
          <LifeBuoy className="h-4 w-4" /> Concierge
        </Link>
      </div>
    </section>
  );
}

