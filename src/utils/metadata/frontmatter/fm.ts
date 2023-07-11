import { format } from "date-fns";
import _ from "lodash";
import MakeMDPlugin from "main";
import {
  CachedMetadata,
  FrontMatterCache,
  TAbstractFile,
  TFile
} from "obsidian";
import { DBTable, MDBField, MDBTable } from "types/mdb";
import { getAbstractFileAtPath } from "utils/file";
import { onlyUniquePropCaseInsensitive } from "../../array";
import { parseMultiString } from "../../parser";
import { replaceValues } from "../dv";
import { detectYAMLType } from "./detectYAMLType";
import { frontMatterKeys } from "./frontMatterKeys";
import { yamlTypeToMDBType } from "./yamlTypeToMDBType";

export const stripFrontmatterFromString = (string: string) => {
  return string.replace(/---(.|\n)*---/, "");
};

export const saveContextToFile = (
  file: TFile,
  cols: MDBField[],
  context: Record<string, any>,
  plugin: MakeMDPlugin
) => {
  if (app.fileManager.processFrontMatter) {
    app.fileManager.processFrontMatter(file, (frontmatter) => {
      Object.keys(context)
        .filter(
          (f) =>
            cols.find((c) => c.name == f) &&
            cols.find((c) => c.name == f).hidden != "true" &&
            !cols.find((c) => c.name == f).type.contains("file") &&
            context[f]
        )
        .forEach((f) => {
          const col = cols.find((c) => c.name == f);
          frontmatter[f] = valueForFrontmatter(col.type, context[f]);
            frontmatter[f] = valueForFrontmatter(col.type, context[f]);
        });
    });
  }
};

export const frontMatterForFile = (file: TAbstractFile): FrontMatterCache => {
  let currentCache!: CachedMetadata;
  if (file instanceof TFile && app.metadataCache.getFileCache(file) !== null) {
    currentCache = app.metadataCache.getFileCache(file);
  }
  return currentCache?.frontmatter;
};

export const mergeTableData = (
  mdb: MDBTable,
  yamlmdb: DBTable,
  types: Record<string, string>
): MDBTable => {
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
      const fmRow = yamlmdb.rows.find((f) => f.File == r.File);
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
export const guestimateTypes = (
  _files: string[],
  plugin: MakeMDPlugin,
  dv: boolean
): Record<string, string> => {
  const typesArray = _files
    .map((f) => getAbstractFileAtPath(app, f))
    .filter((f) => f)
    .map((k) => {
      const fm =
        dv && plugin.dataViewAPI()
          ? plugin.dataViewAPI().page(k.path)
          : frontMatterForFile(k);
      const fmKeys = dv
        ? Object.keys(fm ?? {})
            .filter((f, i, self) =>
              !self.find(
                (g, j) =>
                  g.toLowerCase().replace(/\s/g, "-") ==
                    f.toLowerCase().replace(/\s/g, "-") && i > j
              )
                ? true
                : false
            )
            .filter((f) => f != "file")
        : frontMatterKeys(fm as FrontMatterCache);
      return fmKeys.reduce(
        (pk, ck) => ({ ...pk, [ck]: detectYAMLType(fm[ck], ck) }),
        {}
      );
    });
  const types: Record<string, string[]> = typesArray.reduce(
    (p: Record<string, string[]>, c: Record<string, string>) => {
      const newSet = Object.keys(c).reduce(
        (pk, ck) => {
          return { ...pk, [ck]: [...(p?.[ck] ?? []), c[ck]] };
        },
        { ...p }
      );
      return newSet;
    },
    {}
  );
  const guessType = (ts: string[]): string => {
    return _.head(_(ts).countBy().entries().maxBy(_.last)) as string;
  };
  const guessedTypes = Object.keys(types).reduce((p, c) => {
    return { ...p, [c]: guessType(types[c]) };
  }, {});
  return guessedTypes;
};

const valueForFrontmatter = (type: string, value: string): any => {
  if (type == "number") {
    return parseFloat(value);
  } else if (type == "boolean") {
    return value == "true";
  } else if (type.contains("multi")) {
    return parseMultiString(value).map((f) =>
      valueForFrontmatter(type.replace("-multi", ""), f)
    );
  } else if (type.contains("link") || type.contains("context")) {
    return `[[${value}]]`;
  }
  return value;
};

const valueForDataview = (type: string, value: string): any => {
  if (type.contains("link") || type.contains("context")) {
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
  const afile = getAbstractFileAtPath(app, path);
  if (afile && afile instanceof TFile) {
    if (app.fileManager.processFrontMatter) {
      app.fileManager.processFrontMatter(afile, (frontmatter) => {
        if (key in frontmatter) {
          frontmatter[name] = frontmatter[key];
          delete frontmatter[key];
        }
      });
    }
  }
};

export const defaultValueForType = (value: string, type: string) => {
  if (type == "date") {
    return format(Date.now(), "yyyy-MM-dd");
  }
  if (type == "number") {
    return 0;
  }
  if (type == "boolean") {
    return true;
  }
  if (type == "link") {
    return "[[Select Note]]";
  }
  if (type == "option") {
    return "one, two";
  }
  if (type == "text") {
    return " ";
  }
  if (type == "image") {
    return "https://images.unsplash.com/photo-1675789652575-0a5d2425b6c2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80";
  }
};
export const changeFrontmatterType = (
  plugin: MakeMDPlugin,
  path: string,
  key: string,
  type: string
) => {
  const afile = getAbstractFileAtPath(app, path);
  if (afile && afile instanceof TFile) {
    if (app.fileManager.processFrontMatter) {
      app.fileManager.processFrontMatter(afile, (frontmatter) => {
        if (key in frontmatter) {
          frontmatter[key] = defaultValueForType(frontmatter[key], type);
        }
      });
    }
  }
};

export const deleteFrontmatterValue = (
  plugin: MakeMDPlugin,
  path: string,
  key: string
) => {
  const afile = getAbstractFileAtPath(app, path);
  if (afile && afile instanceof TFile) {
    if (app.fileManager.processFrontMatter) {
      app.fileManager.processFrontMatter(afile, (frontmatter) => {
        if (plugin.dataViewAPI()) {
          if (plugin.dataViewAPI().page(path)[key] && !frontmatter[key]) {
            replaceValues(plugin, path, key, "");
          } else {
            if (key in frontmatter) {
              delete frontmatter[key];
            }
          }
        } else {
          if (key in frontmatter) {
            delete frontmatter[key];
          }
        }
      });
    }
  }
};

export const saveFrontmatterValue = (
  plugin: MakeMDPlugin,
  path: string,
  key: string,
  value: string,
  type: string,
  forceSave?: boolean
) => {
  let afile = getAbstractFileAtPath(app, path);
  const fileCache = plugin.index.filesIndex.get(path);
  if (afile && fileCache) {
    if (fileCache.isFolder && fileCache.folderNote) {
      afile = getAbstractFileAtPath(app, fileCache.folderNote.folderNotePath)
    }
    if (afile instanceof TFile) {
    if (app.fileManager.processFrontMatter) {
      app.fileManager.processFrontMatter(afile, (frontmatter) => {
        if (plugin.dataViewAPI()) {
          if (plugin.dataViewAPI().page(afile.path)?.[key] && !frontmatter[key]) {
            replaceValues(plugin, afile.path, key, valueForDataview(type, value));
          } else {
            if (key in frontmatter || forceSave) {
              frontmatter[key] = valueForFrontmatter(type, value);
            }
          }
        } else {
          if (key in frontmatter || forceSave) {
            frontmatter[key] = valueForFrontmatter(type, value);
          }
        }
      });
    }
  }
  }
};


