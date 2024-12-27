
import { savePathColor, savePathSticker } from "core/superstate/utils/label";
import { Superstate } from "makemd-core";


export const saveIconsForPaths = (
  superstate: Superstate,
  paths: string[],
  icon: string
) => {
  paths.forEach((path) => {
      savePathSticker(superstate, path, icon);
  });
};

export const saveColorForPaths = (
  superstate: Superstate,
  paths: string[],
  icon: string
) => {
  paths.forEach((path) => {

      savePathColor(superstate, path, icon);

  });
};


export const savePathIcon = (
  superstate: Superstate,
  path: string,
  icon: string
) => {
  savePathSticker(superstate, path, icon);
};

export const removeIconsForPaths = (superstate: Superstate, paths: string[]) => {
  paths.forEach((path) => {
      savePathSticker(superstate, path, "");
  });
};
export const removePathIcon = (superstate: Superstate, path: string) => {
  savePathSticker(superstate, path, "");
};
