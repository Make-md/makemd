import { EMBED_SPACE_VIEW_TYPE } from "adapters/obsidian/ui/editors/EmbedSpaceView";
import { LINK_VIEW_TYPE } from "adapters/obsidian/ui/editors/markdownView/FileView";
import MakeMDPlugin from "main";
import { AFile } from "makemd-core";
import {
  App,
  Platform,
  TAbstractFile,
  TFile,
  TFolder,
  WorkspaceLeaf,
  normalizePath
} from "obsidian";

import { SPACE_VIEW_TYPE } from "adapters/obsidian/SpaceViewContainer";
import { defaultSpace, newPathInSpace } from "core/superstate/utils/spaces";
import { isTouchScreen } from "core/utils/ui/screen";
import { TargetLocation } from "types/path";
import { selectElementContents } from "utils/dom";
import { folderPathToString, getParentPathFromString, removeTrailingSlashFromFolder } from "utils/path";
import { sanitizeFileName, sanitizeFolderName } from "utils/sanitizers";
import { SPACE_FRAGMENT_VIEW_TYPE } from "../ui/editors/SpaceFragmentViewComponent";
import { EVER_VIEW_TYPE } from "../ui/navigator/EverLeafView";
  

export const tFileToAFile = (file: TAbstractFile | TFile) : AFile => {
  if (!file) return null;
  if (file instanceof TFile && file.stat) {
      return {
        isFolder: false,
          name: file.basename,
          filename: file.name,
          path: file.path,
          parent: file.parent?.path,
          extension: file.extension,
          ...file.stat
      }
  }
  return {
    isFolder: true,
      name: file.name,
      filename: file.name,
      path: file.path,
      parent: file.parent?.path,
  }
}



export const defaultConfigFile = async (plugin: MakeMDPlugin) => {
  return await plugin.app.vault.adapter.read(
    normalizePath(plugin.app.vault.configDir + "/app.json")
  );
};

export const fileExtensionForFile = (path: string) => path?.indexOf(".") > 0 ? path.split(".").pop() : "md";
export const fileNameForFile = (path: string) => path?.indexOf("/") > 0 ? path.split("/").pop().split('.').shift() : path.split('.').shift();

export const uniqueFileName = (oldName: string, name: string, extension: string, folder: TFolder) => {
  let newName = sanitizeFileName(name);

  let uniqueName = false;
  let append = 1;
  while (!uniqueName) {
    if (!folder.children.some(f => f.name == `${newName}.${extension}`  && f.name != oldName)) {
      uniqueName = true;
    } else {
    newName = `${newName} ${append}`
    append += 1;
    }
  }
  return `${newName}.${extension}`;
}

export const uniqueFolderName = (oldName: string, name: string, folder: TFolder) => {
  let newName = sanitizeFolderName(name);
  let uniqueName = false;
  let append = 1;
  while (!uniqueName) {
    if (!folder.children.some(f => f.name == `${newName}` && f.name != oldName)) {
      uniqueName = true;
    } else {
    
    newName = `${newName} ${append}`
    append += 1;
    }
  }
  return `${newName}`;
}


export const renameFile = async (plugin: MakeMDPlugin, file: TAbstractFile, newName: string) => {
  const afile = tFileToAFile(file);
  const fileName = afile.isFolder ? uniqueFolderName(file.name, newName, file.parent) : uniqueFileName(file.name, newName, afile.extension, file.parent);
  const newPath = file.parent.path == "/" ? fileName : file.parent.path + "/" + fileName
  return await plugin.files.renameFile(
    file.path,
    newPath
  );
};

export const folderRenamed = async (plugin: MakeMDPlugin, oldPath: string, newPath: string) => {
const oldName = folderPathToString(oldPath);
const newName = folderPathToString(newPath);
  if (newPath.startsWith(plugin.superstate.settings.spacesFolder)) {
    const spaceNote = getAbstractFileAtPath(plugin.app, `${newPath}/${oldName}.md`)
    if (spaceNote)
    renameFile(plugin, spaceNote, newName)
  } else if (plugin.superstate.settings.enableFolderNote) {
    const oldSpaceInfo = plugin.superstate.spaceManager.spaceInfoForPath(oldPath);
    const newSpaceInfo = plugin.superstate.spaceManager.spaceInfoForPath(newPath);
    await plugin.files.renameFile(
      oldSpaceInfo.notePath,
      newSpaceInfo.notePath
    );
  }
}






export function getAllAbstractFilesInVault(
  app: App,
): TAbstractFile[] {
  const files: TAbstractFile[] = [];
  const rootFolder = app.vault.getRoot();
  function recursiveFx(folder: TFolder) {
    for (const child of folder.children) {
      if (child instanceof TFolder) {
        const childFolder: TFolder = child as TFolder;
        if (childFolder.children) recursiveFx(childFolder);
      }
      files.push(child);
    }
  }
  recursiveFx(rootFolder);
  files.push(rootFolder);
  return files;
}




export const getFolderFromPath = (plugin: MakeMDPlugin, path: string): AFile => {
  if (!path) return null;
  const afile = tFileToAFile(getAbstractFileAtPath(plugin.app, (removeTrailingSlashFromFolder(path))));
  if (!afile) return null;
  return afile.isFolder ? afile : tFileToAFile(getAbstractFileAtPath(plugin.app, afile.parent));
};

export const getFolderPathFromString =  (plugin: MakeMDPlugin, file: string) =>
   getFolderFromPath(plugin, file)?.path;

// Files out of Md should be listed with extension badge - Md without extension




export const deleteFiles = (plugin: MakeMDPlugin, files: string[]) => {
  files.forEach((f) => {
      plugin.files.deleteFile(f);
  });
};

// Returns all parent folder paths



export const openPath = async (
  leaf: WorkspaceLeaf,
  path: string,
  plugin: MakeMDPlugin,
  flow?: boolean
) => {
  const uri = plugin.superstate.spaceManager.uriByString(path);
  if (!uri) return;
  if (uri.scheme == 'https' || uri.scheme == 'http') {
    if (plugin.superstate.spacesIndex.has(path)) {
      const viewType = SPACE_VIEW_TYPE;
      plugin.app.workspace.setActiveLeaf(leaf, { focus: true });
      await leaf.setViewState({
        type: viewType,
        state: { path: path, flow },
      });
      return;
    } else if (plugin.superstate.pathsIndex.has(path)) {
      const viewType = LINK_VIEW_TYPE;
      plugin.app.workspace.setActiveLeaf(leaf, { focus: true });
      await leaf.setViewState({
        type: viewType,
        state: { path: path, flow },
      });
      return;
    }
    window.open(uri.fullPath, '_blank');
    return;
  }
  if (uri.scheme == 'obsidian') {
      await leaf.setViewState({
        type: uri.authority,
      });
    return;
  }

  if (uri.ref) {
    const cache = plugin.superstate.pathsIndex.get(uri.path);

    if (cache?.type == "space" || uri.scheme == 'spaces') {
      if (flow && uri.ref == 'main') {
      await leaf.setViewState({
        type: EMBED_SPACE_VIEW_TYPE,
        state: { path: uri.fullPath },
      });
    } else {
      await leaf.setViewState({
        type: SPACE_FRAGMENT_VIEW_TYPE,
        state: { path: uri.fullPath, flow },
      });
    }
    return;
  }
  }
  
  if (uri.scheme == 'spaces') {
    openTagContext(leaf, uri.basePath, plugin.app)
    return;
  }
  plugin.files.getFile(path).then(f => {
    if (f)
    {
      if (f.isFolder) {
        openTFolder(leaf, getAbstractFileAtPath(plugin.app, f.path) as TFolder, plugin, flow);
      } else if (f) {
        openTFile(leaf, getAbstractFileAtPath(plugin.app, f.path) as TFile, plugin.app);
      } else {
        return;
      }
    } else {
      if (path.contains('/')) {
        const folder = removeTrailingSlashFromFolder(getParentPathFromString(path));
        const spaceFolder = plugin.superstate.spacesIndex.get(folder);
        if (spaceFolder) {
          newPathInSpace(
            plugin.superstate,
                spaceFolder,
                fileExtensionForFile(path),
                fileNameForFile(path),
              );
            }
      } else {
        defaultSpace(plugin.superstate, plugin.superstate.pathsIndex.get(plugin.superstate.ui.activePath)).then(f => {
          if (f)
        newPathInSpace(
      plugin.superstate,
          f,
          fileExtensionForFile(path),
          fileNameForFile(path),
        )});
      }
  }})
  
};



export const openSpace = async (
  spacePath: string,
  plugin: MakeMDPlugin,
  newLeaf: TargetLocation
) => {
// if (spacePath == tagsSpacePath) return;
  if (!plugin.superstate.settings.spaceViewEnabled) {
    if (!plugin.superstate.settings.enableFolderNote) {
      return;
    }
    const space = plugin.superstate.spacesIndex.get(spacePath)?.space.notePath;
    plugin.superstate.ui.openPath(space, newLeaf);
    return;
  }
  const leaf = getLeaf(plugin.app, newLeaf);
  const viewType = SPACE_VIEW_TYPE;
  plugin.app.workspace.setActiveLeaf(leaf, { focus: true });
  await leaf.setViewState({
    type: viewType,
    state: { path: spacePath },
  });
  await plugin.app.workspace.requestSaveLayout();
  if (isTouchScreen(plugin.superstate.ui)) {
    plugin.app.workspace.leftSplit.collapse();
  }
  plugin.superstate.ui.setActivePath(spacePath);
}

export const getLeaf = (app: App, location: TargetLocation) => {
  let leaf
  if (location == 'system' || location == 'hover') {
    return null;
  } else 
  if (location == 'right') {
    leaf = app.workspace.getRightLeaf(false);
  } else if (location == 'left') {
    leaf = app.workspace.getLeftLeaf(false);
  } else if (location == 'overview') {
    leaf = app.workspace.getLeavesOfType(EVER_VIEW_TYPE)[0];
  } else {
    leaf = app.workspace.getLeaf(location)
  }
  return leaf;
}
export const openURL = async (url: string,app: App,  location?: TargetLocation) => {
  if (location == 'system') {
    window.open(url, '_blank');
    return;
  }
  const leaf = getLeaf(app, location)
  if (url.endsWith(".md")) {
    const viewType = LINK_VIEW_TYPE;
    app.workspace.setActiveLeaf(leaf, { focus: true });
    await leaf.setViewState({
      type: viewType,
      state: { path: url },
    });
    await app.workspace.requestSaveLayout();
  } else if (url.endsWith(".mdb")) {
    const viewType = SPACE_VIEW_TYPE;
    app.workspace.setActiveLeaf(leaf, { focus: true });
    await leaf.setViewState({
      type: viewType,
      state: { path: url },
    });
    await app.workspace.requestSaveLayout();
  } else {
    app.workspace.setActiveLeaf(leaf, { focus: true });
    await leaf.setViewState({
      type: EMBED_SPACE_VIEW_TYPE,
      state: { path: url },
    });
  }

  if (Platform.isMobile) {
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


export const openTFile = async (
  leaf: WorkspaceLeaf,
  file: TFile,
  app: App,
) => {
  
  if (!file) return;
  
  app.workspace.setActiveLeaf(leaf, { focus: true });
  
  await leaf.openFile(file);
  
};

const openTFolder = async (
  leaf: WorkspaceLeaf,
  file: TFolder,
  plugin: MakeMDPlugin,
  flow: boolean
) => {
  // if (!plugin.superstate.settings.contextEnabled) return;
  if (!plugin.superstate.settings.spaceViewEnabled) {
    if (!plugin.superstate.settings.enableFolderNote) {
      return;
    }
    const space = plugin.superstate.spacesIndex.get(file.path)?.space.notePath;
    if (!space) return;
    const spaceFile = getAbstractFileAtPath(plugin.app, space) as TFile;
    if (!spaceFile) return;
    plugin.app.workspace.setActiveLeaf(leaf, { focus: true });
    leaf.openFile(spaceFile);
    return;
  }
  
  if (flow) {
    await leaf.setViewState({
      type: EMBED_SPACE_VIEW_TYPE,
      state: { path: file.path },
    });
  } else {
    plugin.app.workspace.setActiveLeaf(leaf, { focus: true });
    await leaf.setViewState({
      type: SPACE_VIEW_TYPE,
      state: { path: file.path },
    });
    await plugin.app.workspace.requestSaveLayout();
    if (Platform.isMobile) {
      plugin.app.workspace.leftSplit.collapse();
    }
  }

  // const fileCache = plugin.superstate.pathsIndex.get(file.path);
  // if (fileCache?.label.sticker && leaf.tabHeaderInnerIconEl) {
  //   const icon = stickerFromString(fileCache.label.sticker, plugin)
  //   leaf.tabHeaderInnerIconEl.innerHTML = icon
  // }
  
  
};

export const openTagContext = async (
  leaf: WorkspaceLeaf,
  tag: string,
  app: App,
) => {
  const viewType = SPACE_VIEW_TYPE;
  app.workspace.setActiveLeaf(leaf, { focus: true });
  await leaf.setViewState({ type: viewType, state: { path:tag} });
  await app.workspace.requestSaveLayout();
  if (Platform.isMobile) {
    app.workspace.leftSplit.collapse();
  }
};

export const openArbitraryView = async (
  view: string,
  app: App,
  newLeaf: TargetLocation
) => {
  const leaf = getLeaf(app, newLeaf)
  app.workspace.setActiveLeaf(leaf, { focus: true });
  await leaf.setViewState({ type: view});
  await app.workspace.requestSaveLayout();
  
};

export const getAbstractFileAtPath = (app: App, path: string) => {
  return app.vault.getAbstractFileByPath(path);
};

export const abstractFileAtPathExists = (app: App, path: string) => {
  return app.vault.getAbstractFileByPath(path) ? true : false;
};




export const createNewMarkdownFile = async (
  plugin: MakeMDPlugin,
  folder: AFile,
  newFileName: string,
  content?: string,
  dontOpen?: boolean
): Promise<AFile> => {

  const fileName = newFileName?.length > 0 ? newFileName : plugin.superstate.settings.newNotePlaceholder
  const newFile = await plugin.files.newFile(
    folder.path,
    fileName, 'md'
  );

  if (content && content !== "") await plugin.files.writeTextToFile(newFile.path, content);

  if (dontOpen) {
    return newFile;
  }
  await plugin.superstate.ui.openPath(newFile.path, false);
  const titleEl = plugin.app.workspace.activeLeaf.view.containerEl.querySelector(
    ".inline-title"
  ) as HTMLDivElement;
  if (titleEl) {
    titleEl.focus();
    selectElementContents(titleEl);
  }
  plugin.superstate.ui.setActivePath(newFile.path)
  return newFile;
};






