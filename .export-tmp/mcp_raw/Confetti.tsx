import { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  rotationSpeed: number;
  shape: "square" | "circle" | "strip";
}

const COLORS = [
  "#f97316", // orange
  "#22c55e", // green
  "#ef4444", // red
  "#a855f7", // purple
  "#eab308", // yellow
  "#3b82f6", // blue
  "#ec4899", // pink
  "#14b8a6", // teal
];

const Confetti = ({ 
  isActive, 
  duration = 3000,
  intensity = "medium",
}: { 
  isActive: boolean; 
  duration?: number;
  intensity?: "small" | "medium" | "big";
}) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Adjust confetti based on intensity - INCREASED for more celebration
  const getIntensitySettings = () => {
    switch (intensity) {
      case "small":
        return { count: 60, sizeMultiplier: 0.9, burstCount: 10 };
      case "big":
        return { count: 350, sizeMultiplier: 1.5, burstCount: 30 };
      default:
        return { count: 180, sizeMultiplier: 1.2, burstCount: 18 };
    }
  };

  const settings = getIntensitySettings();

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      
      // Generate confetti pieces
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < settings.count; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * 100,
          y: -10 - Math.random() * 20,
          rotation: Math.random() * 360,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: (6 + Math.random() * 8) * settings.sizeMultiplier,
          speedX: (Math.random() - 0.5) * 4,
          speedY: 2 + Math.random() * 3,
          rotationSpeed: (Math.random() - 0.5) * 10,
          shape: ["square", "circle", "strip"][Math.floor(Math.random() * 3)] as "square" | "circle" | "strip",
        });
      }
      setPieces(newPieces);

      // Hide after duration
      const timer = setTimeout(() => {
        setIsVisible(false);
        setPieces([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, duration, settings.count, settings.sizeMultiplier]);

  if (!isVisible || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: piece.shape === "strip" ? piece.size * 0.4 : piece.size,
            height: piece.shape === "strip" ? piece.size * 1.5 : piece.size,
            backgroundColor: piece.color,
            borderRadius: piece.shape === "circle" ? "50%" : piece.shape === "strip" ? "2px" : "2px",
            transform: `rotate(${piece.rotation}deg)`,
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        />
      ))}
      
      {/* Central burst effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-celebration-burst">
          {[...Array(settings.burstCount)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-burst-particle"
              style={{
                width: intensity === "big" ? 16 : intensity === "small" ? 8 : 12,
                height: intensity === "big" ? 16 : intensity === "small" ? 8 : 12,
                backgroundColor: COLORS[i % COLORS.length],
                transform: `rotate(${i * (360 / settings.burstCount)}deg) translateY(${intensity === "big" ? -100 : -60}px)`,
                animationDelay: `${i * 0.03}s`,
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Extra bursts for medium and big wins */}
      {(intensity === "medium" || intensity === "big") && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ transform: "scale(0.6)" }}>
          <div className="animate-celebration-burst" style={{ animationDelay: "0.15s" }}>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full animate-burst-particle"
                style={{
                  backgroundColor: COLORS[(i + 2) % COLORS.length],
                  transform: `rotate(${i * 45}deg) translateY(-70px)`,
                  animationDelay: `${0.15 + i * 0.03}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Extra bursts for big wins - more dramatic */}
      {intensity === "big" && (
        <>
          <div className="absolute inset-0 flex items-center justify-center" style={{ transform: "scale(0.5)" }}>
            <div className="animate-celebration-burst" style={{ animationDelay: "0.1s" }}>
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-4 h-4 rounded-full animate-burst-particle"
                  style={{
                    backgroundColor: COLORS[(i + 3) % COLORS.length],
                    transform: `rotate(${i * 30}deg) translateY(-90px)`,
                    animationDelay: `${0.1 + i * 0.035}s`,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center" style={{ transform: "scale(1.3)" }}>
            <div className="animate-celebration-burst" style={{ animationDelay: "0.3s" }}>
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-5 h-5 rounded-full animate-burst-particle"
                  style={{
                    backgroundColor: COLORS[(i + 5) % COLORS.length],
                    transform: `rotate(${i * 36}deg) translateY(-130px)`,
                    animationDelay: `${0.3 + i * 0.04}s`,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center" style={{ transform: "scale(1.6)" }}>
            <div className="animate-celebration-burst" style={{ animationDelay: "0.5s" }}>
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-6 h-6 rounded-full animate-burst-particle"
                  style={{
                    backgroundColor: COLORS[(i + 7) % COLORS.length],
                    transform: `rotate(${i * 45}deg) translateY(-160px)`,
                    animationDelay: `${0.5 + i * 0.05}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Confetti;
