// Unified Result Modal for all games
// WIN and LOSE modals with SAME SIZE and LAYOUT - only text/colors differ

import React, { useEffect, useRef, useState, useCallback, forwardRef } from "react";
import { formatPayout } from "@/lib/payout";
import { getGameTypeLabel } from "@/lib/tradeId";

interface ResultData {
  gameType: string;
  tradeId: string;
  number: number;
  colors: string[];
  bigSmall: "Big" | "Small";
  hasBet: boolean;
  isWin?: boolean;
  finalPayout?: number;
  betAmount?: number;
  dice?: [number, number, number];
}

interface ResultModalProps {
  showResultModal: boolean;
  resultData: ResultData | null;
  resultPhase: "reveal" | "outcome";
  resultDisplayNumber: number;
  onClose: () => void;
  gameName?: string;
  minVisibleMs?: number;
  autoCloseMs?: number;
}

const getNumberBgColor = (num: number): string => {
  if (num === 0 || num === 5) return "";
  if ([1, 3, 7, 9].includes(num)) return "#22c55e";
  return "#ef4444";
};

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

const DualColorNumber = ({ num, size = 28 }: { num: number; size?: number }) => {
  const leftColor = num === 0 ? "#ef4444" : "#22c55e";
  const ringColor = leftColor;
  const rightColor = "#a855f7";
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold overflow-hidden"
      style={{
        width: size, height: size, border: `2px solid ${ringColor}`,
        boxShadow: "0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
        position: "relative", fontSize: size * 0.45,
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "100%", background: leftColor }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", background: rightColor }} />
      <span style={{ position: "relative", zIndex: 1, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>{num}</span>
    </div>
  );
};

const InternalSparkles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[18px]">
    {[...Array(12)].map((_, i) => (
      <div key={i} className="absolute" style={{
        width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2,
        background: `radial-gradient(circle, rgba(255,215,0,${0.6 + (i % 3) * 0.15}) 0%, transparent 70%)`,
        borderRadius: "50%", left: `${10 + (i * 7)}%`, top: `${15 + ((i % 4) * 20)}%`,
        animation: `sparkleFloat ${1.5 + (i * 0.2)}s ease-in-out infinite`, animationDelay: `${i * 0.15}s`,
      }} />
    ))}
    <style>{`@keyframes sparkleFloat { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; } 50% { transform: translateY(-8px) scale(1.3); opacity: 1; } }`}</style>
  </div>
);

const MiniDice = ({ value, size = 32 }: { value: number; size?: number }) => {
  const dotPositions: Record<number, number[][]> = {
    1: [[50, 50]], 2: [[30, 30], [70, 70]], 3: [[30, 30], [50, 50], [70, 70]],
    4: [[30, 30], [70, 30], [30, 70], [70, 70]], 5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
    6: [[30, 30], [70, 30], [30, 50], [70, 50], [30, 70], [70, 70]],
  };
  const dots = dotPositions[value] || dotPositions[1];
  const dotSize = size * 0.18;
  return (
    <div style={{
      width: size, height: size,
      background: "linear-gradient(145deg, #ef4444 0%, #dc2626 40%, #b91c1c 100%)",
      borderRadius: size * 0.2, position: "relative",
      boxShadow: "0 2px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.3)", flexShrink: 0,
    }}>
      {dots.map((pos, idx) => (
        <div key={idx} style={{
          position: "absolute", left: `${pos[0]}%`, top: `${pos[1]}%`, transform: "translate(-50%, -50%)",
          width: dotSize, height: dotSize, borderRadius: "50%",
          background: "linear-gradient(145deg, #fef08a 0%, #facc15 100%)",
          boxShadow: "inset 0 -1px 2px rgba(0,0,0,0.2)",
        }} />
      ))}
    </div>
  );
};

const ResultModal = ({
  showResultModal, resultData, resultPhase, resultDisplayNumber, onClose,
  gameName = "Win Go", minVisibleMs = 3000, autoCloseMs = 3000,
}: ResultModalProps) => {
  const [canAutoClose, setCanAutoClose] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const minTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingAutoCloseRef = useRef(false);
  const modalOpenTimeRef = useRef<number | null>(null);

  const cleanupTimers = useCallback(() => {
    if (minTimerRef.current) { clearTimeout(minTimerRef.current); minTimerRef.current = null; }
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null; }
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
    pendingAutoCloseRef.current = false;
  }, []);

  useEffect(() => {
    if (!showResultModal || !resultData || resultPhase !== "outcome" || !resultData.hasBet) {
      cleanupTimers(); setCanAutoClose(false); setCountdown(Math.ceil(autoCloseMs / 1000)); return;
    }
    setCanAutoClose(false); setCountdown(Math.ceil(autoCloseMs / 1000));
    pendingAutoCloseRef.current = false; modalOpenTimeRef.current = Date.now();
    countdownIntervalRef.current = setInterval(() => {
      if (modalOpenTimeRef.current) {
        const elapsed = Date.now() - modalOpenTimeRef.current;
        setCountdown(Math.max(0, Math.ceil((autoCloseMs - elapsed) / 1000)));
      }
    }, 100);
    minTimerRef.current = setTimeout(() => {
      setCanAutoClose(true);
      if (pendingAutoCloseRef.current) onClose();
    }, minVisibleMs);
    autoTimerRef.current = setTimeout(() => {
      pendingAutoCloseRef.current = true;
      setCanAutoClose((current) => { if (current) onClose(); return current; });
    }, autoCloseMs);
    return cleanupTimers;
  }, [showResultModal, resultData?.tradeId, resultPhase, minVisibleMs, autoCloseMs, onClose, cleanupTimers]);

  useEffect(() => () => cleanupTimers(), [cleanupTimers]);
  if (!showResultModal || !resultData) return null;

  if (resultPhase === "reveal") {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[110]" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
        <div className="relative" style={{
          width: 100, height: 100, borderRadius: "50%",
          background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
          boxShadow: "0 0 50px rgba(251,191,36,0.5), 0 8px 32px rgba(0,0,0,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "revealPulse 0.2s ease-in-out infinite",
        }}>
          <span style={{ fontSize: 48, fontWeight: 800, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>{resultDisplayNumber}</span>
        </div>
        <style>{`@keyframes revealPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }`}</style>
      </div>
    );
  }

  const getColorText = () => {
    if (!resultData.colors || resultData.colors.length === 0) return resultData.bigSmall;
    if (resultData.colors.includes("violet") && resultData.colors.includes("green")) return "Violet Green";
    if (resultData.colors.includes("violet") && resultData.colors.includes("red")) return "Red Violet";
    const firstColor = resultData.colors[0];
    return firstColor ? firstColor.charAt(0).toUpperCase() + firstColor.slice(1) : "";
  };

  const getColorGradient = () => {
    if (!resultData.colors || resultData.colors.length === 0) {
      return resultData.bigSmall === "Big" ? "linear-gradient(135deg, #fb923c 0%, #f97316 100%)" : "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)";
    }
    if (resultData.colors.includes("violet") && resultData.colors.includes("green")) return "linear-gradient(90deg, #a855f7 50%, #22c55e 50%)";
    if (resultData.colors.includes("violet") && resultData.colors.includes("red")) return "linear-gradient(90deg, #ef4444 50%, #a855f7 50%)";
    if (resultData.colors.includes("green")) return "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)";
    if (resultData.colors.includes("red")) return "linear-gradient(135deg, #f87171 0%, #ef4444 100%)";
    return "linear-gradient(135deg, #c084fc 0%, #a855f7 100%)";
  };

  const isDualColor = resultData.number === 0 || resultData.number === 5;

  if (!resultData.hasBet) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[110]" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }} onClick={onClose}>
        <div className="relative mx-auto animate-scale-in" style={{ width: "86%", maxWidth: 380, background: "linear-gradient(180deg, #f97316 0%, #ea580c 50%, #dc2626 100%)", borderRadius: 18, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", padding: 18, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
          <p className="text-white/80 text-sm mb-3 font-medium">Result</p>
          {resultData.dice && (
            <div className="flex items-center justify-center gap-2 mb-3">
              {resultData.dice.map((d, i) => <MiniDice key={i} value={d} size={36} />)}
              <span className="text-white font-bold text-lg ml-2">= {resultData.number}</span>
            </div>
          )}
          <div className="flex items-center justify-center gap-2 mb-4">
            <ResultPill bgStyle={getColorGradient()}>{getColorText()}</ResultPill>
            {!resultData.dice && (isDualColor ? <DualColorNumber num={resultData.number} size={28} /> : <ResultPill bgStyle={getNumberBgColor(resultData.number)}>{resultData.number}</ResultPill>)}
            <ResultPill bgStyle="linear-gradient(135deg, #4ade80 0%, #22c55e 100%)">{resultData.bigSmall}</ResultPill>
          </div>
          <p className="text-white/70 text-xs">Period: {getGameTypeLabel(resultData.gameType)} | Trade ID: {resultData.tradeId}</p>
        </div>
      </div>
    );
  }

  const isWin = resultData.isWin === true;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[110]" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}>
      <div className="relative mx-auto" style={{
        width: "86%", maxWidth: 380,
        background: isWin ? "linear-gradient(180deg, #fbbf24 0%, #f59e0b 15%, #f97316 50%, #ea580c 85%, #dc2626 100%)" : "linear-gradient(180deg, #94a3b8 0%, #64748b 40%, #475569 100%)",
        borderRadius: 18, boxShadow: isWin ? "0 0 40px rgba(251,191,36,0.4), 0 12px 40px rgba(0,0,0,0.3)" : "0 8px 32px rgba(0,0,0,0.3)",
        padding: 18, animation: "modalEnter 220ms ease-out", overflow: "hidden",
      }}>
        {isWin && <InternalSparkles />}
        <div className="flex justify-center mb-3 relative z-10">
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: isWin ? "linear-gradient(135deg, #fef08a 0%, #fde047 30%, #facc15 60%, #eab308 100%)" : "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 50%, #9ca3af 100%)",
            boxShadow: isWin ? "0 0 24px rgba(250,204,21,0.6), 0 6px 20px rgba(234,179,8,0.4), inset 0 2px 4px rgba(255,255,255,0.4)" : "0 4px 12px rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 36, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>{isWin ? "🏆" : "😔"}</span>
          </div>
          {isWin && (<><span className="absolute -left-2 top-1/2 -translate-y-1/2 text-xl opacity-80">✨</span><span className="absolute -right-2 top-1/2 -translate-y-1/2 text-xl opacity-80">✨</span></>)}
        </div>
        <h2 className="text-center text-white font-extrabold text-2xl mb-3 relative z-10" style={{ textShadow: "0 2px 6px rgba(0,0,0,0.25)", letterSpacing: "0.3px" }}>{isWin ? "Congratulations" : "Lose"}</h2>
        {resultData.dice && (
          <div className="flex items-center justify-center gap-2 mb-3 relative z-10">
            {resultData.dice.map((d, i) => <MiniDice key={i} value={d} size={36} />)}
            <span className="text-white font-bold text-lg ml-2" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>= {resultData.number}</span>
          </div>
        )}
        <div className="flex items-center justify-center gap-2 mb-4 relative z-10">
          <span className="text-white/70 text-xs font-medium mr-1">Lottery results</span>
          <ResultPill bgStyle={getColorGradient()}>{getColorText()}</ResultPill>
          {!resultData.dice && (isDualColor ? <DualColorNumber num={resultData.number} size={28} /> : <ResultPill bgStyle={getNumberBgColor(resultData.number)}>{resultData.number}</ResultPill>)}
          <ResultPill bgStyle="linear-gradient(135deg, #4ade80 0%, #22c55e 100%)">{resultData.bigSmall}</ResultPill>
        </div>
        <div className="rounded-2xl overflow-hidden mb-3 relative z-10" style={{ background: isWin ? "linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)" : "rgba(255,255,255,0.1)", boxShadow: isWin ? "inset 0 2px 4px rgba(0,0,0,0.05)" : "none" }}>
          {isWin && <div className="h-3 w-full" style={{ background: "radial-gradient(circle at 50% 0, transparent 8px, #fffbeb 8px)", backgroundSize: "16px 16px", backgroundPosition: "0 8px" }} />}
          <div className={`px-4 ${isWin ? "pb-4" : "py-4"} text-center`}>
            <span className={isWin ? "text-orange-500 text-sm font-semibold" : "text-white/70 text-sm font-medium"}>{isWin ? "Bonus" : "Loss"}</span>
            <p className="text-3xl font-extrabold mt-1" style={isWin ? { background: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : { color: "#fff" }}>
              {isWin ? formatPayout(resultData.finalPayout || 0) : `-${formatPayout(resultData.betAmount || 0)}`}
            </p>
            <p className="mt-2 text-center" style={{ fontSize: 12, fontWeight: 500, color: isWin ? "#6B7280" : "rgba(255,255,255,0.6)", letterSpacing: "0.2px" }}>
              <span style={{ fontWeight: 600 }}>Period:</span> {getGameTypeLabel(resultData.gameType)} <span style={{ opacity: 0.6 }}>|</span> <span style={{ fontWeight: 600 }}>Trade ID:</span> {resultData.tradeId}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 relative z-10">
          <div className="w-4 h-4 rounded-full border-2 border-white/50 flex items-center justify-center" style={{ animation: `spin ${autoCloseMs / 1000}s linear infinite` }}>
            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
          </div>
          <span className="text-white/70 text-xs">{countdown} second{countdown !== 1 ? 's' : ''} auto close</span>
        </div>
        <button onClick={onClose} className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <span className="text-white text-xl font-light">×</span>
        </button>
        <style>{`@keyframes modalEnter { 0% { opacity: 0; transform: scale(0.92); } 100% { opacity: 1; transform: scale(1); } } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

export default ResultModal;
