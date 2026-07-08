import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, Wallet, Users, ScrollText, Loader2 } from "lucide-react";

const UsdtDepositsAdmin = lazy(() => import("./UsdtDepositsAdmin"));
const AgentPaymentsAdmin = lazy(() => import("./AgentPayments"));

type LogRow = {
  id: string;
  created_at: string;
  amount: number | null;
  status: string | null;
  gateway: string | null;
  transaction_id: string | null;
  user_id: string | null;
  source: "fd" | "agent";
};

function fmtAmt(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
}

function statusColor(s: string | null) {
  const v = (s || "").toLowerCase();
  if (["verified", "approved", "completed", "success"].includes(v))
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (["rejected", "failed"].includes(v))
    return "bg-rose-500/15 text-rose-400 border-rose-500/30";
  return "bg-amber-500/15 text-amber-400 border-amber-500/30";
}

function PaymentLogs() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"all" | "fd" | "agent">("all");
  const [status, setStatus] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    try {
      const [fdRes, agRes] = await Promise.all([
        type === "agent"
          ? { data: [] as any[] }
          : supabase
              .from("payments")
              .select("id, created_at, amount, status, gateway, transaction_id, user_id")
              .order("created_at", { ascending: false })
              .limit(200),
        type === "fd"
          ? { data: [] as any[] }
          : supabase
              .from("agent_application_payments")
              .select("id, created_at, amount_usdt, status, transaction_hash, user_id")
              .order("created_at", { ascending: false })
              .limit(200),
      ]);

      const fd: LogRow[] = ((fdRes.data as any[]) || []).map((r) => ({
        id: r.id,
        created_at: r.created_at,
        amount: r.amount,
        status: r.status,
        gateway: r.gateway,
        transaction_id: r.transaction_id,
        user_id: r.user_id,
        source: "fd",
      }));

      const ag: LogRow[] = ((agRes.data as any[]) || []).map((r) => ({
        id: r.id,
        created_at: r.created_at,
        amount: r.amount_usdt,
        status: r.status,
        gateway: "USDT-TRC20",
        transaction_id: r.transaction_hash,
        user_id: r.user_id,
        source: "agent",
      }));

      let merged = [...fd, ...ag].sort(
        (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
      );
      if (status !== "all")
        merged = merged.filter((r) => (r.status || "").toLowerCase() === status);
      setRows(merged);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, status]);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-5 w-5" /> Payment Logs (Master History)
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="fd">FD Deposits</SelectItem>
              <SelectItem value="agent">Agent Payments</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead>TXID</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No records
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={`${r.source}-${r.id}`}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {r.source === "fd" ? "FD Deposit" : "Agent Payment"}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{fmtAmt(r.amount)}</TableCell>
                    <TableCell className="text-xs">{r.gateway || "—"}</TableCell>
                    <TableCell className="font-mono text-xs max-w-[220px] truncate">
                      {r.transaction_id || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor(r.status)}>
                        {r.status || "pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PaymentManagement() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">💳 Payment Management</h1>
          <p className="text-sm text-muted-foreground">
            Unified control for FD USDT deposits, agent application payments and full history.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/fd-dashboard">← FD Dashboard</Link>
        </Button>
      </div>

      <Tabs defaultValue="fd" className="w-full">
        <TabsList>
          <TabsTrigger value="fd" className="gap-2">
            <Wallet className="h-4 w-4" /> FD Deposits
          </TabsTrigger>
          <TabsTrigger value="agent" className="gap-2">
            <Users className="h-4 w-4" /> Agent Payments
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <ScrollText className="h-4 w-4" /> Payment Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fd" className="mt-4">
          <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin" />}>
            <UsdtDepositsAdmin />
          </Suspense>
        </TabsContent>

        <TabsContent value="agent" className="mt-4">
          <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin" />}>
            <AgentPaymentsAdmin />
          </Suspense>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <PaymentLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
