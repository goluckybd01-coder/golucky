import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Sparkles, Gift, Coins, Star, 
  Trophy, Zap, Crown, Gem, Loader2, Volume2, VolumeX,
  AlertCircle, Wallet
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Confetti from "@/components/Confetti";
import CoinRain from "@/components/CoinRain";

interface SpinSegment {
  id: number;
  label: string;
  value: number;
  color: string;
  textColor: string;
}

interface SpinEligibility {
  id: string;
  deposit_date: string;
  deposit_amount: number;
  spin_earned: boolean;
  spin_used: boolean;
  reward_amount: number;
}

const segments: SpinSegment[] = [
  { id: 0, label: "৳5", value: 5, color: "#dc2626", textColor: "#fff" },
  { id: 1, label: "৳10", value: 10, color: "#f97316", textColor: "#fff" },
  { id: 2, label: "৳25", value: 25, color: "#eab308", textColor: "#000" },
  { id: 3, label: "৳50", value: 50, color: "#22c55e", textColor: "#fff" },
  { id: 4, label: "৳100", value: 100, color: "#3b82f6", textColor: "#fff" },
  { id: 5, label: "৳250", value: 250, color: "#8b5cf6", textColor: "#fff" },
  { id: 6, label: "৳500", value: 500, color: "#ec4899", textColor: "#fff" },
  { id: 7, label: "৳1000", value: 1000, color: "#06b6d4", textColor: "#fff" },
];

const LuckySpinner = () => {
  const navigate = useNavigate();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinSegment | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasFreeSpin, setHasFreeSpin] = useState(false);
  const [spinEligibility, setSpinEligibility] = useState<SpinEligibility | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [totalWon, setTotalWon] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
    if (session?.user) {
      setUserId(session.user.id);
      await checkSpinEligibility(session.user.id);
    }
    setIsLoading(false);
  };

  const checkSpinEligibility = async (uid: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_spin_eligibility')
        .select('*')
        .eq('user_id', uid)
        .eq('deposit_date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking spin eligibility:', error);
        return;
      }

      if (data) {
        setSpinEligibility(data as SpinEligibility);
        setHasFreeSpin(data.spin_earned && !data.spin_used);
        if (data.reward_amount) {
          setTotalWon(data.reward_amount);
        }
      } else {
        setHasFreeSpin(false);
        setSpinEligibility(null);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const spinWheel = async () => {
    if (isSpinning || !hasFreeSpin) return;
    
    if (!isLoggedIn || !userId) {
      toast.error("স্পিন করতে লগইন করুন!");
      navigate("/login");
      return;
    }

    setIsSpinning(true);
    setShowResult(false);
    setResult(null);

    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    const weights = [30, 25, 18, 12, 8, 4, 2, 1];
    const random = Math.random() * 100;
    let cumulative = 0;
    let selectedIndex = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        selectedIndex = i;
        break;
      }
    }

    const segmentAngle = 360 / segments.length;
    const targetAngle = 360 - (selectedIndex * segmentAngle) - (segmentAngle / 2);
    const spins = 6 + Math.floor(Math.random() * 4);
    const finalRotation = rotation + (spins * 360) + targetAngle + (Math.random() * 15 - 7.5);

    setRotation(finalRotation);

    setTimeout(async () => {
      const wonAmount = segments[selectedIndex].value;
      
      try {
        const today = new Date().toISOString().split('T')[0];
        
        await supabase
          .from('daily_spin_eligibility')
          .update({
            spin_used: true,
            spin_used_at: new Date().toISOString(),
            reward_amount: wonAmount,
          })
          .eq('user_id', userId)
          .eq('deposit_date', today);

        const { data: result, error: creditError } = await supabase.rpc("credit_reward", {
          p_user_id: userId,
          p_amount: wonAmount,
          p_reward_type: "lucky_spin",
          p_reason: `Lucky Spinner জয় - ৳${wonAmount}`,
        });

        if (creditError) {
          console.error('Error crediting spin winnings:', creditError);
        }

        setHasFreeSpin(false);
      } catch (err) {
        console.error('Error updating spin:', err);
      }

      setIsSpinning(false);
      setResult(segments[selectedIndex]);
      setShowResult(true);
      setTotalWon(prev => prev + wonAmount);
      
      if (wonAmount >= 100) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
      
      if (navigator.vibrate) {
        if (wonAmount >= 500) {
          navigator.vibrate([100, 50, 100, 50, 100, 100, 300]);
        } else if (wonAmount >= 100) {
          navigator.vibrate([100, 50, 100, 50, 150]);
        } else {
          navigator.vibrate([80, 40, 80]);
        }
      }
      
      toast.success(`🎉 আপনি জিতেছেন ৳${wonAmount}! ওয়ালেটে যোগ হয়েছে।`, {
        duration: 3000,
      });
    }, 5500);
  };

  const segmentAngle = 360 / segments.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/50 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/30 to-gray-900 pb-24 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 1.5 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
        
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-purple-500/10 blur-3xl"
          style={{ left: "10%", top: "20%" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-48 h-48 rounded-full bg-pink-500/10 blur-3xl"
          style={{ right: "10%", bottom: "30%" }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 p-4 shadow-xl"
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-white flex items-center gap-2 text-lg">
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🎰
                </motion.span>
                Lucky Spinner
              </h1>
              <p className="text-xs text-white/80">ডিপোজিট করুন, স্পিন পান!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <div className={`backdrop-blur-sm rounded-full px-3 py-1.5 ${hasFreeSpin ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
              <span className="text-white text-sm font-bold">
                {hasFreeSpin ? '১ স্পিন' : '০ স্পিন'}
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {!hasFreeSpin && isLoggedIn && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 rounded-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-sm">ফ্রি স্পিন পেতে ডিপোজিট করুন!</h3>
                <p className="text-amber-200/80 text-xs mt-1">
                  প্রতিদিন ডিপোজিট করলে ১টি ফ্রি স্পিন পাবেন। আজই ডিপোজিট করুন এবং স্পিন জিতুন!
                </p>
                <Button
                  size="sm"
                  className="mt-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  onClick={() => navigate('/deposit')}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  এখনই ডিপোজিট করুন
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center gap-4 mb-6"
        >
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-700/50">
            <p className="text-xs text-gray-400">আজ জিতেছেন</p>
            <p className="text-lg font-bold text-green-400">৳{totalWon}</p>
          </div>
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-700/50">
            <p className="text-xs text-gray-400">আজ ডিপোজিট</p>
            <p className="text-lg font-bold text-yellow-400">
              ৳{spinEligibility?.deposit_amount || 0}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="relative flex items-center justify-center my-4"
        >
          <motion.div 
            className="absolute w-[340px] h-[340px] rounded-full"
            style={{
              background: "conic-gradient(from 0deg, #f97316, #ec4899, #8b5cf6, #3b82f6, #22c55e, #eab308, #f97316)",
              filter: "blur(30px)",
              opacity: hasFreeSpin ? 0.4 : 0.15,
            }}
            animate={{ rotate: isSpinning ? 360 : 0 }}
            transition={{ duration: 2, repeat: isSpinning ? Infinity : 0, ease: "linear" }}
          />
          
          <div className="absolute w-[310px] h-[310px] rounded-full border-[6px] border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.5),inset_0_0_30px_rgba(250,204,21,0.2)]">
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2.5 h-2.5 rounded-full"
                style={{
                  background: i % 2 === 0 ? "#fbbf24" : "#ffffff",
                  boxShadow: i % 2 === 0 ? "0 0 8px #fbbf24" : "0 0 6px #ffffff",
                  left: "50%",
                  top: "50%",
                  transform: `rotate(${i * 15}deg) translateY(-151px) translateX(-50%)`,
                }}
                animate={{
                  opacity: isSpinning ? [1, 0.3, 1] : hasFreeSpin ? [0.7, 1, 0.7] : 0.3,
                  scale: isSpinning ? [1, 0.7, 1] : 1,
                }}
                transition={{
                  duration: isSpinning ? 0.15 : 1,
                  repeat: Infinity,
                  delay: i * 0.02,
                }}
              />
            ))}
          </div>

          <motion.div
            className={`relative w-[290px] h-[290px] rounded-full overflow-hidden shadow-2xl ${!hasFreeSpin ? 'grayscale-[30%] opacity-80' : ''}`}
            style={{ rotate: rotation }}
            animate={{ rotate: rotation }}
            transition={{
              duration: isSpinning ? 5.5 : 0,
              ease: [0.2, 0.8, 0.15, 1],
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
              <defs>
                {segments.map((segment, i) => (
                  <linearGradient key={`grad-${i}`} id={`gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={segment.color} />
                    <stop offset="100%" stopColor={segment.color} stopOpacity="0.7" />
                  </linearGradient>
                ))}
              </defs>
              
              {segments.map((segment, i) => {
                const startAngle = i * segmentAngle;
                const endAngle = startAngle + segmentAngle;
                const startRad = (startAngle - 90) * (Math.PI / 180);
                const endRad = (endAngle - 90) * (Math.PI / 180);
                
                const x1 = 50 + 50 * Math.cos(startRad);
                const y1 = 50 + 50 * Math.sin(startRad);
                const x2 = 50 + 50 * Math.cos(endRad);
                const y2 = 50 + 50 * Math.sin(endRad);
                
                const largeArc = segmentAngle > 180 ? 1 : 0;
                
                const midAngle = (startAngle + endAngle) / 2 - 90;
                const midRad = midAngle * (Math.PI / 180);
                const textX = 50 + 34 * Math.cos(midRad);
                const textY = 50 + 34 * Math.sin(midRad);
                
                return (
                  <g key={segment.id}>
                    <path
                      d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={`url(#gradient-${i})`}
                      stroke="#1a1a2e"
                      strokeWidth="0.3"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill={segment.textColor}
                      fontSize="5.5"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                      style={{ 
                        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                        fontFamily: "system-ui, sans-serif"
                      }}
                    >
                      {segment.label}
                    </text>
                  </g>
                );
              })}
              
              <circle cx="50" cy="50" r="14" fill="url(#centerGradient)" stroke="#fbbf24" strokeWidth="2" />
              <defs>
                <radialGradient id="centerGradient" cx="50%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#374151" />
                  <stop offset="100%" stopColor="#111827" />
                </radialGradient>
              </defs>
              <text x="50" y="48" fill="#fbbf24" fontSize="4" fontWeight="bold" textAnchor="middle">LUCKY</text>
              <text x="50" y="54" fill="white" fontSize="3.5" textAnchor="middle">SPIN</text>
            </svg>
          </motion.div>

          <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
            <motion.div
              animate={{ y: isSpinning ? [0, 3, 0] : 0 }}
              transition={{ duration: 0.1, repeat: isSpinning ? Infinity : 0 }}
            >
              <div className="relative">
                <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[35px] border-t-yellow-400 drop-shadow-[0_4px_8px_rgba(250,204,21,0.5)]" />
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[24px] border-t-yellow-300" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-6"
        >
          <motion.div
            whileHover={{ scale: hasFreeSpin && !isSpinning ? 1.05 : 1 }}
            whileTap={{ scale: hasFreeSpin && !isSpinning ? 0.95 : 1 }}
          >
            <Button
              onClick={spinWheel}
              disabled={isSpinning || !hasFreeSpin}
              size="lg"
              className={`w-52 h-16 text-xl font-bold rounded-full shadow-xl transition-all relative overflow-hidden ${
                isSpinning 
                  ? "bg-gray-600 cursor-not-allowed" 
                  : !hasFreeSpin
                  ? "bg-gray-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]"
              }`}
            >
              {!isSpinning && hasFreeSpin && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSpinning ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    স্পিনিং...
                  </>
                ) : !hasFreeSpin ? (
                  <>
                    <AlertCircle className="w-5 h-5" />
                    ডিপোজিট করুন
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    স্পিন করুন!
                  </>
                )}
              </span>
            </Button>
          </motion.div>
          
          {!hasFreeSpin && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-400 text-sm mt-3"
            >
              💡 আজ ডিপোজিট করলে ১টি ফ্রি স্পিন পাবেন!
            </motion.p>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-gray-800/40 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50"
        >
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Gift className="w-5 h-5 text-yellow-400" />
            পুরস্কার তালিকা
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {segments.map((segment) => (
              <motion.div
                key={segment.id}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center p-2 rounded-xl transition-colors"
                style={{ backgroundColor: `${segment.color}15`, border: `1px solid ${segment.color}30` }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-1 shadow-lg"
                  style={{ backgroundColor: segment.color }}
                >
                  {segment.value >= 500 ? <Crown className="w-5 h-5 text-white" /> :
                   segment.value >= 250 ? <Trophy className="w-5 h-5 text-white" /> :
                   segment.value >= 100 ? <Gem className="w-5 h-5 text-white" /> :
                   segment.value >= 50 ? <Star className="w-5 h-5 text-white" /> :
                   <Coins className="w-5 h-5 text-white" />}
                </div>
                <span className="text-xs text-white font-semibold">{segment.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-4 bg-gray-800/30 rounded-xl p-4 border border-gray-700/30"
        >
          <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            নিয়মাবলী
          </h4>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• <span className="text-amber-400 font-medium">প্রতিদিন ডিপোজিট করলে ১টি ফ্রি স্পিন পাবেন</span></li>
            <li>• জয়ী টাকা সরাসরি ওয়ালেটে যোগ হবে</li>
            <li>• প্রতিদিন রাত ১২টায় নতুন দিন শুরু হয়</li>
            <li>• ন্যূনতম যেকোনো পরিমাণ ডিপোজিটে স্পিন পাবেন</li>
          </ul>
        </motion.div>
      </div>

      <AnimatePresence>
        {showResult && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            onClick={() => setShowResult(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotateY: -180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-6 max-w-sm w-full border-2 shadow-2xl text-center relative overflow-hidden"
              style={{ borderColor: result.color }}
            >
              <div 
                className="absolute inset-0 opacity-20"
                style={{ background: `radial-gradient(circle at center, ${result.color}, transparent 70%)` }}
              />
              
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 10, 0], 
                  scale: [1, 1.2, 1, 1.1, 1] 
                }}
                transition={{ duration: 0.8, repeat: 2 }}
                className="text-7xl mb-4 relative z-10"
              >
                🎊
              </motion.div>
              
              <h2 className="text-3xl font-black text-white mb-2 relative z-10">
                অভিনন্দন!
              </h2>
              <p className="text-gray-400 mb-4 relative z-10">আপনি জিতেছেন</p>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl mb-6 relative z-10"
                style={{ backgroundColor: result.color }}
              >
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  {result.value >= 500 ? <Crown className="w-8 h-8 text-white" /> :
                   result.value >= 100 ? <Trophy className="w-8 h-8 text-white" /> :
                   <Coins className="w-8 h-8 text-white" />}
                </motion.span>
                <span className="text-4xl font-black text-white">{result.label}</span>
              </motion.div>

              <p className="text-green-400 text-sm mb-4 relative z-10">
                ✓ ওয়ালেটে যোগ হয়েছে!
              </p>
              
              <Button
                onClick={() => setShowResult(false)}
                className="w-full bg-gradient-to-r from-primary to-amber-500 text-lg font-bold py-6 relative z-10"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                দারুণ!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Confetti isActive={showConfetti} intensity="big" />
      <CoinRain active={showConfetti} duration={4000} coinCount={40} intensity="big" />
    </div>
  );
};

export default LuckySpinner;
