"use client";

import {
  Background,
  Controls,
  MarkerType,
  PanOnScrollMode,
  ReactFlow,
  Position,
  ViewportPortal,
  useReactFlow,
  useNodesState,
  useUpdateNodeInternals,
  type DefaultEdgeOptions,
  type Edge,
  type Node,
  type NodeProps,
  type OnNodeDrag,
  type NodeTypes
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { LearningCard, type LearningCardData } from "./learning-card";

type CanvasApiNode = LearningCardData & {
  x: number;
  y: number;
};

type CanvasApiEdge = {
  id: string;
  source: string;
  target: string;
};

type LearningCanvasProps = {
  nodes: CanvasApiNode[];
  edges: CanvasApiEdge[];
  focusNodeId?: string;
};

type LearningFlowNode = Node<LearningCardData, "learningCard">;

type ContextMenuState = {
  nodeId: string;
  x: number;
  y: number;
};

function LearningCardNode({ data }: NodeProps<LearningFlowNode>) {
  return <LearningCard data={data} />;
}

const canvasViewportPadding = 48;
const estimatedCardWidth = 240;
const estimatedCardCenterY = 54;
const minInitialZoom = 0.45;
const maxInitialZoom = 1;

function CanvasAutoLayout({ disabled, nodeIds, edgeCount }: { disabled?: boolean; nodeIds: string[]; edgeCount: number }) {
  const reactFlow = useReactFlow<LearningFlowNode, Edge>();
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    if (disabled) return;
    if (nodeIds.length === 0) return;

    const frameId = window.requestAnimationFrame(() => {
      updateNodeInternals(nodeIds);
      const bounds = reactFlow.getNodesBounds(nodeIds);
      const viewportElement = document.querySelector(".learning-canvas .react-flow");
      const viewportWidth = viewportElement?.clientWidth ?? 0;
      const availableWidth = Math.max(viewportWidth - canvasViewportPadding * 2, 1);
      const graphWidth = Math.max(bounds.width + estimatedCardWidth, 1);
      const zoom = Math.min(maxInitialZoom, Math.max(minInitialZoom, availableWidth / graphWidth));

      void reactFlow.setViewport(
        {
          x: canvasViewportPadding - bounds.x * zoom,
          y: canvasViewportPadding - bounds.y * zoom,
          zoom
        },
        { duration: 120 }
      );
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [disabled, edgeCount, nodeIds, reactFlow, updateNodeInternals]);

  return null;
}

function CanvasFocusNode({ focusNodeId, nodes }: { focusNodeId?: string; nodes: LearningFlowNode[] }) {
  const reactFlow = useReactFlow<LearningFlowNode, Edge>();

  useEffect(() => {
    if (!focusNodeId) return;

    const focusedNode = nodes.find((node) => node.id === focusNodeId);
    if (!focusedNode) return;

    const frameId = window.requestAnimationFrame(() => {
      void reactFlow.setCenter(
        focusedNode.position.x + estimatedCardWidth / 2,
        focusedNode.position.y + estimatedCardCenterY,
        { duration: 360, zoom: 1 }
      );
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [focusNodeId, nodes, reactFlow]);

  return null;
}

function VisibleBranchEdges({
  highlightedNodeId,
  nodes,
  edges
}: {
  highlightedNodeId?: string | null;
  nodes: LearningFlowNode[];
  edges: Edge[];
}) {
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const visibleEdges = useMemo(
    () =>
      edges
        .map((edge) => {
          const source = nodeMap.get(edge.source);
          const target = nodeMap.get(edge.target);
          if (!source || !target) return null;

          const sourceX = source.position.x + estimatedCardWidth;
          const sourceY = source.position.y + estimatedCardCenterY;
          const targetX = target.position.x;
          const targetY = target.position.y + estimatedCardCenterY;
          const bend = Math.max(56, Math.min(120, Math.abs(targetX - sourceX) / 2));

          return {
            id: edge.id,
            isHighlighted: edge.source === highlightedNodeId || edge.target === highlightedNodeId,
            path: `M ${sourceX} ${sourceY} C ${sourceX + bend} ${sourceY}, ${targetX - bend} ${targetY}, ${targetX} ${targetY}`
          };
        })
        .filter((edge): edge is { id: string; isHighlighted: boolean; path: string } => edge !== null),
    [edges, highlightedNodeId, nodeMap]
  );

  if (visibleEdges.length === 0) return null;

  return (
    <ViewportPortal>
      <svg
        aria-hidden="true"
        style={{
          height: 1,
          left: 0,
          overflow: "visible",
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          width: 1,
          zIndex: 6
        }}
      >
        <defs>
          <marker id="visible-branch-arrow" markerHeight="7" markerWidth="7" orient="auto" refX="6" refY="3.5">
            <path d="M 0 0 L 7 3.5 L 0 7 z" fill="#111111" />
          </marker>
        </defs>
        {visibleEdges.map((edge) => (
          <g key={edge.id}>
            <path
              d={edge.path}
              fill="none"
              stroke="rgba(255,255,255,0.95)"
              strokeLinecap="round"
              strokeWidth={edge.isHighlighted ? 12 : 8}
            />
            <path
              d={edge.path}
              fill="none"
              markerEnd="url(#visible-branch-arrow)"
              stroke="#111111"
              strokeLinecap="round"
              strokeWidth={edge.isHighlighted ? 5 : 3.2}
            />
          </g>
        ))}
      </svg>
    </ViewportPortal>
  );
}

const nodeTypes: NodeTypes = {
  learningCard: LearningCardNode
};

const defaultEdgeOptions: DefaultEdgeOptions = {
  animated: false,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: "#1f2937"
  },
  style: {
    stroke: "#1f2937",
    strokeWidth: 2.8
  }
};

function toFlowNodes(
  nodes: CanvasApiNode[],
  selectedNodeId: string | null,
  highlightedNodeId: string | null,
  existingNodes: LearningFlowNode[] = []
): LearningFlowNode[] {
  const existingNodeMap = new Map(existingNodes.map((node) => [node.id, node]));

  return nodes.map((node) => {
    const existingNode = existingNodeMap.get(node.id);
    const isSelected = node.id === selectedNodeId;

    return {
      id: node.id,
      type: "learningCard",
      position: existingNode?.position ?? { x: node.x, y: node.y },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      selected: isSelected,
      draggable: isSelected,
      data: {
        ...node,
        isSelected,
        isHighlighted: node.id === highlightedNodeId
      }
    };
  });
}

function findNodeBranchIds(rootNodeId: string, edges: CanvasApiEdge[]) {
  const childIdsByParent = new Map<string, string[]>();
  for (const edge of edges) {
    childIdsByParent.set(edge.source, [...(childIdsByParent.get(edge.source) ?? []), edge.target]);
  }

  const branchIds = new Set([rootNodeId]);
  const pendingIds = [rootNodeId];

  while (pendingIds.length > 0) {
    const currentId = pendingIds.pop() as string;
    for (const childId of childIdsByParent.get(currentId) ?? []) {
      if (!branchIds.has(childId)) {
        branchIds.add(childId);
        pendingIds.push(childId);
      }
    }
  }

  return branchIds;
}

export function LearningCanvas({ nodes, edges, focusNodeId }: LearningCanvasProps) {
  const router = useRouter();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(focusNodeId ?? null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(focusNodeId ?? null);
  const [deletedNodeIds, setDeletedNodeIds] = useState<Set<string>>(() => new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const visibleNodes = useMemo(
    () => nodes.filter((node) => !deletedNodeIds.has(node.id)),
    [deletedNodeIds, nodes]
  );
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<LearningFlowNode>(
    toFlowNodes(visibleNodes, focusNodeId ?? null, focusNodeId ?? null)
  );
  const flowEdges: Edge[] = useMemo(
    () =>
      edges
        .filter((edge) => !deletedNodeIds.has(edge.source) && !deletedNodeIds.has(edge.target))
        .map((edge) => ({
          ...edge,
          sourceHandle: "branch-source",
          targetHandle: "branch-target",
          zIndex: 10,
          type: "smoothstep"
        })),
    [deletedNodeIds, edges]
  );
  const flowNodeIds = useMemo(() => visibleNodes.map((node) => node.id), [visibleNodes]);

  useEffect(() => {
    setFlowNodes((currentNodes) => toFlowNodes(visibleNodes, selectedNodeId, highlightedNodeId, currentNodes));
  }, [highlightedNodeId, selectedNodeId, setFlowNodes, visibleNodes]);

  useEffect(() => {
    if (!focusNodeId) return;

    const frameId = window.requestAnimationFrame(() => {
      setSelectedNodeId(focusNodeId);
      setHighlightedNodeId(focusNodeId);
    });

    const timeoutId = window.setTimeout(() => {
      setHighlightedNodeId(null);
    }, 3200);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [focusNodeId]);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleNodeClick = useCallback(
    (_: MouseEvent, node: LearningFlowNode) => {
      setSelectedNodeId(node.id);
      closeContextMenu();
    },
    [closeContextMenu]
  );

  const handleNodeContextMenu = useCallback((event: MouseEvent, node: LearningFlowNode) => {
    event.preventDefault();
    setSelectedNodeId(node.id);
    setContextMenu({ nodeId: node.id, x: event.clientX, y: event.clientY });
  }, []);

  const handleNodeDragStop = useCallback<OnNodeDrag<LearningFlowNode>>(
    async (_, node) => {
      const response = await fetch(`/api/nodes/${node.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x: node.position.x, y: node.position.y })
      });

      if (!response.ok) {
        window.alert("保存卡片位置失败，正在恢复最新画布。");
        router.refresh();
      }
    },
    [router]
  );

  async function handleDeleteSelectedNode() {
    if (!contextMenu) return;

    const nodeId = contextMenu.nodeId;
    const confirmed = window.confirm("确定删除这张卡片及其所有分支吗？");
    if (!confirmed) return;

    closeContextMenu();
    const branchIds = findNodeBranchIds(nodeId, edges);
    const response = await fetch(`/api/nodes/${nodeId}`, { method: "DELETE" });

    if (!response.ok) {
      window.alert("删除失败，请稍后再试。");
      return;
    }

    setDeletedNodeIds((currentIds) => new Set([...currentIds, ...branchIds]));
    setSelectedNodeId(null);
    router.refresh();
  }

  return (
    <div
      className="learning-canvas"
      style={{
        background:
          "radial-gradient(circle at 20% 20%, rgba(0, 0, 0, 0.025), transparent 20%), linear-gradient(180deg, #fbfbfb, #f5f5f5)",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        boxShadow:
          "rgba(0,0,0,0.06) 0 0 0 1px, rgba(0,0,0,0.04) 0 1px 2px, rgba(0,0,0,0.04) 0 2px 4px",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        position: "relative"
      }}
    >
      <ReactFlow
        defaultEdgeOptions={defaultEdgeOptions}
        edges={flowEdges}
        edgesFocusable={false}
        nodeTypes={nodeTypes}
        nodes={flowNodes}
        nodesDraggable
        onNodeClick={handleNodeClick}
        onNodeContextMenu={handleNodeContextMenu}
        onNodeDoubleClick={(_, node) => router.push(`/nodes/${node.id}`)}
        onNodeDragStop={handleNodeDragStop}
        onNodesChange={onNodesChange}
        onPaneClick={() => {
          setSelectedNodeId(null);
          closeContextMenu();
        }}
        panOnDrag
        panOnScroll
        panOnScrollMode={PanOnScrollMode.Free}
        panOnScrollSpeed={0.8}
        selectNodesOnDrag={false}
        selectionOnDrag={false}
        zoomActivationKeyCode="Control"
        zoomOnDoubleClick={false}
        zoomOnPinch
        zoomOnScroll
        style={{ height: "100%", width: "100%" }}
      >
        <CanvasAutoLayout disabled={Boolean(focusNodeId)} edgeCount={flowEdges.length} nodeIds={flowNodeIds} />
        <CanvasFocusNode focusNodeId={focusNodeId} nodes={flowNodes} />
        <VisibleBranchEdges edges={flowEdges} highlightedNodeId={highlightedNodeId} nodes={flowNodes} />
        <Background gap={28} size={1} color="#d8d8d8" />
        <Controls showInteractive={false} />
      </ReactFlow>
      {contextMenu ? (
        <div
          className="card"
          style={{
            left: contextMenu.x,
            minWidth: "10rem",
            padding: "0.4rem",
            position: "fixed",
            top: contextMenu.y,
            zIndex: 20
          }}
        >
          <button
            onClick={handleDeleteSelectedNode}
            style={{
              background: "transparent",
              border: 0,
              borderRadius: "10px",
              color: "#9f1239",
              cursor: "pointer",
              font: "inherit",
              padding: "0.65rem 0.75rem",
              textAlign: "left",
              width: "100%"
            }}
            type="button"
          >
            删除卡片
          </button>
        </div>
      ) : null}
    </div>
  );
}
