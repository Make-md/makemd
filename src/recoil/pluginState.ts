import { TFolder } from "obsidian";
import { atom } from "recoil";
import { SectionTree } from "types/types";

export const activeFile = atom({
  key: "spacesActiveFile",
  default: null as string,
  dangerouslyAllowMutability: true,
});

export const folderTree = atom({
  key: "spacesFolderTree",
  default: null as TFolder,
  dangerouslyAllowMutability: true,
});

export const sections = atom({
  key: "spacesSections",
  default: [] as SectionTree[],
  dangerouslyAllowMutability: true,
});

export const fileIcons = atom({
  key: "spacesIcons",
  default: [] as [string, string][],
});

export const openFolders = atom({
  key: "spacesOpenFolders",
  default: [] as string[],
});

export const focusedFolder = atom({
  key: "spacesFocusedFolder",
  default: null as TFolder,
  dangerouslyAllowMutability: true,
});
