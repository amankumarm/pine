"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
      // Don't handle selection during streaming
      if (isStreaming) {
        setSelectedRange(null);
        setButtonPosition(null);
        return;
      }

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

        // Calculate button position just above the start of the selection
        // Use viewport coordinates directly for fixed positioning
        const clientRects = range.getClientRects();
        if (clientRects.length === 0) return;

        // Get the first rectangle (start of selection)
        const startRect = clientRects[0];

        // Position in viewport coordinates (for fixed positioning)
        // Button appears 32px above the selection start
        setButtonPosition({
          top: startRect.top - 40,
          left: startRect.left,
        });
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
  }, [role, isStreaming]);

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
        className={`rounded-lg px-4 py-2 text-foreground ${
          role === MessageRole.USER
            ? "inline-block max-w-[80%] bg-muted"
            : "block w-full"
        } ${isStreaming ? "pointer-events-none" : "select-text"}`}
        style={{
          userSelect: isStreaming
            ? "none"
            : role === MessageRole.ASSISTANT
            ? "text"
            : "auto",
          cursor: isStreaming ? "default" : undefined,
        }}
      >
        <div className="whitespace-pre-wrap break-words">{content}</div>
        {isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
        )}
      </div>
      {selectedRange &&
        buttonPosition &&
        role === MessageRole.ASSISTANT &&
        typeof document !== "undefined" &&
        createPortal(
          <button
            onClick={handleFollowUp}
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm shadow-lg hover:bg-primary/90 transition-colors whitespace-nowrap pointer-events-auto"
            style={{
              top: `${buttonPosition.top}px`,
              left: `${buttonPosition.left}px`,
              zIndex: 9999,
            }}
          >
            Ask a follow up
          </button>,
          document.body
        )}
    </div>
  );
}
