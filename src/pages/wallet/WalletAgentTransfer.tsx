/**
 * WalletAgentTransfer — /wallet/transfer
 * Agent → User instant transfer with search, quick amount chips, remarks.
 */
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useState } from "react";
import { Search, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import {
  WalletCanvas, SubHeader, GlassCard, GoldButton, fmtBDT, fadeUp, stagger,
} from "@/components/wallet/premium/shared";

const QUICK = [500, 1000, 5000, 10000];

const DEMO_USER = {
  id: "GL99887766",
  name: "Rasel Ahmed",
  vip: 3,
  phone: "+880 1712 345 678",
  balance: 12450.30,
  kyc: "Verified",
  registered: "12 May 2024",
  lastLogin: "Today, 10:45 AM",
  agent: "Abdul Karim",
  status: "Active",
};

function Row({ k, v, accent = "text-white" }: { k: string; v: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[12px] text-white/60">{k}</span>
      <span className={`text-[12px] font-bold ${accent} tabular-nums`}>{v}</span>
    </div>
  );
}

export default function WalletAgentTransfer() {
  const [q, setQ] = useState("");
  const [amount, setAmount] = useState<string>("5000");
  const [remarks, setRemarks] = useState<string>("Bonus for good playing");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const n = Number(amount);
    if (!n || n < 100) return toast.error("Minimum ৳100 required");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    toast.success(`৳ ${fmtBDT(n)} sent to ${DEMO_USER.name}`);
  };

  return (
    <>
      <Helmet><title>Agent → User Transfer · GoLucky</title></Helmet>
      <WalletCanvas>
        <SubHeader title="Agent To User Transfer" />
        <motion.div initial="hidden" animate="show" variants={stagger}
          className="max-w-md mx-auto px-4 py-4 pb-28 space-y-4">
          <motion.div variants={fadeUp}>
            <div className="text-[11px] font-black tracking-widest text-white/70 mb-2">SEARCH USER</div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md px-3 py-2.5">
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Search by User ID / Username / Phone"
                className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-white/40"
              />
              <button className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                <Search className="h-4 w-4 text-emerald-300" />
              </button>
            </div>
          </motion.div>
          <motion.div variants={fadeUp}>
            <div className="text-[11px] font-black tracking-widest text-white/70 mb-2">USER DETAILS</div>
            <GlassCard glow="emerald" className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-lg">👤</div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-black text-white">{DEMO_USER.name}</span>
                    <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div className="text-[10px] text-white/60 mt-0.5">UID: {DEMO_USER.id}</div>
                </div>
                <span className="rounded-full border border-amber-400/60 bg-black/60 px-2 py-0.5 text-[10px] font-black text-amber-300">VIP {DEMO_USER.vip}</span>
              </div>
              <div className="mt-3 border-t border-white/[0.06] pt-2">
                <Row k="Phone" v={DEMO_USER.phone} />
                <Row k="Current Balance" v={`৳ ${fmtBDT(DEMO_USER.balance)}`} />
                <Row k="KYC Status" v={DEMO_USER.kyc} accent="text-emerald-300" />
                <Row k="Registration Date" v={DEMO_USER.registered} />
                <Row k="Last Login" v={DEMO_USER.lastLogin} />
                <Row k="Agent" v={DEMO_USER.agent} />
                <Row k="Status" v={DEMO_USER.status} accent="text-emerald-300" />
              </div>
            </GlassCard>
          </motion.div>
          <motion.div variants={fadeUp}>
            <div className="text-[11px] font-black tracking-widest text-white/70 mb-2">TRANSFER AMOUNT</div>
            <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md p-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="text-emerald-300 font-black">৳</span>
                <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1 bg-transparent outline-none text-[18px] font-black tabular-nums" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK.map((qAmt) => {
                  const active = String(qAmt) === amount;
                  return (
                    <button key={qAmt} onClick={() => setAmount(String(qAmt))} className={`rounded-full px-3 py-1.5 text-[12px] font-black border tabular-nums transition ${active ? "border-emerald-400 bg-emerald-500/15 text-emerald-200" : "border-white/10 bg-black/40 text-white/80 hover:border-white/30"}`}>
                      ৳{qAmt.toLocaleString()}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
          <motion.div variants={fadeUp}>
            <div className="text-[11px] font-black tracking-widest text-white/70 mb-2">Remarks (Optional)</div>
            <input value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/50 px-3 py-3 text-[13px] outline-none focus:border-emerald-400/60" />
          </motion.div>
        </motion.div>
        <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-xl bg-black/70 border-t border-white/[0.06]">
          <div className="max-w-md mx-auto px-4 py-3">
            <GoldButton onClick={submit}>{loading ? "PROCESSING…" : "CONTINUE"}</GoldButton>
            <div className="mt-2 text-center text-[11px] text-white/60 flex items-center justify-center gap-1">
              <BadgeCheck className="h-3 w-3 text-emerald-400" /> Secure Transfer
            </div>
          </div>
        </div>
      </WalletCanvas>
    </>
  );
}
