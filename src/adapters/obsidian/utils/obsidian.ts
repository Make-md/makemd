import { App } from "obsidian";

export const corePluginEnabled = (app: App, plugin: string) => app.internalPlugins.getPluginById(plugin) ? true : false;