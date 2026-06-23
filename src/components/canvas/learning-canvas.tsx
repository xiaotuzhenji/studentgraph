"use client";

import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes
} from "@xyflow/react";
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
};

type LearningFlowNode = Node<LearningCardData, "learningCard">;

function LearningCardNode({ data }: NodeProps<LearningFlowNode>) {
  return <LearningCard data={data} />;
}

const nodeTypes: NodeTypes = {
  learningCard: LearningCardNode
};

export function LearningCanvas({ nodes, edges }: LearningCanvasProps) {
  const router = useRouter();
  const flowNodes: LearningFlowNode[] = nodes.map((node) => ({
    id: node.id,
    type: "learningCard",
    position: { x: node.x, y: node.y },
    data: node
  }));
  const flowEdges: Edge[] = edges;

  return (
    <div style={{ background: "#f8fafc", borderRadius: "1rem", height: "70vh", overflow: "hidden" }}>
      <ReactFlow
        edges={flowEdges}
        fitView
        nodeTypes={nodeTypes}
        nodes={flowNodes}
        onNodeClick={(_, node) => router.push(`/nodes/${node.data.id}`)}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
