import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Headphones, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSupportChat } from "@/hooks/useAdminSupportChat";
import { SupportAgentStatus } from "@/components/admin/support/SupportAgentStatus";
import { SupportChatStats } from "@/components/admin/support/SupportChatStats";
import { SupportChatList } from "@/components/admin/support/SupportChatList";
import { SupportChatPanel } from "@/components/admin/support/SupportChatPanel";
import { format } from "date-fns";

export const SupportInboxModule = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const {
    chats,
    isLoading,
    statusFilter,
    typeFilter,
    setStatusFilter,
    setTypeFilter,
    activeChat,
    messages,
    isSending,
    selectChat,
    takeChat,
    closeChat,
    sendMessage,
    refreshChats,
    agentStatus,
    toggleOnline,
    stats,
  } = useAdminSupportChat();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Headphones className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Support Inbox</h1>
            <p className="text-sm text-gray-400">Manage and respond to user chat tickets</p>
          </div>
        </div>
        <Button variant="outline" onClick={refreshChats} className="border-gray-700 text-gray-400 hover:text-white">
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>
      <SupportChatStats stats={stats} />
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-300px)] min-h-[500px]">
        <Card className="col-span-4 bg-gray-900/50 border-gray-800 flex flex-col overflow-hidden">
          <SupportAgentStatus agentStatus={agentStatus} onToggle={toggleOnline} />
          <SupportChatList chats={chats} isLoading={isLoading} activeChat={activeChat} statusFilter={statusFilter} typeFilter={typeFilter} onStatusFilterChange={setStatusFilter} onTypeFilterChange={setTypeFilter} onSelectChat={selectChat} />
        </Card>
        <Card className="col-span-5 bg-gray-900/50 border-gray-800 flex flex-col overflow-hidden">
          <SupportChatPanel chat={activeChat} messages={messages} isSending={isSending} currentUserId={currentUserId} onTakeChat={takeChat} onCloseChat={closeChat} onSendMessage={sendMessage} />
        </Card>
        <Card className="col-span-3 bg-gray-900/50 border-gray-800 p-4 overflow-auto">
          {activeChat ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-white">User Details</h3>
              <Separator className="bg-gray-800" />
              <div className="space-y-3">
                <div><p className="text-xs text-gray-500">User ID</p><p className="text-sm text-white font-mono">{activeChat.user_profile?.display_user_id || "N/A"}</p></div>
                <div><p className="text-xs text-gray-500">Username</p><p className="text-sm text-white">{activeChat.user_profile?.username || "No username"}</p></div>
                <div><p className="text-xs text-gray-500">VIP Level</p><p className="text-sm text-yellow-400">VIP {activeChat.user_profile?.vip_level || 0}</p></div>
                <Separator className="bg-gray-800" />
                <div><p className="text-xs text-gray-500">Chat Type</p><p className="text-sm text-white capitalize">{activeChat.chat_type === "agent_line" ? "Agent Line (Priority)" : "User Support"}</p></div>
                <div><p className="text-xs text-gray-500">Priority</p><p className={`text-sm ${activeChat.priority === "high" ? "text-orange-400" : "text-gray-400"}`}>{activeChat.priority === "high" ? "High" : "Normal"}</p></div>
                <div><p className="text-xs text-gray-500">Created</p><p className="text-sm text-gray-300">{format(new Date(activeChat.created_at), "MMM d, yyyy HH:mm")}</p></div>
                {activeChat.last_message_at && (
                  <div><p className="text-xs text-gray-500">Last Activity</p><p className="text-sm text-gray-300">{format(new Date(activeChat.last_message_at), "MMM d, yyyy HH:mm")}</p></div>
                )}
                <Separator className="bg-gray-800" />
                <Button variant="outline" size="sm" className="w-full border-gray-700 text-gray-400 hover:text-white" onClick={() => window.open(`/admin/user-history?userId=${activeChat.user_id}`, "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" /> View User History
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500"><p className="text-sm">Select a chat to view user details</p></div>
          )}
        </Card>
      </div>
    </div>
  );
};
