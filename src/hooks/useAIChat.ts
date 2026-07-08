 import { useState, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 
 export interface AIMessage {
   id: string;
   content: string;
   isUser: boolean;
   timestamp: Date;
 }
 
 export const useAIChat = () => {
   const [messages, setMessages] = useState<AIMessage[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   const sendMessage = useCallback(async (content: string) => {
     if (!content.trim()) return;
 
     // Add user message
     const userMessage: AIMessage = {
       id: `user-${Date.now()}`,
       content: content.trim(),
       isUser: true,
       timestamp: new Date(),
     };
     
     setMessages(prev => [...prev, userMessage]);
     setIsLoading(true);
     setError(null);
 
     try {
       // Prepare messages for API
       const apiMessages = [...messages, userMessage].map(m => ({
         role: m.isUser ? "user" : "assistant",
         content: m.content,
       }));
 
       const { data, error: fnError } = await supabase.functions.invoke("ai-chat", {
         body: { messages: apiMessages },
       });
 
       if (fnError) throw fnError;
 
       // Handle streaming response
       if (data && typeof data === "object" && "error" in data) {
         throw new Error(data.error);
       }
 
       // Parse streaming response
       let aiResponse = "";
       
       if (typeof data === "string") {
         // Parse SSE format
         const lines = data.split("\n");
         for (const line of lines) {
           if (line.startsWith("data: ")) {
             const jsonStr = line.slice(6);
             if (jsonStr === "[DONE]") continue;
             try {
               const parsed = JSON.parse(jsonStr);
               const content = parsed.choices?.[0]?.delta?.content;
               if (content) aiResponse += content;
             } catch {
               // Skip unparseable lines
             }
           }
         }
       }
 
       if (aiResponse) {
         const aiMessage: AIMessage = {
           id: `ai-${Date.now()}`,
           content: aiResponse,
           isUser: false,
           timestamp: new Date(),
         };
         setMessages(prev => [...prev, aiMessage]);
       }
     } catch (err: any) {
       console.error("AI Chat Error:", err);
       setError(err.message || "Failed to get AI response");
       
       // Add error message
       const errorMessage: AIMessage = {
         id: `error-${Date.now()}`,
         content: "Sorry, I couldn't process your request. Please try again or connect with a live agent.",
         isUser: false,
         timestamp: new Date(),
       };
       setMessages(prev => [...prev, errorMessage]);
     } finally {
       setIsLoading(false);
     }
   }, [messages]);
 
   const clearMessages = useCallback(() => {
     setMessages([]);
     setError(null);
   }, []);
 
   return {
     messages,
     isLoading,
     error,
     sendMessage,
     clearMessages,
   };
 };
