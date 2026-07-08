import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Users,
  Wallet,
  TrendingUp,
  Clock,
  DollarSign,
  ShieldCheck,
  FileText,
  Settings,
  Layers,
  CreditCard,
  Handshake,
  ListChecks,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

/**
 * Lucky Hub – Central fintech-style admin dashboard for GoLuckyBD.
 * All modules link into existing admin pages; no data is created here.
 */

type Stats = {
  totalUsers: number;
  totalDepositsBdt: number;
  activeFd: number;
  pendingFdWithdrawals: number;
  pendingUsdtDeposits: number;
  pendingAgentApps: number;
  usdtRate: number;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(n || 0);

const NAV = [
  { section: "Overview", items: [
    { label: "Lucky Hub Dashboard", to: "/admin/lucky-hub-central", icon: LayoutDashboard, end: true },
    { label: "Users Management", to: "/admin/users", icon: Users },
  ]},
  { section: "Payment Management", items: [
    { label: "FD Deposits (USDT)", to: "/admin/usdt-deposits", icon: CreditCard },
    { label: "Agent Payments (Separate)", to: "/admin/agent-payments", icon: Handshake },
    { label: "Payment Logs (All)", to: "/admin/payment-management", icon: ListChecks },
  ]},
  { section: "Finance", items: [
    { label: "Fixed Deposit System", to: "/fixed-deposits", icon: Layers },
    { label: "Withdrawals Control", to: "/admin/withdraws", icon: Wallet },
    { label: "USDT Rate Control", to: "/admin/usdt-rate", icon: TrendingUp },
    { label: "Profit Settings", to: "/admin/settings", icon: BarChart3 },
  ]},
  { section: "Agent Management", items: [
    { label: "Agent Applications", to: "/admin/agents", icon: Handshake },
    { label: "Agent Payments History", to: "/admin/agent-payments", icon: ListChecks },
    { label: "Active Agents", to: "/admin/agents", icon: ShieldCheck },
  ]},
  { section: "System", items: [
    { label: "Admin Users", to: "/admin/admin-users", icon: ShieldCheck },
    { label: "System Logs", to: "/admin/audit-logs", icon: FileText },
    { label: "Admin Settings", to: "/admin/settings", icon: Settings },
  ]},
];

export default function LuckyHubCentral() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalDepositsBdt: 0,
    activeFd: 0,
    pendingFdWithdrawals: 0,
    pendingUsdtDeposits: 0,
    pendingAgentApps: 0,
    usdtRate: 130,
  });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [rateRes, usersRes, fdActive, wdPending, usdtPending, agentPending, verifiedPayments] =
        await Promise.all([
          supabase.rpc("get_usdt_rate"),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("fixed_deposits").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("fd_withdrawals").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("agent_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("payments").select("amount").eq("status", "verified"),
        ]);

      const rate = Number(rateRes.data ?? 130);
      const usdtTotal = (verifiedPayments.data || []).reduce(
        (a: number, r: any) => a + Number(r.amount || 0),
        0,
      );

      setStats({
        totalUsers: usersRes.count || 0,
        totalDepositsBdt: usdtTotal * rate,
        activeFd: fdActive.count || 0,
        pendingFdWithdrawals: wdPending.count || 0,
        pendingUsdtDeposits: usdtPending.count || 0,
        pendingAgentApps: agentPending.count || 0,
        usdtRate: rate,
      });
    } catch (e) {
      console.error("lucky-hub-central load", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const cards = [
    { label: "Total Users", value: fmt(stats.totalUsers), icon: Users, tone: "text-sky-400" },
    { label: "Total Deposits (BDT)", value: `৳${fmt(stats.totalDepositsBdt)}`, icon: Wallet, tone: "text-emerald-400" },
    { label: "Active Fixed Deposits", value: fmt(stats.activeFd), icon: Layers, tone: "text-amber-400" },
    { label: "Pending Withdrawals", value: fmt(stats.pendingFdWithdrawals), icon: Clock, tone: "text-orange-400" },
    { label: "Pending USDT Deposits", value: fmt(stats.pendingUsdtDeposits), icon: CreditCard, tone: "text-cyan-400" },
    { label: "Agent Applications", value: fmt(stats.pendingAgentApps), icon: Handshake, tone: "text-fuchsia-400" },
    { label: "System Profit Exposure", value: `৳${fmt(stats.totalDepositsBdt * 0.12)}`, icon: AlertTriangle, tone: "text-rose-400" },
    { label: "USDT Rate", value: `1 USDT = ৳${stats.usdtRate}`, icon: DollarSign, tone: "text-violet-400" },
  ];

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-white/5 bg-[#0e1729]/80 backdrop-blur">
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-sky-400" />
              <div>
                <div className="text-sm font-bold tracking-wide">LUCKY HUB</div>
                <div className="text-[10px] uppercase text-slate-400">GoLuckyBD Control Center</div>
              </div>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-4">
            {NAV.map((sec) => (
              <div key={sec.section}>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 px-2 mb-1">
                  {sec.section}
                </div>
                <div className="space-y-1">
                  {sec.items.map((it) => (
                    <NavLink
                      key={it.to}
                      to={it.to}
                      end={(it as any).end}
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-md px-2 py-2 text-sm transition ${
                          isActive
                            ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                            : "text-slate-300 hover:bg-white/5"
                        }`
                      }
                    >
                      <it.icon className="h-4 w-4" />
                      <span>{it.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="p-3 text-[10px] text-slate-500 border-t border-white/5">
            v1.0 · Central Brain
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 p-4 md:p-6 space-y-6">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Lucky Hub · Dashboard</h1>
              <p className="text-xs md:text-sm text-slate-400">
                Central brain of the GoLuckyBD platform — live analytics & controls.
              </p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </header>

          {/* Stat grid */}
          <section className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {cards.map((c) => (
              <div
                key={c.label}
                className="rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-4 backdrop-blur hover:border-sky-500/30 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400">
                    {c.label}
                  </span>
                  <c.icon className={`h-4 w-4 ${c.tone}`} />
                </div>
                <div className="mt-2 text-lg md:text-xl font-bold tabular-nums">
                  {c.value}
                </div>
              </div>
            ))}
          </section>

          {/* Payment management shortcut */}
          <section className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "FD Deposits",
                desc: "Verify pending USDT deposits. Approve to auto-create FD, reject to fail.",
                to: "/admin/usdt-deposits",
                icon: CreditCard,
                accent: "from-sky-500/20 to-cyan-500/10 border-sky-500/30",
              },
              {
                title: "Agent Payments",
                desc: "Approve agent application fees to activate accounts.",
                to: "/admin/agent-payments",
                icon: Handshake,
                accent: "from-fuchsia-500/20 to-pink-500/10 border-fuchsia-500/30",
              },
              {
                title: "Payment Logs",
                desc: "Full transaction history across FD and Agent payments.",
                to: "/admin/payment-management",
                icon: ListChecks,
                accent: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
              },
            ].map((m) => (
              <Link
                key={m.to}
                to={m.to}
                className={`rounded-xl border p-5 bg-gradient-to-br ${m.accent} hover:scale-[1.01] transition`}
              >
                <m.icon className="h-6 w-6 mb-3" />
                <div className="text-base font-semibold">{m.title}</div>
                <div className="text-xs text-slate-300 mt-1">{m.desc}</div>
                <div className="mt-3 text-xs text-sky-300">Open module →</div>
              </Link>
            ))}
          </section>

          {/* Mobile nav fallback */}
          <section className="lg:hidden">
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <div className="text-xs text-slate-400 mb-2">Modules</div>
              <div className="grid grid-cols-2 gap-2">
                {NAV.flatMap((s) => s.items).map((it) => (
                  <Link
                    key={it.to}
                    to={it.to}
                    className="flex items-center gap-2 rounded-md border border-white/5 bg-white/[0.03] px-2 py-2 text-xs hover:bg-white/10"
                  >
                    <it.icon className="h-3.5 w-3.5 text-sky-400" />
                    <span className="truncate">{it.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <footer className="pt-4 text-[11px] text-slate-500">
            🔐 No FD is created without payment approval. All admin actions are logged.
          </footer>
        </main>
      </div>
    </div>
  );
}
