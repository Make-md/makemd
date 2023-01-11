import MakeMDPlugin from "main";
import { VaultItem, vaultSchema } from "schemas/spaces";
import { eventTypes, SpaceChange } from "types/types";
import {
  deleteFromDB,
  execQuery,
  insertIntoDB, updateDB
} from "utils/db/db";
import {
  getAbstractFileAtPath,
  getFolderFromPath,
  getFolderPathFromString
} from "utils/file";
import { sanitizeSQLStatement } from "utils/sanitize";

export const dispatchSpaceDatabaseFileChanged = (type: SpaceChange) => {
  let evt = new CustomEvent(eventTypes.spacesChange, {
    detail: {
      changeType: type,
    },
  });
  window.dispatchEvent(evt);
};

export const onFileCreated = async (
  plugin: MakeMDPlugin,
  newPath: string,
  folder: boolean
) => {
  const parent = getAbstractFileAtPath(app, newPath).parent?.path;
  const db = plugin.spaceDBInstance();
  insertIntoDB(db, {
    vault: {
      ...vaultSchema,
      rows: [
        {
          path: newPath,
          parent: parent,
          created: Math.trunc(Date.now() / 1000).toString(),
          folder: folder ? "true" : "false",
        } as VaultItem,
      ],
    },
  });
  plugin.saveSpacesDB();
  dispatchSpaceDatabaseFileChanged("vault");
};

export const onFileDeleted = (plugin: MakeMDPlugin, oldPath: string) => {
  const db = plugin.spaceDBInstance();
  deleteFromDB(db, "vault", `path = '${sanitizeSQLStatement(oldPath)}'`);
  deleteFromDB(db, "spaceItems", `path = '${sanitizeSQLStatement(oldPath)}'`);
  plugin.saveSpacesDB();
  dispatchSpaceDatabaseFileChanged("vault");
};

export const onFileChanged = (
  plugin: MakeMDPlugin,
  oldPath: string,
  newPath: string
) => {
  const newFolderPath = getFolderPathFromString(newPath);
  const db = plugin.spaceDBInstance();
  updateDB(
    db,
    {
      vault: {
        uniques: [],
        cols: ["path", "parent"],
        rows: [{ path: newPath, oldPath: oldPath, parent: newFolderPath }],
      },
    },
    "path",
    "oldPath"
  );
  updateDB(
    db,
    {
      spaceItems: {
        uniques: [],
        cols: ["path"],
        rows: [{ path: newPath, oldPath: oldPath }],
      },
    },
    "path",
    "oldPath"
  );
  plugin.saveSpacesDB();
  dispatchSpaceDatabaseFileChanged("vault");
};

export const onFolderChanged = (
  plugin: MakeMDPlugin,
  oldPath: string,
  newPath: string
) => {
  const newFolderPath = getFolderFromPath(app, newPath).parent.path;
  const db = plugin.spaceDBInstance();
  updateDB(
    db,
    {
      vault: {
        uniques: [],
        cols: ["path", "parent"],
        rows: [{ path: newPath, oldPath: oldPath, parent: newFolderPath }],
      },
    },
    "path",
    "oldPath"
  );
  execQuery(
    db,
    `UPDATE vault SET parent=REPLACE(parent,'${sanitizeSQLStatement(
      oldPath
    )}','${sanitizeSQLStatement(
      newPath
    )}') WHERE parent LIKE '${sanitizeSQLStatement(oldPath)}%';`
  );
  execQuery(
    db,
    `UPDATE vault SET path=REPLACE(path,'${sanitizeSQLStatement(
      oldPath
    )}','${sanitizeSQLStatement(
      newPath
    )}') WHERE path LIKE '${sanitizeSQLStatement(oldPath)}%/';`
  );
  updateDB(
    db,
    {
      spaceItems: {
        uniques: [],
        cols: ["path"],
        rows: [{ path: newPath, oldPath: oldPath }],
      },
    },
    "path",
    "oldPath"
  );
  plugin.saveSpacesDB();
  dispatchSpaceDatabaseFileChanged("vault");
};

export const onFolderDeleted = (plugin: MakeMDPlugin, oldPath: string) => {
  const db = plugin.spaceDBInstance();
  deleteFromDB(
    db,
    "vault",
    `path = '${sanitizeSQLStatement(
      oldPath
    )}' OR parent LIKE '${sanitizeSQLStatement(oldPath)}%'`
  );
  deleteFromDB(db, "spaceItems", `path = '${sanitizeSQLStatement(oldPath)}'`);
  plugin.saveSpacesDB();
  dispatchSpaceDatabaseFileChanged("vault");
};
