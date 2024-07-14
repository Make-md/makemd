import { ObsidianFileSystem } from "adapters/obsidian/filesystem/filesystem";
import _ from "lodash";
import MakeMDPlugin from "main";
import { indexCurrentFileTree } from "./indexCurrentFileTree";


export const rebuildIndex = async (filesystem: ObsidianFileSystem, plugin: MakeMDPlugin, save?: boolean) => {
  const start = Date.now();
  const newTables = indexCurrentFileTree(plugin, filesystem.vaultDBCache ?? []);
  if (save && (!_.isEqual(newTables.vault.rows, filesystem.vaultDBCache))) {
    await filesystem.saveSpacesDatabaseToDisk(newTables, save);
  }
  plugin.superstate.ui.notify(`Make.md - Vault Reindexed in ${(Date.now()-start)/1000} seconds`, "console");
};
