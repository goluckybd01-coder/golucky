import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Loader2 } from "lucide-react";

interface DebugAsset {
  symbol: string;
  category: string;
  base_price: number;
  sort_order: number;
  source: string;
  is_admin_controlled: boolean;
}

interface DebugPayload {
  count: number;
  assets: DebugAsset[];
  by_category: Record<string, number>;
}

const EXPECTED = ["GLC", "NOVA", "Gold", "Silver", "Crude Oil", "Natural Gas", "Copper", "BTC", "ETH", "XRP", "LTC", "SOL", "GBP", "EUR"];

export default function MarketPricesDebug() {
  const [data, setData] = useState<DebugPayload | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error } = await supabase.functions.invoke("market-prices", {
        body: null,
        method: "GET" as never,
      });
      // Fallback: invoke doesn't support query params reliably; use direct fetch
      const url = `https://aexnilkvhyfskaqszrfr.supabase.co/functions/v1/market-prices?debug=1`;
      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ""}` },
      });
      const json = await r.json();
      if (!json.success) throw new Error(json.error || "Failed");
      setData(json.debug);
      setGeneratedAt(json.generated_at);
      void res; void error;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const symbols = new Set((data?.assets ?? []).map((a) => a.symbol));
  const missing = EXPECTED.filter((s) => !symbols.has(s));
  const extra = (data?.assets ?? []).map((a) => a.symbol).filter((s) => !EXPECTED.includes(s));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Market Prices Debug</h1>
          <p className="text-sm text-muted-foreground">Live snapshot of the 14-asset list returned by the <code>market-prices</code> edge function.</p>
        </div>
        <Button onClick={load} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {error && <Card className="p-4 border-destructive text-destructive">{error}</Card>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total assets</div>
          <div className="text-2xl font-bold">{data?.count ?? "—"} <span className="text-sm text-muted-foreground">/ 14</span></div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Missing</div>
          <div className="text-2xl font-bold text-destructive">{missing.length}</div>
          {missing.length > 0 && <div className="text-xs mt-1">{missing.join(", ")}</div>}
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Unexpected</div>
          <div className="text-2xl font-bold text-amber-500">{extra.length}</div>
          {extra.length > 0 && <div className="text-xs mt-1">{extra.join(", ")}</div>}
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Generated</div>
          <div className="text-xs font-mono">{generatedAt}</div>
        </Card>
      </div>

      {data?.by_category && (
        <Card className="p-4">
          <div className="text-sm font-semibold mb-2">By category</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.by_category).map(([cat, n]) => (
              <Badge key={cat} variant="secondary">{cat}: {n}</Badge>
            ))}
          </div>
        </Card>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3">#</th>
              <th className="p-3">Symbol</th>
              <th className="p-3">Category</th>
              <th className="p-3 text-right">Base Price</th>
              <th className="p-3 text-right">Sort</th>
              <th className="p-3">Source</th>
              <th className="p-3">Admin</th>
            </tr>
          </thead>
          <tbody>
            {data?.assets.map((a, i) => (
              <tr key={a.symbol} className="border-t">
                <td className="p-3 text-muted-foreground">{i + 1}</td>
                <td className="p-3 font-mono font-semibold">{a.symbol}</td>
                <td className="p-3"><Badge variant="outline">{a.category}</Badge></td>
                <td className="p-3 text-right font-mono">{a.base_price.toFixed(4)}</td>
                <td className="p-3 text-right font-mono">{a.sort_order}</td>
                <td className="p-3"><Badge variant="secondary">{a.source}</Badge></td>
                <td className="p-3">{a.is_admin_controlled ? "✅" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
