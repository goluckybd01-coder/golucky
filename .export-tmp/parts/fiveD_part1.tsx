import { useState, useEffect, useRef, useCallback } from "react";

interface FiveDSlotMachineProps {
  digits: number[];
  isRolling: boolean;
  isWin?: boolean;
  isLose?: boolean;
  onRollComplete?: () => void;
  onSpinStart?: () => void;
  onSpinTick?: () => void;
  onReelStop?: (reelIndex: number) => void;
  onSpinComplete?: () => void;
}

const SLOT_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// Single slot reel - matches GoLucky design
const SlotReel = ({ 
  finalDigit, 
  isRolling, 
  index,
  isFirst,
  onTick,
  onStop,
}: { 
  finalDigit: number; 
  isRolling: boolean; 
  index: number;
  isFirst: boolean;
  onTick?: () => void;
  onStop?: (reelIndex: number) => void;
}) => {
  const [offset, setOffset] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [blurAmount, setBlurAmount] = useState(0);
  const animationRef = useRef<number | null>(null);
  const speedRef = useRef(0);
  const targetOffsetRef = useRef(0);
  const tickCounterRef = useRef(0);
  const hasStoppedRef = useRef(false);
  
  const itemHeight = 70;
  const totalHeight = SLOT_NUMBERS.length * itemHeight;
  
  const startSpinning = useCallback(() => {
    setIsSpinning(true);
    setBlurAmount(6);
    hasStoppedRef.current = false;
    speedRef.current = 30 + (index * 4);
    tickCounterRef.current = 0;
    
    const animate = () => {
      setOffset(prev => {
        let newOffset = prev + speedRef.current;
        if (newOffset >= totalHeight) {
          newOffset = newOffset % totalHeight;
        }
        
        tickCounterRef.current++;
        if (tickCounterRef.current % 10 === 0 && onTick) {
          onTick();
        }
        
        return newOffset;
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [index, totalHeight, onTick]);
  
  const stopSpinning = useCallback(() => {
    const extraRotations = 2 + index;
    const targetPosition = (finalDigit * itemHeight) + (extraRotations * totalHeight);
    targetOffsetRef.current = targetPosition;
    
    const decelerate = () => {
      setOffset(prev => {
        const distance = targetOffsetRef.current - prev;
        
        const normalizedSpeed = Math.min(1, Math.abs(distance) / (totalHeight * 0.5));
        setBlurAmount(normalizedSpeed * 6);
        
        if (Math.abs(distance) < 1) {
          setIsSpinning(false);
          setBlurAmount(0);
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
          }
          
          if (!hasStoppedRef.current && onStop) {
            hasStoppedRef.current = true;
            onStop(index);
          }
          
          return finalDigit * itemHeight;
        }
        
        const speed = Math.max(1, distance * 0.12);
        return prev + speed;
      });
      
      animationRef.current = requestAnimationFrame(decelerate);
    };
    
    setTimeout(() => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(decelerate);
    }, index * 180);
  }, [finalDigit, index, itemHeight, totalHeight, onStop]);
  
  useEffect(() => {
    if (isRolling) {
      startSpinning();
    } else if (isSpinning) {
      stopSpinning();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRolling, startSpinning, stopSpinning, isSpinning]);
  
  useEffect(() => {
    if (!isRolling && !isSpinning) {
      setOffset(finalDigit * itemHeight);
    }
  }, [finalDigit, isRolling, isSpinning, itemHeight]);
  
  const currentIndex = Math.floor(offset / itemHeight) % SLOT_NUMBERS.length;
  const subOffset = offset % itemHeight;
  
  // Get 5 numbers for scrolling with top/bottom visibility
  const visibleNumbers: number[] = [];
  for (let i = -2; i <= 2; i++) {
    const idx = (currentIndex + i + SLOT_NUMBERS.length) % SLOT_NUMBERS.length;
    visibleNumbers.push(SLOT_NUMBERS[idx]);
  }
  
  // Ball colors - first is green, rest are gray/white
  const ballBg = isFirst 
    ? "linear-gradient(180deg, #22c55e 0%, #16a34a 50%, #15803d 100%)"
    : "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)";
  const textColor = isFirst ? "#ffffff" : "#475569";
  
  return (
    <div 
      className="relative flex-1"
      style={{
        height: "110px",
        background: "#4b5563",
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      {/* Numbers container */}
      <div 
        className="absolute left-0 right-0 flex flex-col items-center"
        style={{
          top: `${20 - subOffset}px`,
          filter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none',
          transition: 'filter 0.08s ease-out',
        }}
      >
        {visibleNumbers.map((num, i) => {
          const isCenter = i === 2;
          
          return (
            <div
              key={`${num}-${i}-${index}`}
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: "100%",
                height: `${itemHeight}px`,
              }}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: "54px",
                  height: "54px",
                  background: ballBg,
                  boxShadow: isCenter 
                    ? (isFirst 
                        ? "0 4px 12px rgba(22,163,74,0.5), inset 0 2px 4px rgba(255,255,255,0.3)" 
                        : "0 4px 12px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.5)")
                    : "0 2px 6px rgba(0,0,0,0.15)",
                  opacity: isCenter ? 1 : 0.6,
                  transform: isCenter ? "scale(1)" : "scale(0.85)",
                }}
              >
                <span 
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color: textColor,
                    textShadow: isFirst ? "0 2px 4px rgba(0,0,0,0.3)" : "none",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}
                >
                  {num}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Spinning glow */}
      {isSpinning && (
        <div 
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: isFirst 
              ? "radial-gradient(ellipse at center, rgba(34,197,94,0.2) 0%, transparent 70%)"
              : "radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 70%)",
            animation: "pulse 0.5s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
};

