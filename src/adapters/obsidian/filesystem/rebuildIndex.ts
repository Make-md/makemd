import { ObsidianFileSystem } from "adapters/obsidian/filesystem/filesystem";
import _ from "lodash";
import { indexCurrentFileTree } from "./indexCurrentFileTree";


export const rebuildIndex = async (filesystem: ObsidianFileSystem, save?: boolean) => {
  const start = Date.now();
  const newTables = indexCurrentFileTree(filesystem.plugin, filesystem.vaultDBCache ?? []);
  if (save && (!_.isEqual(newTables.vault.rows, filesystem.vaultDBCache))) {
    await filesystem.saveSpacesDatabaseToDisk(newTables, save);
  }
  filesystem.plugin.superstate.ui.notify(`Make.md - Vault Reindexed in ${(Date.now()-start)/1000} seconds`, "console");
};
