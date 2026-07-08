import { useEffect, useState, useRef } from "react";

interface FireParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  velocity: { x: number; y: number };
  lifetime: number;
  createdAt: number;
}

interface RocketEngineFireParticlesProps {
  isActive: boolean;
  intensity?: number;
}

const FIRE_COLORS = [
  '#ffffff',
  '#fef08a',
  '#fbbf24',
  '#f97316',
  '#ef4444',
  '#dc2626',
];

export function RocketEngineFireParticles({ 
  isActive, 
  intensity = 5 
}: RocketEngineFireParticlesProps) {
  const [particles, setParticles] = useState<FireParticle[]>([]);
  const particleIdRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      const spawnRate = Math.max(16, 50 - intensity * 4);
      
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        
        setParticles(prev => {
          const filtered = prev.filter(p => now - p.createdAt < p.lifetime);
          const particleCount = Math.floor(2 + intensity * 0.5);
          const newParticles: FireParticle[] = [];
          
          for (let i = 0; i < particleCount; i++) {
            particleIdRef.current += 1;
            const spawnX = 50 + (Math.random() - 0.5) * 3;
            const spawnY = 55 + Math.random() * 2;
            const angle = (Math.random() - 0.5) * 0.6 + Math.PI / 2;
            const speed = 2 + Math.random() * 3 + intensity * 0.3;
            
            newParticles.push({
              id: particleIdRef.current,
              x: spawnX,
              y: spawnY,
              size: 4 + Math.random() * 8 + intensity * 0.5,
              color: FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)],
              velocity: {
                x: Math.cos(angle) * speed * 0.3,
                y: Math.sin(angle) * speed,
              },
              lifetime: 300 + Math.random() * 400,
              createdAt: now,
            });
          }
          
          return [...filtered, ...newParticles];
        });
      }, spawnRate);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTimeout(() => setParticles([]), 500);
    }
  }, [isActive, intensity]);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <FireParticleElement key={particle.id} particle={particle} />
      ))}
    </div>
  );
}

function FireParticleElement({ particle }: { particle: FireParticle }) {
  const [style, setStyle] = useState({
    left: `${particle.x}%`,
    top: `${particle.y}%`,
    width: particle.size,
    height: particle.size,
    opacity: 1,
    transform: 'scale(1)',
  });

  useEffect(() => {
    const endX = particle.x + particle.velocity.x * 8;
    const endY = particle.y + particle.velocity.y * 8;

    requestAnimationFrame(() => {
      setStyle({
        left: `${endX}%`,
        top: `${endY}%`,
        width: particle.size * 0.2,
        height: particle.size * 0.2,
        opacity: 0,
        transform: 'scale(0.3)',
      });
    });
  }, [particle]);

  return (
    <div
      className="absolute rounded-full"
      style={{
        ...style,
        backgroundColor: particle.color,
        boxShadow: `0 0 ${particle.size}px ${particle.color}, 0 0 ${particle.size * 2}px ${particle.color}50`,
        filter: 'blur(1px)',
        transition: `all ${particle.lifetime}ms ease-out`,
      }}
    />
  );
}

export default RocketEngineFireParticles;
