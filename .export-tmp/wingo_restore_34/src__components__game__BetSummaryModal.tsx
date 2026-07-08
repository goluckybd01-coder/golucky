import { X, Receipt, TrendingUp } from "lucide-react";
import type { PendingBet } from "@/lib/gameStorage";

interface BetSummaryModalProps {
  open: boolean;
  onClose: () => void;
  pendingBets: PendingBet[];
  currentTradeId: string;
  gameName: string;
}

const BetSummaryModal = ({ open, onClose, pendingBets, currentTradeId, gameName }: BetSummaryModalProps) => {
  if (!open) return null;

  // Filter bets for current round only
  const currentRoundBets = pendingBets.filter(b => b.tradeId === currentTradeId);
  const totalStake = currentRoundBets.reduce((sum, b) => sum + b.totalStake, 0);

  const getBetLabel = (bet: PendingBet) => {
    if (bet.betKind === "number") {
      return gameName === "K3" ? `Sum ${bet.betValue}` : `Number ${bet.betValue}`;
    }
    if (bet.betKind === "color") {
      return String(bet.betValue).charAt(0).toUpperCase() + String(bet.betValue).slice(1);
    }
    return String(bet.betValue);
  };

  const getBetBadgeColor = (bet: PendingBet) => {
    if (bet.betKind === "color") {
      const color = String(bet.betValue).toLowerCase();
      if (color === "green") return "bg-green-500";
      if (color === "red") return "bg-red-500";
      if (color === "violet") return "bg-violet-500";
    }
    if (bet.betKind === "bigSmall") {
      const val = String(bet.betValue).toLowerCase();
      if (val === "big") return "bg-orange-500";
      if (val === "small") return "bg-blue-500";
      if (val === "odd") return "bg-amber-500";
      if (val === "even") return "bg-teal-500";
    }
    return "bg-gradient-to-r from-orange-400 to-orange-500";
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-[90%] max-w-sm bg-white rounded-2xl shadow-2xl animate-scale-in overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Receipt className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Bet Summary</h3>
              <p className="text-white/80 text-xs">Current Round</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="text-white" size={18} />
          </button>
        </div>

        {/* Trade ID */}
        <div className="px-5 py-3 bg-orange-50 border-b border-orange-100">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Period</span>
            <span className="font-mono font-bold text-gray-800 text-sm">{currentTradeId}</span>
          </div>
        </div>

        {/* Bets List */}
        <div className="px-5 py-4 max-h-[300px] overflow-y-auto">
          {currentRoundBets.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Receipt className="text-gray-400" size={28} />
              </div>
              <p className="text-gray-500 text-sm">No bets placed this round</p>
              <p className="text-gray-400 text-xs mt-1">Place a bet to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentRoundBets.map((bet, index) => (
                <div 
                  key={`${bet.tradeId}-${index}-${bet.createdAt}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${getBetBadgeColor(bet)} flex items-center justify-center`}>
                      <span className="text-white font-bold text-xs">
                        {bet.betKind === "number" ? bet.betValue : getBetLabel(bet).charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{getBetLabel(bet)}</p>
                      <p className="text-gray-400 text-xs">
                        ৳{bet.stake} × {bet.multiplier}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">৳{bet.totalStake.toLocaleString()}</p>
                    <p className="text-gray-400 text-xs flex items-center justify-end gap-1">
                      <TrendingUp size={10} />
                      Pending
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {currentRoundBets.length > 0 && (
          <div className="px-5 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-t border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Total Bets: {currentRoundBets.length}</p>
                <p className="text-gray-800 font-bold text-lg">৳{totalStake.toLocaleString()}</p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold text-sm shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-shadow"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BetSummaryModal;
