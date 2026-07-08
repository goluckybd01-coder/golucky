import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ShieldCheck, Sparkles, TrendingUp, Users, DollarSign, Star,
  Calendar, Calculator, ChevronDown, ArrowRight, RefreshCcw,
  Wallet, Send, FileCheck2, ShieldQuestion, BadgeCheck, Coins,
  AlertTriangle, Zap, Lock, HeartHandshake, Crown, Check,
  Landmark, WalletCards, Clock3, CheckCircle2, Copy, QrCode, ExternalLink,
} from "lucide-react";

/* ---------------- Types ---------------- */
type Plan = { id: string; name: string; min_amount: number; max_amount: number | null; daily_rate_bps: number; duration_days: number; is_active: boolean; };
type FD = { id: number; amount: number; duration_days: number; profit_rate: number; expected_profit: number; total_return: number; start_date: string; end_date: string; status: "active" | "completed" | "withdrawn" | "cancelled"; created_at: string; };
type FDW = { id: number; fd_id: number; amount: number; penalty: number; final_amount: number; type: "mature" | "early"; status: "pending" | "approved" | "rejected"; requested_at: string; };
type Payment = { id: string; amount: number; amount_usdt: number | null; txid: string | null; wallet_address: string | null; status: "pending" | "success" | "failed" | "verified" | "rejected"; gateway: string | null; created_at: string; verified_at: string | null; rejection_reason: string | null; };

/* ---------------- Config ---------------- */
const DURATIONS = [
  { days: 15, rate: 2 }, { days: 30, rate: 5 }, { days: 45, rate: 8 },
  { days: 90, rate: 15 }, { days: 120, rate: 20 }, { days: 180, rate: 30 }, { days: 365, rate: 60 },
];

type Tier = {
  n: number; name: string; min: number; min_pct: number; max_pct: number;
  tag: string; tagTone: string; icon: string; accent: string; btn: string;
};
const TIERS: Tier[] = [
  { n: 1,  name: "Starter",      min: 10_000,    min_pct: 2,  max_pct: 10, tag: "Popular",     tagTone: "text-emerald-300", icon: "🛡️", accent: "from-emerald-400/40 to-transparent", btn: "bg-gradient-to-r from-emerald-500 to-emerald-400 text-black" },
  { n: 2,  name: "Basic",        min: 20_000,    min_pct: 3,  max_pct: 11, tag: "Popular",     tagTone: "text-sky-300",     icon: "💠", accent: "from-sky-400/40 to-transparent",      btn: "bg-gradient-to-r from-sky-500 to-cyan-400 text-black" },
  { n: 3,  name: "Silver",       min: 30_000,    min_pct: 4,  max_pct: 12, tag: "Secure",      tagTone: "text-slate-300",   icon: "🥈", accent: "from-slate-300/30 to-transparent",    btn: "bg-gradient-to-r from-slate-500 to-slate-400 text-black" },
  { n: 4,  name: "Gold",         min: 50_000,    min_pct: 5,  max_pct: 13, tag: "Gold Choice", tagTone: "text-amber-300",   icon: "🏆", accent: "from-amber-400/40 to-transparent",    btn: "bg-gradient-to-r from-amber-500 to-yellow-400 text-black" },
  { n: 5,  name: "Platinum",     min: 75_000,    min_pct: 6,  max_pct: 14, tag: "Recommended", tagTone: "text-fuchsia-300", icon: "✨", accent: "from-fuchsia-400/40 to-transparent",  btn: "bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white" },
  { n: 6,  name: "Diamond",      min: 100_000,   min_pct: 7,  max_pct: 15, tag: "Premium",     tagTone: "text-cyan-300",    icon: "💎", accent: "from-cyan-400/40 to-transparent",     btn: "bg-gradient-to-r from-cyan-500 to-sky-400 text-black" },
  { n: 7,  name: "Elite",        min: 200_000,   min_pct: 8,  max_pct: 16, tag: "VIP",         tagTone: "text-orange-300",  icon: "👑", accent: "from-orange-400/40 to-transparent",   btn: "bg-gradient-to-r from-orange-500 to-amber-500 text-black" },
  { n: 8,  name: "Royal",        min: 500_000,   min_pct: 9,  max_pct: 17, tag: "Royal",       tagTone: "text-yellow-300",  icon: "🎖️", accent: "from-yellow-400/40 to-transparent",   btn: "bg-gradient-to-r from-yellow-500 to-amber-400 text-black" },
  { n: 9,  name: "Legend",       min: 1_000_000, min_pct: 10, max_pct: 18, tag: "Elite",       tagTone: "text-rose-300",    icon: "🔥", accent: "from-rose-500/40 to-transparent",     btn: "bg-gradient-to-r from-rose-500 to-pink-500 text-white" },
  { n: 10, name: "Infinity",     min: 1_500_000, min_pct: 11, max_pct: 19, tag: "Infinity",    tagTone: "text-violet-300",  icon: "♾️", accent: "from-violet-500/40 to-transparent",   btn: "bg-gradient-to-r from-violet-500 to-indigo-500 text-white" },
  { n: 11, name: "Prestige",     min: 2_000_000, min_pct: 12, max_pct: 20, tag: "Prestige",    tagTone: "text-teal-300",    icon: "💠", accent: "from-teal-400/40 to-transparent",     btn: "bg-gradient-to-r from-teal-500 to-emerald-500 text-black" },
  { n: 12, name: "Signature",    min: 2_500_000, min_pct: 13, max_pct: 21, tag: "Signature",   tagTone: "text-pink-300",    icon: "🛡️", accent: "from-pink-500/40 to-transparent",     btn: "bg-gradient-to-r from-pink-500 to-rose-500 text-white" },
  { n: 13, name: "Imperial",     min: 3_000_000, min_pct: 14, max_pct: 22, tag: "Imperial",    tagTone: "text-red-300",     icon: "🏛️", accent: "from-red-500/40 to-transparent",      btn: "bg-gradient-to-r from-red-500 to-rose-600 text-white" },
  { n: 14, name: "Sovereign",    min: 4_000_000, min_pct: 15, max_pct: 23, tag: "Sovereign",   tagTone: "text-blue-300",    icon: "⚜️", accent: "from-blue-500/40 to-transparent",     btn: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white" },
  { n: 15, name: "Ultimate VIP", min: 5_000_000, min_pct: 16, max_pct: 25, tag: "Ultimate VIP",tagTone: "text-amber-300",   icon: "👑", accent: "from-amber-300/60 via-yellow-400/40 to-transparent", btn: "bg-gradient-to-r from-amber-400 to-yellow-500 text-black" },
];

const LADDER_AMOUNTS = TIERS.map((t) => t.min);
const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
const fmtCompact = (n: number) => {
  if (n >= 1e7) return `৳${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `৳${(n / 1e5).toFixed(2)} L`;
  if (n >= 1e3) return `৳${(n / 1e3).toFixed(1)}K`;
  return fmt(n);
};

const statusTone: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  completed: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  withdrawn: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  cancelled: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  verified: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  failed: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

/* ---------------- Sparkline ---------------- */
const Sparkline = ({ tone = "emerald" }: { tone?: "emerald" | "sky" | "amber" | "violet" | "rose" }) => {
  const color =
    tone === "sky" ? "#38bdf8" :
    tone === "amber" ? "#fbbf24" :
    tone === "violet" ? "#a78bfa" :
    tone === "rose" ? "#fb7185" : "#10b981";
  // pseudo-random static path
  const pts = [4, 8, 6, 12, 9, 14, 11, 16, 13, 18, 15, 20];
  const max = Math.max(...pts);
  const d = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i * 80) / (pts.length - 1)},${28 - (v / max) * 22}`).join(" ");
  return (
    <svg viewBox="0 0 80 30" className="h-7 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sp-${tone}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L80,30 L0,30 Z`} fill={`url(#sp-${tone})`} />
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ---------------- Vault Illustration ---------------- */
const VaultHero = () => (
  <div className="relative mx-auto h-56 w-full max-w-md md:h-72">
    {/* glow */}
    <div className="absolute inset-0 rounded-full bg-emerald-500/25 blur-3xl" />
    <div className="absolute inset-0 flex items-center justify-center">
      {/* vault */}
      <div className="relative h-40 w-52 rounded-2xl bg-gradient-to-b from-slate-700 to-slate-900 border border-white/10 shadow-[0_30px_80px_-20px_rgba(56,189,248,0.5)] md:h-48 md:w-64">
        <div className="absolute inset-3 rounded-xl border-2 border-amber-400/60 bg-gradient-to-b from-slate-800 to-black" />
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-amber-400 bg-gradient-to-br from-amber-500 to-yellow-600 md:h-20 md:w-20">
          <div className="absolute inset-2 rounded-full border-2 border-amber-300/60" />
          <div className="absolute left-1/2 top-1/2 h-1 w-8 -translate-x-1/2 -translate-y-1/2 bg-amber-200 rounded-full md:w-10" />
          <div className="absolute left-1/2 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 bg-amber-200 rounded-full md:h-10" />
        </div>
        <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
      </div>
      {/* tether coin */}
      <div className="absolute -left-2 top-1/2 grid h-24 w-24 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_20px_50px_-10px_rgba(16,185,129,0.7)] md:h-28 md:w-28">
        <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-white/40 bg-gradient-to-br from-emerald-500 to-emerald-700 md:h-24 md:w-24">
          <span className="text-3xl font-black text-white md:text-4xl">₮</span>
        </div>
      </div>
      {/* floating coins */}
      {["🪙","🪙","🪙","🪙","💎","₿"].map((c, i) => (
        <span key={i}
          className="absolute text-lg opacity-90 animate-bounce"
          style={{
            top: `${[10,25,60,75,40,15][i]}%`,
            left: `${[85,20,80,30,90,10][i]}%`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: "3s",
            filter: "drop-shadow(0 4px 8px rgba(251,191,36,0.5))",
          }}>{c}</span>
      ))}
    </div>
  </div>
);

/* ---------------- Page ---------------- */
export default function FixedDeposits() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("mode") === "join" ? "create" : "deposits");
  const [userId, setUserId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [fds, setFds] = useState<FD[]>([]);
  const [wds, setWds] = useState<FDW[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [walletSubmitting, setWalletSubmitting] = useState<string | null>(null);
  const [usdtRate, setUsdtRate] = useState(130);
  const [amount, setAmount] = useState(100_000);
  const [duration, setDuration] = useState(90);
  const [txid, setTxid] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [quickError, setQuickError] = useState<string | null>(null);
  const [checkoutOrder, setCheckoutOrder] = useState<{
    order_id: string; deposit_address: string; invoice_url: string; expires_at: string; amount_usdt: number;
  } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [paymentSuccess, setPaymentSuccess] = useState<{
    amount_bdt: number; amount_usdt: number; duration_days: number; profit: number; total: number;
    txid: string; wallet: string; maturity: string; submitted_at: string;
  } | null>(null);

  useEffect(() => {
    if (!checkoutOrder) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [checkoutOrder]);

  // Auto-refresh deposit address when expiry hits zero
  const autoRefreshedRef = useRef<string | null>(null);
  const refreshInFlightRef = useRef(false);
  useEffect(() => {
    if (!checkoutOrder) { autoRefreshedRef.current = null; return; }
    if (checkoutLoading || refreshInFlightRef.current) return; // guard: single toast per refresh cycle
    if (autoRefreshedRef.current === checkoutOrder.order_id) return;
    const remaining = new Date(checkoutOrder.expires_at).getTime() - now;
    if (remaining > 0) return;
    autoRefreshedRef.current = checkoutOrder.order_id;
    refreshInFlightRef.current = true;
    toast.loading("Deposit address expired — auto-refreshing…", { id: "addr-refresh", duration: 4000 });
    setCheckoutOrder(null);
    initiateCheckout().finally(() => { refreshInFlightRef.current = false; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutOrder, now, checkoutLoading]);

  const selectedDuration = DURATIONS.find((d) => d.days === duration) ?? DURATIONS[3];
  const previewProfit = useMemo(() => Math.round(amount * selectedDuration.rate) / 100, [amount, selectedDuration.rate]);
  const previewTotal = amount + previewProfit;
  const dailyEarnings = previewProfit / selectedDuration.days;
  const amountUsdt = amount / usdtRate;
  const maturityDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + selectedDuration.days);
    return d;
  }, [selectedDuration.days]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData.user?.id ?? null;
    setUserId(uid);

    const [{ data: planData }, rateResult] = await Promise.all([
      supabase.from("fixed_deposit_plans").select("*").eq("is_active", true).order("duration_days", { ascending: true }),
      Promise.resolve(supabase.rpc("get_usdt_rate")).catch(() => ({ data: 130 })),
    ]);

    setPlans(((planData as Plan[]) ?? []).filter((p) => p.is_active));
    if (typeof rateResult.data === "number" && rateResult.data > 0) setUsdtRate(rateResult.data);

    if (!uid) {
      setFds([]); setWds([]); setPayments([]); setLoading(false);
      return;
    }

    const [{ data: fdData }, { data: wdData }, { data: paymentData }] = await Promise.all([
      supabase.from("fixed_deposits").select("*").order("created_at", { ascending: false }),
      supabase.from("fd_withdrawals").select("*").order("requested_at", { ascending: false }),
      supabase.from("payments").select("*").eq("gateway", "usdt-trc20").order("created_at", { ascending: false }),
    ]);

    setFds((fdData as FD[]) ?? []);
    setWds((wdData as FDW[]) ?? []);
    setPayments((paymentData as Payment[]) ?? []);
    setLoading(false);
  }, []);

  const submitUsdtPayment = async () => {
    if (!userId) { toast.error("Fixed Deposit শুরু করতে আগে লগইন করুন।"); return; }
    if (txid.trim().length < 10 || walletAddress.trim().length < 10) {
      toast.error("সঠিক TXID এবং TRC20 wallet address দিন।"); return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc("submit_usdt_deposit", {
      p_amount_usdt: Number(amountUsdt.toFixed(6)),
      p_txid: txid.trim(),
      p_wallet_address: walletAddress.trim(),
      p_proof_url: null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message || "Deposit request submit হয়নি।"); return; }
    toast.success("Fixed Deposit payment জমা হয়েছে — Admin verification pending.");
    setPaymentSuccess({
      amount_bdt: amount,
      amount_usdt: Number(amountUsdt.toFixed(2)),
      duration_days: selectedDuration.days,
      profit: previewProfit,
      total: previewTotal,
      txid: txid.trim(),
      wallet: walletAddress.trim(),
      maturity: maturityDate.toISOString(),
      submitted_at: new Date().toISOString(),
    });
    setTxid(""); setWalletAddress(""); setCheckoutOrder(null); load();
  };

  const initiateCheckout = async () => {
    if (!userId) { toast.error("Payment শুরু করতে আগে লগইন করুন।"); return; }
    if (amountUsdt < 1) { toast.error("Minimum 1 USDT required."); return; }
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const { data, error } = await supabase.functions.invoke("usdt-create-order", {
        body: { amount_usdt: Number(amountUsdt.toFixed(2)) },
      });
      if (error || !data?.success) {
        const msg = data?.error || error?.message || "Payment order create হয়নি।";
        toast.dismiss("addr-refresh");
        toast.error(msg, { id: "addr-refresh" });
        setCheckoutError(msg);
        return;
      }
      setCheckoutOrder(data.data);
      setWalletAddress(data.data.deposit_address);
      toast.dismiss("addr-refresh");
      toast.success("Payment order তৈরি হয়েছে — নির্দিষ্ট address এ USDT পাঠান।");
    } catch (e: any) {
      const msg = e?.message || "Network error — could not reach payment gateway.";
      console.error("[initiateCheckout] failed:", e);
      toast.dismiss("addr-refresh");
      toast.error(msg, { id: "addr-refresh" });
      setCheckoutError(msg);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const retryCheckout = () => {
    // Allow a fresh auto-refresh attempt on next expiry too
    autoRefreshedRef.current = null;
    setCheckoutError(null);
    initiateCheckout();
  };

  const copyAddress = async () => {
    if (!checkoutOrder) return;
    try {
      await navigator.clipboard.writeText(checkoutOrder.deposit_address);
      toast.success("Deposit address copied");
    } catch { toast.error("Copy failed"); }
  };



  const createWalletFd = async (plan: Plan) => {
    if (!userId) { toast.error("Fixed Deposit শুরু করতে আগে লগইন করুন।"); return; }
    setWalletSubmitting(plan.id);
    const { error } = await supabase.rpc("create_fixed_deposit", { p_plan_id: plan.id, p_amount: plan.min_amount });
    setWalletSubmitting(null);
    if (error) { toast.error(error.message || "Wallet থেকে Fixed Deposit create হয়নি।"); return; }
    toast.success("Fixed Deposit active হয়েছে।"); setActiveTab("deposits"); load();
  };

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      await load();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      channel = supabase.channel("fd-user-live")
        .on("postgres_changes", { event: "*", schema: "public", table: "fixed_deposits", filter: `user_id=eq.${user.id}` }, () => load())
        .on("postgres_changes", { event: "*", schema: "public", table: "fd_withdrawals", filter: `user_id=eq.${user.id}` }, () => load())
        .on("postgres_changes", { event: "*", schema: "public", table: "payments", filter: `user_id=eq.${user.id}` }, () => load())
        .subscribe();
    })();
    return () => { cancelled = true; if (channel) supabase.removeChannel(channel); };
  }, [load]);

  const activeCount = fds.filter((f) => f.status === "active").length;
  const totalActiveAmount = fds.filter((f) => f.status === "active").reduce((a, f) => a + Number(f.amount || 0), 0);
  const totalProfitPaid = fds.filter((f) => f.status === "completed" || f.status === "withdrawn").reduce((a, f) => a + Number(f.expected_profit || 0), 0);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <Helmet>
        <title>Fixed Deposit Centre | GoLuckyBD Premium Bank</title>
        <meta name="description" content="Grow your wealth with GoLuckyBD Fixed Deposit — up to 25% profit with secure USDT-TRC20 verification." />
      </Helmet>

      <div className="relative min-h-screen overflow-hidden bg-[#0B1220] text-white pb-32">
        {/* subtle background */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[120px]" />
          <div className="absolute top-1/3 right-0 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-[420px] w-[420px] rounded-full bg-amber-400/5 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-[1440px] px-4 md:px-8 pt-6 space-y-6">

          {/* PREMIUM FIXED DEPOSIT HERO CARD */}
          <section
            aria-label="Premium Fixed Deposit"
            className="relative overflow-hidden rounded-3xl border border-white/10 p-5 md:p-6"
            style={{
              background:
                "radial-gradient(120% 90% at 0% 0%, rgba(16,185,129,0.22), transparent 55%)," +
                "radial-gradient(90% 70% at 100% 100%, rgba(251,191,36,0.18), transparent 55%)," +
                "linear-gradient(180deg, rgba(4,16,10,0.92), rgba(6,10,16,0.98))",
              boxShadow: "0 20px 60px -28px rgba(16,185,129,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/50 bg-gradient-to-br from-emerald-500/40 to-amber-400/20 text-amber-200 shadow-[0_10px_24px_-8px_rgba(16,185,129,0.7)]"
              >
                <Landmark className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" /> Premium Fixed Deposit
                </div>
                <h2 className="mt-1 text-[18px] md:text-[22px] font-black leading-tight tracking-tight bg-gradient-to-r from-amber-300 via-emerald-300 to-amber-300 bg-clip-text text-transparent">
                  Bank-Grade Returns. On-Chain Audited.
                </h2>
                <p className="mt-0.5 text-[12px] text-white/60">
                  Lock ৳500+ from 15 to 365 days and earn up to 24% APY with GoLuckyBD.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              {[
                { label: "Total Locked",     value: "৳12.4 Cr+", color: "#10b981" },
                { label: "Active Investors", value: "25,000+",   color: "#38bdf8" },
                { label: "Highest APY",      value: "24%",       color: "#fbbf24" },
                { label: "Trust Score",      value: "99.8%",     color: "#a78bfa" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-white/50">{s.label}</div>
                  <div
                    className="text-[16px] md:text-[18px] font-black tabular-nums"
                    style={{ color: s.color, textShadow: `0 0 10px ${s.color}55` }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 md:max-w-md">
              <button
                type="button"
                onClick={() => { setActiveTab("create"); scrollTo("dashboard"); }}
                aria-label="Invest Now"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-400 px-4 py-2.5 text-[13px] font-black uppercase tracking-wider text-black shadow-[0_12px_26px_-8px_rgba(16,185,129,0.8)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Coins className="h-4 w-4" /> Invest Now
              </button>
              <button
                type="button"
                onClick={() => scrollTo("plans")}
                aria-label="View Plans"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2.5 text-[13px] font-black uppercase tracking-wider text-white/90 hover:bg-white/10"
              >
                <ArrowRight className="h-4 w-4" /> View Plans
              </button>
            </div>
          </section>

          {/* FEATURED PLAN CARDS (15 / 30 / 60 / 90 / 180 days) */}
          <section aria-label="Featured Fixed Deposit Plans" className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
            {[
              { days: 15,  apy: 8,  daily: 0.53, min: 500,    ret: "৳16.44",   tag: "Starter",  color: "#10b981" },
              { days: 30,  apy: 12, daily: 0.40, min: 1_000,  ret: "৳120.00",  tag: "Popular",  color: "#38bdf8" },
              { days: 60,  apy: 16, daily: 0.27, min: 2_500,  ret: "৳660.27",  tag: "Value",    color: "#fbbf24" },
              { days: 90,  apy: 20, daily: 0.22, min: 5_000,  ret: "৳2,465.75",tag: "Premium",  color: "#a78bfa" },
              { days: 180, apy: 24, daily: 0.13, min: 10_000, ret: "৳11,835.61", tag: "Elite",  color: "#f472b6" },
            ].map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => { setAmount(p.min); setActiveTab("create"); scrollTo("dashboard"); }}
                aria-label={`Invest for ${p.days} days at ${p.apy}% APY`}
                className="group relative overflow-hidden rounded-2xl border p-3 text-left transition-transform hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  borderColor: `${p.color}55`,
                  background: `linear-gradient(160deg, ${p.color}22, rgba(0,0,0,0.6) 70%)`,
                  boxShadow: `0 14px 30px -18px ${p.color}aa, inset 0 1px 0 rgba(255,255,255,0.05)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-full border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest"
                    style={{ color: p.color, borderColor: `${p.color}55`, background: `${p.color}18` }}
                  >
                    {p.tag}
                  </span>
                  <Calendar className="h-3.5 w-3.5 text-white/50" aria-hidden />
                </div>
                <div className="mt-2 text-[11px] font-black uppercase tracking-wider text-white/60">{p.days} Days</div>
                <div
                  className="mt-0.5 text-[22px] font-black leading-none tabular-nums"
                  style={{ color: p.color, textShadow: `0 0 12px ${p.color}66` }}
                >
                  {p.apy}%<span className="ml-1 text-[10px] font-bold text-white/60">APY</span>
                </div>
                <div className="mt-1 text-[10px] text-white/60 tabular-nums">
                  ~{p.daily}% daily ROI
                </div>
                <div className="mt-2 border-t border-white/10 pt-1.5 text-[10px] text-white/60">
                  Min <span className="font-bold text-white/85 tabular-nums">{fmtCompact(p.min)}</span>
                </div>
                <div className="text-[10px] text-white/60">
                  Est. return <span className="font-black tabular-nums" style={{ color: p.color }}>{p.ret}</span>
                </div>
                <div
                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                  style={{ color: p.color }}
                >
                  Invest <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            ))}
          </section>

          {/* QUICK CREATE FD FORM */}
          <section
            aria-label="Create Fixed Deposit"
            className="relative overflow-hidden rounded-3xl border border-emerald-400/25 p-4 md:p-5"
            style={{
              background:
                "radial-gradient(120% 90% at 100% 0%, rgba(16,185,129,0.15), transparent 60%)," +
                "linear-gradient(180deg, rgba(11,18,32,0.9), rgba(11,18,32,0.98))",
              boxShadow: "0 20px 60px -28px rgba(16,185,129,0.5)",
            }}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                  <Sparkles className="h-3 w-3" /> Quick Create
                </div>
                <h3 className="mt-1 text-[16px] md:text-[18px] font-black text-white">Create Your Fixed Deposit</h3>
                <p className="text-[11.5px] text-white/60">Pick amount, tenure, and a plan — validation runs before submit.</p>
              </div>
              <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-300" aria-hidden />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {/* Amount */}
              <label className="space-y-1 text-[11px] font-bold uppercase tracking-widest text-white/60">
                Amount (BDT)
                <input
                  type="number"
                  inputMode="numeric"
                  min={500}
                  max={50_000_000}
                  step={500}
                  value={amount}
                  onChange={(e) => { setAmount(Number(e.target.value) || 0); setQuickError(null); }}
                  placeholder="Min ৳500"
                  aria-label="FD amount in BDT"
                  className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#0b1220] px-3 text-sm font-bold text-white placeholder:text-white/30 focus:border-emerald-400/60 focus:outline-none"
                />
              </label>

              {/* Tenure */}
              <label className="space-y-1 text-[11px] font-bold uppercase tracking-widest text-white/60">
                Tenure
                <select
                  value={duration}
                  onChange={(e) => { setDuration(Number(e.target.value)); setQuickError(null); }}
                  aria-label="FD tenure in days"
                  className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#0b1220] px-3 text-sm font-bold text-white focus:border-emerald-400/60 focus:outline-none"
                >
                  {DURATIONS.map((d) => (
                    <option key={d.days} value={d.days}>{d.days} Days · {d.rate}% Profit</option>
                  ))}
                </select>
              </label>

              {/* Plan */}
              <label className="space-y-1 text-[11px] font-bold uppercase tracking-widest text-white/60">
                Plan Tier
                <select
                  value={(TIERS.slice().reverse().find((t) => amount >= t.min)?.n) ?? TIERS[0].n}
                  onChange={(e) => {
                    const tier = TIERS.find((t) => t.n === Number(e.target.value));
                    if (tier) { setAmount(tier.min); setQuickError(null); }
                  }}
                  aria-label="FD plan tier"
                  className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#0b1220] px-3 text-sm font-bold text-white focus:border-emerald-400/60 focus:outline-none"
                >
                  {TIERS.map((t) => (
                    <option key={t.n} value={t.n}>
                      {t.icon} {t.name} — {fmtCompact(t.min)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Live preview */}
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                <div className="text-[9px] uppercase tracking-wider text-white/50">Pay USDT</div>
                <div className="text-[14px] font-black tabular-nums text-sky-300">{amountUsdt.toFixed(2)}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                <div className="text-[9px] uppercase tracking-wider text-white/50">Profit ({selectedDuration.rate}%)</div>
                <div className="text-[14px] font-black tabular-nums text-emerald-300">{fmt(previewProfit)}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                <div className="text-[9px] uppercase tracking-wider text-white/50">Daily ROI</div>
                <div className="text-[14px] font-black tabular-nums text-amber-300">{fmt(Math.round(dailyEarnings * 100) / 100)}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                <div className="text-[9px] uppercase tracking-wider text-white/50">Total Return</div>
                <div className="text-[14px] font-black tabular-nums text-emerald-200">{fmt(previewTotal)}</div>
              </div>
            </div>

            {quickError && (
              <div
                role="alert"
                className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[12px] font-bold text-rose-200"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {quickError}
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2 md:max-w-lg">
              <button
                type="button"
                onClick={() => {
                  if (!Number.isFinite(amount) || amount < 500) {
                    setQuickError("Amount must be at least ৳500.");
                    return;
                  }
                  if (amount > 50_000_000) {
                    setQuickError("Amount cannot exceed ৳5 Cr.");
                    return;
                  }
                  if (!DURATIONS.some((d) => d.days === duration)) {
                    setQuickError("Please select a valid tenure.");
                    return;
                  }
                  setQuickError(null);
                  setActiveTab("create");
                  scrollTo("dashboard");
                }}
                aria-label="Continue to payment"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-400 px-4 py-2.5 text-[13px] font-black uppercase tracking-wider text-black shadow-[0_12px_26px_-8px_rgba(16,185,129,0.7)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Coins className="h-4 w-4" /> Continue
              </button>
              <button
                type="button"
                onClick={() => { setAmount(100_000); setDuration(90); setQuickError(null); }}
                aria-label="Reset form"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-[13px] font-black uppercase tracking-wider text-white/80 hover:bg-white/10"
              >
                <RefreshCcw className="h-4 w-4" /> Reset
              </button>
            </div>
          </section>






          <section className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
            {/* HERO */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#0b1220] to-[#0b1220] p-6 md:p-7">
              <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" /> Secure &amp; Trusted Investment Platform
              </span>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div>
                  <h1 className="text-[22px] sm:text-[24px] md:text-[30px] font-black leading-[1.15] tracking-tight">

                    Grow Your Wealth with<br />
                    <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">GoLuckyBD</span>
                    <span className="text-white"> Fixed Deposit</span>
                  </h1>
                  <p className="mt-3 text-[13px] text-white/60 max-w-md">
                    Secure your investment and earn guaranteed returns with flexible investment plans.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button onClick={() => { setActiveTab("create"); scrollTo("dashboard"); }}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-5 py-2.5 text-sm font-bold text-black shadow-[0_15px_40px_-10px_rgba(16,185,129,0.6)] hover:scale-[1.02] transition">
                      Invest Now <ArrowRight className="h-4 w-4" />
                    </button>
                    <button onClick={() => scrollTo("plans")}
                      className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition">
                      View Plans
                    </button>
                  </div>
                </div>
                <VaultHero />
              </div>
            </div>


            {/* CALCULATOR */}
            <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-5 md:p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-sky-300" />
                  <h3 className="text-base font-bold">Investment Calculator</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-white/50">Deposit Amount</label>
                  <div className="mt-1 relative">
                    <select value={amount} onChange={(e) => setAmount(Number(e.target.value))}
                      className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#0b1220] pl-3 pr-16 text-sm font-bold text-white outline-none focus:border-sky-400/60">
                      {LADDER_AMOUNTS.map((v) => <option key={v} value={v}>{v.toLocaleString()}</option>)}
                    </select>
                    <span className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 text-[11px] font-bold text-white/50">BDT</span>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-white/50">Duration</label>
                    <div className="mt-1 relative">
                      <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                        className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#0b1220] px-3 pr-8 text-sm font-bold text-white outline-none">
                        {DURATIONS.map((d) => <option key={d.days} value={d.days}>{d.days} Days</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-white/50 opacity-0">.</label>
                    <div className="mt-1 flex h-11 items-center justify-between rounded-xl border border-white/10 bg-[#0b1220] px-3">
                      <span className="text-sm font-bold text-white">{amountUsdt.toFixed(2)}</span>
                      <span className="text-[10px] font-bold text-white/50">USDT</span>
                    </div>
                  </div>
                </div>

                <div className="mt-1 rounded-2xl border border-white/10 bg-[#0b1220]/60 p-4 space-y-2 text-sm">
                  <Row k="Investment" v={fmt(amount)} />
                  <Row k={`Profit (${selectedDuration.rate}%)`} v={<span className="text-emerald-400">{fmt(previewProfit)}</span>} />
                  <Row k="Daily Earnings" v={fmt(dailyEarnings)} />
                  <Row k="Total Return" v={fmt(previewTotal)} />
                  <Row k="Maturity Date" v={<span className="inline-flex items-center gap-1">{maturityDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} <Calendar className="h-3 w-3 text-emerald-400" /></span>} />
                </div>

                <button className="mt-2 h-11 w-full rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-sm font-bold text-black shadow-[0_15px_40px_-10px_rgba(56,189,248,0.5)]">
                  Calculate Profit
                </button>
              </div>
            </div>
          </section>

          {/* KPI SPARK ROW */}
          <section className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <KPI icon={<TrendingUp className="h-3.5 w-3.5" />} label="Total Active Deposits" value={fmtCompact(totalActiveAmount || 2_850_420)} delta="+12.5%" tone="emerald" />
            <KPI icon={<Users className="h-3.5 w-3.5" />} label="Total Investors" value="15,642" delta="+8.2%" tone="sky" />
            <KPI icon={<Star className="h-3.5 w-3.5 text-amber-300" />} label="Highest Profit Rate" value="25%" delta="(365 Days)" tone="amber" />
            <KPI icon={<DollarSign className="h-3.5 w-3.5" />} label="Current USDT Rate" value={`৳${usdtRate.toFixed(2)}`} delta="+0.45%" tone="sky" />
            <KPI icon={<Sparkles className="h-3.5 w-3.5" />} label="Trust Score" value="99.98%" delta="Verified" tone="violet" />
          </section>

          {/* DURATION SELECTOR */}
          <section className="rounded-2xl border border-white/10 bg-[#111827]/70 p-4 md:p-5 backdrop-blur">
            <div className="flex flex-wrap items-center gap-3 md:gap-6">
              <div>
                <div className="text-sm font-bold">Select Duration</div>
                <div className="text-[11px] text-white/50">Choose your preferred investment duration</div>
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button key={d.days} onClick={() => setDuration(d.days)}
                    className={`rounded-xl border px-4 py-2 text-xs font-bold transition ${
                      duration === d.days
                        ? "border-sky-400/60 bg-sky-500/15 text-sky-300 shadow-[0_0_20px_-4px_rgba(56,189,248,0.5)]"
                        : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]"
                    }`}>
                    {d.days} Days
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* PLANS 5×3 */}
          <section id="plans" className="rounded-2xl border border-white/10 bg-[#0b1220]/60 p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Fixed Deposit Plans</h2>
                <p className="text-[11px] text-white/50">Choose the best plan that suits your investment goals</p>
              </div>
              <button className="text-[11px] text-white/50 inline-flex items-center gap-2">
                Compare Plans <div className="h-4 w-8 rounded-full bg-white/10 relative"><div className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white/60" /></div>
              </button>
            </div>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {TIERS.map((t) => {
                const recommended = t.tag === "Recommended";
                return (
                  <div key={t.name}
                    className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition hover:-translate-y-0.5 ${
                      recommended
                        ? "border-amber-300/50 bg-gradient-to-br from-amber-500/15 via-[#111827] to-[#0b1220] shadow-[0_20px_50px_-20px_rgba(251,191,36,0.5)]"
                        : "border-white/10 bg-[#111827]/80 hover:border-sky-400/40"
                    }`}>
                    {recommended && (
                      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 rounded-b-md bg-amber-400 px-3 py-0.5 text-[9px] font-black uppercase tracking-wider text-black">
                        Recommended
                      </div>
                    )}
                    <div className={`pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br ${t.accent} blur-2xl`} />

                    <div className="relative flex items-start justify-between">
                      <span className="rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] font-black text-white/70">
                        {String(t.n).padStart(2, "0")}
                      </span>
                      <span className="text-xl">{t.icon}</span>
                    </div>

                    <h3 className={`relative mt-2 text-sm font-black ${t.tagTone}`}>{t.name}</h3>

                    <div className="relative mt-3 space-y-1 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">Minimum</div>
                      <div className="text-sm font-black text-white">{t.min.toLocaleString()} <span className="text-[10px] text-white/50">BDT</span></div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 mt-2">Profit</div>
                      <div className="text-sm font-black text-white">{t.min_pct}% - {t.max_pct}%</div>
                      <div className={`text-[10px] font-bold ${t.tagTone}`}>{t.tag}</div>
                    </div>

                    <button
                      onClick={() => { setAmount(t.min); setActiveTab("create"); scrollTo("dashboard"); }}
                      className={`relative mt-3 h-8 w-full rounded-md text-[11px] font-black shadow-[0_8px_20px_-8px_rgba(0,0,0,0.6)] ${t.btn}`}>
                      Invest Now
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* PROFIT PREVIEW + DEPOSIT PROCESS */}
          <section className="grid gap-4 md:grid-cols-2">
            {/* Profit Preview */}
            <div className="rounded-2xl border border-white/10 bg-[#111827]/80 p-5 backdrop-blur">
              <h3 className="text-base font-bold">Profit Preview <span className="text-[11px] font-normal text-white/50">(For Selected Plan)</span></h3>
              <div className="mt-4 grid grid-cols-2 gap-6 items-center">
                <div className="space-y-2 text-sm">
                  <MiniRow k="Investment Amount" v={fmt(amount)} />
                  <MiniRow k="Duration" v={`${selectedDuration.days} Days`} />
                  <MiniRow k="Profit Rate" v={`${selectedDuration.rate}%`} />
                  <MiniRow k="Profit Amount" v={<span className="text-emerald-400 font-black">{fmt(previewProfit)}</span>} />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-2 flex items-center justify-between">
                    <span className="text-white/60">📊 Daily Earnings</span>
                    <span className="font-black text-sky-300">{fmt(dailyEarnings)}</span>
                  </div>
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-2 flex items-center justify-between">
                    <span className="text-white/60">💰 Total Return</span>
                    <span className="font-black text-emerald-300">{fmt(previewTotal)}</span>
                  </div>
                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-2 flex items-center justify-between">
                    <span className="text-white/60">📅 Maturity Date</span>
                    <span className="font-black text-amber-300">{maturityDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deposit Process */}
            <div className="rounded-2xl border border-white/10 bg-[#111827]/80 p-5 backdrop-blur">
              <h3 className="text-base font-bold">Deposit Process</h3>
              <div className="mt-6 flex items-center justify-between gap-1">
                {[
                  { i: Coins,          t: "Choose Plan",    tone: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10" },
                  { i: Wallet,         t: "Enter Amount",   tone: "text-violet-300 border-violet-400/40 bg-violet-400/10" },
                  { i: Send,           t: "Send USDT",      tone: "text-cyan-300 border-cyan-400/40 bg-cyan-400/10" },
                  { i: FileCheck2,     t: "Submit TXID",    tone: "text-sky-300 border-sky-400/40 bg-sky-400/10" },
                  { i: ShieldQuestion, t: "Verification",   tone: "text-amber-300 border-amber-400/40 bg-amber-400/10" },
                  { i: BadgeCheck,     t: "Activated",      tone: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10" },
                ].map((s, i, arr) => (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1 relative">
                    <div className={`relative grid h-11 w-11 place-items-center rounded-full border-2 ${s.tone}`}>
                      <s.i className="h-4 w-4" />
                      <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-slate-900 border border-white/20 text-[9px] font-black text-white">{i + 1}</span>
                    </div>
                    <span className="text-[10px] font-bold text-white/70 text-center leading-tight mt-1">{s.t}</span>
                    {i < arr.length - 1 && (
                      <div className="absolute top-5 left-[calc(50%+22px)] w-[calc(100%-44px)] h-px border-t border-dashed border-white/20 z-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 4-COL: WHY / SECURITY / STATS / EARLY WITHDRAWAL */}
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InfoCard title="Why Choose GoLuckyBD?" tone="emerald" items={[
              "Fast & Instant Verification",
              "100% Secure Investment",
              "Guaranteed Profit Plans",
              "Transparent & Trusted System",
              "24/7 Premium Support",
              "Best Returns in Market",
            ]} />

            <div className="rounded-2xl border border-white/10 bg-[#111827]/80 p-5 backdrop-blur">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-300" /> Security &amp; Protection
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-3 items-start">
                <ul className="space-y-1.5 text-xs">
                  {["Bank Level Encryption","Secure Wallet System","Admin Verified Platform","Protected User Funds","SSL Secured Platform","Regular Security Audit"].map((s) => (
                    <li key={s} className="flex items-center gap-1.5 text-white/75">
                      <span className="text-emerald-400 text-[10px]">◆</span> {s}
                    </li>
                  ))}
                </ul>
                <div className="grid place-items-center">
                  <div className="relative h-24 w-20">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl" />
                    <div className="relative h-full w-full rounded-b-full rounded-t-lg bg-gradient-to-br from-emerald-500 to-emerald-700 border-2 border-emerald-300/60 grid place-items-center shadow-[0_10px_30px_-5px_rgba(16,185,129,0.6)]">
                      <Lock className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111827]/80 p-5 backdrop-blur">
              <h3 className="text-base font-bold">Live Platform Statistics</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <MiniStat icon="🟢" label="Active Deposits" value="৳2,850,420" />
                <MiniStat icon="💰" label="Total Profit Paid" value="৳1,245,680" />
                <MiniStat icon="📊" label="Today's Deposits" value="৳245,680" />
                <MiniStat icon="👥" label="Total Investors" value="15,642" />
                <MiniStat icon="⚡" label="Running Deposits" value="৳8,250,420" />
                <MiniStat icon="💵" label="Current USDT Rate" value={`৳${usdtRate.toFixed(2)}`} />
              </div>
            </div>

            <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/10 to-transparent p-5 backdrop-blur">
              <h3 className="text-base font-bold flex items-center gap-2 text-amber-300">
                <AlertTriangle className="h-4 w-4" /> Early Withdrawal Notice
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-white/75">
                <li className="flex gap-2"><span className="text-amber-400">◆</span> Early withdrawal before maturity requires admin approval.</li>
                <li className="flex gap-2"><span className="text-amber-400">◆</span> No profit will be paid before maturity.</li>
                <li className="flex gap-2"><span className="text-amber-400">◆</span> A penalty may be deducted according to platform policy.</li>
              </ul>
            </div>
          </section>

          {/* FAQ ROW */}
          <section className="rounded-2xl border border-white/10 bg-[#111827]/80 p-5 backdrop-blur">
            <h3 className="mb-3 text-base font-bold">Frequently Asked Questions</h3>
            <Accordion type="multiple" className="grid gap-2 md:grid-cols-5">
              {[
                { q: "How does Fixed Deposit work?", a: "Choose a tier, submit USDT TRC20 payment, and after admin verification your FD is activated." },
                { q: "Can I withdraw early?", a: "Yes, with admin approval. A penalty may apply and profit is not paid before maturity." },
                { q: "How is profit calculated?", a: "Profit = Deposit × Duration Rate. Longer durations earn higher %." },
                { q: "How long does verification take?", a: "Usually 5–30 minutes during working hours. Up to 24 hours max." },
                { q: "How do I submit TXID?", a: "Paste the blockchain hash + sender wallet address in the Create FD form." },
              ].map((f, i) => (
                <AccordionItem key={i} value={`f-${i}`} className="rounded-lg border border-white/10 bg-[#0b1220] px-3">
                  <AccordionTrigger className="text-left text-[11px] font-bold text-white/85 hover:text-sky-300">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-xs text-white/60">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* DASHBOARD TABS (below spec sections, preserved) */}
          <section id="dashboard" className="space-y-3">
            <h2 className="text-lg font-bold">My Fixed Deposit Dashboard</h2>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full bg-[#111827]/80 border border-white/10 rounded-2xl">
                <TabsTrigger value="create">Create FD</TabsTrigger>
                <TabsTrigger value="deposits">FDs ({fds.length})</TabsTrigger>
                <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
                <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-4 mt-4">
                {paymentSuccess && (
                  <div className="relative overflow-hidden rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-500/15 via-[#0b1220]/90 to-sky-500/10 p-5 shadow-[0_25px_60px_-20px_rgba(16,185,129,0.45)]">
                    <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
                    <div className="relative flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/40 bg-emerald-500/20 text-emerald-300 shadow-inner">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Payment Received</div>
                        <h3 className="mt-0.5 text-lg font-black text-white">Fixed Deposit Confirmation</h3>
                        <p className="mt-1 text-xs text-white/65">
                          Your USDT payment of <span className="font-bold text-emerald-200">{paymentSuccess.amount_usdt.toFixed(2)} USDT</span> has been submitted.
                          Admin verification usually completes within <span className="font-bold text-amber-200">5–30 minutes</span>, then your FD activates automatically.
                        </p>
                      </div>
                      <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-amber-200">
                        <Clock3 className="mr-1 inline h-3 w-3" />Pending
                      </span>
                    </div>

                    <div className="relative mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                        <div className="text-[10px] uppercase tracking-widest text-white/45">Principal</div>
                        <div className="mt-0.5 text-sm font-black text-sky-300">{fmt(paymentSuccess.amount_bdt)} ৳</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                        <div className="text-[10px] uppercase tracking-widest text-white/45">Duration</div>
                        <div className="mt-0.5 text-sm font-black text-white">{paymentSuccess.duration_days} Days</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                        <div className="text-[10px] uppercase tracking-widest text-white/45">Profit</div>
                        <div className="mt-0.5 text-sm font-black text-emerald-300">+{fmt(paymentSuccess.profit)} ৳</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                        <div className="text-[10px] uppercase tracking-widest text-white/45">Maturity Value</div>
                        <div className="mt-0.5 text-sm font-black text-amber-300">{fmt(paymentSuccess.total)} ৳</div>
                      </div>
                    </div>

                    <div className="relative mt-3 space-y-2 rounded-xl border border-white/10 bg-black/40 p-3 text-[11px]">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-white/50">TXID</span>
                        <code className="max-w-[70%] break-all text-right font-mono text-emerald-200">{paymentSuccess.txid}</code>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-white/50">Sender Wallet</span>
                        <code className="max-w-[70%] break-all text-right font-mono text-amber-100">{paymentSuccess.wallet}</code>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-white/50">Matures On</span>
                        <span className="font-bold text-white">{new Date(paymentSuccess.maturity).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-white/50">Submitted</span>
                        <span className="font-bold text-white">{new Date(paymentSuccess.submitted_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="relative mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => setActiveTab("payments")}
                        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-400 text-xs font-black text-black shadow-[0_15px_35px_-10px_rgba(16,185,129,0.5)]"
                      >
                        <Landmark className="h-3.5 w-3.5" /> Track Verification
                      </button>
                      <button
                        onClick={() => setActiveTab("deposits")}
                        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-xs font-black text-white hover:bg-white/10"
                      >
                        <WalletCards className="h-3.5 w-3.5" /> View My FDs
                      </button>
                      <button
                        onClick={() => setPaymentSuccess(null)}
                        className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black text-white/80 hover:bg-white/10"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Start New Deposit
                      </button>
                    </div>
                  </div>
                )}
                <div className="rounded-2xl border border-emerald-400/25 bg-[#111827]/80 p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold">Direct USDT Fixed Deposit</h3>
                      <p className="text-xs text-white/60">Submit your USDT TRC20 payment and admin will verify to activate the FD.</p>
                    </div>
                    <ShieldCheck className="h-6 w-6 text-emerald-300" />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="space-y-1 text-[11px] font-bold uppercase tracking-widest text-white/60">
                      Amount Package
                      <select value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#0b1220] px-3 text-sm font-bold text-white">
                        {LADDER_AMOUNTS.map((v) => <option key={v} value={v}>{fmt(v)} BDT</option>)}
                      </select>
                    </label>
                    <label className="space-y-1 text-[11px] font-bold uppercase tracking-widest text-white/60">
                      Duration &amp; Profit
                      <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#0b1220] px-3 text-sm font-bold text-white">
                        {DURATIONS.map((d) => <option key={d.days} value={d.days}>{d.days} Days · {d.rate}% Profit</option>)}
                      </select>
                    </label>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-white/[0.05] p-2"><div className="text-white/45">Pay USDT</div><div className="font-black text-sky-300">{amountUsdt.toFixed(2)}</div></div>
                    <div className="rounded-lg bg-white/[0.05] p-2"><div className="text-white/45">Profit</div><div className="font-black text-emerald-300">{fmt(previewProfit)}</div></div>
                    <div className="rounded-lg bg-white/[0.05] p-2"><div className="text-white/45">Return</div><div className="font-black text-amber-300">{fmt(previewTotal)}</div></div>
                  </div>

                  {/* Checkout: Initiate USDT payment */}
                  <div className="mt-4 rounded-xl border border-sky-400/25 bg-[#0b1220]/70 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-black uppercase tracking-widest text-sky-300">Step 1 · Initiate Payment</div>
                        <div className="text-[11px] text-white/55">Generate a secure USDT TRC20 deposit address for <span className="font-bold text-sky-200">{amountUsdt.toFixed(2)} USDT</span>.</div>
                      </div>
                      <Coins className="h-6 w-6 text-sky-300" />
                    </div>

                    {checkoutLoading && !checkoutOrder ? (
                      <div
                        role="status"
                        aria-live="polite"
                        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 p-5 text-center"
                      >
                        <RefreshCcw className="h-6 w-6 animate-spin text-sky-300" />
                        <div className="text-sm font-black text-sky-100">
                          {autoRefreshedRef.current ? "Refreshing deposit address…" : "Generating deposit address…"}
                        </div>
                        <div className="text-[11px] text-sky-200/70">
                          Securely allocating a fresh TRC20 address. Do not send funds until it appears.
                        </div>
                      </div>
                    ) : !checkoutOrder ? (
                      <div className="space-y-2">
                        {checkoutError && (
                          <div
                            role="alert"
                            aria-live="assertive"
                            className="flex items-start gap-2 rounded-lg border border-rose-400/40 bg-rose-500/10 p-3 text-[11px] text-rose-100"
                          >
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                            <div className="flex-1">
                              <div className="font-black uppercase tracking-widest text-rose-200">
                                Auto-refresh failed
                              </div>
                              <div className="mt-0.5 text-rose-100/80">{checkoutError}</div>
                            </div>
                            <button
                              onClick={retryCheckout}
                              disabled={checkoutLoading}
                              className="flex h-8 shrink-0 items-center gap-1 rounded-md border border-rose-300/40 bg-rose-500/20 px-2 text-[11px] font-black text-rose-100 hover:bg-rose-500/30 disabled:opacity-60"
                            >
                              <RefreshCcw className={`h-3 w-3 ${checkoutLoading ? "animate-spin" : ""}`} /> Retry
                            </button>
                          </div>
                        )}
                        <button
                          onClick={initiateCheckout}
                          disabled={checkoutLoading || !userId}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-sm font-black text-black shadow-[0_15px_35px_-10px_rgba(56,189,248,0.5)] disabled:opacity-60"
                        >
                          <Send className="h-4 w-4" />
                          {userId ? (checkoutError ? "Try Again" : "Generate Payment Address") : "Login required"}
                        </button>
                      </div>
                    ) : (() => {
                      const totalMs = 10 * 60 * 1000;
                      const remainingMs = Math.max(0, new Date(checkoutOrder.expires_at).getTime() - now);
                      const remainingSec = Math.floor(remainingMs / 1000);
                      const mm = String(Math.floor(remainingSec / 60)).padStart(2, "0");
                      const ss = String(remainingSec % 60).padStart(2, "0");
                      const pct = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
                      const expired = remainingMs <= 0;
                      const urgent = !expired && remainingMs < 60_000;
                      return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                          <div className="rounded-lg bg-white/[0.05] p-2">
                            <div className="text-white/45">Amount</div>
                            <div className="font-black text-sky-300">{checkoutOrder.amount_usdt.toFixed(2)} USDT</div>
                          </div>
                          <div className="rounded-lg bg-white/[0.05] p-2">
                            <div className="text-white/45">Network</div>
                            <div className="font-black text-emerald-300">TRC20</div>
                          </div>
                          <div className={`rounded-lg p-2 ${expired ? "bg-rose-500/15 border border-rose-400/40" : urgent ? "bg-amber-500/15 border border-amber-400/40 animate-pulse" : "bg-white/[0.05]"}`}>
                            <div className="text-white/45">Expires in</div>
                            <div className={`font-black tabular-nums ${expired ? "text-rose-300" : urgent ? "text-amber-200" : "text-amber-300"}`}>
                              {expired ? "EXPIRED" : `${mm}:${ss}`}
                            </div>
                          </div>
                        </div>

                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                          <div
                            className={`h-full transition-all duration-1000 ${expired ? "bg-rose-500" : urgent ? "bg-amber-400" : "bg-gradient-to-r from-emerald-400 to-sky-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div>
                          <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/50">
                            <span>Deposit Address</span>
                            {expired && <span className="text-rose-300">Address no longer valid</span>}
                          </div>
                          <div className={`flex items-center gap-2 rounded-lg border p-2 ${expired ? "border-rose-400/30 bg-rose-500/5 opacity-60" : "border-white/10 bg-black/50"}`}>
                            <code className="flex-1 break-all font-mono text-[11px] text-amber-100">{checkoutOrder.deposit_address}</code>
                            <button onClick={copyAddress} disabled={expired} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 disabled:opacity-40" aria-label="Copy address">
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {expired ? (
                          <div className="space-y-2 rounded-lg border border-rose-400/40 bg-rose-500/10 p-3 text-[11px] text-rose-100">
                            <div className="flex items-center gap-2 font-black uppercase tracking-widest text-rose-200">
                              <AlertTriangle className="h-3.5 w-3.5" /> Deposit Window Expired
                            </div>
                            <ul className="list-disc space-y-0.5 pl-4 text-rose-100/80">
                              <li>Do <b>NOT</b> send USDT to the address above — funds may be lost.</li>
                              <li>A new deposit address is being generated automatically…</li>
                              <li>If you already sent USDT, contact support with your TXID within 24h.</li>
                            </ul>
                            <div className="mt-1 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-rose-500/20 text-xs font-black text-rose-100">
                              <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> Refreshing address…
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <a href={checkoutOrder.invoice_url} target="_blank" rel="noreferrer" className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-sky-400/40 bg-sky-500/10 text-xs font-bold text-sky-200 hover:bg-sky-500/20">
                              <ExternalLink className="h-3.5 w-3.5" /> Open Invoice
                            </a>
                            <button onClick={() => setCheckoutOrder(null)} className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-white/70 hover:bg-white/10">
                              <RefreshCcw className="h-3.5 w-3.5" /> Cancel Order
                            </button>
                          </div>
                        )}



                        <div className="rounded-md border border-emerald-400/25 bg-emerald-500/5 p-2 text-[10px] text-emerald-200/80">
                          After sending USDT, paste the transaction hash (TXID) below to complete Step 2.
                        </div>
                      </div>
                      );
                    })()}
                  </div>



                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="space-y-1 text-[11px] font-bold uppercase tracking-widest text-white/60">
                      TRC20 TXID
                      <input value={txid} onChange={(e) => setTxid(e.target.value)} placeholder="Enter blockchain transaction ID" className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#0b1220] px-3 text-sm text-white placeholder:text-white/30" />
                    </label>
                    <label className="space-y-1 text-[11px] font-bold uppercase tracking-widest text-white/60">
                      Sender Wallet Address
                      <input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="Your USDT TRC20 wallet address" className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#0b1220] px-3 text-sm text-white placeholder:text-white/30" />
                    </label>
                  </div>

                  <button onClick={submitUsdtPayment} disabled={submitting} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-sm font-black text-black shadow-[0_15px_35px_-10px_rgba(16,185,129,0.5)] disabled:opacity-60">
                    {submitting ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />}
                    Submit Fixed Deposit Payment
                  </button>
                </div>

                {plans.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {plans.map((plan) => {
                      const dailyPercent = plan.daily_rate_bps / 100;
                      const minProfit = Math.round(plan.min_amount * dailyPercent * plan.duration_days) / 100;
                      return (
                        <div key={plan.id} className="rounded-2xl border border-white/10 bg-[#111827]/70 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-black">{plan.name}</div>
                              <div className="text-xs text-white/55">{plan.duration_days} days · {dailyPercent}% daily</div>
                            </div>
                            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/15 text-emerald-300">Wallet</Badge>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg bg-white/[0.05] p-2"><span className="text-white/45">Min</span><div className="font-bold">{fmt(plan.min_amount)}</div></div>
                            <div className="rounded-lg bg-white/[0.05] p-2"><span className="text-white/45">Est. Profit</span><div className="font-bold text-emerald-300">{fmt(minProfit)}</div></div>
                          </div>
                          <button onClick={() => createWalletFd(plan)} disabled={walletSubmitting === plan.id} className="mt-3 h-10 w-full rounded-lg border border-amber-400/40 bg-amber-400/10 text-xs font-black text-amber-200 disabled:opacity-60">
                            {walletSubmitting === plan.id ? "Creating…" : "Create from Wallet"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="deposits" className="space-y-3 mt-4">
                {loading ? <Skeleton className="h-24 w-full" /> : fds.length === 0 ? (
                  <EmptyState icon={<WalletCards />} title="No fixed deposits yet" action="Create FD" onClick={() => setActiveTab("create")} />
                ) : fds.map((fd) => (
                  <Card key={fd.id} className="p-4 space-y-2 border-white/10 bg-[#111827]/80 text-white rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">FD #{fd.id}</div>
                      <Badge variant="outline" className={statusTone[fd.status]}>{fd.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-white/50">Amount:</span> {fmt(fd.amount)}</div>
                      <div><span className="text-white/50">Return:</span> {fmt(fd.total_return)}</div>
                      <div><span className="text-white/50">Profit:</span> {fmt(fd.expected_profit)}</div>
                      <div><span className="text-white/50">Duration:</span> {fd.duration_days}d</div>
                      <div><span className="text-white/50">Start:</span> {fd.start_date}</div>
                      <div><span className="text-white/50">Matures:</span> {fd.end_date}</div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="payments" className="space-y-3 mt-4">
                {loading ? <Skeleton className="h-24 w-full" /> : payments.length === 0 ? (
                  <EmptyState icon={<Clock3 />} title="No payment requests yet" action="Submit Payment" onClick={() => setActiveTab("create")} />
                ) : payments.map((p) => (
                  <Card key={p.id} className="p-4 space-y-3 border-white/10 bg-[#111827]/80 text-white rounded-2xl">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold">USDT Payment</div>
                        <div className="truncate text-xs text-white/45">{p.txid || p.id}</div>
                      </div>
                      <Badge variant="outline" className={statusTone[p.status]}>{p.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-white/50">USDT:</span> {(p.amount_usdt ?? p.amount).toLocaleString("en-BD", { maximumFractionDigits: 6 })}</div>
                      <div><span className="text-white/50">BDT:</span> {fmt((p.amount_usdt ?? p.amount) * usdtRate)}</div>
                      <div className="col-span-2"><span className="text-white/50">Wallet:</span> <span className="break-all">{p.wallet_address || "—"}</span></div>
                      <div className="col-span-2 text-xs text-white/45">{new Date(p.created_at).toLocaleString()}</div>
                      {p.rejection_reason && <div className="col-span-2 text-xs text-rose-300">Reason: {p.rejection_reason}</div>}
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="withdrawals" className="space-y-3 mt-4">
                {loading ? <Skeleton className="h-24 w-full" /> : wds.length === 0 ? (
                  <EmptyState icon={<CheckCircle2 />} title="No withdrawal requests yet" />
                ) : wds.map((w) => (
                  <Card key={w.id} className="p-4 space-y-2 border-white/10 bg-[#111827]/80 text-white rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">FD #{w.fd_id} · {w.type}</div>
                      <Badge variant="outline" className={statusTone[w.status]}>{w.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-white/50">Requested:</span> {fmt(w.amount)}</div>
                      <div><span className="text-white/50">Penalty:</span> {fmt(w.penalty)}</div>
                      <div className="col-span-2"><span className="text-white/50">Final amount:</span>{" "}
                        <span className="font-semibold text-emerald-400">{w.status === "approved" ? fmt(w.final_amount) : "—"}</span>
                      </div>
                      <div className="col-span-2 text-xs text-white/45">{new Date(w.requested_at).toLocaleString()}</div>
                    </div>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </section>

          {/* BOTTOM CTA BAR */}
          <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#111827] via-[#0f172a] to-[#111827] p-4 md:p-5 grid gap-3 md:grid-cols-[1.2fr_1.4fr_1fr] items-center">
            <div>
              <div className="text-sm font-bold">Start your investment journey with GoLuckyBD today!</div>
              <div className="text-[11px] text-white/50">Secure · Trusted · Transparent</div>
            </div>
            <button onClick={() => { setActiveTab("create"); scrollTo("dashboard"); }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-6 py-3 text-sm font-black text-black shadow-[0_15px_35px_-10px_rgba(16,185,129,0.5)]">
              Invest Now &amp; Grow Your Wealth <ArrowRight className="h-4 w-4" />
            </button>
            <div className="flex items-center justify-end gap-3">
              <div className="text-right">
                <div className="text-[11px] font-bold text-white">Need Help?</div>
                <div className="text-[10px] text-white/50">Our support team is always ready to help you.</div>
              </div>
              <button className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-2 text-xs font-black text-black">Contact Support</button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/* ---------------- Reusable ---------------- */
function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/55 text-xs">{k}</span>
      <span className="font-bold text-white text-sm">{v}</span>
    </div>
  );
}

function MiniRow({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
      <span className="text-white/55 text-xs">{k}</span>
      <span className="font-bold text-white">{v}</span>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-white/50 flex items-center gap-1"><span>{icon}</span>{label}</div>
      <div className="text-sm font-black text-white">{value}</div>
    </div>
  );
}

function KPI({ icon, label, value, delta, tone }: { icon: ReactNode; label: string; value: string; delta: string; tone: "sky" | "emerald" | "amber" | "violet" | "rose" }) {
  const t =
    tone === "emerald" ? "text-emerald-300" :
    tone === "amber" ? "text-amber-300" :
    tone === "violet" ? "text-violet-300" :
    tone === "rose" ? "text-rose-300" :
    "text-sky-300";
  const iconBg =
    tone === "emerald" ? "bg-emerald-500/15 text-emerald-300" :
    tone === "amber" ? "bg-amber-500/15 text-amber-300" :
    tone === "violet" ? "bg-violet-500/15 text-violet-300" :
    tone === "rose" ? "bg-rose-500/15 text-rose-300" :
    "bg-sky-500/15 text-sky-300";
  return (
    <div className="rounded-xl border border-white/10 bg-[#111827]/80 px-3 py-2.5 backdrop-blur">
      <div className="flex items-center gap-2">
        <span className={`grid h-6 w-6 place-items-center rounded-md ${iconBg}`}>{icon}</span>
        <span className="text-[10px] font-semibold text-white/55 leading-tight">{label}</span>
      </div>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-black tabular-nums text-white leading-none">{value}</div>
          <div className={`mt-1 text-[10px] font-bold ${t}`}>{delta}</div>
        </div>
        <div className="hidden lg:block w-14 shrink-0"><Sparkline tone={tone === "rose" ? "rose" : tone} /></div>
      </div>
    </div>
  );
}


function InfoCard({ title, tone, items }: { title: string; tone: "emerald" | "sky"; items: string[] }) {
  const dot = tone === "emerald" ? "text-emerald-400" : "text-sky-400";
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827]/80 p-5 backdrop-blur">
      <h3 className="text-base font-bold flex items-center gap-2">
        <HeartHandshake className={`h-4 w-4 ${dot}`} /> {title}
      </h3>
      <ul className="mt-3 space-y-1.5 text-xs">
        {items.map((s) => (
          <li key={s} className="flex items-center gap-1.5 text-white/75">
            <span className={`text-[10px] ${dot}`}>◆</span> {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({ icon, title, action, onClick }: { icon: ReactNode; title: string; action?: string; onClick?: () => void }) {
  return (
    <Card className="grid place-items-center gap-3 border-white/10 bg-[#111827]/70 px-4 py-10 text-center text-white rounded-2xl">
      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300">{icon}</div>
      <p className="text-sm text-white/65">{title}</p>
      {action && (
        <button onClick={onClick} className="rounded-lg bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-2 text-xs font-black text-[#0B1220]">
          {action}
        </button>
      )}
    </Card>
  );
}

// unused imports kept for future variants
void Zap; void Crown; void Check;
