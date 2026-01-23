"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ModelSelector } from "./model-selector";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  selectedModelId,
  onModelChange,
  disabled = false,
  placeholder = "Type your message...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enter or Cmd/Ctrl+Enter sends the message
    if (e.key === "Enter" && (e.shiftKey || e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
    // Enter alone just creates a new line (default behavior)
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <ModelSelector
          selectedModelId={selectedModelId}
          onModelChange={onModelChange}
          disabled={disabled}
        />
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none resize-none overflow-hidden disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            "flex-1 min-h-[36px] max-h-[120px]"
          )}
        />
        <Button type="submit" disabled={disabled || !message.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
