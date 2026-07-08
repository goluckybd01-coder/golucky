import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Pin, BellRing } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_pinned: boolean;
  priority: 'urgent' | 'normal' | 'info' | string;
}

const priorityColor: Record<string, string> = {
  urgent: 'bg-red-500/15 text-red-400 border-red-500/30',
  normal: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  info: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
};

export default function AgentNotificationPanel() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('agent_announcements')
        .select('id, title, message, created_at, is_pinned, priority')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);
      setItems((data || []) as Announcement[]);
      setLoading(false);
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><BellRing className="h-4 w-4" /> এজেন্ট নোটিশ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">No notices right now</p>
        ) : (
          items.map((n) => (
            <div key={n.id} className={`rounded-lg border p-3 ${n.is_pinned ? 'border-primary/40 bg-primary/5' : 'bg-card/40'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {n.is_pinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0" />}
                  <h4 className="font-semibold text-sm truncate">{n.title}</h4>
                </div>
                <Badge variant="outline" className={`text-[10px] ${priorityColor[n.priority] || priorityColor.normal}`}>
                  {n.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{n.message}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-2">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
