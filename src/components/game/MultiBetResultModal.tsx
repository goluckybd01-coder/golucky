// Multi-bet Result Summary Modal - shows X wins / Y loses / total payout
import { useEffect, useRef, useState, useCallback } from "react";
import { formatPayout } from "@/lib/payout";

interface MultiBetResult {
  tradeId: string;
  winCount: number;
  loseCount: number;
  totalPayout: number;
  totalBetAmount: number;
  dice?: [number, number, number];
  sum?: number;
}

interface MultiBetResultModalProps {
  show: boolean;
  result: MultiBetResult | null;
  onClose: () => void;
  gameName?: string;
  minVisibleMs?: number; // Minimum time modal stays visible (default 3000)
  autoCloseMs?: number;  // Auto-close after this time (default 3000)
}

// K3 Mini Dice for display
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

// Sparkle particle inside card
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

const MultiBetResultModal = ({
  show,
  result,
  onClose,
  gameName = "K3",
  minVisibleMs = 3000,
  autoCloseMs = 3000,
}: MultiBetResultModalProps) => {
  const [canAutoClose, setCanAutoClose] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const minTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingAutoCloseRef = useRef(false);
  const modalOpenTimeRef = useRef<number | null>(null);

  // Cleanup all timers
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

  // Handle auto-close logic
  useEffect(() => {
    if (!show || !result) {
      cleanupTimers();
      setCanAutoClose(false);
      setCountdown(Math.ceil(autoCloseMs / 1000));
      return;
    }

    // Reset state when modal opens
    setCanAutoClose(false);
    setCountdown(Math.ceil(autoCloseMs / 1000));
    pendingAutoCloseRef.current = false;
    modalOpenTimeRef.current = Date.now();

    // Start countdown display
    countdownIntervalRef.current = setInterval(() => {
      if (modalOpenTimeRef.current) {
        const elapsed = Date.now() - modalOpenTimeRef.current;
        const remaining = Math.ceil((autoCloseMs - elapsed) / 1000);
        setCountdown(Math.max(0, remaining));
      }
    }, 100);

    // Min timer: enables auto-close after minVisibleMs
    minTimerRef.current = setTimeout(() => {
      setCanAutoClose(true);
      // If auto-close was already triggered, close now
      if (pendingAutoCloseRef.current) {
        onClose();
      }
    }, minVisibleMs);

    // Auto timer: triggers close after autoCloseMs (but respects minVisibleMs)
    autoTimerRef.current = setTimeout(() => {
      // Mark that we want to auto-close
      pendingAutoCloseRef.current = true;
      // If min time has passed, close immediately
      setCanAutoClose((current) => {
        if (current) {
          onClose();
        }
        return current;
      });
    }, autoCloseMs);

    return cleanupTimers;
  }, [show, result?.tradeId, minVisibleMs, autoCloseMs, onClose, cleanupTimers]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanupTimers;
  }, [cleanupTimers]);

  if (!show || !result) return null;

  const hasWins = result.winCount > 0;
  const netProfit = result.totalPayout - result.totalBetAmount;
  const isNetPositive = netProfit > 0;
  const totalBets = result.winCount + result.loseCount;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[110]"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
    >
      <div 
        className="relative mx-auto"
        style={{ 
          width: "88%", 
          maxWidth: 400,
          background: hasWins
            ? "linear-gradient(180deg, #fbbf24 0%, #f59e0b 15%, #f97316 50%, #ea580c 85%, #dc2626 100%)"
            : "linear-gradient(180deg, #94a3b8 0%, #64748b 40%, #475569 100%)",
          borderRadius: 20,
          boxShadow: hasWins 
            ? "0 0 50px rgba(251,191,36,0.45), 0 14px 50px rgba(0,0,0,0.35)"
            : "0 10px 40px rgba(0,0,0,0.35)",
          padding: 20,
          animation: "modalEnter 220ms ease-out",
          overflow: "hidden",
        }}
      >
        {/* Internal sparkles for wins */}
        {hasWins && <InternalSparkles />}

        {/* Icon */}
        <div className="flex justify-center mb-4 relative z-10">
          <div 
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: hasWins
                ? "linear-gradient(135deg, #fef08a 0%, #fde047 30%, #facc15 60%, #eab308 100%)"
                : "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 50%, #9ca3af 100%)",
              boxShadow: hasWins
                ? "0 0 28px rgba(250,204,21,0.65), 0 8px 24px rgba(234,179,8,0.45), inset 0 2px 4px rgba(255,255,255,0.4)"
                : "0 4px 14px rgba(0,0,0,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 40, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>
              {hasWins ? "🎰" : "📊"}
            </span>
          </div>
          {/* Sparkle decorations for win */}
          {hasWins && (
            <>
              <span className="absolute -left-2 top-1/2 -translate-y-1/2 text-xl opacity-80" style={{ filter: "drop-shadow(0 0 4px rgba(255,215,0,0.6))" }}>✨</span>
              <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-xl opacity-80" style={{ filter: "drop-shadow(0 0 4px rgba(255,215,0,0.6))" }}>✨</span>
            </>
          )}
        </div>

        {/* Title */}
        <h2 
          className="text-center text-white font-extrabold text-2xl mb-2 relative z-10"
          style={{ textShadow: "0 2px 6px rgba(0,0,0,0.25)", letterSpacing: "0.3px" }}
        >
          Round Summary
        </h2>
        <p className="text-center text-white/70 text-sm mb-4 relative z-10">
          {totalBets} bet{totalBets > 1 ? "s" : ""} placed
        </p>

        {/* K3 Dice display */}
        {result.dice && (
          <div className="flex items-center justify-center gap-2 mb-4 relative z-10">
            {result.dice.map((d, i) => (
              <MiniDice key={i} value={d} size={38} />
            ))}
            <span className="text-white font-bold text-xl ml-2" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
              = {result.sum}
            </span>
          </div>
        )}

        {/* Win/Lose Stats */}
        <div className="flex justify-center gap-4 mb-4 relative z-10">
          {/* Wins */}
          <div 
            className="flex-1 rounded-xl text-center py-3"
            style={{ 
              background: "rgba(34, 197, 94, 0.2)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
            }}
          >
            <p className="text-green-300 text-xs font-medium mb-1">Wins</p>
            <p className="text-white text-2xl font-bold">{result.winCount}</p>
          </div>
          {/* Loses */}
          <div 
            className="flex-1 rounded-xl text-center py-3"
            style={{ 
              background: "rgba(239, 68, 68, 0.2)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
            }}
          >
            <p className="text-red-300 text-xs font-medium mb-1">Loses</p>
            <p className="text-white text-2xl font-bold">{result.loseCount}</p>
          </div>
        </div>

        {/* Payout Section */}
        <div 
          className="rounded-2xl overflow-hidden mb-4 relative z-10"
          style={{ 
            background: isNetPositive
              ? "linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)"
              : "rgba(255,255,255,0.1)",
            boxShadow: isNetPositive ? "inset 0 2px 4px rgba(0,0,0,0.05)" : "none",
          }}
        >
          {/* Decorative top edge for positive */}
          {isNetPositive && (
            <div 
              className="h-3 w-full" 
              style={{ 
                background: "radial-gradient(circle at 50% 0, transparent 8px, #fffbeb 8px)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 8px",
              }}
            />
          )}
          <div className={`px-4 ${isNetPositive ? "pb-4" : "py-4"}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={isNetPositive ? "text-orange-600/80 text-xs font-medium" : "text-white/60 text-xs font-medium"}>
                Total Wagered
              </span>
              <span className={isNetPositive ? "text-orange-700 text-sm font-semibold" : "text-white/80 text-sm font-semibold"}>
                {formatPayout(result.totalBetAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className={isNetPositive ? "text-orange-600/80 text-xs font-medium" : "text-white/60 text-xs font-medium"}>
                Total Payout
              </span>
              <span className={isNetPositive ? "text-orange-700 text-sm font-semibold" : "text-white/80 text-sm font-semibold"}>
                {formatPayout(result.totalPayout)}
              </span>
            </div>
            <div className="border-t border-dashed pt-2 mt-2" style={{ borderColor: isNetPositive ? "#fdba74" : "rgba(255,255,255,0.2)" }}>
              <div className="flex justify-between items-center">
                <span className={isNetPositive ? "text-orange-500 text-sm font-semibold" : "text-white/70 text-sm font-semibold"}>
                  Net {isNetPositive ? "Profit" : "Loss"}
                </span>
                <p 
                  className="text-2xl font-extrabold"
                  style={isNetPositive ? { 
                    background: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  } : {
                    color: "#ef4444",
                  }}
                >
                  {isNetPositive ? "+" : ""}{formatPayout(netProfit)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trade ID */}
        <p className="text-center text-white/60 text-xs mb-3 relative z-10">
          Trade ID: {result.tradeId}
        </p>

        {/* Footer - auto close countdown */}
        <div className="flex items-center justify-center gap-2 relative z-10">
          <div 
            className="w-4 h-4 rounded-full border-2 border-white/50 flex items-center justify-center"
            style={{ animation: `spin ${autoCloseMs / 1000}s linear infinite` }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
          </div>
          <span className="text-white/70 text-xs">{countdown} second{countdown !== 1 ? 's' : ''} auto close</span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full flex items-center justify-center"
          style={{ 
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <span className="text-white text-2xl font-light">×</span>
        </button>

        <style>{`
          @keyframes modalEnter {
            0% { opacity: 0; transform: scale(0.92); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default MultiBetResultModal;
export type { MultiBetResult };
