import { useState, useEffect } from "react";
import { Minus, Plus, Play, Square, RotateCcw, Maximize2, Star, X, Zap, ChevronsUp, TrendingUp, AlertTriangle } from "lucide-react";
import { formatTaka } from "@/lib/currency";
import type { RoundPhase, BetState } from "@/pages/games/AviatorGame";
import { haptic } from "@/lib/haptics";

interface AviatorBetPanelProps {
  panelId: 1 | 2;
  phase: RoundPhase;
  bet: BetState;
  multiplier: number;
  onPlaceBet: () => void;
  onCancelBet: () => void;
  onCashout: () => void;
  onUpdateStake: (value: number) => void;
  onUpdateAuto: (settings: Partial<BetState>) => void;
}

const DEFAULT_QUICK_AMOUNTS = [100, 200, 500, 1000];
const MAX_PRESETS = 8;

const AviatorBetPanel = ({
  panelId,
  phase,
  bet,
  multiplier,
  onPlaceBet,
  onCancelBet,
  onCashout,
  onUpdateStake,
  onUpdateAuto,
}: AviatorBetPanelProps) => {
  const [activeTab, setActiveTab] = useState<'bet' | 'auto'>('bet');
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  
  // Track last used stake for quick bet
  const [lastUsedStake, setLastUsedStake] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`aviator_last_stake_${panelId}`);
      if (saved) return parseFloat(saved);
    } catch {}
    return 100;
  });
  
  // Update last used stake when bet is placed
  useEffect(() => {
    if (bet.isPlaced && bet.stake > 0) {
      setLastUsedStake(bet.stake);
      localStorage.setItem(`aviator_last_stake_${panelId}`, bet.stake.toString());
    }
  }, [bet.isPlaced, bet.stake, panelId]);
  
  // Track if last round was a win for double-down feature
  const [lastRoundWasWin, setLastRoundWasWin] = useState(false);
  
  // Detect win when phase transitions from CRASHED after a cashout
  useEffect(() => {
    if (phase === "CRASHED" && bet.isCashedOut && bet.cashoutMultiplier) {
      setLastRoundWasWin(true);
    } else if (phase === "WAITING" && bet.isPlaced) {
      // Reset when a new bet is placed
      setLastRoundWasWin(false);
    }
  }, [phase, bet.isCashedOut, bet.cashoutMultiplier, bet.isPlaced]);
  
  // Quick bet handler
  const handleQuickBet = () => {
    if (phase !== "WAITING" || bet.isPlaced) return;
    // Set stake to last used amount and place bet
    onUpdateStake(lastUsedStake);
    // Small delay to ensure stake is updated before placing bet
    setTimeout(() => {
      onPlaceBet();
      haptic('success');
    }, 10);
  };
  
  // Double-down handler - doubles the stake after a win
  const handleDoubleDown = () => {
    if (phase !== "WAITING" || bet.isPlaced) return;
    const doubledStake = bet.stake * 2;
    onUpdateStake(doubledStake);
    haptic('success');
    setLastRoundWasWin(false); // Reset after using
  };
  
  // Load saved presets from localStorage
  const [customPresets, setCustomPresets] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(`aviator_presets_${panelId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  
  // Save presets to localStorage
  useEffect(() => {
    localStorage.setItem(`aviator_presets_${panelId}`, JSON.stringify(customPresets));
  }, [customPresets, panelId]);
  
  // Combined quick amounts: defaults + custom presets
  const allQuickAmounts = [...new Set([...DEFAULT_QUICK_AMOUNTS, ...customPresets])].sort((a, b) => a - b);
  
  // Add current stake as preset
  const addPreset = () => {
    if (customPresets.length >= MAX_PRESETS) return;
    if (customPresets.includes(bet.stake) || DEFAULT_QUICK_AMOUNTS.includes(bet.stake)) return;
    setCustomPresets(prev => [...prev, bet.stake].sort((a, b) => a - b));
    setShowPresetMenu(false);
  };
  
  // Remove a custom preset
  const removePreset = (amount: number) => {
    setCustomPresets(prev => prev.filter(a => a !== amount));
  };
  
  // Check if amount is a custom preset
  const isCustomPreset = (amount: number) => customPresets.includes(amount);
  
  const potentialWin = bet.stake * multiplier;
  
  // Start auto-play
  const handleStartAutoPlay = () => {
    onUpdateAuto({
      autoPlayEnabled: true,
      autoPlayRoundsRemaining: bet.autoPlayRounds,
      autoPlayProfit: 0,
      autoBet: true,
    });
    if (phase === "WAITING" && !bet.isPlaced) {
      onPlaceBet();
    }
  };
  
  // Stop auto-play
  const handleStopAutoPlay = () => {
    onUpdateAuto({
      autoPlayEnabled: false,
      autoPlayRoundsRemaining: 0,
      autoBet: false,
    });
  };
  
  // Determine button state and text - matching reference exactly
  const getButtonContent = () => {
    if (phase === "CRASHED") {
      if (bet.isCashedOut && bet.cashoutMultiplier) {
        return {
          text: `WON ${bet.cashoutMultiplier.toFixed(2)}x`,
          subtext: formatTaka(bet.stake * bet.cashoutMultiplier),
          color: 'bg-[#2ECC71]',
          disabled: true,
        };
      }
      if (bet.isPlaced) {
        return {
          text: 'LOST',
          subtext: formatTaka(bet.stake),
          color: 'bg-red-500',
          disabled: true,
        };
      }
      return {
        text: 'WAITING',
        subtext: '',
        color: 'bg-gray-600',
        disabled: true,
      };
    }
    
    if (phase === "RUNNING") {
      if (bet.isCashedOut && bet.cashoutMultiplier) {
        return {
          text: `CASHED OUT`,
          subtext: `${bet.cashoutMultiplier.toFixed(2)}x`,
          color: 'bg-gray-600',
          disabled: true,
        };
      }
      if (bet.isPlaced) {
        return {
          text: 'CASHOUT',
          subtext: formatTaka(potentialWin),
          color: 'bg-orange-500 hover:bg-orange-400',
          disabled: false,
          action: onCashout,
          isPulsing: true,
        };
      }
      return {
        text: 'WAITING',
        subtext: 'Next round',
        color: 'bg-gray-600',
        disabled: true,
      };
    }
    
    // WAITING phase
    if (bet.isPlaced) {
      return {
        text: 'CANCEL',
        subtext: formatTaka(bet.stake),
        color: 'bg-red-500 hover:bg-red-400',
        disabled: false,
        action: onCancelBet,
      };
    }
    
    return {
      text: 'Bet',
      subtext: `৳${bet.stake.toFixed(2)}`,
      color: 'bg-[#2ECC71] hover:bg-[#27AE60]',
      disabled: false,
      action: onPlaceBet,
    };
  };
  
  const buttonState = getButtonContent();
  
  return (
    <div className="bg-[#141414] rounded-2xl p-3 border border-white/10 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.9)]">
      {/* Tabs with expand button for panel 2 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 flex bg-[#0f0f0f] rounded-full p-0.5 border border-white/10">
          <button
            onClick={() => setActiveTab('bet')}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'bet'
                ? 'bg-[#2a2a2a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Bet
          </button>
          <button
            onClick={() => setActiveTab('auto')}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'auto'
                ? 'bg-[#2a2a2a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Auto
          </button>
        </div>
        {panelId === 2 && (
          <button className="p-2 bg-[#0f0f0f] rounded-xl text-gray-400 hover:text-white transition-colors border border-white/10">
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {activeTab === 'bet' ? (
        <div className="flex gap-3">
          {/* Stake controls - left side */}
          <div className="flex-1 space-y-2">
            {/* Stake input row with -/+ buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onUpdateStake(Math.max(1, bet.stake - 10))}
                className="w-10 h-10 rounded-xl bg-[#0f0f0f] hover:bg-[#1b1b1b] transition-colors disabled:opacity-50 flex items-center justify-center border border-white/10"
                disabled={bet.isPlaced || bet.autoPlayEnabled}
              >
                <Minus className="w-5 h-5 text-gray-300" />
              </button>
              <div className="flex-1 text-center">
                <div className="text-[10px] uppercase tracking-wider text-gray-400">Bet Amount</div>
                <div className="text-white font-extrabold text-2xl leading-tight tabular-nums">
                  {bet.stake.toFixed(2)}
                </div>
                <div className="text-[10px] text-gray-500">BDT</div>
              </div>
              <button
                onClick={() => onUpdateStake(bet.stake + 10)}
                className="w-10 h-10 rounded-xl bg-[#0f0f0f] hover:bg-[#1b1b1b] transition-colors disabled:opacity-50 flex items-center justify-center border border-white/10"
                disabled={bet.isPlaced || bet.autoPlayEnabled}
              >
                <Plus className="w-5 h-5 text-gray-300" />
              </button>
            </div>
            
            {/* Quick amounts grid with presets */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-4 gap-1">
                {allQuickAmounts.slice(0, 8).map((amount) => (
                  <button
                    key={amount}
                    onClick={() => onUpdateStake(amount)}
                    className={`relative py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 border ${
                      bet.stake === amount 
                        ? 'bg-[#2ECC71]/20 border-[#2ECC71]/50 text-[#2ECC71]' 
                        : 'bg-[#0f0f0f] border-white/10 text-gray-300 hover:bg-[#1b1b1b] hover:text-white'
                    } ${isCustomPreset(amount) ? 'pr-4' : ''}`}
                    disabled={bet.isPlaced || bet.autoPlayEnabled}
                  >
                    {amount >= 1000 ? `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K` : amount}
                    {isCustomPreset(amount) && (
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          removePreset(amount);
                        }}
                        className="absolute top-0.5 right-0.5 w-3 h-3 flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Save preset button */}
              <button
                onClick={addPreset}
                disabled={
                  bet.isPlaced || 
                  bet.autoPlayEnabled || 
                  customPresets.length >= MAX_PRESETS ||
                  customPresets.includes(bet.stake) ||
                  DEFAULT_QUICK_AMOUNTS.includes(bet.stake)
                }
                className="w-full py-1.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#0f0f0f] border border-dashed border-white/15 text-gray-400 hover:bg-[#1b1b1b] hover:text-white hover:border-[#2ECC71]/50 flex items-center justify-center gap-1"
              >
                <Star className="w-3 h-3" />
                Save ৳{bet.stake.toLocaleString()} as preset
              </button>
            </div>
          </div>
          
          {/* Main action buttons - right side */}
          <div className="flex flex-col gap-2">
            {/* Main bet/cashout button */}
            <button
              onClick={buttonState.action}
              disabled={buttonState.disabled}
              className={`w-40 h-20 rounded-2xl font-bold text-white flex flex-col items-center justify-center transition-all relative overflow-hidden ${buttonState.color} ${buttonState.disabled ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'} ${'isPulsing' in buttonState && buttonState.isPulsing ? 'animate-cashout-pulse' : ''} shadow-[0_10px_25px_-15px_rgba(0,0,0,0.8)]`}
            >
              {'isPulsing' in buttonState && buttonState.isPulsing && (
                <>
                  <span className="absolute inset-0 rounded-xl bg-orange-400 animate-ping opacity-20" />
                  <span className="absolute inset-0 bg-gradient-to-t from-orange-600/30 to-transparent" />
                </>
              )}
              <span className="text-2xl font-extrabold relative z-10 tracking-wide">{buttonState.text}</span>
              {buttonState.subtext && (
                <span className="text-base font-semibold relative z-10 opacity-90 tabular-nums">{buttonState.subtext}</span>
              )}
            </button>
            
            {/* Quick bet & Double-down buttons - only show when not placed and in waiting phase */}
            {phase === "WAITING" && !bet.isPlaced && !bet.autoPlayEnabled && (
              <div className="flex gap-1.5">
                {/* Double-down button - show after a win */}
                {lastRoundWasWin && (
                  <button
                    onClick={handleDoubleDown}
                    className="flex-1 h-10 rounded-2xl font-bold text-white flex items-center justify-center gap-1 transition-all relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 active:scale-[0.98] shadow-lg shadow-purple-500/30"
                  >
                    <ChevronsUp className="w-4 h-4" />
                    <span className="text-xs font-bold">2X</span>
                  </button>
                )}
                {/* Quick bet button */}
                <button
                  onClick={handleQuickBet}
                  className={`${lastRoundWasWin ? 'flex-1' : 'w-40'} h-10 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98] shadow-lg shadow-orange-500/30`}
                >
                  <Zap className="w-4 h-4" fill="currentColor" />
                  <span className="text-sm font-bold">{lastRoundWasWin ? `৳${lastUsedStake.toLocaleString()}` : `Quick ৳${lastUsedStake.toLocaleString()}`}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Martingale Mode Toggle */}
          <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-lg p-2.5 border border-purple-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 text-sm font-medium">Martingale Mode</span>
              </div>
              <button
                onClick={() => {
                  if (!bet.martingaleEnabled) {
                    // Enable: set base stake to current stake
                    onUpdateAuto({ 
                      martingaleEnabled: true, 
                      martingaleBaseStake: bet.stake,
                      martingaleLossCount: 0 
                    });
                  } else {
                    // Disable
                    onUpdateAuto({ 
                      martingaleEnabled: false,
                      martingaleLossCount: 0 
                    });
                  }
                  haptic('light');
                }}
                disabled={bet.autoPlayEnabled}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  bet.martingaleEnabled ? 'bg-purple-500' : 'bg-gray-600'
                } disabled:opacity-50`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  bet.martingaleEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
            
            {bet.martingaleEnabled && (
              <div className="mt-2 space-y-2">
                {/* Base stake display */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Base Stake:</span>
                  <span className="text-white font-medium">{formatTaka(bet.martingaleBaseStake)}</span>
                </div>
                
                {/* Current multiplier after losses */}
                {bet.martingaleLossCount > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-orange-400">Current ({bet.martingaleLossCount}x doubled):</span>
                    <span className="text-orange-300 font-bold">{formatTaka(bet.stake)}</span>
                  </div>
                )}
                
                {/* Max doubles selector */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">Max Doubles:</span>
                  <div className="flex items-center gap-1">
                    {[3, 4, 5, 6, 7].map((maxD) => (
                      <button
                        key={maxD}
                        onClick={() => onUpdateAuto({ martingaleMaxDoubles: maxD })}
                        disabled={bet.autoPlayEnabled}
                        className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
                          bet.martingaleMaxDoubles === maxD
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        } disabled:opacity-50`}
                      >
                        {maxD}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Max stake warning */}
                <div className="flex items-center gap-1.5 text-[10px] text-yellow-500/80 bg-yellow-900/20 rounded px-2 py-1">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  <span>Max stake: {formatTaka(bet.martingaleBaseStake * Math.pow(2, bet.martingaleMaxDoubles))}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Auto-play status bar */}
          {bet.autoPlayEnabled && (
            <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-lg p-2 border border-green-700/50">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 font-medium">Auto-playing</span>
                </div>
                <span className="text-gray-300">
                  {bet.autoPlayRoundsRemaining} / {bet.autoPlayRounds} rounds
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-gray-400 text-xs">Session P/L:</span>
                <span className={`text-sm font-bold ${bet.autoPlayProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {bet.autoPlayProfit >= 0 ? '+' : ''}{formatTaka(bet.autoPlayProfit)}
                </span>
              </div>
            </div>
          )}
          
          {/* Number of rounds */}
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Rounds</span>
            <div className="flex items-center gap-1">
              {[5, 10, 25, 50, 100].map((rounds) => (
                <button
                  key={rounds}
                  onClick={() => onUpdateAuto({ autoPlayRounds: rounds })}
                  disabled={bet.autoPlayEnabled}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    bet.autoPlayRounds === rounds
                      ? 'bg-[#2ECC71] text-white'
                      : 'bg-[#2d2d2d] text-gray-400 hover:bg-[#3d3d3d]'
                  } disabled:opacity-50`}
                >
                  {rounds}
                </button>
              ))}
            </div>
          </div>
          
          {/* Auto cashout */}
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Auto Cashout</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="1.01"
                value={bet.autoCashout || ''}
                onChange={(e) => onUpdateAuto({ autoCashout: parseFloat(e.target.value) || null })}
                placeholder="1.50"
                disabled={bet.autoPlayEnabled}
                className="w-16 px-2 py-1 bg-[#2d2d2d] rounded-lg text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#2ECC71] border border-gray-700 disabled:opacity-50"
              />
              <span className="text-gray-400 text-sm">x</span>
            </div>
          </div>
          
          {/* Stop conditions */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-400 text-xs">Stop if Win ≥</span>
              <input
                type="number"
                min="0"
                value={bet.stopOnWin || ''}
                onChange={(e) => onUpdateAuto({ stopOnWin: parseFloat(e.target.value) || null })}
                placeholder="0"
                disabled={bet.autoPlayEnabled}
                className="w-full mt-1 px-2 py-1.5 bg-[#2d2d2d] rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#2ECC71] border border-gray-700 disabled:opacity-50"
              />
            </div>
            <div>
              <span className="text-gray-400 text-xs">Stop if Loss ≥</span>
              <input
                type="number"
                min="0"
                value={bet.stopOnLoss || ''}
                onChange={(e) => onUpdateAuto({ stopOnLoss: parseFloat(e.target.value) || null })}
                placeholder="0"
                disabled={bet.autoPlayEnabled}
                className="w-full mt-1 px-2 py-1.5 bg-[#2d2d2d] rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500 border border-gray-700 disabled:opacity-50"
              />
            </div>
          </div>
          
          {/* On Win/Loss actions */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#2d2d2d] rounded-lg p-2 border border-gray-700">
              <span className="text-green-400 text-xs font-medium">On Win</span>
              <div className="flex gap-1 mt-1">
                <button
                  onClick={() => onUpdateAuto({ onWinAction: 'reset' })}
                  disabled={bet.autoPlayEnabled}
                  className={`flex-1 py-1 text-[10px] rounded transition-colors ${
                    bet.onWinAction === 'reset' ? 'bg-[#2ECC71] text-white' : 'bg-gray-700 text-gray-400'
                  } disabled:opacity-50`}
                >
                  <RotateCcw className="w-3 h-3 mx-auto" />
                </button>
                <button
                  onClick={() => onUpdateAuto({ onWinAction: 'increase' })}
                  disabled={bet.autoPlayEnabled}
                  className={`flex-1 py-1 text-[10px] rounded transition-colors ${
                    bet.onWinAction === 'increase' ? 'bg-[#2ECC71] text-white' : 'bg-gray-700 text-gray-400'
                  } disabled:opacity-50`}
                >
                  +%
                </button>
              </div>
              {bet.onWinAction === 'increase' && (
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={bet.onWinPercent || ''}
                  onChange={(e) => onUpdateAuto({ onWinPercent: parseFloat(e.target.value) || 0 })}
                  placeholder="%"
                  disabled={bet.autoPlayEnabled}
                  className="w-full mt-1 px-2 py-1 bg-gray-700 rounded text-white text-xs focus:outline-none disabled:opacity-50"
                />
              )}
            </div>
            <div className="bg-[#2d2d2d] rounded-lg p-2 border border-gray-700">
              <span className="text-red-400 text-xs font-medium">On Loss</span>
              <div className="flex gap-1 mt-1">
                <button
                  onClick={() => onUpdateAuto({ onLossAction: 'reset' })}
                  disabled={bet.autoPlayEnabled}
                  className={`flex-1 py-1 text-[10px] rounded transition-colors ${
                    bet.onLossAction === 'reset' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'
                  } disabled:opacity-50`}
                >
                  <RotateCcw className="w-3 h-3 mx-auto" />
                </button>
                <button
                  onClick={() => onUpdateAuto({ onLossAction: 'increase' })}
                  disabled={bet.autoPlayEnabled}
                  className={`flex-1 py-1 text-[10px] rounded transition-colors ${
                    bet.onLossAction === 'increase' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'
                  } disabled:opacity-50`}
                >
                  +%
                </button>
              </div>
              {bet.onLossAction === 'increase' && (
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={bet.onLossPercent || ''}
                  onChange={(e) => onUpdateAuto({ onLossPercent: parseFloat(e.target.value) || 0 })}
                  placeholder="%"
                  disabled={bet.autoPlayEnabled}
                  className="w-full mt-1 px-2 py-1 bg-gray-700 rounded text-white text-xs focus:outline-none disabled:opacity-50"
                />
              )}
            </div>
          </div>
          
          {/* Start/Stop Auto-play button */}
          {bet.autoPlayEnabled ? (
            <button
              onClick={handleStopAutoPlay}
              className="w-full py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Square className="w-4 h-4" />
              STOP AUTO-PLAY
            </button>
          ) : (
            <button
              onClick={handleStartAutoPlay}
              disabled={!bet.autoCashout || bet.autoCashout < 1.01}
              className="w-full py-3 rounded-xl font-bold text-white bg-[#2ECC71] hover:bg-[#27AE60] disabled:bg-gray-600 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              START AUTO-PLAY ({bet.autoPlayRounds} rounds)
            </button>
          )}
          
          {!bet.autoCashout && (
            <p className="text-yellow-500 text-xs text-center">
              ⚠️ Set auto cashout to enable auto-play
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AviatorBetPanel;
