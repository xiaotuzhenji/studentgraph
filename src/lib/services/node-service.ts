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
      knowledgePoints: { orderBy: { orderIndex: "asc" } },
      children: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } }
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

  await runBranchGeneration(userId, child.id, input.modelConfigId, input);

  return child;
}
