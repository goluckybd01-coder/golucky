import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowDownToLine } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatBDTFull } from '@/lib/agentConfig';
import { format } from 'date-fns';

interface Row {
  id: string;
  amount: number;
  created_at: string;
  meta: any;
}

export default function AgentCommissionWithdrawHistory({ agentUserId }: { agentUserId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('wallet_ledger')
        .select('id, amount, created_at, meta')
        .eq('user_id', agentUserId)
        .in('ledger_type', ['COMMISSION_WITHDRAW_DEBIT', 'commission_withdraw'] as any)
        .order('created_at', { ascending: false })
        .limit(200);
      if (!active) return;
      setRows(((data || []) as unknown) as Row[]);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`commission-withdraw-${agentUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wallet_ledger', filter: `user_id=eq.${agentUserId}` },
        (payload: any) => {
          const t = payload.new?.ledger_type;
          if (t === 'COMMISSION_WITHDRAW_DEBIT' || t === 'commission_withdraw') {
            setRows((prev) => [payload.new as Row, ...prev].slice(0, 200));
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [agentUserId]);

  const total = rows.reduce((s, r) => s + Math.abs(Number(r.amount) || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowDownToLine className="h-4 w-4 text-primary" />
          কমিশন উত্তোলন ইতিহাস / Commission Withdrawals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border p-3">
            <p className="text-[10px] text-muted-foreground">Total withdrawn</p>
            <p className="text-sm font-bold">{formatBDTFull(total)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[10px] text-muted-foreground">Count</p>
            <p className="text-sm font-bold">{rows.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">
            কোনো উত্তোলন এখনো হয়নি / No withdrawals yet
          </p>
        ) : (
          <div className="space-y-1.5">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border bg-card/40 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">কমিশন → ওয়ালেট</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(r.created_at), 'PPp')} · Ref: {r.meta?.ref || r.id.slice(0, 8)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-emerald-500">
                    {formatBDTFull(Math.abs(Number(r.amount) || 0))}
                  </p>
                  <Badge variant="outline" className="text-[10px] mt-0.5 border-emerald-500/40 text-emerald-500">
                    completed
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
