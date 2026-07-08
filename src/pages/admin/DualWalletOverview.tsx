import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Wallet, Gamepad2, ArrowLeftRight, AlertTriangle, ChevronLeft, ChevronRight, X, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Overview = {
  main_bdt_total: number;
  main_usdt_total: number;
  provider_bdt_total: number;
  transfers_today: number;
  failed_today: number;
  usdt_rate: number;
  generated_at: string;
};

type TransferRow = {
  id: string;
  created_at: string;
  user_id: string;
  from_wallet: string;
  to_wallet: string;
  currency: string;
  amount_bdt: number;
  amount_usdt: number;
  provider_code: string | null;
  status: string;
  reference_id: string;
  error_message: string | null;
};

type ProviderRow = {
  user_id: string;
  balance: number;
  in_game: number;
  last_provider: string | null;
  updated_at: string;
};

const fmt = (n: number, c = "৳") =>
  `${c}${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function DualWalletOverview() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [transfers, setTransfers] = useState<TransferRow[]>([]);
  const [transfersTotal, setTransfersTotal] = useState(0);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const SORTABLE_FIELDS = ["created_at", "user_id", "from_wallet", "provider_code", "status"] as const;
  type SortField = typeof SORTABLE_FIELDS[number];
  const DEFAULT_SORT: SortField = "created_at";
  const normalizeSort = (f: string | null): SortField =>
    f && (SORTABLE_FIELDS as readonly string[]).includes(f) ? (f as SortField) : DEFAULT_SORT;
  const normalizeDir = (d: string | null): boolean => d === "asc";

  const [searchParams, setSearchParams] = useSearchParams();
  const sortField = normalizeSort(searchParams.get("sort"));
  const sortAsc = normalizeDir(searchParams.get("dir"));

  const toggleSort = (f: string) => {
    const next = normalizeSort(f);
    const nextAsc = sortField === next ? !sortAsc : true;
    const params = new URLSearchParams(searchParams);
    params.set("sort", next);
    params.set("dir", nextAsc ? "asc" : "desc");
    setSearchParams(params, { replace: true });
    setPage(0);
  };
  const SortIcon = ({ f }: { f: SortField }) =>
    sortField !== f ? (
      <ArrowUpDown className="h-3 w-3 opacity-40 inline ml-1" />
    ) : sortAsc ? (
      <ArrowUp className="h-3 w-3 inline ml-1 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 inline ml-1 text-primary" />
    );
  const sortHeaderCls = (f: SortField) =>
    `cursor-pointer select-none transition-colors hover:text-foreground ${
      sortField === f ? "text-primary font-semibold" : ""
    }`;
  const ariaSort = (f: SortField): "ascending" | "descending" | "none" =>
    sortField !== f ? "none" : sortAsc ? "ascending" : "descending";

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, status, fromDate, toDate]);

  const loadOverviewAndProviders = useCallback(async () => {
    const [ov, pw] = await Promise.all([
      supabase.rpc("get_admin_wallet_overview"),
      supabase
        .from("provider_wallets")
        .select("user_id,balance,in_game,last_provider,updated_at")
        .order("updated_at", { ascending: false })
        .limit(25),
    ]);
    if (ov.error) throw ov.error;
    if (pw.error) throw pw.error;
    setOverview(ov.data as unknown as Overview);
    setProviders((pw.data ?? []) as ProviderRow[]);
  }, []);

  const loadTransfers = useCallback(async () => {
    let q = supabase
      .from("wallet_transfers_v2")
      .select(
        "id,created_at,user_id,from_wallet,to_wallet,currency,amount_bdt,amount_usdt,provider_code,status,reference_id,error_message",
        { count: "exact" }
      )
      .order(normalizeSort(sortField), { ascending: sortAsc })
      .order("id", { ascending: false });

    if (status !== "all") q = q.eq("status", status);
    if (fromDate) q = q.gte("created_at", new Date(fromDate).toISOString());
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      q = q.lte("created_at", end.toISOString());
    }
    if (debouncedSearch) {
      const s = debouncedSearch.replace(/[,()]/g, "");
      q = q.or(
        `reference_id.ilike.%${s}%,user_id.ilike.%${s}%,provider_code.ilike.%${s}%,from_wallet.ilike.%${s}%,to_wallet.ilike.%${s}%`
      );
    }

    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await q.range(from, to);
    if (error) throw error;
    setTransfers((data ?? []) as TransferRow[]);
    setTransfersTotal(count ?? 0);
  }, [debouncedSearch, status, fromDate, toDate, page, sortField, sortAsc]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      await Promise.all([loadOverviewAndProviders(), loadTransfers()]);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [loadOverviewAndProviders, loadTransfers]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const ch = supabase
      .channel("admin-wallet-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "wallet_transfers_v2" }, () => {
        loadOverviewAndProviders().catch(() => {});
        loadTransfers().catch(() => {});
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "provider_wallets" }, () => {
        loadOverviewAndProviders().catch(() => {});
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [loadOverviewAndProviders, loadTransfers]);

  const totalPages = Math.max(1, Math.ceil(transfersTotal / pageSize));
  const hasFilters = useMemo(
    () => Boolean(debouncedSearch || status !== "all" || fromDate || toDate),
    [debouncedSearch, status, fromDate, toDate]
  );

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setFromDate("");
    setToDate("");
  };

  const isDefaultSort = sortField === DEFAULT_SORT && sortAsc === false;
  const resetSort = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("sort");
    params.delete("dir");
    setSearchParams(params, { replace: true });
    setPage(0);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dual Wallet Overview</h1>
          <p className="text-sm text-muted-foreground">
            Main + Provider balances, transfers & settlement logs
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {err && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {err}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Wallet className="h-4 w-4" />} label="Main Wallet (BDT)" value={fmt(overview?.main_bdt_total ?? 0)} />
        <StatCard icon={<Wallet className="h-4 w-4" />} label="Main Wallet (USDT)" value={fmt(overview?.main_usdt_total ?? 0, "$")} />
        <StatCard icon={<Gamepad2 className="h-4 w-4" />} label="Provider Wallet (BDT)" value={fmt(overview?.provider_bdt_total ?? 0)} />
        <StatCard
          icon={<ArrowLeftRight className="h-4 w-4" />}
          label="Transfers (24h)"
          value={String(overview?.transfers_today ?? 0)}
          sub={overview ? `${overview.failed_today} failed · rate ৳${overview.usdt_rate}` : undefined}
        />
      </div>

      <Card>
        <CardHeader><CardTitle>Provider Balances (Top 25)</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>In-Game</TableHead>
                <TableHead>Last Provider</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No provider wallets</TableCell></TableRow>
              )}
              {providers.map((p) => (
                <TableRow key={p.user_id}>
                  <TableCell className="font-mono text-xs">{p.user_id.slice(0, 8)}…</TableCell>
                  <TableCell>{fmt(p.balance)}</TableCell>
                  <TableCell>{fmt(p.in_game)}</TableCell>
                  <TableCell>{p.last_provider ?? "—"}</TableCell>
                  <TableCell className="text-xs">{new Date(p.updated_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <CardTitle>Transfers & Settlements</CardTitle>
            <div className="grid grid-cols-2 md:grid-cols-[1fr_140px_160px_160px_auto] gap-2 md:gap-3 w-full md:w-auto">
              <div className="col-span-2 md:col-span-1">
                <Label className="text-[10px] text-muted-foreground">Search</Label>
                <Input
                  placeholder="user_id, ref, provider…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">From</Label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">To</Label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9" />
              </div>
              {hasFilters && (
                <div className="flex items-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                    <X className="h-3 w-3 mr-1" /> Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead aria-sort={ariaSort("created_at")} className={sortHeaderCls("created_at")} onClick={() => toggleSort("created_at")}>
                  Time<SortIcon f="created_at" />
                </TableHead>
                <TableHead aria-sort={ariaSort("user_id")} className={sortHeaderCls("user_id")} onClick={() => toggleSort("user_id")}>
                  User<SortIcon f="user_id" />
                </TableHead>
                <TableHead aria-sort={ariaSort("from_wallet")} className={sortHeaderCls("from_wallet")} onClick={() => toggleSort("from_wallet")}>
                  Wallet<SortIcon f="from_wallet" />
                </TableHead>
                <TableHead>Amount</TableHead>
                <TableHead aria-sort={ariaSort("provider_code")} className={sortHeaderCls("provider_code")} onClick={() => toggleSort("provider_code")}>
                  Provider<SortIcon f="provider_code" />
                </TableHead>
                <TableHead aria-sort={ariaSort("status")} className={sortHeaderCls("status")} onClick={() => toggleSort("status")}>
                  Status<SortIcon f="status" />
                </TableHead>
                <TableHead>Ref</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No transfers match</TableCell></TableRow>
              )}
              {transfers.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs">{new Date(t.created_at).toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-xs">{t.user_id.slice(0, 8)}…</TableCell>
                  <TableCell className="text-xs">{t.from_wallet} → {t.to_wallet}</TableCell>
                  <TableCell>
                    {t.currency === "USDT" ? fmt(t.amount_usdt, "$") : fmt(t.amount_bdt)}
                  </TableCell>
                  <TableCell>{t.provider_code ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={t.status === "success" ? "default" : t.status === "failed" ? "destructive" : "secondary"}
                    >
                      {t.status}
                    </Badge>
                    {t.error_message && (
                      <div className="text-[10px] text-destructive mt-1 max-w-[180px] truncate" title={t.error_message}>
                        {t.error_message}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-[10px] max-w-[120px] truncate" title={t.reference_id}>
                    {t.reference_id}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>
                {transfersTotal === 0
                  ? "0 results"
                  : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, transfersTotal)} of ${transfersTotal}`}
              </span>
              {!isDefaultSort && (
                <Button variant="ghost" size="sm" onClick={resetSort} className="h-7">
                  <X className="h-3 w-3 mr-1" /> Reset sort
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                aria-label="Previous transfers page"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>Page {page + 1} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                aria-label="Next transfers page"
                onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
                disabled={page + 1 >= totalPages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
        <div className="text-xl md:text-2xl font-bold mt-1 tabular-nums">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}
