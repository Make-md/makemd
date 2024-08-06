import { Superstate } from "core/superstate/superstate";
import { ensureArray } from "core/utils/strings";
import { parseMDBStringValue } from "utils/properties";
import { serializeMultiDisplayString } from "utils/serializers";
import { metadataPathForSpace, saveLabel, saveProperties, saveSpaceProperties } from "./spaces";

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
  if (superstate.spacesIndex.has(path)) {
    saveSpaceProperties(superstate, path, { [superstate.settings.fmKeyColor]: color })
    return;
}
  saveLabel(superstate, path, "color", color);

};
export const savePathSticker = async (
  superstate: Superstate,
  path: string,
  sticker: string
) => {
  if (superstate.spacesIndex.has(path)) {
    saveSpaceProperties(superstate, path, { [superstate.settings.fmKeySticker]: sticker })
    return;
}
  saveLabel(superstate, path, "sticker", sticker);
};
export const updatePrimaryAlias = (superstate: Superstate,
  path: string, aliases: string[],
  value: string) => {
  const newValue = serializeMultiDisplayString([value, ...ensureArray(aliases).filter(f => f == value)]);
  return saveProperties(superstate, path, { [superstate.settings.fmKeyAlias]: parseMDBStringValue("option-multi", newValue, true) });

};

