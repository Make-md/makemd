import { VaultItem } from "core/middleware/types/afile";

import { Superstate } from "core/superstate/superstate";
import { MakeMDSettings } from "core/types/settings";
import { DBRows } from "types/mdb";
import { folderPathToString } from "utils/path";




export const onPathCreated = async (
  superstate: Superstate,
  newPath: string,
) => {
  
  superstate.onPathCreated(newPath)
  
};

export const onPathDeleted = async (superstate: Superstate, oldPath: string) => {
  superstate.onPathDeleted(oldPath)
};

export const onPathChanged = async (
  superstate: Superstate,
  oldPath: string,
  newPath: string
) => {
  return superstate.onPathRename(oldPath, newPath)
};

export const onSpaceRenamed = async (
  superstate: Superstate,
  oldPath: string,
  newPath: string
) => {

  const allChildren = retrieveAllRecursiveChildren(superstate.vaultDBCache, superstate.settings, oldPath)
  await superstate.onPathRename(oldPath, newPath)
  // await folderRenamed(plugin, oldPath, newPath)
  allChildren.forEach(f => superstate.onPathRename(f.path, f.path.replace(oldPath, newPath)))
};

export const onSpaceDeleted = async (superstate: Superstate, oldPath: string) => {
  const allChildren = retrieveAllRecursiveChildren(superstate.vaultDBCache, superstate.settings, oldPath)
  allChildren.forEach(f => superstate.onPathDeleted(f.path))
  superstate.onPathDeleted(oldPath)
  
};

export const excludeVaultItemPredicate =
  (settings: MakeMDSettings) =>
  (f: VaultItem, index: number, folder: VaultItem[]) =>
    !(
      f.folder != "true" &&
      settings.hiddenExtensions.find(
        (e) => (f.path).endsWith(e)
      )
    ) &&
    !settings.hiddenFiles.find((e) => e == f.path) &&
    (!settings.enableFolderNote ||
      (!settings.folderNoteInsideFolder &&
        !folder.some((g) => g.path + ".md" == f.path)) ||
      (settings.folderNoteInsideFolder &&
        !(f.parent + "/" + folderPathToString(f.parent) + ".md" == f.path)));



export const retrieveAllRecursiveChildren = (
  vaultDB: DBRows,
  settings: MakeMDSettings,
  folder: string
) => {
    return vaultDB.filter(f => f['parent'].startsWith(folder)).filter(
      excludeVaultItemPredicate(settings)
    ) as VaultItem[];
};


