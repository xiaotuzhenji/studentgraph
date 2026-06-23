/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";

const nodeService = vi.hoisted(() => ({
  deleteNodeBranch: vi.fn(),
  getNodeDetail: vi.fn(),
  updateNodePosition: vi.fn()
}));

vi.mock("@/lib/auth/current-user", () => ({
  requireCurrentUser: vi.fn(async () => ({ id: "user_1" }))
}));
vi.mock("@/lib/services/node-service", () => nodeService);

describe("node route", () => {
  beforeEach(() => {
    nodeService.deleteNodeBranch.mockReset();
    nodeService.getNodeDetail.mockReset();
    nodeService.updateNodePosition.mockReset();
  });

  it("updates the selected node position for the current user", async () => {
    nodeService.updateNodePosition.mockResolvedValue({ count: 1 });

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({ x: 120, y: 240 })
      }),
      { params: Promise.resolve({ nodeId: "node_1" }) }
    );

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(nodeService.updateNodePosition).toHaveBeenCalledWith("user_1", "node_1", { x: 120, y: 240 });
  });

  it("rejects invalid node positions", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({ x: "120", y: 240 })
      }),
      { params: Promise.resolve({ nodeId: "node_1" }) }
    );

    await expect(response.json()).resolves.toEqual({ error: "Invalid node position" });
    expect(response.status).toBe(400);
    expect(nodeService.updateNodePosition).not.toHaveBeenCalled();
  });

  it("returns 404 when updating a node position that does not belong to the current user", async () => {
    nodeService.updateNodePosition.mockResolvedValue({ count: 0 });

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({ x: 120, y: 240 })
      }),
      { params: Promise.resolve({ nodeId: "node_1" }) }
    );

    await expect(response.json()).resolves.toEqual({ error: "Node not found" });
    expect(response.status).toBe(404);
  });

  it("returns 404 when deleting a node that does not belong to the current user", async () => {
    nodeService.deleteNodeBranch.mockRejectedValue({ code: "P2025" });

    const { DELETE } = await import("./route");
    const response = await DELETE(new Request("http://test.local", { method: "DELETE" }), {
      params: Promise.resolve({ nodeId: "node_1" })
    });

    await expect(response.json()).resolves.toEqual({ error: "Node not found" });
    expect(response.status).toBe(404);
  });
});
