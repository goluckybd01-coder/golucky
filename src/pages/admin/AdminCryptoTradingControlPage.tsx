import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, History, RotateCcw } from "lucide-react";

type Coin = {
  id: string;
  symbol: string;
  display_name: string;
  logo_url: string | null;
  display_order: number;
  is_visible: boolean;
  is_enabled: boolean;
  maintenance_mode: boolean;
  buy_enabled: boolean;
  sell_enabled: boolean;
  long_enabled: boolean;
  short_enabled: boolean;
  min_trade_amount: number;
  max_trade_amount: number;
  profit_pct: number;
  loss_pct: number;
  trading_interval: "15s" | "30s" | "1m" | "3m";
};

const INTERVALS = ["15s", "30s", "1m", "3m"] as const;

const AdminCryptoTradingControlPage = () => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flagOn, setFlagOn] = useState(false);
  const [versions, setVersions] = useState<{ id: string; version_number: number; note: string | null; created_at: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const selected = useMemo(() => coins.find((c) => c.id === selectedId) || null, [coins, selectedId]);

  const load = async () => {
    setLoading(true);
    const [{ data: rows }, { data: flag }] = await Promise.all([
      supabase.from("crypto_trading_controls").select("*").order("display_order"),
      supabase.from("admin_feature_flags").select("flag_value").eq("flag_name", "crypto_trading_control_enabled").maybeSingle(),
    ]);
    setCoins((rows as Coin[]) || []);
    setFlagOn(Boolean(flag?.flag_value));
    setLoading(false);
  };

  const loadVersions = async (id: string) => {
    const { data } = await supabase
      .from("crypto_trading_control_versions")
      .select("id, version_number, note, created_at")
      .eq("control_id", id)
      .order("version_number", { ascending: false });
    setVersions(data || []);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selectedId) loadVersions(selectedId); }, [selectedId]);

  const patch = (id: string, p: Partial<Coin>) =>
    setCoins((prev) => prev.map((c) => (c.id === id ? { ...c, ...p } : c)));

  const save = async () => {
    if (!selected) return;
    const { id, ...rest } = selected;
    const { error } = await supabase.from("crypto_trading_controls").update(rest).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`${selected.symbol} saved`);
  };

  const snapshot = async () => {
    if (!selected) return;
    const note = prompt("Version note (optional):") || null;
    const { error } = await supabase.rpc("crypto_control_snapshot", { p_control_id: selected.id, p_note: note });
    if (error) return toast.error(error.message);
    toast.success("Snapshot saved");
    loadVersions(selected.id);
  };

  const rollback = async (v: number) => {
    if (!selected) return;
    if (!confirm(`Rollback ${selected.symbol} to v${v}?`)) return;
    const { error } = await supabase.rpc("crypto_control_rollback", { p_control_id: selected.id, p_version: v });
    if (error) return toast.error(error.message);
    toast.success(`Rolled back to v${v}`);
    load();
  };

  const toggleFlag = async () => {
    const next = !flagOn;
    const { error } = await supabase
      .from("admin_feature_flags")
      .update({ flag_value: next })
      .eq("flag_name", "crypto_trading_control_enabled");
    if (error) return toast.error(error.message);
    setFlagOn(next);
    toast.success(next ? "Live trading now enforces these rules" : "Rules OFF — live trading unaffected");
  };

  return (
    <AdminShell title="Crypto Trading Control" description="Per-coin trading rules for 14 supported coins. Rules apply to live trading only when the master flag is ON.">
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-4 p-4 bg-slate-900/60 border-slate-700">
          <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 mb-3">
            <div>
              <p className="text-xs font-semibold text-amber-300">Enforce on live trading</p>
              <p className="text-[11px] text-amber-200/70">{flagOn ? "ON — rules affect live trades" : "OFF — live trading unaffected"}</p>
            </div>
            <Switch checked={flagOn} onCheckedChange={toggleFlag} />
          </div>
          <div className="space-y-1 max-h-[70vh] overflow-y-auto">
            {loading && <p className="text-slate-400 text-sm">Loading…</p>}
            {coins.map((c) => (
              <button key={c.id} onClick={() => setSelectedId(c.id)}
                className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition ${selectedId === c.id ? "border-emerald-500/60 bg-emerald-500/10" : "border-slate-700 bg-slate-800/40 hover:bg-slate-800"}`}>
                <div className="flex items-center gap-2">
                  {c.logo_url ? <img src={c.logo_url} alt="" className="h-6 w-6 rounded-full" /> : (
                    <div className="h-6 w-6 rounded-full bg-slate-700 text-[10px] flex items-center justify-center text-slate-300">{c.symbol.slice(0, 2)}</div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-white">{c.symbol}</div>
                    <div className="text-[10px] text-slate-400">{c.display_name}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {c.maintenance_mode && <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-[9px]">MAINT</Badge>}
                  {!c.is_enabled && <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[9px]">OFF</Badge>}
                  {!c.is_visible && <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30 text-[9px]">HIDDEN</Badge>}
                </div>
              </button>
            ))}
          </div>
        </Card>
        <Card className="col-span-12 lg:col-span-8 p-6 bg-slate-900/60 border-slate-700">
          {!selected ? (
            <div className="flex items-center justify-center h-64 text-slate-500">Select a coin</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{selected.symbol} — {selected.display_name}</h3>
                  <p className="text-xs text-slate-400">Per-coin control</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={snapshot}><History className="h-4 w-4 mr-1" /> Snapshot</Button>
                  <Button size="sm" onClick={save}><Save className="h-4 w-4 mr-1" /> Save</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField label="Display Name" value={selected.display_name} onChange={(v) => patch(selected.id, { display_name: v })} />
                <TextField label="Logo URL" value={selected.logo_url || ""} onChange={(v) => patch(selected.id, { logo_url: v || null })} />
                <NumField label="Display Order" value={selected.display_order} onChange={(v) => patch(selected.id, { display_order: v })} />
                <div>
                  <Label className="text-slate-300 text-xs">Trading Interval</Label>
                  <Select value={selected.trading_interval} onValueChange={(v) => patch(selected.id, { trading_interval: v as Coin["trading_interval"] })}>
                    <SelectTrigger className="mt-1 bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{INTERVALS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <NumField label="Min Trade Amount (৳)" value={selected.min_trade_amount} onChange={(v) => patch(selected.id, { min_trade_amount: v })} />
                <NumField label="Max Trade Amount (৳)" value={selected.max_trade_amount} onChange={(v) => patch(selected.id, { max_trade_amount: v })} />
                <NumField label="Profit %" value={selected.profit_pct} onChange={(v) => patch(selected.id, { profit_pct: v })} />
                <NumField label="Loss %" value={selected.loss_pct} onChange={(v) => patch(selected.id, { loss_pct: v })} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <Toggle label="Visible" checked={selected.is_visible} onChange={(v) => patch(selected.id, { is_visible: v })} />
                <Toggle label="Enabled" checked={selected.is_enabled} onChange={(v) => patch(selected.id, { is_enabled: v })} />
                <Toggle label="Maintenance" checked={selected.maintenance_mode} onChange={(v) => patch(selected.id, { maintenance_mode: v })} />
                <Toggle label="Buy" checked={selected.buy_enabled} onChange={(v) => patch(selected.id, { buy_enabled: v })} />
                <Toggle label="Sell" checked={selected.sell_enabled} onChange={(v) => patch(selected.id, { sell_enabled: v })} />
                <Toggle label="Long" checked={selected.long_enabled} onChange={(v) => patch(selected.id, { long_enabled: v })} />
                <Toggle label="Short" checked={selected.short_enabled} onChange={(v) => patch(selected.id, { short_enabled: v })} />
              </div>
              <div className="mt-8">
                <h4 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2"><History className="h-4 w-4" /> Version History</h4>
                {versions.length === 0 ? (
                  <p className="text-xs text-slate-500">No snapshots yet. Click "Snapshot" before major edits.</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {versions.map((v) => (
                      <div key={v.id} className="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-slate-700">
                        <div className="text-xs">
                          <span className="text-white font-medium">v{v.version_number}</span>
                          <span className="text-slate-400 ml-2">{new Date(v.created_at).toLocaleString()}</span>
                          {v.note && <span className="text-slate-500 ml-2">— {v.note}</span>}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => rollback(v.version_number)}>
                          <RotateCcw className="h-3 w-3 mr-1" /> Rollback
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </AdminShell>
  );
};

const TextField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <Label className="text-slate-300 text-xs">{label}</Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 bg-slate-800 border-slate-700 text-white" />
  </div>
);
const NumField = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div>
    <Label className="text-slate-300 text-xs">{label}</Label>
    <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 bg-slate-800 border-slate-700 text-white" />
  </div>
);
const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700">
    <span className="text-xs text-slate-300">{label}</span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

export default AdminCryptoTradingControlPage;
