import { runBranchGeneration } from "@/lib/ai/generation-service";
import { db } from "@/lib/db";
import { positionChildNode } from "@/lib/domain/layout";

type AiBranchInput = {
  kind: "explanation" | "question";
  modelConfigId: string;
  selectedText?: string;
  sourceKnowledgePointId?: string;
};

export function createNoteBranchTitle(parentTitle: string, title: string) {
  return title.trim() || `Note: ${parentTitle}`;
}

export function getNodeDetail(userId: string, nodeId: string) {
  return db.learningNode.findFirst({
    where: { id: nodeId, userId, deletedAt: null },
    include: {
      source: true,
      knowledgePoints: {
        include: {
          matchedKnowledgeRecord: {
            select: { id: true, title: true, summary: true, sourceNodeId: true }
          }
        },
        orderBy: { orderIndex: "asc" }
      },
      children: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } }
    }
  });
}

export async function deleteNodeBranch(userId: string, nodeId: string) {
  await db.learningNode.findFirstOrThrow({
    where: { id: nodeId, userId, deletedAt: null },
    select: { id: true }
  });

  const branchIds = new Set([nodeId]);
  const pendingIds = [nodeId];

  while (pendingIds.length > 0) {
    const parentIds = pendingIds.splice(0, pendingIds.length);
    const children = await db.learningNode.findMany({
      where: { parentId: { in: parentIds }, userId, deletedAt: null },
      select: { id: true }
    });

    for (const child of children) {
      if (!branchIds.has(child.id)) {
        branchIds.add(child.id);
        pendingIds.push(child.id);
      }
    }
  }

  return db.learningNode.updateMany({
    where: { id: { in: [...branchIds] }, userId, deletedAt: null },
    data: { deletedAt: new Date() }
  });
}

export async function updateNodePosition(
  userId: string,
  nodeId: string,
  position: { x: number; y: number }
) {
  return db.learningNode.updateMany({
    where: { id: nodeId, userId, deletedAt: null },
    data: {
      x: position.x,
      y: position.y,
      hasManualPosition: true
    }
  });
}

export async function createNoteBranch(
  userId: string,
  nodeId: string,
  input: { title?: string; content?: string }
) {
  const parent = await db.learningNode.findFirstOrThrow({
    where: { id: nodeId, userId, deletedAt: null }
  });
  const siblingCount = await db.learningNode.count({
    where: { parentId: nodeId, userId, deletedAt: null }
  });
  const position = positionChildNode({ x: parent.x, y: parent.y }, siblingCount);

  return db.learningNode.create({
    data: {
      canvasId: parent.canvasId,
      userId,
      sourceId: parent.sourceId,
      parentId: parent.id,
      type: "note",
      title: createNoteBranchTitle(parent.title, input.title ?? ""),
      content: input.content,
      x: position.x,
      y: position.y,
      generationStatus: "completed"
    }
  });
}

export async function createAiBranch(userId: string, nodeId: string, input: AiBranchInput) {
  const parent = await db.learningNode.findFirstOrThrow({
    where: { id: nodeId, userId, deletedAt: null }
  });
  await db.modelProviderConfig.findFirstOrThrow({
    where: { id: input.modelConfigId, userId, isEnabled: true },
    select: { id: true }
  });
  if (input.sourceKnowledgePointId) {
    await db.knowledgePoint.findFirstOrThrow({
      where: { id: input.sourceKnowledgePointId, userId, nodeId: parent.id },
      select: { id: true }
    });
  }
  const siblingCount = await db.learningNode.count({
    where: { parentId: nodeId, userId, deletedAt: null }
  });
  const position = positionChildNode({ x: parent.x, y: parent.y }, siblingCount);

  const child = await db.learningNode.create({
    data: {
      canvasId: parent.canvasId,
      userId,
      sourceId: parent.sourceId,
      parentId: parent.id,
      sourceKnowledgePointId: input.sourceKnowledgePointId,
      type: input.kind,
      title: input.kind === "question" ? `Question: ${parent.title}` : `Expand: ${parent.title}`,
      selectedText: input.selectedText,
      x: position.x,
      y: position.y,
      generationStatus: "pending",
      modelUsed: input.modelConfigId
    }
  });

  queueMicrotask(() => {
    void Promise.resolve(runBranchGeneration(userId, child.id, input.modelConfigId, input)).catch(() => {
      // Branch creation succeeded; generation-service records the failed AI state.
    });
  });

  return child;
}
