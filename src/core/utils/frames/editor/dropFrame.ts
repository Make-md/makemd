import { columnNode, columnsNode } from "schemas/frames";
import { FrameNode, FrameTreeNode } from "types/mframe";
import { insert } from "utils/array";
import { findParent } from "../ast";
import { newUniqueNode } from "../frames";

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


export const dropFrame = (activeNode: FrameTreeNode, overNode: FrameTreeNode, root: FrameTreeNode, nodes: FrameNode[], newColumn: boolean) => {
    let saveNodes:FrameNode[] = [];
    const deleteNodes:FrameNode[] = [];
const schemaId = root.node.schemaId;
const overParentNode = findParent(root, overNode.id as string)
const activeParentNode = findParent(root, activeNode.id as string)
if (!overParentNode || !activeParentNode) { 
    return [[], []]
}
if (newColumn) {
    const baseLevelNode = overNode.node.parentId == root.id;
    const containerType = overNode.node.type == 'container';
    const columnType = overNode.node.type == 'column'
    let columnContainerIsBaseLevel = false;
    if (columnType) {
        
        if (overParentNode.node.parentId == root.id)
            columnContainerIsBaseLevel = true;
    }
    const createColumnContainer = baseLevelNode && !containerType;
    const insertColumn = baseLevelNode && containerType || columnType && columnContainerIsBaseLevel ;

    if (createColumnContainer) {
        const newColumns = {...newUniqueNode(
            columnsNode,
            overParentNode.id,
            nodes,
            schemaId,
            
          ), rank: overNode.node.rank};
          const column1 = newUniqueNode(
            columnNode,
            newColumns.id,
            [...nodes, newColumns],
            schemaId
          );

          const column2 = newUniqueNode(
            columnNode,
            newColumns.id,
            [...nodes, newColumns, column1],
            schemaId
          );
          const newNodes = [
            newColumns,
            column1,
            column2,
            { ...overNode.node, rank: 0, parentId: column1.id },
          ];
          saveNodes.push(
            ...newNodes,
            { ...activeNode.node, rank: 0, parentId: column2.id },
          );
    } else if (insertColumn) {
        const column = {
            ...newUniqueNode(columnNode, overParentNode.id, nodes, schemaId),
            rank:
              overNode.node.rank > activeNode.node.rank
                ? overNode.node.rank
                : overNode.node.rank + 1,
          };
          const newNodes = [column, { ...activeNode.node, parentId: column.id }];
          
            saveNodes.push(...newNodes);
    }
} else {
 
        const newRank = overNode.node.rank+1;
        const items = nodes
      .filter((f) => f.parentId == overParentNode.id && f.id != activeNode.id)
      .sort((a, b) => a.rank - b.rank)
      .map((f, i) => ({ ...f, rank: i }));

    // Update item's rank
    const newItem = {...activeNode.node, parentId: overNode.node.parentId}
    const newItems = insert(items, newRank, newItem).map((f, i) => ({
      ...f,
      rank: i,
    }));

    saveNodes.push(...newItems)
}
if (shouldDeleteColumn(activeParentNode)) {
    const columnParentNode = findParent(root, activeParentNode.id)
    deleteNodes.push(activeParentNode.node)
    if (shouldDeleteColumnContainer(columnParentNode)) {
        deleteNodes.push(columnParentNode.node)
    } else if (shouldCollapseColumnContainer(columnParentNode)) {
        const removeColumn = columnParentNode.children.filter(f => f.id != activeParentNode.id);
        deleteNodes.push(...removeColumn.map(f => f.node), columnParentNode.node)
        const moveToParentNodes = removeColumn.flatMap(f => f.children.map(f => ({...f.node, parentId: root.id})));
        saveNodes = [...saveNodes.map(f =>  moveToParentNodes.some(g => g.id == f.id) ? {...f, parentId: root.id} : f), ...moveToParentNodes.filter(g => !saveNodes.some(f=>g.id == f.id))]
    }
}
return [saveNodes, deleteNodes]
}
