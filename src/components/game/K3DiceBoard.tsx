import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useEffect, useRef, forwardRef } from "react";

interface K3DiceBoardProps {
  dice: [number, number, number];
  isRolling: boolean;
  timeRemaining: number;
  isBettingLocked: boolean;
  isRevealPhase: boolean;
  onLeftClick?: () => void;
  onRightClick?: () => void;
}

// True 3D Dice component with CSS 3D transforms - shows 3 visible faces
interface Dice3DProps {
  value: number;
  size?: number;
  isRolling?: boolean;
  staggerMs?: number;
}

// Get dot positions for each face value
const getDotPositions = (value: number): number[][] => {
  const positions: Record<number, number[][]> = {
    1: [[50, 50]],
    2: [[28, 28], [72, 72]],
    3: [[28, 28], [50, 50], [72, 72]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]],
    5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[28, 28], [72, 28], [28, 50], [72, 50], [28, 72], [72, 72]],
  };
  return positions[value] || positions[1];
};

// Calculate opposite face value
const getOppositeFace = (value: number): number => {
  return 7 - value; // Opposite faces of a dice always sum to 7
};

// Get adjacent faces based on top face
const getAdjacentFaces = (topValue: number): { right: number; front: number } => {
  // Standard dice configuration
  const adjacentMap: Record<number, { right: number; front: number }> = {
    1: { right: 3, front: 2 },
    2: { right: 3, front: 1 },
    3: { right: 1, front: 5 },
    4: { right: 2, front: 5 },
    5: { right: 3, front: 4 },
    6: { right: 3, front: 5 },
  };
  return adjacentMap[topValue] || { right: 3, front: 2 };
};

// Single face of the dice with glossy shine effect
const DiceFace = ({ 
  value, 
  size, 
  style,
  className = ""
}: { 
  value: number; 
  size: number; 
  style: React.CSSProperties;
  className?: string;
}) => {
  const dots = getDotPositions(value);
  const dotSize = size * 0.14;

  return (
    <div
      className={`absolute ${className}`}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(145deg, #fcd34d 0%, #f59e0b 35%, #d97706 70%, #b45309 100%)",
        borderRadius: size * 0.12,
        backfaceVisibility: "hidden",
        boxShadow: `
          inset 0 ${size * 0.02}px ${size * 0.04}px rgba(255,255,255,0.5),
          inset 0 -${size * 0.02}px ${size * 0.04}px rgba(0,0,0,0.3),
          0 ${size * 0.04}px ${size * 0.08}px rgba(0,0,0,0.4),
          0 0 ${size * 0.15}px rgba(251, 191, 36, 0.3)
        `,
        ...style,
      }}
    >
      {/* Main glossy highlight - top left */}
      <div
        style={{
          position: "absolute",
          top: size * 0.04,
          left: size * 0.06,
          width: size * 0.5,
          height: size * 0.35,
          background: "linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0) 70%)",
          borderRadius: `${size * 0.1}px ${size * 0.08}px ${size * 0.15}px ${size * 0.06}px`,
          pointerEvents: "none",
        }}
      />
      
      {/* Secondary shine - curved reflection */}
      <div
        style={{
          position: "absolute",
          top: size * 0.08,
          right: size * 0.1,
          width: size * 0.25,
          height: size * 0.12,
          background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)",
          borderRadius: size * 0.5,
          transform: "rotate(-15deg)",
          pointerEvents: "none",
        }}
      />
      
      {/* Bottom edge highlight */}
      <div
        style={{
          position: "absolute",
          bottom: size * 0.06,
          left: size * 0.15,
          right: size * 0.15,
          height: size * 0.04,
          background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%)",
          borderRadius: size * 0.02,
          pointerEvents: "none",
        }}
      />
      
      {/* Dots with enhanced 3D effect - dark maroon/brown for golden dice */}
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
            background: "linear-gradient(145deg, #7f1d1d 0%, #991b1b 30%, #450a0a 100%)",
            boxShadow: `
              inset 0 ${dotSize * 0.12}px ${dotSize * 0.08}px rgba(255,255,255,0.15),
              inset 0 -${dotSize * 0.12}px ${dotSize * 0.15}px rgba(0,0,0,0.4),
              0 ${dotSize * 0.06}px ${dotSize * 0.1}px rgba(0,0,0,0.5)
            `,
          }}
        >
          {/* Dot shine */}
          <div
            style={{
              position: "absolute",
              top: dotSize * 0.1,
              left: dotSize * 0.12,
              width: dotSize * 0.3,
              height: dotSize * 0.2,
              background: "radial-gradient(ellipse, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 70%)",
              borderRadius: "50%",
            }}
          />
        </div>
      ))}
    </div>
  );
};

const Dice3D = forwardRef<HTMLDivElement, Dice3DProps>(({ value, size = 68, isRolling = false, staggerMs = 0 }, ref) => {
  const adjacent = getAdjacentFaces(value);
  const halfSize = size / 2;
  
  // Animation state for smooth rolling
  const [rollAngles, setRollAngles] = useState({ x: -25, y: 35, z: 0 });
  const [bounce, setBounce] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Discrete tumble (on value change) + landed glow
  const [tumbleKey, setTumbleKey] = useState(0);
  const [landed, setLanded] = useState(false);
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (isRolling) return;
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      const t1 = window.setTimeout(() => setTumbleKey((k) => k + 1), staggerMs);
      const t2 = window.setTimeout(() => setLanded(true), staggerMs + 1500);
      const t3 = window.setTimeout(() => setLanded(false), staggerMs + 2600);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [value, isRolling, staggerMs]);
  
  useEffect(() => {
    if (isRolling) {
      startTimeRef.current = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const speed = 0.008; // Rotation speed
        
        // Continuous smooth rotation with easing
        const baseX = elapsed * speed * 3;
        const baseY = elapsed * speed * 4;
        const baseZ = elapsed * speed * 2;
        
        // Add wobble effect
        const wobbleX = Math.sin(elapsed * 0.015) * 15;
        const wobbleY = Math.cos(elapsed * 0.012) * 20;
        
        // Bounce effect - oscillating vertical movement
        const bounceValue = Math.abs(Math.sin(elapsed * 0.02)) * 8;
        
        setRollAngles({
          x: baseX + wobbleX,
          y: baseY + wobbleY,
          z: baseZ,
        });
        setBounce(bounceValue);
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else {
      // Smooth transition back to resting position
      setRollAngles({ x: -25, y: 35, z: 0 });
      setBounce(0);
    }
  }, [isRolling]);

  return (
    <div
      ref={ref}
      style={{
        width: size,
        height: size,
        perspective: size * 5,
        perspectiveOrigin: "50% 50%",
      }}
    >
      <div
        key={tumbleKey}
        className={!isRolling && tumbleKey > 0 ? "k3-dice-tumbling" : undefined}
        style={{
          width: size,
          height: size,
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `translateY(${-bounce}px) rotateX(${rollAngles.x}deg) rotateY(${rollAngles.y}deg) rotateZ(${rollAngles.z}deg)`,
          transition: isRolling ? "none" : "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          borderRadius: size * 0.14,
          ...(landed ? { animation: "k3-dice-land-glow 1.1s ease-out both" } : null),
        }}
      >
        {/* Top face (main value) */}
        <DiceFace
          value={value}
          size={size}
          style={{
            transform: `translateZ(${halfSize}px)`,
          }}
        />
        
        {/* Bottom face (opposite) */}
        <DiceFace
          value={getOppositeFace(value)}
          size={size}
          style={{
            transform: `rotateX(180deg) translateZ(${halfSize}px)`,
          }}
        />
        
        {/* Right face */}
        <DiceFace
          value={adjacent.right}
          size={size}
          style={{
            transform: `rotateY(90deg) translateZ(${halfSize}px)`,
          }}
        />
        
        {/* Left face */}
        <DiceFace
          value={getOppositeFace(adjacent.right)}
          size={size}
          style={{
            transform: `rotateY(-90deg) translateZ(${halfSize}px)`,
          }}
        />
        
        {/* Front face */}
        <DiceFace
          value={adjacent.front}
          size={size}
          style={{
            transform: `rotateX(-90deg) translateZ(${halfSize}px)`,
          }}
        />
        
        {/* Back face */}
        <DiceFace
          value={getOppositeFace(adjacent.front)}
          size={size}
          style={{
            transform: `rotateX(90deg) translateZ(${halfSize}px)`,
          }}
        />
      </div>
    </div>
  );
});
Dice3D.displayName = "Dice3D";

// Countdown Overlay Component - Shows during last 5 seconds with rolling dice behind
const CountdownOverlay = ({ seconds, displayDice }: { seconds: number; displayDice: [number, number, number] }) => {
  const d1 = Math.floor(seconds / 10);
  const d2 = seconds % 10;
  const isUrgent = seconds <= 3;

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl overflow-hidden"
      style={{
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(3px)",
      }}
    >
      {/* Rolling dice visible behind overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-40">
        <div className="flex items-center gap-4">
          {displayDice.map((val, idx) => (
            <Dice3D key={idx} value={val} size={56} isRolling={true} />
          ))}
        </div>
      </div>
      
      {/* Countdown digits */}
      <div className={`flex items-center gap-2 relative z-10 ${isUrgent ? "animate-timer-shake" : ""}`}>
        <div
          className={`w-14 h-16 rounded-lg flex items-center justify-center ${seconds <= 3 ? "animate-timer-urgent" : "animate-timer-pulse"}`}
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
        >
          <span
            className="text-3xl font-bold"
            style={{
              color: seconds <= 3 ? "#dc2626" : "#f97316",
              textShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            {d1}
          </span>
        </div>
        <div
          className={`w-14 h-16 rounded-lg flex items-center justify-center ${seconds <= 3 ? "animate-timer-urgent" : "animate-timer-pulse"}`}
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
        >
          <span
            className="text-3xl font-bold"
            style={{
              color: seconds <= 3 ? "#dc2626" : "#f97316",
              textShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            {d2}
          </span>
        </div>
      </div>
      <span className="text-white/80 text-sm mt-2 font-medium relative z-10">seconds</span>
    </div>
  );
};

// Reveal Phase Overlay - Fast dice rolling animation
const RevealOverlay = ({ displayDice }: { displayDice: [number, number, number] }) => {
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl"
      style={{
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="flex items-center gap-4">
        {displayDice.map((val, idx) => (
          <Dice3D key={idx} value={val} size={64} isRolling={true} />
        ))}
      </div>
      <span className="text-white/90 text-sm mt-4 font-medium animate-pulse">Rolling...</span>
    </div>
  );
};

const K3DiceBoard = ({
  dice,
  isRolling,
  timeRemaining,
  isBettingLocked,
  isRevealPhase,
  onLeftClick,
  onRightClick,
}: K3DiceBoardProps) => {
  const showCountdownOverlay = timeRemaining > 0 && timeRemaining <= 5;
  const showRevealOverlay = isRevealPhase && !showCountdownOverlay;
  
  // Internal rolling dice state for countdown overlay animation
  const [overlayDice, setOverlayDice] = useState<[number, number, number]>([1, 1, 1]);
  const overlayRollRef = useRef<number | null>(null);

  // First-visit swipe hint
  const HINT_KEY = "k3_swipe_hint_dismissed";
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(HINT_KEY)) setShowHint(true);
    } catch { /* ignore */ }
  }, []);
  const dismissHint = () => {
    setShowHint(false);
    try { localStorage.setItem(HINT_KEY, "1"); } catch { /* ignore */ }
  };

  // Swipe gesture state for mobile period navigation
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const swipedRef = useRef(false);
  const SWIPE_THRESHOLD = 40;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isBettingLocked) return;
    const t = e.touches[0];
    touchStartXRef.current = t.clientX;
    touchStartYRef.current = t.clientY;
    swipedRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipedRef.current || touchStartXRef.current === null || touchStartYRef.current === null) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartXRef.current;
    const dy = t.clientY - touchStartYRef.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      swipedRef.current = true;
      dismissHint();
      if (dx < 0) onRightClick?.();
      else onLeftClick?.();
    }
  };

  const handleTouchEnd = () => {
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };
  
  // Roll dice independently during countdown overlay
  useEffect(() => {
    if (showCountdownOverlay || isRevealPhase) {
      overlayRollRef.current = window.setInterval(() => {
        setOverlayDice([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
        ]);
      }, 100);
    } else {
      if (overlayRollRef.current) {
        window.clearInterval(overlayRollRef.current);
        overlayRollRef.current = null;
      }
    }
    
    return () => {
      if (overlayRollRef.current) {
        window.clearInterval(overlayRollRef.current);
        overlayRollRef.current = null;
      }
    };
  }, [showCountdownOverlay, isRevealPhase]);

  return (
    <div className="px-3 py-3">
      {/* Outer frame - lighter green with transparency */}
      <div
        className={`relative rounded-2xl transition-all ${timeRemaining <= 3 && timeRemaining > 0 ? "animate-timer-shake" : ""}`}
        style={{
          background: "linear-gradient(180deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)",
          padding: 10,
          boxShadow: "0 8px 32px rgba(34, 197, 94, 0.3), inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.1)",
        }}
      >
        {/* Inner tray - lighter transparent green */}
        <div
          className="relative rounded-xl flex items-center justify-between px-2"
          style={{
            background: "linear-gradient(180deg, rgba(134, 239, 172, 0.9) 0%, rgba(74, 222, 128, 0.85) 50%, rgba(34, 197, 94, 0.9) 100%)",
            height: 130,
            boxShadow: "inset 0 4px 12px rgba(0,0,0,0.15), inset 0 -2px 8px rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
            touchAction: "pan-y",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {/* Left arrow button */}
          <button
            onClick={onLeftClick}
            disabled={isBettingLocked}
            className="w-10 h-20 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 hover:brightness-110"
            style={{
              background: "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)",
              boxShadow: "0 3px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <ChevronLeft className="text-white drop-shadow-md" size={24} />
          </button>

          {/* Dice slots - 3D visible dice */}
          <div className="flex items-center gap-4">
            {dice.map((val, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center"
                style={{
                  width: 88,
                  height: 100,
                }}
              >
                <Dice3D
                  value={val}
                  size={72}
                  isRolling={isRolling && !showCountdownOverlay && !isRevealPhase}
                  staggerMs={idx * 150}
                />
              </div>
            ))}
          </div>

          {/* Right arrow button */}
          <button
            onClick={onRightClick}
            disabled={isBettingLocked}
            className="w-10 h-20 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 hover:brightness-110"
            style={{
              background: "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)",
              boxShadow: "0 3px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <ChevronRight className="text-white drop-shadow-md" size={24} />
          </button>

          {/* Countdown Overlay (last 5 seconds) */}
          {showCountdownOverlay && <CountdownOverlay seconds={timeRemaining} displayDice={overlayDice} />}
          
          {/* Reveal Phase Overlay (rolling after 0) */}
          {showRevealOverlay && <RevealOverlay displayDice={overlayDice} />}

          {/* First-visit swipe hint */}
          {showHint && !showCountdownOverlay && !showRevealOverlay && (
            <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 translate-y-full z-30 pointer-events-auto">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 text-white text-[11px] font-medium shadow-lg animate-fade-in">
                <ChevronLeft size={14} className="animate-pulse" />
                <span>Swipe to change period</span>
                <ChevronRight size={14} className="animate-pulse" />
                <button
                  onClick={dismissHint}
                  className="ml-1 text-white/70 hover:text-white"
                  aria-label="Dismiss hint"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default K3DiceBoard;
