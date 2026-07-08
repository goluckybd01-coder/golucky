import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Settings, Play, Pause, AlertTriangle, TrendingUp, Shield, Zap } from "lucide-react";

interface GameConfig {
  id: string;
  game_type: string;
  is_enabled: boolean;
  min_bet: number;
  max_bet: number;
  house_edge: number;
  max_multiplier: number;
  auto_cashout_enabled: boolean;
  maintenance_mode: boolean;
  config: Record<string, unknown>;
}

export function EnhancedGameControlModule() {
  const queryClient = useQueryClient();
  const [selectedGame, setSelectedGame] = useState<string>("crash");
  const [localConfig, setLocalConfig] = useState<Partial<GameConfig>>({});

  const { data: gameConfigs, isLoading } = useQuery({
    queryKey: ["game-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_configs")
        .select("*")
        .order("game_type");
      if (error) throw error;
      return data as GameConfig[];
    },
  });

  const currentConfig = gameConfigs?.find(c => c.game_type === selectedGame);
  const config = { ...currentConfig, ...localConfig };

  const updateConfigMutation = useMutation({
    mutationFn: async (updates: Partial<GameConfig>) => {
      const { error } = await supabase
        .from("game_configs")
        .update(updates)
        .eq("game_type", selectedGame);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-configs"] });
      setLocalConfig({});
      toast.success("Game configuration updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleSave = () => {
    if (Object.keys(localConfig).length > 0) {
      updateConfigMutation.mutate(localConfig);
    }
  };

  const toggleGame = (enabled: boolean) => {
    updateConfigMutation.mutate({ is_enabled: enabled });
  };

  const toggleMaintenance = (enabled: boolean) => {
    updateConfigMutation.mutate({ maintenance_mode: enabled });
  };

  const gameTypes = gameConfigs?.map(c => c.game_type) || ["crash", "aviator", "mines", "dice", "plinko"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Game Control</h2>
          <p className="text-muted-foreground">Configure game parameters and controls</p>
        </div>
        <Button onClick={handleSave} disabled={Object.keys(localConfig).length === 0}>
          Save Changes
        </Button>
      </div>

      <Tabs value={selectedGame} onValueChange={setSelectedGame}>
        <TabsList className="flex-wrap">
          {gameTypes.map(type => (
            <TabsTrigger key={type} value={type} className="capitalize">
              {type}
              {gameConfigs?.find(c => c.game_type === type)?.maintenance_mode && (
                <AlertTriangle className="h-3 w-3 ml-1 text-yellow-500" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {gameTypes.map(type => (
          <TabsContent key={type} value={type} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Game Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Game Enabled</Label>
                      <p className="text-sm text-muted-foreground">Allow players to play this game</p>
                    </div>
                    <Switch
                      checked={config?.is_enabled ?? true}
                      onCheckedChange={toggleGame}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Show maintenance message to players</p>
                    </div>
                    <Switch
                      checked={config?.maintenance_mode ?? false}
                      onCheckedChange={toggleMaintenance}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Cashout</Label>
                      <p className="text-sm text-muted-foreground">Enable automatic cashout feature</p>
                    </div>
                    <Switch
                      checked={config?.auto_cashout_enabled ?? true}
                      onCheckedChange={(checked) => setLocalConfig({ ...localConfig, auto_cashout_enabled: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Betting Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Minimum Bet ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={config?.min_bet ?? 0.1}
                      onChange={(e) => setLocalConfig({ ...localConfig, min_bet: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Maximum Bet ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={config?.max_bet ?? 1000}
                      onChange={(e) => setLocalConfig({ ...localConfig, max_bet: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Max Multiplier: {config?.max_multiplier ?? 100}x</Label>
                    <Slider
                      value={[config?.max_multiplier ?? 100]}
                      onValueChange={([value]) => setLocalConfig({ ...localConfig, max_multiplier: value })}
                      min={1}
                      max={1000}
                      step={1}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    House Edge
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>House Edge: {((config?.house_edge ?? 0.03) * 100).toFixed(2)}%</Label>
                    <Slider
                      value={[(config?.house_edge ?? 0.03) * 100]}
                      onValueChange={([value]) => setLocalConfig({ ...localConfig, house_edge: value / 100 })}
                      min={0}
                      max={10}
                      step={0.1}
                    />
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">
                      Expected RTP: <Badge>{(100 - (config?.house_edge ?? 0.03) * 100).toFixed(2)}%</Badge>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Play className="h-4 w-4 mr-2" />
                    Force Start New Round
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause All Sessions
                  </Button>
                  <Button variant="destructive" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Emergency Stop
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
