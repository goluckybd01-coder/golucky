 import { motion } from "framer-motion";
 import { useNavigate } from "react-router-dom";
 import { Headphones, ChevronRight, Check, Shield, Clock, MessageCircle } from "lucide-react";
 import GlassCard from "@/components/auth/GlassCard";
 import usdtLogo from "@/assets/payment/usdt-logo.png";
 
 interface USDTAccount {
   id: string;
   usdt_network?: string;
   usdt_address?: string;
   is_verified: boolean;
 }
 
 interface USDTWithdrawSectionProps {
   usdtAccounts: USDTAccount[];
 }
 
 export const USDTWithdrawSection = ({ usdtAccounts }: USDTWithdrawSectionProps) => {
   const navigate = useNavigate();
 
   return (
     <GlassCard className="p-6">
       <div className="flex flex-col items-center py-4">
         {/* USDT Icon with glow */}
         <motion.div 
           className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-teal-500/20 to-green-500/20 flex items-center justify-center mb-6 border-2 border-teal-500/30"
           animate={{ 
             boxShadow: ["0 0 20px rgba(20,184,166,0.3)", "0 0 40px rgba(20,184,166,0.5)", "0 0 20px rgba(20,184,166,0.3)"]
           }}
           transition={{ duration: 2, repeat: Infinity }}
         >
           <img src={usdtLogo} alt="USDT payment method" className="w-16 h-16 object-contain" />
           <motion.div 
             className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center"
             animate={{ scale: [1, 1.2, 1] }}
             transition={{ duration: 1.5, repeat: Infinity }}
           >
             <Headphones size={14} className="text-white" />
           </motion.div>
         </motion.div>
 
         {/* Title */}
         <h3 className="text-white font-bold text-xl mb-2 text-center">
           USDT Withdrawal Setup
         </h3>
 
         {/* Description */}
         <p className="text-white/60 text-center mb-6 text-sm leading-relaxed max-w-xs">
           To withdraw via USDT, you need to verify your identity and set up your wallet address through our secure Live Support.
         </p>
 
         {/* Steps */}
         <div className="w-full space-y-3 mb-6">
           <motion.div 
             className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.1 }}
           >
             <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
               <MessageCircle size={14} />
             </div>
             <span className="text-white/80 text-sm">Contact Live Support</span>
           </motion.div>
           <motion.div 
             className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.2 }}
           >
             <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
               <Shield size={14} />
             </div>
             <span className="text-white/80 text-sm">Verify NID for security</span>
           </motion.div>
           <motion.div 
             className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.3 }}
           >
             <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
               <Check size={14} />
             </div>
             <span className="text-white/80 text-sm">Add your USDT wallet address</span>
           </motion.div>
         </div>
 
         {/* Features */}
         <div className="flex items-center justify-center gap-4 mb-6">
           <div className="flex items-center gap-1.5 text-white/40 text-xs">
             <Clock size={12} />
             <span>24/7 Support</span>
           </div>
           <div className="flex items-center gap-1.5 text-white/40 text-xs">
             <Shield size={12} />
             <span>Secure</span>
           </div>
         </div>
 
         {/* Contact Support Button */}
         <motion.button
           onClick={() => navigate("/support-chat?type=user")}
           className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-green-500/40 flex items-center justify-center gap-3"
           whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(34,197,94,0.5)" }}
           whileTap={{ scale: 0.98 }}
         >
           <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
             <Headphones size={20} className="text-white" />
           </div>
           <div className="text-left">
             <span className="block text-base">Open Live Support</span>
             <span className="text-xs text-white/70">Available 24/7</span>
           </div>
           <ChevronRight size={20} className="ml-auto" />
         </motion.button>
 
         {/* AI Chat Alternative */}
         <motion.button
           onClick={() => navigate("/support-chat")}
           className="w-full mt-3 px-6 py-3 bg-white/5 border border-white/10 text-white/70 font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
           whileHover={{ scale: 1.01 }}
           whileTap={{ scale: 0.99 }}
         >
           <span className="text-sm">Or ask our AI Assistant first</span>
           <span className="text-amber-400">✨</span>
         </motion.button>
       </div>
 
       {/* Verified USDT Accounts */}
       {usdtAccounts.length > 0 && (
         <div className="mt-6 pt-4 border-t border-white/10">
           <h4 className="font-bold text-white mb-3 flex items-center gap-2">
             <Check size={16} className="text-emerald-400" />
             Your Verified USDT Accounts
           </h4>
           {usdtAccounts.map((account) => (
             <motion.div 
               key={account.id} 
               className="flex items-center gap-3 p-4 bg-gradient-to-r from-teal-500/10 to-green-500/10 rounded-xl border border-teal-500/30 mb-2"
               whileHover={{ scale: 1.01 }}
             >
               <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2">
                 <img src={usdtLogo} alt="USDT payment method" className="w-full h-full object-contain" />
               </div>
               <div className="flex-1">
                 <p className="font-bold text-white">{account.usdt_network}</p>
                 <p className="text-xs text-white/50 font-mono truncate">{account.usdt_address}</p>
               </div>
               {account.is_verified && (
                 <div className="px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                   <span className="text-emerald-400 text-xs font-bold">Verified</span>
                 </div>
               )}
             </motion.div>
           ))}
         </div>
       )}
     </GlassCard>
   );
 };
