import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, RefreshCw, CheckCircle2, AlertTriangle, Timer, BellRing } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ALERT_SETTINGS_KEY = "golucky:wingo:api-alerts";
const ALERT_COOLDOWN_MS = 10 * 60 * 1000;
const DIAG_ENABLED_KEY = "golucky:wingo:api-diagnostics-enabled";

const loadDiagEnabled = (): boolean => {
  try {
    const raw = localStorage.getItem(DIAG_ENABLED_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
};

interface AlertSettings {
  enabled: boolean;
  failureRatePct: number;
  avgLatencyMs: number;
  minSamples: number;
}

const DEFAULT_ALERTS: AlertSettings = {
  enabled: false,
  failureRatePct: 20,
  avgLatencyMs: 2000,
  minSamples: 20,
};

const loadAlertSettings = (): AlertSettings => {
  try {
    const raw = localStorage.getItem(ALERT_SETTINGS_KEY);
    if (!raw) return DEFAULT_ALERTS;
    return { ...DEFAULT_ALERTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ALERTS;
  }
};

interface DiagRow {
  endpoint: string;
  market: string | null;
  success: boolean;
  status_code: number | null;
  latency_ms: number;
  error_reason: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  success: number;
  failure: number;
  avgLatency: number;
  p95Latency: number;
  successRate: number;
  lastFallbackReason: string | null;
  lastFallbackAt: string | null;
  perEndpoint: Record<string, { success: number; failure: number }>;
}

const computeStats = (rows: DiagRow[]): Stats => {
  const total = rows.length;
  const success = rows.filter((r) => r.success).length;
  const failure = total - success;
  const latencies = rows.map((r) => r.latency_ms).sort((a, b) => a - b);
  const avgLatency = total ? Math.round(latencies.reduce((s, n) => s + n, 0) / total) : 0;
  const p95Latency = total ? latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))] : 0;
  const successRate = total ? Math.round((success / total) * 100) : 0;
  const lastFailure = rows.find((r) => !r.success);
  const perEndpoint: Stats["perEndpoint"] = {};
  rows.forEach((r) => {
    perEndpoint[r.endpoint] ??= { success: 0, failure: 0 };
    if (r.success) perEndpoint[r.endpoint].success += 1;
    else perEndpoint[r.endpoint].failure += 1;
  });
  return {
    total,
    success,
    failure,
    avgLatency,
    p95Latency,
    successRate,
    lastFallbackReason: lastFailure?.error_reason ?? null,
    lastFallbackAt: lastFailure?.created_at ?? null,
    perEndpoint,
  };
};

export const WinGoApiDiagnostics = () => {
  const [rows, setRows] = useState<DiagRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertSettings>(loadAlertSettings);
  const [lastNotifiedAt, setLastNotifiedAt] = useState<Record<string, number>>({});
  const [diagEnabled, setDiagEnabled] = useState<boolean>(loadDiagEnabled);

  const load = useCallback(async () => {
    if (!diagEnabled) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error: err } = await supabase
      .from("wingo_api_diagnostics")
      .select("endpoint, market, success, status_code, latency_ms, error_reason, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (err) setError(err.message);
    setRows((data as DiagRow[] | null) ?? []);
    setLoading(false);
  }, [diagEnabled]);

  useEffect(() => {
    load();
    if (!diagEnabled) return;
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load, diagEnabled]);

  const stats = computeStats(rows);

  useEffect(() => {
    try {
      localStorage.setItem(ALERT_SETTINGS_KEY, JSON.stringify(alerts));
    } catch {
      /* noop */
    }
  }, [alerts]);

  useEffect(() => {
    if (!diagEnabled) return;
    if (!alerts.enabled) return;
    if (stats.total < alerts.minSamples) return;

    const now = Date.now();
    const failureRate = stats.total ? (stats.failure / stats.total) * 100 : 0;
    const fire = (key: string, title: string, description: string) => {
      const last = lastNotifiedAt[key] ?? 0;
      if (now - last < ALERT_COOLDOWN_MS) return;
      toast.error(title, { description, duration: 8000 });
      setLastNotifiedAt((prev) => ({ ...prev, [key]: now }));
    };

    if (failureRate >= alerts.failureRatePct) {
      fire(
        "failure",
        "IndiaLotteryAPI failure rate alert",
        `Failure rate ${failureRate.toFixed(1)}% ≥ ${alerts.failureRatePct}% over last 24h (${stats.failure}/${stats.total} calls).`,
      );
    }
    if (stats.avgLatency >= alerts.avgLatencyMs) {
      fire(
        "latency",
        "IndiaLotteryAPI latency alert",
        `Avg latency ${stats.avgLatency}ms ≥ ${alerts.avgLatencyMs}ms (p95 ${stats.p95Latency}ms) over last 24h.`,
      );
    }
  }, [stats, alerts, lastNotifiedAt, diagEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(DIAG_ENABLED_KEY, diagEnabled ? "1" : "0");
    } catch {
      /* noop */
    }
  }, [diagEnabled]);

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            IndiaLotteryAPI Diagnostics — Last 24h
          </CardTitle>
          <CardDescription className="text-gray-400">
            Live success/failure counts, average latency, and the most recent fallback reason.
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading} className="border-gray-700">
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              Diagnostics Collection
              {diagEnabled ? (
                <Badge variant="outline" className="text-[10px] border-emerald-600 text-emerald-300">ENABLED</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] border-gray-600 text-gray-400">PAUSED</Badge>
              )}
            </p>
          </div>
          <Switch checked={diagEnabled} onCheckedChange={setDiagEnabled} />
        </div>
      </CardContent>
    </Card>
  );
};

export default WinGoApiDiagnostics;
