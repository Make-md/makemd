import { CONTEXT_VIEW_TYPE } from "components/ContextView/ContextView";
import { FILE_VIEW_TYPE } from "components/FileView/FileView";
import { VaultChangeModal } from "components/ui/modals/vaultChangeModals";
import MakeMDPlugin from "main";
import {
  App,
  Keymap,
  normalizePath,
  Platform,
  TAbstractFile,
  TFile,
  TFolder
} from "obsidian";
import { AFile } from "schemas/spaces";
import { FileMetadataCache, FolderNoteCache } from "types/cache";
import { ActivePathEvent, eventTypes, FlattenedTreeNode, FolderTree, Path } from "types/types";
import { parseMultiString } from "./parser";
import { pathByString } from "./path";
import { serializeMultiDisplayString, serializeMultiString } from "./serializer";
import { stickerFromString } from "./sticker";
import { fileNameToString, folderNotePathFromAFile, folderPathFromFolderNoteFile, spaceContextPathFromName } from "./strings";
import { folderChildren, selectElementContents } from "./tree";

export const tFileToAFile = (file: TAbstractFile | TFile) : AFile => {
  if (!file) return null;
  if (file instanceof TFile && file.stat) {
      return {
        isFolder: false,
          name: file.basename,
          path: file.path,
          parent: file.parent.path,
          stat: file.stat,
          extension: file.extension
      }
  }
  return {
    isFolder: true,
      name: file.name,
      path: file.path,
      parent: file.parent?.path ?? '/',
  }
}

export const defaultNoteFolder = (plugin: MakeMDPlugin, activeFile: Path) =>
  (plugin.settings.newFileLocation == "folder"
    ? getFolderFromPath(app, plugin.settings.newFileFolderPath)
    : plugin.settings.newFileLocation == "current" && activeFile
    ? getFolderFromPath(app, activeFile.path)
    : plugin.app.vault.getRoot()) ?? plugin.app.vault.getRoot();

export const defaultConfigFile = async (app: App) => {
  return await app.vault.adapter.read(
    normalizePath(app.vault.configDir + "/app.json")
  );
};

export const fileExtensionForFile = (path: string) => path?.split(".").pop();

export const appendFilesMetaData = (plugin: MakeMDPlugin, propType: string, filesString: string) => {
  const files = parseMultiString(filesString)
    .map((f) => plugin.index.filesIndex.get(f))
    .filter((f) => f);
  return serializeMultiString(files.map((f) => appendFileMetaData(propType, f)));
};

export const appendFileMetaData = (propType: string, file: FileMetadataCache) => {
  let value = "";
  if (file) {
    if (propType == "folder") {
      value = file.parent;
    } else  if (propType == "ctime") {
        value = file.ctime?.toString();
      } else if (propType == "mtime") {
        value = file.mtime?.toString();
      } else if (propType == "extension") {
        value = file.extension;
      } else if (propType == "size") {
        value = file.size?.toString();
      } else if (propType == "inlinks") {
        value = serializeMultiDisplayString(file.inlinks);
      }else if (propType == "outlinks") {
        value = serializeMultiDisplayString(file.outlinks);
      } else if (propType == "tags") {
        value = serializeMultiDisplayString(file.tags);
    } else if (propType == 'spaces') {
      value = serializeMultiDisplayString(file.spaces);
    }
  }
  return value;
};

export const moveFile = async (folder: TFolder, file: TAbstractFile) => {
  await app.vault.rename(file, folder.path + "/" + file.name);
};

export const renameFile = async (plugin: MakeMDPlugin, file: TAbstractFile, newName: string) => {
  const afile = tFileToAFile(file);
  await app.fileManager.renameFile(
    file,
    file.parent.path == "/" ? newName : file.parent.path + "/" + newName
  );
  if (afile.isFolder && plugin.settings.enableFolderNote) {
    const folderNotePath = folderNotePathFromAFile(plugin.settings, afile)
    const folderNote = getAbstractFileAtPath(app, folderNotePath)
    if (folderNote)
    await app.fileManager.renameFile(
      folderNote,
      folderNotePathFromAFile(plugin.settings, tFileToAFile(file))
    );
  }
};



export function getAllAbstractFilesInVault(
  plugin: MakeMDPlugin,
  app: App
): TAbstractFile[] {
  const files: TAbstractFile[] = [];
  const rootFolder = app.vault.getRoot();
  function recursiveFx(folder: TFolder) {
    for (const child of folderChildren(plugin, folder)) {
      if (child instanceof TFolder) {
        const childFolder: TFolder = child as TFolder;
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

export const removeTrailingSlashFromFolder = (path: string) =>
  path == "/"
    ? path
    : path.slice(-1) == "/"
    ? path.substring(0, path.length - 1)
    : path;

export const getFolderFromPath = (app: App, path: string): TFolder => {
  if (!path) return null;
  const afile = getAbstractFileAtPath(app, removeTrailingSlashFromFolder(path));
  if (!afile) return null;
  return afile instanceof TFolder ? afile : afile.parent;
};

export const getFolderPathFromString = (file: string) =>
  getFolderFromPath(app, file)?.path;

  export const getParentPathFromString = (file: string) => {
    const indexOfLastSlash = file.lastIndexOf("/");
    if (indexOfLastSlash == -1) {
      return '/'
    }
    return file.substring(0,indexOfLastSlash+1);
  }
// Files out of Md should be listed with extension badge - Md without extension

export const getFileNameAndExtension = (fullName: string) => {
  const index = fullName.lastIndexOf(".");
  return {
    fileName: fullName.substring(0, index),
    extension: fullName.substring(index + 1),
  };
};

export const hasChildFolder = (folder: TFolder): boolean => {
  const children = folder.children;
  for (const child of children) {
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
  const deleteOption = plugin.settings.deleteFileOption;
  if (deleteOption === "permanent") {
    return plugin.app.vault.delete(file, true);
  } else if (deleteOption === "system-trash") {
    return plugin.app.vault.trash(file, true);
  } else if (deleteOption === "trash") {
    return plugin.app.vault.trash(file, false);
  }
};

// Extracts the Folder Name from the Full Folder Path

export const getFolderName = (folderPath: string, app: App) => {
  if (folderPath === "/") return app.vault.getName();
  const index = folderPath.lastIndexOf("/");
  if (index !== -1) return folderPath.substring(index + 1);
  return folderPath;
};
// Returns all parent folder paths

export const getParentFolderPaths = (file: TFile): string[] => {
  const folderPaths: string[] = ["/"];
  const parts: string[] = file.parent.path.split("/");
  let current = "";
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

export const openSpace = async (
  spaceName: string,
  plugin: MakeMDPlugin,
  newLeaf: boolean
) => {
  if (!plugin.settings.contextEnabled) return;
  const leaf = app.workspace.getLeaf(newLeaf);
  const viewType = CONTEXT_VIEW_TYPE;
  app.workspace.setActiveLeaf(leaf, { focus: true });
  await leaf.setViewState({
    type: viewType,
    state: { contextPath: spaceContextPathFromName(spaceName) },
  });
  await app.workspace.requestSaveLayout();
  if (platformIsMobile()) {
    app.workspace.leftSplit.collapse();
  }
  const evt = new CustomEvent<ActivePathEvent>(eventTypes.activePathChange, {
    detail: { path: pathByString(spaceContextPathFromName(spaceName)) },
  });
  window.dispatchEvent(evt);
}

export const openURL = async (url: string) => {
  const leaf = app.workspace.getLeaf(false);
  if (url.endsWith(".md")) {
    const viewType = FILE_VIEW_TYPE;
    app.workspace.setActiveLeaf(leaf, { focus: true });
    await leaf.setViewState({
      type: viewType,
      state: { path: url },
    });
    await app.workspace.requestSaveLayout();
  } else if (url.endsWith(".mdb")) {
    const viewType = CONTEXT_VIEW_TYPE;
    app.workspace.setActiveLeaf(leaf, { focus: true });
    await leaf.setViewState({
      type: viewType,
      state: { contextPath: url },
    });
    await app.workspace.requestSaveLayout();
  }

  if (platformIsMobile()) {
    app.workspace.leftSplit.collapse();
  }
};

export function getAllFoldersInVault(app: App): TFolder[] {
  const folders: TFolder[] = [];
  const rootFolder = app.vault.getRoot();
  folders.push(rootFolder);
  function recursiveFx(folder: TFolder) {
    for (const child of folder.children) {
      if (child instanceof TFolder) {
        const childFolder: TFolder = child as TFolder;
        folders.push(childFolder);
        if (childFolder.children) recursiveFx(childFolder);
      }
    }
  }
  recursiveFx(rootFolder);
  return folders;
}


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
  let evt = new CustomEvent<ActivePathEvent>(eventTypes.activePathChange, {
    detail: { path: pathByString(file.path) },
  });
  window.dispatchEvent(evt);
};


export const openTFile = async (
  file: TFile,
  plugin: MakeMDPlugin,
  newLeaf: boolean
) => {
  
  let leaf = app.workspace.getLeaf(newLeaf);
  
  
  app.workspace.setActiveLeaf(leaf, { focus: true });
  
  await leaf.openFile(file, { eState: { focus: true } });
  const fileCache = plugin.index.filesIndex.get(file.path);
  if (fileCache?.sticker && leaf.tabHeaderInnerIconEl) {
    const icon = stickerFromString(fileCache.sticker, plugin)
    leaf.tabHeaderInnerIconEl.innerHTML = icon
  }
};

export const openTFolder = async (
  file: TFolder,
  plugin: MakeMDPlugin,
  newLeaf: boolean
) => {
  if (!plugin.settings.contextEnabled) return;
  let leaf = app.workspace.getLeaf(newLeaf);
  const viewType = CONTEXT_VIEW_TYPE;
  app.workspace.setActiveLeaf(leaf, { focus: true });
  await leaf.setViewState({
    type: viewType,
    state: { contextPath: file.path },
  });
  const fileCache = plugin.index.filesIndex.get(file.path);
  if (fileCache?.sticker && leaf.tabHeaderInnerIconEl) {
    const icon = stickerFromString(fileCache.sticker, plugin)
    leaf.tabHeaderInnerIconEl.innerHTML = icon
  }
  await app.workspace.requestSaveLayout();
  if (platformIsMobile()) {
    app.workspace.leftSplit.collapse();
  }
};

export const openTagContext = async (
  tag: string,
  plugin: MakeMDPlugin,
  newLeaf: boolean
) => {
  let leaf = app.workspace.getLeaf(newLeaf);
  const viewType = CONTEXT_VIEW_TYPE;
  app.workspace.setActiveLeaf(leaf, { focus: true });
  await leaf.setViewState({ type: viewType, state: { contextPath: tag } });
  await app.workspace.requestSaveLayout();
  if (platformIsMobile()) {
    app.workspace.leftSplit.collapse();
  }
  const evt = new CustomEvent<ActivePathEvent>(eventTypes.activePathChange, {
    detail: { path: pathByString(tag) },
  });
  window.dispatchEvent(evt);
};

export const getAbstractFileAtPath = (app: App, path: string) => {
  return app.vault.getAbstractFileByPath(path);
};

export const abstractFileAtPathExists = (app: App, path: string) => {
  return app.vault.getAbstractFileByPath(path) ? true : false;
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
export const createNewCanvasFile = async (
  plugin: MakeMDPlugin,
  folder: TFolder,
  newFileName: string,
  dontOpen?: boolean
): Promise<TFile> => {
  const newFile = await app.fileManager.createNewMarkdownFile(
    folder,
    newFileName
  );
  await app.vault.modify(newFile, "{}");
  await renameFile(plugin, 
    newFile,
    newFile.name.substring(0, newFile.name.lastIndexOf(".")) + ".canvas"
  );
  if (dontOpen) {
    return newFile;
  }
  await openAFile(newFile, plugin, false);
  const evt = new CustomEvent<ActivePathEvent>(eventTypes.activePathChange, {
    detail: { path: pathByString(newFile.path) },
  });
  window.dispatchEvent(evt);
  return newFile;
};

export const createNewMarkdownFile = async (
  plugin: MakeMDPlugin,
  folder: TFolder,
  newFileName: string,
  content?: string,
  dontOpen?: boolean
): Promise<TFile> => {
  const newFile = await app.fileManager.createNewMarkdownFile(
    folder,
    newFileName
  );
  if (content && content !== "") await app.vault.modify(newFile, content);

  if (dontOpen) {
    return newFile;
  }
  await openAFile(newFile, plugin, false);
  const titleEl = app.workspace.activeLeaf.view.containerEl.querySelector(
    ".inline-title"
  ) as HTMLDivElement;
  if (titleEl) {
    titleEl.focus();
    selectElementContents(titleEl);
  }
  const evt = new CustomEvent<ActivePathEvent>(eventTypes.activePathChange, {
    detail: { path: pathByString(newFile.path) },
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
  const targetFolder = getAbstractFileAtPath(plugin.app, folderPath);
  if (!targetFolder) return;
  const modal = new VaultChangeModal(plugin, targetFolder, "create note");
  modal.open();
};

export const newFileInFolder = async (
  plugin: MakeMDPlugin,
  data: TFolder,
  dontOpen?: boolean
) => {
  await createNewMarkdownFile(
    plugin,
    data.parent.children.find((f) => f.name == data.name) as TFolder,
    "",
    "",
    dontOpen
  );
};

export const noteToFolderNote = async (
  plugin: MakeMDPlugin,
  file: TFile,
  open?: boolean
) => {
  const folderPath = fileNameToString(file.path);
  const folder = getAbstractFileAtPath(app, folderPath)
  if (folder && folder instanceof TFolder) {
    if (open) {
      openTFolder(folder, plugin, false)
    }
    return;
  }
  await app.vault.createFolder(folderPath);
  plugin.index.filesIndex.delete(file.path);
   const newFolderNotePath = folderNotePathFromAFile(plugin.settings, tFileToAFile(getAbstractFileAtPath(app, folderPath)))
  if (newFolderNotePath != file.path) {
    await app.vault.rename(file, newFolderNotePath);
  }
  if (open) {
    openTFolder(getAbstractFileAtPath(app, folderPath) as TFolder, plugin, false)
  }
}

export const folderNoteCache = (plugin: MakeMDPlugin, file: AFile) : FolderNoteCache => {
  if (!file.extension || file.extension.length == 0) {
      const folderNotePath = folderNotePathFromAFile(plugin.settings, file);
      if (abstractFileAtPathExists(app, folderNotePath)) {
          return {
              folderNotePath: folderNotePath,
              folderPath: file.path
          }
      }
  } else if (file.extension == 'md') {
      const folderPath = getAbstractFileAtPath(app, folderPathFromFolderNoteFile(plugin.settings, file));
      if ((folderPath instanceof TFolder) && folderPath.name == file.name) {
          return {
              folderNotePath: file.path,
              folderPath: folderPath.path
          }
      }
  }
  return null;
}