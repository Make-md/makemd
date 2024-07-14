
import { Superstate } from "core/superstate/superstate";
import { removeLeadingSlash } from "core/utils/strings";




export const removeTrailingSlashFromFolder = (path: string) => path == "/"
  ? path
  : path.slice(-1) == "/"
    ? path.substring(0, path.length - 1)
    : path;
    
    export const pathDisplayName = (path: string, superstate: Superstate) => {
  if (!path) return "";
  const uri = superstate.spaceManager.uriByString(path);
  if (uri.refType) {
  if (uri.refType == "context") {
    const schema = superstate.contextsIndex
    .get(uri.basePath)
    ?.schemas.find((s) => s.id == uri.ref);
    const space = superstate.spacesIndex.get(uri.basePath);
    if (schema && space) return `${space.name} / ${schema.name}`;
    return "";
  }
  
  if (uri.refType == "action") {
    return superstate.actionsIndex
      .get(uri.basePath)
      ?.find((s) => s.schema.id == uri.ref)?.schema.name;
  }
  return uri.ref
   
  }
  return superstate.pathsIndex.get(uri.basePath)?.name || path;
  
};


    
export const folderPathToString = (path: string) => removeLeadingSlash(path.substring(path.lastIndexOf("/"))) || path;
export const getParentFolderPaths = (path: string): string[] => {
  const folderPaths: string[] = [];
  const parts: string[] = path.split("/");
  let current = "";
  for (let i = 0; i < parts.length; i++) {
    current += `${i === 0 ? "" : "/"}` + parts[i];
    if (current != path) {
      folderPaths.push(current);
    }
  }

  return folderPaths;
};
export const pathToString = (path: string) => {
  if (path.lastIndexOf("/") != -1) {
    if (path.lastIndexOf(".") != -1)
      return removeLeadingSlash(
        path.substring(
          path.lastIndexOf("/") + 1,
          path.lastIndexOf(".")
        )
      );
    return path.substring(path.lastIndexOf("/") + 1);
  }
  if (path.lastIndexOf(".") != -1) {
    return path.substring(0, path.lastIndexOf("."));
  }
  
  return path;
};

export const pathNameToString = (path: string) => path.substring(0, path.lastIndexOf(".")) || path;
export const getParentPathFromString = (file: string) => {
  const indexOfLastSlash = file.lastIndexOf("/");
  if (indexOfLastSlash == -1) {
    return '/';
  }
  return file.substring(0, indexOfLastSlash + 1);
};

