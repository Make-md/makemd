import { vaultSchema } from "adapters/obsidian/filesystem/schemas/vaultSchema";
import MakeMDPlugin from "main";
import { TFile, TFolder } from "obsidian";
import { DBRows, DBTables } from "types/mdb";
import { getAllAbstractFilesInVault } from "../utils/file";


export const indexCurrentFileTree = (plugin: MakeMDPlugin, vaultDB: DBRows): DBTables => {
  const treeItems: DBRows = getAllAbstractFilesInVault(plugin).map(file => ({
    ...(vaultDB.find(f => f.path == file.path) ?? {}),
    path: file.path,
    parent: file.parent?.path,
    created: file instanceof TFile ? file.stat.ctime.toString() : undefined,
    folder: file instanceof TFolder ? "true" : "false",
  }));
  
  return {
    vault: {
      ...vaultSchema,
      rows: treeItems
    },
  };

};
