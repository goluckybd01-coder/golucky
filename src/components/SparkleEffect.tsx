import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

const gradientToSparkleColor: Record<string, string> = {
  'from-orange-400': 'rgba(251, 146, 60, 0.9)',
  'from-purple-500': 'rgba(168, 85, 247, 0.9)',
  'from-emerald-500': 'rgba(16, 185, 129, 0.9)',
  'from-amber-500': 'rgba(245, 158, 11, 0.9)',
  'from-blue-500': 'rgba(59, 130, 246, 0.9)',
  'from-sky-500': 'rgba(14, 165, 233, 0.9)',
  'from-red-500': 'rgba(239, 68, 68, 0.9)',
  'from-yellow-500': 'rgba(234, 179, 8, 0.9)',
  'from-indigo-500': 'rgba(99, 102, 241, 0.9)',
  'from-cyan-500': 'rgba(6, 182, 212, 0.9)',
  'from-fuchsia-500': 'rgba(217, 70, 239, 0.9)',
  'from-orange-500': 'rgba(249, 115, 22, 0.9)',
  'from-teal-500': 'rgba(20, 184, 166, 0.9)',
};

export const getSparkleColorFromGradient = (gradient: string): string => {
  for (const [key, color] of Object.entries(gradientToSparkleColor)) {
    if (gradient.includes(key)) {
      return color;
    }
  }
  return 'rgba(45, 212, 191, 0.9)';
};

interface SparkleEffectProps {
  color?: string;
}

const SparkleEffect: React.FC<SparkleEffectProps> = ({ 
  color = 'rgba(45, 212, 191, 0.9)' 
}) => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 50, y: 50 });

  const addSparkleAtMouse = useCallback(() => {
    const spread = 30;
    const offsetX = (Math.random() - 0.5) * spread;
    const offsetY = (Math.random() - 0.5) * spread;
    
    setSparkles(prev => [
      ...prev.slice(-15),
      {
        id: Date.now() + Math.random(),
        x: Math.max(0, Math.min(100, mousePos.current.x + offsetX)),
        y: Math.max(0, Math.min(100, mousePos.current.y + offsetY)),
        size: Math.random() * 8 + 4,
        delay: 0,
        duration: Math.random() * 0.6 + 0.4,
      }
    ]);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const parent = container.closest('.group');
    if (!parent) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mousePos.current = { x, y };
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => {
      setIsHovered(false);
      mousePos.current = { x: 50, y: 50 };
    };

    parent.addEventListener('mouseenter', handleMouseEnter);
    parent.addEventListener('mouseleave', handleMouseLeave);
    parent.addEventListener('mousemove', handleMouseMove as EventListener);

    return () => {
      parent.removeEventListener('mouseenter', handleMouseEnter);
      parent.removeEventListener('mouseleave', handleMouseLeave);
      parent.removeEventListener('mousemove', handleMouseMove as EventListener);
    };
  }, []);

  useEffect(() => {
    if (isHovered) {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => addSparkleAtMouse(), i * 50);
      }

      const interval = setInterval(() => {
        addSparkleAtMouse();
      }, 80);

      return () => clearInterval(interval);
    } else {
      setSparkles([]);
    }
  }, [isHovered, addSparkleAtMouse]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-visible z-10">
      <AnimatePresence>
        {sparkles.map((sparkle) => {
          const deltaX = (mousePos.current.x - sparkle.x) * 0.4;
          const deltaY = (mousePos.current.y - sparkle.y) * 0.4;
          
          return (
            <motion.div
              key={sparkle.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0.8, 0],
                scale: [0, 1.2, 1, 0],
                rotate: [0, 180],
                x: [0, deltaX * 0.3, deltaX * 0.7, deltaX],
                y: [0, -10 + deltaY * 0.3, -5 + deltaY * 0.7, deltaY]
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                duration: sparkle.duration + 0.3,
                delay: sparkle.delay,
                ease: [0.4, 0, 0.2, 1]
              }}
              className="absolute"
              style={{
                left: `${sparkle.x}%`,
                top: `${sparkle.y}%`,
                width: sparkle.size,
                height: sparkle.size,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-full h-full"
                style={{ filter: `drop-shadow(0 0 4px ${color})` }}
              >
                <path
                  d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"
                  fill={color}
                />
              </svg>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default SparkleEffect;
