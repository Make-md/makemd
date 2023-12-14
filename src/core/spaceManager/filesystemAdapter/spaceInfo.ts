import { spaceFolderPathFromSpace } from "core/utils/spaces/space";
import { FilesystemSpaceInfo } from "types/mdb";
import { tagToTagPath } from "utils/tags";

import { SpaceManager } from "core/spaceManager/spaceManager";
import { folderPathToString, removeTrailingSlashFromFolder } from "utils/path";
import { encodeSpaceName, tagSpacePathFromTag } from "../../utils/strings";



export const fileSystemSpaceInfoFromTag = (
  manager: SpaceManager,
  tag: string,
  readOnly?: boolean
): FilesystemSpaceInfo => {
  const path = tagSpacePathFromTag(tag);
  const folderPath = manager.superstate.settings.spacesFolder +
    "/" +
    tagToTagPath(tag);
  return {
    name: tag,
    path,

    isRemote: false,
    readOnly: readOnly,
    folderPath,
    defPath: `${folderPath}/${encodeSpaceName(tag)}.md`,
    framePath: spaceFolderPathFromSpace(folderPath +
      "/", manager) + "frames.mdb",
    dbPath: spaceFolderPathFromSpace(folderPath +
      "/", manager) +
      manager.superstate.settings.folderContextFile + ".mdb",
  };
};


export const fileSystemSpaceInfoByPath = (
  manager: SpaceManager,
  contextPath: string
): FilesystemSpaceInfo => {
  if (!contextPath) return;
  const uri = manager.uriByString(contextPath);

  const pathType = manager.spaceTypeByString(uri);
  
  if (pathType == "folder") {
    return fileSystemSpaceInfoFromFolder(manager, removeTrailingSlashFromFolder(uri.path));
  } else if (pathType == "tag") {
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
    const vaultName = manager.superstate.settings.systemName;
    return {
      name: vaultName,

      path: folder,
      isRemote: false,
      readOnly: readOnly,
      folderPath: folder,
      defPath: vaultName + ".md",
      dbPath: spaceFolderPathFromSpace(folder, manager) + manager.superstate.settings.folderContextFile + ".mdb",
      framePath: spaceFolderPathFromSpace(folder, manager) + "views.mdb",
    };
  }
  const folderName = folderPathToString(folder);
  return {
    name: folderName,

    path: folder,
    isRemote: false,
    readOnly: readOnly,
    folderPath: folder,
    defPath: folder + "/" + folderName + ".md",
    dbPath: spaceFolderPathFromSpace(folder +
      "/", manager) + manager.superstate.settings.folderContextFile + ".mdb",
    framePath: spaceFolderPathFromSpace(folder +
      "/", manager) + "views.mdb",
  };
};
