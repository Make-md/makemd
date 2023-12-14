import { URI } from "types/path";


export const movePath = (path: string, newParent: string) : string => {
  const parts = path.split("/")
  const newPath = newParent + "/" + parts[parts.length - 1]
  return newPath
}
export const renamePathWithExtension = (path: string, newName: string): string => {
  const dir = path.substring(0, path.lastIndexOf("/"));
  const ext = path.substring(path.lastIndexOf("."));
  return dir.length > 0 ? `${dir}/${newName}${ext}` : `${newName}${ext}`;
}


export const uriForFolder = (path: string) : URI => {
  return {
    basePath: path,
    fullPath: path,
    authority: null,
    path,
    scheme: 'vault',
    alias: null,
    ref: null,
    refStr: null,
    refType: null,
    query: null
  };
}


