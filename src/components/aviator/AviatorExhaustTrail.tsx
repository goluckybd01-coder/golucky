import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ExhaustParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
}

interface AviatorExhaustTrailProps {
  show: boolean;
  planeX: number;
  planeY: number;
  planeAngle: number;
  multiplier?: number;
}

const EXHAUST_COLORS_BASE = [
  'hsl(var(--aviator-exhaust-1) / 0.92)',
  'hsl(var(--aviator-exhaust-2) / 0.88)',
  'hsl(var(--aviator-exhaust-3) / 0.85)',
  'hsl(var(--aviator-exhaust-4) / 0.88)',
  'hsl(var(--aviator-exhaust-5) / 0.75)',
];

const EXHAUST_COLORS_INTENSE = [
  'hsl(var(--aviator-exhaust-1) / 0.93)',
  'hsl(var(--aviator-curve-glow-mid) / 0.90)',
  'hsl(var(--aviator-exhaust-2) / 0.87)',
  'hsl(var(--aviator-curve-core) / 0.90)',
  'hsl(var(--aviator-exhaust-3) / 0.85)',
];

const EXHAUST_COLORS_GOLDEN = [
  'hsl(var(--aviator-exhaust-gold-1) / 0.96)',
  'hsl(var(--aviator-exhaust-gold-2) / 0.93)',
  'hsl(var(--aviator-speedline-ultra) / 0.90)',
  'hsl(var(--aviator-speedline-hi) / 0.93)',
  'hsl(var(--aviator-exhaust-gold-1) / 0.88)',
];

const SMOKE_COLORS = [
  'hsl(var(--aviator-exhaust-smoke-1) / 0.35)',
  'hsl(var(--aviator-exhaust-smoke-2) / 0.30)',
  'hsl(var(--aviator-exhaust-smoke-3) / 0.25)',
  'hsl(var(--aviator-exhaust-smoke-1) / 0.30)',
];

export function AviatorExhaustTrail({ show, planeX, planeY, planeAngle, multiplier = 1 }: AviatorExhaustTrailProps) {
  const [particles, setParticles] = useState<ExhaustParticle[]>([]);
  const particleIdRef = useRef(0);
  const lastEmitRef = useRef(0);
  const multiplierRef = useRef(multiplier);
  
  useEffect(() => {
    multiplierRef.current = multiplier;
  }, [multiplier]);

  const getExhaustColors = useCallback(() => {
    const m = multiplierRef.current;
    if (m >= 10) return EXHAUST_COLORS_GOLDEN;
    if (m >= 5) return EXHAUST_COLORS_INTENSE;
    return EXHAUST_COLORS_BASE;
  }, []);

  useEffect(() => {
    if (!show) {
      setParticles([]);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const m = multiplierRef.current;
      const emitInterval = m >= 10 ? 25 : m >= 5 ? 30 : 40;
      if (now - lastEmitRef.current < emitInterval) return;
      lastEmitRef.current = now;

      const angleRad = (planeAngle * Math.PI) / 180;
      const offsetDistance = 3;
      const offsetX = planeX - Math.cos(angleRad) * offsetDistance;
      const offsetY = planeY - Math.sin(angleRad) * offsetDistance;

      const exhaustColors = getExhaustColors();
      const newParticles: ExhaustParticle[] = [];
      const particleCount = m >= 10 ? 6 : m >= 5 ? 5 : 3;
      const sizeMultiplier = m >= 10 ? 1.6 : m >= 5 ? 1.3 : 1;
      const spread = m >= 10 ? 3.5 : m >= 5 ? 2.8 : 2;
      
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: particleIdRef.current++,
          x: offsetX + (Math.random() - 0.5) * spread,
          y: offsetY + (Math.random() - 0.5) * spread,
          size: (6 + Math.random() * 8) * sizeMultiplier,
          opacity: 0.85 + Math.random() * 0.15,
          color: exhaustColors[Math.floor(Math.random() * exhaustColors.length)],
        });
      }

      const smokeChance = m >= 10 ? 0.1 : m >= 5 ? 0.2 : 0.3;
      if (Math.random() > smokeChance) {
        const smokeSizeMultiplier = m >= 10 ? 1.5 : m >= 5 ? 1.25 : 1;
        newParticles.push({
          id: particleIdRef.current++,
          x: offsetX - Math.cos(angleRad) * 2.5 + (Math.random() - 0.5) * 2.5,
          y: offsetY - Math.sin(angleRad) * 2.5 + (Math.random() - 0.5) * 2.5,
          size: (10 + Math.random() * 14) * smokeSizeMultiplier,
          opacity: 0.35 + Math.random() * 0.2,
          color: SMOKE_COLORS[Math.floor(Math.random() * SMOKE_COLORS.length)],
        });
      }

      setParticles(prev => [...prev, ...newParticles].slice(-30));
    }, 30);

    return () => clearInterval(interval);
  }, [show, planeX, planeY, planeAngle, getExhaustColors]);

  useEffect(() => {
    if (!show) return;
    const cleanup = setInterval(() => {
      setParticles(prev => prev.filter((_, i) => i > prev.length - 25));
    }, 200);
    return () => clearInterval(cleanup);
  }, [show]);

  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              scale: 1,
              opacity: particle.opacity,
            }}
            animate={{ 
              left: `${particle.x - 2}%`,
              top: `${particle.y + 0.5}%`,
              scale: 0.3,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              background: particle.color,
              boxShadow: particle.color.includes('255, 1') 
                ? `0 0 ${particle.size}px ${particle.color}` 
                : 'none',
              filter: particle.color.includes('150, 150') ? 'blur(2px)' : 'blur(1px)',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default AviatorExhaustTrail;
