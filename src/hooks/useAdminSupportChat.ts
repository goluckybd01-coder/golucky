/**
 * Hook for admin-side support chat management
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_type: "user" | "support" | "system";
  message: string;
  attachment_url: string | null;
  created_at: string;
}

export interface SupportChat {
  id: string;
  user_id: string;
  chat_type: "user" | "agent_line";
  status: "open" | "in_progress" | "closed";
  priority: "normal" | "high";
  assigned_support_id: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  user_profile?: {
    username: string | null;
    display_user_id: string | null;
    vip_level: number;
  };
}

export interface SupportAgentStatus {
  id: string;
  user_id: string;
  is_online: boolean;
  active_chats: number;
  max_active_chats: number;
}

export interface ChatStats {
  open: number;
  inProgress: number;
  closed: number;
  myActive: number;
}

type StatusFilter = "all" | "open" | "in_progress" | "closed";
type TypeFilter = "all" | "user" | "agent_line";

export const useAdminSupportChat = () => {
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  
  const [activeChat, setActiveChat] = useState<SupportChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  const [agentStatus, setAgentStatus] = useState<SupportAgentStatus | null>(null);
  const [stats, setStats] = useState<ChatStats>({ open: 0, inProgress: 0, closed: 0, myActive: 0 });
  
  const [userId, setUserId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Load all chats with filters
  const loadChats = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("support_chats")
        .select(`
          *,
          profiles:user_id (
            username,
            display_user_id,
            vip_level
          )
        `)
        .order("priority", { ascending: false })
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (typeFilter !== "all") {
        query = query.eq("chat_type", typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedChats = (data || []).map((chat: any) => ({
        ...chat,
        user_profile: chat.profiles,
      }));

      setChats(formattedChats);

      // Calculate stats
      const allChatsQuery = await supabase
        .from("support_chats")
        .select("status, assigned_support_id");

      if (allChatsQuery.data) {
        const statsData = allChatsQuery.data.reduce(
          (acc, chat) => {
            if (chat.status === "open") acc.open++;
            if (chat.status === "in_progress") acc.inProgress++;
            if (chat.status === "closed") acc.closed++;
            if (chat.status === "in_progress" && chat.assigned_support_id === userId) {
              acc.myActive++;
            }
            return acc;
          },
          { open: 0, inProgress: 0, closed: 0, myActive: 0 }
        );
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error loading chats:", error);
      toast.error("Failed to load support chats");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter, userId]);

  // Load agent status
  const loadAgentStatus = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("support_agents")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      setAgentStatus(data);
    }
  }, [userId]);

  // Load messages for active chat
  const loadMessages = useCallback(async (chatId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    setMessages(data as ChatMessage[]);
  }, []);

  // Select a chat
  const selectChat = useCallback(async (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setActiveChat(chat);
      await loadMessages(chatId);
    }
  }, [chats, loadMessages]);

  // Take/claim a chat
  const takeChat = useCallback(async (chatId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase.rpc("take_support_chat", {
        p_chat_id: chatId,
      });

      if (error) throw error;

      toast.success("Chat claimed successfully");
      await loadChats();
      await loadAgentStatus();

      // Update active chat if it's the same one
      if (activeChat?.id === chatId) {
        const { data } = await supabase
          .from("support_chats")
          .select("*")
          .eq("id", chatId)
          .single();
        if (data) setActiveChat(data as SupportChat);
      }
    } catch (error: any) {
      console.error("Error taking chat:", error);
      toast.error(error.message || "Failed to claim chat");
    }
  }, [userId, loadChats, loadAgentStatus, activeChat]);

  // Close a chat
  const closeChat = useCallback(async (chatId: string, reason?: string) => {
    try {
      const { error } = await supabase.rpc("close_support_chat", {
        p_chat_id: chatId,
        p_reason: reason || "Resolved by support",
      });

      if (error) throw error;

      toast.success("Chat closed successfully");
      await loadChats();
      await loadAgentStatus();

      if (activeChat?.id === chatId) {
        setActiveChat(prev => prev ? { ...prev, status: "closed" } : null);
      }
    } catch (error: any) {
      console.error("Error closing chat:", error);
      toast.error(error.message || "Failed to close chat");
    }
  }, [loadChats, loadAgentStatus, activeChat]);

  // Send message as support
  const sendMessage = useCallback(async (content: string, attachmentUrl?: string) => {
    if (!activeChat || !userId || !content.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from("chat_messages")
        .insert({
          chat_id: activeChat.id,
          sender_id: userId,
          sender_type: "support",
          message: content.trim(),
          attachment_url: attachmentUrl || null,
        });

      if (error) throw error;

      // Update last_message_at
      await supabase
        .from("support_chats")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", activeChat.id);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  }, [activeChat, userId]);

  // Toggle agent online status
  const toggleOnline = useCallback(async () => {
    if (!userId) return;

    // Toggle the current status
    const newStatus = !(agentStatus?.is_online ?? false);

    try {
      const { data, error } = await supabase.rpc("toggle_support_agent_online", {
        p_is_online: newStatus,
      });

      if (error) throw error;

      await loadAgentStatus();
      toast.success(newStatus ? "You are now online" : "You are now offline");
    } catch (error: any) {
      console.error("Error toggling status:", error);
      toast.error(error.message || "Failed to toggle status");
    }
  }, [userId, loadAgentStatus, agentStatus]);

  // Initialize
  useEffect(() => {
    if (userId) {
      loadChats();
      loadAgentStatus();
    }
  }, [userId, loadChats, loadAgentStatus]);

  // Real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    channelRef.current = supabase
      .channel("admin-support-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_chats" },
        () => {
          loadChats();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          if (activeChat && newMessage.chat_id === activeChat.id) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
          // Refresh chat list for last_message_at update
          loadChats();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userId, activeChat, loadChats]);

  return {
    // Chat list
    chats,
    isLoading,
    statusFilter,
    typeFilter,
    setStatusFilter,
    setTypeFilter,
    
    // Active chat
    activeChat,
    messages,
    isSending,
    
    // Actions
    selectChat,
    takeChat,
    closeChat,
    sendMessage,
    refreshChats: loadChats,
    
    // Agent status
    agentStatus,
    toggleOnline,
    
    // Stats
    stats,
  };
};
