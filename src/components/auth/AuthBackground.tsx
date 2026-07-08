import { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";

// Golden particle
const GoldenParticle = memo(
  ({ delay, left, top, size }: { delay: number; left: string; top: string; size: number }) => (
    <motion.div
      className="absolute rounded-full"
      style={{
        left,
        top,
        width: size,
        height: size,
        background:
          "radial-gradient(circle, rgba(251,191,36,0.9) 0%, rgba(249,115,22,0.5) 50%, transparent 100%)",
        boxShadow: `0 0 ${size * 2}px rgba(251,191,36,0.4)`,
        willChange: "transform, opacity",
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.2, 0.5], y: [0, -80, -160] }}
      transition={{ duration: 4 + Math.random() * 2, delay, repeat: Infinity, ease: "easeOut" }}
    />
  )
);
GoldenParticle.displayName = "GoldenParticle";

// Emerald sparkle
const EmeraldSparkle = memo(
  ({ delay, left, top }: { delay: number; left: string; top: string }) => (
    <motion.div
      className="absolute"
      style={{ left, top, willChange: "transform, opacity" }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], rotate: [0, 180, 360] }}
      transition={{ duration: 2.5, delay, repeat: Infinity }}
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{
          background: "radial-gradient(circle, #22c55e 0%, transparent 70%)",
          boxShadow: "0 0 15px 3px rgba(34,197,94,0.6)",
        }}
      />
    </motion.div>
  )
);
EmeraldSparkle.displayName = "EmeraldSparkle";

// Diagonal green lines SVG layer
const DiagonalLines = memo(() => {
  const lines = Array.from({ length: 14 });
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {lines.map((_, i) => {
        const offset = (i / lines.length) * 200 - 50;
        return (
          <line
            key={i}
            x1={offset}
            y1={0}
            x2={offset + 60}
            y2={100}
            stroke="#22c55e"
            strokeWidth="0.15"
          />
        );
      })}
    </svg>
  );
});
DiagonalLines.displayName = "DiagonalLines";

// Dashed horizontal lines
const DashedLines = memo(() => (
  <div className="absolute inset-0 pointer-events-none">
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="absolute left-0 right-0 h-px"
        style={{
          top: `${(i + 1) * 12}%`,
          backgroundImage:
            "repeating-linear-gradient(to right, rgba(34,197,94,0.18) 0 8px, transparent 8px 18px)",
          opacity: 0.4,
        }}
      />
    ))}
  </div>
));
DashedLines.displayName = "DashedLines";

const AuthBackground = () => {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; delay: number }>
  >([]);
  const [sparkles, setSparkles] = useState<
    Array<{ id: number; x: number; y: number; delay: number }>
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: 60 + Math.random() * 40,
        size: Math.random() * 4 + 2,
        delay: Math.random() * 5,
      }))
    );
    setSparkles(
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 4,
      }))
    );
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[#0a0a0a]" />

      {/* Emerald glow */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(34,197,94,0.35) 0%, transparent 70%)",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          filter: "blur(80px)",
          willChange: "transform, opacity",
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Golden glow */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.5) 0%, rgba(249,115,22,0.2) 40%, transparent 70%)",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          filter: "blur(60px)",
          willChange: "transform, opacity",
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Diagonal lines + dashed horizontals (under particles) */}
      <DiagonalLines />
      <DashedLines />

      {/* Scan line */}
      <motion.div
        className="absolute left-0 right-0 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(34,197,94,0.5), rgba(251,191,36,0.4), rgba(34,197,94,0.5), transparent)",
          boxShadow: "0 0 18px rgba(34,197,94,0.4)",
          willChange: "transform, top",
        }}
        initial={{ top: "0%" }}
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
      />

      {/* Particles removed for performance (Final Polish Phase 2) */}


      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      {/* Bottom golden line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(251,191,36,0.6), rgba(34,197,94,0.4), rgba(251,191,36,0.6), transparent)",
          willChange: "opacity",
        }}
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </div>
  );
};

export default memo(AuthBackground);
