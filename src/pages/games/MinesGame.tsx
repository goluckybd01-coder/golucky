import { useState, useEffect, useRef } from "react";
import PageScaffold from "@/components/templates/PageScaffold";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Volume2, VolumeX, HelpCircle, Settings2, Zap, Gem, Bomb, TrendingUp, Shield, Wallet, Receipt, Edit3, Globe, Smartphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMinesGame } from "@/hooks/useMinesGame";
import { useMinesSounds } from "@/hooks/useMinesSounds";
import { useLanguage } from "@/hooks/useLanguage";
import { t, minesHowToPlayTranslations } from "@/lib/translations/mines";
import { getGridDimensions, getMaxMines, getNextMultiplier, generateClientSeed } from "@/lib/minesEngine";
import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import AuthGuard from "@/components/AuthGuard";
import Confetti from "@/components/Confetti";
import HowToPlayModal from "@/components/game/HowToPlayModal";
import MinesProvablyFairModal from "@/components/game/MinesProvablyFairModal";
import { MinesHistory } from "@/components/game/MinesHistory";
import { MinesLeaderboard } from "@/components/game/MinesLeaderboard";
import { MinesStatsPanel } from "@/components/game/MinesStatsPanel";
import MinesStreakIndicator, { calculateStreakBonus } from "@/components/game/MinesStreakIndicator";
import { toast } from "sonner";

const MinesGame = () => {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showClientSeedDialog, setShowClientSeedDialog] = useState(false);
  const [newClientSeed, setNewClientSeed] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiIntensity, setConfettiIntensity] = useState<"small" | "medium" | "big">("medium");
  const [winStreak, setWinStreak] = useState(() => {
    const saved = localStorage.getItem('mines_win_streak');
    return saved ? parseInt(saved, 10) : 0;
  });
  const prevRevealedCountRef = useRef(0);
  const prevStatusRef = useRef<string>('betting');

  const sounds = useMinesSounds();
  const { language, toggleLanguage } = useLanguage();

  const {
    state,
    settings,
    isLoading,
    pendingPicks,
    canUseInstantMode,
    startGame,
    revealTile,
    cashout,
    autoPick,
    resetGame,
    setGridSize,
    setMineCount,
    setBetAmount,
    setDifficulty,
    setAutoCashout,
    setAnimationSpeed,
    setAutoPickEnabled,
    updateClientSeed,
    isGridAllowed,
  } = useMinesGame();

  useEffect(() => {
    if (isMuted) return;
    if (state.revealedPositions.length > prevRevealedCountRef.current) {
      const lastRevealed = state.revealedPositions[state.revealedPositions.length - 1];
      const hitMine = state.minePositions.includes(lastRevealed);
      if (hitMine) sounds.playMineExplosion();
      else sounds.playGemReveal();
    }
    prevRevealedCountRef.current = state.revealedPositions.length;
  }, [state.revealedPositions, state.minePositions, isMuted, sounds]);

  useEffect(() => {
    if (prevStatusRef.current === state.status) return;
    const wasActive = prevStatusRef.current === 'active';
    prevStatusRef.current = state.status;
    if (!wasActive) return;

    if (state.status === 'cashed_out' || state.status === 'won') {
      if (!isMuted) sounds.playCashout();
      const newStreak = winStreak + 1;
      setWinStreak(newStreak);
      localStorage.setItem('mines_win_streak', newStreak.toString());
      const bestStreak = parseInt(localStorage.getItem('mines_best_streak') || '0', 10);
      if (newStreak > bestStreak) {
        localStorage.setItem('mines_best_streak', newStreak.toString());
        if (newStreak >= 3) toast.success(`🏆 ${t('streak.newRecord', language)} ${newStreak} wins!`);
      }
      if (state.currentMultiplier >= 3 || newStreak >= 5) {
        if (state.currentMultiplier >= 10 || newStreak >= 10) setConfettiIntensity("big");
        else if (state.currentMultiplier >= 5 || newStreak >= 5) setConfettiIntensity("medium");
        else setConfettiIntensity("small");
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
    } else if (state.status === 'lost') {
      if (winStreak >= 2) toast.error(`💔 ${t('streak.streakLost', language)} (${winStreak} wins)`);
      setWinStreak(0);
      localStorage.setItem('mines_win_streak', '0');
    }
  }, [state.status, state.currentMultiplier, isMuted, sounds, winStreak, language]);

  const handleStartGame = () => {
    if (!isMuted) sounds.playGameStart();
    startGame();
  };

  const gridDimension = getGridDimensions(state.gridSize);
  const maxMines = getMaxMines(state.gridSize);
  const nextMultiplier = state.status === 'active' 
    ? getNextMultiplier(state.gridSize, state.mineCount, state.revealedPositions.length, settings?.rtp_target || 95)
    : 1;

  const gridSizeOptions = [
    { size: 9 as const, label: "3×3" },
    { size: 25 as const, label: "5×5" },
    { size: 49 as const, label: "7×7" },
  ];

  const difficultyOptions = [
    { value: 'easy' as const, label: t('grid.easy', language), color: 'from-green-500 to-emerald-500' },
    { value: 'medium' as const, label: t('grid.medium', language), color: 'from-yellow-500 to-orange-500' },
    { value: 'hard' as const, label: t('grid.hard', language), color: 'from-red-500 to-rose-500' },
  ];

  const renderTile = (index: number) => {
    const isRevealed = state.revealedPositions.includes(index);
    const isMine = state.minePositions.includes(index);
    const isGameOver = state.status === 'lost' || state.status === 'won' || state.status === 'cashed_out';
    const showMine = isGameOver && isMine;
    const isPending = pendingPicks.has(index);
    const tileSize = state.gridSize === 9 ? 'w-20 h-20' : state.gridSize === 25 ? 'w-14 h-14' : 'w-10 h-10';
    const iconSize = state.gridSize === 9 ? 'w-10 h-10' : state.gridSize === 25 ? 'w-7 h-7' : 'w-5 h-5';
    const spinnerSize = state.gridSize === 9 ? 'w-8 h-8' : state.gridSize === 25 ? 'w-5 h-5' : 'w-4 h-4';

    return (
      <button
        key={index}
        onClick={() => { if (!isMuted) sounds.playClick(); revealTile(index); }}
        disabled={isRevealed || isGameOver || state.status !== 'active' || isLoading || isPending}
        className={cn(
          tileSize, "rounded-lg transition-all duration-300 flex items-center justify-center relative overflow-hidden border-2 shadow-lg",
          isRevealed && isMine && "bg-gradient-to-br from-red-500 to-red-700 border-red-400 animate-shake",
          isRevealed && !isMine && "bg-gradient-to-br from-emerald-400 to-green-600 border-green-400",
          showMine && !isRevealed && "bg-gradient-to-br from-red-500/50 to-red-700/50 border-red-400/50",
          isPending && "bg-gradient-to-br from-amber-500/50 to-orange-600/50 border-amber-400 animate-pulse",
          !isRevealed && !showMine && !isPending && "bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 hover:from-slate-600 hover:to-slate-700 hover:scale-105 hover:shadow-xl cursor-pointer",
          (isGameOver || state.status !== 'active') && !isRevealed && !showMine && "opacity-60 cursor-not-allowed",
        )}
        style={{ animationDuration: `${0.3 / state.animationSpeed}s` }}
      >
        {isPending && <Loader2 className={cn(spinnerSize, "text-white animate-spin")} />}
        {isRevealed && !isMine && <Gem className={cn(iconSize, "text-white drop-shadow-lg animate-scale-in")} />}
        {(isRevealed && isMine) || showMine ? <Bomb className={cn(iconSize, "text-white drop-shadow-lg", isRevealed && "animate-scale-in")} /> : null}
        {!isRevealed && !showMine && !isPending && state.status === 'active' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        )}
      </button>
    );
  };

  const howToPlayContent = minesHowToPlayTranslations[language];

  return (
    <AuthGuard>
    <PageScaffold title="Mines | GoLucky" description="Play Mines — reveal safe tiles and cash out before hitting a mine." canonicalPath="/game/mines" fullWidth>
      <Confetti isActive={showConfetti} intensity={confettiIntensity} duration={4000} />
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <header className="sticky top-0 z-50 bg-gradient-to-r from-orange-600 to-amber-600 shadow-xl">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="flex items-center gap-2">
                <Bomb className="w-6 h-6 text-white" />
                <span className="text-white font-bold text-lg">{t('header.mines', language)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={toggleLanguage} className="p-2 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1">
                <Globe className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">{language === 'en' ? 'বাং' : 'EN'}</span>
              </button>
              <button onClick={() => setShowHowToPlay(true)} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><HelpCircle className="w-5 h-5 text-white" /></button>
              <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><Settings2 className="w-5 h-5 text-white" /></button>
              <button onClick={() => setIsMuted(!isMuted)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 space-y-4 max-w-lg mx-auto">
          <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-xl p-3 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-400" />
              <span className="text-slate-300 text-sm">{t('balance.availableBalance', language)}:</span>
            </div>
            <span className="text-xl font-bold text-amber-400">{formatTaka(state.balance)}</span>
          </div>

          {(winStreak >= 1 || state.status === 'active') && (
            <MinesStreakIndicator streak={winStreak} bonusMultiplier={calculateStreakBonus(winStreak)} />
          )}

          {state.status === 'active' && state.seedHash && (
            <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-xs text-slate-400">{t('fairHash.title', language)}</p>
                <p className="text-xs font-mono text-slate-300 truncate">{state.seedHash.slice(0, 32)}...</p>
              </div>
            </div>
          )}

          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-slate-400 text-sm">{t('multiplier.current', language)}</p>
                <p className="text-3xl font-bold text-white">{state.currentMultiplier.toFixed(2)}x</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">{t('multiplier.next', language)}</p>
                <p className="text-xl font-bold text-emerald-400">{nextMultiplier.toFixed(2)}x</p>
              </div>
            </div>
            {state.status === 'active' && state.potentialWin > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{t('multiplier.grossWin', language)}</span>
                  <span className="text-lg text-white">{formatTaka(state.potentialWin)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-amber-400 flex items-center gap-1"><Receipt className="w-3 h-3" /> {t('multiplier.tax', language)} (2%)</span>
                  <span className="text-amber-400">-{formatTaka(state.taxAmount)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-600">
                  <span className="text-emerald-400 font-medium">{t('multiplier.netCashout', language)}</span>
                  <span className="text-xl font-bold text-emerald-400">{formatTaka(state.netAmount)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
            <div className="grid gap-2 mx-auto w-fit" style={{ gridTemplateColumns: `repeat(${gridDimension}, 1fr)` }}>
              {Array.from({ length: state.gridSize }).map((_, i) => renderTile(i))}
            </div>
          </div>

          {state.status === 'betting' && (
            <div className="space-y-4">
              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-3">{t('grid.gridSize', language)}</p>
                <div className="flex gap-2">
                  {gridSizeOptions.map(option => (
                    <button key={option.size} onClick={() => setGridSize(option.size)} className={cn("flex-1 py-2.5 rounded-lg font-medium transition-all", state.gridSize === option.size ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600")}>{option.label}</button>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-3">{t('grid.difficulty', language)}</p>
                <div className="flex gap-2">
                  {difficultyOptions.map(option => (
                    <button key={option.value} onClick={() => setDifficulty(option.value)} className={cn("flex-1 py-2.5 rounded-lg font-medium transition-all", state.difficulty === option.value ? `bg-gradient-to-r ${option.color} text-white` : "bg-slate-700 text-slate-300 hover:bg-slate-600")}>{option.label}</button>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-slate-400 text-sm">{t('grid.mines', language)}</p>
                  <span className="text-white font-bold">{state.mineCount}</span>
                </div>
                <Slider value={[state.mineCount]} min={1} max={maxMines} step={1} onValueChange={([val]) => setMineCount(val)} className="py-2" />
              </div>
              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <p className="text-slate-400 text-sm mb-3">{t('grid.betAmount', language)}</p>
                <Input type="number" value={state.betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} className="bg-slate-700 border-slate-600 text-white" min={settings?.min_bet || 10} max={settings?.max_bet || 50000} />
                <div className="flex gap-2 mt-3">
                  {[50, 100, 500, 1000, 5000].map((amount) => (
                    <Button key={amount} variant="outline" size="sm" onClick={() => setBetAmount(amount)} className={cn("flex-1 text-xs", state.betAmount === amount ? "bg-amber-500 border-amber-500 text-white" : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600")}>
                      ৳{amount >= 1000 ? `${amount / 1000}K` : amount}
                    </Button>
                  ))}
                </div>
              </div>
              {showSettings && (
                <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-4">
                  <p className="text-white font-medium flex items-center gap-2"><Settings2 className="w-4 h-4" />{t('settings.title', language)}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">{t('settings.autoCashout', language)}</span>
                    <Input type="number" placeholder="e.g. 2.00" value={state.autoCashout || ''} onChange={(e) => setAutoCashout(e.target.value ? Number(e.target.value) : null)} className="w-24 bg-slate-700 border-slate-600 text-white text-sm" step="0.1" min="1.01" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">{t('settings.enableAutoPick', language)}</span>
                    <Switch checked={state.autoPickEnabled} onCheckedChange={setAutoPickEnabled} />
                  </div>
                </div>
              )}
              <Button onClick={handleStartGame} disabled={isLoading || !settings?.enabled} className="w-full py-6 text-lg font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:opacity-50">
                {!settings?.enabled ? t('buttons.gameDisabled', language) : isLoading ? t('buttons.starting', language) : `${t('buttons.startGame', language)} (${formatTaka(state.betAmount)})`}
              </Button>
            </div>
          )}

          {state.status === 'active' && (
            <div className="space-y-3">
              <div className="flex gap-3">
                {state.autoPickEnabled && (
                  <Button onClick={autoPick} disabled={isLoading} className="flex-1 py-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                    <Zap className="w-5 h-5 mr-2" />{t('buttons.autoPick', language)}
                  </Button>
                )}
                <Button onClick={cashout} disabled={isLoading || state.revealedPositions.length === 0 || state.status !== 'active'} className={cn("py-6 font-bold text-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700", state.autoPickEnabled ? "flex-1" : "w-full")}>
                  <TrendingUp className="w-5 h-5 mr-2" />{t('buttons.cashout', language)} {formatTaka(state.netAmount)}
                </Button>
              </div>
            </div>
          )}

          {(state.status === 'lost' || state.status === 'won' || state.status === 'cashed_out') && (
            <div className="space-y-4">
              <div className={cn("p-6 rounded-2xl text-center", state.status === 'lost' ? "bg-gradient-to-br from-red-500/20 to-red-700/20 border border-red-500/30" : "bg-gradient-to-br from-emerald-500/20 to-green-700/20 border border-emerald-500/30")}>
                {state.status === 'lost' ? (
                  <><Bomb className="w-16 h-16 mx-auto text-red-400 mb-3" /><p className="text-2xl font-bold text-red-400">{t('gameOver.title', language)}</p></>
                ) : (
                  <><Gem className="w-16 h-16 mx-auto text-emerald-400 mb-3" /><p className="text-2xl font-bold text-emerald-400">{state.status === 'won' ? t('gameOver.youWon', language) : t('gameOver.cashedOut', language)}</p><p className="text-3xl font-bold text-white mt-2">৳{state.netAmount.toFixed(2)}</p></>
                )}
              </div>
              <Button onClick={resetGame} className="w-full py-6 text-lg font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700">{t('buttons.playAgain', language)}</Button>
            </div>
          )}

          <MinesProvablyFairModal seedHash={state.seedHash} clientSeed={state.clientSeed} nonce={state.nonce} serverSeed={state.serverSeed} minePositions={state.minePositions} gridSize={state.gridSize} mineCount={state.mineCount} isRoundComplete={state.status === 'won' || state.status === 'lost' || state.status === 'cashed_out'} roundId={state.roundId} />
          <MinesStatsPanel />
          <MinesLeaderboard />
          <MinesHistory />
        </div>

        <HowToPlayModal open={showHowToPlay} onClose={() => setShowHowToPlay(false)} content={howToPlayContent} />
      </div>
    </PageScaffold>
    </AuthGuard>
  );
};

export default MinesGame;
