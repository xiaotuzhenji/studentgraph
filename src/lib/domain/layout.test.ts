import { describe, expect, it } from "vitest";
import { positionChildNode } from "./layout";

describe("positionChildNode", () => {
  it("places children to the right with vertical sibling offsets", () => {
    expect(positionChildNode({ x: 40, y: 80 }, 0)).toEqual({ x: 420, y: 80 });
    expect(positionChildNode({ x: 40, y: 80 }, 2)).toEqual({ x: 420, y: 360 });
  });
});
