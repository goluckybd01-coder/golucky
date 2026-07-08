import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getWelcomeBannerConfig } from "@/lib/bannerConfig";
// Auth helper functions (moved inline to remove legacy dependency)
const FIRST_LOGIN_KEY = "golucky_first_login";
const isFirstLogin = (): boolean => localStorage.getItem(FIRST_LOGIN_KEY) === "true";
const completeFirstLogin = (): void => localStorage.removeItem(FIRST_LOGIN_KEY);
import goluckyLogo from "@/assets/golucky-logo.png";
import Seo from "@/components/seo/Seo";

const Welcome = () => {
  const navigate = useNavigate();
  const [welcomeConfig] = useState(() => getWelcomeBannerConfig());

  useEffect(() => {
    // If welcome screen is disabled or not first login, redirect immediately
    if (!welcomeConfig.enabled || !isFirstLogin()) {
      completeFirstLogin();
      navigate("/home", { replace: true });
      return;
    }

    // Auto-redirect after configured duration
    const timer = setTimeout(() => {
      completeFirstLogin();
      navigate("/home", { replace: true });
    }, welcomeConfig.durationSeconds * 1000);

    return () => clearTimeout(timer);
  }, [navigate, welcomeConfig]);

  const handleTap = () => {
    completeFirstLogin();
    navigate("/home", { replace: true });
  };

  return (
    <motion.div 
      className="min-h-screen bg-black flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
      onClick={handleTap}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Seo
        title="Welcome to GoLucky — Premium Lottery & Casino Gaming"
        description="Welcome to GoLucky, Bangladesh's premium destination for Win Go, K3, 5D, TRX Win, Aviator, Crash and Mines. Play, win, and enjoy daily rewards."
        path="/welcome"
      />
      <h1 className="sr-only">
        Welcome to GoLucky — your premium lottery and casino gaming hub
      </h1>
      <p className="sr-only">
        GoLucky is Bangladesh's premier lottery and casino platform offering Win Go, K3, 5D, TRX Win, Aviator, Crash, Mines and trusted BDT deposits and withdrawals.
      </p>

      {/* Animated background gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(34,197,94,0.15) 0%, rgba(0,0,0,1) 70%)",
        }}
      />
      
      {/* Golden particle effect removed for performance (Final Polish Phase 2) */}


      {/* Rotating golden ring */}
      <motion.div
        className="absolute w-80 h-80 rounded-full"
        style={{
          border: "2px solid rgba(251,191,36,0.3)",
          boxShadow: "0 0 60px rgba(251,191,36,0.2)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* Main Logo */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.8, 
          type: "spring",
          stiffness: 100,
        }}
      >
        <motion.div
          className="relative"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Glow effect behind logo */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(251,191,36,0.5) 0%, transparent 70%)",
              filter: "blur(40px)",
              transform: "scale(1.5)",
            }}
            animate={{
              scale: [1.5, 1.8, 1.5],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
          
          <img
            src={goluckyLogo}
            alt="GoLucky Logo"
            className="w-64 h-64 object-contain relative z-10"
            style={{
              filter: "drop-shadow(0 0 40px rgba(251,191,36,0.6))",
            }}
          />

        </motion.div>
      </motion.div>

      {/* Tagline */}
      <motion.p 
        className="text-xl font-bold mt-8 relative z-10"
        style={{
          background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%)",
          backgroundSize: "200% 100%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "0 0 30px rgba(251,191,36,0.5)",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ 
          delay: 0.5, 
          duration: 3,
          repeat: Infinity,
        }}
      >
        🎰 Play. Invest. Earn. 🚀 🎰
      </motion.p>

      {/* Tap to continue hint */}
      <motion.p 
        className="text-amber-400/50 text-sm mt-8 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      >
        Tap anywhere to continue
      </motion.p>
    </motion.div>
  );
};

export default Welcome;
