import { useState, useEffect } from "react";
import { Volume2, VolumeX, Bell, Zap, Trophy, Settings2, ChevronDown, ChevronUp, Save, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface SoundSettings {
  masterVolume: number;
  bigWinEnabled: boolean;
  bigWinThreshold: number; // Amount in currency
  milestoneEnabled: boolean;
  milestoneThresholds: number[]; // Multiplier values
  jackpotEnabled: boolean;
  jackpotMultiplier: number;
  hapticEnabled: boolean; // Haptic feedback toggle
}

const DEFAULT_SETTINGS: SoundSettings = {
  masterVolume: 0.7,
  bigWinEnabled: true,
  bigWinThreshold: 500,
  milestoneEnabled: true,
  milestoneThresholds: [2, 3, 5, 10],
  jackpotEnabled: true,
  jackpotMultiplier: 10,
  hapticEnabled: true,
};

const STORAGE_KEY = "crash_sound_settings";

interface CrashSoundSettingsProps {
  soundEnabled: boolean;
  onSoundEnabledChange: (enabled: boolean) => void;
  settings: SoundSettings;
  onSettingsChange: (settings: SoundSettings) => void;
}

export const loadSoundSettings = (): SoundSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Failed to load sound settings:", e);
  }
  return DEFAULT_SETTINGS;
};

export const saveSoundSettings = (settings: SoundSettings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

const CrashSoundSettings = ({
  soundEnabled,
  onSoundEnabledChange,
  settings,
  onSettingsChange,
}: CrashSoundSettingsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  const [customMilestone, setCustomMilestone] = useState("");

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSettingsChange(localSettings);
    saveSoundSettings(localSettings);
    toast.success("Sound settings saved!");
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS);
    onSettingsChange(DEFAULT_SETTINGS);
    saveSoundSettings(DEFAULT_SETTINGS);
    toast.success("Sound settings reset to defaults");
  };

  const addMilestone = () => {
    const value = parseFloat(customMilestone);
    if (isNaN(value) || value < 1.1 || value > 100) {
      toast.error("Enter a valid multiplier (1.1 - 100)");
      return;
    }
    if (localSettings.milestoneThresholds.includes(value)) {
      toast.error("This milestone already exists");
      return;
    }
    const newThresholds = [...localSettings.milestoneThresholds, value].sort((a, b) => a - b);
    setLocalSettings(prev => ({ ...prev, milestoneThresholds: newThresholds }));
    setCustomMilestone("");
  };

  const removeMilestone = (value: number) => {
    setLocalSettings(prev => ({
      ...prev,
      milestoneThresholds: prev.milestoneThresholds.filter(t => t !== value),
    }));
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-slate-700 hover:from-amber-500/30 hover:to-orange-500/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bell className="text-amber-400" size={18} />
          <span className="text-white font-bold">Sound Alerts</span>
          {soundEnabled ? (
            <Badge className="bg-green-500/20 text-green-400 text-xs">ON</Badge>
          ) : (
            <Badge className="bg-slate-600 text-slate-400 text-xs">OFF</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSoundEnabledChange(!soundEnabled);
            }}
            className="p-1.5 rounded-full hover:bg-slate-700 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 size={16} className="text-green-400" />
            ) : (
              <VolumeX size={16} className="text-slate-400" />
            )}
          </button>
          {isExpanded ? (
            <ChevronUp size={18} className="text-slate-400" />
          ) : (
            <ChevronDown size={18} className="text-slate-400" />
          )}
        </div>
      </button>

      {/* Quick Info */}
      <div className="grid grid-cols-3 gap-2 p-3 border-b border-slate-700/50">
        <div className="text-center">
          <p className="text-slate-500 text-xs">Big Win</p>
          <p className={`text-sm font-bold ${localSettings.bigWinEnabled ? 'text-amber-400' : 'text-slate-500'}`}>
            ৳{localSettings.bigWinThreshold}+
          </p>
        </div>
        <div className="text-center">
          <p className="text-slate-500 text-xs">Milestones</p>
          <p className={`text-sm font-bold ${localSettings.milestoneEnabled ? 'text-cyan-400' : 'text-slate-500'}`}>
            {localSettings.milestoneThresholds.length} set
          </p>
        </div>
        <div className="text-center">
          <p className="text-slate-500 text-xs">Jackpot</p>
          <p className={`text-sm font-bold ${localSettings.jackpotEnabled ? 'text-purple-400' : 'text-slate-500'}`}>
            {localSettings.jackpotMultiplier}x+
          </p>
        </div>
      </div>

      {/* Expanded Settings */}
      {isExpanded && (
        <div className="p-4 space-y-5">
          {/* Master Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                <Volume2 size={14} />
                Master Volume
              </label>
              <span className="text-slate-400 text-sm">{Math.round(localSettings.masterVolume * 100)}%</span>
            </div>
            <Slider
              value={[localSettings.masterVolume * 100]}
              onValueChange={([value]) => setLocalSettings(prev => ({ ...prev, masterVolume: value / 100 }))}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Big Win Alert */}
          <div className="space-y-3 p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                <Trophy className="text-amber-400" size={14} />
                Big Win Alert
              </label>
              <Switch
                checked={localSettings.bigWinEnabled}
                onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, bigWinEnabled: checked }))}
              />
            </div>
            {localSettings.bigWinEnabled && (
              <div className="space-y-1">
                <label className="text-slate-400 text-xs">Trigger when win exceeds:</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">৳</span>
                  <Input
                    type="number"
                    value={localSettings.bigWinThreshold}
                    onChange={(e) => setLocalSettings(prev => ({ 
                      ...prev, 
                      bigWinThreshold: Math.max(10, parseInt(e.target.value) || 10) 
                    }))}
                    className="bg-slate-700 border-slate-600 text-white h-9 flex-1"
                    min={10}
                  />
                </div>
                <p className="text-slate-500 text-xs">Plays special celebration sound for big wins</p>
              </div>
            )}
          </div>

          {/* Milestone Alerts */}
          <div className="space-y-3 p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                <Zap className="text-cyan-400" size={14} />
                Multiplier Milestones
              </label>
              <Switch
                checked={localSettings.milestoneEnabled}
                onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, milestoneEnabled: checked }))}
              />
            </div>
            {localSettings.milestoneEnabled && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {localSettings.milestoneThresholds.map((threshold) => (
                    <Badge
                      key={threshold}
                      className="bg-cyan-500/20 text-cyan-400 text-xs cursor-pointer hover:bg-red-500/20 hover:text-red-400 transition-colors"
                      onClick={() => removeMilestone(threshold)}
                    >
                      {threshold}x ×
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={customMilestone}
                    onChange={(e) => setCustomMilestone(e.target.value)}
                    placeholder="Add milestone (e.g. 7)"
                    className="bg-slate-700 border-slate-600 text-white h-8 text-sm flex-1"
                    min={1.1}
                    max={100}
                    step={0.1}
                  />
                  <Button
                    size="sm"
                    onClick={addMilestone}
                    className="bg-cyan-600 hover:bg-cyan-700 h-8 px-3"
                  >
                    Add
                  </Button>
                </div>
                <p className="text-slate-500 text-xs">Plays alert when multiplier reaches these values</p>
              </div>
            )}
          </div>

          {/* Jackpot Alert */}
          <div className="space-y-3 p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                <Zap className="text-purple-400" size={14} />
                Jackpot Alert
              </label>
              <Switch
                checked={localSettings.jackpotEnabled}
                onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, jackpotEnabled: checked }))}
              />
            </div>
            {localSettings.jackpotEnabled && (
              <div className="space-y-1">
                <label className="text-slate-400 text-xs">Trigger at multiplier:</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={localSettings.jackpotMultiplier}
                    onChange={(e) => setLocalSettings(prev => ({ 
                      ...prev, 
                      jackpotMultiplier: Math.max(2, parseFloat(e.target.value) || 10) 
                    }))}
                    className="bg-slate-700 border-slate-600 text-white h-9 flex-1"
                    min={2}
                    step={0.5}
                  />
                  <span className="text-slate-400">x</span>
                </div>
                <p className="text-slate-500 text-xs">Plays epic jackpot sound for huge multipliers</p>
              </div>
            )}
          </div>

          {/* Haptic Feedback */}
          <div className="space-y-3 p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                <Smartphone className="text-green-400" size={14} />
                Haptic Feedback
              </label>
              <Switch
                checked={localSettings.hapticEnabled}
                onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, hapticEnabled: checked }))}
              />
            </div>
            <p className="text-slate-500 text-xs">Vibration feedback on mobile during ignition, crash, and cashout</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 h-9"
            >
              Reset Defaults
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 h-9"
            >
              <Save size={14} className="mr-1" />
              Save Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrashSoundSettings;
