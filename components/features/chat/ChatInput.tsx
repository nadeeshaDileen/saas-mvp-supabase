"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 96); // Max 4 lines (~24px per line)
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = disabled || message.trim().length === 0;
  const isOverLimit = message.length > 500;

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <label htmlFor="chat-input" className="sr-only">
        Type your message
      </label>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Ask me anything about our products..."
            rows={1}
            className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-100 disabled:cursor-not-allowed"
            style={{
              minHeight: "40px",
              maxHeight: "96px",
            }}
          />
          {isOverLimit && (
            <p className="mt-1 text-xs text-red-600">
              Character limit exceeded ({message.length}/500)
            </p>
          )}
        </div>
        <button
          onClick={handleSend}
          disabled={isDisabled || isOverLimit}
          aria-label="Send message"
          className="flex h-10 w-10 items-center justify-center rounded-md bg-black text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
