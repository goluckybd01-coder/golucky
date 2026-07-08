import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Target, 
  Sparkles,
  ArrowRight,
  Activity,
  BarChart3
} from "lucide-react";

// Simulated live stats
const generatePredictionStats = () => ({
  accuracy: (Math.random() * 5 + 92).toFixed(1),
  todayPredictions: Math.floor(Math.random() * 500) + 2500,
  usersOnline: Math.floor(Math.random() * 200) + 800,
  winRate: (Math.random() * 3 + 85).toFixed(1),
});

// Game predictions with live updates
const GAME_PREDICTIONS = [
  { game: "Win Go", icon: "🎯", prediction: "Green", confidence: 87, trend: "up" },
  { game: "K3", icon: "🎲", prediction: "Big", confidence: 92, trend: "up" },
  { game: "5D", icon: "🎡", prediction: "4,7,2,9,1", confidence: 78, trend: "stable" },
  { game: "Crash", icon: "🚀", prediction: "2.5x+", confidence: 81, trend: "up" },
  { game: "Aviator", icon: "✈️", prediction: "3.2x", confidence: 89, trend: "up" },
];

const AIPredictionSection = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(generatePredictionStats());
  const [currentPredictionIndex, setCurrentPredictionIndex] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [pulseActive, setPulseActive] = useState(true);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(generatePredictionStats());
      setIsLive(false);
      setTimeout(() => setIsLive(true), 100);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Rotate through predictions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPredictionIndex(prev => (prev + 1) % GAME_PREDICTIONS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Pulse animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseActive(prev => !prev);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const currentPrediction = GAME_PREDICTIONS[currentPredictionIndex];

  return (
    <section className="mx-3 mb-4">
      <motion.div
        className="relative rounded-3xl overflow-hidden cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onClick={() => navigate("/ai-predictions")}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#2d1b4e] to-[#1a0a3a]" />
        
        {/* Animated Neural Network Pattern */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.5) 0%, transparent 40%), 
                              radial-gradient(circle at 80% 70%, rgba(99, 102, 241, 0.4) 0%, transparent 40%),
                              radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)`
          }}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />

        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}
        />
        
        {/* Holographic shine */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 55%, transparent 60%)",
            backgroundSize: "200% 100%",
          }}
          animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative z-10 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl flex items-center justify-center shadow-lg relative"
                animate={{ 
                  boxShadow: [
                    "0 10px 20px -5px rgba(139, 92, 246, 0.4)",
                    "0 15px 30px -5px rgba(139, 92, 246, 0.7)",
                    "0 10px 20px -5px rgba(139, 92, 246, 0.4)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Brain size={24} className="text-white" />
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </motion.div>
              <div>
                <h2 className="font-bold text-white text-lg flex items-center gap-2">
                  AI Predictions
                  <motion.span
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                  >
                    🤖
                  </motion.span>
                </h2>
                <div className="flex items-center gap-1.5">
                  <Activity size={10} className="text-green-400" />
                  <span className="text-purple-300/70 text-xs">Advanced AI Analysis</span>
                </div>
              </div>
            </div>

            {/* Live Badge with Users Online */}
            <div className="flex flex-col items-end gap-1">
              <motion.div 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full border border-green-500/40"
                animate={{ 
                  borderColor: isLive 
                    ? ["rgba(34, 197, 94, 0.4)", "rgba(34, 197, 94, 0.9)", "rgba(34, 197, 94, 0.4)"] 
                    : "rgba(34, 197, 94, 0.4)"
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <motion.div 
                  className="w-2 h-2 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-[10px] font-bold text-green-400">LIVE</span>
                <Zap size={10} className="text-yellow-400" />
              </motion.div>
              <motion.span 
                className="text-[9px] text-white/50"
                key={stats.usersOnline}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {stats.usersOnline}+ অনলাইন
              </motion.span>
            </div>
          </div>

          {/* Live Stats Grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <motion.div 
              className="bg-black/30 rounded-xl p-2.5 text-center backdrop-blur-sm border border-purple-500/20"
              whileHover={{ scale: 1.02 }}
            >
              <Target size={14} className="mx-auto text-green-400 mb-1" />
              <motion.p 
                className="text-green-300 text-sm font-bold"
                key={stats.accuracy}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
              >
                {stats.accuracy}%
              </motion.p>
              <p className="text-white/50 text-[8px] mt-0.5">অ্যাকুরেসি</p>
            </motion.div>

            <motion.div 
              className="bg-black/30 rounded-xl p-2.5 text-center backdrop-blur-sm border border-purple-500/20"
              whileHover={{ scale: 1.02 }}
            >
              <BarChart3 size={14} className="mx-auto text-cyan-400 mb-1" />
              <motion.p 
                className="text-cyan-300 text-sm font-bold"
                key={stats.todayPredictions}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
              >
                {stats.todayPredictions}
              </motion.p>
              <p className="text-white/50 text-[8px] mt-0.5">আজকের প্রেডিকশন</p>
            </motion.div>

            <motion.div 
              className="bg-black/30 rounded-xl p-2.5 text-center backdrop-blur-sm border border-purple-500/20"
              whileHover={{ scale: 1.02 }}
            >
              <TrendingUp size={14} className="mx-auto text-yellow-400 mb-1" />
              <motion.p 
                className="text-yellow-300 text-sm font-bold"
                key={stats.winRate}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
              >
                {stats.winRate}%
              </motion.p>
              <p className="text-white/50 text-[8px] mt-0.5">উইন রেট</p>
            </motion.div>

            <motion.div 
              className="bg-black/30 rounded-xl p-2.5 text-center backdrop-blur-sm border border-purple-500/20"
              whileHover={{ scale: 1.02 }}
            >
              <Sparkles size={14} className="mx-auto text-pink-400 mb-1" />
              <p className="text-pink-300 text-sm font-bold">FREE</p>
              <p className="text-white/50 text-[8px] mt-0.5">ফ্রি অ্যাক্সেস</p>
            </motion.div>
          </div>

          {/* Live Prediction Showcase */}
          <motion.div 
            className="bg-gradient-to-r from-purple-500/20 via-violet-500/15 to-indigo-500/20 rounded-xl p-3 mb-4 border border-purple-500/30"
            animate={{ 
              borderColor: pulseActive 
                ? ["rgba(139, 92, 246, 0.3)", "rgba(139, 92, 246, 0.6)", "rgba(139, 92, 246, 0.3)"]
                : "rgba(139, 92, 246, 0.3)"
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-[10px] flex items-center gap-1">
                <motion.div 
                  className="w-1.5 h-1.5 bg-green-500 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                লাইভ প্রেডিকশন
              </span>
              <span className="text-purple-300/60 text-[10px]">
                {new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <motion.div 
              className="flex items-center justify-between"
              key={currentPredictionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentPrediction.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{currentPrediction.game}</p>
                  <p className="text-purple-300/70 text-[10px]">Next Prediction</p>
                </div>
              </div>
              <div className="text-right">
                <motion.p 
                  className="text-green-400 font-bold text-base"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {currentPrediction.prediction}
                </motion.p>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-[9px] text-white/50">Confidence:</span>
                  <span className="text-[10px] text-yellow-400 font-semibold">{currentPrediction.confidence}%</span>
                  {currentPrediction.trend === "up" && (
                    <TrendingUp size={10} className="text-green-400" />
                  )}
                </div>
              </div>
            </motion.div>

            {/* Prediction Progress Dots */}
            <div className="flex justify-center gap-1 mt-2">
              {GAME_PREDICTIONS.map((_, idx) => (
                <motion.div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === currentPredictionIndex 
                      ? 'w-4 bg-purple-400' 
                      : 'w-1 bg-white/20'
                  }`}
                />
              ))}
            </div>
          </motion.div>

          {/* Supported Games */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {GAME_PREDICTIONS.slice(0, 5).map((game, idx) => (
                <motion.div
                  key={game.game}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    idx === currentPredictionIndex 
                      ? 'bg-purple-500/40 border border-purple-400/50' 
                      : 'bg-white/10'
                  }`}
                  animate={idx === currentPredictionIndex ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <span className="text-sm">{game.icon}</span>
                </motion.div>
              ))}
            </div>
            <span className="text-white/50 text-[10px]">সব গেম সাপোর্টেড</span>
          </div>

          {/* CTA Button */}
          <motion.div
            className="w-full bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 text-white font-bold text-base py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            <Brain size={18} className="relative z-10" />
            <span className="relative z-10">AI প্রেডিকশন দেখুন</span>
            <ArrowRight size={18} className="relative z-10" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default AIPredictionSection;
