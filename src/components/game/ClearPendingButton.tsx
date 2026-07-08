import { useState } from "react";
import { Trash2, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { loadMyHistory, saveMyHistory, type GameName } from "@/lib/gameStorage";

interface ClearPendingButtonProps {
  gameName: GameName;
  gameTypes: string[];
  onCleared?: () => void;
  className?: string;
}

/**
 * ClearPendingButton - Clears all pending (unresolved) bets from My History
 * for a specific game across all modes
 */
export const ClearPendingButton = ({
  gameName,
  gameTypes,
  onCleared,
  className = "",
}: ClearPendingButtonProps) => {
  const [isClearing, setIsClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  // Count pending bets across all modes
  const getPendingCount = () => {
    let count = 0;
    gameTypes.forEach((gameType) => {
      const history = loadMyHistory(gameName, gameType);
      count += history.filter((bet: any) => bet.result === null).length;
    });
    return count;
  };

  const pendingCount = getPendingCount();

  const handleClear = () => {
    if (pendingCount === 0) {
      toast.info("কোন পেন্ডিং বেট নেই");
      return;
    }

    setIsClearing(true);

    // Clear pending bets from all modes
    gameTypes.forEach((gameType) => {
      const history = loadMyHistory(gameName, gameType);
      const filtered = history.filter((bet: any) => bet.result !== null);
      saveMyHistory(gameName, gameType, filtered);
    });

    setTimeout(() => {
      setIsClearing(false);
      setCleared(true);
      toast.success(`${pendingCount}টি পেন্ডিং বেট মুছে ফেলা হয়েছে`);
      onCleared?.();

      // Reset cleared state after 2 seconds
      setTimeout(() => setCleared(false), 2000);
    }, 300);
  };

  if (pendingCount === 0) return null;

  return (
    <button
      onClick={handleClear}
      disabled={isClearing}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all ${
        cleared
          ? "bg-green-100 text-green-600 border border-green-300"
          : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
      } ${className}`}
    >
      {isClearing ? (
        <>
          <Loader2 size={12} className="animate-spin" />
          <span>ক্লিয়ার হচ্ছে...</span>
        </>
      ) : cleared ? (
        <>
          <CheckCircle size={12} />
          <span>ক্লিয়ার হয়েছে!</span>
        </>
      ) : (
        <>
          <Trash2 size={12} />
          <span>পেন্ডিং মুছুন ({pendingCount})</span>
        </>
      )}
    </button>
  );
};

export default ClearPendingButton;
