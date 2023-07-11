import { TreeNode } from "../../superstate/spacesStore/spaces";
import { nodeIsAncestorOfTarget } from "../tree";

export enum ProjectionType {
  FileRank,
  Folder
}

export type DragProjection = {
  depth: number,
  overId: string,
  parentId: string,
  sortable: boolean,
}

function getMaxDepth({ previousItem }: { previousItem: TreeNode }) {
  if (previousItem) {
    if (previousItem.item?.isFolder) return previousItem.depth + 1;
    return previousItem.depth;
  }

  return 0;
}
function getMinDepth({ nextItem }: { nextItem: TreeNode }) {
  if (nextItem) {
    return nextItem.depth;
  }

  return 0;
}

export function getDragDepth(offset: number, indentationWidth: number) {
  return Math.round(offset / indentationWidth) + 1;
}

export function getProjection(
  items: TreeNode[],
  activeItem: TreeNode,
  overItemIndex: number,
  previousItem: TreeNode,
  nextItem: TreeNode,
  dragDepth: number
) : DragProjection {
  const activeIsSection = activeItem.parentId == null;
  const overIsSection = previousItem.parentId == null;

  if (activeIsSection) {
    if (overIsSection) {
      return {
        depth: 0,
        overId: previousItem.id,
        parentId: null,
        sortable: true,
      };
    }
    return null;
  }
  if (nodeIsAncestorOfTarget(activeItem, previousItem)) {
    return null;
  }

  const projectedDepth = dragDepth;
  const maxDepth = getMaxDepth({
    previousItem,
  });
  const minDepth = getMinDepth({ nextItem });
  let depth = projectedDepth;
  if (projectedDepth >= maxDepth) {
    depth = maxDepth;
  } else if (projectedDepth < minDepth) {
    depth = minDepth;
  }

  if (depth == activeItem.depth && activeItem.space == previousItem.space) {
    if (!activeItem.sortable || !previousItem.sortable) {
      return null;
    }
  }
  const parentId = getParentId();
  return {
    depth,
    overId: previousItem.id,
    parentId: parentId,
    sortable: previousItem.sortable
  };

  function getParentId() {
    if (depth === 0) {
      return previousItem.space + "//";
    }
    if (!previousItem) {
      return null;
    }

    if (
      depth === previousItem.depth ||
      (depth > previousItem.depth && !previousItem.item.isFolder)
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
