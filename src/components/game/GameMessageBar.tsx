import { useState, useEffect } from "react";

const messages = [
  { icon: "⏳", text: "Place your bet before the timer ends" },
  { icon: "🎯", text: "Results are announced automatically after each round" },
  { icon: "🛡️", text: "Fair & transparent game system" },
  { icon: "🔔", text: "Betting closes when countdown reaches zero" },
];

interface GameMessageBarProps {
  soundEnabled?: boolean;
}

const GameMessageBar = ({}: GameMessageBarProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setIsVisible(false);

      // After fade out, change message and fade in
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % messages.length);
        setIsVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const currentMessage = messages[currentIndex];

  return (
    <div className="px-3 pb-2">
      <div
        className="flex items-center justify-center gap-2 py-2 px-3 transition-opacity duration-300"
        style={{
          background: "linear-gradient(135deg, #FFA94D 0%, #FFB703 100%)",
          borderRadius: 12,
          opacity: isVisible ? 1 : 0,
          boxShadow: "0 2px 8px rgba(255, 169, 77, 0.3)",
        }}
      >
        <span
          className="flex-shrink-0"
          style={{
            fontSize: 14,
            filter: "drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))",
          }}
        >
          {currentMessage.icon}
        </span>
        <span
          style={{
            color: "#fff",
            fontSize: 13,
            fontWeight: 500,
            textAlign: "center",
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
          }}
        >
          {currentMessage.text}
        </span>
      </div>
    </div>
  );
};

export default GameMessageBar;
