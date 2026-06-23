/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";

const knowledgeService = vi.hoisted(() => ({
  markKnowledgePointLearned: vi.fn()
}));

vi.mock("@/lib/auth/current-user", () => ({
  requireCurrentUser: vi.fn(async () => ({ id: "user_1" }))
}));
vi.mock("@/lib/services/knowledge-service", () => knowledgeService);

describe("knowledge point learned route", () => {
  beforeEach(() => {
    knowledgeService.markKnowledgePointLearned.mockReset();
  });

  it("returns 404 when the knowledge point does not belong to the current user", async () => {
    knowledgeService.markKnowledgePointLearned.mockRejectedValue({ code: "P2025" });

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({ learnedStatus: "learned" })
      }),
      { params: Promise.resolve({ pointId: "point_1" }) }
    );

    await expect(response.json()).resolves.toEqual({ error: "Knowledge point not found" });
    expect(response.status).toBe(404);
  });
});
