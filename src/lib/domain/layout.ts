export type NodePosition = {
  x: number;
  y: number;
};

const childHorizontalOffset = 360;
const childVerticalOffset = 190;
const rootVerticalOffset = 220;

export function positionRootNode(rootIndex: number): NodePosition {
  return {
    x: 0,
    y: rootIndex * rootVerticalOffset
  };
}

export function positionChildNode(parent: NodePosition, siblingIndex: number): NodePosition {
  return {
    x: parent.x + childHorizontalOffset,
    y: parent.y + siblingIndex * childVerticalOffset
  };
}
