import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  learningNode: {
    count: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findFirstOrThrow: vi.fn(),
    updateMany: vi.fn()
  },
  modelProviderConfig: {
    findFirstOrThrow: vi.fn()
  },
  knowledgePoint: {
    findFirstOrThrow: vi.fn()
  }
}));

const generationService = vi.hoisted(() => ({
  runBranchGeneration: vi.fn()
}));

vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/ai/generation-service", () => generationService);

describe("createNoteBranchTitle", () => {
  it("uses the explicit title when present", async () => {
    const { createNoteBranchTitle } = await import("./node-service");

    expect(createNoteBranchTitle("Parent", "My note")).toBe("My note");
  });

  it("falls back to parent title", async () => {
    const { createNoteBranchTitle } = await import("./node-service");

    expect(createNoteBranchTitle("React Hooks", "")).toBe("Note: React Hooks");
  });
});

describe("getNodeDetail", () => {
  beforeEach(() => {
    db.learningNode.findFirst.mockReset();
  });

  it("loads a non-deleted node with source, ordered knowledge points, and children", async () => {
    db.learningNode.findFirst.mockResolvedValue({ id: "node_1" });

    const { getNodeDetail } = await import("./node-service");
    await getNodeDetail("user_1", "node_1");

    expect(db.learningNode.findFirst).toHaveBeenCalledWith({
      where: { id: "node_1", userId: "user_1", deletedAt: null },
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
  });
});

describe("createNoteBranch", () => {
  beforeEach(() => {
    db.learningNode.count.mockReset();
    db.learningNode.create.mockReset();
    db.learningNode.findFirstOrThrow.mockReset();
  });

  it("creates a completed note child using parent ownership and child position", async () => {
    db.learningNode.findFirstOrThrow.mockResolvedValue({
      id: "parent_1",
      userId: "user_1",
      canvasId: "canvas_1",
      sourceId: "source_1",
      title: "React Hooks",
      x: 10,
      y: 20
    });
    db.learningNode.count.mockResolvedValue(2);
    db.learningNode.create.mockResolvedValue({ id: "note_1" });

    const { createNoteBranch } = await import("./node-service");
    await createNoteBranch("user_1", "parent_1", {
      title: "  ",
      content: "Indexes trade write cost for faster reads."
    });

    expect(db.learningNode.findFirstOrThrow).toHaveBeenCalledWith({
      where: { id: "parent_1", userId: "user_1", deletedAt: null }
    });
    expect(db.learningNode.count).toHaveBeenCalledWith({
      where: { parentId: "parent_1", userId: "user_1", deletedAt: null }
    });
    expect(db.learningNode.create).toHaveBeenCalledWith({
      data: {
        canvasId: "canvas_1",
        userId: "user_1",
        sourceId: "source_1",
        parentId: "parent_1",
        type: "note",
        title: "Note: React Hooks",
        content: "Indexes trade write cost for faster reads.",
        x: 370,
        y: 400,
        generationStatus: "completed"
      }
    });
  });
});

describe("deleteNodeBranch", () => {
  beforeEach(() => {
    db.learningNode.findFirstOrThrow.mockReset();
    db.learningNode.findMany.mockReset();
    db.learningNode.updateMany.mockReset();
  });

  it("soft deletes the selected node and its child branch nodes", async () => {
    db.learningNode.findFirstOrThrow.mockResolvedValue({ id: "parent_1" });
    db.learningNode.findMany
      .mockResolvedValueOnce([{ id: "child_1" }, { id: "child_2" }])
      .mockResolvedValueOnce([{ id: "grandchild_1" }])
      .mockResolvedValueOnce([]);
    db.learningNode.updateMany.mockResolvedValue({ count: 4 });

    const { deleteNodeBranch } = await import("./node-service");
    await deleteNodeBranch("user_1", "parent_1");

    expect(db.learningNode.findFirstOrThrow).toHaveBeenCalledWith({
      where: { id: "parent_1", userId: "user_1", deletedAt: null },
      select: { id: true }
    });
    expect(db.learningNode.findMany).toHaveBeenNthCalledWith(1, {
      where: { parentId: { in: ["parent_1"] }, userId: "user_1", deletedAt: null },
      select: { id: true }
    });
    expect(db.learningNode.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["parent_1", "child_1", "child_2", "grandchild_1"] },
        userId: "user_1",
        deletedAt: null
      },
      data: { deletedAt: expect.any(Date) }
    });
  });
});

describe("createAiBranch", () => {
  beforeEach(() => {
    db.learningNode.count.mockReset();
    db.learningNode.create.mockReset();
    db.learningNode.findFirstOrThrow.mockReset();
    db.modelProviderConfig.findFirstOrThrow.mockReset();
    db.knowledgePoint.findFirstOrThrow.mockReset();
    generationService.runBranchGeneration.mockReset();
  });

  it("creates a pending AI branch and starts branch generation", async () => {
    db.learningNode.findFirstOrThrow.mockResolvedValue({
      id: "parent_1",
      userId: "user_1",
      canvasId: "canvas_1",
      sourceId: "source_1",
      title: "React Hooks",
      x: 0,
      y: 0
    });
    db.learningNode.count.mockResolvedValue(0);
    db.modelProviderConfig.findFirstOrThrow.mockResolvedValue({ id: "config_1" });
    db.knowledgePoint.findFirstOrThrow.mockResolvedValue({ id: "kp_1" });
    db.learningNode.create.mockResolvedValue({ id: "child_1" });

    const input = {
      kind: "question" as const,
      modelConfigId: "config_1",
      selectedText: "Why async?",
      sourceKnowledgePointId: "kp_1"
    };

    const { createAiBranch } = await import("./node-service");
    await createAiBranch("user_1", "parent_1", input);

    expect(db.modelProviderConfig.findFirstOrThrow).toHaveBeenCalledWith({
      where: { id: "config_1", userId: "user_1", isEnabled: true },
      select: { id: true }
    });
    expect(db.knowledgePoint.findFirstOrThrow).toHaveBeenCalledWith({
      where: { id: "kp_1", userId: "user_1", nodeId: "parent_1" },
      select: { id: true }
    });
    expect(db.learningNode.create).toHaveBeenCalledWith({
      data: {
        canvasId: "canvas_1",
        userId: "user_1",
        sourceId: "source_1",
        parentId: "parent_1",
        sourceKnowledgePointId: "kp_1",
        type: "question",
        title: "Question: React Hooks",
        selectedText: "Why async?",
        x: 360,
        y: 0,
        generationStatus: "pending",
        modelUsed: "config_1"
      }
    });
    expect(generationService.runBranchGeneration).toHaveBeenCalledWith("user_1", "child_1", "config_1", input);
  });

  it("validates the model config before creating the pending child", async () => {
    db.learningNode.findFirstOrThrow.mockResolvedValue({
      id: "parent_1",
      userId: "user_1",
      canvasId: "canvas_1",
      sourceId: "source_1",
      title: "React Hooks",
      x: 0,
      y: 0
    });
    db.learningNode.count.mockResolvedValue(0);
    db.modelProviderConfig.findFirstOrThrow.mockRejectedValue(new Error("not found"));

    const { createAiBranch } = await import("./node-service");
    await expect(
      createAiBranch("user_1", "parent_1", {
        kind: "explanation",
        modelConfigId: "other_user_config"
      })
    ).rejects.toThrow("not found");

    expect(db.learningNode.create).not.toHaveBeenCalled();
    expect(generationService.runBranchGeneration).not.toHaveBeenCalled();
  });

  it("rejects a source knowledge point from a different parent node", async () => {
    db.learningNode.findFirstOrThrow.mockResolvedValue({
      id: "parent_1",
      userId: "user_1",
      canvasId: "canvas_1",
      sourceId: "source_1",
      title: "React Hooks",
      x: 0,
      y: 0
    });
    db.modelProviderConfig.findFirstOrThrow.mockResolvedValue({ id: "config_1" });
    db.knowledgePoint.findFirstOrThrow.mockRejectedValue(new Error("point not found"));

    const { createAiBranch } = await import("./node-service");
    await expect(
      createAiBranch("user_1", "parent_1", {
        kind: "explanation",
        modelConfigId: "config_1",
        sourceKnowledgePointId: "other_node_point"
      })
    ).rejects.toThrow("point not found");

    expect(db.learningNode.create).not.toHaveBeenCalled();
    expect(generationService.runBranchGeneration).not.toHaveBeenCalled();
  });

  it("returns the child branch when generation fails", async () => {
    db.learningNode.findFirstOrThrow.mockResolvedValue({
      id: "parent_1",
      userId: "user_1",
      canvasId: "canvas_1",
      sourceId: "source_1",
      title: "React Hooks",
      x: 0,
      y: 0
    });
    db.learningNode.count.mockResolvedValue(0);
    db.modelProviderConfig.findFirstOrThrow.mockResolvedValue({ id: "config_1" });
    db.learningNode.create.mockResolvedValue({ id: "child_1", generationStatus: "pending" });
    generationService.runBranchGeneration.mockRejectedValue(new Error("model unavailable"));

    const { createAiBranch } = await import("./node-service");
    const child = await createAiBranch("user_1", "parent_1", {
      kind: "explanation",
      modelConfigId: "config_1"
    });

    expect(child).toEqual({ id: "child_1", generationStatus: "pending" });
  });
});
