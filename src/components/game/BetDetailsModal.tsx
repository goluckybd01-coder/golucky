import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, XCircle, Clock, Receipt, Coins, TrendingUp, Calendar, Hash, Percent, Info, Gamepad2 } from "lucide-react";
import { format } from "date-fns";
import { CopyablePeriod } from "./CopyablePeriod";
import { formatTaka, formatTakaWithSign } from "@/lib/currency";

const GAME_FEE_RATES: Record<string, number> = {
  'wingo': 2.0,
  'win go': 2.0,
  'k3': 3.0,
  '5d': 2.0,
  'fived': 2.0,
  '5d lotre': 2.0,
  'trxwin': 2.0,
  'trx win': 2.0,
  'crash': 2.0,
  'mines': 2.0,
  'aviator': 2.0,
};

const getGameFeeRate = (gameType?: string): number => {
  if (!gameType) return 2.0;
  const normalized = gameType.toLowerCase().trim();
  return GAME_FEE_RATES[normalized] || 2.0;
};

const getGameIcon = (gameType?: string): string => {
  if (!gameType) return '🎮';
  const type = gameType.toLowerCase();
  if (type.includes('wingo') || type.includes('win go')) return '🎯';
  if (type.includes('k3')) return '🎲';
  if (type.includes('5d') || type.includes('fived')) return '🎰';
  if (type.includes('trx')) return '💎';
  if (type.includes('crash')) return '🚀';
  if (type.includes('mines')) return '💣';
  if (type.includes('aviator')) return '✈️';
  return '🎮';
};

export interface BetDetails {
  period: string;
  betType: string;
  betAmount: number;
  fee?: number;
  netAmount?: number;
  multiplier?: number;
  potentialWin?: number;
  result: number | number[] | null;
  isWin: boolean | null;
  payout: number;
  timestamp: Date;
  duration?: number;
  roundKey?: string;
}

interface BetDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bet: BetDetails | null;
  gameType?: string;
}

export const BetDetailsModal: React.FC<BetDetailsModalProps> = ({
  open,
  onOpenChange,
  bet,
  gameType = "WinGo",
}) => {
  if (!bet) return null;

  const isPending = bet.isWin === null;
  const isWin = bet.isWin === true;
  
  const feeRate = getGameFeeRate(gameType);
  const calculatedFee = bet.fee ?? (bet.betAmount * feeRate / 100);
  const calculatedNetAmount = bet.netAmount ?? (bet.betAmount - calculatedFee);

  const getDurationLabel = (duration?: number) => {
    if (duration === 0.5) return "30 Seconds";
    if (duration === 1) return "1 Minute";
    if (duration === 3) return "3 Minutes";
    if (duration === 5) return "5 Minutes";
    if (duration === 10) return "10 Minutes";
    return "Unknown";
  };

  const formatResult = (result: number | number[] | null) => {
    if (result === null) return "Pending...";
    if (Array.isArray(result)) return result.join(", ");
    return result.toString();
  };

  const statusColor = isPending 
    ? "from-yellow-400 to-amber-500" 
    : isWin 
      ? "from-green-400 to-emerald-500" 
      : "from-red-400 to-rose-500";

  const statusBg = isPending 
    ? "bg-yellow-50 border-yellow-200" 
    : isWin 
      ? "bg-green-50 border-green-200" 
      : "bg-red-50 border-red-200";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto p-0 overflow-hidden rounded-2xl">
        <div className={`bg-gradient-to-r ${statusColor} p-4 text-white`}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Bet Details
              </DialogTitle>
              <div className="flex items-center gap-2">
                {isPending ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-semibold">PENDING</span>
                  </div>
                ) : isWin ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                    <Trophy className="w-4 h-4" />
                    <span className="text-xs font-semibold">WON!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                    <XCircle className="w-4 h-4" />
                    <span className="text-xs font-semibold">LOST</span>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-4 space-y-4">
          <div className={`p-3 rounded-xl border ${statusBg}`}>
            <div className="flex items-center gap-2 mb-1">
              <Hash className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500 font-medium">Trade ID</span>
            </div>
            <CopyablePeriod period={bet.period} className="text-sm font-mono font-semibold text-gray-800" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Duration</span>
              </div>
              <p className="text-sm font-semibold text-gray-800">{getDurationLabel(bet.duration)}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Time</span>
              </div>
              <p className="text-sm font-semibold text-gray-800">{format(bet.timestamp, "hh:mm a")}</p>
              <p className="text-[10px] text-gray-400">{format(bet.timestamp, "dd MMM yyyy")}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-lg">
                  {getGameIcon(gameType)}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Your Selection</p>
                  <p className="text-sm font-bold text-gray-800">{bet.betType}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                <Gamepad2 className="w-3 h-3" />
                <span className="text-xs font-medium">{gameType}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white/60">
                <p className="text-[10px] text-gray-500">Bet Amount</p>
                <p className="text-sm font-bold text-gray-800">৳{bet.betAmount.toFixed(2)}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-50 border border-red-100">
                <p className="text-[10px] text-red-500 flex items-center justify-center gap-0.5">
                  <Percent className="w-2.5 h-2.5" />
                  Fee ({feeRate}%)
                </p>
                <p className="text-sm font-bold text-red-500">-৳{calculatedFee.toFixed(2)}</p>
              </div>
              <div className="p-2 rounded-lg bg-white/60">
                <p className="text-[10px] text-gray-500">Net Bet</p>
                <p className="text-sm font-bold text-teal-600">৳{calculatedNetAmount.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="mt-3 p-2 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-700">
                <strong>{gameType}</strong> has a <strong>{feeRate}%</strong> platform fee deducted from each bet.
              </p>
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${statusBg}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500 font-medium">Result</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                isPending ? "bg-yellow-100 text-yellow-700" :
                isWin ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {formatResult(bet.result)}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white/80">
              <div>
                <p className="text-xs text-gray-500">Multiplier</p>
                <p className="text-lg font-bold text-gray-800">{bet.multiplier || 1}x</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{isPending ? "Potential Win" : isWin ? "Won Amount" : "Lost"}</p>
                <p className={`text-lg font-bold ${
                  isPending ? "text-yellow-600" : isWin ? "text-green-600" : "text-red-600"
                }`}>
                  {isPending 
                    ? formatTaka(bet.potentialWin || (bet.netAmount || bet.betAmount * 0.98) * (bet.multiplier || 1))
                    : isWin 
                      ? `+${formatTaka(bet.payout)}` 
                      : `-${formatTaka(bet.betAmount)}`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
