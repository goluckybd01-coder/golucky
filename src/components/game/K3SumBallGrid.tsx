interface K3SumBallGridProps {
  odds: Record<number, number>;
  selectedNumber: number | null;
  onSelectNumber: (num: number) => void;
  disabled?: boolean;
}

// Glossy 3D Number Ball
const GlossyBall = ({ 
  num, 
  size = 52, 
  isSelected = false 
}: { 
  num: number; 
  size?: number; 
  isSelected?: boolean;
}) => {
  // 3-10 = Green, 11-18 = Red
  const isGreen = num <= 10;
  const bgGradient = isGreen
    ? "linear-gradient(145deg, #4ade80 0%, #22c55e 40%, #16a34a 100%)"
    : "linear-gradient(145deg, #f87171 0%, #ef4444 40%, #dc2626 100%)";
  
  return (
    <div
      className={`relative rounded-full flex items-center justify-center transition-transform ${isSelected ? "scale-110 ring-2 ring-yellow-400 ring-offset-2" : ""}`}
      style={{
        width: size,
        height: size,
        background: bgGradient,
        boxShadow: `
          0 4px 12px rgba(0,0,0,0.25),
          inset 0 2px 4px rgba(255,255,255,0.4),
          inset 0 -2px 4px rgba(0,0,0,0.15)
        `,
      }}
    >
      {/* Top glossy highlight */}
      <div
        className="absolute rounded-full"
        style={{
          top: size * 0.08,
          left: size * 0.15,
          right: size * 0.15,
          height: size * 0.35,
          background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)",
          borderRadius: "50%",
        }}
      />
      {/* Number */}
      <span
        className="relative z-10 font-bold text-white"
        style={{
          fontSize: size * 0.42,
          textShadow: "0 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        {num}
      </span>
    </div>
  );
};

const K3SumBallGrid = ({ odds, selectedNumber, onSelectNumber, disabled = false }: K3SumBallGridProps) => {
  const numbers = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  return (
    <div className={`grid grid-cols-4 gap-x-4 gap-y-3 mb-4 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      {numbers.map((num) => (
        <button
          key={num}
          onClick={() => onSelectNumber(num)}
          disabled={disabled}
          className="flex flex-col items-center gap-1 py-1 disabled:cursor-not-allowed"
        >
          <GlossyBall num={num} size={52} isSelected={selectedNumber === num} />
          <span className="text-[11px] font-semibold text-slate-400">
            {odds[num]?.toFixed(2) || "2.00"}X
          </span>
        </button>
      ))}
    </div>
  );
};

export default K3SumBallGrid;
