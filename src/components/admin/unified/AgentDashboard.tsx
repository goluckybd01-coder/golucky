import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Shield,
  TrendingUp,
  Wallet,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { formatTaka } from '@/lib/currency';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AGENT_TIERS, AgentTier } from '@/lib/agentConfig';

interface AgentApplication {
  id: string;
  user_id: string;
  tier_requested: AgentTier;
  required_deposit: number;
  deposit_method: string;
  deposit_tx_ref: string | null;
  status: string;
  admin_note: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  username?: string;
  phone?: string;
  display_user_id?: string;
}

interface ActiveAgent {
  user_id: string;
  agent_code: string;
  agent_display_id: string;
  agent_tier: AgentTier;
  agent_status: string;
  username?: string;
  phone?: string;
  is_frozen?: boolean;
  total_referrals: number;
  total_commission: number;
  wallet_balance: number;
}

interface AgentCommission {
  id: string;
  agent_user_id: string;
  referred_user_id: string;
  commission_type: string;
  source_amount: number;
  commission_amount: number;
  commission_rate: number;
  is_credited: boolean;
  created_at: string;
}

export const AgentDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('applications');

  const [applications, setApplications] = useState<AgentApplication[]>([]);
  const [activeAgents, setActiveAgents] = useState<ActiveAgent[]>([]);
  const [commissions, setCommissions] = useState<AgentCommission[]>([]);

  const [stats, setStats] = useState({
    pendingApplications: 0,
    totalAgents: 0,
    totalCommissionsPaid: 0,
    activeAgentsToday: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<AgentApplication | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadApplications = useCallback(async () => {
    const { data, error } = await supabase
      .from('agent_applications')
      .select(`
        *,
        profiles!inner(username, phone, display_user_id)
      `)
      .order('submitted_at', { ascending: false });

    if (!error && data) {
      const mapped = data.map((app: any) => ({
        ...app,
        username: app.profiles?.username,
        phone: app.profiles?.phone,
        display_user_id: app.profiles?.display_user_id,
      }));
      setApplications(mapped);
      setStats(prev => ({
        ...prev,
        pendingApplications: mapped.filter((a: AgentApplication) => a.status === 'pending').length,
      }));
    }
  }, []);

  const loadActiveAgents = useCallback(async () => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('agent_status', 'approved')
      .not('agent_code', 'is', null);

    if (!error && profiles) {
      const agentData: ActiveAgent[] = await Promise.all(
        profiles.map(async (profile) => {
          const { count: referralCount } = await supabase
            .from('agent_referrals')
            .select('*', { count: 'exact', head: true })
            .eq('agent_user_id', profile.user_id);

          const { data: commissionData } = await supabase
            .from('agent_commissions')
            .select('commission_amount')
            .eq('agent_user_id', profile.user_id)
            .eq('is_credited', true);

          const { data: walletData } = await supabase
            .from('wallets')
            .select('commission_balance')
            .eq('user_id', profile.user_id)
            .single();

          return {
            user_id: profile.user_id,
            agent_code: profile.agent_code || '',
            agent_display_id: profile.agent_display_id || '',
            agent_tier: profile.agent_tier as AgentTier,
            agent_status: profile.agent_status || '',
            username: profile.username,
            phone: profile.phone,
            is_frozen: profile.is_frozen,
            total_referrals: referralCount || 0,
            total_commission: commissionData?.reduce((sum, c) => sum + c.commission_amount, 0) || 0,
            wallet_balance: walletData?.commission_balance || 0,
          };
        })
      );

      setActiveAgents(agentData);
      setStats(prev => ({
        ...prev,
        totalAgents: agentData.length,
        totalCommissionsPaid: agentData.reduce((sum, a) => sum + a.total_commission, 0),
      }));
    }
  }, []);

  const loadCommissions = useCallback(async () => {
    const { data, error } = await supabase
      .from('agent_commissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setCommissions(data);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([loadApplications(), loadActiveAgents(), loadCommissions()]);
    setIsLoading(false);
  }, [loadApplications, loadActiveAgents, loadCommissions]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    const channel = supabase
      .channel('agent-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_applications' },
        () => loadApplications()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => loadActiveAgents()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_commissions' },
        () => loadCommissions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadApplications, loadActiveAgents, loadCommissions]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshAll();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshAll]);

  const handleReviewApplication = async (action: 'approve' | 'reject') => {
    if (!selectedApplication) return;
    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('agent_applications')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          admin_note: adminNote || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', selectedApplication.id);

      if (updateError) throw updateError;

      if (action === 'approve') {
        const agentCode = `AG-${(900000 + Math.floor(Math.random() * 99999)).toString()}`;
        const tierNum = AGENT_TIERS.findIndex(t => t.tier === selectedApplication.tier_requested) + 1;
        const agentDisplayId = `GLA-T${tierNum}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            agent_status: 'approved',
            agent_tier: selectedApplication.tier_requested,
            agent_code: agentCode,
            agent_display_id: agentDisplayId,
            agent_approved_at: new Date().toISOString(),
          })
          .eq('user_id', selectedApplication.user_id);

        if (profileError) throw profileError;
      }

      await supabase.from('agent_activity_logs').insert({
        agent_user_id: selectedApplication.user_id,
        action_type: action === 'approve' ? 'APPLICATION_APPROVED' : 'APPLICATION_REJECTED',
        performed_by: user.id,
        reason: adminNote || null,
        new_value: { status: action === 'approve' ? 'approved' : 'rejected' },
      });

      toast.success(`Application ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setReviewDialogOpen(false);
      setSelectedApplication(null);
      setAdminNote('');
      refreshAll();
    } catch (error: any) {
      console.error('Error processing application:', error);
      toast.error(`Failed to ${action} application: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleFreeze = async (agent: ActiveAgent) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newFrozenState = !agent.is_frozen;

      const { error } = await supabase
        .from('profiles')
        .update({ is_frozen: newFrozenState })
        .eq('user_id', agent.user_id);

      if (error) throw error;

      await supabase.from('agent_activity_logs').insert({
        agent_user_id: agent.user_id,
        action_type: newFrozenState ? 'AGENT_FROZEN' : 'AGENT_UNFROZEN',
        performed_by: user.id,
        new_value: { is_frozen: newFrozenState },
      });

      toast.success(`Agent ${newFrozenState ? 'frozen' : 'unfrozen'} successfully`);
      refreshAll();
    } catch (error: any) {
      toast.error(`Failed to update agent: ${error.message}`);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (tierFilter !== 'all' && app.tier_requested !== tierFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        app.username?.toLowerCase().includes(query) ||
        app.phone?.toLowerCase().includes(query) ||
        app.display_user_id?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const filteredAgents = activeAgents.filter(agent => {
    if (tierFilter !== 'all' && agent.agent_tier !== tierFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        agent.username?.toLowerCase().includes(query) ||
        agent.agent_code?.toLowerCase().includes(query) ||
        agent.agent_display_id?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-400" />
            Agent Dashboard
          </h1>
          <p className="text-gray-400 flex items-center gap-2">
            <span>Manage agents, applications, and commissions</span>
            <span className="text-gray-600">•</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-blue-400 text-sm">Auto-refresh active</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={refreshAll} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Pending Applications</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pendingApplications}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Total Agents</p>
                <p className="text-2xl font-bold text-green-400">{stats.totalAgents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Commissions Paid</p>
                <p className="text-2xl font-bold text-blue-400">{formatTaka(stats.totalCommissionsPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">Active Today</p>
                <p className="text-2xl font-bold text-purple-400">{stats.activeAgentsToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-700"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] bg-gray-900 border-gray-700">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[150px] bg-gray-900 border-gray-700">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="all">All Tiers</SelectItem>
            {AGENT_TIERS.map(tier => (
              <SelectItem key={tier.tier} value={tier.tier}>{tier.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-900 border border-gray-800">
          <TabsTrigger value="applications">
            Applications
            {stats.pendingApplications > 0 && (
              <Badge className="ml-2 bg-yellow-500 text-black">{stats.pendingApplications}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">Active Agents</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Agent Applications</CardTitle>
              <CardDescription>Review and process pending applications</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">User</TableHead>
                      <TableHead className="text-gray-400">Tier Requested</TableHead>
                      <TableHead className="text-gray-400">Deposit</TableHead>
                      <TableHead className="text-gray-400">Method</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Submitted</TableHead>
                      <TableHead className="text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((app) => {
                      const tierConfig = AGENT_TIERS.find(t => t.tier === app.tier_requested);
                      return (
                        <TableRow key={app.id} className="border-gray-800 hover:bg-gray-800/50">
                          <TableCell>
                            <div>
                              <p className="text-white font-medium">{app.username || 'Anonymous'}</p>
                              <p className="text-xs text-gray-400">{app.display_user_id || app.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('text-xs', tierConfig?.gradient)}>
                              {tierConfig?.icon} {tierConfig?.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white">{formatTaka(app.required_deposit)}</TableCell>
                          <TableCell className="text-gray-400">{app.deposit_method}</TableCell>
                          <TableCell>
                            <Badge className={cn(
                              app.status === 'pending' && 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                              app.status === 'approved' && 'bg-green-500/20 text-green-400 border-green-500/30',
                              app.status === 'rejected' && 'bg-red-500/20 text-red-400 border-red-500/30'
                            )}>
                              {app.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {formatDistanceToNow(new Date(app.submitted_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            {app.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setReviewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Active Agents</CardTitle>
              <CardDescription>Manage approved agents</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Agent</TableHead>
                      <TableHead className="text-gray-400">Code</TableHead>
                      <TableHead className="text-gray-400">Tier</TableHead>
                      <TableHead className="text-gray-400">Referrals</TableHead>
                      <TableHead className="text-gray-400">Commission Earned</TableHead>
                      <TableHead className="text-gray-400">Balance</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgents.map((agent) => {
                      const tierConfig = AGENT_TIERS.find(t => t.tier === agent.agent_tier);
                      return (
                        <TableRow key={agent.user_id} className="border-gray-800 hover:bg-gray-800/50">
                          <TableCell>
                            <div>
                              <p className="text-white font-medium">{agent.username || 'Anonymous'}</p>
                              <p className="text-xs text-gray-400">{agent.agent_display_id}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-teal-400 bg-teal-500/10 px-2 py-1 rounded">
                              {agent.agent_code}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('text-xs', tierConfig?.color)}>
                              {tierConfig?.icon} {tierConfig?.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white">{agent.total_referrals}</TableCell>
                          <TableCell className="text-green-400">{formatTaka(agent.total_commission)}</TableCell>
                          <TableCell className="text-blue-400">{formatTaka(agent.wallet_balance)}</TableCell>
                          <TableCell>
                            <Badge className={cn(
                              agent.is_frozen
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-green-500/20 text-green-400 border-green-500/30'
                            )}>
                              {agent.is_frozen ? 'Frozen' : 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={agent.is_frozen ? 'outline' : 'destructive'}
                              onClick={() => handleToggleFreeze(agent)}
                            >
                              {agent.is_frozen ? 'Unfreeze' : 'Freeze'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Commission History</CardTitle>
              <CardDescription>View all commission transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Date</TableHead>
                      <TableHead className="text-gray-400">Type</TableHead>
                      <TableHead className="text-gray-400">Source Amount</TableHead>
                      <TableHead className="text-gray-400">Rate</TableHead>
                      <TableHead className="text-gray-400">Commission</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((com) => (
                      <TableRow key={com.id} className="border-gray-800">
                        <TableCell className="text-gray-400">
                          {format(new Date(com.created_at), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {com.commission_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white">{formatTaka(com.source_amount)}</TableCell>
                        <TableCell className="text-gray-400">{(com.commission_rate * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-green-400">{formatTaka(com.commission_amount)}</TableCell>
                        <TableCell>
                          <Badge className={cn(
                            com.is_credited
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          )}>
                            {com.is_credited ? 'Credited' : 'Pending'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Agent performance leaderboard and analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Review Application</DialogTitle>
            <DialogDescription>
              Review and approve or reject this agent application
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">User</p>
                  <p className="text-white font-medium">{selectedApplication.username || 'Anonymous'}</p>
                </div>
                <div>
                  <p className="text-gray-400">User ID</p>
                  <p className="text-white">{selectedApplication.display_user_id}</p>
                </div>
                <div>
                  <p className="text-gray-400">Tier Requested</p>
                  <p className="text-white capitalize">{selectedApplication.tier_requested}</p>
                </div>
                <div>
                  <p className="text-gray-400">Required Deposit</p>
                  <p className="text-white">{formatTaka(selectedApplication.required_deposit)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Payment Method</p>
                  <p className="text-white">{selectedApplication.deposit_method}</p>
                </div>
                <div>
                  <p className="text-gray-400">Transaction Ref</p>
                  <p className="text-white">{selectedApplication.deposit_tx_ref || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-2">Admin Note (optional)</p>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add a note about this decision..."
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => handleReviewApplication('reject')}
              disabled={isProcessing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleReviewApplication('approve')}
              disabled={isProcessing}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
