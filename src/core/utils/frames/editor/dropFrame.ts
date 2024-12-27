import { columnNode, columnsNode } from "schemas/kits/base";
import { FrameEditorMode, FrameTreeNode } from "shared/types/frameExec";
import { FrameNode } from "shared/types/mframe";
import { Edges } from "shared/types/Pos";
import { insert, uniqueNameFromString } from "shared/utils/array";
import { findParent } from "../ast";
import { newUniqueNode } from "../frames";
import { relinkProps } from "../linker";

const shouldDeleteColumn = (nodeParent: FrameTreeNode) => {
    if (nodeParent.node.type == 'column' && nodeParent.children.length == 1) {
        return true;
    }
    return false;
}

const shouldDeleteColumnContainer = (nodeParent: FrameTreeNode) => {
    if (nodeParent.node.type == 'container' && nodeParent.children.length == 1) {
        return true;
    }
    return false;
}


const shouldCollapseColumnContainer = (nodeParent: FrameTreeNode) => {
    if (nodeParent.node.type == 'container' && nodeParent.children.length == 2) {
        return true;
    }
    return false;
}


export const dropFrame = (_activeNode: FrameNode, overNode: FrameTreeNode, root: FrameTreeNode, nodes: FrameNode[], direction: Edges) => {
  
  let activeNode = _activeNode;
  if (activeNode.schemaId != root.id) {
    activeNode = relinkProps("$root", root.id, activeNode, root.id);
    
      const id = uniqueNameFromString(
        activeNode.id,
        nodes.map((f) => f.id)
      );
      activeNode = relinkProps(activeNode.id, id, activeNode, root.id);
      activeNode.id = id;
      activeNode.schemaId = root.id;
  }
    let saveNodes:FrameNode[] = [];
    const deleteNodes:FrameNode[] = [];

    if (activeNode.id == overNode.id) {
      return [[], []];
    }
    
const schemaId = root.node.schemaId;
const overParentNode = findParent(root, overNode.id as string)
const activeParentNode = findParent(root, activeNode.id as string)
if (!overParentNode) { 
    return [[], []]
}


const isDroppableColumn = overNode.node.type == 'column';

if (direction == 'inside') {
  const newItem = {...activeNode, parentId: overNode.node.id}
      saveNodes.push(newItem);
} else 
if (isDroppableColumn ||(root.editorProps.editMode == FrameEditorMode.Page && overNode.node.parentId == root.id && (direction == 'left' || direction == 'right'))) {
    const baseLevelNode = overNode.node.parentId == root.id;
    const containerType = overNode.node.type == 'container';
    const columnType = overNode.node.type == 'column'
    let columnContainerIsBaseLevel = false;
    if (columnType) {
        
        if (overParentNode.node.parentId == root.id)
            columnContainerIsBaseLevel = true;
    }
    const createColumnContainer = baseLevelNode && !containerType;
    const insertColumn = (baseLevelNode && containerType) || columnType && columnContainerIsBaseLevel ;
    if (createColumnContainer) {
        const newColumns = {...newUniqueNode(
            columnsNode,
            overParentNode.id,
            nodes,
            schemaId,
            
          ), rank: overNode.node.rank};
          const column1 = {...newUniqueNode(
            columnNode,
            newColumns.id,
            [...nodes, newColumns],
            schemaId
          ), rank: direction == 'left' ? 1 : 0};

          const column2 = {...newUniqueNode(
            columnNode,
            newColumns.id,
            [...nodes, newColumns, column1],
            schemaId
          ), rank: direction == 'left' ? 0 : 1};
          const newNodes = [
            newColumns,
            column1,
            column2,
            { ...overNode.node, rank: 0, parentId: column1.id },
          ];
          saveNodes.push(
            ...newNodes,
            { ...activeNode, rank: 0, parentId: column2.id },
          );
    } else if (insertColumn) {
      const containerID = containerType ? overNode.id : overNode.node.parentId;
        const column = {
            ...newUniqueNode(columnNode, containerID, nodes, schemaId),
            rank:
              direction == 'left'
                ? containerType ? 0 : overNode.node.rank
                : containerType ?  overNode.children.length : overNode.node.rank + 1,
          };
          const newNodes = [column, { ...activeNode, parentId: column.id }];
          
            saveNodes.push(...newNodes);
    }
} else {
 
        
        const items = nodes
      .filter((f) => f.parentId == overParentNode.id && f.id != activeNode.id)
      .sort((a, b) => a.rank - b.rank)
      .map((f, i) => ({ ...f, rank: i }));
    const overNodeRank = items.find(f => f.id == overNode.id)?.rank ?? 0;
      const newRank = direction =="bottom" || direction == 'right' ? overNodeRank+1 : overNodeRank;
    // Update item's rank
    const newItem = {...activeNode, parentId: overNode.node.parentId}
    const newItems = insert(items, newRank, newItem).map((f, i) => ({
      ...f,
      rank: i,
    }));

    saveNodes.push(...newItems)
}
if (activeParentNode && shouldDeleteColumn(activeParentNode)) {
    const columnParentNode = findParent(root, activeParentNode.id)
    deleteNodes.push(activeParentNode.node)
    if (shouldDeleteColumnContainer(columnParentNode)) {
        deleteNodes.push(columnParentNode.node)
    } else if (shouldCollapseColumnContainer(columnParentNode)) {
        const removeColumn = columnParentNode.children.filter(f => f.id != activeParentNode.id);
        deleteNodes.push(...removeColumn.map(f => f.node), columnParentNode.node)
        const moveToParentNodes : FrameNode[] = removeColumn.flatMap(f => f.children.map(f => ({...f.node, parentId: root.id, rank: columnParentNode.node.rank})));
        moveToParentNodes.push(...saveNodes.filter(f => removeColumn.some(g => g.id == f.parentId)))
        saveNodes = [...saveNodes.map(f =>  moveToParentNodes.some(g => g.id == f.id) ? {...f, parentId: root.id} : f), ...moveToParentNodes.filter(g => !saveNodes.some(f=>g.id == f.id))]
    }
}
return [saveNodes, deleteNodes]
}
