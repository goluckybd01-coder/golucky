import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, Send, Sparkles, Loader2, ArrowLeft, 
  Trash2, Mic, MicOff, Volume2, VolumeX,
  Lightbulb, HelpCircle, Gift, Gamepad2, Wallet, Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const suggestedTopics = [
  { icon: Gamepad2, label: "গেম খেলার নিয়ম", query: "WinGo, K3, এবং Crash গেম কিভাবে খেলতে হয় বিস্তারিত বলুন?" },
  { icon: Wallet, label: "ডিপোজিট ও উইথড্র", query: "কিভাবে টাকা জমা দিব এবং তুলব?" },
  { icon: Gift, label: "VIP পুরস্কার", query: "VIP লেভেল এবং পুরস্কার সম্পর্কে বলুন?" },
  { icon: Users, label: "রেফারেল প্রোগ্রাম", query: "রেফারেল বোনাস কিভাবে পাব?" },
  { icon: HelpCircle, label: "সাধারণ সাহায্য", query: "GoLucky সম্পর্কে সাধারণ তথ্য দিন" },
  { icon: Lightbulb, label: "গেমিং টিপস", query: "জেতার জন্য কিছু টিপস দিন?" },
];

const AIChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: "স্বাগতম GoLucky AI তে! 🍀✨\n\nআমি আপনার সহকারী। গেম, ডিপোজিট, উইথড্র, VIP, রেফারেল - যেকোনো প্রশ্ন করুন!\n\nনিচে কিছু জনপ্রিয় টপিক আছে, অথবা নিজে প্রশ্ন লিখুন।",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessages: Message[]) => {
    const apiMessages = userMessages.map(m => ({ role: m.role, content: m.content }));
    
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: apiMessages }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to get response");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && prev.length > 1) {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent, timestamp: new Date() }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async (customMessage?: string) => {
    const messageText = customMessage || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = { role: "user", content: messageText, timestamp: new Date() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat(newMessages.slice(1));
    } catch (error) {
      console.error("AI error:", error);
      toast.error(error instanceof Error ? error.message : "সমস্যা হয়েছে");
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "দুঃখিত, কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন! 🙏", timestamp: new Date() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      { 
        role: "assistant", 
        content: "চ্যাট ক্লিয়ার হয়েছে! 🍀 নতুন কোনো প্রশ্ন আছে?",
        timestamp: new Date()
      }
    ]);
    toast.success("চ্যাট ক্লিয়ার হয়েছে");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-gradient-to-r from-primary via-orange-500 to-amber-500 p-4 shadow-lg"
      >
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white flex items-center gap-1">
                  GoLucky AI
                  <Sparkles className="w-4 h-4" />
                </h1>
                <p className="text-xs text-white/80">সবসময় সাহায্যে প্রস্তুত</p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={clearChat}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </motion.header>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-2xl mx-auto space-y-4 pb-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  msg.role === "user" 
                    ? "bg-gradient-to-br from-blue-500 to-purple-600" 
                    : "bg-gradient-to-br from-primary to-amber-500"
                }`}>
                  {msg.role === "user" ? (
                    <span className="text-white text-sm font-bold">আ</span>
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-tr-md"
                      : "bg-gray-800 text-gray-100 rounded-tl-md border border-gray-700"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-white/60" : "text-gray-500"}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-gray-400">লিখছি...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6"
            >
              <p className="text-xs text-gray-500 mb-3 text-center">জনপ্রিয় টপিক</p>
              <div className="grid grid-cols-2 gap-2">
                {suggestedTopics.map((topic, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    onClick={() => handleSend(topic.query)}
                    className="flex items-center gap-2 p-3 rounded-xl bg-gray-800/50 border border-gray-700 hover:bg-gray-700/50 hover:border-primary/50 transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-amber-500/30 transition-colors">
                      <topic.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs text-gray-300 group-hover:text-white transition-colors">{topic.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky bottom-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 p-4"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="max-w-2xl mx-auto flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="আপনার প্রশ্ন লিখুন..."
            className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 rounded-full px-5 focus-visible:ring-primary"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 w-12 h-12"
            disabled={!input.trim() || isLoading}
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
        <p className="text-center text-[10px] text-gray-600 mt-2">
          GoLucky AI • Powered by Gemini
        </p>
      </motion.div>
    </div>
  );
};

export default AIChat;
