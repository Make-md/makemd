import { MakeMDSettings } from "core/types/settings";

export const excludePathPredicate =
  (settings: MakeMDSettings, path: string) =>
    (
      settings.hiddenExtensions.some((e) => path.endsWith(e))
    ) || path.startsWith(settings.spacesFolder+'/#') ||
    settings.hiddenFiles.some((e) => e == path)