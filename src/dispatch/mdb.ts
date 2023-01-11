//handles db ops

import MakeMDPlugin from "main";
import { TFile } from "obsidian";
import { DBRow, DBRows, MDBField, MDBTable } from "types/mdb";
import { eventTypes } from "types/types";
import {
  folderContextFromFolder,
  tagContextFromTag
} from "utils/contexts/contexts";
import {
  frontMatterForFile,
  frontMatterKeys,
  parseFrontMatter,
  saveContextToFile
} from "utils/contexts/fm";
import {
  consolidateRowsToTag,
  createDefaultDB,
  getMDBTable,
  newRowByDBRow,
  saveMDBToPath
} from "utils/contexts/mdb";
import { getAbstractFileAtPath, getFolderPathFromString } from "utils/file";

export const dispatchDatabaseFileChanged = (dbPath: string, tag?: string) => {
  let evt = new CustomEvent(eventTypes.mdbChange, { detail: { dbPath, tag } });
  window.dispatchEvent(evt);
};

const processFolderDB = async (
  plugin: MakeMDPlugin,
  folderPath: string,
  processor: (folder: MDBTable, path: string) => Promise<MDBTable>,
  fallback?: () => Promise<void>
): Promise<void[]> => {
  let tags: string[] = [];
  const dbPath = folderContextFromFolder(plugin, folderPath);
  const dbFileExists = getAbstractFileAtPath(app, dbPath);
  if (dbFileExists) {
    const folderDB = await getMDBTable(plugin, "files", dbPath, false);
    if (folderDB) {
      tags.push(...folderDB.schema.def.split("&"));
      const newDB = await processor(folderDB, dbPath);
      // dispatchDatabaseFileChanged(dbPath);
      const promises = tags.map((tag) => {
        const tagdbPath = tagContextFromTag(plugin, tag);
        const tagFileExists = getAbstractFileAtPath(app, tagdbPath);
        if (tagFileExists) {
          return consolidateRowsToTag(
            plugin,
            tagdbPath,
            "files",
            dbPath,
            newDB.rows
          ).then((f) => {
            // dispatchDatabaseFileChanged(tagdbPath, tag);
          });
        }
      });
      return Promise.all(promises);
    } else if (fallback) {
      await fallback();
    }
  } else if (fallback) {
    await fallback();
  }
};

const saveDB = async (
  plugin: MakeMDPlugin,
  dbPath: string,
  newTable: MDBTable
): Promise<boolean> => {
  return saveMDBToPath(plugin, dbPath, newTable);
};

const renameRow = (
  folder: MDBTable,
  filePath: string,
  toFilePath: string
): MDBTable => {
  return {
    ...folder,
    rows: folder.rows.map((f) =>
      f.File == filePath && f._source == "folder"
        ? { ...f, File: toFilePath }
        : f
    ),
  };
};

const removeRows = (folder: MDBTable, source: string): MDBTable => {
  return { ...folder, rows: folder.rows.filter((f) => f._source != source) };
};

const removeRow = (folder: MDBTable, filePath: string): MDBTable => {
  return {
    ...folder,
    rows: folder.rows.filter(
      (f) => f.File != filePath && f._source == "folder"
    ),
  };
};

const insertRow = (folder: MDBTable, row: DBRow, parent: string): MDBTable => {
  const existingRow = folder.rows.find(
    (f) => f.File == row.File || parent + "/" + f.File + ".md" == row.File
  );
  if (existingRow) {
    return {
      ...folder,
      rows: folder.rows.map((f) =>
        f.File == existingRow.File
          ? { ...f, File: row.File, _source: "folder", ...row }
          : f
      ),
    };
  }
  return { ...folder, rows: [...folder.rows, row] };
};

const insertRows = (folder: MDBTable, rows: DBRows): MDBTable => {
  const newRows = rows.filter(
    (row) =>
      row.File?.length > 0 &&
      !folder.rows.some((f) => f.File == row.File && f._source == "folder")
  );
  return { ...folder, rows: [...folder.rows, ...newRows] };
};

const rowIsEmpty = (row: DBRow): boolean =>
  Object.keys(row).filter((f) => f != "File" && row[f].length != 0).length == 0
    ? true
    : false;

const saveContextToFrontmatter = (
  file: string,
  cols: MDBField[],
  context: Record<string, any>
) => {
  const afile = getAbstractFileAtPath(app, file) as TFile;
  if (afile && afile instanceof TFile) saveContextToFile(afile, cols, context);
};

export const removeSourceFromTag = async (
  plugin: MakeMDPlugin,
  tag: string,
  source: string
) => {
  const dbPath = tagContextFromTag(plugin, tag);
  const tagFileExists = getAbstractFileAtPath(app, dbPath);
  if (tagFileExists) {
    const tagDB = await getMDBTable(plugin, "files", dbPath, true);
    const files = tagDB.rows.filter((f) => f._source == source);
    files.forEach((row) =>
      saveContextToFrontmatter(
        row["File"],
        tagDB.cols,
        tagDB.cols.reduce((p, c) => ({ ...p, [c.name]: row[c.name] }), {})
      )
    );
    await saveDB(plugin, dbPath, removeRows(tagDB, source));
  }
};

export const initiateContextIfNotExists = async (
  plugin: MakeMDPlugin,
  tag: string
): Promise<boolean> => {
  const dbPath = tagContextFromTag(plugin, tag);
  const tagFileExists = getAbstractFileAtPath(app, dbPath);
  if (tagFileExists) return false;
  return createDefaultDB(plugin, dbPath, true);
};

export const insertContextItems = async (
  plugin: MakeMDPlugin,
  newPaths: string[],
  t: string
): Promise<void> => {
  const saveNewContextRows = async (tag: MDBTable, path: string) => {
    const newRow: DBRows = newPaths.map((newPath) => ({ File: newPath }));
    await saveDB(plugin, path, insertRows(tag, newRow));
  };
  const dbPath = tagContextFromTag(plugin, t);
  const tagFileExists = getAbstractFileAtPath(app, dbPath);
  if (!tagFileExists) {
    await createDefaultDB(plugin, dbPath, true);
  }
  await getMDBTable(plugin, "files", dbPath, true).then((tagDB) =>
    saveNewContextRows(tagDB, dbPath).then((f) => {
      // dispatchDatabaseFileChanged(dbPath, t);
    })
  );
};

const fileToFM = (file: TFile, cols: string[]) => {
  const fm = frontMatterForFile(file);
  const fmKeys = frontMatterKeys(fm).filter((f) => cols.some((g) => f == g));
  return fmKeys.reduce(
    (p, c) => ({ ...p, [c]: parseFrontMatter(c, fm[c], false) }),
    {}
  );
};

export const onMetadataChange = async (
  plugin: MakeMDPlugin,
  file: TFile
): Promise<void> => {
  const folderPath = getFolderPathFromString(file.path);
  let tags: string[] = [];
  const dbPath = folderContextFromFolder(plugin, folderPath);
  const dbFileExists = getAbstractFileAtPath(app, dbPath);
  if (dbFileExists) {
    const folderDB = await getMDBTable(plugin, "files", dbPath, false);
    if (folderDB) {
      tags.push(...folderDB.schema.def.split("&"));
      const newDB = {
        ...folderDB,
        rows: folderDB.rows.map((f) =>
          f.File == file.path && f._source == "folder"
            ? {
                ...f,
                ...fileToFM(
                  file,
                  folderDB.cols.map((f) => f.name)
                ),
              }
            : f
        ),
      };
      await saveDB(plugin, dbPath, newDB);
      const promises = tags.map((tag) => {
        const tagdbPath = tagContextFromTag(plugin, tag);
        const tagFileExists = getAbstractFileAtPath(app, tagdbPath);
        if (tagFileExists) {
          return getMDBTable(plugin, "files", tagdbPath, false).then(
            (tagDB) => {
              const newDB = {
                ...tagDB,
                rows: tagDB.rows.map((f) =>
                  f.File == file.path && f._source == dbPath
                    ? {
                        ...f,
                        ...fileToFM(
                          file,
                          tagDB.cols.map((f) => f.name)
                        ),
                      }
                    : f
                ),
              };
              return saveDB(plugin, tagdbPath, newDB);
            }
          );
        }
      });
      await Promise.all(promises);
    }
  }
};

export const onFileCreated = async (
  plugin: MakeMDPlugin,
  newPath: string
): Promise<void> => {
  const newFolderPath = getFolderPathFromString(newPath);
  await processFolderDB(plugin, newFolderPath, async (folder, path) => {
    const amendedFolderDB = insertRow(
      folder,
      newRowByDBRow({ File: newPath, _source: "folder" }),
      newFolderPath
    );
    await saveDB(plugin, path, amendedFolderDB);
    return amendedFolderDB;
  });
};

export const onFileChanged = async (
  plugin: MakeMDPlugin,
  oldPath: string,
  newPath: string
): Promise<void> => {
  const oldFolderPath = getFolderPathFromString(oldPath);
  const newFolderPath = getFolderPathFromString(newPath);
  if (oldFolderPath == newFolderPath) {
    await processFolderDB(plugin, oldFolderPath, async (folder, path) => {
      const amendedFolderDB = renameRow(folder, oldPath, newPath);
      await saveDB(plugin, path, amendedFolderDB);
      return amendedFolderDB;
    });
  } else {
    await processFolderDB(
      plugin,
      oldFolderPath,
      async (folder, path) => {
        const amendedFolderDB = removeRow(folder, oldPath);
        await saveDB(plugin, path, amendedFolderDB);
        const dbPath = folderContextFromFolder(plugin, newFolderPath);
        const fromDBRow = folder.rows.find((f) => f.File == oldPath);
        const toDBFileExists = getAbstractFileAtPath(app, dbPath);
        if (toDBFileExists) {
          const toFolderDB = await getMDBTable(plugin, "files", dbPath, false);
          if (toFolderDB) {
            const [newDBCols, fmDBCols] = Object.keys(fromDBRow).reduce(
              (p, c) =>
                fromDBRow[c].length == 0
                  ? p
                  : toFolderDB.cols.find((f) => f.name == fromDBRow[c])
                  ? [[...p[0], c], p[1]]
                  : [p[0], [...p[1], c]],
              [[], []]
            );
            const newRow: DBRow = {
              ...newDBCols.reduce((p, c) => ({ ...p, [c]: fromDBRow[c] }), {}),
              File: newPath,
            };
            await saveDB(
              plugin,
              dbPath,
              insertRow(toFolderDB, newRowByDBRow(newRow), newFolderPath)
            );
            saveContextToFrontmatter(
              newPath,
              folder.cols,
              fmDBCols.reduce((p, c) => ({ ...p, [c]: fromDBRow[c] }), {})
            );
            // dispatchDatabaseFileChanged(dbPath)
          }
        } else {
          saveContextToFrontmatter(
            newPath,
            folder.cols,
            Object.keys(fromDBRow).reduce(
              (p, c) => ({ ...p, [c]: fromDBRow[c] }),
              {}
            )
          );
        }
        return amendedFolderDB;
      },
      async () => {
        const dbPath = folderContextFromFolder(plugin, newFolderPath);
        const toDBFileExists = getAbstractFileAtPath(app, dbPath);
        if (toDBFileExists) {
          const toFolderDB = await getMDBTable(plugin, "files", dbPath, false);
          // if (toFolderDB)
          // dispatchDatabaseFileChanged(dbPath)
        }
      }
    );
  }
};

export const onFileDeleted = async (
  plugin: MakeMDPlugin,
  oldPath: string
): Promise<void> => {
  const oldFolderPath = getFolderPathFromString(oldPath);
  await processFolderDB(plugin, oldFolderPath, async (folder, path) => {
    const amendedFolderDB = removeRow(folder, oldPath);
    await saveDB(plugin, path, amendedFolderDB);
    return amendedFolderDB;
  });
};

export const onFolderChanged = async (
  plugin: MakeMDPlugin,
  oldPath: string,
  newPath: string
): Promise<void> => {
  await processFolderDB(plugin, newPath, async (folder, path) => {
    const newDB = {
      ...folder,
      rows: folder.rows.map((f) =>
        getFolderPathFromString(f["File"]) == oldPath
          ? { ...f, File: f["File"].replace(oldPath, newPath) }
          : f
      ),
    };
    await saveDB(plugin, path, newDB);
    return newDB;
  });
};

export const onFolderDeleted = async (oldPath: string): Promise<void> => {};
