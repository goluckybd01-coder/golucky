import { motion } from "framer-motion";
import { Clock, Headphones, MessageCircle, CheckCircle2 } from "lucide-react";
import type { SupportChat } from "@/hooks/useSupportChat";

interface ChatStatusBarProps {
  chat: SupportChat | null;
}

const ChatStatusBar = ({ chat }: ChatStatusBarProps) => {
  if (!chat) return null;

  const getStatusConfig = () => {
    switch (chat.status) {
      case "open":
        return {
          icon: Clock,
          label: "Waiting for agent",
          sublabel: "Usually responds in ~2 min",
          color: "from-amber-500 to-orange-500",
          pulseColor: "bg-amber-500",
        };
      case "in_progress":
        return {
          icon: Headphones,
          label: "Agent connected",
          sublabel: "Chat in progress",
          color: "from-green-500 to-emerald-500",
          pulseColor: "bg-green-500",
        };
      case "closed":
        return {
          icon: CheckCircle2,
          label: "Chat closed",
          sublabel: "Thank you for contacting us",
          color: "from-gray-500 to-gray-600",
          pulseColor: "bg-gray-500",
        };
      default:
        return {
          icon: MessageCircle,
          label: "Support Chat",
          sublabel: "",
          color: "from-purple-500 to-pink-500",
          pulseColor: "bg-purple-500",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-4"
    >
      {/* Animated background gradient */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${config.color} opacity-10`}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 flex items-center gap-4">
        {/* Status icon with pulse */}
        <div className="relative">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}
          >
            <Icon size={22} className="text-white" />
          </div>
          {chat.status !== "closed" && (
            <motion.div
              className={`absolute -top-0.5 -right-0.5 w-3 h-3 ${config.pulseColor} rounded-full`}
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>

        {/* Status text */}
        <div className="flex-1">
          <p className="text-white font-semibold">{config.label}</p>
          <p className="text-white/50 text-xs">{config.sublabel}</p>
        </div>

        {/* Priority badge for agent_line */}
        {chat.chat_type === "agent_line" && chat.priority === "high" && (
          <div className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full">
            <span className="text-white text-xs font-bold">PRIORITY</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatStatusBar;
