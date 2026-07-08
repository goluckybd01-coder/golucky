 import { motion } from "framer-motion";
 import { Bot, Headphones, Sparkles, Zap } from "lucide-react";
 
 interface ChatModeSelectorProps {
   mode: "ai" | "human";
   onModeChange: (mode: "ai" | "human") => void;
   isAgentAvailable?: boolean;
 }
 
 const ChatModeSelector = ({ mode, onModeChange, isAgentAvailable = true }: ChatModeSelectorProps) => {
   return (
     <motion.div
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       className="mx-4 mb-3"
     >
       <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 flex gap-1.5">
         {/* AI Mode */}
         <motion.button
           whileTap={{ scale: 0.98 }}
           onClick={() => onModeChange("ai")}
           className={`flex-1 relative py-3 px-4 rounded-xl transition-all duration-300 ${
             mode === "ai" 
               ? "bg-gradient-to-r from-violet-600 to-purple-600" 
               : "hover:bg-white/5"
           }`}
         >
           {mode === "ai" && (
             <motion.div
               layoutId="activeMode"
               className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl"
               initial={false}
               transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
             />
           )}
           <div className="relative flex items-center justify-center gap-2">
             <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
               mode === "ai" ? "bg-white/20" : "bg-violet-500/20"
             }`}>
               <Bot size={16} className={mode === "ai" ? "text-white" : "text-violet-400"} />
             </div>
             <div className="text-left">
               <div className="flex items-center gap-1.5">
                 <span className={`text-sm font-bold ${mode === "ai" ? "text-white" : "text-white/70"}`}>
                   AI Assistant
                 </span>
                 <Sparkles size={10} className={mode === "ai" ? "text-amber-300" : "text-amber-400"} />
               </div>
               <span className={`text-[10px] ${mode === "ai" ? "text-white/70" : "text-white/40"}`}>
                 Instant replies 24/7
               </span>
             </div>
           </div>
         </motion.button>
 
         {/* Human Mode */}
         <motion.button
           whileTap={{ scale: 0.98 }}
           onClick={() => onModeChange("human")}
           className={`flex-1 relative py-3 px-4 rounded-xl transition-all duration-300 ${
             mode === "human" 
               ? "bg-gradient-to-r from-green-600 to-emerald-600" 
               : "hover:bg-white/5"
           }`}
         >
           {mode === "human" && (
             <motion.div
               layoutId="activeMode"
               className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl"
               initial={false}
               transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
             />
           )}
           <div className="relative flex items-center justify-center gap-2">
             <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
               mode === "human" ? "bg-white/20" : "bg-green-500/20"
             }`}>
               <Headphones size={16} className={mode === "human" ? "text-white" : "text-green-400"} />
             </div>
             <div className="text-left">
               <span className={`text-sm font-bold block ${mode === "human" ? "text-white" : "text-white/70"}`}>
                 Live Agent
               </span>
               <div className="flex items-center gap-1">
                 {isAgentAvailable ? (
                   <>
                     <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                     <span className={`text-[10px] ${mode === "human" ? "text-white/70" : "text-green-400"}`}>
                       Available
                     </span>
                   </>
                 ) : (
                   <span className={`text-[10px] ${mode === "human" ? "text-white/70" : "text-white/40"}`}>
                     ~2 min wait
                   </span>
                 )}
               </div>
             </div>
           </div>
         </motion.button>
       </div>
     </motion.div>
   );
 };
 
 export default ChatModeSelector;
