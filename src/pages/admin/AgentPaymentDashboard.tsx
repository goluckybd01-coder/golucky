import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Clock,
  Wallet,
  ShieldCheck,
  XCircle,
  CalendarDays,
  CalendarRange,
  TrendingUp,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

type Stats = {
  totalApplications: number;
  pendingPayments: number;
  paymentReceived: number;
  paymentVerified: number;
  paymentRejected: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalRevenue: number;
};

type ChartPoint = { date: string; revenue: number };

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

function AnimatedCounter({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = display;
    const duration = 900;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const formatted = Number.isInteger(value)
    ? Math.round(display).toLocaleString()
    : display.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return (
    <span className="tabular-nums">
      {prefix}
      {formatted}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  prefix,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  prefix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-black/80 via-neutral-950 to-black p-5 shadow-lg backdrop-blur"
    >
      <div
        className={`absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-30 ${accent}`}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            <AnimatedCounter value={value} prefix={prefix} />
          </p>
        </div>
        <div
          className={`rounded-xl border border-white/5 bg-white/5 p-2.5 ${accent.replace("bg-", "text-")}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

export default function AgentPaymentDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalApplications: 0,
    pendingPayments: 0,
    paymentReceived: 0,
    paymentVerified: 0,
    paymentRejected: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
  });
  const [chart, setChart] = useState<ChartPoint[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [{ count: appCount }, { data: payments }] = await Promise.all([
        supabase.from("agent_applications").select("id", { count: "exact", head: true }),
        supabase
          .from("agent_application_payments")
          .select("status,amount_usdt,created_at")
          .order("created_at", { ascending: false })
          .limit(5000),
      ]);

      const p = payments ?? [];
      const today = startOfToday().getTime();
      const monthStart = startOfMonth().getTime();

      let pending = 0,
        received = 0,
        verified = 0,
        rejected = 0;
      let todayRev = 0,
        monthRev = 0,
        totalRev = 0;
      const perDay = new Map<string, number>();

      for (const r of p) {
        const t = new Date(r.created_at).getTime();
        const amt = Number(r.amount_usdt) || 0;
        if (r.status === "pending") pending += 1;
        else if (r.status === "approved") {
          verified += 1;
          received += 1;
          totalRev += amt;
          if (t >= today) todayRev += amt;
          if (t >= monthStart) monthRev += amt;
        } else if (r.status === "rejected") rejected += 1;
        else if (r.status === "more_info") received += 1;

        // 30-day chart – count approved USDT per day
        if (r.status === "approved") {
          const day = new Date(r.created_at);
          day.setHours(0, 0, 0, 0);
          const key = day.toISOString().slice(0, 10);
          perDay.set(key, (perDay.get(key) ?? 0) + amt);
        }
      }

      // Build 30-day chart series
      const series: ChartPoint[] = [];
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        series.push({
          date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          revenue: perDay.get(key) ?? 0,
        });
      }

      setStats({
        totalApplications: appCount ?? 0,
        pendingPayments: pending,
        paymentReceived: received + verified + rejected,
        paymentVerified: verified,
        paymentRejected: rejected,
        todayRevenue: todayRev,
        monthlyRevenue: monthRev,
        totalRevenue: totalRev,
      });
      setChart(series);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("agent-payments-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_application_payments" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const cards = useMemo(
    () => [
      { label: "Total Applications", value: stats.totalApplications, icon: Users, accent: "bg-emerald-500" },
      { label: "Pending Payments", value: stats.pendingPayments, icon: Clock, accent: "bg-amber-500" },
      { label: "Payment Received", value: stats.paymentReceived, icon: Wallet, accent: "bg-sky-500" },
      { label: "Payment Verified", value: stats.paymentVerified, icon: ShieldCheck, accent: "bg-emerald-500" },
      { label: "Payment Rejected", value: stats.paymentRejected, icon: XCircle, accent: "bg-rose-500" },
      { label: "Today's Revenue", value: stats.todayRevenue, icon: CalendarDays, accent: "bg-yellow-500", prefix: "$" },
      { label: "Monthly Revenue", value: stats.monthlyRevenue, icon: CalendarRange, accent: "bg-yellow-500", prefix: "$" },
      { label: "Total Revenue", value: stats.totalRevenue, icon: TrendingUp, accent: "bg-yellow-500", prefix: "$" },
    ],
    [stats]
  );

  if (loading && stats.totalApplications === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-neutral-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading gateway dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={c.value}
            icon={c.icon}
            accent={c.accent}
            prefix={c.prefix}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-black/80 via-neutral-950 to-black p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Revenue Analytics</h3>
            <p className="text-xs text-neutral-400">
              Approved USDT payments — last 30 days
            </p>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
            TRC20
          </span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#0a0a0a",
                  border: "1px solid #10b98133",
                  borderRadius: 12,
                  color: "#fff",
                }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#revGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
