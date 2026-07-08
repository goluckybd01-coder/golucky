import { Headphones } from "lucide-react";
import { motion } from "framer-motion";
import goluckyTextLogo from "@/assets/golucky-text-logo-2.png";

const AuthHeader = () => {
  return (
    <div className="bg-gradient-to-r from-orange-400 to-orange-500">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-4">
        {/* Support icon */}
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
          <Headphones size={24} className="text-white" />
        </div>
        
        {/* Logo with 3D motion */}
        <motion.div 
          className="flex items-center relative"
          style={{ perspective: "1200px" }}
        >
          {/* Animated glow */}
          <motion.div
            className="absolute inset-0 -z-10"
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              background: "radial-gradient(ellipse at center, rgba(251,191,36,0.5) 0%, rgba(16,185,129,0.4) 50%, transparent 70%)",
              filter: "blur(25px)",
              transform: "scale(1.8)",
            }}
          />
          <motion.img
            src={goluckyTextLogo}
            alt="GoLucky"
            className="h-14 w-auto object-contain"
            animate={{
              rotateY: [0, 10, 0, -10, 0],
              rotateX: [0, 4, 0, -4, 0],
              scale: [1, 1.05, 1, 1.05, 1],
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
        
        {/* Language selector */}
        <div className="flex items-center gap-1 text-white text-sm font-medium">
          <img 
            src="https://flagcdn.com/w20/bd.png" 
            alt="BN" 
            className="w-6 h-4 rounded-sm object-cover"
          />
          <span>বাংলা</span>
        </div>
      </div>
    </div>
  );
};

export default AuthHeader;
