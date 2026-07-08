import { Fragment as FragmentWithKey, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, ChevronLeft, ChevronRight, RefreshCw, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LogRow = {
  id: string;
  staff_id: string | null;
  action: string;
  module: string;
  target_type: string | null;
  target_id: string | null;
  old_value: any;
  new_value: any;
  created_at: string;
};

type StaffInfo = { id: string; email: string | null; display_name: string | null };

export const PAGE_SIZE = 20;

/**
 * Compute inclusive ISO bounds for a selected date range.
 * `from` is normalized to local 00:00:00.000 and `to` to local 23:59:59.999
 * so the resulting gte/lte pair inclusively covers every timestamp on the
 * selected days regardless of pagination.
 */
export function getRangeBounds(range?: { from?: Date; to?: Date }): {
  gte?: string;
  lte?: string;
} {
  const out: { gte?: string; lte?: string } = {};
  if (range?.from) {
    const s = new Date(range.from);
    s.setHours(0, 0, 0, 0);
    out.gte = s.toISOString();
  }
  if (range?.to) {
    const e = new Date(range.to);
    e.setHours(23, 59, 59, 999);
    out.lte = e.toISOString();
  }
  return out;
}

/** Inclusive supabase `.range(from,to)` bounds for a zero-based page. */
export function getPageBounds(page: number, size = PAGE_SIZE) {
  const from = page * size;
  return { from, to: from + size - 1 };
}

const actionColor: Record<string, string> = {
  create: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  update: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  toggle: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  delete: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function AgentPaymentAuditLogs() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [staff, setStaff] = useState<Record<string, StaffInfo>>({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [range, setRange] = useState<DateRange | undefined>();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(0), [debouncedSearch, actionFilter, range?.from, range?.to]);

  const load = async () => {
    setLoading(true);
    try {
      let q = supabase
        .from("staff_audit_logs")
        .select("*", { count: "exact" })
        .eq("module", "agent_payment_settings")
        .order("created_at", { ascending: false });

      if (actionFilter !== "all") q = q.eq("action", actionFilter);
      if (debouncedSearch) q = q.ilike("target_id", `%${debouncedSearch}%`);
      const { gte, lte } = getRangeBounds(range);
      if (gte) q = q.gte("created_at", gte);
      if (lte) q = q.lte("created_at", lte);

      const { from, to } = getPageBounds(page);
      const { data, count, error } = await q.range(from, to);
      if (error) throw error;

      const list = (data ?? []) as LogRow[];
      setRows(list);
      setTotal(count ?? 0);

      const ids = Array.from(new Set(list.map((r) => r.staff_id).filter(Boolean))) as string[];
      const missing = ids.filter((id) => !staff[id]);
      if (missing.length) {
        const { data: sdata } = await supabase
          .from("staff_accounts")
          .select("id, email, display_name")
          .in("id", missing);
        if (sdata) {
          setStaff((prev) => {
            const next = { ...prev };
            (sdata as StaffInfo[]).forEach((s) => (next[s.id] = s));
            return next;
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, actionFilter, range?.from, range?.to]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const changedFields = (row: LogRow): string[] => {
    const cf = row.new_value?._changed_fields;
    return Array.isArray(cf) ? cf : [];
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by target/setting ID…"
            className="w-full rounded-lg border bg-background/40 pl-9 pr-3 py-2 text-sm outline-none focus:border-emerald-500/50"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-lg border bg-background/40 px-3 py-2 text-sm"
        >
          <option value="all">All actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="toggle">Toggle</option>
          <option value="delete">Delete</option>
        </select>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-auto justify-start gap-2 py-2 text-sm font-normal",
                !range?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {range?.from ? (
                range.to ? (
                  <>
                    {format(range.from, "LLL d, y")} – {format(range.to, "LLL d, y")}
                  </>
                ) : (
                  format(range.from, "LLL d, y")
                )
              ) : (
                <span>Date range</span>
              )}
              {range?.from && (
                <X
                  className="ml-1 h-3.5 w-3.5 opacity-60 hover:opacity-100"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setRange(undefined);
                  }}
                />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={2}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {(() => {
        const { gte, lte } = getRangeBounds(range);
        if (!gte && !lte) return null;
        return (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-semibold text-emerald-400">Applied filter · created_at</span>
            <span className="mx-2">|</span>
            <span>start (gte): </span>
            <code className="font-mono text-foreground">{gte ?? "—"}</code>
            <span className="mx-2">·</span>
            <span>end (lte): </span>
            <code className="font-mono text-foreground">{lte ?? "—"}</code>
          </div>
        );
      })()}



      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Admin</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Changed fields</th>
              <th className="px-3 py-2">Target ID</th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No audit log entries found.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const s = r.staff_id ? staff[r.staff_id] : null;
                const cf = changedFields(r);
                const isOpen = expanded === r.id;
                return (
                  <FragmentWithKey key={r.id}>
                    <tr
                      key={r.id}
                      className="border-t cursor-pointer hover:bg-accent/30"
                      onClick={() => setExpanded(isOpen ? null : r.id)}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        {s ? (
                          <div>
                            <div className="font-medium">{s.display_name ?? s.email ?? s.id}</div>
                            {s.display_name && s.email && (
                              <div className="text-xs text-muted-foreground">{s.email}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                            actionColor[r.action] ?? "bg-muted"
                          }`}
                        >
                          {r.action}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {cf.length ? (
                          <div className="flex flex-wrap gap-1">
                            {cf.slice(0, 4).map((f) => (
                              <span
                                key={f}
                                className="rounded bg-muted px-1.5 py-0.5 text-xs"
                              >
                                {f}
                              </span>
                            ))}
                            {cf.length > 4 && (
                              <span className="text-xs text-muted-foreground">
                                +{cf.length - 4}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {r.target_id?.slice(0, 8) ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {isOpen ? "▾" : "▸"}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${r.id}-d`} className="border-t bg-muted/20">
                        <td colSpan={6} className="px-3 py-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <div className="mb-1 text-xs font-semibold text-muted-foreground">
                                Before
                              </div>
                              <pre className="max-h-64 overflow-auto rounded bg-background/60 p-2 text-xs">
                                {JSON.stringify(r.old_value ?? {}, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <div className="mb-1 text-xs font-semibold text-muted-foreground">
                                After
                              </div>
                              <pre className="max-h-64 overflow-auto rounded bg-background/60 p-2 text-xs">
                                {JSON.stringify(r.new_value ?? {}, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </FragmentWithKey>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          {total === 0
            ? "0 entries"
            : `Showing ${page * PAGE_SIZE + 1}–${Math.min(
                (page + 1) * PAGE_SIZE,
                total
              )} of ${total}`}
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="inline-flex items-center gap-1 rounded border px-2 py-1 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="text-muted-foreground">
            Page {page + 1} / {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 rounded border px-2 py-1 disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
