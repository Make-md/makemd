import { Superstate } from "core/superstate/superstate";
import { groupableTypes } from "schemas/frames";
import { SpaceInfo, SpaceTable } from "types/mdb";
import { FrameNode, MFrame } from "types/mframe";
import { insert, uniqueNameFromString } from "utils/array";
import { buildRoot, findParent } from "./ast";
import { frameToNode, mdbSchemaToFrameSchema, nodeToFrame } from "./nodes";
const addNodes = async (superstate: Superstate, tableData: SpaceTable, space: SpaceInfo, treeNode: FrameNode, target?: FrameNode) => {

  if (!tableData) return;
  const frameSchema = mdbSchemaToFrameSchema(tableData.schema)
  
  const nodes = tableData?.rows.map((f) =>
  f.id == frameSchema.id
    ? {
        ...frameToNode(f as MFrame),
        types: tableData.cols.reduce(
          (p, c) => ({ ...p, [c.name]: c.type }),
          {}
        ),
        propsValue: tableData.cols.reduce(
          (p, c) => ({ ...p, [c.name]: c.value }),
          {}
        ),
      }
    : frameToNode(f as MFrame)
) ?? [];
const root = buildRoot(
  frameSchema,
  tableData?.cols ?? [],
  nodes,
  superstate
);
  const id = uniqueNameFromString(
    treeNode.id,
    nodes.map((f) => f.id)
  );

  let parent: FrameNode = target
    ? target : root.node;

  let rank = target ? target.rank + 1 : parent.rank;
  if (!groupableTypes.some((f) => parent.type == f)) {
    parent = findParent(root, parent.id).node;
  } else {
    rank = nodes.filter((f) => f.parentId == parent.id).length;
  }
  const newTreeNode: FrameNode = {
    ...treeNode,
    id,
    schemaId: frameSchema.id,
    parentId: parent.id,
  };
  const newNodes = insert(
    nodes
      .filter((f) => f.parentId == parent.id)
      .sort((a, b) => a.rank - b.rank),
    rank,
    newTreeNode
  ).map((f, i) => ({ ...f, rank: i }));
  const newRows = tableData?.rows?.some((f) => f.id == root.id)
    ? tableData.rows
    : [...(tableData?.rows ?? []), nodeToFrame(root.node)];
  const insertRows = newNodes
    .filter((f) => !newRows.some((g) => g.id == f.id))
    .map((f) => nodeToFrame(f));
  const modRows = newNodes
    .filter((f) => newRows.some((g) => g.id == f.id))
    .map((f) => nodeToFrame(f));
  const newTable = {
    ...tableData,
    cols: tableData.cols ?? [],
    rows: [
      ...newRows.map((f) => modRows.find((g) => g.id == f.id) ?? f),
      ...insertRows,
    ] as MFrame[],
  };

  await superstate.spaceManager.saveFrame(space.path, newTable)
};

export const addNodeToMFrame = async (superstate: Superstate, space: SpaceInfo, schema: string, treeNode: FrameNode, target?: FrameNode) => {
  
  return superstate.spaceManager
  .readFrame(space.path, schema).then((tagDB) =>
    addNodes(superstate, tagDB, space, treeNode, target)
  );

}

  