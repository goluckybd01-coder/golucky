import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'square' | 'triangle' | 'circle';
}

interface CrashDebrisParticlesProps {
  show: boolean;
  originX?: number;
  originY?: number;
}

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#f59e0b', // amber
  '#dc2626', // darker red
  '#fbbf24', // golden
  '#7c3aed', // purple for variety
];

const SHAPES: Array<'square' | 'triangle' | 'circle'> = ['square', 'triangle', 'circle'];

export function CrashDebrisParticles({ show, originX = 50, originY = 40 }: CrashDebrisParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (show) {
      // Generate particles
      const newParticles: Particle[] = [];
      const particleCount = 30;

      for (let i = 0; i < particleCount; i++) {
        // Distribute angles evenly with some randomness
        const baseAngle = (360 / particleCount) * i;
        const angle = baseAngle + (Math.random() - 0.5) * 40;
        
        newParticles.push({
          id: i,
          x: originX,
          y: originY,
          angle: angle * (Math.PI / 180),
          speed: 15 + Math.random() * 25, // Random speed
          size: 4 + Math.random() * 10, // Random size
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 720, // Random rotation
          opacity: 1,
          shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        });
      }

      setParticles(newParticles);

      // Clear particles after animation
      const timeout = setTimeout(() => {
        setParticles([]);
      }, 1500);

      return () => clearTimeout(timeout);
    } else {
      setParticles([]);
    }
  }, [show, originX, originY]);

  if (!show || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
      {particles.map((particle) => (
        <DebrisParticle key={particle.id} particle={particle} />
      ))}
    </div>
  );
}

function DebrisParticle({ particle }: { particle: Particle }) {
  const [style, setStyle] = useState({
    left: `${particle.x}%`,
    top: `${particle.y}%`,
    transform: `rotate(${particle.rotation}deg) scale(1)`,
    opacity: 1,
  });

  useEffect(() => {
    // Animate outward
    const endX = particle.x + Math.cos(particle.angle) * particle.speed;
    const endY = particle.y + Math.sin(particle.angle) * particle.speed + 20; // Add gravity
    const endRotation = particle.rotation + particle.rotationSpeed;

    // Small delay to trigger animation
    requestAnimationFrame(() => {
      setStyle({
        left: `${endX}%`,
        top: `${endY}%`,
        transform: `rotate(${endRotation}deg) scale(0.2)`,
        opacity: 0,
      });
    });
  }, [particle]);

  const shapeStyles = {
    square: 'rounded-sm',
    circle: 'rounded-full',
    triangle: 'clip-path-triangle',
  };

  return (
    <div
      className={`absolute transition-all duration-1000 ease-out ${shapeStyles[particle.shape]}`}
      style={{
        ...style,
        width: particle.size,
        height: particle.size,
        backgroundColor: particle.color,
        boxShadow: `0 0 ${particle.size / 2}px ${particle.color}`,
        clipPath: particle.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined,
      }}
    />
  );
}

export default CrashDebrisParticles;
