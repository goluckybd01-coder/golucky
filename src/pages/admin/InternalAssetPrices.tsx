import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import TradeControlPanel from "@/components/admin/TradeControlPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Coins, ShieldAlert, TrendingUp, TrendingDown, Shuffle, Flame, Rocket, RotateCcw } from "lucide-react";

type BulkAction = "all_up" | "all_down" | "all_random" | "market_crash" | "market_pump" | "reset_to_base";

interface InternalAsset {
  id: string;
  symbol: string;
  display_name: string;
  internal_price: number | null;
  internal_change_24h: number | null;
  is_admin_controlled: boolean;
  updated_at: string;
}

export default function InternalAssetPrices() {
  const [assets, setAssets] = useState<InternalAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [edits, setEdits] = useState<Record<string, { price: string; change: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);

  const runBulk = async (action: BulkAction, value?: number) => {
    if (!isSuperAdmin) return;
    setBulkAction(action);
    const { data, error } = await supabase.rpc("admin_bulk_adjust_prices", {
      p_action: action,
      p_value: value ?? null,
    });
    setBulkAction(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    const res = data as { success: boolean; affected?: number; error?: string };
    if (!res?.success) {
      toast.error(res?.error ?? "Bulk action failed");
      return;
    }
    toast.success(`${action.replace(/_/g, " ")} applied to ${res.affected ?? 0} assets`);
    loadAssets();
  };

  const loadAssets = async () => {
    const { data, error } = await supabase
      .from("trading_assets")
      .select("id,symbol,display_name,internal_price,internal_change_24h,is_admin_controlled,updated_at")
      .eq("is_admin_controlled", true)
      .order("symbol");
    if (error) {
      toast.error(error.message);
    } else {
      setAssets((data ?? []) as InternalAsset[]);
    }
    setLoading(false);
  };

  const checkRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();
    setIsSuperAdmin(!!data);
  };

  useEffect(() => {
    checkRole();
    loadAssets();
  }, []);

  const handleSave = async (asset: InternalAsset) => {
    const edit = edits[asset.id];
    const price = parseFloat(edit?.price ?? "");
    const change = edit?.change !== "" && edit?.change != null ? parseFloat(edit.change) : null;

    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Enter a valid positive price");
      return;
    }

    setSaving(asset.id);
    const { data, error } = await supabase.rpc("admin_set_internal_asset_price", {
      p_symbol: asset.symbol,
      p_price: price,
      p_change_24h: change,
    });
    setSaving(null);

    if (error) {
      toast.error(error.message);
      return;
    }
    const res = data as { success: boolean; error?: string };
    if (!res?.success) {
      toast.error(res?.error ?? "Update failed");
      return;
    }
    toast.success(`${asset.symbol} updated to ৳${price}`);
    setEdits((p) => ({ ...p, [asset.id]: { price: "", change: "" } }));
    loadAssets();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Coins className="h-7 w-7 text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold">Internal Asset Prices</h1>
          <p className="text-sm text-muted-foreground">
            Manually control GLC, NOVA and other in-house tokens. Super admin only.
          </p>
        </div>
      </div>

      {!isSuperAdmin && (
        <Card className="p-4 border-destructive/40 bg-destructive/10 flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          <p className="text-sm">
            You are viewing in read-only mode. Only <strong>super_admin</strong> can update prices.
          </p>
        </Card>
      )}

      <TradeControlPanel />

      <Card className="p-4 bg-[#0d1117]/80 border-amber-500/30 backdrop-blur">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-amber-400 tracking-wide uppercase">
            Quick Market Controls
          </h2>
          <span className="text-xs text-muted-foreground">Applies to all admin-controlled assets</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <Button variant="outline" disabled={!isSuperAdmin || bulkAction !== null} onClick={() => runBulk("all_up", 2)} className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">
            {bulkAction === "all_up" ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-1" />}
            All UP +2%
          </Button>
          <Button variant="outline" disabled={!isSuperAdmin || bulkAction !== null} onClick={() => runBulk("all_down", 2)} className="border-red-500/40 text-red-400 hover:bg-red-500/10">
            {bulkAction === "all_down" ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            All DOWN -2%
          </Button>
          <Button variant="outline" disabled={!isSuperAdmin || bulkAction !== null} onClick={() => runBulk("all_random", 3)} className="border-sky-500/40 text-sky-400 hover:bg-sky-500/10">
            {bulkAction === "all_random" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4 mr-1" />}
            All Random ±3%
          </Button>
          <Button variant="outline" disabled={!isSuperAdmin || bulkAction !== null} onClick={() => runBulk("market_crash")} className="border-red-600/50 text-red-500 hover:bg-red-600/10">
            {bulkAction === "market_crash" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flame className="h-4 w-4 mr-1" />}
            Crash -10%
          </Button>
          <Button variant="outline" disabled={!isSuperAdmin || bulkAction !== null} onClick={() => runBulk("market_pump")} className="border-emerald-600/50 text-emerald-500 hover:bg-emerald-600/10">
            {bulkAction === "market_pump" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4 mr-1" />}
            Pump +10%
          </Button>
          <Button variant="outline" disabled={!isSuperAdmin || bulkAction !== null} onClick={() => runBulk("reset_to_base")} className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
            {bulkAction === "reset_to_base" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-1" />}
            Reset to Base
          </Button>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="p-3">Symbol</th>
              <th className="p-3">Name</th>
              <th className="p-3 text-right">Current Price</th>
              <th className="p-3 text-right">24h %</th>
              <th className="p-3">New Price</th>
              <th className="p-3">New 24h %</th>
              <th className="p-3">Updated</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  No admin-controlled assets found.
                </td>
              </tr>
            )}
            {assets.map((a) => {
              const edit = edits[a.id] ?? { price: "", change: "" };
              return (
                <tr key={a.id} className="border-t">
                  <td className="p-3 font-mono font-semibold">{a.symbol}</td>
                  <td className="p-3">{a.display_name}</td>
                  <td className="p-3 text-right tabular-nums">
                    {a.internal_price != null ? `৳${Number(a.internal_price).toFixed(4)}` : "—"}
                  </td>
                  <td className={`p-3 text-right tabular-nums ${(a.internal_change_24h ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {a.internal_change_24h != null ? `${Number(a.internal_change_24h).toFixed(2)}%` : "—"}
                  </td>
                  <td className="p-3">
                    <Input type="number" step="0.0001" min="0" placeholder="0.0000" value={edit.price} disabled={!isSuperAdmin}
                      onChange={(e) => setEdits((p) => ({ ...p, [a.id]: { ...edit, price: e.target.value } }))} className="w-32" />
                  </td>
                  <td className="p-3">
                    <Input type="number" step="0.01" placeholder="optional" value={edit.change} disabled={!isSuperAdmin}
                      onChange={(e) => setEdits((p) => ({ ...p, [a.id]: { ...edit, change: e.target.value } }))} className="w-28" />
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(a.updated_at).toLocaleString()}</td>
                  <td className="p-3">
                    <Button size="sm" disabled={!isSuperAdmin || saving === a.id || !edit.price} onClick={() => handleSave(a)}>
                      {saving === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
