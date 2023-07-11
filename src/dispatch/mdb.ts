//handles db ops

import i18n from "i18n";
import _ from "lodash";
import MakeMDPlugin from "main";
import { Notice, TAbstractFile, TFile, TFolder } from "obsidian";
import { FilePropertyName } from "types/context";
import { ContextInfo } from "types/contextInfo";
import { DBRows, MDBField, MDBTable } from "types/mdb";
import { uniqCaseInsensitive } from "utils/array";
import {
  tagContextFromTag
} from "utils/contexts/contexts";
import { removeRowForFile, removeRowsForFile, renameRowForFile } from "utils/contexts/file";
import { linkColumns, removeLinksInRow, renameLinksInRow } from "utils/contexts/links";
import {
  createDefaultDB, getMDBTable, saveMDBToPath
} from "utils/contexts/mdb";
import { abstractFileAtPathExists, getAbstractFileAtPath, tFileToAFile } from "utils/file";
import { parseDataview } from "utils/metadata/dataview/parseDataview";
import {
  frontMatterForFile,
  saveContextToFile
} from "utils/metadata/frontmatter/fm";
import { frontMatterKeys } from "utils/metadata/frontmatter/frontMatterKeys";
import { parseFrontMatter } from "utils/metadata/frontmatter/parseFrontMatter";
import { tagsFromDefString, updateTagsForDefString } from "utils/metadata/tags";
import { parseContextDefString } from "utils/parser";
import { folderNotePathFromAFile } from "utils/strings";



const processContextFile = async (
  plugin: MakeMDPlugin,
  context: ContextInfo,
  processor: (mdb: MDBTable, context: ContextInfo) => Promise<MDBTable>,
  fallback?: () => Promise<void>
): Promise<void> => {
  const dbFileExists = getAbstractFileAtPath(app, context.dbPath);
  if (dbFileExists) {
    const contextDB = await getMDBTable(plugin, context, "files");
    if (contextDB) {
      await processor(contextDB, context);
      return;
    } else if (fallback) {
      await fallback();
    }
  } else if (fallback) {
    await fallback();
  }
};


const saveDB = async (
  plugin: MakeMDPlugin,
  context: ContextInfo,
  newTable: MDBTable
): Promise<boolean> => {
  return saveMDBToPath(plugin, context, newTable);
};


const insertColumns = (table: MDBTable, column: MDBField): MDBTable => {
  if (table.cols.find((f) => f.name == column.name)) {
    new Notice(i18n.notice.duplicatePropertyName);
    return;
  }
  return {
    ...table,
    cols: [...table.cols, column],
  };
};

const updateValue = (
  folder: MDBTable,
  lookupField: string,
  lookupValue: string,
  field: string,
  value: string
) => {
  return {
    ...folder,
    rows: folder.rows.map((f) =>
      f[lookupField] == lookupValue
        ? {
            ...f,
            [field]: value,
          }
        : f
    ),
  };
};

const insertRowsIfUnique = (folder: MDBTable, rows: DBRows): MDBTable => {
  //
  return { ...folder, rows: [...folder.rows, ...rows.filter(f => !folder.rows.some(g => g.File == f.File))] };
};

const saveContextToFrontmatter = (
  file: string,
  cols: MDBField[],
  context: Record<string, any>,
  plugin: MakeMDPlugin
) => {
  const afile = getAbstractFileAtPath(app, file) as TFile;
  if (afile && afile instanceof TFile)
    saveContextToFile(afile, cols, context, plugin);
};


export const contextShouldExist = async (
  plugin: MakeMDPlugin,
  tag: string
): Promise<boolean> => {
  const context = tagContextFromTag(plugin, tag);
  const tagFileExists = getAbstractFileAtPath(app, context.dbPath);
  if (!tagFileExists) return false;
  return getMDBTable(plugin, context, "files").then((f) => f?.rows.length > 0);
};

export const initiateContextIfNotExists = async (
  plugin: MakeMDPlugin,
  tag: string
): Promise<boolean> => {
  const context = tagContextFromTag(plugin, tag);
  const tagFileExists = getAbstractFileAtPath(app, context.dbPath);
  if (tagFileExists) return false;
  return createDefaultDB(plugin, context);
};

export const updateContextValue = async (
  plugin: MakeMDPlugin,
  context: ContextInfo,
  file: string,
  field: string,
  value: string
): Promise<void> => {
  let tagFileExists = abstractFileAtPathExists(app, context.dbPath);
  if (!tagFileExists) {
    tagFileExists = await createDefaultDB(plugin, context);
  }
  if (tagFileExists)
  await getMDBTable(plugin, context, "files")
    .then((tagDB) =>
      {
        const newMDB = updateValue(tagDB, FilePropertyName, file, field, value);
        return saveDB(plugin, context, newMDB).then(f => newMDB)
      }
    )
};

export const insertContextColumn = async (
  plugin: MakeMDPlugin,
  context: ContextInfo,
  field: MDBField
): Promise<void> => {
  
  let tagFileExists = abstractFileAtPathExists(app, context.dbPath);
  if (!tagFileExists) {
    tagFileExists = await createDefaultDB(plugin, context);
  }
  if (tagFileExists)
  await getMDBTable(plugin, context, "files").then((tagDB) =>
  {
    const newDB = insertColumns(tagDB, field)
    saveDB(plugin, context, newDB).then(f => newDB)
    return newDB
  }).then(f => plugin.index.reloadContext(context))
  ;
};

export const columnsForContext = async (
  plugin: MakeMDPlugin,
  context: ContextInfo
): Promise<MDBField[]> => {
  return getMDBTable(plugin, context, "files").then(
    (tagDB) => tagDB?.cols ?? []
  );
};

export const insertContextItems = async (
  plugin: MakeMDPlugin,
  newPaths: string[],
  t: string
): Promise<void> => {
  const saveNewContextRows = async (tag: MDBTable, context: ContextInfo) => {
    const newRow: DBRows = newPaths.map((newPath) => ({ File: newPath }));
    await saveDB(plugin, context, insertRowsIfUnique(tag, newRow));
  };
  const context = tagContextFromTag(plugin, t);
  let tagFileExists = abstractFileAtPathExists(app, context.dbPath);
  if (!tagFileExists) {
    tagFileExists = await createDefaultDB(plugin, context);
  }
  if (tagFileExists)
  await getMDBTable(plugin, context, "files").then((tagDB) =>
    saveNewContextRows(tagDB, context)
  );
};

const fileToFM = (afile: TAbstractFile, cols: string[], plugin: MakeMDPlugin) => {
  let file = afile;
    if (afile instanceof TFolder) {
      file = getAbstractFileAtPath(app, folderNotePathFromAFile(plugin.settings, tFileToAFile(afile)))
    }
    if (!file) return [];
  const fm = frontMatterForFile(file);
  const fmKeys = frontMatterKeys(fm).filter((f) => cols.some((g) => f == g));
  const rows = fmKeys.reduce(
    (p, c) => ({ ...p, [c]: parseFrontMatter(c, fm[c]) }),
    {}
  );
  if (plugin.dataViewAPI()) {
    return { ...rows, ...fileToDV(file as TFile, cols, plugin) };
  }
  return rows;
};

const fileToDV = (file: TFile, cols: string[], plugin: MakeMDPlugin) => {
  const dvValues = plugin.dataViewAPI().page(file.path);
  const fmKeys = uniqCaseInsensitive(
    Object.keys(dvValues ?? {})
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
  ).filter((f) => cols.some((g) => f == g));

  return fmKeys.reduce(
    (p, c) => ({
      ...p,
      [c]: parseDataview(c, dvValues[c]),
    }),
    {}
  );
};

export const onMetadataChange = async (
  plugin: MakeMDPlugin,
  file: TAbstractFile,
  contexts: ContextInfo[]
): Promise<void[]> => {
  const promises = contexts.map((context) => {
    return processContextFile(plugin, context, async (mdb, context) => {
      const newDB = {
        ...mdb,
        rows: mdb.rows.map((f) =>
          f.File == file.path
            ? {
                ...f,
                ...fileToFM(
                  file,
                  mdb.cols.map((f) => f.name),
                  plugin
                ),
              }
            : f
        ),
      };
      if (!_.isEqual(mdb, newDB))
        {
          await saveDB(plugin, context, newDB);
        }
      return newDB;
    })
  });
  return Promise.all(promises);
};



export const renameTagInContexts = async ( plugin: MakeMDPlugin,
  oldTag: string,
  newTag: string,
  contexts: ContextInfo[]): Promise<void[]> => {
    const changeTagInContextMDB = (mdb: MDBTable) => {
      const schema = parseContextDefString(mdb.schema.def).some(t => t.type == 'tag' && t.value == oldTag)
                ? { ...mdb.schema, def: updateTagsForDefString(mdb.schema.def, tagsFromDefString(mdb.schema.def).map(t => t == oldTag ? newTag : t)) }
                : mdb.schema
        const cols = mdb.cols.map(f => f.type.startsWith('context') && f.value == oldTag ? {...f, value: newTag} : f);
        return {...mdb, schema, cols}
    }
    const promises = contexts.map((context) => {
      return processContextFile(plugin, context, async (mdb, context) => {
        const newDB = changeTagInContextMDB(mdb);
        if (!_.isEqual(mdb, newDB))
          {
            await saveDB(plugin, context, newDB);
          }
        return newDB;
      })
    });
    return Promise.all(promises);
  }

  export const removeTagInContexts = async ( plugin: MakeMDPlugin,
    tag: string,
    contexts: ContextInfo[]): Promise<void[]> => {
      const deleteTagInContextMDB = (mdb: MDBTable) => {
        const schema = parseContextDefString(mdb.schema.def).some(t => t.type == 'tag' && t.value == tag)
                  ? { ...mdb.schema, def: updateTagsForDefString(mdb.schema.def, tagsFromDefString(mdb.schema.def).filter(t => t != tag)) }
                  : mdb.schema
        const cols = mdb.cols.map(f => f.type.startsWith('context') && f.value == tag ? {...f, type: 'link-multi'} : f);
        return {...mdb, schema, cols}
      }
      const promises = contexts.map((context) => {
        return processContextFile(plugin, context, async (mdb, context) => {
          const newDB = deleteTagInContextMDB(mdb);
          if (!_.isEqual(mdb, newDB))
            {
              await saveDB(plugin, context, newDB);
            }
          return newDB;
        })
      });
      return Promise.all(promises);
    }



export const addFileInContexts = async (plugin: MakeMDPlugin,
  path: string,
  contexts: ContextInfo[]): Promise<void[]> => {
    
    const promises = contexts.map((context) => {
      return processContextFile(plugin, context, async (mdb, context) => {
        const newDB = insertRowsIfUnique(mdb, [{ File: path }]);
        if (!_.isEqual(mdb, newDB))
          {
            await saveDB(plugin, context, newDB);}
        return newDB;
      })
    });
    return Promise.all(promises);
    
}

export const renameLinkInContexts = async (plugin: MakeMDPlugin,
  oldPath: string,
  newPath: string,
  contexts: ContextInfo[]): Promise<void[]> => {
    const promises = contexts.map((context) => {
      return processContextFile(plugin, context, async (mdb, context) => {
        const linkCols = linkColumns(mdb.cols);
        const newDB = {
          ...mdb,
          rows: mdb.rows.map(r => renameLinksInRow(plugin, r, oldPath, newPath, linkCols))
        } ;
        if (!_.isEqual(mdb, newDB))
        {
          await saveDB(plugin, context, newDB);}
        return newDB;
      })
    });
    return Promise.all(promises);
}

export const removeLinkInContexts = async (plugin: MakeMDPlugin,
  path: string,
  contexts: ContextInfo[]): Promise<void[]> => {
    const promises = contexts.map((context) => {
      return processContextFile(plugin, context, async (mdb, context) => {
        const linkCols = linkColumns(mdb.cols);
        const newDB = {
          ...mdb,
          rows: mdb.rows.map(r => removeLinksInRow(plugin, r, path, linkCols))
        } ;
        if (!_.isEqual(mdb, newDB))
        {
          await saveDB(plugin, context, newDB);}
        return newDB;
      })
    });
    return Promise.all(promises);
}

export const renameFileInContexts = async (plugin: MakeMDPlugin,
  oldPath: string,
  newPath: string,
  contexts: ContextInfo[]): Promise<void[]> => {
    const promises = contexts.map((context) => {
      return processContextFile(plugin, context, async (mdb, context) => {
        const newDB = renameRowForFile(mdb, oldPath, newPath);
        if (!_.isEqual(mdb, newDB))
        {
          await saveDB(plugin, context, newDB);}
        return newDB;
      })
    });
    return Promise.all(promises);
}

export const removeFileInContexts = async (plugin: MakeMDPlugin,
  path: string,
  contexts: ContextInfo[]): Promise<void[]> => {
    const promises = contexts.map((context) => {
      return processContextFile(plugin, context, async (mdb, context) => {
        const removeRow = mdb.rows.find(f => f.File == path);
        if (removeRow) {
          saveContextToFrontmatter(path, mdb.cols, removeRow, plugin)
        }
        const newDB = removeRowForFile(mdb, path);
        
        if (!_.isEqual(mdb, newDB))
        {
          await saveDB(plugin, context, newDB);}
        return newDB;
      })
    });
    return Promise.all(promises);
}

export const removeFilesInContext = async (plugin: MakeMDPlugin,
  paths: string[],
  context: ContextInfo): Promise<void> => {
      return processContextFile(plugin, context, async (mdb, context) => {
        mdb.rows.forEach(row => {
          if (paths.includes(row.File))
            saveContextToFrontmatter(row.File, mdb.cols, row, plugin)
        })
        const newDB = removeRowsForFile(mdb, paths);
        if (!_.isEqual(mdb, newDB))
        {
          await saveDB(plugin, context, newDB);}
        return newDB;
      })
}


