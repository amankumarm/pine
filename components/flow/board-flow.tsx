"use client";

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
} from "reactflow";
import "reactflow/dist/style.css";
import ChatWindowNode from "./chat-window-node";
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
}: BoardFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const lastDraggedPosition = useRef<Map<string, { x: number; y: number }>>(
    new Map()
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

  const onNodeDragStart = useCallback((_: React.MouseEvent, node: Node) => {
    if (node?.id) {
      setDraggingNodeId(node.id);
    }
  }, []);

  const onNodeDragStop = useCallback(
    async (_: React.MouseEvent, node: Node) => {
      if (!node || !node.id || node.position === undefined) {
        console.error("Invalid node data in onNodeDragStop:", node);
        return;
      }
      // Save the position before updating
      lastDraggedPosition.current.set(node.id, node.position);
      // Clear dragging state
      setDraggingNodeId(null);
      // Update position (this will optimistically update windows state)
      await onWindowPositionChange(node.id, node.position.x, node.position.y);
    },
    [onWindowPositionChange]
  );

  const onNodeMouseDown = useCallback((event: React.MouseEvent, node: Node) => {
    // Only allow dragging from the header (data-handle attribute)
    const target = event.target as HTMLElement;
    const hasHandle = target.closest("[data-handle]");

    // Prevent dragging if clicking anywhere except the header
    // But allow dragging even during streaming
    if (!hasHandle) {
      event.stopPropagation();
    }
  }, []);

  // Ensure nodes are always draggable, even during streaming
  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    // Allow dragging to continue even if node is updating
    // This ensures streaming doesn't interrupt drag operations
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onNodeDrag={onNodeDrag}
        nodeTypes={nodeTypes}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={false}
        selectNodesOnDrag={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
      >
        <Background size={0.5} color="#e5e5e5" />
        {/* <Controls /> */}
        {/* <MiniMap /> */}
      </ReactFlow>
    </div>
  );
}
