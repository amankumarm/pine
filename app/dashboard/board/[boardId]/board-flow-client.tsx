"use client";

import { useState, useCallback } from "react";
import { flushSync } from "react-dom";
import { BoardFlow } from "@/components/flow/board-flow";
import { MessageRole } from "@prisma/client";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date | string;
}

interface ChatWindow {
  id: string;
  title: string;
  positionX: number;
  positionY: number;
  messages: Message[];
}

interface EdgeData {
  id: string;
  sourceWindowId: string;
  targetWindowId: string;
  selectedText: string;
  sourceMessageId: string;
}

interface Board {
  id: string;
  name: string;
  description: string | null;
  chatWindows: ChatWindow[];
  edges: EdgeData[];
}

interface BoardFlowClientProps {
  board: Board;
}

export function BoardFlowClient({ board }: BoardFlowClientProps) {
  const [windows, setWindows] = useState<ChatWindow[]>(board.chatWindows);
  const [edges, setEdges] = useState<EdgeData[]>(board.edges);
  const [streamingWindowId, setStreamingWindowId] = useState<string | null>(
    null
  );
  const [thinkingWindowId, setThinkingWindowId] = useState<string | null>(null);

  const handleSendMessage = useCallback(
    async (windowId: string, content: string) => {
      // Add user message optimistically
      const tempUserMessageId = `temp-user-${Date.now()}`;
      setWindows((prev) =>
        prev.map((w) =>
          w.id === windowId
            ? {
                ...w,
                messages: [
                  ...w.messages,
                  {
                    id: tempUserMessageId,
                    role: MessageRole.USER,
                    content,
                    createdAt: new Date(),
                  },
                ],
              }
            : w
        )
      );

      // Set thinking state - waiting for response to start
      setThinkingWindowId(windowId);
      setStreamingWindowId(null); // Clear streaming state initially
      try {
        const response = await fetch(
          `/api/boards/${board.id}/windows/${windowId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantMessageId = "";
        let fullContent = "";
        let messageAdded = false;

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.delta) {
                    // Clear thinking state when first delta arrives and start streaming
                    if (thinkingWindowId === windowId) {
                      setThinkingWindowId(null);
                    }
                    // Set streaming state on first delta
                    if (!messageAdded) {
                      setStreamingWindowId(windowId);
                      messageAdded = true;
                    }

                    fullContent += data.delta;
                    assistantMessageId = data.messageId;

                    // Ensure we have the messageId before updating
                    if (!assistantMessageId) {
                      continue;
                    }

                    // Update message content in real-time
                    // Use flushSync to force immediate DOM update for streaming
                    flushSync(() => {
                      setWindows((prev) => {
                        return prev.map((w) => {
                          if (w.id !== windowId) return w;

                          const existingMessageIndex = w.messages.findIndex(
                            (m) => m.id === assistantMessageId
                          );

                          if (existingMessageIndex >= 0) {
                            // Update existing message
                            const newMessages = [...w.messages];
                            newMessages[existingMessageIndex] = {
                              ...newMessages[existingMessageIndex],
                              content: fullContent,
                            };
                            return { ...w, messages: newMessages };
                          } else {
                            // Add new message
                            return {
                              ...w,
                              messages: [
                                ...w.messages,
                                {
                                  id: assistantMessageId,
                                  role: MessageRole.ASSISTANT,
                                  content: fullContent,
                                  createdAt: new Date(),
                                },
                              ],
                            };
                          }
                        });
                      });
                    });
                  }
                  if (data.done) {
                    setStreamingWindowId(null);
                    setThinkingWindowId(null);
                    // Small delay before final refresh to ensure UI has updated
                    setTimeout(async () => {
                      const boardResponse = await fetch(
                        `/api/boards/${board.id}`
                      );
                      if (boardResponse.ok) {
                        const updatedBoard = await boardResponse.json();
                        setWindows(updatedBoard.chatWindows);
                        setEdges(updatedBoard.edges);
                      }
                    }, 100);
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setStreamingWindowId(null);
        setThinkingWindowId(null);
        // Remove optimistic user message on error
        setWindows((prev) =>
          prev.map((w) =>
            w.id === windowId
              ? {
                  ...w,
                  messages: w.messages.filter(
                    (m) => m.id !== tempUserMessageId
                  ),
                }
              : w
          )
        );
      }
    },
    [board.id, thinkingWindowId]
  );

  const handleWindowPositionChange = useCallback(
    async (windowId: string, x: number, y: number) => {
      // Update local state optimistically first
      setWindows((prev) =>
        prev.map((w) =>
          w.id === windowId ? { ...w, positionX: x, positionY: y } : w
        )
      );

      // Skip API call for temporary windows (optimistic updates)
      if (windowId.startsWith("temp-")) {
        return;
      }

      try {
        await fetch(`/api/boards/${board.id}/windows/${windowId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ positionX: x, positionY: y }),
        });
      } catch (error) {
        console.error("Error updating window position:", error);
        // Revert on error - could fetch from server or keep optimistic update
      }
    },
    [board.id]
  );

  const handleTextSelect = useCallback(
    async (
      selectedText: string,
      messageId: string,
      sourceWindowId: string,
      range: Range
    ) => {
      // Get source window to find its position
      const sourceWindow = windows.find((w) => w.id === sourceWindowId);
      if (!sourceWindow) return;

      // Create optimistic window and edge immediately
      const tempWindowId = `temp-window-${Date.now()}`;
      const tempEdgeId = `temp-edge-${Date.now()}`;
      const newPositionX = sourceWindow.positionX + 600; // Increased distance from parent
      const newPositionY = sourceWindow.positionY;

      const optimisticWindow: ChatWindow = {
        id: tempWindowId,
        title: "Follow-up",
        positionX: newPositionX,
        positionY: newPositionY,
        messages: [],
      };

      const optimisticEdge: EdgeData = {
        id: tempEdgeId,
        sourceWindowId,
        targetWindowId: tempWindowId,
        selectedText,
        sourceMessageId: messageId,
      };

      // Add optimistic window and edge immediately
      setWindows((prev) => [...prev, optimisticWindow]);
      setEdges((prev) => [...prev, optimisticEdge]);

      try {
        // Create new window via API
        const newWindowResponse = await fetch(
          `/api/boards/${board.id}/windows`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "Follow-up",
              positionX: newPositionX,
              positionY: newPositionY,
            }),
          }
        );

        if (!newWindowResponse.ok) {
          throw new Error("Failed to create window");
        }

        const newWindow = await newWindowResponse.json();

        // Create edge via API
        const edgeResponse = await fetch(`/api/boards/${board.id}/edges`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceWindowId,
            targetWindowId: newWindow.id,
            selectedText,
            sourceMessageId: messageId,
          }),
        });

        if (!edgeResponse.ok) {
          throw new Error("Failed to create edge");
        }

        // Refresh board data to get real IDs and sync with server
        const boardResponse = await fetch(`/api/boards/${board.id}`);
        if (boardResponse.ok) {
          const updatedBoard = await boardResponse.json();
          setWindows(updatedBoard.chatWindows);
          setEdges(updatedBoard.edges);
        }
      } catch (error) {
        console.error("Error creating follow-up:", error);
        // Remove optimistic window and edge on error
        setWindows((prev) => prev.filter((w) => w.id !== tempWindowId));
        setEdges((prev) => prev.filter((e) => e.id !== tempEdgeId));
      }
    },
    [board.id, windows]
  );

  return (
    <BoardFlow
      boardId={board.id}
      windows={windows}
      edges={edges}
      streamingWindowId={streamingWindowId}
      thinkingWindowId={thinkingWindowId}
      onSendMessage={handleSendMessage}
      onWindowPositionChange={handleWindowPositionChange}
      onTextSelect={handleTextSelect}
    />
  );
}
