import MakeBasicsPlugin from "basics/basics";
import MakeMenu from "./MakeMenu/MakeMenu";
import StickerMenu from "./StickerMenu";
import { loadStylerIntoContainer } from "./inlineStylerView/InlineMenu";

export const registerEditorMenus = (plugin: MakeBasicsPlugin) => {
    if (plugin.settings.flowMenuEnabled)
      {
        plugin.plugin.registerEditorSuggest(new MakeMenu(plugin.app, plugin));
      }
      if (plugin.settings.inlineStickerMenu)
      {plugin.plugin.registerEditorSuggest(new StickerMenu(plugin.app, plugin));}
      if (plugin.isTouchScreen() && plugin.settings.mobileMakeBar && plugin.settings.inlineStyler)
        loadStylerIntoContainer(plugin.app.mobileToolbar.containerEl, plugin);
}