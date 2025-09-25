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
    // State-of-the-art solution for exact emoji bounding box fitting
    // Uses SVG foreignObject for perfect sizing and alignment
    const emoji = emojiFromString(value);
    
    // Method 1: SVG with foreignObject for precise control
    // Using 2x2 viewBox with 1.7px font-size for perfect alignment
    return `
    <svg viewBox="0 0 26 26" preserveAspectRatio="xMidYMid meet" style="width: var(--icon-size); height: var(--icon-size); display: inline-block; vertical-align: middle;">
      <foreignObject x="0" y="0" width="26" height="26">
        <div xmlns="http://www.w3.org/1999/xhtml" style="
          position: relative;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span class="mk-emoji-icon-span${options?.fontless ? ' fontless' : ''}">${emoji}</span>
        </div>
      </foreignObject>
    </svg>
    `;
    
    // Alternative Method 2: CSS Grid approach (commented out, use if SVG causes issues)
    // return `
    // <span style="
    //   display: inline-grid;
    //   place-items: center;
    //   width: var(--icon-size);
    //   height: var(--icon-size);
    //   font-size: calc(var(--icon-size) * 0.85);
    //   line-height: 1;
    //   overflow: hidden;
    //   ${!options?.fontless ? 'font-family: \'Apple Color Emoji\', \'Segoe UI Emoji\', \'Noto Color Emoji\', \'Android Emoji\', \'EmojiOne Color\', \'Twemoji Mozilla\', sans-serif;' : ''}
    // ">
    //   ${emoji}
    // </span>
    // `;
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
