import MakeMDPlugin from "main";
import MakeMenu from "./MakeMenu/MakeMenu";
import StickerMenu from "./StickerMenu";
import { loadStylerIntoContainer } from "./inlineStylerView/InlineMenu";

export const registerEditorMenus = (plugin: MakeMDPlugin) => {
    if (plugin.superstate.settings.flowMenuEnabled)
      {
        plugin.registerEditorSuggest(new MakeMenu(plugin.app, plugin));
      }
      if (plugin.superstate.settings.inlineStickerMenu)
      {plugin.registerEditorSuggest(new StickerMenu(plugin.app, plugin));}
      if (plugin.superstate.ui.getScreenType() == 'mobile' && plugin.superstate.settings.mobileMakeBar && plugin.superstate.settings.inlineStyler)
        loadStylerIntoContainer(plugin.app.mobileToolbar.containerEl, plugin);
}