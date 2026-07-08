import { useState, useEffect } from 'react';
import { X, Gift, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'first_deposit_bonus_shown_count';
const MAX_SHOW_COUNT = 2;

export const FirstDepositBonusBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const shownCount = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    if (shownCount < MAX_SHOW_COUNT) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        localStorage.setItem(STORAGE_KEY, String(shownCount + 1));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => setIsVisible(false);
  const handleDeposit = () => { setIsVisible(false); navigate('/deposit'); };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-xs">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 p-[1.5px] shadow-xl">
            <div className="relative rounded-xl bg-gradient-to-br from-amber-900/95 to-orange-900/95 px-3 py-2.5">
              <button onClick={handleClose} className="absolute right-1.5 top-1.5 rounded-full p-0.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"><X className="h-3.5 w-3.5" /></button>
              <div className="flex items-center gap-2 pr-4">
                <div className="flex-shrink-0"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500"><Gift className="h-4 w-4 text-amber-900" /></div></div>
                <div className="flex-1 min-w-0"><p className="text-xs font-bold text-white">🎁 1st Deposit <span className="text-yellow-300">+100%</span></p></div>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleDeposit} className="flex-shrink-0 rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500 px-3 py-1.5 text-xs font-bold text-amber-900">Claim</motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
