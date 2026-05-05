"use client";

import { forwardRef } from "react";
import { MessageCircle } from "lucide-react";

interface ChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const ChatButton = forwardRef<HTMLButtonElement, ChatButtonProps>(
  ({ onClick, isOpen }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        aria-label="Open shopping assistant"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background transition-transform duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2"
        style={{
          backgroundColor: "black",
          color: "white",
        }}
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }
);

ChatButton.displayName = "ChatButton";
