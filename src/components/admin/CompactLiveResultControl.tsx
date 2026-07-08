import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Zap, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface CompactLiveResultControlProps {
  gameType: 'wingo' | 'k3' | '5d' | 'trxwin';
  gameMode: string;
  currentTradeId?: string;
  onResultSet?: () => void;
}

const getResultColor = (num: number): string => {
  if (num === 0) return 'red';
  if (num === 5) return 'green';
  return num % 2 === 0 ? 'red' : 'green';
};

const numberAccent = (n: number) => {
  if (n === 0) return '#EF4444';
  if (n === 5) return '#10B981';
  return n % 2 === 0 ? '#EF4444' : '#10B981';
};

const CompactLiveResultControl = ({ 
  gameType, 
  gameMode, 
  currentTradeId, 
  onResultSet 
}: CompactLiveResultControlProps) => {
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [lastSetResult, setLastSetResult] = useState<string | null>(null);
  const [k3Dice, setK3Dice] = useState<[number, number, number]>([1, 1, 1]);
  const [fiveDNumbers, setFiveDNumbers] = useState<[number, number, number, number, number]>([0, 0, 0, 0, 0]);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<'green' | 'red' | 'violet' | null>(null);
  const [selectedSize, setSelectedSize] = useState<'big' | 'small' | null>(null);

  useEffect(() => {
    setLastSetResult(null);
    setK3Dice([1, 1, 1]);
    setFiveDNumbers([0, 0, 0, 0, 0]);
    setSelectedNumber(null);
    setSelectedColor(null);
    setSelectedSize(null);
  }, [currentTradeId]);

  const handleSetResult = useCallback(async (result: string, resultColor?: string) => {
    if (!currentTradeId) {
      toast.error('No active round');
      return;
    }

    setIsSubmitting(result);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: existingRound } = await supabase
        .from('game_rounds')
        .select('id, result')
        .eq('trade_id', currentTradeId)
        .eq('game_type', gameType)
        .eq('game_mode', gameMode)
        .maybeSingle();

      if (existingRound) {
        const { error } = await supabase
          .from('game_rounds')
          .update({ result, result_color: resultColor || null })
          .eq('id', existingRound.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('game_rounds')
          .insert({
            trade_id: currentTradeId,
            game_type: gameType,
            game_mode: gameMode,
            result,
            result_color: resultColor || null,
          });
        if (error) throw error;
      }

      await supabase.from('game_admin_audit_logs').insert([{
        admin_id: user?.id || '',
        action: 'force_result',
        game_type: gameType,
        old_value: existingRound?.result ? { result: existingRound.result } : null,
        new_value: { trade_id: currentTradeId, game_mode: gameMode, result, result_color: resultColor },
      }]);

      setLastSetResult(result);
      toast.success(`✅ Result: ${result}`);
      onResultSet?.();
    } catch (error) {
      console.error('Error setting result:', error);
      toast.error('Failed to set result');
    } finally {
      setIsSubmitting(null);
    }
  }, [currentTradeId, gameType, gameMode, onResultSet]);

  const pickNumberFor = (color: typeof selectedColor, size: typeof selectedSize): number => {
    const pool: number[] = [];
    for (let n = 0; n <= 9; n++) {
      const cc = getResultColor(n);
      const isViolet = n === 0 || n === 5;
      const isBig = n >= 5;
      if (color === 'violet' && !isViolet) continue;
      if (color === 'green' && cc !== 'green') continue;
      if (color === 'red' && cc !== 'red') continue;
      if (size === 'big' && !isBig) continue;
      if (size === 'small' && isBig) continue;
      pool.push(n);
    }
    if (!pool.length) return Math.floor(Math.random() * 10);
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const handleColorPick = (c: 'green' | 'red' | 'violet') => {
    setSelectedColor(c);
    setSelectedNumber(pickNumberFor(c, selectedSize));
  };

  const handleSizePick = (s: 'big' | 'small') => {
    setSelectedSize(s);
    setSelectedNumber(pickNumberFor(selectedColor, s));
  };

  const handleConfirm = () => {
    if (selectedNumber === null) {
      toast.error('Pick a number first');
      return;
    }
    const color = getResultColor(selectedNumber);
    handleSetResult(String(selectedNumber), color);
  };

  const handleK3DiceChange = (index: number, value: number) => {
    const newDice = [...k3Dice] as [number, number, number];
    newDice[index] = value;
    setK3Dice(newDice);
  };

  const handleK3Submit = () => {
    handleSetResult(k3Dice.join(','));
  };

  const handle5DChange = (index: number, value: number) => {
    const newNums = [...fiveDNumbers] as [number, number, number, number, number];
    newNums[index] = value;
    setFiveDNumbers(newNums);
  };

  const handle5DSubmit = () => {
    handleSetResult(fiveDNumbers.join(','));
  };

  const renderWingoSelector = () => {
    const submitting = isSubmitting !== null;
    const colorBtn = (key: 'green' | 'red' | 'violet', label: string, bg: string, glow: string) => (
      <button
        key={key}
        onClick={() => handleColorPick(key)}
        disabled={submitting || !currentTradeId}
        className={`h-[80px] rounded-xl font-bold text-base text-white uppercase tracking-wider transition-all duration-150 flex flex-col items-center justify-center gap-1
          ${bg} active:scale-95 hover:brightness-110
          ${selectedColor === key ? `ring-2 ring-white ring-offset-2 ring-offset-[#0A0E1A] shadow-[0_0_24px_${glow}]` : 'opacity-90 hover:opacity-100'}
          disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <span className="w-5 h-5 rounded-full bg-white/30 backdrop-blur-sm" />
        {label}
      </button>
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#F59E0B]" />
            <span className="text-[#F9FAFB] text-sm font-bold uppercase tracking-wider">Live Result Control</span>
          </div>
          {lastSetResult && (
            <Badge className="bg-[rgba(16,185,129,0.15)] text-[#10B981] border border-[#10B981]/40 text-xs">
              <Check className="h-3 w-3 mr-1" />
              Set: {lastSetResult}
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="space-y-2">
            <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-semibold">Color</p>
            <div className="grid grid-cols-1 gap-2">
              {colorBtn('green', 'Green', 'bg-[#10B981]', 'rgba(16,185,129,0.5)')}
              {colorBtn('red', 'Red', 'bg-[#EF4444]', 'rgba(239,68,68,0.5)')}
              {colorBtn('violet', 'Violet', 'bg-[#8B5CF6]', 'rgba(139,92,246,0.5)')}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-semibold">Number</p>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, n) => {
                const isSelected = selectedNumber === n;
                const accent = numberAccent(n);
                return (
                  <button
                    key={n}
                    onClick={() => { setSelectedNumber(n); setSelectedColor(null); setSelectedSize(null); }}
                    disabled={submitting || !currentTradeId}
                    style={{
                      borderColor: isSelected ? accent : '#1F2937',
                      boxShadow: isSelected ? `0 0 16px ${accent}55` : undefined,
                    }}
                    className={`h-[60px] rounded-lg font-bold text-xl transition-all duration-150 border-2 bg-[#0D1117]
                      ${isSelected ? 'text-white scale-105' : 'text-[#F9FAFB] hover:border-[#F59E0B] hover:text-[#F59E0B]'}
                      active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-2">Size</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleSizePick('big')} disabled={submitting || !currentTradeId}
              className={`h-12 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-150 border-2 active:scale-95
                ${selectedSize === 'big' ? 'bg-[#F59E0B] border-[#F59E0B] text-[#0A0E1A]' : 'bg-[#0D1117] border-[#1F2937] text-[#F9FAFB]'}
                disabled:opacity-40 disabled:cursor-not-allowed`}>Big</button>
            <button onClick={() => handleSizePick('small')} disabled={submitting || !currentTradeId}
              className={`h-12 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-150 border-2 active:scale-95
                ${selectedSize === 'small' ? 'bg-[#F59E0B] border-[#F59E0B] text-[#0A0E1A]' : 'bg-[#0D1117] border-[#1F2937] text-[#F9FAFB]'}
                disabled:opacity-40 disabled:cursor-not-allowed`}>Small</button>
          </div>
        </div>
        <button
          onClick={handleConfirm}
          disabled={submitting || !currentTradeId || selectedNumber === null}
          className={`w-full h-14 rounded-xl font-bold text-base uppercase tracking-[0.2em] transition-all duration-200 flex items-center justify-center gap-2
            bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FBBF24] text-[#0A0E1A]
            shadow-[0_0_24px_rgba(245,158,11,0.45)] hover:shadow-[0_0_32px_rgba(245,158,11,0.7)]
            hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]
            disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0
            ${!submitting && selectedNumber !== null ? 'animate-[pulse_2.4s_ease-in-out_infinite]' : ''}`}
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Confirm Result {selectedNumber !== null && `→ ${selectedNumber}`}
            </>
          )}
        </button>

        <p className="text-[#9CA3AF] text-[10px] text-center">
          Pick a number directly, or stage by Color / Size, then press Confirm.
        </p>
      </div>
    );
  };

  const renderK3Selector = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-white text-sm font-medium">Live Result Control</span>
        </div>
        {lastSetResult && (
          <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
            <Check className="h-3 w-3 mr-1" />
            Set: {lastSetResult}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 justify-center">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-gray-400 text-[10px]">Dice {i + 1}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => handleK3DiceChange(i, n)}
                  className={`w-6 h-6 rounded text-xs font-bold transition-all ${
                    k3Dice[i] === n
                      ? 'bg-amber-500 text-white scale-110'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button
          onClick={handleK3Submit}
          disabled={isSubmitting !== null || !currentTradeId}
          className="ml-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold disabled:opacity-30"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'SET'}
        </button>
      </div>
    </div>
  );

  const render5DSelector = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-purple-400" />
          <span className="text-white text-sm font-medium">Live Result Control</span>
        </div>
        {lastSetResult && (
          <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
            <Check className="h-3 w-3 mr-1" />
            Set: {lastSetResult}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1 justify-center flex-wrap">
        {['A', 'B', 'C', 'D', 'E'].map((pos, i) => (
          <div key={pos} className="flex flex-col items-center gap-1">
            <span className="text-gray-400 text-[10px]">{pos}</span>
            <div className="flex gap-0.5 flex-wrap justify-center">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => handle5DChange(i, n)}
                  className={`w-5 h-5 rounded text-[10px] font-bold transition-all ${
                    fiveDNumbers[i] === n
                      ? 'bg-purple-500 text-white scale-110'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button
          onClick={handle5DSubmit}
          disabled={isSubmitting !== null || !currentTradeId}
          className="ml-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-bold disabled:opacity-30"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'SET'}
        </button>
      </div>
    </div>
  );

  if (gameType === 'wingo' || gameType === 'trxwin') {
    return renderWingoSelector();
  }
  if (gameType === 'k3') {
    return renderK3Selector();
  }
  if (gameType === '5d') {
    return render5DSelector();
  }

  return null;
};

export default CompactLiveResultControl;
