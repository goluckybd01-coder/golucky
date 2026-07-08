import { useEffect, useState, useRef } from "react";

interface SmokeParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  createdAt: number;
}

interface RocketSmokeTrailProps {
  isActive: boolean;
  rocketX?: number;
  rocketY?: number;
}

export function RocketSmokeTrail({ isActive, rocketX = 50, rocketY = 50 }: RocketSmokeTrailProps) {
  const [particles, setParticles] = useState<SmokeParticle[]>([]);
  const particleIdRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        
        setParticles(prev => {
          const filtered = prev.filter(p => now - p.createdAt < 1500);
          const newParticles: SmokeParticle[] = [];
          for (let i = 0; i < 2; i++) {
            particleIdRef.current += 1;
            newParticles.push({
              id: particleIdRef.current,
              x: rocketX + (Math.random() - 0.5) * 4,
              y: rocketY + 5 + Math.random() * 3,
              size: 8 + Math.random() * 12,
              opacity: 0.6 + Math.random() * 0.3,
              createdAt: now,
            });
          }
          
          return [...filtered, ...newParticles];
        });
      }, 50);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setTimeout(() => setParticles([]), 1500);
    }
  }, [isActive, rocketX, rocketY]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((particle) => (
        <SmokeParticleElement key={particle.id} particle={particle} />
      ))}
    </div>
  );
}

function SmokeParticleElement({ particle }: { particle: SmokeParticle }) {
  const [style, setStyle] = useState({
    left: `${particle.x}%`,
    top: `${particle.y}%`,
    width: particle.size,
    height: particle.size,
    opacity: particle.opacity,
    transform: 'scale(1)',
  });

  useEffect(() => {
    requestAnimationFrame(() => {
      setStyle({
        left: `${particle.x - 3 - Math.random() * 4}%`,
        top: `${particle.y + 8 + Math.random() * 5}%`,
        width: particle.size * 2.5,
        height: particle.size * 2.5,
        opacity: 0,
        transform: 'scale(1.5)',
      });
    });
  }, [particle]);

  return (
    <div
      className="absolute rounded-full transition-all duration-1500 ease-out"
      style={{
        ...style,
        background: `radial-gradient(circle, rgba(200, 200, 200, ${style.opacity}) 0%, rgba(150, 150, 150, ${style.opacity * 0.5}) 40%, transparent 70%)`,
        filter: 'blur(3px)',
        transitionDuration: '1.5s',
      }}
    />
  );
}

export default RocketSmokeTrail;
