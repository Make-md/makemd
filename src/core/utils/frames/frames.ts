import { parseFieldValue } from "core/schemas/parseFieldValue";
import { SpaceManager } from "core/spaceManager/spaceManager";
import { isInteger, isString } from "lodash";
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

export const nameForField = (field: SpaceProperty) => {
  if (!field) return null;
  const parsedValue = parseFieldValue(field.value, field.type);
  
  return parsedValue.alias ?? field.name
}

export const removeTrailingSemicolon = (str: string) => {
  return str.replace(/;+$/, "");
}

export const objectIsConst = (objString: string, type: string): boolean => {
  if (!objString) return false;
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
  if (!str || isInteger(str)) return true;
  if (!isString(str)) return false;
  
  // Check for quotes at the start and end without any quotes inside
  const hasQuotesAtStartEndOnly = /^["'](?:[^"\\]|\\.)*["'](?:;)?$/.test(str);
  const fixedStr =  str?.replace(/;+$/, "");
  // Check for number by trying to parse string into a number and checking if it's NaN
  const isNumber = !isNaN(parseFloat(fixedStr)) && !isNaN(fixedStr as any);
  return hasQuotesAtStartEndOnly || isNumber || fixedStr.startsWith('[') && fixedStr.endsWith(']') || fixedStr == 'false' || fixedStr == 'true' || str == null || str == "";
}

export const kitWithProps = (root: FrameRoot,
  props: DBRow,
  styles?: FrameTreeProp,
  actions?: FrameTreeProp,
  interactions?: FrameTreeProp) => {
    if (!root) {
      return {} as FrameRoot;
    }
    
    const safeRoot = {
      ...root,
      node: {
        ...(root.node || { id: '', schemaId: '', parentId: '', name: '', rank: 0, type: 'frame' }),
        type: "frame",
        ref: "spaces://$kit/#*" + (root.id || ''),
        id: root.node?.id || '',
        schemaId: root.node?.schemaId || '',
        parentId: root.node?.parentId || '',
        name: root.node?.name || '',
        rank: root.node?.rank || 0
      },
      children: [] as FrameRoot[]
    };
    
    return frameRootWithProps(safeRoot, props, styles, actions, interactions);
  }

export const frameRootWithProps = (
  root: FrameRoot,
  props: FrameTreeProp,
  styles?: FrameTreeProp,
  actions?: FrameTreeProp,
  interactions?: FrameTreeProp
) : FrameRoot => {
  if (!root || !root.node) {
    return {
      id: root?.id || 'unknown',
      def: root?.def || { id: 'unknown' },
      node: {
        type: 'frame',
        ref: 'spaces://$kit/#*unknown',
        id: root?.id || '',
        schemaId: '',
        parentId: '',
        name: 'Unknown',
        rank: root?.node?.rank || 0
      },
      children: [] as FrameRoot[]
    };
  }
  
  return {
    ...root,
    node: {
      ...root.node,
      props: {
        ...(root.node.props || {}),
        ...(props || {}),
      },
      styles: {
        ...(root.node.styles || {}),
        ...(styles || {}),
      },
      actions: {
        ...(root.node.actions || {}),
        ...(actions || {}),
      },
      interactions: {
        ...(root.node.interactions || {}),
        ...(interactions || {})
      }
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




