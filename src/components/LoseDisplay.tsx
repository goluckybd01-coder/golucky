import { useEffect, useState, useRef } from "react";
import { Frown } from "lucide-react";

interface LoseDisplayProps {
  show: boolean;
  onComplete?: () => void;
  onShow?: () => void;
}

const LoseDisplay = ({ show, onComplete, onShow }: LoseDisplayProps) => {
  const [visible, setVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<"enter" | "hold" | "exit">("enter");
  const hasCalledOnShow = useRef(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setAnimationPhase("enter");
      hasCalledOnShow.current = false;
      
      if (onShow) {
        hasCalledOnShow.current = true;
        onShow();
      }
      
      const holdTimer = setTimeout(() => setAnimationPhase("hold"), 400);
      const exitTimer = setTimeout(() => setAnimationPhase("exit"), 2400);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        hasCalledOnShow.current = false;
        onComplete?.();
      }, 3000);
      
      return () => {
        clearTimeout(holdTimer);
        clearTimeout(exitTimer);
        clearTimeout(hideTimer);
      };
    } else if (!show) {
      setVisible(false);
      setAnimationPhase("enter");
      hasCalledOnShow.current = false;
    }
  }, [show, onComplete, onShow]);

  if (!visible) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      style={{
        background: animationPhase === "exit" 
          ? "transparent" 
          : "radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, transparent 60%)",
        transition: "background 0.4s ease-out",
      }}
    >
      <div className="absolute">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${120 + i * 50}px`,
              height: `${120 + i * 50}px`,
              left: `${-(60 + i * 25)}px`,
              top: `${-(60 + i * 25)}px`,
              background: `radial-gradient(circle, transparent 60%, rgba(107, 114, 128, ${0.15 - i * 0.05}) 100%)`,
              animation: animationPhase === "enter" 
                ? `ring-expand-lose 0.5s ease-out ${i * 0.1}s forwards`
                : animationPhase === "exit"
                ? `ring-fade-lose 0.4s ease-out forwards`
                : "none",
              opacity: animationPhase === "exit" ? 0 : 1,
              transform: animationPhase === "enter" ? "scale(0)" : "scale(1)",
            }}
          />
        ))}
      </div>

      <div
        className="relative flex flex-col items-center"
        style={{
          animation: animationPhase === "enter" 
            ? "lose-smooth-enter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
            : animationPhase === "hold"
            ? "lose-subtle-shake 0.6s ease-in-out"
            : "lose-smooth-exit 0.5s ease-out forwards",
        }}
      >
        <div 
          className="mb-4"
          style={{
            animation: animationPhase === "enter" 
              ? "icon-smooth-drop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
              : "none",
          }}
        >
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #9ca3af 0%, #6b7280 40%, #4b5563 100%)",
              boxShadow: "0 8px 32px rgba(107, 114, 128, 0.5), inset 0 -3px 8px rgba(0,0,0,0.2), inset 0 3px 8px rgba(255,255,255,0.1)",
            }}
          >
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)" }} />
            <Frown className="text-white relative z-10" size={38} style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))" }} />
          </div>
        </div>

        <div 
          className="text-center px-8 py-4 rounded-2xl relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(0, 0, 0, 0.75) 0%, rgba(31, 41, 55, 0.85) 100%)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(107, 114, 128, 0.3)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            animation: animationPhase === "enter" ? "card-smooth-slide 0.5s ease-out 0.2s forwards" : "none",
            opacity: animationPhase === "enter" ? 0 : 1,
          }}
        >
          <p className="text-xl font-bold text-white mb-1" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.4)" }}>
            😔 Better Luck Next Time!
          </p>
          <p className="text-sm text-gray-300 font-medium">Don't give up, try again!</p>
          <div className="mt-3 pt-3 border-t border-gray-600/50">
            <p className="text-xs text-gray-400">🍀 Good luck on your next bet!</p>
          </div>
        </div>

        {animationPhase !== "exit" && (
          [...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: `rgba(156, 163, 175, ${0.4 + Math.random() * 0.3})`,
                top: "-30px",
                left: `${15 + i * 10}%`,
                animation: `particle-smooth-fall 2s ease-in infinite ${i * 0.2}s`,
              }}
            />
          ))
        )}
      </div>

      <style>{`
        @keyframes lose-smooth-enter { 0% { opacity: 0; transform: scale(0.8) translateY(30px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes lose-smooth-exit { 0% { opacity: 1; transform: scale(1) translateY(0); } 100% { opacity: 0; transform: scale(0.85) translateY(-30px); } }
        @keyframes lose-subtle-shake { 0%, 100% { transform: translateX(0); } 15% { transform: translateX(-4px); } 30% { transform: translateX(4px); } 45% { transform: translateX(-3px); } 60% { transform: translateX(3px); } 75% { transform: translateX(-2px); } 90% { transform: translateX(2px); } }
        @keyframes icon-smooth-drop { 0% { transform: translateY(-40px) scale(0) rotate(-10deg); opacity: 0; } 60% { transform: translateY(8px) scale(1.1) rotate(5deg); opacity: 1; } 100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; } }
        @keyframes card-smooth-slide { 0% { opacity: 0; transform: translateY(20px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes particle-smooth-fall { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 10% { opacity: 0.6; } 100% { transform: translateY(150px) rotate(360deg); opacity: 0; } }
        @keyframes ring-expand-lose { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes ring-fade-lose { 0% { opacity: 0.15; } 100% { opacity: 0; } }
      `}</style>
    </div>
  );
};

export default LoseDisplay;
