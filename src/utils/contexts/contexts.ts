import MakeMDPlugin from "main";
import { TFile, TFolder } from "obsidian";
import { getAbstractFileAtPath, getFolderPathFromString } from "../file";
import { fileNameToString, uniq } from "../tree";

export const tagFromString = (tag: string) => {
  let string = tag;
  if (string.charAt(0) != "#") string = "#" + string;
  return string.replace(/\//g, "_");
};

export const stringFromTag = (string: string) => {
  if (string.charAt(0) == "#") {
    return string.substring(1, string.length);
  }
  return string;
};

export const loadTags = (plugin: MakeMDPlugin) => {
  const folder =
    plugin.settings.tagContextFolder == ""
      ? app.vault.getRoot()
      : (getAbstractFileAtPath(
          app,
          getFolderPathFromString(plugin.settings.tagContextFolder)
        ) as TFolder);
  return uniq([
    ...Object.keys(app.metadataCache.getTags()),
    ...(folder?.children
      .filter(
        (f) =>
          f instanceof TFile && f.extension == "mdb" && f.name.charAt(0) == "#"
      )
      .map((f) => fileNameToString(f.name)) ?? []),
  ]);
};

export const tagContextFromTag = (plugin: MakeMDPlugin, tag: string) => {
  return (
    getFolderPathFromString(plugin.settings.tagContextFolder) +
    "/" +
    tagFromString(tag) +
    ".mdb"
  );
};

export const folderContextFromFolder = (
  plugin: MakeMDPlugin,
  folder: string
) => {
  return (folder == '/' ? '' : folder + "/") + plugin.settings.folderContextFile + ".mdb";
};
