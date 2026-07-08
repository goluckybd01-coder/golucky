import { useEffect, useState, useCallback } from "react";

interface Coin {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

interface CoinRainProps {
  active: boolean;
  duration?: number; // Duration in ms
  coinCount?: number;
  intensity?: "small" | "medium" | "big"; // Win intensity level
}

const CoinRain = ({ active, duration = 3000, coinCount = 30, intensity = "medium" }: CoinRainProps) => {
  // Adjust coin count and effects based on intensity
  const getIntensitySettings = () => {
    switch (intensity) {
      case "small":
        return { coins: Math.min(coinCount, 15), sizeMultiplier: 0.8, speedMultiplier: 1.2 };
      case "big":
        return { coins: Math.max(coinCount, 50), sizeMultiplier: 1.3, speedMultiplier: 0.8 };
      default:
        return { coins: coinCount, sizeMultiplier: 1, speedMultiplier: 1 };
    }
  };
  
  const settings = getIntensitySettings();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [visible, setVisible] = useState(false);

  const generateCoins = useCallback(() => {
    const newCoins: Coin[] = [];
    for (let i = 0; i < settings.coins; i++) {
      newCoins.push({
        id: i,
        x: Math.random() * 100, // Random horizontal position (%)
        delay: Math.random() * (intensity === "big" ? 1500 : 1000), // Longer stagger for big wins
        duration: (1500 + Math.random() * 1000) * settings.speedMultiplier, // Fall duration
        size: (20 + Math.random() * 20) * settings.sizeMultiplier, // Size based on intensity
        rotation: Math.random() * 360,
        rotationSpeed: 360 + Math.random() * 720, // 1-3 full rotations
      });
    }
    return newCoins;
  }, [settings.coins, settings.sizeMultiplier, settings.speedMultiplier, intensity]);

  useEffect(() => {
    if (active) {
      setCoins(generateCoins());
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration, generateCoins]);

  if (!visible || coins.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[150] overflow-hidden"
      aria-hidden="true"
    >
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="absolute"
          style={{
            left: `${coin.x}%`,
            top: -50,
            animationName: "coinFall",
            animationDuration: `${coin.duration}ms`,
            animationDelay: `${coin.delay}ms`,
            animationTimingFunction: "ease-in",
            animationFillMode: "forwards",
          }}
        >
          {/* Coin */}
          <div
            className="relative"
            style={{
              width: coin.size,
              height: coin.size,
              animationName: "coinSpin",
              animationDuration: `${1000 / (coin.rotationSpeed / 360)}ms`,
              animationIterationCount: "infinite",
              animationTimingFunction: "linear",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Coin Front */}
            <div
              className="absolute inset-0 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(145deg, #ffd700 0%, #ffb300 50%, #ff8c00 100%)",
                boxShadow: `
                  inset 0 2px 4px rgba(255,255,255,0.5),
                  inset 0 -2px 4px rgba(0,0,0,0.2),
                  0 4px 8px rgba(0,0,0,0.3)
                `,
                border: "2px solid #d4a500",
                backfaceVisibility: "hidden",
              }}
            >
              <span
                style={{
                  fontSize: coin.size * 0.5,
                  fontWeight: 900,
                  color: "#8b6914",
                  textShadow: "0 1px 0 rgba(255,255,255,0.5)",
                }}
              >
                ৳
              </span>
            </div>
            
            {/* Coin Back (slightly different shade) */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "linear-gradient(145deg, #e6c200 0%, #cc9900 50%, #b38600 100%)",
                boxShadow: `
                  inset 0 2px 4px rgba(255,255,255,0.4),
                  inset 0 -2px 4px rgba(0,0,0,0.3),
                  0 4px 8px rgba(0,0,0,0.3)
                `,
                border: "2px solid #a67c00",
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            />
          </div>
          
          {/* Sparkle effect */}
          <div
            className="absolute"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: coin.size * 0.3,
              height: coin.size * 0.3,
              background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)",
              borderRadius: "50%",
              animationName: "sparkle",
              animationDuration: "300ms",
              animationIterationCount: "infinite",
            }}
          />
        </div>
      ))}

      {/* Keyframe animations */}
      <style>{`
        @keyframes coinFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(${Math.random() > 0.5 ? "" : "-"}180deg);
            opacity: 0;
          }
        }

        @keyframes coinSpin {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0.3;
            transform: translate(-50%, -50%) scale(0.8);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
          }
        }
      `}</style>
    </div>
  );
};

export default CoinRain;
