import { Menu, MessageCircle, Volume2, VolumeX } from "lucide-react";
import aviatorLogo from "@/assets/aviator-logo.png";

interface AviatorTopBarProps {
  balance: number;
  onBack: () => void;
  onSettings: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  soundVolume: number;
  setSoundVolume: (volume: number) => void;
  onChatOpen: () => void;
}

const AviatorTopBar = ({ 
  balance, 
  onSettings,
  soundEnabled,
  setSoundEnabled,
  onChatOpen,
}: AviatorTopBarProps) => {
  return (
    <div className="bg-[#0B0B0B] px-3 py-2 flex items-center justify-between">
      <style>{`
        @keyframes logoGlow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(229, 57, 53, 0.6)) drop-shadow(0 0 16px rgba(255, 100, 50, 0.3)); }
          50% { filter: drop-shadow(0 0 14px rgba(255, 100, 50, 0.8)) drop-shadow(0 0 28px rgba(255, 150, 50, 0.5)); }
        }
        .aviator-logo-glow {
          animation: logoGlow 2s ease-in-out infinite;
        }
      `}</style>
      
      <img 
        src={aviatorLogo} 
        alt="Aviator" 
        className="h-10 w-auto object-contain aviator-logo-glow"
      />
      
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-1.5 rounded-full transition-all ${
            soundEnabled 
              ? 'bg-[#2ECC71]/20 text-[#2ECC71]' 
              : 'bg-gray-700/50 text-gray-400'
          }`}
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </button>
        
        <div className="flex items-center gap-1">
          <span className="text-[#2ECC71] font-bold text-base">
            ৳{balance.toFixed(2)}
          </span>
        </div>
        
        <button 
          onClick={onSettings}
          className="p-1 hover:opacity-80 transition-opacity"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>
        
        <button 
          onClick={onChatOpen}
          className="p-1 hover:opacity-80 transition-opacity relative"
        >
          <MessageCircle className="w-6 h-6 text-gray-400" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#2ECC71] rounded-full" />
        </button>
      </div>
    </div>
  );
};

export default AviatorTopBar;
