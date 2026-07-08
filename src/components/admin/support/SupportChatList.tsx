import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  MessageCircle,
  Clock,
  CheckCircle,
  Headphones,
  Users,
  AlertCircle,
  Filter,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { SupportChat } from "@/hooks/useAdminSupportChat";

interface SupportChatListProps {
  chats: SupportChat[];
  isLoading: boolean;
  activeChat: SupportChat | null;
  statusFilter: string;
  typeFilter: string;
  onStatusFilterChange: (filter: "all" | "open" | "in_progress" | "closed") => void;
  onTypeFilterChange: (filter: "all" | "user" | "agent_line") => void;
  onSelectChat: (chatId: string) => void;
}

const STATUS_CONFIG = {
  open: {
    icon: Clock,
    color: "text-yellow-400",
    bg: "bg-yellow-500",
  },
  in_progress: {
    icon: MessageCircle,
    color: "text-blue-400",
    bg: "bg-blue-500",
  },
  closed: {
    icon: CheckCircle,
    color: "text-gray-400",
    bg: "bg-gray-500",
  },
};

export const SupportChatList = ({
  chats,
  isLoading,
  activeChat,
  statusFilter,
  typeFilter,
  onStatusFilterChange,
  onTypeFilterChange,
  onSelectChat,
}: SupportChatListProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-800">
        <Tabs value={typeFilter} onValueChange={(v) => onTypeFilterChange(v as any)}>
          <TabsList className="w-full bg-gray-800/50">
            <TabsTrigger value="all" className="flex-1 text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="user" className="flex-1 text-xs">
              <Users className="h-3 w-3 mr-1" />
              Users
            </TabsTrigger>
            <TabsTrigger value="agent_line" className="flex-1 text-xs">
              <Headphones className="h-3 w-3 mr-1" />
              Agent Line
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="p-3 border-b border-gray-800 flex gap-2 flex-wrap">
        {["all", "open", "in_progress", "closed"].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => onStatusFilterChange(status as any)}
            className={cn(
              "text-xs h-7",
              statusFilter === status
                ? "bg-teal-500 hover:bg-teal-600 text-white"
                : "border-gray-700 text-gray-400 hover:text-white"
            )}
          >
            {status === "all" ? "All" : status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <MessageCircle className="h-8 w-8 mb-2" />
            <p>No chats found</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            <AnimatePresence>
              {chats.map((chat, index) => {
                const statusConfig = STATUS_CONFIG[chat.status];
                const StatusIcon = statusConfig.icon;
                const isActive = activeChat?.id === chat.id;
                const isHighPriority = chat.priority === "high" || chat.chat_type === "agent_line";

                return (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => onSelectChat(chat.id)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all duration-200 border",
                      isActive
                        ? "bg-teal-500/20 border-teal-500/30"
                        : "bg-gray-800/30 border-transparent hover:bg-gray-800/60 hover:border-gray-700",
                      isHighPriority && !isActive && "border-orange-500/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 pt-0.5">
                        <span className={cn("w-2.5 h-2.5 rounded-full", statusConfig.bg)} />
                        {isHighPriority && (
                          <AlertCircle className="h-3.5 w-3.5 text-orange-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white text-sm truncate">
                            {chat.user_profile?.display_user_id || chat.user_profile?.username || "User"}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              chat.chat_type === "agent_line"
                                ? "text-orange-400 border-orange-500/30"
                                : "text-gray-400 border-gray-600"
                            )}
                          >
                            {chat.chat_type === "agent_line" ? "Agent" : "User"}
                          </Badge>
                          {chat.user_profile?.vip_level && chat.user_profile.vip_level > 0 && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5 py-0">
                              VIP{chat.user_profile.vip_level}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <StatusIcon className={cn("h-3 w-3", statusConfig.color)} />
                          <span className="text-xs text-gray-500">
                            {chat.last_message_at
                              ? formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: true })
                              : formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
