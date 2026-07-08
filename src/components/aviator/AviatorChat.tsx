import { motionScrollBehavior } from "@/lib/reducedMotion";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Smile } from "lucide-react";
import type { RoundPhase } from "@/pages/games/AviatorGame";

interface ChatMessage {
  id: string;
  playerName: string;
  avatar: string;
  message: string;
  isReaction?: boolean;
  timestamp: number;
}

interface AviatorChatProps {
  phase: RoundPhase;
  multiplier: number;
  crashPoint: number;
}

const playerNames = [
  "RocketMan", "LuckyAce", "BigWinner", "CashKing", "ProGamer",
  "HighRoller", "GoldMiner", "StarPlayer", "TopBet", "FastCash",
  "BetMaster", "WinStreak", "CoinFlip", "JackpotJoe", "AcePlayer",
  "ক্যাশকিং", "বাজিরাজ", "লাকিস্টার", "বিগউইন", "গেমার১০১",
];

const avatarColors = [
  "from-red-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-emerald-500",
  "from-purple-500 to-violet-500",
  "from-orange-500 to-amber-500",
  "from-teal-500 to-green-500",
];

const waitingMessages = [
  "Let's go! 🚀",
  "Big bet coming!",
  "Feeling lucky today",
  "5x incoming! 💰",
  "Who else is betting?",
  "Good luck everyone!",
  "Ready to fly! ✈️",
  "Waiting for takeoff...",
  "All in this round! 🎯",
  "Ez money 💵",
  "Let's get this bread",
  "বড় জয় আসছে! 🎉",
  "আজ ভাগ্যবান দিন",
];

const runningMessages = [
  "GO GO GO! 🚀",
  "Hold hold hold!",
  "Don't crash yet!",
  "Keep flying! ✈️",
  "Almost there!",
  "Higher! Higher!",
  "I'm still in! 😅",
  "Cashing out soon...",
  "Should I cashout? 🤔",
  "Moon shot! 🌙",
  "উড়তে থাকো! 🚀",
];

const cashoutMessages = [
  "Cashed out! 💰",
  "Got it! Nice win!",
  "Easy money 💵",
  "Safe win secured",
  "That was close!",
  "Small profit > big loss",
  "জিতে গেছি! 🎉",
];

const crashMessages = [
  "Nooooo! 😭",
  "RIP my bet",
  "So close!",
  "Crashed too early!",
  "I knew it! 😤",
  "Why didn't I cash out?!",
  "F in chat",
  "Again? Really?",
  "Next round is mine!",
  "হায় হায়! 😢",
  "আবার হারলাম!",
];

const reactions = ["🚀", "💰", "🔥", "😱", "💪", "🎯", "🌙", "😭", "👀", "🤑", "⚡", "❤️"];

const generateRandomMessage = (messages: string[]): ChatMessage => ({
  id: Math.random().toString(36).substring(7),
  playerName: playerNames[Math.floor(Math.random() * playerNames.length)],
  avatar: avatarColors[Math.floor(Math.random() * avatarColors.length)],
  message: messages[Math.floor(Math.random() * messages.length)],
  isReaction: false,
  timestamp: Date.now(),
});

const generateReaction = (): ChatMessage => ({
  id: Math.random().toString(36).substring(7),
  playerName: playerNames[Math.floor(Math.random() * playerNames.length)],
  avatar: avatarColors[Math.floor(Math.random() * avatarColors.length)],
  message: reactions[Math.floor(Math.random() * reactions.length)],
  isReaction: true,
  timestamp: Date.now(),
});

const AviatorChat = ({ phase, multiplier, crashPoint }: AviatorChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevPhaseRef = useRef<RoundPhase>(phase);
  const prevMultiplierRef = useRef<number>(1);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: motionScrollBehavior() });
  }, [messages]);

  useEffect(() => {
    if (phase === "WAITING") {
      const interval = setInterval(() => {
        if (Math.random() > 0.6) {
          setMessages(prev => [...prev, generateRandomMessage(waitingMessages)].slice(-30));
        }
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "RUNNING") {
      const interval = setInterval(() => {
        if (Math.random() > 0.5) {
          if (multiplier > 2 && Math.random() > 0.5) {
            setMessages(prev => [...prev, generateReaction()].slice(-30));
          } else if (Math.random() > 0.4) {
            setMessages(prev => [...prev, generateRandomMessage(runningMessages)].slice(-30));
          }
        }
      }, 800);
      return () => clearInterval(interval);
    }
  }, [phase, multiplier]);

  useEffect(() => {
    if (phase === "RUNNING" && multiplier - prevMultiplierRef.current > 0.5) {
      if (Math.random() > 0.6) {
        setMessages(prev => [...prev, generateRandomMessage(cashoutMessages)].slice(-30));
      }
    }
    prevMultiplierRef.current = multiplier;
  }, [multiplier, phase]);

  useEffect(() => {
    if (phase === "CRASHED" && prevPhaseRef.current === "RUNNING") {
      const burstCount = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < burstCount; i++) {
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            Math.random() > 0.5 ? generateRandomMessage(crashMessages) : generateReaction()
          ].slice(-30));
        }, i * 200);
      }
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      playerName: "You",
      avatar: "from-yellow-500 to-amber-500",
      message: inputValue.trim(),
      isReaction: false,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage].slice(-30));
    setInputValue("");
  };

  const handleQuickReaction = (emoji: string) => {
    const userReaction: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      playerName: "You",
      avatar: "from-yellow-500 to-amber-500",
      message: emoji,
      isReaction: true,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userReaction].slice(-30));
  };

  return (
    <div className="bg-[#1a1a1a] rounded-xl mx-2 mt-2 overflow-hidden border border-gray-800">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-white">Live Chat</span>
          <span className="px-1.5 py-0.5 bg-green-600 rounded-full text-[10px] text-white">
            {messages.length > 0 ? "LIVE" : "0"}
          </span>
        </div>
        <span className="text-gray-500 text-xs">{isExpanded ? "▼" : "▲"}</span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }}>
            <div className="h-32 overflow-y-auto p-2 space-y-1 scrollbar-hide">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, x: -20, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }} className="flex items-start gap-2">
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${msg.avatar} flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white`}>{msg.playerName.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      {msg.isReaction ? (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-xs truncate">{msg.playerName}</span>
                          <span className="text-lg">{msg.message}</span>
                        </div>
                      ) : (
                        <div>
                          <span className={`text-xs font-medium ${msg.playerName === "You" ? "text-yellow-400" : "text-gray-400"}`}>{msg.playerName}</span>
                          <span className="text-gray-300 text-xs ml-1.5">{msg.message}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
              {messages.length === 0 && <div className="text-center text-gray-500 text-xs py-4">Chat is quiet... say something!</div>}
            </div>
            <div className="flex gap-1 px-2 py-1 border-t border-gray-800/50 overflow-x-auto scrollbar-hide">
              {["🚀", "💰", "🔥", "😭", "👀", "❤️"].map((emoji) => (
                <button key={emoji} onClick={() => handleQuickReaction(emoji)} className="w-7 h-7 flex items-center justify-center hover:bg-gray-700 rounded transition-colors text-sm">{emoji}</button>
              ))}
            </div>
            <div className="flex gap-2 p-2 border-t border-gray-800">
              <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Say something..." className="flex-1 bg-[#2a2a2a] rounded-full px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500" maxLength={100} />
              <button onClick={handleSend} disabled={!inputValue.trim()} className="w-8 h-8 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors">
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AviatorChat;
