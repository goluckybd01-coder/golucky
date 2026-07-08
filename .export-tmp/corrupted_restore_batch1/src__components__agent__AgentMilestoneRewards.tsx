import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Gift, Calendar, TrendingUp, Users, CheckCircle, Clock, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { formatBDT, formatBDTFull } from '@/lib/agentConfig';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface MilestoneConfig {
  level: number;
  referrals: number;
  commission: number;
  bonusPercent: number;
  icon: string;
  name: string;
  color: string;
}

interface MilestoneReward {
  id: string;
  milestone_type: string;
  milestone_key: string;
  milestone_level: number;
  referral_count: number;
  commission_earned: number;
  bonus_amount: number;
  claimed_at: string | null;
  created_at: string;
}

const WEEKLY_MILESTONES: MilestoneConfig[] = [
  { level: 1, referrals: 3, commission: 500, bonusPercent: 5, icon: '🥉', name: 'Bronze Week', color: 'from-amber-600 to-amber-700' },
  { level: 2, referrals: 7, commission: 1500, bonusPercent: 8, icon: '🥈', name: 'Silver Week', color: 'from-gray-400 to-gray-500' },
  { level: 3, referrals: 15, commission: 5000, bonusPercent: 12, icon: '🥇', name: 'Gold Week', color: 'from-yellow-500 to-amber-500' },
  { level: 4, referrals: 25, commission: 15000, bonusPercent: 15, icon: '💎', name: 'Diamond Week', color: 'from-cyan-400 to-blue-500' },
];

const MONTHLY_MILESTONES: MilestoneConfig[] = [
  { level: 1, referrals: 10, commission: 2000, bonusPercent: 10, icon: '⭐', name: 'Rising Star', color: 'from-orange-500 to-red-500' },
  { level: 2, referrals: 25, commission: 8000, bonusPercent: 15, icon: '🌟', name: 'Super Star', color: 'from-purple-500 to-pink-500' },
  { level: 3, referrals: 50, commission: 25000, bonusPercent: 20, icon: '👑', name: 'Champion', color: 'from-yellow-400 to-orange-500' },
  { level: 4, referrals: 100, commission: 75000, bonusPercent: 25, icon: '🏆', name: 'Legend', color: 'from-amber-400 to-yellow-500' },
];

const getWeekKey = (date: Date) => {
  const year = date.getFullYear();
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekNum = Math.ceil((weekStart.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
};

const getMonthKey = (date: Date) => format(date, 'yyyy-MM');

interface AgentMilestoneRewardsProps {
  currentReferrals: number;
  currentCommission: number;
}

export default function AgentMilestoneRewards({ currentReferrals, currentCommission }: AgentMilestoneRewardsProps) {
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly'>('weekly');
  const [claimedRewards, setClaimedRewards] = useState<MilestoneReward[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({ referrals: 0, commission: 0 });
  const [monthlyStats, setMonthlyStats] = useState({ referrals: 0, commission: 0 });

  const now = new Date();
  const currentWeekKey = getWeekKey(now);
  const currentMonthKey = getMonthKey(now);

  useEffect(() => {
    loadMilestoneData();
  }, []);

  const loadMilestoneData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rewards } = await supabase
        .from('agent_milestone_rewards')
        .select('*')
        .eq('agent_user_id', user.id)
        .order('created_at', { ascending: false });

      if (rewards) setClaimedRewards(rewards as MilestoneReward[]);

      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

      const { data: weeklyReferrals } = await supabase
        .from('agent_referrals')
        .select('id')
        .eq('agent_user_id', user.id)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      const { data: weeklyCommissions } = await supabase
        .from('agent_commissions')
        .select('commission_amount')
        .eq('agent_user_id', user.id)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      setWeeklyStats({
        referrals: weeklyReferrals?.length || 0,
        commission: weeklyCommissions?.reduce((sum, c) => sum + c.commission_amount, 0) || 0,
      });

      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const { data: monthlyReferrals } = await supabase
        .from('agent_referrals')
        .select('id')
        .eq('agent_user_id', user.id)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      const { data: monthlyCommissions } = await supabase
        .from('agent_commissions')
        .select('commission_amount')
        .eq('agent_user_id', user.id)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      setMonthlyStats({
        referrals: monthlyReferrals?.length || 0,
        commission: monthlyCommissions?.reduce((sum, c) => sum + c.commission_amount, 0) || 0,
      });
    } catch (error) {
      console.error('Error loading milestone data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneStatus = (milestone: MilestoneConfig, type: 'weekly' | 'monthly') => {
    const stats = type === 'weekly' ? weeklyStats : monthlyStats;
    const key = type === 'weekly' ? currentWeekKey : currentMonthKey;
    const claimed = claimedRewards.find(
      r => r.milestone_type === type && r.milestone_key === key && r.milestone_level === milestone.level
    );
    if (claimed?.claimed_at) return { status: 'claimed', reward: claimed };
    const meetsReferrals = stats.referrals >= milestone.referrals;
    const meetsCommission = stats.commission >= milestone.commission;
    if (meetsReferrals && meetsCommission) return { status: 'claimable', reward: claimed };
    return { status: 'locked', reward: null };
  };

  const calculateBonus = (milestone: MilestoneConfig, type: 'weekly' | 'monthly') => {
    const stats = type === 'weekly' ? weeklyStats : monthlyStats;
    return (stats.commission * milestone.bonusPercent) / 100;
  };

  const claimReward = async (milestone: MilestoneConfig, type: 'weekly' | 'monthly') => {
    const key = type === 'weekly' ? currentWeekKey : currentMonthKey;
    const stats = type === 'weekly' ? weeklyStats : monthlyStats;
    const bonusAmount = calculateBonus(milestone, type);
    setClaiming(`${type}-${milestone.level}`);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: existing } = await supabase
        .from('agent_milestone_rewards')
        .select('id, claimed_at')
        .eq('agent_user_id', user.id)
        .eq('milestone_type', type)
        .eq('milestone_key', key)
        .eq('milestone_level', milestone.level)
        .maybeSingle();
      if (existing?.claimed_at) {
        toast.error('Already claimed!');
        return;
      }
      if (existing) {
        const { error } = await supabase
          .from('agent_milestone_rewards')
          .update({ claimed_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('agent_milestone_rewards').insert({
          agent_user_id: user.id,
          milestone_type: type,
          milestone_key: key,
          milestone_level: milestone.level,
          referral_count: stats.referrals,
          commission_earned: stats.commission,
          bonus_amount: bonusAmount,
          claimed_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
      const { data: wallet } = await supabase
        .from('wallets')
        .select('commission_balance, total_commission_earned')
        .eq('user_id', user.id)
        .single();
      if (wallet) {
        await supabase.from('wallets').update({
          commission_balance: (wallet.commission_balance || 0) + bonusAmount,
          total_commission_earned: (wallet.total_commission_earned || 0) + bonusAmount,
        }).eq('user_id', user.id);
      }
      toast.success(`🎉 ${milestone.name} Bonus Claimed!`, {
        description: `${formatBDTFull(bonusAmount)} added to your commission balance!`,
      });
      loadMilestoneData();
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('Failed to claim reward');
    } finally {
      setClaiming(null);
    }
  };

  const milestones = periodType === 'weekly' ? WEEKLY_MILESTONES : MONTHLY_MILESTONES;
  const stats = periodType === 'weekly' ? weeklyStats : monthlyStats;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Performance Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={periodType} onValueChange={(v) => setPeriodType(v as 'weekly' | 'monthly')}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="weekly" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Monthly
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg p-3 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">{periodType === 'weekly' ? 'This Week' : 'This Month'}</span>
            </div>
            <p className="text-lg font-bold text-amber-400">{stats.referrals} referrals</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-3 border border-green-500/30">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Commission</span>
            </div>
            <p className="text-lg font-bold text-green-400">{formatBDT(stats.commission)}</p>
          </div>
        </div>
        <div className="space-y-3">
          {milestones.map((milestone, index) => {
            const { status } = getMilestoneStatus(milestone, periodType);
            const bonusAmount = calculateBonus(milestone, periodType);
            const referralProgress = Math.min((stats.referrals / milestone.referrals) * 100, 100);
            const commissionProgress = Math.min((stats.commission / milestone.commission) * 100, 100);
            return (
              <motion.div
                key={milestone.level}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-xl border p-4 overflow-hidden ${
                  status === 'claimed' ? 'bg-green-500/10 border-green-500/30'
                  : status === 'claimable' ? 'bg-gradient-to-r from-primary/10 to-accent/10 border-primary/50'
                  : 'bg-card/50 border-border/50'
                }`}
              >
                {status === 'claimable' && <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 animate-pulse" />}
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{milestone.icon}</span>
                      <div>
                        <h4 className="font-semibold">{milestone.name}</h4>
                        <p className="text-xs text-muted-foreground">{milestone.bonusPercent}% bonus on commission</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Referrals: {stats.referrals}/{milestone.referrals}</span>
                          <span className={referralProgress >= 100 ? 'text-green-400' : 'text-muted-foreground'}>{referralProgress.toFixed(0)}%</span>
                        </div>
                        <Progress value={referralProgress} className="h-1.5" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Commission: {formatBDT(stats.commission)}/{formatBDT(milestone.commission)}</span>
                          <span className={commissionProgress >= 100 ? 'text-green-400' : 'text-muted-foreground'}>{commissionProgress.toFixed(0)}%</span>
                        </div>
                        <Progress value={commissionProgress} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {status === 'claimed' ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Claimed
                      </Badge>
                    ) : status === 'claimable' ? (
                      <Button size="sm" onClick={() => claimReward(milestone, periodType)} disabled={claiming === `${periodType}-${milestone.level}`} className="bg-gradient-to-r from-primary to-accent animate-pulse">
                        {claiming === `${periodType}-${milestone.level}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Gift className="h-4 w-4 mr-1" />Claim</>}
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Bonus</p>
                      <p className={`font-bold ${status === 'claimable' ? 'text-primary' : 'text-muted-foreground'}`}>{formatBDT(bonusAmount)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        {claimedRewards.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              <Sparkles className="h-3 w-3 inline mr-1" />
              You've claimed {claimedRewards.filter(r => r.claimed_at).length} milestone rewards!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
