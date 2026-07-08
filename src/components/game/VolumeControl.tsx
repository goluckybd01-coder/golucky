import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface VolumeControlProps {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  soundVolume: number;
  setSoundVolume: (volume: number) => void;
  buttonSize?: number;
}

const VolumeControl = ({
  soundEnabled,
  setSoundEnabled,
  soundVolume,
  setSoundVolume,
  buttonSize = 14,
}: VolumeControlProps) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => {
          if (!soundEnabled) {
            setSoundEnabled(true);
          } else {
            setShowVolumeSlider(!showVolumeSlider);
          }
        }}
        onDoubleClick={() => setSoundEnabled(!soundEnabled)}
        className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
        style={{ 
          background: soundEnabled ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)",
        }}
      >
        {soundEnabled ? (
          <Volume2 className="text-white" size={buttonSize} />
        ) : (
          <VolumeX className="text-white/60" size={buttonSize} />
        )}
      </button>
      
      {/* Volume Slider Popup */}
      {showVolumeSlider && soundEnabled && (
        <>
          {/* Click outside to close */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowVolumeSlider(false)}
          />
          
          <div 
            className="absolute top-full right-0 mt-2 p-3 rounded-xl z-50"
            style={{ 
              background: "rgba(0,0,0,0.9)", 
              backdropFilter: "blur(10px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              minWidth: 160,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="text-orange-400" size={14} />
              <span className="text-white text-xs font-medium">Volume</span>
              <span className="text-orange-400 text-xs font-bold ml-auto">{Math.round(soundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={soundVolume * 100}
              onChange={(e) => setSoundVolume(Number(e.target.value) / 100)}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #f97316 0%, #f97316 ${soundVolume * 100}%, #4b5563 ${soundVolume * 100}%, #4b5563 100%)`,
              }}
            />
            <div className="flex justify-between mt-2">
              <button
                onClick={() => setSoundEnabled(false)}
                className="text-[10px] text-gray-400 hover:text-white transition-colors"
              >
                Mute
              </button>
              <button
                onClick={() => setShowVolumeSlider(false)}
                className="text-[10px] text-orange-400 hover:text-orange-300 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VolumeControl;
