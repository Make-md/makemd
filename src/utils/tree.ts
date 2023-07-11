import { UniqueIdentifier } from "@dnd-kit/core";
import MakeMDPlugin from "main";
import { App, TAbstractFile, TFile, TFolder } from "obsidian";
import { VaultItem } from "schemas/spaces";
import { MakeMDPluginSettings } from "types/settings";
import { FlattenedTreeNode } from "types/types";
import { TreeNode } from "../superstate/spacesStore/spaces";
import { fileExtensionForFile } from "./file";
import { folderPathToString } from "./strings";



export const nodeIsAncestorOfTarget = (node: TreeNode, target: TreeNode) => {
  if (!node.item || !node.item.isFolder) return false;
  return target.item?.path.contains(node.item.path + "/");
};

// Helper Function to Create Folder Tree

export function includeChildrenOf(
  items: FlattenedTreeNode[],
  ids: UniqueIdentifier[]
) {
  const excludeParentIds = items
    .filter(
      (f) =>
        // @ts-ignore
        f.children?.length > 0 && !ids.find((i) => i == f.id) && f.id != "/"
    )
    .map((f) => f.id);
  return items.filter((item) => {
    if (item.parentId && excludeParentIds.includes(item.parentId)) {
      //@ts-ignore
      if (item.children?.length) {
        excludeParentIds.push(item.id);
      }
      return false;
    }

    return true;
  });
}

export const excludeVaultItemPredicate =
  (settings: MakeMDPluginSettings) =>
  (f: VaultItem, index: number, folder: VaultItem[]) =>
    !(
      f.folder != "true" &&
      settings.hiddenExtensions.find(
        (e) => fileExtensionForFile(f.path) == e
      )
    ) &&
    !settings.hiddenFiles.find((e) => e == f.path) &&
    (!settings.enableFolderNote ||
      (!settings.folderNoteInsideFolder &&
        !folder.some((g) => g.path + ".md" == f.path)) ||
      (settings.folderNoteInsideFolder &&
        !(f.parent + "/" + folderPathToString(f.parent) + ".md" == f.path)));

export const excludeFilePredicate =
  (plugin: MakeMDPlugin) =>
  (f: TAbstractFile, index: number, folder: TAbstractFile[]) =>
    !(
      f instanceof TFile &&
      plugin.settings.hiddenExtensions.find((e) => f.extension == e)
    ) &&
    !plugin.settings.hiddenFiles.find((e) => e == f.path) &&
    (!plugin.settings.enableFolderNote ||
      (!plugin.settings.folderNoteInsideFolder &&
        !folder.some((g) => g.path + ".md" == f.path)) ||
      (plugin.settings.folderNoteInsideFolder &&
        !(f.parent.path + "/" + f.parent.name + ".md" == f.path)));

export const folderChildren = (
  plugin: MakeMDPlugin,
  f: TFolder,
  exclusionList?: string[]
) => {
  return f?.children?.filter(excludeFilePredicate(plugin)) ?? [];
};

export const compareByField =
  (field: string, dir: boolean) =>
  (_a: Record<string, any>, _b: Record<string, any>) => {
    const a = dir ? _a : _b;
    const b = dir ? _b : _a;
    if (a[field] < b[field]) {
      return -1;
    }
    if (a[field] > b[field]) {
      return 1;
    }
    return 0;
  };

export const compareByFieldCaseInsensitive =
  (field: string, dir: boolean) =>
  (_a: Record<string, any>, _b: Record<string, any>) => {
    const a = dir ? _a : _b;
    const b = dir ? _b : _a;
    if (a[field].toLowerCase() < b[field].toLowerCase()) {
      return -1;
    }
    if (a[field].toLowerCase() > b[field].toLowerCase()) {
      return 1;
    }
    return 0;
  };

export const internalPluginLoaded = (pluginName: string, app: App) => {
  // @ts-ignore
  return app.internalPlugins.plugins[pluginName]?._loaded;
};

export function selectElementContents(el: Element) {
  if (!el) return;
  var range = document.createRange();
  range.selectNodeContents(el);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}
