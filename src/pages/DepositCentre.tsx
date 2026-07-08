import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft, History, Wallet, Gift, Crown, Zap, ShieldCheck, CreditCard, Clock,
  Sparkles, Trophy, TrendingUp, Users, CheckCircle2,
  ArrowRight, Info, X,
} from "lucide-react";
import { useWalletDB } from "@/hooks/useWalletDB";
import USDTDepositFlow from "@/components/deposit/USDTDepositFlow";
import bkashAsset from "@/assets/payment-logos/bkash.jpg.asset.json";
import nagadAsset from "@/assets/payment-logos/nagad.jpg.asset.json";
import rocketAsset from "@/assets/payment-logos/rocket.jpg.asset.json";
import upayAsset from "@/assets/payment-logos/upay.jpg.asset.json";
import usdtAsset from "@/assets/payment-logos/usdt.jpg.asset.json";
import binanceAsset from "@/assets/payment-logos/binance.jpg.asset.json";
import novafiAsset from "@/assets/payment-logos/novafi.jpg.asset.json";

const USDT_TO_BDT = 130;
const BDT_METHODS = [
  { key: "bkash", name: "bKash", logo: bkashAsset.url, tint: "#E2136E", eta: "~5s" },
  { key: "nagad", name: "Nagad", logo: nagadAsset.url, tint: "#F7941D", eta: "~5s" },
  { key: "rocket", name: "Rocket", logo: rocketAsset.url, tint: "#8A2BE2", eta: "~10s" },
  { key: "upay", name: "Upay", logo: upayAsset.url, tint: "#22C55E", eta: "~10s" },
] as const;
const USDT_METHODS = [
  { key: "trc20", name: "USDT TRC20", sub: "TRC20 · Auto credit", logo: usdtAsset.url, tint: "#26A17B" },
  { key: "binance", name: "Binance Pay", sub: "BEP20 · Zero fee", logo: binanceAsset.url, tint: "#F0B90B" },
  { key: "novafi", name: "NovaFi Wallet", sub: "Web3 · Multi chain", logo: novafiAsset.url, tint: "#7C5CFF" },
] as const;
const BDT_AMOUNTS = [100, 500, 1000, 2000, 5000, 10000, 15000, 20000, 25000];
const USDT_AMOUNTS = [10, 20, 50, 100, 500, 1000];
const BDT_MIN = 100, BDT_MAX = 25_000;
const USDT_MIN = 10, USDT_MAX = 100_000;
const bdtSchema = z.number().min(BDT_MIN).max(BDT_MAX);
const usdtSchema = z.number().min(USDT_MIN).max(USDT_MAX);
const fmtBDT = (n: number) => `৳${n.toLocaleString("en-IN")}`;
const fmtUSDT = (n: number) => `${n.toLocaleString("en-IN")} USDT`;

export default function DepositCentre() {
  const navigate = useNavigate();
  const { formattedBalance } = useWalletDB();
  const [mode, setMode] = useState<"BDT" | "USDT">("BDT");
  const [bdtMethod, setBdtMethod] = useState<(typeof BDT_METHODS)[number]["key"]>("bkash");
  const [usdtMethod, setUsdtMethod] = useState<(typeof USDT_METHODS)[number]["key"]>("trc20");
  const [bdtAmount, setBdtAmount] = useState(1000);
  const [usdtAmount, setUsdtAmount] = useState(50);
  const [usdtOpen, setUsdtOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement | null>(null);
  const bdtValid = bdtSchema.safeParse(bdtAmount);
  const usdtValid = usdtSchema.safeParse(usdtAmount);
  const handleBdtDeposit = () => {
    if (!bdtValid.success) return toast.error("Invalid amount");
    navigate(`/wallet?tab=deposit&method=payfastflow-${bdtMethod}&amount=${bdtAmount}`);
  };
  const handleUsdtDeposit = () => {
    if (!usdtValid.success) return toast.error("Invalid amount");
    setUsdtOpen(true);
  };
  return (
    <div className="min-h-screen w-full text-white" style={{ background: "radial-gradient(1200px 800px at 50% -10%, #1a1030 0%, #0a0715 55%, #050308 100%)" }}>
      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 pb-20 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5"><ArrowLeft className="h-5 w-5" /></button>
          <button onClick={() => navigate("/wallet/history")} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold"><History className="h-4 w-4" /> History</button>
        </div>
        <div ref={selectorRef} />
        <div className="mb-4 rounded-[20px] border border-white/10 bg-white/5 p-4">
          <h1 className="text-2xl font-black">Fund Your Wallet</h1>
          <p className="text-sm text-white/60">Balance: {formattedBalance || "৳0"}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => setMode("BDT")} className="rounded-2xl px-3 py-3 text-sm font-bold">BDT Deposit</button>
            <button onClick={() => setMode("USDT")} className="rounded-2xl px-3 py-3 text-sm font-bold">USDT Deposit</button>
          </div>
        </div>
        {mode === "BDT" ? (
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {BDT_METHODS.map((m) => <button key={m.key} onClick={() => setBdtMethod(m.key)} className="rounded-2xl border border-white/10 p-3 text-left"><img src={m.logo} alt={m.name} className="h-9 w-9 rounded-xl" /><div className="font-bold">{m.name}</div></button>)}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">{BDT_AMOUNTS.map((a) => <button key={a} onClick={() => setBdtAmount(a)} className="rounded-2xl border border-white/10 py-3 font-bold">৳{a}</button>)}</div>
            <input value={bdtAmount} onChange={(e) => setBdtAmount(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)} className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3" />
            <button onClick={handleBdtDeposit} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-[#F3C144] to-[#22C55E] py-4 font-black text-black">DEPOSIT NOW</button>
          </div>
        ) : (
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {USDT_METHODS.map((m) => <button key={m.key} onClick={() => setUsdtMethod(m.key)} className="rounded-2xl border border-white/10 p-3 text-left"><img src={m.logo} alt={m.name} className="h-9 w-9 rounded-xl" /><div className="font-bold">{m.name}</div></button>)}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">{USDT_AMOUNTS.map((a) => <button key={a} onClick={() => setUsdtAmount(a)} className="rounded-2xl border border-white/10 py-3 font-bold">{a}</button>)}</div>
            <p className="mt-3 text-sm text-[#3AA0FF]">{fmtUSDT(usdtAmount)} = {fmtBDT(usdtAmount * USDT_TO_BDT)}</p>
            <button onClick={handleUsdtDeposit} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-[#26A17B] to-[#3AA0FF] py-4 font-black text-black">DEPOSIT NOW</button>
          </div>
        )}
      </div>
      {usdtOpen && (
        <div className="fixed inset-0 z-50 bg-black/80">
          <button onClick={() => setUsdtOpen(false)} className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2"><X className="h-5 w-5" /></button>
          <USDTDepositFlow onBack={() => setUsdtOpen(false)} onSuccess={() => setUsdtOpen(false)} />
        </div>
      )}
    </div>
  );
}
