/**
 * UNIFIED BET PANEL CONTENT
 * 
 * Clean, compact betting interface used by WinGo, K3, 5D, TrxWin
 * Design based on popular gaming platform UX patterns
 */

import React from "react";
import { Minus, Plus, Check } from "lucide-react";
import { formatTaka } from "@/lib/currency";

interface BetPanelContentProps {
  // Current selection
  betType: string;
  betValue: string | number;
  betAmount: number;
  betMultiplier: string;
  agreedToRules: boolean;
  
  // Config
  odds: number;
  colorType?: "green" | "red" | "violet" | "blue" | "orange" | "purple" | "amber";
  showNumberGrid?: boolean;
  numberGridValues?: number[];
  selectedNumber?: number | null;
  
  // Payout guide (optional)
  payoutGuide?: { label: string; odds: string; color: string; highlight?: boolean }[];
  
  // Callbacks
  onBetAmountChange: (amount: number) => void;
  onBetMultiplierChange: (multiplier: string) => void;
  onNumberSelect?: (num: number) => void;
  onAgreeChange: (agreed: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
  
  // Optional
  disabled?: boolean;
  feePercent?: number;
  hideActions?: boolean;
}

// Quick bet amounts
const QUICK_AMOUNTS = [1, 5, 10, 20, 50, 100];
const MULTIPLIERS = ["X1", "X5", "X10", "X20", "X50", "X100"];

// Color map for bet types
const colorMap: Record<string, { bg: string; text: string; gradient: string }> = {
  green: { bg: "#dcfce7", text: "#16a34a", gradient: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)" },
  red: { bg: "#fee2e2", text: "#dc2626", gradient: "linear-gradient(135deg, #f87171 0%, #ef4444 100%)" },
  violet: { bg: "#f3e8ff", text: "#7c3aed", gradient: "linear-gradient(135deg, #c084fc 0%, #a855f7 100%)" },
  purple: { bg: "#f3e8ff", text: "#7c3aed", gradient: "linear-gradient(135deg, #c084fc 0%, #a855f7 100%)" },
  blue: { bg: "#dbeafe", text: "#2563eb", gradient: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)" },
  orange: { bg: "#ffedd5", text: "#ea580c", gradient: "linear-gradient(135deg, #fdba74 0%, #fb923c 100%)" },
  amber: { bg: "#fef3c7", text: "#d97706", gradient: "linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)" },
};

// Number ball component for number grid
const NumberBallMini = ({ num, isSelected, onClick }: { num: number; isSelected?: boolean; onClick?: () => void }) => {
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
    <button
      onClick={onClick}
      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all relative overflow-hidden ${
        isSelected ? "ring-2 ring-yellow-400 ring-offset-1 scale-110" : ""
      }`}
      style={{
        border: `2.5px solid ${ringColor}`,
        background: isDualColor ? "transparent" : singleColor,
        boxShadow: isSelected 
          ? "0 4px 12px rgba(0,0,0,0.3)" 
          : "inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)",
      }}
    >
      {isDualColor && (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "100%", background: leftColor }} />
          <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", background: rightColor }} />
        </>
      )}
      <span className="relative z-10 text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>{num}</span>
    </button>
  );
};

const BetPanelContent: React.FC<BetPanelContentProps> = ({
  betType,
  betValue,
  betAmount,
  betMultiplier,
  agreedToRules,
  odds,
  colorType = "orange",
  showNumberGrid = false,
  numberGridValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  selectedNumber,
  payoutGuide,
  onBetAmountChange,
  onBetMultiplierChange,
  onNumberSelect,
  onAgreeChange,
  onCancel,
  onConfirm,
  disabled = false,
  feePercent = 2,
  hideActions = false,
}) => {
  const colors = colorMap[colorType] || colorMap.orange;
  
  // Calculate bet values
  const multiplierValue = parseInt(betMultiplier.replace("X", "")) || 1;
  const totalStake = betAmount * multiplierValue;
  const feeRate = feePercent / 100;
  const fee = Math.round(totalStake * feeRate * 100) / 100;
  const netAmount = totalStake - fee;
  const grossWin = netAmount * odds;
  const serviceFee = grossWin * feeRate;
  const potentialWin = Math.floor((grossWin - serviceFee) * 100) / 100;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Main Content - Scrollable */}
      <div className="px-4 py-3 space-y-3 overflow-y-auto flex-1">
        {/* Selected Type Badge */}
        <div className="flex items-center justify-between">
          <div 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{ background: colors.bg, border: `1px solid ${colors.text}20` }}
          >
            <span className="text-gray-600 text-sm">Select</span>
            <span className="font-bold text-sm" style={{ color: colors.text }}>
              {betType === "number" ? `Number ${betValue}` : String(betValue)}
            </span>
          </div>
          
          {/* Optional Number Grid - Right Side */}
          {showNumberGrid && (
            <div className="grid grid-cols-5 gap-1">
              {numberGridValues.slice(0, 5).map((num) => (
                <NumberBallMini 
                  key={num} 
                  num={num} 
                  isSelected={selectedNumber === num}
                  onClick={() => onNumberSelect?.(num)}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Second Row of Numbers if shown */}
        {showNumberGrid && numberGridValues.length > 5 && (
          <div className="flex justify-end">
            <div className="grid grid-cols-5 gap-1">
              {numberGridValues.slice(5, 10).map((num) => (
                <NumberBallMini 
                  key={num} 
                  num={num}
                  isSelected={selectedNumber === num}
                  onClick={() => onNumberSelect?.(num)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Quick Amount Buttons */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-xs font-medium">Amount</span>
          <div className="flex gap-1">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => onBetAmountChange(amt)}
                className="min-w-[40px] h-8 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: betAmount === amt ? colors.gradient : "#f5f5f5",
                  color: betAmount === amt ? "#fff" : "#374151",
                  border: betAmount === amt ? "none" : "1px solid #e5e7eb",
                }}
              >
                {amt}
              </button>
            ))}
          </div>
        </div>
        
        {/* Quantity Control */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-xs font-medium">Quantity</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBetAmountChange(Math.max(1, betAmount - 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ background: "#ef4444" }}
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => onBetAmountChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 h-8 text-center border border-gray-200 rounded-lg text-sm font-bold"
            />
            <button
              onClick={() => onBetAmountChange(betAmount + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ background: "#22c55e" }}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
        
        {/* Multiplier Row */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-xs font-medium">Multiplier</span>
          <div className="flex gap-1">
            {MULTIPLIERS.map((m) => (
              <button
                key={m}
                onClick={() => onBetMultiplierChange(m)}
                className="min-w-[38px] h-7 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: betMultiplier === m ? colors.gradient : "#fff",
                  color: betMultiplier === m ? "#fff" : "#6b7280",
                  border: betMultiplier === m ? "none" : "1px solid #e5e7eb",
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        
        {/* Payout Guide (Optional) */}
        {payoutGuide && payoutGuide.length > 0 && (
          <div className="rounded-xl p-2.5 bg-gray-50 border border-gray-100">
            <p className="text-[9px] font-semibold text-gray-400 uppercase mb-1.5 text-center tracking-wide">
              💰 Payout Odds Guide
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {payoutGuide.map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg"
                  style={{ 
                    background: item.highlight ? `${item.color}15` : "#fff", 
                    border: `1px solid ${item.highlight ? item.color : "#e5e7eb"}` 
                  }}
                >
                  <span className="text-[11px] text-gray-600">{item.label}</span>
                  <span className="text-[11px] font-bold" style={{ color: item.color }}>{item.odds}</span>
                </div>
              ))}
            </div>
            <p className="text-[8px] text-gray-400 text-center mt-1.5">
              * {feePercent}% service fee applies on all winnings
            </p>
          </div>
        )}
        
        {/* Summary Card */}
        <div 
          className="rounded-xl p-3"
          style={{ 
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", 
            border: "1px solid #fde68a" 
          }}
        >
          <div className="grid grid-cols-2 gap-3 text-center mb-2">
            <div>
              <p className="text-[9px] text-gray-500 uppercase">Total Stake</p>
              <p className="text-base font-bold text-gray-800">{formatTaka(totalStake, 0)}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase">Fee ({feePercent}%)</p>
              <p className="text-base font-bold text-orange-500">-{formatTaka(fee)}</p>
            </div>
          </div>
          <div className="border-t border-amber-200 pt-2 flex items-center justify-between">
            <div>
              <p className="text-[9px] text-gray-500 uppercase">Net Bet</p>
              <p className="text-sm font-semibold text-gray-700">{formatTaka(netAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-gray-500 uppercase">Potential Win ({odds}x)</p>
              <p className="text-xl font-bold text-green-600">{formatTaka(potentialWin, 0)}</p>
            </div>
          </div>
        </div>
        
        {/* Agreement */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAgreeChange(!agreedToRules)}
            className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
            style={{ 
              background: agreedToRules ? colors.gradient : "#e5e7eb",
              boxShadow: agreedToRules ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
            }}
          >
            {agreedToRules && <Check size={10} className="text-white" />}
          </button>
          <span className="text-gray-500 text-xs">I agree</span>
          <button className="text-xs underline" style={{ color: colors.text }}>(Pre-sale rules)</button>
        </div>
      </div>
      
      {/* Action Buttons - FIXED AT BOTTOM */}
      {!hideActions && (
        <div className="flex border-t border-gray-100 shrink-0">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled || !agreedToRules}
            className="flex-1 py-3.5 text-white font-semibold text-sm flex flex-col items-center justify-center transition-all disabled:opacity-50"
            style={{ background: colors.gradient }}
          >
            <span>Confirm</span>
            <span className="text-[10px] opacity-80">Total: {formatTaka(totalStake, 0)}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default BetPanelContent;
