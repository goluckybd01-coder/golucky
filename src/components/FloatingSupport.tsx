import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Headphones, Bot, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FloatingSupport = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAIChat = () => {
    setIsExpanded(false);
    navigate("/support-chat");
  };

  const handleLiveChat = () => {
    setIsExpanded(false);
    navigate("/support-chat?type=user");
  };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto"
          >
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl shadow-black/50 min-w-[200px]">
              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAIChat}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-violet-500/20 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Bot size={18} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-semibold text-sm">AI Assistant</span>
                    <Sparkles size={10} className="text-amber-400" />
                  </div>
                  <span className="text-white/50 text-xs">Instant 24/7 help</span>
                </div>
              </motion.button>

              <div className="h-px bg-white/10 mx-3 my-1" />

              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLiveChat}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-green-500/20 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Headphones size={18} className="text-white" />
                </div>
                <div className="text-left">
                  <span className="text-white font-semibold text-sm block">Live Agent</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-xs">Online</span>
                  </div>
                </div>
              </motion.button>
            </div>

            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-r border-b border-white/10 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative w-16 h-16 rounded-full shadow-2xl flex items-center justify-center clickable force-click pointer-events-auto"
        style={{
          background: isExpanded
            ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
            : "linear-gradient(135deg, #22c55e 0%, #10b981 100%)",
          boxShadow: isExpanded
            ? "0 10px 40px -10px rgba(239,68,68,0.5)"
            : "0 10px 40px -10px rgba(34,197,94,0.5)"
        }}
      >
        {!isExpanded && (
          <motion.div
            className="absolute inset-0 rounded-full bg-green-500/30"
            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white/30 ${
          isExpanded ? "bg-red-400" : "bg-green-400"
        }`}>
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X size={24} className="text-white" />
              </motion.div>
            ) : (
              <motion.div key="message" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <MessageCircle size={24} className="text-white" fill="currentColor" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isExpanded && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
            <span className="text-white text-[10px] font-bold">1</span>
          </motion.div>
        )}
      </motion.button>

      {isExpanded && (
        <div className="fixed inset-0 -z-10 pointer-events-auto" onClick={() => setIsExpanded(false)} />
      )}
    </div>
  );
};

export default FloatingSupport;
