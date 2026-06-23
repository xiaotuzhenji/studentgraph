/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";

const nodeService = vi.hoisted(() => ({
  createAiBranch: vi.fn(),
  createNoteBranch: vi.fn()
}));

vi.mock("@/lib/auth/current-user", () => ({
  requireCurrentUser: vi.fn(async () => ({ id: "user_1" }))
}));
vi.mock("@/lib/services/node-service", () => nodeService);

describe("node branches route", () => {
  beforeEach(() => {
    nodeService.createAiBranch.mockReset();
    nodeService.createNoteBranch.mockReset();
  });

  it("returns the created note branch node", async () => {
    nodeService.createNoteBranch.mockResolvedValue({ id: "child_1" });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://test.local", {
        method: "POST",
        body: JSON.stringify({ kind: "note", title: "My note", content: "Content" })
      }),
      { params: Promise.resolve({ nodeId: "node_1" }) }
    );

    await expect(response.json()).resolves.toEqual({ node: { id: "child_1" } });
    expect(response.status).toBe(201);
  });

  it("returns the created AI branch node", async () => {
    nodeService.createAiBranch.mockResolvedValue({ id: "child_2" });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://test.local", {
        method: "POST",
        body: JSON.stringify({
          kind: "explanation",
          title: "Expand",
          modelConfigId: "cmqqcmfmo001ejgti90ngxh1m"
        })
      }),
      { params: Promise.resolve({ nodeId: "node_1" }) }
    );

    await expect(response.json()).resolves.toEqual({ node: { id: "child_2" } });
    expect(response.status).toBe(201);
  });
});
