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
  modelId: string;
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
  const [focusTarget, setFocusTarget] = useState<{
    id: string;
    timestamp: number;
  } | null>(null);

  const handleSendMessage = useCallback(
    async (windowId: string, content: string) => {
      let activeWindowId = windowId;

      // Check if this is a temporary window that needs to be created first
      if (windowId.startsWith("temp-")) {
        try {
          // Find the temp window data
          const tempWindow = windows.find((w) => w.id === windowId);
          if (!tempWindow) {
            throw new Error("Temporary window not found");
          }

          // Create the real window
          const createResponse = await fetch(
            `/api/boards/${board.id}/windows`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: tempWindow.title,
                positionX: tempWindow.positionX,
                positionY: tempWindow.positionY,
              }),
            }
          );

          if (!createResponse.ok) {
            throw new Error("Failed to create window");
          }

          const newWindow = await createResponse.json();
          activeWindowId = newWindow.id;

          // Update local state to replace temp ID with real ID
          setWindows((prev) =>
            prev.map((w) =>
              w.id === windowId ? { ...w, id: activeWindowId } : w
            )
          );
        } catch (error) {
          console.error("Error lazy creating window:", error);
          return;
        }
      }

      // Add user message optimistically
      const tempUserMessageId = `temp-user-${Date.now()}`;
      setWindows((prev) =>
        prev.map((w) =>
          w.id === activeWindowId
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
      setThinkingWindowId(activeWindowId);
      setStreamingWindowId(null); // Clear streaming state initially
      try {
        const response = await fetch(
          `/api/boards/${board.id}/windows/${activeWindowId}/messages`,
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
                    if (thinkingWindowId === activeWindowId) {
                      setThinkingWindowId(null);
                    }
                    // Set streaming state on first delta
                    if (!messageAdded) {
                      setStreamingWindowId(activeWindowId);
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
                          if (w.id !== activeWindowId) return w;

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
            w.id === activeWindowId
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
    [board.id, thinkingWindowId, windows]
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

  const handleWindowTitleChange = useCallback(
    async (windowId: string, newTitle: string) => {
      // Store previous title for potential revert
      let previousTitle: string | undefined;
      setWindows((prev) => {
        const window = prev.find((w) => w.id === windowId);
        previousTitle = window?.title;
        return prev.map((w) =>
          w.id === windowId ? { ...w, title: newTitle } : w
        );
      });

      // Skip API call for temporary windows (optimistic updates)
      if (windowId.startsWith("temp-")) {
        return;
      }

      try {
        const response = await fetch(
          `/api/boards/${board.id}/windows/${windowId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update window title");
        }
      } catch (error) {
        console.error("Error updating window title:", error);
        // Revert on error
        if (previousTitle !== undefined) {
          setWindows((prev) =>
            prev.map((w) =>
              w.id === windowId ? { ...w, title: previousTitle! } : w
            )
          );
        }
      }
    },
    [board.id]
  );

  const handleWindowModelChange = useCallback(
    async (windowId: string, modelId: string) => {
      // Store previous modelId for potential revert
      let previousModelId: string | undefined;
      setWindows((prev) => {
        const window = prev.find((w) => w.id === windowId);
        previousModelId = window?.modelId;
        return prev.map((w) => (w.id === windowId ? { ...w, modelId } : w));
      });

      // Skip API call for temporary windows (optimistic updates)
      if (windowId.startsWith("temp-")) {
        return;
      }

      try {
        const response = await fetch(
          `/api/boards/${board.id}/windows/${windowId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ modelId }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update window model");
        }
      } catch (error) {
        console.error("Error updating window model:", error);
        // Revert on error
        if (previousModelId !== undefined) {
          setWindows((prev) =>
            prev.map((w) =>
              w.id === windowId ? { ...w, modelId: previousModelId! } : w
            )
          );
        }
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

      const newPositionX = sourceWindow.positionX + 600; // Increased distance from parent
      const newPositionY = sourceWindow.positionY;

      try {
        // Create follow-up window and edge atomically via API
        const followUpResponse = await fetch(
          `/api/boards/${board.id}/follow-up`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceWindowId,
              sourceMessageId: messageId,
              selectedText,
              title: "Follow-up",
              positionX: newPositionX,
              positionY: newPositionY,
            }),
          }
        );

        if (!followUpResponse.ok) {
          throw new Error("Failed to create follow-up");
        }

        const result = await followUpResponse.json();
        const { window: newWindow, edge: newEdge } = result;

        // Update state directly with the new window and edge (no need to fetch entire board)
        setWindows((prev) => [
          ...prev,
          {
            id: newWindow.id,
            title: newWindow.title,
            positionX: newWindow.positionX,
            positionY: newWindow.positionY,
            modelId: newWindow.modelId,
            messages: [], // New window starts with no messages
          },
        ]);

        setEdges((prev) => [
          ...prev,
          {
            id: newEdge.id,
            sourceWindowId: newEdge.sourceWindowId,
            targetWindowId: newEdge.targetWindowId,
            selectedText: newEdge.selectedText,
            sourceMessageId: newEdge.sourceMessageId,
          },
        ]);
      } catch (error) {
        console.error("Error creating follow-up:", error);
      }
    },
    [board.id, windows]
  );

  const handleAddWindow = useCallback(async () => {
    // Calculate position for new window
    // Place it offset from existing windows or at a default position
    const defaultX = 250;
    const defaultY = 100;

    // Find a position that doesn't overlap with existing windows
    let newX = defaultX;
    let newY = defaultY;

    if (windows.length > 0) {
      // Find the rightmost window and place new one to its right
      const rightmostWindow = windows.reduce((prev, curr) =>
        curr.positionX > prev.positionX ? curr : prev
      );
      newX = rightmostWindow.positionX + 600;
      newY = rightmostWindow.positionY;
    }

    // Create optimistic window
    const tempWindowId = `temp-window-${Date.now()}`;
    const optimisticWindow: ChatWindow = {
      id: tempWindowId,
      title: "New Chat",
      positionX: newX,
      positionY: newY,
      modelId: "openai/gpt-4o",
      messages: [],
    };

    setFocusTarget({ id: tempWindowId, timestamp: Date.now() });
    setWindows((prev) => [...prev, optimisticWindow]);
  }, [windows]);

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
      onAddWindow={handleAddWindow}
      onWindowTitleChange={handleWindowTitleChange}
      onWindowModelChange={handleWindowModelChange}
      focusTarget={focusTarget}
    />
  );
}
