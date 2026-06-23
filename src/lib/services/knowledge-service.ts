import type { LearnedStatus, KnowledgePoint, LearningNode } from "@prisma/client";
import { db } from "@/lib/db";

type PointForMatching = {
  id: string;
  title: string;
};

export function normalizeKnowledgeTitle(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

export function titlesMatch(a: string, b: string) {
  return normalizeKnowledgeTitle(a) === normalizeKnowledgeTitle(b);
}

export async function markNodeLearned(userId: string, nodeId: string, learnedStatus: LearnedStatus) {
  const node = await db.learningNode.update({
    where: { id_userId: { id: nodeId, userId } },
    data: { learnedStatus }
  });

  if (learnedStatus !== "learned") {
    await deactivateNodeKnowledgeRecord(userId, nodeId);
    return node;
  }

  await upsertNodeKnowledgeRecord(userId, node);
  return node;
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

async function upsertNodeKnowledgeRecord(userId: string, node: LearningNode) {
  const existing = await db.knowledgeRecord.findFirst({
    where: { userId, sourceNodeId: node.id, recordType: "node" }
  });

  const data = {
    title: node.title,
    summary: node.summary,
    rawText: node.content,
    learnedAt: new Date(),
    isActive: true,
    sourceNodeId: node.id
  };

  if (existing) {
    return db.knowledgeRecord.update({
      where: { id_userId: { id: existing.id, userId } },
      data
    });
  }

  return db.knowledgeRecord.create({
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

function deactivateNodeKnowledgeRecord(userId: string, nodeId: string) {
  return db.knowledgeRecord.updateMany({
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
