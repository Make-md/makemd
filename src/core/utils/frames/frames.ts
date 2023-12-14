import { parseFieldValue } from "core/schemas/parseFieldValue";
import { SpaceManager } from "core/spaceManager/spaceManager";
import { SpaceInfo, SpaceProperty } from "types/mdb";
import { FrameNode, FrameRoot, MFrame } from "types/mframe";
import { uniqueNameFromString } from "utils/array";


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

export const stringIsConst = (str: string): boolean => {
  // Check for quotes at the start and end without any quotes inside
  const hasQuotesAtStartEndOnly =  /^["'][^"']*["'](?:;)?$/.test(str);
  // Check for number by trying to parse string into a number and checking if it's NaN
  const isNumber = !isNaN(parseFloat(str)) && isFinite(str as any);

  return hasQuotesAtStartEndOnly || isNumber || str == null || str == "";
}



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




