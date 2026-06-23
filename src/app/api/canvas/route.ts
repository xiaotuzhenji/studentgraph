import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";

export async function GET() {
  const user = await requireCurrentUser();
  const nodes = await db.learningNode.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      type: true,
      summary: true,
      learnedStatus: true,
      generationStatus: true,
      x: true,
      y: true,
      parentId: true
    }
  });
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = nodes
    .filter((node) => node.parentId && nodeIds.has(node.parentId))
    .map((node) => ({
      id: `${node.parentId}-${node.id}`,
      source: node.parentId as string,
      target: node.id
    }));

  return NextResponse.json({
    nodes: nodes.map((node) => ({
      id: node.id,
      title: node.title,
      type: node.type,
      summary: node.summary,
      learnedStatus: node.learnedStatus,
      generationStatus: node.generationStatus,
      x: node.x,
      y: node.y
    })),
    edges
  });
}
