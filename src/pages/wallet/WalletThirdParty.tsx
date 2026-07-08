/**
 * WalletThirdParty — /wallet/third-party
 * Shows provider wallets with per-provider transfer-back to Main.
 */
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Clock, Menu } from "lucide-react";
import { useDualWallet } from "@/hooks/useDualWallet";
import { transferFromProvider } from "@/lib/dualWalletService";
import {
  WalletCanvas, SubHeader, GlassCard, GoldButton, fmtBDT, fadeUp, stagger,
} from "@/components/wallet/premium/shared";

const PROVIDERS = [
  { key: "evolution",  name: "Evolution",     initial: "E", amount: 2450.50, color: "amber"   },
  { key: "pragmatic",  name: "Pragmatic Play", initial: "P", amount: 3850.75, color: "rose"    },
  { key: "jili",       name: "Jili",           initial: "J", amount: 2350.20, color: "amber"   },
  { key: "pgsoft",     name: "PG Soft",        initial: "PG", amount: 4250.60, color: "emerald" },
  { key: "spribe",     name: "Spribe",         initial: "S", amount: 2150.40, color: "violet"  },
  { key: "smartsoft",  name: "SmartSoft",      initial: "SS", amount: 1488.30, color: "sky"    },
] as const;

const colorMap = {
  amber:   "from-amber-500/25 to-amber-500/5 text-amber-300 border-amber-500/40",
  rose:    "from-rose-500/25 to-rose-500/5 text-rose-300 border-rose-500/40",
  emerald: "from-emerald-500/25 to-emerald-500/5 text-emerald-300 border-emerald-500/40",
  violet:  "from-violet-500/25 to-violet-500/5 text-violet-300 border-violet-500/40",
  sky:     "from-sky-500/25 to-sky-500/5 text-sky-300 border-sky-500/40",
} as const;

export default function WalletThirdParty() {
  const w = useDualWallet();
  const [pulling, setPulling] = useState<string | null>(null);

  const total = w.providerBalance || PROVIDERS.reduce((s, p) => s + p.amount, 0);

  const pullOne = async (p: typeof PROVIDERS[number]) => {
    setPulling(p.key);
    const res = await transferFromProvider(p.amount, p.key);
    setPulling(null);
    res.success ? toast.success(`${p.name} pulled to Main`) : toast.error(res.error ?? "Transfer failed");
    w.refresh();
  };

  const pullAll = async () => {
    setPulling("all");
    const res = await transferFromProvider(total, "generic");
    setPulling(null);
    res.success ? toast.success("All balances pulled to Main") : toast.error(res.error ?? "Transfer failed");
    w.refresh();
  };

  return (
    <>
      <Helmet><title>3rd Party Wallet · GoLucky</title></Helmet>
      <WalletCanvas>
        <SubHeader
          title="3rd Party Wallet"
          right={
            <div className="flex gap-1.5">
              <button className="h-9 w-9 rounded-full border border-white/10 bg-black/40 flex items-center justify-center"><Clock className="h-4 w-4 text-amber-300" /></button>
              <button className="h-9 w-9 rounded-full border border-white/10 bg-black/40 flex items-center justify-center"><Menu className="h-4 w-4 text-white/80" /></button>
            </div>
          }
        />
        <motion.div initial="hidden" animate="show" variants={stagger}
          className="max-w-md mx-auto px-4 py-4 pb-28 space-y-4">
          <motion.div variants={fadeUp}>
            <GlassCard glow="emerald" className="p-4 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(16,185,129,0.28),transparent_55%)]" />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-black tracking-widest text-emerald-300/90">TOTAL 3RD PARTY BALANCE</div>
                  <div className="mt-2 text-[32px] leading-none font-black text-white tabular-nums">৳ {fmtBDT(total)}</div>
                  <div className="inline-flex mt-3 items-center gap-1.5 rounded-full border border-emerald-500/40 bg-black/50 px-2.5 py-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-200">Auto Sync : ON</span>
                  </div>
                </div>
                <div className="text-5xl drop-shadow-[0_0_25px_rgba(16,185,129,0.5)]">🎮</div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={fadeUp}>
            <div className="text-[12px] font-black tracking-widest text-white/80 mb-2">PROVIDER WALLETS</div>
            <div className="space-y-2">
              {PROVIDERS.map((p) => (
                <motion.div key={p.key} variants={fadeUp}
                  className={`rounded-2xl border bg-gradient-to-r ${colorMap[p.color]} bg-black/40 backdrop-blur-md p-3 flex items-center gap-3`}
                >
                  <div className={`h-11 w-11 rounded-xl bg-black/70 border border-white/10 flex items-center justify-center font-black text-[13px]`}>
                    {p.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-black text-white">{p.name}</div>
                    <div className="text-[12px] font-black text-white/80 tabular-nums mt-0.5">৳ {fmtBDT(p.amount)}</div>
                  </div>
                  <button
                    disabled={pulling === p.key}
                    onClick={() => pullOne(p)}
                    className="rounded-full border border-emerald-400/50 px-3 py-1.5 text-[11px] font-black text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
                  >
                    {pulling === p.key ? "…" : "Transfer"}
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-xl bg-black/70 border-t border-white/[0.06]">
          <div className="max-w-md mx-auto px-4 py-3">
            <GoldButton onClick={pullAll}>{pulling === "all" ? "TRANSFERRING…" : "TRANSFER TO MAIN WALLET"}</GoldButton>
          </div>
        </div>
      </WalletCanvas>
    </>
  );
}
