import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { updateNodePositionSchema } from "@/lib/domain/schemas";
import { deleteNodeBranch, getNodeDetail, updateNodePosition } from "@/lib/services/node-service";

function isRecordNotFoundError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2025";
}

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

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ nodeId: string }> }) {
  const user = await requireCurrentUser();
  const { nodeId } = await context.params;
  const body = await readJson(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = updateNodePositionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid node position" }, { status: 400 });
  }

  const result = await updateNodePosition(user.id, nodeId, parsed.data);
  if (result.count === 0) {
    return NextResponse.json({ error: "Node not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ nodeId: string }> }) {
  const user = await requireCurrentUser();
  const { nodeId } = await context.params;

  try {
    await deleteNodeBranch(user.id, nodeId);
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    throw error;
  }

  return NextResponse.json({ ok: true });
}
