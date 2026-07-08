import { motionScrollBehavior } from "@/lib/reducedMotion";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Send,
  User,
  Headphones,
  Hand,
  XCircle,
  Loader2,
  MessageSquare,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { SupportChat, ChatMessage } from "@/hooks/useAdminSupportChat";

interface SupportChatPanelProps {
  chat: SupportChat | null;
  messages: ChatMessage[];
  isSending: boolean;
  currentUserId: string | null;
  onTakeChat: (chatId: string) => void;
  onCloseChat: (chatId: string, reason?: string) => void;
  onSendMessage: (content: string) => void;
}

const quickReplies = [
  "Hello! How can I help you today?",
  "I'm looking into this for you now.",
  "Is there anything else I can help with?",
  "Your issue has been resolved.",
];

export const SupportChatPanel = ({
  chat,
  messages,
  isSending,
  currentUserId,
  onTakeChat,
  onCloseChat,
  onSendMessage,
}: SupportChatPanelProps) => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: motionScrollBehavior() });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || isSending) return;
    onSendMessage(message);
    setMessage("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chat) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8">
        <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Select a chat</p>
        <p className="text-sm text-gray-600">Choose a conversation from the list to view messages</p>
      </div>
    );
  }

  const isAssignedToMe = chat.assigned_support_id === currentUserId;
  const canRespond = chat.status !== "closed" && isAssignedToMe;
  const canTake = chat.status === "open";

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">
                  {chat.user_profile?.display_user_id || chat.user_profile?.username || "User"}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    chat.status === "open"
                      ? "text-yellow-400 border-yellow-500/30"
                      : chat.status === "in_progress"
                      ? "text-blue-400 border-blue-500/30"
                      : "text-gray-400 border-gray-600"
                  )}
                >
                  {chat.status === "in_progress" ? "In Progress" : chat.status.charAt(0).toUpperCase() + chat.status.slice(1)}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                Started {format(new Date(chat.created_at), "MMM d, yyyy 'at' HH:mm")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canTake && (
              <Button onClick={() => onTakeChat(chat.id)} className="bg-green-600 hover:bg-green-700 text-white">
                <Hand className="h-4 w-4 mr-2" />
                Take Chat
              </Button>
            )}
            {chat.status !== "closed" && isAssignedToMe && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                    <XCircle className="h-4 w-4 mr-2" />
                    Close
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-900 border-gray-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Close this chat?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      This will mark the conversation as resolved. The user can start a new chat if needed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onCloseChat(chat.id, "Resolved by support")} className="bg-red-600 hover:bg-red-700">
                      Close Chat
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((msg) => {
              const isSystem = msg.sender_type === "system";
              const isSupport = msg.sender_type === "support";
              if (isSystem) {
                return (
                  <motion.div key={msg.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center">
                    <div className="px-4 py-2 bg-gray-800/50 rounded-full text-gray-500 text-xs">{msg.message}</div>
                  </motion.div>
                );
              }
              return (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex items-end gap-2", isSupport && "flex-row-reverse")}>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", isSupport ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-gradient-to-br from-teal-500 to-emerald-600")}>
                    {isSupport ? <Headphones size={14} className="text-white" /> : <User size={14} className="text-white" />}
                  </div>
                  <div className={cn("max-w-[70%] rounded-2xl px-4 py-2.5", isSupport ? "bg-gradient-to-br from-purple-600 to-pink-600 rounded-br-md" : "bg-gray-800 border border-gray-700 rounded-bl-md")}>
                    {msg.attachment_url && <div className="mb-2"><img src={msg.attachment_url} alt="Attachment" className="max-w-full rounded-lg" /></div>}
                    <p className="text-white text-sm leading-relaxed">{msg.message}</p>
                    <p className="text-[10px] text-white/40 mt-1">{format(new Date(msg.created_at), "HH:mm")}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      {chat.status === "closed" ? (
        <div className="p-4 border-t border-gray-800 bg-gray-900/50 text-center"><p className="text-gray-500 text-sm">This chat has been closed</p></div>
      ) : !isAssignedToMe ? (
        <div className="p-4 border-t border-gray-800 bg-yellow-500/10 text-center">
          <div className="flex items-center justify-center gap-2 text-yellow-400"><Clock className="h-4 w-4" /><span className="text-sm">Take this chat to respond</span><ArrowRight className="h-4 w-4" /></div>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-800 space-y-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {quickReplies.map((reply) => (
              <button key={reply} onClick={() => setMessage(reply)} className="flex-shrink-0 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full text-gray-400 text-xs hover:bg-gray-700 hover:text-white transition-colors">{reply}</button>
            ))}
          </div>
          <div className="flex items-end gap-2 bg-gray-800 border border-gray-700 rounded-xl p-2">
            <textarea ref={inputRef} value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type your message..." rows={1} className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm resize-none outline-none py-2 px-2 max-h-24" style={{ minHeight: "40px" }} />
            <Button onClick={handleSend} disabled={!message.trim() || isSending} className={cn("h-10 w-10 rounded-lg p-0", message.trim() ? "bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700" : "bg-gray-700")}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className={cn("h-4 w-4", message.trim() ? "text-white" : "text-gray-500")} />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
