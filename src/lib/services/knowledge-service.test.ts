import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  $transaction: vi.fn(),
  learningNode: {
    update: vi.fn()
  },
  knowledgePoint: {
    update: vi.fn()
  },
  knowledgeRecord: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn()
  }
}));

vi.mock("@/lib/db", () => ({ db }));

describe("knowledge title matching", () => {
  it("normalizes case and plural spacing", async () => {
    const { normalizeKnowledgeTitle } = await import("./knowledge-service");

    expect(normalizeKnowledgeTitle(" React   Hooks ")).toBe("react hooks");
  });

  it("matches close titles", async () => {
    const { titlesMatch } = await import("./knowledge-service");

    expect(titlesMatch("React Hooks", "react hooks")).toBe(true);
  });
});

describe("knowledge service", () => {
  beforeEach(() => {
    db.$transaction.mockReset();
    db.$transaction.mockImplementation((callback) => callback(db));
    db.learningNode.update.mockReset();
    db.knowledgePoint.update.mockReset();
    db.knowledgeRecord.create.mockReset();
    db.knowledgeRecord.findFirst.mockReset();
    db.knowledgeRecord.findMany.mockReset();
    db.knowledgeRecord.update.mockReset();
    db.knowledgeRecord.updateMany.mockReset();
    db.knowledgeRecord.upsert.mockReset();
  });

  it("creates an active record when a node is marked learned", async () => {
    db.learningNode.update.mockResolvedValue({
      id: "node_1",
      title: "React Hooks",
      summary: "State and effects",
      content: "Hooks compose React stateful logic."
    });
    db.knowledgeRecord.findMany.mockResolvedValue([]);
    db.knowledgeRecord.create.mockResolvedValue({ id: "record_1" });

    const { markNodeLearned } = await import("./knowledge-service");
    await markNodeLearned("user_1", "node_1", "learned");

    expect(db.learningNode.update).toHaveBeenCalledWith({
      where: { id_userId: { id: "node_1", userId: "user_1" } },
      data: { learnedStatus: "learned" }
    });
    expect(db.knowledgeRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_1",
        recordType: "node",
        title: "React Hooks",
        summary: "State and effects",
        rawText: "Hooks compose React stateful logic.",
        isActive: true,
        sourceNodeId: "node_1"
      })
    });
  });

  it("reactivates an existing node record when a node is marked learned again", async () => {
    db.learningNode.update.mockResolvedValue({
      id: "node_1",
      title: "React Hooks",
      summary: null,
      content: null
    });
    db.knowledgeRecord.findMany.mockResolvedValue([{ id: "record_1" }]);
    db.knowledgeRecord.update.mockResolvedValue({ id: "record_1", isActive: true });

    const { markNodeLearned } = await import("./knowledge-service");
    await markNodeLearned("user_1", "node_1", "learned");

    expect(db.knowledgeRecord.update).toHaveBeenCalledWith({
      where: { id_userId: { id: "record_1", userId: "user_1" } },
      data: expect.objectContaining({
        title: "React Hooks",
        isActive: true,
        sourceNodeId: "node_1"
      })
    });
  });

  it("keeps only one active record when duplicate node records already exist", async () => {
    db.learningNode.update.mockResolvedValue({
      id: "node_1",
      title: "React Hooks",
      summary: null,
      content: null
    });
    db.knowledgeRecord.findMany.mockResolvedValue([{ id: "record_1" }, { id: "record_2" }]);
    db.knowledgeRecord.update.mockResolvedValue({ id: "record_1", isActive: true });
    db.knowledgeRecord.updateMany.mockResolvedValue({ count: 1 });

    const { markNodeLearned } = await import("./knowledge-service");
    await markNodeLearned("user_1", "node_1", "learned");

    expect(db.knowledgeRecord.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["record_2"] }, userId: "user_1" },
      data: { isActive: false }
    });
  });

  it("deactivates a node record when a node is no longer learned", async () => {
    db.learningNode.update.mockResolvedValue({ id: "node_1" });
    db.knowledgeRecord.updateMany.mockResolvedValue({ count: 1 });

    const { markNodeLearned } = await import("./knowledge-service");
    await markNodeLearned("user_1", "node_1", "learning");

    expect(db.knowledgeRecord.updateMany).toHaveBeenCalledWith({
      where: { sourceNodeId: "node_1", userId: "user_1", recordType: "node" },
      data: { isActive: false }
    });
  });

  it("upserts an active record when a knowledge point is marked learned", async () => {
    db.knowledgePoint.update.mockResolvedValue({
      id: "point_1",
      nodeId: "node_1",
      title: "useState",
      summary: "Local state",
      content: "useState stores component-local values."
    });
    db.knowledgeRecord.upsert.mockResolvedValue({ id: "record_1" });

    const { markKnowledgePointLearned } = await import("./knowledge-service");
    await markKnowledgePointLearned("user_1", "point_1", "learned");

    expect(db.knowledgeRecord.upsert).toHaveBeenCalledWith({
      where: { sourceKnowledgePointId_userId: { sourceKnowledgePointId: "point_1", userId: "user_1" } },
      update: expect.objectContaining({
        title: "useState",
        isActive: true,
        sourceNodeId: "node_1"
      }),
      create: expect.objectContaining({
        userId: "user_1",
        recordType: "knowledge_point",
        title: "useState",
        sourceNodeId: "node_1",
        sourceKnowledgePointId: "point_1",
        isActive: true
      })
    });
  });

  it("lists only active records for the current user", async () => {
    db.knowledgeRecord.findMany.mockResolvedValue([{ id: "record_1", title: "React Hooks" }]);

    const { listKnowledgeRecords } = await import("./knowledge-service");
    await listKnowledgeRecords("user_1");

    expect(db.knowledgeRecord.findMany).toHaveBeenCalledWith({
      where: { userId: "user_1", isActive: true },
      orderBy: { learnedAt: "desc" }
    });
  });

  it("matches points against active knowledge records by normalized title", async () => {
    db.knowledgeRecord.findMany.mockResolvedValue([{ id: "record_1", title: "react hooks" }]);

    const { matchKnowledgePoints } = await import("./knowledge-service");
    const matches = await matchKnowledgePoints("user_1", [{ id: "point_1", title: " React   Hooks " }]);

    expect(matches).toEqual([{ pointId: "point_1", record: { id: "record_1", title: "react hooks" } }]);
  });
});
