import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Headphones, MoreVertical, X, RefreshCw, Bot, Sparkles } from "lucide-react";
import type { SupportChat } from "@/hooks/useSupportChat";

interface SupportHeaderProps {
  chatType: "user" | "agent_line";
  chat: SupportChat | null;
  showMenu: boolean;
  onBack: () => void;
  onMenuToggle: () => void;
  onNewChat: () => void;
  onClose: () => void;
}

const SupportHeader = ({
  chatType,
  chat,
  showMenu,
  onBack,
  onMenuToggle,
  onNewChat,
  onClose,
}: SupportHeaderProps) => {
  return (
    <div className="relative z-10">
      {/* Header Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-900/40 via-emerald-900/20 to-transparent" />
      
      <div className="relative flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white shadow-lg shadow-black/20"
          >
            <ArrowLeft size={20} />
          </motion.button>

          {/* Avatar & Title */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.div
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-green-500/30"
                animate={{ 
                  boxShadow: chat?.status === "in_progress" 
                    ? ["0 10px 25px -5px rgba(34,197,94,0.3)", "0 10px 25px -5px rgba(34,197,94,0.5)", "0 10px 25px -5px rgba(34,197,94,0.3)"]
                    : "0 10px 25px -5px rgba(34,197,94,0.3)"
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Headphones size={24} className="text-white" />
              </motion.div>
              
              {/* Online Indicator */}
              {chat?.status === "in_progress" && (
                <motion.div
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <motion.div 
                    className="absolute inset-0 bg-green-400 rounded-full"
                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-white font-bold text-lg">
                  {chatType === "agent_line" ? "Agent Support" : "Live Support"}
                </h1>
                {chat?.priority === "high" && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-[10px] font-bold text-white">
                    PRIORITY
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {chat?.status === "in_progress" ? (
                  <>
                    <motion.div
                      className="w-1.5 h-1.5 bg-green-400 rounded-full"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                    <span className="text-green-400 text-xs font-medium">Agent connected</span>
                  </>
                ) : chat?.status === "closed" ? (
                  <span className="text-white/40 text-xs">Chat closed</span>
                ) : (
                  <>
                    <Sparkles size={10} className="text-amber-400" />
                    <span className="text-white/50 text-xs">We're here 24/7</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onMenuToggle}
            className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white shadow-lg shadow-black/20"
          >
            <MoreVertical size={20} />
          </motion.button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-14 w-52 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
              >
                <div className="p-1">
                  <button
                    onClick={onNewChat}
                    className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <RefreshCw size={14} className="text-green-400" />
                    </div>
                    <span className="text-sm font-medium">Start New Chat</span>
                  </button>
                  
                  {chat?.status !== "closed" && (
                    <button
                      onClick={onClose}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <X size={14} className="text-red-400" />
                      </div>
                      <span className="text-sm font-medium">End Chat</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SupportHeader;
