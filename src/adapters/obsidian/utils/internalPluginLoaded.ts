import { App } from "obsidian";


export const internalPluginLoaded = (pluginName: string, app: App) => {
  // @ts-ignore
  return app.internalPlugins.plugins[pluginName]?._loaded;
};
