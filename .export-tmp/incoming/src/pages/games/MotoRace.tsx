import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, RefreshCw, Wallet, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWalletDB } from "@/hooks/useWalletDB";
import { settleBetsDB } from "@/lib/gameHistoryService";
import { getAdminSetResult } from "@/lib/adminResultService";
import { formatTaka } from "@/lib/currency";
import { attachGameErrorListeners, logGameError } from "@/lib/gameErrorLogger";
import PageScaffold from "@/components/templates/PageScaffold";

const GAME_KEY = "motorace" as const;

const MODES = [
  { id: "1min", label: "1Min", duration: 60 },
  { id: "3min", label: "3Min", duration: 180 },
  { id: "5min", label: "5Min", duration: 300 },
  { id: "10min", label: "10Min", duration: 600 },
];

const BIKES = [1, 2, 3, 4, 5, 6];
const POSITION_ODDS: Record<string, number> = { "1st": 5, "2nd": 3, "3rd": 2 };

const getDuration = (mode: string) => MODES.find((m) => m.id === mode)?.duration ?? 60;

const getRoundKey = (mode: string) => {
  const dur = getDuration(mode) * 1000;
  const now = Date.now();
  const start = Math.floor(now / dur) * dur;
  return `MOTO:${mode}:${start}`;
};

const getRemaining = (roundKey: string, mode: string) => {
  const parts = roundKey.split(":");
  const start = parseInt(parts[2] || "0", 10);
  const dur = getDuration(mode) * 1000;
  return Math.max(0, Math.ceil((start + dur - Date.now()) / 1000));
};

const periodFromKey = (mode: string, roundKey: string): string => {
  const ts = parseInt(roundKey.split(":")[2] || "0", 10);
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const serial = Math.floor((ts % 86400000) / (getDuration(mode) * 1000)) + 1;
  return `${y}${m}${dd}${String(serial).padStart(5, "0")}`;
};

/** Pick 3 distinct bikes 1..6 for podium positions [1st, 2nd, 3rd] */
const generatePodium = (): [number, number, number] => {
  const pool = [...BIKES];
  const pick = () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
  return [pick(), pick(), pick()];
};

const parsePodium = (s: string): [number, number, number] | null => {
  try {
    const arr = s.startsWith("[") ? JSON.parse(s) : s.split(",").map((x) => parseInt(x.trim(), 10));
    if (Array.isArray(arr) && arr.length === 3 && arr.every((n) => n >= 1 && n <= 6)) {
      return [arr[0], arr[1], arr[2]];
    }
  } catch {}
  return null;
};

interface HistoryRow {
  period: string;
  podium: [number, number, number];
  ts: number;
}

const loadHistory = (mode: string): HistoryRow[] => {
  try {
    const raw = localStorage.getItem(`motorace_${mode}_history`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.slice(0, 100);
    }
  } catch {}
  return [];
};

const saveHistory = (mode: string, list: HistoryRow[]) => {
  try {
    localStorage.setItem(`motorace_${mode}_history`, JSON.stringify(list.slice(0, 100)));
  } catch {}
};

const BikeBadge = ({ n, size = 36, glow = false }: { n: number; size?: number; glow?: boolean }) => (
  <div
    className="rounded-full flex items-center justify-center font-extrabold text-white shadow-md"
    style={{
      width: size,
      height: size,
      fontSize: size * 0.45,
      background: "linear-gradient(180deg, #fb923c 0%, #ea580c 100%)",
      boxShadow: glow ? "0 0 14px rgba(251,146,60,0.85)" : undefined,
      border: glow ? "2px solid #fde68a" : "2px solid rgba(255,255,255,0.4)",
    }}
  >
    {n}
  </div>
);

const MotoRace = () => {
  const navigate = useNavigate();
  // Dev/QA hook: ?simulateError=1 throws to verify GameErrorBoundary
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("simulateError") === "1") {
    throw new Error("Simulated MotoRace render failure");
  }
  const { formattedBalance, balance, refreshBalance, isAuthenticated } = useWalletDB();

  const [mode, setMode] = useState<string>("1min");
  const [roundKey, setRoundKey] = useState<string>(() => getRoundKey("1min"));
  const [remaining, setRemaining] = useState<number>(() => getRemaining(getRoundKey("1min"), "1min"));
  const [history, setHistory] = useState<HistoryRow[]>(() => loadHistory("1min"));
  const [revealPodium, setRevealPodium] = useState<[number, number, number] | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const [tab, setTab] = useState<"history" | "chart" | "mybets">("history");

  // Bet selection
  const [position, setPosition] = useState<"1st" | "2nd" | "3rd">("1st");
  const [bike, setBike] = useState<number>(1);
  const [amount, setAmount] = useState<number>(10);
  const [submitting, setSubmitting] = useState(false);

  const settledRoundsRef = useRef<Set<string>>(new Set());
  const period = useMemo(() => periodFromKey(mode, roundKey), [mode, roundKey]);

  // Runtime error capture for this page
  useEffect(() => attachGameErrorListeners("MotoRace"), []);

  // Switch mode resets round + history view
  useEffect(() => {
    const rk = getRoundKey(mode);
    setRoundKey(rk);
    setRemaining(getRemaining(rk, mode));
    setHistory(loadHistory(mode));
    setShowReveal(false);
    setRevealPodium(null);
  }, [mode]);

  // Tick + round transitions
  useEffect(() => {
    const t = setInterval(async () => {
      const left = getRemaining(roundKey, mode);
      setRemaining(left);
      if (left <= 0) {
        // Resolve round
        const finishedKey = roundKey;
        const finishedPeriod = periodFromKey(mode, finishedKey);
        if (!settledRoundsRef.current.has(finishedKey)) {
          settledRoundsRef.current.add(finishedKey);
          let podium: [number, number, number] | null = null;
          try {
            const admin = await getAdminSetResult(GAME_KEY, mode, finishedPeriod);
            if (admin?.result) podium = parsePodium(admin.result);
          } catch (e) {
            logGameError({ game: "MotoRace", period: finishedPeriod, mode }, "getAdminSetResult", e);
          }
          if (!podium) podium = generatePodium();

          // Settlement: serialize as "1,2,3" for the row, use settleBetsDB with custom evaluator via a 1st-position digest.
          // Our gameHistoryService doesn't know motorace — we settle locally by querying our pending bets.
          try {
            await settleMotoraceBets(finishedPeriod, podium);
          } catch (e) {
            logGameError({ game: "MotoRace", period: finishedPeriod, mode }, "settleMotoraceBets", e);
          }
          await refreshBalance().catch((e) => logGameError({ game: "MotoRace", mode }, "refreshBalance", e));

          setRevealPodium(podium);
          setShowReveal(true);
          const next: HistoryRow = { period: finishedPeriod, podium, ts: Date.now() };
          setHistory((prev) => {
            const updated = [next, ...prev].slice(0, 100);
            saveHistory(mode, updated);
            return updated;
          });
          setTimeout(() => setShowReveal(false), 3500);
        }
        // Roll into next round
        const nk = getRoundKey(mode);
        setRoundKey(nk);
        setRemaining(getRemaining(nk, mode));
      }
    }, 500);
    return () => clearInterval(t);
  }, [roundKey, mode, refreshBalance]);

  const placeBet = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to bet");
      return;
    }
    if (remaining <= 5) {
      toast.error("Betting closed for this round");
      return;
    }
    if (amount <= 0 || amount > balance) {
      toast.error("Insufficient balance");
      return;
    }
    const odds = POSITION_ODDS[position];
    const potentialWin = amount * odds;
    setSubmitting(true);
    try {
      const { invokePlaceBetWithRetry } = await import("@/lib/placeBetRetry");
      const result = await invokePlaceBetWithRetry(
        {
          gameType: GAME_KEY,
          gameMode: mode,
          tradeId: period,
          betType: position, // "1st" | "2nd" | "3rd"
          betValue: String(bike),
          betAmount: amount,
          multiplier: odds,
          potentialWin,
        },
        { onRetry: (attempt, err) => logGameError({ game: "MotoRace", period, mode }, `place-bet:retry-${attempt}`, err) },
      );
      const data = result.data as { success?: boolean; error?: string } | null;
      const error = result.error as { message?: string } | null;
      if (error || !data?.success) {
        logGameError({ game: "MotoRace", period, mode }, "place-bet", error || data?.error);
        toast.error(data?.error || error?.message || "Bet failed");
        return;
      }
      toast.success(`Bet placed: ${position} = Bike ${bike} (${formatTaka(amount)})`);
      await refreshBalance().catch((e) => logGameError({ game: "MotoRace", mode }, "refreshBalance", e));
    } catch (e) {
      logGameError({ game: "MotoRace", period, mode }, "placeBet", e);
      toast.error("Bet failed");
    } finally {
      setSubmitting(false);
    }
  }, [amount, balance, bike, isAuthenticated, mode, period, position, remaining, refreshBalance]);

  return (
    <PageScaffold
      title="MotoRace | GoLucky"
      description="Bet on Top-3 MotoRace finishers. Odds: 1st=5x, 2nd=3x, 3rd=2x."
      canonicalPath="/game/motorace"
      fullWidth
      className="bg-gradient-to-br from-orange-50 to-amber-100 pb-24"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 py-3 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)" }}>
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft size={22} /></button>
          <div className="text-lg font-extrabold tracking-wide">GoLucky · MotoRace</div>
          <button className="p-2 -mr-2" onClick={() => toast("Bet on Top-3 finishers. Odds: 1st=5x, 2nd=3x, 3rd=2x")}>
            <HelpCircle size={22} />
          </button>
        </div>
      </div>

      {/* Wallet */}
      <div className="mx-3 mt-3 rounded-2xl bg-white border border-orange-100 shadow-sm p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="text-orange-600" size={20} />
          <div>
            <div className="text-[10px] text-gray-500">Available Balance</div>
            <div className="text-base font-bold text-gray-800">{formattedBalance}</div>
          </div>
        </div>
        <button onClick={() => refreshBalance()} className="p-2 rounded-full bg-orange-50 text-orange-600">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Mode tabs */}
      <div className="mx-3 mt-3 grid grid-cols-4 gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`py-2 rounded-xl text-sm font-bold transition ${mode === m.id ? "text-white shadow" : "bg-white text-gray-600 border border-orange-100"}`}
            style={mode === m.id ? { background: "linear-gradient(135deg,#f97316,#ef4444)" } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Period + countdown */}
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

      {/* Race Track */}
      <div className="mx-3 mt-3 rounded-2xl overflow-hidden border border-amber-200 bg-gradient-to-b from-green-700 to-green-900 relative" style={{ height: 200 }}>
        <div className="absolute inset-x-0 top-0 h-1 bg-white/40" />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/40" />
        {/* lane markings */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="absolute left-0 right-0 border-t border-dashed border-white/30" style={{ top: `${(i * 100) / 6}%` }} />
        ))}
        {BIKES.map((b, i) => {
          const isWinner = revealPodium && revealPodium[0] === b && showReveal;
          return (
            <div
              key={b}
              className="absolute flex items-center gap-2"
              style={{
                top: `${(i * 100) / 6 + 3}%`,
                left: showReveal ? "85%" : "5%",
                transition: `left ${Math.max(0.6, remaining > 5 ? 1.2 : 0.6)}s linear`,
                filter: isWinner ? "drop-shadow(0 0 8px gold)" : undefined,
              }}
            >
              <span style={{ fontSize: 22 }}>🏍️</span>
              <span className="text-white font-extrabold text-xs bg-black/40 px-1.5 py-0.5 rounded">#{b}</span>
              {isWinner && <Trophy size={16} className="text-yellow-300" />}
            </div>
          );
        })}
      </div>

      {/* Reveal banner */}
      {showReveal && revealPodium && (
        <div className="mx-3 mt-3 rounded-2xl bg-white border-2 border-amber-300 p-3 shadow flex items-center justify-around">
          {(["1st", "2nd", "3rd"] as const).map((pos, idx) => (
            <div key={pos} className="flex flex-col items-center">
              <div className="text-[10px] text-gray-500 font-bold">{pos}</div>
              <BikeBadge n={revealPodium[idx]} size={40} glow={idx === 0} />
            </div>
          ))}
        </div>
      )}

      {/* Betting Panel */}
      <div className="mx-3 mt-3 bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
        <div className="text-sm font-bold text-gray-800 mb-2">Bet on Top 3 positions</div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {(["1st", "2nd", "3rd"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPosition(p)}
              className={`py-2 rounded-xl text-sm font-bold ${position === p ? "text-white shadow" : "bg-orange-50 text-orange-700 border border-orange-200"}`}
              style={position === p ? { background: "linear-gradient(135deg,#f97316,#ef4444)" } : {}}
            >
              {p} · {POSITION_ODDS[p]}x
            </button>
          ))}
        </div>

        <div className="text-[11px] text-gray-500 mb-1">Pick a bike</div>
        <div className="grid grid-cols-6 gap-2 mb-3">
          {BIKES.map((b) => (
            <button key={b} onClick={() => setBike(b)} className={`flex justify-center py-1 rounded-xl ${bike === b ? "bg-amber-100 ring-2 ring-orange-500" : ""}`}>
              <BikeBadge n={b} size={34} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-3">
          {[10, 50, 100, 500, 1000].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${amount === v ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-700 border border-orange-200"}`}
            >
              ৳{v}
            </button>
          ))}
        </div>

        <button
          disabled={submitting || remaining <= 5}
          onClick={placeBet}
          className="w-full py-3 rounded-xl text-white font-extrabold disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}
        >
          {remaining <= 5 ? "Betting closed" : `Confirm — ${formatTaka(amount)} → win ${formatTaka(amount * POSITION_ODDS[position])}`}
        </button>
      </div>

      {/* Tabs */}
      <div className="mx-3 mt-3 bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
        <div className="grid grid-cols-3 text-sm font-bold">
          {(["history", "chart", "mybets"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2 ${tab === t ? "text-orange-600 border-b-2 border-orange-500" : "text-gray-500"}`}
            >
              {t === "mybets" ? "My Bets" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "history" && (
          <div className="p-3">
            <div className="grid grid-cols-4 text-[11px] font-bold text-gray-500 pb-2 border-b border-gray-100">
              <span>Period</span><span className="text-center">1st</span><span className="text-center">2nd</span><span className="text-center">3rd</span>
            </div>
            {history.length === 0 && <div className="py-6 text-center text-xs text-gray-400">No results yet</div>}
            {history.slice(0, 20).map((h) => (
              <div key={h.period} className="grid grid-cols-4 items-center py-1.5 border-b border-gray-50 text-xs">
                <span className="font-mono text-gray-500 truncate">{h.period.slice(-6)}</span>
                <span className="flex justify-center"><BikeBadge n={h.podium[0]} size={24} /></span>
                <span className="flex justify-center"><BikeBadge n={h.podium[1]} size={24} /></span>
                <span className="flex justify-center"><BikeBadge n={h.podium[2]} size={24} /></span>
              </div>
            ))}
          </div>
        )}

        {tab === "chart" && (
          <div className="p-3">
            <div className="text-[11px] text-gray-500 mb-2">Bike win frequency (last {Math.min(history.length, 20)} rounds)</div>
            {BIKES.map((b) => {
              const sample = history.slice(0, 20);
              const firsts = sample.filter((h) => h.podium[0] === b).length;
              const pct = sample.length ? (firsts / sample.length) * 100 : 0;
              return (
                <div key={b} className="flex items-center gap-2 mb-1">
                  <BikeBadge n={b} size={20} />
                  <div className="flex-1 h-2 bg-gray-100 rounded">
                    <div className="h-2 rounded" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#f97316,#ef4444)" }} />
                  </div>
                  <span className="text-[11px] text-gray-500 w-10 text-right">{firsts}/{sample.length || 0}</span>
                </div>
              );
            })}
          </div>
        )}

        {tab === "mybets" && <MyBetsList gameType={GAME_KEY} />}
      </div>
    </PageScaffold>
  );

  /** Local settlement using our atomic RPC via gameHistoryService — we reuse settle_bet_atomic
   *  via settleBetsDB by passing a synthetic result string in "1,2,3" format. The bet evaluator
   *  in gameHistoryService doesn't know motorace, so we manually evaluate winners here. */
  async function settleMotoraceBets(tradeId: string, podium: [number, number, number]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: pending } = await supabase
      .from("game_bets")
      .select("id, bet_type, bet_value, potential_win")
      .eq("user_id", user.id)
      .eq("trade_id", tradeId)
      .eq("status", "pending");
    if (!pending?.length) return;

    for (const bet of pending) {
      const posIndex: 0 | 1 | 2 | -1 =
        bet.bet_type === "1st" ? 0 : bet.bet_type === "2nd" ? 1 : bet.bet_type === "3rd" ? 2 : -1;
      if (posIndex === -1) continue;
      const wonBike = podium[posIndex];
      const isWin = parseInt(bet.bet_value, 10) === wonBike;
      const winAmount = isWin ? Number(bet.potential_win) : 0;
      const { error } = await supabase.rpc("settle_bet_atomic", {
        p_user_id: user.id,
        p_trade_id: tradeId,
        p_result: podium.join(","),
        p_win_amount: winAmount,
        p_game_type: GAME_KEY,
      });
      if (error) console.error("[MotoRace] settle_bet_atomic", error);
    }
  }
};

const MyBetsList = ({ gameType }: { gameType: string }) => {
  const [bets, setBets] = useState<any[]>([]);
  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("game_bets")
        .select("id, trade_id, bet_type, bet_value, bet_amount, payout, status, created_at")
        .eq("user_id", user.id)
        .eq("game_type", gameType)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!cancel) setBets(data || []);
    })();
    const t = setInterval(() => { /* refresh */ }, 5000);
    return () => { cancel = true; clearInterval(t); };
  }, [gameType]);
  if (!bets.length) return <div className="py-6 text-center text-xs text-gray-400">No bets yet</div>;
  return (
    <div className="p-3 space-y-1.5">
      {bets.map((b) => (
        <div key={b.id} className="flex items-center justify-between text-xs bg-orange-50/50 rounded-lg px-2 py-1.5">
          <div>
            <div className="font-bold text-gray-700">{b.bet_type} · Bike {b.bet_value}</div>
            <div className="text-[10px] text-gray-400 font-mono">{b.trade_id}</div>
          </div>
          <div className="text-right">
            <div className={`font-bold ${b.status === "won" ? "text-green-600" : b.status === "lost" ? "text-red-500" : "text-gray-500"}`}>
              {b.status === "won" ? `+${formatTaka(Number(b.payout))}` : formatTaka(Number(b.bet_amount))}
            </div>
            <div className="text-[10px] text-gray-400">{b.status}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MotoRace;
