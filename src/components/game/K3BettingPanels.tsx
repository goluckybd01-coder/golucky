import { useState } from "react";

interface BettingPanelProps {
  disabled: boolean;
  onPlaceBet: (betType: string, betValue: string, odds: number) => void;
}

const MiniDiceIcon = ({ value, size = 28 }: { value: number; size?: number }) => {
  const dotPositions: Record<number, number[][]> = {
    1: [[50, 50]], 2: [[30, 30], [70, 70]], 3: [[30, 30], [50, 50], [70, 70]],
    4: [[30, 30], [70, 30], [30, 70], [70, 70]],
    5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
    6: [[30, 30], [70, 30], [30, 50], [70, 50], [30, 70], [70, 70]],
  };
  const dots = dotPositions[value] || dotPositions[1];
  const dotSize = size * 0.18;
  return (
    <div style={{ width: size, height: size, background: "linear-gradient(145deg, #ef4444 0%, #dc2626 100%)", borderRadius: size * 0.2, position: "relative", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
      {dots.map((pos, idx) => (
        <div key={idx} style={{ position: "absolute", left: `${pos[0]}%`, top: `${pos[1]}%`, transform: "translate(-50%, -50%)", width: dotSize, height: dotSize, borderRadius: "50%", background: "#fef08a" }} />
      ))}
    </div>
  );
};

export const ThreeSamePanel = ({ disabled, onPlaceBet }: BettingPanelProps) => {
  const [selectedTriple, setSelectedTriple] = useState<number | null>(null);
  const triples = [1, 2, 3, 4, 5, 6];
  return (
    <div className={`${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="mb-4">
        <p className="text-xs text-slate-300 mb-2 font-medium">3 Same – All (Any triple wins)</p>
        <button onClick={() => onPlaceBet("3same-all", "Any Triple", 30)} disabled={disabled}
          className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", boxShadow: "0 3px 8px rgba(139,92,246,0.3)" }}>
          <span>🎲🎲🎲</span><span>Any Triple (111-666)</span><span className="text-xs opacity-80">30X</span>
        </button>
      </div>
      <div>
        <p className="text-xs text-slate-300 mb-2 font-medium">3 Same – Single (Choose specific triple)</p>
        <div className="grid grid-cols-6 gap-2">
          {triples.map((num) => (
            <button key={num} onClick={() => { setSelectedTriple(num); onPlaceBet("3same-single", `${num}${num}${num}`, 180); }} disabled={disabled}
              className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${selectedTriple === num ? "ring-2 ring-yellow-400" : ""}`}
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", boxShadow: "0 2px 6px rgba(249,115,22,0.25)" }}>
              <div className="flex gap-0.5"><MiniDiceIcon value={num} size={20} /></div>
              <span className="text-white text-[10px] font-bold">{num}{num}{num}</span>
              <span className="text-white/70 text-[9px]">180X</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const TwoSamePanel = ({ disabled, onPlaceBet }: BettingPanelProps) => {
  const [selectedPair, setSelectedPair] = useState<number | null>(null);
  const [selectedThird, setSelectedThird] = useState<number | null>(null);
  const numbers = [1, 2, 3, 4, 5, 6];
  return (
    <div className={`${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="mb-4">
        <p className="text-xs text-slate-300 mb-2 font-medium">2 Same – Multiple (Any pair + different)</p>
        <div className="grid grid-cols-6 gap-2">
          {numbers.map((num) => (
            <button key={num} onClick={() => { setSelectedPair(num); setSelectedThird(null); onPlaceBet("2same-multiple", `${num}${num}X`, 11); }} disabled={disabled}
              className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${selectedPair === num && selectedThird === null ? "ring-2 ring-yellow-400" : ""}`}
              style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", boxShadow: "0 2px 6px rgba(59,130,246,0.25)" }}>
              <div className="flex gap-0.5"><MiniDiceIcon value={num} size={18} /><MiniDiceIcon value={num} size={18} /></div>
              <span className="text-white text-[10px] font-bold">{num}{num}X</span><span className="text-white/70 text-[9px]">11X</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-300 mb-2 font-medium">2 Same – Single (Pair + exact third)</p>
        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <p className="text-[10px] text-slate-400 mb-1">Select pair:</p>
            <div className="grid grid-cols-6 gap-1">
              {numbers.map((num) => (
                <button key={num} onClick={() => setSelectedPair(num)} disabled={disabled}
                  className={`py-2 rounded-lg text-xs font-bold ${selectedPair === num ? "bg-orange-500 text-white" : "bg-slate-700 text-slate-200"}`}>{num}{num}</button>
              ))}
            </div>
          </div>
        </div>
        {selectedPair && (
          <div>
            <p className="text-[10px] text-slate-400 mb-1">Select third number:</p>
            <div className="grid grid-cols-6 gap-1">
              {numbers.filter(n => n !== selectedPair).map((num) => (
                <button key={num} onClick={() => { setSelectedThird(num); onPlaceBet("2same-single", `${selectedPair}${selectedPair}${num}`, 55); }} disabled={disabled}
                  className={`py-2 rounded-lg text-xs font-bold ${selectedThird === num ? "bg-green-500 text-white" : "bg-slate-700 text-slate-200"}`}>{num}</button>
              ))}
            </div>
            {selectedThird && (<div className="mt-2 text-center"><span className="text-sm font-bold text-orange-500">{selectedPair}{selectedPair}{selectedThird} → 55X</span></div>)}
          </div>
        )}
      </div>
    </div>
  );
};

export const DifferentPanel = ({ disabled, onPlaceBet }: BettingPanelProps) => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const numbers = [1, 2, 3, 4, 5, 6];
  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    else if (selectedNumbers.length < 3) {
      const newSelection = [...selectedNumbers, num].sort();
      setSelectedNumbers(newSelection);
      if (newSelection.length === 3) onPlaceBet("3different", newSelection.join("-"), 30);
      else if (newSelection.length === 2) onPlaceBet("2different", newSelection.join("-"), 5);
    }
  };
  return (
    <div className={`${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="mb-4">
        <p className="text-xs text-slate-300 mb-2 font-medium">3 Different Numbers (Select 3)</p>
        <div className="grid grid-cols-6 gap-2 mb-3">
          {numbers.map((num) => (
            <button key={num} onClick={() => toggleNumber(num)} disabled={disabled}
              className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${selectedNumbers.includes(num) ? "ring-2 ring-yellow-400 scale-105" : ""}`}
              style={{ background: selectedNumbers.includes(num) ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" : "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
              <MiniDiceIcon value={num} size={24} /><span className="text-white text-xs font-bold">{num}</span>
            </button>
          ))}
        </div>
        {selectedNumbers.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#1E3A5F]">
            <div className="flex items-center gap-2"><span className="text-sm text-slate-300">Selected:</span><div className="flex gap-1">{selectedNumbers.map(n => <MiniDiceIcon key={n} value={n} size={24} />)}</div></div>
            <div className="text-right"><span className="text-sm font-bold text-orange-500">{selectedNumbers.length === 3 ? "30X" : selectedNumbers.length === 2 ? "5X" : ""}</span></div>
          </div>
        )}
        <button onClick={() => setSelectedNumbers([])} className="mt-2 text-xs text-slate-400 underline">Clear selection</button>
      </div>
      <div>
        <p className="text-xs text-slate-300 mb-2 font-medium">3 Consecutive Numbers (Any sequence wins)</p>
        <button onClick={() => onPlaceBet("consecutive", "123/234/345/456", 8)} disabled={disabled}
          className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-3"
          style={{ background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)", boxShadow: "0 3px 8px rgba(236,72,153,0.3)" }}>
          <span className="flex gap-1"><MiniDiceIcon value={1} size={22} /><MiniDiceIcon value={2} size={22} /><MiniDiceIcon value={3} size={22} /></span>
          <span>/ 234 / 345 / 456</span><span className="text-xs opacity-80">8X</span>
        </button>
      </div>
    </div>
  );
};
