 import { motion } from "framer-motion";
 import { Bot, Headphones, MessageCircle, Sparkles, Shield, Clock, Zap } from "lucide-react";
 
 interface EmptyChatProps {
   mode: "ai" | "human";
   onQuickAction?: (action: string) => void;
 }
 
 const quickPrompts = [
   { icon: "💰", text: "Deposit issue", action: "I'm having an issue with my deposit" },
   { icon: "💸", text: "Withdrawal help", action: "I need help with my withdrawal" },
   { icon: "🎮", text: "Game rules", action: "Can you explain the game rules?" },
   { icon: "🎁", text: "Bonus info", action: "Tell me about available bonuses" },
 ];
 
 const EmptyChat = ({ mode, onQuickAction }: EmptyChatProps) => {
   return (
     <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       className="flex flex-col items-center justify-center h-full px-6 py-8"
     >
       {/* Main Icon */}
       <motion.div
         initial={{ scale: 0.5, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         transition={{ delay: 0.1, type: "spring" }}
         className="relative mb-6"
       >
         <div className={`w-24 h-24 rounded-3xl flex items-center justify-center ${
           mode === "ai" 
             ? "bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30"
             : "bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30"
         }`}>
           {mode === "ai" ? (
             <Bot size={44} className="text-violet-400" />
           ) : (
             <Headphones size={44} className="text-green-400" />
           )}
         </div>
         
         {/* Floating Sparkles */}
         <motion.div
           className="absolute -top-2 -right-2"
           animate={{ rotate: [0, 15, -15, 0] }}
           transition={{ duration: 2, repeat: Infinity }}
         >
           <Sparkles size={20} className={mode === "ai" ? "text-violet-400" : "text-green-400"} />
         </motion.div>
       </motion.div>
 
       {/* Title */}
       <motion.h3
         initial={{ y: 10, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         transition={{ delay: 0.2 }}
         className="text-white font-bold text-xl mb-2 text-center"
       >
         {mode === "ai" ? "AI Assistant Ready!" : "Connect with Support"}
       </motion.h3>
 
       {/* Subtitle */}
       <motion.p
         initial={{ y: 10, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         transition={{ delay: 0.3 }}
         className="text-white/50 text-sm text-center mb-6 max-w-xs"
       >
         {mode === "ai" 
           ? "Get instant answers to your questions about games, deposits, and more!"
           : "Our support team is ready to help you with any issues."
         }
       </motion.p>
 
       {/* Features */}
       <motion.div
         initial={{ y: 10, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         transition={{ delay: 0.4 }}
         className="flex items-center gap-4 mb-8"
       >
         <div className="flex items-center gap-1.5 text-white/40 text-xs">
           <Clock size={12} />
           <span>24/7</span>
         </div>
         <div className="flex items-center gap-1.5 text-white/40 text-xs">
           <Shield size={12} />
           <span>Secure</span>
         </div>
         <div className="flex items-center gap-1.5 text-white/40 text-xs">
           <Zap size={12} />
           <span>{mode === "ai" ? "Instant" : "Fast"}</span>
         </div>
       </motion.div>
 
       {/* Quick Prompts */}
       <motion.div
         initial={{ y: 10, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         transition={{ delay: 0.5 }}
         className="w-full space-y-2"
       >
         <p className="text-white/40 text-xs text-center mb-3">Quick questions:</p>
         <div className="grid grid-cols-2 gap-2">
           {quickPrompts.map((prompt, index) => (
             <motion.button
               key={prompt.text}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.5 + index * 0.1 }}
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={() => onQuickAction?.(prompt.action)}
               className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
             >
               <span className="text-lg">{prompt.icon}</span>
               <span className="text-white/70 text-xs font-medium">{prompt.text}</span>
             </motion.button>
           ))}
         </div>
       </motion.div>
     </motion.div>
   );
 };
 
 export default EmptyChat;
