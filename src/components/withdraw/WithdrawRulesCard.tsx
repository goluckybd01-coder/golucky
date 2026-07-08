 import { motion } from "framer-motion";
 import { AlertCircle, Clock, Target, TrendingUp, Shield } from "lucide-react";
 import GlassCard from "@/components/auth/GlassCard";
 
 interface WithdrawRulesCardProps {
   activeTab: "ewallet" | "usdt";
   minWithdrawal: number;
   maxWithdrawal: number;
   minWithdrawalUSDT: number;
   maxWithdrawalUSDT: number;
   dailyLimit: number;
 }
 
 export const WithdrawRulesCard = ({ 
   activeTab, 
   minWithdrawal, 
   maxWithdrawal,
   minWithdrawalUSDT,
   maxWithdrawalUSDT,
   dailyLimit 
 }: WithdrawRulesCardProps) => (
   <GlassCard className="p-5">
     <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-lg">
       <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
         <AlertCircle size={16} className="text-amber-400" />
       </div>
       Withdrawal Rules
     </h3>
     
     <div className="space-y-3">
       <motion.div 
         className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5"
         initial={{ opacity: 0, x: -20 }}
         animate={{ opacity: 1, x: 0 }}
         transition={{ delay: 0.1 }}
       >
         <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
           <Clock size={18} className="text-cyan-400" />
         </div>
         <div className="flex-1">
           <span className="text-white/50 text-xs uppercase">Withdraw Time</span>
           <p className="text-cyan-400 font-bold">00:00 - 23:59</p>
         </div>
       </motion.div>
       
       <motion.div 
         className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5"
         initial={{ opacity: 0, x: -20 }}
         animate={{ opacity: 1, x: 0 }}
         transition={{ delay: 0.2 }}
       >
         <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0">
           <Target size={18} className="text-rose-400" />
         </div>
         <div className="flex-1">
           <span className="text-white/50 text-xs uppercase">Daily Limit</span>
           <p className="text-rose-400 font-bold">{dailyLimit} times</p>
         </div>
       </motion.div>
       
       <motion.div 
         className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5"
         initial={{ opacity: 0, x: -20 }}
         animate={{ opacity: 1, x: 0 }}
         transition={{ delay: 0.3 }}
       >
         <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
           <TrendingUp size={18} className="text-amber-400" />
         </div>
         <div className="flex-1">
           <span className="text-white/50 text-xs uppercase">Amount Range</span>
           <p className="text-amber-400 font-bold">
             {activeTab === "usdt" 
               ? `৳${minWithdrawalUSDT.toLocaleString()}-৳${maxWithdrawalUSDT.toLocaleString()}`
               : `৳${minWithdrawal.toLocaleString()}-৳${maxWithdrawal.toLocaleString()}`
             }
           </p>
         </div>
       </motion.div>
       
       <motion.div 
         className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5"
         initial={{ opacity: 0, x: -20 }}
         animate={{ opacity: 1, x: 0 }}
         transition={{ delay: 0.4 }}
       >
         <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
           <Shield size={18} className="text-violet-400" />
         </div>
         <div className="flex-1">
           <span className="text-white/50 text-xs uppercase">Security</span>
           <p className="text-violet-400 font-bold text-sm">Verify account info before withdrawing</p>
         </div>
       </motion.div>
     </div>
   </GlassCard>
 );
