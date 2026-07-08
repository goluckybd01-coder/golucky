/**
 * SUSPENSE REVEAL ANIMATION
 * 
 * Dramatic build-up animation before revealing game results.
 * Features:
 * - Pulsing glow effect
 * - Rotating spotlight
 * - Tension-building shake
 * - Number/Dice scramble effect
 * - Explosive reveal transition
 * - Drum roll and reveal sounds
 */

import React, { useEffect, useState, useRef } from "react";

interface SuspenseRevealProps {
  isActive: boolean;
  gameType: "number" | "dice";
  finalNumber?: number;
  finalDice?: [number, number, number];
  onRevealComplete: () => void;
  duration?: number; // Total reveal duration in ms
  // Sound callbacks
  onPlayDrumRoll?: (duration: number) => void;
  onPlayRevealClimax?: () => void;
}

// Scrambling number display
const ScrambleNumber = ({ finalNumber, phase }: { finalNumber: number; phase: "scramble" | "slow" | "final" }) => {
  const [displayNum, setDisplayNum] = useState(Math.floor(Math.random() * 10));
  
  useEffect(() => {
    if (phase === "final") {
      setDisplayNum(finalNumber);
      return;
    }
    
    const speed = phase === "scramble" ? 50 : 120;
    const interval = setInterval(() => {
      setDisplayNum(Math.floor(Math.random() * 10));
    }, speed);
    
    return () => clearInterval(interval);
  }, [phase, finalNumber]);
  
  return (
    <span 
      className="text-6xl font-black"
      style={{
        textShadow: phase === "final" 
          ? "0 0 30px rgba(255,215,0,0.8), 0 4px 12px rgba(0,0,0,0.4)"
          : "0 2px 8px rgba(0,0,0,0.4)",
        transition: "all 0.15s ease-out",
      }}
    >
      {displayNum}
    </span>
  );
};

// Scrambling dice display
const ScrambleDice = ({ 
  finalDice, 
  phase, 
  index 
}: { 
  finalDice: number; 
  phase: "scramble" | "slow" | "final"; 
  index: number;
}) => {
  const [displayValue, setDisplayValue] = useState(Math.ceil(Math.random() * 6));
  
  useEffect(() => {
    if (phase === "final") {
      // Staggered reveal for each dice
      const delay = index * 200;
      const timer = setTimeout(() => setDisplayValue(finalDice), delay);
      return () => clearTimeout(timer);
    }
    
    const speed = phase === "scramble" ? 80 : 150;
    const interval = setInterval(() => {
      setDisplayValue(Math.ceil(Math.random() * 6));
    }, speed);
    
    return () => clearInterval(interval);
  }, [phase, finalDice, index]);
  
  const dotPositions: Record<number, number[][]> = {
    1: [[50, 50]],
    2: [[30, 30], [70, 70]],
    3: [[30, 30], [50, 50], [70, 70]],
    4: [[30, 30], [70, 30], [30, 70], [70, 70]],
    5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
    6: [[30, 30], [70, 30], [30, 50], [70, 50], [30, 70], [70, 70]],
  };
  
  const dots = dotPositions[displayValue] || dotPositions[1];
  const size = 56;
  const dotSize = size * 0.18;
  
  return (
    <div
      style={{
        width: size,
        height: size,
        background: phase === "final"
          ? "linear-gradient(145deg, #ef4444 0%, #dc2626 40%, #b91c1c 100%)"
          : "linear-gradient(145deg, #94a3b8 0%, #64748b 50%, #475569 100%)",
        borderRadius: size * 0.2,
        position: "relative",
        boxShadow: phase === "final"
          ? "0 0 20px rgba(239,68,68,0.5), 0 4px 12px rgba(0,0,0,0.4)"
          : "0 2px 8px rgba(0,0,0,0.3)",
        transform: phase === "scramble" 
          ? `rotate(${(Math.random() - 0.5) * 20}deg) scale(${0.95 + Math.random() * 0.1})`
          : "rotate(0deg) scale(1)",
        transition: phase === "final" ? "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
        animation: phase === "final" ? `diceReveal 0.4s ease-out ${index * 0.2}s both` : undefined,
      }}
    >
      {dots.map((pos, idx) => (
        <div
          key={idx}
          style={{
            position: "absolute",
            left: `${pos[0]}%`,
            top: `${pos[1]}%`,
            transform: "translate(-50%, -50%)",
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            background: phase === "final"
              ? "linear-gradient(145deg, #fef08a 0%, #facc15 100%)"
              : "linear-gradient(145deg, #e5e7eb 0%, #d1d5db 100%)",
            boxShadow: "inset 0 -1px 2px rgba(0,0,0,0.2)",
          }}
        />
      ))}
    </div>
  );
};

const SuspenseReveal: React.FC<SuspenseRevealProps> = ({
  isActive,
  gameType,
  finalNumber = 0,
  finalDice = [1, 1, 1],
  onRevealComplete,
  duration = 2000,
  onPlayDrumRoll,
  onPlayRevealClimax,
}) => {
  const [phase, setPhase] = useState<"idle" | "buildup" | "scramble" | "slow" | "final" | "explode">("idle");
  const [intensity, setIntensity] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onRevealComplete);
  const soundPlayedRef = useRef(false);
  
  useEffect(() => {
    onCompleteRef.current = onRevealComplete;
  }, [onRevealComplete]);
  
  useEffect(() => {
    if (!isActive) {
      setPhase("idle");
      setIntensity(0);
      soundPlayedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }
    
    // Play drum roll sound at the start
    if (!soundPlayedRef.current && onPlayDrumRoll) {
      soundPlayedRef.current = true;
      onPlayDrumRoll(duration);
    }
    
    // Phase 1: Build-up (0-30%)
    setPhase("buildup");
    setIntensity(0.3);
    
    timerRef.current = setTimeout(() => {
      // Phase 2: Scramble (30-60%)
      setPhase("scramble");
      setIntensity(0.6);
      
      timerRef.current = setTimeout(() => {
        // Phase 3: Slow down (60-80%)
        setPhase("slow");
        setIntensity(0.8);
        
        timerRef.current = setTimeout(() => {
          // Phase 4: Final reveal (80-95%)
          setPhase("final");
          setIntensity(1);
          
          // Play reveal climax sound
          if (onPlayRevealClimax) {
            onPlayRevealClimax();
          }
          
          timerRef.current = setTimeout(() => {
            // Phase 5: Explode and complete
            setPhase("explode");
            
            timerRef.current = setTimeout(() => {
              onCompleteRef.current();
            }, 300);
          }, duration * 0.15);
        }, duration * 0.2);
      }, duration * 0.3);
    }, duration * 0.3);
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isActive, duration, onPlayDrumRoll, onPlayRevealClimax]);
  
  if (!isActive || phase === "idle") return null;
  
  const displayPhase = phase === "buildup" || phase === "explode" ? "scramble" : phase;
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[120]"
      style={{ 
        background: `rgba(0,0,0,${0.6 + intensity * 0.2})`,
        backdropFilter: `blur(${4 + intensity * 4}px)`,
      }}
    >
      {/* Rotating spotlight effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `conic-gradient(from ${Date.now() / 20}deg at 50% 50%, 
            transparent 0deg, 
            rgba(251,191,36,${0.1 * intensity}) 30deg, 
            transparent 60deg,
            rgba(249,115,22,${0.1 * intensity}) 120deg,
            transparent 150deg,
            rgba(239,68,68,${0.1 * intensity}) 210deg,
            transparent 240deg,
            rgba(168,85,247,${0.1 * intensity}) 300deg,
            transparent 330deg
          )`,
          animation: "rotateSpotlight 2s linear infinite",
        }}
      />
      
      {/* Center reveal container */}
      <div 
        className="relative"
        style={{
          animation: phase === "scramble" 
            ? "tensionShake 0.1s linear infinite" 
            : phase === "explode" 
              ? "explodeScale 0.3s ease-out forwards" 
              : undefined,
        }}
      >
        {/* Pulsing glow ring */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            transform: "scale(1.5)",
            background: `radial-gradient(circle, 
              transparent 30%, 
              rgba(251,191,36,${0.3 * intensity}) 50%, 
              rgba(249,115,22,${0.2 * intensity}) 70%, 
              transparent 90%
            )`,
            animation: "pulseGlow 0.5s ease-in-out infinite",
            filter: `blur(${10 + intensity * 10}px)`,
          }}
        />
        
        {/* Main reveal ball/container */}
        <div
          style={{
            width: gameType === "dice" ? 200 : 120,
            height: 120,
            borderRadius: gameType === "dice" ? 24 : "50%",
            background: phase === "final" || phase === "explode"
              ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 30%, #f97316 60%, #ea580c 100%)"
              : "linear-gradient(135deg, #475569 0%, #334155 50%, #1e293b 100%)",
            boxShadow: phase === "final" || phase === "explode"
              ? `0 0 60px rgba(251,191,36,${0.6 * intensity}), 0 0 100px rgba(249,115,22,${0.4 * intensity}), 0 8px 32px rgba(0,0,0,0.4)`
              : `0 0 ${20 * intensity}px rgba(251,191,36,${0.3 * intensity}), 0 8px 32px rgba(0,0,0,0.4)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            transition: "all 0.2s ease-out",
            border: `3px solid rgba(255,255,255,${0.2 + intensity * 0.3})`,
          }}
        >
          {gameType === "number" ? (
            <div className="text-white">
              <ScrambleNumber 
                finalNumber={finalNumber} 
                phase={displayPhase as "scramble" | "slow" | "final"} 
              />
            </div>
          ) : (
            <>
              {finalDice.map((d, i) => (
                <ScrambleDice 
                  key={i} 
                  finalDice={d} 
                  phase={displayPhase as "scramble" | "slow" | "final"}
                  index={i}
                />
              ))}
            </>
          )}
        </div>
        
        {/* Suspense text */}
        <div 
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
          style={{
            opacity: phase !== "explode" ? 1 : 0,
            transform: `translateX(-50%) scale(${phase === "final" ? 1.1 : 1})`,
            transition: "all 0.2s ease-out",
          }}
        >
          <span 
            className="text-white font-bold text-lg"
            style={{
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              animation: phase === "scramble" ? "textPulse 0.3s ease-in-out infinite" : undefined,
            }}
          >
            {phase === "buildup" && "🎲 Get Ready..."}
            {phase === "scramble" && "🥁 Revealing..."}
            {phase === "slow" && "⏳ Almost There..."}
            {phase === "final" && "🎉 Result! 🎉"}
          </span>
        </div>
        
        {/* Burst particles on final */}
        {(phase === "final" || phase === "explode") && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: ["#fbbf24", "#f59e0b", "#ef4444", "#22c55e", "#a855f7"][i % 5],
                  left: "50%",
                  top: "50%",
                  animation: `burstParticle 0.6s ease-out ${i * 0.05}s forwards`,
                  transform: `rotate(${i * 30}deg)`,
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes rotateSpotlight {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes tensionShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px) rotate(-1deg); }
          75% { transform: translateX(3px) rotate(1deg); }
        }
        
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; transform: scale(1.5); }
          50% { opacity: 1; transform: scale(1.7); }
        }
        
        @keyframes textPulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        
        @keyframes explodeScale {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(0); opacity: 0; }
        }
        
        @keyframes burstParticle {
          0% { 
            transform: rotate(var(--rot, 0deg)) translateY(0) scale(1); 
            opacity: 1; 
          }
          100% { 
            transform: rotate(var(--rot, 0deg)) translateY(-80px) scale(0); 
            opacity: 0; 
          }
        }
        
        @keyframes diceReveal {
          0% { 
            transform: scale(0.5) rotate(-180deg); 
            opacity: 0; 
          }
          100% { 
            transform: scale(1) rotate(0deg); 
            opacity: 1; 
          }
        }
      `}</style>
    </div>
  );
};

export default SuspenseReveal;
