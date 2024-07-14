import { UniqueIdentifier } from "@dnd-kit/core";
import { DropModifiers } from "core/react/components/Navigator/SpaceTree/SpaceTreeItem";
import { Superstate } from "core/superstate/superstate";
import { TreeNode } from "core/superstate/utils/spaces";
import { PathState, SpaceState } from "core/types/superstate";
import { nodeIsAncestorOfTarget } from "core/utils/tree";



import { arrayMove } from "@dnd-kit/sortable";
import { movePathToNewSpaceAtIndex, pinPathToSpaceAtIndex, removePathsFromSpace, updatePathRankInSpace } from "core/superstate/utils/spaces";
import { addTagToPath } from "core/superstate/utils/tags";
import { DragProjection } from "./dragPath";



export const dropPathsInTree = async (superstate: Superstate, paths: string[], active: UniqueIdentifier, over: UniqueIdentifier, projected : DragProjection, flattenedTree: TreeNode[], activeSpaces: PathState[], modifier?: DropModifiers) => {

  if (paths.length == 1) {
    dropPathInTree(superstate, paths[0], active, over, projected, flattenedTree, activeSpaces, modifier)
    return;
  }
    if (projected) {
      const overIndex = flattenedTree.findIndex(({ id }) => id === over);
      const overItem = flattenedTree[overIndex];
      const dropTarget =
        overItem.type == "file"
          ? overItem.depth == 0 ? null : flattenedTree.find((f) => f.id == overItem.parentId)?.item
          : overItem.item;
          
      const droppable = paths.filter((f) =>
       !nodeIsAncestorOfTarget(f, (dropTarget as SpaceState).path)
      );

      const parentId = projected.insert ? over : projected.parentId;
      const newSpace = flattenedTree.find(({ id }) => id === parentId)?.item.path;
      const newRank = parentId == overItem.id ? -1 : overItem.rank ?? -1;
      
      

      if (!newSpace) return;
      dropPathsInSpaceAtIndex(superstate, droppable, newSpace, projected.sortable && newRank, modifier);
    }
  };

export const dropPathInTree = async (superstate: Superstate, path: string, active: UniqueIdentifier, over: UniqueIdentifier, projected : DragProjection, flattenedTree: TreeNode[], activeSpaces: PathState[], modifier?: DropModifiers) => {

    if (projected) {

      const clonedItems: TreeNode[] = flattenedTree;
      const overIndex = clonedItems.findIndex(({ id }) => id === over);
      const overItem = clonedItems[overIndex];
      
      const parentId = projected.insert ? over : projected.parentId;

      const newSpace = projected.depth == 0 && !projected.insert ? null : clonedItems.find(({ id }) => id === parentId)?.item.path;

      const newRank = parentId == null ? activeSpaces.findIndex(f => f?.path == overItem.id) :  parentId == overItem.id ? -1 : overItem.rank ?? -1;

      if (!active) {
        
        dropPathInSpaceAtIndex(superstate, path, null, newSpace, projected.sortable && newRank, modifier);
        return;
      }
      const activeIndex = clonedItems.findIndex(({ id }) => id === active);
      const activeItem = clonedItems[activeIndex];

      const oldSpace = activeItem.parentId == null ? null : clonedItems.find(({ id }) => id === activeItem.parentId)?.item.path;
      dropPathInSpaceAtIndex(superstate,activeItem.item.path, oldSpace, newSpace,projected.sortable && newRank, modifier);
    }
  };

  export const reorderOpenSpace = (superstate: Superstate, path: string, index: number) => {
    const newWaypoint = superstate.waypoints[
      superstate.settings.currentWaypoint
    ] ?? { sticker: "", name: "Waypoint", paths: [] };
    const currentIndex = newWaypoint.paths.findIndex(f => f == path);
    const newIndex = currentIndex > index ? Math.max(0, index - 1) : index;
    newWaypoint.paths = arrayMove(newWaypoint.paths, newWaypoint.paths.findIndex(f => f == path), newIndex);
    if (
      superstate.settings.currentWaypoint >
      superstate.waypoints.length
    ) {
      superstate.spaceManager.saveWaypoints([
        ...superstate.waypoints,
        newWaypoint,
      ]);
    }
    const newWaypoints = superstate.waypoints.map((f, i) =>
      i == superstate.settings.currentWaypoint ? newWaypoint : f
    );
    superstate.spaceManager.saveWaypoints(newWaypoints);
  };
export const dropPathInSpaceAtIndex = async (superstate: Superstate,
  path: string,
  oldSpacePath: string | null,
  newSpacePath: string, index: number, modifier?: DropModifiers) => {
  const cache: PathState = superstate.pathsIndex.get(path);

  if (!cache)
    return false;
  if (!newSpacePath) {
    reorderOpenSpace(superstate, path, index);
    return;
  }
  const newSpaceCache = superstate.spacesIndex.get(newSpacePath);

  if (oldSpacePath == newSpacePath) {
    updatePathRankInSpace(superstate, path, index, newSpacePath);
    return;
  }

  if (newSpaceCache.type == 'folder' || newSpaceCache.type == 'vault') {
    if (modifier == 'link' || nodeIsAncestorOfTarget(path, newSpaceCache.path)) {
      pinPathToSpaceAtIndex(superstate, newSpaceCache, path, index);
    } else {
      movePathToNewSpaceAtIndex(superstate, superstate.pathsIndex.get(path), newSpaceCache.path, index, modifier == 'copy');
    }
  }
  if (newSpaceCache.type == 'tag') {
    addTagToPath(superstate, path, newSpaceCache.name);
  }


  if (oldSpacePath && oldSpacePath != newSpacePath) {
    removePathsFromSpace(superstate, oldSpacePath, [path]);
  }
};export const dropPathsInSpaceAtIndex = async (superstate: Superstate,
  paths: string[],
  newSpacePath: string, index: number, modifier?: DropModifiers) => {

  const newSpaceCache = superstate.spacesIndex.get(newSpacePath);
  if (!newSpaceCache) return;
  if (newSpaceCache.type == 'folder' || newSpaceCache.type == 'vault') {
    paths.forEach(path => {
      if (modifier == 'link' || nodeIsAncestorOfTarget(path, newSpaceCache.path)) { pinPathToSpaceAtIndex(superstate, newSpaceCache, path, index); }
      else { movePathToNewSpaceAtIndex(superstate, superstate.pathsIndex.get(path), newSpaceCache.path, index, modifier == 'copy'); }
    });
  }

  if (newSpaceCache.type == 'tag') {
    paths.forEach(path => addTagToPath(superstate, path, newSpaceCache.name));
  }
};

