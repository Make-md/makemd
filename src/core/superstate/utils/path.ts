import { Superstate } from "makemd-core";
import { uniq } from "shared/utils/array";
import { movePath, renamePathWithExtension, renamePathWithoutExtension } from "shared/utils/uri";
import { renameTag } from "utils/tags";

export const resolvePath = (path: string, source: string, isSpace?: (path: string) => boolean): string => {
    if (!source || !path) return path;
    if (path.indexOf('http') == 0) return path;
    if (path.indexOf('|') != -1) {
        path = path.split('|')[0];
    }
    if (path.indexOf('./') == 0 && source) {
        if (isSpace?.(source)) {
            return source + path.slice(1);
        }
        return source.slice(0, source.lastIndexOf('/')) + path.slice(1);
    } else if (path.indexOf('../') == 0 && source) {
        const sourceParts = source.split('/');
        const pathParts = path.split('/');
        sourceParts.pop();
        while (pathParts[0] === '..') {
            sourceParts.pop();
            pathParts.shift();
        }
        return [...sourceParts, ...pathParts].join('/');
    }
    return path;
};

export const renamePathByName = async (superstate: Superstate, oldPath: string, newName: string) : Promise<string> => {
    if (superstate.spacesIndex.has(oldPath)) {
        const spaceState = superstate.spacesIndex.get(oldPath);
        if (spaceState.type == 'tag') {
            return renameTag(superstate, spaceState.name, newName);
        }
        return superstate.spaceManager.renameSpace(oldPath, renamePathWithoutExtension(oldPath, newName));
    } else {
        return superstate.spaceManager.renamePath(oldPath, renamePathWithExtension(oldPath, newName));
    }
  
}

export const hidePath = async (superstate: Superstate, path: string) => {
    superstate.settings.hiddenFiles = uniq([
      ...superstate.settings.hiddenFiles,
      path,
    ]);
    superstate.ui.notify("Item is now hidden in the Navigator, you can manage hidden items in the Navigator menu.", );
    superstate.saveSettings();
    superstate.reloadPath(path, true).then(f => superstate.dispatchEvent("superstateUpdated", null));
}

export const hidePaths = async (superstate: Superstate, paths: string[]) => {
    superstate.settings.hiddenFiles = uniq([
      ...superstate.settings.hiddenFiles,
      ...paths,
    ]);
    superstate.saveSettings();
    Promise.all(paths.map((path) => {
        superstate.reloadPath(path, true);
    })).then(f => superstate.dispatchEvent("superstateUpdated", null));
}

export const deletePath = async (superstate: Superstate, path: string) => {
    superstate.spaceManager.deletePath(path);
    superstate.onPathDeleted(path);
}

export const movePathToSpace = async (superstate: Superstate, oldPath: string, newParent: string) => {
    return superstate.spaceManager.renamePath(oldPath, movePath(oldPath, newParent));
};
export const convertPathToSpace = async (
  superstate: Superstate,
  path: string,
  open?: boolean
) => {
  const pathState = superstate.pathsIndex.get(path);
  if (!pathState) {
    return;
  }
  const newPath = pathState.parent+'/'+pathState.name
  await superstate.spaceManager.createSpace(pathState.name, pathState.parent, {});
    await superstate.spaceManager.renamePath(path, newPath+'/'+pathState.metadata?.file?.name+'.md');
    superstate.ui.viewsByPath(path).forEach(view => {
      view.openPath(newPath);
  });
  if (open) {
    superstate.ui.openPath(newPath, false);
  }
};
