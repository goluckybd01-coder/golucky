import { motion, AnimatePresence } from "framer-motion";
import { History, Clock, CheckCircle, XCircle, Wallet, AlertCircle } from "lucide-react";
import GlassCard from "@/components/auth/GlassCard";

import bkashLogo from "@/assets/payment/bkash-logo.png";
import nagadLogo from "@/assets/payment/nagad-logo.png";
import usdtLogo from "@/assets/payment/usdt-logo.png";

interface WithdrawHistory {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  admin_notes: string | null;
}

interface WithdrawHistoryCardProps {
  history: WithdrawHistory[];
  onViewAll: () => void;
  isFullView?: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Clock className="text-amber-400" size={16} />;
    case "approved":
      return <CheckCircle className="text-emerald-400" size={16} />;
    case "rejected":
      return <XCircle className="text-rose-400" size={16} />;
    default:
      return <Clock className="text-gray-400" size={16} />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
    case "approved":
      return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    case "rejected":
      return "bg-rose-500/20 text-rose-400 border border-rose-500/30";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
};

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const WithdrawHistoryCard = ({ history, onViewAll, isFullView = false }: WithdrawHistoryCardProps) => {
  if (isFullView) {
    return (
      <div className="px-4 py-4">
        <motion.h3 
          className="font-bold text-white mb-4 flex items-center gap-2 text-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Clock size={20} className="text-cyan-400" /> All Transactions
        </motion.h3>
        
        {history.length === 0 ? (
          <GlassCard className="p-10">
            <div className="text-center">
              <motion.div
                className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center border border-white/10"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <History size={40} className="text-white/30" />
              </motion.div>
              <p className="text-white/50 text-lg font-medium">No withdrawals yet</p>
              <p className="text-white/30 text-sm mt-1">Your transaction history will appear here</p>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {history.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <GlassCard className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center overflow-hidden p-2 flex-shrink-0 shadow-lg border border-white/20">
                      {item.payment_method === "nagad" ? (
                        <img src={nagadLogo} alt="Nagad payment method" className="w-full h-full object-contain" />
                      ) : item.payment_method === "bkash" ? (
                        <img src={bkashLogo} alt="bKash payment method" className="w-full h-full object-contain" />
                      ) : item.payment_method === "usdt" ? (
                        <img src={usdtLogo} alt="USDT payment method" className="w-full h-full object-contain" />
                      ) : (
                        <Wallet className="text-cyan-500" size={28} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white uppercase">{item.payment_method}</p>
                          <p className="text-xs text-white/40 mt-0.5">{formatDate(item.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg text-cyan-400 block">
                            -৳{item.amount.toLocaleString("en-IN")}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block ${getStatusBadge(item.status)}`}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {item.admin_notes && (
                    <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300/80 flex items-start gap-2">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                      {item.admin_notes}
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <GlassCard className="p-5">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <History size={18} className="text-cyan-400" />
          Recent Withdrawals
        </div>
        {history.length > 0 && (
          <span className="text-xs text-white/40">{history.length} total</span>
        )}
      </h3>
      
      {history.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
            <History size={24} className="text-white/20" />
          </div>
          <p className="text-white/40 text-sm">No withdrawals yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.slice(0, 3).map((item) => (
            <motion.div 
              key={item.id} 
              className="flex items-center justify-between py-3 px-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(item.status)}
                <div>
                  <span className="text-sm text-white font-medium capitalize">{item.payment_method}</span>
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              </div>
              <span className="font-bold text-cyan-400">
                -৳{item.amount.toLocaleString()}
              </span>
            </motion.div>
          ))}
        </div>
      )}
      
      <motion.button 
        onClick={onViewAll}
        className="w-full mt-4 py-3 border-2 border-cyan-500/50 text-cyan-400 rounded-xl font-semibold text-sm hover:bg-cyan-500/10 transition-colors flex items-center justify-center gap-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <History size={16} />
        View All History
      </motion.button>
    </GlassCard>
  );
};
