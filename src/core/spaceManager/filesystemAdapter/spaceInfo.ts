import { spaceFolderPathFromSpace } from "core/utils/spaces/space";
import { FilesystemSpaceInfo } from "shared/types/spaceInfo";
import { tagToTagPath } from "utils/tags";

import { SpaceManager } from "core/spaceManager/spaceManager";
import { builtinSpaces } from "core/types/space";
import { builtinSpacePathPrefix } from "shared/schemas/builtin";
import { removeTrailingSlashFromFolder } from "shared/utils/paths";
import { folderPathToString } from "utils/path";
import { encodeSpaceName, tagSpacePathFromTag } from "../../utils/strings";



export const fileSystemSpaceInfoFromTag = (
  manager: SpaceManager,
  tag: string,
  readOnly?: boolean
): FilesystemSpaceInfo => {
  const path = tagSpacePathFromTag(tag.toLowerCase());
  const folderPath = manager.superstate.settings.spacesFolder +
    "/" +
    tagToTagPath(tag);
  return {
    name: tag,
    path,

    isRemote: false,
    readOnly: readOnly,
    folderPath,
    defPath: `${folderPath}/${manager.superstate.settings.spaceSubFolder}/def.json`,
    notePath: `${folderPath}/${encodeSpaceName(tag)}.md`,
    framePath: spaceFolderPathFromSpace(folderPath +
      "/", manager) + "views.mdb",
    dbPath: spaceFolderPathFromSpace(folderPath +
      "/", manager) + "context.mdb",
      commandsPath: spaceFolderPathFromSpace(folderPath +
        "/", manager) + "commands.mdb",
  };
};


export const fileSystemSpaceInfoByPath = (
  manager: SpaceManager,
  contextPath: string
): FilesystemSpaceInfo => {
  if (!contextPath) return;
  if (contextPath.startsWith(builtinSpacePathPrefix)) {
    const builtinPath = contextPath.slice(builtinSpacePathPrefix.length);
    
    const folderPath = manager.superstate.settings.spacesFolder + "/$"+builtinPath;
        return {
          name: builtinSpaces[builtinPath].name,
          path: contextPath,
      
          isRemote: false,
          readOnly: false,
          folderPath,
          defPath: `${folderPath}/${manager.superstate.settings.spaceSubFolder}/def.json`,
          notePath: `${folderPath}/${builtinSpaces[builtinPath].name}.md`,
          framePath: spaceFolderPathFromSpace(folderPath +
            "/", manager) + "views.mdb",
          dbPath: spaceFolderPathFromSpace(folderPath +
            "/", manager)
            + "context.mdb",
            commandsPath: spaceFolderPathFromSpace(folderPath +
              "/", manager) + "commands.mdb",
        }
  }
  const uri = manager.uriByString(contextPath);
  if (!uri) return null;
  const pathType = manager.spaceTypeByString(uri);
  
  if (pathType == "folder") {
    return fileSystemSpaceInfoFromFolder(manager, removeTrailingSlashFromFolder(uri.path));
  } else if (pathType == "tag") {
    if (uri.path.length > 1) {
      return fileSystemSpaceInfoFromTag(manager, uri.authority+'/'+uri.path);
    }
    return fileSystemSpaceInfoFromTag(manager, uri.authority);
  } else if (pathType == 'vault') {
    return fileSystemSpaceInfoFromFolder(manager, '/');
  }
  return null;
};

export const fileSystemSpaceInfoFromFolder = (
  manager: SpaceManager,
  folder: string,
  readOnly?: boolean
): FilesystemSpaceInfo => {
  if (folder == '/') {
    const vaultName =  "Vault";
    const systemName = manager.superstate.settings.systemName;
    return {
      name: systemName,

      path: folder,
      isRemote: false,
      readOnly: readOnly,
      folderPath: folder,
      defPath: `${manager.superstate.settings.spaceSubFolder}/def.json`,
      notePath: vaultName + ".md",
      dbPath: spaceFolderPathFromSpace(folder, manager)  + "context.mdb",
      framePath: spaceFolderPathFromSpace(folder, manager) + "views.mdb",
      commandsPath: spaceFolderPathFromSpace(folder, manager) + "commands.mdb",
    };
  }
  const folderName = folderPathToString(folder);
  const folderNoteName = manager.superstate.settings.folderNoteName;
  return {
    name: folderName,

    path: folder,
    isRemote: false,
    readOnly: readOnly,
    folderPath: folder,
    defPath: folder + `/${manager.superstate.settings.spaceSubFolder}/def.json`,
    notePath: folder + "/" + (folderNoteName.length > 0 ? folderNoteName : folderName) + ".md",
    dbPath: spaceFolderPathFromSpace(folder +
      "/", manager) +  "context.mdb",
    framePath: spaceFolderPathFromSpace(folder +
      "/", manager) + "views.mdb",
    commandsPath: spaceFolderPathFromSpace(folder + "/", manager) + "commands.mdb",
  };
};
