/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  aiGeneration: {
    findFirst: vi.fn()
  }
}));

const generationService = vi.hoisted(() => ({
  runBranchGeneration: vi.fn(),
  runInitialParse: vi.fn()
}));

vi.mock("@/lib/auth/current-user", () => ({
  requireCurrentUser: vi.fn(async () => ({ id: "user_1" }))
}));
vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/ai/generation-service", () => generationService);

describe("generation retry route", () => {
  beforeEach(() => {
    db.aiGeneration.findFirst.mockReset();
    generationService.runBranchGeneration.mockReset();
    generationService.runInitialParse.mockReset();
  });

  it("rejects retries for generations that are not failed", async () => {
    db.aiGeneration.findFirst.mockResolvedValue({
      id: "generation_1",
      userId: "user_1",
      nodeId: "node_1",
      modelConfigId: "config_1",
      action: "initial_parse",
      status: "completed",
      node: { id: "node_1" }
    });

    const { POST } = await import("./route");
    const response = await POST(new Request("http://test.local"), {
      params: Promise.resolve({ generationId: "generation_1" })
    });

    await expect(response.json()).resolves.toEqual({ error: "Only failed generations can be retried" });
    expect(response.status).toBe(409);
    expect(generationService.runInitialParse).not.toHaveBeenCalled();
    expect(generationService.runBranchGeneration).not.toHaveBeenCalled();
  });
});
