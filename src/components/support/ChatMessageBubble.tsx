import { motion } from "framer-motion";
import { format } from "date-fns";
import { Check, CheckCheck, Headphones, User } from "lucide-react";
import type { ChatMessage } from "@/hooks/useSupportChat";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

const ChatMessageBubble = ({ message, isOwn }: ChatMessageBubbleProps) => {
  const isSystem = message.sender_type === "system";

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center my-3"
      >
        <div className="px-4 py-2 bg-white/5 rounded-full text-white/50 text-xs">
          {message.message}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isOwn
            ? "bg-gradient-to-br from-green-500 to-emerald-600"
            : "bg-gradient-to-br from-purple-500 to-pink-500"
        }`}
      >
        {isOwn ? (
          <User size={14} className="text-white" />
        ) : (
          <Headphones size={14} className="text-white" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[75%] ${
          isOwn
            ? "bg-gradient-to-br from-green-600 to-emerald-700"
            : "bg-white/10 border border-white/10"
        } rounded-2xl px-4 py-2.5 ${
          isOwn ? "rounded-br-md" : "rounded-bl-md"
        }`}
      >
        {/* Attachment preview */}
        {message.attachment_url && (
          <div className="mb-2">
            <img
              src={message.attachment_url}
              alt="Attachment"
              className="max-w-full rounded-lg"
            />
          </div>
        )}

        {/* Message text */}
        <p className="text-white text-sm leading-relaxed break-words">
          {message.message}
        </p>

        {/* Timestamp & status */}
        <div
          className={`flex items-center gap-1 mt-1 ${
            isOwn ? "justify-end" : "justify-start"
          }`}
        >
          <span className="text-[10px] text-white/40">
            {format(new Date(message.created_at), "HH:mm")}
          </span>
          {isOwn && (
            <CheckCheck size={12} className="text-white/40" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessageBubble;
