import { useMemo, useState } from "react";
import { ArrowLeft, Trophy, Circle, Radio, X, Plus, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGlobalWallet } from "@/context/WalletContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Sport = { id: string; name: string; emoji: string };
type Match = {
  id: string;
  sport: string;
  league: string;
  home: string;
  away: string;
  startsIn: string;
  isLive?: boolean;
  score?: string;
  odds: { home: number; draw?: number; away: number };
};

type Selection = {
  matchId: string;
  label: string;
  pick: "home" | "draw" | "away";
  odds: number;
  match: string;
};

const SPORTS: Sport[] = [
  { id: "cricket", name: "Cricket", emoji: "🏏" },
  { id: "football", name: "Football", emoji: "⚽" },
  { id: "tennis", name: "Tennis", emoji: "🎾" },
  { id: "basketball", name: "Basketball", emoji: "🏀" },
  { id: "kabaddi", name: "Kabaddi", emoji: "🤼" },
  { id: "esports", name: "eSports", emoji: "🎮" },
];

const ALL_MATCHES: Match[] = [
  { id: "m1", sport: "cricket", league: "BPL T20", home: "Dhaka Dominators", away: "Comilla Victorians", startsIn: "Live", isLive: true, score: "142/4 (15.2)", odds: { home: 1.85, away: 2.05 } },
  { id: "m2", sport: "cricket", league: "Asia Cup", home: "Bangladesh", away: "India", startsIn: "2h 14m", odds: { home: 3.20, away: 1.42 } },
  { id: "m3", sport: "cricket", league: "PSL", home: "Karachi Kings", away: "Lahore Qalandars", startsIn: "5h 02m", odds: { home: 1.95, away: 1.95 } },
  { id: "m4", sport: "football", league: "Premier League", home: "Man City", away: "Liverpool", startsIn: "Live", isLive: true, score: "1 - 1 (67')", odds: { home: 2.10, draw: 3.40, away: 3.10 } },
  { id: "m5", sport: "football", league: "La Liga", home: "Real Madrid", away: "Barcelona", startsIn: "1h 30m", odds: { home: 2.05, draw: 3.60, away: 3.20 } },
  { id: "m6", sport: "football", league: "Champions League", home: "Bayern", away: "PSG", startsIn: "Tomorrow", odds: { home: 1.78, draw: 3.80, away: 4.20 } },
  { id: "m7", sport: "tennis", league: "ATP Finals", home: "Djokovic", away: "Alcaraz", startsIn: "Live", isLive: true, score: "Set 2 · 4-3", odds: { home: 1.65, away: 2.30 } },
  { id: "m8", sport: "tennis", league: "WTA", home: "Sabalenka", away: "Swiatek", startsIn: "3h 45m", odds: { home: 2.40, away: 1.55 } },
  { id: "m9", sport: "basketball", league: "NBA", home: "Lakers", away: "Celtics", startsIn: "8h", odds: { home: 2.20, away: 1.68 } },
  { id: "m10", sport: "basketball", league: "EuroLeague", home: "Real Madrid", away: "Barcelona", startsIn: "Tomorrow", odds: { home: 1.85, away: 2.00 } },
  { id: "m11", sport: "kabaddi", league: "Pro Kabaddi", home: "Patna Pirates", away: "Bengal Warriors", startsIn: "Live", isLive: true, score: "28 - 24", odds: { home: 1.55, away: 2.45 } },
  { id: "m12", sport: "esports", league: "Valorant Masters", home: "Sentinels", away: "Fnatic", startsIn: "45m", odds: { home: 2.10, away: 1.72 } },
];

const PRESETS = [50, 100, 500, 1000, 5000];

export default function SportsBetting() {
  const navigate = useNavigate();
  const { balance, refresh } = useGlobalWallet();
  const [activeSport, setActiveSport] = useState<string>("cricket");
  const [tab, setTab] = useState<"matches" | "history">("matches");
  const [selections, setSelections] = useState<Selection[]>([]);
  const [stake, setStake] = useState<number>(100);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<
    { id: string; match: string; pick: string; odds: number; stake: number; status: "pending" | "won" | "lost"; time: string }[]
  >([]);

  const matches = useMemo(() => ALL_MATCHES.filter((m) => m.sport === activeSport), [activeSport]);

  const totalOdds = useMemo(
    () => selections.reduce((acc, s) => acc * s.odds, 1),
    [selections]
  );
  const potentialWin = useMemo(() => Math.round(totalOdds * stake), [totalOdds, stake]);

  const toggleSelection = (m: Match, pick: "home" | "draw" | "away") => {
    const odds = pick === "home" ? m.odds.home : pick === "away" ? m.odds.away : m.odds.draw!;
    const label = pick === "home" ? m.home : pick === "away" ? m.away : "Draw";
    setSelections((prev) => {
      const exists = prev.find((s) => s.matchId === m.id);
      if (exists && exists.pick === pick) return prev.filter((s) => s.matchId !== m.id);
      const filtered = prev.filter((s) => s.matchId !== m.id);
      return [...filtered, { matchId: m.id, label, pick, odds, match: `${m.home} vs ${m.away}` }];
    });
    setSheetOpen(true);
  };

  const placeBet = async () => {
    if (selections.length === 0) return toast.error("Select at least one pick");
    if (stake < 10) return toast.error("Minimum stake ৳10");
    if (stake > balance) return toast.error("Insufficient balance");

    setSubmitting(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        toast.error("Please sign in to place a bet");
        return;
      }
      const userId = userData.user.id;

      const perStake = Math.floor(stake / selections.length);
      const tradePrefix = `SP-${Date.now()}`;
      const placed: typeof history = [];
      const failed: string[] = [];

      for (let i = 0; i < selections.length; i++) {
        const s = selections[i];
        const tradeId = `${tradePrefix}-${i}`;
        const potential = Math.round(perStake * s.odds);
        const { data, error } = await supabase.rpc("place_bet_atomic", {
          p_user_id: userId,
          p_game_type: "sports",
          p_game_mode: activeSport,
          p_trade_id: tradeId,
          p_bet_type: s.pick,
          p_bet_value: `${s.matchId}:${s.label}`,
          p_bet_amount: perStake,
          p_multiplier: Math.round(s.odds * 100),
          p_potential_win: potential,
        });
        const res = data as { success?: boolean; error?: string } | null;
        if (error || !res?.success) {
          failed.push(s.label);
          continue;
        }
        placed.push({
          id: tradeId,
          match: s.match,
          pick: s.label,
          odds: s.odds,
          stake: perStake,
          status: "pending",
          time: new Date().toLocaleTimeString(),
        });
      }

      if (placed.length > 0) {
        setHistory((prev) => [...placed, ...prev]);
        await refresh();
        toast.success(`${placed.length} bet${placed.length > 1 ? "s" : ""} placed · Potential ৳${potentialWin.toLocaleString()}`);
        setSelections([]);
        setSheetOpen(false);
      }
      if (failed.length > 0) {
        toast.error(`Failed: ${failed.join(", ")}`);
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to place bet");
    } finally {
      setSubmitting(false);
    }
  };

  const isPicked = (matchId: string, pick: string) =>
    selections.some((s) => s.matchId === matchId && s.pick === pick);

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="sticky top-0 z-20 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-3 flex items-center gap-3 shadow-lg">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-300" /> Sports Betting
          </h1>
          <p className="text-xs text-emerald-100">Balance: ৳{balance.toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs bg-red-500/90 px-2 py-1 rounded-full">
          <Radio className="w-3 h-3 animate-pulse" /> LIVE
        </div>
      </div>

      <div className="flex border-b bg-card">
        {(["matches", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
              tab === t ? "text-emerald-600 border-b-2 border-emerald-600" : "text-muted-foreground"
            }`}
          >
            {t === "matches" ? "Matches" : `My Bets (${history.length})`}
          </button>
        ))}
      </div>

      {tab === "matches" && (
        <>
          <div className="flex gap-2 overflow-x-auto px-3 py-3 no-scrollbar">
            {SPORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSport(s.id)}
                className={`shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl border transition-all ${
                  activeSport === s.id
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-600 shadow-md"
                    : "bg-card text-foreground border-border hover:border-emerald-300"
                }`}
              >
                <span className="text-xl">{s.emoji}</span>
                <span className="text-xs font-medium">{s.name}</span>
              </button>
            ))}
          </div>

          <div className="px-3 space-y-3">
            {matches.length === 0 && (
              <p className="text-center text-muted-foreground py-12 text-sm">No matches available</p>
            )}
            {matches.map((m) => (
              <div
                key={m.id}
                className="bg-card border border-border rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                  <span className="font-medium">{m.league}</span>
                  {m.isLive ? (
                    <span className="flex items-center gap-1 text-red-500 font-semibold">
                      <Circle className="w-2 h-2 fill-red-500" /> {m.score}
                    </span>
                  ) : (
                    <span>{m.startsIn}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm font-semibold mb-3">
                  <div className="truncate">{m.home}</div>
                  <div className="truncate text-right">{m.away}</div>
                </div>
                <div className={`grid ${m.odds.draw ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
                  <OddButton
                    label="1"
                    odds={m.odds.home}
                    active={isPicked(m.id, "home")}
                    onClick={() => toggleSelection(m, "home")}
                  />
                  {m.odds.draw && (
                    <OddButton
                      label="X"
                      odds={m.odds.draw}
                      active={isPicked(m.id, "draw")}
                      onClick={() => toggleSelection(m, "draw")}
                    />
                  )}
                  <OddButton
                    label="2"
                    odds={m.odds.away}
                    active={isPicked(m.id, "away")}
                    onClick={() => toggleSelection(m, "away")}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "history" && (
        <div className="px-3 py-3 space-y-2">
          {history.length === 0 && (
            <p className="text-center text-muted-foreground py-12 text-sm">No bets yet</p>
          )}
          {history.map((b) => (
            <div key={b.id} className="bg-card border border-border rounded-xl p-3 text-sm">
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{b.match}</p>
                  <p className="text-xs text-muted-foreground">Pick: <span className="text-emerald-600 font-medium">{b.pick}</span> @ {b.odds}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 capitalize shrink-0">
                  {b.status}
                </span>
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Stake: ৳{b.stake}</span>
                <span>{b.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selections.length > 0 && !sheetOpen && (
        <button
          onClick={() => setSheetOpen(true)}
          className="fixed bottom-4 right-4 z-40 bg-gradient-to-br from-amber-500 to-amber-600 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold"
        >
          <Trophy className="w-4 h-4" /> Bet Slip ({selections.length})
        </button>
      )}

      {sheetOpen && selections.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-card border-t-2 border-emerald-500 rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col animate-slide-in-right">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-bold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> Bet Slip
              <span className="text-xs text-muted-foreground">({selections.length})</span>
            </h3>
            <button onClick={() => setSheetOpen(false)} className="p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto p-3 space-y-2 flex-1">
            {selections.map((s) => (
              <div key={s.matchId} className="bg-muted/50 rounded-lg p-2.5 text-sm">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate text-xs text-muted-foreground">{s.match}</p>
                    <p className="font-bold text-emerald-600">{s.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-600">@{s.odds}</p>
                    <button
                      onClick={() =>
                        setSelections((prev) => prev.filter((p) => p.matchId !== s.matchId))
                      }
                      className="text-xs text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t p-3 space-y-3 bg-background">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStake((s) => Math.max(10, s - 50))}
                className="p-2 rounded-lg bg-muted"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">৳</span>
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border bg-card text-center font-bold text-lg"
                />
              </div>
              <button
                onClick={() => setStake((s) => s + 50)}
                className="p-2 rounded-lg bg-muted"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setStake(p)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-muted text-xs font-semibold hover:bg-emerald-100"
                >
                  ৳{p}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">Total Odds</p>
                <p className="font-bold text-emerald-600">{totalOdds.toFixed(2)}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">Potential Win</p>
                <p className="font-bold text-amber-600">৳{potentialWin.toLocaleString()}</p>
              </div>
            </div>
            <button
              onClick={placeBet}
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-60"
            >
              {submitting ? "Placing..." : `Place Bet · ৳${stake.toLocaleString()}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OddButton({
  label,
  odds,
  active,
  onClick,
}: {
  label: string;
  odds: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-2.5 rounded-lg font-bold transition-all ${
        active
          ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md scale-[1.02]"
          : "bg-muted hover:bg-emerald-100 dark:hover:bg-emerald-950/30 text-foreground"
      }`}
    >
      <span className="text-xs opacity-70 block">{label}</span>
      <span className="text-sm">{odds.toFixed(2)}</span>
    </button>
  );
}
