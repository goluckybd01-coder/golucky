import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, X, LogIn, UserPlus } from "lucide-react";
import goluckyTextLogo from "@/assets/golucky-text-logo-2.png";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const AIAssistant = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  
  useEffect(() => {
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
      if (session) setShowLoginPopup(false);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  // Don't show on AI chat page or auth pages
  if (location.pathname === "/ai-chat" || location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  const handleClick = () => {
    if (isLoggedIn) {
      navigate("/ai-chat");
    } else {
      setShowLoginPopup(true);
    }
  };

  return (
    <>
      {/* Floating AI Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary via-orange-500 to-amber-500 shadow-lg shadow-primary/30 flex items-center justify-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Bot className="w-7 h-7 text-white" />
        </motion.div>
        
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/50"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Online indicator */}
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        {/* Sparkle */}
        <motion.div
          className="absolute -top-2 left-0"
          animate={{ rotate: 360, scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </motion.div>
      </motion.button>

      {/* Login Required Popup */}
      <AnimatePresence>
        {showLoginPopup && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginPopup(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            
            {/* Popup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-32 right-4 left-4 sm:left-auto sm:w-[320px] z-[101]"
            >
              <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary via-orange-500 to-amber-500 p-4 relative">
                  <button
                    onClick={() => setShowLoginPopup(false)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <div className="flex items-center gap-3">
                    <motion.div className="relative" style={{ perspective: "1000px" }}>
                      {/* Glow effect */}
                      <motion.div
                        className="absolute inset-0 -z-10"
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{
                          background: "radial-gradient(ellipse, rgba(251,191,36,0.4) 0%, transparent 70%)",
                          filter: "blur(15px)",
                          transform: "scale(1.5)",
                        }}
                      />
                      <motion.img
                        src={goluckyTextLogo}
                        alt="GoLucky"
                        className="h-10 w-auto object-contain"
                        animate={{
                          rotateY: [0, 8, 0, -8, 0],
                          scale: [1, 1.03, 1],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        style={{
                          filter: "drop-shadow(0 0 12px rgba(251,191,36,0.8)) drop-shadow(0 0 25px rgba(16,185,129,0.6)) brightness(1.1)",
                        }}
                      />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-white flex items-center gap-1">
                        AI Assistant
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      </h3>
                      <p className="text-xs text-white/80">AI সহকারী</p>
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-5">
                  <div className="text-center mb-5">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center">
                      <Bot className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-1">লগইন করুন</h4>
                    <p className="text-sm text-gray-400">
                      AI সহকারী ব্যবহার করতে আপনাকে প্রথমে লগইন করতে হবে
                    </p>
                  </div>
                  
                  {/* Features Preview */}
                  <div className="bg-gray-800/50 rounded-xl p-3 mb-5 border border-gray-700">
                    <p className="text-xs text-gray-500 mb-2">আপনি যা করতে পারবেন:</p>
                    <div className="space-y-2">
                      {["গেম খেলার নিয়ম জানুন", "ডিপোজিট/উইথড্র সাহায্য", "VIP ও রেফারেল তথ্য"].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                          <Sparkles className="w-3 h-3 text-primary" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        setShowLoginPopup(false);
                        navigate("/login");
                      }}
                      className="w-full bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 text-white font-semibold"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      লগইন করুন
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowLoginPopup(false);
                        navigate("/register");
                      }}
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      নতুন অ্যাকাউন্ট তৈরি করুন
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
