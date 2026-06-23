import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  requireCurrentUser: vi.fn()
}));

const service = vi.hoisted(() => ({
  listCanvases: vi.fn(),
  createCanvas: vi.fn(),
  renameCanvas: vi.fn(),
  setDefaultCanvas: vi.fn(),
  deleteCanvas: vi.fn()
}));

vi.mock("@/lib/auth/current-user", () => auth);
vi.mock("@/lib/services/canvas-service", () => service);

describe("/api/canvas", () => {
  beforeEach(() => {
    auth.requireCurrentUser.mockReset();
    service.listCanvases.mockReset();
    service.createCanvas.mockReset();
    service.renameCanvas.mockReset();
    service.setDefaultCanvas.mockReset();
    service.deleteCanvas.mockReset();
    auth.requireCurrentUser.mockResolvedValue({ id: "user_1" });
  });

  it("lists canvases", async () => {
    service.listCanvases.mockResolvedValue([{ id: "canvas_1" }]);
    const { GET } = await import("./route");

    const response = await GET();
    const json = await response.json();

    expect(json.canvases).toEqual([{ id: "canvas_1" }]);
  });

  it("creates a canvas", async () => {
    service.createCanvas.mockResolvedValue({ id: "canvas_2", title: "新画布" });
    const { POST } = await import("./route");

    const response = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ title: "新画布" }) }));
    const json = await response.json();

    expect(json.canvas.id).toBe("canvas_2");
  });

  it("updates a canvas title", async () => {
    service.renameCanvas.mockResolvedValue({ id: "canvas_1", title: "改名" });
    const { PATCH } = await import("./route");

    const response = await PATCH(
      new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ action: "rename", canvasId: "canvas_1", title: "改名" }) })
    );
    expect(response.status).toBe(200);
  });

  it("deletes a canvas", async () => {
    service.deleteCanvas.mockResolvedValue({ id: "canvas_1" });
    const { DELETE } = await import("./route");

    const response = await DELETE(new Request("http://localhost", { method: "DELETE", body: JSON.stringify({ canvasId: "canvas_1" }) }));
    expect(response.status).toBe(200);
  });
});
