import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Rocket, Save, RefreshCw, AlertTriangle, 
  Settings, TrendingUp, Shield, Zap, History, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isAdminAuthenticated } from "@/lib/bannerConfig";
import { format } from "date-fns";

interface CrashSettings {
  id: string;
  enabled: boolean;
  rtp_target: number;
  mode: "rtp" | "bucket";
  bucket_early_prob: number;
  bucket_mid_prob: number;
  bucket_high_prob: number;
  bucket_ultra_prob: number;
  max_cap: number;
  min_bet: number;
  max_bet: number;
  jackpot_enabled: boolean;
  jackpot_chance: number;
  jackpot_max_multiplier: number;
  risk_guard_enabled: boolean;
  risk_guard_threshold: number;
  manual_force_enabled: boolean;
  manual_force_value: number | null;
  round_bet_window_seconds: number;
}

interface AuditLog {
  id: string;
  admin_id: string | null;
  action: string;
  old_value: unknown;
  new_value: unknown;
  created_at: string;
}

interface RoundStats {
  total_rounds: number;
  avg_crash: number;
  total_bets: number;
  total_payouts: number;
  house_profit: number;
}

const CrashGameAdmin = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<CrashSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<CrashSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<RoundStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Force crash value
  const [forceValue, setForceValue] = useState("");
  
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login");
      return;
    }
    loadData();
  }, [navigate]);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("crash_settings")
        .select("*")
        .single();
      
      if (settingsError) throw settingsError;
      setSettings(settingsData as CrashSettings);
      setOriginalSettings(settingsData as CrashSettings);
      if (settingsData.manual_force_value) {
        setForceValue(settingsData.manual_force_value.toString());
      }
      
      // Load audit logs
      const { data: logsData } = await supabase
        .from("admin_crash_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (logsData) {
        setAuditLogs(logsData as AuditLog[]);
      }
      
      // Calculate stats
      const { data: roundsData } = await supabase
        .from("crash_rounds")
        .select("crash_multiplier, total_bets, total_payouts")
        .eq("status", "settled");
      
      if (roundsData && roundsData.length > 0) {
        const totalRounds = roundsData.length;
        const avgCrash = roundsData.reduce((sum, r) => sum + Number(r.crash_multiplier), 0) / totalRounds;
        const totalBets = roundsData.reduce((sum, r) => sum + Number(r.total_bets), 0);
        const totalPayouts = roundsData.reduce((sum, r) => sum + Number(r.total_payouts), 0);
        
        setStats({
          total_rounds: totalRounds,
          avg_crash: avgCrash,
          total_bets: totalBets,
          total_payouts: totalPayouts,
          house_profit: totalBets - totalPayouts,
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      // Log changes
      const changes: Record<string, { old: unknown; new: unknown }> = {};
      if (originalSettings) {
        Object.keys(settings).forEach((key) => {
          const k = key as keyof CrashSettings;
          if (settings[k] !== originalSettings[k]) {
            changes[key] = { old: originalSettings[k], new: settings[k] };
          }
        });
      }
      
      // Update settings
      const { error } = await supabase
        .from("crash_settings")
        .update({
          enabled: settings.enabled,
          rtp_target: settings.rtp_target,
          mode: settings.mode,
          bucket_early_prob: settings.bucket_early_prob,
          bucket_mid_prob: settings.bucket_mid_prob,
          bucket_high_prob: settings.bucket_high_prob,
          bucket_ultra_prob: settings.bucket_ultra_prob,
          max_cap: settings.max_cap,
          min_bet: settings.min_bet,
          max_bet: settings.max_bet,
          jackpot_enabled: settings.jackpot_enabled,
          jackpot_chance: settings.jackpot_chance,
          jackpot_max_multiplier: settings.jackpot_max_multiplier,
          risk_guard_enabled: settings.risk_guard_enabled,
          risk_guard_threshold: settings.risk_guard_threshold,
          manual_force_enabled: settings.manual_force_enabled,
          manual_force_value: settings.manual_force_value,
          round_bet_window_seconds: settings.round_bet_window_seconds,
        })
        .eq("id", settings.id);
      
      if (error) throw error;
      
      // Insert audit log
      if (Object.keys(changes).length > 0) {
        await supabase.from("admin_crash_audit_logs").insert([{
          action: "settings_updated",
          old_value: JSON.parse(JSON.stringify(originalSettings)),
          new_value: JSON.parse(JSON.stringify(settings)),
        }]);
      }
      
      setOriginalSettings(settings);
      toast.success("Settings saved successfully");
      loadData();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleForceNextCrash = async () => {
    const value = parseFloat(forceValue);
    if (isNaN(value) || value < 1.01) {
      toast.error("Invalid crash value (min 1.01)");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("crash_settings")
        .update({
          manual_force_enabled: true,
          manual_force_value: value,
        })
        .eq("id", settings?.id);
      
      if (error) throw error;
      
      // Log the force action
      await supabase.from("admin_crash_audit_logs").insert([{
        action: "force_crash_set",
        new_value: { crash_value: value },
      }]);
      
      toast.success(`Next round will crash at ${value}x`);
      loadData();
    } catch (error) {
      console.error("Error setting forced crash:", error);
      toast.error("Failed to set forced crash");
    }
  };
  
  const handleClearForce = async () => {
    try {
      const { error } = await supabase
        .from("crash_settings")
        .update({
          manual_force_enabled: false,
          manual_force_value: null,
        })
        .eq("id", settings?.id);
      
      if (error) throw error;
      
      await supabase.from("admin_crash_audit_logs").insert([{
        action: "force_crash_cleared",
      }]);
      
      setForceValue("");
      toast.success("Force crash cleared");
      loadData();
    } catch (error) {
      console.error("Error clearing force:", error);
      toast.error("Failed to clear force");
    }
  };
  
  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <RefreshCw className="animate-spin text-white" size={32} />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/dashboard")} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg flex items-center gap-2">
              <Rocket className="text-orange-500" size={20} />
              Crash Game Admin
            </h1>
            <p className="text-slate-400 text-xs">Manage game settings & configuration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300"
          >
            <RefreshCw size={16} />
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
            Save
          </Button>
        </div>
      </header>
      
      <div className="p-4 space-y-4">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-3">
                <p className="text-slate-400 text-xs">Total Rounds</p>
                <p className="text-white font-bold text-lg">{stats.total_rounds}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-3">
                <p className="text-slate-400 text-xs">Avg Crash</p>
                <p className="text-orange-400 font-bold text-lg">{stats.avg_crash.toFixed(2)}x</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-3">
                <p className="text-slate-400 text-xs">Total Bets</p>
                <p className="text-white font-bold text-lg">৳{stats.total_bets.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-3">
                <p className="text-slate-400 text-xs">Total Payouts</p>
                <p className="text-white font-bold text-lg">৳{stats.total_payouts.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-3">
                <p className="text-slate-400 text-xs">House Profit</p>
                <p className={`font-bold text-lg ${stats.house_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ৳{stats.house_profit.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Main Settings */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full bg-slate-800 border border-slate-700">
            <TabsTrigger value="general" className="flex-1 data-[state=active]:bg-slate-700">
              <Settings size={16} className="mr-2" /> General
            </TabsTrigger>
            <TabsTrigger value="rtp" className="flex-1 data-[state=active]:bg-slate-700">
              <Target size={16} className="mr-2" /> RTP & Odds
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex-1 data-[state=active]:bg-slate-700">
              <Shield size={16} className="mr-2" /> Risk Control
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex-1 data-[state=active]:bg-slate-700">
              <History size={16} className="mr-2" /> Audit Log
            </TabsTrigger>
          </TabsList>
          
          {/* General Settings */}
          <TabsContent value="general" className="mt-4 space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Rocket className="text-orange-500" size={20} />
                  Game Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Enable Crash Game</Label>
                    <p className="text-slate-400 text-xs">Turn the game on/off for all users</p>
                  </div>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Min Bet (৳)</Label>
                    <Input
                      type="number"
                      value={settings.min_bet}
                      onChange={(e) => setSettings({ ...settings, min_bet: parseFloat(e.target.value) })}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Max Bet (৳)</Label>
                    <Input
                      type="number"
                      value={settings.max_bet}
                      onChange={(e) => setSettings({ ...settings, max_bet: parseFloat(e.target.value) })}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-white">Betting Window (seconds)</Label>
                  <Input
                    type="number"
                    value={settings.round_bet_window_seconds}
                    onChange={(e) => setSettings({ ...settings, round_bet_window_seconds: parseInt(e.target.value) })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                    min={3}
                    max={30}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* RTP Settings */}
          <TabsContent value="rtp" className="mt-4 space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="text-green-500" size={20} />
                  RTP & Distribution
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configure return-to-player and crash distribution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-white">Distribution Mode</Label>
                  <Select
                    value={settings.mode}
                    onValueChange={(v: "rtp" | "bucket") => setSettings({ ...settings, mode: v })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rtp">RTP-Based (Recommended)</SelectItem>
                      <SelectItem value="bucket">Fixed Buckets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {settings.mode === "rtp" ? (
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="text-white">RTP Target</Label>
                      <span className="text-orange-400 font-bold">{settings.rtp_target}%</span>
                    </div>
                    <Slider
                      value={[settings.rtp_target]}
                      onValueChange={([v]) => setSettings({ ...settings, rtp_target: v })}
                      min={90}
                      max={97}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-slate-400 text-xs mt-1">Range: 90% - 97%</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <Label className="text-white text-sm">Early Crash (1.01x - 1.50x)</Label>
                        <span className="text-slate-300">{settings.bucket_early_prob}%</span>
                      </div>
                      <Slider
                        value={[settings.bucket_early_prob]}
                        onValueChange={([v]) => setSettings({ ...settings, bucket_early_prob: v })}
                        min={0}
                        max={100}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <Label className="text-white text-sm">Mid Crash (1.50x - 3.00x)</Label>
                        <span className="text-slate-300">{settings.bucket_mid_prob}%</span>
                      </div>
                      <Slider
                        value={[settings.bucket_mid_prob]}
                        onValueChange={([v]) => setSettings({ ...settings, bucket_mid_prob: v })}
                        min={0}
                        max={100}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <Label className="text-white text-sm">High Crash (3.00x - 10.00x)</Label>
                        <span className="text-slate-300">{settings.bucket_high_prob}%</span>
                      </div>
                      <Slider
                        value={[settings.bucket_high_prob]}
                        onValueChange={([v]) => setSettings({ ...settings, bucket_high_prob: v })}
                        min={0}
                        max={100}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <Label className="text-white text-sm">Ultra High (10.00x - 50.00x)</Label>
                        <span className="text-slate-300">{settings.bucket_ultra_prob}%</span>
                      </div>
                      <Slider
                        value={[settings.bucket_ultra_prob]}
                        onValueChange={([v]) => setSettings({ ...settings, bucket_ultra_prob: v })}
                        min={0}
                        max={100}
                      />
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Max Multiplier Cap</Label>
                    <Input
                      type="number"
                      value={settings.max_cap}
                      onChange={(e) => setSettings({ ...settings, max_cap: parseFloat(e.target.value) })}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                      step="0.01"
                    />
                  </div>
                </div>
                
                {/* Jackpot Settings */}
                <div className="border-t border-slate-700 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label className="text-white flex items-center gap-2">
                        <Zap className="text-yellow-500" size={16} />
                        Jackpot Rounds
                      </Label>
                      <p className="text-slate-400 text-xs">Rare high-multiplier rounds</p>
                    </div>
                    <Switch
                      checked={settings.jackpot_enabled}
                      onCheckedChange={(v) => setSettings({ ...settings, jackpot_enabled: v })}
                    />
                  </div>
                  
                  {settings.jackpot_enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white text-sm">Jackpot Chance (%)</Label>
                        <Input
                          type="number"
                          value={settings.jackpot_chance * 100}
                          onChange={(e) => setSettings({ ...settings, jackpot_chance: parseFloat(e.target.value) / 100 })}
                          className="bg-slate-700 border-slate-600 text-white mt-1"
                          step="0.01"
                          min="0"
                          max="5"
                        />
                      </div>
                      <div>
                        <Label className="text-white text-sm">Jackpot Max Multiplier</Label>
                        <Input
                          type="number"
                          value={settings.jackpot_max_multiplier}
                          onChange={(e) => setSettings({ ...settings, jackpot_max_multiplier: parseFloat(e.target.value) })}
                          className="bg-slate-700 border-slate-600 text-white mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Risk Control */}
          <TabsContent value="risk" className="mt-4 space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="text-blue-500" size={20} />
                  Risk Guard
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Protect against large losses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Enable Risk Guard</Label>
                    <p className="text-slate-400 text-xs">Auto-adjust crash odds for high-stake rounds</p>
                  </div>
                  <Switch
                    checked={settings.risk_guard_enabled}
                    onCheckedChange={(v) => setSettings({ ...settings, risk_guard_enabled: v })}
                  />
                </div>
                
                {settings.risk_guard_enabled && (
                  <div>
                    <Label className="text-white">Threshold Amount (৳)</Label>
                    <Input
                      type="number"
                      value={settings.risk_guard_threshold}
                      onChange={(e) => setSettings({ ...settings, risk_guard_threshold: parseFloat(e.target.value) })}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                    />
                    <p className="text-slate-400 text-xs mt-1">
                      When total bets exceed this, increase early-crash probability
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Manual Override */}
            <Card className="bg-red-900/20 border-red-500/50">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Manual Override (Emergency)
                </CardTitle>
                <CardDescription className="text-red-300/70">
                  Force the next round to crash at a specific value. Use with caution!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.manual_force_enabled && settings.manual_force_value && (
                  <Badge className="bg-red-500 text-white">
                    ⚠️ Force active: Next crash at {settings.manual_force_value}x
                  </Badge>
                )}
                
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={forceValue}
                    onChange={(e) => setForceValue(e.target.value)}
                    placeholder="e.g. 1.50"
                    className="bg-slate-700 border-slate-600 text-white"
                    step="0.01"
                    min="1.01"
                  />
                  <Button
                    onClick={handleForceNextCrash}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Force Next Crash
                  </Button>
                </div>
                
                {settings.manual_force_enabled && (
                  <Button
                    onClick={handleClearForce}
                    variant="outline"
                    className="w-full border-red-500 text-red-400 hover:bg-red-500/20"
                  >
                    Clear Forced Crash
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Audit Log */}
          <TabsContent value="audit" className="mt-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History size={20} className="text-indigo-400" />
                  Audit Log
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Track all admin changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {auditLogs.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                      No audit logs yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="bg-slate-700/50 rounded-lg p-3 border border-slate-600"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-xs">
                              {log.action}
                            </Badge>
                            <span className="text-slate-400 text-xs">
                              {format(new Date(log.created_at), "PPpp")}
                            </span>
                          </div>
                          {log.new_value && (
                            <pre className="text-xs text-slate-300 mt-2 overflow-x-auto">
                              {JSON.stringify(log.new_value, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CrashGameAdmin;
