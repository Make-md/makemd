import { MakeMDSettings } from "core/types/settings";

export const excludePathPredicate =
  (settings: MakeMDSettings, path: string) =>
    (
      settings.hiddenExtensions.some((e) => path.endsWith(e))
      || path.endsWith('/'+settings.spaceSubFolder) || path == settings.spaceSubFolder || path.split('/').pop() == settings.spaceSubFolder
    ) || path.startsWith(settings.spacesFolder+'/#') ||
    settings.hiddenFiles.some((e) => e == path)

export const excludeSpacesPredicate =
  (settings: MakeMDSettings, path: string) =>
    (
      settings.skipFolderNames.some((e) => path.endsWith(e))
      || path.endsWith('/'+settings.spaceSubFolder) || path == settings.spaceSubFolder || path.split('/').pop() == settings.spaceSubFolder
    ) || path.startsWith(settings.spacesFolder+'/#') || path.startsWith(settings.spacesFolder+'/$') ||
    settings.skipFolders.some((e) => e == path)
