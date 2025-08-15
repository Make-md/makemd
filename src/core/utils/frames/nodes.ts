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
    interactions: safelyParseJSON(frame.interactions),
  } as FrameNode;
};
export const nodeToFrame = (node: FrameNode): MFrame => {
  const { contexts, styles, props, actions, interactions, ...otherProps } = node;
  return {
    id: node.id,
    schemaId: node.schemaId || node.id,
    name: node.name || "",
    type: node.type,
    parentId: node.parentId,
    rank: node.rank?.toString() ?? "0",
    ref: node.ref,
    contexts: JSON.stringify(contexts),
    styles: JSON.stringify(styles),
    actions: JSON.stringify(actions),
    props: JSON.stringify(props),
    interactions: JSON.stringify(interactions),
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