import { memo } from "react";
import { motion } from "framer-motion";
import goluckyLogo from "@/assets/golucky-logo.png";

interface AnimatedLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  tagline?: string;
  subtitle?: string;
}

const AnimatedLogo = ({ size = "md", tagline = "Luck Starts Here", subtitle }: AnimatedLogoProps) => {
  const sizes = {
    sm: { img: "w-14 h-14", ring: 52 },
    md: { img: "w-20 h-20", ring: 72 },
    lg: { img: "w-24 h-24", ring: 88 },
    xl: { img: "w-28 h-28", ring: 104 },
  };
  const s = sizes[size];
  const R = s.ring;

  return (
    <motion.div
      className="flex flex-col items-center select-none"
      initial={{ opacity: 0, y: -16, scale: 0.88 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 120 }}
    >
      <div className="relative flex items-center justify-center" style={{ width: R + 32, height: R + 32 }}>
        <motion.div
          className="absolute rounded-full"
          style={{
            width: R + 32, height: R + 32,
            background: "radial-gradient(circle, rgba(251,191,36,0.45) 0%, rgba(249,115,22,0.2) 45%, transparent 70%)",
            filter: "blur(18px)",
          }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute rounded-full"
          style={{
            width: R + 10, height: R + 10,
            background: "conic-gradient(from 0deg, #fbbf24, #f97316, #22c55e, #fbbf24, #f97316, #fbbf24)",
            padding: 2,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-full h-full rounded-full bg-[#0f0f0f]" />
        </motion.div>

        <motion.div
          className="absolute rounded-full"
          style={{
            width: R + 20, height: R + 20,
            background: "conic-gradient(from 180deg, transparent 60%, rgba(251,191,36,0.6) 75%, transparent 90%)",
            padding: 1.5,
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        <motion.div
          className="absolute rounded-full flex items-center justify-center overflow-hidden"
          style={{
            width: R, height: R,
            background: "radial-gradient(circle at 35% 30%, #1a1a1a 0%, #050505 100%)",
            boxShadow: "0 0 40px rgba(251,191,36,0.35), inset 0 2px 0 rgba(255,255,255,0.12), inset 0 -2px 0 rgba(0,0,0,0.5)",
          }}
          whileHover={{ scale: 1.06 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.img
            src={goluckyLogo}
            alt="GoLucky"
            loading="eager"
            decoding="async"
            className={`${s.img} object-contain relative z-10`}
            style={{ filter: "drop-shadow(0 0 20px rgba(251,191,36,0.7)) drop-shadow(0 0 8px rgba(249,115,22,0.4))" }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: "linear-gradient(135deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)" }}
            animate={{ x: ["-160%", "220%"] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2.5 }}
          />
        </motion.div>

        <motion.div
          className="absolute inset-0"
          style={{ width: R + 32, height: R + 32 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          {[0, 90, 180, 270].map((deg, i) => (
            <motion.div
              key={deg}
              className="absolute rounded-full"
              style={{
                width: i % 2 === 0 ? 7 : 5,
                height: i % 2 === 0 ? 7 : 5,
                top: "50%", left: "50%",
                marginTop: i % 2 === 0 ? -3.5 : -2.5,
                marginLeft: i % 2 === 0 ? -3.5 : -2.5,
                background: i % 2 === 0
                  ? "radial-gradient(circle, #fbbf24 0%, rgba(251,191,36,0.3) 100%)"
                  : "radial-gradient(circle, #34d399 0%, rgba(52,211,153,0.3) 100%)",
                boxShadow: i % 2 === 0 ? "0 0 8px rgba(251,191,36,0.8)" : "0 0 8px rgba(52,211,153,0.8)",
                transform: `rotate(${deg}deg) translateY(-${(R / 2) + 14}px)`,
              }}
              animate={{ scale: [0.7, 1.3, 0.7], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }}
            />
          ))}
        </motion.div>

        {[
          { top: "4%", left: "18%", color: "#fbbf24" },
          { top: "8%", right: "14%", color: "#34d399" },
          { bottom: "6%", left: "14%", color: "#34d399" },
          { bottom: "4%", right: "18%", color: "#fbbf24" },
        ].map((pos, i) => (
          <motion.div
            key={i}
            className="absolute text-xs font-bold"
            style={{ ...pos, color: pos.color, textShadow: `0 0 8px ${pos.color}`, fontSize: 10 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], rotate: [0, 180, 360] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
          >
            ✦
          </motion.div>
        ))}
      </div>

      <motion.div
        className="text-center mt-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <p
          className="text-sm font-bold tracking-[0.2em] uppercase"
          style={{
            background: "linear-gradient(90deg, #f59e0b, #fcd34d, #f59e0b)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "none",
            filter: "drop-shadow(0 0 8px rgba(251,191,36,0.5))",
          }}
        >
          {tagline}
        </p>
        {subtitle && (
          <p className="text-amber-200/45 text-xs mt-0.5 tracking-wide">{subtitle}</p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default memo(AnimatedLogo);
