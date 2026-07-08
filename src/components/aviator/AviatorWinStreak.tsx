import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy } from "lucide-react";

interface AviatorWinStreakProps {
  currentStreak: number;
  bestStreak: number;
}

const AviatorWinStreak = ({ currentStreak, bestStreak }: AviatorWinStreakProps) => {
  if (currentStreak === 0 && bestStreak === 0) return null;

  const isOnFire = currentStreak >= 3;
  const isHot = currentStreak >= 5;
  const isBlazing = currentStreak >= 10;

  return (
    <div className="flex items-center gap-3 px-3 py-1.5">
      <AnimatePresence mode="wait">
        {currentStreak > 0 && (
          <motion.div
            key={currentStreak}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
              isBlazing 
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                : isHot 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                  : isOnFire 
                    ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                    : 'bg-green-600'
            }`}
          >
            <motion.div
              animate={isOnFire ? { 
                scale: [1, 1.2, 1],
                rotate: [0, -5, 5, 0],
              } : {}}
              transition={{ 
                duration: 0.5, 
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
            >
              <Flame 
                className={`w-4 h-4 ${isBlazing ? 'text-yellow-200' : 'text-white'}`} 
                fill={isOnFire ? 'currentColor' : 'none'}
              />
            </motion.div>
            <span className={`text-xs font-bold ${isBlazing ? 'text-yellow-100' : 'text-white'}`}>
              {currentStreak}x Streak
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {bestStreak > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800/80 border border-gray-700">
          <Trophy className="w-3 h-3 text-yellow-500" />
          <span className="text-[10px] text-gray-400">Best: {bestStreak}</span>
        </div>
      )}
    </div>
  );
};

export default AviatorWinStreak;
