import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Database, Search, Download, Play, RefreshCw, Table as TableIcon,
  Shield, Activity, HardDrive, Users, Zap,
} from "lucide-react";

type TableStat = {
  table_name: string;
  row_estimate: number;
  total_size: string;
  index_size: string;
  live_rows: number;
  dead_rows: number;
};

type ColumnRow = {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
};

type PolicyRow = {
  table_name: string;
  policy_name: string;
  command: string;
  permissive: string;
  roles: string[];
  qual: string | null;
  with_check: string | null;
};

type Health = {
  db_size: string;
  db_size_bytes: number;
  connections: number;
  active_connections: number;
  idle_connections: number;
  longest_query_seconds: number;
  total_tables: number;
  total_indexes: number;
  total_functions: number;
  checked_at: string;
};

const toCSV = (rows: any[]) => {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
};
const download = (name: string, csv: string) => {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};

function OverviewTab({ health, reload }: { health: Health | null; reload: () => void }) {
  const cards = health ? [
    { label: "Database Size", value: health.db_size, icon: HardDrive, tint: "from-blue-500/20 to-indigo-500/5" },
    { label: "Tables", value: health.total_tables, icon: TableIcon, tint: "from-emerald-500/20 to-teal-500/5" },
    { label: "Indexes", value: health.total_indexes, icon: Zap, tint: "from-amber-500/20 to-yellow-500/5" },
    { label: "Functions", value: health.total_functions, icon: Shield, tint: "from-fuchsia-500/20 to-purple-500/5" },
    { label: "Connections", value: `${health.active_connections} / ${health.connections}`, icon: Users, tint: "from-cyan-500/20 to-blue-500/5" },
    { label: "Idle Conns", value: health.idle_connections, icon: Activity, tint: "from-slate-500/20 to-slate-500/5" },
    { label: "Longest Query", value: `${Number(health.longest_query_seconds).toFixed(1)}s`, icon: Activity, tint: "from-rose-500/20 to-red-500/5" },
    { label: "Checked", value: new Date(health.checked_at).toLocaleTimeString(), icon: RefreshCw, tint: "from-lime-500/20 to-green-500/5" },
  ] : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={reload}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className={`bg-gradient-to-br ${c.tint} border-border/50`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{c.label}</span>
                <c.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="text-xl font-bold tabular-nums">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TablesTab() {
  const [rows, setRows] = useState<TableStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inspecting, setInspecting] = useState<string | null>(null);
  const [columns, setColumns] = useState<ColumnRow[]>([]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_db_table_stats" as any);
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const inspect = async (t: string) => {
    setInspecting(t);
    const { data, error } = await supabase.rpc("admin_db_table_columns" as any, { p_table: t });
    if (error) toast.error(error.message);
    setColumns((data as any) ?? []);
  };

  const filtered = useMemo(() => rows.filter((r) =>
    !search || r.table_name.toLowerCase().includes(search.toLowerCase())
  ), [rows, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search table…" value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => download("tables.csv", toCSV(filtered))}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr className="text-left">
                <th className="p-3">Table</th>
                <th className="p-3 text-right">Rows (est.)</th>
                <th className="p-3 text-right">Live</th>
                <th className="p-3 text-right">Dead</th>
                <th className="p-3 text-right">Total Size</th>
                <th className="p-3 text-right">Index Size</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No tables</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.table_name} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono">{r.table_name}</td>
                  <td className="p-3 text-right tabular-nums">{Number(r.row_estimate).toLocaleString()}</td>
                  <td className="p-3 text-right tabular-nums">{Number(r.live_rows).toLocaleString()}</td>
                  <td className="p-3 text-right tabular-nums text-muted-foreground">{Number(r.dead_rows).toLocaleString()}</td>
                  <td className="p-3 text-right">{r.total_size}</td>
                  <td className="p-3 text-right text-muted-foreground">{r.index_size}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => inspect(r.table_name)}>Inspect</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!inspecting} onOpenChange={(o) => !o && setInspecting(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-mono">{inspecting}</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b sticky top-0">
                <tr className="text-left">
                  <th className="p-2">Column</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Nullable</th>
                  <th className="p-2">Default</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((c) => (
                  <tr key={c.column_name} className="border-b">
                    <td className="p-2 font-mono">{c.column_name}</td>
                    <td className="p-2 text-muted-foreground">{c.data_type}</td>
                    <td className="p-2">{c.is_nullable === "YES" ? "yes" : "no"}</td>
                    <td className="p-2 font-mono text-xs text-muted-foreground truncate max-w-[240px]">
                      {c.column_default ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PoliciesTab() {
  const [rows, setRows] = useState<PolicyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_db_policies" as any);
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) =>
    !search || r.table_name.toLowerCase().includes(search.toLowerCase()) ||
    r.policy_name.toLowerCase().includes(search.toLowerCase())
  ), [rows, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search table / policy…" value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Button variant="outline" size="sm" onClick={() => download("policies.csv", toCSV(filtered))}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr className="text-left">
                <th className="p-3">Table</th>
                <th className="p-3">Policy</th>
                <th className="p-3">Cmd</th>
                <th className="p-3">Roles</th>
                <th className="p-3">USING</th>
                <th className="p-3">WITH CHECK</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={i} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono">{r.table_name}</td>
                  <td className="p-3">{r.policy_name}</td>
                  <td className="p-3"><Badge variant="secondary">{r.command}</Badge></td>
                  <td className="p-3 text-xs">{r.roles?.join(", ")}</td>
                  <td className="p-3 text-xs font-mono max-w-[240px] truncate">{r.qual ?? "—"}</td>
                  <td className="p-3 text-xs font-mono max-w-[240px] truncate">{r.with_check ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function QueryTab() {
  const [sql, setSql] = useState("SELECT id, email, created_at FROM profiles ORDER BY created_at DESC LIMIT 20");
  const [limit, setLimit] = useState(100);
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [ms, setMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true); setError(null); setRows([]);
    const { data, error } = await supabase.rpc("admin_db_run_select" as any, {
      p_sql: sql, p_limit: limit,
    });
    setRunning(false);
    if (error) { setError(error.message); return; }
    const res = data as any;
    setRows(res?.rows ?? []);
    setMs(res?.ms ?? null);
  };

  const cols = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="text-xs text-muted-foreground">
            Read-only SQL — only <code>SELECT</code> / <code>WITH</code> allowed, single statement, capped at 500 rows.
            Every run is written to the staff audit log.
          </div>
          <Textarea rows={6} value={sql} onChange={(e) => setSql(e.target.value)}
            className="font-mono text-sm" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Limit</span>
            <Input type="number" value={limit} min={1} max={500}
              onChange={(e) => setLimit(Number(e.target.value))} className="w-24" />
            <Button onClick={run} disabled={running}>
              <Play className="h-4 w-4 mr-1" /> {running ? "Running…" : "Run"}
            </Button>
            {ms !== null && <Badge variant="outline">{ms.toFixed(1)} ms · {rows.length} rows</Badge>}
            {rows.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => download("query.csv", toCSV(rows))}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
            )}
          </div>
          {error && <div className="text-sm text-destructive font-mono">{error}</div>}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardContent className="p-0 overflow-x-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b sticky top-0">
                <tr>{cols.map((c) => <th key={c} className="p-2 text-left font-mono text-xs">{c}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b hover:bg-muted/30">
                    {cols.map((c) => (
                      <td key={c} className="p-2 font-mono text-xs max-w-[240px] truncate">
                        {r[c] === null ? <span className="text-muted-foreground">null</span>
                          : typeof r[c] === "object" ? JSON.stringify(r[c]) : String(r[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AuditTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("staff_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) =>
    !search ||
    String(r.action || "").toLowerCase().includes(search.toLowerCase()) ||
    String(r.module || "").toLowerCase().includes(search.toLowerCase())
  ), [rows, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search action / module…" value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => download("audit.csv", toCSV(filtered))}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr className="text-left">
                <th className="p-3">When</th>
                <th className="p-3">Module</th>
                <th className="p-3">Action</th>
                <th className="p-3">Target</th>
                <th className="p-3">Staff</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No entries</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3"><Badge variant="outline">{r.module}</Badge></td>
                  <td className="p-3 font-mono text-xs">{r.action}</td>
                  <td className="p-3 text-xs text-muted-foreground">{r.target_type}: {String(r.target_id ?? "").slice(0, 8)}</td>
                  <td className="p-3 font-mono text-xs">{String(r.staff_id ?? "").slice(0, 8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DatabaseAdmin() {
  const [health, setHealth] = useState<Health | null>(null);
  const loadHealth = async () => {
    const { data, error } = await supabase.rpc("admin_db_health" as any);
    if (error) toast.error(error.message);
    setHealth(data as any);
  };
  useEffect(() => { loadHealth(); }, []);

  return (
    <AdminShell title="Database Admin" description="Health, tables, policies, safe SQL runner & audit trail">
      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overview"><Database className="h-4 w-4 mr-1" /> Overview</TabsTrigger>
          <TabsTrigger value="tables"><TableIcon className="h-4 w-4 mr-1" /> Tables</TabsTrigger>
          <TabsTrigger value="policies"><Shield className="h-4 w-4 mr-1" /> Policies</TabsTrigger>
          <TabsTrigger value="query"><Play className="h-4 w-4 mr-1" /> SQL Runner</TabsTrigger>
          <TabsTrigger value="audit"><Activity className="h-4 w-4 mr-1" /> Audit</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4"><OverviewTab health={health} reload={loadHealth} /></TabsContent>
        <TabsContent value="tables" className="mt-4"><TablesTab /></TabsContent>
        <TabsContent value="policies" className="mt-4"><PoliciesTab /></TabsContent>
        <TabsContent value="query" className="mt-4"><QueryTab /></TabsContent>
        <TabsContent value="audit" className="mt-4"><AuditTab /></TabsContent>
      </Tabs>
    </AdminShell>
  );
}
