import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatBDTFull } from '@/lib/agentConfig';
import { format, startOfDay, startOfWeek, startOfMonth } from 'date-fns';

interface LedgerRow {
  id: string;
  amount: number;
  created_at: string;
  meta: any;
}

interface Enriched extends LedgerRow {
  recipientUsername?: string | null;
  recipientDisplayId?: string | null;
  recipientId?: string | null;
}

type DateFilter = 'today' | 'week' | 'month' | 'all';

export default function AgentTopupLog({ agentUserId }: { agentUserId: string }) {
  const [rows, setRows] = useState<Enriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('wallet_ledger')
        .select('id, amount, created_at, meta')
        .eq('user_id', agentUserId)
        .eq('ledger_type', 'AGENT_TOPUP_DEBIT')
        .order('created_at', { ascending: false })
        .limit(500);
      const list = ((data || []) as unknown) as LedgerRow[];

      const enriched: Enriched[] = list.map((r) => {
        const md = r.meta || {};
        return {
          ...r,
          recipientId: md.target_user_id || md.recipient_id || md.recipient || null,
        };
      });


      const ids = Array.from(new Set(enriched.map((e) => e.recipientId).filter(Boolean))) as string[];
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_user_id')
          .in('user_id', ids);
        const map = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        enriched.forEach((e) => {
          const p = e.recipientId ? map.get(e.recipientId) : null;
          if (p) {
            e.recipientUsername = (p as any).username;
            e.recipientDisplayId = (p as any).display_user_id;
          }
        });
      }
      setRows(enriched);
      setLoading(false);
    })();
  }, [agentUserId]);

  const filtered = useMemo(() => {
    let cutoff = 0;
    const now = new Date();
    if (dateFilter === 'today') cutoff = startOfDay(now).getTime();
    else if (dateFilter === 'week') cutoff = startOfWeek(now).getTime();
    else if (dateFilter === 'month') cutoff = startOfMonth(now).getTime();
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (cutoff && new Date(r.created_at).getTime() < cutoff) return false;
      if (q) {
        const hay = `${r.recipientUsername || ''} ${r.recipientDisplayId || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, dateFilter]);

  const stats = useMemo(() => {
    const monthStart = startOfMonth(new Date()).getTime();
    const totalMonth = rows.filter((r) => new Date(r.created_at).getTime() >= monthStart).reduce((s, r) => s + Math.abs(Number(r.amount) || 0), 0);
    const totalAll = rows.reduce((s, r) => s + Math.abs(Number(r.amount) || 0), 0);
    const unique = new Set(rows.map((r) => r.recipientId).filter(Boolean)).size;
    return { totalMonth, totalAll, unique };
  }, [rows]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">টপআপ লগ / Top-up Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border p-3"><p className="text-[10px] text-muted-foreground">This month</p><p className="text-sm font-bold">{formatBDTFull(stats.totalMonth)}</p></div>
          <div className="rounded-lg border p-3"><p className="text-[10px] text-muted-foreground">All time</p><p className="text-sm font-bold">{formatBDTFull(stats.totalAll)}</p></div>
          <div className="rounded-lg border p-3"><p className="text-[10px] text-muted-foreground">Unique users</p><p className="text-sm font-bold">{stats.unique}</p></div>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by username or ID" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <div className="flex gap-1">
            {(['today', 'week', 'month', 'all'] as DateFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-3 py-1.5 text-xs rounded-md border ${dateFilter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-muted'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">No top-ups sent yet</p>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border bg-card/40 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.recipientUsername || 'Unknown user'}</p>
                  <p className="text-[10px] text-muted-foreground">{r.recipientDisplayId || r.recipientId || '—'} · {format(new Date(r.created_at), 'PPp')}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-emerald-500">{formatBDTFull(Math.abs(Number(r.amount) || 0))}</p>
                  <Badge variant="outline" className="text-[10px] mt-0.5">completed</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
