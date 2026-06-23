/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";

const knowledgeService = vi.hoisted(() => ({
  markNodeLearned: vi.fn()
}));

vi.mock("@/lib/auth/current-user", () => ({
  requireCurrentUser: vi.fn(async () => ({ id: "user_1" }))
}));
vi.mock("@/lib/services/knowledge-service", () => knowledgeService);

describe("node learned route", () => {
  beforeEach(() => {
    knowledgeService.markNodeLearned.mockReset();
  });

  it("returns 404 when the node does not belong to the current user", async () => {
    knowledgeService.markNodeLearned.mockRejectedValue({ code: "P2025" });

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({ learnedStatus: "learned" })
      }),
      { params: Promise.resolve({ nodeId: "node_1" }) }
    );

    await expect(response.json()).resolves.toEqual({ error: "Node not found" });
    expect(response.status).toBe(404);
  });
});
