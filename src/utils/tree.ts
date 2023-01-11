import { UniqueIdentifier } from "@dnd-kit/core";
import MakeMDPlugin from "main";
import { App, TAbstractFile, TFile, TFolder } from "obsidian";
import { VaultItem } from "schemas/spaces";
import { FlattenedTreeNode } from "types/types";
import { fileExtensionForFile } from "./file";
import { TreeNode } from "./spaces/spaces";

export const uniq = (a: any[]) => [...new Set(a)];
export const uniqCaseInsensitive = (a: string[]) => [
  ...new Map(a.map((s) => [s.toLowerCase(), s])).values(),
];
export const uniqueNameFromString = (name: string, cols: string[]) => {
  let newName = name;
  if (cols.includes(newName)) {
    let append = 1;
    while (cols.includes(newName)) {
      newName = name + append.toString();
      append += 1;
    }
  }
  return newName;
};
export const onlyUniqueProp =
  (prop: string) => (value: any, index: number, self: any[]) => {
    return self.findIndex((v) => value[prop] == v[prop]) === index;
  };

export const fileNameToString = (filename: string) =>
  filename.substring(0, filename.lastIndexOf(".")) || filename;
const removeLeadingSlash = (path: string) =>
  path.charAt(0) == "/" ? path.substring(1) : path;
export const filePathToFolderPath = (filename: string) =>
  removeLeadingSlash(filename.substring(0, filename.lastIndexOf("/"))) ||
  filename;
export const filePathToString = (filename: string) =>
  removeLeadingSlash(
    filename.substring(filename.lastIndexOf("/"), filename.lastIndexOf("."))
  ) || filename;
export const folderPathToString = (filename: string) =>
  removeLeadingSlash(filename.substring(filename.lastIndexOf("/"))) || filename;
export const safelyParseJSON = (json: string) => {
  // This function cannot be optimised, it's best to
  // keep it small!
  var parsed;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    //
    // Oh well, but whatever...
  }

  return parsed; // Could be undefined!
};

export const nodeIsAncestorOfTarget = (node: TreeNode, target: TreeNode) => {
  if (node.item?.folder == "false") return false;
  return target.item?.path.contains(node.item?.path + "/");
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
  (plugin: MakeMDPlugin) =>
  (f: VaultItem, index: number, folder: VaultItem[]) =>
    !(
      f.folder != "true" &&
      plugin.settings.hiddenExtensions.find(
        (e) => fileExtensionForFile(f.path) == e
      )
    ) &&
    !plugin.settings.hiddenFiles.find((e) => e == f.path) &&
    (!plugin.settings.enableFolderNote ||
      (!plugin.settings.folderNoteInsideFolder &&
        !folder.some((g) => g.path + ".md" == f.path)) ||
      (plugin.settings.folderNoteInsideFolder &&
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

export const internalPluginLoaded = (pluginName: string, app: App) => {
  // @ts-ignore
  return app.internalPlugins.plugins[pluginName]?._loaded;
};

export function selectElementContents(el: Element) {
  var range = document.createRange();
  range.selectNodeContents(el);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}
