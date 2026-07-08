/**
 * WalletTransactionHistory — /wallet/history
 * Filter tabs + colored txn rows with icon, amount, status.
 */
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Filter, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Award, Gift, Gamepad2 } from "lucide-react";
import {
  WalletCanvas, SubHeader, fmtBDT, fadeUp, stagger,
} from "@/components/wallet/premium/shared";

type Kind = "Deposit" | "Withdraw" | "Transfer" | "Commission" | "Bonus" | "Game";
type Status = "Success" | "Failed" | "Pending";

interface Txn {
  kind: Kind; via: string; amount: number; ts: string; status: Status; ref: string;
}

const TXNS: Txn[] = [
  { kind: "Deposit",    via: "From bKash",         amount: 5000,    ts: "12 May 2024, 10:45 AM", status: "Success", ref: "GL12345678" },
  { kind: "Withdraw",   via: "To Nagad",           amount: 3500,    ts: "12 May 2024, 09:30 AM", status: "Success", ref: "GL12345677" },
  { kind: "Transfer",   via: "To User: Rasel Ahmed", amount: 2000,  ts: "11 May 2024, 08:15 PM", status: "Success", ref: "GL12345676" },
  { kind: "Commission", via: "Refer Commission",   amount: 750.50,  ts: "11 May 2024, 07:10 PM", status: "Success", ref: "GL12345675" },
  { kind: "Bonus",      via: "Welcome Bonus",      amount: 500,     ts: "10 May 2024, 06:40 PM", status: "Success", ref: "GL12345674" },
  { kind: "Game",       via: "Pragmatic Play",     amount: 1250.30, ts: "10 May 2024, 05:20 PM", status: "Success", ref: "GL12345673" },
  { kind: "Withdraw",   via: "To Bank",            amount: 4000,    ts: "10 May 2024, 04:15 PM", status: "Failed",  ref: "GL12345672" },
  { kind: "Deposit",    via: "From Rocket",        amount: 2500,    ts: "12 May 2024, 08:15 PM", status: "Success", ref: "GL12345671" },
];

const FILTERS = ["All", "Deposit", "Withdraw", "Transfer", "Commission"] as const;

const KIND_META: Record<Kind, { icon: any; color: string; ring: string; sign: 1 | -1 }> = {
  Deposit:    { icon: ArrowDownLeft,  color: "text-emerald-300", ring: "border-emerald-500/40 bg-emerald-500/15", sign: 1  },
  Withdraw:   { icon: ArrowUpRight,   color: "text-rose-300",    ring: "border-rose-500/40 bg-rose-500/15",       sign: -1 },
  Transfer:   { icon: ArrowLeftRight, color: "text-sky-300",     ring: "border-sky-500/40 bg-sky-500/15",         sign: -1 },
  Commission: { icon: Award,          color: "text-amber-300",   ring: "border-amber-500/40 bg-amber-500/15",     sign: 1  },
  Bonus:      { icon: Gift,           color: "text-violet-300",  ring: "border-violet-500/40 bg-violet-500/15",   sign: 1  },
  Game:       { icon: Gamepad2,       color: "text-fuchsia-300", ring: "border-fuchsia-500/40 bg-fuchsia-500/15", sign: 1  },
};

const STATUS_COLOR: Record<Status, string> = {
  Success: "text-emerald-300",
  Failed:  "text-rose-400",
  Pending: "text-amber-300",
};

export default function WalletTransactionHistory() {
  const [f, setF] = useState<typeof FILTERS[number]>("All");
  const list = useMemo(() => f === "All" ? TXNS : TXNS.filter((t) => t.kind === f), [f]);

  return (
    <>
      <Helmet><title>Transaction History · GoLucky</title></Helmet>
      <WalletCanvas>
        <SubHeader
          title="Transaction History"
          right={<button className="h-9 w-9 rounded-full border border-white/10 bg-black/40 flex items-center justify-center"><Filter className="h-4 w-4 text-white/80" /></button>}
        />
        <div className="max-w-md mx-auto px-4 py-4 pb-16">
          {/* Filter tabs */}
          <div className="sticky top-14 z-10 -mx-4 px-4 pb-3 backdrop-blur-xl bg-[#05070d]/80">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {FILTERS.map((x) => (
                <button key={x} onClick={() => setF(x)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-black border transition ${
                    f === x
                      ? "border-emerald-400 bg-emerald-500/15 text-emerald-200"
                      : "border-white/10 bg-black/40 text-white/70 hover:border-white/20"
                  }`}>
                  {x}
                </button>
              ))}
            </div>
          </div>

          <motion.ul initial="hidden" animate="show" variants={stagger} className="space-y-2">
            {list.map((t, i) => {
              const m = KIND_META[t.kind];
              const Icon = m.icon;
              const sign = m.sign > 0 ? "+" : "-";
              return (
                <motion.li variants={fadeUp} key={i}
                  className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-md p-3 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl border ${m.ring} flex items-center justify-center ${m.color}`}>
                    <Icon className="h-5 w-5" strokeWidth={2.4} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-black text-white">{t.kind}</div>
                    <div className="text-[11px] text-white/60 truncate">{t.via}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{t.ts}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-[13px] font-black tabular-nums ${m.color}`}>{sign}৳ {fmtBDT(t.amount)}</div>
                    <div className={`text-[10px] font-bold ${STATUS_COLOR[t.status]}`}>{t.status}</div>
                    <div className="text-[9px] text-white/40 mt-0.5">TXN# {t.ref}</div>
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        </div>
      </WalletCanvas>
    </>
  );
}
