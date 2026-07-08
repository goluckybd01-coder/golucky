import { X, RefreshCw, Volume2, Zap, Trophy, Plane } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TAKA_SYMBOL } from "@/lib/currency";
import type { AviatorSoundSettings } from "@/hooks/useAviatorSounds";

interface AviatorSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  balance: number;
  setBalance: (v: number) => void;
  houseEdge: number;
  setHouseEdge: (v: number) => void;
  roundSpeed: number;
  setRoundSpeed: (v: number) => void;
  countdownSeconds: number;
  setCountdownSeconds: (v: number) => void;
  clientSeed: string;
  setClientSeed: (v: string) => void;
  autoRun: boolean;
  setAutoRun: (v: boolean) => void;
  serverSeedHash: string;
  nonce: number;
  soundSettings?: AviatorSoundSettings;
  onSetBetVolume?: (v: number) => void;
  onSetCashoutVolume?: (v: number) => void;
  onSetCrashVolume?: (v: number) => void;
  onSetAmbientVolume?: (v: number) => void;
}

const AviatorSettingsDrawer = ({
  open,
  onClose,
  balance,
  setBalance,
  houseEdge,
  setHouseEdge,
  roundSpeed,
  setRoundSpeed,
  countdownSeconds,
  setCountdownSeconds,
  clientSeed,
  setClientSeed,
  autoRun,
  setAutoRun,
  serverSeedHash,
  nonce,
  soundSettings,
  onSetBetVolume,
  onSetCashoutVolume,
  onSetCrashVolume,
  onSetAmbientVolume,
}: AviatorSettingsDrawerProps) => {
  const generateRandomClientSeed = () => {
    const chars = 'abcdef0123456789';
    const seed = Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setClientSeed(seed);
  };
  
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="bg-[#1a1a1a] border-gray-700 text-white w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center justify-between">
            Settings
            <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
              <X className="w-5 h-5" />
            </button>
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6 pb-6">
          {soundSettings && (
            <div className="space-y-4 p-3 bg-[#2a2a2a] rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Volume2 className="w-4 h-4 text-[#2ECC71]" />
                Sound Effects
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-blue-400" />
                    <Label className="text-gray-300 text-xs">Bet Sounds</Label>
                  </div>
                  <span className="text-xs text-gray-500">{Math.round(soundSettings.betVolume * 100)}%</span>
                </div>
                <Slider
                  value={[soundSettings.betVolume * 100]}
                  onValueChange={([v]) => onSetBetVolume?.(v / 100)}
                  min={0}
                  max={100}
                  step={5}
                  className="py-1"
                />
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                    <Label className="text-gray-300 text-xs">Cashout Sounds</Label>
                  </div>
                  <span className="text-xs text-gray-500">{Math.round(soundSettings.cashoutVolume * 100)}%</span>
                </div>
                <Slider
                  value={[soundSettings.cashoutVolume * 100]}
                  onValueChange={([v]) => onSetCashoutVolume?.(v / 100)}
                  min={0}
                  max={100}
                  step={5}
                  className="py-1"
                />
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300 text-xs">Crash Sounds</Label>
                  <span className="text-xs text-gray-500">{Math.round(soundSettings.crashVolume * 100)}%</span>
                </div>
                <Slider
                  value={[soundSettings.crashVolume * 100]}
                  onValueChange={([v]) => onSetCrashVolume?.(v / 100)}
                  min={0}
                  max={100}
                  step={5}
                  className="py-1"
                />
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plane className="w-3.5 h-3.5 text-purple-400" />
                    <Label className="text-gray-300 text-xs">Ambient Sounds</Label>
                  </div>
                  <span className="text-xs text-gray-500">{Math.round(soundSettings.ambientVolume * 100)}%</span>
                </div>
                <Slider
                  value={[soundSettings.ambientVolume * 100]}
                  onValueChange={([v]) => onSetAmbientVolume?.(v / 100)}
                  min={0}
                  max={100}
                  step={5}
                  className="py-1"
                />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label className="text-gray-300">Demo Balance ({TAKA_SYMBOL})</Label>
            <Input
              type="number"
              value={balance}
              onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
              className="bg-[#2a2a2a] border-gray-600 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-gray-300">House Edge: {(houseEdge * 100).toFixed(1)}%</Label>
            <Slider
              value={[houseEdge * 100]}
              onValueChange={([v]) => setHouseEdge(v / 100)}
              min={0}
              max={10}
              step={0.5}
              className="py-2"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-gray-300">Round Speed: {roundSpeed.toFixed(1)}x</Label>
            <Slider
              value={[roundSpeed]}
              onValueChange={([v]) => setRoundSpeed(v)}
              min={0.4}
              max={2}
              step={0.1}
              className="py-2"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-gray-300">Betting Time: {countdownSeconds}s</Label>
            <Slider
              value={[countdownSeconds]}
              onValueChange={([v]) => setCountdownSeconds(v)}
              min={5}
              max={30}
              step={1}
              className="py-2"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-gray-300">Client Seed</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={clientSeed}
                onChange={(e) => setClientSeed(e.target.value)}
                className="bg-[#2a2a2a] border-gray-600 text-white flex-1"
              />
              <button
                onClick={generateRandomClientSeed}
                className="p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-gray-300">Auto Run Rounds</Label>
            <Switch checked={autoRun} onCheckedChange={setAutoRun} />
          </div>
          
          <div className="space-y-3 pt-4 border-t border-gray-700">
            <h3 className="font-semibold text-sm text-gray-300">Provably Fair</h3>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Server Seed Hash</Label>
              <p className="text-xs font-mono bg-[#2a2a2a] p-2 rounded break-all text-gray-300">
                {serverSeedHash || 'N/A'}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Current Nonce</Label>
              <p className="text-sm text-gray-300">{nonce}</p>
            </div>
          </div>
          
          <button
            onClick={() => {
              setBalance(1000);
              setHouseEdge(0.04);
              setRoundSpeed(1);
              setCountdownSeconds(10);
              generateRandomClientSeed();
            }}
            className="w-full py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition-colors"
          >
            Reset All Settings
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AviatorSettingsDrawer;
