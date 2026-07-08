import { useEffect, useState, lazy, Suspense } from "react";
import { useAdminOverview } from "@/hooks/useAdminOverview";
import { MetricTile, formatBDT, formatInt } from "@/components/admin/dashboard/MetricTile";
import { GameStatCard } from "@/components/admin/dashboard/GameStatCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Wallet,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  DollarSign,
  Activity,
  Gift,
  RefreshCw,
} from "lucide-react";
import { fetchFinnhubPrices, type LivePrice } from "@/lib/finnhubPrices";

const GAME_LIST: { key: string; title: string }[] = [
  { key: "wingo", title: "WinGo" },
  { key: "k3", title: "K3" },
  { key: "5d", title: "5D" },
  { key: "trxwin", title: "TRX Win" },
  { key: "crash", title: "Crash" },
  { key: "aviator", title: "Aviator" },
  { key: "motorace", title: "MotoRace" },
  { key: "videowingo", title: "Video WinGo" },
];

const WALLETS: { key: keyof import("@/hooks/useAdminOverview").AdminOverview["wallets"]; label: string }[] = [
  { key: "novafi_wallet", label: "NovaFi" },
  { key: "admin_wallet", label: "Admin" },
  { key: "agent_wallet", label: "Agent" },
  { key: "user_wallet", label: "User" },
  { key: "bonus_wallet", label: "Bonus" },
  { key: "commission_wallet", label: "Commission" },
  { key: "trading_wallet", label: "Trading" },
];

const BONUSES: { key: string; label: string }[] = [
  { key: "welcome_bonus", label: "Welcome" },
  { key: "deposit_bonus", label: "Deposit" },
  { key: "referral_bonus", label: "Referral" },
  { key: "vip_bonus", label: "VIP" },
  { key: "cashback_bonus", label: "Cashback" },
  { key: "daily_bonus", label: "Daily" },
  { key: "weekly_bonus", label: "Weekly" },
  { key: "monthly_bonus", label: "Monthly" },
  { key: "festival_bonus", label: "Festival" },
  { key: "manual_bonus", label: "Manual" },
];

export default function DashboardOverview() {
  const { data, isLoading, error, isFetching, refetch } = useAdminOverview(10_000);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load dashboard: {(error as Error)?.message || "Unknown error"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const fin = data.financial;
  const tr = data.trading;

  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live overview • updated {new Date(data.generated_at).toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md bg-muted hover:bg-muted/70"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Financial Dashboard */}
      <section>
        <SectionTitle icon={<DollarSign className="h-4 w-4" />} title="Financial Dashboard" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricTile label="Total User Balance" value={formatBDT(fin.total_user_balance)} icon={<Users className="h-4 w-4" />} />
          <MetricTile label="Total Agent Balance" value={formatBDT(fin.total_agent_balance)} icon={<Users className="h-4 w-4" />} tone="info" />
          <MetricTile label="Total Bonus" value={formatBDT(fin.total_bonus_balance)} icon={<Gift className="h-4 w-4" />} tone="warning" />
          <MetricTile label="Company Profit" value={formatBDT(fin.total_company_profit)} icon={<TrendingUp className="h-4 w-4" />} tone="success" />
          <MetricTile label="Company Loss" value={formatBDT(fin.total_company_loss)} icon={<TrendingDown className="h-4 w-4" />} tone="danger" />
          <MetricTile label="Total Deposit" value={formatBDT(fin.total_deposit)} icon={<ArrowDownCircle className="h-4 w-4" />} tone="success" />
          <MetricTile label="Total Withdraw" value={formatBDT(fin.total_withdraw)} icon={<ArrowUpCircle className="h-4 w-4" />} />
          <MetricTile
            label="Pending Deposit"
            value={formatBDT(fin.pending_deposit_amount)}
            sub={`${formatInt(fin.pending_deposit_count)} requests`}
            icon={<Clock className="h-4 w-4" />}
            tone="warning"
          />
          <MetricTile
            label="Pending Withdraw"
            value={formatBDT(fin.pending_withdraw_amount)}
            sub={`${formatInt(fin.pending_withdraw_count)} requests`}
            icon={<Clock className="h-4 w-4" />}
            tone="warning"
          />
        </div>
      </section>

      {/* Trading Dashboard */}
      <section>
        <SectionTitle icon={<Activity className="h-4 w-4" />} title="Trading Dashboard" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <LiveCryptoPriceTile />
          <MetricTile label="Active Traders (5m)" value={formatInt(tr.active_traders)} tone="info" />
          <MetricTile label="Buy Volume" value={formatBDT(tr.buy_volume)} tone="success" />
          <MetricTile label="Sell Volume" value={formatBDT(tr.sell_volume)} tone="danger" />
          <MetricTile label="Open Positions" value={formatInt(tr.open_positions)} />
          <MetricTile label="Closed Positions" value={formatInt(tr.closed_positions)} />
          <MetricTile
            label="Trading P/L"
            value={formatBDT(tr.trading_pl)}
            tone={tr.trading_pl >= 0 ? "success" : "danger"}
          />
        </div>
      </section>

      {/* Game Dashboard */}
      <section>
        <SectionTitle icon={<Activity className="h-4 w-4" />} title="Game Dashboard" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {GAME_LIST.map((g) => (
            <GameStatCard key={g.key} title={g.title} stat={data.games[g.key]} />
          ))}
        </div>
      </section>

      {/* Wallet Dashboard */}
      <section>
        <SectionTitle icon={<Wallet className="h-4 w-4" />} title="Wallet Dashboard" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {WALLETS.map((w) => (
            <MetricTile key={w.key} label={`${w.label} Wallet`} value={formatBDT(data.wallets[w.key])} />
          ))}
        </div>
      </section>

      {/* Bonus System */}
      <section>
        <SectionTitle icon={<Gift className="h-4 w-4" />} title="Bonus System" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {BONUSES.map((b) => {
            const entry = data.bonus[b.key] || { count: 0, amount: 0 };
            return (
              <MetricTile
                key={b.key}
                label={`${b.label} Bonus`}
                value={formatBDT(entry.amount)}
                sub={`${formatInt(entry.count)} issued`}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="p-1.5 rounded-md bg-primary/10 text-primary">{icon}</div>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

function LiveCryptoPriceTile() {
  const [price, setPrice] = useState<LivePrice | null>(null);
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const res = await fetchFinnhubPrices(["BINANCE:BTCUSDT"]);
      if (alive) setPrice(res["BINANCE:BTCUSDT"] || null);
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const change = price?.change ?? 0;
  return (
    <MetricTile
      label="Live BTC/USDT"
      value={price ? `$${price.price.toLocaleString()}` : "—"}
      sub={price ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%` : "loading..."}
      tone={change >= 0 ? "success" : "danger"}
      icon={<Activity className="h-4 w-4" />}
    />
  );
}
