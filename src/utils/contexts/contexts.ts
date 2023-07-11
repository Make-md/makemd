import MakeMDPlugin from "main";
import { saveSpace } from "superstate/spacesStore/spaces";
import { DBRow, DBRows, MDBField } from "types/mdb";
import { uniq } from "utils/array";
import { urlRegex } from "utils/regex";
import { serializeMultiString } from "utils/serializer";
import { ContextInfo } from "../../types/contextInfo";
import {
  appendFilesMetaData,
  getAbstractFileAtPath,
  getFolderFromPath,
  getFolderPathFromString,
  removeTrailingSlashFromFolder,
  renameFile
} from "../file";
import { renameTag, tagPathToTag, tagToTagPath } from "../metadata/tags";
import { parseMultiString } from "../parser";
import { pathTypeByString } from "../path";
import { filePathToString, spaceContextPathFromName, spaceNameFromContextPath } from "../strings";
import { parsePropString } from "./parsers";
export const renameContext = (plugin: MakeMDPlugin, context: ContextInfo, newName: string) => {
  
if (context.type == 'tag') {
  renameTag(plugin, tagPathToTag(context.contextPath), newName)
} else if (context.type == 'space') {
  const space = plugin.index.spacesIndex.get(spaceNameFromContextPath(context.contextPath))?.space
  if (space) {
    saveSpace(plugin, space.name, {...space, name: newName})
  }
} else if (context.type == 'folder') {
  renameFile(plugin, getAbstractFileAtPath(app, context.contextPath), newName)
}
}
export const contextEmbedStringFromContext = (context: ContextInfo, schema: string) => {
  if (context.type == 'folder') {
    if (context.contextPath == '/')
    return `![![/#^${schema}]]`
    return `![![${context.contextPath}/#^${schema}]]`
  }
  return `![![${context.contextPath}#^${schema}]]`
}

export const spaceContextFromSpace = (
  plugin: MakeMDPlugin,
  space: string,
  readOnly?: boolean
): ContextInfo => {
  return {
    type: "space",
    sticker: '',
    banner: '',
    contextPath: space,
    isRemote: false,
    readOnly: readOnly,
    dbPath:
      getFolderPathFromString(plugin.settings.tagContextFolder) +
      "/" +
      spaceNameFromContextPath(space) +
      ".mdb",
  };
};



export const tagContextFromTag = (
  plugin: MakeMDPlugin,
  tag: string,
  readOnly?: boolean
): ContextInfo => {
  return {
    type: "tag",
    sticker: '',
    banner: '',
    contextPath: tag,
    isRemote: false,
    readOnly: readOnly,
    dbPath:
      getFolderPathFromString(plugin.settings.tagContextFolder) +
      "/" +
      tagToTagPath(tag) +
      ".mdb",
  };
};



export const mdbContextByDBPath = (
  plugin: MakeMDPlugin,
  dbPath: string
): ContextInfo => {
  if (dbPath.match(urlRegex)) {
    return remoteContextFromURL(plugin, dbPath);
  }
  if (dbPath.startsWith(plugin.settings.tagContextFolder)) {
    const contextPath = filePathToString(dbPath);
    if (contextPath.charAt(0) == '#')
      return tagContextFromTag(plugin, tagPathToTag(dbPath))
    return spaceContextFromSpace(plugin, spaceContextPathFromName(contextPath));
  }
  return dbPath.endsWith(plugin?.settings.folderContextFile + ".mdb")
    ? folderContextFromFolder(plugin, getFolderFromPath(app, dbPath).path)
    : null
};

export const remoteContextFromURL = (
  plugin: MakeMDPlugin,
  url: string
): ContextInfo => {
  return {
    type: "unknown",
    sticker: '',
    banner: '',
    contextPath: url,
    isRemote: true,
    readOnly: true,
    dbPath: url,
  };
};

export const mdbContextByPath = (
  plugin: MakeMDPlugin,
  contextPath: string
): ContextInfo => {
  if (!contextPath) return;
  if (contextPath.match(urlRegex)) {
    return remoteContextFromURL(plugin, contextPath);
  }
  const viewType = pathTypeByString(contextPath);
  if (viewType == 'space') {
    return spaceContextFromSpace(plugin, contextPath)
  } else if (viewType == "folder") {
    return folderContextFromFolder(plugin, removeTrailingSlashFromFolder(contextPath));
  } else if (viewType == "tag") {
    return tagContextFromTag(plugin, contextPath);
  }
  return null;
};

export const folderContextFromFolder = (
  plugin: MakeMDPlugin,
  folder: string,
  readOnly?: boolean
): ContextInfo => {
  return {
    type: "folder",
    sticker: '',
    banner: '',
    contextPath: folder,
    isRemote: false,
    readOnly: readOnly,
    dbPath:
      (folder == "/" ? "" : folder + "/") +
      plugin.settings.folderContextFile +
      ".mdb",
  };
};

export const linkContextRow = (
  plugin: MakeMDPlugin,
  row: DBRow,
  fields: MDBField[],
) => {
  return {
    ...row,
    ...fields
      .filter((f) => f.type == "fileprop")
      .reduce((p, c) => {
        const {field, property} = parsePropString(c.value);
        const col = fields.find((f) => f.name == field)
        if (!col || !property) {
          return p;
        }
        if (col.type == "file" || col.type == "link") {
          return {
            ...p,
            [c.name]: appendFilesMetaData(plugin, property, row[col.name]),
          };
        }

        if (col.type.includes("context")) {
          const context = col.value;
          const contextCache = plugin.index.contextsIndex.get(context)
          if (contextCache) {
            return {
              ...p,
              [c.name]: linkContextProp(
                property,
                row[col.name],
                contextCache.rows
              ),
            };
          }
        }
        return p;
      }, {}),
  };
};

export const linkContextProp = (
  propType: string,
  rows: string,
  contextTableRows: DBRows
) => {
  const contextRows = contextTableRows.filter((f) =>
    parseMultiString(rows).contains(f.File)
  );
  return serializeMultiString(uniq(contextRows.map((f) => f[propType]).filter((f) => f)));
};
