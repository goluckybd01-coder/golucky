 import { motion } from "framer-motion";
 import { Wallet, Gift } from "lucide-react";
 import GlassCard from "@/components/auth/GlassCard";
 import { PremiumHolographicShine } from "./WithdrawBackground";
 
 // Quick amount preset button
 const QuickAmountButton = ({ 
   amount, 
   isSelected, 
   onClick 
 }: { 
   amount: number; 
   isSelected: boolean; 
   onClick: () => void;
 }) => (
   <motion.button
     onClick={onClick}
     className={`relative py-3 px-4 rounded-xl font-bold text-sm transition-all ${
       isSelected 
         ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30" 
         : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
     }`}
     whileHover={{ scale: 1.05 }}
     whileTap={{ scale: 0.95 }}
   >
     {isSelected && <PremiumHolographicShine />}
     <span className="relative z-10">৳{amount >= 1000 ? `${amount / 1000}K` : amount}</span>
   </motion.button>
 );
 
 interface WithdrawAmountInputProps {
   amount: string;
   setAmount: (amount: string) => void;
   balance: number;
   quickAmounts: number[];
 }
 
 export const WithdrawAmountInput = ({ 
   amount, 
   setAmount, 
   balance,
   quickAmounts 
 }: WithdrawAmountInputProps) => (
   <GlassCard className="p-5">
     <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-lg">
       <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
         <span className="text-cyan-400 font-bold">৳</span>
       </div>
       Withdrawal Amount
     </h3>
     
     <div className="relative mb-5">
       <div className="absolute left-5 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-2xl">৳</div>
       <input
         type="number"
         value={amount}
         onChange={(e) => setAmount(e.target.value)}
         placeholder="0"
         className="w-full pl-14 pr-20 py-5 bg-white/5 border-2 border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-white text-3xl font-bold placeholder-white/20 transition-all"
       />
       <motion.button 
         onClick={() => setAmount(balance.toString())}
         className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-2 text-cyan-400 text-sm font-bold border-2 border-cyan-500/50 rounded-xl hover:bg-cyan-500/20 transition-colors"
         whileHover={{ scale: 1.05 }}
         whileTap={{ scale: 0.95 }}
       >
         All
       </motion.button>
     </div>
     
     {/* Quick Amount Buttons */}
     <div className="grid grid-cols-4 gap-2 mb-5">
       {quickAmounts.map((quickAmount) => (
         <QuickAmountButton
           key={quickAmount}
           amount={quickAmount}
           isSelected={amount === quickAmount.toString()}
           onClick={() => setAmount(quickAmount.toString())}
         />
       ))}
     </div>
     
     {/* Amount Summary */}
     <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
       <div className="flex items-center justify-between">
         <span className="text-white/50 flex items-center gap-2">
           <Wallet size={14} />
           Withdrawable
         </span>
         <span className="text-cyan-400 font-medium">৳{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
       </div>
       <div className="flex items-center justify-between border-t border-white/10 pt-3">
         <span className="text-white/50 flex items-center gap-2">
           <Gift size={14} className="text-emerald-400" />
           You will receive
         </span>
         <span className="text-emerald-400 font-bold text-lg">৳{amount ? parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}</span>
       </div>
     </div>
   </GlassCard>
 );
