"use client";

import { useEffect, useRef } from "react";
import { ProductCard } from "./ProductCard";
import type { ChatMessage } from "@/types/chat";
import { Loader2 } from "lucide-react";

interface ChatMessagesProps {
  messages: ChatMessage[];
  streamingContent: string;
  isStreaming: boolean;
}

export function ChatMessages({
  messages,
  streamingContent,
  isStreaming,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div
      className="flex-1 overflow-y-auto p-4"
      role="log"
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id || index}
            className={`flex animate-fade-in ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
            style={{
              animation: "fadeIn 150ms ease-in",
            }}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>

              {/* Render product cards if available in metadata */}
              {message.metadata?.products &&
                message.metadata.products.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {message.metadata.products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}

              <p className="mt-1 text-xs opacity-60">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <div className="flex animate-fade-in justify-start">
            <div className="max-w-[80%] rounded-lg bg-gray-100 px-4 py-2 text-gray-900">
              <p className="whitespace-pre-wrap text-sm">{streamingContent}</p>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isStreaming && !streamingContent && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-gray-100 px-4 py-2">
              <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
