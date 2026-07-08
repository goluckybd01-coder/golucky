import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronDown, ChevronRight, Lock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatBDTFull, type AgentTier } from '@/lib/agentConfig';

interface SubAgent {
  user_id: string;
  username: string | null;
  agent_display_id: string | null;
  agent_tier: AgentTier | null;
  referral_count?: number;
  total_commission?: number;
  children?: SubAgent[];
  loadedChildren?: boolean;
}

interface Props {
  agentUserId: string;
  agentTier: AgentTier;
}

const UNLOCKED_TIERS: AgentTier[] = ['elite', 'master'];

async function fetchSubAgents(uplineId: string): Promise<SubAgent[]> {
  const { data: subs } = await supabase
    .from('profiles')
    .select('user_id, username, agent_display_id, agent_tier')
    .eq('upline_agent_id', uplineId)
    .eq('agent_status', 'approved');
  const list = (subs || []) as SubAgent[];

  // Augment with referral count + commission totals
  await Promise.all(list.map(async (s) => {
    const [{ count: refCount }, { data: comm }] = await Promise.all([
      supabase.from('profiles').select('user_id', { count: 'exact', head: true }).eq('referred_by', s.user_id),
      supabase.from('wallets').select('total_commission_earned').eq('user_id', s.user_id).maybeSingle(),
    ]);
    s.referral_count = refCount || 0;
    s.total_commission = Number((comm as any)?.total_commission_earned || 0);
  }));
  return list;
}

function TeamNode({ node, depth, onExpand }: { node: SubAgent; depth: number; onExpand: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const canExpand = depth < 2;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between rounded-lg border bg-card/40 p-3" style={{ marginLeft: depth * 16 }}>
        <div className="flex items-center gap-2 min-w-0">
          {canExpand ? (
            <button
              onClick={() => { setOpen(!open); if (!open && !node.loadedChildren) onExpand(node.user_id); }}
              className="text-muted-foreground hover:text-foreground"
            >
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{node.username || 'Agent'}</p>
            <p className="text-[10px] text-muted-foreground">{node.agent_display_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {node.agent_tier && <Badge variant="outline" className="text-[10px] capitalize">{node.agent_tier}</Badge>}
          <span className="text-[11px] text-muted-foreground">{node.referral_count || 0} refs</span>
          <span className="text-[11px] text-emerald-500">{formatBDTFull(node.total_commission || 0)}</span>
        </div>
      </div>
      {open && node.children && node.children.length > 0 && (
        <div className="space-y-1">
          {node.children.map((c) => <TeamNode key={c.user_id} node={c} depth={depth + 1} onExpand={onExpand} />)}
        </div>
      )}
      {open && node.loadedChildren && (node.children?.length || 0) === 0 && (
        <p className="text-[11px] text-muted-foreground" style={{ marginLeft: (depth + 1) * 16 }}>No sub-agents</p>
      )}
    </div>
  );
}

export default function AgentTeamHierarchy({ agentUserId, agentTier }: Props) {
  const [tree, setTree] = useState<SubAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const unlocked = UNLOCKED_TIERS.includes(agentTier);

  useEffect(() => {
    if (!unlocked) { setLoading(false); return; }
    (async () => {
      const list = await fetchSubAgents(agentUserId);
      setTree(list);
      setLoading(false);
    })();
  }, [agentUserId, unlocked]);

  const handleExpand = async (id: string) => {
    const children = await fetchSubAgents(id);
    setTree((prev) => {
      const apply = (nodes: SubAgent[]): SubAgent[] => nodes.map((n) => {
        if (n.user_id === id) return { ...n, children, loadedChildren: true };
        if (n.children) return { ...n, children: apply(n.children) };
        return n;
      });
      return apply(prev);
    });
  };

  if (!unlocked) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-3">
          <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="font-semibold">Team feature locked</p>
          <p className="text-sm text-muted-foreground">
            Reach <span className="font-medium text-primary">Elite</span> or <span className="font-medium text-primary">Master</span> tier to recruit sub-agents and view your team hierarchy.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> My Team</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : tree.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">
            You have no sub-agents yet. Master and Elite tier agents can recruit sub-agents.
          </p>
        ) : (
          tree.map((n) => <TeamNode key={n.user_id} node={n} depth={0} onExpand={handleExpand} />)
        )}
      </CardContent>
    </Card>
  );
}
