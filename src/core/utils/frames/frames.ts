import { parseFieldValue } from "core/schemas/parseFieldValue";
import { SpaceManager } from "core/spaceManager/spaceManager";
import { Superstate } from "makemd-core";
import { DBRow, SpaceProperty } from "shared/types/mdb";
import { FrameNode, FrameRoot, FrameTreeProp, MFrame } from "shared/types/mframe";
import { SpaceInfo } from "shared/types/spaceInfo";
import { uniqueNameFromString } from "shared/utils/array";


export const frameEmbedStringFromContext = (space: SpaceInfo, schema: string) => {
    return `![![${space.path}#*${schema}]]`
}

export const propFieldFromString = (str: string, schemaProps: SpaceProperty[]) => {
  return schemaProps.find((f) => str == `${f.schemaId}.props.${f.name}`);
}

export const nameForField = (field: SpaceProperty, superstate: Superstate) => {
  if (!field) return null;
  const parsedValue = parseFieldValue(field.value, field.type, superstate);
  
  return parsedValue.alias ?? field.name
}

export const removeTrailingSemicolon = (str: string) => {
  return str.replace(/;+$/, "");
}

export const objectIsConst = (objString: string, type: string): boolean => {
  const trimmed = removeTrailingSemicolon(objString.trim())
  if (type == 'object' && trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return true
  }
  if (type == 'object-multi' && trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return true
  }
  if (objString == null || objString == "") return true;
  return false;
}

export const stringIsConst = (str: string): boolean => {
  // Check for quotes at the start and end without any quotes inside
  const hasQuotesAtStartEndOnly = /^["'](?:[^"\\]|\\.)*["'](?:;)?$/.test(str);
  const fixedStr = str?.replace(/;+$/, "");
  // Check for number by trying to parse string into a number and checking if it's NaN
  const isNumber = !isNaN(parseFloat(fixedStr)) && !isNaN(fixedStr as any);
  return hasQuotesAtStartEndOnly || isNumber || fixedStr == 'false' || fixedStr == 'true' || str == null || str == "";
}

export const kitWithProps = (root: FrameRoot,
  props: DBRow,
  styles?: FrameTreeProp,
  actions?: FrameTreeProp) => {
    return frameRootWithProps({...root, node: {...root.node, type:"frame", ref: "spaces://$kit/#*"+root.id}, children: []}, props, styles, actions);
  }

export const frameRootWithProps = (
  root: FrameRoot,
  props: DBRow,
  styles?: FrameTreeProp,
  actions?: FrameTreeProp
) => {
  return {
    ...root,
    node: {
      ...root.node,
      props: {
        ...root.node.props,
        ...props,
      },
      styles: {
        ...root.node.styles,
        ...styles,
      },
      actions: {
        ...root.node.actions,
        ...actions,
      },
    },
  };
};


export const moveFrameToNewSpace = async (
  manager: SpaceManager,
  space: SpaceInfo,
  schemaId: string,
  newSpace: SpaceInfo
) => {
  const table = await manager.readFrame(space.path, schemaId)
  const schemas = await manager.framesForSpace(newSpace.path)
  const newSchemaId = uniqueNameFromString(schemaId, schemas.map(f => f.id))
  const newTable = { schema: {...table.schema, id: newSchemaId}, 
  cols: table.cols.map(f => ({...f, schemaId: newSchemaId})), 
  rows: table.rows.map(f => (f.id == schemaId ? {...f, id: newSchemaId, schemaId: newSchemaId} : f.parentId == schemaId ?  {...f, parentId: newSchemaId, schemaId: newSchemaId} : {...f, schemaId: newSchemaId})) as MFrame[]}
  await manager.saveFrame(newSpace.path, newTable)
  await manager.deleteFrame(newSpace.path, schemaId)

};
export const newUniqueNode = (
  node: FrameRoot,
  parent: string,
  otherNodes: FrameNode[],
  schemaId: string
) : FrameNode => {
  const id = uniqueNameFromString(
    node.node.id,
    otherNodes.map((f) => f.id)
  );
  return {
    ...node.node,
    id,
    schemaId: schemaId,
    parentId: parent,
  };
};

export const newUniqueNodes = (
  node: FrameRoot,
  parent: string,
  otherNodes: FrameNode[],
  schemaId: string
) : FrameNode => {
  const id = uniqueNameFromString(
    node.node.id,
    otherNodes.map((f) => f.id)
  );
  return {
    ...node.node,
    id,
    schemaId: schemaId,
    parentId: parent,
  };
};




