import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWalletDB } from "@/hooks/useWalletDB";
import { settleBetsDB } from "@/lib/gameHistoryService";
import { getAdminSetResult, parseWinGoResult } from "@/lib/adminResultService";
import { generateBiasedWinGoNumber } from "@/lib/houseEdgeResult";
import { formatTaka } from "@/lib/currency";
import { attachGameErrorListeners, logGameError } from "@/lib/gameErrorLogger";
import PageScaffold from "@/components/templates/PageScaffold";

const GAME_KEY = "videoWingo" as const;

const MODES = [
  { id: "1min", label: "1Min", duration: 60 },
  { id: "3min", label: "3Min", duration: 180 },
  { id: "5min", label: "5Min", duration: 300 },
  { id: "10min", label: "10Min", duration: 600 },
];

const getDuration = (mode: string) => MODES.find((m) => m.id === mode)?.duration ?? 60;
const getRoundKey = (mode: string) => {
  const dur = getDuration(mode) * 1000;
  const start = Math.floor(Date.now() / dur) * dur;
  return `VWG:${mode}:${start}`;
};
const getRemaining = (rk: string, mode: string) => {
  const start = parseInt(rk.split(":")[2] || "0", 10);
  return Math.max(0, Math.ceil((start + getDuration(mode) * 1000 - Date.now()) / 1000));
};
const periodFromKey = (mode: string, rk: string) => {
  const ts = parseInt(rk.split(":")[2] || "0", 10);
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const serial = Math.floor((ts % 86400000) / (getDuration(mode) * 1000)) + 1;
  return `${y}${m}${dd}${String(serial).padStart(5, "0")}`;
};

const getColors = (n: number): string[] => {
  if (n === 0) return ["red", "violet"];
  if (n === 5) return ["green", "violet"];
  if ([1, 3, 7, 9].includes(n)) return ["green"];
  return ["red"];
};

const colorHex = (c: string) =>
  c === "green" ? "#22c55e" : c === "red" ? "#ef4444" : "#a855f7";

const NumberBall = ({ n, size = 40, big = false }: { n: number; size?: number; big?: boolean }) => {
  const colors = getColors(n);
  const bg =
    colors.length === 2
      ? `linear-gradient(135deg, ${colorHex(colors[0])} 0%, ${colorHex(colors[0])} 50%, ${colorHex(colors[1])} 50%, ${colorHex(colors[1])} 100%)`
      : `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), ${colorHex(colors[0])} 70%)`;
  return (
    <div
      className="rounded-full flex items-center justify-center font-extrabold text-white shadow-md"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        background: bg,
        boxShadow: big ? "0 0 25px rgba(168,85,247,0.55), inset 0 -4px 8px rgba(0,0,0,0.25)" : "inset 0 -2px 4px rgba(0,0,0,0.2)",
        border: "2px solid rgba(255,255,255,0.4)",
      }}
    >
      {n}
    </div>
  );
};

interface HistoryRow { period: string; number: number; ts: number; }

const loadHistory = (mode: string): HistoryRow[] => {
  try {
    const raw = localStorage.getItem(`videoWingo_${mode}_history`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.slice(0, 100);
    }
  } catch {}
  return [];
};
const saveHistory = (mode: string, list: HistoryRow[]) => {
  try { localStorage.setItem(`videoWingo_${mode}_history`, JSON.stringify(list.slice(0, 100))); } catch {}
};

const VideoWinGo = () => {
  const navigate = useNavigate();
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("simulateError") === "1") {
    throw new Error("Simulated VideoWinGo render failure");
  }
  const { formattedBalance, balance, refreshBalance, isAuthenticated } = useWalletDB();

  const [mode, setMode] = useState("1min");
  const [roundKey, setRoundKey] = useState(() => getRoundKey("1min"));
  const [remaining, setRemaining] = useState(() => getRemaining(getRoundKey("1min"), "1min"));
  const [history, setHistory] = useState<HistoryRow[]>(() => loadHistory("1min"));
  const [revealNumber, setRevealNumber] = useState<number | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const settledRef = useRef<Set<string>>(new Set());

  // Bet selection
  const [betType, setBetType] = useState<"color" | "number" | "bigSmall">("color");
  const [betValue, setBetValue] = useState<string>("green");
  const [amount, setAmount] = useState<number>(10);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  const period = useMemo(() => periodFromKey(mode, roundKey), [mode, roundKey]);

  useEffect(() => attachGameErrorListeners("VideoWinGo"), []);

  useEffect(() => {
    const rk = getRoundKey(mode);
    setRoundKey(rk);
    setRemaining(getRemaining(rk, mode));
    setHistory(loadHistory(mode));
    setShowReveal(false);
    setRevealNumber(null);
  }, [mode]);

  useEffect(() => {
    const t = setInterval(async () => {
      const left = getRemaining(roundKey, mode);
      setRemaining(left);
      if (left <= 0) {
        const finishedKey = roundKey;
        const finishedPeriod = periodFromKey(mode, finishedKey);
        if (!settledRef.current.has(finishedKey)) {
          settledRef.current.add(finishedKey);

          let n: number | null = null;
          try {
            const admin = await getAdminSetResult(GAME_KEY, mode, finishedPeriod);
            if (admin?.result) n = parseWinGoResult(admin.result);
          } catch (e) {
            logGameError({ game: "VideoWinGo", period: finishedPeriod, mode }, "getAdminSetResult", e);
          }
          if (n === null) {
            try { n = generateBiasedWinGoNumber([], mode); } catch (e) {
              logGameError({ game: "VideoWinGo", period: finishedPeriod, mode }, "generateBiasedWinGoNumber", e);
              n = Math.floor(Math.random() * 10);
            }
          }

          try {
            await settleBetsDB(finishedPeriod, GAME_KEY, mode, String(n));
          } catch (e) {
            logGameError({ game: "VideoWinGo", period: finishedPeriod, mode }, "settleBetsDB", e);
          }
          await refreshBalance().catch((e) => logGameError({ game: "VideoWinGo", mode }, "refreshBalance", e));

          setRevealNumber(n);
          setShowReveal(true);
          setHistory((prev) => {
            const updated = [{ period: finishedPeriod, number: n!, ts: Date.now() }, ...prev].slice(0, 100);
            saveHistory(mode, updated);
            return updated;
          });
          setTimeout(() => setShowReveal(false), 3500);
        }
        const nk = getRoundKey(mode);
        setRoundKey(nk);
        setRemaining(getRemaining(nk, mode));
      }
    }, 500);
    return () => clearInterval(t);
  }, [mode, roundKey, refreshBalance]);

  const placeBet = useCallback(async () => {
    if (!isAuthenticated) { toast.error("Please log in"); return; }
    if (remaining <= 5) { toast.error("Betting closed"); return; }
    const stake = amount * multiplier;
    if (stake <= 0 || stake > balance) { toast.error("Insufficient balance"); return; }
    const odds = betType === "number" ? 9 : 2;
    const potentialWin = stake * odds;
    setSubmitting(true);
    try {
      const { invokePlaceBetWithRetry } = await import("@/lib/placeBetRetry");
      const { data, error } = await invokePlaceBetWithRetry(
        {
          gameType: GAME_KEY,
          gameMode: mode,
          tradeId: period,
          betType,
          betValue,
          betAmount: stake,
          multiplier: odds,
          potentialWin,
        },
        { onRetry: (attempt, err) => logGameError({ game: "VideoWinGo", period, mode }, `place-bet:retry-${attempt}`, err) },
      );
      if (error || !data?.success) {
        logGameError({ game: "VideoWinGo", period, mode }, "place-bet", error || data?.error);
        toast.error(data?.error || error?.message || "Bet failed");
        return;
      }
      toast.success(`Bet placed: ${betType} ${betValue} · ${formatTaka(stake)}`);
      await refreshBalance().catch((e) => logGameError({ game: "VideoWinGo", mode }, "refreshBalance", e));
    } catch (e) {
      logGameError({ game: "VideoWinGo", period, mode }, "placeBet", e);
      toast.error("Bet failed");
    } finally {
      setSubmitting(false);
    }
  }, [amount, balance, betType, betValue, isAuthenticated, mode, multiplier, period, remaining, refreshBalance]);

  const spinning = remaining > 0 && remaining < getDuration(mode);

  return (
    <PageScaffold
      title="VideoWinGo | GoLucky"
      description="Pick Color, Number, or Big/Small. Numbers pay 9x, others 2x."
      canonicalPath="/game/video-wingo"
      fullWidth
      className="bg-gradient-to-br from-orange-50 to-amber-100 pb-24"
    >
      <div className="sticky top-0 z-30 px-4 py-3 text-white shadow-lg" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}>
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft size={22} /></button>
          <div className="text-lg font-extrabold tracking-wide">GoLucky · VideoWinGo</div>
          <button className="p-2 -mr-2" onClick={() => toast("Pick Color/Number/Big-Small. Numbers pay 9x, others 2x.")}>
            <HelpCircle size={22} />
          </button>
        </div>
      </div>

      <div className="mx-3 mt-3 rounded-2xl bg-white border border-orange-100 shadow-sm p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="text-orange-600" size={20} />
          <div>
            <div className="text-[10px] text-gray-500">Available Balance</div>
            <div className="text-base font-bold text-gray-800">{formattedBalance}</div>
          </div>
        </div>
        <button onClick={() => refreshBalance()} className="p-2 rounded-full bg-orange-50 text-orange-600"><RefreshCw size={16} /></button>
      </div>

      <div className="mx-3 mt-3 grid grid-cols-4 gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`py-2 rounded-xl text-sm font-bold ${mode === m.id ? "text-white shadow" : "bg-white text-gray-600 border border-orange-100"}`}
            style={mode === m.id ? { background: "linear-gradient(135deg,#f97316,#ef4444)" } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mx-3 mt-3 rounded-2xl p-4 text-white" style={{ background: "linear-gradient(135deg,#dc2626,#7c2d12)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wide opacity-80">Period</div>
            <div className="font-mono text-sm">{period}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide opacity-80">Count Down</div>
            <div className="text-2xl font-extrabold tabular-nums">
              {String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}
            </div>
          </div>
        </div>
      </div>

      {/* Lottery drum */}
      <div className="mx-3 mt-3 rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-6 relative overflow-hidden" style={{ height: 200 }}>
        <div className="absolute inset-0 flex items-center justify-center">
          {showReveal && revealNumber !== null ? (
            <div className="vwg-ball-land">
              <NumberBall n={revealNumber} size={120} big />
            </div>
          ) : (
            <div className="relative w-full h-full">
              {/* Floating balls */}
              {[0,1,2,3,4,5,6,7,8,9].map((n, i) => (
                <div
                  key={n}
                  className="absolute vwg-ball-float"
                  style={{
                    left: `${(i * 9) + 5}%`,
                    top: `${20 + (i % 3) * 25}%`,
                    animationDelay: `${(i * 0.15)}s`,
                    filter: spinning ? "blur(0.6px)" : "none",
                  }}
                >
                  <NumberBall n={n} size={36} />
                </div>
              ))}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-white/50 text-xs font-bold uppercase tracking-widest">Live Number Result</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent strip */}
      <div className="mx-3 mt-3 flex items-center gap-1.5 overflow-x-auto py-2">
        <span className="text-[11px] text-gray-500 font-bold mr-1">Recent:</span>
        {history.slice(0, 10).map((h) => (
          <NumberBall key={h.period} n={h.number} size={26} />
        ))}
        {history.length === 0 && <span className="text-xs text-gray-400">no rounds yet</span>}
      </div>

      {/* Betting Panel */}
      <div className="mx-3 mt-3 bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button onClick={() => { setBetType("color"); setBetValue("green"); }} className="py-3 rounded-xl font-bold text-white" style={{ background: "linear-gradient(180deg,#4ade80,#22c55e)" }}>Green</button>
          <button onClick={() => { setBetType("color"); setBetValue("violet"); }} className="py-3 rounded-xl font-bold text-white" style={{ background: "linear-gradient(180deg,#c084fc,#a855f7)" }}>Violet</button>
          <button onClick={() => { setBetType("color"); setBetValue("red"); }} className="py-3 rounded-xl font-bold text-white" style={{ background: "linear-gradient(180deg,#f87171,#ef4444)" }}>Red</button>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-3">
          {[0,1,2,3,4,5,6,7,8,9].map((n) => (
            <button key={n} onClick={() => { setBetType("number"); setBetValue(String(n)); }} className={`flex justify-center py-1 rounded-xl ${betType === "number" && betValue === String(n) ? "ring-2 ring-orange-500 bg-amber-50" : ""}`}>
              <NumberBall n={n} size={36} />
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={() => { setBetType("bigSmall"); setBetValue("Big"); }} className="py-3 rounded-xl font-bold text-white" style={{ background: "linear-gradient(180deg,#fb923c,#f97316)" }}>Big</button>
          <button onClick={() => { setBetType("bigSmall"); setBetValue("Small"); }} className="py-3 rounded-xl font-bold text-white" style={{ background: "linear-gradient(180deg,#60a5fa,#3b82f6)" }}>Small</button>
        </div>

        <div className="text-[11px] text-gray-500 mb-1">Selection: <b className="text-gray-700">{betType} · {betValue}</b></div>

        <div className="flex items-center gap-2 mb-2">
          {[10, 50, 100, 500, 1000].map((v) => (
            <button key={v} onClick={() => setAmount(v)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${amount === v ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-700 border border-orange-200"}`}>৳{v}</button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          {[1, 5, 10, 20, 50, 100].map((m) => (
            <button key={m} onClick={() => setMultiplier(m)} className={`flex-1 py-1 rounded text-[11px] font-bold ${multiplier === m ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-700 border border-purple-200"}`}>X{m}</button>
          ))}
        </div>

        <button
          disabled={submitting || remaining <= 5}
          onClick={placeBet}
          className="w-full py-3 rounded-xl text-white font-extrabold disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}
        >
          {remaining <= 5 ? "Betting closed" : `Confirm — ${formatTaka(amount * multiplier)}`}
        </button>
      </div>

      {/* History tab */}
      <div className="mx-3 mt-3 bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
        <div className="px-3 py-2 text-sm font-bold text-orange-700 border-b border-orange-100">History</div>
        {history.length === 0 && <div className="py-6 text-center text-xs text-gray-400">No results yet</div>}
        {history.slice(0, 20).map((h) => (
          <div key={h.period} className="flex items-center justify-between px-3 py-1.5 border-b border-gray-50 text-xs">
            <span className="font-mono text-gray-500">{h.period.slice(-8)}</span>
            <div className="flex items-center gap-2">
              <NumberBall n={h.number} size={24} />
              <span className="text-[10px] font-bold text-gray-500">{h.number >= 5 ? "Big" : "Small"} · {h.number % 2 === 0 ? "Even" : "Odd"}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes vwg-ball-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(180deg); }
        }
        .vwg-ball-float { animation: vwg-ball-float 2.2s ease-in-out infinite; }
        @keyframes vwg-ball-land {
          0% { transform: scale(2.4) translateY(-80px); opacity: 0; filter: blur(8px); }
          60% { transform: scale(0.9); opacity: 1; filter: blur(0); }
          80% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        .vwg-ball-land { animation: vwg-ball-land 1.2s cubic-bezier(.2,.8,.2,1) forwards; }
      `}</style>
    </PageScaffold>
  );
};

export default VideoWinGo;
