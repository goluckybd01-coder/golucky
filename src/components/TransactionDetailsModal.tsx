import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowUpRight, ArrowDownRight, Gamepad2, Trophy, Gift, Users, RefreshCw, Copy, Check, Clock, Wallet, Hash } from "lucide-react";
import { useState } from "react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
  trade_id: string | null;
  game_type: string | null;
}

interface TransactionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

const TransactionDetailsModal = ({ open, onOpenChange, transaction }: TransactionDetailsModalProps) => {
  const [copied, setCopied] = useState<string | null>(null);

  if (!transaction) return null;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "bet":
        return <Gamepad2 className="text-red-500" size={24} />;
      case "win":
        return <Trophy className="text-green-500" size={24} />;
      case "deposit":
        return <ArrowDownRight className="text-green-500" size={24} />;
      case "withdraw":
        return <ArrowUpRight className="text-orange-500" size={24} />;
      case "bonus":
        return <Gift className="text-purple-500" size={24} />;
      case "referral":
        return <Users className="text-blue-500" size={24} />;
      default:
        return <RefreshCw className="text-gray-500" size={24} />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "bet":
        return "text-red-600";
      case "win":
      case "deposit":
      case "bonus":
      case "referral":
        return "text-green-600";
      case "withdraw":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  const getTransactionBgColor = (type: string) => {
    switch (type) {
      case "bet":
        return "bg-red-50 border-red-100";
      case "win":
        return "bg-green-50 border-green-100";
      case "deposit":
        return "bg-green-50 border-green-100";
      case "withdraw":
        return "bg-orange-50 border-orange-100";
      case "bonus":
        return "bg-purple-50 border-purple-100";
      case "referral":
        return "bg-blue-50 border-blue-100";
      default:
        return "bg-gray-50 border-gray-100";
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "bet":
        return "Bet Placed";
      case "win":
        return "Winnings";
      case "deposit":
        return "Deposit";
      case "withdraw":
        return "Withdrawal";
      case "bonus":
        return "Bonus";
      case "referral":
        return "Referral Reward";
      default:
        return "Transaction";
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl p-0 overflow-hidden">
        <div className={`${getTransactionBgColor(transaction.type)} p-6 text-center border-b`}>
          <div className="w-16 h-16 rounded-full bg-white shadow-lg mx-auto flex items-center justify-center mb-4">
            {getTransactionIcon(transaction.type)}
          </div>
          <p className="text-sm text-gray-500 font-medium">{getTransactionLabel(transaction.type)}</p>
          <p className={`text-3xl font-bold mt-1 ${getTransactionColor(transaction.type)}`}>
            {transaction.amount > 0 ? "+" : ""}৳ {Math.abs(transaction.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="p-4 space-y-3">
          {transaction.description && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Description</p>
              <p className="text-sm font-medium text-gray-800">{transaction.description}</p>
            </div>
          )}

          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <Clock size={16} className="text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-400">Date & Time</p>
              <p className="text-sm font-medium text-gray-800">{formatDate(transaction.created_at)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <Wallet size={16} className="text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-400">Balance After</p>
              <p className="text-sm font-medium text-gray-800">
                ৳ {transaction.balance_after.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {transaction.game_type && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <Gamepad2 size={16} className="text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-400">Game</p>
                <p className="text-sm font-medium text-gray-800 uppercase">{transaction.game_type}</p>
              </div>
            </div>
          )}

          {transaction.trade_id && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <Hash size={16} className="text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">Trade ID</p>
                <p className="text-sm font-mono text-gray-800 truncate">{transaction.trade_id}</p>
              </div>
              <button
                onClick={() => handleCopy(transaction.trade_id!, "trade_id")}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                {copied === "trade_id" ? (
                  <Check size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} className="text-gray-500" />
                )}
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <Hash size={16} className="text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">Transaction ID</p>
              <p className="text-sm font-mono text-gray-800 truncate">{transaction.id}</p>
            </div>
            <button
              onClick={() => handleCopy(transaction.id, "id")}
              className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              {copied === "id" ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy size={14} className="text-gray-500" />
              )}
            </button>
          </div>
        </div>

        <div className="p-4 pt-0">
          <button
            onClick={() => onOpenChange(false)}
            className="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white font-medium py-3 rounded-xl"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailsModal;
