import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import PageScaffold from "@/components/templates/PageScaffold";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Wallet, ChevronLeft, ChevronRight, Check, Sparkles, Loader2, Search, HelpCircle } from "lucide-react";
import VolumeControl from "@/components/game/VolumeControl";
import ThemeToggle from "@/components/game/ThemeToggle";
import { useGameSounds } from "@/hooks/useGameSounds";
import { useWalletDB } from "@/hooks/useWalletDB";
import { useGameBets } from "@/hooks/useGameBets";
import { useAIPrediction } from "@/hooks/useAIPrediction";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";
import { calculatePayout, formatPayout, GAME_ODDS } from "@/lib/payout";
import { formatTaka } from "@/lib/currency";
import GameMessageBar from "@/components/game/GameMessageBar";
import HowToPlayModal from "@/components/game/HowToPlayModal";
import BetPlacedAnimation from "@/components/BetPlacedAnimation";
import BetSheet from "@/components/game/BetSheet";
import BetPanelContent from "@/components/game/BetPanelContent";
import { trxWinHowToPlay } from "@/content/trxWinHowToPlay";
import { AIPredictionHistory } from "@/components/game/AIPredictionHistory";
import { autoVerifyPredictions } from "@/lib/autoVerifyPredictions";
import { settleBetsDB } from "@/lib/gameHistoryService";
import BetHistoryFilters, { filterAndSortBetHistory, type FilterStatus, type SortOption, type DateRange } from "@/components/game/BetHistoryFilters";
import BetHistoryChart from "@/components/game/BetHistoryChart";
import HistoryPagination from "@/components/game/HistoryPagination";
import { getBetBreakdown, markBetKeyPlaced } from "@/lib/betFees";
import { CopyablePeriod } from "@/components/game/CopyablePeriod";
import { BetDetailsModal, type BetDetails } from "@/components/game/BetDetailsModal";
import { saveGameHistory, loadMyHistory, type BetHistoryItem, type PendingBet } from "@/lib/gameStorage";
import { supabase } from "@/integrations/supabase/client";
import LiveBetsFeed from "@/components/game/LiveBetsFeed";
import { dispatchGlobalGameResult } from "@/lib/globalGameResult";
import { generateBiasedWinGoNumber } from "@/lib/houseEdgeResult";
import Leaderboard from "@/components/game/Leaderboard";
import { FirstDepositBonusBanner } from "@/components/FirstDepositBonusBanner";
import { getAdminSetResult, parseWinGoResult } from "@/lib/adminResultService";

const GAME_NAME = "trxWin" as const;

const gameTypes = [
  { id: "1min", label: "Trx Win Go", sublabel: "1Min", duration: 60 },
  { id: "3min", label: "Trx Win Go", sublabel: "3Min", duration: 180 },
  { id: "5min", label: "Trx Win Go", sublabel: "5Min", duration: 300 },
  { id: "10min", label: "Trx Win Go", sublabel: "10Min", duration: 600 },
];

type RoundState = "PLAYING" | "COUNTDOWN_LOCK" | "REVEAL" | "RESETTING";

interface ModeState {
  roundKey: string;
  history: any[];
  myHistory: BetHistoryItem[];
  recentResults: number[];
}

// Get number colors for display
const getNumberColors = (num: number): string[] => {
  if (num === 0) return ["violet", "red"];
  if (num === 5) return ["violet", "green"];
  if ([1, 3, 7, 9].includes(num)) return ["green"];
  return ["red"];
};

const getNumberTextColor = (num: number): string => {
  if ([1, 3, 7, 9].includes(num)) return "text-green-500";
  if ([2, 4, 6, 8].includes(num)) return "text-red-500";
  return "text-purple-500";
};

// Generate period number from round key
const generatePeriodNumber = (gameType: string, roundKey: string): string => {
  const parts = roundKey.split(":");
  if (parts.length >= 3) {
    const timestamp = parseInt(parts[2]);
    if (!isNaN(timestamp)) {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const serial = Math.floor((timestamp % 86400000) / (getDurationSeconds(gameType) * 1000)) + 1;
      return `${year}${month}${day}${String(serial).padStart(5, '0')}`;
    }
  }
  return Date.now().toString();
};

// Get duration in seconds
const getDurationSeconds = (gameType: string): number => {
  const game = gameTypes.find(g => g.id === gameType);
  return game?.duration || 60;
};

// Get current round key
const getCurrentRoundKey = (gameType: string): string => {
  const duration = getDurationSeconds(gameType) * 1000;
  const now = Date.now();
  const roundStart = Math.floor(now / duration) * duration;
  return `TRX:${gameType}:${roundStart}`;
};

// Get remaining seconds for a round
const getRemainingSeconds = (roundKey: string, gameType: string): number => {
  const parts = roundKey.split(":");
  if (parts.length >= 3) {
    const roundStart = parseInt(parts[2]);
    const duration = getDurationSeconds(gameType) * 1000;
    const roundEnd = roundStart + duration;
    return Math.max(0, Math.ceil((roundEnd - Date.now()) / 1000));
  }
  return getDurationSeconds(gameType);
};

// Generate initial game history
const generateInitialHistory = (gameType: string): any[] => {
  const stored = localStorage.getItem(`trxWin_${gameType}_history`);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  
  const duration = getDurationSeconds(gameType) * 1000;
  const now = Date.now();
  const history = [];
  
  for (let i = 0; i < 15; i++) {
    const roundTime = now - (i * duration);
    const roundKey = `TRX:${gameType}:${Math.floor(roundTime / duration) * duration}`;
    const num = Math.floor(Math.random() * 10);
    history.push({
      period: generatePeriodNumber(gameType, roundKey),
      number: num,
      bigSmall: num >= 5 ? "Big" : "Small",
      colors: getNumberColors(num),
      blockTime: new Date(roundTime).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      hashValue: `**${Math.random().toString(36).substring(2, 6)}`,
    });
  }
  
  localStorage.setItem(`trxWin_${gameType}_history`, JSON.stringify(history));
  return history;
};

// 3D Number Ball Component - GoLucky style
const NumberBall = ({ num, size = "normal" }: { num: number; size?: "normal" | "small" | "large" }) => {
  const isTiny = size === "small";
  const isLarge = size === "large";
  const ballSize = isTiny ? 28 : isLarge ? 56 : 40;
  const fontSize = isTiny ? 11 : isLarge ? 22 : 15;
  const ringWidth = isTiny ? 2 : isLarge ? 4 : 3;

  const GREEN = "#22c55e";
  const RED = "#ef4444";
  const VIOLET = "#a855f7";

  const isDualColor = num === 0 || num === 5;
  let leftColor = "", rightColor = "", singleColor = "", ringColor = "";

  if (num === 0) {
    leftColor = RED; rightColor = VIOLET; ringColor = RED;
  } else if (num === 5) {
    leftColor = GREEN; rightColor = VIOLET; ringColor = GREEN;
  } else if ([1, 3, 7, 9].includes(num)) {
    singleColor = GREEN; ringColor = GREEN;
  } else {
    singleColor = RED; ringColor = RED;
  }

  return (
    <div
      style={{
        width: ballSize,
        height: ballSize,
        borderRadius: "50%",
        border: `${ringWidth}px solid ${ringColor}`,
        boxShadow: `inset 0 -3px 6px rgba(0,0,0,0.25), inset 0 3px 6px rgba(255,255,255,0.4), 0 2px 6px rgba(0,0,0,0.2)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flexShrink: 0,
        overflow: "hidden",
        background: isDualColor ? "transparent" : singleColor,
      }}
    >
      {isDualColor && (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "100%", background: leftColor }} />
          <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", background: rightColor }} />
        </>
      )}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          borderRadius: "50%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 40%, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.15) 100%)",
          pointerEvents: "none",
        }}
      />
      <span style={{ color: "#fff", fontWeight: 700, fontSize, textShadow: "0 1px 2px rgba(0,0,0,0.4)", position: "relative", zIndex: 2 }}>
        {num}
      </span>
    </div>
  );
};

// Letter Ball for Result Display (when rolling)
const LetterBall = ({ letter, color }: { letter: string; color: "green" | "red" | "violet" }) => {
  const bg = color === "green" ? "#22c55e" : color === "red" ? "#ef4444" : "#a855f7";
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: bg,
        border: `3px solid ${bg}`,
        boxShadow: `inset 0 -3px 6px rgba(0,0,0,0.25), inset 0 3px 6px rgba(255,255,255,0.4), 0 4px 8px rgba(0,0,0,0.3)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ color: "#fff", fontWeight: 700, fontSize: 18, textShadow: "0 2px 4px rgba(0,0,0,0.4)" }}>{letter}</span>
    </div>
  );
};

// Chart Position Tab Component
const PositionTab = ({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`relative px-4 py-2 text-sm font-bold transition-all ${isActive ? "text-white" : "text-gray-500"}`}
  >
    {isActive && (
      <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full shadow-lg" style={{ zIndex: -1 }} />
    )}
    {label}
  </button>
);

// Small indicator ball for chart
const ChartBall = ({ num, isHighlighted }: { num: number; isHighlighted: boolean }) => {
  const GREEN = "#22c55e";
  const RED = "#ef4444";
  const VIOLET = "#a855f7";
  
  let bgColor = "transparent";
  let textColor = "#d1d5db";
  let borderColor = "transparent";
  
  if (isHighlighted) {
    if (num === 0) { bgColor = RED; textColor = "#fff"; borderColor = VIOLET; }
    else if (num === 5) { bgColor = GREEN; textColor = "#fff"; borderColor = VIOLET; }
    else if ([1, 3, 7, 9].includes(num)) { bgColor = GREEN; textColor = "#fff"; borderColor = GREEN; }
    else { bgColor = RED; textColor = "#fff"; borderColor = RED; }
  }
  
  return (
    <span
      className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0"
      style={{
        background: bgColor,
        color: textColor,
        border: isHighlighted ? `2px solid ${borderColor}` : "none",
      }}
    >
      {num}
    </span>
  );
};

// H/L indicator
const HLBadge = ({ isHigh }: { isHigh: boolean }) => (
  <span
    className="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center"
    style={{
      background: isHigh ? "#22c55e" : "#3b82f6",
      color: "#fff",
    }}
  >
    {isHigh ? "H" : "L"}
  </span>
);

// O/E indicator
const OEBadge = ({ isOdd }: { isOdd: boolean }) => (
  <span
    className="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center"
    style={{
      background: isOdd ? "#f97316" : "#22c55e",
      color: "#fff",
      border: `2px solid ${isOdd ? "#f97316" : "#22c55e"}`,
    }}
  >
    {isOdd ? "O" : "E"}
  </span>
);

// Statistics calculation for chart - WinGo/5D style
const calculateChartStats = (history: any[], maxRounds: number = 100) => {
  const values = history.slice(0, maxRounds).map((h: any) => h.number);
  
  // Missing (last seen distance)
  const missing = Array(10).fill(0);
  for (let d = 0; d <= 9; d++) {
    const idx = values.findIndex((v: number) => v === d);
    missing[d] = idx === -1 ? values.length : idx;
  }
  
  // Frequency (counts)
  const counts = Array(10).fill(0);
  values.forEach((v: number) => { counts[v]++; });
  
  // Avg missing
  const avgMissing = Array(10).fill(0);
  for (let d = 0; d <= 9; d++) {
    const appearances = values.reduce((acc: number[], val: number, idx: number) => val === d ? [...acc, idx] : acc, [] as number[]);
    if (appearances.length > 1) {
      const gaps = appearances.slice(1).map((pos: number, i: number) => pos - appearances[i]);
      avgMissing[d] = Math.round(gaps.reduce((a: number, b: number) => a + b, 0) / gaps.length);
    } else {
      avgMissing[d] = appearances.length === 0 ? values.length : 0;
    }
  }
  
  // Max consecutive
  const maxConsecutive = Array(10).fill(0);
  for (let d = 0; d <= 9; d++) {
    let maxStreak = 0, current = 0;
    values.forEach((v: number) => {
      if (v === d) { current++; maxStreak = Math.max(maxStreak, current); }
      else { current = 0; }
    });
    maxConsecutive[d] = maxStreak;
  }
  
  // Hot/Cold digits
  const sorted = [...counts].map((c, i) => ({ digit: i, count: c })).sort((a, b) => b.count - a.count);
  const hotDigits = sorted.slice(0, 3).map(s => s.digit);
  const coldDigits = sorted.slice(-3).map(s => s.digit);
  
  return { missing, avgMissing, counts, maxConsecutive, hotDigits, coldDigits };
};

// ChartTab Component - WinGo/5D Style
interface ChartTabProps {
  gameHistory: any[];
  isAILoading: boolean;
  aiPredictions: any[];
  aiInsight?: string;
  trxStats: any;
  fetchPredictions: (gameType: string, position: string, recent: number[], stats: any) => void;
}

const ChartTab = ({ gameHistory, isAILoading, aiPredictions, aiInsight, trxStats, fetchPredictions }: ChartTabProps) => {
  const [chartPage, setChartPage] = useState(1);
  const chartItemsPerPage = 12;
  
  const stats = useMemo(() => calculateChartStats(gameHistory), [gameHistory]);
  
  const chartTotalPages = Math.max(1, Math.ceil(gameHistory.length / chartItemsPerPage));
  const paginatedChartHistory = useMemo(() => {
    const startIndex = (chartPage - 1) * chartItemsPerPage;
    return gameHistory.slice(startIndex, startIndex + chartItemsPerPage);
  }, [gameHistory, chartPage]);
  
  return (
    <div className="p-3" style={{ background: "#0B1426" }}>
      {/* AI Predictions Section */}
      <div className="mb-3 p-3 rounded-xl" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white text-[11px] font-bold flex items-center gap-1.5">
            <Sparkles className="text-yellow-400" size={14} />
            AI Predictions
          </span>
          <button
            onClick={() => {
              if (!trxStats) return;
              fetchPredictions("TrxWin", "NUMBER", gameHistory.slice(0, 20).map((h: any) => h.number), trxStats);
            }}
            disabled={isAILoading || !trxStats}
            className="px-3 py-1.5 rounded-full text-[10px] font-bold disabled:opacity-50 flex items-center gap-1"
            style={{ background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)", color: "#1e1b4b" }}
          >
            {isAILoading ? <Loader2 size={12} className="animate-spin" /> : "Get AI Tips"}
          </button>
        </div>
        
        {aiPredictions.length > 0 ? (
          <>
            {aiInsight && (
              <div className="mb-2 p-2 rounded-lg bg-white/10 border border-white/20">
                <p className="text-[9px] text-white/90 text-center">💬 {aiInsight}</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-2">
              {aiPredictions.map((pred, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-white">{pred.title}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-1">
                        {pred.numbers.map((num: number) => (
                          <span 
                            key={num} 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg"
                            style={{ background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)", color: "#1e1b4b" }}
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                      <span 
                        className="px-2 py-0.5 rounded-full text-[8px] font-bold"
                        style={{ 
                          background: pred.confidence >= 70 ? "linear-gradient(135deg, #22c55e, #16a34a)" : 
                                     pred.confidence >= 50 ? "linear-gradient(135deg, #f97316, #ea580c)" : 
                                     "linear-gradient(135deg, #6b7280, #4b5563)",
                          color: "white"
                        }}
                      >
                        {pred.confidence}%
                      </span>
                    </div>
                  </div>
                  {pred.description && <p className="text-[8px] text-white/70">{pred.description}</p>}
                  {pred.reasoning && <p className="text-[7px] text-yellow-400/80 mt-1">💡 {pred.reasoning}</p>}
                </div>
              ))}
            </div>
            <p className="text-[7px] text-center text-white/50 mt-2 italic">
              ⚠️ AI predictions are for entertainment only. Gamble responsibly.
            </p>
            <div className="mt-3 pt-3 border-t border-white/20">
              <AIPredictionHistory gameType="TrxWin" />
            </div>
          </>
        ) : (
          <div className="text-center py-3">
            <p className="text-[9px] text-white/60">
              {gameHistory.length < 10 
                ? "📊 Need at least 10 rounds of data for AI analysis" 
                : "🎯 Click 'Get AI Tips' to analyze patterns with AI"}
            </p>
            <div className="mt-3">
              <AIPredictionHistory gameType="TrxWin" />
            </div>
          </div>
        )}
      </div>

      {/* Statistics Section - WinGo/5D Style */}
      <div className="mb-2">
        <p className="font-medium text-gray-700 text-[10px] mb-1.5">📈 Statistic (last 100 Periods)</p>
        <div className="space-y-1">
          {/* Winning number header */}
          <div className="flex items-center">
            <span className="flex-shrink-0 text-gray-500 text-[9px]" style={{ width: 100 }}>Winning number</span>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                const isHot = stats.hotDigits.includes(num);
                const isCold = stats.coldDigits.includes(num);
                return (
                  <span 
                    key={num} 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium"
                    style={{ 
                      border: isHot ? "2px solid #ef4444" : isCold ? "2px solid #3b82f6" : "1px solid #f97316", 
                      color: isHot ? "#ef4444" : isCold ? "#3b82f6" : "#f97316",
                      background: isHot ? "#fef2f2" : isCold ? "#eff6ff" : "transparent"
                    }}
                  >
                    {num}
                  </span>
                );
              })}
            </div>
          </div>
          
          {/* Stats rows */}
          {[
            { label: "Missing", data: stats.missing },
            { label: "Avg missing", data: stats.avgMissing },
            { label: "Frequency", data: stats.counts },
            { label: "Max consecutive", data: stats.maxConsecutive }
          ].map((r) => (
            <div key={r.label} className="flex items-center">
              <span className="flex-shrink-0 text-gray-500 text-[9px]" style={{ width: 100 }}>{r.label}</span>
              <div className="flex gap-1.5">
                {r.data.map((v: number, i: number) => {
                  const isHot = stats.hotDigits.includes(i);
                  const isCold = stats.coldDigits.includes(i);
                  return (
                    <span 
                      key={i} 
                      className="w-5 text-center text-[9px]"
                      style={{ 
                        color: isHot ? "#ef4444" : isCold ? "#3b82f6" : "#9ca3af",
                        fontWeight: isHot || isCold ? 600 : 400
                      }}
                    >
                      {v}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart with SVG Connecting Lines */}
      {gameHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <p className="text-sm font-medium">কোনো ডেটা নেই</p>
        </div>
      ) : (
        <div className="relative">
          {/* SVG Connecting Lines - WinGo Style */}
          <svg
            className="absolute pointer-events-none"
            style={{ left: 100, top: 0, width: "calc(100% - 125px)", height: "100%", overflow: "visible" }}
          >
            {paginatedChartHistory.slice(0, 12).map((row: any, idx: number) => {
              if (idx === paginatedChartHistory.slice(0, 12).length - 1) return null;
              const nextRow = paginatedChartHistory.slice(0, 12)[idx + 1];
              if (!nextRow) return null;
              
              const currentValue = row.number;
              const nextValue = nextRow.number;
              
              const cellWidth = 22;
              const startX = currentValue * cellWidth + 10;
              const endX = nextValue * cellWidth + 10;
              const startY = idx * 32 + 16;
              const endY = (idx + 1) * 32 + 16;
              
              return (
                <line
                  key={idx}
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="#f97316"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Chart Rows */}
          <div>
            {paginatedChartHistory.map((row: any, idx: number) => {
              const displayValue = row.number;
              const isHigh = displayValue >= 5;
              const isOdd = displayValue % 2 === 1;
              const isNewResult = idx === 0 && chartPage === 1;
              
              return (
                <div 
                  key={`${row.period}-${idx}`} 
                  className={`flex items-center rounded-md ${isNewResult ? "animate-fade-in" : ""}`} 
                  style={{ height: 32 }}
                >
                  <div className="flex-shrink-0" style={{ width: 100 }}>
                    <CopyablePeriod period={row.period} className="text-gray-500 text-[8px]" />
                  </div>
                  <div className="flex gap-1" style={{ position: "relative", zIndex: 1 }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                      const isWin = displayValue === num;
                      return (
                        <span
                          key={num}
                          className={`flex items-center justify-center text-[9px] ${isWin && isNewResult ? "animate-scale-in" : ""}`}
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: isWin ? "#f97316" : "transparent",
                            color: isWin ? "#fff" : "#d1d5db",
                            border: isWin ? "none" : "1px solid #e5e7eb",
                            fontWeight: isWin ? 700 : 400,
                            position: "relative",
                            zIndex: isWin ? 2 : 1,
                          }}
                        >
                          {num}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex gap-1 ml-auto">
                    <span 
                      className="flex items-center justify-center text-[8px] font-bold" 
                      style={{ width: 18, height: 18, borderRadius: "50%", background: isHigh ? "#f97316" : "#3b82f6", color: "#fff" }}
                    >
                      {isHigh ? "H" : "L"}
                    </span>
                    <span 
                      className="flex items-center justify-center text-[8px] font-bold" 
                      style={{ width: 18, height: 18, borderRadius: "50%", background: isOdd ? "#22c55e" : "#f97316", color: "#fff" }}
                    >
                      {isOdd ? "O" : "E"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Pagination */}
      <HistoryPagination 
        currentPage={chartPage} 
        totalPages={chartTotalPages} 
        onPageChange={setChartPage} 
        itemsPerPage={chartItemsPerPage} 
        totalItems={gameHistory.length} 
      />
    </div>
  );
};

const TrxWin = () => {
  const navigate = useNavigate();
  const [selectedGameType, setSelectedGameType] = useState("1min");
  const [activeTab, setActiveTab] = useState<"history" | "chart" | "myHistory" | "liveBets" | "leaderboard">("history");
  
  // Initialize mode states
  const [modeStates, setModeStates] = useState<Record<string, ModeState>>(() => {
    const states: Record<string, ModeState> = {};
    gameTypes.forEach((game) => {
      const history = generateInitialHistory(game.id);
      states[game.id] = {
        roundKey: getCurrentRoundKey(game.id),
        history,
        myHistory: loadMyHistory(GAME_NAME, game.id),
        recentResults: history.slice(0, 5).map((h: any) => h.number),
      };
    });
    return states;
  });
  
  const [roundState, setRoundState] = useState<RoundState>("PLAYING");
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [showBetSheet, setShowBetSheet] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [betType, setBetType] = useState<"big" | "small" | "green" | "violet" | "red" | "number">("big");
  const [betNumber, setBetNumber] = useState<number>(0);
  const [betAmount, setBetAmount] = useState(1);
  const [betMultiplier, setBetMultiplier] = useState("X1");
  const [agreedToRules, setAgreedToRules] = useState(true);
  const [gameHistoryPage, setGameHistoryPage] = useState(1);
  const [pendingBets, setPendingBets] = useState<PendingBet[]>([]);
  const [revealDigits, setRevealDigits] = useState<string[]>(["B", "5", "4", "B", "6"]);
  
  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("game_sound_enabled");
    return saved !== null ? saved === "true" : true;
  });
  const [soundVolume, setSoundVolume] = useState(() => {
    const saved = localStorage.getItem("game_sound_volume");
    return saved !== null ? parseFloat(saved) : 0.7;
  });
  
  // Bet animation
  const [showBetAnimation, setShowBetAnimation] = useState(false);
  const [betAnimationData, setBetAnimationData] = useState<{ betAmount: number; betType: string; potentialWin: number; } | null>(null);
  
  // Filter states
  const [historyFilter, setHistoryFilter] = useState<FilterStatus>("all");
  const [historySort, setHistorySort] = useState<SortOption>("newest");
  const [historyDateRange, setHistoryDateRange] = useState<DateRange>("all");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [showAllModes, setShowAllModes] = useState(false);
  const [myHistoryPage, setMyHistoryPage] = useState(1);
  
  // Bet details modal state
  const [showBetDetailsModal, setShowBetDetailsModal] = useState(false);
  const [selectedBetDetails, setSelectedBetDetails] = useState<BetDetails | null>(null);
  
  // Refs
  const timerRef = useRef<number | null>(null);
  const didEndRef = useRef(false);
  const lastCountdownBeepRef = useRef<number | null>(null);
  const rollingIntervalRef = useRef<number | null>(null);
  
  // Sounds & Wallet
  const { playTick, playWarningTick, playCountdownBeep, playBetPlaced, playRoundEnd, resetSoundGuard } = useGameSounds(soundEnabled, soundVolume);
  const { formattedBalance, balance, placeBet: placeBetWallet, claimWinnings, canAfford, isAuthenticated, refreshBalance } = useWalletDB();
  const { bets: dbBets, placeBet: placeBetDB, refresh: refreshBets, isLoading: isBetsLoading } = useGameBets("trxWin");
  const { isLoading: isAILoading, predictions: aiPredictions, overallInsight: aiInsight, fetchPredictions, clearPredictions } = useAIPrediction();
  const { isDark } = useTheme();
  
  // Derived values
  const currentModeState = modeStates[selectedGameType];
  const currentRoundKey = currentModeState?.roundKey || getCurrentRoundKey(selectedGameType);
  const currentPeriodNumber = generatePeriodNumber(selectedGameType, currentRoundKey);
  const gameHistory = currentModeState?.history || [];
  const recentResults = currentModeState?.recentResults || [];
  const currentGame = gameTypes.find((g) => g.id === selectedGameType) || gameTypes[0];
  
  // ============= DATABASE-BASED MY BETS HISTORY =============
  // Transform database bets to UI-compatible format
  const myBetHistory: BetHistoryItem[] = useMemo(() => {
    if (!dbBets || dbBets.length === 0) return [];
    
    // Filter by selected game mode (unless showing all modes)
    const filteredBets = showAllModes 
      ? dbBets 
      : dbBets.filter(bet => bet.game_mode === selectedGameType);
    
    return filteredBets.map(bet => {
      // Parse duration from game_mode
      const durationMap: Record<string, number> = { "1min": 1, "3min": 3, "5min": 5, "10min": 10 };
      const duration = durationMap[bet.game_mode] || 1;
      
      // Format bet type for display
      let betTypeDisplay = bet.bet_value;
      if (bet.bet_type === "number") {
        betTypeDisplay = `Number ${bet.bet_value}`;
      } else if (bet.bet_type === "color") {
        betTypeDisplay = bet.bet_value.charAt(0).toUpperCase() + bet.bet_value.slice(1);
      } else if (bet.bet_type === "bigSmall") {
        betTypeDisplay = bet.bet_value;
      }
      
      // Calculate fee (2%)
      const fee = bet.bet_amount * 0.02;
      const netAmount = bet.bet_amount - fee;
      
      return {
        period: bet.trade_id,
        betType: betTypeDisplay,
        betAmount: bet.bet_amount,
        fee,
        netAmount,
        result: bet.result !== null ? parseInt(bet.result) : null,
        isWin: bet.status === "won" ? true : bet.status === "lost" ? false : null,
        payout: bet.payout || 0,
        timestamp: new Date(bet.created_at),
        duration,
        roundKey: `TRX:${bet.game_mode}:${new Date(bet.created_at).getTime()}`,
        betId: bet.id,
      };
    });
  }, [dbBets, selectedGameType, showAllModes]);
  
  // For "All Modes" view - already handled in myBetHistory when showAllModes is true
  const allModesHistory = showAllModes ? myBetHistory : [];
  
  const activeHistory = showAllModes ? allModesHistory : myBetHistory;
  
  // Reset page when filter/sort/date range changes (like WinGo/K3)
  useEffect(() => {
    setMyHistoryPage(1);
  }, [historyFilter, historySort, historyDateRange, historySearchQuery, showAllModes, selectedGameType]);
  
  // Pagination
  const gameHistoryItemsPerPage = 10;
  const paginatedGameHistory = useMemo(() => {
    const startIndex = (gameHistoryPage - 1) * gameHistoryItemsPerPage;
    return gameHistory.slice(startIndex, startIndex + gameHistoryItemsPerPage);
  }, [gameHistory, gameHistoryPage]);
  const gameHistoryTotalPages = Math.max(1, Math.ceil(gameHistory.length / gameHistoryItemsPerPage));
  
  // Update mode state helper
  const updateModeState = useCallback((modeId: string, updates: Partial<ModeState>) => {
    setModeStates(prev => ({
      ...prev,
      [modeId]: { ...prev[modeId], ...updates }
    }));
  }, []);
  
  // Format time for display
  const formatTime = useCallback((s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return {
      m1: Math.floor(mins / 10),
      m2: mins % 10,
      s1: Math.floor(secs / 10),
      s2: secs % 10
    };
  }, []);
  const time = formatTime(timeRemaining);
  
  // Handle round end
  const handleRoundEnd = useCallback(() => {
    if (didEndRef.current) return;
    didEndRef.current = true;
    
    if (soundEnabled) playRoundEnd();
    setRoundState("REVEAL");
    
    // Random letters for rolling animation
    const letters = "ABCDEFGHIJ".split("");
    rollingIntervalRef.current = window.setInterval(() => {
      setRevealDigits([
        letters[Math.floor(Math.random() * 10)],
        letters[Math.floor(Math.random() * 10)],
        letters[Math.floor(Math.random() * 10)],
        letters[Math.floor(Math.random() * 10)],
        letters[Math.floor(Math.random() * 10)],
      ]);
    }, 100);
    
    // Stop after 2 seconds and show final result
    setTimeout(() => {
      if (rollingIntervalRef.current) {
        clearInterval(rollingIntervalRef.current);
        rollingIntervalRef.current = null;
      }
      
      // Generate result with HOUSE EDGE - analyze pending bets to favor house
      const pendingBetsForBias = pendingBets
        .filter(bet => bet.gameType === selectedGameType)
        .map(bet => ({
          betType: bet.betKind === "number" ? `Number ${bet.betValue}` : 
                   bet.betKind === "color" ? String(bet.betValue) : String(bet.betValue),
          betValue: String(bet.betValue),
        }));
      const finalNum = generateBiasedWinGoNumber(pendingBetsForBias, selectedGameType);
      const colors = getNumberColors(finalNum);
      const bigSmall = finalNum >= 5 ? "Big" : "Small";
      const period = currentPeriodNumber;
      
      // Create new history item
      const newHistoryItem = {
        period,
        number: finalNum,
        bigSmall,
        colors,
        blockTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        hashValue: `**${Math.random().toString(36).substring(2, 6)}`,
      };
      
      // Update history
      const updatedHistory = [newHistoryItem, ...gameHistory.slice(0, 99)];
      const updatedRecent = [finalNum, ...recentResults.slice(0, 4)];
      updateModeState(selectedGameType, {
        history: updatedHistory,
        recentResults: updatedRecent,
      });
      saveGameHistory(GAME_NAME, selectedGameType, updatedHistory);
      
      // Process pending bets for result display (toast + global event)
      // Database update is handled by settle-bets edge function
      pendingBets.forEach((bet) => {
        if (bet.gameType !== selectedGameType) return;
        
        let isWin = false;
        let odds = 2;
        
        if (bet.betKind === "number") {
          isWin = bet.betValue === finalNum;
          odds = GAME_ODDS.trxWin.number;
        } else if (bet.betKind === "color") {
          isWin = colors.includes(bet.betValue as string);
          odds = bet.betValue === "violet" ? GAME_ODDS.trxWin.violet : GAME_ODDS.trxWin.green;
        } else {
          isWin = bet.betValue === bigSmall;
          odds = 2;
        }
        
        const payout = isWin ? calculatePayout(bet.totalStake, odds) : 0;
        const betLabel = bet.betKind === "number" ? `Number ${bet.betValue}` : bet.betKind === "color" ? String(bet.betValue).charAt(0).toUpperCase() + String(bet.betValue).slice(1) : String(bet.betValue);
        
        if (isWin && payout > 0) {
          claimWinnings(payout, "TRX Win", period);
          toast.success(`🎉 জিতেছেন ৳${payout.toFixed(2)}!`);
        } else {
          toast.error(`😔 হেরেছেন ৳${bet.totalStake}`);
        }
        
        // Dispatch global result
        dispatchGlobalGameResult({
          game: "TrxWin",
          duration: currentGame.duration / 60,
          roundKey: currentRoundKey,
          tradeId: period,
          outcome: isWin ? "WIN" : "LOSE",
          betType: betLabel,
          sum: finalNum,
          betAmount: bet.totalStake,
          payout,
          ts: Date.now(),
          colors,
          bigSmall: bigSmall as "Big" | "Small",
        });
      });
      
      setPendingBets([]);
      
      // Settlement + refresh DB bets with admin result check
      (async () => {
        try {
          // Check for admin-set result first
          const adminResult = await getAdminSetResult('trxWin', selectedGameType, period);
          let finalResult = finalNum;
          
          if (adminResult && adminResult.result) {
            const parsedAdmin = parseWinGoResult(adminResult.result);
            if (parsedAdmin !== null) {
              finalResult = parsedAdmin;
              console.log(`[TrxWin] Using ADMIN-SET result: ${finalResult} for ${period}`);
            }
          }
          
          const settleResult = await settleBetsDB(
            period,
            "trxWin",
            selectedGameType,
            String(finalResult)
          );
          
          if (settleResult.success && settleResult.settledCount > 0) {
            console.log(`TrxWin Settled ${settleResult.settledCount} bets, payouts: ${settleResult.totalPayouts}`);
          }
          refreshBalance();
          refreshBets();
          await autoVerifyPredictions("TrxWin", [finalResult]);
        } catch (err) {
          console.error("Settlement error:", err);
        }
      })();
      
      // Transition to next round
      setTimeout(() => {
        setRoundState("RESETTING");
        setTimeout(() => {
          didEndRef.current = false;
          const newRoundKey = getCurrentRoundKey(selectedGameType);
          updateModeState(selectedGameType, { roundKey: newRoundKey });
          setRoundState("PLAYING");
          resetSoundGuard();
        }, 500);
      }, 2000);
      
    }, 2000);
  }, [selectedGameType, currentPeriodNumber, gameHistory, recentResults, pendingBets, currentGame, currentRoundKey, soundEnabled, playRoundEnd, updateModeState, claimWinnings, refreshBalance, refreshBets, resetSoundGuard]);
  
  // Main timer effect
  useEffect(() => {
    if (roundState !== "PLAYING" && roundState !== "COUNTDOWN_LOCK") return;
    
    const tick = () => {
      const remaining = getRemainingSeconds(currentRoundKey, selectedGameType);
      setTimeRemaining(remaining);
      
      // Update round key if new round
      const newRoundKey = getCurrentRoundKey(selectedGameType);
      if (newRoundKey !== currentRoundKey && remaining > 5) {
        updateModeState(selectedGameType, { roundKey: newRoundKey });
      }
      
      // Countdown sounds
      if (remaining > 0 && remaining <= 5) {
        if (lastCountdownBeepRef.current !== remaining) {
          lastCountdownBeepRef.current = remaining;
          if (soundEnabled) {
            playCountdownBeep(remaining);
            playWarningTick();
          }
          if (navigator.vibrate) {
            navigator.vibrate(remaining <= 2 ? 100 : 40);
          }
        }
        if (roundState === "PLAYING") setRoundState("COUNTDOWN_LOCK");
      } else if (remaining > 5 && remaining <= 10) {
        if (lastCountdownBeepRef.current !== remaining) {
          lastCountdownBeepRef.current = remaining;
          if (soundEnabled) playTick();
        }
      } else {
        lastCountdownBeepRef.current = null;
      }
      
      // Round end
      if (remaining <= 0 && !didEndRef.current) {
        handleRoundEnd();
      }
    };
    
    tick();
    timerRef.current = window.setInterval(tick, 200);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [roundState, selectedGameType, currentRoundKey, soundEnabled, playTick, playWarningTick, playCountdownBeep, handleRoundEnd, updateModeState]);
  
  // Game type change
  useEffect(() => {
    didEndRef.current = false;
    setRoundState("PLAYING");
    setGameHistoryPage(1);
    resetSoundGuard();
    lastCountdownBeepRef.current = null;
    
    const newRoundKey = getCurrentRoundKey(selectedGameType);
    const remaining = getRemainingSeconds(newRoundKey, selectedGameType);
    setTimeRemaining(remaining);
    
    if (currentRoundKey !== newRoundKey) {
      updateModeState(selectedGameType, { roundKey: newRoundKey });
    }
  }, [selectedGameType]);
  
  // Open bet sheet
  const openBetSheet = (type: typeof betType, num?: number) => {
    setBetType(type);
    if (type === "number" && num !== undefined) setBetNumber(num);
    setShowBetSheet(true);
  };
  
  // Handle place bet
  const handlePlaceBet = async () => {
    if (timeRemaining <= 5) {
      toast.error("সময় শেষ! পরবর্তী রাউন্ডে চেষ্টা করুন।");
      return;
    }
    
    if (!isAuthenticated) {
      toast.error("প্রথমে লগইন করুন!");
      return;
    }
    
    const mult = parseInt(betMultiplier.replace("X", ""));
    const totalStake = betAmount * mult;
    
    if (!canAfford(totalStake)) {
      toast.error(`অপর্যাপ্ত ব্যালেন্স! আপনার আছে ${formattedBalance}`);
      return;
    }
    
    let kind: "number" | "color" | "bigSmall" = "bigSmall";
    let val: any = "Big";
    
    if (betType === "green" || betType === "violet" || betType === "red") {
      kind = "color"; val = betType;
    } else if (betType === "number") {
      kind = "number"; val = betNumber;
    } else {
      val = betType === "big" ? "Big" : "Small";
    }
    
    const betLabel = kind === "number" ? `Number ${val}` : kind === "color" ? String(val).charAt(0).toUpperCase() + String(val).slice(1) : String(val);
    const odds = betType === "number" ? GAME_ODDS.trxWin.number : (betType === "violet" ? GAME_ODDS.trxWin.violet : 2);
    
    // Calculate fee breakdown
    const breakdown = getBetBreakdown(totalStake, "TrxWin");
    const grossWin = breakdown.netAmount * odds;
    const potentialWin = Math.floor((grossWin - grossWin * 0.02) * 100) / 100;
    
    // Idempotency key
    const betKey = `TRX:${selectedGameType}:${currentRoundKey}:${betLabel}:${totalStake}:${Date.now()}`;
    markBetKeyPlaced(betKey);
    
    if (soundEnabled) playBetPlaced();
    if (navigator.vibrate) navigator.vibrate([30, 20, 50]);
    
    setPendingBets(prev => [...prev, {
      gameType: selectedGameType,
      tradeId: currentPeriodNumber,
      betKind: kind,
      betValue: val,
      stake: betAmount,
      multiplier: mult,
      totalStake,
      createdAt: new Date().toISOString(),
    }]);
    
    // No need to update localStorage - we use database now
    // Just show animation and save to DB
    
    setBetAnimationData({ betAmount: totalStake, betType: betLabel, potentialWin });
    setShowBetAnimation(true);
    setShowBetSheet(false);
    
    // Optimized single-call database save
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("place-bet", {
          body: {
            gameType: "trxwin",
            gameMode: selectedGameType,
            tradeId: currentPeriodNumber,
            betType: kind,
            betValue: String(val),
            betAmount: totalStake,
            multiplier: mult,
            potentialWin,
          },
        });

        if (error || !data?.success) {
          toast.error(data?.error || "Bet failed");
          return;
        }
        
        refreshBalance();
        refreshBets();
      } catch (err) {
        console.error("Bet save error:", err);
      }
    })();
  };
  
  // Statistics for AI
  const trxStats = useMemo(() => {
    if (gameHistory.length < 5) return null;
    const numbers = gameHistory.slice(0, 30).map((h: any) => h.number);
    const counts = Array(10).fill(0);
    numbers.forEach((n: number) => counts[n]++);
    
    const hotDigits = counts.map((c, i) => ({ num: i, count: c })).sort((a, b) => b.count - a.count).slice(0, 3).map(x => x.num);
    const coldDigits = counts.map((c, i) => ({ num: i, count: c })).sort((a, b) => a.count - b.count).slice(0, 3).map(x => x.num);
    
    const bigCount = numbers.filter((n: number) => n >= 5).length;
    const smallCount = numbers.length - bigCount;
    const oddCount = numbers.filter((n: number) => n % 2 === 1).length;
    const evenCount = numbers.length - oddCount;
    
    const lastThree = numbers.slice(0, 3);
    const trend: "UP" | "DOWN" | "STABLE" = lastThree.length >= 2 
      ? (lastThree[0] > lastThree[1] ? "UP" : lastThree[0] < lastThree[1] ? "DOWN" : "STABLE")
      : "STABLE";
    
    return {
      hotDigits, coldDigits,
      missing: [0,1,2,3,4,5,6,7,8,9].filter(n => !numbers.slice(0, 10).includes(n)),
      trend,
      bigSmallRatio: { big: Math.round((bigCount / numbers.length) * 100), small: Math.round((smallCount / numbers.length) * 100) },
      oddEvenRatio: { odd: Math.round((oddCount / numbers.length) * 100), even: Math.round((evenCount / numbers.length) * 100) },
    };
  }, [gameHistory]);

  return (
    <PageScaffold
      title="TRX Win | GoLucky"
      description="Play TRX Win lottery — bet on color, number, and big/small."
      canonicalPath="/game/trxwin"
      fullWidth
    >
    <div 
      className="min-h-screen pb-20 transition-colors duration-300" 
      style={{ 
        background: isDark 
          ? "linear-gradient(180deg, hsl(222 47% 8%) 0%, hsl(222 47% 12%) 100%)" 
          : "#0B1426" 
      }}
    >
      {/* Header */}
      <header 
        className="flex items-center justify-between px-3 py-2 transition-colors duration-300" 
        style={{ 
          background: isDark 
            ? "linear-gradient(90deg, #c2410c 0%, #9a3412 100%)" 
            : "linear-gradient(90deg, #f97316 0%, #ea580c 100%)" 
        }}
      >
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full bg-white/20">
          <ArrowLeft className="text-white" size={18} />
        </button>
        <div className="flex items-center">
          <span 
            className="text-2xl font-extrabold tracking-tight"
            style={{ 
              background: "linear-gradient(135deg, #fef08a 0%, #fbbf24 50%, #f59e0b 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 2px 10px rgba(251, 191, 36, 0.4)",
              fontFamily: "'Poppins', sans-serif",
              letterSpacing: "-0.5px",
            }}
          >
            Go<span style={{ 
              background: "linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>Lucky</span>
          </span>
          <span className="ml-1 text-yellow-300 text-lg">🍀</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setHowOpen(true)} className="p-1.5 rounded-full bg-white/20">
            <HelpCircle className="text-white" size={16} />
          </button>
          <VolumeControl soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled} soundVolume={soundVolume} setSoundVolume={setSoundVolume} />
        </div>
      </header>
      
      <div className="px-3 pt-2">
        {/* Compact Wallet Card */}
        <div 
          className="rounded-xl px-3 py-2 mb-2 shadow-md transition-colors duration-300"
          style={{
            background: isDark 
              ? "linear-gradient(135deg, #115e59 0%, #134e4a 100%)"
              : "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)"
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet size={14} className="text-white/80" />
              <span className="text-white text-lg font-bold">৳ {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => navigate("/wallet")} className="px-3 py-1.5 rounded-full font-bold text-white text-xs" style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}>
                Withdraw
              </button>
              <button onClick={() => navigate("/wallet")} className="px-3 py-1.5 rounded-full font-bold text-white text-xs" style={{ background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" }}>
                Deposit
              </button>
            </div>
          </div>
        </div>
        
        {/* Compact Game Mode Tabs */}
        <div className="flex gap-1.5 mb-2">
          {gameTypes.map((game) => {
            const isActive = selectedGameType === game.id;
            const modeRoundKey = modeStates[game.id]?.roundKey || getCurrentRoundKey(game.id);
            const modeRemaining = getRemainingSeconds(modeRoundKey, game.id);
            const isUrgent = modeRemaining <= 10;
            
            return (
              <button
                key={game.id}
                onClick={() => setSelectedGameType(game.id)}
                className="flex-1 flex flex-col items-center py-1.5 rounded-lg relative transition-all"
                style={{
                  background: isActive 
                    ? "linear-gradient(135deg, #fb923c 0%, #f97316 100%)" 
                    : "#0F1E35",
                  boxShadow: isActive ? "0 2px 6px rgba(249,115,22,0.35)" : "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                {!isActive && modeRemaining > 0 && (
                  <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${isUrgent ? "bg-red-500 animate-pulse" : "bg-green-500"}`} />
                )}
                <span style={{ fontSize: 12, color: isActive ? "#ea580c" : isDark ? "#9ca3af" : "#9ca3af" }}>⏱</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? "#fff" : isDark ? "#e5e7eb" : "#374151" }}>{game.sublabel}</span>
              </button>
            );
          })}
        </div>
        
        {/* Compact Period & Timer Row */}
        <div className="rounded-xl px-3 py-2 mb-2 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white font-mono font-bold text-sm">{currentPeriodNumber}</span>
              <button onClick={() => setHowOpen(true)} className="text-white/80 text-[10px]">📋 How</button>
            </div>
            <div className="flex items-center gap-2">
              {timeRemaining <= 5 && timeRemaining > 0 && (
                <div className="px-2 py-0.5 rounded-full text-xs font-bold text-white animate-pulse bg-red-600">{timeRemaining}s</div>
              )}
              <div className="flex gap-0.5">
                {[time.m1, time.m2].map((d, i) => (
                  <span key={`m${i}`} className="w-5 h-6 bg-white/90 rounded flex items-center justify-center font-bold text-orange-600 text-xs">{d}</span>
                ))}
                <span className="text-white font-bold">:</span>
                {[time.s1, time.s2].map((d, i) => (
                  <span key={`s${i}`} className="w-5 h-6 bg-white/90 rounded flex items-center justify-center font-bold text-orange-600 text-xs">{d}</span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Recent Results - Compact */}
          <div className="flex justify-center gap-1.5 mt-2 pt-2 border-t border-dashed border-white/30">
            {recentResults.slice(0, 5).map((num, i) => (
              <NumberBall key={i} num={num} size="small" />
            ))}
          </div>
        </div>
        
        {/* Betting Panel */}
        <div 
          className="rounded-2xl shadow-lg overflow-hidden mb-3 relative transition-colors duration-300"
          style={{ background: "#0F1E35" }}
        >
          {/* Color Buttons */}
          <div className="grid grid-cols-3 gap-2 p-3">
            <button onClick={() => openBetSheet("green")} className="py-3 rounded-lg font-bold text-white text-sm relative overflow-hidden" style={{ background: "linear-gradient(180deg, #4ade80 0%, #22c55e 100%)" }}>
              <div className="absolute inset-x-0 top-0 h-1/2" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)" }} />
              <span className="relative">Green</span>
            </button>
            <button onClick={() => openBetSheet("violet")} className="py-3 rounded-lg font-bold text-white text-sm relative overflow-hidden" style={{ background: "linear-gradient(180deg, #c084fc 0%, #a855f7 100%)" }}>
              <div className="absolute inset-x-0 top-0 h-1/2" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)" }} />
              <span className="relative">Violet</span>
            </button>
            <button onClick={() => openBetSheet("red")} className="py-3 rounded-lg font-bold text-white text-sm relative overflow-hidden" style={{ background: "linear-gradient(180deg, #f87171 0%, #ef4444 100%)" }}>
              <div className="absolute inset-x-0 top-0 h-1/2" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)" }} />
              <span className="relative">Red</span>
            </button>
          </div>
          
          {/* Number Balls with Countdown Overlay */}
          <div className="px-3 pb-2 relative">
            <div className="flex justify-center gap-2 mb-2">
              {[0, 1, 2, 3, 4].map(n => (
                <button key={n} onClick={() => openBetSheet("number", n)}>
                  <NumberBall num={n} />
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-2">
              {[5, 6, 7, 8, 9].map(n => (
                <button key={n} onClick={() => openBetSheet("number", n)}>
                  <NumberBall num={n} />
                </button>
              ))}
            </div>
            
            {/* Countdown Overlay on Number Balls - starts at 5 seconds */}
            {timeRemaining <= 5 && timeRemaining > 0 && (
              <div 
                className="absolute inset-0 z-10 flex items-center justify-center"
                style={{
                  background: timeRemaining <= 2 
                    ? "rgba(239,68,68,0.9)" 
                    : timeRemaining <= 3
                    ? "rgba(249,115,22,0.9)"
                    : "rgba(139,92,246,0.9)",
                  backdropFilter: "blur(6px)",
                  borderRadius: "12px",
                }}
              >
                {/* Animated background */}
                <div className="absolute inset-0 overflow-hidden rounded-xl">
                  <div 
                    className="absolute w-32 h-32 rounded-full animate-ping"
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      animationDuration: "1s",
                    }}
                  />
                  <div 
                    className="absolute w-48 h-48 rounded-full animate-ping"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      animationDuration: "1.5s",
                    }}
                  />
                </div>
                
                <div className="text-center relative z-10">
                  {/* Large animated number */}
                  <div 
                    key={timeRemaining}
                    className="animate-scale-in"
                    style={{
                      fontSize: 72,
                      fontWeight: 900,
                      color: "#fff",
                      textShadow: `
                        0 0 20px rgba(255,255,255,0.5),
                        0 0 40px rgba(255,255,255,0.3),
                        0 4px 8px rgba(0,0,0,0.3)
                      `,
                      lineHeight: 1,
                      fontFamily: "'Arial Black', sans-serif",
                    }}
                  >
                    {timeRemaining}
                  </div>
                  {/* Subtitle */}
                  <p className="mt-2 text-white/90 text-[11px] font-bold tracking-wider uppercase">
                    ✨ Result Coming ✨
                  </p>
                  {/* Progress dots */}
                  <div className="flex justify-center gap-1.5 mt-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i <= (6 - timeRemaining) ? "bg-white scale-110" : "bg-white/30"
                        }`}
                        style={{
                          boxShadow: i <= (6 - timeRemaining) ? "0 0 8px rgba(255,255,255,0.8)" : "none",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Multiplier */}
          <div className="flex gap-1 px-3 pb-3 flex-wrap justify-center">
            {["Random", "X1", "X5", "X10", "X20", "X50", "X100"].map(m => (
              <button
                key={m}
                onClick={() => m !== "Random" && setBetMultiplier(m)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  betMultiplier === m 
                    ? "bg-orange-500 text-white" 
                    : isDark 
                      ? "bg-slate-700 text-gray-300 border border-slate-600" 
                      : "bg-gray-100 text-gray-600 border border-gray-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          
          {/* Big/Small Buttons */}
          <div className="grid grid-cols-2 mx-3 mb-3 rounded-lg overflow-hidden">
            <button onClick={() => openBetSheet("big")} className="py-3 font-bold text-white text-sm" style={{ background: "linear-gradient(180deg, #fb923c 0%, #f97316 100%)" }}>
              Big
            </button>
            <button onClick={() => openBetSheet("small")} className="py-3 font-bold text-white text-sm" style={{ background: "linear-gradient(180deg, #4ade80 0%, #22c55e 100%)" }}>
              Small
            </button>
          </div>
          
          {/* Reveal Overlay - Only during reveal state */}
          {roundState === "REVEAL" && (
            <div className="absolute inset-0 bg-rose-600/95 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl">
              <div className="text-center">
                <div className="flex gap-2 justify-center mb-3">
                  {revealDigits.map((letter, i) => (
                    <LetterBall key={i} letter={letter} color={i % 2 === 0 ? "green" : "red"} />
                  ))}
                </div>
                <p className="text-white font-bold animate-pulse">🎲 রেজাল্ট আসছে... 🎲</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Tabs */}
        <div 
          className="rounded-t-2xl shadow-lg transition-colors duration-300"
          style={{ background: "#0F1E35" }}
        >
          <div className={`flex ${isDark ? "border-b border-slate-700" : "border-b"}`}>
            {[
              { id: "history", label: "History" },
              { id: "chart", label: "Chart" },
              { id: "myHistory", label: "My Bets" },
              { id: "liveBets", label: "Live" },
              { id: "leaderboard", label: "🏆 Top" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex-1 py-3 text-xs font-medium relative"
                style={{ color: activeTab === tab.id ? "#f97316" : isDark ? "#9ca3af" : "#9ca3af" }}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-orange-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
          
          {/* Game History Tab */}
          {activeTab === "history" && (
            <div className="p-2">
              <div className="grid grid-cols-5 py-2 px-2 text-[9px] font-medium text-white rounded-t-lg" style={{ background: "linear-gradient(90deg, #f97316, #dc2626)" }}>
                <span>Period</span>
                <span className="text-center">Block height</span>
                <span className="text-center">Block time</span>
                <span className="text-center">Hash value</span>
                <span className="text-center">Result</span>
              </div>
              {paginatedGameHistory.map((r: any, i: number) => (
                <div 
                  key={i} 
                  className={`grid grid-cols-5 items-center py-2 px-2 text-[9px] ${
                    isDark ? "border-b border-slate-700" : "border-b border-gray-50"
                  }`}
                >
                  <span className={isDark ? "text-gray-400 truncate" : "text-gray-600 truncate"}>{r.period?.slice(-8) || "---"}</span>
                  <span className="text-center">
                    <span className={`inline-block w-4 h-4 rounded text-[8px] ${isDark ? "bg-orange-900/50 text-orange-400" : "bg-orange-100 text-orange-500"}`}>?</span>
                  </span>
                  <span className={isDark ? "text-center text-gray-500" : "text-center text-gray-500"}>{r.blockTime || "00:00:00"}</span>
                  <span className={isDark ? "text-center text-gray-500" : "text-center text-gray-400"}>{r.hashValue || "**xxxx"}</span>
                  <div className="flex items-center justify-center gap-1">
                    <NumberBall num={r.number} size="small" />
                    <span className={`text-[8px] font-medium ${r.bigSmall === "Big" ? "text-orange-500" : "text-green-500"}`}>
                      {r.bigSmall === "Big" ? "B" : "S"}
                    </span>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-center gap-2 py-3">
                <button
                  onClick={() => setGameHistoryPage(Math.max(1, gameHistoryPage - 1))}
                  disabled={gameHistoryPage === 1}
                  className={`p-1.5 rounded-lg disabled:opacity-50 ${isDark ? "bg-slate-700" : "bg-gray-100"}`}
                >
                  <ChevronLeft size={16} className={isDark ? "text-gray-400" : "text-gray-600"} />
                </button>
                <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{gameHistoryPage}/{gameHistoryTotalPages}</span>
                <button
                  onClick={() => setGameHistoryPage(Math.min(gameHistoryTotalPages, gameHistoryPage + 1))}
                  disabled={gameHistoryPage === gameHistoryTotalPages}
                  className="p-1.5 rounded-lg bg-orange-500 disabled:opacity-50"
                >
                  <ChevronRight size={16} className="text-white" />
                </button>
              </div>
            </div>
          )}
          
          {/* Chart Tab */}
          {activeTab === "chart" && (
            <ChartTab 
              gameHistory={gameHistory}
              isAILoading={isAILoading}
              aiPredictions={aiPredictions}
              aiInsight={aiInsight}
              trxStats={trxStats}
              fetchPredictions={fetchPredictions}
            />
          )}
          
          {/* My History Tab */}
          {activeTab === "myHistory" && (
            <div className="p-3">
              {/* Header with mode toggle */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  📊 {showAllModes ? "সব মোডের হিস্ট্রি" : `${selectedGameType === "1min" ? "1 মিনিট" : selectedGameType === "3min" ? "3 মিনিট" : selectedGameType === "5min" ? "5 মিনিট" : "10 মিনিট"} মোডের হিস্ট্রি`}
                </span>
                <div className="flex items-center gap-2">
                  {/* Refresh button for DB bets */}
                  <button
                    onClick={() => refreshBets()}
                    disabled={isBetsLoading}
                    className={`p-1.5 rounded-full transition-all ${
                      isDark 
                        ? "bg-slate-700 text-gray-400 hover:bg-slate-600" 
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    <RefreshCw size={14} className={isBetsLoading ? "animate-spin" : ""} />
                  </button>
                  <button
                    onClick={() => setShowAllModes(!showAllModes)}
                    className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all ${
                      showAllModes 
                        ? "bg-orange-500 text-white shadow-md" 
                        : isDark 
                          ? "bg-slate-700 text-orange-400 border border-slate-600 hover:bg-slate-600" 
                          : "bg-white text-orange-600 border border-orange-300 hover:bg-orange-50"
                    }`}
                  >
                    {showAllModes ? "✓ সব মোড" : "সব মোড দেখুন"}
                  </button>
                </div>
              </div>

              {/* Win/Loss Chart */}
              {activeHistory.length > 0 && (
                <BetHistoryChart history={activeHistory} className="mb-3" />
              )}

              {/* Filter and Sort Controls */}
              {activeHistory.length > 0 && (
                <BetHistoryFilters
                  onFilterChange={setHistoryFilter}
                  onSortChange={setHistorySort}
                  onDateRangeChange={setHistoryDateRange}
                  onSearchChange={setHistorySearchQuery}
                  currentFilter={historyFilter}
                  currentSort={historySort}
                  currentDateRange={historyDateRange}
                  searchQuery={historySearchQuery}
                  totalCount={activeHistory.length}
                  filteredCount={filterAndSortBetHistory(activeHistory, historyFilter, historySort, historyDateRange, historySearchQuery).length}
                  filteredHistory={filterAndSortBetHistory(activeHistory, historyFilter, historySort, historyDateRange, historySearchQuery)}
                  gameName="TrxWin"
                />
              )}
              
              {activeHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-24 h-16 mb-2 opacity-40">
                    <svg viewBox="0 0 100 80" className="w-full h-full">
                      <rect x="20" y="30" width="60" height="40" fill={isDark ? "#334155" : "#e5e7eb"} rx="4" />
                      <rect x="35" y="20" width="30" height="15" fill={isDark ? "#1e293b" : "#d1d5db"} rx="2" />
                      <circle cx="30" cy="35" r="3" fill={isDark ? "#475569" : "#9ca3af"} />
                      <path d="M 25 55 Q 35 45, 45 55 Q 55 65, 65 50" stroke={isDark ? "#475569" : "#9ca3af"} fill="none" strokeWidth="2" />
                    </svg>
                  </div>
                  <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>{showAllModes ? "কোন বেট নেই" : "এই মোডে কোন বেট নেই"}</p>
                  {!showAllModes && <p className={`text-[10px] mt-1 ${isDark ? "text-gray-600" : "text-gray-300"}`}>({selectedGameType === "1min" ? "1 মিনিট" : selectedGameType === "3min" ? "3 মিনিট" : selectedGameType === "5min" ? "5 মিনিট" : "10 মিনিট"} মোড)</p>}
                </div>
              ) : filterAndSortBetHistory(activeHistory, historyFilter, historySort, historyDateRange, historySearchQuery).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>কোন রেজাল্ট পাওয়া যায়নি</p>
                </div>
              ) : (
                (() => {
                  const filteredHistory = filterAndSortBetHistory(activeHistory, historyFilter, historySort, historyDateRange, historySearchQuery);
                  const itemsPerPage = 10;
                  const myHistoryTotalPages = Math.ceil(filteredHistory.length / itemsPerPage);
                  const startIdx = (myHistoryPage - 1) * itemsPerPage;
                  const paginatedHistory = filteredHistory.slice(startIdx, startIdx + itemsPerPage);
                  
                  return (
                    <>
                      <div className="space-y-2">
                        {paginatedHistory.map((bet, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl p-3 border transition-all duration-300 cursor-pointer hover:shadow-md"
                            onClick={() => {
                              setSelectedBetDetails({
                                period: bet.period,
                                betType: bet.betType,
                                betAmount: bet.betAmount,
                                fee: bet.fee,
                                netAmount: bet.netAmount,
                                multiplier: (bet as any).multiplier,
                                potentialWin: (bet as any).potentialWin,
                                result: bet.result,
                                isWin: bet.isWin,
                                payout: bet.payout,
                                timestamp: bet.timestamp,
                                duration: bet.duration,
                                roundKey: bet.roundKey,
                              });
                              setShowBetDetailsModal(true);
                            }}
                            style={{
                              background: bet.result === null 
                                ? isDark ? "linear-gradient(135deg, #422006 0%, #451a03 100%)" : "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)"
                                : bet.isWin 
                                  ? isDark ? "linear-gradient(135deg, #14532d 0%, #166534 100%)" : "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" 
                                  : isDark ? "linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)" : "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                              borderColor: bet.result === null ? (isDark ? "#854d0e" : "#fde047") : bet.isWin ? (isDark ? "#166534" : "#86efac") : (isDark ? "#7f1d1d" : "#fca5a5"),
                              animation: idx === 0 && bet.result !== null ? "historySlideIn 0.4s ease-out" : "none",
                            }}
                          >
                            {/* Header Row - Period Info + Status */}
                            <div className="flex items-center justify-between mb-2 pb-2 border-b" style={{ borderColor: bet.result === null ? (isDark ? "#854d0e" : "#fde047") : bet.isWin ? (isDark ? "#166534" : "#86efac") : (isDark ? "#7f1d1d" : "#fca5a5") }}>
                              <div className="flex items-center gap-2">
                                <span 
                                  className="px-2 py-0.5 rounded text-[9px] font-bold text-white"
                                  style={{ background: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)" }}
                                >
                                  {bet.duration === 1 ? "1Min" : bet.duration === 3 ? "3Min" : bet.duration === 5 ? "5Min" : bet.duration === 10 ? "10Min" : selectedGameType === "1min" ? "1Min" : selectedGameType === "3min" ? "3Min" : selectedGameType === "5min" ? "5Min" : "10Min"}
                                </span>
                                <div className="flex flex-col">
                                  <span className={`text-[9px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>Trade ID</span>
                                  <CopyablePeriod period={bet.period} className={isDark ? "text-gray-300" : "text-gray-600"} />
                                </div>
                              </div>
                              {/* Win/Lose Status with animated icon */}
                              {bet.result !== null ? (
                                <div 
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${bet.isWin ? "bg-green-500" : "bg-red-500"}`}
                                  style={{
                                    boxShadow: bet.isWin ? "0 2px 8px rgba(34, 197, 94, 0.4)" : "0 2px 8px rgba(239, 68, 68, 0.4)",
                                    animation: "statusPop 0.3s ease-out",
                                  }}
                                >
                                  <div className="w-4 h-4 flex items-center justify-center" style={{ animation: bet.isWin ? "winIconBounce 1s ease-in-out infinite" : "loseIconShake 0.5s ease-in-out" }}>
                                    {bet.isWin ? (
                                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#fff" style={{ animation: "starSpin 2s linear infinite" }} /></svg>
                                    ) : (
                                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" fill="none" /><path d="M8 8L16 16M16 8L8 16" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
                                    )}
                                  </div>
                                  <span className="text-[11px] font-bold text-white">{bet.isWin ? "WIN!" : "LOSE"}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500" style={{ boxShadow: "0 2px 8px rgba(234, 179, 8, 0.4)" }}>
                                  <div className="w-4 h-4 flex items-center justify-center animate-spin">
                                    <svg viewBox="0 0 24 24" className="w-4 h-4"><circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" fill="none" strokeDasharray="40 60" /></svg>
                                  </div>
                                  <span className="text-[11px] font-bold text-white animate-pulse">PENDING</span>
                                </div>
                              )}
                            </div>

                            {/* Content Row - Bet Details + Result */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className={`text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-gray-800"}`}>{bet.betType}</p>
                                <div 
                                  className="rounded-lg p-2" 
                                  style={{ 
                                    background: isDark ? "linear-gradient(135deg, #422006 0%, #451a03 100%)" : "linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)", 
                                    border: `1px solid ${isDark ? "#854d0e" : "#fde68a"}` 
                                  }}
                                >
                                  <div className="grid grid-cols-3 gap-1 text-center">
                                    <div>
                                      <p className={`text-[8px] uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>Bet</p>
                                      <p className={`text-[11px] font-bold ${isDark ? "text-gray-200" : "text-gray-800"}`}>৳{bet.betAmount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <p className={`text-[8px] uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>Fee (2%)</p>
                                      <p className="text-[11px] font-bold text-orange-500">{bet.fee !== undefined && bet.fee > 0 ? `-৳${bet.fee.toFixed(2)}` : "৳0"}</p>
                                    </div>
                                    <div>
                                      <p className={`text-[8px] uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>Net</p>
                                      <p className="text-[11px] font-bold text-green-600">৳{bet.netAmount !== undefined ? bet.netAmount.toFixed(2) : bet.betAmount.toFixed(2)}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-right flex-shrink-0">
                                {bet.result !== null && (
                                  <>
                                    <div className="flex items-center justify-end gap-1.5 mb-1">
                                      <span className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>Result:</span>
                                      {(bet.result === 0 || bet.result === 5) ? (
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden" style={{ border: `2px solid ${bet.result === 0 ? "#ef4444" : "#22c55e"}`, position: "relative", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
                                          <div style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "100%", background: bet.result === 0 ? "#ef4444" : "#22c55e" }} />
                                          <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", background: "#a855f7" }} />
                                          <span style={{ position: "relative", zIndex: 1, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>{bet.result}</span>
                                        </div>
                                      ) : (
                                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: [1, 3, 7, 9].includes(bet.result) ? "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)" : "linear-gradient(135deg, #f87171 0%, #ef4444 100%)", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>{bet.result}</span>
                                      )}
                                    </div>
                                    {bet.isWin && bet.payout > 0 && (
                                      <div className="px-2 py-1 rounded-lg" style={{ background: isDark ? "linear-gradient(135deg, #14532d 0%, #166534 100%)" : "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)", border: `1px solid ${isDark ? "#166534" : "#86efac"}` }}>
                                        <p className={`text-xs font-bold ${isDark ? "text-green-400" : "text-green-700"}`}>+{formatPayout(bet.payout)}</p>
                                      </div>
                                    )}
                                    {!bet.isWin && (
                                      <div className="px-2 py-1 rounded-lg" style={{ background: isDark ? "linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)" : "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)", border: `1px solid ${isDark ? "#7f1d1d" : "#fca5a5"}` }}>
                                        <p className={`text-xs font-bold ${isDark ? "text-red-400" : "text-red-600"}`}>-{formatTaka(bet.betAmount, 0)}</p>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <HistoryPagination
                        currentPage={myHistoryPage}
                        totalPages={myHistoryTotalPages}
                        onPageChange={setMyHistoryPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredHistory.length}
                      />
                    </>
                  );
                })()
              )}
            </div>
          )}

          {/* History animations */}
          <style>{`
            @keyframes historySlideIn {
              0% { opacity: 0; transform: translateX(-20px); }
              100% { opacity: 1; transform: translateX(0); }
            }
            @keyframes statusPop {
              0% { transform: scale(0); }
              60% { transform: scale(1.2); }
              100% { transform: scale(1); }
            }
            @keyframes winIconBounce {
              0%, 100% { transform: scale(1) rotate(0deg); }
              25% { transform: scale(1.2) rotate(-10deg); }
              50% { transform: scale(1) rotate(0deg); }
              75% { transform: scale(1.2) rotate(10deg); }
            }
            @keyframes loseIconShake {
              0%, 100% { transform: translateX(0); }
              20% { transform: translateX(-3px); }
              40% { transform: translateX(3px); }
              60% { transform: translateX(-2px); }
              80% { transform: translateX(2px); }
            }
            @keyframes starSpin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>

          {/* Live Bets Tab */}
          {activeTab === "liveBets" && (
            <div className="p-3">
              <LiveBetsFeed gameType="trxWin" maxItems={12} className={isDark ? "bg-slate-800" : "bg-gray-50"} />
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === "leaderboard" && (
            <Leaderboard gameType="trxWin" />
          )}
        </div>
      </div>
      
      {/* Bet Sheet */}
      <BetSheet
        isOpen={showBetSheet}
        onClose={() => setShowBetSheet(false)}
        headerTitle={`TRX Win ${currentGame.sublabel}`}
        headerColor={
          betType === "green" ? "linear-gradient(135deg, #4ade80, #22c55e)" :
          betType === "violet" ? "linear-gradient(135deg, #c084fc, #a855f7)" :
          betType === "red" ? "linear-gradient(135deg, #f87171, #ef4444)" :
          betType === "small" ? "linear-gradient(135deg, #4ade80, #22c55e)" :
          "linear-gradient(135deg, #fb923c, #f97316)"
        }
        timeRemaining={timeRemaining}
      >
        <BetPanelContent
          betType={betType}
          betValue={betType === "number" ? betNumber : betType === "big" ? "Big" : betType === "small" ? "Small" : betType.charAt(0).toUpperCase() + betType.slice(1)}
          betAmount={betAmount}
          betMultiplier={betMultiplier}
          agreedToRules={agreedToRules}
          odds={betType === "number" ? 9 : betType === "violet" ? 4.5 : 2}
          colorType={
            betType === "green" ? "green" :
            betType === "violet" ? "violet" :
            betType === "red" ? "red" :
            betType === "small" ? "blue" :
            "orange"
          }
          showNumberGrid={true}
          numberGridValues={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
          selectedNumber={betType === "number" ? betNumber : null}
          payoutGuide={[
            { label: "🔢 Number", odds: "9x", color: "#f97316", highlight: betType === "number" },
            { label: "🟢 Green", odds: "2x", color: "#22c55e", highlight: betType === "green" },
            { label: "🔴 Red", odds: "2x", color: "#ef4444", highlight: betType === "red" },
            { label: "🟣 Violet", odds: "4.5x", color: "#a855f7", highlight: betType === "violet" },
            { label: "📈 Big", odds: "2x", color: "#f97316", highlight: betType === "big" },
            { label: "📉 Small", odds: "2x", color: "#3b82f6", highlight: betType === "small" },
          ]}
          onBetAmountChange={setBetAmount}
          onBetMultiplierChange={setBetMultiplier}
          onNumberSelect={(num) => {
            setBetType("number");
            setBetNumber(num);
          }}
          onAgreeChange={setAgreedToRules}
          onCancel={() => setShowBetSheet(false)}
          onConfirm={handlePlaceBet}
          disabled={timeRemaining <= 5}
        />
      </BetSheet>
      
      <HowToPlayModal open={howOpen} onClose={() => setHowOpen(false)} content={trxWinHowToPlay} title="How to Play TRX Win" />
      
      <BetPlacedAnimation
        show={showBetAnimation}
        betAmount={betAnimationData?.betAmount || 0}
        betType={betAnimationData?.betType || ""}
        potentialWin={betAnimationData?.potentialWin || 0}
        onComplete={() => { setShowBetAnimation(false); setBetAnimationData(null); }}
      />
      
      {/* Bet Details Modal */}
      <BetDetailsModal
        open={showBetDetailsModal}
        onOpenChange={setShowBetDetailsModal}
        bet={selectedBetDetails}
        gameType="TrxWin"
      />

      {/* First Deposit Bonus Banner */}
      <FirstDepositBonusBanner />
    </div>
    </PageScaffold>
  );
};

export default TrxWin;
