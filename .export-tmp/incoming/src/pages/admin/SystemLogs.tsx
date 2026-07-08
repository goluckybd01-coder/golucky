import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, RefreshCw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  staff_id: string | null;
  action: string;
  module: string | null;
  target_type: string | null;
  target_id: string | null;
  old_value: unknown;
  new_value: unknown;
  ip_address: string | null;
  created_at: string;
}

const PAGE_SIZE = 100;

export default function SystemLogs() {
  const [action, setAction] = useState("");
  const [staffId, setStaffId] = useState("");
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      let q = supabase
        .from("staff_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (action.trim()) q = q.ilike("action", `%${action.trim()}%`);
      if (staffId.trim()) q = q.eq("staff_id", staffId.trim());
      if (from) q = q.gte("created_at", from.toISOString());
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        q = q.lte("created_at", end.toISOString());
      }

      const { data, error } = await q;
      if (error) throw error;
      setRows((data ?? []) as AuditLog[]);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load();   }, []);

  const reset = () => {
    setAction(""); setStaffId(""); setFrom(undefined); setTo(undefined);
    setTimeout(load, 0);
  };

  const count = useMemo(() => rows.length, [rows]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Logs</h1>
          <p className="text-sm text-muted-foreground">
            Unified admin audit trail — filter by action, admin, or date range.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Filters</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="space-y-1">
            <Label>Action</Label>
            <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. approve_usdt_payment" />
          </div>
          <div className="space-y-1">
            <Label>Admin ID</Label>
            <Input value={staffId} onChange={(e) => setStaffId(e.target.value)} placeholder="staff uuid" />
          </div>
          <div className="space-y-1">
            <Label>From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !from && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {from ? format(from, "PPP") : <span>Start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={from} onSelect={setFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1">
            <Label>To</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !to && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {to ? format(to, "PPP") : <span>End date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={to} onSelect={setTo} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2">
            <Button onClick={load} disabled={loading} className="flex-1">
              <Search className="h-4 w-4 mr-2" /> Apply
            </Button>
            <Button variant="ghost" onClick={reset}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Entries</CardTitle>
          <Badge variant="secondary">{count} shown{count === PAGE_SIZE ? " (limit)" : ""}</Badge>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {loading ? "Loading…" : "No log entries match the filters."}
                  </TableCell>
                </TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {format(new Date(r.created_at), "yyyy-MM-dd HH:mm:ss")}
                  </TableCell>
                  <TableCell><Badge variant="outline">{r.action}</Badge></TableCell>
                  <TableCell className="text-xs">{r.module ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{r.staff_id ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {r.target_type ? `${r.target_type}:${r.target_id ?? ""}` : "—"}
                  </TableCell>
                  <TableCell className="text-xs">{r.ip_address ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
