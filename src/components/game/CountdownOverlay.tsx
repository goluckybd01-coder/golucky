import { useMemo } from "react";

interface CountdownOverlayProps {
  timeRemaining: number;
  show: boolean;
}

const CountdownOverlay = ({ timeRemaining, show }: CountdownOverlayProps) => {
  // Generate random particles
  const particles = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 2,
      duration: 1 + Math.random() * 2,
      color: ["#f97316", "#ef4444", "#fbbf24", "#ffffff"][Math.floor(Math.random() * 4)],
    }));
  }, []);

  // Generate flare positions
  const flares = useMemo(() => {
    return [...Array(6)].map((_, i) => ({
      id: i,
      left: 10 + Math.random() * 80,
      top: 10 + Math.random() * 80,
      size: 30 + Math.random() * 40,
      delay: Math.random() * 1.5,
    }));
  }, []);

  if (!show) return null;

  const isUrgent = timeRemaining <= 2;
  const isCritical = timeRemaining <= 3;

  return (
    <div 
      className="absolute inset-0 z-20 flex items-center justify-center rounded-xl overflow-hidden"
      style={{
        background: isUrgent
          ? "linear-gradient(135deg, rgba(220,38,38,0.95) 0%, rgba(185,28,28,0.98) 50%, rgba(153,27,27,0.95) 100%)"
          : isCritical
          ? "linear-gradient(135deg, rgba(249,115,22,0.95) 0%, rgba(234,88,12,0.98) 50%, rgba(194,65,12,0.95) 100%)"
          : "linear-gradient(135deg, rgba(107,114,128,0.9) 0%, rgba(75,85,99,0.95) 50%, rgba(55,65,81,0.9) 100%)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${isUrgent ? "rgba(239,68,68,0.3)" : "rgba(249,115,22,0.3)"} 0%, transparent 70%)`,
          animation: "pulse 1s ease-in-out infinite",
        }}
      />

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            animation: `floatParticle ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Flare effects */}
      {flares.map((f) => (
        <div
          key={f.id}
          className="absolute rounded-full"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: f.size,
            height: f.size,
            background: `radial-gradient(circle, ${isUrgent ? "rgba(254,202,202,0.4)" : "rgba(254,215,170,0.4)"} 0%, transparent 70%)`,
            animation: "flarePulse 2s ease-in-out infinite",
            animationDelay: `${f.delay}s`,
            filter: "blur(2px)",
          }}
        />
      ))}

      {/* Expanding rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[1, 2, 3].map((ring) => (
          <div
            key={ring}
            className="absolute rounded-full border-2"
            style={{
              width: 60 + ring * 40,
              height: 60 + ring * 40,
              borderColor: isUrgent 
                ? `rgba(254,202,202,${0.4 - ring * 0.1})` 
                : `rgba(253,186,116,${0.4 - ring * 0.1})`,
              animation: `expandRing ${1.5 + ring * 0.3}s ease-out infinite`,
              animationDelay: `${ring * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Spark lines */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * 360;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              width: 2,
              height: isUrgent ? 60 : 40,
              background: `linear-gradient(to top, transparent, ${isUrgent ? "#fca5a5" : "#fdba74"})`,
              transformOrigin: "bottom center",
              transform: `translate(-50%, -100%) rotate(${angle}deg)`,
              animation: "sparkLine 0.8s ease-in-out infinite",
              animationDelay: `${i * 0.1}s`,
              opacity: 0.6,
            }}
          />
        );
      })}

      {/* Main countdown content */}
      <div className="relative z-10 text-center">
        {/* Glowing backdrop for numbers */}
        <div 
          className="absolute inset-0 -m-8 rounded-3xl"
          style={{
            background: `radial-gradient(circle, ${isUrgent ? "rgba(239,68,68,0.3)" : "rgba(249,115,22,0.3)"} 0%, transparent 70%)`,
            filter: "blur(20px)",
          }}
        />
        
        <div className="flex items-center gap-4 relative">
          {/* Minutes card */}
          <div 
            className="relative bg-white/95 rounded-2xl px-6 py-5 shadow-2xl"
            style={{
              boxShadow: isUrgent 
                ? "0 0 30px rgba(239,68,68,0.5), 0 10px 40px rgba(0,0,0,0.3)" 
                : "0 0 30px rgba(249,115,22,0.5), 0 10px 40px rgba(0,0,0,0.3)",
              animation: "cardPulse 0.5s ease-in-out infinite",
            }}
          >
            <span 
              className="text-6xl font-black"
              style={{
                background: isUrgent 
                  ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" 
                  : "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "none",
              }}
            >
              0
            </span>
            {/* Shine effect */}
            <div 
              className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
              style={{
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.5) 55%, transparent 60%)",
                animation: "shine 2s ease-in-out infinite",
              }}
            />
          </div>

          {/* Colon separator */}
          <div className="flex flex-col gap-2">
            <div 
              className="w-3 h-3 rounded-full bg-white"
              style={{ 
                boxShadow: "0 0 10px rgba(255,255,255,0.8)",
                animation: "colonBlink 0.5s ease-in-out infinite" 
              }}
            />
            <div 
              className="w-3 h-3 rounded-full bg-white"
              style={{ 
                boxShadow: "0 0 10px rgba(255,255,255,0.8)",
                animation: "colonBlink 0.5s ease-in-out infinite" 
              }}
            />
          </div>

          {/* Seconds card */}
          <div 
            className="relative bg-white/95 rounded-2xl px-6 py-5 shadow-2xl"
            style={{
              boxShadow: isUrgent 
                ? "0 0 30px rgba(239,68,68,0.5), 0 10px 40px rgba(0,0,0,0.3)" 
                : "0 0 30px rgba(249,115,22,0.5), 0 10px 40px rgba(0,0,0,0.3)",
              animation: "cardPulse 0.5s ease-in-out infinite",
              animationDelay: "0.25s",
            }}
          >
            <span 
              className="text-6xl font-black"
              style={{
                background: isUrgent 
                  ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" 
                  : "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {timeRemaining}
            </span>
            {/* Shine effect */}
            <div 
              className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
              style={{
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.5) 55%, transparent 60%)",
                animation: "shine 2s ease-in-out infinite",
                animationDelay: "0.5s",
              }}
            />
          </div>
        </div>

        {/* Status text */}
        <p 
          className="mt-4 text-white text-lg font-bold"
          style={{ 
            textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            animation: "textPulse 1s ease-in-out infinite",
          }}
        >
          {isUrgent ? "🔥 বেটিং বন্ধ হচ্ছে! 🔥" : "⏱️ সময় শেষ হচ্ছে ⏱️"}
        </p>
        <p className="text-white/70 text-sm mt-1">পরবর্তী রাউন্ডের জন্য অপেক্ষা করুন</p>
      </div>

      {/* Corner decorations */}
      {["top-left", "top-right", "bottom-left", "bottom-right"].map((corner, i) => (
        <div
          key={corner}
          className="absolute w-16 h-16"
          style={{
            [corner.includes("top") ? "top" : "bottom"]: 0,
            [corner.includes("left") ? "left" : "right"]: 0,
            background: `radial-gradient(circle at ${corner.includes("left") ? "0% " : "100% "}${corner.includes("top") ? "0%" : "100%"}, ${isUrgent ? "rgba(254,202,202,0.4)" : "rgba(254,215,170,0.4)"} 0%, transparent 70%)`,
            animation: "cornerGlow 1.5s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}

      {/* CSS Animations */}
      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-15px) scale(1.2); opacity: 1; }
        }
        @keyframes flarePulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }
        @keyframes expandRing {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes sparkLine {
          0%, 100% { opacity: 0.3; height: 30px; }
          50% { opacity: 0.8; height: 50px; }
        }
        @keyframes cardPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes colonBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes textPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.02); }
        }
        @keyframes cornerGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default CountdownOverlay;
