import { nodeToPropValue, nodeToTypes } from "schemas/frames";
import { FrameNode, FrameTreeProp, MFrame } from "shared/types/mframe";
import { safelyParseJSON } from "shared/utils/json";

export const frameToNode = (frame: MFrame): FrameNode => {
  return {
    ...frame,
    rank: parseInt(frame.rank),
    contexts: safelyParseJSON(frame.contexts),
    styles: safelyParseJSON(frame.styles),
    actions: safelyParseJSON(frame.actions),
    props: safelyParseJSON(frame.props),
    types: nodeToTypes(frame.type),
    propsValue: nodeToPropValue(frame.type),
  };
};
export const nodeToFrame = (node: FrameNode): MFrame => {
  const { contexts, styles, props, actions, ...otherProps } = node;
  return {
    ...otherProps,
    rank: node.rank?.toString() ?? "0",
    contexts: JSON.stringify(contexts),
    styles: JSON.stringify(styles),
    actions: JSON.stringify(actions),
    props: JSON.stringify(props),
  };
};

export const mergePropObjects = (
  obj1: FrameTreeProp,
  obj2: FrameTreeProp
): FrameTreeProp => {
  const mergedObject: FrameTreeProp = { ...obj1, ...obj2 };

  for (const key in obj2) {
    if (obj2[key] === null) {
      delete mergedObject[key];
    }
  }
  return mergedObject;
};