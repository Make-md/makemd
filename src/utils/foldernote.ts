import { AFile } from "schemas/spaces"
import { FileMetadataCache } from "types/cache"
import { MakeMDPluginSettings } from "types/settings"
import { getAbstractFileAtPath, tFileToAFile } from "./file"
import { folderNotePathFromAFile, folderPathFromFolderNoteFile } from "./strings"

export const isFolderNote = (settings: MakeMDPluginSettings, aFile: AFile | FileMetadataCache) => {
    if (!aFile) return false;
    const afolder = tFileToAFile(getAbstractFileAtPath(app, folderPathFromFolderNoteFile(settings, aFile)))
    if (!afolder) return false;
    if (folderNotePathFromAFile(settings, afolder) == aFile.path)
    return true;
    return false;
  }