"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { ChatButton } from "./ChatButton";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { X, Plus } from "lucide-react";
import { useAuthSession } from "@/hooks/queries/useAuth";
import { supabase } from "@/lib/supabase/client";
import type { ChatMessage } from "@/types/chat";

export function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  const chatButtonRef = useRef<HTMLButtonElement>(null);
  const { data: authSession } = useAuthSession();

  // Hide chat widget on dashboard pages
  const isDashboardPage = pathname?.startsWith("/dashboard");
  if (isDashboardPage) {
    return null;
  }

  // Handle Escape key to close chat
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        // Return focus to chat button
        setTimeout(() => {
          chatButtonRef.current?.focus();
        }, 100);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Initialize sessionId on mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem("chat_session_id");
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      // Generate new UUID for session
      const newSessionId = crypto.randomUUID();
      localStorage.setItem("chat_session_id", newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  // Load conversation history when sessionId is available
  useEffect(() => {
    if (!sessionId) return;

    const loadConversationHistory = async () => {
      try {
        // Find existing conversation for this session
        const { data: conversations } = await supabase
          .from("chat_conversations")
          .select("id")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (conversations && conversations.length > 0) {
          const convId = conversations[0].id;
          setConversationId(convId);

          // Load messages for this conversation
          const { data: messagesData } = await supabase
            .from("chat_messages")
            .select("*")
            .eq("conversation_id", convId)
            .order("created_at", { ascending: true });

          if (messagesData) {
            setMessages(
              messagesData.map((msg) => ({
                id: msg.id,
                conversationId: msg.conversation_id,
                role: msg.role as "user" | "assistant" | "system",
                content: msg.content,
                metadata: msg.metadata,
                createdAt: msg.created_at,
              }))
            );
          }
        }
      } catch (error) {
        console.error("Error loading conversation history:", error);
      }
    };

    loadConversationHistory();
  }, [sessionId]);

  // Link guest session to user on authentication
  useEffect(() => {
    if (!authSession?.isAuthenticated || !sessionId || !conversationId) return;

    const linkSessionToUser = async () => {
      try {
        await supabase
          .from("chat_conversations")
          .update({ user_id: authSession.user.id })
          .eq("id", conversationId)
          .eq("session_id", sessionId);
      } catch (error) {
        console.error("Error linking session to user:", error);
      }
    };

    linkSessionToUser();
  }, [authSession, sessionId, conversationId]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = useCallback(
    async (message: string) => {
      if (!sessionId || isStreaming) return;

      setIsStreaming(true);
      setStreamingContent("");

      // Add user message to UI immediately
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        conversationId: conversationId || "",
        role: "user",
        content: message,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            conversationId,
            sessionId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to send message");
        }

        // Get conversation ID from response headers
        const newConversationId = response.headers.get("X-Conversation-Id");
        if (newConversationId && !conversationId) {
          setConversationId(newConversationId);
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            // AI SDK text stream format - just accumulate the text directly
            accumulatedContent += chunk;
            setStreamingContent(accumulatedContent);
          }
        }

        // Add assistant message to UI
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          conversationId: newConversationId || conversationId || "",
          role: "assistant",
          content: accumulatedContent,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error: any) {
        console.error("Error sending message:", error);

        // Show error message to user
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          conversationId: conversationId || "",
          role: "assistant",
          content:
            error.message ||
            "I'm having trouble connecting right now. Please try again in a moment.",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
      }
    },
    [sessionId, conversationId, isStreaming]
  );

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setStreamingContent("");
  };

  return (
    <>
      <ChatButton ref={chatButtonRef} onClick={toggleOpen} isOpen={isOpen} />

      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 flex h-[600px] w-[400px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl transition-all duration-200 ease-in-out"
          style={{
            animation: "slideUp 200ms ease-out",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-black px-4 py-3 text-white">
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Shopping Assistant
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={startNewConversation}
                aria-label="Start new conversation"
                className="rounded p-1 transition-colors hover:bg-white/20"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={toggleOpen}
                aria-label="Close chat"
                className="rounded p-1 transition-colors hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <ChatMessages
            messages={messages}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
          />

          {/* Input */}
          <ChatInput onSend={sendMessage} disabled={isStreaming} />
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
