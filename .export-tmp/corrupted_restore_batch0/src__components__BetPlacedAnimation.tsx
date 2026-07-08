import { useState, useEffect, useRef } from "react";
import { Check, Sparkles, Coins, Star } from "lucide-react";
import { formatTaka } from "@/lib/currency";

interface BetPlacedAnimationProps {
  show: boolean;
  betAmount: number;
  betType: string;
  potentialWin: number;
  onComplete: () => void;
}

const BetPlacedAnimation = ({ 
  show, 
  betAmount, 
  betType, 
  potentialWin, 
  onComplete 
}: BetPlacedAnimationProps) => {
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number; type: "coin" | "star" | "sparkle" }[]>([]);
  const onCompleteRef = useRef(onComplete);
  const hasTriggeredRef = useRef(false);
  
  // Keep callback ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (show && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      setPhase("enter");
      
      // Generate minimal celebration particles
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: 30 + Math.random() * 40,
        y: 30 + Math.random() * 40,
        delay: Math.random() * 0.1,
        type: ["coin", "star", "sparkle"][Math.floor(Math.random() * 3)] as "coin" | "star" | "sparkle",
      }));
      setParticles(newParticles);
      
      // Quick phase transitions - total ~1 second
      const showTimer = setTimeout(() => setPhase("show"), 50);
      const exitTimer = setTimeout(() => setPhase("exit"), 700);
      const completeTimer = setTimeout(() => {
        onCompleteRef.current();
      }, 1000);
      
      return () => {
        clearTimeout(showTimer);
        clearTimeout(exitTimer);
        clearTimeout(completeTimer);
      };
    } else if (!show) {
      // Reset when hidden
      hasTriggeredRef.current = false;
      setPhase("enter");
    }
  }, [show]);

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
      style={{
        background: phase === "exit" ? "transparent" : "rgba(0,0,0,0.5)",
        transition: "background 0.2s ease-out",
      }}
    >
      {/* Celebration Particles - fewer and faster */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animation: `betParticleFly 0.6s ease-out ${particle.delay}s forwards`,
            opacity: 0,
          }}
        >
          {particle.type === "coin" && (
            <Coins className="text-yellow-400" size={14} />
          )}
          {particle.type === "star" && (
            <Star className="text-orange-400 fill-orange-400" size={12} />
          )}
          {particle.type === "sparkle" && (
            <Sparkles className="text-white" size={10} />
          )}
        </div>
      ))}

      {/* Main Animation Card - compact */}
      <div
        className="relative"
        style={{
          transform: phase === "enter" 
            ? "scale(0.5) translateY(30px)" 
            : phase === "exit" 
              ? "scale(0.9) translateY(-20px)" 
              : "scale(1) translateY(0)",
          opacity: phase === "exit" ? 0 : 1,
          transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Card Content - simplified */}
        <div
          className="relative rounded-2xl px-6 py-4 text-center overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            boxShadow: "0 15px 40px -10px rgba(0,0,0,0.5), 0 0 30px rgba(34,197,94,0.3)",
            border: "2px solid rgba(34,197,94,0.5)",
            minWidth: 220,
          }}
        >
          {/* Success Checkmark - smaller */}
          <div
            className="mx-auto mb-2 w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              boxShadow: "0 4px 15px rgba(34,197,94,0.4)",
              animation: phase === "show" ? "betCheckBounce 0.3s ease-out" : "none",
            }}
          >
            <Check className="text-white" size={24} strokeWidth={3} />
          </div>

          {/* Bet Placed Text */}
          <h3 className="text-base font-bold text-white mb-2">
            Bet Placed! ✓
          </h3>

          {/* Bet Details - compact row */}
          <div className="flex gap-2 justify-center">
            <div
              className="rounded-lg px-3 py-1.5"
              style={{
                background: "rgba(249,115,22,0.2)",
                border: "1px solid rgba(249,115,22,0.3)",
              }}
            >
              <p className="text-orange-400 font-bold text-sm">{formatTaka(betAmount, 0)}</p>
            </div>
            <div
              className="rounded-lg px-3 py-1.5"
              style={{
                background: "rgba(34,197,94,0.2)",
                border: "1px solid rgba(34,197,94,0.3)",
              }}
            >
              <p className="text-green-400 font-bold text-sm">→ {formatTaka(potentialWin, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations - faster */}
      <style>{`
        @keyframes betParticleFly {
          0% {
            opacity: 0;
            transform: scale(0) translateY(0);
          }
          30% {
            opacity: 1;
            transform: scale(1) translateY(-10px);
          }
          100% {
            opacity: 0;
            transform: scale(0.3) translateY(-60px) rotate(180deg);
          }
        }

        @keyframes betCheckBounce {
          0% {
            transform: scale(0);
          }
          60% {
            transform: scale(1.15);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default BetPlacedAnimation;
