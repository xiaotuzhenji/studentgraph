import { describe, expect, it } from "vitest";
import { positionChildNode, positionRootNode } from "./layout";

describe("positionRootNode", () => {
  it("places root nodes in a vertical column", () => {
    expect(positionRootNode(0)).toEqual({ x: 0, y: 0 });
    expect(positionRootNode(2)).toEqual({ x: 0, y: 440 });
  });
});

describe("positionChildNode", () => {
  it("places children to the right with vertical sibling offsets", () => {
    expect(positionChildNode({ x: 40, y: 80 }, 0)).toEqual({ x: 400, y: 80 });
    expect(positionChildNode({ x: 40, y: 80 }, 2)).toEqual({ x: 400, y: 460 });
  });
});
