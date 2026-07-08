import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { 
  Plane, Save, RefreshCw, AlertTriangle, 
  Settings, TrendingUp, Shield, History, Users,
  DollarSign, BarChart3, Clock, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isAdminAuthenticated } from "@/lib/bannerConfig";
import GameAdminSidebar from "@/components/game-admin/GameAdminSidebar";

interface GameSettings {
  id: string;
  game_type: string;
  is_enabled: boolean;
  maintenance_mode: boolean;
  min_bet: number;
  max_bet: number;
  house_edge_percent: number;
  auto_result_enabled: boolean;
  manual_result_override: boolean;
}

interface GameStats {
  totalBets: number;
  totalPayouts: number;
  uniquePlayers: number;
  profit: number;
  avgBetAmount: number;
  totalRounds: number;
}

interface LiveBet {
  id: string;
  user_id: string;
  username?: string;
  bet_amount: number;
  bet_type: string;
  bet_value: string;
  status: string;
  payout: number | null;
  created_at: string;
}

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  old_value: unknown;
  new_value: unknown;
  created_at: string;
  game_type?: string;
}

const AviatorGameAdmin = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<GameSettings | null>(null);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [adminName, setAdminName] = useState("Game Admin");

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/game-admin/login");
      return;
    }
    loadData();
    fetchAdminName();
  }, [navigate]);

  const fetchAdminName = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();
      if (profile?.username) {
        setAdminName(profile.username);
      }
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from("game_admin_settings")
        .select("*")
        .eq("game_type", "aviator")
        .single();

      if (settingsError && settingsError.code !== "PGRST116") {
        throw settingsError;
      }

      if (settingsData) {
        setSettings(settingsData as GameSettings);
        setOriginalSettings(settingsData as GameSettings);
      } else {
        const defaultSettings: Omit<GameSettings, 'id'> = {
          game_type: 'aviator',
          is_enabled: true,
          maintenance_mode: false,
          min_bet: 10,
          max_bet: 50000,
          house_edge_percent: 5,
          auto_result_enabled: true,
          manual_result_override: false,
        };

        const { data: newSettings, error: insertError } = await supabase
          .from("game_admin_settings")
          .insert(defaultSettings)
          .select()
          .single();

        if (!insertError && newSettings) {
          setSettings(newSettings as GameSettings);
          setOriginalSettings(newSettings as GameSettings);
        }
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: betsData } = await supabase
        .from("game_bets")
        .select("bet_amount, payout, user_id, status")
        .eq("game_type", "aviator")
        .gte("created_at", today.toISOString());

      if (betsData) {
        const uniqueUsers = new Set(betsData.map((b) => b.user_id));
        const totalBets = betsData.reduce((sum, b) => sum + b.bet_amount, 0);
        const totalPayouts = betsData.reduce((sum, b) => sum + (b.payout || 0), 0);

        setStats({
          totalBets,
          totalPayouts,
          uniquePlayers: uniqueUsers.size,
          profit: totalBets - totalPayouts,
          avgBetAmount: betsData.length > 0 ? totalBets / betsData.length : 0,
          totalRounds: betsData.length,
        });
      }

      const { data: liveBetsData } = await supabase
        .from("game_bets")
        .select("*")
        .eq("game_type", "aviator")
        .order("created_at", { ascending: false })
        .limit(50);

      if (liveBetsData) {
        const userIds = [...new Set(liveBetsData.map((b) => b.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, display_user_id")
          .in("user_id", userIds);

        const usernameMap = new Map(
          profiles?.map((p) => [p.user_id, p.username || p.display_user_id || "Unknown"]) || []
        );

        setLiveBets(
          liveBetsData.map((b) => ({
            ...b,
            username: usernameMap.get(b.user_id) || b.user_id.slice(0, 8),
          }))
        );
      }

      const { data: logsData } = await supabase
        .from("game_admin_audit_logs")
        .select("*")
        .eq("game_type", "aviator")
        .order("created_at", { ascending: false })
        .limit(50);

      if (logsData) {
        setAuditLogs(logsData as AuditLog[]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const changes: Record<string, { old: unknown; new: unknown }> = {};
      if (originalSettings) {
        Object.keys(settings).forEach((key) => {
          const k = key as keyof GameSettings;
          if (settings[k] !== originalSettings[k]) {
            changes[key] = { old: originalSettings[k], new: settings[k] };
          }
        });
      }

      const { error } = await supabase
        .from("game_admin_settings")
        .update({
          is_enabled: settings.is_enabled,
          maintenance_mode: settings.maintenance_mode,
          min_bet: settings.min_bet,
          max_bet: settings.max_bet,
          house_edge_percent: settings.house_edge_percent,
          auto_result_enabled: settings.auto_result_enabled,
          manual_result_override: settings.manual_result_override,
          last_modified_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);

      if (error) throw error;

      if (Object.keys(changes).length > 0) {
        await supabase.from("game_admin_audit_logs").insert([{
          admin_id: user?.id || '',
          action: "update_settings",
          game_type: "aviator",
          old_value: JSON.parse(JSON.stringify(changes)),
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

  const hasChanges = settings && originalSettings && 
    JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex">
        <GameAdminSidebar adminName={adminName} />
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <GameAdminSidebar adminName={adminName} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Aviator Game Admin</h1>
                <p className="text-gray-400">Configure and monitor Aviator game</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadData}
                disabled={isLoading}
                className="border-white/20"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              {hasChanges && (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>
          </div>

          {settings?.maintenance_mode && (
            <Card className="bg-yellow-500/10 border-yellow-500/30">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="text-yellow-400">Maintenance mode is enabled. Game is not accessible to players.</span>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-900/50 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Today's Bets</p>
                    <p className="text-xl font-bold text-white">৳{stats?.totalBets?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Today's Payouts</p>
                    <p className="text-xl font-bold text-white">৳{stats?.totalPayouts?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">House Profit</p>
                    <p className={`text-xl font-bold ${(stats?.profit || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                      ৳{stats?.profit?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Users className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Active Players</p>
                    <p className="text-xl font-bold text-white">{stats?.uniquePlayers || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="settings" className="space-y-4">
            <TabsList className="bg-gray-900/50 border border-white/10">
              <TabsTrigger value="settings" className="data-[state=active]:bg-cyan-500/20">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="bets" className="data-[state=active]:bg-cyan-500/20">
                <Clock className="h-4 w-4 mr-2" />
                Live Bets
              </TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-cyan-500/20">
                <History className="h-4 w-4 mr-2" />
                Audit Log
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-gray-900/50 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      General Settings
                    </CardTitle>
                    <CardDescription>Configure basic game parameters</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Game Enabled</Label>
                        <p className="text-sm text-gray-400">Allow players to access the game</p>
                      </div>
                      <Switch
                        checked={settings?.is_enabled}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => prev ? { ...prev, is_enabled: checked } : null)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Maintenance Mode</Label>
                        <p className="text-sm text-gray-400">Temporarily disable for maintenance</p>
                      </div>
                      <Switch
                        checked={settings?.maintenance_mode}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => prev ? { ...prev, maintenance_mode: checked } : null)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">House Edge (%)</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[settings?.house_edge_percent || 5]}
                          onValueChange={([value]) =>
                            setSettings((prev) => prev ? { ...prev, house_edge_percent: value } : null)
                          }
                          max={20}
                          min={1}
                          step={0.5}
                          className="flex-1"
                        />
                        <span className="text-white font-mono w-16 text-right">
                          {settings?.house_edge_percent}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Bet Limits
                    </CardTitle>
                    <CardDescription>Set minimum and maximum bet amounts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-white">Minimum Bet (৳)</Label>
                      <Input
                        type="number"
                        value={settings?.min_bet || 10}
                        onChange={(e) =>
                          setSettings((prev) => prev ? { ...prev, min_bet: Number(e.target.value) } : null)
                        }
                        className="bg-gray-800/50 border-white/10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Maximum Bet (৳)</Label>
                      <Input
                        type="number"
                        value={settings?.max_bet || 50000}
                        onChange={(e) =>
                          setSettings((prev) => prev ? { ...prev, max_bet: Number(e.target.value) } : null)
                        }
                        className="bg-gray-800/50 border-white/10"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Auto Result</Label>
                        <p className="text-sm text-gray-400">Automatically generate results</p>
                      </div>
                      <Switch
                        checked={settings?.auto_result_enabled}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => prev ? { ...prev, auto_result_enabled: checked } : null)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="bets">
              <Card className="bg-gray-900/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Recent Bets
                    <Badge variant="secondary" className="ml-2">{liveBets.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-gray-400">Time</TableHead>
                          <TableHead className="text-gray-400">Player</TableHead>
                          <TableHead className="text-gray-400">Bet</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-gray-400">Payout</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {liveBets.map((bet) => (
                          <TableRow key={bet.id} className="border-white/10">
                            <TableCell className="text-gray-300">
                              {format(new Date(bet.created_at), "HH:mm:ss")}
                            </TableCell>
                            <TableCell className="text-white">{bet.username}</TableCell>
                            <TableCell className="text-white">৳{bet.bet_amount}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  bet.status === "won"
                                    ? "bg-green-500/20 text-green-400"
                                    : bet.status === "lost"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                }
                              >
                                {bet.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-white">
                              {bet.payout ? `৳${bet.payout}` : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                        {liveBets.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                              No recent bets
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit">
              <Card className="bg-gray-900/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Audit Log
                    <Badge variant="secondary" className="ml-2">{auditLogs.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-gray-400">Time</TableHead>
                          <TableHead className="text-gray-400">Action</TableHead>
                          <TableHead className="text-gray-400">Admin</TableHead>
                          <TableHead className="text-gray-400">Changes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.map((log) => (
                          <TableRow key={log.id} className="border-white/10">
                            <TableCell className="text-gray-300">
                              {format(new Date(log.created_at), "MMM dd, HH:mm")}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-purple-500/20 text-purple-400">
                                {log.action.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-400 font-mono text-xs">
                              {log.admin_id?.substring(0, 8)}...
                            </TableCell>
                            <TableCell className="text-gray-300 max-w-xs truncate">
                              {typeof log.new_value === "object"
                                ? JSON.stringify(log.new_value).substring(0, 50)
                                : String(log.new_value)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {auditLogs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                              No audit logs
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AviatorGameAdmin;

