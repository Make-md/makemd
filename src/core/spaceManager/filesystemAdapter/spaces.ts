import { VaultItem } from "shared/types/afile";

import { Superstate } from "makemd-core";
import { DBRows } from "shared/types/mdb";
import { MakeMDSettings } from "shared/types/settings";
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





export const excludeVaultItemPredicate =
  (settings: MakeMDSettings) =>
  (f: VaultItem, index: number, folder: VaultItem[]) =>
    !(
      (f.path.endsWith('/'+settings.spaceSubFolder) || f.path == settings.spaceSubFolder ||
      settings.hiddenExtensions.find(
        (e) => (f.path).endsWith(e)
      ))
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


