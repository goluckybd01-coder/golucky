import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Hash, Loader2, Sparkles, AlertCircle, Zap, Shuffle, RotateCcw, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAdminGameTimer } from "@/hooks/useAdminGameTimer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type FiveTuple = [Digit, Digit, Digit, Digit, Digit];
const LABELS = ["A", "B", "C", "D", "E"] as const;

interface HistoryRow { id: string; trade_id: string; result: string | null; created_at: string; }

const parseFive = (s: string | null): FiveTuple | null => {
  if (!s) return null;
  const parts = s.split(",").map((p) => parseInt(p.trim(), 10));
  if (parts.length !== 5 || parts.some((n) => isNaN(n) || n < 0 || n > 9)) return null;
  return parts as FiveTuple;
};

const NumberSlot = ({ label, value, onChange, disabled }: { label: string; value: Digit; onChange: (n: Digit) => void; disabled?: boolean }) => {
  const big = value >= 5;
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#F59E0B]">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" disabled={disabled} className="w-[80px] h-[80px] rounded-2xl bg-[#1A2332] border-2 border-[#F59E0B]/60 flex items-center justify-center text-4xl font-bold text-[#FBBF24] font-mono disabled:opacity-40">{value}</button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2 bg-[#111827] border border-[#1F2937]" align="center">
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 10 }, (_, n) => (
              <button key={n} onClick={() => onChange(n as Digit)} className={`w-10 h-10 rounded-lg font-bold text-base font-mono border-2 ${value === n ? "bg-[#F59E0B] text-[#0A0E1A] border-[#F59E0B]" : "bg-[#0D1117] text-[#F9FAFB] border-[#1F2937]"}`}>{n}</button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${big ? "bg-[rgba(16,185,129,0.18)] text-[#10B981] border border-[#10B981]/40" : "bg-[rgba(239,68,68,0.18)] text-[#EF4444] border border-[#EF4444]/40"}`}>{big ? "Big" : "Small"}</span>
    </div>
  );
};

const FiveDGameAdmin = () => {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState("1min");
  const [nums, setNums] = useState<FiveTuple>([0, 0, 0, 0, 0]);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [now, setNow] = useState(new Date());
  const { modes, currentTradeId, currentPeriodNumber, currentCountdown, progress, phase, getCountdownDigits } = useAdminGameTimer("5d", activeMode);
  const digits = getCountdownDigits(currentCountdown);
  const sum = nums.reduce((a, b) => a + b, 0);
  const sumBig = sum > 22;
  const sumOdd = sum % 2 === 1;

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const loadHistory = useCallback(async () => {
    const { data } = await supabase.from("game_rounds").select("id, trade_id, result, created_at").eq("game_type", "5d").eq("game_mode", activeMode).not("result", "is", null).order("created_at", { ascending: false }).limit(20);
    setHistory((data as HistoryRow[]) || []);
  }, [activeMode]);

  useEffect(() => { loadHistory(); const ch = supabase.channel(`fived-admin-${activeMode}`).on("postgres_changes", { event: "*", schema: "public", table: "game_rounds" }, loadHistory).subscribe(); return () => { supabase.removeChannel(ch); }; }, [activeMode, loadHistory]);

  const setOne = (i: number, v: Digit) => setNums((p) => { const n = [...p] as FiveTuple; n[i] = v; return n; });
  const handleRandom = () => setNums(Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)) as FiveTuple);
  const handleClear = () => setNums([0, 0, 0, 0, 0]);

  const handleConfirm = async () => {
    if (!currentTradeId) { toast.error("No active period"); return; }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const result = nums.join(",");
      const { data: existing } = await supabase.from("game_rounds").select("id, result").eq("trade_id", currentTradeId).eq("game_type", "5d").eq("game_mode", activeMode).maybeSingle();
      if (existing) { const { error } = await supabase.from("game_rounds").update({ result }).eq("id", existing.id); if (error) throw error; }
      else { const { error } = await supabase.from("game_rounds").insert({ trade_id: currentTradeId, game_type: "5d", game_mode: activeMode, result }); if (error) throw error; }
      await supabase.from("game_admin_audit_logs").insert([{ admin_id: user?.id || "", action: "force_result", game_type: "5d", old_value: existing?.result ? { result: existing.result } : null, new_value: { trade_id: currentTradeId, game_mode: activeMode, result } }]);
      toast.success(`✅ 5D Result: ${result} (Sum ${sum})`);
      loadHistory();
    } catch (e: any) { toast.error(e?.message || "Failed to set result"); } finally { setSubmitting(false); }
  };

  const ringR = 38; const ringC = 2 * Math.PI * ringR; const dashOffset = useMemo(() => ringC * (1 - progress / 100), [progress, ringC]);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-[#F9FAFB]">
      <header className="bg-[#111827] border-b border-[#1F2937] h-16 px-5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="text-[#9CA3AF] hover:text-[#F59E0B]"><ArrowLeft size={18} /></Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center"><Hash className="h-5 w-5 text-white" /></div>
            <div><h1 className="font-bold text-base leading-none">5D Lottery Control</h1><p className="text-[11px] text-[#F59E0B] font-medium mt-1">Result Manager</p></div>
          </div>
        </div>
        <Badge className="bg-[rgba(16,185,129,0.12)] text-[#10B981] border border-[#10B981]/40 text-[11px]">LIVE</Badge>
      </header>
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
        <div className="flex flex-wrap gap-2">{modes.map((m) => (<button key={m.id} onClick={() => setActiveMode(m.id)} className={`px-5 h-10 rounded-full text-xs font-bold uppercase border ${activeMode === m.id ? "bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-[#0A0E1A]" : "bg-[#111827] text-[#9CA3AF] border-[#1F2937]"}`}>{m.label}</button>))}</div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div><p className="text-[10px] text-[#9CA3AF] uppercase tracking-[0.25em] font-semibold mb-2">Current Period</p><div className="text-3xl md:text-5xl font-bold font-mono text-[#F59E0B]">{currentPeriodNumber || "—"}</div></div>
          <div className="font-mono text-2xl font-bold">{digits.min1}{digits.min2}:{digits.sec1}{digits.sec2}</div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6">
          <div className="flex items-start justify-center gap-3 md:gap-6 flex-wrap">{LABELS.map((lbl, i) => (<NumberSlot key={lbl} label={lbl} value={nums[i]} onChange={(v) => setOne(i, v)} disabled={submitting} />))}</div>
          <div className="flex justify-center gap-3 mt-6">
            <button onClick={handleRandom} disabled={submitting} className="px-5 h-10 rounded-lg border border-[#3B82F6]/50 text-[#3B82F6] font-bold text-xs flex items-center gap-2"><Shuffle className="h-4 w-4" /> Random Fill</button>
            <button onClick={handleClear} disabled={submitting} className="px-5 h-10 rounded-lg border border-[#1F2937] text-[#9CA3AF] font-bold text-xs flex items-center gap-2"><RotateCcw className="h-4 w-4" /> Clear All</button>
          </div>
          <div className="mt-6 text-center"><div className="text-4xl font-bold text-[#F59E0B]">{sum}</div><div className="flex justify-center gap-2 mt-3"><span className="px-4 h-8 inline-flex items-center rounded-full text-xs font-bold border">{sumBig ? "Sum Big (>22)" : "Sum Small (≤22)"}</span><span className="px-4 h-8 inline-flex items-center rounded-full text-xs font-bold border">{sumOdd ? "Sum Odd" : "Sum Even"}</span></div></div>
          <button onClick={handleConfirm} disabled={submitting || !currentTradeId} className="mt-6 w-full h-14 rounded-xl font-bold uppercase bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FBBF24] text-[#0A0E1A] disabled:opacity-40 flex items-center justify-center gap-2">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Sparkles className="h-4 w-4" /> Confirm 5D Result → {nums.join(",")}</>}</button>
        </div>
      </div>
    </div>
  );
};

export default FiveDGameAdmin;
