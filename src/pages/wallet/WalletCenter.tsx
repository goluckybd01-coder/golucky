/**
 * WalletCenter — /wallet
 * Ultra-Premium Wallet Centre (matches reference design).
 */
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  User as UserIcon,
  Wallet as WalletIcon,
  ShieldCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  History as HistoryIcon,
  Gift,
  BarChart3,
  Bell,
  Lock,
  ChevronRight,
  TrendingUp,
  Gem,
  Dices,
  Sparkles,
  Coins,
  Menu,
  Eye,
  Plus,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { useDualWallet } from "@/hooks/useDualWallet";
import {
  WalletCanvas,
  fmtBDT,
  fadeUp,
  stagger,
} from "@/components/wallet/premium/shared";
import crownLogo from "@/assets/golucky-crown-logo.png.asset.json";
import vaultHero from "@/assets/wallet-vault-hero.png.asset.json";
import treasureChest from "@/assets/wallet-treasure-chest.png.asset.json";

/* -------------------- Wallet Type Card -------------------- */
function WalletTypeCard({
  title,
  balance,
  subtitle,
  icon: Icon,
  color,
  onClick,
}: {
  title: string;
  balance: number;
  subtitle: string;
  icon: any;
  color: "emerald" | "sky" | "violet" | "amber";
  onClick: () => void;
}) {
  const map = {
    emerald: {
      border: "border-emerald-400/70",
      glow: "shadow-[0_0_24px_-4px_rgba(16,185,129,0.55),inset_0_0_20px_rgba(16,185,129,0.15)]",
      text: "text-emerald-300",
      arrow: "text-emerald-300",
    },
    sky: {
      border: "border-sky-400/70",
      glow: "shadow-[0_0_24px_-4px_rgba(56,189,248,0.55),inset_0_0_20px_rgba(56,189,248,0.15)]",
      text: "text-sky-300",
      arrow: "text-sky-300",
    },
    violet: {
      border: "border-fuchsia-400/70",
      glow: "shadow-[0_0_24px_-4px_rgba(217,70,239,0.55),inset_0_0_20px_rgba(217,70,239,0.15)]",
      text: "text-fuchsia-300",
      arrow: "text-fuchsia-300",
    },
    amber: {
      border: "border-amber-400/70",
      glow: "shadow-[0_0_24px_-4px_rgba(245,158,11,0.55),inset_0_0_20px_rgba(245,158,11,0.15)]",
      text: "text-amber-300",
      arrow: "text-amber-300",
    },
  }[color];

  return (
    <motion.button
      variants={fadeUp}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative text-left rounded-2xl border-2 ${map.border} ${map.glow} bg-black/70 backdrop-blur-md p-2.5 flex items-center gap-2`}
    >
      <div className={`h-9 w-9 shrink-0 rounded-xl border ${map.border} bg-black/60 flex items-center justify-center ${map.text}`}>
        <Icon className="h-4 w-4" strokeWidth={2.4} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-black text-white leading-tight whitespace-nowrap">{title}</div>
        <div className="text-[13px] font-black text-white tabular-nums leading-tight mt-0.5 truncate">
          ৳ {fmtBDT(balance)}
        </div>
        <div className="text-[9.5px] text-white/60 mt-0.5 truncate">{subtitle}</div>
      </div>
      <ChevronRight className={`h-4 w-4 shrink-0 ${map.arrow}`} strokeWidth={3} />
    </motion.button>
  );
}

/* -------------------- Quick Action gem -------------------- */
function QuickAction({
  icon: Icon,
  label,
  onClick,
  color,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  color: "emerald" | "violet" | "amber" | "sky" | "rose" | "green";
}) {
  const map = {
    emerald: { border: "border-emerald-400/70", glow: "shadow-[0_0_20px_-2px_rgba(16,185,129,0.7),inset_0_0_14px_rgba(16,185,129,0.25)]", text: "text-emerald-300" },
    violet:  { border: "border-fuchsia-400/70", glow: "shadow-[0_0_20px_-2px_rgba(217,70,239,0.7),inset_0_0_14px_rgba(217,70,239,0.25)]", text: "text-fuchsia-300" },
    amber:   { border: "border-amber-400/70",   glow: "shadow-[0_0_20px_-2px_rgba(245,158,11,0.7),inset_0_0_14px_rgba(245,158,11,0.25)]", text: "text-amber-300" },
    sky:     { border: "border-sky-400/70",     glow: "shadow-[0_0_20px_-2px_rgba(56,189,248,0.7),inset_0_0_14px_rgba(56,189,248,0.25)]", text: "text-sky-300" },
    rose:    { border: "border-rose-400/70",    glow: "shadow-[0_0_20px_-2px_rgba(244,63,94,0.7),inset_0_0_14px_rgba(244,63,94,0.25)]", text: "text-rose-300" },
    green:   { border: "border-emerald-300/70", glow: "shadow-[0_0_20px_-2px_rgba(52,211,153,0.7),inset_0_0_14px_rgba(52,211,153,0.25)]", text: "text-emerald-300" },
  }[color];

  return (
    <motion.button
      variants={fadeUp}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5"
    >
      <div className={`h-12 w-12 rounded-2xl border-2 ${map.border} ${map.glow} bg-black/70 flex items-center justify-center`}>
        <Icon className={`h-5 w-5 ${map.text}`} strokeWidth={2.6} />
      </div>
      <span className="text-[10.5px] font-bold text-white/85">{label}</span>
    </motion.button>
  );
}

/* -------------------- Analytics stat tile -------------------- */
function StatTile({
  label,
  value,
  color,
  trend,
  accent,
}: {
  label: string;
  value: string;
  color: "emerald" | "rose" | "sky" | "amber";
  trend?: boolean;
  accent?: LucideIcon;
}) {
  const map = {
    emerald: { ring: "border-emerald-400/60 shadow-[0_0_18px_-4px_rgba(16,185,129,0.5),inset_0_0_14px_rgba(16,185,129,0.12)]", ic: "text-emerald-300" },
    rose:    { ring: "border-rose-400/60 shadow-[0_0_18px_-4px_rgba(244,63,94,0.5),inset_0_0_14px_rgba(244,63,94,0.12)]",    ic: "text-rose-300" },
    sky:     { ring: "border-sky-400/60 shadow-[0_0_18px_-4px_rgba(56,189,248,0.5),inset_0_0_14px_rgba(56,189,248,0.12)]",   ic: "text-sky-300" },
    amber:   { ring: "border-amber-400/60 shadow-[0_0_18px_-4px_rgba(245,158,11,0.5),inset_0_0_14px_rgba(245,158,11,0.12)]", ic: "text-amber-300" },
  }[color];
  const Accent = accent;
  return (
    <div className={`relative rounded-xl border-2 ${map.ring} bg-black/60 p-2.5 overflow-hidden`}>
      {Accent && (
        <Accent
          aria-hidden
          className={`absolute bottom-1.5 right-1.5 h-5 w-5 ${map.ic} opacity-90 drop-shadow-[0_0_8px_currentColor]`}
          strokeWidth={2.2}
        />
      )}
      <div className="text-[9.5px] font-bold text-white/70 pr-6 leading-tight">{label}</div>
      <div className="text-[13px] font-black text-white tabular-nums mt-1 flex items-center gap-1 pr-6">
        {value}
        {trend && <TrendingUp className="h-3 w-3 text-emerald-300" />}
      </div>
    </div>
  );

}


/* -------------------- Mini Sparkline -------------------- */
function MiniChart() {
  return (
    <div className="relative rounded-xl border-2 border-indigo-400/60 shadow-[0_0_18px_-4px_rgba(99,102,241,0.55),inset_0_0_14px_rgba(99,102,241,0.15)] bg-black/60 p-2 overflow-hidden">
      <svg viewBox="0 0 100 40" className="w-full h-full">
        <defs>
          <linearGradient id="wc-line-a" x1="0" x2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient id="wc-line-b" x1="0" x2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <polyline fill="none" stroke="url(#wc-line-a)" strokeWidth="1.4"
          points="2,28 15,22 28,26 40,14 52,18 65,10 78,16 92,8" />
        <polyline fill="none" stroke="url(#wc-line-b)" strokeWidth="1.4"
          points="2,34 15,30 28,32 40,24 52,28 65,22 78,26 92,20" />
      </svg>
    </div>
  );
}

/* -------- Analytics card with prominent sparkline (reference style) -------- */
function StatChart({
  label,
  value,
  delta,
  subtitle,
  color,
  accent: Accent,
  bars,
}: {
  label: string;
  value: string;
  delta: string;
  subtitle: string;
  color: "emerald" | "rose" | "amber" | "sky" | "violet" | "green";
  accent: LucideIcon;
  bars?: boolean;
}) {
  const map = {
    emerald: { ring: "border-emerald-400/50", stroke: "#10b981", txt: "text-emerald-300", chip: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40" },
    rose:    { ring: "border-rose-400/50",    stroke: "#f43f5e", txt: "text-rose-300",    chip: "bg-rose-500/15 text-rose-300 border-rose-400/40" },
    amber:   { ring: "border-amber-400/50",   stroke: "#f59e0b", txt: "text-amber-300",   chip: "bg-amber-500/15 text-amber-300 border-amber-400/40" },
    sky:     { ring: "border-sky-400/50",     stroke: "#38bdf8", txt: "text-sky-300",     chip: "bg-sky-500/15 text-sky-300 border-sky-400/40" },
    violet:  { ring: "border-fuchsia-400/50", stroke: "#d946ef", txt: "text-fuchsia-300", chip: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/40" },
    green:   { ring: "border-emerald-300/50", stroke: "#34d399", txt: "text-emerald-300", chip: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40" },
  }[color];
  const pts = "0,32 12,26 24,28 36,18 48,22 60,12 72,16 84,8 96,14 108,6 120,10";
  return (
    <div className={`relative rounded-2xl border-2 ${map.ring} bg-black/60 p-3 overflow-hidden shadow-[0_0_18px_-6px_currentColor] ${map.txt}/30`}>
      <div className="flex items-start justify-between">
        <div className="text-[10.5px] font-bold text-white/70">{label}</div>
        <Accent className={`h-4 w-4 ${map.txt} opacity-90`} strokeWidth={2.4} />
      </div>
      <div className="mt-1 text-[16px] font-black text-white tabular-nums">{value}</div>
      <div className={`inline-flex items-center gap-1 mt-1 text-[9.5px] font-black rounded-md border px-1.5 py-0.5 ${map.chip}`}>
        {delta}
      </div>
      <div className="mt-1 h-8">
        <svg viewBox="0 0 120 36" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`sc-${color}-${label}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={map.stroke} stopOpacity="0.55" />
              <stop offset="100%" stopColor={map.stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          {bars ? (
            <g fill={map.stroke}>
              {[6,10,14,8,18,12,22,16,26,20,28,24].map((h, i) => (
                <rect key={i} x={i * 10 + 1} y={36 - h} width={7} height={h} rx={1} opacity={0.85} />
              ))}
            </g>
          ) : (
            <>
              <polyline fill="none" stroke={map.stroke} strokeWidth="1.6" points={pts} />
              <polygon fill={`url(#sc-${color}-${label})`} points={`${pts} 120,36 0,36`} />
            </>
          )}
        </svg>
      </div>
      <div className="mt-1 flex items-center justify-between text-[9px] text-white/50">
        <span>vs Last Month</span>
        <span className={`font-black ${map.txt}`}>{subtitle}</span>
      </div>
    </div>
  );
}

/* ============================ PAGE ============================ */
export default function WalletCenter() {
  const nav = useNavigate();
  const w = useDualWallet();
  const isLoading = w.isLoading;
  const hasError = !!w.error;
  const ready = !isLoading && !hasError;

  // Real balances from useDualWallet — no hardcoded defaults
  const rate = ready ? w.rate : 0;
  const totalBDT = ready ? w.balanceBDT + w.balanceUSDT * rate + w.providerBalance : 0;
  const usdEquiv = ready && rate ? (totalBDT / rate).toFixed(2) : "—";
  const mainBalance = ready ? w.balanceBDT : 0;
  const thirdPartyBalance = ready ? w.providerBalance : 0;
  const userWalletBalance = ready ? w.balanceUSDT * rate : 0; // USDT sub-balance shown in BDT
  const agentWalletBalance = 0; // No agent-commission balance source yet; render real 0

  const Skeleton = ({ className = "" }: { className?: string }) => (
    <span className={`inline-block align-middle rounded-md bg-white/10 animate-pulse ${className}`} aria-hidden />
  );
  const showValue = (node: React.ReactNode, skeletonCls: string) =>
    isLoading ? <Skeleton className={skeletonCls} /> : hasError ? <span className="text-white/40">—</span> : node;

  return (
    <>
      <Helmet>
        <title>Wallet Centre · GoLucky — Ultra Premium Multi-Wallet</title>
        <meta name="description" content="GoLucky Wallet Centre: manage Main, User, 3rd Party and Agent wallets with instant transfers, deposits, withdrawals and analytics." />
      </Helmet>

      <WalletCanvas>
        {/* ── Top bar: menu · brand · balance chip · VIP · gift · bell · user ── */}
        <div className="max-w-md lg:max-w-[1400px] mx-auto px-3 lg:px-6 pt-3 lg:pt-4 pb-2 flex items-center gap-2 lg:gap-3 min-w-0">
          <button
            aria-label="Menu"
            className="h-9 w-9 lg:h-11 lg:w-11 shrink-0 rounded-lg border border-white/10 bg-black/60 flex items-center justify-center"
          >
            <Menu className="h-4 w-4 lg:h-5 lg:w-5 text-white/85" />
          </button>

          <button onClick={() => nav("/home")} className="flex items-center gap-1.5 shrink min-w-0 max-w-[180px] lg:max-w-none">
            <img src={crownLogo.url} alt="GoLucky" className="h-8 w-8 lg:h-10 lg:w-10 shrink-0 object-contain drop-shadow-[0_0_10px_rgba(245,158,11,0.55)]" />
            <div className="flex flex-col leading-none min-w-0">
              <div className="text-[18px] lg:text-[22px] font-black tracking-tight leading-none truncate">
                <span className="text-amber-300">Go</span>
                <span className="text-emerald-400">Lucky</span>
              </div>
              <div className="text-[6.5px] lg:text-[7.5px] font-black tracking-[0.28em] text-amber-300/90 mt-0.5 truncate">
                PLAY · INVEST · EARN
              </div>
            </div>
          </button>

          {/* Compact balance chip */}
          <button
            onClick={() => nav("/wallet")}
            className="hidden sm:flex shrink-0 items-center gap-2 rounded-xl border border-amber-400/40 bg-black/70 px-2.5 py-1.5 shadow-[0_0_14px_-4px_rgba(245,158,11,0.5)]"
          >

            <div className="text-left leading-tight">
              <div className="text-[9px] font-bold text-white/60">Total Balance</div>
              <div className="text-[12px] font-black text-white tabular-nums">
                ৳ {isLoading ? "…" : hasError ? "—" : fmtBDT(totalBDT)}
              </div>
              <div className="text-[8.5px] text-emerald-300 tabular-nums">≈ ${usdEquiv} (USDT)</div>
            </div>
            <svg viewBox="0 0 40 20" className="h-5 w-10 shrink-0">
              <polyline fill="none" stroke="#10b981" strokeWidth="1.4" points="0,14 6,10 12,12 18,6 24,8 30,4 36,7 40,3" />
            </svg>
            <span className="h-6 w-6 rounded-md bg-gradient-to-b from-amber-300 to-amber-500 text-black flex items-center justify-center">
              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          </button>

          <div className="flex-1" />

          <button
            onClick={() => nav("/vip")}
            className="hidden md:flex items-center gap-1.5 rounded-xl border-2 border-amber-400/70 bg-gradient-to-b from-[#1a1204] to-black pl-2 pr-3 py-1.5 shadow-[0_0_18px_rgba(245,158,11,0.4)]"
          >
            <Crown className="h-4 w-4 text-amber-300 fill-amber-300" />
            <span className="text-[13px] font-black text-amber-200">VIP 6</span>
          </button>

          <button
            onClick={() => nav("/promotion")}
            className="relative h-9 w-9 lg:h-10 lg:w-10 rounded-lg border border-white/10 bg-black/60 flex items-center justify-center"
            aria-label="Rewards"
          >
            <Gift className="h-4 w-4 text-fuchsia-300" />
          </button>

          <button
            onClick={() => nav("/notifications")}
            className="relative h-9 w-9 lg:h-10 lg:w-10 rounded-lg border border-white/10 bg-black/60 flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-white/85" />
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-[9px] font-black text-white flex items-center justify-center">3</span>
          </button>

          <button
            onClick={() => nav("/account")}
            className="hidden lg:flex items-center gap-2 rounded-xl border border-white/10 bg-black/60 pl-2 pr-3 py-1.5"
          >
            <span className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-900 border border-amber-400/60 flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-white/90" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[12px] font-black text-white">LuckyUser</span>
              <span className="text-[9px] text-amber-300">Premium Member</span>
            </span>
            <Crown className="h-4 w-4 text-amber-300 ml-1" />
          </button>
        </div>

        <motion.div
          initial="hidden" animate="show" variants={stagger}
          className="max-w-md lg:max-w-[1400px] mx-auto px-3 lg:px-6 pb-28 space-y-4 lg:space-y-5"
        >
          {hasError && (
            <motion.div variants={fadeUp} className="rounded-xl border border-rose-500/50 bg-rose-950/40 px-3 py-2 flex items-center justify-between gap-3">
              <div className="text-[12px] text-rose-200">
                Couldn't load wallet balances. {w.error}
              </div>
              <button
                onClick={() => w.refresh()}
                className="text-[11px] font-black px-3 py-1 rounded-md bg-rose-500/20 border border-rose-400/60 text-rose-100 hover:bg-rose-500/30"
              >
                Retry
              </button>
            </motion.div>
          )}

          {/* Desktop top grid: HERO (col-span-2) + Quick Actions + Wallet Types stacked */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-5 space-y-4 lg:space-y-0">
            {/* ── HERO CARD ── */}
            <motion.div variants={fadeUp} className="relative lg:col-span-2">
              <div className="relative rounded-3xl border-2 border-amber-400/50 bg-gradient-to-br from-[#0b0d16] via-black to-[#100a02] p-4 lg:p-6 shadow-[0_0_50px_-12px_rgba(245,158,11,0.55),inset_0_0_40px_rgba(245,158,11,0.06)] overflow-hidden">
                {/* Ambient sparkline backdrop */}
                <svg viewBox="0 0 200 80" preserveAspectRatio="none" className="absolute inset-x-0 bottom-8 h-16 w-full opacity-40 pointer-events-none">
                  <polyline fill="none" stroke="#10b981" strokeWidth="1.2"
                    points="0,60 20,55 40,58 60,45 80,50 100,32 120,38 140,22 160,28 180,14 200,20" />
                </svg>

                <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 lg:gap-6">
                  {/* Left: title + tagline + badges + balance + CTA + footer */}
                  <div className="min-w-0">
                    <h1 className="text-[26px] lg:text-[38px] leading-none font-black tracking-wide bg-gradient-to-b from-yellow-100 via-amber-200 to-amber-500 bg-clip-text text-transparent">
                      WALLET CENTRE
                    </h1>
                    <p className="mt-1.5 text-[11px] lg:text-[13px] text-white/70">
                      Manage your funds, track analytics and maximize your earnings
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] lg:text-[11px]">
                      <span className="flex items-center gap-1 text-amber-300 font-bold">
                        <ShieldCheck className="h-3.5 w-3.5" /> 100% Secure
                      </span>
                      <span className="flex items-center gap-1 text-amber-300 font-bold">
                        <Zap className="h-3.5 w-3.5" /> Instant Settlement
                      </span>
                      <span className="flex items-center gap-1 text-amber-300 font-bold">
                        <Lock className="h-3.5 w-3.5" /> 24/7 Protected
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-[10.5px] font-bold text-white/70">
                      TOTAL WALLET BALANCE <Eye className="h-3.5 w-3.5 text-white/60" />
                    </div>
                    <div className="mt-1 text-[36px] lg:text-[56px] leading-none font-black bg-gradient-to-b from-white via-yellow-100 to-amber-400 bg-clip-text text-transparent tabular-nums">
                      {isLoading ? <Skeleton className="h-10 lg:h-14 w-64" /> : hasError ? <span className="text-white/40">৳ —</span> : <>৳ {fmtBDT(totalBDT)}</>}
                    </div>
                    <div className="mt-1 flex items-center gap-3 flex-wrap">
                      <span className="text-[12px] lg:text-[14px] text-amber-100/85 tabular-nums">
                        ≈ ${usdEquiv} (USDT)
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-black text-emerald-300">
                        +12.45% ↑
                      </span>
                      <span className="text-[10px] text-white/50">from last 7 days</span>
                    </div>

                    {/* Deposit / Withdraw */}
                    <div className="mt-4 grid grid-cols-2 gap-3 max-w-sm">
                      <button onClick={() => nav("/deposit")} className="rounded-xl py-2.5 font-black text-black text-[13px] bg-gradient-to-b from-emerald-300 to-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.55)]">
                        Deposit
                      </button>
                      <button onClick={() => nav("/withdraw")} className="rounded-xl py-2.5 font-black text-white text-[13px] bg-gradient-to-b from-fuchsia-500 to-violet-700 shadow-[0_0_18px_rgba(139,92,246,0.55)]">
                        Withdraw
                      </button>
                    </div>

                    {/* Footer row */}
                    <div className="mt-4 rounded-xl border border-white/10 bg-black/50 grid grid-cols-3 divide-x divide-white/10">
                      <div className="p-2.5 flex items-start gap-2">
                        <Gem className="h-4 w-4 text-emerald-300 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-[9.5px] font-black text-white/60">USD/BDT Rate</div>
                          <div className="text-[11px] font-black text-white tabular-nums">1 = ৳{rate.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="p-2.5 flex items-start gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-300 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-[9.5px] font-black text-emerald-300">Wallet Security</div>
                          <div className="text-[10px] text-white/75">Instant · Secure · 24/7</div>
                        </div>
                      </div>
                      <div className="p-2.5 flex items-start gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-300 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-[9.5px] font-black text-emerald-300">KYC Verified</div>
                          <div className="text-[10px] text-white/75">Verified</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: treasure vault illustration */}
                  <div className="relative flex items-center justify-center lg:justify-end -my-2">
                    <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-3xl" aria-hidden />
                    <img
                      src={vaultHero.url}
                      alt="GoLucky vault"
                      loading="lazy"
                      className="relative w-56 sm:w-72 lg:w-[320px] xl:w-[360px] h-auto object-contain drop-shadow-[0_0_30px_rgba(245,158,11,0.55)]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right column on desktop: Quick Actions + Wallet Types stacked */}
            <div className="space-y-4 lg:space-y-5">
              {/* QUICK ACTIONS */}
              <motion.div variants={fadeUp} className="rounded-2xl border border-white/10 bg-black/60 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[13px] font-black tracking-widest text-white/90">QUICK ACTIONS</h2>
                  <span className="text-[10px] text-amber-300">Customise ⚙</span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  <QuickAction icon={ArrowDownToLine} label="Deposit"   color="emerald" onClick={() => nav("/deposit")} />
                  <QuickAction icon={ArrowUpFromLine} label="Withdraw"  color="violet"  onClick={() => nav("/withdraw")} />
                  <QuickAction icon={ArrowLeftRight} label="Transfer"  color="amber"   onClick={() => nav("/wallet/transfer")} />
                  <QuickAction icon={HistoryIcon}    label="History"   color="sky"     onClick={() => nav("/wallet/history")} />
                  <QuickAction icon={Gift}           label="Rewards"   color="rose"    onClick={() => nav("/promotion")} />
                  <QuickAction icon={BarChart3}      label="Analytics" color="green"   onClick={() => nav("/wallet/analytics")} />
                </div>
              </motion.div>

              {/* WALLET TYPES */}
              <motion.div variants={fadeUp} className="rounded-2xl border border-white/10 bg-black/60 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[13px] font-black tracking-widest text-white/90">WALLET TYPES</h2>
                  <button onClick={() => nav("/wallet/analytics")} className="text-[11px] font-bold text-amber-300">View All ›</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <WalletTypeCard title="Main Wallet"      balance={mainBalance}        subtitle="Primary Balance"    icon={Crown}      color="emerald" onClick={() => nav("/wallet")} />
                  <WalletTypeCard title="User Wallet"      balance={userWalletBalance}  subtitle="Personal Funds"     icon={UserIcon}   color="sky"     onClick={() => nav("/wallet/history?filter=user")} />
                  <WalletTypeCard title="3rd Party Wallet" balance={thirdPartyBalance}  subtitle="Provider Balance"   icon={WalletIcon} color="violet"  onClick={() => nav("/wallet/third-party")} />
                  <WalletTypeCard title="Agent Wallet"     balance={agentWalletBalance} subtitle="Commission Balance" icon={ShieldCheck} color="amber"  onClick={() => nav("/wallet/transfer")} />
                </div>
              </motion.div>
            </div>
          </div>

          {/* ── WALLET ANALYTICS — 6 cards ── */}
          <motion.div variants={fadeUp}>
            <h2 className="text-[13px] font-black tracking-widest text-white/90 mb-2">WALLET ANALYTICS</h2>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 lg:gap-3">
              <StatChart label="Total Deposit"   value="৳ 25,680.50" delta="+18.45% ↑" subtitle="৳ 21,700.30" color="emerald" accent={Gem} />
              <StatChart label="Total Withdraw"  value="৳ 18,750.30" delta="-10.25% ↓" subtitle="৳ 20,900.40" color="rose"    accent={Coins} />
              <StatChart label="Total Income"    value="৳ 32,680.80" delta="+25.30% ↑" subtitle="৳ 26,070.20" color="amber"   accent={Sparkles} />
              <StatChart label="Total Cashback"  value="৳ 6,450.75"  delta="+12.75% ↑" subtitle="৳ 5,720.60"  color="sky"     accent={Dices} />
              <StatChart label="Referral Income" value="৳ 4,320.40"  delta="+20.60% ↑" subtitle="৳ 3,580.25"  color="violet"  accent={Gift} bars />
              <StatChart label="Net Profit"      value="৳ 13,930.50" delta="+30.15% ↑" subtitle="৳ 10,710.80" color="green"   accent={TrendingUp} />
            </div>
          </motion.div>

          {/* ── GoLucky Ultra Wallet ── */}
          <motion.div variants={fadeUp}>
            <div className="relative rounded-2xl border-2 border-amber-400/70 bg-gradient-to-b from-[#1a1204] to-black p-4 lg:p-6 shadow-[0_0_28px_-6px_rgba(245,158,11,0.55),inset_0_0_20px_rgba(245,158,11,0.08)]"
                 style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(245,158,11,0.04) 0 6px, transparent 6px 12px)" }}>
              <div className="flex items-start gap-3 lg:gap-6">
                <div className="flex-1">
                  <h3 className="text-[17px] lg:text-[22px] font-black bg-gradient-to-b from-yellow-100 to-amber-400 bg-clip-text text-transparent">
                    GoLucky Ultra Wallet <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full border border-amber-400/70 text-amber-300 align-middle">PREMIUM</span>
                  </h3>
                  <ul className="mt-3 grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1.5 text-[11px] lg:text-[13px] text-white/85">
                    {[
                      "Instant Settlement",
                      "Military Grade Security",
                      "Zero Hidden Fees",
                      "Multi Wallet Management",
                      "AI Fraud Protection",
                      "24/7 Premium Support",
                    ].map((t) => (
                      <li key={t} className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-amber-300" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => nav("/vip")} className="mt-4 text-[11px] lg:text-[13px] font-black text-amber-300 hover:text-amber-200">
                    Explore Ultra Wallet →
                  </button>
                </div>
                <div className="shrink-0 relative">
                  <div className="absolute inset-0 rounded-full bg-amber-500/25 blur-2xl" aria-hidden />
                  <img
                    src={treasureChest.url}
                    alt="GoLucky treasure chest"
                    loading="lazy"
                    className="relative h-24 w-24 lg:h-36 lg:w-36 object-contain drop-shadow-[0_0_18px_rgba(245,158,11,0.6)]"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Recent Transactions + Income Distribution + Balance Breakdown ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div variants={fadeUp} className="rounded-2xl border border-white/10 bg-black/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-black tracking-widest text-white/90">RECENT TRANSACTIONS</h3>
                <button onClick={() => nav("/wallet/history")} className="text-[11px] font-bold text-amber-300">View All ›</button>
              </div>
              <ul className="space-y-2.5 text-[12px]">
                {[
                  { t: "Deposit", s: "Via bKash", amt: "৳ 5,000.00", time: "Today, 10:24 AM", c: "emerald" },
                  { t: "Withdraw", s: "Via Nagad", amt: "৳ 2,500.00", time: "Today, 09:15 AM", c: "rose" },
                  { t: "Referral Bonus", s: "From @LuckyUser", amt: "৳ 1,250.00", time: "Yesterday, 08:30 PM", c: "amber" },
                  { t: "Cashback Received", s: "From Casino", amt: "৳ 320.50", time: "Yesterday, 07:45 PM", c: "sky" },
                  { t: "Transfer to User", s: "To @Rakib", amt: "৳ 1,000.00", time: "Yesterday, 06:20 PM", c: "violet" },
                ].map((r, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full border border-${r.c}-400/60 bg-black/60 flex items-center justify-center`}>
                      <ArrowDownToLine className={`h-3.5 w-3.5 text-${r.c}-300`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white truncate">{r.t}</div>
                      <div className="text-[10px] text-white/50">{r.s}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black tabular-nums text-white">{r.amt}</div>
                      <div className="text-[10px] text-white/50">{r.time}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={fadeUp} className="rounded-2xl border border-white/10 bg-black/60 p-4">
              <h3 className="text-[13px] font-black tracking-widest text-white/90 mb-3">INCOME DISTRIBUTION</h3>
              <div className="flex items-center gap-4">
                <div className="relative h-32 w-32 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#1f2937" strokeWidth="4" />
                    {[
                      { c: "#10b981", v: 45, o: 0 },
                      { c: "#8b5cf6", v: 20, o: 45 },
                      { c: "#f59e0b", v: 15, o: 65 },
                      { c: "#ef4444", v: 10, o: 80 },
                      { c: "#64748b", v: 10, o: 90 },
                    ].map((s, i) => (
                      <circle key={i} cx="18" cy="18" r="15.9" fill="transparent" stroke={s.c} strokeWidth="4"
                              strokeDasharray={`${s.v} ${100 - s.v}`} strokeDashoffset={-s.o} />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-[10px] text-white/60">Total</div>
                    <div className="text-[13px] font-black text-white tabular-nums">৳ 32,680</div>
                  </div>
                </div>
                <ul className="flex-1 space-y-1 text-[11px]">
                  {[
                    { l: "Gaming Win", v: "45%", c: "bg-emerald-400" },
                    { l: "Referral Income", v: "20%", c: "bg-violet-400" },
                    { l: "Cashback", v: "15%", c: "bg-amber-400" },
                    { l: "Bonus & Rewards", v: "10%", c: "bg-rose-400" },
                    { l: "Others", v: "10%", c: "bg-slate-400" },
                  ].map((r) => (
                    <li key={r.l} className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${r.c}`} />
                      <span className="flex-1 text-white/80">{r.l}</span>
                      <span className="font-black text-white">{r.v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="rounded-2xl border border-white/10 bg-black/60 p-4">
              <h3 className="text-[13px] font-black tracking-widest text-white/90 mb-3">BALANCE BREAKDOWN</h3>
              <ul className="space-y-2 text-[12px]">
                {[
                  { l: "Reward Coins", v: "25,680", c: "text-amber-300" },
                  { l: "Bonus Coins", v: "18,750", c: "text-emerald-300" },
                  { l: "Lucky Coins", v: "8,320", c: "text-fuchsia-300" },
                  { l: "Diamond Points", v: "6,450", c: "text-sky-300" },
                  { l: "Cashback Balance", v: "12,340", c: "text-rose-300" },
                ].map((r) => (
                  <li key={r.l} className="flex items-center gap-2 py-1 border-b border-white/5">
                    <Coins className={`h-3.5 w-3.5 ${r.c}`} />
                    <span className="flex-1 text-white/85">{r.l}</span>
                    <span className="font-black text-white tabular-nums">{r.v}</span>
                  </li>
                ))}
                <li className="mt-2 rounded-lg border border-amber-400/50 bg-gradient-to-r from-amber-500/10 to-transparent p-2.5 flex items-center justify-between">
                  <span className="text-[11px] text-amber-200">Total Value</span>
                  <span className="text-[14px] font-black text-white tabular-nums">৳ {fmtBDT(totalBDT)}</span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* ── EARN MORE WITH GOLUCKY ── */}
          <motion.div variants={fadeUp} className="rounded-2xl border border-white/10 bg-black/60 p-4">
            <h3 className="text-[13px] font-black tracking-widest text-white/90 mb-3">EARN MORE WITH GOLUCKY</h3>
            <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { l: "Daily Check-in", c: "emerald", i: Gift },
                { l: "Spin & Win", c: "violet", i: Sparkles },
                { l: "Weekly Reward", c: "amber", i: Gift },
                { l: "Monthly Reward", c: "rose", i: Gift },
                { l: "Cashback", c: "sky", i: Coins },
                { l: "Lucky Spin", c: "amber", i: Sparkles },
                { l: "Referral Rewards", c: "violet", i: UserIcon },
                { l: "VIP Rewards", c: "amber", i: Crown },
                { l: "Achievement", c: "emerald", i: TrendingUp },
                { l: "Mission Center", c: "sky", i: ShieldCheck },
                { l: "Event Rewards", c: "rose", i: Gift },
                { l: "Coupon Center", c: "amber", i: Gift },
                { l: "Treasure Box", c: "violet", i: Gem },
                { l: "Mystery Box", c: "rose", i: Gem },
                { l: "Coin Exchange", c: "amber", i: Coins },
                { l: "Diamond Exchange", c: "sky", i: Gem },
                { l: "Reward Market", c: "emerald", i: Gift },
                { l: "Flash Rewards", c: "violet", i: Sparkles },
                { l: "Birthday Gift", c: "rose", i: Gift },
                { l: "Festival Rewards", c: "amber", i: Gift },
                { l: "Anniversary Bonus", c: "emerald", i: Gift },
                { l: "Surprise Gift", c: "violet", i: Gift },
                { l: "Cashback Booster", c: "sky", i: Coins },
                { l: "Lucky Voucher", c: "amber", i: Gift },
                { l: "VIP Upgrade", c: "amber", i: Crown },
                { l: "Invite & Earn", c: "emerald", i: UserIcon },
                { l: "Wheel of Fortune", c: "violet", i: Sparkles },
              ].map((r) => (
                <button key={r.l} onClick={() => nav("/promotion")} className="flex flex-col items-center gap-1.5 group">
                  <div className={`h-11 w-11 rounded-xl border-2 border-${r.c}-400/60 bg-black/70 flex items-center justify-center shadow-[0_0_14px_-2px_currentColor] text-${r.c}-300 group-hover:scale-105 transition`}>
                    <r.i className="h-5 w-5" strokeWidth={2.4} />
                  </div>
                  <span className="text-[9.5px] font-bold text-white/80 text-center leading-tight">{r.l}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── VIP Progress + Exclusive + Gift Code ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div variants={fadeUp} className="rounded-2xl border border-amber-400/40 bg-gradient-to-b from-[#1a1204] to-black p-4 shadow-[0_0_20px_-6px_rgba(245,158,11,0.4)]">
              <div className="text-[11px] font-black tracking-widest text-amber-300">VIP LEVEL PROGRESS</div>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-[10px] text-white/60">Current Level</div>
                  <div className="text-[22px] font-black bg-gradient-to-b from-yellow-100 to-amber-400 bg-clip-text text-transparent">VIP 6</div>
                </div>
                <Crown className="h-10 w-10 text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-white/70">
                <span>12,320 / 25,000</span>
                <button onClick={() => nav("/vip")} className="text-amber-300 font-black">View VIP Benefits ›</button>
              </div>
              <div className="mt-1 h-2 rounded-full bg-black/60 overflow-hidden border border-amber-400/30">
                <div className="h-full w-[49%] bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
              </div>
              <div className="mt-2 text-[10px] text-white/60">Reach VIP 7 · Get 15% Higher Cashback</div>
            </motion.div>

            <motion.div variants={fadeUp} className="rounded-2xl border border-amber-400/50 bg-gradient-to-br from-[#1a1204] via-black to-[#0d0603] p-4 shadow-[0_0_20px_-6px_rgba(245,158,11,0.5)]">
              <div className="text-[11px] font-black tracking-widest text-amber-300">EXCLUSIVE FOR VIP MEMBERS</div>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-[15px] font-black text-white leading-tight">Unlock Unlimited Rewards</div>
                  <button onClick={() => nav("/vip")} className="mt-3 rounded-lg px-3 py-1.5 text-[11px] font-black text-black bg-gradient-to-r from-amber-300 to-amber-500 shadow-[0_0_14px_rgba(245,158,11,0.55)]">
                    Explore Exclusives
                  </button>
                </div>
                <Gem className="h-14 w-14 text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.7)]" />
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="rounded-2xl border border-fuchsia-400/40 bg-gradient-to-br from-[#12061a] to-black p-4 shadow-[0_0_20px_-6px_rgba(217,70,239,0.4)]">
              <div className="text-[11px] font-black tracking-widest text-fuchsia-300">GIFT CODE REDEEM</div>
              <div className="mt-2 flex items-center gap-3">
                <Gift className="h-10 w-10 text-fuchsia-300 drop-shadow-[0_0_10px_rgba(217,70,239,0.6)]" />
                <div className="flex-1 text-[10px] text-white/70">Redeem your gift code and get amazing rewards instantly!</div>
              </div>
              <div className="mt-3 flex gap-2">
                <input placeholder="Enter Gift Code" className="flex-1 rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-[12px] text-white placeholder:text-white/40 focus:outline-none focus:border-fuchsia-400/60" />
                <button className="rounded-lg px-3 py-2 text-[11px] font-black text-white bg-gradient-to-r from-fuchsia-500 to-violet-600 shadow-[0_0_14px_rgba(217,70,239,0.55)]">REDEEM</button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </WalletCanvas>
    </>
  );
}
