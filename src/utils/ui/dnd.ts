import { FlattenedTreeNode } from "types/types";
import { TreeNode } from "../spaces/spaces";
import { nodeIsAncestorOfTarget } from "../tree";

function getMaxDepth({ previousItem }: { previousItem: TreeNode }) {
  if (previousItem) {
    if (previousItem.item?.folder == "true") return previousItem.depth + 1;
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
) {
  const activeIsSection = activeItem.parentId == null;
  const overIsSection = previousItem.parentId == null;

  if (activeIsSection) {
    if (overIsSection) {
      return {
        depth: 0,
        maxDepth: 0,
        minDepth: 0,
        overId: previousItem.id,
        parentId: null,
      };
    }
    return null;
  }
  if (nodeIsAncestorOfTarget(activeItem, previousItem)) {
    return null;
  }

  if (activeItem.space != previousItem.space) {
    if (previousItem.space == "/") {
      return null;
    }
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
  if (previousItem.space != "/" && depth > 1) {
    return null;
  }

  if (depth <= activeItem.depth && activeItem.space == previousItem.space) {
    if (!activeItem.sortable || !previousItem.sortable) {
      return null;
    }
  }
  return {
    depth,
    maxDepth,
    minDepth,
    overId: previousItem.id,
    parentId: getParentId(),
  };

  function getParentId() {
    if (depth === 0) {
      return previousItem.space == "/" ? "/" : previousItem.space + "//";
    }
    if (!previousItem) {
      return "/";
    }

    if (
      depth === previousItem.depth ||
      (depth > previousItem.depth && previousItem.item?.folder != "true")
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
