export type NodePosition = {
  x: number;
  y: number;
};

const childHorizontalOffset = 380;
const childVerticalOffset = 140;

export function positionChildNode(parent: NodePosition, siblingIndex: number): NodePosition {
  return {
    x: parent.x + childHorizontalOffset,
    y: parent.y + siblingIndex * childVerticalOffset
  };
}
