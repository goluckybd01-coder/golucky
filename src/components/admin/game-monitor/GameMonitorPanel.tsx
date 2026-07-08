import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw, Pause, Play, Download, Users, AlertTriangle,
  TrendingUp, TrendingDown, Clock, Shield, Ban, Settings,
  Target, Dices, Trophy, Zap, Filter, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatTaka } from '@/lib/currency';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { GameType, GAME_CONFIG, canAccessGame, StaffRole } from '@/lib/adminPermissions';
import LiveResultControl from '@/components/admin/LiveResultControl';

interface GameScope {
  game_scope: string;
  can_view: boolean;
  can_edit: boolean;
  can_override: boolean;
}

interface RoundInfo {
  periodId: string;
  status: 'BETTING' | 'LOCKED' | 'SETTLING' | 'RESULT';
  countdown: number;
  totalBets: number;
  totalPayouts: number;
  playerCount: number;
  result?: string;
}

interface LiveBet {
  id: string;
  user_id: string;
  username: string;
  display_user_id?: string;
  phone?: string;
  bet_amount: number;
  bet_type: string;
  bet_value: string;
  balance_before?: number;
  created_at: string;
}

interface BetSummary {
  option: string;
  label: string;
  totalAmount: number;
  userCount: number;
  expectedPayout: number;
  odds: number;
}

interface RoundHistory {
  periodId: string;
  result: string;
  result_color?: string;
  totalBets: number;
  totalPayouts: number;
  netProfit: number;
  playerCount: number;
  created_at: string;
}

interface GameSettings {
  id: string;
  is_enabled: boolean;
  min_bet: number;
  max_bet: number;
  house_edge_percent: number;
  maintenance_mode: boolean;
  fee_percent?: number;
}

interface GameMonitorPanelProps {
  gameType: GameType;
  duration: string;
  staffRole: StaffRole;
  gameScopes: GameScope[];
}

const DURATION_TO_MODE: Record<string, string> = {
  '30s': '30s', '1m': '1min', '3m': '3min', '5m': '5min', '10m': '10min',
};

const GAME_BET_OPTIONS: Record<GameType, { value: string; label: string; odds: number }[]> = {
  wingo: [
    { value: '0', label: '0', odds: 9 }, { value: '1', label: '1', odds: 9 }, { value: '2', label: '2', odds: 9 },
    { value: '3', label: '3', odds: 9 }, { value: '4', label: '4', odds: 9 }, { value: '5', label: '5', odds: 9 },
    { value: '6', label: '6', odds: 9 }, { value: '7', label: '7', odds: 9 }, { value: '8', label: '8', odds: 9 },
    { value: '9', label: '9', odds: 9 }, { value: 'red', label: 'Red', odds: 2 }, { value: 'green', label: 'Green', odds: 2 },
    { value: 'violet', label: 'Violet', odds: 4.5 }, { value: 'big', label: 'Big', odds: 2 }, { value: 'small', label: 'Small', odds: 2 },
  ],
  k3: [
    { value: 'big', label: 'Big', odds: 2 }, { value: 'small', label: 'Small', odds: 2 }, { value: 'odd', label: 'Odd', odds: 2 },
    { value: 'even', label: 'Even', odds: 2 }, { value: 'sum3', label: 'Sum 3', odds: 207 }, { value: 'sum4', label: 'Sum 4', odds: 69 },
    { value: 'sum18', label: 'Sum 18', odds: 207 }, { value: '3same-all', label: '3 Same All', odds: 30 },
  ],
  '5d': [
    { value: 'a-big', label: 'A Big', odds: 2 }, { value: 'a-small', label: 'A Small', odds: 2 },
    { value: 'a-odd', label: 'A Odd', odds: 2 }, { value: 'a-even', label: 'A Even', odds: 2 },
    { value: 'sum-big', label: 'Sum Big', odds: 2 }, { value: 'sum-small', label: 'Sum Small', odds: 2 },
  ],
  trxwin: [
    { value: '0', label: '0', odds: 9 }, { value: '1', label: '1', odds: 9 }, { value: '2', label: '2', odds: 9 },
    { value: '3', label: '3', odds: 9 }, { value: '4', label: '4', odds: 9 }, { value: '5', label: '5', odds: 9 },
    { value: '6', label: '6', odds: 9 }, { value: '7', label: '7', odds: 9 }, { value: '8', label: '8', odds: 9 },
    { value: '9', label: '9', odds: 9 }, { value: 'red', label: 'Red', odds: 2 }, { value: 'green', label: 'Green', odds: 2 },
    { value: 'big', label: 'Big', odds: 2 }, { value: 'small', label: 'Small', odds: 2 },
  ],
  crash: [], mines: [], aviator: [],
};

const GAME_ICONS: Record<GameType, any> = {
  wingo: Target, k3: Dices, '5d': Trophy, trxwin: Zap, crash: null, mines: null, aviator: null,
};

export const GameMonitorPanel = ({ gameType, duration, staffRole, gameScopes }: GameMonitorPanelProps) => {
  const config = GAME_CONFIG[gameType];
  const GameIcon = GAME_ICONS[gameType];
  const gameMode = DURATION_TO_MODE[duration] || duration;
  const canEdit = canAccessGame(staffRole, gameScopes, gameType, 'edit');
  const [isLoading, setIsLoading] = useState(true);
  const [roundInfo, setRoundInfo] = useState<RoundInfo | null>(null);
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [betSummaries, setBetSummaries] = useState<BetSummary[]>([]);
  const [roundHistory, setRoundHistory] = useState<RoundHistory[]>([]);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const loadRoundInfo = useCallback(async () => {
    try {
      const { data: round } = await supabase.from('game_rounds').select('*').eq('game_type', gameType).eq('game_mode', gameMode).order('created_at', { ascending: false }).limit(1).single();
      if (round) {
        const { data: bets } = await supabase.from('game_bets').select('bet_amount, payout, user_id', { count: 'exact' }).eq('trade_id', round.trade_id);
        const totalBets = bets?.reduce((sum, b) => sum + b.bet_amount, 0) || 0;
        const totalPayouts = bets?.reduce((sum, b) => sum + (b.payout || 0), 0) || 0;
        const uniqueUsers = new Set(bets?.map(b => b.user_id) || []);
        setRoundInfo({ periodId: round.trade_id, status: round.result ? 'RESULT' : 'BETTING', countdown: 0, totalBets, totalPayouts, playerCount: uniqueUsers.size, result: round.result });
      }
    } catch (error) { console.error('Error loading round info:', error); }
  }, [gameType, gameMode]);

  const loadLiveBets = useCallback(async () => {
    try {
      const { data: bets } = await supabase.from('game_bets').select('*').eq('game_type', gameType).eq('game_mode', gameMode).eq('status', 'pending').order('created_at', { ascending: false }).limit(100);
      if (bets) {
        const userIds = [...new Set(bets.map(b => b.user_id))];
        const { data: profiles } = await supabase.from('profiles').select('user_id, username, display_user_id, phone').in('user_id', userIds);
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        setLiveBets(bets.map(b => ({ ...b, username: profileMap.get(b.user_id)?.username || 'Unknown', display_user_id: profileMap.get(b.user_id)?.display_user_id, phone: profileMap.get(b.user_id)?.phone })));
        const summaryMap = new Map<string, BetSummary>();
        (GAME_BET_OPTIONS[gameType] || []).forEach(opt => summaryMap.set(opt.value, { option: opt.value, label: opt.label, totalAmount: 0, userCount: 0, expectedPayout: 0, odds: opt.odds }));
        bets.forEach(bet => { const existing = summaryMap.get(bet.bet_value); if (existing) { existing.totalAmount += bet.bet_amount; existing.userCount++; existing.expectedPayout = existing.totalAmount * existing.odds; summaryMap.set(bet.bet_value, existing); } });
        setBetSummaries(Array.from(summaryMap.values()).filter(s => s.totalAmount > 0));
      }
    } catch (error) { console.error('Error loading live bets:', error); }
  }, [gameType, gameMode]);

  const loadHistory = useCallback(async () => {
    try {
      const { data: rounds } = await supabase.from('game_rounds').select('*').eq('game_type', gameType).eq('game_mode', gameMode).order('created_at', { ascending: false }).limit(50);
      if (rounds) {
        const history: RoundHistory[] = [];
        for (const round of rounds) {
          const { data: bets } = await supabase.from('game_bets').select('bet_amount, payout, user_id').eq('trade_id', round.trade_id);
          const totalBets = bets?.reduce((sum, b) => sum + b.bet_amount, 0) || 0;
          const totalPayouts = bets?.reduce((sum, b) => sum + (b.payout || 0), 0) || 0;
          const uniqueUsers = new Set(bets?.map(b => b.user_id) || []);
          history.push({ periodId: round.trade_id, result: round.result, result_color: round.result_color, totalBets, totalPayouts, netProfit: totalBets - totalPayouts, playerCount: uniqueUsers.size, created_at: round.created_at });
        }
        setRoundHistory(history);
      }
    } catch (error) { console.error('Error loading history:', error); }
  }, [gameType, gameMode]);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await supabase.from('game_admin_settings').select('*').eq('game_type', gameType).single();
      if (data) { setSettings(data as GameSettings); setIsPaused(data.maintenance_mode); }
    } catch (error) { console.error('Error loading settings:', error); }
  }, [gameType]);

  useEffect(() => { (async () => { setIsLoading(true); await Promise.all([loadRoundInfo(), loadLiveBets(), loadHistory(), loadSettings()]); setIsLoading(false); })(); }, [loadRoundInfo, loadLiveBets, loadHistory, loadSettings]);

  useEffect(() => {
    const channel = supabase.channel(`game-monitor-${gameType}-${gameMode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_bets', filter: `game_type=eq.${gameType}` }, () => { loadLiveBets(); loadRoundInfo(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_rounds', filter: `game_type=eq.${gameType}` }, () => { loadRoundInfo(); loadHistory(); })
      .subscribe();
    const interval = setInterval(() => { loadLiveBets(); loadRoundInfo(); }, 5000);
    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, [gameType, gameMode, loadLiveBets, loadRoundInfo, loadHistory]);

  const togglePause = async () => {
    if (!canEdit) return;
    try {
      const { error } = await supabase.from('game_admin_settings').update({ maintenance_mode: !isPaused }).eq('game_type', gameType);
      if (error) throw error;
      setIsPaused(!isPaused);
      toast.success(isPaused ? 'Betting resumed' : 'Betting paused');
    } catch { toast.error('Failed to toggle betting'); }
  };

  const saveSettings = async () => {
    if (!settings || !canEdit) return;
    try {
      const { error } = await supabase.from('game_admin_settings').update({ min_bet: settings.min_bet, max_bet: settings.max_bet, house_edge_percent: settings.house_edge_percent }).eq('id', settings.id);
      if (error) throw error;
      toast.success('Settings saved');
      setSettingsOpen(false);
    } catch { toast.error('Failed to save settings'); }
  };

  const freezeUser = async (userId: string) => {
    if (!canEdit) return;
    try {
      const { error } = await supabase.from('profiles').update({ is_frozen: true }).eq('user_id', userId);
      if (error) throw error;
      toast.success('User frozen');
      setFreezeDialogOpen(false);
      setSelectedUserId(null);
    } catch { toast.error('Failed to freeze user'); }
  };

  const exportCSV = () => {
    const headers = ['Period ID', 'Result', 'Total Bets', 'Total Payouts', 'Net Profit', 'Players', 'Time'];
    const rows = roundHistory.map(r => [r.periodId, r.result, r.totalBets, r.totalPayouts, r.netProfit, r.playerCount, r.created_at]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${gameType}-${gameMode}-history.csv`; a.click();
  };

  const filteredBets = useMemo(() => {
    if (!searchQuery) return liveBets;
    const q = searchQuery.toLowerCase();
    return liveBets.filter(b => b.username.toLowerCase().includes(q) || b.display_user_id?.toLowerCase().includes(q) || b.user_id.includes(q));
  }, [liveBets, searchQuery]);

  if (isLoading) return (<div className="flex items-center justify-center h-64"><RefreshCw className="h-8 w-8 animate-spin text-teal-500" /></div>);

  return (
    <div className="space-y-6">
      <Card className={cn('border-2', roundInfo?.status === 'BETTING' && 'border-green-500/50 bg-green-500/5', roundInfo?.status === 'LOCKED' && 'border-yellow-500/50 bg-yellow-500/5', roundInfo?.status === 'SETTLING' && 'border-blue-500/50 bg-blue-500/5', roundInfo?.status === 'RESULT' && 'border-gray-500/50 bg-gray-500/5')}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>{GameIcon && <GameIcon className="h-7 w-7 text-white" />}</div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{config.label} - {duration}</h2>
                  <Badge className={cn(roundInfo?.status === 'BETTING' && 'bg-green-500/20 text-green-400', roundInfo?.status === 'LOCKED' && 'bg-yellow-500/20 text-yellow-400', roundInfo?.status === 'SETTLING' && 'bg-blue-500/20 text-blue-400', roundInfo?.status === 'RESULT' && 'bg-gray-500/20 text-gray-400')}>{roundInfo?.status || 'UNKNOWN'}</Badge>
                  {isPaused && <Badge className="bg-red-500/20 text-red-400"><Pause className="h-3 w-3 mr-1" /> Paused</Badge>}
                </div>
                <p className="text-sm text-gray-400">Period: {roundInfo?.periodId || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right"><p className="text-xs text-gray-500">Total Bets</p><p className="text-lg font-bold text-white">{formatTaka(roundInfo?.totalBets || 0)}</p></div>
              <div className="text-right"><p className="text-xs text-gray-500">Players</p><p className="text-lg font-bold text-blue-400">{roundInfo?.playerCount || 0}</p></div>
              <div className="text-right"><p className="text-xs text-gray-500">Expected Payout</p><p className="text-lg font-bold text-orange-400">{formatTaka(betSummaries.reduce((sum, s) => sum + s.expectedPayout, 0))}</p></div>
              {roundInfo?.result && <div className="px-4 py-2 bg-gray-800 rounded-lg text-center"><p className="text-xs text-gray-500">Result</p><p className="text-2xl font-bold text-white">{roundInfo.result}</p></div>}
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center gap-2">
        {canEdit && (<>
          <Button onClick={togglePause} variant={isPaused ? 'default' : 'destructive'} className={isPaused ? 'bg-green-600 hover:bg-green-700' : ''}>{isPaused ? <><Play className="h-4 w-4 mr-2" /> Resume Betting</> : <><Pause className="h-4 w-4 mr-2" /> Pause Betting</>}</Button>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild><Button variant="outline" className="border-gray-700"><Settings className="h-4 w-4 mr-2" /> Settings</Button></DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800">
              <DialogHeader><DialogTitle className="text-white">{config.label} Settings</DialogTitle></DialogHeader>
              {settings && (<div className="space-y-4 py-4"><div className="grid grid-cols-2 gap-4"><div><Label className="text-white">Min Bet (৳)</Label><Input type="number" value={settings.min_bet} onChange={(e) => setSettings({ ...settings, min_bet: Number(e.target.value) })} className="bg-gray-800 border-gray-700 text-white mt-1" /></div><div><Label className="text-white">Max Bet (৳)</Label><Input type="number" value={settings.max_bet} onChange={(e) => setSettings({ ...settings, max_bet: Number(e.target.value) })} className="bg-gray-800 border-gray-700 text-white mt-1" /></div></div><div><div className="flex justify-between mb-2"><Label className="text-white">Fee %</Label><span className="text-teal-400 font-bold">{settings.house_edge_percent}%</span></div><Slider value={[settings.house_edge_percent]} onValueChange={([v]) => setSettings({ ...settings, house_edge_percent: v })} min={0} max={10} step={0.5} /></div></div>)}
              <DialogFooter><DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose><Button onClick={saveSettings} className="bg-green-600 hover:bg-green-700">Save Changes</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>)}
        <Button variant="outline" className="border-gray-700" onClick={exportCSV}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" /><Input placeholder="Search user..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-48 bg-gray-900/50 border-gray-800 text-white" /></div>
          <Button variant="outline" className="border-gray-700" onClick={() => { loadRoundInfo(); loadLiveBets(); loadHistory(); }}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>
      {(gameType === 'wingo' || gameType === 'k3' || gameType === '5d' || gameType === 'trxwin') && canEdit && (
        <LiveResultControl gameType={gameType as 'wingo' | 'k3' | '5d' | 'trxwin'} gameMode={gameMode} currentTradeId={roundInfo?.periodId} onResultSet={() => { loadRoundInfo(); loadLiveBets(); }} />
      )}
      <Tabs defaultValue="live-bets" className="w-full">
        <TabsList className="bg-gray-900/50 border border-gray-800">
          <TabsTrigger value="live-bets" className="data-[state=active]:bg-gray-800"><Users className="h-4 w-4 mr-2" /> Live Bets ({filteredBets.length})</TabsTrigger>
          <TabsTrigger value="summary" className="data-[state=active]:bg-gray-800"><TrendingUp className="h-4 w-4 mr-2" /> Bet Summary</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-gray-800"><Clock className="h-4 w-4 mr-2" /> History</TabsTrigger>
        </TabsList>
        <TabsContent value="live-bets" className="mt-4">
          <Card className="bg-gray-900/50 border-gray-800"><CardHeader className="pb-2"><CardTitle className="text-white text-lg">Live Bets</CardTitle><CardDescription className="text-gray-400">Real-time bets for current round</CardDescription></CardHeader>
            <CardContent><ScrollArea className="h-[400px]"><Table><TableHeader><TableRow className="border-gray-800"><TableHead className="text-gray-400">User ID</TableHead><TableHead className="text-gray-400">Username</TableHead><TableHead className="text-gray-400">Bet Value</TableHead><TableHead className="text-gray-400 text-right">Amount</TableHead><TableHead className="text-gray-400">Phone</TableHead><TableHead className="text-gray-400">Time</TableHead>{canEdit && <TableHead className="text-gray-400">Action</TableHead>}</TableRow></TableHeader>
              <TableBody>{filteredBets.map((bet) => (<TableRow key={bet.id} className="border-gray-800"><TableCell className="text-gray-300 font-mono text-xs">{bet.display_user_id || bet.user_id.slice(0, 8)}</TableCell><TableCell className="text-white font-medium">{bet.username}</TableCell><TableCell><Badge variant="outline" className="text-gray-300">{bet.bet_type}: {bet.bet_value}</Badge></TableCell><TableCell className="text-right text-white font-medium">{formatTaka(bet.bet_amount)}</TableCell><TableCell className="text-gray-400 text-sm">{bet.phone || '-'}</TableCell><TableCell className="text-gray-400 text-sm">{format(new Date(bet.created_at), 'HH:mm:ss')}</TableCell>{canEdit && <TableCell><Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 h-7 px-2" onClick={() => { setSelectedUserId(bet.user_id); setFreezeDialogOpen(true); }}><Ban className="h-3 w-3 mr-1" /> Freeze</Button></TableCell>}</TableRow>))}{filteredBets.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-gray-500 py-8">No bets yet</TableCell></TableRow>}</TableBody></Table></ScrollArea></CardContent></Card>
        </TabsContent>
        <TabsContent value="summary" className="mt-4">
          <Card className="bg-gray-900/50 border-gray-800"><CardHeader className="pb-2"><CardTitle className="text-white text-lg">Bet Summary by Option</CardTitle><CardDescription className="text-gray-400">Aggregated bets per result option (read-only)</CardDescription></CardHeader>
            <CardContent><Table><TableHeader><TableRow className="border-gray-800"><TableHead className="text-gray-400">Option</TableHead><TableHead className="text-gray-400 text-right">Total Amount</TableHead><TableHead className="text-gray-400 text-right">Users</TableHead><TableHead className="text-gray-400 text-right">Odds</TableHead><TableHead className="text-gray-400 text-right">Expected Payout</TableHead></TableRow></TableHeader>
              <TableBody>{betSummaries.map((summary) => (<TableRow key={summary.option} className="border-gray-800"><TableCell><Badge className="bg-gray-800 text-white">{summary.label}</Badge></TableCell><TableCell className="text-right text-white font-medium">{formatTaka(summary.totalAmount)}</TableCell><TableCell className="text-right text-blue-400">{summary.userCount}</TableCell><TableCell className="text-right text-gray-400">{summary.odds}x</TableCell><TableCell className="text-right text-orange-400 font-medium">{formatTaka(summary.expectedPayout)}</TableCell></TableRow>))}{betSummaries.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-8">No bets to summarize</TableCell></TableRow>}</TableBody></Table>
              {betSummaries.length > 0 && (<div className="mt-4 p-4 bg-gray-800/50 rounded-lg flex items-center justify-between"><span className="text-gray-400">Total</span><div className="flex items-center gap-8"><div className="text-right"><p className="text-xs text-gray-500">Total Bet Amount</p><p className="text-lg font-bold text-white">{formatTaka(betSummaries.reduce((sum, s) => sum + s.totalAmount, 0))}</p></div><div className="text-right"><p className="text-xs text-gray-500">Max Expected Payout</p><p className="text-lg font-bold text-orange-400">{formatTaka(Math.max(...betSummaries.map(s => s.expectedPayout), 0))}</p></div></div></div>)}
            </CardContent></Card>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <Card className="bg-gray-900/50 border-gray-800"><CardHeader className="pb-2"><CardTitle className="text-white text-lg">Round History</CardTitle><CardDescription className="text-gray-400">Last 50 rounds</CardDescription></CardHeader>
            <CardContent><ScrollArea className="h-[400px]"><Table><TableHeader><TableRow className="border-gray-800"><TableHead className="text-gray-400">Period</TableHead><TableHead className="text-gray-400">Result</TableHead><TableHead className="text-gray-400 text-right">Total Bets</TableHead><TableHead className="text-gray-400 text-right">Payouts</TableHead><TableHead className="text-gray-400 text-right">Net Profit</TableHead><TableHead className="text-gray-400 text-right">Players</TableHead><TableHead className="text-gray-400">Time</TableHead></TableRow></TableHeader>
              <TableBody>{roundHistory.map((round) => (<TableRow key={round.periodId} className="border-gray-800"><TableCell className="text-gray-300 font-mono text-xs">{round.periodId}</TableCell><TableCell><Badge className={cn('font-bold', round.result_color === 'red' && 'bg-red-500/20 text-red-400', round.result_color === 'green' && 'bg-green-500/20 text-green-400', round.result_color === 'violet' && 'bg-purple-500/20 text-purple-400', !round.result_color && 'bg-gray-500/20 text-gray-400')}>{round.result}</Badge></TableCell><TableCell className="text-right text-white">{formatTaka(round.totalBets)}</TableCell><TableCell className="text-right text-orange-400">{formatTaka(round.totalPayouts)}</TableCell><TableCell className="text-right"><span className={cn('font-medium', round.netProfit >= 0 ? 'text-green-400' : 'text-red-400')}>{round.netProfit >= 0 ? '+' : ''}{formatTaka(round.netProfit)}</span></TableCell><TableCell className="text-right text-blue-400">{round.playerCount}</TableCell><TableCell className="text-gray-400 text-sm">{format(new Date(round.created_at), 'HH:mm:ss')}</TableCell></TableRow>))}{roundHistory.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-gray-500 py-8">No history available</TableCell></TableRow>}</TableBody></Table></ScrollArea></CardContent></Card>
        </TabsContent>
      </Tabs>
      <Dialog open={freezeDialogOpen} onOpenChange={setFreezeDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader><DialogTitle className="text-white flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-400" />Freeze User</DialogTitle></DialogHeader>
          <p className="text-gray-400">Are you sure you want to freeze this user? They will not be able to place bets until unfrozen.</p>
          <DialogFooter><DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose><Button variant="destructive" onClick={() => selectedUserId && freezeUser(selectedUserId)}>Freeze User</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameMonitorPanel;
