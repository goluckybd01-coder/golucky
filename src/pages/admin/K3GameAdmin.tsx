import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Dice5, Loader2, Sparkles, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAdminGameTimer } from "@/hooks/useAdminGameTimer";

type Die = 1 | 2 | 3 | 4 | 5 | 6;

interface HistoryRow {
  id: string;
  trade_id: string;
  result: string | null;
  created_at: string;
}

const DOT_POSITIONS: Record<Die, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

const DieFace = ({ value, size = 100 }: { value: Die; size?: number }) => {
  const positions = DOT_POSITIONS[value];
  const dotSize = size * 0.14;
  return (
    <div
      className="relative rounded-2xl bg-[#1A2332] border-2 border-[#F59E0B]/60 shadow-[0_0_20px_-4px_rgba(245,158,11,0.45)]"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-2 grid grid-cols-3 grid-rows-3">
        {Array.from({ length: 9 }).map((_, idx) => {
          const r = Math.floor(idx / 3);
          const c = idx % 3;
          const filled = positions.some(([pr, pc]) => pr === r && pc === c);
          return (
            <div key={idx} className="flex items-center justify-center">
              {filled && (
                <div
                  className="rounded-full bg-[#FBBF24] shadow-[0_0_8px_rgba(251,191,36,0.7)]"
                  style={{ width: dotSize, height: dotSize }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const parseDice = (result: string | null): [Die, Die, Die] | null => {
  if (!result) return null;
  const parts = result.split(",").map((p) => parseInt(p.trim(), 10));
  if (parts.length !== 3 || parts.some((n) => isNaN(n) || n < 1 || n > 6)) return null;
  return parts as [Die, Die, Die];
};

const K3GameAdmin = () => {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState("1min");
  const [dice, setDice] = useState<[Die, Die, Die]>([1, 1, 1]);
  const [submitting, setSubmitting] = useState(false);
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
  } = useAdminGameTimer("k3", activeMode);

  const digits = getCountdownDigits(currentCountdown);
  const sum = dice[0] + dice[1] + dice[2];
  const isBig = sum >= 11;
  const isOdd = sum % 2 === 1;
  const isTriplet = dice[0] === dice[1] && dice[1] === dice[2];

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from("game_rounds")
      .select("id, trade_id, result, created_at")
      .eq("game_type", "k3")
      .eq("game_mode", activeMode)
      .not("result", "is", null)
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory((data as HistoryRow[]) || []);
  }, [activeMode]);

  useEffect(() => {
    loadHistory();
    const ch = supabase
      .channel(`k3-admin-${activeMode}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "game_rounds" }, loadHistory)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [activeMode, loadHistory]);

  const cycleDie = (idx: number) => {
    setDice((prev) => {
      const next = [...prev] as [Die, Die, Die];
      next[idx] = ((prev[idx] % 6) + 1) as Die;
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!currentTradeId) {
      toast.error("No active period");
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const result = dice.join(",");

      const { data: existing } = await supabase
        .from("game_rounds")
        .select("id, result")
        .eq("trade_id", currentTradeId)
        .eq("game_type", "k3")
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
          .insert({ trade_id: currentTradeId, game_type: "k3", game_mode: activeMode, result });
        if (error) throw error;
      }

      await supabase.from("game_admin_audit_logs").insert([{
        admin_id: user?.id || "",
        action: "force_result",
        game_type: "k3",
        old_value: existing?.result ? { result: existing.result } : null,
        new_value: { trade_id: currentTradeId, game_mode: activeMode, result },
      }]);

      toast.success(`✅ K3 Result: ${result} (Sum ${sum})`);
      loadHistory();
    } catch (e: any) {
      toast.error(e?.message || "Failed to set result");
    } finally {
      setSubmitting(false);
    }
  };

  const ringR = 38;
  const ringC = 2 * Math.PI * ringR;
  const dashOffset = useMemo(() => ringC * (1 - progress / 100), [progress, ringC]);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-[#F9FAFB]">
      <header className="bg-[#111827] border-b border-[#1F2937] h-16 px-5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="text-[#9CA3AF] hover:text-[#F59E0B] hover:bg-[#1F2937] h-9 w-9">
            <ArrowLeft size={18} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center shadow-[0_0_18px_-2px_rgba(245,158,11,0.55)]">
              <Dice5 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-[#F9FAFB] text-base leading-none">K3 Control</h1>
              <p className="text-[11px] text-[#F59E0B] font-medium mt-1">Dice Result Manager</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-[rgba(16,185,129,0.12)] text-[#10B981] border border-[#10B981]/40 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1.5 animate-pulse" />
            LIVE
          </Badge>
          <div className="text-[#9CA3AF] text-xs font-mono hidden sm:block">{format(now, "HH:mm:ss")}</div>
        </div>
      </header>
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
        <div className="flex flex-wrap gap-2">
          {modes.map((m) => (
            <button key={m.id} onClick={() => setActiveMode(m.id)} className={`px-5 h-10 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-150 border ${activeMode === m.id ? "bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-[#0A0E1A] border-[#F59E0B] shadow-[0_0_18px_rgba(245,158,11,0.5)]" : "bg-[#111827] text-[#9CA3AF] border-[#1F2937] hover:border-[#F59E0B] hover:text-[#F59E0B]"}`}>{m.label}</button>
          ))}
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <p className="text-[10px] text-[#9CA3AF] uppercase tracking-[0.25em] font-semibold mb-2">Current Period</p>
            <div className="text-3xl md:text-5xl font-bold font-mono bg-gradient-to-r from-[#FBBF24] via-[#F59E0B] to-[#D97706] bg-clip-text text-transparent">{currentPeriodNumber || "—"}</div>
          </div>
          <div className="relative w-[120px] h-[120px] mx-auto md:mx-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={ringR} fill="none" stroke="#1F2937" strokeWidth="6" />
              <circle cx="50" cy="50" r={ringR} fill="none" stroke={phase === "locked" ? "#EF4444" : "#F59E0B"} strokeWidth="6" strokeLinecap="round" strokeDasharray={ringC} strokeDashoffset={dashOffset} style={{ transition: "stroke-dashoffset 1s linear, stroke 200ms" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-mono text-2xl font-bold text-[#F9FAFB]">{digits.min1}{digits.min2}:{digits.sec1}{digits.sec2}</div>
            </div>
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6">
          <div className="flex items-center justify-center gap-6 md:gap-10 py-4">
            {dice.map((d, i) => (
              <button key={i} onClick={() => cycleDie(i)} disabled={submitting} className="transition-transform duration-150 hover:scale-105 active:scale-95 disabled:opacity-50">
                <DieFace value={d} size={100} />
              </button>
            ))}
          </div>
          <div className="text-center mt-6">
            <div className="text-4xl md:text-5xl font-bold text-[#F59E0B] mt-1">{sum}</div>
          </div>
          <button onClick={handleConfirm} disabled={submitting || !currentTradeId} className="mt-6 w-full h-14 rounded-xl font-bold text-base uppercase tracking-[0.2em] bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FBBF24] text-[#0A0E1A] disabled:opacity-40">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : <>Confirm K3 Result → {dice.join(",")}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default K3GameAdmin;
