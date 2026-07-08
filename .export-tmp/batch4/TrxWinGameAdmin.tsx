import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Hash, Loader2, Sparkles, AlertCircle, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAdminGameTimer } from "@/hooks/useAdminGameTimer";

interface HistoryRow {
  id: string;
  trade_id: string;
  result: string | null;
  hash?: string | null;
  created_at: string;
}

const VIOLET = new Set([0, 5]);
const GREEN = new Set([1, 3, 7, 9]);

const getColor = (n: number): "violet" | "green" | "red" => {
  if (VIOLET.has(n)) return "violet";
  if (GREEN.has(n)) return "green";
  return "red";
};

const COLOR_HEX: Record<string, string> = {
  violet: "#8B5CF6",
  green: "#10B981",
  red: "#EF4444",
};

const lastDigitFromHash = (h: string): number | null => {
  const clean = h.trim().toLowerCase().replace(/^0x/, "");
  if (!clean) return null;
  const ch = clean[clean.length - 1];
  const n = parseInt(ch, 16);
  if (isNaN(n)) return null;
  return n % 10;
};

const shortHash = (h: string | null | undefined) => {
  if (!h) return "—";
  const s = h.replace(/^0x/, "");
  if (s.length <= 12) return h;
  return `${h.slice(0, 10)}…${h.slice(-4)}`;
};

const TrxWinGameAdmin = () => {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState("1min");
  const [hashInput, setHashInput] = useState("");
  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [manualNumber, setManualNumber] = useState<number>(0);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [now, setNow] = useState(new Date());

  const {
    modes,
    currentTradeId,
    currentPeriodNumber,
    currentCountdown,
    progress,
    phase,
    getCountdownDigits,
  } = useAdminGameTimer("trxwin", activeMode);

  const digits = getCountdownDigits(currentCountdown);

  const hashDigit = useMemo(() => lastDigitFromHash(hashInput), [hashInput]);
  const finalNumber = manualOverride ? manualNumber : hashDigit;
  const finalColor = finalNumber === null ? null : getColor(finalNumber);
  const isOdd = finalNumber !== null && finalNumber % 2 === 1;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from("game_rounds")
      .select("id, trade_id, result, created_at")
      .eq("game_type", "trxwin")
      .eq("game_mode", activeMode)
      .not("result", "is", null)
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory((data as HistoryRow[]) || []);
  }, [activeMode]);

  useEffect(() => {
    loadHistory();
    const ch = supabase
      .channel(`trxwin-admin-${activeMode}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "game_rounds" }, loadHistory)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [activeMode, loadHistory]);

  const handleFetchLatestBlock = async () => {
    setFetching(true);
    try {
      const res = await fetch("https://api.trongrid.io/wallet/getnowblock");
      const json = await res.json();
      const hash: string | undefined = json?.blockID;
      if (!hash) throw new Error("No block hash returned");
      setHashInput(`0x${hash}`);
      toast.success("Latest TRX block fetched");
    } catch (e: any) {
      toast.error(e?.message || "Failed to fetch block");
    } finally {
      setFetching(false);
    }
  };

  const handleConfirm = async () => {
    if (!currentTradeId) {
      toast.error("No active period");
      return;
    }
    if (finalNumber === null) {
      toast.error("No result detected — paste a hash or enable manual override");
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const result = String(finalNumber);

      const { data: existing } = await supabase
        .from("game_rounds")
        .select("id, result")
        .eq("trade_id", currentTradeId)
        .eq("game_type", "trxwin")
        .eq("game_mode", activeMode)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("game_rounds")
          .update({ result })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("game_rounds")
          .insert({ trade_id: currentTradeId, game_type: "trxwin", game_mode: activeMode, result });
        if (error) throw error;
      }

      await supabase.from("game_admin_audit_logs").insert([{
        admin_id: user?.id || "",
        action: manualOverride ? "manual_override_result" : "hash_result",
        game_type: "trxwin",
        old_value: existing?.result ? { result: existing.result } : null,
        new_value: {
          trade_id: currentTradeId,
          game_mode: activeMode,
          result,
          hash: hashInput || null,
          source: manualOverride ? "manual" : "hash",
        },
      }]);

      toast.success(`✅ TRX Result: ${result} (${finalColor})`);
      loadHistory();
    } catch (e: any) {
      toast.error(e?.message || "Failed to set result");
    } finally {
      setSubmitting(false);
    }
  };

  const ringR = 38;
  const ringC = 2 * Math.PI * ringR;
  const dashOffset = ringC * (1 - progress / 100);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-[#F9FAFB]">
      <header className="bg-[#111827] border-b border-[#1F2937] h-16 px-5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin")}
            className="text-[#9CA3AF] hover:text-[#F59E0B] hover:bg-[#1F2937] h-9 w-9"
          >
            <ArrowLeft size={18} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center shadow-[0_0_18px_-2px_rgba(245,158,11,0.55)]">
              <Hash className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-[#F9FAFB] text-base leading-none">TRX Hash Control</h1>
              <p className="text-[11px] text-[#F59E0B] font-medium mt-1">Block Hash Result Manager</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-[rgba(16,185,129,0.12)] text-[#10B981] border border-[#10B981]/40 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1.5 animate-pulse" />
            LIVE
          </Badge>
          <div className="text-[#9CA3AF] text-xs font-mono hidden sm:block">
            {format(now, "HH:mm:ss")}
          </div>
        </div>
      </header>

      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
        <div className="flex flex-wrap gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMode(m.id)}
              className={`px-5 h-10 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-150 border ${
                activeMode === m.id
                  ? "bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-[#0A0E1A] border-[#F59E0B] shadow-[0_0_18px_rgba(245,158,11,0.5)]"
                  : "bg-[#111827] text-[#9CA3AF] border-[#1F2937] hover:border-[#F59E0B] hover:text-[#F59E0B]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <p className="text-[10px] text-[#9CA3AF] uppercase tracking-[0.25em] font-semibold mb-2">Current Period</p>
            <div className="text-3xl md:text-5xl font-bold font-mono bg-gradient-to-r from-[#FBBF24] via-[#F59E0B] to-[#D97706] bg-clip-text text-transparent">
              {currentPeriodNumber || "—"}
            </div>
            <div className="flex items-center gap-2 mt-3">
              {phase === "locked" && (
                <Badge className="bg-[rgba(239,68,68,0.12)] text-[#EF4444] border border-[#EF4444]/40 text-[10px]">
                  <AlertCircle size={10} className="mr-1" /> LOCKED
                </Badge>
              )}
              {phase === "revealing" && (
                <Badge className="bg-[rgba(139,92,246,0.12)] text-[#8B5CF6] border border-[#8B5CF6]/40 text-[10px]">
                  <Zap size={10} className="mr-1" /> REVEALING
                </Badge>
              )}
              {phase === "betting" && (
                <Badge className="bg-[rgba(16,185,129,0.12)] text-[#10B981] border border-[#10B981]/40 text-[10px]">
                  BETTING OPEN
                </Badge>
              )}
            </div>
          </div>

          <div className="relative w-[120px] h-[120px] mx-auto md:mx-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={ringR} fill="none" stroke="#1F2937" strokeWidth="6" />
              <circle
                cx="50" cy="50" r={ringR} fill="none"
                stroke={phase === "locked" ? "#EF4444" : "#F59E0B"}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={ringC}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 1s linear, stroke 200ms" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-mono text-2xl font-bold text-[#F9FAFB]">
                {digits.min1}{digits.min2}:{digits.sec1}{digits.sec2}
              </div>
              <div className="text-[9px] text-[#9CA3AF] uppercase tracking-wider mt-0.5">remaining</div>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#F9FAFB] mb-4">
            Enter TRX Block Hash
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder="0x7f3a9b2c1d4e5f6..."
              className="flex-1 bg-[#0D1117] border-[#1F2937] text-[#F9FAFB] font-mono h-12 placeholder:text-[#4B5563]"
              disabled={submitting}
            />
            <Button
              onClick={handleFetchLatestBlock}
              disabled={fetching || submitting}
              className="h-12 px-5 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white font-semibold"
            >
              {fetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Fetch Latest Block
            </Button>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <div className="text-[10px] text-[#9CA3AF] uppercase tracking-[0.25em] font-semibold mb-2">
              Last Hash Digit
            </div>
            <div
              className="font-bold font-mono text-[#FBBF24] leading-none"
              style={{
                fontSize: 150,
                textShadow: "0 0 36px rgba(245,158,11,0.7), 0 0 80px rgba(245,158,11,0.35)",
              }}
            >
              {hashDigit === null ? "—" : hashDigit}
            </div>
          </div>

          {finalNumber !== null && (
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {finalColor && (
                <span
                  className="px-4 h-8 inline-flex items-center rounded-full text-xs font-bold uppercase tracking-wider border"
                  style={{
                    color: COLOR_HEX[finalColor],
                    background: `${COLOR_HEX[finalColor]}22`,
                    borderColor: `${COLOR_HEX[finalColor]}99`,
                    boxShadow: `0 0 14px ${COLOR_HEX[finalColor]}66`,
                  }}
                >
                  {finalColor}
                </span>
              )}
              <span
                className={`px-4 h-8 inline-flex items-center rounded-full text-xs font-bold uppercase tracking-wider border ${
                  isOdd
                    ? "bg-[rgba(245,158,11,0.18)] text-[#F59E0B] border-[#F59E0B]/60"
                    : "bg-[rgba(59,130,246,0.18)] text-[#3B82F6] border-[#3B82F6]/60"
                }`}
              >
                {isOdd ? "Odd" : "Even"}
              </span>
            </div>
          )}
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#F9FAFB]">Manual Override</h2>
              <p className="text-[11px] text-[#9CA3AF] mt-1">
                {manualOverride ? "Result is manually selected." : "Result is auto-calculated from hash."}
              </p>
            </div>
            <Switch checked={manualOverride} onCheckedChange={setManualOverride} />
          </div>

          {manualOverride && (
            <div className="grid grid-cols-5 gap-2 mt-5">
              {Array.from({ length: 10 }).map((_, n) => {
                const c = getColor(n);
                const active = manualNumber === n;
                return (
                  <button
                    key={n}
                    onClick={() => setManualNumber(n)}
                    className={`h-16 rounded-xl font-bold text-2xl font-mono border-2 transition-all ${
                      active ? "scale-105" : "hover:scale-105"
                    }`}
                    style={{
                      color: active ? "#0A0E1A" : COLOR_HEX[c],
                      background: active ? COLOR_HEX[c] : `${COLOR_HEX[c]}1A`,
                      borderColor: COLOR_HEX[c],
                      boxShadow: active ? `0 0 18px ${COLOR_HEX[c]}99` : "none",
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={handleConfirm}
          disabled={submitting || !currentTradeId || finalNumber === null}
          className={`w-full h-14 rounded-xl font-bold text-base uppercase tracking-[0.2em] transition-all duration-200 flex items-center justify-center gap-2
            bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FBBF24] text-[#0A0E1A]
            shadow-[0_0_24px_rgba(245,158,11,0.45)] hover:shadow-[0_0_32px_rgba(245,158,11,0.7)]
            hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]
            disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0
            ${!submitting && currentTradeId && finalNumber !== null ? "animate-[pulse_2.4s_ease-in-out_infinite]" : ""}`}
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Submit TRX Result {finalNumber !== null ? `→ ${finalNumber}` : ""}
            </>
          )}
        </button>

        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1F2937]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#F9FAFB]">Recent Results</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-[#9CA3AF] bg-[#0D1117]">
                  <th className="text-left px-4 py-3">Period</th>
                  <th className="text-left px-4 py-3">Hash</th>
                  <th className="text-center px-3 py-3">Last Digit</th>
                  <th className="text-center px-3 py-3">Color</th>
                  <th className="text-center px-3 py-3">Odd/Even</th>
                  <th className="text-right px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-[#9CA3AF] py-8 text-xs">
                      No results yet.
                    </td>
                  </tr>
                )}
                {history.map((row, idx) => {
                  const n = row.result !== null ? parseInt(row.result as string, 10) : NaN;
                  const valid = !isNaN(n);
                  const c = valid ? getColor(n) : null;
                  const odd = valid && n % 2 === 1;
                  return (
                    <tr
                      key={row.id}
                      className={`border-t border-[#1F2937] ${idx % 2 === 0 ? "bg-[#111827]" : "bg-[#0D1117]"}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[#F9FAFB]">{row.trade_id}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF]">{shortHash(row.hash)}</td>
                      <td className="text-center px-3 py-3 font-bold font-mono text-[#FBBF24]">
                        {valid ? n : "—"}
                      </td>
                      <td className="text-center px-3 py-3">
                        {c ? (
                          <span
                            className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border"
                            style={{
                              color: COLOR_HEX[c],
                              background: `${COLOR_HEX[c]}26`,
                              borderColor: `${COLOR_HEX[c]}66`,
                            }}
                          >
                            {c}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="text-center px-3 py-3">
                        {valid ? (
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                              odd
                                ? "bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border-[#F59E0B]/40"
                                : "bg-[rgba(59,130,246,0.15)] text-[#3B82F6] border-[#3B82F6]/40"
                            }`}
                          >
                            {odd ? "Odd" : "Even"}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="text-right px-4 py-3 font-mono text-[11px] text-[#9CA3AF]">
                        {format(new Date(row.created_at), "HH:mm:ss")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrxWinGameAdmin;
