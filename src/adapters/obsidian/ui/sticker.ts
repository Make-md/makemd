import MakeMDPlugin from "main";
import { uiIconSet } from "shared/assets/icons";
import { emojiFromString, parseStickerString } from "shared/utils/stickers";
import { lucideIcon } from "./icons";


export const stickerFromString = (sticker: string, plugin: MakeMDPlugin, options?: {
  fontless?: boolean;
}) => {
  if (!sticker || typeof sticker != 'string')
  return "";
  const [type, value] = parseStickerString(sticker);
  if (type == '' || type == 'emoji') {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18"${!options?.fontless ? ' font-family="Apple Color Emoji, Android Emoji, Segoe UI"':''}>
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="114%">${emojiFromString(value)}</text>
    </svg>
    `;
  } else if (type == 'ui') {
    return uiIconSet[value];
  } else if (type == 'lucide') {
    return lucideIcon(value);
  } else {
    // For custom iconsets, the type is the iconset ID and value is the icon name
    // Format: iconsetId//iconName where type=iconsetId and value=iconName
    const iconsetId = type;
    const iconName = value;
    
    // Use AssetManager if available
    if (plugin.superstate.assets) {
      const assetManager = plugin.superstate.assets;
      
      // Try to get icon from AssetManager (uses cache and can load if needed)
      const iconKey = `${iconsetId}//${iconName}`;
      const icon = assetManager.getIconSync(iconKey) || 
                   assetManager.getIconSync(iconName) ||
                   assetManager.getIconSync(sticker);
      
      if (icon) {
        return icon;
      }
      
      // If not found, schedule async load for next time
      assetManager.getIcon(iconKey).then(loadedIcon => {
        if (loadedIcon) {
          // Icon is now cached for future use
        }
      }).catch(() => {
        // Try loading just the icon name as fallback
        assetManager.getIcon(iconName).then(fallbackIcon => {
          if (fallbackIcon) {
            // Fallback icon loaded
          }
        }).catch(() => {
          // Ignore errors - icon not found
        });
      });
    }
    
    return '';
  }

};
