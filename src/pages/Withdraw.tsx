import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, Wallet, RefreshCw, Check, ChevronDown, ArrowRight, ShieldCheck,
  Lock, Zap, Info, Edit3, CreditCard, Sparkles, Coins, Building2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useWalletDB } from "@/hooks/useWalletDB";
import { useWalletContext } from "@/context/WalletContext";
import { toast } from "sonner";
import { WithdrawalAccountsPanel } from "@/components/withdraw/WithdrawalAccountsPanel";
import MethodLogo, { EwalletBrandBadges } from "@/components/withdraw/MethodLogo";
import ewalletLogo from "@/assets/ewallet-logo.png";

interface WithdrawalAccount {
  id: string;
  account_type: string;
  account_name: string;
  account_number: string;
  is_verified: boolean;
  is_default: boolean;
  usdt_network?: string;
  usdt_address?: string;
}

interface WithdrawHistory {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
}

type MethodKey = "ewallet" | "novafi" | "usdt" | "binance";

const METHODS: {
  key: MethodKey;
  label: string;
  Icon: any;
  ringFrom: string;
  ringTo: string;
  iconColor: string;
  bgTint: string;
  min: string;
  max: string;
  daily: string;
  enabled: boolean;
}[] = [
  { key: "ewallet", label: "E-Wallet", Icon: Wallet, ringFrom: "#00E676", ringTo: "#00b25a", iconColor: "#00E676", bgTint: "rgba(0,230,118,0.10)", min: "৳100", max: "৳25,000", daily: "3 Times", enabled: true },
  { key: "novafi", label: "NovaFi Wallet", Icon: Sparkles, ringFrom: "#a855f7", ringTo: "#6366f1", iconColor: "#a855f7", bgTint: "rgba(168,85,247,0.10)", min: "৳1,300", max: "৳10,00,00,000", daily: "No Limit", enabled: false },
  { key: "usdt", label: "USDT (TRC20)", Icon: Coins, ringFrom: "#00E676", ringTo: "#0ea371", iconColor: "#ffffff", bgTint: "rgba(0,230,118,0.10)", min: "৳1,300", max: "৳10,00,00,000", daily: "No Limit", enabled: true },
  { key: "binance", label: "Binance Pay", Icon: Building2, ringFrom: "#F6C445", ringTo: "#d97706", iconColor: "#0b0b0b", bgTint: "rgba(246,196,69,0.10)", min: "৳1,300", max: "৳10,00,00,000", daily: "No Limit", enabled: false },
];

const STEPS = ["Select Method", "Enter Details", "Confirm", "Complete"];

const Withdraw = () => {
  const navigate = useNavigate();
  const { balance, refreshBalance } = useWalletDB();
  const { refresh: refreshWallet } = useWalletContext();

  const [activeMethod, setActiveMethod] = useState<MethodKey>("ewallet");
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [accountDetails, setAccountDetails] = useState("");
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [withdrawalAccounts, setWithdrawalAccounts] = useState<WithdrawalAccount[]>([]);
  const [todayCount, setTodayCount] = useState(0);

  const dailyLimit = 3;
  const minWithdrawal = 100;
  const maxWithdrawal = 25000;
  const quickAmounts = [100, 500, 1000, 5000, 10000];

  const fee = 0;
  const receiveAmount = useMemo(() => {
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) return 0;
    return Math.max(0, n - fee);
  }, [amount]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_withdrawal_accounts")
        .select("*").eq("user_id", user.id);
      setWithdrawalAccounts(data || []);

      const { data: hist } = await supabase
        .from("transaction_requests")
        .select("created_at")
        .eq("user_id", user.id).eq("type", "withdraw")
        .order("created_at", { ascending: false }).limit(20);
      const today = new Date().toISOString().split("T")[0];
      setTodayCount((hist || []).filter((r: any) => r.created_at?.startsWith(today)).length);
    })();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setTimeout(() => setIsRefreshing(false), 900);
  };

  const remaining = Math.max(0, dailyLimit - todayCount);

  const handleContinue = async () => {
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) return toast.error("Please enter a valid amount");
    if (activeMethod === "ewallet") {
      if (n < minWithdrawal) return toast.error(`Minimum withdrawal is ৳${minWithdrawal}`);
      if (n > maxWithdrawal) return toast.error(`Maximum withdrawal is ৳${maxWithdrawal.toLocaleString()}`);
      if (n > balance) return toast.error("Insufficient balance");
      if (!accountDetails.trim() || accountDetails.trim().length < 11)
        return toast.error("Please enter a valid account number");
      if (remaining <= 0) return toast.error("Daily withdrawal limit reached");
    } else if (activeMethod === "usdt") {
      if (!accountDetails.trim()) return toast.error("Please enter USDT wallet address");
    } else {
      return toast.error("This method is coming soon");
    }

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please login first"); return; }
      const { error } = await supabase.from("transaction_requests").insert({
        user_id: user.id,
        type: "withdraw",
        amount: n,
        payment_method: activeMethod === "usdt" ? "usdt" : "ewallet",
        payment_details: { account_number: accountDetails.trim(), note: note.trim() || null },
        status: "pending",
      });
      if (error) throw error;
      toast.success("Withdrawal request submitted!");
      await Promise.allSettled([refreshBalance?.(), refreshWallet()]);
      setStep(4);
      setAmount(""); setAccountDetails(""); setNote("");
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit withdrawal request");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden pb-24">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full bg-[#00E676]/[0.08] blur-[140px]" />
        <div className="absolute top-1/3 -right-32 w-[520px] h-[520px] rounded-full bg-[#F6C445]/[0.07] blur-[160px]" />
      </div>

      <div className="sticky top-0 z-40 backdrop-blur-xl bg-[#050505]/85 border-b border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08]"
            aria-label="Back"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 pl-3 pr-2 h-10 rounded-full border border-white/10 bg-white/[0.03]">
              <span className="text-[#F6C445] font-bold">৳</span>
              <div className="leading-none">
                <div className="text-sm font-bold tabular-nums">
                  {balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[9px] text-white/50 uppercase tracking-wider">Main Wallet</div>
              </div>
              <button
                onClick={handleRefresh}
                className="ml-1 w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.05] hover:bg-white/[0.1]"
                aria-label="Refresh"
              >
                <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
              </button>
            </div>
            <button
              onClick={() => navigate("/deposit")}
              className="h-10 px-4 rounded-xl bg-[#00E676] text-black font-bold text-sm hover:brightness-110 flex items-center gap-2"
            >
              <CreditCard size={15} /> Deposit
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6 min-w-0">
          <div>
            <div className="flex items-center gap-3">
              <img
                src={ewalletLogo}
                alt="GoLucky E-Wallet"
                width={44}
                height={44}
                className="w-11 h-11 object-contain drop-shadow-[0_0_12px_rgba(0,230,118,0.55)]"
                loading="lazy"
                decoding="async"
              />
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Withdraw</h1>
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#00E676]/15 border border-[#00E676]/40">
                <ShieldCheck size={14} className="text-[#00E676]" />
              </span>
            </div>
            <p className="text-white/50 text-sm mt-1">Fast • Secure • 24/7 Instant Withdraw</p>
          </div>

          <WithdrawalAccountsPanel />

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between">
              {STEPS.map((label, i) => {
                const idx = i + 1;
                const done = step > idx;
                const active = step === idx;
                return (
                  <div key={label} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                          active
                            ? "bg-[#00E676] text-black border-[#00E676] shadow-[0_0_20px_rgba(0,230,118,0.5)]"
                            : done
                            ? "bg-[#00E676]/20 text-[#00E676] border-[#00E676]/60"
                            : "bg-white/[0.03] text-white/40 border-white/10"
                        }`}
                      >
                        {done ? <Check size={16} /> : idx}
                      </div>
                      <span className={`text-[11px] ${active ? "text-white font-semibold" : "text-white/40"}`}>
                        {label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`h-px flex-1 mx-1 ${step > idx ? "bg-[#00E676]/50" : "bg-white/10"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
            <h2 className="text-[#F6C445] font-bold text-lg">Choose Withdrawal Method</h2>
            <p className="text-white/50 text-xs mt-1">Select your preferred withdrawal option</p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
              {METHODS.map((m) => {
                const isActive = activeMethod === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    disabled={!m.enabled}
                    onClick={() => m.enabled && setActiveMethod(m.key)}
                    className={`relative text-left rounded-2xl p-4 sm:p-5 border transition-all overflow-hidden ${
                      isActive
                        ? "border-[#00E676]/70 bg-[#00E676]/[0.04]"
                        : "border-white/[0.08] bg-white/[0.015] hover:bg-white/[0.03]"
                    } ${!m.enabled ? "opacity-60 cursor-not-allowed" : ""}`}
                    style={isActive ? { boxShadow: "0 0 30px rgba(0,230,118,0.20), inset 0 0 0 1px rgba(0,230,118,0.35)" } : {}}
                  >
                    {isActive && (
                      <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#00E676] flex items-center justify-center shadow-[0_0_12px_rgba(0,230,118,0.7)]">
                        <Check size={13} className="text-black" strokeWidth={3} />
                      </span>
                    )}
                    <div className="flex flex-col items-center text-center">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden"
                        style={{
                          background: m.key === "usdt" || m.key === "binance"
                            ? "rgba(255,255,255,0.06)"
                            : `linear-gradient(135deg, ${m.ringFrom}22, ${m.ringTo}22)`,
                          boxShadow: isActive ? `0 0 24px ${m.ringFrom}55` : "inset 0 0 0 1px rgba(255,255,255,0.06)",
                        }}
                      >
                        <MethodLogo method={m.key} size={44} />
                      </div>
                      <div className="mt-3 font-bold text-white text-base">{m.label}</div>
                      {m.key === "ewallet" && <EwalletBrandBadges />}
                      <div className="mt-3 space-y-0.5 text-[11px] text-white/60 w-full">
                        {m.key === "ewallet" && (
                          <div>Daily Limit: <span className="text-[#F6C445] font-semibold">{m.daily}</span></div>
                        )}
                        <div>Min: <span className="text-[#F6C445] font-semibold">{m.min}</span></div>
                        <div>Max: <span className="text-[#F6C445] font-semibold">{m.max}</span></div>
                      </div>
                    </div>
                    <span className="absolute bottom-3 right-3 text-white/30">
                      <Info size={13} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
            <h2 className="text-[#F6C445] font-bold text-lg">Withdrawal Details</h2>

            <div className="mt-5 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/60 mb-1.5">Available Balance</label>
                <div className="h-12 px-4 rounded-xl border border-[#F6C445]/30 bg-white/[0.02] flex items-center gap-2">
                  <span className="text-[#F6C445] font-bold">৳</span>
                  <span className="font-bold tabular-nums">
                    {balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1.5">Withdraw Currency</label>
                <div className="h-12 px-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                  <span className="font-semibold">BDT (৳)</span>
                  <ChevronDown size={16} className="text-white/40" />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs text-white/60 mb-1.5">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full h-12 px-4 pr-10 rounded-xl border border-white/10 bg-white/[0.02] text-white placeholder-white/30 focus:outline-none focus:border-[#00E676]/50 focus:ring-2 focus:ring-[#00E676]/20 tabular-nums"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F6C445] font-bold">৳</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(String(q))}
                    className={`px-4 h-9 rounded-lg text-xs font-semibold border transition-colors ${
                      amount === String(q)
                        ? "border-[#00E676]/60 bg-[#00E676]/10 text-[#00E676]"
                        : "border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.05]"
                    }`}
                  >
                    ৳{q.toLocaleString("en-IN")}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount(String(Math.min(balance, maxWithdrawal)))}
                  className="px-4 h-9 rounded-lg text-xs font-semibold border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.05]"
                >
                  All
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 py-4 border-y border-white/[0.06]">
              <div>
                <div className="text-[11px] text-white/50">You will receive</div>
                <div className="text-2xl font-black text-[#00E676] mt-1 tabular-nums">
                  ৳{receiveAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-white/50">Fee</div>
                <div className="text-2xl font-black text-white/80 mt-1 tabular-nums">
                  ৳{fee.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label className="block text-xs text-white/60 mb-1.5">Account Details</label>
              <div className="relative">
                <input
                  type="text"
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  placeholder="Enter your account / wallet details"
                  className="w-full h-12 px-4 pr-10 rounded-xl border border-white/10 bg-white/[0.02] text-white placeholder-white/30 focus:outline-none focus:border-[#00E676]/50 focus:ring-2 focus:ring-[#00E676]/20"
                />
                <CreditCard size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F6C445]" />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs text-white/60 mb-1.5">Note (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write a note (optional)"
                  className="w-full h-12 px-4 pr-10 rounded-xl border border-white/10 bg-white/[0.02] text-white placeholder-white/30 focus:outline-none focus:border-[#00E676]/50 focus:ring-2 focus:ring-[#00E676]/20"
                />
                <Edit3 size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F6C445]" />
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={isProcessing}
              className="mt-6 w-full h-14 rounded-2xl bg-gradient-to-r from-[#00c85e] via-[#00E676] to-[#00c85e] text-black font-bold text-base flex items-center justify-center gap-3 shadow-[0_10px_30px_-8px_rgba(0,230,118,0.55)] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isProcessing ? "Processing..." : (<>Continue <ArrowRight size={18} /></>)}
            </button>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="text-center font-bold text-[#F6C445] mb-4">Why Withdraw on GoLucky?</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { Icon: Zap, title: "Instant Withdraw", sub: "Within 30 Seconds", color: "#F6C445" },
                { Icon: ShieldCheck, title: "Secure & Safe", sub: "100% Protected", color: "#00E676" },
                { Icon: Sparkles, title: "Best Rates", sub: "No Hidden Charges", color: "#00E676" },
                { Icon: Lock, title: "24/7 Support", sub: "We're Always Here", color: "#F6C445" },
              ].map(({ Icon, title, sub, color }) => (
                <div key={title} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${color}20`, border: `1px solid ${color}55` }}
                  >
                    <Icon size={17} style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">{title}</div>
                    <div className="text-[11px] text-white/50 truncate">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#00E676]/25 bg-[#00E676]/[0.03] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-[#F6C445]" />
              <h3 className="text-[#F6C445] font-bold text-sm">Withdrawal Limits</h3>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-[#00E676]/30 p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#00E676]/20 flex items-center justify-center">
                  <Wallet size={14} className="text-[#00E676]" />
                </div>
                <span className="font-bold text-sm text-[#00E676]">E-Wallet</span>
              </div>
              <LimitRow label="Min Amount" value="৳100" />
              <LimitRow label="Max Amount" value="৳25,000" />
              <LimitRow label="Daily Limit" value={`${dailyLimit} Times`} />
              <LimitRow label="Remaining" value={`${remaining} Times`} accent />
              <div className="mt-3 text-[10px] text-[#F6C445] bg-[#F6C445]/10 border border-[#F6C445]/25 rounded-lg px-2 py-1.5">
                You can withdraw {remaining} times daily using E-Wallet
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#a855f7]/25 bg-[#a855f7]/[0.03] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-[#a855f7]" />
              <h3 className="font-bold text-sm text-[#a855f7]">NovaFi Wallet</h3>
            </div>
            <LimitRow label="Min Amount" value="৳1,300" sub="(≈ 10 USDT)" />
            <LimitRow label="Max Amount" value="৳10,00,00,000" sub="(≈ 1 Crore BDT)" />
            <LimitRow label="Daily Limit" value="No Limit" accent />
          </div>

          <div className="rounded-2xl border border-[#F6C445]/25 bg-[#F6C445]/[0.03] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={14} className="text-[#F6C445]" />
              <h3 className="font-bold text-sm text-[#F6C445]">Binance Pay</h3>
            </div>
            <LimitRow label="Min Amount" value="৳1,300" sub="(≈ 10 USDT)" />
            <LimitRow label="Max Amount" value="৳10,00,00,000" sub="(≈ 1 Crore BDT)" />
            <LimitRow label="Daily Limit" value="No Limit" accent />
          </div>

          <div className="rounded-2xl border border-[#00E676]/25 bg-[#00E676]/[0.03] p-4 relative overflow-hidden">
            <h3 className="text-[#F6C445] font-bold text-sm mb-3">Secure & Trusted</h3>
            <ul className="space-y-2 text-sm">
              {["SSL Encrypted", "24/7 Protection", "Instant Processing"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-white/80">
                  <span className="w-5 h-5 rounded-full bg-[#00E676]/20 flex items-center justify-center">
                    <Check size={12} className="text-[#00E676]" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <motion.div
              className="absolute -right-4 -bottom-4 opacity-70"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="w-24 h-24 rounded-3xl bg-[#00E676]/10 border border-[#00E676]/40 flex items-center justify-center shadow-[0_0_40px_rgba(0,230,118,0.35)]">
                <Lock size={30} className="text-[#00E676]" />
              </div>
            </motion.div>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {step === 4 && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setStep(1)}
          >
            <motion.div
              className="max-w-sm w-full rounded-3xl bg-gradient-to-b from-[#0b0b0b] to-[#050505] border border-[#00E676]/30 p-8 text-center"
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-[#00E676]/15 border-2 border-[#00E676] flex items-center justify-center mb-4">
                <Check size={30} className="text-[#00E676]" strokeWidth={3} />
              </div>
              <h3 className="text-xl font-bold mb-1">Request Submitted</h3>
              <p className="text-white/60 text-sm mb-5">
                Your withdrawal request has been received and will be processed within 24 hours.
              </p>
              <button
                onClick={() => setStep(1)}
                className="w-full h-11 rounded-xl bg-[#00E676] text-black font-bold"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LimitRow = ({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) => (
  <div className="flex items-start justify-between py-1.5 text-xs">
    <span className="text-white/55">{label}</span>
    <div className="text-right">
      <div className={`font-bold ${accent ? "text-[#00E676]" : "text-white"}`}>{value}</div>
      {sub && <div className="text-[10px] text-white/40">{sub}</div>}
    </div>
  </div>
);

export default Withdraw;
