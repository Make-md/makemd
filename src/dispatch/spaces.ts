import MakeMDPlugin from "main";
import { spaceItemsSchema, vaultSchema } from "schemas/spaces";
import { retrieveAllRecursiveChildren } from "superstate/spacesStore/spaces";
import { SpaceChange, eventTypes } from "types/types";
import {
  getAbstractFileAtPath,
  getFolderFromPath,
  getFolderPathFromString,
  renameFile
} from "utils/file";

export const dispatchSpaceDatabaseFileChanged = (type: SpaceChange, action?: string, name?: string, newName?: string) => {
  let evt = new CustomEvent(eventTypes.spacesChange, {
    detail: {
      type: type,
      action, 
      name,
      newName
    },
  });
  window.dispatchEvent(evt);
};

export const onFileCreated = async (
  plugin: MakeMDPlugin,
  newPath: string,
  folder: boolean
) => {
  const parent = getAbstractFileAtPath(app, newPath).parent?.path;
  await plugin.index.saveSpacesDatabaseToDisk({vault: { ...vaultSchema, rows: [...plugin.index.vaultDBCache, {
    path: newPath,
    parent: parent,
    created: Math.trunc(Date.now() / 1000).toString(),
    folder: folder ? "true" : "false",
  }]}})
  plugin.index.createFile(newPath)
  
};

export const onFileDeleted = async (plugin: MakeMDPlugin, oldPath: string) => {
  const newVaultRows = plugin.index.vaultDBCache.filter(f => f.path != oldPath);
  const newSpaceItemsRows = plugin.index.spacesItemsDBCache.filter(f => f.path != oldPath);
  await plugin.index.saveSpacesDatabaseToDisk({ vault: {...vaultSchema, rows: newVaultRows}, spaceItems: {...spaceItemsSchema, rows: newSpaceItemsRows} });
  plugin.index.deleteFile(oldPath)
};

export const onFileChanged = async (
  plugin: MakeMDPlugin,
  oldPath: string,
  newPath: string
) => {
  
  const newFolderPath = getFolderPathFromString(newPath);
  const newVaultRows = plugin.index.vaultDBCache.map(f => f.path == oldPath ?
       {
        ...f,
        path: newPath,
        parent: newFolderPath
      } : f);
      const newSpaceItemsRows = plugin.index.spacesItemsDBCache.map(f => f.path == oldPath ?
        {
         ...f,
         path: newPath,
       } : f);
       await plugin.index.saveSpacesDatabaseToDisk({ vault: {...vaultSchema, rows: newVaultRows}, spaceItems: {...spaceItemsSchema, rows: newSpaceItemsRows} });
  plugin.index.renameFile(oldPath, newPath)
};

export const onFolderChanged = async (
  plugin: MakeMDPlugin,
  oldPath: string,
  newPath: string
) => {
  const newFolderPath = getFolderFromPath(app, newPath).parent.path;
  const allChildren = retrieveAllRecursiveChildren(plugin.index.vaultDBCache, plugin.settings, oldPath)
  const newVaultRows = plugin.index.vaultDBCache.map(f => f.path == oldPath ?
    {
     ...f,
     path: newPath,
     parent: newFolderPath
   } : f.parent.startsWith(oldPath) || f.path.startsWith(oldPath) ? {
    ...f,
    path: f.path.replace(oldPath, newPath),
    parent: f.parent.replace(oldPath, newPath),
   } : f);
   const newSpaceItemsRows = plugin.index.spacesItemsDBCache.map(f => f.path == oldPath ?
    {
     ...f,
     path: newPath,
   } : f.path.startsWith(oldPath) ? {
    ...f,
    path: f.path.replace(oldPath, newPath),
   } : f);
  
  
   await plugin.index.saveSpacesDatabaseToDisk({ vault: {...vaultSchema, rows: newVaultRows}, spaceItems: {...spaceItemsSchema, rows: newSpaceItemsRows} });
  plugin.index.renameFile(oldPath, newPath)
  if (plugin.settings.enableFolderNote && !plugin.settings.folderNoteInsideFolder) {
    const file = getAbstractFileAtPath(app, oldPath+'.md')
    if (file)
    renameFile(plugin, file, newPath+'.md');
  }
  allChildren.forEach(f => plugin.index.renameFile(f.path, f.path.replace(oldPath, newPath)))
};

export const onFolderDeleted = async (plugin: MakeMDPlugin, oldPath: string) => {
  const allChildren = retrieveAllRecursiveChildren(plugin.index.vaultDBCache, plugin.settings, oldPath)
  const newVaultRows = plugin.index.vaultDBCache.filter(f => f.path != oldPath && !f.parent.startsWith(oldPath));
  const newSpaceItemsRows = plugin.index.spacesItemsDBCache.filter(f => f.path != oldPath && !f.path.startsWith(oldPath));
  await plugin.index.saveSpacesDatabaseToDisk({ vault: {...vaultSchema, rows: newVaultRows}, spaceItems: {...spaceItemsSchema, rows: newSpaceItemsRows} });
  allChildren.forEach(f => plugin.index.deleteFile(f.path))
  plugin.index.deleteFile(oldPath)
  
};
