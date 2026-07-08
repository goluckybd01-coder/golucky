import { motion } from "framer-motion";
import { Send, ChevronRight, AlertCircle } from "lucide-react";

interface WithdrawNowButtonProps {
  amount: string;
  isProcessing: boolean;
  disabled: boolean;
  canWithdrawToday: boolean;
  dailyLimit: number;
  onSubmit: () => void;
}

export const WithdrawNowButton = ({ 
  amount, 
  isProcessing, 
  disabled, 
  canWithdrawToday,
  dailyLimit,
  onSubmit 
}: WithdrawNowButtonProps) => (
   <motion.div 
     className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-gradient-to-t from-slate-950 via-slate-900/95 to-slate-900/80 border-t border-cyan-500/20 px-4 pt-3 sm:pt-4 z-40"
     style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
     initial={{ y: 100 }}
     animate={{ y: 0 }}
   >
     <div className="max-w-6xl mx-auto">
     {/* Amount Preview */}
     {amount && parseFloat(amount) > 0 && (
       <motion.div 
         className="flex items-center justify-between mb-3 px-2"
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
       >
         <span className="text-white/60 text-xs sm:text-sm">You will receive</span>
         <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
           ৳{parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
         </span>
       </motion.div>
     )}
    
    {/* Withdraw Now Button */}
     <motion.button
       onClick={onSubmit}
       disabled={disabled}
       className="w-full py-4 sm:py-5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white font-bold rounded-2xl disabled:opacity-50 shadow-2xl shadow-cyan-500/40 relative overflow-hidden group"
       whileHover={{ scale: disabled ? 1 : 1.02 }}
       whileTap={{ scale: disabled ? 1 : 0.98 }}
     >
      {/* Animated shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
        initial={{ x: "-200%" }}
        animate={{ x: "200%" }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      />
      
      <span className="relative z-10 flex items-center justify-center gap-3 text-lg">
        {isProcessing ? (
          <>
            <motion.div
              className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
            Processing...
          </>
        ) : (
          <>
            <Send size={22} />
            Withdraw Now
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronRight size={22} />
            </motion.div>
          </>
        )}
      </span>
    </motion.button>
    
    {/* Daily limit warning */}
    {!canWithdrawToday && (
      <motion.p 
        className="text-center text-rose-400 text-xs mt-2 flex items-center justify-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <AlertCircle size={12} />
        Daily withdrawal limit reached ({dailyLimit} times)
       </motion.p>
     )}
     </div>
   </motion.div>
 );
