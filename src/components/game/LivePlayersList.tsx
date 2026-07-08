import { useState, useEffect, useRef, useCallback } from "react";
import { Users, TrendingUp, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface LivePlayer {
  id: string;
  username: string;
  bet_amount: number;
  auto_cashout?: number | null;
  status: "betting" | "active" | "cashed_out" | "lost";
  cashout_multiplier?: number;
  win_amount?: number;
  justCashedOut?: boolean;
}

interface LivePlayersListProps {
  roundId: string | null;
  currentMultiplier: number;
  phase: "waiting" | "betting" | "locking" | "running" | "crashed";
  soundEnabled?: boolean;
}

const PLAYER_NAMES = [
  "Rahim_BD", "Karim_99", "Sakib_Pro", "Tamim_X", "Masud_VIP",
  "Hasan_Win", "Kabir_Bet", "Jamal_Ace", "Faruk_123", "Salim_King",
  "Rafiq_Star", "Zahid_Top", "Noman_Fly", "Imran_777", "Rubel_Go",
  "Rony_Best", "Shakil_HD", "Sohel_VIP", "Ripon_Bet", "Sumon_Win",
  "RocketMan", "LuckyAce", "BigWinner", "CashKing", "ProGamer",
  "HighRoller", "GoldMiner", "StarPlayer", "TopBet", "FastCash",
  "SkyHigh", "MoonShot", "FireBet", "IceKing", "ThunderBolt",
  "GLU-2***41", "GLU-2***82", "GLU-2***15", "GLU-2***93", "GLU-2***67",
  "GLU-2***24", "GLU-2***58", "GLU-2***36", "GLU-2***79", "GLU-2***02",
];

const generatePlayerName = (): string => PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)];

const generateRandomStake = (): number => {
  const rand = Math.random();
  if (rand < 0.35) return [10, 20, 25, 30, 50, 75, 100][Math.floor(Math.random() * 7)];
  if (rand < 0.65) return [150, 200, 250, 300, 400, 500][Math.floor(Math.random() * 6)];
  if (rand < 0.85) return [750, 1000, 1500, 2000, 2500][Math.floor(Math.random() * 5)];
  return [3000, 5000, 7500, 10000][Math.floor(Math.random() * 4)];
};

const triggerHaptic = (style: "light" | "medium" | "heavy" = "medium") => {
  try {
    if ("vibrate" in navigator) {
      const patterns = { light: [10], medium: [20, 10, 20], heavy: [30, 15, 30, 15, 30] };
      navigator.vibrate(patterns[style]);
    }
  } catch (e) {}
};

const LivePlayersList = ({ roundId, currentMultiplier, phase, soundEnabled = true }: LivePlayersListProps) => {
  const [players, setPlayers] = useState<LivePlayer[]>([]);
  const [showList, setShowList] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastCashoutTimeRef = useRef<number>(0);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
    return audioContextRef.current;
  }, []);

  const playOtherPlayerCashout = useCallback((multiplier: number) => {
    if (!soundEnabled) return;
    const now = Date.now();
    if (now - lastCashoutTimeRef.current < 200) return;
    lastCashoutTimeRef.current = now;
    try {
      const ctx = getAudioContext();
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.setValueAtTime(0.15, ctx.currentTime);
      const coin1 = ctx.createOscillator();
      const coinGain1 = ctx.createGain();
      coin1.connect(coinGain1); coinGain1.connect(masterGain);
      coin1.frequency.setValueAtTime(1800, ctx.currentTime); coin1.type = "sine";
      coinGain1.gain.setValueAtTime(0.4, ctx.currentTime);
      coinGain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      coin1.start(ctx.currentTime); coin1.stop(ctx.currentTime + 0.1);
      if (multiplier >= 3) triggerHaptic("heavy"); else triggerHaptic("light");
    } catch (e) {}
  }, [getAudioContext, soundEnabled]);

  const playNewPlayerJoin = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.setValueAtTime(0.1, ctx.currentTime);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(masterGain);
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.12);
      triggerHaptic("light");
    } catch (e) {}
  }, [getAudioContext, soundEnabled]);

  const handleCashout = useCallback((multiplier: number, playerId: string) => {
    playOtherPlayerCashout(multiplier);
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, justCashedOut: true } : p));
    setTimeout(() => setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, justCashedOut: false } : p)), 500);
  }, [playOtherPlayerCashout]);

  useEffect(() => {
    if (!roundId) return;
    const numPlayers = 35 + Math.floor(Math.random() * 40);
    const autoCashouts = [null, null, null, 1.2, 1.3, 1.5, 1.8, 2.0, 2.5, 3.0, 4.0, 5.0, 7.5, 10.0, 15.0, 20.0];
    const demoPlayers: LivePlayer[] = Array.from({ length: numPlayers }, (_, i) => ({
      id: `demo${i}`, username: generatePlayerName(), bet_amount: generateRandomStake(),
      auto_cashout: autoCashouts[Math.floor(Math.random() * autoCashouts.length)], status: "active" as const,
    }));
    if (phase === "betting") setPlayers(demoPlayers.map(p => ({ ...p, status: "betting" })));
    else if (phase === "running") {
      setPlayers(prev => prev.map(p => {
        if (p.auto_cashout && currentMultiplier >= p.auto_cashout && p.status === "active") {
          handleCashout(p.auto_cashout, p.id);
          return { ...p, status: "cashed_out" as const, cashout_multiplier: p.auto_cashout, win_amount: p.bet_amount * p.auto_cashout };
        }
        const cashoutChance = 0.02 + (currentMultiplier - 1) * 0.01;
        if (p.status === "active" && !p.auto_cashout && Math.random() < cashoutChance && currentMultiplier > 1.2) {
          handleCashout(currentMultiplier, p.id);
          return { ...p, status: "cashed_out" as const, cashout_multiplier: currentMultiplier, win_amount: p.bet_amount * currentMultiplier };
        }
        return { ...p, status: p.status === "betting" ? "active" : p.status };
      }));
    } else if (phase === "crashed") setPlayers(prev => prev.map(p => p.status === "active" ? { ...p, status: "lost" as const } : p));
  }, [roundId, phase, currentMultiplier, handleCashout]);

  useEffect(() => {
    if (phase !== "betting") return;
    const autoCashouts = [null, null, null, 1.2, 1.3, 1.5, 1.8, 2.0, 2.5, 3.0, 4.0, 5.0, 7.5, 10.0, 15.0, 20.0];
    const interval = setInterval(() => {
      if (Math.random() > 0.15) {
        const newCount = 2 + Math.floor(Math.random() * 5);
        const newPlayers: LivePlayer[] = Array.from({ length: newCount }, (_, i) => ({
          id: `demo-live-${Date.now()}-${i}`, username: generatePlayerName(), bet_amount: generateRandomStake(),
          auto_cashout: autoCashouts[Math.floor(Math.random() * autoCashouts.length)], status: "betting" as const,
        }));
        setPlayers(prev => [...newPlayers, ...prev].slice(0, 100));
        if (newPlayers.length > 0) playNewPlayerJoin();
      }
    }, 350);
    return () => clearInterval(interval);
  }, [phase, playNewPlayerJoin]);

  useEffect(() => {
    if (!roundId) return;
    const channel = supabase.channel(`crash-bets-${roundId}`).on('postgres_changes', {
      event: '*', schema: 'public', table: 'crash_bets', filter: `round_id=eq.${roundId}`,
    }, (payload) => {
      const bet = payload.new as any;
      if (!bet) return;
      if (payload.eventType === 'INSERT') {
        playNewPlayerJoin();
        const newPlayer: LivePlayer = { id: bet.id, username: `Player***${bet.user_id?.slice(-4) || 'xxxx'}`, bet_amount: bet.bet_amount, auto_cashout: bet.auto_cashout_multiplier, status: "active" };
        setPlayers(prev => prev.some(p => p.id === bet.id) ? prev : [newPlayer, ...prev].slice(0, 100));
      } else if (payload.eventType === 'UPDATE') {
        if (bet.outcome === 'WIN') handleCashout(bet.cashout_multiplier || 1, bet.id);
        setPlayers(prev => prev.map(p => {
          if (p.id !== bet.id) return p;
          if (bet.outcome === 'WIN') return { ...p, status: "cashed_out" as const, cashout_multiplier: bet.cashout_multiplier, win_amount: bet.win_amount, justCashedOut: true };
          if (bet.outcome === 'LOSE') return { ...p, status: "lost" as const };
          return p;
        }));
      }
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roundId, handleCashout, playNewPlayerJoin]);

  const activePlayers = players.filter(p => p.status === "active" || p.status === "betting");
  const cashedOutPlayers = players.filter(p => p.status === "cashed_out");

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
      <button onClick={() => setShowList(!showList)} className="w-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Users className="text-cyan-400" size={18} /> Live Players
          <Badge className="bg-cyan-500/30 text-cyan-300 text-xs ml-2">{players.length}</Badge>
        </h3>
        <div className="flex items-center gap-2">
          {activePlayers.length > 0 && <Badge className="bg-green-500/20 text-green-400 text-xs animate-pulse"><TrendingUp size={12} className="mr-1" />{activePlayers.length} Active</Badge>}
          {cashedOutPlayers.length > 0 && <Badge className="bg-amber-500/20 text-amber-400 text-xs"><Sparkles size={12} className="mr-1" />{cashedOutPlayers.length} Cashed</Badge>}
        </div>
      </button>
      {showList && (
        <ScrollArea className="h-48">
          <div className="divide-y divide-slate-700/50">
            {players.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">No players yet. Be the first to bet!</div>
            ) : players.map((player) => (
              <div key={player.id} className={`flex items-center justify-between px-4 py-2.5 transition-all duration-300 ${player.justCashedOut ? "bg-amber-500/30 scale-[1.02]" : player.status === "cashed_out" ? "bg-green-500/10" : player.status === "lost" ? "bg-red-500/5 opacity-60" : "hover:bg-slate-700/30"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full transition-all ${player.justCashedOut ? "bg-amber-400 w-3 h-3 animate-ping" : player.status === "active" ? "bg-green-400 animate-pulse" : player.status === "betting" ? "bg-yellow-400 animate-pulse" : player.status === "cashed_out" ? "bg-amber-400" : "bg-red-400"}`} />
                  <div>
                    <p className={`text-sm font-medium transition-colors ${player.justCashedOut ? "text-amber-300" : "text-white"}`}>{player.username}</p>
                    <p className="text-slate-500 text-xs">Bet: ৳{player.bet_amount.toLocaleString()}{player.auto_cashout && <span className="text-cyan-400 ml-2">Auto: {player.auto_cashout}x</span>}</p>
                  </div>
                </div>
                <div className="text-right">
                  {player.status === "active" && phase === "running" && <p className="text-green-400 font-bold text-sm animate-pulse">৳{(player.bet_amount * currentMultiplier).toFixed(0)}</p>}
                  {player.status === "cashed_out" && player.cashout_multiplier && (
                    <div className={`transition-transform ${player.justCashedOut ? "scale-110" : ""}`}>
                      <Badge className={`font-bold text-xs ${player.justCashedOut ? "bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-900 animate-pulse" : "bg-gradient-to-r from-amber-500 to-orange-500 text-white"}`}>{player.cashout_multiplier.toFixed(2)}x</Badge>
                      <p className={`font-bold text-xs mt-0.5 ${player.justCashedOut ? "text-amber-300" : "text-green-400"}`}>+৳{player.win_amount?.toLocaleString()}</p>
                    </div>
                  )}
                  {player.status === "lost" && <Badge className="bg-red-500/20 text-red-400 text-xs">Lost</Badge>}
                  {player.status === "betting" && <Badge className="bg-yellow-500/20 text-yellow-400 text-xs animate-pulse">Betting...</Badge>}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default LivePlayersList;
