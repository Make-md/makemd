import { spaceFolderPathFromSpace } from "core/utils/spaces/space";
import { FilesystemSpaceInfo } from "types/mdb";
import { tagToTagPath } from "utils/tags";

import { SpaceManager } from "core/spaceManager/spaceManager";
import { tagsSpacePath } from "core/types/space";
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
    defPath: `${folderPath}/.space/def.json`,
    notePath: `${folderPath}/${encodeSpaceName(tag)}.md`,
    framePath: spaceFolderPathFromSpace(folderPath +
      "/", manager) + "views.mdb",
    dbPath: spaceFolderPathFromSpace(folderPath +
      "/", manager) +
      manager.superstate.settings.folderContextFile + ".mdb",
      commandsPath: spaceFolderPathFromSpace(folderPath +
        "/", manager) + "commands.mdb",
  };
};


export const fileSystemSpaceInfoByPath = (
  manager: SpaceManager,
  contextPath: string
): FilesystemSpaceInfo => {
  if (!contextPath) return;
  if (contextPath == tagsSpacePath) {
    const folderPath = manager.superstate.settings.spacesFolder + "/$tags"
        return {
          name: "Tags",
          path: "spaces://$tags",
      
          isRemote: false,
          readOnly: false,
          folderPath,
          defPath: `${folderPath}/.space/def.json`,
          notePath: `${folderPath}/$tags.md`,
          framePath: spaceFolderPathFromSpace(folderPath +
            "/", manager) + "views.mdb",
          dbPath: spaceFolderPathFromSpace(folderPath +
            "/", manager) +
            manager.superstate.settings.folderContextFile + ".mdb",
            commandsPath: spaceFolderPathFromSpace(folderPath +
              "/", manager) + "commands.mdb",
        }
  }
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
    const vaultName =  "Vault";
    return {
      name: vaultName,

      path: folder,
      isRemote: false,
      readOnly: readOnly,
      folderPath: folder,
      defPath: '.space/def.json',
      notePath: vaultName + ".md",
      dbPath: spaceFolderPathFromSpace(folder, manager) + manager.superstate.settings.folderContextFile + ".mdb",
      framePath: spaceFolderPathFromSpace(folder, manager) + "views.mdb",
      commandsPath: spaceFolderPathFromSpace(folder, manager) + "commands.mdb",
    };
  }
  const folderName = folderPathToString(folder);
  return {
    name: folderName,

    path: folder,
    isRemote: false,
    readOnly: readOnly,
    folderPath: folder,
    defPath: folder + "/.space/def.json",
    notePath: folder + "/" + folderName + ".md",
    dbPath: spaceFolderPathFromSpace(folder +
      "/", manager) + manager.superstate.settings.folderContextFile + ".mdb",
    framePath: spaceFolderPathFromSpace(folder +
      "/", manager) + "views.mdb",
    commandsPath: spaceFolderPathFromSpace(folder + "/", manager) + "commands.mdb",
  };
};
