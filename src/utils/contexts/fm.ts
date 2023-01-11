import _ from "lodash";
import {
  CachedMetadata,
  FrontMatterCache,
  TAbstractFile,
  TFile,
} from "obsidian";
import { getAPI } from "obsidian-dataview";
import { DBTable, MDBField, MDBTable } from "types/mdb";
import { getAbstractFileAtPath } from "utils/file";
import { onlyUniqueProp, uniq } from "../tree";
import { splitString } from "./predicate/predicate";

export const stripFrontmatterFromString = (string: string) => {
  return string.replace(/---(.|\n)*---/, "");
};

export const saveContextToFile = (
  file: TFile,
  cols: MDBField[],
  context: Record<string, any>
) => {
  //@ts-ignore
  if (app.fileManager.processFrontMatter) {
    //@ts-ignore
    app.fileManager.processFrontMatter(file, (frontmatter) => {
      Object.keys(context)
        .filter(
          (f) =>
            cols.find((c) => c.name == f) &&
            cols.find((c) => c.name == f).hidden != "true" &&
            !cols.find((c) => c.name == f).type.contains("file") &&
            context[f]
        )
        .forEach((c) => {
          frontmatter[c] = context[c];
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

export const frontMatterKeys = (fm: FrontMatterCache) => {
  return Object.keys(fm ?? {}).filter((f) => f != "position");
};

export const yamlTypeToMDBType = (YAMLtype: string) => {
  switch (YAMLtype) {
    case "duration":
      return "text";
      break;
    case "unknown":
      return "text";
      break;
  }
  return YAMLtype;
};

export const detectYAMLType = (value: any, key: string): string => {
  if (typeof value === "string") {
    if (
      /\/\/(\S+?(?:jpe?g|png|gif|svg))/gi.test(value) ||
      value.contains("unsplash")
    ) {
      return "image";
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return "date";
    }
    if (key == "tag" || key == "tags") {
      return "tag";
    }
    return "text";
  } else if (typeof value === "number") {
    return "number";
  } else if (typeof value === "boolean") {
    return "boolean";
  } else if (!value) {
    return "unknown";
  } else if (Array.isArray(value)) {
    if (key == "tag" || key == "tags") {
      return "tag-multi";
    }
    const types = uniq(value.map((f) => detectYAMLType(f, key)));
    if (types.length == 1 && types[0] == "link") {
      return "link-multi";
    }
    return "option-multi";
  } else if (value.isLuxonDateTime) {
    return "date";
  } else if (value.isLuxonDuration) {
    return "duration";
  } else if (value.type == "file") {
    return "link";
  }
  return "text";
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
    ].filter(onlyUniqueProp("name")),
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
  dv: boolean
): Record<string, string> => {
  const dataViewAPI = getAPI();
  const typesArray = _files
    .map((f) => getAbstractFileAtPath(app, f))
    .filter((f) => f)
    .map((k) => {
      const fm = dv ? dataViewAPI.page(k.path) : frontMatterForFile(k);
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
export const saveFrontmatterValue = (
  path: string,
  key: string,
  value: string,
  type: string,
  forceSave?: boolean
) => {
  const afile = getAbstractFileAtPath(app, path);
  //@ts-ignore
  if (afile && app.fileManager.processFrontMatter) {
    //@ts-ignore
    app.fileManager.processFrontMatter(afile, (frontmatter) => {
      if (key in frontmatter || forceSave) {
        if (type == "number") {
          frontmatter[key] = parseInt(value);
        } else if (type == "boolean") frontmatter[key] = value == "true";
        else if (type.contains("multi")) {
          frontmatter[key] = splitString(value);
        } else {
          frontmatter[key] = value;
        }
      }
    });
  }
};

export const parseFrontMatter = (field: string, value: any, dv: boolean) => {
  const YAMLtype = detectYAMLType(value, field);
  switch (YAMLtype) {
    case "number":
      return (value as number).toString();
      break;
    case "boolean":
      return value ? "true" : "false";
      break;
    case "date":
      if (!dv) {
        return value;
      } else {
        return new Date(value.ts).toDateString();
      }
      break;
    case "duration":
      return Object.keys(value.values)
        .reduce(
          (p, c) => [
            ...p,
            ...(value.values[c] > 0 ? [value.values[c] + " " + c] : []),
          ],
          []
        )
        .join(", ");
      break;
    case "option-multi":
    case "link-multi":
    case "tag-multi":
      return (value as string[]).join(",");
      break;
    case "link":
      return value.path;
      break;
    case "text":
    case "tag":
    case "image":
      return value;
      break;
  }
  return "";
};
