import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import goluckyLogo from "@/assets/golucky-logo.png";

interface PremiumLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  onClick?: () => void;
}

const PremiumLogo = ({ size = "md", showTagline = false, onClick }: PremiumLogoProps) => {
  const navigate = useNavigate();
  
  const sizeClasses = {
    sm: { logo: "h-10 w-10", container: "h-12 w-12" },
    md: { logo: "h-12 w-12", container: "h-14 w-14" },
    lg: { logo: "h-20 w-20", container: "h-24 w-24" },
    xl: { logo: "h-32 w-32", container: "h-36 w-36" },
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate("/home");
    }
  };

  return (
    <motion.div 
      className="relative flex flex-col items-center cursor-pointer group"
      onClick={handleClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Animated golden glow effect */}
      <motion.div 
        className="absolute inset-0 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: "radial-gradient(ellipse at center, rgba(251, 191, 36, 0.4) 0%, rgba(249, 115, 22, 0.2) 40%, transparent 70%)",
          filter: "blur(15px)",
        }}
        animate={{
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Rotating golden ring effect */}
      <motion.div
        className="absolute -inset-1 rounded-full opacity-40 group-hover:opacity-70"
        style={{
          background: "conic-gradient(from 0deg, transparent, rgba(251, 191, 36, 0.5), transparent, rgba(249, 115, 22, 0.5), transparent)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Logo Image Container */}
      <motion.div
        className={`relative ${sizeClasses[size].container} flex items-center justify-center`}
        animate={{
          y: [0, -2, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <motion.img 
          src={goluckyLogo} 
          alt="GoLucky"
          className={`${sizeClasses[size].logo} object-contain drop-shadow-2xl`}
          style={{
            filter: "drop-shadow(0 0 20px rgba(251, 191, 36, 0.5)) drop-shadow(0 4px 15px rgba(0,0,0,0.3))",
          }}
        />
        
        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)",
          }}
          animate={{
            x: ["-100%", "200%"],
          }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        />
      </motion.div>
      
      {showTagline && (
        <motion.p
          className="mt-2 text-[10px] text-amber-400/80 font-medium tracking-widest whitespace-nowrap uppercase"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            textShadow: "0 0 10px rgba(251, 191, 36, 0.5)",
          }}
        >
          Your Luck, Your Fortune
        </motion.p>
      )}
    </motion.div>
  );
};

export default PremiumLogo;
