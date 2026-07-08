import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, EyeOff, Copy, Bell, Crown, TrendingUp, ChevronRight, MessageCircle, Send,
  Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
  UserPlus, Gift, ShieldCheck, IdCard, User as UserIcon,
  TrendingDown, Activity, PiggyBank, Coins, Sparkles, CalendarRange,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWalletDB } from "@/hooks/useWalletDB";
import goluckyTextLogo from "@/assets/golucky-text-logo-1.png";
import walletHero from "@/assets/wallet/wallet-hero-v2.png";
import atmIcon from "@/assets/wallet/atm-purple.png";
import secureShield from "@/assets/wallet/secure-shield.png";
import Seo from "@/components/seo/Seo";

const bdt = (n: number) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const num = (n: number) => new Intl.NumberFormat("en-US").format(n);

type Range = "today" | "7d" | "30d" | "month";

const tx = [
  { type: "Agent Deposit", time: "Today, 10:30 AM",     amount: 5000,  sign: "+", color: "#00D27A", icon: WalletIcon },
  { type: "Withdraw",      time: "Today, 09:15 AM",     amount: 2000,  sign: "-", color: "#EF4444", icon: ArrowUpFromLine },
  { type: "Bonus",         time: "Yesterday, 08:20 PM", amount: 500,   sign: "+", color: "#F5C542", icon: Gift },
  { type: "Cashback",      time: "Yesterday, 05:30 PM", amount: 250,   sign: "+", color: "#22D3EE", icon: TrendingUp },
  { type: "Agent Deposit", time: "Yesterday, 03:10 PM", amount: 3000,  sign: "+", color: "#00D27A", icon: WalletIcon },
];

const chartByRange: Record<Range, number[]> = {
  today: [0, 1500, 2200, 4000, 5500, 6200, 7800, 8500, 9200, 10500, 11800, 12500],
  "7d":  [2000, 4500, 6800, 8200, 9500, 10800, 12500],
  "30d": [3000, 5200, 6800, 7400, 8900, 9600, 10400, 11000, 11800, 12500],
  month: [5000, 8000, 10000, 12500],
};

export default function WalletPremium() {
  const nav = useNavigate();
  const { balance } = useWalletDB();
  const [hide, setHide] = useState(false);
  const [range, setRange] = useState<Range>("today");
  const [walletId, setWalletId] = useState("GLK789654");
  const [vipLevel] = useState(8);
  const [agentStatus, setAgentStatus] = useState<"approved" | "pending" | "rejected" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const totalBalance = balance ?? 24750.5;
  const mainBalance = 18500;
  const bonusBalance = 4250;
  const luckyCoin = 12450;
  const frozenBalance = 0;
  const todayProfit = 1250;
  const todayProfitPct = 12.5;

  useEffect(() => {
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u?.user) return;
        setUserId(u.user.id);
        const { data: p } = await supabase
          .from("profiles")
          .select("agent_status,user_id_code,id")
          .eq("id", u.user.id)
          .maybeSingle();
        if (p) {
          setAgentStatus(((p as any).agent_status ?? null) as any);
          const code = (p as any).user_id_code as string | null;
          if (code) setWalletId(`GLK${code.replace(/\D/g, "").slice(-6) || "789654"}`);
        }
      } catch {}
    })();
  }, []);

  const copy = async (val: string) => { try { await navigator.clipboard.writeText(val); toast.success("Wallet ID copied"); } catch {} };

  const chart = chartByRange[range];
  const chartMax = Math.max(...chart, 1);
  const points = useMemo(() => {
    const w = 100, h = 60;
    return chart.map((v, i) => `${(i / (chart.length - 1)) * w},${h - (v / chartMax) * h}`).join(" ");
  }, [chart, chartMax]);
  const lastVal = chart[chart.length - 1];

  const isAgent = agentStatus === "approved";

  return (
    <div className="min-h-screen w-full pb-28" style={{ background: "#000" }}>
      <Seo
        title="My Wallet — Balance, Deposit & Withdraw | GoLucky"
        description="Manage your GoLucky BDT wallet: view balance, deposit, withdraw, and review your recent transactions in one secure place."
        path="/wallet"
      />
      <h1 className="sr-only">Your GoLucky Wallet</h1>
      <div className="mx-auto w-full max-w-[430px] lg:max-w-[1280px] px-3 lg:px-6 pt-3 space-y-3 lg:space-y-5">


        {/* ===== HEADER ===== */}
        <div className="flex items-center gap-2">
          <img src={goluckyTextLogo} alt="GoLucky" className="h-12 w-auto" />
          <button
            onClick={() => copy(walletId)}
            aria-label={`Copy wallet ID ${walletId}`}
            className="ml-auto flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-[#0B1220] px-2.5"
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/15 text-emerald-300">
              <IdCard className="h-4 w-4" />
            </span>
            <span className="text-[11px] font-bold text-white/90">Wallet ID:</span>
            <span className="text-[12px] font-extrabold text-emerald-300 tabular-nums">{walletId}</span>
            <Copy className="h-3.5 w-3.5 text-white/40" />
          </button>
          <button onClick={() => nav("/notifications")} aria-label="Open notifications" className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-[#0B1220]">
            <Bell className="h-5 w-5 text-white/90" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
          </button>
          <button
            onClick={() => nav("/vip")}
            aria-label={`VIP level ${vipLevel} — open VIP page`}
            className="flex h-11 items-center gap-1.5 rounded-2xl border border-amber-400/40 bg-gradient-to-b from-[#1A1405] to-[#0B0902] px-2"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600">
              <Crown className="h-3.5 w-3.5 text-black" />
            </span>
            <span className="text-left leading-tight">
              <span className="block text-[11px] font-extrabold text-amber-300">VIP {vipLevel}</span>
              <span className="block text-[9px] font-semibold text-amber-200/80">Master</span>
            </span>
          </button>
          <button onClick={() => nav("/account")} aria-label="Open your account" className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-amber-300 to-amber-600 ring-2 ring-amber-400/40">
            <UserIcon className="h-5 w-5 text-black" />
          </button>

        </div>

        {/* ===== DESKTOP-ONLY PREMIUM KPI STRIP + CHARTS ===== */}
        <DesktopFinancialPanel
          totalBalance={totalBalance}
          mainBalance={mainBalance}
          bonusBalance={bonusBalance}
          luckyCoin={luckyCoin}
          userId={userId}
        />

        {/* ===== TOTAL BALANCE HERO ===== */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-400/25 p-4"
             style={{ background: "radial-gradient(120% 80% at 70% 0%, rgba(0,210,122,.22), transparent 60%), linear-gradient(180deg,#02110C 0%, #000 100%)" }}>
          <div className="relative z-10 grid grid-cols-[1fr_140px] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-white/85">Total Balance</span>
                <button onClick={() => setHide((v) => !v)} aria-label={hide ? "Show balance" : "Hide balance"} className="text-white/55">
                  {hide ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-1 text-[34px] font-black leading-none tabular-nums"
                   style={{ background: "linear-gradient(180deg,#FFD86B,#F59E0B)", WebkitBackgroundClip: "text", color: "transparent" }}>
                ৳ {hide ? "•••••••" : bdt(totalBalance)}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-[2px] text-[10px] font-extrabold text-emerald-300">
                  ↑ +{todayProfitPct}%
                </span>
                <span className="text-[11px] text-white/70">Today's Profit:</span>
                <span className="text-[11px] font-extrabold text-emerald-300">৳ {bdt(todayProfit)}</span>
              </div>
            </div>
            <img src={walletHero} alt="" className="pointer-events-none absolute -right-3 top-1/2 z-0 h-[160px] -translate-y-1/2 object-contain drop-shadow-[0_10px_30px_rgba(245,197,66,.45)]" />
          </div>

          {/* Sub balances */}
          <div className="relative z-10 mt-3 grid grid-cols-4 gap-2">
            <SubBalance label="Main Balance"   value={`৳ ${bdt(mainBalance)}`}   tint="#00D27A" icon="💼" />
            <SubBalance label="Bonus Balance"  value={`৳ ${bdt(bonusBalance)}`}  tint="#A855F7" icon="💎" />
            <SubBalance label="Lucky Coin"     value={num(luckyCoin)}            tint="#F5C542" icon="🪙" />
            <SubBalance label="Frozen Balance" value={`৳ ${bdt(frozenBalance)}`} tint="#22D3EE" icon="🧊" />
          </div>
        </div>

        {/* ===== QUICK ACTIONS ===== */}
        <div className="grid grid-cols-5 gap-2">
          <QuickAction onClick={() => nav("/deposit")} label="Deposit"        tint="#00D27A" icon={<ArrowDownToLine className="h-6 w-6" />} />
          <QuickAction onClick={() => nav("/withdraw")} label="Withdraw"       tint="#A855F7" icon={<ArrowUpFromLine className="h-6 w-6" />} />
          <QuickAction onClick={() => nav("/transfer")} label="Transfer"       tint="#22D3EE" icon={<ArrowLeftRight className="h-6 w-6" />} />
          <QuickAction onClick={() => nav(isAgent ? "/agent/deposit-requests" : "/deposit")} label="Deposit Request" tint="#F59E0B" icon={<UserPlus className="h-6 w-6" />} />
          <QuickAction onClick={() => nav("/activity")} label="Bonus Center"   tint="#EC4899" icon={<Gift className="h-6 w-6" />} />
        </div>

        {/* ===== AGENT DEPOSIT + WITHDRAW (two cards) ===== */}
        <div className="grid grid-cols-2 gap-2">
          {/* Agent Deposit (or Pending state) */}
          <div className="rounded-3xl border border-emerald-400/25 p-3"
               style={{ background: "linear-gradient(180deg,#02160F 0%, #000 100%)" }}>
            <div className="text-[15px] font-extrabold text-emerald-300">Agent Deposit</div>
            {agentStatus === "pending" ? (
              <>
                <p className="mt-1 text-[10px] text-amber-300/90">Your agent application is under review.</p>
                <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-500/5 p-2 text-[10px] text-amber-200">
                  We'll notify you once your application is approved.
                </div>
              </>
            ) : (
              <>
                <p className="mt-0.5 text-[10px] text-white/55">Your Assigned Agent</p>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-2">
                  <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-amber-300 to-amber-600">
                    <UserIcon className="h-5 w-5 text-black" />
                  </div>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-[12px] font-extrabold text-white">Sodu Agent</div>
                    <div className="text-[9px] text-white/55">ID: SA87654</div>
                    <div className="mt-0.5 flex items-center gap-1 text-[9px] font-bold text-emerald-400">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <a href="https://wa.me/" target="_blank" rel="noreferrer" className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white">
                      <MessageCircle className="h-3.5 w-3.5" />
                    </a>
                    <a href="https://t.me/" target="_blank" rel="noreferrer" className="grid h-7 w-7 place-items-center rounded-full bg-sky-500 text-white">
                      <Send className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
                <button onClick={() => nav("/deposit")} className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 py-2 text-[12px] font-extrabold text-black">
                  Request Deposit
                </button>
              </>
            )}
          </div>

          {/* Withdraw */}
          <div className="relative overflow-hidden rounded-3xl border border-purple-400/25 p-3"
               style={{ background: "linear-gradient(180deg,#160B23 0%, #000 100%)" }}>
            <div className="text-[15px] font-extrabold text-purple-300">Withdraw</div>
            <p className="mt-0.5 text-[10px] text-white/55">Available Balance</p>
            <div className="mt-1 text-[18px] font-black tabular-nums text-amber-300">৳ {bdt(mainBalance)}</div>
            <img src={atmIcon} alt="" className="pointer-events-none absolute right-1 top-1 h-[72px] w-[72px] object-contain opacity-90" loading="lazy" />
            <button onClick={() => nav("/withdraw")} className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-purple-500 to-violet-700 py-2 text-[12px] font-extrabold text-white shadow-[0_8px_24px_-8px_rgba(168,85,247,.7)]">
              Withdraw Now <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ===== WALLET OVERVIEW + TRANSACTIONS ===== */}
        <div className="grid grid-cols-2 gap-2">
          {/* Overview */}
          <div className="rounded-3xl border border-white/10 bg-[#0B1220] p-3">
            <div className="text-[14px] font-extrabold text-white">Wallet Overview</div>
            <div className="mt-2 flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
              {([
                { k: "today", l: "Today" }, { k: "7d", l: "7 Days" }, { k: "30d", l: "30 Days" }, { k: "month", l: "This Month" },
              ] as { k: Range; l: string }[]).map((r) => {
                const active = r.k === range;
                return (
                  <button key={r.k} onClick={() => setRange(r.k)}
                          className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold ${active ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" : "text-white/55 border border-white/10"}`}>
                    {r.l}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <MiniKpi label="Deposit"  value={`৳ ${bdt(12500)}`} tint="#00D27A" />
              <MiniKpi label="Withdraw" value={`৳ ${bdt(3200)}`}  tint="#EF4444" />
              <MiniKpi label="Profit"   value={`৳ ${bdt(1250)}`}  tint="#F5C542" />
            </div>
            <div className="relative mt-2 h-[110px] rounded-xl bg-black/40 p-2">
              <svg viewBox="0 0 100 60" className="h-full w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D27A" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#00D27A" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline points={`0,60 ${points} 100,60`} fill="url(#g1)" />
                <polyline points={points} fill="none" stroke="#00D27A" strokeWidth="1.2" />
                {chart.map((v, i) => (
                  <circle key={i} cx={(i / (chart.length - 1)) * 100} cy={60 - (v / chartMax) * 60} r="0.9" fill="#00D27A" />
                ))}
              </svg>
              <span className="absolute right-2 top-1 rounded-md bg-emerald-500/20 px-1.5 py-[1px] text-[9px] font-extrabold text-emerald-300">৳ {num(lastVal)}</span>
              <div className="mt-1 flex justify-between text-[8px] text-white/40">
                <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="rounded-3xl border border-white/10 bg-[#0B1220] p-3">
            <div className="flex items-center justify-between">
              <div className="text-[14px] font-extrabold text-white">Recent Transactions</div>
              <button onClick={() => nav("/wallet/history")} className="text-[11px] font-bold text-purple-300">View All</button>
            </div>
            <div className="mt-2 space-y-1.5">
              {tx.map((t, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/30 px-2 py-1.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: `${t.color}22`, color: t.color }}>
                    <t.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-[11px] font-extrabold text-white">{t.type}</div>
                    <div className="text-[9px] text-white/50">{t.time}</div>
                  </div>
                  <div className="text-right leading-tight">
                    <div className="text-[11px] font-extrabold tabular-nums" style={{ color: t.color }}>
                      {t.sign} ৳ {bdt(t.amount)}
                    </div>
                    <div className="text-[9px] font-bold text-emerald-400">Success</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== SECURE BANNER ===== */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-400/25 p-3"
             style={{ background: "linear-gradient(180deg,#02160F 0%, #000 100%)" }}>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <div className="text-[14px] font-extrabold text-white">
                Secure <span className="text-amber-300">•</span> Fast <span className="text-amber-300">•</span> Reliable
              </div>
              <div className="text-[10px] text-white/65">Your money is 100% safe with GoLucky</div>
            </div>
            <img src={secureShield} alt="" className="h-[70px] w-auto object-contain" loading="lazy" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ sub-components ============ */

function SubBalance({ label, value, tint, icon }: { label: string; value: string; tint: string; icon: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-2">
      <div className="flex items-center gap-1">
        <span className="grid h-5 w-5 place-items-center rounded-md text-[11px]" style={{ background: `${tint}22` }}>{icon}</span>
        <span className="text-[9px] font-semibold text-white/65">{label}</span>
      </div>
      <div className="mt-1 truncate text-[11px] font-extrabold tabular-nums" style={{ color: tint }}>{value}</div>
    </div>
  );
}

function QuickAction({ icon, label, tint, onClick }: { icon: React.ReactNode; label: string; tint: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-[#0B1220] p-2">
      <span className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: `${tint}1f`, color: tint, boxShadow: `0 8px 24px -10px ${tint}` }}>
        {icon}
      </span>
      <span className="text-[10px] font-bold text-white/85 text-center leading-tight">{label}</span>
    </button>
  );
}

function MiniKpi({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-1.5">
      <div className="text-[9px] font-semibold text-white/55">{label}</div>
      <div className="mt-0.5 text-[11px] font-extrabold tabular-nums" style={{ color: tint }}>{value}</div>
    </div>
  );
}

/* ============ Desktop premium KPI + charts (lg+ only) ============ */

type DeskRange = "7d" | "30d" | "90d" | "ytd";

const DESK_RANGES: { k: DeskRange; l: string; days: number }[] = [
  { k: "7d",  l: "7D",  days: 7 },
  { k: "30d", l: "30D", days: 30 },
  { k: "90d", l: "90D", days: 90 },
  { k: "ytd", l: "YTD", days: Math.max(1, Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000)) },
];

function seedRand(seed: number) {
  let s = seed | 0;
  return () => { s = (s * 1664525 + 1013904223) | 0; return ((s >>> 0) % 10000) / 10000; };
}

function buildSeries(days: number, base: number, vol: number, seed: number) {
  const rnd = seedRand(seed);
  const arr: number[] = [];
  let v = base;
  for (let i = 0; i < days; i++) {
    v = Math.max(base * 0.3, v + (rnd() - 0.45) * vol);
    arr.push(Math.round(v));
  }
  return arr;
}

function DesktopFinancialPanel(props: {
  totalBalance: number;
  mainBalance: number; bonusBalance: number; luckyCoin: number;
  userId: string | null;
}) {
  const { totalBalance, mainBalance, bonusBalance, luckyCoin, userId } = props;
  const storageKey = userId ? `wallet:deskRange:${userId}` : "wallet:deskRange:guest";
  const [range, setRange] = useState<DeskRange>("7d");

  // Rehydrate when the active user changes (e.g. after login/account switch)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey) as DeskRange | null;
      setRange(saved && ["7d", "30d", "90d", "ytd"].includes(saved) ? saved : "7d");
    } catch {
      setRange("7d");
    }
  }, [storageKey]);

  // Persist on every change scoped to current user
  useEffect(() => {
    try { window.localStorage.setItem(storageKey, range); } catch {}
  }, [storageKey, range]);

  const meta = DESK_RANGES.find((r) => r.k === range)!;
  const N = meta.days;

  // Aggregated series for active range
  const { deposits, withdraws, balanceSeries, labels, prevDeposits, prevWithdraws, prevBalanceTotal } = useMemo(() => {
    const deposits  = buildSeries(N, 6000, 4500, 11 + N);
    const withdraws = buildSeries(N, 2200, 1800, 23 + N);
    const balanceSeries = buildSeries(N, totalBalance * 0.7, totalBalance * 0.15, 41 + N);
    // Previous period comparators (for delta %)
    const prevDeposits  = buildSeries(N, 5400, 4200, 71 + N);
    const prevWithdraws = buildSeries(N, 2400, 1700, 83 + N);
    const prevBalanceTotal = balanceSeries.reduce((a, b) => a + b, 0) * 0.92;
    // Bucket labels — keep readable
    let labels: string[] = [];
    if (N <= 7) labels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].slice(0, N);
    else if (N <= 30) labels = Array.from({ length: N }, (_, i) => `${i + 1}`);
    else labels = Array.from({ length: N }, (_, i) => (i % Math.ceil(N / 12) === 0 ? `${i + 1}` : ""));
    return { deposits, withdraws, balanceSeries, labels, prevDeposits, prevWithdraws, prevBalanceTotal };
  }, [N, totalBalance]);

  const sumDep  = deposits.reduce((a, b) => a + b, 0);
  const sumWd   = withdraws.reduce((a, b) => a + b, 0);
  const profit  = sumDep - sumWd;
  const prevSumDep = prevDeposits.reduce((a, b) => a + b, 0);
  const prevSumWd  = prevWithdraws.reduce((a, b) => a + b, 0);
  const prevProfit = prevSumDep - prevSumWd;

  const pct = (cur: number, prev: number) => prev === 0 ? 0 : ((cur - prev) / prev) * 100;
  const dBal  = pct(balanceSeries.reduce((a, b) => a + b, 0), prevBalanceTotal);
  const dProf = pct(profit, prevProfit || 1);
  const dDep  = pct(sumDep, prevSumDep);
  const dWd   = pct(sumWd, prevSumWd);

  // Cashflow chart points
  const chartMax = Math.max(...balanceSeries, 1);
  const points = balanceSeries
    .map((v, i) => `${(i / Math.max(1, balanceSeries.length - 1)) * 100},${60 - (v / chartMax) * 60}`)
    .join(" ");

  const maxBar = Math.max(...deposits, ...withdraws, 1);
  const barCount = deposits.length;
  const showLabelEvery = barCount > 30 ? Math.ceil(barCount / 14) : 1;

  // Allocation donut
  const alloc = [
    { label: "Main",   value: mainBalance,  color: "#00D27A" },
    { label: "Bonus",  value: bonusBalance, color: "#A855F7" },
    { label: "Lucky",  value: luckyCoin,    color: "#F5C542" },
  ];
  const allocTotal = alloc.reduce((s, a) => s + a.value, 0) || 1;
  let acc = 0;
  const C = 2 * Math.PI * 38;

  return (
    <section className="hidden lg:block">
      {/* Range selector */}
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-[#0B1220] px-3 py-2">
        <div className="flex items-center gap-2 text-white/85">
          <CalendarRange className="h-4 w-4 text-emerald-300" />
          <span className="text-[13px] font-extrabold">Financial Overview</span>
          <span className="text-[11px] text-white/40">· {meta.l === "YTD" ? `Year to date (${N} days)` : `Last ${N} days`}</span>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
          {DESK_RANGES.map((r) => {
            const active = r.k === range;
            return (
              <button
                key={r.k}
                onClick={() => setRange(r.k)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-extrabold transition ${
                  active ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                         : "text-white/60 hover:text-white/85"
                }`}
              >
                {r.l}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Kpi
          label="Total Balance" value={`৳ ${bdtFmt(totalBalance)}`}
          delta={`${dBal >= 0 ? "+" : ""}${dBal.toFixed(1)}%`} deltaUp={dBal >= 0}
          icon={<WalletIcon className="h-5 w-5" />} tint="#00D27A"
          sub={`vs previous ${meta.l}`}
        />
        <Kpi
          label="Net Profit" value={`৳ ${bdtFmt(profit)}`}
          delta={`${dProf >= 0 ? "+" : ""}${dProf.toFixed(1)}%`} deltaUp={dProf >= 0}
          icon={<TrendingUp className="h-5 w-5" />} tint="#F5C542"
          sub={`Net ${meta.l}`}
        />
        <Kpi
          label="Deposits" value={`৳ ${bdtFmt(sumDep)}`}
          delta={`${dDep >= 0 ? "+" : ""}${dDep.toFixed(1)}%`} deltaUp={dDep >= 0}
          icon={<PiggyBank className="h-5 w-5" />} tint="#22D3EE"
          sub={`Last ${meta.l}`}
        />
        <Kpi
          label="Withdrawals" value={`৳ ${bdtFmt(sumWd)}`}
          delta={`${dWd >= 0 ? "+" : ""}${dWd.toFixed(1)}%`} deltaUp={dWd <= 0}
          icon={<TrendingDown className="h-5 w-5" />} tint="#EF4444"
          sub={`Last ${meta.l}`}
        />
      </div>

      {/* Charts row */}
      <div className="mt-4 grid grid-cols-12 gap-4">
        {/* Cashflow line/area */}
        <div className="col-span-7 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0B1220] to-[#070C16] p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-white">
                <Activity className="h-4 w-4 text-emerald-300" />
                <span className="text-[15px] font-extrabold">Cashflow Trend</span>
              </div>
              <div className="text-[11px] text-white/55">Balance evolution · {meta.l}</div>
            </div>
            <div className="flex items-center gap-2">
              <Legend dot="#00D27A" label="Balance" />
              <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-[11px] font-extrabold text-emerald-300">Live</span>
            </div>
          </div>
          <div className="relative mt-3 h-[240px] rounded-xl bg-black/30 p-3">
            <svg viewBox="0 0 100 60" className="h-full w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gDesk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D27A" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#00D27A" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 15, 30, 45, 60].map((y) => (
                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.2" />
              ))}
              <polyline points={`0,60 ${points} 100,60`} fill="url(#gDesk)" />
              <polyline points={points} fill="none" stroke="#00D27A" strokeWidth="0.9" />
              {balanceSeries.map((v, i) => (
                <circle key={i} cx={(i / Math.max(1, balanceSeries.length - 1)) * 100} cy={60 - (v / chartMax) * 60} r="0.5" fill="#00D27A" />
              ))}
            </svg>
          </div>
        </div>

        {/* Allocation donut */}
        <div className="col-span-5 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0B1220] to-[#070C16] p-5">
          <div className="flex items-center gap-2 text-white">
            <Coins className="h-4 w-4 text-amber-300" />
            <span className="text-[15px] font-extrabold">Balance Allocation</span>
          </div>
          <div className="mt-2 flex items-center gap-5">
            <svg viewBox="0 0 100 100" className="h-[180px] w-[180px] -rotate-90">
              <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.06)" strokeWidth="12" fill="none" />
              {alloc.map((a, i) => {
                const len = (a.value / allocTotal) * C;
                const el = (
                  <circle key={i} cx="50" cy="50" r="38" fill="none"
                    stroke={a.color} strokeWidth="12" strokeLinecap="butt"
                    strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} />
                );
                acc += len;
                return el;
              })}
            </svg>
            <div className="flex-1 space-y-2">
              {alloc.map((a) => (
                <div key={a.label} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/30 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
                    <span className="text-[12px] font-bold text-white/85">{a.label}</span>
                  </div>
                  <div className="text-[12px] font-extrabold tabular-nums" style={{ color: a.color }}>
                    {Math.round((a.value / allocTotal) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deposit vs Withdraw bars */}
        <div className="col-span-12 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0B1220] to-[#070C16] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span className="text-[15px] font-extrabold">Deposits vs Withdrawals · {meta.l}</span>
            </div>
            <div className="flex items-center gap-3">
              <Legend dot="#00D27A" label="Deposit" />
              <Legend dot="#EF4444" label="Withdraw" />
            </div>
          </div>
          <div
            className="mt-4 grid items-end gap-1.5 h-[200px]"
            style={{ gridTemplateColumns: `repeat(${barCount}, minmax(0,1fr))` }}
          >
            {deposits.map((dep, i) => (
              <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
                <div className="flex w-full items-end justify-center gap-[2px] h-full">
                  <div className="flex-1 max-w-[10px] rounded-t-md bg-gradient-to-t from-emerald-700 to-emerald-300"
                       style={{ height: `${(dep / maxBar) * 100}%` }} />
                  <div className="flex-1 max-w-[10px] rounded-t-md bg-gradient-to-t from-rose-700 to-rose-300"
                       style={{ height: `${(withdraws[i] / maxBar) * 100}%` }} />
                </div>
                {i % showLabelEvery === 0 && (
                  <div className="text-[9px] font-bold text-white/45 truncate">{labels[i]}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function bdtFmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

function Kpi({ label, value, delta, deltaUp, icon, tint, sub }: {
  label: string; value: string; delta: string; deltaUp: boolean;
  icon: React.ReactNode; tint: string; sub: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0B1220] to-[#070C16] p-5">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ background: tint }} />
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-xl"
              style={{ background: `${tint}1f`, color: tint }}>
          {icon}
        </span>
        <span className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold ${deltaUp ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
          {deltaUp ? "↑" : "↓"} {delta}
        </span>
      </div>
      <div className="mt-3 text-[12px] font-semibold text-white/55">{label}</div>
      <div className="mt-1 text-[24px] font-black tabular-nums text-white">{value}</div>
      <div className="mt-1 text-[10px] text-white/40">{sub}</div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/70">
      <span className="h-2 w-2 rounded-full" style={{ background: dot }} /> {label}
    </div>
  );
}
