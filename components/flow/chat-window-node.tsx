"use client";

import { memo, useEffect, useRef, useState } from "react";
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
  modelId: string;
  isStreaming?: boolean;
  isThinking?: boolean;
  onSendMessage: (windowId: string, content: string) => Promise<void>;
  onTextSelect: (
    selectedText: string,
    messageId: string,
    windowId: string,
    range: Range
  ) => void;
  onTitleChange?: (windowId: string, newTitle: string) => Promise<void>;
  onModelChange?: (windowId: string, modelId: string) => Promise<void>;
}

function ChatWindowNode({ data }: NodeProps<ChatWindowNodeData>) {
  const {
    windowId,
    title,
    messages,
    modelId,
    isStreaming = false,
    isThinking = false,
    onSendMessage,
    onTextSelect,
    onTitleChange,
    onModelChange,
  } = data;

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedTitle(title);
  }, [title]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleSend = async (content: string) => {
    await onSendMessage(windowId, content);
  };

  const handleModelChange = async (newModelId: string) => {
    if (onModelChange) {
      await onModelChange(windowId, newModelId);
    }
  };

  const handleTextSelect = (
    selectedText: string,
    messageId: string,
    range: Range
  ) => {
    onTextSelect(selectedText, messageId, windowId, range);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditingTitle(true);
  };

  const handleTitleSave = async () => {
    const trimmedTitle = editedTitle.trim();
    if (trimmedTitle && trimmedTitle !== title && onTitleChange) {
      await onTitleChange(windowId, trimmedTitle);
    } else if (!trimmedTitle) {
      setEditedTitle(title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle(title);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleTitleCancel();
    }
  };

  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const contentElement = contentRef.current;
    const inputElement = inputRef.current;

    const handleWheel = (e: WheelEvent) => {
      // Pinch-to-zoom and Ctrl+scroll set ctrlKey on wheel events
      if (e.ctrlKey) {
        // Prevent browser's native zoom
        e.preventDefault();
        // Let event bubble to ReactFlow for canvas zoom
        return;
      }

      // Normal scroll - stop propagation to prevent ReactFlow zoom
      // Content scrolls naturally
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
    <div className="bg-background border-2 border-border rounded-lg shadow-lg min-w-[500px] max-w-[500px] min-h-[500px] max-h-[800px] flex flex-col group">
      <Handle type="target" position={Position.Left} />
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 cursor-move" data-handle>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="w-full font-[550] text-sm bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : (
              <h5 className="font-[550] text-sm">{title}</h5>
            )}
          </div>
          {!isEditingTitle && onTitleChange && (
            <button
              onClick={handleEditClick}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted shrink-0"
              title="Edit title"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div
        ref={contentRef}
        className="p-4 overflow-y-auto flex-1 h-0"
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
        className="p-4 border-t border-border shrink-0"
        onMouseDown={handleMouseDown}
      >
        <ChatInput
          onSend={handleSend}
          selectedModelId={modelId}
          onModelChange={handleModelChange}
          disabled={isStreaming || isThinking}
          placeholder="Type your message..."
        />
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(ChatWindowNode);
