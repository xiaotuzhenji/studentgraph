import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getNodeDetail } from "@/lib/services/node-service";

export async function GET(_request: Request, context: { params: Promise<{ nodeId: string }> }) {
  const user = await requireCurrentUser();
  const { nodeId } = await context.params;
  const node = await getNodeDetail(user.id, nodeId);

  if (!node) {
    return NextResponse.json({ error: "Node not found" }, { status: 404 });
  }

  return NextResponse.json({
    node,
    source: node.source,
    knowledgePoints: node.knowledgePoints,
    children: node.children
  });
}
