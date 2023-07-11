import MakeMDPlugin from "main";
import { getIcon } from "obsidian";
import { uiIconSet } from "./icons";
import { emojiFromString, parseStickerString } from "./strings";

export const stickerFromString = (sticker: string, plugin: MakeMDPlugin) => {
  const [type, value] = parseStickerString(sticker);
  if (type == '' || type == 'emoji') {
    return emojiFromString(value);
  } else if (type == 'ui') {
    return uiIconSet[value];
  } else if (type == 'lucide') {
    return getIcon(value)?.outerHTML;
  } else {
    return plugin.index.iconsCache.get(value);
  }


};
