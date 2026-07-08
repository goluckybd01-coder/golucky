export default function FiveDSlotMachine({ 
  digits, 
  isRolling, 
  isWin = false,
  isLose = false,
  onRollComplete,
  onSpinStart,
  onSpinTick,
  onReelStop,
  onSpinComplete,
}: FiveDSlotMachineProps) {
  const wasRollingRef = useRef(false);
  const stoppedReelsRef = useRef<Set<number>>(new Set());
  const [showWinGlow, setShowWinGlow] = useState(false);
  const [showLoseFlash, setShowLoseFlash] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<Array<{
    id: number;
    x: number;
    delay: number;
    duration: number;
    color: string;
    size: number;
  }>>([]);
  
  // Calculate SUM of B+C+D+E (last 4 digits)
  const sum = digits.slice(1).reduce((acc, d) => acc + d, 0);
  const isBig = sum >= 14;
  const isOdd = sum % 2 === 1;
  
  // Win celebration effect
  useEffect(() => {
    if (isWin && !isRolling) {
      setShowWinGlow(true);
      setShowLoseFlash(false);
      
      // Generate confetti particles
      const colors = ["#22c55e", "#fbbf24", "#ef4444", "#3b82f6", "#ec4899", "#8b5cf6"];
      const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.5 + Math.random() * 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
      }));
      setConfettiParticles(particles);
      
      // Clear effects after animation
      const timeout = setTimeout(() => {
        setShowWinGlow(false);
        setConfettiParticles([]);
      }, 3000);
      
      return () => clearTimeout(timeout);
    } else {
      setShowWinGlow(false);
      setConfettiParticles([]);
    }
  }, [isWin, isRolling]);
  
  // Lose flash effect
  useEffect(() => {
    if (isLose && !isRolling) {
      setShowLoseFlash(true);
      setShowWinGlow(false);
      
      // Clear effect after animation
      const timeout = setTimeout(() => {
        setShowLoseFlash(false);
      }, 2000);
      
      return () => clearTimeout(timeout);
    } else if (!isLose) {
      setShowLoseFlash(false);
    }
  }, [isLose, isRolling]);
  
  useEffect(() => {
    if (isRolling && !wasRollingRef.current) {
      stoppedReelsRef.current.clear();
      onSpinStart?.();
    }
    wasRollingRef.current = isRolling;
  }, [isRolling, onSpinStart]);
  
  const handleReelStop = useCallback((reelIndex: number) => {
    stoppedReelsRef.current.add(reelIndex);
    onReelStop?.(reelIndex);
    
    if (stoppedReelsRef.current.size === 5) {
      setTimeout(() => {
        onSpinComplete?.();
        onRollComplete?.();
      }, 100);
    }
  }, [onReelStop, onSpinComplete, onRollComplete]);
  
  return (
    <div 
      className="w-full max-w-[380px] mx-auto relative"
      style={{
        animation: showLoseFlash ? "lose-shake 0.5s ease-in-out" : "none",
      }}
    >
      {/* Confetti particles */}
      {confettiParticles.map((particle) => (
        <div
          key={particle.id}
          className="absolute pointer-events-none z-50"
          style={{
            left: `${particle.x}%`,
            top: "-10px",
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: particle.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animation: `confetti-fall ${particle.duration}s ease-out ${particle.delay}s forwards`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
      
      {/* Win glow background */}
      {showWinGlow && (
        <div
          className="absolute -inset-4 rounded-3xl pointer-events-none z-0"
          style={{
            background: "radial-gradient(ellipse at center, rgba(34,197,94,0.4) 0%, rgba(34,197,94,0.1) 50%, transparent 70%)",
            animation: "win-pulse 0.5s ease-in-out infinite alternate",
          }}
        />
      )}
      
      {/* Lose flash background */}
      {showLoseFlash && (
        <div
          className="absolute -inset-4 rounded-3xl pointer-events-none z-0"
          style={{
            background: "radial-gradient(ellipse at center, rgba(239,68,68,0.5) 0%, rgba(239,68,68,0.15) 50%, transparent 70%)",
            animation: "lose-flash 0.3s ease-in-out 3",
          }}
        />
      )}
      
      {/* Slot Machine */}
      <div 
        className="relative"
        style={{ 
          background: showWinGlow 
            ? "linear-gradient(180deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)"
            : showLoseFlash
              ? "linear-gradient(180deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)"
              : "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)",
          borderRadius: "16px",
          padding: "10px",
          boxShadow: showWinGlow
            ? "0 0 40px rgba(34,197,94,0.8), 0 8px 24px rgba(22,163,74,0.4), inset 0 2px 4px rgba(255,255,255,0.3)"
            : showLoseFlash
              ? "0 0 40px rgba(239,68,68,0.6), 0 8px 24px rgba(220,38,38,0.4), inset 0 2px 4px rgba(255,255,255,0.2)"
              : "0 8px 24px rgba(22,163,74,0.4), inset 0 2px 4px rgba(255,255,255,0.2)",
          transition: "all 0.3s ease",
        }}
      >
        {/* Left arrow indicator */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20"
          style={{ marginLeft: "-6px" }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: "14px solid transparent",
              borderBottom: "14px solid transparent",
              borderLeft: showWinGlow 
                ? "12px solid #4ade80" 
                : showLoseFlash 
                  ? "12px solid #ef4444"
                  : "12px solid #16a34a",
              filter: showWinGlow 
                ? "drop-shadow(2px 0 8px rgba(34,197,94,0.8))" 
                : showLoseFlash
                  ? "drop-shadow(2px 0 8px rgba(239,68,68,0.6))"
                  : "drop-shadow(2px 0 3px rgba(0,0,0,0.2))",
              transition: "all 0.3s ease",
            }}
          />
        </div>
        
        {/* Right arrow indicator */}
        <div 
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20"
          style={{ marginRight: "-6px" }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: "14px solid transparent",
              borderBottom: "14px solid transparent",
              borderRight: showWinGlow 
                ? "12px solid #4ade80" 
                : showLoseFlash
                  ? "12px solid #ef4444"
                  : "12px solid #16a34a",
              filter: showWinGlow 
                ? "drop-shadow(-2px 0 8px rgba(34,197,94,0.8))" 
                : showLoseFlash
                  ? "drop-shadow(-2px 0 8px rgba(239,68,68,0.6))"
                  : "drop-shadow(-2px 0 3px rgba(0,0,0,0.2))",
              transition: "all 0.3s ease",
            }}
          />
        </div>
        
        {/* Inner dark frame */}
        <div 
          className="relative rounded-xl overflow-hidden"
          style={{ 
            background: "#1f2937",
            border: showWinGlow 
              ? "3px solid #4ade80" 
              : showLoseFlash
                ? "3px solid #ef4444"
                : "3px solid #15803d",
            padding: "6px",
            boxShadow: showWinGlow 
              ? "inset 0 0 20px rgba(34,197,94,0.3)" 
              : showLoseFlash
                ? "inset 0 0 20px rgba(239,68,68,0.3)"
                : "none",
            transition: "all 0.3s ease",
          }}
        >
          {/* Slot reels container */}
          <div className="flex gap-1">
            {digits.map((digit, i) => (
              <SlotReel
                key={i}
                finalDigit={digit}
                isRolling={isRolling}
                index={i}
                isFirst={i === 0}
                onTick={i === 0 ? onSpinTick : undefined}
                onStop={handleReelStop}
              />
            ))}
          </div>
          
          {/* Win sparkle overlay */}
          {showWinGlow && (
            <div 
              className="absolute inset-0 pointer-events-none z-30"
              style={{
                background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
                animation: "sparkle-sweep 1s ease-in-out infinite",
              }}
            />
          )}
        </div>
      </div>
      
      {/* SUM Display */}
      <div 
        className="mt-3 flex items-center justify-center gap-3"
        style={{
          opacity: isRolling ? 0.5 : 1,
          transition: "opacity 0.3s ease",
        }}
      >
        {/* SUM Value */}
        <div 
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            border: showWinGlow ? "2px solid #4ade80" : "2px solid #22c55e",
            boxShadow: showWinGlow 
              ? "0 0 20px rgba(34,197,94,0.5), 0 4px 12px rgba(0,0,0,0.3)"
              : "0 4px 12px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.1)",
            transition: "all 0.3s ease",
          }}
        >
          <span className="text-slate-400 text-sm font-medium">SUM</span>
          <span 
            className="text-2xl font-bold"
            style={{
              color: showWinGlow ? "#4ade80" : "#22c55e",
              textShadow: showWinGlow 
                ? "0 0 20px rgba(34,197,94,0.8)"
                : "0 0 10px rgba(34,197,94,0.5)",
              transition: "all 0.3s ease",
            }}
          >
            {isRolling ? "--" : sum}
          </span>
        </div>
        
        {/* Big/Small indicator */}
        <div 
          className="px-3 py-2 rounded-lg text-sm font-bold"
          style={{
            background: isBig 
              ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" 
              : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            color: "#ffffff",
            boxShadow: isBig 
              ? "0 4px 12px rgba(249,115,22,0.4)" 
              : "0 4px 12px rgba(59,130,246,0.4)",
            opacity: isRolling ? 0 : 1,
            transition: "opacity 0.3s ease",
          }}
        >
          {isBig ? "Big" : "Small"}
        </div>
        
        {/* Odd/Even indicator */}
        <div 
          className="px-3 py-2 rounded-lg text-sm font-bold"
          style={{
            background: isOdd 
              ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" 
              : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            color: "#ffffff",
            boxShadow: isOdd 
              ? "0 4px 12px rgba(34,197,94,0.4)" 
              : "0 4px 12px rgba(239,68,68,0.4)",
            opacity: isRolling ? 0 : 1,
            transition: "opacity 0.3s ease",
          }}
        >
          {isOdd ? "Odd" : "Even"}
        </div>
      </div>
      
      {/* Digit Labels */}
      <div className="mt-2 flex justify-center gap-1 max-w-[380px] mx-auto px-4">
        {["A", "B", "C", "D", "E"].map((label, i) => (
          <div 
            key={label}
            className="flex-1 text-center text-xs font-semibold py-1 rounded"
            style={{
              background: i === 0 ? "rgba(34,197,94,0.2)" : "rgba(100,116,139,0.2)",
              color: i === 0 ? "#22c55e" : "#94a3b8",
            }}
          >
            {label}
          </div>
        ))}
      </div>
      
      {/* CSS Keyframes for animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(200px) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes win-pulse {
          0% {
            opacity: 0.6;
            transform: scale(1);
          }
          100% {
            opacity: 1;
            transform: scale(1.05);
          }
        }
        
        @keyframes sparkle-sweep {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes lose-flash {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        @keyframes lose-shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-4px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(4px);
          }
        }
      ` }} />
    </div>
  );
}
