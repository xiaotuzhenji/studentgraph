import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  modelProviderConfig: {
    findFirstOrThrow: vi.fn()
  },
  learningCanvas: {
    findFirst: vi.fn(),
    create: vi.fn()
  },
  learningSource: {
    create: vi.fn()
  },
  learningNode: {
    create: vi.fn()
  },
  $transaction: vi.fn()
}));

const contentFetcher = vi.hoisted(() => ({
  fetchSourceContent: vi.fn()
}));

const generationService = vi.hoisted(() => ({
  runInitialParse: vi.fn()
}));

vi.mock("@/lib/db", () => ({ db }));
vi.mock("./content-fetcher", () => contentFetcher);
vi.mock("@/lib/ai/generation-service", () => generationService);

describe("createLearningSource", () => {
  beforeEach(() => {
    db.modelProviderConfig.findFirstOrThrow.mockReset();
    db.learningCanvas.findFirst.mockReset();
    db.learningCanvas.create.mockReset();
    db.learningSource.create.mockReset();
    db.learningNode.create.mockReset();
    db.$transaction.mockReset();
    db.$transaction.mockImplementation((callback) => callback(db));
    contentFetcher.fetchSourceContent.mockReset();
    generationService.runInitialParse.mockReset();
  });

  it("creates a default canvas, source, and idle root node", async () => {
    db.learningCanvas.findFirst.mockResolvedValue(null);
    db.learningCanvas.create.mockResolvedValue({ id: "canvas_1", userId: "user_1", title: "My Learning Canvas" });
    db.learningSource.create.mockResolvedValue({
      id: "source_1",
      userId: "user_1",
      title: "What is indexing?",
      fetchedTitle: null
    });
    db.learningNode.create.mockResolvedValue({
      id: "node_1",
      sourceId: "source_1",
      title: "What is indexing?",
      type: "source",
      generationStatus: "idle",
      x: 0,
      y: 0
    });
    contentFetcher.fetchSourceContent.mockResolvedValue({ status: "idle" });

    const { createLearningSource } = await import("./source-service");
    const result = await createLearningSource("user_1", {
      type: "question",
      title: "What is indexing?",
      description: "Explain from first principles"
    });

    expect(db.learningCanvas.create).toHaveBeenCalledWith({
      data: { userId: "user_1", title: "My Learning Canvas", isDefault: true }
    });
    expect(db.learningSource.create).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        type: "question",
        title: "What is indexing?",
        url: undefined,
        author: undefined,
        description: "Explain from first principles",
        learningGoal: undefined,
        rawInput: undefined,
        fetchStatus: "idle",
        fetchedTitle: undefined,
        fetchedDescription: undefined,
        fetchedContent: undefined
      }
    });
    expect(db.learningNode.create).toHaveBeenCalledWith({
      data: {
        canvasId: "canvas_1",
        userId: "user_1",
        sourceId: "source_1",
        type: "source",
        title: "What is indexing?",
        summary: "Explain from first principles",
        content: undefined,
        generationStatus: "idle",
        x: 0,
        y: 0
      }
    });
    expect(result.node.id).toBe("node_1");
    expect(generationService.runInitialParse).not.toHaveBeenCalled();
  });

  it("creates a source without starting generation when no model is selected", async () => {
    db.learningCanvas.findFirst.mockResolvedValue({ id: "canvas_1" });
    db.learningSource.create.mockResolvedValue({ id: "source_1", title: "What is database indexing?" });
    db.learningNode.create.mockResolvedValue({
      id: "node_1",
      title: "What is database indexing?",
      generationStatus: "idle"
    });
    contentFetcher.fetchSourceContent.mockResolvedValue({ status: "idle" });

    const { createLearningSource } = await import("./source-service");
    const result = await createLearningSource("user_1", {
      type: "question",
      title: "What is database indexing?",
      description: "Explain from first principles"
    });

    expect(result.node.generationStatus).toBe("idle");
    expect(generationService.runInitialParse).not.toHaveBeenCalled();
  });

  it("starts initial generation when a model is selected", async () => {
    db.modelProviderConfig.findFirstOrThrow.mockResolvedValue({ id: "config_1" });
    db.learningCanvas.findFirst.mockResolvedValue({ id: "canvas_1" });
    db.learningSource.create.mockResolvedValue({ id: "source_1", title: "What is database indexing?" });
    db.learningNode.create.mockResolvedValue({
      id: "node_1",
      title: "What is database indexing?",
      generationStatus: "pending"
    });
    contentFetcher.fetchSourceContent.mockResolvedValue({ status: "idle" });
    generationService.runInitialParse.mockResolvedValue({ title: "Parsed indexing" });

    const { createLearningSource } = await import("./source-service");
    await createLearningSource("user_1", {
      type: "question",
      title: "What is database indexing?",
      modelConfigId: "config_1"
    });

    expect(db.learningNode.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ generationStatus: "pending" })
    });
    expect(db.modelProviderConfig.findFirstOrThrow).toHaveBeenCalledWith({
      where: { id: "config_1", userId: "user_1", isEnabled: true },
      select: { id: true }
    });
    expect(generationService.runInitialParse).toHaveBeenCalledWith("user_1", "node_1", "config_1");
  });

  it("returns the created source when initial generation fails", async () => {
    db.modelProviderConfig.findFirstOrThrow.mockResolvedValue({ id: "config_1" });
    db.learningCanvas.findFirst.mockResolvedValue({ id: "canvas_1" });
    db.learningSource.create.mockResolvedValue({ id: "source_1", title: "What is database indexing?" });
    db.learningNode.create.mockResolvedValue({
      id: "node_1",
      title: "What is database indexing?",
      generationStatus: "pending"
    });
    contentFetcher.fetchSourceContent.mockResolvedValue({ status: "idle" });
    generationService.runInitialParse.mockRejectedValue(new Error("model unavailable"));

    const { createLearningSource } = await import("./source-service");
    const result = await createLearningSource("user_1", {
      type: "question",
      title: "What is database indexing?",
      modelConfigId: "config_1"
    });

    expect(result.node.id).toBe("node_1");
  });

  it("does not create a pending node when the selected model is unavailable", async () => {
    db.modelProviderConfig.findFirstOrThrow.mockRejectedValue(new Error("model not found"));
    contentFetcher.fetchSourceContent.mockResolvedValue({ status: "idle" });

    const { createLearningSource } = await import("./source-service");
    await expect(
      createLearningSource("user_1", {
        type: "question",
        title: "What is database indexing?",
        modelConfigId: "config_1"
      })
    ).rejects.toThrow("model not found");

    expect(db.learningSource.create).not.toHaveBeenCalled();
    expect(db.learningNode.create).not.toHaveBeenCalled();
    expect(generationService.runInitialParse).not.toHaveBeenCalled();
  });

  it("stores fetched metadata for link sources", async () => {
    db.learningCanvas.findFirst.mockResolvedValue({ id: "canvas_1" });
    db.learningSource.create.mockResolvedValue({ id: "source_1", title: "Fallback" });
    db.learningNode.create.mockResolvedValue({ id: "node_1", title: "Fetched Title" });
    contentFetcher.fetchSourceContent.mockResolvedValue({
      status: "completed",
      title: "Fetched Title",
      description: "Fetched description",
      content: "Fetched content"
    });

    const { createLearningSource } = await import("./source-service");
    await createLearningSource("user_1", {
      type: "blog_link",
      title: "Fallback",
      url: "https://example.com/post"
    });

    expect(db.learningSource.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fetchStatus: "completed",
        fetchedTitle: "Fetched Title",
        fetchedDescription: "Fetched description",
        fetchedContent: "Fetched content"
      })
    });
    expect(db.learningNode.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Fetched Title",
        summary: "Fetched description",
        content: "Fetched content"
      })
    });
  });
});
