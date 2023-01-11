import MakeMDPlugin from "main";
import { TAbstractFile } from "obsidian";
import {
  saveFileColor,
  saveFileSticker,
  saveSpaceSticker,
} from "./spaces/spaces";

export const unifiedToNative = (unified: string) => {
  let unicodes = unified.split("-");
  let codePoints = unicodes.map((u) => `0x${u}`);
  // @ts-ignore
  return String.fromCodePoint(...codePoints);
};

export const saveFileIcons = (
  plugin: MakeMDPlugin,
  files: string[],
  icon: string
) => {
  files.forEach((file) => {
    saveFileSticker(plugin, file, icon);
  });
};

export const saveFileColors = (
  plugin: MakeMDPlugin,
  files: string[],
  icon: string
) => {
  files.forEach((file) => {
    saveFileColor(plugin, file, icon);
  });
};

export const saveSpaceIcon = (
  plugin: MakeMDPlugin,
  space: string,
  icon: string
) => {
  saveSpaceSticker(plugin, space, icon);
};
export const removeSpaceIcon = (plugin: MakeMDPlugin, space: string) => {
  saveSpaceSticker(plugin, space, "");
};

export const saveFileIcon = (
  plugin: MakeMDPlugin,
  data: TAbstractFile,
  icon: string
) => {
  saveFileSticker(plugin, data.path, icon);
};

export const removeFileIcons = (plugin: MakeMDPlugin, files: string[]) => {
  files.forEach((file) => {
    saveFileSticker(plugin, file, "");
  });
};
export const removeFileIcon = (plugin: MakeMDPlugin, data: TAbstractFile) => {
  saveFileSticker(plugin, data.path, "");
};
