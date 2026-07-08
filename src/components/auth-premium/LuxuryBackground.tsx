import { motion, useReducedMotion } from "framer-motion";
import { memo } from "react";

/**
 * Ambient casino background: aurora + floating chips/dice/coins + moving neon lines.
 * Pure CSS transforms via Framer Motion; gated by prefers-reduced-motion.
 * Fully decorative — pointer-events: none via global .decorative rule fallback.
 */
const FLOATERS = [
  { emoji: "🎴", top: "12%", left: "6%", size: 42, delay: 0 },
  { emoji: "🎲", top: "22%", left: "88%", size: 36, delay: 1.2 },
  { emoji: "🪙", top: "58%", left: "4%", size: 34, delay: 2.4 },
  { emoji: "♠️", top: "68%", left: "92%", size: 30, delay: 0.6 },
  { emoji: "💎", top: "82%", left: "12%", size: 32, delay: 1.8 },
  { emoji: "🎰", top: "8%", left: "48%", size: 30, delay: 3.0 },
  { emoji: "♦️", top: "44%", left: "94%", size: 28, delay: 2.1 },
  { emoji: "🪙", top: "38%", left: "10%", size: 30, delay: 3.6 },
];

const LuxuryBackground = () => {
  const reduce = useReducedMotion();

  return (
    <div
      className="luxe-bg-matte decorative"
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Aurora layers */}
      <div className="decorative luxe-aurora" style={aurora("40% 60%", "hsl(148 100% 45% / 0.35)", "-10%", "-10%")} />
      <div className="decorative luxe-aurora" style={{ ...aurora("50% 55%", "hsl(44 93% 63% / 0.28)", "60%", "-15%"), animationDelay: "3s" }} />
      <div className="decorative luxe-aurora" style={{ ...aurora("70% 50%", "hsl(152 100% 25% / 0.4)", "10%", "70%"), animationDelay: "6s" }} />

      {/* Neon horizon lines */}
      <svg
        className="decorative"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.35 }}
      >
        <defs>
          <linearGradient id="luxeLine1" x1="0" x2="1">
            <stop offset="0%" stopColor="hsl(148 100% 45%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(148 100% 55%)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(44 93% 63%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="luxeLine2" x1="0" x2="1">
            <stop offset="0%" stopColor="hsl(44 93% 63%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(44 93% 75%)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(148 100% 45%)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 220 Q 360 140 720 240 T 1440 200" stroke="url(#luxeLine1)" strokeWidth="1.5" fill="none" />
        <path d="M0 620 Q 360 700 720 580 T 1440 640" stroke="url(#luxeLine2)" strokeWidth="1.5" fill="none" />
        <path d="M0 420 Q 480 380 960 460 T 1440 400" stroke="url(#luxeLine1)" strokeWidth="1" fill="none" opacity="0.6" />
      </svg>

      {/* Soft particle grid */}
      <div
        className="decorative"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(hsl(148 100% 55% / 0.14) 1px, transparent 1px), radial-gradient(hsl(44 93% 63% / 0.1) 1px, transparent 1px)",
          backgroundSize: "48px 48px, 96px 96px",
          backgroundPosition: "0 0, 24px 24px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      {/* Floating casino icons removed for performance (Final Polish Phase 2) */}


      {/* Vignette */}
      <div
        className="decorative"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, hsl(var(--luxe-black) / 0.85) 100%)",
        }}
      />
    </div>
  );
};

const aurora = (size: string, color: string, top: string, left: string) => ({
  position: "absolute" as const,
  top,
  left,
  width: "60vw",
  height: "60vw",
  background: `radial-gradient(${size} at center, ${color}, transparent 70%)`,
  filter: "blur(40px)",
  pointerEvents: "none" as const,
});

export default memo(LuxuryBackground);
