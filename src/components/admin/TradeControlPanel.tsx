import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminTradingSettings } from "@/hooks/useAdminTradingSettings";


import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Sliders, ShieldAlert } from "lucide-react";

type ForcedResult = "auto" | "force_buy_win" | "force_sell_win" | "force_user_lose";

interface Settings {
  win_rate: number;
  payout_multiplier: number;
  min_bet: number;
  max_bet: number;
  global_volatility: number;
  update_speed_ms: number;
  forced_trade_result: ForcedResult;
  trading_paused: boolean;
  updated_at: string;
}

const DEFAULTS: Settings = {
  win_rate: 50,
  payout_multiplier: 1.85,
  min_bet: 1,
  max_bet: 10000,
  global_volatility: 0.02,
  update_speed_ms: 1000,
  forced_trade_result: "auto",
  trading_paused: false,
  updated_at: "",
};

export default function TradeControlPanel() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { settings: remote, loading: remoteLoading } = useAdminTradingSettings();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: role } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "super_admin")
          .maybeSingle();
        setIsSuperAdmin(!!role);
      }
    })();
  }, []);

  // Sync remote (initial load + realtime broadcasts) unless the operator has
  // unsaved local edits. Detect "editing" by comparing local vs remote fields.
  useEffect(() => {
    if (remoteLoading) return;
    setLoading(false);
    if (!remote || saving) return;
    const fields: (keyof Settings)[] = [
      "win_rate","payout_multiplier","min_bet","max_bet","global_volatility",
      "update_speed_ms","forced_trade_result","trading_paused",
    ];
    const isInitial = !s.updated_at;
    const matchesRemote = fields.every((k) => (s as any)[k] === (remote as any)[k]);
    if (isInitial || matchesRemote) {
      setS({ ...DEFAULTS, ...(remote as any) });
    }
  }, [remote, remoteLoading, saving]);




  const save = async () => {
    if (!isSuperAdmin) return;
    if (s.min_bet >= s.max_bet) {
      toast.error("Min bet must be less than max bet");
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("admin_trading_settings")
      .update({
        win_rate: s.win_rate,
        payout_multiplier: s.payout_multiplier,
        min_bet: s.min_bet,
        max_bet: s.max_bet,
        global_volatility: s.global_volatility,
        update_speed_ms: s.update_speed_ms,
        forced_trade_result: s.forced_trade_result,
        trading_paused: s.trading_paused,
        updated_by: user?.id ?? null,
      })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Trading settings updated");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <Card className="p-5 bg-[#0d1117]/80 border-amber-500/30 backdrop-blur space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-amber-400" />
          <h2 className="text-sm font-semibold text-amber-400 tracking-wide uppercase">
            Trade Control Panel
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={s.trading_paused ? "text-red-400" : "text-emerald-400"}>
            {s.trading_paused ? "PAUSED" : "LIVE"}
          </span>
          <Switch
            checked={!s.trading_paused}
            disabled={!isSuperAdmin}
            onCheckedChange={(v) => setS({ ...s, trading_paused: !v })}
          />
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded px-3 py-2">
          <ShieldAlert className="h-4 w-4" />
          Read-only — super_admin required to change settings.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Forced result */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Force Trade Result</label>
          <Select
            value={s.forced_trade_result}
            disabled={!isSuperAdmin}
            onValueChange={(v) => setS({ ...s, forced_trade_result: v as ForcedResult })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (engine)</SelectItem>
              <SelectItem value="force_buy_win">Force BUY Win</SelectItem>
              <SelectItem value="force_sell_win">Force SELL Win</SelectItem>
              <SelectItem value="force_user_lose">Force User Lose</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Win rate */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Win Rate</span>
            <span className="text-amber-400 font-mono">{s.win_rate}%</span>
          </div>
          <Slider
            value={[s.win_rate]} min={10} max={90} step={1}
            disabled={!isSuperAdmin}
            onValueChange={([v]) => setS({ ...s, win_rate: v })}
          />
        </div>

        {/* Payout */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Payout Multiplier</span>
            <span className="text-amber-400 font-mono">{s.payout_multiplier.toFixed(2)}x</span>
          </div>
          <Slider
            value={[s.payout_multiplier]} min={1} max={10} step={0.05}
            disabled={!isSuperAdmin}
            onValueChange={([v]) => setS({ ...s, payout_multiplier: Number(v.toFixed(2)) })}
          />
        </div>

        {/* Update speed */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Update Speed</span>
            <span className="text-amber-400 font-mono">{s.update_speed_ms} ms</span>
          </div>
          <Slider
            value={[s.update_speed_ms]} min={100} max={5000} step={100}
            disabled={!isSuperAdmin}
            onValueChange={([v]) => setS({ ...s, update_speed_ms: v })}
          />
        </div>

        {/* Volatility */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Global Volatility</span>
            <span className="text-amber-400 font-mono">{(s.global_volatility * 100).toFixed(1)}%</span>
          </div>
          <Slider
            value={[s.global_volatility * 1000]} min={1} max={100} step={1}
            disabled={!isSuperAdmin}
            onValueChange={([v]) => setS({ ...s, global_volatility: Number((v / 1000).toFixed(3)) })}
          />
        </div>

        {/* Min/Max bet */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Min Bet (৳)</label>
            <Input
              type="number" min={0} step={1}
              value={s.min_bet}
              disabled={!isSuperAdmin}
              onChange={(e) => setS({ ...s, min_bet: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Max Bet (৳)</label>
            <Input
              type="number" min={1} step={10}
              value={s.max_bet}
              disabled={!isSuperAdmin}
              onChange={(e) => setS({ ...s, max_bet: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-amber-500/10">
        <Button
          onClick={save}
          disabled={!isSuperAdmin || saving}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Settings
        </Button>
      </div>
    </Card>
  );
}
