import type { LearnedStatus, KnowledgePoint, LearningNode, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type PointForMatching = {
  id: string;
  title: string;
};
type TransactionClient = Prisma.TransactionClient;
const serializableRetryAttempts = 3;

export function normalizeKnowledgeTitle(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

export function titlesMatch(a: string, b: string) {
  return normalizeKnowledgeTitle(a) === normalizeKnowledgeTitle(b);
}

export async function markNodeLearned(userId: string, nodeId: string, learnedStatus: LearnedStatus) {
  return runSerializableTransaction(() => db.$transaction(async (tx) => {
    // This update makes concurrent learned toggles contend on the node row before record lookup/create.
    const node = await tx.learningNode.update({
      where: { id_userId: { id: nodeId, userId } },
      data: { learnedStatus }
    });

    if (learnedStatus !== "learned") {
      await deactivateNodeKnowledgeRecord(tx, userId, nodeId);
      return node;
    }

    await upsertNodeKnowledgeRecord(tx, userId, node);
    return node;
  }, { isolationLevel: "Serializable" }));
}

export async function markKnowledgePointLearned(userId: string, pointId: string, learnedStatus: LearnedStatus) {
  const point = await db.knowledgePoint.update({
    where: { id_userId: { id: pointId, userId } },
    data: { learnedStatus }
  });

  if (learnedStatus !== "learned") {
    await deactivatePointKnowledgeRecord(userId, pointId);
    return point;
  }

  await upsertPointKnowledgeRecord(userId, point);
  return point;
}

export async function matchKnowledgePoints(userId: string, points: PointForMatching[]) {
  const records = await listKnowledgeRecords(userId);

  return points.map((point) => ({
    pointId: point.id,
    record: records.find((record) => titlesMatch(record.title, point.title)) ?? null
  }));
}

export function listKnowledgeRecords(userId: string) {
  return db.knowledgeRecord.findMany({
    where: { userId, isActive: true },
    orderBy: { learnedAt: "desc" }
  });
}

async function upsertNodeKnowledgeRecord(tx: TransactionClient, userId: string, node: LearningNode) {
  const records = await tx.knowledgeRecord.findMany({
    where: { userId, sourceNodeId: node.id, recordType: "node" },
    orderBy: { createdAt: "asc" }
  });

  const data = {
    title: node.title,
    summary: node.summary,
    rawText: node.content,
    learnedAt: new Date(),
    isActive: true,
    sourceNodeId: node.id
  };
  const [existing, ...duplicates] = records;

  if (duplicates.length > 0) {
    await tx.knowledgeRecord.updateMany({
      where: { id: { in: duplicates.map((record) => record.id) }, userId },
      data: { isActive: false }
    });
  }

  if (existing) {
    return tx.knowledgeRecord.update({
      where: { id_userId: { id: existing.id, userId } },
      data
    });
  }

  return tx.knowledgeRecord.create({
    data: {
      userId,
      recordType: "node",
      keywords: [],
      ...data
    }
  });
}

function upsertPointKnowledgeRecord(userId: string, point: KnowledgePoint) {
  const data = {
    title: point.title,
    summary: point.summary,
    rawText: point.content,
    learnedAt: new Date(),
    isActive: true,
    sourceNodeId: point.nodeId
  };

  return db.knowledgeRecord.upsert({
    where: { sourceKnowledgePointId_userId: { sourceKnowledgePointId: point.id, userId } },
    update: data,
    create: {
      userId,
      recordType: "knowledge_point",
      keywords: [],
      sourceKnowledgePointId: point.id,
      ...data
    }
  });
}

function deactivateNodeKnowledgeRecord(tx: TransactionClient, userId: string, nodeId: string) {
  return tx.knowledgeRecord.updateMany({
    where: { sourceNodeId: nodeId, userId, recordType: "node" },
    data: { isActive: false }
  });
}

function deactivatePointKnowledgeRecord(userId: string, pointId: string) {
  return db.knowledgeRecord.updateMany({
    where: { sourceKnowledgePointId: pointId, userId },
    data: { isActive: false }
  });
}

async function runSerializableTransaction<T>(action: () => Promise<T>) {
  let lastError: unknown;

  for (let attempt = 0; attempt < serializableRetryAttempts; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      if (!isSerializableConflict(error)) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError;
}

function isSerializableConflict(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2034";
}
