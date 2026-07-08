import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";

type HistoryRow = {
  id: string;
  old_value: string | null;
  new_value: string;
  changed_at: string;
  changed_by: string | null;
};

export default function UsdtRateAdmin() {
  const [currentRate, setCurrentRate] = useState<string>("");
  const [inputRate, setInputRate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const { data: rate, error: rErr } = await supabase.rpc("get_usdt_rate");
      if (rErr) throw rErr;
      const val = String(rate ?? "130");
      setCurrentRate(val);
      setInputRate(val);

      const { data: hist } = await supabase
        .from("app_settings_history")
        .select("id, old_value, new_value, changed_at, changed_by")
        .eq("setting_key", "usdt_rate")
        .order("changed_at", { ascending: false })
        .limit(25);
      setHistory((hist as HistoryRow[]) || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load rate");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    const n = Number(inputRate);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Rate must be a positive number");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("update_usdt_rate", { p_rate: n });
      if (error) throw error;
      toast.success(`✅ Updated: 1 USDT = ৳${n} BDT`);
      await load();
      console.log("update_usdt_rate result:", data);
    } catch (e: any) {
      toast.error(e.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>💱 USDT Rate Control</CardTitle>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="text-sm text-muted-foreground">Current Rate</div>
            <div className="text-2xl font-bold tabular-nums">
              1 USDT = ৳{currentRate || "—"} BDT
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate">New Rate (BDT per USDT)</Label>
            <Input
              id="rate"
              type="number"
              min={0}
              step="0.01"
              value={inputRate}
              onChange={(e) => setInputRate(e.target.value)}
              placeholder="130"
            />
          </div>

          <Button onClick={save} disabled={saving || loading} className="w-full">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update Rate
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-sm text-muted-foreground">No changes yet.</div>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between text-sm border-b pb-2 last:border-0"
                >
                  <div>
                    <span className="text-muted-foreground line-through mr-2">
                      ৳{h.old_value ?? "—"}
                    </span>
                    <span className="font-semibold">→ ৳{h.new_value}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(h.changed_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
