import { ensureArray } from "core/utils/strings";
import { Superstate } from "makemd-core";
import { parseMDBStringValue } from "utils/properties";
import { serializeMultiDisplayString } from "utils/serializers";
import { metadataPathForSpace, saveProperties } from "./spaces";

export const savePathBanner = (superstate: Superstate, path: string, banner: string) => {
  if (superstate.spacesIndex.has(path)) {
    saveProperties(superstate, metadataPathForSpace(superstate, superstate.spacesIndex.get(path).space), {
      [superstate.settings.fmKeyBanner]: banner,
    });
    return;
  }
  saveProperties(superstate, path, {
    [superstate.settings.fmKeyBanner]: banner,
  });
};
export const savePathColor = async (
  superstate: Superstate,
  path: string,
  color: string
) => {
    superstate.spaceManager.saveLabel(path, superstate.settings.fmKeyColor, color);

};
export const savePathSticker = async (
  superstate: Superstate,
  path: string,
  sticker: string
) => {
    superstate.spaceManager.saveLabel(path, superstate.settings.fmKeySticker, sticker);
};
export const updatePrimaryAlias = (superstate: Superstate,
  path: string, aliases: string[],
  value: string) => {
  const newValue = serializeMultiDisplayString([value, ...ensureArray(aliases).filter(f => f == value)]);
  return saveProperties(superstate, path, { [superstate.settings.fmKeyAlias]: parseMDBStringValue("option-multi", newValue, true) });

};

