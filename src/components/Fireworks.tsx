import { useEffect, useState, useCallback, useMemo } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  trail: { x: number; y: number }[];
  shape: "circle" | "star" | "heart" | "diamond";
}

type ExplosionShape = "circle" | "star" | "heart" | "ring" | "spiral" | "burst";

interface Firework {
  id: number;
  x: number;
  y: number;
  targetY: number;
  color: string;
  exploded: boolean;
  particles: Particle[];
  explosionShape: ExplosionShape;
}

interface FireworksProps {
  active: boolean;
  duration?: number;
}

const COLORS = [
  "#ff0000", "#ff6600", "#ffcc00", "#00ff00", "#00ccff", 
  "#0066ff", "#9900ff", "#ff00ff", "#ff3366", "#ffff00",
  "#ff1493", "#00ff7f", "#ffd700", "#ff4500"
];

const EXPLOSION_SHAPES: ExplosionShape[] = ["circle", "star", "heart", "ring", "spiral", "burst"];
const PARTICLE_SHAPES: ("circle" | "star" | "heart" | "diamond")[] = ["circle", "star", "heart", "diamond"];

const Fireworks = ({ active, duration = 4000 }: FireworksProps) => {
  const [fireworks, setFireworks] = useState<Firework[]>([]);
  const [isActive, setIsActive] = useState(false);

  // Generate heart shape points
  const getHeartPoints = useCallback((centerX: number, centerY: number, scale: number): { x: number; y: number; angle: number }[] => {
    const points: { x: number; y: number; angle: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const t = (i / 30) * Math.PI * 2;
      // Heart parametric equation
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      const angle = Math.atan2(y, x);
      points.push({
        x: centerX + x * scale * 0.15,
        y: centerY + y * scale * 0.15,
        angle
      });
    }
    return points;
  }, []);

  // Generate star shape points
  const getStarPoints = useCallback((centerX: number, centerY: number, scale: number): { x: number; y: number; angle: number }[] => {
    const points: { x: number; y: number; angle: number }[] = [];
    const spikes = 5;
    const outerRadius = scale * 3;
    const innerRadius = scale * 1.2;
    
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        angle
      });
    }
    // Add intermediate points
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const radius = outerRadius * (0.6 + Math.random() * 0.4);
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        angle
      });
    }
    return points;
  }, []);

  // Generate ring shape points
  const getRingPoints = useCallback((centerX: number, centerY: number, scale: number): { x: number; y: number; angle: number }[] => {
    const points: { x: number; y: number; angle: number }[] = [];
    const radius = scale * 2.5;
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        angle
      });
    }
    return points;
  }, []);

  // Generate spiral shape points
  const getSpiralPoints = useCallback((centerX: number, centerY: number, scale: number): { x: number; y: number; angle: number }[] => {
    const points: { x: number; y: number; angle: number }[] = [];
    for (let i = 0; i < 40; i++) {
      const angle = (i / 8) * Math.PI;
      const radius = (i / 40) * scale * 4;
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        angle
      });
    }
    return points;
  }, []);

  const createParticles = useCallback((x: number, y: number, color: string, explosionShape: ExplosionShape): Particle[] => {
    const particles: Particle[] = [];
    const scale = 1;
    
    let targetPoints: { x: number; y: number; angle: number }[] = [];
    
    switch (explosionShape) {
      case "heart":
        targetPoints = getHeartPoints(x, y, scale);
        break;
      case "star":
        targetPoints = getStarPoints(x, y, scale);
        break;
      case "ring":
        targetPoints = getRingPoints(x, y, scale);
        break;
      case "spiral":
        targetPoints = getSpiralPoints(x, y, scale);
        break;
      case "burst":
        // Double burst - inner and outer
        for (let layer = 0; layer < 2; layer++) {
          const count = layer === 0 ? 20 : 30;
          for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (layer * Math.PI / count);
            targetPoints.push({ x, y, angle });
          }
        }
        break;
      default: // circle
        const particleCount = 35 + Math.random() * 15;
        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.2;
          targetPoints.push({ x, y, angle });
        }
    }
    
    targetPoints.forEach((point, i) => {
      let vx: number, vy: number;
      
      if (explosionShape === "heart" || explosionShape === "star" || explosionShape === "ring") {
        const dx = point.x - x;
        const dy = point.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = 2 + Math.random() * 2;
        vx = (dx / dist) * speed;
        vy = (dy / dist) * speed;
      } else if (explosionShape === "spiral") {
        const angle = point.angle + Math.PI / 2;
        const speed = 1.5 + Math.random() * 2;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
      } else {
        const angle = point.angle;
        const speed = 2 + Math.random() * 4;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
      }
      
      let particleShape: "circle" | "star" | "heart" | "diamond" = "circle";
      if (explosionShape === "heart") {
        particleShape = Math.random() > 0.5 ? "heart" : "circle";
      } else if (explosionShape === "star") {
        particleShape = Math.random() > 0.5 ? "star" : "diamond";
      } else {
        particleShape = PARTICLE_SHAPES[Math.floor(Math.random() * PARTICLE_SHAPES.length)];
      }
      
      particles.push({
        id: i,
        x,
        y,
        vx,
        vy,
        color: Math.random() > 0.25 ? color : COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 2 + Math.random() * 3,
        life: 1,
        maxLife: 50 + Math.random() * 40,
        trail: [],
        shape: particleShape,
      });
    });
    
    if (explosionShape === "heart" || explosionShape === "star") {
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        particles.push({
          id: particles.length,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: "#ffffff",
          size: 1 + Math.random() * 2,
          life: 1,
          maxLife: 30 + Math.random() * 20,
          trail: [],
          shape: "circle",
        });
      }
    }
    
    return particles;
  }, [getHeartPoints, getStarPoints, getRingPoints, getSpiralPoints]);

  const launchFirework = useCallback(() => {
    const id = Date.now() + Math.random();
    const x = 15 + Math.random() * 70;
    const explosionShape = EXPLOSION_SHAPES[Math.floor(Math.random() * EXPLOSION_SHAPES.length)];
    
    const firework: Firework = {
      id,
      x,
      y: 100,
      targetY: 12 + Math.random() * 28,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      exploded: false,
      particles: [],
      explosionShape,
    };
    setFireworks(prev => [...prev, firework]);
  }, []);

  useEffect(() => {
    if (!active) {
      setIsActive(false);
      setFireworks([]);
      return;
    }

    setIsActive(true);
    
    setTimeout(() => launchFirework(), 0);
    setTimeout(() => launchFirework(), 150);
    setTimeout(() => launchFirework(), 300);
    setTimeout(() => launchFirework(), 500);

    const launchInterval = setInterval(() => {
      if (Math.random() > 0.25) launchFirework();
    }, 350);

    const stopTimer = setTimeout(() => {
      setIsActive(false);
      clearInterval(launchInterval);
    }, duration);

    return () => {
      clearInterval(launchInterval);
      clearTimeout(stopTimer);
    };
  }, [active, duration, launchFirework]);

  useEffect(() => {
    if (!isActive && fireworks.length === 0) return;

    const animationFrame = requestAnimationFrame(() => {
      setFireworks(prev => {
        return prev.map(fw => {
          if (!fw.exploded) {
            const newY = fw.y - 2.8;
            if (newY <= fw.targetY) {
              return {
                ...fw,
                y: newY,
                exploded: true,
                particles: createParticles(fw.x, newY, fw.color, fw.explosionShape),
              };
            }
            return { ...fw, y: newY };
          } else {
            const gravityMultiplier = fw.explosionShape === "ring" ? 0.04 : 0.07;
            const updatedParticles = fw.particles
              .map(p => ({
                ...p,
                x: p.x + p.vx,
                y: p.y + p.vy,
                vy: p.vy + gravityMultiplier,
                vx: p.vx * 0.98,
                life: p.life - (1 / p.maxLife),
                size: p.size * 0.985,
                trail: [...p.trail.slice(-5), { x: p.x, y: p.y }],
              }))
              .filter(p => p.life > 0);

            return { ...fw, particles: updatedParticles };
          }
        }).filter(fw => !fw.exploded || fw.particles.length > 0);
      });
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [fireworks, isActive, createParticles]);

  const renderParticle = useCallback((p: Particle, fw: Firework) => {
    const baseSize = p.size * 0.5;
    
    switch (p.shape) {
      case "heart":
        return (
          <path
            d={`M ${p.x} ${p.y + baseSize * 0.3} 
                C ${p.x - baseSize} ${p.y - baseSize * 0.5}, 
                  ${p.x - baseSize * 0.5} ${p.y - baseSize}, 
                  ${p.x} ${p.y - baseSize * 0.3}
                C ${p.x + baseSize * 0.5} ${p.y - baseSize}, 
                  ${p.x + baseSize} ${p.y - baseSize * 0.5}, 
                  ${p.x} ${p.y + baseSize * 0.3} Z`}
            fill={p.color}
            opacity={p.life}
            filter="url(#glow)"
          />
        );
      case "star":
        const starPoints = [];
        for (let i = 0; i < 5; i++) {
          const outerAngle = (i * 72 - 90) * (Math.PI / 180);
          const innerAngle = ((i * 72) + 36 - 90) * (Math.PI / 180);
          starPoints.push(`${p.x + Math.cos(outerAngle) * baseSize},${p.y + Math.sin(outerAngle) * baseSize}`);
          starPoints.push(`${p.x + Math.cos(innerAngle) * baseSize * 0.4},${p.y + Math.sin(innerAngle) * baseSize * 0.4}`);
        }
        return (
          <polygon
            points={starPoints.join(' ')}
            fill={p.color}
            opacity={p.life}
            filter="url(#glow)"
          />
        );
      case "diamond":
        return (
          <polygon
            points={`${p.x},${p.y - baseSize} ${p.x + baseSize * 0.6},${p.y} ${p.x},${p.y + baseSize} ${p.x - baseSize * 0.6},${p.y}`}
            fill={p.color}
            opacity={p.life}
            filter="url(#glow)"
          />
        );
      default:
        return (
          <circle
            cx={p.x}
            cy={p.y}
            r={baseSize * 0.8}
            fill={p.color}
            opacity={p.life}
            filter="url(#glow)"
          />
        );
    }
  }, []);

  const sparkleEmojis = useMemo(() => {
    const emojis = ["✨", "⭐", "💫", "🌟", "💎", "❤️", "🎆", "🎇"];
    return [...Array(16)].map((_, i) => ({
      emoji: emojis[i % emojis.length],
      left: 5 + Math.random() * 90,
      top: 5 + Math.random() * 60,
      delay: i * 0.12,
    }));
  }, []);

  if (!active && fireworks.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[250] pointer-events-none overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="0.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="20%" stopColor="#ff8800" />
            <stop offset="40%" stopColor="#ffff00" />
            <stop offset="60%" stopColor="#00ff00" />
            <stop offset="80%" stopColor="#0088ff" />
            <stop offset="100%" stopColor="#ff00ff" />
          </linearGradient>
        </defs>

        {fireworks.map(fw => (
          <g key={fw.id}>
            {!fw.exploded && (
              <>
                <circle cx={fw.x} cy={fw.y} r="1" fill={fw.color} filter="url(#glow)" />
                <line x1={fw.x} y1={fw.y} x2={fw.x} y2={Math.min(fw.y + 10, 100)} stroke={fw.color} strokeWidth="0.5" opacity="0.7" strokeLinecap="round" />
                {[...Array(3)].map((_, i) => (
                  <circle key={i} cx={fw.x + (Math.random() - 0.5) * 1} cy={fw.y + 2 + i * 2} r="0.3" fill={fw.color} opacity={0.5 - i * 0.15} />
                ))}
              </>
            )}

            {fw.exploded && fw.particles.map(p => (
              <g key={p.id}>
                {p.trail.length > 1 && (
                  <polyline points={p.trail.map(t => `${t.x},${t.y}`).join(' ')} fill="none" stroke={p.color} strokeWidth={p.size * 0.25} opacity={p.life * 0.5} strokeLinecap="round" />
                )}
                {renderParticle(p, fw)}
              </g>
            ))}
          </g>
        ))}
      </svg>

      {isActive && (
        <div className="absolute inset-0">
          {sparkleEmojis.map((sparkle, i) => (
            <div key={i} className="absolute animate-ping" style={{ left: `${sparkle.left}%`, top: `${sparkle.top}%`, animationDelay: `${sparkle.delay}s`, animationDuration: "1.8s" }}>
              <span className="text-xl drop-shadow-lg">{sparkle.emoji}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Fireworks;
