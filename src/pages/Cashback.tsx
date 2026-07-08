import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Wallet as WalletIcon, ArrowDownRight, ArrowUpRight, ArrowLeftRight,
  History, Gift, BarChart3, Landmark, Users, ShieldCheck,
  Crown, Diamond, Sparkles, TrendingUp, Zap, Flame, Star, Radio,
  Lock, Copy, Eye, EyeOff, Fingerprint, Brain, Rocket, CheckCircle2,
  Award, ChevronRight, KeyRound, Coins, Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatTaka, formatTakaCompact } from "@/lib/currency";
import { useWalletFeed } from "@/hooks/useWalletFeed";
import { useWalletCentreData } from "@/hooks/useWalletCentreData";
import AgentTransferToUserModal from "@/components/wallet/AgentTransferToUserModal";
import { trackWalletQuickAction, type WalletQuickActionName } from "@/lib/analytics/walletQuickAction";

// ─── Palette ──────────────────────────────────────────────────────────────
const GOLD = "#FEC013";
const GOLD_HI = "#FDE68A";
const EMERALD = "#12C665";
const BLUE = "#02B4FA";
const PURPLE = "#DA29FB";
const ROSE = "#F43F5E";
const CYAN = "#22D3EE";

// ─── Shared shell ─────────────────────────────────────────────────────────
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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${tone}, ${accent})` }} />
      <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full opacity-40 blur-3xl" style={{ background: `radial-gradient(circle, ${tone}55, transparent 60%)` }} />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full opacity-30 blur-3xl" style={{ background: `radial-gradient(circle, ${accent}44, transparent 60%)` }} />
      <header className="relative mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-inner"
          style={{ color: tone, borderColor: `${tone}55`, background: `linear-gradient(135deg, ${tone}22, ${accent}22)` }}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: tone }}>{eyebrow}</div>
          <h2 className="truncate text-lg font-black text-white md:text-xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[11px] text-white/55">{subtitle}</p>}
        </div>
      </header>
      <div className="relative">{children}</div>
    </section>
  );
}

function Stat({ label, value, hint, tone = GOLD }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div
      className="group/stat rounded-2xl border p-3 backdrop-blur-md transition-all duration-300 ease-out will-change-transform hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.98] active:duration-100 motion-reduce:transform-none motion-reduce:transition-none"
      style={{ borderColor: `${tone}33`, background: `linear-gradient(135deg, ${tone}12, rgba(255,255,255,0.02) 70%)`, boxShadow: `inset 0 0 24px ${tone}10` }}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/45">{label}</div>
      <div className="mt-1 text-base font-black tabular-nums md:text-lg" style={{ color: tone, fontFamily: "'Space Grotesk', system-ui, sans-serif", textShadow: `0 0 12px ${tone}44` }}>{value}</div>
      {hint && <div className="mt-0.5 text-[10px] text-white/40">{hint}</div>}
    </div>
  );
}

function Empty({ label = "No data yet", icon }: { label?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
      <div className="text-white/40">{icon ?? <Inbox className="h-5 w-5" />}</div>
      <div className="text-xs font-black text-white/60">{label}</div>
    </div>
  );
}

const taka0 = (n: number) => formatTaka(n, 0);
const compact = (n: number) => (n > 0 ? formatTakaCompact(n) : "৳0");

// ─── Screen 1 · Wallet Command Center ─────────────────────────────────────
function Screen1CommandCenter() {
  const d = useWalletCentreData();
  const [hide, setHide] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (u?.user?.id) {
          setSignedIn(true);
          setUid(`GLU★${u.user.id.replace(/-/g, "").slice(-8).toUpperCase()}`);
          if (u.user.last_sign_in_at) {
            const dt = new Date(u.user.last_sign_in_at);
            setLastLogin(`${dt.toLocaleDateString()} · ${dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
          }
        }
      } catch { /* ignore */ }
      finally { setAuthResolved(true); }
    })();
  }, []);

  const copy = () => { if (!uid) return; navigator.clipboard.writeText(uid); toast.success("UID copied"); };

  // Strict loading guard — no partial render, no placeholder values.
  // Section 01 renders ONLY when:
  //   1. Auth check has completed (authResolved)
  //   2. Wallet hook is done loading (!d.loading)
  //   3. If signed in: uid is derived AND all required live DB fields
  //      (wallet row + profile row) have been fetched (d.authenticated).
  const requiredFieldsReady =
    !signedIn ||
    (d.authenticated &&
      uid !== null &&
      typeof d.balance === "number" &&
      typeof d.bonus === "number" &&
      typeof d.totalDeposit === "number" &&
      typeof d.vipLevel === "number");
  const ready = authResolved && !d.loading && requiredFieldsReady;
  if (!ready) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-[#1a1204] via-[#08112a] to-[#0a1a2e] p-5 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="h-10 w-2/3 rounded bg-white/10" />
          <div className="h-8 w-1/2 rounded bg-white/10" />
          <div className="h-12 w-40 rounded bg-white/10" />
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {[0,1,2,3].map((i) => <div key={i} className="h-16 rounded-xl bg-white/5" />)}
          </div>
          <div className="h-11 w-full rounded-2xl bg-white/5" />
        </div>
      </section>
    );
  }

  if (!signedIn || !d.authenticated) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-rose-400/30 bg-gradient-to-br from-[#1a0a12] via-[#08112a] to-[#0a1a2e] p-6 text-center md:p-10">
        <ShieldCheck className="mx-auto h-8 w-8 text-rose-300" />
        <h2 className="mt-3 text-xl font-black text-white">Sign in to view your Wallet Command Center</h2>
        <p className="mt-1 text-[12px] text-white/60">All values are live from the database — no data is shown until you authenticate.</p>
        <Link to="/auth" className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-emerald-400 px-5 py-2.5 text-sm font-black text-black">
          Sign In
        </Link>
      </section>
    );
  }


  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0a0511] via-[#04070f] to-[#02060e] p-5 shadow-[0_40px_120px_-40px_rgba(218,41,251,0.35)] md:p-8">
      {/* Cinematic cyber-vault ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-16 h-64 w-64 animate-pulse rounded-full blur-[120px]" style={{ background: `${PURPLE}26`, animationDuration: "6s" }} />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 animate-pulse rounded-full blur-[120px]" style={{ background: `${CYAN}26`, animationDuration: "8s" }} />
        <div className="absolute top-1/2 left-1/3 h-40 w-40 -translate-y-1/2 rounded-full blur-[100px]" style={{ background: `${GOLD}14` }} />
      </div>

      <div className="relative flex items-start gap-3">
        <div className="flex items-center gap-1.5">
          <WalletIcon className="h-6 w-6 animate-pulse" style={{ color: GOLD_HI, filter: `drop-shadow(0 0 6px ${GOLD}88)` }} />
          <Diamond className="h-5 w-5" style={{ color: CYAN, filter: `drop-shadow(0 0 6px ${CYAN}88)` }} />
          <ShieldCheck className="h-5 w-5" style={{ color: EMERALD, filter: `drop-shadow(0 0 6px ${EMERALD}88)` }} />
        </div>
        <span className="ml-auto rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] backdrop-blur-md"
          style={{ borderColor: `${EMERALD}55`, background: `${EMERALD}18`, color: "#A7F3D0" }}>
          <Flame className="mr-1 inline h-3 w-3" />Secure Live
        </span>
      </div>

      <p className="relative mt-5 text-[11px] font-bold uppercase tracking-[0.28em] text-white/40">Total Assets</p>
      <h1 className="relative mt-1 text-[28px] font-black uppercase leading-[0.95] tracking-tight md:text-[42px]"
        style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
        <span className="bg-gradient-to-r from-white via-amber-100 to-cyan-200 bg-clip-text text-transparent">Wallet</span>
        <br />
        <span className="bg-gradient-to-r from-amber-200 via-white to-fuchsia-200 bg-clip-text text-transparent">Command Center</span>
      </h1>

      <div className="relative mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        {uid && (
          <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-black text-white/85 backdrop-blur-md transition hover:scale-[1.02] hover:bg-white/10">
            <Fingerprint className="h-3 w-3" style={{ color: CYAN }} /> {uid} <Copy className="h-3 w-3 text-white/40" />
          </button>
        )}
        {d.vipLevel > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-black backdrop-blur-md"
            style={{ borderColor: `${GOLD}55`, background: `${GOLD}18`, color: GOLD_HI }}>
            <Crown className="h-3 w-3" /> VIP L{d.vipLevel}
          </span>
        )}
        {lastLogin && (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-white/60 backdrop-blur-md">
            <History className="h-3 w-3" /> Last {lastLogin}
          </span>
        )}
        {!d.authenticated && !d.loading && (
          <span className="rounded-full border border-rose-400/40 bg-rose-500/15 px-2 py-0.5 font-black text-rose-200">Sign in required</span>
        )}
      </div>

      <div className="relative mt-5 flex items-baseline gap-2">
        <span className="text-2xl font-black md:text-3xl" style={{ color: GOLD, fontFamily: "'Space Grotesk', system-ui, sans-serif", filter: `drop-shadow(0 0 12px ${GOLD}66)` }}>৳</span>
        <div className="text-4xl font-black tabular-nums text-white md:text-[44px]" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", letterSpacing: "-0.02em" }}>
          {hide ? "••••••" : taka0(d.balance).replace(/^৳\s*/, "")}
        </div>
        <button onClick={() => setHide((v) => !v)} className="mb-1 rounded-full border border-white/10 bg-white/[0.04] p-1.5 text-white/60 backdrop-blur-md transition hover:scale-105 hover:bg-white/10">
          {hide ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>
      <p className="relative text-[11px] uppercase tracking-[0.22em] text-white/40">Main wallet · live from database</p>


      <div className="relative mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Stat label="Wallet Health" value={d.kycVerified ? "Verified" : "Setup"} hint={d.kycVerified ? "KYC OK" : "Complete KYC"} tone={d.kycVerified ? EMERALD : GOLD} />
        <Stat label="AI Security" value={d.securityAlertsOpen === 0 ? "Clear" : `${d.securityAlertsOpen} alert`} hint="Live monitor" tone={d.securityAlertsOpen === 0 ? BLUE : ROSE} />
        <Stat label="Total Deposit" value={compact(d.totalDeposit)} hint="Lifetime" tone={GOLD_HI} />
        <Stat label="Bonus Wallet" value={compact(d.bonus)} hint="Promo balance" tone={PURPLE} />
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        <Link to="/wallet/workflow?tab=deposit"
          className="group flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-400 px-5 text-sm font-black uppercase tracking-wider text-black shadow-[0_18px_50px_-12px_rgba(254,192,19,0.7)] transition-all duration-300 ease-out will-change-transform hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_22px_60px_-10px_rgba(254,192,19,0.95)] active:scale-[0.97] active:translate-y-0 active:duration-100 active:shadow-[0_8px_24px_-8px_rgba(254,192,19,0.6)] motion-reduce:transform-none motion-reduce:transition-none">
          <ArrowDownRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5 group-active:translate-y-1" /> Deposit
        </Link>
        <Link to="/wallet/workflow?tab=withdraw"
          className="group flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-5 text-sm font-black uppercase tracking-wider text-white backdrop-blur-md transition-all duration-300 ease-out will-change-transform hover:-translate-y-0.5 hover:scale-[1.02] hover:border-cyan-300/40 hover:bg-white/10 hover:shadow-[0_20px_55px_-12px_rgba(34,211,238,0.55)] active:scale-[0.97] active:translate-y-0 active:duration-100 active:bg-white/[0.06] motion-reduce:transform-none motion-reduce:transition-none">
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-active:-translate-y-1" style={{ color: CYAN }} /> Withdraw
        </Link>
      </div>
    </section>
  );
}

// ─── Screen 2 · Quick Actions Hub (3×3) ───────────────────────────────────
function Screen2QuickActions() {
  const d = useWalletCentreData();
  const [authResolved, setAuthResolved] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (u?.user?.id) setSignedIn(true);
      } catch { /* ignore */ }
      finally { setAuthResolved(true); }
    })();
  }, []);

  // Every action is derived from LIVE wallet data. `enabled` gates the CTA,
  // `hint` shows a live sub-value (never a placeholder — omitted if unknown).
  const actions: Array<{
    to: string;
    label: WalletQuickActionName;
    icon: typeof ArrowDownRight;
    tone: string;
    enabled: boolean;
    hint: string | null;
  }> = [
    { to: "/wallet/workflow?tab=deposit",  label: "Deposit",         icon: ArrowDownRight, tone: EMERALD,  enabled: true,               hint: null },
    { to: "/wallet/workflow?tab=withdraw", label: "Withdraw",        icon: ArrowUpRight,   tone: BLUE,     enabled: d.balance > 0,      hint: `Avail ${compact(d.balance)}` },
    { to: "/wallet/transfer",              label: "Transfer",        icon: ArrowLeftRight, tone: PURPLE,   enabled: d.balance > 0,      hint: `Bal ${compact(d.balance)}` },
    { to: "/wallet/history",               label: "History",         icon: History,        tone: GOLD_HI,  enabled: true,               hint: null },
    { to: "/rewards",                      label: "Rewards",         icon: Gift,           tone: ROSE,     enabled: true,               hint: d.bonus > 0 ? `Bonus ${compact(d.bonus)}` : null },
    { to: "/wallet/analytics",             label: "Analytics",       icon: BarChart3,      tone: CYAN,     enabled: true,               hint: null },
    { to: "/fixed-deposits",                label: "Fixed Deposit",   icon: Landmark,       tone: GOLD,     enabled: true,               hint: d.fdActiveCount > 0 ? `${d.fdActiveCount} active` : null },
    { to: "/agent",                        label: "Agent Wallet",    icon: Users,          tone: PURPLE,   enabled: true,               hint: d.commission > 0 ? compact(d.commission) : null },
    { to: "/wallet/security",              label: "Security Center", icon: ShieldCheck,    tone: EMERALD,  enabled: true,               hint: d.securityAlertsOpen > 0 ? `${d.securityAlertsOpen} alert` : null },
  ];

  // Strict guard — never render actions until auth + live wallet data are ready.
  const ready =
    authResolved &&
    !d.loading &&
    (!signedIn || (d.authenticated &&
      typeof d.balance === "number" &&
      typeof d.bonus === "number" &&
      typeof d.commission === "number" &&
      typeof d.fdActiveCount === "number" &&
      typeof d.securityAlertsOpen === "number"));

  if (!ready) {
    return (
      <SectionShell eyebrow="Quick Access" title="Quick Actions Hub" subtitle="Loading live wallet actions…"
        icon={<Zap className="h-5 w-5" />} tone={EMERALD} tone2={GOLD_HI}>
        <div className="grid grid-cols-3 gap-2 animate-pulse">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-[86px] rounded-2xl border border-white/10 bg-white/5" />
          ))}
        </div>
      </SectionShell>
    );
  }

  if (!signedIn || !d.authenticated) {
    return (
      <SectionShell eyebrow="Quick Access" title="Quick Actions Hub" subtitle="Sign in to unlock wallet shortcuts."
        icon={<Zap className="h-5 w-5" />} tone={EMERALD} tone2={GOLD_HI}>
        <Link to="/auth" className="flex items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm font-black text-emerald-200">
          Sign In to Continue
        </Link>
      </SectionShell>
    );
  }

  return (
    <SectionShell eyebrow="Quick Access" title="Quick Actions Hub" subtitle="Nine one-tap shortcuts — every value below is live from your wallet."
      icon={<Zap className="h-5 w-5" />} tone={EMERALD} tone2={GOLD_HI}>
      <div className="grid grid-cols-3 gap-2">
        {actions.map((a) => {
          const cls = "group flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition";
          const style = { borderColor: `${a.tone}55`, background: `linear-gradient(135deg, ${a.tone}14, transparent 70%)` };
          const track = (e?: React.MouseEvent) => {
            trackWalletQuickAction({ action: a.label, target: a.to, enabled: a.enabled });
            if (!a.enabled) e?.preventDefault();
          };
          const inner = (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border" style={{ color: a.tone, borderColor: `${a.tone}55`, background: `${a.tone}18` }}>
                <a.icon className="h-5 w-5" />
              </div>
              <div className="text-[11px] font-black text-white">{a.label}</div>
              {a.hint ? <div className="text-[9px] font-semibold text-white/60 tabular-nums">{a.hint}</div> : null}
            </>
          );
          return a.enabled ? (
            <Link key={a.label} to={a.to} onClick={track} data-qa-action={a.label} data-qa-enabled="true" className={`${cls} hover:scale-[1.03]`} style={style}>{inner}</Link>
          ) : (
            <button key={a.label} type="button" onClick={track} data-qa-action={a.label} data-qa-enabled="false" aria-disabled title="Requires available balance" className={`${cls} cursor-not-allowed opacity-40`} style={style}>{inner}</button>
          );
        })}
      </div>
    </SectionShell>
  );
}


// ─── Screen 3 · Multi Wallet Ecosystem (6 grid) ───────────────────────────
function Screen3MultiWallet() {
  const d = useWalletCentreData();
  const usdtInBdt = d.usdt * 130;
  const wallets = [
    { name: "Main Wallet",     v: d.balance,          tag: "Primary",     icon: WalletIcon, tone: GOLD_HI },
    { name: "User Wallet",     v: d.balance,          tag: "Playable",    icon: Star,       tone: EMERALD },
    { name: "Agent Wallet",    v: d.commission,       tag: "Commission",  icon: Users,      tone: PURPLE },
    { name: "3rd Party Wallet",v: usdtInBdt,          tag: "USDT",        icon: Rocket,     tone: BLUE },
    { name: "FD Wallet",       v: d.fdTotalLocked,    tag: "Locked",      icon: Landmark,   tone: GOLD },
    { name: "Bonus Wallet",    v: d.bonus,            tag: "Promo",       icon: Gift,       tone: ROSE },
  ];
  return (
    <SectionShell eyebrow="Ecosystem" title="Multi Wallet Ecosystem" subtitle="Six live balances — hop between wallets instantly."
      icon={<Coins className="h-5 w-5" />} tone={BLUE} tone2={PURPLE}>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {wallets.map((w) => (
          <div key={w.name} className="relative overflow-hidden rounded-2xl border p-3"
            style={{ borderColor: `${w.tone}44`, background: `linear-gradient(135deg, ${w.tone}12, transparent 70%)` }}>
            <div className="mb-1 flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ color: w.tone, borderColor: `${w.tone}55` }}>
                <w.icon className="h-4 w-4" />
              </div>
              <span className="rounded-full border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest" style={{ borderColor: `${w.tone}55`, color: w.tone }}>
                {w.tag}
              </span>
            </div>
            <div className="text-[10px] text-white/50">{w.name}</div>
            <div className="text-base font-black tabular-nums" style={{ color: w.tone }}>{compact(w.v)}</div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

// ─── Screen 4 · AI Wallet Intelligence ────────────────────────────────────
function Screen4AIIntelligence() {
  const d = useWalletCentreData();
  const hasData = d.balance > 0 || d.totalDeposit > 0 || d.cashbackLast30 > 0;
  const cards = [
    { label: "Wallet Health",     value: d.kycVerified ? "Verified" : "Pending", hint: d.kycVerified ? "All checks green" : "Complete KYC", tone: d.kycVerified ? EMERALD : GOLD, icon: <ShieldCheck className="h-4 w-4" /> },
    { label: "Cashback (30d)",    value: taka0(d.cashbackLast30),                 hint: d.cashbackPending > 0 ? `${taka0(d.cashbackPending)} pending` : "Auto-credited", tone: GOLD_HI, icon: <Gift className="h-4 w-4" /> },
    { label: "VIP Level",         value: d.vipLevel > 0 ? `L${d.vipLevel}` : "—", hint: d.vipExp > 0 ? `${Math.round(d.vipExp)} exp` : "No progress yet", tone: PURPLE, icon: <Crown className="h-4 w-4" /> },
    { label: "Weekly Net",        value: `${d.weekNetProfit >= 0 ? "+" : ""}${taka0(d.weekNetProfit)}`, hint: "Last 7 days", tone: d.weekNetProfit >= 0 ? EMERALD : ROSE, icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Risk Level",        value: d.securityAlertsOpen === 0 ? "Low" : "Review", hint: d.securityAlertsOpen === 0 ? "AI fraud model" : `${d.securityAlertsOpen} open alerts`, tone: d.securityAlertsOpen === 0 ? EMERALD : ROSE, icon: <Brain className="h-4 w-4" /> },
    { label: "Active Referrals",  value: String(d.activeReferrals),               hint: "Direct downline", tone: BLUE, icon: <Sparkles className="h-4 w-4" /> },
  ];
  return (
    <SectionShell eyebrow="AI Engine" title="AI Wallet Intelligence" subtitle="Predictive scoring on your live balance, rewards and risk."
      icon={<Brain className="h-5 w-5" />} tone={PURPLE} tone2={BLUE}>
      {!hasData && !d.loading ? (
        <Empty label="No Analytics Available" icon={<Brain className="h-5 w-5" />} />
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border p-3"
              style={{ borderColor: `${c.tone}44`, background: `linear-gradient(135deg, ${c.tone}12, transparent 75%)` }}>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border" style={{ color: c.tone, borderColor: `${c.tone}55` }}>
                  {c.icon}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: c.tone }}>{c.label}</div>
              </div>
              <div className="mt-1.5 text-base font-black text-white">{c.value}</div>
              <div className="text-[10px] text-white/50">{c.hint}</div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

// ─── Screen 5 · Wallet Analytics ──────────────────────────────────────────
function Screen5Analytics() {
  const d = useWalletCentreData();
  const rows = [
    { label: "This Week Deposit",  v: d.weekDeposit,  tone: EMERALD },
    { label: "This Week Withdraw", v: d.weekWithdraw, tone: BLUE },
    { label: "Turnover (7d)",      v: d.weekTurnover, tone: GOLD_HI },
    { label: "Net Profit",         v: Math.max(0, d.weekNetProfit), tone: d.weekNetProfit >= 0 ? EMERALD : ROSE },
    { label: "Games Played",       v: d.gamesPlayed,  tone: PURPLE, isCount: true },
    { label: "Win Rate",           v: d.winRate,      tone: GOLD,   isPct: true },
  ] as Array<{ label: string; v: number; tone: string; isCount?: boolean; isPct?: boolean }>;
  const hasAny = rows.some((r) => r.v > 0);
  const max = Math.max(1, ...rows.filter((r) => !r.isPct && !r.isCount).map((r) => r.v));
  return (
    <SectionShell eyebrow="Analytics" title="Wallet Analytics" subtitle="Money in, money out and turnover — live from your ledger."
      icon={<BarChart3 className="h-5 w-5" />} tone={BLUE} tone2={EMERALD}>
      {!hasAny && !d.loading ? (
        <Empty label="No Analytics Available" icon={<BarChart3 className="h-5 w-5" />} />
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {rows.map((r) => (
            <div key={r.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/45">{r.label}</div>
              <div className="mt-1 text-base font-black tabular-nums md:text-lg" style={{ color: r.tone }}>
                {r.isPct ? `${r.v}%` : r.isCount ? r.v.toLocaleString() : compact(r.v)}
              </div>
              {!r.isPct && !r.isCount && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (r.v / max) * 100)}%`, background: r.tone, boxShadow: `0 0 12px ${r.tone}80` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Link to="/wallet/analytics" className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 text-sm font-black text-white hover:bg-white/10">
        Open Full Analytics <ChevronRight className="h-4 w-4" />
      </Link>
    </SectionShell>
  );
}

// ─── Screen 6 · Agent Wallet Center ───────────────────────────────────────
function Screen6AgentWallet() {
  const d = useWalletCentreData();
  const [xferOpen, setXferOpen] = useState(false);
  const hasAgent = d.agentTotalCommission > 0 || d.activeReferrals > 0 || d.commission > 0;
  return (
    <SectionShell eyebrow="Agent" title="Agent Wallet Center" subtitle="Commission balance, payouts and downline — live."
      icon={<Users className="h-5 w-5" />} tone={ROSE} tone2={PURPLE}>
      {!hasAgent && !d.loading ? (
        <Empty label="No Agent Activity Yet" icon={<Users className="h-5 w-5" />} />
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <Stat label="Agent Balance"     value={compact(d.commission)}             hint="Available"  tone={PURPLE} />
          <Stat label="Today Commission"  value={compact(d.agentTodayCommission)}   hint="Today"      tone={GOLD_HI} />
          <Stat label="Monthly Commission"value={compact(d.agentMonthCommission)}   hint="This month" tone={EMERALD} />
          <Stat label="Pending Payout"    value={compact(d.agentPendingCommission)} hint="Un-credited" tone={BLUE} />
          <Stat label="Lifetime Earned"   value={compact(d.agentTotalCommission)}   hint="All time"   tone={ROSE} />
          <Stat label="Active Referrals"  value={String(d.activeReferrals)}         hint="Downline"   tone={CYAN} />
        </div>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setXferOpen(true)}
          disabled={d.commission <= 0}
          className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-amber-400 text-sm font-black text-black shadow-[0_18px_45px_-15px_rgba(218,41,251,0.6)] disabled:opacity-40"
        >
          <ArrowLeftRight className="h-4 w-4" /> Transfer To User
        </button>
        <Link to="/agent" className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 text-sm font-black text-white hover:bg-white/10">
          <Users className="h-4 w-4" /> Agent Dashboard
        </Link>
      </div>
      <AgentTransferToUserModal
        open={xferOpen}
        onClose={() => setXferOpen(false)}
        agentCommissionBalance={d.commission}
        onSuccess={() => d.refresh()}
      />
    </SectionShell>
  );
}

// ─── Screen 7 · Fixed Deposit Wallet ──────────────────────────────────────
function Screen7FDWallet() {
  const d = useWalletCentreData();
  return (
    <SectionShell eyebrow="Fixed Deposit" title="Fixed Deposit Wallet" subtitle="Locked capital, running yield and upcoming maturities."
      icon={<Landmark className="h-5 w-5" />} tone={GOLD} tone2={BLUE}>
      {d.fdActiveCount === 0 && !d.loading ? (
        <Empty label="No Active Fixed Deposits" icon={<Landmark className="h-5 w-5" />} />
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Stat label="Total Locked"    value={compact(d.fdTotalLocked)}                              hint={`${d.fdActiveCount} plans`}   tone={GOLD_HI} />
          <Stat label="Running Profit"  value={`+${compact(d.fdRunningProfit)}`}                       hint="Accrued"                     tone={EMERALD} />
          <Stat label="Next Maturity"   value={d.fdNextMaturity ? new Date(d.fdNextMaturity).toLocaleDateString() : "—"} hint="Nearest end"                 tone={BLUE} />
          <Stat label="Expected Return" value={compact(d.fdExpectedReturn)}                            hint="Full term"                   tone={GOLD} />
        </div>
      )}
      <Link to="/fixed-deposits" className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-sky-500 text-sm font-black text-black shadow-[0_18px_45px_-15px_rgba(254,192,19,0.6)]">
        <Landmark className="h-4 w-4" /> Manage FD Portfolio
      </Link>
    </SectionShell>
  );
}

// ─── Screen 9 · Recent Transactions ───────────────────────────────────────
type TxFilter = "all" | "deposit" | "withdraw" | "transfer" | "bonus";
const TX_TONE: Record<string, string> = {
  deposit: EMERALD, withdraw: BLUE, transfer: PURPLE, bonus: GOLD_HI,
  win: GOLD_HI, bet: ROSE, referral: ROSE, commission: PURPLE,
};
function Screen9Transactions() {
  const d = useWalletCentreData();
  const [filter, setFilter] = useState<TxFilter>("all");
  const chips: TxFilter[] = ["all", "deposit", "withdraw", "transfer", "bonus"];
  const rows = filter === "all" ? d.recent : d.recent.filter((t) => t.type === filter);
  return (
    <SectionShell eyebrow="Transactions" title="Recent Transactions" subtitle="Filter by type — live from wallet_transactions."
      icon={<History className="h-5 w-5" />} tone={BLUE} tone2={ROSE}>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest transition ${
              filter === c ? "border-sky-400/60 bg-sky-500/20 text-white" : "border-white/10 bg-white/5 text-white/60 hover:text-white"
            }`}>
            {c}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <Empty label="No Transactions Yet" icon={<History className="h-5 w-5" />} />
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => {
            const tone = TX_TONE[r.type] ?? GOLD_HI;
            const label = r.description || r.type;
            const negative = r.type === "withdraw" || r.type === "bet";
            return (
              <li key={r.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black uppercase text-black" style={{ background: tone }}>
                    {r.type[0]?.toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-black text-white">{label}</div>
                    <div className="text-[10px] text-white/50">{new Date(r.created_at).toLocaleString()} · {r.type}</div>
                  </div>
                </div>
                <div className="text-sm font-black tabular-nums" style={{ color: tone }}>
                  {negative ? "-" : "+"}{taka0(Number(r.amount))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Link to="/wallet/history" className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 text-xs font-black text-white hover:bg-white/10">
        View Full History <ChevronRight className="h-4 w-4" />
      </Link>
    </SectionShell>
  );
}

// ─── Screen 10 · Income Distribution ──────────────────────────────────────
function Screen10IncomeDist() {
  const d = useWalletCentreData();
  const palette: Record<string, string> = {
    "Game Wins": GOLD_HI, "Cashback / Bonus": EMERALD, "Referral": BLUE,
    "Agent Commission": ROSE, "FD Interest": GOLD, "VIP Bonus": PURPLE,
  };
  const rows = d.income.map((r) => ({ ...r, tone: palette[r.label] ?? GOLD_HI }));
  const total = rows.reduce((s, r) => s + r.v, 0);
  return (
    <SectionShell eyebrow="Income" title="Income Distribution" subtitle="Where your last-30-day income came from — every taka mapped."
      icon={<TrendingUp className="h-5 w-5" />} tone={EMERALD} tone2={GOLD_HI}>
      {rows.length === 0 ? (
        <Empty label="No Income Recorded Yet" icon={<TrendingUp className="h-5 w-5" />} />
      ) : (
        <>
          <div className="mb-3 flex items-baseline justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/45">Total (30d)</div>
            <div className="text-2xl font-black tabular-nums" style={{ color: GOLD_HI }}>{compact(total)}</div>
          </div>
          <div className="mb-3 flex h-3 overflow-hidden rounded-full border border-white/10">
            {rows.map((r) => (
              <div key={r.label} style={{ width: `${(r.v / total) * 100}%`, background: r.tone }} />
            ))}
          </div>
          <ul className="space-y-1.5">
            {rows.map((r) => (
              <li key={r.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.tone, boxShadow: `0 0 8px ${r.tone}` }} />
                  <div className="text-xs font-black text-white">{r.label}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[10px] text-white/50 tabular-nums">{Math.round((r.v / total) * 100)}%</div>
                  <div className="text-sm font-black tabular-nums" style={{ color: r.tone }}>{compact(r.v)}</div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </SectionShell>
  );
}

// ─── Screen 11 · Wallet Security Center ───────────────────────────────────
function Screen11Security() {
  const d = useWalletCentreData();
  const items = [
    { label: "KYC Status",          value: d.kycVerified ? "Verified" : "Not verified", tone: d.kycVerified ? EMERALD : GOLD, icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: "Security Alerts",     value: d.securityAlertsOpen === 0 ? "None" : String(d.securityAlertsOpen), tone: d.securityAlertsOpen === 0 ? EMERALD : ROSE, icon: <Radio className="h-4 w-4" /> },
    { label: "Session",             value: d.authenticated ? "Active" : "Signed out", tone: d.authenticated ? BLUE : ROSE, icon: <Lock className="h-4 w-4" /> },
    { label: "Withdrawal Password", value: "Managed",                                  tone: BLUE,    icon: <KeyRound className="h-4 w-4" /> },
    { label: "2FA",                 value: "Managed",                                  tone: BLUE,    icon: <ShieldCheck className="h-4 w-4" /> },
    { label: "Trusted Device",      value: "This device",                              tone: BLUE,    icon: <Fingerprint className="h-4 w-4" /> },
  ];
  const score = Math.max(0, 60 + (d.kycVerified ? 25 : 0) + (d.securityAlertsOpen === 0 ? 15 : 0));
  return (
    <SectionShell eyebrow="Security" title="Wallet Security Center" subtitle="KYC, alerts and session — live from your account."
      icon={<ShieldCheck className="h-5 w-5" />} tone={EMERALD} tone2={BLUE}>
      <div className="mb-3 flex items-center justify-between rounded-2xl border border-emerald-400/25 bg-emerald-500/5 p-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Security Score</div>
          <div className="text-3xl font-black text-white">{score}<span className="text-sm text-white/40">/100</span></div>
          <div className="text-[10px] text-white/55">Live · KYC + alerts</div>
        </div>
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${EMERALD} 0 ${score}%, rgba(255,255,255,0.08) ${score}% 100%)` }} />
          <div className="absolute inset-1.5 flex items-center justify-center rounded-full bg-[#0b1220]">
            <ShieldCheck className="h-6 w-6" style={{ color: EMERALD }} />
          </div>
        </div>
      </div>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border" style={{ color: it.tone, borderColor: `${it.tone}55` }}>{it.icon}</span>
              <div className="text-xs font-black text-white">{it.label}</div>
            </div>
            <div className="text-xs font-black" style={{ color: it.tone }}>{it.value}</div>
          </li>
        ))}
      </ul>
      <Link to="/wallet/security" className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-sky-500 text-sm font-black text-black shadow-[0_18px_45px_-15px_rgba(18,198,101,0.6)]">
        <ShieldCheck className="h-4 w-4" /> Manage Security
      </Link>
    </SectionShell>
  );
}

// ─── Screen 12 · Ultra Wallet Banner ──────────────────────────────────────
function Screen12UltraBanner() {
  const bullets = [
    { icon: <ShieldCheck className="h-4 w-4" />, label: "Military-Grade Security",  tone: EMERALD },
    { icon: <Brain className="h-4 w-4" />,       label: "AI Fraud Detection",       tone: PURPLE },
    { icon: <Radio className="h-4 w-4" />,       label: "24/7 Protection",          tone: BLUE },
    { icon: <Zap className="h-4 w-4" />,         label: "Instant Settlement",       tone: GOLD_HI },
    { icon: <Coins className="h-4 w-4" />,       label: "Multi-Wallet System",      tone: ROSE },
  ];
  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-br from-[#1a1204] via-[#0b1220] to-[#140628] p-5 shadow-[0_35px_100px_-30px_rgba(218,41,251,0.35)] md:p-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/4 h-56 w-56 rounded-full blur-3xl" style={{ background: `${GOLD}33` }} />
        <div className="absolute -bottom-24 right-1/4 h-56 w-56 rounded-full blur-3xl" style={{ background: `${PURPLE}33` }} />
      </div>
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <Diamond className="h-5 w-5" style={{ color: GOLD_HI }} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-200">GoLucky Ultra Wallet</span>
        </div>
        <h2 className="bg-gradient-to-r from-amber-200 via-white to-purple-200 bg-clip-text text-2xl font-black uppercase tracking-tight text-transparent md:text-4xl">
          The Safest Wallet<br />in Bangladesh
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
          {bullets.map((b) => (
            <div key={b.label} className="flex items-center gap-2 rounded-2xl border p-2.5" style={{ borderColor: `${b.tone}44`, background: `linear-gradient(135deg, ${b.tone}12, transparent 75%)` }}>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ color: b.tone, borderColor: `${b.tone}55` }}>{b.icon}</span>
              <div className="text-sm font-black text-white">{b.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Screen 13 · VIP Wallet Club ──────────────────────────────────────────
const VIP_THRESHOLDS = [0, 1000, 5000, 20000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000];
function Screen13VIPClub() {
  const d = useWalletCentreData();
  const level = d.vipLevel;
  const nextIdx = Math.min(level + 1, VIP_THRESHOLDS.length - 1);
  const cur = VIP_THRESHOLDS[Math.min(level, VIP_THRESHOLDS.length - 1)] ?? 0;
  const next = VIP_THRESHOLDS[nextIdx] ?? cur;
  const progress = next > cur ? Math.max(0, Math.min(100, Math.round(((d.vipExp - cur) / (next - cur)) * 100))) : 0;
  const hasVip = level > 0 || d.vipExp > 0;
  return (
    <SectionShell eyebrow="VIP" title="VIP Wallet Club" subtitle="Live VIP tier and progress from your profile."
      icon={<Crown className="h-5 w-5" />} tone={PURPLE} tone2={GOLD_HI}>
      {!hasVip && !d.loading ? (
        <Empty label="No VIP Progress Yet" icon={<Crown className="h-5 w-5" />} />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-purple-400/25 bg-purple-500/5 p-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-purple-200">Current VIP</div>
              <div className="text-3xl font-black text-white">L{level}</div>
              <div className="text-[10px] text-white/55">Exp {Math.round(d.vipExp).toLocaleString()}</div>
            </div>
            <Award className="h-10 w-10" style={{ color: GOLD_HI }} />
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            <Stat label="Cashback (30d)" value={compact(d.cashbackLast30)} hint="Live"     tone={EMERALD} />
            <Stat label="Pending"        value={compact(d.cashbackPending)} hint="Awaiting" tone={GOLD_HI} />
            <Stat label="Next Tier"      value={`L${nextIdx}`}              hint={`${compact(next)} exp`} tone={PURPLE} />
          </div>
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[10px] text-white/55">
              <span>Progress to L{nextIdx}</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${PURPLE}, ${GOLD_HI})`, boxShadow: `0 0 12px ${PURPLE}80` }} />
            </div>
          </div>
        </>
      )}
      <Link to="/vip" className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-amber-400 text-sm font-black text-black">
        <Crown className="h-4 w-4" /> Open VIP Club
      </Link>
    </SectionShell>
  );
}

// ─── Screen 14 · Wallet Live Feed (Footer) ────────────────────────────────
function Screen14LiveFeed() {
  const feed = useWalletFeed(24);
  const ticker = useMemo(() => (feed.length ? [...feed, ...feed] : []), [feed]);
  const liveCount = feed.length;
  return (
    <SectionShell eyebrow="Live Activity" title="Wallet Live Feed" subtitle={`Live wallet activity across the platform · ${liveCount} events`}
      icon={<Radio className="h-5 w-5 animate-pulse" />} tone={ROSE} tone2={GOLD_HI}>
      {feed.length === 0 ? (
        <Empty label="No Live Activity Yet" icon={<Radio className="h-5 w-5" />} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-rose-400/25 bg-black/40">
          <div className="flex whitespace-nowrap gap-8 py-2 text-[11px] font-black text-white/85"
            style={{ animation: "wc-ticker 34s linear infinite" }}>
            {ticker.map((r, i) => (
              <span key={`${r.id}-${i}`} className="inline-flex items-center gap-2 px-3">
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: r.tone, boxShadow: `0 0 8px ${r.tone}` }} />
                <span className="text-white">{r.user}</span>
                <span className="text-white/50">{r.kind}</span>
                <span style={{ color: r.tone }}>{r.what}</span>
                <span className="text-white/50">·</span>
                <span className="tabular-nums" style={{ color: GOLD_HI }}>+{taka0(r.amount)}</span>
                {r.live && <span className="rounded-full border border-rose-400/40 px-1.5 py-0.5 text-[8px] uppercase tracking-widest text-rose-200">Live</span>}
              </span>
            ))}
          </div>
          <style>{`@keyframes wc-ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
        </div>
      )}
    </SectionShell>
  );
}

// ─── Ambient FX (static glows only — floating particles removed for perf) ─
function AmbientFX() {
  return (
    <div data-wc-fx aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -top-32 left-[10%] h-80 w-80 rounded-full blur-[100px] opacity-40" style={{ background: `${GOLD}33` }} />
      <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full blur-[110px] opacity-30" style={{ background: `${PURPLE}33` }} />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full blur-[120px] opacity-25" style={{ background: `${EMERALD}2e` }} />
      <div className="absolute top-2/3 left-0 h-72 w-72 rounded-full blur-[100px] opacity-25" style={{ background: `${BLUE}2e` }} />
    </div>
  );
}


// ─── Page ────────────────────────────────────────────────────────────────
export default function WalletCentre() {
  useEffect(() => { document.title = "Wallet Centre · GoLucky"; }, []);
  return (
    <div data-wc-root className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#05060f] via-[#070b1c] to-[#050914] pb-24 pt-4 text-white">
      <AmbientFX />
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-4 px-3 md:gap-6 md:px-6">
        {/* 13 locked Wallet Centre sections in exact order — no duplicates. */}
        <Screen1CommandCenter />
        <Screen2QuickActions />
        <Screen3MultiWallet />
        <Screen5Analytics />
        <Screen4AIIntelligence />
        <Screen6AgentWallet />
        <Screen7FDWallet />
        <Screen12UltraBanner />
        <Screen9Transactions />
        <Screen10IncomeDist />
        <Screen11Security />
        <Screen13VIPClub />
        <Screen14LiveFeed />
      </div>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          [data-wc-root], [data-wc-root] * {
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
