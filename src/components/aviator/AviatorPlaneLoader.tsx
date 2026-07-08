import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface AviatorPlaneLoaderProps {
  countdown: number;
}

const AviatorPlaneLoader = memo(({ countdown }: AviatorPlaneLoaderProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
      <div className="relative mb-5">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ width: "180px", height: "180px", background: "radial-gradient(circle at 50% 50%, hsl(var(--aviator-plane-solid) / 0.25), transparent 65%)", filter: "blur(0px)", opacity: 1 }} />
        <div className="relative w-36 h-36">
          <div className="absolute inset-0 rounded-full border-[5px] border-transparent" style={{ borderTopColor: "hsl(var(--aviator-plane-solid) / 0.95)", borderRightColor: "hsl(var(--aviator-plane-solid) / 0.25)", borderBottomColor: "hsl(var(--aviator-plane-solid) / 0.12)", borderLeftColor: "hsl(var(--aviator-plane-solid) / 0.45)", animation: "aviator-spin 1.05s linear infinite", filter: "drop-shadow(0 0 18px hsl(var(--aviator-plane-solid) / 0.35))" }} />
          <div className="absolute inset-2 rounded-full border-[4px] border-transparent" style={{ borderTopColor: "hsl(var(--aviator-plane-1) / 0.65)", borderRightColor: "hsl(var(--aviator-plane-1) / 0.18)", borderBottomColor: "hsl(var(--aviator-plane-1) / 0.35)", borderLeftColor: "hsl(var(--aviator-plane-1) / 0.10)", animation: "aviator-spin-rev 1.55s linear infinite" }} />
          <div className="absolute inset-5 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 35%, transparent 65%), radial-gradient(circle at 50% 60%, hsl(var(--aviator-plane-solid) / 0.24), transparent 70%)", boxShadow: "0 0 34px hsl(var(--aviator-plane-solid) / 0.45), inset 0 0 18px hsl(var(--aviator-plane-1) / 0.20)", animation: "aviator-pulse 1.7s ease-in-out infinite" }} />
          <motion.div className="absolute inset-0 flex items-center justify-center" animate={reduceMotion ? { opacity: 1 } : { y: [0, -2, 0, 2, 0], rotate: [0, -2, 0, 2, 0] }} transition={reduceMotion ? undefined : { duration: 1.4, repeat: Infinity, ease: "easeInOut" }}>
            <svg viewBox="0 0 100 100" className="w-[70px] h-[70px]" style={{ filter: "drop-shadow(0 0 12px hsl(var(--aviator-plane-solid) / 0.85)) drop-shadow(0 0 26px hsl(var(--aviator-plane-1) / 0.40))" }}>
              <g fill="hsl(var(--aviator-plane-solid))">
                <path d="M20 56c0-6 5-10 11-10h38l30-15c6-3 13-3 19 0l20 10h16c6 0 10 4 12 9l3 9c2 6-2 11-8 13l-18 5 8 11c3 4 2 8-2 11l-4 3c-4 3-9 2-11-2l-15-17-22 5H31c-6 0-11-4-11-10v-9z" />
                <path d="M78 36l-16 7-9-14 9-4c4-2 8 0 10 3l6 8z" opacity="0.95" />
                <path d="M38 50h34l24-12" fill="none" stroke="hsl(var(--aviator-plane-1) / 0.45)" strokeWidth="4" strokeLinecap="round" />
              </g>
            </svg>
          </motion.div>
        </div>
      </div>
      <div className="text-center">
        <motion.div className="text-[22px] font-extrabold tracking-[0.10em] text-white/90" style={{ textShadow: "0 0 12px hsl(var(--aviator-plane-solid) / 0.55)" }} animate={reduceMotion ? undefined : { opacity: [0.85, 1, 0.85] }} transition={reduceMotion ? undefined : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }}>
          WAITING FOR TAKEOFF<span className="inline-block" style={{ animation: "aviator-dots 1.1s steps(4, end) infinite" }}>...</span>
        </motion.div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <div className="rounded-xl px-4 py-2 text-4xl font-black tabular-nums text-white" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 18px 45px rgba(0,0,0,0.55), 0 0 26px hsl(var(--aviator-plane-solid) / 0.30)", textShadow: "0 0 18px rgba(255,255,255,0.25)" }}>
            {countdown}<span className="text-lg font-bold text-white/70">s</span>
          </div>
        </div>
      </div>
      <style>{`@keyframes aviator-spin { to { transform: rotate(360deg); } } @keyframes aviator-spin-rev { to { transform: rotate(-360deg); } } @keyframes aviator-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.88; } } @keyframes aviator-dots { 0% { clip-path: inset(0 100% 0 0); } 25% { clip-path: inset(0 66% 0 0); } 50% { clip-path: inset(0 33% 0 0); } 75%, 100% { clip-path: inset(0 0 0 0); } }`}</style>
    </div>
  );
});

AviatorPlaneLoader.displayName = "AviatorPlaneLoader";
export default AviatorPlaneLoader;
