import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, RefreshCw, Bomb, TrendingUp, Users, DollarSign, Receipt, Shield, Crown, History, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface MinesSettings {
  id: string;
  enabled: boolean;
  rtp_target: number;
  min_bet: number;
  max_bet: number;
  max_mines_3x3: number;
  max_mines_5x5: number;
  max_mines_7x7: number;
  profit_cap_per_round: number;
  tax_percent: number;
  tax_method: string;
  vip_instant_level: number;
  max_consecutive_wins: number | null;
  max_profit_per_day: number | null;
  allow_3x3: boolean;
  allow_5x5: boolean;
  allow_7x7: boolean;
}

interface MinesStats {
  totalRounds: number;
  totalBets: number;
  totalPayouts: number;
  totalTax: number;
  houseEdge: number;
  winRate: number;
  avgMultiplier: number;
}

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  old_value: any;
  new_value: any;
  created_at: string;
}

const MinesGameAdmin = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<MinesSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<MinesSettings | null>(null);
  const [stats, setStats] = useState<MinesStats>({
    totalRounds: 0,
    totalBets: 0,
    totalPayouts: 0,
    totalTax: 0,
    houseEdge: 0,
    winRate: 0,
    avgMultiplier: 0,
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch settings
      const { data: settingsData } = await supabase
        .from('mines_settings')
        .select('*')
        .single();

      if (settingsData) {
        setSettings(settingsData as MinesSettings);
        setOriginalSettings(settingsData as MinesSettings);
      }

      // Fetch stats
      const { data: roundsData } = await supabase
        .from('mines_rounds')
        .select('bet_amount, final_payout, tax_amount, status, current_multiplier');

      if (roundsData) {
        const totalRounds = roundsData.length;
        const totalBets = roundsData.reduce((sum, r) => sum + Number(r.bet_amount), 0);
        const totalPayouts = roundsData.reduce((sum, r) => sum + Number(r.final_payout || 0), 0);
        const totalTax = roundsData.reduce((sum, r) => sum + Number(r.tax_amount || 0), 0);
        const wins = roundsData.filter(r => r.status === 'won' || r.status === 'cashed_out');
        const winRate = totalRounds > 0 ? (wins.length / totalRounds) * 100 : 0;
        const avgMultiplier = wins.length > 0 
          ? wins.reduce((sum, r) => sum + Number(r.current_multiplier || 1), 0) / wins.length 
          : 0;
        const houseEdge = totalBets > 0 ? ((totalBets - totalPayouts) / totalBets) * 100 : 0;

        setStats({
          totalRounds,
          totalBets,
          totalPayouts,
          totalTax,
          houseEdge,
          winRate,
          avgMultiplier,
        });
      }

      // Fetch audit logs
      const { data: logsData } = await supabase
        .from('mines_admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsData) {
        setAuditLogs(logsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      // Get current user for audit log
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('mines_settings')
        .update({
          enabled: settings.enabled,
          rtp_target: settings.rtp_target,
          min_bet: settings.min_bet,
          max_bet: settings.max_bet,
          max_mines_3x3: settings.max_mines_3x3,
          max_mines_5x5: settings.max_mines_5x5,
          max_mines_7x7: settings.max_mines_7x7,
          profit_cap_per_round: settings.profit_cap_per_round,
          tax_percent: settings.tax_percent,
          tax_method: settings.tax_method,
          vip_instant_level: settings.vip_instant_level,
          max_consecutive_wins: settings.max_consecutive_wins,
          max_profit_per_day: settings.max_profit_per_day,
          allow_3x3: settings.allow_3x3,
          allow_5x5: settings.allow_5x5,
          allow_7x7: settings.allow_7x7,
        })
        .eq('id', settings.id);

      if (error) throw error;

      // Create audit log entry
      if (user) {
        await supabase.from('mines_admin_audit_logs').insert([{
          admin_id: user.id,
          action: 'settings_update',
          old_value: JSON.parse(JSON.stringify(originalSettings)),
          new_value: JSON.parse(JSON.stringify(settings)),
        }]);
      }

      setOriginalSettings(settings);
      toast.success('Settings saved successfully!');
      fetchData(); // Refresh audit logs
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-orange-600 to-amber-600 shadow-xl">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Bomb className="w-6 h-6" />
              <span className="font-bold text-lg">Mines Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchData}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-white text-orange-600 hover:bg-white/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-5xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Total Rounds</p>
                  <p className="text-xl font-bold">{stats.totalRounds.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Total Bets</p>
                  <p className="text-xl font-bold">৳{stats.totalBets.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Total Payouts</p>
                  <p className="text-xl font-bold">৳{stats.totalPayouts.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Bomb className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">House Edge</p>
                  <p className="text-xl font-bold">{stats.houseEdge.toFixed(2)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Total Tax Collected</p>
                  <p className="text-xl font-bold text-emerald-400">৳{stats.totalTax.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Player Win Rate</p>
                  <p className="text-xl font-bold">{stats.winRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Avg Win Multiplier</p>
                  <p className="text-xl font-bold">{stats.avgMultiplier.toFixed(2)}x</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {settings && (
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="bg-gray-800 border border-gray-700">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="rtp">RTP & Tax</TabsTrigger>
              <TabsTrigger value="limits">Limits</TabsTrigger>
              <TabsTrigger value="grids">Grid Settings</TabsTrigger>
              <TabsTrigger value="risk">Risk Controls</TabsTrigger>
              <TabsTrigger value="audit">Audit Log</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              {/* Game Toggle */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Game Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable Mines Game</p>
                      <p className="text-gray-400 text-sm">Players can access the game when enabled</p>
                    </div>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(enabled) => setSettings({ ...settings, enabled })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* VIP Settings */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    VIP Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">VIP Instant Mode Unlock Level</label>
                    <Input
                      type="number"
                      value={settings.vip_instant_level}
                      onChange={(e) => setSettings({ ...settings, vip_instant_level: Number(e.target.value) })}
                      className="bg-gray-700 border-gray-600"
                      min={1}
                      max={10}
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      VIP level required to unlock instant animation mode
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rtp" className="space-y-4">
              {/* RTP Settings */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">RTP (Return to Player)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">RTP Target</label>
                      <span className="text-orange-400 font-bold">{settings.rtp_target}%</span>
                    </div>
                    <Slider
                      value={[settings.rtp_target]}
                      min={92}
                      max={97}
                      step={0.5}
                      onValueChange={([val]) => setSettings({ ...settings, rtp_target: val })}
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      Higher RTP = More player-friendly, Lower house edge
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tax Settings */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-400" />
                    Tax Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">Tax Percentage</label>
                      <span className="text-amber-400 font-bold">{settings.tax_percent}%</span>
                    </div>
                    <Slider
                      value={[settings.tax_percent]}
                      min={0}
                      max={10}
                      step={0.5}
                      onValueChange={([val]) => setSettings({ ...settings, tax_percent: val })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Tax Method</label>
                    <Select
                      value={settings.tax_method}
                      onValueChange={(value) => setSettings({ ...settings, tax_method: value })}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="profit">Tax on Profit Only (Win - Bet)</SelectItem>
                        <SelectItem value="total">Tax on Total Payout</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-gray-400 text-xs mt-1">
                      {settings.tax_method === 'profit' 
                        ? 'Tax only applies to profit (payout minus original bet)'
                        : 'Tax applies to the entire payout amount'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="limits" className="space-y-4">
              {/* Bet Limits */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Bet Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Minimum Bet (৳)</label>
                      <Input
                        type="number"
                        value={settings.min_bet}
                        onChange={(e) => setSettings({ ...settings, min_bet: Number(e.target.value) })}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">Maximum Bet (৳)</label>
                      <Input
                        type="number"
                        value={settings.max_bet}
                        onChange={(e) => setSettings({ ...settings, max_bet: Number(e.target.value) })}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profit Cap */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Profit Cap</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <label className="text-sm font-medium block mb-2">Max Win Per Round (৳)</label>
                    <Input
                      type="number"
                      value={settings.profit_cap_per_round}
                      onChange={(e) => setSettings({ ...settings, profit_cap_per_round: Number(e.target.value) })}
                      className="bg-gray-700 border-gray-600"
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      Maximum payout allowed per single round
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="grids" className="space-y-4">
              {/* Grid Toggles */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Allowed Grid Sizes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">3×3 Grid (9 tiles)</p>
                      <p className="text-gray-400 text-sm">Quick rounds, faster gameplay</p>
                    </div>
                    <Switch
                      checked={settings.allow_3x3}
                      onCheckedChange={(allow_3x3) => setSettings({ ...settings, allow_3x3 })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">5×5 Grid (25 tiles)</p>
                      <p className="text-gray-400 text-sm">Balanced gameplay</p>
                    </div>
                    <Switch
                      checked={settings.allow_5x5}
                      onCheckedChange={(allow_5x5) => setSettings({ ...settings, allow_5x5 })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">7×7 Grid (49 tiles)</p>
                      <p className="text-gray-400 text-sm">Maximum tiles, longer sessions</p>
                    </div>
                    <Switch
                      checked={settings.allow_7x7}
                      onCheckedChange={(allow_7x7) => setSettings({ ...settings, allow_7x7 })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Mine Limits */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Maximum Mines Per Grid</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">3×3 Grid (max 8)</label>
                      <Input
                        type="number"
                        value={settings.max_mines_3x3}
                        onChange={(e) => setSettings({ ...settings, max_mines_3x3: Math.min(8, Number(e.target.value)) })}
                        className="bg-gray-700 border-gray-600"
                        max={8}
                        disabled={!settings.allow_3x3}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">5×5 Grid (max 24)</label>
                      <Input
                        type="number"
                        value={settings.max_mines_5x5}
                        onChange={(e) => setSettings({ ...settings, max_mines_5x5: Math.min(24, Number(e.target.value)) })}
                        className="bg-gray-700 border-gray-600"
                        max={24}
                        disabled={!settings.allow_5x5}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">7×7 Grid (max 48)</label>
                      <Input
                        type="number"
                        value={settings.max_mines_7x7}
                        onChange={(e) => setSettings({ ...settings, max_mines_7x7: Math.min(48, Number(e.target.value)) })}
                        className="bg-gray-700 border-gray-600"
                        max={48}
                        disabled={!settings.allow_7x7}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk" className="space-y-4">
              {/* Risk Controls */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Risk Guardrails
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium block mb-2">Max Consecutive Wins Per User (Optional)</label>
                    <Input
                      type="number"
                      value={settings.max_consecutive_wins || ''}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        max_consecutive_wins: e.target.value ? Number(e.target.value) : null 
                      })}
                      className="bg-gray-700 border-gray-600"
                      placeholder="Leave empty to disable"
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      Limit how many games in a row a user can win (fraud prevention)
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Max Profit Per Day Per User (৳) (Optional)</label>
                    <Input
                      type="number"
                      value={settings.max_profit_per_day || ''}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        max_profit_per_day: e.target.value ? Number(e.target.value) : null 
                      })}
                      className="bg-gray-700 border-gray-600"
                      placeholder="Leave empty to disable"
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      Maximum daily profit allowed per user
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="space-y-4">
              {/* Audit Log */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Audit Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {auditLogs.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No audit logs yet</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {auditLogs.map((log) => (
                        <div 
                          key={log.id}
                          className="p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-amber-400 border-amber-400/50">
                              {log.action}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {format(new Date(log.created_at), 'PPpp')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 font-mono truncate">
                            Admin: {log.admin_id.slice(0, 8)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default MinesGameAdmin;
