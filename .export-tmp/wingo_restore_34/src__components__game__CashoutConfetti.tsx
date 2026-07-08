import { useEffect, useState, useMemo } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: "square" | "circle" | "strip" | "star" | "coin";
  opacity: number;
  delay: number;
}

interface CashoutConfettiProps {
  isActive: boolean;
  multiplier: number;
  originX?: number;
  originY?: number;
  duration?: number;
}

// Color palettes based on multiplier tiers
const TIER_COLORS = {
  low: ["#22c55e", "#4ade80", "#86efac", "#bbf7d0"], // Green
  medium: ["#3b82f6", "#60a5fa", "#93c5fd", "#22c55e", "#a855f7"], // Blue/Green/Purple
  high: ["#a855f7", "#c084fc", "#d8b4fe", "#f0abfc", "#ec4899"], // Purple/Pink
  epic: ["#f59e0b", "#fbbf24", "#fcd34d", "#fde68a", "#a855f7", "#ec4899"], // Gold/Purple/Pink
  legendary: ["#fbbf24", "#fcd34d", "#fef08a", "#ffffff", "#f59e0b", "#ef4444"], // Gold/White
};

const getTierFromMultiplier = (multiplier: number): keyof typeof TIER_COLORS => {
  if (multiplier >= 10) return "legendary";
  if (multiplier >= 5) return "epic";
  if (multiplier >= 3) return "high";
  if (multiplier >= 2) return "medium";
  return "low";
};

const getParticleCount = (multiplier: number): number => {
  if (multiplier >= 10) return 200;
  if (multiplier >= 5) return 150;
  if (multiplier >= 3) return 100;
  if (multiplier >= 2) return 70;
  return 40;
};

const CashoutConfetti = ({
  isActive,
  multiplier,
  originX = 50,
  originY = 50,
  duration = 3000,
}: CashoutConfettiProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [burstPhase, setBurstPhase] = useState(0);

  const tier = useMemo(() => getTierFromMultiplier(multiplier), [multiplier]);
  const colors = TIER_COLORS[tier];
  const particleCount = getParticleCount(multiplier);

  useEffect(() => {
    if (!isActive) return;

    setIsVisible(true);
    setBurstPhase(1);

    const newParticles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 6;
      const shapes: Particle["shape"][] = ["square", "circle", "strip", "star"];
      if (tier === "legendary" || tier === "epic") shapes.push("coin");
      
      newParticles.push({
        id: i,
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 6 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        opacity: 1,
        delay: Math.random() * 0.2,
      });
    }

    if (multiplier >= 3) {
      const ringCount = multiplier >= 10 ? 24 : multiplier >= 5 ? 16 : 12;
      for (let i = 0; i < ringCount; i++) {
        const angle = (Math.PI * 2 * i) / ringCount;
        newParticles.push({
          id: particleCount + i,
          x: originX,
          y: originY,
          vx: Math.cos(angle) * 8,
          vy: Math.sin(angle) * 8,
          size: multiplier >= 10 ? 12 : 8,
          color: "#ffffff",
          rotation: 0,
          rotationSpeed: 20,
          shape: "star",
          opacity: 1,
          delay: 0,
        });
      }
    }

    setParticles(newParticles);

    if (tier === "epic" || tier === "legendary") {
      setTimeout(() => setBurstPhase(2), 200);
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      setParticles([]);
      setBurstPhase(0);
    }, duration);

    return () => clearTimeout(timer);
  }, [isActive, multiplier, originX, originY, duration, particleCount, tier, colors]);

  if (!isVisible || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[110] overflow-hidden">
      <div
        className="absolute rounded-full animate-cashout-flash"
        style={{
          left: `${originX}%`,
          top: `${originY}%`,
          width: multiplier >= 5 ? 300 : 200,
          height: multiplier >= 5 ? 300 : 200,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, ${colors[0]}66 0%, transparent 70%)`,
        }}
      />

      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-cashout-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            "--vx": particle.vx,
            "--vy": particle.vy,
            "--rotation-speed": particle.rotationSpeed,
            animationDelay: `${particle.delay}s`,
          } as React.CSSProperties}
        >
          {particle.shape === "star" ? (
            <svg
              width={particle.size}
              height={particle.size}
              viewBox="0 0 24 24"
              fill={particle.color}
              style={{ filter: `drop-shadow(0 0 4px ${particle.color})` }}
            >
              <polygon points="12,2 15,9 22,9 16.5,14 18.5,22 12,17.5 5.5,22 7.5,14 2,9 9,9" />
            </svg>
          ) : particle.shape === "coin" ? (
            <div
              className="rounded-full border-2"
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: "#fbbf24",
                borderColor: "#f59e0b",
                boxShadow: "0 0 8px #fbbf24, inset 0 -2px 4px #f59e0b",
              }}
            />
          ) : (
            <div
              style={{
                width: particle.shape === "strip" ? particle.size * 0.4 : particle.size,
                height: particle.shape === "strip" ? particle.size * 1.5 : particle.size,
                backgroundColor: particle.color,
                borderRadius: particle.shape === "circle" ? "50%" : particle.shape === "strip" ? "2px" : "3px",
                boxShadow: `0 0 6px ${particle.color}`,
              }}
            />
          )}
        </div>
      ))}

      {multiplier >= 3 && (
        <div
          className="absolute animate-cashout-ring"
          style={{
            left: `${originX}%`,
            top: `${originY}%`,
            width: 20,
            height: 20,
            transform: "translate(-50%, -50%)",
            border: `3px solid ${colors[0]}`,
            borderRadius: "50%",
          }}
        />
      )}

      {multiplier >= 5 && (
        <div
          className="absolute animate-cashout-ring"
          style={{
            left: `${originX}%`,
            top: `${originY}%`,
            width: 20,
            height: 20,
            transform: "translate(-50%, -50%)",
            border: `2px solid ${colors[1]}`,
            borderRadius: "50%",
            animationDelay: "0.1s",
          }}
        />
      )}

      {tier === "legendary" && (
        <div
          className="absolute animate-cashout-starburst"
          style={{
            left: `${originX}%`,
            top: `${originY}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute origin-center"
              style={{
                width: 4,
                height: 60,
                background: `linear-gradient(to bottom, #fbbf24, transparent)`,
                transform: `rotate(${i * 45}deg)`,
                left: -2,
                top: -30,
              }}
            />
          ))}
        </div>
      )}

      <div
        className="absolute animate-cashout-multiplier-pop"
        style={{
          left: `${originX}%`,
          top: `${originY - 15}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <span
          className="font-bold text-2xl"
          style={{
            color: tier === "legendary" ? "#fbbf24" : tier === "epic" ? "#a855f7" : tier === "high" ? "#ec4899" : "#22c55e",
            textShadow: `0 0 10px ${tier === "legendary" ? "#fbbf24" : tier === "epic" ? "#a855f7" : "#22c55e"}`,
          }}
        >
          {multiplier.toFixed(2)}x
        </span>
      </div>

      <style>{`
        @keyframes cashout-flash {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
        }
        @keyframes cashout-particle {
          0% { transform: translate(-50%, -50%) rotate(0deg); opacity: 1; }
          100% {
            transform: translate(calc(-50% + calc(var(--vx) * 80px)), calc(-50% + calc(var(--vy) * 100px))) rotate(calc(var(--rotation-speed) * 360deg));
            opacity: 0;
          }
        }
        @keyframes cashout-ring {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(15); opacity: 0; }
        }
        @keyframes cashout-starburst {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5) rotate(0deg); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.5) rotate(45deg); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(2) rotate(90deg); }
        }
        @keyframes cashout-multiplier-pop {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          30% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
          60% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, calc(-50% - 40px)) scale(1.2); }
        }
        .animate-cashout-flash { animation: cashout-flash 0.6s ease-out forwards; }
        .animate-cashout-particle { animation: cashout-particle 1.5s ease-out forwards; }
        .animate-cashout-ring { animation: cashout-ring 0.8s ease-out forwards; }
        .animate-cashout-starburst { animation: cashout-starburst 1s ease-out forwards; }
        .animate-cashout-multiplier-pop { animation: cashout-multiplier-pop 1.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default CashoutConfetti;
