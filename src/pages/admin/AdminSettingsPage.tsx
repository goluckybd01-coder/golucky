import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Shield, Gamepad2, Wallet, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminShell } from '@/components/admin/AdminShell';

const AdminSettingsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [agentSettings, setAgentSettings] = useState({
    registrationBonusEnabled: true,
    registrationBonusAgent: 50,
    registrationBonusUser: 30,
    minDepositForCommission: 100,
    salaryEnabled: true,
    antiAbuseEnabled: true,
  });

  const [generalSettings, setGeneralSettings] = useState({
    dailyProcessingGoal: 20,
  });

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const [agentResult, adminResult] = await Promise.all([
        supabase.from('agent_settings').select('*').single(),
        supabase.from('admin_settings').select('*').single(),
      ]);

      if (agentResult.data) {
        setAgentSettings({
          registrationBonusEnabled: agentResult.data.registration_bonus_enabled ?? true,
          registrationBonusAgent: agentResult.data.registration_bonus_agent ?? 50,
          registrationBonusUser: agentResult.data.registration_bonus_user ?? 30,
          minDepositForCommission: agentResult.data.min_deposit_for_commission ?? 100,
          salaryEnabled: agentResult.data.salary_enabled ?? true,
          antiAbuseEnabled: agentResult.data.anti_abuse_enabled ?? true,
        });
      }

      if (adminResult.data) {
        setGeneralSettings({
          dailyProcessingGoal: adminResult.data.daily_processing_goal ?? 20,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const saveAgentSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('agent_settings')
        .upsert({
          id: '00000000-0000-0000-0000-000000000001',
          registration_bonus_enabled: agentSettings.registrationBonusEnabled,
          registration_bonus_agent: agentSettings.registrationBonusAgent,
          registration_bonus_user: agentSettings.registrationBonusUser,
          min_deposit_for_commission: agentSettings.minDepositForCommission,
          salary_enabled: agentSettings.salaryEnabled,
          anti_abuse_enabled: agentSettings.antiAbuseEnabled,
        });

      if (error) throw error;
      toast.success('Agent settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const saveGeneralSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          id: '00000000-0000-0000-0000-000000000001',
          daily_processing_goal: generalSettings.dailyProcessingGoal,
        });

      if (error) throw error;
      toast.success('General settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminShell title="Settings" description="Configure platform settings">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="agent">Agent System</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Configure general platform settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Daily Processing Goal</Label>
                <Input
                  type="number"
                  value={generalSettings.dailyProcessingGoal}
                  onChange={(e) => setGeneralSettings(prev => ({ 
                    ...prev, 
                    dailyProcessingGoal: parseInt(e.target.value) || 0 
                  }))}
                  className="max-w-xs bg-slate-700/50 border-slate-600"
                />
                <p className="text-xs text-slate-500">Number of transactions to process daily</p>
              </div>

              <Button onClick={saveGeneralSettings} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Save General Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agent">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Agent System Settings
              </CardTitle>
              <CardDescription>Configure agent commissions and bonuses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-300">Registration Bonus</Label>
                  <p className="text-xs text-slate-500">Enable bonuses for referrals</p>
                </div>
                <Switch
                  checked={agentSettings.registrationBonusEnabled}
                  onCheckedChange={(checked) => setAgentSettings(prev => ({
                    ...prev,
                    registrationBonusEnabled: checked
                  }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-300">Agent Bonus (৳)</Label>
                  <Input
                    type="number"
                    value={agentSettings.registrationBonusAgent}
                    onChange={(e) => setAgentSettings(prev => ({
                      ...prev,
                      registrationBonusAgent: parseInt(e.target.value) || 0
                    }))}
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">User Bonus (৳)</Label>
                  <Input
                    type="number"
                    value={agentSettings.registrationBonusUser}
                    onChange={(e) => setAgentSettings(prev => ({
                      ...prev,
                      registrationBonusUser: parseInt(e.target.value) || 0
                    }))}
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Min Deposit for Commission (৳)</Label>
                <Input
                  type="number"
                  value={agentSettings.minDepositForCommission}
                  onChange={(e) => setAgentSettings(prev => ({
                    ...prev,
                    minDepositForCommission: parseInt(e.target.value) || 0
                  }))}
                  className="max-w-xs bg-slate-700/50 border-slate-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-300">Monthly Salary System</Label>
                  <p className="text-xs text-slate-500">Enable agent salary payments</p>
                </div>
                <Switch
                  checked={agentSettings.salaryEnabled}
                  onCheckedChange={(checked) => setAgentSettings(prev => ({
                    ...prev,
                    salaryEnabled: checked
                  }))}
                />
              </div>

              <Button onClick={saveAgentSettings} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Save Agent Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure security and anti-abuse measures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-300">Anti-Abuse System</Label>
                  <p className="text-xs text-slate-500">Detect and prevent fraudulent activities</p>
                </div>
                <Switch
                  checked={agentSettings.antiAbuseEnabled}
                  onCheckedChange={(checked) => setAgentSettings(prev => ({
                    ...prev,
                    antiAbuseEnabled: checked
                  }))}
                />
              </div>

              <Button onClick={saveAgentSettings} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
};

export default AdminSettingsPage;
