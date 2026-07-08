import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, TrendingUp, Medal, Crown, Award, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { formatBDT, getTierConfig, AgentTier } from '@/lib/agentConfig';

interface LeaderboardAgent {
  user_id: string;
  username: string | null;
  agent_tier: AgentTier;
  agent_code: string;
  referral_count: number;
  total_commission: number;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-400" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-300" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
  }
};

const getRankBgClass = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/40';
    case 2:
      return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/40';
    case 3:
      return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/40';
    default:
      return 'bg-card/50';
  }
};

export default function AgentLeaderboard() {
  const [loading, setLoading] = useState(true);
  const [leaderboardType, setLeaderboardType] = useState<'referrals' | 'commission'>('referrals');
  const [agents, setAgents] = useState<LeaderboardAgent[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [leaderboardType]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      const { data: agentProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username, agent_tier, agent_code')
        .eq('agent_status', 'approved')
        .not('agent_tier', 'is', null);

      if (profileError) throw profileError;

      if (!agentProfiles || agentProfiles.length === 0) {
        setAgents([]);
        setLoading(false);
        return;
      }

      const { data: referralCounts, error: refError } = await supabase
        .from('agent_referrals')
        .select('agent_user_id');

      if (refError) throw refError;

      const { data: commissions, error: commError } = await supabase
        .from('agent_commissions')
        .select('agent_user_id, commission_amount');

      if (commError) throw commError;

      const referralMap: Record<string, number> = {};
      const commissionMap: Record<string, number> = {};

      referralCounts?.forEach(r => {
        referralMap[r.agent_user_id] = (referralMap[r.agent_user_id] || 0) + 1;
      });

      commissions?.forEach(c => {
        commissionMap[c.agent_user_id] = (commissionMap[c.agent_user_id] || 0) + c.commission_amount;
      });

      const leaderboard: LeaderboardAgent[] = agentProfiles.map(p => ({
        user_id: p.user_id,
        username: p.username,
        agent_tier: p.agent_tier as AgentTier,
        agent_code: p.agent_code || '',
        referral_count: referralMap[p.user_id] || 0,
        total_commission: commissionMap[p.user_id] || 0,
      }));

      if (leaderboardType === 'referrals') {
        leaderboard.sort((a, b) => b.referral_count - a.referral_count);
      } else {
        leaderboard.sort((a, b) => b.total_commission - a.total_commission);
      }

      if (user) {
        const userRank = leaderboard.findIndex(a => a.user_id === user.id);
        setCurrentUserRank(userRank !== -1 ? userRank + 1 : null);
      }

      setAgents(leaderboard.slice(0, 10));
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Agent Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={leaderboardType} onValueChange={(v) => setLeaderboardType(v as 'referrals' | 'commission')}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="referrals" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              By Referrals
            </TabsTrigger>
            <TabsTrigger value="commission" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              By Commission
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No agents on the leaderboard yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {agents.map((agent, index) => {
              const rank = index + 1;
              const tierConfig = getTierConfig(agent.agent_tier);
              const isCurrentUser = agent.user_id === currentUserId;

              return (
                <motion.div
                  key={agent.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${getRankBgClass(rank)} ${
                    isCurrentUser ? 'ring-2 ring-primary/50' : ''
                  }`}
                >
                  <div className="w-8 flex items-center justify-center">
                    {getRankIcon(rank)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{tierConfig?.icon}</span>
                      <span className="font-medium truncate">
                        {agent.username || `Agent ${agent.agent_code}`}
                      </span>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs bg-primary/20 text-primary border-primary/30">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className={`text-xs bg-gradient-to-r ${tierConfig?.gradient} text-white`}>
                        {tierConfig?.name}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-right">
                    {leaderboardType === 'referrals' ? (
                      <div>
                        <p className="text-lg font-bold text-amber-400">{agent.referral_count}</p>
                        <p className="text-xs text-muted-foreground">referrals</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-bold text-green-400">{formatBDT(agent.total_commission)}</p>
                        <p className="text-xs text-muted-foreground">earned</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {currentUserRank && currentUserRank > 10 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your Rank</span>
              <Badge variant="outline" className="text-primary">
                #{currentUserRank}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
