import MakeMDPlugin from "main";
import { emojiFromString, parseStickerString } from "utils/stickers";
import { lucideIcon, uiIconSet } from "./icons";

export const stickerFromString = (sticker: string, plugin: MakeMDPlugin) => {
  if (!sticker || typeof sticker != 'string')
  return "";
  const [type, value] = parseStickerString(sticker);
  if (type == '' || type == 'emoji') {
    return emojiFromString(value);
  } else if (type == 'ui') {
    return uiIconSet[value];
  } else if (type == 'lucide') {
    return lucideIcon(value);
  } else {
    return plugin.superstate.iconsCache.get(value);
  }

};
