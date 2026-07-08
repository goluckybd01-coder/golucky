import { motionScrollBehavior } from "@/lib/reducedMotion";
 import { useEffect, useRef, useState } from "react";
 import { AnimatePresence } from "framer-motion";
 import { useNavigate, useSearchParams } from "react-router-dom";
 import { Loader2 } from "lucide-react";
 import { useSupportChat } from "@/hooks/useSupportChat";
 import { useAIChat } from "@/hooks/useAIChat";
 import ChatMessageBubble from "@/components/support/ChatMessageBubble";
 import AIChatBubble from "@/components/support/AIChatBubble";
 import ChatStatusBar from "@/components/support/ChatStatusBar";
 import ChatInput from "@/components/support/ChatInput";
 import SupportBackground from "@/components/support/SupportBackground";
 import SupportHeader from "@/components/support/SupportHeader";
 import ChatModeSelector from "@/components/support/ChatModeSelector";
 import EmptyChat from "@/components/support/EmptyChat";
 import { supabase } from "@/integrations/supabase/client";
 
 const SupportChat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chatType = searchParams.get("type") === "agent" ? "agent_line" : "user";
 
   // Chat mode state
   const [chatMode, setChatMode] = useState<"ai" | "human">("ai");
 
   // Human support chat
   const { 
     chat, 
     messages: humanMessages, 
     isLoading: isHumanLoading, 
     isSending: isHumanSending, 
     sendMessage: sendHumanMessage, 
     closeChat, 
     initializeChat 
   } = useSupportChat(chatType);
 
   // AI chat
   const { 
     messages: aiMessages, 
     isLoading: isAILoading, 
     sendMessage: sendAIMessage, 
     clearMessages: clearAIMessages 
   } = useAIChat();
 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: motionScrollBehavior() });
   }, [humanMessages, aiMessages]);

   const handleSend = async (content: string) => {
     if (chatMode === "ai") {
       await sendAIMessage(content);
     } else {
       sendHumanMessage(content);
     }
  };

  const handleClose = async () => {
    await closeChat();
    navigate(-1);
  };

  const handleNewChat = async () => {
    await initializeChat();
    setShowMenu(false);
  };

   const handleQuickAction = (action: string) => {
     handleSend(action);
   };
 
   const handleModeChange = (mode: "ai" | "human") => {
     setChatMode(mode);
   };
 
  return (
     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden">
       {/* Background */}
       <SupportBackground />

       {/* Header */}
       <SupportHeader
         chatType={chatType}
         chat={chat}
         showMenu={showMenu}
         onBack={() => navigate(-1)}
         onMenuToggle={() => setShowMenu(!showMenu)}
         onNewChat={handleNewChat}
         onClose={handleClose}
       />

       {/* Chat Mode Selector */}
       <ChatModeSelector 
         mode={chatMode} 
         onModeChange={handleModeChange}
         isAgentAvailable={chat?.status === "in_progress"}
       />
 
       {/* Status bar (only for human chat) */}
       {chatMode === "human" && (
         <div className="px-4 py-2">
        <ChatStatusBar chat={chat} />
         </div>
       )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
         {chatMode === "human" && isHumanLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          </div>
         ) : chatMode === "ai" && aiMessages.length === 0 ? (
           <EmptyChat mode="ai" onQuickAction={handleQuickAction} />
         ) : chatMode === "human" && humanMessages.length === 0 ? (
           <EmptyChat mode="human" onQuickAction={handleQuickAction} />
         ) : chatMode === "ai" ? (
          <AnimatePresence mode="popLayout">
             {aiMessages.map((msg) => (
               <AIChatBubble
                 key={msg.id}
                 message={msg.content}
                 isUser={msg.isUser}
                 timestamp={msg.timestamp}
              />
            ))}
             {isAILoading && (
               <AIChatBubble
                 message=""
                 isUser={false}
                 timestamp={new Date()}
                 isTyping
               />
             )}
           </AnimatePresence>
         ) : (
           <AnimatePresence mode="popLayout">
             {humanMessages.map((msg) => (
               <ChatMessageBubble
                 key={msg.id}
                 message={msg}
                 isOwn={msg.sender_id === currentUserId}
               />
             ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="relative z-10 p-4 pb-6 bg-gradient-to-t from-slate-900 to-transparent">
        <ChatInput
          onSend={handleSend}
           isSending={chatMode === "ai" ? isAILoading : isHumanSending}
           disabled={chatMode === "human" && chat?.status === "closed"}
        />
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default SupportChat;
