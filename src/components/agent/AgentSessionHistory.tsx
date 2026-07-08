import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Monitor, Smartphone, Tablet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';

interface SessionRow {
  id: string;
  login_at: string;
  last_active_at: string | null;
  device_info: string | null;
  ip_address: string | null;
  is_active: boolean;
}

interface Props {
  currentSessionId: string | null;
}

const PAGE_SIZE = 20;

function parseDevice(ua: string | null) {
  if (!ua) return { label: 'Unknown device', Icon: Monitor };
  const lower = ua.toLowerCase();
  if (/(iphone|android.*mobile|mobile)/.test(lower)) return { label: 'Mobile Browser', Icon: Smartphone };
  if (/(ipad|tablet)/.test(lower)) return { label: 'Tablet Browser', Icon: Tablet };
  return { label: 'Web Browser', Icon: Monitor };
}

function durationLabel(loginAt: string, lastAt: string | null) {
  const start = new Date(loginAt).getTime();
  const end = lastAt ? new Date(lastAt).getTime() : Date.now();
  const diff = Math.max(0, end - start);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '< 1 min';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remM = mins % 60;
  return `${hrs}h ${remM}m`;
}

export default function AgentSessionHistory({ currentSessionId }: Props) {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const load = async (p = 0) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const from = p * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    const { data } = await supabase
      .from('agent_sessions')
      .select('id, login_at, last_active_at, device_info, ip_address, is_active')
      .eq('agent_user_id', user.id)
      .order('login_at', { ascending: false })
      .range(from, to);
    const list = (data || []) as SessionRow[];
    setHasMore(list.length > PAGE_SIZE);
    setRows(list.slice(0, PAGE_SIZE));
    setPage(p);
    setLoading(false);
  };

  useEffect(() => { load(0); }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">সেশন হিস্ট্রি / Session History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">No session history yet</p>
        ) : (
          <>
            {rows.map((s) => {
              const { label, Icon } = parseDevice(s.device_info);
              const isCurrent = s.id === currentSessionId;
              return (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card/40 p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="rounded-md bg-muted p-2"><Icon className="h-4 w-4" /></div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{label}</p>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                            </span>
                            Currently Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(s.login_at), 'PPp')} · {formatDistanceToNow(new Date(s.login_at), { addSuffix: true })}
                      </p>
                      {s.ip_address && <p className="text-[10px] text-muted-foreground/70">IP: {s.ip_address}</p>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{durationLabel(s.login_at, s.last_active_at)}</p>
                    <Badge variant={s.is_active ? 'default' : 'secondary'} className="mt-1 text-[10px]">
                      {s.is_active ? 'active' : 'expired'}
                    </Badge>
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between pt-2">
              <Button variant="outline" size="sm" disabled={page === 0 || loading} onClick={() => load(page - 1)}>Prev</Button>
              <span className="text-xs text-muted-foreground self-center">Page {page + 1}</span>
              <Button variant="outline" size="sm" disabled={!hasMore || loading} onClick={() => load(page + 1)}>Next</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
