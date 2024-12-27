import { SpaceViewContainer } from "adapters/obsidian/SpaceViewContainer";
import MakeMDPlugin from "main";
import { MarkdownView } from "obsidian";
import { parseStickerString } from "shared/utils/stickers";
import { stickerFromString } from "../ui/sticker";


export const modifyTabSticker = (plugin: MakeMDPlugin) => {
  if (!plugin.superstate.settings.spacesStickers) return;
  let leaf = plugin.app.workspace.getActiveViewOfType(MarkdownView)?.leaf;
  if (leaf) {
    const file = plugin.app.workspace.getActiveFile();
    if (!file) return;
    const pathCache = plugin.superstate.pathsIndex.get(file.path);
    if (pathCache?.label.sticker && leaf.tabHeaderInnerIconEl) {
      const [stickerType, stickerPath] = parseStickerString(pathCache.label.sticker);
      if (stickerType == "image") {
        const path = plugin.superstate.ui.getUIPath(plugin.superstate.imagesCache.get(stickerPath));
        if (path)
          leaf.tabHeaderInnerIconEl.innerHTML = `<img src="${path}" />`;
      } else {
        const icon = stickerFromString(pathCache.label.sticker, plugin);
        leaf.tabHeaderInnerIconEl.innerHTML = icon;
      }
      
    }
    return;
  } else {
    leaf = plugin.app.workspace.getActiveViewOfType(SpaceViewContainer)?.leaf;
    if (leaf) {
      const spacePath = leaf.view.getState().path;

      const fileCache = plugin.superstate.pathsIndex.get(spacePath);
      if (fileCache?.label?.sticker && leaf.tabHeaderInnerIconEl) {
        const [stickerType, stickerPath] = parseStickerString(fileCache.label.sticker);
      if (stickerType == "image") {
        const path = plugin.superstate.ui.getUIPath(plugin.superstate.imagesCache.get(stickerPath));
        if (!path)
         return path;
        leaf.tabHeaderInnerIconEl.innerHTML = `<img src="${path}" />`;
      } else {
        const icon = stickerFromString(fileCache.label.sticker, plugin);
        leaf.tabHeaderInnerIconEl.innerHTML = icon;
      }
        
      }
      return;
    }
  }


};
