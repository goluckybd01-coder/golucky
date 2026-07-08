import { useEffect, useState, useRef } from "react";
import { Trophy } from "lucide-react";

interface WinAmountDisplayProps {
  amount: number;
  show: boolean;
  onComplete?: () => void;
  onShow?: () => void;
  intensity?: "small" | "medium" | "big";
}

const WinAmountDisplay = ({ amount, show, onComplete, onShow, intensity: propIntensity }: WinAmountDisplayProps) => {
  const [visible, setVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<"enter" | "pulse" | "exit">("enter");
  const [displayAmount, setDisplayAmount] = useState(0);
  const hasCalledOnShow = useRef(false);
  
  const intensity = propIntensity || (amount >= 5000 ? "big" : amount >= 500 ? "medium" : "small");

  // Smooth counter animation
  useEffect(() => {
    if (show && amount > 0 && animationPhase !== "exit") {
      const duration = 800;
      const steps = 30;
      const stepDuration = duration / steps;
      const increment = amount / steps;
      let currentStep = 0;
      
      const counterInterval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayAmount(amount);
          clearInterval(counterInterval);
        } else {
          const progress = currentStep / steps;
          const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
          setDisplayAmount(Number((amount * easedProgress).toFixed(2)));
        }
      }, stepDuration);
      
      return () => clearInterval(counterInterval);
    }
  }, [show, amount, animationPhase]);

  useEffect(() => {
    if (show && amount > 0) {
      setVisible(true);
      setAnimationPhase("enter");
      setDisplayAmount(0);
      hasCalledOnShow.current = false;
      
      // Call onShow once
      if (onShow) {
        hasCalledOnShow.current = true;
        onShow();
      }
      
      const pulseTimer = setTimeout(() => {
        setAnimationPhase("pulse");
      }, 500);
      
      // Exit animation starts at 2.4s
      const exitTimer = setTimeout(() => {
        setAnimationPhase("exit");
      }, 2400);
      
      // Hide at exactly 3 seconds
      const hideTimer = setTimeout(() => {
        setVisible(false);
        hasCalledOnShow.current = false;
        onComplete?.();
      }, 3000);
      
      return () => {
        clearTimeout(pulseTimer);
        clearTimeout(exitTimer);
        clearTimeout(hideTimer);
      };
    } else if (!show) {
      // Immediately hide and reset when show becomes false
      setVisible(false);
      setAnimationPhase("enter");
      setDisplayAmount(0);
      hasCalledOnShow.current = false;
    }
  }, [show, amount, onComplete, onShow]);

  if (!visible) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      style={{
        background: animationPhase === "exit" 
          ? "transparent" 
          : "radial-gradient(circle at center, rgba(0,0,0,0.6) 0%, transparent 70%)",
        transition: "background 0.4s ease-out",
      }}
    >
      {/* Animated glow rings with smooth transitions */}
      <div className="absolute">
        {[...Array(intensity === "big" ? 5 : intensity === "medium" ? 4 : 3)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${180 + i * 60}px`,
              height: `${180 + i * 60}px`,
              left: `${-(90 + i * 30)}px`,
              top: `${-(90 + i * 30)}px`,
              background: `radial-gradient(circle, transparent 55%, rgba(251, 191, 36, ${0.35 - i * 0.07}) 100%)`,
              animation: animationPhase === "enter" 
                ? `ring-expand 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.08}s forwards` 
                : animationPhase === "pulse"
                ? `ring-pulse-smooth 2s ease-in-out infinite ${i * 0.15}s`
                : `ring-fade-smooth 0.5s ease-out forwards`,
              opacity: animationPhase === "exit" ? 0 : 1,
              transform: animationPhase === "enter" ? "scale(0)" : "scale(1)",
              transition: "opacity 0.4s ease-out",
            }}
          />
        ))}
      </div>

      {/* Floating particles */}
      {animationPhase === "pulse" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(intensity === "big" ? 15 : intensity === "medium" ? 10 : 6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                background: i % 3 === 0 ? "#fbbf24" : i % 3 === 1 ? "#22c55e" : "#fff",
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float-particle ${2 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 2}s`,
                boxShadow: `0 0 8px ${i % 3 === 0 ? "rgba(251, 191, 36, 0.8)" : i % 3 === 1 ? "rgba(34, 197, 94, 0.8)" : "rgba(255, 255, 255, 0.8)"}`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div
        className="relative flex flex-col items-center"
        style={{
          animation: animationPhase === "enter" 
            ? "win-smooth-enter 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
            : animationPhase === "pulse"
            ? "win-float 2.5s ease-in-out infinite"
            : "win-smooth-exit 0.6s cubic-bezier(0.55, 0, 1, 0.45) forwards",
        }}
      >
        {/* Trophy with 3D effect */}
        <div 
          className="mb-3"
          style={{
            animation: animationPhase === "enter" 
              ? "trophy-3d-spin 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
              : animationPhase === "pulse"
              ? "trophy-gentle-float 2s ease-in-out infinite"
              : "none",
            perspective: "1000px",
          }}
        >
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #fcd34d 0%, #f59e0b 40%, #d97706 100%)",
              boxShadow: `
                0 0 60px rgba(251, 191, 36, 0.7),
                0 0 100px rgba(251, 191, 36, 0.4),
                inset 0 -4px 12px rgba(0,0,0,0.2),
                inset 0 4px 12px rgba(255,255,255,0.3)
              `,
            }}
          >
            {/* Shine effect */}
            <div 
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
                animation: animationPhase === "pulse" ? "shine-sweep 3s ease-in-out infinite" : "none",
              }}
            />
            <Trophy className="text-white relative z-10" size={48} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }} />
          </div>
        </div>

        {/* YOU WIN text with gradient */}
        <p 
          className="text-3xl font-black uppercase tracking-wider mb-2"
          style={{
            background: "linear-gradient(135deg, #fbbf24 0%, #fff 50%, #fbbf24 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 2px 8px rgba(251, 191, 36, 0.6))",
            animation: animationPhase === "enter" ? "text-smooth-reveal 0.5s ease-out 0.3s forwards" : 
                       animationPhase === "pulse" ? "text-shimmer 2s ease-in-out infinite" : "none",
            opacity: animationPhase === "enter" ? 0 : 1,
          }}
        >
          🎉 You Win! 🎉
        </p>

        {/* Amount with smooth counter */}
        <div 
          className="relative px-6 py-3 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.3) 100%)",
            border: "2px solid rgba(34, 197, 94, 0.5)",
            boxShadow: "0 8px 32px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
            animation: animationPhase === "pulse" ? "amount-glow-smooth 1.5s ease-in-out infinite" : "none",
          }}
        >
          <p 
            className="text-5xl font-black tabular-nums"
            style={{
              background: "linear-gradient(135deg, #22c55e 0%, #4ade80 50%, #22c55e 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 2px 4px rgba(34, 197, 94, 0.5))",
              animation: animationPhase === "enter" ? "amount-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s forwards" : "none",
              transform: animationPhase === "enter" ? "scale(0)" : "scale(1)",
            }}
          >
            ৳{displayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          
          {/* Sparkle effects */}
          {animationPhase === "pulse" && (
            <>
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    top: `${10 + Math.random() * 80}%`,
                    left: `${5 + Math.random() * 90}%`,
                    width: "4px",
                    height: "4px",
                    background: "#fbbf24",
                    borderRadius: "50%",
                    animation: `sparkle-smooth 1.2s ease-out infinite ${i * 0.15}s`,
                    boxShadow: "0 0 8px rgba(251, 191, 36, 1)",
                  }}
                />
              ))}
            </>
          )}
        </div>

        {/* Subtitle */}
        <p 
          className="text-sm text-white/90 mt-3 font-semibold tracking-wide"
          style={{
            animation: animationPhase === "enter" ? "text-smooth-reveal 0.4s ease-out 0.5s forwards" : "none",
            opacity: animationPhase === "enter" ? 0 : 1,
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          ✨ Added to your wallet ✨
        </p>
      </div>

      <style>{`
        @keyframes win-smooth-enter {
          0% {
            transform: scale(0) rotate(-15deg) translateY(50px);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) rotate(5deg) translateY(-10px);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg) translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes win-float {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-8px) scale(1.02);
          }
        }
        
        @keyframes win-smooth-exit {
          0% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
          100% {
            transform: scale(0.7) translateY(-60px);
            opacity: 0;
          }
        }
        
        @keyframes trophy-3d-spin {
          0% {
            transform: rotateY(0deg) scale(0) translateZ(0);
          }
          40% {
            transform: rotateY(540deg) scale(1.3) translateZ(20px);
          }
          100% {
            transform: rotateY(720deg) scale(1) translateZ(0);
          }
        }
        
        @keyframes trophy-gentle-float {
          0%, 100% {
            transform: translateY(0) rotate(-3deg);
          }
          50% {
            transform: translateY(-6px) rotate(3deg);
          }
        }
        
        @keyframes text-smooth-reveal {
          0% {
            opacity: 0;
            transform: translateY(15px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes text-shimmer {
          0%, 100% {
            filter: drop-shadow(0 2px 8px rgba(251, 191, 36, 0.6)) brightness(1);
          }
          50% {
            filter: drop-shadow(0 2px 16px rgba(251, 191, 36, 0.9)) brightness(1.1);
          }
        }
        
        @keyframes amount-pop {
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
        
        @keyframes amount-glow-smooth {
          0%, 100% {
            box-shadow: 0 8px 32px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255,255,255,0.1);
          }
          50% {
            box-shadow: 0 12px 48px rgba(34, 197, 94, 0.5), inset 0 1px 0 rgba(255,255,255,0.2);
          }
        }
        
        @keyframes ring-expand {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes ring-pulse-smooth {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.5;
          }
        }
        
        @keyframes ring-fade-smooth {
          0% { opacity: 0.3; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.2); }
        }
        
        @keyframes sparkle-smooth {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          50% {
            transform: scale(1.5) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(0) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.6;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 1;
          }
          50% {
            transform: translateY(-30px) translateX(-5px);
            opacity: 0.8;
          }
          75% {
            transform: translateY(-15px) translateX(-10px);
            opacity: 1;
          }
        }
        
        @keyframes shine-sweep {
          0% {
            transform: translateX(-100%) rotate(45deg);
          }
          30%, 100% {
            transform: translateX(200%) rotate(45deg);
          }
        }
      `}</style>
    </div>
  );
};

export default WinAmountDisplay;
