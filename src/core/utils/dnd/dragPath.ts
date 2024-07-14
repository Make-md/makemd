import { DropModifiers } from "core/react/components/Navigator/SpaceTree/SpaceTreeItem";
import { TreeNode } from "../../superstate/utils/spaces";

export enum ProjectionType {
  PathRank,
  Space
}

export type DragProjection = {
  depth: number,
  overId: string,
  parentId: string,
  sortable: boolean,
  insert: boolean,
  droppable: boolean,
  copy: boolean,
  reorder: boolean
}

function getMaxDepth( previousItem: TreeNode, dirDown: boolean) {
  if (previousItem) {
    if (previousItem.item?.type == 'space' && !previousItem.collapsed && dirDown) return previousItem.depth + 1;
    return previousItem.depth;
  }

  return 0;
}
function getMinDepth(previousItem: TreeNode) {
  if (previousItem) {
    return Math.max(0,previousItem.depth-1);
  }

  return 0;
}

export function getDragDepth(offset: number, indentationWidth: number) {

  return Math.round(offset / indentationWidth);
}

export const getMultiProjection = (flattenedTree: TreeNode[], paths: string[], overIndex: number, modifier: DropModifiers) => {
  const overItem = flattenedTree[overIndex];
      if (!overItem) return;
      const dropTarget =
        overItem.type == "file"
          ? flattenedTree.find((f) => f.id == overItem.parentId)
          : overItem;
      
      if (dropTarget && dropTarget.type != 'file') {
        const _projected: DragProjection = {
          depth: overItem.depth,
          overId: overItem.id,
          parentId: dropTarget.id,
          sortable: false,
          insert: dropTarget.collapsed,
          droppable: true,
          copy: modifier == 'link' || modifier == 'copy',
          reorder: false
        };
       return _projected 
      }
      return null;
}

export function getProjection(
  activeItem: TreeNode,
  items: TreeNode[],
  paths: string[],
  overItemIndex: number,
  dragDepth: number,
  yOffset: number,
  dirDown: boolean,
modifier: DropModifiers,
activeSpaceID: string,
) : DragProjection {
  if (paths.length == 0) return null;
  if(paths.length > 1) return getMultiProjection(items, paths, overItemIndex, modifier)
const overItem = items[overItemIndex]
const previousItem = items[overItemIndex]
const nextItem = items[overItemIndex+1];

if (!previousItem) return;
  // if (nodeIsAncestorOfTarget(path, previousItem.uri)) {
  //   return null;
  // }
  
const previousItemDroppable = previousItem.type != 'file'
const insert = activeItem.depth > 0 &&  overItem.collapsed && previousItemDroppable && (!overItem.sortable || dirDown && yOffset <= 13 || !dirDown && yOffset >= 13)
  const sortable = overItem.sortable || previousItemDroppable && !insert && nextItem.sortable
  const projectedDepth = dragDepth;
  const maxDepth = activeItem.depth == 0 ? 0 : getMaxDepth(
    previousItem, dirDown
  );
  const minDepth = getMinDepth(previousItem);

  let depth = projectedDepth;
  if (projectedDepth >= maxDepth) {
    depth = maxDepth;
  } else if (projectedDepth < minDepth) {
    depth = minDepth;
  }
  const parentId = getParentId();
  
const parent = items.find(f => f.id == parentId)

  return {
    depth,
    overId: previousItem.id,
    parentId: parentId,
    sortable: sortable,
    insert,
    droppable: parent?.type != 'file',
    copy: (modifier == 'link' || modifier == 'copy'),
    reorder: insert ? activeItem?.parentId == overItem?.id : activeItem?.parentId == parent?.id || activeItem?.parentId == activeSpaceID
  };

  function getParentId() {
    if (depth === 0) {
      return null;
    }
    if (!previousItem) {
      return null;
    }

    if (
      depth === previousItem.depth ||
      (depth > previousItem.depth && previousItem.item.type != 'space')
    ) {
      return previousItem.parentId;
    }

    if (depth > previousItem.depth) {
      return previousItem.id;
    }

    const newParent = items
      .slice(0, overItemIndex)
      .reverse()
      .find((item) => item.depth === depth)?.parentId;

    return newParent ?? null;
  }
}
