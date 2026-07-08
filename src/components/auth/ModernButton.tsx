import { motion } from "framer-motion";
import { ReactNode, forwardRef } from "react";
import { Loader2, Sparkles } from "lucide-react";

interface ModernButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "outline" | "demo";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const ModernButton = forwardRef<HTMLButtonElement, ModernButtonProps>(({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  loading,
  className = "",
}, ref) => {
  const variants = {
    primary: {
      bg: "from-orange-500 via-amber-500 to-yellow-500",
      shadow: "shadow-orange-500/40",
      glow: "rgba(251,146,60,0.4)",
      hoverGlow: "rgba(251,146,60,0.6)",
    },
    secondary: {
      bg: "from-purple-600 via-violet-500 to-indigo-600",
      shadow: "shadow-purple-500/40",
      glow: "rgba(168,85,247,0.4)",
      hoverGlow: "rgba(168,85,247,0.6)",
    },
    outline: {
      bg: "",
      shadow: "",
      glow: "rgba(255,255,255,0.1)",
      hoverGlow: "rgba(255,255,255,0.2)",
    },
    demo: {
      bg: "from-emerald-500 via-green-500 to-teal-500",
      shadow: "shadow-emerald-500/40",
      glow: "rgba(16,185,129,0.4)",
      hoverGlow: "rgba(16,185,129,0.6)",
    },
  };

  const style = variants[variant];
  const isGradient = variant !== "outline";

  return (
    <motion.button
      // @ts-ignore - motion.button ref typing issue
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative w-full h-14 rounded-2xl font-bold text-lg overflow-hidden
        disabled:opacity-50 disabled:cursor-not-allowed group
        ${variant === "outline" ? "border-2 border-white/20 bg-white/5" : ""}
        ${className}
      `}
      whileHover={!disabled ? { scale: 1.02, y: -3 } : {}}
      whileTap={!disabled ? { scale: 0.98, y: 0 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isGradient && (
        <div className={`absolute inset-0 bg-gradient-to-r ${style.bg}`} />
      )}

      {isGradient && (
        <div 
          className="absolute inset-x-0 top-0 h-1/2 opacity-30"
          style={{
            background: "linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)",
          }}
        />
      )}

      <motion.div
        className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${style.hoverGlow}, transparent 70%)`,
          filter: "blur(15px)",
        }}
      />

      {isGradient && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut",
          }}
        >
          <div 
            className="w-1/2 h-full"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
            }}
          />
        </motion.div>
      )}

      <motion.div
        className="absolute top-1 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
        animate={{ rotate: [0, 15, -15, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <Sparkles size={14} className="text-white/60" />
      </motion.div>

      <span className={`relative z-10 flex items-center justify-center gap-3 ${
        variant === "outline" ? "text-white" : "text-white"
      }`}>
        {loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 size={22} />
            </motion.div>
            <span>Processing...</span>
          </>
        ) : (
          children
        )}
      </span>

      {isGradient && (
        <div 
          className="absolute inset-x-0 bottom-0 h-1 opacity-30"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)",
          }}
        />
      )}

      <div 
        className={`absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300 ${
          variant === "outline" 
            ? "group-hover:border-white/40" 
            : ""
        }`}
        style={{
          boxShadow: isGradient 
            ? `0 10px 40px -10px ${style.glow}, inset 0 1px 0 rgba(255,255,255,0.2)` 
            : "none",
        }}
      />
    </motion.button>
  );
});

ModernButton.displayName = "ModernButton";

export default ModernButton;
