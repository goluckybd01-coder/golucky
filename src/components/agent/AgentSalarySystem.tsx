import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Banknote, Calendar, Users, TrendingUp, CheckCircle, 
  Clock, AlertCircle, Loader2, History, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { AgentTier, getTierConfig, formatBDT, formatBDTFull } from '@/lib/agentConfig';
import { toast } from 'sonner';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

// Salary configuration per tier
const SALARY_CONFIG: Record<AgentTier, { baseSalary: number; perActiveReferral: number; minActiveReferrals: number }> = {
  starter: { baseSalary: 0, perActiveReferral: 0, minActiveReferrals: 0 }, // Not eligible
  bronze: { baseSalary: 0, perActiveReferral: 0, minActiveReferrals: 0 }, // Not eligible
  silver: { baseSalary: 0, perActiveReferral: 0, minActiveReferrals: 0 }, // Not eligible
  gold: { baseSalary: 5000, perActiveReferral: 200, minActiveReferrals: 10 },
  diamond: { baseSalary: 10000, perActiveReferral: 300, minActiveReferrals: 15 },
  elite: { baseSalary: 20000, perActiveReferral: 500, minActiveReferrals: 20 },
  master: { baseSalary: 50000, perActiveReferral: 1000, minActiveReferrals: 25 },
};

interface SalaryRecord {
  id: string;
  salary_month: string;
  agent_tier: string;
  base_salary: number;
  referral_bonus: number;
  active_referral_count: number;
  total_salary: number;
  status: string;
  claimed_at: string | null;
  paid_at: string | null;
  created_at: string;
}

interface AgentSalarySystemProps {
  agentTier: AgentTier;
  referralCount: number;
}

export default function AgentSalarySystem({ agentTier, referralCount }: AgentSalarySystemProps) {
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [activeReferrals, setActiveReferrals] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  const tierConfig = getTierConfig(agentTier);
  const salaryConfig = SALARY_CONFIG[agentTier];
  const isEligible = salaryConfig.baseSalary > 0;

  // Get previous month key for claiming
  const now = new Date();
  const prevMonth = subMonths(now, 1);
  const claimableMonth = format(prevMonth, 'yyyy-MM');
  const currentMonth = format(now, 'yyyy-MM');

  useEffect(() => {
    loadSalaryData();
  }, []);

  const loadSalaryData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load salary records
      const { data: records } = await supabase
        .from('agent_salary_records')
        .select('*')
        .eq('agent_user_id', user.id)
        .order('salary_month', { ascending: false })
        .limit(12);

      if (records) {
        setSalaryRecords(records as SalaryRecord[]);
      }

      // Calculate active referrals (referrals who deposited last month)
      const monthStart = startOfMonth(prevMonth);
      const monthEnd = endOfMonth(prevMonth);

      const { data: referrals } = await supabase
        .from('agent_referrals')
        .select('referred_user_id')
        .eq('agent_user_id', user.id);

      if (referrals && referrals.length > 0) {
        const referralIds = referrals.map(r => r.referred_user_id);
        
        // Check which referrals made deposits last month
        const { data: activeDeposits } = await supabase
          .from('wallet_ledger')
          .select('user_id')
          .in('user_id', referralIds)
          .eq('ledger_type', 'DEPOSIT')
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        if (activeDeposits) {
          const uniqueActive = new Set(activeDeposits.map(d => d.user_id));
          setActiveReferrals(uniqueActive.size);
        }
      }
    } catch (error) {
      console.error('Error loading salary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSalary = () => {
    if (!isEligible || activeReferrals < salaryConfig.minActiveReferrals) {
      return { baseSalary: 0, referralBonus: 0, total: 0 };
    }

    const baseSalary = salaryConfig.baseSalary;
    const referralBonus = activeReferrals * salaryConfig.perActiveReferral;
    const total = baseSalary + referralBonus;

    return { baseSalary, referralBonus, total };
  };

  const canClaimSalary = () => {
    if (!isEligible) return false;
    if (activeReferrals < salaryConfig.minActiveReferrals) return false;
    
    // Check if already claimed for previous month
    const alreadyClaimed = salaryRecords.some(r => r.salary_month === claimableMonth);
    return !alreadyClaimed;
  };

  const claimSalary = async () => {
    if (!canClaimSalary()) return;

    setClaiming(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const salary = calculateSalary();

      const { error } = await supabase
        .from('agent_salary_records')
        .insert({
          agent_user_id: user.id,
          salary_month: claimableMonth,
          agent_tier: agentTier,
          base_salary: salary.baseSalary,
          referral_bonus: salary.referralBonus,
          active_referral_count: activeReferrals,
          total_salary: salary.total,
          status: 'pending',
          claimed_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success(
        '💰 Salary Claim Submitted!',
        { description: `${formatBDTFull(salary.total)} pending admin approval` }
      );

      loadSalaryData();
    } catch (error: any) {
      console.error('Error claiming salary:', error);
      toast.error(error.message || 'Failed to claim salary');
    } finally {
      setClaiming(false);
    }
  };

  const salary = calculateSalary();
  const progressToMinReferrals = Math.min((activeReferrals / salaryConfig.minActiveReferrals) * 100, 100);
  const existingClaim = salaryRecords.find(r => r.salary_month === claimableMonth);

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
          <Banknote className="h-5 w-5 text-green-400" />
          Monthly Salary
          {isEligible && (
            <Badge className="ml-auto bg-green-500/20 text-green-400 border-green-500/30">
              Eligible
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEligible ? (
          <div className="text-center py-6 space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-500/10">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-300">Salary Not Available</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Monthly salary is available from Gold tier onwards.
                Upgrade your tier to unlock this benefit!
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto text-xs">
              <div className="bg-yellow-500/10 rounded-lg p-2 border border-yellow-500/30">
                <p className="text-yellow-400 font-semibold">🥇 Gold</p>
                <p className="text-muted-foreground">৳5,000/mo</p>
              </div>
              <div className="bg-cyan-500/10 rounded-lg p-2 border border-cyan-500/30">
                <p className="text-cyan-400 font-semibold">💎 Diamond</p>
                <p className="text-muted-foreground">৳10,000/mo</p>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-2 border border-purple-500/30">
                <p className="text-purple-400 font-semibold">👑 Elite</p>
                <p className="text-muted-foreground">৳20,000/mo</p>
              </div>
              <div className="bg-rose-500/10 rounded-lg p-2 border border-rose-500/30">
                <p className="text-rose-400 font-semibold">🏆 Master</p>
                <p className="text-muted-foreground">৳50,000/mo</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Current Month Stats */}
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {format(prevMonth, 'MMMM yyyy')} Salary
                  </span>
                </div>
                <span className="text-2xl">{tierConfig?.icon}</span>
              </div>

              {/* Active Referrals Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    Active Referrals: {activeReferrals}/{salaryConfig.minActiveReferrals} required
                  </span>
                  <span className={progressToMinReferrals >= 100 ? 'text-green-400' : 'text-amber-400'}>
                    {progressToMinReferrals.toFixed(0)}%
                  </span>
                </div>
                <Progress value={progressToMinReferrals} className="h-2" />
              </div>

              {/* Salary Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Salary ({tierConfig?.name})</span>
                  <span className="font-medium">{formatBDT(salary.baseSalary)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Referral Bonus ({activeReferrals} × {formatBDT(salaryConfig.perActiveReferral)})
                  </span>
                  <span className="font-medium text-green-400">+{formatBDT(salary.referralBonus)}</span>
                </div>
                <div className="border-t border-border/50 pt-2 flex justify-between">
                  <span className="font-semibold">Total Salary</span>
                  <span className="text-xl font-bold text-primary">{formatBDT(salary.total)}</span>
                </div>
              </div>
            </div>

            {/* Claim Button or Status */}
            {existingClaim ? (
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                existingClaim.status === 'paid' 
                  ? 'bg-green-500/10 border border-green-500/30'
                  : existingClaim.status === 'approved'
                  ? 'bg-blue-500/10 border border-blue-500/30'
                  : existingClaim.status === 'rejected'
                  ? 'bg-red-500/10 border border-red-500/30'
                  : 'bg-amber-500/10 border border-amber-500/30'
              }`}>
                <div className="flex items-center gap-2">
                  {existingClaim.status === 'paid' ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : existingClaim.status === 'approved' ? (
                    <CheckCircle className="h-5 w-5 text-blue-400" />
                  ) : existingClaim.status === 'rejected' ? (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  ) : (
                    <Clock className="h-5 w-5 text-amber-400" />
                  )}
                  <div>
                    <p className="font-medium text-sm">
                      {existingClaim.status === 'paid' ? 'Salary Paid' :
                       existingClaim.status === 'approved' ? 'Approved - Processing' :
                       existingClaim.status === 'rejected' ? 'Claim Rejected' :
                       'Pending Approval'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBDTFull(existingClaim.total_salary)}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={
                  existingClaim.status === 'paid' ? 'text-green-400 border-green-500/30' :
                  existingClaim.status === 'approved' ? 'text-blue-400 border-blue-500/30' :
                  existingClaim.status === 'rejected' ? 'text-red-400 border-red-500/30' :
                  'text-amber-400 border-amber-500/30'
                }>
                  {existingClaim.status.charAt(0).toUpperCase() + existingClaim.status.slice(1)}
                </Badge>
              </div>
            ) : activeReferrals >= salaryConfig.minActiveReferrals ? (
              <Button
                onClick={claimSalary}
                disabled={claiming}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {claiming ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Banknote className="h-4 w-4 mr-2" />
                )}
                Claim {format(prevMonth, 'MMMM')} Salary
              </Button>
            ) : (
              <div className="text-center py-3 text-sm text-muted-foreground">
                <AlertCircle className="h-5 w-5 mx-auto mb-1 text-amber-400" />
                Need {salaryConfig.minActiveReferrals - activeReferrals} more active referrals to claim
              </div>
            )}

            {/* Salary History */}
            {salaryRecords.length > 0 && (
              <Collapsible open={showHistory} onOpenChange={setShowHistory}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Salary History
                    </span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  {salaryRecords.slice(0, 6).map((record) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-2 rounded-lg bg-card/50 border border-border/50"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {format(new Date(record.salary_month + '-01'), 'MMM yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {record.active_referral_count} active referrals
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatBDT(record.total_salary)}</p>
                        <Badge variant="outline" className={`text-xs ${
                          record.status === 'paid' ? 'text-green-400' :
                          record.status === 'approved' ? 'text-blue-400' :
                          record.status === 'rejected' ? 'text-red-400' :
                          'text-amber-400'
                        }`}>
                          {record.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
