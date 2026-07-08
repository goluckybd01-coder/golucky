import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Search, Plus, Minus, History,
  Loader2, AlertTriangle, CheckCircle, User, Wallet,
  FileText, Filter, Calendar, Download, RefreshCw
} from 'lucide-react';
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
  DialogDescription,
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
import { format, formatDistanceToNow } from 'date-fns';
import { formatBDTFull, formatBDT, AGENT_TIERS, getTierConfig, AgentTier } from '@/lib/agentConfig';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface AgentData {
  user_id: string;
  username: string | null;
  display_user_id: string | null;
  agent_display_id: string | null;
  agent_tier: AgentTier;
  agent_code: string;
  wallet?: {
    commission_balance: number;
    total_commission_earned: number;
  };
}

interface AdjustmentLog {
  id: string;
  agent_user_id: string;
  adjusted_by: string;
  adjustment_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  reason: string;
  game_type: string | null;
  source_user_id: string | null;
  reference_id: string | null;
  created_at: string;
  agent?: {
    username: string | null;
    agent_display_id: string | null;
  };
}

export function AdminCommissionAdjustment() {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [logs, setLogs] = useState<AdjustmentLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('adjust');
  
  // Adjustment modal state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'credit' | 'debit'>('credit');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentGameType, setAdjustmentGameType] = useState<string>('');
  const [adjustmentSourceUserId, setAdjustmentSourceUserId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Log filters
  const [logTypeFilter, setLogTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [logDateRange, setLogDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [logAgentSearch, setLogAgentSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load approved agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('profiles')
        .select('user_id, username, display_user_id, agent_display_id, agent_tier, agent_code')
        .eq('agent_status', 'approved')
        .order('agent_approved_at', { ascending: false });

      if (agentsError) throw agentsError;

      // Load wallet data for agents
      if (agentsData && agentsData.length > 0) {
        const userIds = agentsData.map(a => a.user_id);
        const { data: walletsData } = await supabase
          .from('wallets')
          .select('user_id, commission_balance, total_commission_earned')
          .in('user_id', userIds);

        const agentsWithWallets = agentsData.map(agent => ({
          ...agent,
          agent_tier: agent.agent_tier as AgentTier,
          wallet: walletsData?.find(w => w.user_id === agent.user_id)
        }));

        setAgents(agentsWithWallets);
      }

      // Load recent adjustment logs
      const { data: logsData, error: logsError } = await supabase
        .from('commission_adjustment_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // Fetch agent info for logs
      if (logsData && logsData.length > 0) {
        const agentIds = [...new Set(logsData.map(l => l.agent_user_id))];
        const { data: agentProfiles } = await supabase
          .from('profiles')
          .select('user_id, username, agent_display_id')
          .in('user_id', agentIds);

        const logsWithAgents = logsData.map(log => ({
          ...log,
          agent: agentProfiles?.find(p => p.user_id === log.agent_user_id)
        }));

        setLogs(logsWithAgents);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openAdjustModal = (agent: AgentData) => {
    setSelectedAgent(agent);
    setAdjustmentType('credit');
    setAdjustmentAmount('');
    setAdjustmentReason('');
    setAdjustmentGameType('');
    setAdjustmentSourceUserId('');
    setShowAdjustModal(true);
  };

  const processAdjustment = async () => {
    if (!selectedAgent) return;
    
    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!adjustmentReason.trim()) {
      toast.error('Please provide a reason for this adjustment');
      return;
    }

    // For debit, check balance
    if (adjustmentType === 'debit') {
      const currentBalance = selectedAgent.wallet?.commission_balance || 0;
      if (amount > currentBalance) {
        toast.error(`Insufficient commission balance. Current: ${formatBDTFull(currentBalance)}`);
        return;
      }
    }

    setIsProcessing(true);
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) throw new Error('Not authenticated');

      // Get current wallet data
      const { data: currentWallet, error: walletError } = await supabase
        .from('wallets')
        .select('commission_balance, total_commission_earned')
        .eq('user_id', selectedAgent.user_id)
        .single();

      if (walletError) throw walletError;

      const balanceBefore = currentWallet.commission_balance || 0;
      const adjustedAmount = adjustmentType === 'credit' ? amount : -amount;
      const balanceAfter = balanceBefore + adjustedAmount;

      // Update wallet
      const updates: { commission_balance: number; total_commission_earned?: number } = {
        commission_balance: balanceAfter
      };
      
      // Only increase total_commission_earned for credits
      if (adjustmentType === 'credit') {
        updates.total_commission_earned = (currentWallet.total_commission_earned || 0) + amount;
      }

      const { error: updateError } = await supabase
        .from('wallets')
        .update(updates)
        .eq('user_id', selectedAgent.user_id);

      if (updateError) throw updateError;

      // Log the adjustment
      const { error: logError } = await supabase
        .from('commission_adjustment_logs')
        .insert({
          agent_user_id: selectedAgent.user_id,
          adjusted_by: adminUser.id,
          adjustment_type: adjustmentType,
          amount: amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          reason: adjustmentReason.trim(),
          game_type: adjustmentGameType || null,
          source_user_id: adjustmentSourceUserId || null,
        });

      if (logError) throw logError;

      // Add wallet ledger entry
      const { error: ledgerError } = await supabase
        .from('wallet_ledger')
        .insert({
          user_id: selectedAgent.user_id,
          ledger_type: 'ADJUSTMENT',
          amount: adjustedAmount,
          net_amount: adjustedAmount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          meta: {
            type: 'commission_adjustment',
            adjustment_type: adjustmentType,
            reason: adjustmentReason.trim(),
            adjusted_by: adminUser.id,
            game_type: adjustmentGameType || null,
          }
        });

      if (ledgerError) console.error('Ledger error:', ledgerError);

      toast.success(
        `Successfully ${adjustmentType === 'credit' ? 'credited' : 'debited'} ${formatBDTFull(amount)} ${adjustmentType === 'credit' ? 'to' : 'from'} ${selectedAgent.agent_display_id || selectedAgent.username}`
      );

      setShowAdjustModal(false);
      loadData();
    } catch (error: any) {
      console.error('Adjustment error:', error);
      toast.error(error.message || 'Failed to process adjustment');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter agents
  const filteredAgents = agents.filter(agent => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      agent.username?.toLowerCase().includes(query) ||
      agent.display_user_id?.toLowerCase().includes(query) ||
      agent.agent_display_id?.toLowerCase().includes(query) ||
      agent.agent_code?.toLowerCase().includes(query)
    );
  });

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (logTypeFilter !== 'all' && log.adjustment_type !== logTypeFilter) return false;
    
    if (logAgentSearch) {
      const query = logAgentSearch.toLowerCase();
      if (
        !log.agent?.username?.toLowerCase().includes(query) &&
        !log.agent?.agent_display_id?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    if (logDateRange.from) {
      const logDate = new Date(log.created_at);
      if (logDate < logDateRange.from) return false;
    }
    if (logDateRange.to) {
      const logDate = new Date(log.created_at);
      const endOfDay = new Date(logDateRange.to);
      endOfDay.setHours(23, 59, 59, 999);
      if (logDate > endOfDay) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Commission Adjustment
          </h2>
          <p className="text-sm text-muted-foreground">
            Manually adjust agent commission balances with full audit logging
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="adjust" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Make Adjustment
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Audit History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="adjust" className="space-y-4 mt-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username, Agent ID, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Agent List */}
          <div className="grid gap-3">
            {filteredAgents.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No agents found</p>
              </Card>
            ) : (
              filteredAgents.map((agent) => {
                const tierConfig = getTierConfig(agent.agent_tier);
                return (
                  <Card key={agent.user_id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">{tierConfig?.icon}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {agent.agent_display_id || agent.username || 'Unknown'}
                              </span>
                              <Badge variant="outline" className={`text-xs bg-gradient-to-r ${tierConfig?.gradient} text-white border-0`}>
                                {tierConfig?.name}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{agent.display_user_id}</span>
                              <span>•</span>
                              <span>Code: {agent.agent_code}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Commission Balance</p>
                            <p className="text-lg font-bold text-primary">
                              {formatBDT(agent.wallet?.commission_balance || 0)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Total Earned</p>
                            <p className="text-lg font-bold text-green-500">
                              {formatBDT(agent.wallet?.total_commission_earned || 0)}
                            </p>
                          </div>
                          <Button onClick={() => openAdjustModal(agent)}>
                            <DollarSign className="h-4 w-4 mr-1" />
                            Adjust
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

        <TabsContent value="history" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agent..."
                value={logAgentSearch}
                onChange={(e) => setLogAgentSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={logTypeFilter} onValueChange={(v) => setLogTypeFilter(v as typeof logTypeFilter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {logDateRange.from ? (
                    logDateRange.to ? (
                      `${format(logDateRange.from, 'MMM d')} - ${format(logDateRange.to, 'MMM d')}`
                    ) : (
                      format(logDateRange.from, 'MMM d, yyyy')
                    )
                  ) : (
                    'Date Range'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="range"
                  selected={{ from: logDateRange.from, to: logDateRange.to }}
                  onSelect={(range) => setLogDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                />
                {(logDateRange.from || logDateRange.to) && (
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-destructive"
                      onClick={() => setLogDateRange({ from: undefined, to: undefined })}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="p-4 text-center">
                <Plus className="h-5 w-5 text-green-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-400">
                  {formatBDT(filteredLogs.filter(l => l.adjustment_type === 'credit').reduce((sum, l) => sum + l.amount, 0))}
                </p>
                <p className="text-xs text-muted-foreground">Total Credits</p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="p-4 text-center">
                <Minus className="h-5 w-5 text-red-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-400">
                  {formatBDT(filteredLogs.filter(l => l.adjustment_type === 'debit').reduce((sum, l) => sum + l.amount, 0))}
                </p>
                <p className="text-xs text-muted-foreground">Total Debits</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/10 border-primary/30">
              <CardContent className="p-4 text-center">
                <FileText className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-primary">{filteredLogs.length}</p>
                <p className="text-xs text-muted-foreground">Total Adjustments</p>
              </CardContent>
            </Card>
          </div>

          {/* Logs List */}
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No adjustment history found</p>
              </Card>
            ) : (
              <AnimatePresence>
                {filteredLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Card className="hover:bg-muted/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${log.adjustment_type === 'credit' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                              {log.adjustment_type === 'credit' ? (
                                <Plus className="h-4 w-4 text-green-400" />
                              ) : (
                                <Minus className="h-4 w-4 text-red-400" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">
                                  {log.agent?.agent_display_id || log.agent?.username || 'Unknown Agent'}
                                </span>
                                <Badge variant={log.adjustment_type === 'credit' ? 'default' : 'destructive'} className="text-xs">
                                  {log.adjustment_type === 'credit' ? '+' : '-'}{formatBDTFull(log.amount)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{log.reason}</p>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Wallet className="h-3 w-3" />
                                  {formatBDT(log.balance_before)} → {formatBDT(log.balance_after)}
                                </span>
                                {log.game_type && (
                                  <Badge variant="outline" className="text-xs">
                                    {log.game_type}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                            <p>{format(new Date(log.created_at), 'MMM d, yyyy')}</p>
                            <p>{format(new Date(log.created_at), 'h:mm a')}</p>
                            <p className="mt-1">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Adjustment Modal */}
      <Dialog open={showAdjustModal} onOpenChange={setShowAdjustModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Adjust Commission
            </DialogTitle>
            <DialogDescription>
              Manually adjust commission balance for {selectedAgent?.agent_display_id || selectedAgent?.username}
            </DialogDescription>
          </DialogHeader>

          {selectedAgent && (
            <div className="space-y-4">
              {/* Agent Info */}
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedAgent.agent_display_id || selectedAgent.username}</p>
                      <p className="text-xs text-muted-foreground">{selectedAgent.display_user_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Current Balance</p>
                      <p className="text-lg font-bold text-primary">
                        {formatBDTFull(selectedAgent.wallet?.commission_balance || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Adjustment Type */}
              <div className="space-y-2">
                <Label>Adjustment Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={adjustmentType === 'credit' ? 'default' : 'outline'}
                    className={adjustmentType === 'credit' ? 'bg-green-600 hover:bg-green-700' : ''}
                    onClick={() => setAdjustmentType('credit')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Credit (+)
                  </Button>
                  <Button
                    type="button"
                    variant={adjustmentType === 'debit' ? 'destructive' : 'outline'}
                    onClick={() => setAdjustmentType('debit')}
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Debit (-)
                  </Button>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label>Amount (৳)</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                {adjustmentAmount && !isNaN(parseFloat(adjustmentAmount)) && (
                  <p className="text-xs text-muted-foreground">
                    New Balance: {formatBDTFull(
                      (selectedAgent.wallet?.commission_balance || 0) + 
                      (adjustmentType === 'credit' ? parseFloat(adjustmentAmount) : -parseFloat(adjustmentAmount))
                    )}
                  </p>
                )}
              </div>

              {/* Reason (Required) */}
              <div className="space-y-2">
                <Label>Reason *</Label>
                <Textarea
                  placeholder="Explain the reason for this adjustment..."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Optional: Game Type */}
              <div className="space-y-2">
                <Label>Game Type (Optional)</Label>
                <Select value={adjustmentGameType} onValueChange={setAdjustmentGameType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select game type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="wingo">WinGo</SelectItem>
                    <SelectItem value="k3">K3</SelectItem>
                    <SelectItem value="5d">5D</SelectItem>
                    <SelectItem value="trxwin">TrxWin</SelectItem>
                    <SelectItem value="crash">Crash</SelectItem>
                    <SelectItem value="mines">Mines</SelectItem>
                    <SelectItem value="aviator">Aviator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Optional: Source User ID */}
              <div className="space-y-2">
                <Label>Source User ID (Optional)</Label>
                <Input
                  placeholder="Related user ID if applicable"
                  value={adjustmentSourceUserId}
                  onChange={(e) => setAdjustmentSourceUserId(e.target.value)}
                />
              </div>

              {/* Warning for debit */}
              {adjustmentType === 'debit' && adjustmentAmount && parseFloat(adjustmentAmount) > (selectedAgent.wallet?.commission_balance || 0) && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive">
                    Amount exceeds current balance!
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAdjustModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={processAdjustment}
              disabled={isProcessing || !adjustmentAmount || !adjustmentReason}
              className={adjustmentType === 'credit' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={adjustmentType === 'debit' ? 'destructive' : 'default'}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : adjustmentType === 'credit' ? (
                <Plus className="h-4 w-4 mr-2" />
              ) : (
                <Minus className="h-4 w-4 mr-2" />
              )}
              {adjustmentType === 'credit' ? 'Credit' : 'Debit'} {adjustmentAmount ? formatBDTFull(parseFloat(adjustmentAmount)) : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
