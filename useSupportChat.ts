/**
 * Hook for managing support chat state and real-time updates
 */

import { useState, useEffect, useCallback } from "react";
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
}

export const useSupportChat = (chatType: "user" | "agent_line" = "user") => {
  const [chat, setChat] = useState<SupportChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Find or create chat
  const initializeChat = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      // Check for existing open/in_progress chat
      const { data: existingChat, error: chatError } = await supabase
        .from("support_chats")
        .select("*")
        .eq("user_id", userId)
        .eq("chat_type", chatType)
        .in("status", ["open", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (chatError) throw chatError;

      if (existingChat) {
        setChat(existingChat as SupportChat);
        await loadMessages(existingChat.id);
      } else {
        // Create new chat
        const priority = chatType === "agent_line" ? "high" : "normal";
        const { data: newChat, error: createError } = await supabase
          .from("support_chats")
          .insert({
            user_id: userId,
            chat_type: chatType,
            priority: priority,
            status: "open",
          })
          .select()
          .single();

        if (createError) throw createError;
        setChat(newChat as SupportChat);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error initializing chat:", error);
      toast.error("Failed to initialize chat");
    } finally {
      setIsLoading(false);
    }
  }, [userId, chatType]);

  // Load messages for a chat
  const loadMessages = async (chatId: string) => {
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
  };

  // Send message
  const sendMessage = async (content: string, attachmentUrl?: string) => {
    if (!chat || !userId || !content.trim()) return;

    setIsSending(true);
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          chat_id: chat.id,
          sender_id: userId,
          sender_type: "user",
          message: content.trim(),
          attachment_url: attachmentUrl || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update last_message_at
      await supabase
        .from("support_chats")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", chat.id);

      // Message will be added via realtime subscription
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Close chat
  const closeChat = async () => {
    if (!chat) return;

    try {
      const { error } = await supabase.rpc("close_support_chat", {
        p_chat_id: chat.id,
        p_reason: "User closed chat",
      });

      if (error) throw error;

      setChat((prev) => prev ? { ...prev, status: "closed" } : null);
      toast.success("Chat closed");
    } catch (error) {
      console.error("Error closing chat:", error);
      toast.error("Failed to close chat");
    }
  };

  // Initialize chat when user is available
  useEffect(() => {
    if (userId) {
      initializeChat();
    }
  }, [userId, initializeChat]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!chat?.id) return;

    const channel = supabase
      .channel(`chat-messages-${chat.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_id=eq.${chat.id}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chat?.id]);

  // Real-time subscription for chat status updates
  useEffect(() => {
    if (!chat?.id) return;

    const channel = supabase
      .channel(`chat-status-${chat.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "support_chats",
          filter: `id=eq.${chat.id}`,
        },
        (payload) => {
          const updatedChat = payload.new as SupportChat;
          setChat(updatedChat);

          if (updatedChat.status === "in_progress" && !chat.assigned_support_id) {
            toast.success("An agent has joined your chat!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chat?.id, chat?.assigned_support_id]);

  return {
    chat,
    messages,
    isLoading,
    isSending,
    sendMessage,
    closeChat,
    initializeChat,
  };
};
