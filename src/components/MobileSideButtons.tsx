import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { UserPlus, Bot } from "lucide-react";

const MobileSideButtons = () => {
  const navigate = useNavigate();
  const location = useLocation();
  if (location.pathname !== "/home") return null;
  return (
    <>
      <div className="absolute right-1 top-1/4 z-30 flex flex-col gap-2" style={{ pointerEvents: "none" }}>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/agent")} className="flex flex-col items-center clickable force-click" style={{ pointerEvents: "auto" }}>
          <div className="relative bg-gradient-to-l from-amber-500 via-yellow-500 to-orange-500 rounded-xl px-1.5 py-2 shadow-lg shadow-amber-500/30 border border-white/20">
            <UserPlus size={16} className="text-white mx-auto mb-1" />
            <span className="text-white text-[7px] font-bold" style={{ writingMode: "vertical-rl" }}>এজেন্ট</span>
          </div>
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/ai-chat")} className="flex flex-col items-center clickable force-click" style={{ pointerEvents: "auto" }}>
          <div className="relative bg-gradient-to-l from-cyan-500 via-blue-500 to-purple-600 rounded-xl px-1.5 py-2 shadow-lg shadow-cyan-500/30 border border-white/20">
            <Bot size={16} className="text-white mx-auto mb-1" />
            <span className="text-white text-[7px] font-bold" style={{ writingMode: "vertical-rl" }}>AI</span>
          </div>
        </motion.button>
      </div>
      <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/game/lucky-spinner")} className="absolute right-2 bottom-[200px] z-30 clickable force-click" style={{ pointerEvents: "auto" }}>
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 shadow-lg border-2 border-white/30 flex items-center justify-center text-2xl">🎰</div>
      </motion.button>
    </>
  );
};
export default MobileSideButtons;
