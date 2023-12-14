import { nodeToTypes } from "schemas/frames";
import { SpaceTableSchema } from "types/mdb";
import { FrameNode, FrameSchema, FrameTreeProp, MFrame } from "types/mframe";
import { safelyParseJSON } from "utils/parsers";

export const mdbSchemaToFrameSchema = (schema: SpaceTableSchema) : FrameSchema => {
  if (!schema) return null;
return {
  ...schema,
  def: safelyParseJSON(schema.def)
}
}

export const frameSchemaToMDBSchema = (frameSchema: FrameSchema) => {
  return {
    ...frameSchema,
    def: JSON.stringify(frameSchema.def)
  }
}
export const frameToNode = (frame: MFrame): FrameNode => {
  return {
    ...frame,
    rank: parseInt(frame.rank),
    contexts: safelyParseJSON(frame.contexts),
    styles: safelyParseJSON(frame.styles),
    actions: safelyParseJSON(frame.actions),
    props: safelyParseJSON(frame.props),
    types: nodeToTypes(frame.type),
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