import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Wallet, TrendingUp, Copy,
  ArrowUpRight, Search, Loader2, CheckCircle,
  DollarSign, Send, History, Award, AlertCircle,
  Facebook, Clock, UserPlus, Filter, XCircle, Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { 
  getTierConfig, 
  AgentTier, 
  formatBDTFull, 
  formatBDT,
  AGENT_TIERS
} from '@/lib/agentConfig';
import { format, formatDistanceToNow, isToday, startOfDay, subDays, isWithinInterval } from 'date-fns';
import AgentCommissionAnalytics from '@/components/agent/AgentCommissionAnalytics';
import AgentLeaderboard from '@/components/agent/AgentLeaderboard';
import AgentQRCode from '@/components/agent/AgentQRCode';
import AgentMilestoneRewards from '@/components/agent/AgentMilestoneRewards';
import AgentSalarySystem from '@/components/agent/AgentSalarySystem';
import AgentPerformanceAnalytics from '@/components/agent/AgentPerformanceAnalytics';
import AgentSessionHistory from '@/components/agent/AgentSessionHistory';
import AgentNotificationPanel from '@/components/agent/AgentNotificationPanel';
import AgentTeamHierarchy from '@/components/agent/AgentTeamHierarchy';
import AgentTopupLog from '@/components/agent/AgentTopupLog';
import AgentCommissionWithdrawHistory from '@/components/agent/AgentCommissionWithdrawHistory';
import { ArrowDownToLine } from 'lucide-react';
interface AgentProfile {
  user_id: string;
  agent_tier: AgentTier;
  agent_code: string;
  agent_display_id: string | null;
  agent_status: string;
  username: string | null;
  display_user_id: string | null;
}

interface WalletData {
  balance: number;
  commission_balance: number;
  total_commission_earned: number;
  total_topups_sent: number;
}

interface ReferralData {
  id: string;
  referred_user_id: string;
  created_at: string;
  first_deposit_amount: number | null;
  first_deposit_at: string | null;
  total_betting_volume: number | null;
  total_deposit_volume: number | null;
  commission_earned: number | null;
  is_active: boolean | null;
  last_activity_at: string | null;
  profile?: {
    username: string | null;
    display_user_id: string | null;
    display_referral_id: string | null;
  };
  wallet?: {
    total_deposit: number;
    total_bet: number;
  };
}

interface CommissionData {
  id: string;
  commission_type: string;
  source_amount: number;
  commission_rate: number;
  commission_amount: number;
  created_at: string;
  referred_user_id: string;
  profile?: {
    username: string | null;
    display_user_id: string | null;
  };
}

export default function AgentDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(searchParams.get('welcome') === '1');
  useEffect(() => {
    if (showWelcome) {
      const t = setTimeout(() => {
        setShowWelcome(false);
        searchParams.delete('welcome');
        setSearchParams(searchParams, { replace: true });
      }, 8000);
      return () => clearTimeout(t);
    }
  }, [showWelcome, searchParams, setSearchParams]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [referralFilter, setReferralFilter] = useState<'all' | 'deposited' | 'not_deposited'>('all');
  const [referralSearch, setReferralSearch] = useState('');
  
  // Top-up modal state
  const [showTopup, setShowTopup] = useState(false);
  const [topupUserId, setTopupUserId] = useState('');
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [searchedUser, setSearchedUser] = useState<{ id: string; username: string | null } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Withdraw commission modal
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Tracked agent session
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadAgentData();
  }, []);

  // Track agent session: insert on mount, heartbeat every 60s, mark inactive on unmount
  useEffect(() => {
    let sessionId: string | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data, error } = await supabase
        .from('agent_sessions')
        .insert({
          agent_user_id: user.id,
          device_info: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          is_active: true,
        })
        .select('id')
        .maybeSingle();
      if (!error && data) {
        sessionId = data.id;
        setCurrentSessionId(data.id);
        interval = setInterval(() => {
          supabase.from('agent_sessions')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', data.id)
            .then(() => {});
        }, 60_000);
      }
    })();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (sessionId) {
        supabase.from('agent_sessions')
          .update({ is_active: false, last_active_at: new Date().toISOString() })
          .eq('id', sessionId)
          .then(() => {});
      }
    };
  }, []);

  const loadAgentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, agent_tier, agent_code, agent_display_id, agent_status, username, display_user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError || !profileData || profileData.agent_status !== 'approved') {
        // Gate handled by AgentGate; bail without redirecting to avoid loops.
        return;
      }

      setProfile(profileData as AgentProfile);

      // Load wallet
      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance, commission_balance, total_commission_earned, total_topups_sent')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletData) {
        setWallet(walletData);
      }

      // Load referrals with extended stats
      const { data: referralData } = await supabase
        .from('agent_referrals')
        .select('id, referred_user_id, created_at, first_deposit_amount, first_deposit_at, total_betting_volume, total_deposit_volume, commission_earned, is_active, last_activity_at')
        .eq('agent_user_id', user.id)
        .order('created_at', { ascending: false });

      if (referralData && referralData.length > 0) {
        // Fetch profile data for referred users
        const userIds = referralData.map(r => r.referred_user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, username, display_user_id, display_referral_id')
          .in('user_id', userIds);

        // Fetch wallet data for referred users
        const { data: walletsData } = await supabase
          .from('wallets')
          .select('user_id, total_deposit, total_bet')
          .in('user_id', userIds);

        const referralsWithProfiles = referralData.map(ref => ({
          ...ref,
          profile: profilesData?.find(p => p.user_id === ref.referred_user_id) || undefined,
          wallet: walletsData?.find(w => w.user_id === ref.referred_user_id) || undefined
        }));

        setReferrals(referralsWithProfiles);
      } else {
        setReferrals([]);
      }

      // Load commissions
      const { data: commissionData } = await supabase
        .from('agent_commissions')
        .select('*')
        .eq('agent_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (commissionData && commissionData.length > 0) {
        // Fetch profile data for referred users in commissions
        const commUserIds = [...new Set(commissionData.map(c => c.referred_user_id))];
        const { data: commProfilesData } = await supabase
          .from('profiles')
          .select('user_id, username, display_user_id')
          .in('user_id', commUserIds);

        const commissionsWithProfiles = commissionData.map(comm => ({
          ...comm,
          profile: commProfilesData?.find(p => p.user_id === comm.referred_user_id) || undefined
        }));

        setCommissions(commissionsWithProfiles);
      } else {
        setCommissions([]);
      }
    } catch (error) {
      console.error('Error loading agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const searchUser = async () => {
    if (!topupUserId.trim()) return;
    
    setSearchLoading(true);
    setSearchedUser(null);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username')
        .or(`user_id.eq.${topupUserId},username.ilike.%${topupUserId}%`)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSearchedUser({ id: data.user_id, username: data.username });
      } else {
        toast.error('User not found');
      }
    } catch (error) {
      console.error('Error searching user:', error);
      toast.error('Failed to search user');
    } finally {
      setSearchLoading(false);
    }
  };

  const executeTopup = async () => {
    if (!searchedUser || !topupAmount || parseFloat(topupAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(topupAmount);
    
    if (wallet && amount > wallet.balance) {
      toast.error('Insufficient balance');
      return;
    }

    setTopupLoading(true);
    try {
      // Call edge function for secure top-up
      const { data, error } = await supabase.functions.invoke('agent-topup', {
        body: {
          targetUserId: searchedUser.id,
          amount: amount,
        },
      });

      if (error) throw error;

      toast.success(`Successfully topped up ${formatBDTFull(amount)} to user`);
      setShowTopup(false);
      setTopupUserId('');
      setTopupAmount('');
      setSearchedUser(null);
      loadAgentData(); // Refresh data
    } catch (error: any) {
      console.error('Top-up error:', error);
      toast.error(error.message || 'Failed to process top-up');
    } finally {
      setTopupLoading(false);
    }
  };

  const executeWithdrawCommission = async () => {
    if (!wallet || (wallet.commission_balance || 0) <= 0) return;
    setWithdrawLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('agent-withdraw-commission');
      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error || 'Failed');
      const amt = Number(data?.amount || wallet.commission_balance);
      toast.success(`Commission withdrawn: ${formatBDTFull(amt)} to your main balance`);
      setShowWithdraw(false);
      loadAgentData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to withdraw commission');
    } finally {
      setWithdrawLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!profile) return null;

  const tierConfig = getTierConfig(profile.agent_tier);
  const referralLink = `${window.location.origin}/register?ref=${profile.agent_code}`;

  const depositCommissions = commissions.filter(c => c.commission_type === 'deposit');
  const bettingCommissions = commissions.filter(c => c.commission_type === 'betting');
  const totalDepositComm = depositCommissions.reduce((sum, c) => sum + c.commission_amount, 0);
  const totalBettingComm = bettingCommissions.reduce((sum, c) => sum + c.commission_amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Premium Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-primary via-accent to-primary shadow-xl">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.span 
                className="text-4xl"
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {tierConfig?.icon}
              </motion.span>
              <div>
                <h1 className="text-xl font-bold text-white">{tierConfig?.name}</h1>
                <p className="text-xs text-white/80">এজেন্ট ড্যাশবোর্ড</p>
              </div>
            </div>
            <div className="text-right">
              {profile.agent_display_id && (
                <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                  {profile.agent_display_id}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6 pb-24">
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl border border-[#d4af37]/30 mb-6
                       bg-gradient-to-br from-emerald-950 via-[#0a0a0a] to-[#0a0a0a]
                       shadow-[0_20px_60px_-20px_rgba(212,175,55,0.4)]"
            role="status"
            aria-live="polite"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-16 left-1/3 w-[400px] h-[200px] bg-[#d4af37]/20 blur-[80px] rounded-full" />
              <div className="absolute -bottom-12 right-0 w-[300px] h-[200px] bg-emerald-500/20 blur-[80px] rounded-full" />
            </div>
            <div className="relative p-5 sm:p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#b8860b] flex items-center justify-center shadow-[0_10px_30px_-10px_rgba(212,175,55,0.7)] shrink-0">
                <CheckCircle className="w-6 h-6 text-black" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#f5d97a] font-bold mb-1">
                  Congratulations
                </div>
                <div className="text-lg sm:text-xl font-black text-white leading-tight">
                  You are now an Official <span className="bg-gradient-to-r from-[#f5d97a] to-[#b8860b] bg-clip-text text-transparent">GoLucky Agent</span>.
                </div>
                <div className="text-xs text-white/60 mt-1">
                  Welcome to the Partner Network. All agent tools are unlocked.
                </div>
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className="text-white/40 hover:text-white text-lg leading-none px-2"
                aria-label="Dismiss welcome"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}

        {/* Agent ID Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/30 overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-5" />
            <CardContent className="p-4 relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">এজেন্ট আইডি</p>
                  <div className="flex items-center gap-2">
                    <code className="text-lg font-bold text-primary">
                      {profile.agent_display_id || 'পেন্ডিং'}
                    </code>
                    {profile.agent_display_id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-primary/20"
                        onClick={() => copyToClipboard(profile.agent_display_id!, 'এজেন্ট আইডি')}
                      >
                        <Copy className="h-3 w-3 text-primary" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">এজেন্ট কোড</p>
                  <div className="flex items-center gap-2">
                    <code className="text-lg font-bold text-accent">
                      {profile.agent_code}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-accent/20"
                      onClick={() => copyToClipboard(profile.agent_code, 'এজেন্ট কোড')}
                    >
                      <Copy className="h-3 w-3 text-accent" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-green-500/15 to-green-600/15 border-green-500/30 overflow-hidden">
              <CardContent className="p-4 relative">
                <div className="absolute -right-2 -top-2 w-16 h-16 bg-green-500/10 rounded-full blur-xl" />
                <Wallet className="h-5 w-5 text-green-400 mb-2" />
                <p className="text-xs text-muted-foreground">মেইন ব্যালেন্স</p>
                <p className="text-lg font-bold text-green-400">{formatBDT(wallet?.balance || 0)}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-gradient-to-br from-blue-500/15 to-blue-600/15 border-blue-500/30 overflow-hidden">
              <CardContent className="p-4 relative">
                <div className="absolute -right-2 -top-2 w-16 h-16 bg-blue-500/10 rounded-full blur-xl" />
                <DollarSign className="h-5 w-5 text-blue-400 mb-2" />
                <p className="text-xs text-muted-foreground">কমিশন ব্যালেন্স</p>
                <p className="text-lg font-bold text-blue-400">{formatBDT(wallet?.commission_balance || 0)}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-purple-500/15 to-purple-600/15 border-purple-500/30 overflow-hidden">
              <CardContent className="p-4 relative">
                <div className="absolute -right-2 -top-2 w-16 h-16 bg-purple-500/10 rounded-full blur-xl" />
                <TrendingUp className="h-5 w-5 text-purple-400 mb-2" />
                <p className="text-xs text-muted-foreground">মোট আয়</p>
                <p className="text-lg font-bold text-purple-400">{formatBDT(wallet?.total_commission_earned || 0)}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="bg-gradient-to-br from-amber-500/15 to-amber-600/15 border-amber-500/30 overflow-hidden">
              <CardContent className="p-4 relative">
                <div className="absolute -right-2 -top-2 w-16 h-16 bg-amber-500/10 rounded-full blur-xl" />
                <Users className="h-5 w-5 text-amber-400 mb-2" />
                <p className="text-xs text-muted-foreground">মোট রেফারেল</p>
                <p className="text-lg font-bold text-amber-400">{referrals.length}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Enhanced Referral Section */}
        <Card className="mb-6 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Link Preview Card */}
            <div className="relative bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl p-4 border border-border/50">
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                  AG Code
                </Badge>
              </div>
              
              {/* Agent Code Display */}
              <div className="text-center mb-4">
                <p className="text-xs text-muted-foreground mb-1">Your Agent Code</p>
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg px-4 py-2 border border-primary/30">
                  <code className="text-2xl font-bold text-primary tracking-wider">
                    {profile.agent_code}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-primary/20"
                    onClick={() => copyToClipboard(profile.agent_code, 'Agent code')}
                  >
                    <Copy className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              </div>

              {/* Full Referral Link */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Registration Link</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-background/80 rounded-lg px-3 py-2 border border-border/50 overflow-hidden">
                    <p className="text-sm font-mono text-muted-foreground truncate">
                      {referralLink}
                    </p>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    className="px-4"
                    onClick={() => copyToClipboard(referralLink, 'Referral link')}
                  >
                    <Copy className="h-4 w-4 mr-1.5" />
                    Copy
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg p-3 text-center border border-green-500/20">
                <p className="text-lg font-bold text-green-400">{referrals.length}</p>
                <p className="text-[10px] text-muted-foreground">Referrals</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg p-3 text-center border border-blue-500/20">
                <p className="text-lg font-bold text-blue-400">{depositCommissions.length}</p>
                <p className="text-[10px] text-muted-foreground">Deposits</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-lg p-3 text-center border border-purple-500/20">
                <p className="text-lg font-bold text-purple-400">{bettingCommissions.length}</p>
                <p className="text-[10px] text-muted-foreground">Bets</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-lg p-3 text-center border border-amber-500/20">
                <p className="text-lg font-bold text-amber-400">
                  {referrals.length > 0 ? Math.round((depositCommissions.length / referrals.length) * 100) : 0}%
                </p>
                <p className="text-[10px] text-muted-foreground">Conversion</p>
              </div>
            </div>

            {/* Commission Rates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-500/10 rounded-lg p-3 text-center border border-green-500/20">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <p className="text-xs text-muted-foreground">Deposit Rate</p>
                </div>
                <p className="text-xl font-bold text-green-400">{tierConfig?.depositCommissionRate}%</p>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-3 text-center border border-blue-500/20">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <p className="text-xs text-muted-foreground">Betting Rate</p>
                </div>
                <p className="text-xl font-bold text-blue-400">{tierConfig?.bettingCommissionRate}%</p>
              </div>
            </div>

            {/* Recent Referrals Quick View */}
            {referrals.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5" />
                    Recent Referrals
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-primary"
                    onClick={() => setActiveTab('referrals')}
                  >
                    View All
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {referrals.slice(0, 5).map((ref, index) => {
                    const hasDeposited = (ref.wallet?.total_deposit || 0) > 0;
                    return (
                      <motion.div
                        key={ref.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg border border-border/30 hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center ${
                            hasDeposited 
                              ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30' 
                              : 'bg-gradient-to-br from-muted to-muted/80 border border-border/50'
                          }`}>
                            {hasDeposited ? (
                              <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                            ) : (
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium leading-tight">
                                {ref.profile?.username || 'User'}
                              </p>
                              {hasDeposited ? (
                                <Badge variant="outline" className="h-4 px-1 text-[9px] bg-green-500/10 text-green-400 border-green-500/30">
                                  Deposited
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="h-4 px-1 text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/30">
                                  Pending
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {ref.profile?.display_user_id && (
                                <span className="text-[10px] font-mono text-orange-400">
                                  {ref.profile.display_user_id}
                                </span>
                              )}
                              {hasDeposited && (
                                <span className="text-[10px] text-green-400">
                                  ৳{formatBDT(ref.wallet?.total_deposit || 0)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(ref.created_at), { addSuffix: true })}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                {referrals.length > 5 && (
                  <p className="text-[10px] text-center text-muted-foreground">
                    +{referrals.length - 5} more referrals
                  </p>
                )}
              </div>
            )}

            {referrals.length === 0 && (
              <div className="text-center py-4 bg-muted/30 rounded-lg border border-dashed border-border/50">
                <UserPlus className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No referrals yet</p>
                <p className="text-xs text-muted-foreground/70">Share your link to get started!</p>
              </div>
            )}

            {/* QR Code & Social Share */}
            <div className="flex items-center justify-between pt-2">
              <AgentQRCode
                referralLink={referralLink}
                agentCode={profile.agent_code}
                tierName={tierConfig?.name || 'Agent'}
                tierIcon={tierConfig?.icon || '🎯'}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20"
                  onClick={() => {
                    const message = `🎰 Join GoLucky and start winning!\n\n💰 Use my agent code: ${profile.agent_code}\n🎁 Get extra signup bonus!\n\n👉 ${referralLink}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#0088cc]/10 border-[#0088cc]/30 text-[#0088cc] hover:bg-[#0088cc]/20"
                  onClick={() => {
                    const message = `🎰 Join GoLucky and start winning!\n\n💰 Use my agent code: ${profile.agent_code}\n🎁 Get extra signup bonus!\n\n👉 ${referralLink}`;
                    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(message)}`, '_blank');
                  }}
                >
                  <Send className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#1877F2]/10 border-[#1877F2]/30 text-[#1877F2] hover:bg-[#1877F2]/20"
                  onClick={() => {
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(`Join GoLucky using my agent code: ${profile.agent_code} and get extra bonus!`)}`, '_blank', 'width=600,height=400');
                  }}
                >
                  <Facebook className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => setShowTopup(true)}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/30"
            >
              <Send className="mr-2 h-4 w-4" />
              ইউজার টপআপ
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <div className="space-y-1">
              <Button
                onClick={() => setShowWithdraw(true)}
                size="lg"
                disabled={!wallet || (wallet.commission_balance || 0) <= 0}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDownToLine className="mr-2 h-4 w-4" />
                কমিশন উত্তোলন
              </Button>
              {(!wallet || (wallet.commission_balance || 0) <= 0) && (
                <p className="text-[10px] text-muted-foreground text-center">No commission to withdraw</p>
              )}
            </div>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="col-span-2 md:col-span-1">
            <Button
              onClick={() => navigate('/support/chat?type=agent')}
              size="lg"
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/30"
            >
              <Headphones className="mr-2 h-4 w-4" />
              এজেন্ট সাপোর্ট
            </Button>
          </motion.div>
        </div>

        {/* Tabs for Commissions */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="w-full mb-4 overflow-x-auto">
            <TabsList className="inline-flex w-max md:flex md:w-full md:flex-wrap gap-0.5 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="overview" className="text-xs px-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">ওভারভিউ</TabsTrigger>
              <TabsTrigger value="performance" className="text-xs px-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">পারফরম্যান্স</TabsTrigger>
              <TabsTrigger value="salary" className="text-xs px-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">বেতন</TabsTrigger>
              <TabsTrigger value="rewards" className="text-xs px-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">পুরস্কার</TabsTrigger>
              <TabsTrigger value="leaderboard" className="text-xs px-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">র‍্যাংকিং</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs px-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">স্ট্যাটস</TabsTrigger>
              <TabsTrigger value="session" className="text-xs px-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">সেশন</TabsTrigger>
              <TabsTrigger value="notices" className="text-xs px-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">নোটিশ</TabsTrigger>
              <TabsTrigger value="team" className="text-xs px-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">টিম</TabsTrigger>
              <TabsTrigger value="topuplog" className="text-xs px-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">টপআপ লগ</TabsTrigger>
              <TabsTrigger value="withdrawhistory" className="text-xs px-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">উত্তোলন</TabsTrigger>
              <TabsTrigger value="deposit" className="text-xs px-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">ডিপোজিট</TabsTrigger>
              <TabsTrigger value="betting" className="text-xs px-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">বেটিং</TabsTrigger>
              <TabsTrigger value="referrals" className="text-xs px-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">রেফস</TabsTrigger>
            </TabsList>
          </div>


          <TabsContent value="overview">
            {/* Today's Earnings Card */}
            {(() => {
              const todayCommissions = commissions.filter(c => isToday(new Date(c.created_at)));
              const todayDeposit = todayCommissions.filter(c => c.commission_type === 'deposit').reduce((sum, c) => sum + c.commission_amount, 0);
              const todayBetting = todayCommissions.filter(c => c.commission_type === 'betting').reduce((sum, c) => sum + c.commission_amount, 0);
              const todayTotal = todayDeposit + todayBetting;
              
              const yesterdayCommissions = commissions.filter(c => {
                const date = new Date(c.created_at);
                const yesterday = subDays(new Date(), 1);
                return isWithinInterval(date, { start: startOfDay(yesterday), end: startOfDay(new Date()) });
              });
              const yesterdayTotal = yesterdayCommissions.reduce((sum, c) => sum + c.commission_amount, 0);
              
              const growthPercent = yesterdayTotal > 0 
                ? Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100)
                : todayTotal > 0 ? 100 : 0;

              const todayReferrals = referrals.filter(r => isToday(new Date(r.created_at))).length;

              return (
                <Card className="mb-4 overflow-hidden border-primary/30">
                  <div className="bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                      <div>
                          <h3 className="font-bold text-lg">আজকের আয়</h3>
                          <p className="text-xs text-muted-foreground">{format(new Date(), 'EEEE, dd MMM yyyy')}</p>
                        </div>
                      </div>
                      {growthPercent !== 0 && (
                        <Badge className={`${growthPercent > 0 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                          {growthPercent > 0 ? '+' : ''}{growthPercent}% গতকালের চেয়ে
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-center py-4">
                      <motion.p 
                        className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {formatBDTFull(todayTotal)}
                      </motion.p>
                      <p className="text-sm text-muted-foreground mt-1">আজ মোট আয়</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="bg-background/50 rounded-xl p-3 text-center border border-green-500/20">
                        <p className="text-lg font-bold text-green-400">{formatBDT(todayDeposit)}</p>
                        <p className="text-[10px] text-muted-foreground">ডিপোজিট কমি.</p>
                      </div>
                      <div className="bg-background/50 rounded-xl p-3 text-center border border-blue-500/20">
                        <p className="text-lg font-bold text-blue-400">{formatBDT(todayBetting)}</p>
                        <p className="text-[10px] text-muted-foreground">বেটিং কমি.</p>
                      </div>
                      <div className="bg-background/50 rounded-xl p-3 text-center border border-amber-500/20">
                        <p className="text-lg font-bold text-amber-400">{todayReferrals}</p>
                        <p className="text-[10px] text-muted-foreground">নতুন রেফারেল</p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })()}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Deposit Commission</p>
                  <p className="text-2xl font-bold text-green-400">{formatBDT(totalDepositComm)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Betting Commission</p>
                  <p className="text-2xl font-bold text-blue-400">{formatBDT(totalBettingComm)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Total Top-ups Sent</p>
                <p className="text-xl font-bold">{formatBDTFull(wallet?.total_topups_sent || 0)}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <AgentPerformanceAnalytics agentUserId={profile.user_id} />
          </TabsContent>

          <TabsContent value="salary">
            <AgentSalarySystem
              agentTier={profile.agent_tier}
              referralCount={referrals.length}
            />
          </TabsContent>

          <TabsContent value="rewards">
            <AgentMilestoneRewards
              currentReferrals={referrals.length}
              currentCommission={wallet?.total_commission_earned || 0}
            />
          </TabsContent>

          <TabsContent value="leaderboard">
            <AgentLeaderboard />
          </TabsContent>

          <TabsContent value="analytics">
            <AgentCommissionAnalytics commissions={commissions} />
          </TabsContent>

          <TabsContent value="session">
            <AgentSessionHistory currentSessionId={currentSessionId} />
          </TabsContent>

          <TabsContent value="notices">
            <AgentNotificationPanel />
          </TabsContent>

          <TabsContent value="team">
            <AgentTeamHierarchy agentUserId={profile.user_id} agentTier={profile.agent_tier} />
          </TabsContent>

          <TabsContent value="topuplog">
            <AgentTopupLog agentUserId={profile.user_id} />
          </TabsContent>

          <TabsContent value="withdrawhistory">
            <AgentCommissionWithdrawHistory agentUserId={profile.user_id} />
          </TabsContent>


          <TabsContent value="deposit">
            <Card>
              <CardContent className="p-4">
                {depositCommissions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No deposit commissions yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {depositCommissions.map((comm) => (
                      <div key={comm.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Deposit: {formatBDT(comm.source_amount)}</p>
                          {comm.profile?.display_user_id && (
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                              {comm.profile.display_user_id}
                            </span>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(comm.created_at), 'PPp')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-400">+{formatBDT(comm.commission_amount)}</p>
                          <p className="text-xs text-muted-foreground">{comm.commission_rate}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="betting">
            <Card>
              <CardContent className="p-4">
                {bettingCommissions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No betting commissions yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {bettingCommissions.map((comm) => (
                      <div key={comm.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Bet: {formatBDT(comm.source_amount)}</p>
                          {comm.profile?.display_user_id && (
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                              {comm.profile.display_user_id}
                            </span>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(comm.created_at), 'PPp')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-400">+{formatBDT(comm.commission_amount)}</p>
                          <p className="text-xs text-muted-foreground">{comm.commission_rate}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals">
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by username or User ID..."
                    value={referralSearch}
                    onChange={(e) => setReferralSearch(e.target.value)}
                    className="pl-9 pr-8"
                  />
                  {referralSearch && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setReferralSearch('')}
                    >
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>

                {/* Filter Bar */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filter:</span>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      variant={referralFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setReferralFilter('all')}
                    >
                      All ({referrals.length})
                    </Button>
                    <Button
                      variant={referralFilter === 'deposited' ? 'default' : 'outline'}
                      size="sm"
                      className={`h-7 text-xs ${referralFilter === 'deposited' ? 'bg-green-600 hover:bg-green-700' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`}
                      onClick={() => setReferralFilter('deposited')}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Deposited ({referrals.filter(r => (r.wallet?.total_deposit || 0) > 0).length})
                    </Button>
                    <Button
                      variant={referralFilter === 'not_deposited' ? 'default' : 'outline'}
                      size="sm"
                      className={`h-7 text-xs ${referralFilter === 'not_deposited' ? 'bg-amber-600 hover:bg-amber-700' : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'}`}
                      onClick={() => setReferralFilter('not_deposited')}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Pending ({referrals.filter(r => (r.wallet?.total_deposit || 0) === 0).length})
                    </Button>
                  </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-2 text-center border border-primary/20">
                    <p className="text-lg font-bold text-primary">{referrals.length}</p>
                    <p className="text-[10px] text-muted-foreground">Total Refs</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg p-2 text-center border border-green-500/20">
                    <p className="text-lg font-bold text-green-400">
                      {formatBDT(referrals.reduce((sum, r) => sum + (r.wallet?.total_deposit || 0), 0))}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Total Deposits</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg p-2 text-center border border-blue-500/20">
                    <p className="text-lg font-bold text-blue-400">
                      {referrals.length > 0 
                        ? Math.round((referrals.filter(r => (r.wallet?.total_deposit || 0) > 0).length / referrals.length) * 100)
                        : 0}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">Conversion</p>
                  </div>
                </div>

                {/* Filtered Referrals List */}
                {(() => {
                  const searchLower = referralSearch.toLowerCase().trim();
                  
                  const filteredReferrals = referrals.filter(ref => {
                    // Apply search filter
                    if (searchLower) {
                      const matchesUsername = ref.profile?.username?.toLowerCase().includes(searchLower);
                      const matchesUserId = ref.profile?.display_user_id?.toLowerCase().includes(searchLower);
                      const matchesReferralId = ref.profile?.display_referral_id?.toLowerCase().includes(searchLower);
                      if (!matchesUsername && !matchesUserId && !matchesReferralId) {
                        return false;
                      }
                    }
                    
                    // Apply deposit filter
                    const hasDeposited = (ref.wallet?.total_deposit || 0) > 0;
                    if (referralFilter === 'deposited') return hasDeposited;
                    if (referralFilter === 'not_deposited') return !hasDeposited;
                    return true;
                  });

                  if (referrals.length === 0) {
                    return (
                      <p className="text-center text-muted-foreground py-8">
                        No referrals yet. Share your link to get started!
                      </p>
                    );
                  }

                  if (filteredReferrals.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Search className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-muted-foreground">No referrals match your search.</p>
                        {referralSearch && (
                          <Button
                            variant="link"
                            size="sm"
                            className="mt-2"
                            onClick={() => setReferralSearch('')}
                          >
                            Clear search
                          </Button>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {filteredReferrals.map((ref) => {
                        const hasDeposited = (ref.wallet?.total_deposit || 0) > 0;
                        const totalDeposit = ref.wallet?.total_deposit || 0;
                        const totalBet = ref.wallet?.total_bet || 0;
                        
                        return (
                          <div key={ref.id} className={`p-3 rounded-lg border transition-colors ${
                            hasDeposited 
                              ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10' 
                              : 'bg-muted/50 border-border/30 hover:bg-muted/80'
                          }`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  hasDeposited 
                                    ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30' 
                                    : 'bg-gradient-to-br from-muted to-muted/80 border border-border/50'
                                }`}>
                                  {hasDeposited ? (
                                    <CheckCircle className="h-5 w-5 text-green-400" />
                                  ) : (
                                    <Clock className="h-5 w-5 text-amber-400" />
                                  )}
                                </div>
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium truncate">
                                      {ref.profile?.username || 'Anonymous User'}
                                    </p>
                                    {ref.is_active ? (
                                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-green-500/10 text-green-400 border-green-500/30">
                                        Active
                                      </Badge>
                                    ) : hasDeposited ? (
                                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30">
                                        Deposited
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">
                                        Pending
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {ref.profile?.display_user_id && (
                                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                        {ref.profile.display_user_id}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Joined: {format(new Date(ref.created_at), 'PP')}
                                    {ref.last_activity_at && (
                                      <span className="ml-2">• Last active: {formatDistanceToNow(new Date(ref.last_activity_at), { addSuffix: true })}</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Stats Grid */}
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right flex-shrink-0">
                                {/* First Deposit */}
                                <div>
                                  <p className="text-[10px] text-muted-foreground">First Deposit</p>
                                  <p className={`text-sm font-bold ${(ref.first_deposit_amount || 0) > 0 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                                    {(ref.first_deposit_amount || 0) > 0 ? formatBDT(ref.first_deposit_amount!) : '—'}
                                  </p>
                                </div>
                                {/* Total Deposit */}
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Total Deposit</p>
                                  <p className={`text-sm font-bold ${(ref.total_deposit_volume || totalDeposit) > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                                    {formatBDT(ref.total_deposit_volume || totalDeposit)}
                                  </p>
                                </div>
                                {/* Betting Volume */}
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Betting Vol.</p>
                                  <p className={`text-sm font-bold ${(ref.total_betting_volume || totalBet) > 0 ? 'text-blue-400' : 'text-muted-foreground'}`}>
                                    {formatBDT(ref.total_betting_volume || totalBet)}
                                  </p>
                                </div>
                                {/* Commission Earned */}
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Commission</p>
                                  <p className={`text-sm font-bold ${(ref.commission_earned || 0) > 0 ? 'text-purple-400' : 'text-muted-foreground'}`}>
                                    {(ref.commission_earned || 0) > 0 ? formatBDT(ref.commission_earned!) : '—'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* First Deposit Date */}
                            {ref.first_deposit_at && (
                              <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-2">
                                <DollarSign className="h-3 w-3 text-emerald-400" />
                                <span className="text-[10px] text-muted-foreground">
                                  First deposit on {format(new Date(ref.first_deposit_at), 'PPp')}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Top-up Modal */}
        <Dialog open={showTopup} onOpenChange={setShowTopup}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Top-up User Wallet
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  This will transfer funds from your main balance to the user's wallet. This action cannot be undone.
                </p>
              </div>

              <div className="space-y-2">
                <Label>User ID or Username</Label>
                <div className="flex gap-2">
                  <Input
                    value={topupUserId}
                    onChange={(e) => setTopupUserId(e.target.value)}
                    placeholder="Enter user ID or username"
                  />
                  <Button
                    variant="outline"
                    onClick={searchUser}
                    disabled={searchLoading}
                  >
                    {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {searchedUser && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-sm">
                    <span className="text-muted-foreground">User found: </span>
                    <span className="font-medium">{searchedUser.username || searchedUser.id.slice(0, 8)}</span>
                  </p>
                </div>
              )}

              {searchedUser && (
                <div className="space-y-2">
                  <Label>Amount (৳)</Label>
                  <Input
                    type="number"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your balance: {formatBDTFull(wallet?.balance || 0)}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTopup(false)}>
                Cancel
              </Button>
              <Button
                onClick={executeTopup}
                disabled={!searchedUser || !topupAmount || topupLoading}
              >
                {topupLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Top-up {topupAmount ? formatBDTFull(parseFloat(topupAmount)) : ''}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Withdraw Commission Modal */}
        <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>কমিশন উত্তোলন</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                <p className="text-xs text-muted-foreground">Available commission balance</p>
                <p className="text-3xl font-bold text-emerald-500 mt-1">
                  {formatBDTFull(wallet?.commission_balance || 0)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                This amount will be moved from your commission balance to your main wallet balance. This action cannot be undone.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowWithdraw(false)} disabled={withdrawLoading}>
                Cancel
              </Button>
              <Button
                onClick={executeWithdrawCommission}
                disabled={withdrawLoading || !wallet || (wallet.commission_balance || 0) <= 0}
                className="bg-gradient-to-r from-emerald-500 to-green-600"
              >
                {withdrawLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Withdraw'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <BottomNav />
    </div>
  );
}
