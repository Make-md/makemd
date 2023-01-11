import { CONTEXT_VIEW_TYPE } from "components/ContextView/ContextView";
import { VaultChangeModal } from "components/ui/modals/vaultChangeModals";
import i18n from "i18n";
import MakeMDPlugin from "main";
import {
  App,
  Keymap, normalizePath, Platform,
  TAbstractFile, TFile,
  TFolder
} from "obsidian";
import { DBRow, MDBField } from "types/mdb";
import { eventTypes, FlattenedTreeNode, FolderTree } from "types/types";
import { folderChildren, selectElementContents } from "./tree";

export const defaultNoteFolder = (plugin: MakeMDPlugin, activeFile: string) =>
  (plugin.settings.newFileLocation == "folder"
    ? getFolderFromPath(app, plugin.settings.newFileFolderPath)
    : plugin.settings.newFileLocation == "current" && activeFile
    ? getFolderFromPath(app, activeFile)
    : plugin.app.vault.getRoot()) ?? plugin.app.vault.getRoot();

export const defaultConfigFile = async (app: App) => {
  return await app.vault.adapter.read(
    normalizePath(app.vault.configDir + "/app.json")
  );
};

export const fileExtensionForFile = (path: string) => path.split(".").pop();

export const appendFileMetadataForRow = (row: DBRow, fields: MDBField[]) => {
  const file = getAbstractFileAtPath(app, row.File);
  if (!file) {
    return row;
  }
  return {
    ...row,
    ...fields
      .filter((f) => f.type == "fileprop")
      .reduce(
        (p, c) => ({ ...p, [c.name]: appendFileMetaData(c.value, file) }),
        {}
      ),
  };
};

export const appendFileMetaData = (propType: string, file: TAbstractFile) => {
  let value = "";
  if (file) {
    if (propType == "folder") {
      value = file.parent.path;
    }
    if (file instanceof TFile) {
      if (propType == "ctime") {
        value = file.stat.ctime.toString();
      } else if (propType == "mtime") {
        value = file.stat.mtime.toString();
      } else if (propType == "extension") {
        value = file.extension;
      } else if (propType == "size") {
        value = file.stat.size.toString();
      }
    } else if (propType == "extension") {
      value = i18n.menu.folder;
    }
  }
  return value;
};

export const viewTypeByString = (file: string) => {
  if (file.charAt(0) == "#") {
    return "tag";
  }
  const portalFile = app.vault.getAbstractFileByPath(file);
  if (portalFile instanceof TFolder) {
    return "folder";
  }
  if (portalFile instanceof TFile) {
    return "file";
  }
  return null;
};

export function getAllAbstractFilesInVault(
  plugin: MakeMDPlugin,
  app: App
): TAbstractFile[] {
  let files: TAbstractFile[] = [];
  let rootFolder = app.vault.getRoot();
  function recursiveFx(folder: TFolder) {
    for (let child of folderChildren(plugin, folder)) {
      if (child instanceof TFolder) {
        let childFolder: TFolder = child as TFolder;
        if (childFolder.children) recursiveFx(childFolder);
      }
      files.push(child);
    }
  }
  recursiveFx(rootFolder);
  return files;
}

const getPosition = (string: string, subString: string, index: number) => {
  return string.split(subString, index).join(subString).length;
};

export const getFileFromSpaceItem = (app: App, nodeId: string): string => {
  if (!nodeId) return null;
  const file = nodeId.slice(getPosition(nodeId, "/", 1) + 1);
  return file;
};

export const getFolderFromPath = (app: App, path: string): TFolder => {
  if (!path) return null;
  const file =
    path.slice(-1) == "/" ? path.substring(0, path.length - 1) : path;
  const afile = getAbstractFileAtPath(app, file);
  if (!afile) return null;
  return afile instanceof TFolder ? afile : afile.parent;
};

export const getFolderPathFromString = (file: string) =>
  getFolderFromPath(app, file)?.path;

// Files out of Md should be listed with extension badge - Md without extension

export const getFileNameAndExtension = (fullName: string) => {
  var index = fullName.lastIndexOf(".");
  return {
    fileName: fullName.substring(0, index),
    extension: fullName.substring(index + 1),
  };
};

export const hasChildFolder = (folder: TFolder): boolean => {
  let children = folder.children;
  for (let child of children) {
    if (child instanceof TFolder) return true;
  }
  return false;
};

export const deleteFiles = (plugin: MakeMDPlugin, files: string[]) => {
  files.forEach((f) => {
    const file = getAbstractFileAtPath(app, f);
    deleteFile(plugin, file);
  });
};

export const deleteFile = (plugin: MakeMDPlugin, file: TAbstractFile) => {
  let deleteOption = plugin.settings.deleteFileOption;
  if (deleteOption === "permanent") {
    plugin.app.vault.delete(file, true);
  } else if (deleteOption === "system-trash") {
    plugin.app.vault.trash(file, true);
  } else if (deleteOption === "trash") {
    plugin.app.vault.trash(file, false);
  }
};

// Extracts the Folder Name from the Full Folder Path

export const getFolderName = (folderPath: string, app: App) => {
  if (folderPath === "/") return app.vault.getName();
  let index = folderPath.lastIndexOf("/");
  if (index !== -1) return folderPath.substring(index + 1);
  return folderPath;
};
// Returns all parent folder paths

export const getParentFolderPaths = (file: TFile): string[] => {
  let folderPaths: string[] = ["/"];
  let parts: string[] = file.parent.path.split("/");
  let current: string = "";
  for (let i = 0; i < parts.length; i++) {
    current += `${i === 0 ? "" : "/"}` + parts[i];
    folderPaths.push(current);
  }
  return folderPaths;
};

export const openFile = async (
  file: FolderTree,
  plugin: MakeMDPlugin,
  newLeaf: boolean
) => {
  openAFile(getAbstractFileAtPath(plugin.app, file.path), plugin, newLeaf);
};

export const openAFile = async (
  file: TAbstractFile,
  plugin: MakeMDPlugin,
  newLeaf: boolean
) => {
  if (file instanceof TFolder) {
    openTFolder(file, plugin, newLeaf);
  } else if (file instanceof TFile) {
    openTFile(file, plugin, newLeaf);
  }
  let evt = new CustomEvent(eventTypes.activeFileChange, {
    detail: { filePath: file.path },
  });
  window.dispatchEvent(evt);
};

export const openTFile = async (file: TFile, plugin: MakeMDPlugin, newLeaf: boolean) => {
  let leaf = app.workspace.getLeaf(newLeaf);
  app.workspace.setActiveLeaf(leaf, { focus: true });
  await leaf.openFile(file, { eState: { focus: true } });
};

export const openTFolder = async (
  file: TFolder,
  plugin: MakeMDPlugin,
  newLeaf: boolean
) => {
  let leaf = app.workspace.getLeaf(newLeaf);
  const viewType = CONTEXT_VIEW_TYPE;
  app.workspace.setActiveLeaf(leaf, { focus: true });
  await leaf.setViewState({
    type: viewType,
    state: { type: "folder", folder: file.path },
  });
  await app.workspace.requestSaveLayout();
  if (platformIsMobile()) {
    app.workspace.leftSplit.collapse();
  }
};

export const openTag = async (tag: string, plugin: MakeMDPlugin, newLeaf: boolean) => {
  let leaf = app.workspace.getLeaf(newLeaf);
  const viewType = CONTEXT_VIEW_TYPE;
  app.workspace.setActiveLeaf(leaf, { focus: true });
  await leaf.setViewState({ type: viewType, state: { type: "tag", tag: tag } });
  await app.workspace.requestSaveLayout();
  if (platformIsMobile()) {
    app.workspace.leftSplit.collapse();
  }
};

export const getAbstractFileAtPath = (app: App, path: string) => {
  return app.vault.getAbstractFileByPath(path);
};

export const openInternalLink = (
  event: React.MouseEvent<Element, MouseEvent>,
  link: string,
  app: App
) => {
  app.workspace.openLinkText(
    link,
    "/",
    Keymap.isModifier(event as unknown as MouseEvent, "Mod") ||
      1 === event.button
  );
};

export const openFileInNewPane = (
  plugin: MakeMDPlugin,
  file: FlattenedTreeNode
) => {
  openFile(file, plugin, true);
};

export const createNewMarkdownFile = async (
  plugin: MakeMDPlugin,
  folder: TFolder,
  newFileName: string,
  content?: string
): Promise<TFile> => {
  // @ts-ignore
  const newFile = await app.fileManager.createNewMarkdownFile(
    folder,
    newFileName
  );
  if (content && content !== "") await app.vault.modify(newFile, content);

  await openFile(newFile, plugin, false);
  const titleEl = app.workspace.activeLeaf.view.containerEl.querySelector(
    ".inline-title"
  ) as HTMLDivElement;
  if (titleEl) {
    titleEl.focus();
    selectElementContents(titleEl);
  }
  let evt = new CustomEvent(eventTypes.activeFileChange, {
    detail: { filePath: newFile.path },
  });
  window.dispatchEvent(evt);
  return newFile;
};

export const platformIsMobile = () => {
  return Platform.isMobile;
};

export const createNewFile = async (
  e: React.MouseEvent,
  folderPath: string,
  plugin: MakeMDPlugin
) => {
  let targetFolder = getAbstractFileAtPath(plugin.app, folderPath);
  if (!targetFolder) return;
  let modal = new VaultChangeModal(plugin, targetFolder, "create note");
  modal.open();
};

export const newFileInFolder = async (plugin: MakeMDPlugin, data: TFolder) => {
  await createNewMarkdownFile(
    plugin,
    data.parent.children.find((f) => f.name == data.name) as TFolder,
    "",
    ""
  );
};
