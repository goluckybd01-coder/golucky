import { motionScrollBehavior } from "@/lib/reducedMotion";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle } from "lucide-react";

interface ChatMessage {
  id: string;
  playerName: string;
  avatar: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

interface AviatorChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

const avatarColors = [
  "from-red-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-emerald-500",
  "from-purple-500 to-violet-500",
  "from-orange-500 to-amber-500",
];

const playerNames = [
  "RocketMan", "LuckyAce", "BigWinner", "CashKing", "ProGamer",
  "HighRoller", "GoldMiner", "StarPlayer", "TopBet", "FastCash",
];

const chatMessages = [
  "Good luck everyone! 🍀",
  "Let's go! 🚀",
  "Who's betting big today?",
  "Just cashed out at 5x! 💰",
  "Waiting for the next round...",
  "This game is awesome!",
  "Almost got 10x last time 😅",
  "Anyone else playing from BD?",
  "Greetings from Dhaka! 🇧🇩",
  "Let's win together! 💪",
];

const generateRandomMessage = (): ChatMessage => ({
  id: Math.random().toString(36).substring(7),
  playerName: playerNames[Math.floor(Math.random() * playerNames.length)],
  avatar: avatarColors[Math.floor(Math.random() * avatarColors.length)],
  message: chatMessages[Math.floor(Math.random() * chatMessages.length)],
  timestamp: Date.now(),
});

const AviatorChatDrawer = ({ open, onClose }: AviatorChatDrawerProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const initialMessages = Array.from({ length: 5 }, generateRandomMessage);
    setMessages(initialMessages);
  }, []);
  
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        setMessages(prev => [...prev, generateRandomMessage()].slice(-50));
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [open]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: motionScrollBehavior() });
  }, [messages]);
  
  const handleSend = () => {
    if (!inputValue.trim()) return;
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      playerName: "You",
      avatar: "from-green-500 to-emerald-500",
      message: inputValue.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
  };
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 z-40" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-50 max-w-[420px] mx-auto">
            <div className="bg-[#1a1a1a] rounded-t-2xl overflow-hidden flex flex-col" style={{ height: "60vh" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#2ECC71]" />
                  <span className="text-white font-semibold">Live Chat</span>
                  <span className="bg-[#2ECC71]/20 text-[#2ECC71] text-xs px-2 py-0.5 rounded-full">{messages.length} online</span>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
                {messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-2 ${msg.playerName === "You" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${msg.avatar} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>{msg.playerName.charAt(0)}</div>
                    <div className={`max-w-[75%] ${msg.playerName === "You" ? "text-right" : ""}`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-medium ${msg.playerName === "You" ? "text-[#2ECC71]" : "text-gray-400"}`}>{msg.playerName}</span>
                        <span className="text-gray-600 text-[10px]">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div className={`rounded-xl px-3 py-2 text-sm ${msg.playerName === "You" ? "bg-[#2ECC71] text-white" : "bg-[#2d2d2d] text-gray-200"}`}>{msg.message}</div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-3 border-t border-gray-800">
                <div className="flex items-center gap-2">
                  <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Type a message..." className="flex-1 bg-[#2d2d2d] text-white placeholder-gray-500 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/50" />
                  <button onClick={handleSend} disabled={!inputValue.trim()} className="w-10 h-10 bg-[#2ECC71] rounded-full flex items-center justify-center hover:bg-[#27AE60] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Send className="w-5 h-5 text-white" /></button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AviatorChatDrawer;
