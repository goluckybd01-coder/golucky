import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  startOfDay, startOfWeek, startOfMonth, startOfYear,
  endOfDay, format, subDays, eachDayOfInterval,
} from "date-fns";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend,
} from "recharts";
import { FileText, FileSpreadsheet, FileDown, TrendingUp, Users, Wallet, PiggyBank } from "lucide-react";

type Range = "daily" | "weekly" | "monthly" | "yearly";

const rangeStart = (r: Range) => {
  const now = new Date();
  switch (r) {
    case "daily": return startOfDay(now);
    case "weekly": return startOfWeek(now, { weekStartsOn: 1 });
    case "monthly": return startOfMonth(now);
    case "yearly": return startOfYear(now);
  }
};

interface ReportRow {
  date: string;
  deposits: number;
  withdrawals: number;
  fd_created: number;
  new_users: number;
}

export default function ReportsAnalytics() {
  const [range, setRange] = useState<Range>("monthly");
  const from = useMemo(() => rangeStart(range), [range]);
  const to = useMemo(() => endOfDay(new Date()), []);

  const { data, isLoading } = useQuery({
    queryKey: ["reports-analytics", range],
    queryFn: async () => {
      const { data: fn, error } = await supabase.functions.invoke("admin-reports", {
        body: undefined,
        method: "GET" as any,
      }).catch(() => ({ data: null, error: new Error("fn-failed") }));

      // Prefer edge function; fall back to client-side if unavailable
      let rows: ReportRow[] = [];
      let totals = { deposits: 0, withdrawals: 0, fd_created: 0, new_users: 0 };
      let activeAgents = 0;
      let usdtRate = 130;

      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/admin-reports?range=${range}`;
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (token) {
        try {
          const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const j = await res.json();
            return { rows: j.rows as ReportRow[], totals: j.totals, activeAgents: j.activeAgents, usdtRate: j.usdtRate };
          }
        } catch { /* fall through */ }
      }

      // Fallback: client queries
      const fromIso = from.toISOString();
      const toIso = to.toISOString();
      const [deps, wds, fds, users, agents, usdt] = await Promise.all([
        supabase.from("deposit_requests").select("amount, created_at, status").gte("created_at", fromIso).lte("created_at", toIso),
        supabase.from("transaction_requests").select("amount, created_at, status, type").eq("type", "withdrawal").gte("created_at", fromIso).lte("created_at", toIso),
        supabase.from("fixed_deposits").select("amount, created_at, status").gte("created_at", fromIso).lte("created_at", toIso),
        supabase.from("profiles").select("id, created_at").gte("created_at", fromIso).lte("created_at", toIso),
        supabase.from("agent_applications").select("id, status, created_at"),
        supabase.from("app_settings").select("setting_value").eq("setting_key", "usdt_rate").maybeSingle(),
      ]);
      const days = eachDayOfInterval({ start: range === "daily" ? subDays(to, 6) : from, end: to });
      const bucket: Record<string, ReportRow> = {};
      days.forEach(d => { const k = format(d, "yyyy-MM-dd"); bucket[k] = { date: k, deposits: 0, withdrawals: 0, fd_created: 0, new_users: 0 }; });
      const add = (arr: any[] | null, key: keyof ReportRow, amountKey?: string) => {
        (arr ?? []).forEach((r: any) => {
          const k = format(new Date(r.created_at), "yyyy-MM-dd");
          if (!bucket[k]) bucket[k] = { date: k, deposits: 0, withdrawals: 0, fd_created: 0, new_users: 0 };
          (bucket[k][key] as number) += amountKey ? Number(r[amountKey] ?? 0) : 1;
        });
      };
      add(deps.data, "deposits", "amount");
      add(wds.data, "withdrawals", "amount");
      add(fds.data, "fd_created", "amount");
      add(users.data, "new_users");
      rows = Object.values(bucket).sort((a, b) => a.date.localeCompare(b.date));
      totals = rows.reduce((acc, r) => ({
        deposits: acc.deposits + r.deposits,
        withdrawals: acc.withdrawals + r.withdrawals,
        fd_created: acc.fd_created + r.fd_created,
        new_users: acc.new_users + r.new_users,
      }), totals);
      activeAgents = (agents.data ?? []).filter((a: any) => a.status === "approved").length;
      usdtRate = Number((usdt.data as any)?.setting_value ?? 130);
      return { rows, totals, activeAgents, usdtRate };
    },
  });

  const rows = data?.rows ?? [];

  const exportCSV = () => {
    const header = ["Date", "Deposits (৳)", "Withdrawals (৳)", "FD Created (৳)", "New Users"];
    const csv = [header.join(","), ...rows.map(r => [r.date, r.deposits, r.withdrawals, r.fd_created, r.new_users].join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `report-${range}-${format(new Date(), "yyyyMMdd")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const exportExcel = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/admin-reports?range=${range}&format=xlsx`;
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `report-${range}-${format(new Date(), "yyyyMMdd")}.xlsx`;
      a.click();
      URL.revokeObjectURL(href);
      toast.success("Excel downloaded");
    } catch (e) {
      // Fallback to client-side generation
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `report-${range}-${format(new Date(), "yyyyMMdd")}.xlsx`);
      toast.success("Excel downloaded (client)");
    }
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text(`GoLuckyBD Report — ${range.toUpperCase()}`, 14, 18);
    doc.setFontSize(10); doc.text(`${format(from, "PPP")} → ${format(to, "PPP")}`, 14, 26);
    if (data) {
      doc.text(`Totals — Deposits: ৳${data.totals.deposits.toLocaleString()} | Withdrawals: ৳${data.totals.withdrawals.toLocaleString()} | FD: ৳${data.totals.fd_created.toLocaleString()} | New Users: ${data.totals.new_users}`, 14, 34);
    }
    autoTable(doc, {
      startY: 42,
      head: [["Date", "Deposits", "Withdrawals", "FD Created", "New Users"]],
      body: rows.map(r => [r.date, r.deposits, r.withdrawals, r.fd_created, r.new_users]),
      styles: { fontSize: 8 },
    });
    doc.save(`report-${range}-${format(new Date(), "yyyyMMdd")}.pdf`);
    toast.success("PDF downloaded");
  };

  const cards = [
    { label: "Total Deposits", value: `৳${(data?.totals.deposits ?? 0).toLocaleString()}`, icon: Wallet },
    { label: "Total Withdrawals", value: `৳${(data?.totals.withdrawals ?? 0).toLocaleString()}`, icon: TrendingUp },
    { label: "FD Created", value: `৳${(data?.totals.fd_created ?? 0).toLocaleString()}`, icon: PiggyBank },
    { label: "New Users", value: `${data?.totals.new_users ?? 0}`, icon: Users },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Unified daily / weekly / monthly / yearly performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><FileDown className="h-4 w-4 mr-2" />CSV</Button>
          <Button variant="outline" size="sm" onClick={exportExcel}><FileSpreadsheet className="h-4 w-4 mr-2" />Excel</Button>
          <Button variant="outline" size="sm" onClick={exportPDF}><FileText className="h-4 w-4 mr-2" />PDF</Button>
        </div>
      </div>

      <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-xl font-bold mt-1">{isLoading ? <Skeleton className="h-6 w-24" /> : c.value}</p>
                </div>
                <c.icon className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Trend</CardTitle></CardHeader>
        <CardContent className="h-80">
          {isLoading ? <Skeleton className="h-full w-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="deposits" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="withdrawals" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="fd_created" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="new_users" stroke="#38bdf8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Breakdown</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Deposits</th>
                <th className="py-2 pr-4">Withdrawals</th>
                <th className="py-2 pr-4">FD Created</th>
                <th className="py-2 pr-4">New Users</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.date} className="border-b/50 hover:bg-muted/30">
                  <td className="py-2 pr-4 font-mono text-xs">{r.date}</td>
                  <td className="py-2 pr-4">৳{r.deposits.toLocaleString()}</td>
                  <td className="py-2 pr-4">৳{r.withdrawals.toLocaleString()}</td>
                  <td className="py-2 pr-4">৳{r.fd_created.toLocaleString()}</td>
                  <td className="py-2 pr-4">{r.new_users}</td>
                </tr>
              ))}
              {rows.length === 0 && !isLoading && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No data</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
