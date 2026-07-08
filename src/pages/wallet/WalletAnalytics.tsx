/**
 * WalletAnalytics — /wallet/analytics
 * KPI stat cards + growth area chart + balance distribution donut.
 */
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Calendar, TrendingUp, TrendingDown, Award, Percent } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  WalletCanvas, SubHeader, GlassCard, fmtBDT, fadeUp, stagger,
} from "@/components/wallet/premium/shared";

const GROWTH = [
  { t: "00:00", v: 4500 }, { t: "03:00", v: 6800 }, { t: "06:00", v: 8200 },
  { t: "09:00", v: 11500 }, { t: "12:00", v: 15200 }, { t: "15:00", v: 18700 },
  { t: "18:00", v: 21400 }, { t: "21:00", v: 24100 }, { t: "24:00", v: 25850 },
];

const DIST = [
  { name: "Main Wallet",      value: 25850.50, color: "#10b981" },
  { name: "3rd Party Wallet", value: 18540.75, color: "#8b5cf6" },
  { name: "User Wallet",      value: 12450.30, color: "#0ea5e9" },
  { name: "Agent Wallet",     value: 8750.10,  color: "#f59e0b" },
];

const RANGE = ["Today", "Week", "Month", "Year"] as const;

function Stat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: "emerald" | "rose" | "amber" | "sky" }) {
  const map = {
    emerald: "text-emerald-300 border-emerald-500/40 from-emerald-500/15",
    rose:    "text-rose-300    border-rose-500/40    from-rose-500/15",
    amber:   "text-amber-300   border-amber-500/40   from-amber-500/15",
    sky:     "text-sky-300     border-sky-500/40     from-sky-500/15",
  }[color];
  return (
    <motion.div variants={fadeUp} className={`rounded-2xl border ${map} bg-gradient-to-b to-transparent bg-black/40 backdrop-blur-md p-3`}>
      <div className="flex items-center gap-1.5">
        <Icon className="h-4 w-4" strokeWidth={2.4} />
        <span className="text-[11px] font-black text-white/80">{label}</span>
      </div>
      <div className="text-[16px] font-black text-white mt-1.5 tabular-nums">৳ {value}</div>
    </motion.div>
  );
}

export default function WalletAnalytics() {
  const [range, setRange] = useState<typeof RANGE[number]>("Today");
  const total = useMemo(() => DIST.reduce((s, d) => s + d.value, 0), []);

  return (
    <>
      <Helmet><title>Wallet Analytics · GoLucky</title></Helmet>
      <WalletCanvas>
        <SubHeader
          title="Wallet Analytics"
          right={<button className="h-9 w-9 rounded-full border border-white/10 bg-black/40 flex items-center justify-center"><Calendar className="h-4 w-4 text-white/80" /></button>}
        />
        <motion.div initial="hidden" animate="show" variants={stagger} className="max-w-md mx-auto px-4 py-4 pb-16 space-y-4">
          {/* Range picker */}
          <motion.div variants={fadeUp}>
            <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md p-1 grid grid-cols-4 gap-1">
              {RANGE.map((r) => (
                <button key={r} onClick={() => setRange(r)}
                  className={`rounded-xl py-2 text-[12px] font-black transition ${range === r ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40" : "text-white/70"}`}>
                  {r}
                </button>
              ))}
            </div>
          </motion.div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-2">
            <Stat icon={TrendingUp}   label="Total Deposit"    value={fmtBDT(45850.50)} color="emerald" />
            <Stat icon={TrendingDown} label="Total Withdraw"   value={fmtBDT(25650.30)} color="rose"    />
            <Stat icon={Award}        label="Total Profit"     value={fmtBDT(12450.20)} color="sky"     />
            <Stat icon={Percent}      label="Total Commission" value={fmtBDT(8750.60)}  color="amber"   />
          </div>

          {/* Growth chart */}
          <motion.div variants={fadeUp}>
            <GlassCard glow="emerald" className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[12px] font-black text-white/85">Wallet Growth</div>
                <div className="text-[12px] font-black text-emerald-300 tabular-nums">৳ {fmtBDT(25850.50)}</div>
              </div>
              <div className="h-40 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={GROWTH}>
                    <defs>
                      <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"  stopColor="#10b981" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} axisLine={false} tickLine={false} width={34} tickFormatter={(v) => `${v / 1000}K`} />
                    <Tooltip contentStyle={{ background: "#0b0f18", border: "1px solid rgba(16,185,129,0.35)", borderRadius: 12, fontSize: 12 }} />
                    <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fill="url(#gArea)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>

          {/* Distribution donut */}
          <motion.div variants={fadeUp}>
            <GlassCard glow="violet" className="p-3">
              <div className="text-[12px] font-black text-white/85 mb-2">Balance Distribution</div>
              <div className="flex items-center gap-3">
                <div className="relative h-36 w-36 shrink-0">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={DIST} innerRadius={44} outerRadius={64} paddingAngle={2} dataKey="value" stroke="none">
                        {DIST.map((d) => <Cell key={d.name} fill={d.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-[10px] text-white/60">Total Balance</div>
                    <div className="text-[13px] font-black tabular-nums">৳ {fmtBDT(total)}</div>
                  </div>
                </div>
                <div className="flex-1 space-y-1.5">
                  {DIST.map((d) => {
                    const pct = ((d.value / total) * 100).toFixed(1);
                    return (
                      <div key={d.name} className="flex items-center gap-2 text-[11px]">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="flex-1 text-white/80">{d.name}</span>
                        <span className="font-black tabular-nums">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </WalletCanvas>
    </>
  );
}
