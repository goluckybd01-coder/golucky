import { useNavigate } from "react-router-dom";
import { TrendingUp, Zap, Crown, Play, Sparkles } from "lucide-react";

type GameBadge = "hot" | "trending" | "new" | "popular";

interface LotteryGameCardProps {
  id: string;
  name: string;
  displayName: string;
  description: string;
  gradient: string;
  route: string;
  badge?: GameBadge;
  colorLetters: { letter: string; color: string }[];
}

const Ultra3DTextLogo = ({ letters }: { letters: { letter: string; color: string }[] }) => {
  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute inset-0 blur-lg opacity-40 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-xl scale-110" />
      <div className="relative flex items-center" style={{ gap: '2px' }}>
        {letters.map((item, idx) => (
          <span
            key={idx}
            className="font-black text-[40px] relative inline-block select-none"
            style={{
              color: '#FFFFFF',
              WebkitTextStroke: '3px #000000',
              paintOrder: 'stroke fill',
              textShadow: `0 2px 0 ${item.color}, 0 3px 0 ${item.color}, 0 4px 0 ${item.color}cc, 0 5px 4px rgba(0,0,0,0.8), 0 8px 8px rgba(0,0,0,0.4)`,
              letterSpacing: '0.03em',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            <span 
              className="relative"
              style={{
                background: `linear-gradient(180deg, #FFFFFF 0%, ${item.color} 40%, ${item.color} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: `drop-shadow(0 0 2px ${item.color})`,
              }}
            >
              {item.letter}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

const LotteryGameCard = ({
  id, name, displayName, description, gradient, route, badge, colorLetters,
}: LotteryGameCardProps) => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(route)}
      className="group w-full rounded-2xl text-left text-white shadow-xl relative overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 clickable pointer-events-auto"
      style={{ minHeight: '130px' }}>
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} pointer-events-none noClick`} />
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none noClick" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20 pointer-events-none noClick" />
      <div className="absolute top-3 right-14 opacity-60 pointer-events-none noClick"><Sparkles size={14} className="text-white/80" /></div>
      <div className="absolute bottom-4 right-24 opacity-40 pointer-events-none noClick"><Sparkles size={10} className="text-white/60" /></div>
      {badge && (
        <div className="absolute top-2.5 left-3 z-20 pointer-events-none noClick">
          {badge === "hot" && <span className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full text-[10px] font-bold shadow-lg border border-white/20">🔥 HOT</span>}
          {badge === "trending" && <span className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-[10px] font-bold shadow-lg border border-white/20"><TrendingUp size={11} /> TOP</span>}
          {badge === "new" && <span className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-[10px] font-bold shadow-lg border border-white/20"><Zap size={11} /> NEW</span>}
          {badge === "popular" && <span className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full text-[10px] font-bold shadow-lg border border-white/20"><Crown size={11} /> VIP</span>}
        </div>
      )}
      <div className="flex justify-between items-center relative z-10 p-4 pointer-events-none">
        <div className="flex-1 pt-5">
          <p className="text-[11px] text-white/90 leading-tight drop-shadow line-clamp-2 max-w-[150px] font-medium">{description}</p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold bg-white/30 backdrop-blur-sm px-3.5 py-1.5 rounded-full w-fit shadow-inner border border-white/20">
            <Play size={11} className="fill-white" /><span>এখনই খেলুন</span>
          </div>
        </div>
        <div className="flex items-center justify-center pr-2"><Ultra3DTextLogo letters={colorLetters} /></div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none noClick" />
    </button>
  );
};

export const lotteryGamesData = [
  { id: "wingo", name: "wingo", displayName: "WINGO", description: "🎯 Green/Red/Violet সংখ্যা অনুমান করুন", gradient: "from-amber-500 via-orange-500 to-red-500", route: "/game/win-go", badge: "hot" as GameBadge, colorLetters: [{ letter: "W", color: "#FFFF00" },{ letter: "I", color: "#FF7700" },{ letter: "N", color: "#FF0044" },{ letter: "G", color: "#00FF88" },{ letter: "O", color: "#00FFFF" }] },
  { id: "k3", name: "k3", displayName: "K3", description: "🎲 Big/Small/Odd/Even ৩টি ডাইস গেম", gradient: "from-blue-500 via-indigo-500 to-purple-600", route: "/game/k3", badge: "trending" as GameBadge, colorLetters: [{ letter: "K", color: "#00FFFF" },{ letter: "3", color: "#FF00FF" }] },
  { id: "5d", name: "5d", displayName: "5D", description: "🎰 ৫ ডিজিট লটারি বড় জ্যাকপট জিতুন", gradient: "from-emerald-500 via-green-500 to-teal-600", route: "/game/5d", colorLetters: [{ letter: "5", color: "#00FF66" },{ letter: "D", color: "#FFFF00" }] },
  { id: "trxwin", name: "trxwin", displayName: "TRX", description: "💎 ক্রিপ্টো লটারি TRX দিয়ে খেলুন", gradient: "from-red-500 via-rose-500 to-pink-600", route: "/game/trx-win", badge: "new" as GameBadge, colorLetters: [{ letter: "T", color: "#FF0055" },{ letter: "R", color: "#FF8800" },{ letter: "X", color: "#FFFF00" }] },
  { id: "crash", name: "crash", displayName: "CRASH", description: "🚀 ক্র্যাশের আগে ক্যাশ আউট করুন!", gradient: "from-purple-500 via-violet-500 to-fuchsia-600", route: "/game/crash", badge: "hot" as GameBadge, colorLetters: [{ letter: "C", color: "#FF00FF" },{ letter: "R", color: "#AA00FF" },{ letter: "A", color: "#6600FF" },{ letter: "S", color: "#00FFFF" },{ letter: "H", color: "#00FF99" }] },
  { id: "mines", name: "mines", displayName: "MINES", description: "💎 মাইন এড়িয়ে জেমস খুঁজুন!", gradient: "from-yellow-500 via-amber-500 to-orange-600", route: "/game/mines", badge: "popular" as GameBadge, colorLetters: [{ letter: "M", color: "#FFFF00" },{ letter: "I", color: "#FFCC00" },{ letter: "N", color: "#FF9900" },{ letter: "E", color: "#FF6600" },{ letter: "S", color: "#FF3300" }] },
  { id: "aviator", name: "aviator", displayName: "AVIATOR", description: "✈️ প্লেন উড়ে যাওয়ার আগে ক্যাশ আউট!", gradient: "from-sky-500 via-blue-500 to-indigo-600", route: "/game/aviator", badge: "trending" as GameBadge, colorLetters: [{ letter: "A", color: "#00CCFF" },{ letter: "V", color: "#00FFFF" },{ letter: "I", color: "#00FFAA" },{ letter: "A", color: "#00FF66" },{ letter: "T", color: "#99FF00" },{ letter: "O", color: "#FFFF00" },{ letter: "R", color: "#FFAA00" }] },
];

export default LotteryGameCard;
