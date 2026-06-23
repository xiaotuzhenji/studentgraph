import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  modelProviderConfig: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn()
  }
}));

const crypto = vi.hoisted(() => ({
  encryptModelKey: vi.fn((value: string) => `encrypted:${value}`)
}));

vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/crypto/model-key", () => crypto);

describe("model config service", () => {
  beforeEach(() => {
    db.modelProviderConfig.create.mockReset();
    db.modelProviderConfig.findMany.mockReset();
    db.modelProviderConfig.update.mockReset();
    crypto.encryptModelKey.mockClear();
  });

  it("lists enabled configs without encrypted API keys", async () => {
    db.modelProviderConfig.findMany.mockResolvedValue([
      {
        id: "config_1",
        provider: "openai-compatible",
        displayName: "Study model",
        modelName: "gpt-test",
        kind: "user_key",
        isEnabled: true
      }
    ]);

    const { listModelConfigs } = await import("./model-config-service");
    const configs = await listModelConfigs("user_1");

    expect(db.modelProviderConfig.findMany).toHaveBeenCalledWith({
      where: { userId: "user_1", isEnabled: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        provider: true,
        displayName: true,
        modelName: true,
        kind: true,
        isEnabled: true
      }
    });
    expect(configs[0]).not.toHaveProperty("encryptedApiKey");
  });

  it("creates user model configs with encrypted API keys", async () => {
    db.modelProviderConfig.create.mockResolvedValue({
      id: "config_1",
      provider: "openai-compatible",
      displayName: "Study model",
      modelName: "gpt-test",
      kind: "user_key",
      isEnabled: true
    });

    const { createUserModelConfig } = await import("./model-config-service");
    const config = await createUserModelConfig({
      userId: "user_1",
      provider: "openai-compatible",
      displayName: "Study model",
      modelName: "gpt-test",
      apiKey: "sk-test"
    });

    expect(crypto.encryptModelKey).toHaveBeenCalledWith("sk-test");
    expect(db.modelProviderConfig.create).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        provider: "openai-compatible",
        displayName: "Study model",
        modelName: "gpt-test",
        kind: "user_key",
        encryptedApiKey: "encrypted:sk-test",
        isEnabled: true
      },
      select: {
        id: true,
        provider: true,
        displayName: true,
        modelName: true,
        kind: true,
        isEnabled: true
      }
    });
    expect(config).not.toHaveProperty("encryptedApiKey");
  });

  it("disables a config for the current user", async () => {
    db.modelProviderConfig.update.mockResolvedValue({
      id: "config_1",
      provider: "openai-compatible",
      displayName: "Study model",
      modelName: "gpt-test",
      kind: "user_key",
      isEnabled: false
    });

    const { disableModelConfig } = await import("./model-config-service");
    const config = await disableModelConfig("user_1", "config_1");

    expect(db.modelProviderConfig.update).toHaveBeenCalledWith({
      where: { id_userId: { id: "config_1", userId: "user_1" } },
      data: { isEnabled: false },
      select: {
        id: true,
        provider: true,
        displayName: true,
        modelName: true,
        kind: true,
        isEnabled: true
      }
    });
    expect(config).not.toHaveProperty("encryptedApiKey");
  });
});
