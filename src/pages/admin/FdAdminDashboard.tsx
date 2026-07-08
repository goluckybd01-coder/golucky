import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  DollarSign,
  ShieldCheck,
  Settings,
  FileText,
  Layers,
  RefreshCw,
} from "lucide-react";

type Stats = {
  totalDepositsBdt: number;
  totalUsers: number;
  activeFd: number;
  pendingWithdrawals: number;
  earlyWithdrawRequests: number;
  usdtRate: number;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(n || 0);

const menu = [
  { label: "Payment Management", to: "/admin/payment-management", icon: DollarSign },
  { label: "USDT Deposits", to: "/admin/usdt-deposits", icon: DollarSign },
  { label: "Fixed Deposits (User View)", to: "/fixed-deposits", icon: Layers },
  { label: "Withdrawals", to: "/admin/withdraws", icon: Wallet },
  { label: "USDT Rate Control", to: "/admin/usdt-rate", icon: TrendingUp },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Admin Users", to: "/admin/admin-users", icon: ShieldCheck },
  { label: "Audit Logs", to: "/admin/audit-logs", icon: FileText },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

export default function FdAdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalDepositsBdt: 0,
    totalUsers: 0,
    activeFd: 0,
    pendingWithdrawals: 0,
    earlyWithdrawRequests: 0,
    usdtRate: 130,
  });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [
        rateRes,
        usersRes,
        fdActiveRes,
        wdPendingRes,
        wdEarlyRes,
        usdtVerifiedRes,
      ] = await Promise.all([
        supabase.rpc("get_usdt_rate"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase
          .from("fixed_deposits")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("fd_withdrawals")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("fd_withdrawals")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .eq("type", "early"),
        supabase
          .from("payments")
          .select("amount")
          .eq("status", "verified"),
      ]);

      const rate = Number(rateRes.data ?? 130);
      const usdtVerifiedTotal =
        (usdtVerifiedRes.data || []).reduce(
          (a: number, r: any) => a + Number(r.amount || 0),
          0,
        );

      setStats({
        totalDepositsBdt: usdtVerifiedTotal * rate,
        totalUsers: usersRes.count || 0,
        activeFd: fdActiveRes.count || 0,
        pendingWithdrawals: wdPendingRes.count || 0,
        earlyWithdrawRequests: wdEarlyRes.count || 0,
        usdtRate: rate,
      });
    } catch (e) {
      console.error("fd-dashboard load", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cards = [
    {
      label: "Total Deposits (BDT)",
      value: `৳${fmt(stats.totalDepositsBdt)}`,
      icon: Wallet,
      accent: "text-emerald-400",
    },
    {
      label: "Total Users",
      value: fmt(stats.totalUsers),
      icon: Users,
      accent: "text-sky-400",
    },
    {
      label: "Active FDs",
      value: fmt(stats.activeFd),
      icon: TrendingUp,
      accent: "text-amber-400",
    },
    {
      label: "Pending Withdrawals",
      value: fmt(stats.pendingWithdrawals),
      icon: Clock,
      accent: "text-orange-400",
    },
    {
      label: "Early Withdraw Requests",
      value: fmt(stats.earlyWithdrawRequests),
      icon: AlertTriangle,
      accent: "text-rose-400",
    },
    {
      label: "USDT Rate",
      value: `1 USDT = ৳${stats.usdtRate}`,
      icon: DollarSign,
      accent: "text-violet-400",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📊 FD Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live overview of deposits, FDs, withdrawals and USDT rate.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{c.label}</span>
                <c.icon className={`h-4 w-4 ${c.accent}`} />
              </div>
              <div className="mt-2 text-lg font-bold tabular-nums">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/admin/usdt-deposits">Verify USDT Deposits</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/admin/withdraws">Check Withdrawals</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/admin/usdt-rate">Update USDT Rate</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Menu grid */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Modules</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {menu.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <m.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{m.label}</span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
