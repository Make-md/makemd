import MakeMDPlugin from "main";
import {
  TFile,
  TFolder
} from "obsidian";
import { Path, PathTypes } from "types/types";
import { createNewMarkdownFile, defaultNoteFolder, getAbstractFileAtPath, openAFile, openTagContext, openURL } from "./file";
import { urlRegex } from "./regex";

export const openPath = (plugin: MakeMDPlugin, _path: Path) => {
  const {type, path } = _path;
  if (type == "file" || type == "folder") {
    const afile = getAbstractFileAtPath(app, path);
    if (afile) {
      openAFile(afile, plugin, false);
    } else {
      if (type == "file")
        createNewMarkdownFile(
          plugin,
          defaultNoteFolder(plugin, null),
          path
        );
    }

    return;
  }
  if (type == "tag") {
    openTagContext(path, plugin, false);
    return;
  }
  if (type == "url") {
    openURL(path);
    return;
  }
}

export const pathByString = (path: string, source?: string) : Path => {
  
  const [str, alias] = path.split("|");
  const refIndex = str.lastIndexOf("#");
  const [link, ref] =  refIndex > 0
    ? [str.substring(0, refIndex), str.substring(refIndex + 1)]
    : [str, undefined];

    
  const type = pathTypeByString(link, source);

  return {
    fullPath: path,
    path: link,
    type,
    alias,
    ref
  }
}

export const pathTypeByString = (file: string, source?: string): PathTypes => {
  if (file.charAt(0) == "#") {
    return "tag";
  }
  if (file.slice(-2) == "//") {
    return "space";
  }
  if (file.charAt(file.length - 1) == "/") {
    return "folder";
  }
  let portalFile;
  if (source) {
    portalFile = app.metadataCache.getFirstLinkpathDest(file, source)
  } else {
    portalFile = app.vault.getAbstractFileByPath(file);
  }
  if (portalFile instanceof TFolder) {
    return "folder";
  }
  if (portalFile instanceof TFile) {
    return "file";
  }
  if (file.match(urlRegex))
    return "url";
  return "unknown";
};
