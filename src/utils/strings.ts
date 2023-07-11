import { AFile } from "schemas/spaces";
import { FileMetadataCache } from "types/cache";
import { ContextInfo } from "types/contextInfo";
import { MakeMDPluginSettings } from "types/settings";

export function parseStickerString(input: string): [string, string] {
  if (!input) {
    return ["", ""]
  }
  let match = input.match(/^(.*?)\s*\/\/\s*(.*)$/);
  if (match) {
      return [match[1], match[2]];
  } else {
      return ["", input];
  }
}
export const emojiFromString = (emoji: string) => {
  let html;
    try {
      html = unifiedToNative(emoji)
    }
    catch {
      html = emoji
    }
    return html;
}
export const nativeToUnified = (native: string) => native.codePointAt(0).toString(16);

export const unifiedToNative = (unified: string) => {
  let unicodes = unified.split("-");
  let codePoints = unicodes.map((u) => `0x${u}`);
  // @ts-ignore
  return String.fromCodePoint(...codePoints);
}

export const indexOfCharElseEOS = (char: string, str: string) => {
  if (str.indexOf(char) > 0) return str.indexOf(char);
  return str.length;
};

export const spaceNameFromContextPath = (contextPath: string) => contextPath.substring(0, contextPath.length-2)
export const spaceContextPathFromName = (spaceName: string) => spaceName.replace(/\//g, "+")+'//'
;

export const removeQuotes = (s: string) : string => {
  if (!s) return s;
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
      return s.substring(1, s.length - 1);
  } else {
      return s;
  }
}

export const filePathToString = (filename: string) => {
  if (filename.lastIndexOf("/") != -1) {
    if (filename.lastIndexOf(".") != -1)
      return removeLeadingSlash(
        filename.substring(
          filename.lastIndexOf("/") + 1,
          filename.lastIndexOf(".")
        )
      );
    return filename.substring(filename.lastIndexOf("/") + 1);
  }
  if (filename.lastIndexOf(".") != -1) {
    return filename.substring(0, filename.lastIndexOf("."));
  }
  return filename;
};
export const stringFromTag = (string: string) => {
  if (string.charAt(0) == "#") {
    return string.substring(1, string.length);
  }
  return string;
};
export const fileNameToString = (filename: string) =>
  filename.substring(0, filename.lastIndexOf(".")) || filename;
const removeLeadingSlash = (path: string) =>
  path.charAt(0) == "/" ? path.substring(1) : path;
export const filePathToFolderPath = (filename: string) =>
  removeLeadingSlash(filename.substring(0, filename.lastIndexOf("/"))) ||
  filename;

  
export const folderPathToString = (filename: string) =>
  removeLeadingSlash(filename.substring(filename.lastIndexOf("/"))) || filename;

  export const contextDisplayName = (context: ContextInfo) => {
    if (!context) return "";
    if (context?.type == "folder") return folderPathToString(context.contextPath);
    if (context?.type == "tag") return stringFromTag(context.contextPath);
    if (context?.type == "space") return spaceNameFromContextPath(context.contextPath);
    if (context.isRemote) {
      return folderPathToString(context.contextPath);
    }
    return context.contextPath;
  };

  export const folderNotePathFromAFile = (settings: MakeMDPluginSettings, aFile: AFile | FileMetadataCache) => !aFile ? null : settings.folderNoteInsideFolder
      ? `${aFile.path}/${aFile.name}.md`
      : aFile.parent == "/"
      ? `${aFile.name}.md`
      : `${aFile.parent}/${aFile.name}.md`;

      export const folderPathFromFolderNoteFile = (settings: MakeMDPluginSettings, aFile: AFile | FileMetadataCache) => !aFile ? null : settings.folderNoteInsideFolder
      ? aFile.parent
      : aFile.parent == "/"
      ? aFile.name
      : `${aFile.parent}/${aFile.name}`;

      