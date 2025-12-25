"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeTypes,
  BackgroundVariant,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import ChatWindowNode from "./chat-window-node";
import { MessageRole } from "@prisma/client";
import { AllChatsDrawer } from "./all-chats-drawer";
import { Plus } from "lucide-react";

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

interface BoardFlowProps {
  boardId: string;
  windows: ChatWindow[];
  edges: EdgeData[];
  streamingWindowId?: string | null;
  thinkingWindowId?: string | null;
  onSendMessage: (windowId: string, content: string) => Promise<void>;
  onWindowPositionChange: (
    windowId: string,
    x: number,
    y: number
  ) => Promise<void>;
  onTextSelect: (
    selectedText: string,
    messageId: string,
    sourceWindowId: string,
    range: Range
  ) => Promise<void>;
  onAddWindow: () => Promise<void>;
  onWindowTitleChange?: (windowId: string, newTitle: string) => Promise<void>;
  focusTarget?: { id: string; timestamp: number } | null;
}

const nodeTypes: NodeTypes = {
  chatWindow: ChatWindowNode,
};

export function BoardFlow({
  boardId,
  windows,
  edges,
  streamingWindowId = null,
  thinkingWindowId = null,
  onSendMessage,
  onWindowPositionChange,
  onTextSelect,
  onAddWindow,
  onWindowTitleChange,
  focusTarget,
}: BoardFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const lastDraggedPosition = useRef<Map<string, { x: number; y: number }>>(
    new Map()
  );
  // Track initial positions and descendants for tree dragging
  const dragStartPositions = useRef<Map<string, { x: number; y: number }>>(
    new Map()
  );
  const draggingDescendants = useRef<string[]>([]);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const lastFocusTimestamp = useRef<number>(0);

  // Calculate parent nodes (windows with no incoming edges)
  const parentWindows = useMemo(() => {
    return windows.filter(
      (window) => !edges.some((edge) => edge.targetWindowId === window.id)
    );
  }, [windows, edges]);

  const handleChatClick = useCallback((windowId: string) => {
    if (reactFlowInstance.current) {
      const node = reactFlowInstance.current.getNode(windowId);
      if (node) {
        reactFlowInstance.current.fitView({
          nodes: [node],
          padding: 0.2,
          duration: 300,
        });
      }
    }
  }, []);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  // Helper to find all descendants of a node
  const getDescendants = useCallback(
    (nodeId: string, visited: Set<string> = new Set()): string[] => {
      if (visited.has(nodeId)) return [];
      visited.add(nodeId);

      const descendants: string[] = [];
      // Find all edges where this node is the source
      for (const edge of edges) {
        if (edge.sourceWindowId === nodeId) {
          descendants.push(edge.targetWindowId);
          descendants.push(...getDescendants(edge.targetWindowId, visited));
        }
      }
      return descendants;
    },
    [edges]
  );

  // Convert windows to nodes
  useEffect(() => {
    setNodes((currentNodes) => {
      const flowNodes: Node[] = windows.map((window) => {
        // Preserve node position if it's being dragged or if we have a saved position
        const existingNode = currentNodes.find((n) => n.id === window.id);
        const savedPosition = lastDraggedPosition.current.get(window.id);

        let position: { x: number; y: number };
        if (draggingNodeId === window.id && existingNode) {
          // Currently dragging - use ReactFlow's position
          position = existingNode.position;
          lastDraggedPosition.current.set(window.id, position);
        } else if (
          savedPosition &&
          (Math.abs(savedPosition.x - window.positionX) > 1 ||
            Math.abs(savedPosition.y - window.positionY) > 1)
        ) {
          // Position hasn't synced yet - use saved position
          position = savedPosition;
        } else {
          // Use position from windows state
          position = { x: window.positionX, y: window.positionY };
          // Clear saved position if it matches
          if (savedPosition) {
            lastDraggedPosition.current.delete(window.id);
          }
        }

        return {
          id: window.id,
          type: "chatWindow",
          position,
          dragHandle: "[data-handle]", // Only allow dragging from header
          data: {
            windowId: window.id,
            title: window.title,
            messages: window.messages.map((msg) => ({
              ...msg,
              createdAt:
                typeof msg.createdAt === "string"
                  ? new Date(msg.createdAt)
                  : msg.createdAt,
            })),
            isStreaming: streamingWindowId === window.id,
            isThinking:
              thinkingWindowId === window.id && streamingWindowId !== window.id,
            onSendMessage,
            onTextSelect: async (
              selectedText: string,
              messageId: string,
              windowId: string,
              range: Range
            ) => {
              await onTextSelect(selectedText, messageId, windowId, range);
            },
            onTitleChange: onWindowTitleChange,
          },
        };
      });
      return flowNodes;
    });
  }, [
    windows,
    streamingWindowId,
    thinkingWindowId,
    draggingNodeId,
    onSendMessage,
    onTextSelect,
    onWindowTitleChange,
    setNodes,
  ]);

  // Convert edges to flow edges
  useEffect(() => {
    const flowEdges: Edge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.sourceWindowId,
      target: edge.targetWindowId,
      label: edge.selectedText.substring(0, 30) + "...",
      type: "bezier",
    }));
    setEdges(flowEdges);
  }, [edges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const onNodeDragStart = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Check if the drag started from clicking on the edit button
      const target = event.target as HTMLElement;
      const isEditButton = target.closest("[data-no-drag]");

      if (isEditButton) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (node?.id) {
        setDraggingNodeId(node.id);

        // Get all descendants of this node
        const descendants = getDescendants(node.id);
        draggingDescendants.current = descendants;

        // Store initial positions of the dragged node and all descendants
        dragStartPositions.current.clear();
        dragStartPositions.current.set(node.id, { ...node.position });

        setNodes((currentNodes) => {
          for (const descendantId of descendants) {
            const descendantNode = currentNodes.find(
              (n) => n.id === descendantId
            );
            if (descendantNode) {
              dragStartPositions.current.set(descendantId, {
                ...descendantNode.position,
              });
            }
          }
          return currentNodes;
        });
      }
    },
    [getDescendants, setNodes]
  );

  const onNodeDragStop = useCallback(
    async (_: React.MouseEvent, node: Node) => {
      if (!node || !node.id || node.position === undefined) {
        console.error("Invalid node data in onNodeDragStop:", node);
        return;
      }

      // Calculate delta from start position
      const startPos = dragStartPositions.current.get(node.id);
      const deltaX = startPos ? node.position.x - startPos.x : 0;
      const deltaY = startPos ? node.position.y - startPos.y : 0;

      // Build list of all nodes to update with their final positions
      const nodesToUpdate: Array<{ id: string; x: number; y: number }> = [
        { id: node.id, x: node.position.x, y: node.position.y },
      ];

      // Calculate final positions for all descendants
      for (const descendantId of draggingDescendants.current) {
        const descendantStartPos = dragStartPositions.current.get(descendantId);
        if (descendantStartPos) {
          const finalX = descendantStartPos.x + deltaX;
          const finalY = descendantStartPos.y + deltaY;
          nodesToUpdate.push({ id: descendantId, x: finalX, y: finalY });
          // Save to lastDraggedPosition for position preservation
          lastDraggedPosition.current.set(descendantId, {
            x: finalX,
            y: finalY,
          });
        }
      }

      // Save position for dragged node
      lastDraggedPosition.current.set(node.id, node.position);

      // Clear dragging state
      setDraggingNodeId(null);
      draggingDescendants.current = [];
      dragStartPositions.current.clear();

      // Update all positions in parallel
      const updatePromises = nodesToUpdate.map((n) =>
        onWindowPositionChange(n.id, n.x, n.y)
      );
      await Promise.all(updatePromises);
    },
    [onWindowPositionChange]
  );

  const onNodeMouseDown = useCallback((event: React.MouseEvent, node: Node) => {
    // Only allow dragging from the header (data-handle attribute)
    const target = event.target as HTMLElement;

    // Prevent dragging if clicking on edit button or elements with data-no-drag
    const isEditButton = target.closest("[data-no-drag]");

    if (isEditButton) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const hasHandle = target.closest("[data-handle]");

    // Prevent dragging if clicking anywhere except the header
    // But allow dragging even during streaming
    if (!hasHandle) {
      event.stopPropagation();
    }
  }, []);

  // Move descendants along with the dragged node
  const onNodeDrag = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!node?.id || draggingDescendants.current.length === 0) return;

      const startPos = dragStartPositions.current.get(node.id);
      if (!startPos) return;

      // Calculate delta from start position
      const deltaX = node.position.x - startPos.x;
      const deltaY = node.position.y - startPos.y;

      // Update all descendant positions
      setNodes((currentNodes) =>
        currentNodes.map((n) => {
          if (draggingDescendants.current.includes(n.id)) {
            const descendantStartPos = dragStartPositions.current.get(n.id);
            if (descendantStartPos) {
              return {
                ...n,
                position: {
                  x: descendantStartPos.x + deltaX,
                  y: descendantStartPos.y + deltaY,
                },
              };
            }
          }
          return n;
        })
      );
    },
    [setNodes]
  );

  // Handle focus request
  useEffect(() => {
    if (
      focusTarget &&
      focusTarget.timestamp > lastFocusTimestamp.current &&
      reactFlowInstance.current &&
      nodes.length > 0
    ) {
      // Check if target node exists in current nodes state
      const targetNodeExists = nodes.some((n) => n.id === focusTarget.id);

      if (targetNodeExists) {
        // Use a small timeout to ensure ReactFlow has processed the new node
        setTimeout(() => {
          if (!reactFlowInstance.current) return;
          const node = reactFlowInstance.current.getNode(focusTarget.id);
          if (node) {
            lastFocusTimestamp.current = focusTarget.timestamp;
            reactFlowInstance.current.fitView({
              nodes: [node],
              padding: 0.2,
              duration: 300,
            });
          }
        }, 50);
      }
    }
  }, [focusTarget, nodes]);

  return (
    <div style={{ width: "100%", height: "100vh" }} className="relative">
      <ReactFlow
        nodes={nodes}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onNodeDrag={onNodeDrag}
        onInit={onInit}
        nodeTypes={nodeTypes}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={false}
        selectNodesOnDrag={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
        minZoom={0.1}
        maxZoom={1.5}
      >
        <Background size={1} color="#000000" />
        {/* <Controls /> */}
        <MiniMap />
      </ReactFlow>
      <div className="absolute top-5 left-30 z-20 pointer-events-auto">
        <Link href="/" className="font-[family-name:var(--font-bogle)] text-2xl uppercase tracking-wider text-black no-underline">
          Pine
        </Link>
      </div>
      <div className="absolute top-5 right-30 z-20 pointer-events-auto flex items-center gap-2">
        <AllChatsDrawer
          parentWindows={parentWindows}
          onChatClick={handleChatClick}
        />
        <button
          onClick={onAddWindow}
          className="flex h-9 items-center justify-center gap-2 rounded-md bg-zinc-900 px-3 text-xs font-medium text-white shadow-sm transition-all hover:bg-zinc-800"
          title="New chat window"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Chat</span>
        </button>
      </div>
    </div>
  );
}
