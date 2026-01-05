"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModelSelector } from "./model-selector";

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2 items-stretch">
        <ModelSelector
          selectedModelId={selectedModelId}
          onModelChange={onModelChange}
          disabled={disabled}
        />
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
        />
        <Button type="submit" disabled={disabled || !message.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
