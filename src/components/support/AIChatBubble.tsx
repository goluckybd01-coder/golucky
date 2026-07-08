 import { motion } from "framer-motion";
 import { format } from "date-fns";
 import { Bot, User, Sparkles } from "lucide-react";
 
 interface AIChatBubbleProps {
   message: string;
   isUser: boolean;
   timestamp: Date;
   isTyping?: boolean;
 }
 
 const AIChatBubble = ({ message, isUser, timestamp, isTyping }: AIChatBubbleProps) => {
   return (
     <motion.div
       initial={{ opacity: 0, y: 10, scale: 0.95 }}
       animate={{ opacity: 1, y: 0, scale: 1 }}
       transition={{ type: "spring", stiffness: 300, damping: 25 }}
       className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}
     >
       {/* Avatar */}
       <div
         className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
           isUser
             ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20"
             : "bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/20"
         }`}
       >
         {isUser ? (
           <User size={16} className="text-white" />
         ) : (
           <Bot size={16} className="text-white" />
         )}
       </div>
 
       {/* Message Bubble */}
       <div
         className={`max-w-[75%] ${
           isUser
             ? "bg-gradient-to-br from-green-600 to-emerald-700 shadow-lg shadow-green-500/10"
             : "bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/30"
         } rounded-2xl px-4 py-3 ${isUser ? "rounded-br-md" : "rounded-bl-md"}`}
       >
         {/* AI Badge */}
         {!isUser && (
           <div className="flex items-center gap-1 mb-1.5">
             <Sparkles size={10} className="text-violet-400" />
             <span className="text-violet-400 text-[10px] font-semibold">GoLucky AI</span>
           </div>
         )}
 
         {/* Message or Typing */}
         {isTyping ? (
           <div className="flex items-center gap-1 py-1">
             {[0, 1, 2].map((i) => (
               <motion.div
                 key={i}
                 className="w-2 h-2 bg-violet-400 rounded-full"
                 animate={{ y: [0, -6, 0] }}
                 transition={{ 
                   duration: 0.6, 
                   repeat: Infinity, 
                   delay: i * 0.15 
                 }}
               />
             ))}
           </div>
         ) : (
           <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
             {message}
           </p>
         )}
 
         {/* Timestamp */}
         {!isTyping && (
           <div className={`flex items-center mt-1.5 ${isUser ? "justify-end" : "justify-start"}`}>
             <span className="text-[10px] text-white/40">
               {format(timestamp, "HH:mm")}
             </span>
           </div>
         )}
       </div>
     </motion.div>
   );
 };
 
 export default AIChatBubble;
