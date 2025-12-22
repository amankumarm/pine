"use client";

import { useState, useRef, useEffect } from "react";
import { MessageRole } from "@prisma/client";

interface ChatMessageProps {
  id: string;
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
  onTextSelect?: (
    selectedText: string,
    messageId: string,
    range: Range
  ) => void;
}

export function ChatMessage({
  id,
  role,
  content,
  isStreaming = false,
  onTextSelect,
}: ChatMessageProps) {
  const messageRef = useRef<HTMLDivElement>(null);
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [buttonPosition, setButtonPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setSelectedRange(null);
        setButtonPosition(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const isWithinMessage = messageRef.current?.contains(
        range.commonAncestorContainer
      );

      if (
        isWithinMessage &&
        role === MessageRole.ASSISTANT &&
        !range.collapsed
      ) {
        setSelectedRange(range.cloneRange());

        // Calculate button position just above the first character of selection
        // Use getClientRects() to get individual line rectangles, then use the first one
        const clientRects = range.getClientRects();
        const messageRect = messageRef.current?.getBoundingClientRect();

        if (messageRect && clientRects.length > 0) {
          // Get the first rectangle which represents the start of the selection
          const startRect = clientRects[0];

          // Get the message bubble container (the inner div with the background)
          const messageBubble = messageRef.current?.querySelector(
            ".inline-block"
          ) as HTMLElement;
          const bubbleRect = messageBubble?.getBoundingClientRect();

          if (bubbleRect) {
            // Calculate position relative to the message container
            setButtonPosition({
              top: startRect.top - bubbleRect.top - 32, // Just above (button height ~28px + 4px gap)
              left: startRect.left - bubbleRect.left, // Align with first character
            });
          } else {
            // Fallback to messageRef if bubble not found
            setButtonPosition({
              top: startRect.top - messageRect.top - 32,
              left: startRect.left - messageRect.left,
            });
          }
        }
      } else {
        setSelectedRange(null);
        setButtonPosition(null);
      }
    };

    // Use mouseup to capture selection after user finishes selecting
    const handleMouseUp = () => {
      setTimeout(handleSelection, 10);
    };

    document.addEventListener("selectionchange", handleSelection);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("selectionchange", handleSelection);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [role]);

  const handleFollowUp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (selectedRange && onTextSelect) {
      const selectedText = selectedRange.toString().trim();
      if (selectedText) {
        onTextSelect(selectedText, id, selectedRange);
        window.getSelection()?.removeAllRanges();
        setSelectedRange(null);
        setButtonPosition(null);
      }
    }
  };

  // Prevent ReactFlow from interfering with text selection
  const handleMouseDown = (e: React.MouseEvent) => {
    if (role === MessageRole.ASSISTANT) {
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={messageRef}
      className={`mb-3 text-sm relative ${
        role === MessageRole.USER ? "text-right" : "text-left"
      }`}
      onMouseDown={handleMouseDown}
    >
      <div
        className={`inline-block max-w-[80%] rounded-lg px-4 py-2 select-text ${
          role === MessageRole.USER
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
        style={{ userSelect: role === MessageRole.ASSISTANT ? "text" : "auto" }}
      >
        <div className="whitespace-pre-wrap break-words">{content}</div>
        {isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
        )}
      </div>
      {selectedRange && buttonPosition && role === MessageRole.ASSISTANT && (
        <button
          onClick={handleFollowUp}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm shadow-lg hover:bg-primary/90 transition-colors z-50 whitespace-nowrap"
          style={{
            top: `${buttonPosition.top}px`,
            left: `${Math.max(0, Math.min(buttonPosition.left, 300))}px`, // Prevent going too far right (max ~300px for button width)
          }}
        >
          Ask a follow up
        </button>
      )}
    </div>
  );
}
