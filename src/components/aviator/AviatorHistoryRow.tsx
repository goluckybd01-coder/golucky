import { MoreHorizontal } from "lucide-react";
import type { RoundResult } from "@/pages/games/AviatorGame";

interface AviatorHistoryRowProps {
  history: RoundResult[];
}

const getMultiplierColor = (mult: number): string => {
  if (mult >= 10) return "text-[#FF1493]";
  if (mult >= 5) return "text-[#FF1493]";
  if (mult >= 3) return "text-[#9B59B6]";
  if (mult >= 2) return "text-[#8E44AD]";
  if (mult >= 1.5) return "text-[#3498DB]";
  return "text-[#00BCD4]";
};

const AviatorHistoryRow = ({ history }: AviatorHistoryRowProps) => {
  const displayHistory = history.length > 0 
    ? history 
    : [
        { multiplier: 3.64, roundId: '1', serverSeed: '', serverSeedHash: '', clientSeed: '', nonce: 0 },
        { multiplier: 3.21, roundId: '2', serverSeed: '', serverSeedHash: '', clientSeed: '', nonce: 0 },
        { multiplier: 1.53, roundId: '3', serverSeed: '', serverSeedHash: '', clientSeed: '', nonce: 0 },
        { multiplier: 2.99, roundId: '4', serverSeed: '', serverSeedHash: '', clientSeed: '', nonce: 0 },
        { multiplier: 1.12, roundId: '5', serverSeed: '', serverSeedHash: '', clientSeed: '', nonce: 0 },
        { multiplier: 1.00, roundId: '6', serverSeed: '', serverSeedHash: '', clientSeed: '', nonce: 0 },
        { multiplier: 2.36, roundId: '7', serverSeed: '', serverSeedHash: '', clientSeed: '', nonce: 0 },
      ];

  return (
    <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-hide bg-[#0B0B0B]">
      {displayHistory.slice(0, 7).map((result, index) => (
        <span key={result.roundId + index} className={`flex-shrink-0 text-sm font-bold ${getMultiplierColor(result.multiplier)}`}>
          {result.multiplier.toFixed(2)}x
        </span>
      ))}
      <button className="flex-shrink-0 w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center hover:bg-[#2a2a2a] transition-colors ml-auto">
        <MoreHorizontal className="w-5 h-5 text-gray-400" />
      </button>
    </div>
  );
};

export default AviatorHistoryRow;
