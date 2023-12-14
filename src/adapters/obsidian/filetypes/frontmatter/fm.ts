import { saveProperties } from "core/superstate/utils/spaces";
import { PathPropertyName } from "core/types/context";
import MakeMDPlugin from "main";
import {
  App,
  CachedMetadata,
  FrontMatterCache,
  TAbstractFile,
  TFile
} from "obsidian";
import { DBTable, SpaceTable } from "types/mdb";
import { onlyUniquePropCaseInsensitive } from "utils/array";

import { defaultValueForType, parseMDBValue, yamlTypeToMDBType } from "utils/properties";

export const stripFrontmatterFromString = (string: string) => {
  return string.replace(/---(.|\n)*---/, "");
};



export const frontMatterForFile = (app: App, file: TAbstractFile): FrontMatterCache => {
  let currentCache!: CachedMetadata;
  if (file instanceof TFile && app.metadataCache.getFileCache(file) !== null) {
    currentCache = app.metadataCache.getFileCache(file);
  }
  return currentCache?.frontmatter;
};

export const mergeTableData = (
  mdb: SpaceTable,
  yamlmdb: DBTable,
  types: Record<string, string>
): SpaceTable => {
  return {
    ...mdb,
    cols: [
      ...mdb.cols,
      ...yamlmdb.cols
        .filter(
          (f) => !mdb.cols.find((g) => g.name.toLowerCase() == f.toLowerCase())
        )
        .map((f) => ({
          name: f,
          schemaId: mdb.schema.id,
          type: yamlTypeToMDBType(types[f]),
        })),
    ].filter(onlyUniquePropCaseInsensitive("name")),
    rows: mdb.rows.map((r) => {
      const fmRow = yamlmdb.rows.find((f) => f[PathPropertyName] == r[PathPropertyName]);
      if (fmRow) {
        return {
          ...r,
          ...fmRow,
        };
      }
      return r;
    }),
  };
};
const valueForDataview = (type: string, value: string): any => {
  if (type.includes("link") || type.includes("context")) {
    return `[[${value}]]`;
  }
  return value;
};

export const renameFrontmatterKey = (
  plugin: MakeMDPlugin,
  path: string,
  key: string,
  name: string
) => {
  plugin.superstate.spaceManager.renameProperty(path, key, name);
};


export const changeFrontmatterType = (
  plugin: MakeMDPlugin,
  path: string,
  key: string,
  type: string
) => {
  saveProperties(plugin.superstate, path, {
    [key]: defaultValueForType(type),
  });
};

export const deleteFrontmatterValue = (
  plugin: MakeMDPlugin,
  path: string,
  key: string
) => {
  plugin.superstate.spaceManager.deleteProperty(path, key);
}

export const saveFrontmatterValue = (
  plugin: MakeMDPlugin,
  path: string,
  key: string,
  value: string,
  type: string,
) => {

  saveProperties(plugin.superstate, path, {
    [key]: parseMDBValue(type, value),
  });
  
};


