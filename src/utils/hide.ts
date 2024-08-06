import { MakeMDSettings } from "core/types/settings";

export const excludePathPredicate =
  (settings: MakeMDSettings, path: string) =>
    (
      settings.hiddenExtensions.some((e) => path.endsWith(e))
      || path.endsWith('/'+settings.spaceSubFolder) || path == settings.spaceSubFolder
    ) || path.startsWith(settings.spacesFolder+'/#') ||
    settings.hiddenFiles.some((e) => e == path)