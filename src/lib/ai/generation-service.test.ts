import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  aiGeneration: {
    create: vi.fn(),
    update: vi.fn()
  },
  knowledgePoint: {
    createMany: vi.fn()
  },
  learningNode: {
    findFirstOrThrow: vi.fn(),
    update: vi.fn()
  },
  modelProviderConfig: {
    findFirstOrThrow: vi.fn()
  }
}));

const crypto = vi.hoisted(() => ({
  decryptModelKey: vi.fn((value: string) => `decrypted:${value}`)
}));

vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/crypto/model-key", () => crypto);

let completeJson: ReturnType<typeof vi.fn>;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runInitialParse", () => {
  beforeEach(async () => {
    db.aiGeneration.create.mockReset();
    db.aiGeneration.update.mockReset();
    db.knowledgePoint.createMany.mockReset();
    db.learningNode.findFirstOrThrow.mockReset();
    db.learningNode.update.mockReset();
    db.modelProviderConfig.findFirstOrThrow.mockReset();
    crypto.decryptModelKey.mockClear();
    vi.unstubAllEnvs();

    const { OpenAiCompatibleProvider } = await import("./openai-compatible");
    completeJson = vi.spyOn(OpenAiCompatibleProvider.prototype, "completeJson");
  });

  it("runs an initial parse and persists the parsed learning output", async () => {
    db.aiGeneration.create.mockResolvedValue({ id: "generation_1" });
    db.learningNode.findFirstOrThrow.mockResolvedValue({
      id: "node_1",
      userId: "user_1",
      sourceId: "source_1",
      title: "React State",
      summary: "Original summary",
      content: "Original content",
      source: {
        type: "question",
        title: "React State",
        description: "How state changes UI",
        learningGoal: null,
        rawInput: null,
        fetchedContent: null
      }
    });
    db.modelProviderConfig.findFirstOrThrow.mockResolvedValue({
      id: "config_1",
      userId: "user_1",
      kind: "user_key",
      provider: "openai-compatible",
      baseUrl: "https://models.example/v1",
      modelName: "gpt-test",
      encryptedApiKey: "ciphertext",
      isEnabled: true
    });
    completeJson.mockResolvedValue(
      JSON.stringify({
        title: "React State",
        summary: "How state changes UI",
        content: "State lets components remember values.",
        knowledgePoints: [
          { title: "useState", summary: "Local component state" },
          { title: "setState", summary: "Schedules a UI update", content: "Updates are batched." }
        ]
      })
    );
    db.learningNode.update.mockResolvedValue({ id: "node_1" });
    db.knowledgePoint.createMany.mockResolvedValue({ count: 2 });
    db.aiGeneration.update.mockResolvedValue({ id: "generation_1", status: "completed" });

    const { runInitialParse } = await import("./generation-service");
    const result = await runInitialParse("user_1", "node_1", "config_1");

    expect(db.aiGeneration.create).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        nodeId: "node_1",
        modelConfigId: "config_1",
        action: "initial_parse",
        status: "pending"
      }
    });
    expect(crypto.decryptModelKey).toHaveBeenCalledWith("ciphertext");
    expect(completeJson).toHaveBeenCalledWith({
      model: "gpt-test",
      messages: expect.any(Array)
    });
    expect(db.learningNode.update).toHaveBeenCalledWith({
      where: { id_userId: { id: "node_1", userId: "user_1" } },
      data: {
        title: "React State",
        summary: "How state changes UI",
        content: "State lets components remember values.",
        generationStatus: "completed",
        modelUsed: "gpt-test"
      }
    });
    expect(db.knowledgePoint.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: "user_1",
          nodeId: "node_1",
          title: "useState",
          summary: "Local component state",
          content: undefined,
          orderIndex: 0
        },
        {
          userId: "user_1",
          nodeId: "node_1",
          title: "setState",
          summary: "Schedules a UI update",
          content: "Updates are batched.",
          orderIndex: 1
        }
      ]
    });
    expect(db.aiGeneration.update).toHaveBeenCalledWith({
      where: { id: "generation_1" },
      data: {
        status: "completed",
        rawOutput: expect.any(String),
        outputPayload: expect.objectContaining({ title: "React State" })
      }
    });
    expect(result.title).toBe("React State");
  });

  it("uses platform environment configuration without decrypting user keys", async () => {
    vi.stubEnv("PLATFORM_OPENAI_COMPATIBLE_BASE_URL", "https://platform.example/v1");
    vi.stubEnv("PLATFORM_OPENAI_COMPATIBLE_API_KEY", "platform-key");
    vi.stubEnv("PLATFORM_OPENAI_COMPATIBLE_MODEL", "platform-model");
    db.aiGeneration.create.mockResolvedValue({ id: "generation_1" });
    db.learningNode.findFirstOrThrow.mockResolvedValue({
      id: "node_1",
      title: "React State",
      source: { type: "question", title: "React State" }
    });
    db.modelProviderConfig.findFirstOrThrow.mockResolvedValue({
      id: "config_1",
      kind: "platform",
      provider: "openai-compatible",
      baseUrl: null,
      modelName: "stored-model",
      encryptedApiKey: null
    });
    completeJson.mockResolvedValue(
      JSON.stringify({
        title: "React State",
        summary: "How state changes UI",
        content: "State lets components remember values.",
        knowledgePoints: [{ title: "useState", summary: "Local component state" }]
      })
    );

    const { runInitialParse } = await import("./generation-service");
    await runInitialParse("user_1", "node_1", "config_1");

    expect(crypto.decryptModelKey).not.toHaveBeenCalled();
    expect(completeJson).toHaveBeenCalledWith({
      model: "platform-model",
      messages: expect.any(Array)
    });
  });

  it("marks the generation and node as failed before rethrowing errors", async () => {
    db.aiGeneration.create.mockResolvedValue({ id: "generation_1" });
    db.learningNode.findFirstOrThrow.mockResolvedValue({
      id: "node_1",
      title: "React State",
      source: { type: "question", title: "React State" }
    });
    db.modelProviderConfig.findFirstOrThrow.mockResolvedValue({
      id: "config_1",
      kind: "user_key",
      provider: "openai-compatible",
      baseUrl: "https://models.example/v1",
      modelName: "gpt-test",
      encryptedApiKey: "ciphertext"
    });
    completeJson.mockRejectedValue(new Error("provider failed with sk-secret"));

    const { runInitialParse } = await import("./generation-service");
    await expect(runInitialParse("user_1", "node_1", "config_1")).rejects.toThrow(
      "provider failed with [redacted]"
    );

    expect(db.learningNode.update).toHaveBeenCalledWith({
      where: { id_userId: { id: "node_1", userId: "user_1" } },
      data: { generationStatus: "failed" }
    });
    expect(db.aiGeneration.update).toHaveBeenCalledWith({
      where: { id: "generation_1" },
      data: {
        status: "failed",
        errorMessage: "provider failed with [redacted]"
      }
    });
  });
});

describe("OpenAiCompatibleProvider", () => {
  it("posts chat completions as JSON mode and returns message content", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: "{\"title\":\"React\"}" } }]
      })
    });
    const { OpenAiCompatibleProvider } = await import("./openai-compatible");
    const provider = new OpenAiCompatibleProvider({
      baseUrl: "https://models.example/v1/",
      apiKey: "sk-test",
      fetcher
    });

    const result = await provider.completeJson({
      model: "gpt-test",
      messages: [{ role: "user", content: "Return JSON" }]
    });

    expect(fetcher).toHaveBeenCalledWith("https://models.example/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer sk-test"
      },
      body: JSON.stringify({
        model: "gpt-test",
        messages: [{ role: "user", content: "Return JSON" }],
        response_format: { type: "json_object" }
      })
    });
    expect(result).toBe("{\"title\":\"React\"}");
  });

  it("throws sanitized errors for failed responses", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue("bad key sk-secret")
    });
    const { OpenAiCompatibleProvider } = await import("./openai-compatible");
    const provider = new OpenAiCompatibleProvider({
      baseUrl: "https://models.example/v1",
      apiKey: "sk-secret",
      fetcher
    });

    await expect(
      provider.completeJson({
        model: "gpt-test",
        messages: [{ role: "user", content: "Return JSON" }]
      })
    ).rejects.toThrow("AI provider request failed with status 401");
  });
});
