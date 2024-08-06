import { uiIconSet } from "core/assets/icons";
import MakeMDPlugin from "main";
import { emojiFromString, parseStickerString } from "utils/stickers";
import { lucideIcon } from "./icons";

export const stickerFromString = (sticker: string, plugin: MakeMDPlugin) => {
  if (!sticker || typeof sticker != 'string')
  return "";
  const [type, value] = parseStickerString(sticker);
  if (type == '' || type == 'emoji') {
    return `
    <svg viewBox="0 0 18 18" font-family="Apple Color Emoji, Android Emoji", Segoe UI">
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="114%">${emojiFromString(value)}</text>
    </svg>
    `;
  } else if (type == 'ui') {
    return uiIconSet[value];
  } else if (type == 'lucide') {
    return lucideIcon(value);
  } else {
    let icon = plugin.superstate.iconsCache.get(value);
      if (!icon) {
        
        const alias = plugin.superstate.imagesCache.get(value);
        if (alias) {
          icon = plugin.superstate.iconsCache.get(alias)
        }
      }
    return icon
  }

};
