import { ISuperstate as Superstate } from "shared/types/superstate";

export const savePathSticker = async (
  superstate: Superstate,
  path: string,
  sticker: string
) => {
  superstate.spaceManager.saveLabel(path, superstate.settings.fmKeySticker, sticker);
};export const removeIconsForPaths = (superstate: Superstate, paths: string[]) => {
  paths.forEach((path) => {
    savePathSticker(superstate, path, "");
  });
};

