import { useState, useEffect } from "react";
import { 
  Settings, Save, RefreshCw, Shield, DollarSign, 
  Percent, Clock, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import GameAdminSidebar from "@/components/game-admin/GameAdminSidebar";

interface GlobalSettings {
  min_bet: number;
  max_bet: number;
  house_edge_percent: number;
  maintenance_mode: boolean;
  auto_result_enabled: boolean;
  risk_guard_enabled: boolean;
  risk_guard_threshold: number;
}

const GlobalSettingsPage = () => {
  const [settings, setSettings] = useState<GlobalSettings>({
    min_bet: 10,
    max_bet: 50000,
    house_edge_percent: 5,
    maintenance_mode: false,
    auto_result_enabled: true,
    risk_guard_enabled: true,
    risk_guard_threshold: 100000,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('game_admin_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          min_bet: data.min_bet || 10,
          max_bet: data.max_bet || 50000,
          house_edge_percent: data.house_edge_percent || 5,
          maintenance_mode: data.maintenance_mode || false,
          auto_result_enabled: data.auto_result_enabled ?? true,
          risk_guard_enabled: true,
          risk_guard_threshold: 100000,
        });
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('game_admin_settings')
        .update({
          min_bet: settings.min_bet,
          max_bet: settings.max_bet,
          house_edge_percent: settings.house_edge_percent,
          maintenance_mode: settings.maintenance_mode,
          auto_result_enabled: settings.auto_result_enabled,
          updated_at: new Date().toISOString(),
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      toast.success('Global settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-900">
        <GameAdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="animate-spin text-purple-500" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <GameAdminSidebar />
      <div className="flex-1 overflow-auto">
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Global Settings</h1>
              <p className="text-gray-400 text-sm">Configure platform-wide game settings</p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </header>

        <div className="p-6 space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-teal-400" />
                Bet Limits
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure minimum and maximum bet amounts for all games
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Minimum Bet (৳)</Label>
                  <Input
                    type="number"
                    value={settings.min_bet}
                    onChange={(e) => setSettings({ ...settings, min_bet: Number(e.target.value) })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Maximum Bet (৳)</Label>
                  <Input
                    type="number"
                    value={settings.max_bet}
                    onChange={(e) => setSettings({ ...settings, max_bet: Number(e.target.value) })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Percent className="h-5 w-5 text-orange-400" />
                House Edge
              </CardTitle>
              <CardDescription className="text-gray-400">
                Platform profit margin applied to all games
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">House Edge Percentage</span>
                  <span className="text-white font-bold text-lg">{settings.house_edge_percent}%</span>
                </div>
                <Slider
                  value={[settings.house_edge_percent]}
                  onValueChange={(value) => setSettings({ ...settings, house_edge_percent: value[0] })}
                  min={1}
                  max={15}
                  step={0.5}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Recommended: 3-5% for competitive odds
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                System Controls
              </CardTitle>
              <CardDescription className="text-gray-400">
                Enable or disable platform features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Maintenance Mode</Label>
                  <p className="text-xs text-gray-400">Disable all games for maintenance</p>
                </div>
                <Switch
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenance_mode: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Auto Result Generation</Label>
                  <p className="text-xs text-gray-400">Automatically generate game results</p>
                </div>
                <Switch
                  checked={settings.auto_result_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, auto_result_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Risk Guard</Label>
                  <p className="text-xs text-gray-400">Enable risk management alerts</p>
                </div>
                <Switch
                  checked={settings.risk_guard_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, risk_guard_enabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {settings.risk_guard_enabled && (
            <Card className="bg-gray-800 border-gray-700 border-l-4 border-l-amber-500">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  Risk Threshold
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Alert when single round exposure exceeds this amount
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-gray-300">Threshold Amount (৳)</Label>
                  <Input
                    type="number"
                    value={settings.risk_guard_threshold}
                    onChange={(e) => setSettings({ ...settings, risk_guard_threshold: Number(e.target.value) })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSettingsPage;
