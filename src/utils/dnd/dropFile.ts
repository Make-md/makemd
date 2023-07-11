import { Active, Over } from "@dnd-kit/core";
import i18n from "i18n";
import MakeMDPlugin from "main";
import { Notice } from "obsidian";
import { Space } from "schemas/spaces";
import { insertSpaceAtIndex, insertSpaceItemAtIndex, moveAFileToNewParentAtIndex, removePathsFromSpace, TreeNode, updateFileRank } from "superstate/spacesStore/spaces";
import { DragProjection } from "./dragFile";



export const dropFileInTree = async (plugin: MakeMDPlugin, active: Active, over: Over, projected : DragProjection, flattenedTree: TreeNode[], activeSpaces: Space[]) => {
    if (projected) {
      const clonedItems: TreeNode[] = flattenedTree;
      const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
      const overItem = clonedItems[overIndex];
      const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);
      const activeItem = clonedItems[activeIndex];

      const activeIsSection = activeItem.parentId == null;
      const overIsSection = overItem.parentId == null;
      const overSpace: Space = activeSpaces.find(
        (f) => f.name == overItem.space
      );
      const activeSpace: Space = activeSpaces.find(
        (f) => f.name == activeItem.space
      );
      const overIsFolderSpace = overSpace?.def?.folder?.length > 0;
      const overIsSmartSpace = overSpace?.def?.type == 'smart';
      const activeIsFolderSpace = activeSpace?.def?.folder?.length > 0;
      const activeIsSmartSpace = activeSpace?.def?.type == 'smart';
      
      const { depth, overId, parentId } = projected;
      const parentItem = clonedItems.find(({ id }) => id === parentId);
      const parentIsSpace = parentItem?.item ? false : true
      const newRank = overItem.item?.rank ?? "-1";
      if (activeIsSection) {
        if (overIsSection) {
          const activeSpace: Space = activeSpaces.find(
            (f) => f.name == activeItem.space
          );
          insertSpaceAtIndex(
            plugin,
            activeSpace,
            overSpace ? parseInt(overSpace.rank) : activeSpaces.length
          );
      }
      return;
    }
    let newParent = activeItem.item.parent;
    if (parentIsSpace) {
      if (overIsSmartSpace) {
        //dont allow drop in smart space
        return;
      }
      if (overIsFolderSpace) {
        //is root of folder space
        newParent = overSpace.def.folder
      
      } else {
        //is normal space, dont do anything
        insertSpaceItemAtIndex(
          plugin,
          overItem.space,
          activeItem.item.path,
          parseInt(newRank)
        );
        return;
      }
    } else {
      //is moving to a folder
      newParent = parentItem.item.isFolder
              ? parentItem.item.path
              : parentItem.item.parent;
              
    }
    
    const newPath = newParent == "/"
              ? activeItem.file.name
              : `${newParent}/${activeItem.file.name}`;
    if (newPath == activeItem.item.path) {
      if (!activeIsFolderSpace && activeItem.depth == 1) {
        removePathsFromSpace(plugin, activeItem.space, [
          activeItem.item.path,
        ]);
      }
      if (activeItem.parentId == overItem.id) {
        updateFileRank(plugin, activeItem.item, -1);
        return;
      } else {
        updateFileRank(plugin, activeItem.item, parseInt(newRank));
        return;
      }
        
    } else {
      if (plugin.app.vault.getAbstractFileByPath(newPath)) {
        new Notice(i18n.notice.duplicateFile);
        return;
      }
      removePathsFromSpace(plugin, activeItem.space, [
        activeItem.item.path,
      ]);
      moveAFileToNewParentAtIndex(
        plugin,
        activeItem.item,
        newParent,
        parseInt(newRank)
      );
      return;
    }
  }
  };