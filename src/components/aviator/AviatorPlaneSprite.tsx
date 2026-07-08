import { motion, useReducedMotion } from "framer-motion";

import type { RoundPhase } from "@/pages/games/AviatorGame";

interface AviatorPlaneSpriteProps {
  phase: RoundPhase;
  multiplier: number;
  xPercent: number;
  yPercent: number;
  angleDeg: number;
}

export function AviatorPlaneSprite({
  phase,
  multiplier,
  xPercent,
  yPercent,
  angleDeg,
}: AviatorPlaneSpriteProps) {
  const reduceMotion = useReducedMotion();
  const isCrashed = phase === "CRASHED";

  const crashAnimate = reduceMotion
    ? { opacity: 0 }
    : {
        x: ["-50%", "-45%", "-55%", "-40%"],
        y: ["-50%", "-95%", "-65%", "-120%"],
        opacity: [1, 1, 0.8, 0],
        scale: [1, 1.06, 1.02, 0.92],
        filter: [
          "drop-shadow(0 0 12px hsl(123 46% 34% / 0.9)) drop-shadow(0 0 24px hsl(45 100% 55% / 0.6))",
          "drop-shadow(0 0 18px hsl(123 50% 42% / 1)) drop-shadow(0 0 36px hsl(45 100% 60% / 0.8))",
          "drop-shadow(0 0 14px hsl(123 46% 34% / 0.7)) drop-shadow(0 0 28px hsl(45 100% 55% / 0.5))",
          "drop-shadow(0 0 8px hsl(123 46% 34% / 0.3)) drop-shadow(0 0 16px hsl(45 100% 55% / 0.2))",
        ],
      };

  const crashTransition = reduceMotion
    ? { duration: 0.35, ease: "easeOut" as const }
    : { duration: 0.9, times: [0, 0.35, 0.65, 1], ease: "easeOut" as const };

  return (
    <motion.div
      className="absolute z-50 pointer-events-none"
      style={{
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        width: "clamp(68px, 9vw, 92px)",
        height: "clamp(68px, 9vw, 92px)",
        transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
        transformOrigin: "center",
        filter: !isCrashed 
          ? "drop-shadow(0 0 12px hsl(123 46% 34% / 0.8)) drop-shadow(0 0 24px hsl(45 100% 55% / 0.5))" 
          : undefined,
      }}
      animate={isCrashed ? crashAnimate : { opacity: 1 }}
      transition={isCrashed ? crashTransition : { duration: 0.15 }}
    >
      <div className={`planeSprite ${multiplier >= 10 ? "glow-golden" : multiplier >= 5 ? "glow-intense" : ""}`} style={{ width: "clamp(68px, 9vw, 92px)", height: "clamp(34px, 4.6vw, 46px)" }}>
        <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="planeBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "hsl(123 50% 42%)", stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: "hsl(123 46% 34%)", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "hsl(123 55% 26%)", stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="planeStripeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: "hsl(45 100% 60%)", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "hsl(45 100% 50%)", stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="propellerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "hsl(45 100% 60%)", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "hsl(45 100% 50%)", stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <g>
            <path d="M20 58c0-6 5-11 11-11h46l38-18c6-3 13-3 19 0l26 14h17c6 0 11 4 13 10l3 9c2 6-2 12-8 14l-20 6 10 13c3 4 2 9-2 12l-5 4c-4 3-9 2-12-2l-18-21-28 6H31c-6 0-11-5-11-11V58z" fill="url(#planeBodyGradient)" />
            <path d="M88 34l-18 8-10-16 10-4c4-2 9 0 11 4l7 8z" fill="url(#planeBodyGradient)" />
            <path d="M44 52h44l32-15c4-2 8-2 12 0l18 10" fill="none" stroke="url(#planeStripeGradient)" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
          </g>
          <circle cx="178" cy="48" r="14" fill="none" stroke="url(#propellerGradient)" strokeWidth="7" />
          <g className={`propeller-group-new ${multiplier >= 10 ? "spin-ultra" : multiplier >= 5 ? "spin-fast" : ""}`}>
            <path d="M178 32v32M162 48h32" stroke="url(#propellerGradient)" strokeWidth="5" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    </motion.div>
  );
}

export default AviatorPlaneSprite;
