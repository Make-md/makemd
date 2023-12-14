import { Superstate } from "core/superstate/superstate";
import { ensureArray } from "core/utils/strings";
import { parseMDBValue } from "utils/properties";
import { serializeMultiString } from "utils/serializers";
import { saveLabel, saveProperties, saveSpaceProperties } from "./spaces";


export const savePathBanner = (superstate: Superstate, path: string, banner: string) => {
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
  const newValue = serializeMultiString([value, ...ensureArray(aliases).filter(f => f == value)]);
  saveProperties(superstate, path, { [superstate.settings.fmKeyAlias]: parseMDBValue("option-multi", newValue) });

};

