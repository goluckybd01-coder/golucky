import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, CheckCircle, XCircle, Clock, Search,
  Eye, Shield, ShieldOff, Loader2, ExternalLink,
  AlertTriangle, ChevronDown, ChevronUp, Filter,
  RefreshCw, Award, Wallet, TrendingUp, Banknote, DollarSign, Gamepad2
} from 'lucide-react';
import { AdminSalaryManagement } from './AdminSalaryManagement';
import { AdminAgentCommissionOverview } from './AdminAgentCommissionOverview';
import { AdminCommissionAdjustment } from './AdminCommissionAdjustment';
import { AdminAgentEarningsByGame } from './AdminAgentEarningsByGame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  AGENT_TIERS,
  AgentTier,
  formatBDTFull,
  formatBDT,
  AGENT_STATUS_CONFIG,
  getTierConfig,
  TIER_NUMBERS,
} from '@/lib/agentConfig';

interface AgentApplication {
  id: string;
  user_id: string;
  tier_requested: AgentTier;
  required_deposit: number;
  deposit_method: string;
  deposit_tx_ref: string | null;
  deposit_proof_url: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  status: string;
  admin_note: string | null;
  profile?: {
    username: string | null;
    phone: string | null;
  };
}

interface ApprovedAgent {
  user_id: string;
  username: string | null;
  phone: string | null;
  display_user_id: string | null;
  agent_tier: AgentTier;
  agent_code: string;
  agent_display_id: string | null;
  agent_status: string;
  is_frozen: boolean;
  is_suspended: boolean;
  suspension_reason: string | null;
  agent_approved_at: string | null;
  wallet?: {
    balance: number;
    commission_balance: number;
    total_commission_earned: number;
    total_topups_sent: number;
  };
  referral_count?: number;
}

interface AdminAgentManagementProps {
  className?: string;
}

export function AdminAgentManagement({ className }: AdminAgentManagementProps) {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<AgentApplication[]>([]);
  const [agents, setAgents] = useState<ApprovedAgent[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('applications');
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<AgentApplication | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  // Agent details modal
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<ApprovedAgent | null>(null);
  const [agentReferrals, setAgentReferrals] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load applications
      const { data: appData, error: appError } = await supabase
        .from('agent_applications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (appError) throw appError;
      setApplications(appData || []);

      // Load approved agents from profiles
      const { data: agentData, error: agentError } = await supabase
        .from('profiles')
        .select('user_id, username, phone, display_user_id, agent_tier, agent_code, agent_display_id, agent_status, is_frozen, is_suspended, suspension_reason, agent_approved_at')
        .in('agent_status', ['approved', 'frozen'])
        .order('agent_approved_at', { ascending: false });

      if (agentError) throw agentError;

      // Get wallet data for each agent
      const agentsWithWallets: ApprovedAgent[] = [];
      for (const agent of agentData || []) {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance, commission_balance, total_commission_earned, total_topups_sent')
          .eq('user_id', agent.user_id)
          .maybeSingle();

        const { count: referralCount } = await supabase
          .from('agent_referrals')
          .select('id', { count: 'exact', head: true })
          .eq('agent_user_id', agent.user_id);

        agentsWithWallets.push({
          ...agent,
          agent_tier: agent.agent_tier as AgentTier,
          is_suspended: agent.is_suspended || false,
          wallet: wallet || undefined,
          referral_count: referralCount || 0,
        });
      }

      setAgents(agentsWithWallets);
    } catch (error) {
      console.error('Error loading agent data:', error);
      toast.error('Failed to load agent data');
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (app: AgentApplication) => {
    setSelectedApplication(app);
    setAdminNote(app.admin_note || '');
    setShowReviewModal(true);
  };

  const handleApprove = async () => {
    if (!selectedApplication) return;
    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate agent code - AG-XXXXXX format (starting from 900001)
      let agentCode = '';
      let isUnique = false;
      
      // Get the highest existing agent code number
      const { data: existingCodes } = await supabase
        .from('profiles')
        .select('agent_code')
        .like('agent_code', 'AG-%')
        .order('agent_code', { ascending: false })
        .limit(1);
      
      let nextNumber = 900001; // Starting number
      if (existingCodes && existingCodes.length > 0) {
        const lastCode = existingCodes[0].agent_code;
        const lastNumber = parseInt(lastCode.replace('AG-', ''), 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      // Ensure uniqueness for agent code
      while (!isUnique) {
        agentCode = `AG-${nextNumber.toString().padStart(6, '0')}`;
        
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('agent_code', agentCode)
          .maybeSingle();
        
        if (!existing) {
          isUnique = true;
        } else {
          nextNumber++;
        }
      }

      // Generate agent display ID - GLA-T#-XXXX format
      const tierNumber = TIER_NUMBERS[selectedApplication.tier_requested] || 0;
      
      // Get the highest existing agent display ID number
      const { data: existingDisplayIds } = await supabase
        .from('profiles')
        .select('agent_display_id')
        .like('agent_display_id', 'GLA-T%')
        .order('agent_display_id', { ascending: false })
        .limit(1);
      
      let displayIdNumber = 1;
      if (existingDisplayIds && existingDisplayIds.length > 0 && existingDisplayIds[0].agent_display_id) {
        const lastDisplayId = existingDisplayIds[0].agent_display_id;
        const match = lastDisplayId.match(/GLA-T\d+-(\d+)/);
        if (match) {
          displayIdNumber = parseInt(match[1], 10) + 1;
        }
      }
      
      const agentDisplayId = `GLA-T${tierNumber}-${displayIdNumber.toString().padStart(4, '0')}`;

      // Update application
      const { error: appError } = await supabase
        .from('agent_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          admin_note: adminNote,
        })
        .eq('id', selectedApplication.id);

      if (appError) throw appError;

      // Update profile with agent code AND agent display ID
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

      // Log agent activity
      await supabase
        .from('agent_activity_logs')
        .insert({
          agent_user_id: selectedApplication.user_id,
          action_type: 'approved',
          performed_by: user?.id,
          old_value: { status: 'pending' },
          new_value: { 
            status: 'approved', 
            tier: selectedApplication.tier_requested,
            agent_code: agentCode,
            agent_display_id: agentDisplayId
          },
          reason: adminNote || 'Application approved',
        });

      // Add deposit to wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', selectedApplication.user_id)
        .maybeSingle();

      const newBalance = (wallet?.balance || 0) + selectedApplication.required_deposit;

      await supabase
        .from('wallets')
        .update({ 
          balance: newBalance,
          total_deposit: newBalance
        })
        .eq('user_id', selectedApplication.user_id);

      // Add ledger entry
      await supabase
        .from('wallet_ledger')
        .insert({
          user_id: selectedApplication.user_id,
          ledger_type: 'DEPOSIT',
          amount: selectedApplication.required_deposit,
          fee: 0,
          net_amount: selectedApplication.required_deposit,
          balance_before: wallet?.balance || 0,
          balance_after: newBalance,
          reference_id: `agent_deposit_${selectedApplication.id}`,
          meta: { 
            type: 'agent_initial_deposit',
            tier: selectedApplication.tier_requested,
            agent_display_id: agentDisplayId
          },
        });

      toast.success(`Agent approved!\nAgent ID: ${agentDisplayId}\nReferral Code: ${agentCode}`);
      setShowReviewModal(false);
      loadData();
    } catch (error: any) {
      console.error('Error approving agent:', error);
      toast.error(error.message || 'Failed to approve agent');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;
    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: appError } = await supabase
        .from('agent_applications')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          admin_note: adminNote,
        })
        .eq('id', selectedApplication.id);

      if (appError) throw appError;

      await supabase
        .from('profiles')
        .update({ agent_status: 'rejected' })
        .eq('user_id', selectedApplication.user_id);

      toast.success('Application rejected');
      setShowReviewModal(false);
      loadData();
    } catch (error: any) {
      console.error('Error rejecting agent:', error);
      toast.error(error.message || 'Failed to reject application');
    } finally {
      setProcessing(false);
    }
  };

  const toggleAgentFreeze = async (agent: ApprovedAgent, reason?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const newStatus = agent.is_frozen ? 'approved' : 'frozen';
      const isFrozen = !agent.is_frozen;

      const updateData: any = { 
        agent_status: newStatus,
        is_frozen: isFrozen,
        is_suspended: isFrozen,
      };

      if (isFrozen) {
        updateData.suspended_at = new Date().toISOString();
        updateData.suspended_by = user?.id;
        updateData.suspension_reason = reason || 'Suspended by admin';
      } else {
        updateData.suspended_at = null;
        updateData.suspended_by = null;
        updateData.suspension_reason = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', agent.user_id);

      if (error) throw error;

      // Log activity
      await supabase
        .from('agent_activity_logs')
        .insert({
          agent_user_id: agent.user_id,
          action_type: isFrozen ? 'suspended' : 'unsuspended',
          performed_by: user?.id,
          old_value: { is_frozen: agent.is_frozen },
          new_value: { is_frozen: isFrozen },
          reason: reason || (isFrozen ? 'Suspended by admin' : 'Unsuspended by admin'),
        });

      toast.success(isFrozen ? 'Agent suspended instantly' : 'Agent unsuspended');
      loadData();
    } catch (error: any) {
      console.error('Error toggling freeze:', error);
      toast.error(error.message || 'Failed to update agent');
    }
  };

  const openAgentDetails = async (agent: ApprovedAgent) => {
    setSelectedAgent(agent);
    setShowAgentModal(true);

    // Load referrals with detailed info
    const { data: referrals } = await supabase
      .from('agent_referrals')
      .select('id, referred_user_id, created_at, first_deposit_amount, total_betting_volume, commission_earned')
      .eq('agent_user_id', agent.user_id)
      .order('created_at', { ascending: false })
      .limit(20);

    setAgentReferrals(referrals || []);
  };

  // Filter for applications
  const filteredApplications = applications.filter(app => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        app.user_id.toLowerCase().includes(search) ||
        app.deposit_tx_ref?.toLowerCase().includes(search) ||
        app.deposit_method.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Enhanced filter for agents - search by UID, Agent ID, Referral Code
  const filteredAgents = agents.filter(agent => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      agent.user_id.toLowerCase().includes(search) ||
      agent.username?.toLowerCase().includes(search) ||
      agent.display_user_id?.toLowerCase().includes(search) ||
      agent.agent_code?.toLowerCase().includes(search) ||
      agent.agent_display_id?.toLowerCase().includes(search) ||
      agent.phone?.toLowerCase().includes(search)
    );
  });

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-2 text-yellow-400" />
            <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-2 text-green-400" />
            <p className="text-2xl font-bold text-green-400">{approvedCount}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <XCircle className="h-5 w-5 mx-auto mb-2 text-red-400" />
            <p className="text-2xl font-bold text-red-400">{rejectedCount}</p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-2 text-blue-400" />
            <p className="text-2xl font-bold text-blue-400">{agents.length}</p>
            <p className="text-xs text-muted-foreground">Active Agents</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Applications
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Active Agents
          </TabsTrigger>
          <TabsTrigger value="salaries" className="flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            Salaries
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Commission Overview
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Manual Adjustment
          </TabsTrigger>
          <TabsTrigger value="earnings-by-game" className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            By Game
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by ID, TxRef..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Applications List */}
          <div className="space-y-3">
            {filteredApplications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No applications found
                </CardContent>
              </Card>
            ) : (
              filteredApplications.map((app) => {
                const tierConfig = getTierConfig(app.tier_requested);
                const statusConfig = AGENT_STATUS_CONFIG[app.status as keyof typeof AGENT_STATUS_CONFIG];

                return (
                  <Card key={app.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{tierConfig?.icon}</span>
                            <span className={`font-bold ${tierConfig?.color}`}>
                              {tierConfig?.name}
                            </span>
                            <Badge className={`${statusConfig?.bg} ${statusConfig?.color}`}>
                              {statusConfig?.label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Deposit</p>
                              <p className="font-medium">{formatBDTFull(app.required_deposit)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Method</p>
                              <p className="font-medium uppercase">{app.deposit_method}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">TxRef</p>
                              <p className="font-mono text-xs truncate">{app.deposit_tx_ref || '-'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Submitted</p>
                              <p className="text-xs">{format(new Date(app.submitted_at), 'PP')}</p>
                            </div>
                          </div>

                          {app.admin_note && (
                            <p className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                              Note: {app.admin_note}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReviewModal(app)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                          {app.deposit_proof_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(app.deposit_proof_url!, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Proof
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="agents">
          {/* Search for agents */}
          <div className="mb-4">
            <Input
              placeholder="Search by UID, Agent ID (GLA-T#-XXXX), Referral Code (AG-XXXXXX), username, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            {filteredAgents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  {searchQuery ? 'No agents match your search' : 'No active agents'}
                </CardContent>
              </Card>
            ) : (
              filteredAgents.map((agent) => {
                const tierConfig = getTierConfig(agent.agent_tier);

                return (
                  <Card key={agent.user_id} className={`hover:border-primary/50 transition-colors ${agent.is_frozen ? 'opacity-60 border-red-500/30' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xl">{tierConfig?.icon}</span>
                            <span className={`font-bold ${tierConfig?.color}`}>
                              {tierConfig?.name}
                            </span>
                            {/* Agent Display ID - GLA-T#-XXXX */}
                            {agent.agent_display_id && (
                              <code className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded text-sm font-bold border border-cyan-500/30">
                                {agent.agent_display_id}
                              </code>
                            )}
                            {/* Agent Referral Code - AG-XXXXXX */}
                            <code className="bg-primary/20 text-primary px-2 py-0.5 rounded text-sm font-bold">
                              {agent.agent_code}
                            </code>
                            {agent.is_frozen && (
                              <Badge variant="destructive" className="animate-pulse">
                                <ShieldOff className="h-3 w-3 mr-1" />
                                Suspended
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <span className="font-medium">{agent.username || 'Unknown'}</span>
                            {agent.display_user_id && (
                              <span className="text-xs font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                {agent.display_user_id}
                              </span>
                            )}
                            {agent.phone && <span>• {agent.phone}</span>}
                          </div>

                          {agent.suspension_reason && agent.is_frozen && (
                            <p className="text-xs text-red-400 bg-red-500/10 rounded p-2 mb-2 border border-red-500/20">
                              Reason: {agent.suspension_reason}
                            </p>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="bg-green-500/10 rounded p-2 border border-green-500/20">
                              <p className="text-xs text-muted-foreground">Balance</p>
                              <p className="font-bold text-green-400">{formatBDT(agent.wallet?.balance || 0)}</p>
                            </div>
                            <div className="bg-blue-500/10 rounded p-2 border border-blue-500/20">
                              <p className="text-xs text-muted-foreground">Commission</p>
                              <p className="font-bold text-blue-400">{formatBDT(agent.wallet?.commission_balance || 0)}</p>
                            </div>
                            <div className="bg-purple-500/10 rounded p-2 border border-purple-500/20">
                              <p className="text-xs text-muted-foreground">Total Earned</p>
                              <p className="font-bold text-purple-400">{formatBDT(agent.wallet?.total_commission_earned || 0)}</p>
                            </div>
                            <div className="bg-amber-500/10 rounded p-2 border border-amber-500/20">
                              <p className="text-xs text-muted-foreground">Referrals</p>
                              <p className="font-bold text-amber-400">{agent.referral_count}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAgentDetails(agent)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                          <Button
                            variant={agent.is_frozen ? 'default' : 'destructive'}
                            size="sm"
                            onClick={() => toggleAgentFreeze(agent)}
                          >
                            {agent.is_frozen ? (
                              <>
                                <Shield className="h-4 w-4 mr-1" />
                                Unsuspend
                              </>
                            ) : (
                              <>
                                <ShieldOff className="h-4 w-4 mr-1" />
                                Suspend
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="salaries">
          <AdminSalaryManagement />
        </TabsContent>

        <TabsContent value="commissions">
          <AdminAgentCommissionOverview />
        </TabsContent>

        <TabsContent value="adjustments">
          <AdminCommissionAdjustment />
        </TabsContent>

        <TabsContent value="earnings-by-game">
          <AdminAgentEarningsByGame />
        </TabsContent>
      </Tabs>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Review Application
            </DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tier Requested</Label>
                  <p className={`font-bold ${getTierConfig(selectedApplication.tier_requested)?.color}`}>
                    {getTierConfig(selectedApplication.tier_requested)?.icon}{' '}
                    {getTierConfig(selectedApplication.tier_requested)?.name}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Required Deposit</Label>
                  <p className="font-bold">{formatBDTFull(selectedApplication.required_deposit)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Method</Label>
                  <p className="font-medium uppercase">{selectedApplication.deposit_method}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Transaction Ref</Label>
                  <p className="font-mono text-sm">{selectedApplication.deposit_tx_ref || 'N/A'}</p>
                </div>
              </div>

              {selectedApplication.deposit_proof_url && (
                <div>
                  <Label className="text-muted-foreground">Proof Screenshot</Label>
                  <Button
                    variant="outline"
                    className="w-full mt-1"
                    onClick={() => window.open(selectedApplication.deposit_proof_url!, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Proof Image
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="adminNote">Admin Note</Label>
                <Textarea
                  id="adminNote"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add a note (visible to applicant)"
                  rows={3}
                />
              </div>

              {selectedApplication.status === 'pending' && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Approving will add {formatBDTFull(selectedApplication.required_deposit)} to user's wallet and assign an agent code.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedApplication?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Approve
                </Button>
              </>
            )}
            {selectedApplication?.status !== 'pending' && (
              <Button variant="outline" onClick={() => setShowReviewModal(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agent Details Modal */}
      <Dialog open={showAgentModal} onOpenChange={setShowAgentModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Agent Details
            </DialogTitle>
          </DialogHeader>

          {selectedAgent && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getTierConfig(selectedAgent.agent_tier)?.icon}</span>
                <div>
                  <p className={`font-bold text-lg ${getTierConfig(selectedAgent.agent_tier)?.color}`}>
                    {getTierConfig(selectedAgent.agent_tier)?.name}
                  </p>
                  <code className="text-primary font-bold">{selectedAgent.agent_code}</code>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Username</p>
                  <p className="font-medium">{selectedAgent.username || 'N/A'}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedAgent.phone || 'N/A'}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Total Top-ups Sent</p>
                  <p className="font-medium">{formatBDTFull(selectedAgent.wallet?.total_topups_sent || 0)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Approved On</p>
                  <p className="font-medium text-sm">
                    {selectedAgent.agent_approved_at 
                      ? format(new Date(selectedAgent.agent_approved_at), 'PP') 
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Recent Referrals ({agentReferrals.length})</p>
                {agentReferrals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No referrals yet</p>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {agentReferrals.map((ref) => (
                      <div key={ref.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <span className="text-sm font-mono">{ref.referred_user_id.slice(0, 12)}...</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(ref.created_at), 'PP')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAgentModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
