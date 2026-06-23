import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  learningCanvas: {
    findFirst: vi.fn(),
    findFirstOrThrow: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn()
  }
}));

vi.mock("@/lib/db", () => ({ db }));

describe("canvas-service", () => {
  beforeEach(() => {
    Object.values(db.learningCanvas).forEach((mockFn) => mockFn.mockReset());
  });

  it("creates a default canvas when none exists", async () => {
    db.learningCanvas.findFirst.mockResolvedValue(null);
    db.learningCanvas.create.mockResolvedValue({ id: "canvas_1" });

    const { createCanvas } = await import("./canvas-service");
    await createCanvas("user_1", "主画布");

    expect(db.learningCanvas.create).toHaveBeenCalledWith({
      data: { userId: "user_1", title: "主画布", isDefault: true }
    });
  });

  it("renames a canvas", async () => {
    db.learningCanvas.update.mockResolvedValue({ id: "canvas_1", title: "新的标题" });

    const { renameCanvas } = await import("./canvas-service");
    await renameCanvas("user_1", "canvas_1", "新的标题");

    expect(db.learningCanvas.update).toHaveBeenCalledWith({
      where: { id_userId: { id: "canvas_1", userId: "user_1" } },
      data: { title: "新的标题" }
    });
  });

  it("sets one canvas as default and clears others", async () => {
    db.learningCanvas.updateMany.mockResolvedValue({ count: 2 });
    db.learningCanvas.update.mockResolvedValue({ id: "canvas_1", isDefault: true });

    const { setDefaultCanvas } = await import("./canvas-service");
    await setDefaultCanvas("user_1", "canvas_1");

    expect(db.learningCanvas.updateMany).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      data: { isDefault: false }
    });
    expect(db.learningCanvas.update).toHaveBeenCalledWith({
      where: { id_userId: { id: "canvas_1", userId: "user_1" } },
      data: { isDefault: true }
    });
  });

  it("refuses to delete the only canvas", async () => {
    db.learningCanvas.findFirstOrThrow.mockResolvedValue({ id: "canvas_1", isDefault: true });
    db.learningCanvas.findFirst.mockResolvedValue(null);

    const { deleteCanvas } = await import("./canvas-service");
    await expect(deleteCanvas("user_1", "canvas_1")).rejects.toThrow("不能删除唯一画布");
  });
});
