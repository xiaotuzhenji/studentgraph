import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
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

vi.mock("@/lib/db", () => ({ db }));
vi.mock("./content-fetcher", () => contentFetcher);

describe("createLearningSource", () => {
  beforeEach(() => {
    db.learningCanvas.findFirst.mockReset();
    db.learningCanvas.create.mockReset();
    db.learningSource.create.mockReset();
    db.learningNode.create.mockReset();
    db.$transaction.mockReset();
    db.$transaction.mockImplementation((callback) => callback(db));
    contentFetcher.fetchSourceContent.mockReset();
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
