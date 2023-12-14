import { SpaceManager } from "core/spaceManager/spaceManager";
import { Superstate } from "core/superstate/superstate";
import { MakeMDSettings } from "core/types/settings";
import { PathState } from "core/types/superstate";


export const pathIsSpace = (superstate: Superstate, path: string) => {
    
    if (!path)return false;
    return superstate.spacesIndex.has(path);
}

export const spaceFolderPathFromSpace = (path: string, manager: SpaceManager) => {
    if (manager.superstate.settings.spacesMDBInHidden) {
        if (path == '/') return '.space/'
        return path + '.space/'
    }
    return path
}

export const spaceFolderForMDBPath = (path: string, manager: SpaceManager) : string => {
    const indexOfLastSlash = path.lastIndexOf("/");
    if (indexOfLastSlash == -1) {
      return '/'
    }
    let parentPath = path.substring(0, indexOfLastSlash)
    if (manager.superstate.settings.spacesMDBInHidden) {
        const indexOfSecondLastSlash = parentPath.lastIndexOf('/')
        if (parentPath.substring(indexOfSecondLastSlash+1) == '.space')
        {
            parentPath = parentPath.substring(0, indexOfSecondLastSlash)
        } else {
        return null;
        }
    }
    if (parentPath.startsWith(manager.superstate.settings.spacesFolder+'/#')) {
        parentPath = parentPath.replace(manager.superstate.settings.spacesFolder, "spaces:/")
    }
    return parentPath
} 

export const folderForTagSpace = (space: string, settings: MakeMDSettings) => 
    settings.spacesFolder +
    "/" +
    space

    export const spacesFromFileCache = (cache: PathState, superstate: Superstate) => {
        return (cache?.spaces ?? [])
          .map((f) => superstate.spacesIndex.get(f))
          .filter((f) => f)
          .map((f) => f.space);
      };