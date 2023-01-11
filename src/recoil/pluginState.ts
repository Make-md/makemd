import { TFolder } from "obsidian";
import { atom } from "recoil";
import { Space } from "schemas/spaces";
import { SectionTree } from "types/types";
import { TreeNode } from "utils/spaces/spaces";

export const activeFile = atom({
  key: "spacesActiveFile",
  default: null as string,
  dangerouslyAllowMutability: true,
});

export const selectedFiles = atom({
  key: "spacesSelectedFiles",
  default: [] as TreeNode[],
  dangerouslyAllowMutability: true,
});

export const activeView = atom({
  key: "spacesActiveView",
  default: "root",
  dangerouslyAllowMutability: true,
});

export const activeViewSpace = atom({
  key: "spacesActiveSpace",
  default: "",
  dangerouslyAllowMutability: true,
});

export const spaces = atom({
  key: "spaces",
  default: [] as Space[],
  dangerouslyAllowMutability: true,
});

export const expandedFolders = atom({
  key: "expandedFolders",
  default: {} as Record<string, string[]>,
});
