import { useState, useRef, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, Smile, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string, attachmentUrl?: string) => void;
  isSending: boolean;
  disabled?: boolean;
}

const quickReplies = [
  "Hi, I need help",
  "Deposit issue",
  "Withdrawal pending",
  "Bonus not credited",
];

const ChatInput = ({ onSend, isSending, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!message.trim() || isSending || disabled) return;
    onSend(message);
    setMessage("");
    setShowQuickReplies(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (reply: string) => {
    setMessage(reply);
    setShowQuickReplies(false);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      {/* Quick replies */}
      {showQuickReplies && !disabled && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
        >
          {quickReplies.map((reply) => (
            <motion.button
              key={reply}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleQuickReply(reply)}
              className="flex-shrink-0 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/70 text-sm hover:bg-white/10 transition-colors"
            >
              {reply}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Input area */}
      <div className="relative flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl p-2">
        {/* Attachment button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={disabled}
          className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white/70 disabled:opacity-50 transition-colors"
        >
          <Paperclip size={20} />
        </motion.button>

        {/* Text input */}
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Chat is closed" : "Type your message..."}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-white placeholder-white/40 text-sm resize-none outline-none py-2.5 max-h-24 disabled:opacity-50"
          style={{ minHeight: "40px" }}
        />

        {/* Emoji button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={disabled}
          className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white/70 disabled:opacity-50 transition-colors"
        >
          <Smile size={20} />
        </motion.button>

        {/* Send button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={!message.trim() || isSending || disabled}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            message.trim() && !disabled
              ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/30"
              : "bg-white/10"
          }`}
        >
          {isSending ? (
            <Loader2 size={18} className="text-white animate-spin" />
          ) : (
            <Send
              size={18}
              className={message.trim() && !disabled ? "text-white" : "text-white/40"}
            />
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default ChatInput;
