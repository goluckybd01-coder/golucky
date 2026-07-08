import { motion } from "framer-motion";
import { Download, Bell, Gift, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import DailyRewardButton from "@/components/DailyRewardButton";
import NotificationCenter from "@/components/NotificationCenter";
import goluckyTextLogo from "@/assets/golucky-text-logo-1.png";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PremiumHeader = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      alert("📱 iOS তে Install করতে:\n\n1. Safari-তে Share বাটনে ট্যাপ করুন\n2. 'Add to Home Screen' সিলেক্ট করুন\n3. 'Add' ট্যাপ করুন");
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("📱 App Install করতে:\n\nBrowser menu থেকে 'Install App' বা 'Add to Home Screen' অপশন সিলেক্ট করুন");
    }
  };

  return (
    <motion.header
      className="relative bg-gradient-to-r from-[#0a0a1a] via-[#12122a] to-[#0a0a1a] px-4 py-4 shadow-2xl border-b border-amber-500/40"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Premium golden glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/15 via-violet-500/5 to-cyan-500/15 pointer-events-none decorative" />
      
      {/* Animated sparkle particles removed for performance (Final Polish Phase 2) */}

      
      {/* Bottom golden line with enhanced glow */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-0.5 decorative"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.8), rgba(16,185,129,0.6), rgba(251,191,36,0.8), transparent)",
          boxShadow: "0 0 20px rgba(251,191,36,0.5)",
        }}
        animate={{
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      <div className="relative z-10 flex items-center justify-between">
        {/* Logo - LARGER SIZE */}
        <motion.div
          className="flex items-center cursor-pointer clickable"
          onClick={() => navigate("/home")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="relative"
            style={{ perspective: "1200px" }}
          >
            {/* Enhanced animated glow behind logo */}
            <motion.div
              className="absolute inset-0 -z-10 decorative"
              animate={{
                opacity: [0.6, 1, 0.6],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                background: "radial-gradient(ellipse at center, rgba(251,191,36,0.5) 0%, rgba(16,185,129,0.4) 40%, transparent 70%)",
                filter: "blur(25px)",
                transform: "scale(1.8)",
              }}
            />
            
            {/* Secondary glow ring */}
            <motion.div
              className="absolute inset-0 -z-10 decorative"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                rotate: [0, 360],
              }}
              transition={{
                opacity: { duration: 2, repeat: Infinity },
                rotate: { duration: 8, repeat: Infinity, ease: "linear" },
              }}
              style={{
                background: "conic-gradient(from 0deg, rgba(251,191,36,0.3), rgba(16,185,129,0.3), rgba(251,191,36,0.3))",
                filter: "blur(15px)",
                transform: "scale(2)",
                borderRadius: "50%",
              }}
            />
            
            {/* Logo image - INCREASED SIZE */}
            <motion.img 
              src={goluckyTextLogo} 
              alt="GoLucky" 
              className="h-16 w-auto object-contain relative z-10"
              animate={{
                rotateY: [0, 8, 0, -8, 0],
                rotateX: [0, 3, 0, -3, 0],
                scale: [1, 1.03, 1, 1.03, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                filter: "drop-shadow(0 0 20px rgba(251,191,36,0.9)) drop-shadow(0 0 40px rgba(16,185,129,0.7)) drop-shadow(0 0 60px rgba(251,191,36,0.5)) brightness(1.15) contrast(1.1)",
                transformStyle: "preserve-3d",
              }}
            />
          </motion.div>
        </motion.div>

        {/* Action Buttons - PREMIUM QUALITY */}
        <div className="flex items-center gap-2.5">
          {/* Daily Reward - Enhanced */}
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute -inset-1 rounded-2xl decorative"
              style={{
                background: "linear-gradient(135deg, rgba(251,191,36,0.4), rgba(249,115,22,0.4))",
                filter: "blur(6px)",
              }}
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <DailyRewardButton className="relative !py-2.5 !px-4 !text-xs !font-bold !rounded-xl !bg-gradient-to-br !from-amber-400 !via-amber-500 !to-orange-500 !border !border-amber-300/50 !shadow-lg !shadow-amber-500/30" />
          </motion.div>
          
          {/* Notification Center - Premium */}
          <motion.div
            className="relative"
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute -inset-1 rounded-2xl decorative"
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.4), rgba(34,197,94,0.4))",
                filter: "blur(6px)",
              }}
              animate={{
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            />
            <div className="relative bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/40 border border-emerald-300/40 overflow-hidden">
              {/* Inner shine effect */}
              <motion.div
                className="absolute inset-0 decorative"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)",
                }}
              />
              <NotificationCenter />
            </div>
          </motion.div>

          {/* Install App Button - Premium */}
          {!isInstalled && (
            <motion.button
              onClick={handleInstallClick}
              aria-label="Install GoLucky App"
              className="relative w-11 h-11 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-xl shadow-amber-500/40 border border-amber-300/50 overflow-hidden clickable"
              whileHover={{ scale: 1.1, y: -2, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Inner shine effect */}
              <motion.div
                className="absolute inset-0 decorative"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)",
                }}
              />
              
              {/* Animated ring */}
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-white/30 decorative"
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              <Download size={20} className="text-white relative z-10 drop-shadow-lg" strokeWidth={2.5} />
              
              {/* Premium NEW badge */}
              <motion.span
                className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 text-white text-[7px] font-black rounded-full shadow-lg border border-rose-400/50"
                animate={{
                  scale: [1, 1.15, 1],
                  boxShadow: [
                    "0 0 10px rgba(244,63,94,0.5)",
                    "0 0 20px rgba(244,63,94,0.8)",
                    "0 0 10px rgba(244,63,94,0.5)",
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                NEW
              </motion.span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default PremiumHeader;
