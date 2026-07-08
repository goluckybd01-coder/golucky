import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Zap, AlertTriangle, Dice1, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LiveResultControlProps {
  gameType: 'wingo' | 'k3' | '5d' | 'trxwin' | 'crash' | 'mines' | 'aviator';
  gameMode: string;
  currentTradeId?: string;
  onResultSet?: () => void;
}

const WINGO_OPTIONS = [
  { value: '0', label: '0', color: 'bg-gradient-to-r from-violet-500 to-rose-500' },
  { value: '1', label: '1', color: 'bg-emerald-500' },
  { value: '2', label: '2', color: 'bg-rose-500' },
  { value: '3', label: '3', color: 'bg-emerald-500' },
  { value: '4', label: '4', color: 'bg-rose-500' },
  { value: '5', label: '5', color: 'bg-gradient-to-r from-violet-500 to-emerald-500' },
  { value: '6', label: '6', color: 'bg-rose-500' },
  { value: '7', label: '7', color: 'bg-emerald-500' },
  { value: '8', label: '8', color: 'bg-rose-500' },
  { value: '9', label: '9', color: 'bg-emerald-500' },
];

const getResultColor = (num: number): string => {
  if (num === 0) return 'red';
  if (num === 5) return 'green';
  return num % 2 === 0 ? 'red' : 'green';
};

const LiveResultControl = ({ gameType, gameMode, currentTradeId, onResultSet }: LiveResultControlProps) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [selectedResult, setSelectedResult] = useState<string>('');
  const [k3Dice, setK3Dice] = useState<[number, number, number]>([1, 1, 1]);
  const [fiveDNumbers, setFiveDNumbers] = useState<[number, number, number, number, number]>([0, 0, 0, 0, 0]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSetResult, setLastSetResult] = useState<string | null>(null);

  useEffect(() => {
    setSelectedResult('');
    setK3Dice([1, 1, 1]);
    setFiveDNumbers([0, 0, 0, 0, 0]);
    setLastSetResult(null);
  }, [currentTradeId]);

  const handleSetResult = async () => {
    if (!currentTradeId) {
      toast.error('No active round to set result');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let result: string;
      let resultColor: string | null = null;

      if (gameType === 'wingo' || gameType === 'trxwin') {
        result = selectedResult;
        resultColor = getResultColor(parseInt(selectedResult));
      } else if (gameType === 'k3') {
        result = k3Dice.join(',');
      } else if (gameType === '5d') {
        result = fiveDNumbers.join(',');
      } else {
        result = selectedResult || 'manual';
      }

      const { data: existingRound } = await supabase
        .from('game_rounds')
        .select('id, result')
        .eq('trade_id', currentTradeId)
        .eq('game_type', gameType)
        .eq('game_mode', gameMode)
        .maybeSingle();

      if (existingRound) {
        const { error: updateError } = await supabase
          .from('game_rounds')
          .update({ result, result_color: resultColor })
          .eq('id', existingRound.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('game_rounds')
          .insert({
            trade_id: currentTradeId,
            game_type: gameType,
            game_mode: gameMode,
            result,
            result_color: resultColor,
          });
        if (insertError) throw insertError;
      }

      await supabase.from('game_admin_audit_logs').insert([{
        admin_id: user?.id || '',
        action: 'force_result',
        game_type: gameType,
        old_value: existingRound?.result ? JSON.parse(JSON.stringify({ result: existingRound.result })) : null,
        new_value: JSON.parse(JSON.stringify({
          trade_id: currentTradeId,
          game_mode: gameMode,
          result,
          result_color: resultColor,
        })),
      }]);

      setLastSetResult(result);
      toast.success(`✅ Result set successfully: ${result}`);
      setConfirmOpen(false);
      setIsEnabled(false);
      onResultSet?.();
    } catch (error) {
      console.error('Error setting result:', error);
      toast.error('Failed to set result');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderWingoSelector = () => (
    <div className="grid grid-cols-5 gap-2">
      {WINGO_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setSelectedResult(opt.value)}
          className={`h-14 rounded-lg font-bold text-xl text-white transition-all relative ${opt.color} ${selectedResult === opt.value ? 'ring-4 ring-white ring-offset-2 ring-offset-gray-900 scale-110 shadow-xl' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
        >
          {opt.label}
          {selectedResult === opt.value && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <Check className="h-3 w-3 text-gray-900" />
            </div>
          )}
        </button>
      ))}
    </div>
  );

  const renderK3Selector = () => (
    <div className="flex gap-4 justify-center">
      {[0, 1, 2].map((index) => (
        <div key={index} className="text-center">
          <Label className="text-gray-400 text-xs">Dice {index + 1}</Label>
          <Select value={k3Dice[index].toString()} onValueChange={(v) => { const newDice = [...k3Dice] as [number, number, number]; newDice[index] = parseInt(v); setK3Dice(newDice); }}>
            <SelectTrigger className="w-20 bg-gray-800 border-gray-600"><SelectValue /></SelectTrigger>
            <SelectContent>{[1,2,3,4,5,6].map((n) => (<SelectItem key={n} value={n.toString()}><span className="flex items-center gap-2"><Dice1 className="h-4 w-4" />{n}</span></SelectItem>))}</SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );

  const renderFiveDSelector = () => (
    <div className="flex gap-2 justify-center flex-wrap">
      {['A','B','C','D','E'].map((pos, index) => (
        <div key={pos} className="text-center">
          <Label className="text-gray-400 text-xs">Position {pos}</Label>
          <Select value={fiveDNumbers[index].toString()} onValueChange={(v) => { const newNumbers = [...fiveDNumbers] as [number,number,number,number,number]; newNumbers[index] = parseInt(v); setFiveDNumbers(newNumbers); }}>
            <SelectTrigger className="w-16 bg-gray-800 border-gray-600"><SelectValue /></SelectTrigger>
            <SelectContent>{[0,1,2,3,4,5,6,7,8,9].map((n) => (<SelectItem key={n} value={n.toString()}>{n}</SelectItem>))}</SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );

  const getDisplayResult = () => {
    if (gameType === 'wingo' || gameType === 'trxwin') return selectedResult;
    if (gameType === 'k3') return k3Dice.join(' - ');
    if (gameType === '5d') return fiveDNumbers.join(' ');
    return 'Live Game';
  };

  const isResultValid = () => {
    if (gameType === 'wingo' || gameType === 'trxwin') return selectedResult !== '';
    if (gameType === 'crash' || gameType === 'mines' || gameType === 'aviator') return false;
    return true;
  };
  
  const isLiveGame = gameType === 'crash' || gameType === 'mines' || gameType === 'aviator';

  if (isLiveGame) {
    return (
      <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/20 rounded-lg"><Zap className="h-5 w-5 text-blue-400" /></div>
            <div>
              <CardTitle className="text-white text-lg">{gameType.toUpperCase()} Control</CardTitle>
              <CardDescription className="text-blue-300/70">Live game - managed separately</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <p className="text-blue-300 text-sm">This is a live game with real-time results. Use the dedicated {gameType.toUpperCase()} admin panel for settings and result control.</p>
            <Button variant="outline" className="mt-3 border-blue-500/50 text-blue-400 hover:bg-blue-500/20" onClick={() => window.location.href = `/admin/${gameType}-game`}>Go to {gameType.toUpperCase()} Admin</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-500/20 rounded-lg"><Zap className="h-5 w-5 text-orange-400" /></div>
            <div>
              <CardTitle className="text-white text-lg">Live Result Control</CardTitle>
              <CardDescription className="text-orange-300/70">Force next round result</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-gray-400 text-sm">Enable</Label>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} className="data-[state=checked]:bg-orange-500" />
          </div>
        </div>
      </CardHeader>
      {isEnabled && (
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <p className="text-yellow-400 text-sm">⚠️ This will override the automatic result for the current round.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white">Current Period</Label>
              <Badge variant="outline" className="font-mono text-xs">{currentTradeId || 'Loading...'}</Badge>
            </div>
          </div>
          {lastSetResult && (
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
              <p className="text-green-400 text-sm flex items-center gap-2"><Check className="h-4 w-4" />Last set result: <span className="font-bold">{lastSetResult}</span></p>
            </div>
          )}
          <div className="space-y-3">
            <Label className="text-white">Select Result</Label>
            {gameType === 'wingo' || gameType === 'trxwin' ? renderWingoSelector() : null}
            {gameType === 'k3' ? renderK3Selector() : null}
            {gameType === '5d' ? renderFiveDSelector() : null}
          </div>
          <Button onClick={() => setConfirmOpen(true)} disabled={!isResultValid() || !currentTradeId} className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
            <Zap className="h-4 w-4 mr-2" />Set Result: {getDisplayResult() || 'Select...'}
          </Button>
        </CardContent>
      )}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-gray-900 border-orange-500/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-500" />Confirm Force Result</DialogTitle>
            <DialogDescription className="text-gray-400">This action cannot be undone. The result will be applied to the current round.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-gray-800/50 rounded-lg space-y-2">
              <div className="flex justify-between"><span className="text-gray-400">Game Type:</span><span className="text-white font-medium">{gameType.toUpperCase()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Mode:</span><span className="text-white font-medium">{gameMode}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Period:</span><span className="text-white font-mono text-sm">{currentTradeId}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-400">Result:</span><Badge className="bg-orange-500/20 text-orange-400 text-lg px-3 py-1">{getDisplayResult()}</Badge></div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="border-gray-600">Cancel</Button>
            <Button onClick={handleSetResult} disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600">
              {isSubmitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Setting...</>) : 'Confirm & Set Result'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default LiveResultControl;
