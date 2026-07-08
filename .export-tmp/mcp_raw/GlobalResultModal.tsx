/**
 * GLOBAL RESULT MODAL
 * 
 * Unified result modal for ALL games (K3, WinGo, 5D, TrxWin).
 * - Suspenseful reveal animation before showing results
 * - Minimum 3 seconds visibility
 * - Auto-close after 3 seconds
 * - User can close via X anytime
 * - Shows win/lose + payout amount
 */

import React, { useEffect, useRef, useState, useCallback, forwardRef } from "react";
import { formatPayout } from "@/lib/payout";
import type { GlobalGameResultPayload } from "@/lib/globalGameResult";
import SuspenseReveal from "./SuspenseReveal";

interface GlobalResultModalProps {
  isOpen: boolean;
  result: GlobalGameResultPayload | null;
  onClose: () => void;
  // Sound callbacks for suspense reveal
  onPlayDrumRoll?: (duration: number) => void;
  onPlayRevealClimax?: () => void;
  onPlayWinFanfare?: () => void;
}

// Premium pill for result row
interface ResultPillProps {
  children: React.ReactNode;
  bgStyle: string | { background: string };
}

const ResultPill = forwardRef<HTMLSpanElement, ResultPillProps>(
  ({ children, bgStyle }, ref) => (
    <span
      ref={ref}
      className="h-7 px-3 rounded-full flex items-center justify-center text-white text-xs font-bold"
      style={{
        ...(typeof bgStyle === "string" ? { background: bgStyle } : bgStyle),
        boxShadow: "0 2px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
        minWidth: 32,
      }}
    >
      {children}
    </span>
  )
);
ResultPill.displayName = "ResultPill";

// Sparkle particle inside card only
const InternalSparkles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[18px]">
    {[...Array(12)].map((_, i) => (
      <div
        key={i}
        className="absolute"
        style={{
          width: 4 + (i % 3) * 2,
          height: 4 + (i % 3) * 2,
          background: `radial-gradient(circle, rgba(255,215,0,${0.6 + (i % 3) * 0.15}) 0%, transparent 70%)`,
          borderRadius: "50%",
          left: `${10 + (i * 7)}%`,
          top: `${15 + ((i % 4) * 20)}%`,
          animation: `sparkleFloat ${1.5 + (i * 0.2)}s ease-in-out infinite`,
          animationDelay: `${i * 0.15}s`,
        }}
      />
    ))}
    <style>{`
      @keyframes sparkleFloat {
        0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
        50% { transform: translateY(-8px) scale(1.3); opacity: 1; }
      }
    `}</style>
  </div>
);

// K3 Mini Dice
const MiniDice = ({ value, size = 32 }: { value: number; size?: number }) => {
  const dotPositions: Record<number, number[][]> = {
    1: [[50, 50]],
    2: [[30, 30], [70, 70]],
    3: [[30, 30], [50, 50], [70, 70]],
    4: [[30, 30], [70, 30], [30, 70], [70, 70]],
    5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
    6: [[30, 30], [70, 30], [30, 50], [70, 50], [30, 70], [70, 70]],
  };

  const dots = dotPositions[value] || dotPositions[1];
  const dotSize = size * 0.18;

  return (
    <div
      style={{
        width: size,
        height: size,
        background: "linear-gradient(145deg, #ef4444 0%, #dc2626 40%, #b91c1c 100%)",
        borderRadius: size * 0.2,
        position: "relative",
        boxShadow: `0 2px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.3)`,
        flexShrink: 0,
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
            background: "linear-gradient(145deg, #fef08a 0%, #facc15 100%)",
            boxShadow: `inset 0 -1px 2px rgba(0,0,0,0.2)`,
          }}
        />
      ))}
    </div>
  );
};

// Duration label helper
const getDurationLabel = (game: string, duration: number): string => {
  if (duration === 0.5) return "30Sec";
  return `${duration}Min`;
};

// Number color helper (for WinGo)
const getNumberBgColor = (num: number): string => {
  if (num === 0 || num === 5) return ""; // Dual color
  if ([1, 3, 7, 9].includes(num)) return "#22c55e"; // Green
  return "#ef4444"; // Red
};

// Color gradient helper
const getColorGradient = (colors?: string[], bigSmall?: string): string => {
  if (!colors || colors.length === 0) {
    // K3: use orange for Big, blue for Small
    return bigSmall === "Big" 
      ? "linear-gradient(135deg, #fb923c 0%, #f97316 100%)"
      : "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)";
  }
  if (colors.includes("violet") && colors.includes("green")) {
    return "linear-gradient(90deg, #a855f7 50%, #22c55e 50%)";
  }
  if (colors.includes("violet") && colors.includes("red")) {
    return "linear-gradient(90deg, #ef4444 50%, #a855f7 50%)";
  }
  if (colors.includes("green")) return "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)";
  if (colors.includes("red")) return "linear-gradient(135deg, #f87171 0%, #ef4444 100%)";
  return "linear-gradient(135deg, #c084fc 0%, #a855f7 100%)";
};

// Color text helper
const getColorText = (colors?: string[], bigSmall?: string): string => {
  if (!colors || colors.length === 0) {
    return bigSmall || "";
  }
  if (colors.includes("violet") && colors.includes("green")) return "Violet Green";
  if (colors.includes("violet") && colors.includes("red")) return "Red Violet";
  const firstColor = colors[0];
  return firstColor ? firstColor.charAt(0).toUpperCase() + firstColor.slice(1) : "";
};

// Dual-color number ball for 0 and 5
const DualColorNumber = ({ num, size = 28 }: { num: number; size?: number }) => {
  const leftColor = num === 0 ? "#ef4444" : "#22c55e";
  const ringColor = leftColor;
  const rightColor = "#a855f7";
  
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold overflow-hidden"
      style={{
        width: size,
        height: size,
        border: `2px solid ${ringColor}`,
        boxShadow: "0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
        position: "relative",
        fontSize: size * 0.45,
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "100%", background: leftColor }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", background: rightColor }} />
      <span style={{ position: "relative", zIndex: 1, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>{num}</span>
    </div>
  );
};

const MIN_VISIBLE_MS = 3000;
const AUTO_CLOSE_MS = 3000;
const SUSPENSE_DURATION_MS = 1800; // Suspense reveal duration

const GlobalResultModal: React.FC<GlobalResultModalProps> = ({
  isOpen,
  result,
  onClose,
  onPlayDrumRoll,
  onPlayRevealClimax,
  onPlayWinFanfare,
}) => {
  const [countdown, setCountdown] = useState(3);
  const [canAutoClose, setCanAutoClose] = useState(false);
  const [showSuspense, setShowSuspense] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  const minTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingAutoCloseRef = useRef(false);
  const modalOpenTimeRef = useRef<number | null>(null);
  const lastResultIdRef = useRef<string | null>(null);

  const cleanupTimers = useCallback(() => {
    if (minTimerRef.current) {
      clearTimeout(minTimerRef.current);
      minTimerRef.current = null;
    }
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    pendingAutoCloseRef.current = false;
  }, []);

  // Handle suspense reveal when modal opens with new result
  useEffect(() => {
    if (!isOpen || !result) {
      cleanupTimers();
      setCanAutoClose(false);
      setCountdown(Math.ceil(AUTO_CLOSE_MS / 1000));
      setShowSuspense(false);
      setShowResult(false);
      lastResultIdRef.current = null;
      return;
    }

    const resultId = `${result.tradeId}-${result.betType}`;
    
    // Only show suspense for new results
    if (lastResultIdRef.current !== resultId) {
      lastResultIdRef.current = resultId;
      setShowSuspense(true);
      setShowResult(false);
    }
  }, [isOpen, result?.tradeId, result?.betType, cleanupTimers]);

  // Handle suspense complete -> show result
  const handleSuspenseComplete = useCallback(() => {
    setShowSuspense(false);
    setShowResult(true);
    
    // Play win fanfare if it's a win
    if (result?.outcome === "WIN" && onPlayWinFanfare) {
      onPlayWinFanfare();
    }
    
    // Start auto-close timers after suspense
    setCanAutoClose(false);
    setCountdown(Math.ceil(AUTO_CLOSE_MS / 1000));
    pendingAutoCloseRef.current = false;
    modalOpenTimeRef.current = Date.now();

    // Start countdown display
    countdownIntervalRef.current = setInterval(() => {
      if (modalOpenTimeRef.current) {
        const elapsed = Date.now() - modalOpenTimeRef.current;
        const remaining = Math.ceil((AUTO_CLOSE_MS - elapsed) / 1000);
        setCountdown(Math.max(0, remaining));
      }
    }, 100);

    // Min timer: enables auto-close after MIN_VISIBLE_MS
    minTimerRef.current = setTimeout(() => {
      setCanAutoClose(true);
      if (pendingAutoCloseRef.current) {
        onClose();
      }
    }, MIN_VISIBLE_MS);

    // Auto timer: triggers close after AUTO_CLOSE_MS
    autoTimerRef.current = setTimeout(() => {
      pendingAutoCloseRef.current = true;
      setCanAutoClose((current) => {
        if (current) {
          onClose();
        }
        return current;
      });
    }, AUTO_CLOSE_MS);
  }, [onClose, result?.outcome, onPlayWinFanfare]);

  useEffect(() => {
    return cleanupTimers;
  }, [cleanupTimers]);

  if (!isOpen || !result) return null;

  const isWin = result.outcome === "WIN";
  const isK3 = result.game === "K3";
  const isDualColor = result.sum === 0 || result.sum === 5;

  // Show suspense reveal animation
  if (showSuspense) {
    return (
      <SuspenseReveal
        isActive={showSuspense}
        gameType={isK3 ? "dice" : "number"}
        finalNumber={result.sum}
        finalDice={result.dice as [number, number, number] | undefined}
        onRevealComplete={handleSuspenseComplete}
        duration={SUSPENSE_DURATION_MS}
        onPlayDrumRoll={onPlayDrumRoll}
        onPlayRevealClimax={onPlayRevealClimax}
      />
    );
  }

  // Don't show result modal until suspense is complete
  if (!showResult) return null;
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[110]"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
    >
      <div 
        className="relative mx-auto"
        style={{ 
          width: "86%", 
          maxWidth: 380,
          background: isWin
            ? "linear-gradient(180deg, #fbbf24 0%, #f59e0b 15%, #f97316 50%, #ea580c 85%, #dc2626 100%)"
            : "linear-gradient(180deg, #94a3b8 0%, #64748b 40%, #475569 100%)",
          borderRadius: 18,
          boxShadow: isWin 
            ? "0 0 40px rgba(251,191,36,0.4), 0 12px 40px rgba(0,0,0,0.3)"
            : "0 8px 32px rgba(0,0,0,0.3)",
          padding: 18,
          animation: "globalModalEnter 350ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          overflow: "hidden",
        }}
      >
        {/* Internal sparkles for WIN only */}
        {isWin && <InternalSparkles />}

        {/* Trophy/Sad Icon */}
        <div className="flex justify-center mb-3 relative z-10">
          <div 
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: isWin
                ? "linear-gradient(135deg, #fef08a 0%, #fde047 30%, #facc15 60%, #eab308 100%)"
                : "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 50%, #9ca3af 100%)",
              boxShadow: isWin
                ? "0 0 24px rgba(250,204,21,0.6), 0 6px 20px rgba(234,179,8,0.4), inset 0 2px 4px rgba(255,255,255,0.4)"
                : "0 4px 12px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "iconBounce 0.5s ease-out 0.2s both",
            }}
          >
            <span style={{ fontSize: 36, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>
              {isWin ? "🏆" : "😔"}
            </span>
          </div>
          {isWin && (
            <>
              <span className="absolute -left-2 top-1/2 -translate-y-1/2 text-xl opacity-80" style={{ filter: "drop-shadow(0 0 4px rgba(255,215,0,0.6))", animation: "sparkleIn 0.4s ease-out 0.4s both" }}>✨</span>
              <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-xl opacity-80" style={{ filter: "drop-shadow(0 0 4px rgba(255,215,0,0.6))", animation: "sparkleIn 0.4s ease-out 0.5s both" }}>✨</span>
            </>
          )}
        </div>

        {/* Title */}
        <h2 
          className="text-center text-white font-extrabold text-2xl mb-3 relative z-10"
          style={{ 
            textShadow: "0 2px 6px rgba(0,0,0,0.25)", 
            letterSpacing: "0.3px",
            animation: "slideUpFade 0.4s ease-out 0.15s both",
          }}
        >
          {isWin ? "Congratulations" : "Lose"}
        </h2>

        {/* K3 Dice display */}
        {isK3 && result.dice && (
          <div 
            className="flex items-center justify-center gap-2 mb-3 relative z-10"
            style={{ animation: "slideUpFade 0.4s ease-out 0.2s both" }}
          >
            {result.dice.map((d, i) => (
              <MiniDice key={i} value={d} size={36} />
            ))}
            <span className="text-white font-bold text-lg ml-2" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>= {result.sum}</span>
          </div>
        )}

        {/* Lottery results row */}
        <div 
          className="flex items-center justify-center gap-2 mb-4 relative z-10"
          style={{ animation: "slideUpFade 0.4s ease-out 0.25s both" }}
        >
          <span className="text-white/70 text-xs font-medium mr-1">Lottery results</span>
          <ResultPill bgStyle={getColorGradient(result.colors, result.bigSmall)}>{getColorText(result.colors, result.bigSmall)}</ResultPill>
          {!isK3 && (isDualColor ? (
            <DualColorNumber num={result.sum} size={28} />
          ) : (
            <ResultPill bgStyle={getNumberBgColor(result.sum)}>{result.sum}</ResultPill>
          ))}
          <ResultPill bgStyle="linear-gradient(135deg, #4ade80 0%, #22c55e 100%)">{result.bigSmall || (result.sum >= 5 ? "Big" : "Small")}</ResultPill>
        </div>

        {/* Bonus/Loss Section */}
        <div 
          className="rounded-2xl overflow-hidden mb-3 relative z-10"
          style={{ 
            background: isWin
              ? "linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)"
              : "rgba(255,255,255,0.1)",
            boxShadow: isWin ? "inset 0 2px 4px rgba(0,0,0,0.05)" : "none",
            animation: "slideUpFade 0.4s ease-out 0.3s both",
          }}
        >
          {isWin && (
            <div 
              className="h-3 w-full" 
              style={{ 
                background: "radial-gradient(circle at 50% 0, transparent 8px, #fffbeb 8px)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 8px",
              }}
            />
          )}
          <div className={`px-4 ${isWin ? "pb-4" : "py-4"} text-center`}>
            <span className={isWin ? "text-orange-500 text-sm font-semibold" : "text-white/70 text-sm font-medium"}>
              {isWin ? "Bonus" : "Loss"}
            </span>
            <p 
              className="text-3xl font-extrabold mt-1"
              style={isWin ? { 
                background: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "amountPop 0.5s ease-out 0.4s both",
              } : {
                color: "#fff",
              }}
            >
              {isWin 
                ? formatPayout(result.payout)
                : `-${formatPayout(result.betAmount)}`
              }
            </p>
            
            {/* Period + Trade ID */}
            <p
              className="mt-2 text-center"
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: isWin ? "#6B7280" : "rgba(255,255,255,0.6)",
                letterSpacing: "0.2px",
              }}
            >
              <span style={{ fontWeight: 600 }}>{result.game}</span>{" "}
              {getDurationLabel(result.game, result.duration)}{" "}
              <span style={{ opacity: 0.6 }}>|</span>{" "}
              <span style={{ fontWeight: 600 }}>Bet:</span>{" "}
              {result.betType}
            </p>
          </div>
        </div>

        {/* Footer - auto close countdown */}
        <div className="flex items-center justify-center gap-2 relative z-10">
          <div 
            className="w-4 h-4 rounded-full border-2 border-white/50 flex items-center justify-center"
            style={{ animation: `spin 3s linear infinite` }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
          </div>
          <span className="text-white/70 text-xs">{countdown} second{countdown !== 1 ? 's' : ''} auto close</span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ 
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <span className="text-white text-xl font-light">×</span>
        </button>

        <style>{`
          @keyframes globalModalEnter {
            0% { opacity: 0; transform: scale(0.8) translateY(20px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes iconBounce {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes sparkleIn {
            0% { transform: translateY(-50%) scale(0) rotate(-180deg); opacity: 0; }
            100% { transform: translateY(-50%) scale(1) rotate(0deg); opacity: 0.8; }
          }
          @keyframes slideUpFade {
            0% { opacity: 0; transform: translateY(12px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes amountPop {
            0% { transform: scale(0.5); opacity: 0; }
            60% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default GlobalResultModal;
