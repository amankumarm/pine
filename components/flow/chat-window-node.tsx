"use client";

import { memo, useEffect, useRef } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { MessageRole } from "@prisma/client";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

interface ChatWindowNodeData {
  windowId: string;
  title: string;
  messages: Message[];
  isStreaming?: boolean;
  isThinking?: boolean;
  onSendMessage: (windowId: string, content: string) => Promise<void>;
  onTextSelect: (
    selectedText: string,
    messageId: string,
    windowId: string,
    range: Range
  ) => void;
}

function ChatWindowNode({ data }: NodeProps<ChatWindowNodeData>) {
  const {
    windowId,
    title,
    messages,
    isStreaming = false,
    isThinking = false,
    onSendMessage,
    onTextSelect,
  } = data;

  const handleSend = async (content: string) => {
    await onSendMessage(windowId, content);
  };

  const handleTextSelect = (
    selectedText: string,
    messageId: string,
    range: Range
  ) => {
    onTextSelect(selectedText, messageId, windowId, range);
  };

  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const contentElement = contentRef.current;
    const inputElement = inputRef.current;

    const handleWheel = (e: WheelEvent) => {
      // Prevent ReactFlow from zooming when scrolling inside the chat content
      e.stopPropagation();
    };

    if (contentElement) {
      contentElement.addEventListener("wheel", handleWheel, { passive: false });
    }
    if (inputElement) {
      inputElement.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (contentElement) {
        contentElement.removeEventListener("wheel", handleWheel);
      }
      if (inputElement) {
        inputElement.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging when clicking inside content area
    e.stopPropagation();
  };

  return (
    <div className="bg-background border-2 border-border rounded-lg shadow-lg min-w-[400px] max-w-[500px]">
      <Handle type="target" position={Position.Left} />
      <div className="p-4 border-b border-border cursor-move" data-handle>
        <h5 className="font-[550] text-sm">{title}</h5>
      </div>
      <div
        ref={contentRef}
        className="p-4 max-h-[500px] overflow-y-auto"
        onMouseDown={handleMouseDown}
      >
        {messages.length === 0 ? (
          <div className="text-muted-foreground text-sm text-center py-8">
            Start a conversation...
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                id={message.id}
                role={message.role}
                content={message.content}
                isStreaming={
                  isStreaming &&
                  index === messages.length - 1 &&
                  message.role === MessageRole.ASSISTANT
                }
                onTextSelect={handleTextSelect}
              />
            ))}
            {isThinking && (
              <div className="mb-3 text-left">
                <div className="inline-block max-w-[80%] rounded-lg px-4 py-2 bg-muted text-foreground">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div
        ref={inputRef}
        className="p-4 border-t border-border"
        onMouseDown={handleMouseDown}
      >
        <ChatInput
          onSend={handleSend}
          disabled={isStreaming || isThinking}
          placeholder="Type your message..."
        />
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(ChatWindowNode);
