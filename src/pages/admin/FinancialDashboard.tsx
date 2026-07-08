import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
} from "lucide-react";
import { useAdminOverview } from "@/hooks/useAdminOverview";
import { MetricTile, formatBDT, formatInt } from "@/components/admin/dashboard/MetricTile";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TransactionStatsChart } from "@/components/admin/TransactionStatsChart";

const COLORS = {
  profit: "#22c55e",
  loss: "#ef4444",
  pending: "#f59e0b",
  done: "#3b82f6",
};

export default function FinancialDashboard() {
  const { data, isLoading, error, isFetching, refetch } = useAdminOverview(15_000);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load financial data: {(error as Error)?.message || "Unknown error"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const fin = data.financial;
  const netPL = fin.total_company_profit - fin.total_company_loss;
  const netFlow = fin.total_deposit - fin.total_withdraw;

  const plData = [
    { name: "Profit", value: fin.total_company_profit },
    { name: "Loss", value: fin.total_company_loss },
  ];

  const flowData = [
    { name: "Deposit", value: fin.total_deposit },
    { name: "Withdraw", value: fin.total_withdraw },
  ];

  const pendingData = [
    {
      name: "Deposit",
      amount: fin.pending_deposit_amount,
      count: fin.pending_deposit_count,
    },
    {
      name: "Withdraw",
      amount: fin.pending_withdraw_amount,
      count: fin.pending_withdraw_count,
    },
  ];

  const balanceData = [
    { name: "User", value: fin.total_user_balance },
    { name: "Agent", value: fin.total_agent_balance },
    { name: "Bonus", value: fin.total_bonus_balance },
  ];

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/overview"
            className="p-2 rounded-md bg-muted hover:bg-muted/70"
            aria-label="Back to overview"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Financial Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Detailed totals, pending requests & profit/loss • updated{" "}
              {new Date(data.generated_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md bg-muted hover:bg-muted/70"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricTile
          label="Net P/L"
          value={formatBDT(netPL)}
          icon={<DollarSign className="h-4 w-4" />}
          tone={netPL >= 0 ? "success" : "danger"}
        />
        <MetricTile
          label="Net Cash Flow"
          value={formatBDT(netFlow)}
          icon={netFlow >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          tone={netFlow >= 0 ? "success" : "danger"}
        />
        <MetricTile
          label="Company Profit"
          value={formatBDT(fin.total_company_profit)}
          tone="success"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricTile
          label="Company Loss"
          value={formatBDT(fin.total_company_loss)}
          tone="danger"
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <MetricTile
          label="Total Deposit"
          value={formatBDT(fin.total_deposit)}
          tone="success"
          icon={<ArrowDownCircle className="h-4 w-4" />}
        />
        <MetricTile
          label="Total Withdraw"
          value={formatBDT(fin.total_withdraw)}
          icon={<ArrowUpCircle className="h-4 w-4" />}
        />
        <MetricTile
          label="Pending Deposit"
          value={formatBDT(fin.pending_deposit_amount)}
          sub={`${formatInt(fin.pending_deposit_count)} requests`}
          tone="warning"
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricTile
          label="Pending Withdraw"
          value={formatBDT(fin.pending_withdraw_amount)}
          sub={`${formatInt(fin.pending_withdraw_count)} requests`}
          tone="warning"
          icon={<Clock className="h-4 w-4" />}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Profit vs Loss</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={plData} dataKey="value" nameKey="name" outerRadius={90} label>
                  <Cell fill={COLORS.profit} />
                  <Cell fill={COLORS.loss} />
                </Pie>
                <Tooltip formatter={(v: number) => formatBDT(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Deposit vs Withdraw</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flowData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)}
                />
                <Tooltip formatter={(v: number) => formatBDT(v)} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  <Cell fill={COLORS.profit} />
                  <Cell fill={COLORS.loss} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Pending Requests</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pendingData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)}
                />
                <Tooltip
                  formatter={(v: number, k: string) =>
                    k === "amount" ? formatBDT(v) : formatInt(v)
                  }
                />
                <Legend />
                <Bar dataKey="amount" name="Amount" fill={COLORS.pending} radius={[6, 6, 0, 0]} />
                <Bar dataKey="count" name="Count" fill={COLORS.done} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Balance Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={balanceData} dataKey="value" nameKey="name" outerRadius={90} label>
                  <Cell fill="#3b82f6" />
                  <Cell fill="#8b5cf6" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip formatter={(v: number) => formatBDT(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3">Daily Transaction Trend</h3>
        <TransactionStatsChart />
      </section>
    </div>
  );
}
