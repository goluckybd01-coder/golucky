import { motion } from "framer-motion";
import { Banknote, Timer, Target, Shield, Star } from "lucide-react";
import GlassCard from "@/components/auth/GlassCard";
import { PremiumHolographicShine } from "./WithdrawBackground";

interface WithdrawBalanceCardProps {
  balance: number;
  remainingWithdrawals: number;
  dailyLimit: number;
  canWithdrawToday: boolean;
}

export const WithdrawBalanceCard = ({ 
  balance, 
  remainingWithdrawals, 
  dailyLimit,
  canWithdrawToday 
}: WithdrawBalanceCardProps) => (
  <div className="px-4 pt-4">
    <GlassCard className="p-0 overflow-hidden">
      <motion.div 
        className="relative p-6 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-blue-600/10 to-indigo-600/20" />
        <PremiumHolographicShine />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Banknote size={22} className="text-white" />
              </motion.div>
              <div>
                <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Withdrawable Balance</span>
                <motion.p 
                  className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent"
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  style={{ backgroundSize: "200% 100%" }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  ৳{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </motion.p>
              </div>
            </div>
            
            {/* VIP Badge */}
            <motion.div 
              className="flex flex-col items-end"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
                <Star size={12} className="text-amber-400" />
                <span className="text-amber-400 text-xs font-bold">VIP</span>
              </div>
            </motion.div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Timer size={12} className="text-emerald-400" />
                <span className="text-white/50 text-[10px] uppercase">24/7</span>
              </div>
              <span className="text-white font-semibold text-sm">Fast Withdraw</span>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Target size={12} className="text-cyan-400" />
                <span className="text-white/50 text-[10px] uppercase">Today</span>
              </div>
              <span className={`font-semibold text-sm ${canWithdrawToday ? 'text-emerald-400' : 'text-rose-400'}`}>
                {remainingWithdrawals}/{dailyLimit} Left
              </span>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Shield size={12} className="text-amber-400" />
                <span className="text-white/50 text-[10px] uppercase">Secure</span>
              </div>
              <span className="text-white font-semibold text-sm">Protected</span>
            </div>
          </div>
        </div>
      </motion.div>
    </GlassCard>
  </div>
);
